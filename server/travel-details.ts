import type { IncomingMessage, ServerResponse } from 'node:http';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { getFullCatalog } from '../src/data/catalog';
import { record, type TravelResponse } from '../src/shared/travelDetails';
import { TravelCache, type TravelStorage } from './travel-cache';
import { fetchTravelDetails, TravelProviderError } from './travel-buddy';

export interface DetailRequest { passportId: string; destinationId?: string; purpose?: string; passportType?: string }
export function validateDetailRequest(value: unknown, pair = false): DetailRequest {
  const v = record(value), catalog = getFullCatalog();
  if (typeof v.passportId !== 'string' || !catalog.passports.some(c => c.id === v.passportId) ||
      (pair && typeof v.destinationId !== 'string') ||
      (v.destinationId !== undefined && !catalog.destinations.some(c => c.id === v.destinationId)) ||
      (v.purpose !== undefined && typeof v.purpose !== 'string') || (v.passportType !== undefined && typeof v.passportType !== 'string')) throw new Error('Invalid selection.');
  return { passportId: v.passportId, destinationId: v.destinationId as string | undefined,
    purpose: v.purpose as string | undefined, passportType: v.passportType as string | undefined };
}
export class TravelService {
  private pending = new Map<string, Promise<TravelResponse>>();
  private active = 0;
  private waiters: Array<() => void> = [];
  constructor(public cache: TravelStorage, private options: {
    apiKey?: string; fetchImpl?: typeof fetch; now?: () => number; freshMs?: number; reserve?: number;
    concurrency?: number; timeoutMs?: number;
  } = {}) {}
  private now() { return (this.options.now ?? Date.now)(); }
  private supported(r: DetailRequest) { return (!r.purpose || r.purpose === 'tourism') && (!r.passportType || r.passportType === 'ordinary') && r.passportId !== r.destinationId; }
  async read(r: DetailRequest): Promise<TravelResponse> {
    if (!this.supported(r)) return { entries: [], fresh: false, outcome: 'unsupported' };
    const entries = await this.cache.read(r.passportId, r.destinationId);
    const fresh = entries.length > 0 && entries.every(d => this.now() - Date.parse(d.fetchedAt) < (this.options.freshMs ?? 7 * 86_400_000));
    return { entries, fresh, outcome: entries.length ? 'cached' : 'miss' };
  }
  refresh(r: DetailRequest, force = false, onDispatch?: () => void): Promise<TravelResponse> {
    const key = `${r.passportId}:${r.destinationId}:${r.purpose ?? 'tourism'}:${r.passportType ?? 'ordinary'}`;
    const existing = this.pending.get(key); if (existing) return existing;
    const promise = this.run(r, force, onDispatch).finally(() => this.pending.delete(key));
    this.pending.set(key, promise); return promise;
  }
  private async run(r: DetailRequest, force: boolean, onDispatch?: () => void): Promise<TravelResponse> {
    const cached = await this.read(r);
    if (!this.supported(r) || !r.destinationId) return { ...cached, outcome: 'unsupported' };
    if (cached.fresh && !force) return cached;
    const apiKey = this.options.apiKey;
    if (!apiKey?.trim()) return { ...cached, outcome: 'unavailable', message: 'Showing saved information; live details are not configured.' };
    const leaseKey = `travel:${r.passportId}:${r.destinationId}`;
    const lease = this.cache.acquire ? await this.cache.acquire(leaseKey, this.options.concurrency ?? 2) : undefined;
    if (lease === null) return { ...cached, outcome: 'cooldown', retryAt: this.now() + 5000, message: 'Details refresh is already running or the provider is busy.' };
    // A released slot is transferred to a waiter without allowing new calls to jump the queue.
    if (this.active >= (this.options.concurrency ?? 2)) await new Promise<void>(resolve => this.waiters.push(resolve));
    else this.active++;
    try {
      let stop: TravelResponse['outcome'] | null = null;
      const authTag = createHash('sha256').update(apiKey).digest('hex').slice(0, 16);
      try {
        await this.cache.mutate(d => {
          const q = d.quota;
          q.initialized = true;
          if (q.blocked && q.authTag !== authTag) { q.blocked = false; q.authTag = undefined; }
          if (q.resetAt > 0 && q.resetAt <= this.now()) { q.remaining = Math.max(0, q.limit - (this.cache.acquire ? (this.options.concurrency ?? 2) : this.active)); q.resetAt = 0; }
          if (q.blocked) stop = 'unavailable';
          else if (q.retryAt > this.now()) stop = 'cooldown';
          else if (q.remaining <= (this.options.reserve ?? 20)) stop = 'quota';
          else q.remaining--;
        });
      } catch { return { ...cached, outcome: 'unavailable', message: 'Showing saved information; request accounting is unavailable.' }; }
      if (stop) {
        const q = await this.cache.quota();
        return { ...cached, outcome: stop, remaining: q.remaining, retryAt: q.retryAt, message: 'Showing saved information; live refresh is temporarily paused.' };
      }
      try {
        onDispatch?.();
        const entry = await fetchTravelDetails(r.passportId, r.destinationId, apiKey, this.options.fetchImpl, async headers => {
          await this.cache.mutate(d => {
            const remaining = headers.get('x-ratelimit-requests-remaining'), limit = headers.get('x-ratelimit-requests-limit'), reset = headers.get('x-ratelimit-requests-reset');
            if (remaining !== null && /^\d+$/.test(remaining)) d.quota.remaining = Math.min(d.quota.remaining, Math.max(0, Number(remaining) - (this.active - 1)));
            if (limit !== null && /^\d+$/.test(limit) && Number(limit) > 0) d.quota.limit = Number(limit);
            if (reset !== null && /^\d+$/.test(reset)) d.quota.resetAt = this.now() + Number(reset) * 1000;
          });
        }, this.options.timeoutMs);
        const saved = await this.cache.remember(entry);
        return { entries: await this.cache.read(r.passportId, r.destinationId), fresh: true, outcome: 'updated', remaining: (await this.cache.quota()).remaining,
          ...(!saved ? { message: 'Updated for this session; saving to disk was unavailable.' } : {}) };
      } catch (error) {
        const kind = error instanceof TravelProviderError ? error.kind : 'unavailable';
        const retryAt = Math.max(this.now() + 5 * 60_000, error instanceof TravelProviderError ? error.retryAt : 0);
        await this.cache.mutate(d => {
          d.quota.retryAt = retryAt;
          if (kind === 'auth') { d.quota.blocked = true; d.quota.authTag = authTag; }
          if (kind === 'quota') d.quota.remaining = 0;
        }).catch(() => {});
        return { ...cached, outcome: kind === 'quota' ? 'quota' : 'unavailable', retryAt,
          message: 'Showing saved information; live details could not refresh.' };
      }
    } finally {
      const next = this.waiters.shift(); if (next) next(); else this.active--;
      if (lease) await this.cache.release?.(leaseKey, lease).catch(() => {});
    }
  }
}

