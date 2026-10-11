import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { isTravelDetails, travelKey, type TravelDetails } from '../src/shared/travelDetails';

export interface QuotaState { remaining: number; limit: number; resetAt: number; blocked: boolean; retryAt: number; authTag?: string; initialized?: boolean }
export interface DiskCache { version: 1; entries: Record<string, TravelDetails>; quota: QuotaState }
export interface TravelStorage {
  read(passport: string, destination?: string): Promise<TravelDetails[]>;
  quota(): Promise<QuotaState>;
  mutate(update: (next: DiskCache) => void): Promise<void>;
  put(entry: TravelDetails): Promise<void>;
  remember(entry: TravelDetails): Promise<boolean>;
  acquire?(key: string, limit: number): Promise<string | null>;
  release?(key: string, token: string): Promise<void>;
  inFlight?(): Promise<number>;
}
export class TravelCache {
  private data: DiskCache;
  private ready: Promise<void>;
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private directory: string, initialRemaining = 0, private retentionMs = 30 * 86_400_000, private now = Date.now) {
    this.data = { version: 1, entries: {}, quota: { remaining: initialRemaining, limit: 120, resetAt: 0, blocked: false, retryAt: 0, initialized: initialRemaining > 0 } };
    this.ready = this.load();
  }
  private async load() {
    try {
      const v = JSON.parse(await readFile(join(this.directory, 'cache.json'), 'utf8'));
      if (v.version !== 1 || !v.entries || !v.quota || !Number.isInteger(v.quota.remaining) || v.quota.remaining < 0 ||
        !Number.isInteger(v.quota.limit) || v.quota.limit < 1 || v.quota.remaining > v.quota.limit ||
        !Number.isFinite(v.quota.resetAt) || !Number.isFinite(v.quota.retryAt) || typeof v.quota.blocked !== 'boolean') throw new Error();
      this.data.quota = v.quota;
      for (const entry of Object.values(v.entries)) {
        if (isTravelDetails(entry) && this.retained(entry)) this.data.entries[travelKey(entry.passportId, entry.destinationId)] = entry;
      }
      if (Object.keys(v.entries).length !== Object.keys(this.data.entries).length) await this.save(this.data);
    } catch (e) {
      // Unknown/corrupt quota must never silently reopen the subscription allowance.
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') { this.data.quota.remaining = 0; this.data.quota.initialized = true; }
    }
  }
  private retained(entry: TravelDetails) { const age = this.now() - Date.parse(entry.fetchedAt); return age >= -60_000 && age < this.retentionMs; }
  private async save(data: DiskCache) {
    await mkdir(this.directory, { recursive: true });
    const target = join(this.directory, 'cache.json'), temporary = join(this.directory, `${randomUUID()}.tmp`);
    await writeFile(temporary, JSON.stringify(data), { mode: 0o600 });
    await rename(temporary, target);
  }
  async read(passport: string, destination?: string) {
    await this.ready;
    if (Object.values(this.data.entries).some(d => !this.retained(d))) await this.mutate(() => {}).catch(() => {});
    return structuredClone(Object.values(this.data.entries).filter(d => this.retained(d) && d.passportId === passport && (!destination || d.destinationId === destination))
      .map(d => ({ ...d, expiresAt: new Date(Date.parse(d.fetchedAt) + this.retentionMs).toISOString() })));
  }
  async quota() { await this.ready; return structuredClone(this.data.quota); }
  async mutate(update: (next: DiskCache) => void) {
    const task = this.queue.then(async () => {
      await this.ready; const next = structuredClone(this.data);
      for (const [key, entry] of Object.entries(next.entries)) if (!this.retained(entry)) delete next.entries[key];
      update(next);
      await this.save(next);
      this.data = next;
    });
    this.queue = task.catch(() => {}); return task;
  }
  async put(entry: TravelDetails) {
    if (!isTravelDetails(entry)) throw new Error('Invalid cache entry.');
    await this.mutate(d => { d.entries[travelKey(entry.passportId, entry.destinationId)] = entry; });
  }
  // Runtime result remains usable if persisting a successful refresh fails.
  async remember(entry: TravelDetails) {
    try { await this.put(entry); return true; }
    catch { this.data.entries[travelKey(entry.passportId, entry.destinationId)] = entry; return false; }
  }
}