function positive(value: string | undefined, fallback: number, minimum = 0) {
  const n = Number(value); return value !== undefined && Number.isFinite(n) && n >= minimum ? n : fallback;
}
export function createDefaultTravelService() {
  return new TravelService(new TravelCache(process.env.TRAVEL_BUDDY_CACHE_DIR ?? fileURLToPath(new URL('../.cache/travel-buddy', import.meta.url)),
    positive(process.env.TRAVEL_BUDDY_INITIAL_REMAINING, 0), positive(process.env.TRAVEL_BUDDY_RETENTION_DAYS, 30, 1) * 86_400_000), {
    apiKey: process.env.TRAVEL_BUDDY_API_KEY || process.env.RAPIDAPI_KEY,
    freshMs: positive(process.env.TRAVEL_BUDDY_REFRESH_DAYS, 7) * 86_400_000,
    reserve: positive(process.env.TRAVEL_BUDDY_QUOTA_RESERVE, 20),
    concurrency: Math.max(1, Math.floor(positive(process.env.TRAVEL_BUDDY_CONCURRENCY, 2, 1))),
  });
}
export function createTravelHandler(service: TravelService) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    const send = (status: number, value: unknown) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); };
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      if (req.method === 'GET' && url.pathname === '/api/travel-details') {
        send(200, await service.read(validateDetailRequest(Object.fromEntries(url.searchParams)))); return;
      }
      if (req.method === 'POST' && url.pathname === '/api/travel-details/refresh') {
        // Local UI only: reject cross-origin browser requests that could consume quota.
        const origin = req.headers.origin;
        if (origin && new URL(origin).host !== req.headers.host) { send(403, { error: 'Origin not allowed.' }); return; }
        let body = ''; for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 4096) throw new Error(); }
        const v = record(JSON.parse(body));
        send(200, await service.refresh(validateDetailRequest(v, true), v.force === true)); return;
      }
      send(404, { error: 'Not found.' });
    } catch { send(400, { error: 'Invalid travel-details request.' }); }
  };
}
