import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync, unlinkSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import type { ContextRef, Profile, Trip } from '../../src/shared/assistant/schemas';
import { profile as profileSchema } from '../../src/shared/assistant/schemas';

export const stamp = () => new Date().toISOString();
export const opaque = (prefix: string) => `${prefix}_${randomUUID().replaceAll('-', '')}`;
export function hash(value: unknown): string {
  const canonical = (v: unknown): unknown => Array.isArray(v) ? v.map(canonical) : v && typeof v === 'object'
    ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)).map(([k, x]) => [k, canonical(x)])) : v;
  return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
}
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public retryable = false) { super(message); }
}
export interface Owned<T = unknown> { owner: string; value: T; expires: number }
export interface ProfileResource { revision: number; profile: Profile | null; updatedAt: string | null }
export interface Session { sessionId: string; csrfToken: string; expiresAt: string; profile: ProfileResource; submissions: number[] }
export interface TripResource { id: string; revision: number; trip: Trip; createdAt: string; updatedAt: string }
export interface Conversation { id: string; revision: number; contextRef: ContextRef; contextHash: string; messageIds: string[]; activeJobId: string | null; createdAt: string }
export interface Job {
  id: string; type: string; status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'superseded';
  stage: 'waiting' | 'collecting_context' | 'refreshing_details' | 'researching' | 'generating' | 'validating' | 'finished';
  contextRef: ContextRef | null; result: unknown; error: { code: string; message: string; retryable: boolean } | null;
  createdAt: string; expiresAt: string;
}
interface Idempotency { hash: string; jobId: string; expires: number }
export interface StoreData {
  version: 1; sessions: Record<string, Session>; resources: Record<string, Owned>;
  jobs: Record<string, Owned<Job>>; idempotency: Record<string, Idempotency>;
  budgets: Record<string, { tokens: number; searches: number; calls: number; actualTokens: number }>;
  providerCooldownUntil: number;
}
const empty = (): StoreData => ({ version: 1, sessions: {}, resources: {}, jobs: {}, idempotency: {}, budgets: {}, providerCooldownUntil: 0 });
/** One process per directory. Mutations are synchronous and atomically persisted before dispatch. */
export class AssistantStore {
  data: StoreData;
  constructor(public path: string | null) {
    this.data = empty();
    if (path && existsSync(path)) {
      try {
        const parsed = JSON.parse(readFileSync(path, 'utf8')) as StoreData;
        if (parsed.version !== 1 || !parsed.sessions || !parsed.resources || !parsed.jobs || !parsed.idempotency || !parsed.budgets) throw new Error();
        parsed.providerCooldownUntil ??= 0;
        if (!Number.isFinite(parsed.providerCooldownUntil) || parsed.providerCooldownUntil < 0) throw new Error();
        for (const b of Object.values(parsed.budgets)) if (!b || [b.tokens, b.searches, b.calls, b.actualTokens].some(n => !Number.isSafeInteger(n) || n < 0)) throw new Error();
        for (const [id, s] of Object.entries(parsed.sessions)) {
          if (s.sessionId !== id || !s.csrfToken || !Number.isFinite(Date.parse(s.expiresAt)) || !Number.isSafeInteger(s.profile.revision) || s.profile.revision < 0 || !Array.isArray(s.submissions)) throw new Error();
          if (s.profile.profile !== null) profileSchema.parse(s.profile.profile);
        }
        for (const r of [...Object.values(parsed.resources), ...Object.values(parsed.jobs)]) if (!r || typeof r.owner !== 'string' || !Number.isFinite(r.expires)) throw new Error();
        this.data = parsed;
      } catch { throw new ApiError(503, 'SERVICE_UNAVAILABLE', 'Assistant storage needs recovery; no requests were dispatched.'); }
      this.mutate(d => {
        for (const item of Object.values(d.jobs)) if (['queued', 'running'].includes(item.value.status)) {
          item.value.status = 'failed'; item.value.stage = 'finished'; item.value.error = { code: 'INTERRUPTED', message: 'Server restarted. Submit a new attempt explicitly.', retryable: true };
        }
      });
    }
  }
  mutate<T>(fn: (data: StoreData) => T): T {
    const next = structuredClone(this.data), result = fn(next);
    try {
      if (this.path) { mkdirSync(dirname(this.path), { recursive: true }); const temporary = `${this.path}.${randomUUID()}.tmp`;
        try {
          writeFileSync(temporary, JSON.stringify(next), { mode: 0o600 });
          for (let attempt = 0; ; attempt++) {
            try { renameSync(temporary, this.path); break; }
            catch (error) {
              // Windows scanners/readers can briefly hold the destination open.
              // Retry only the atomic local rename, never a provider operation.
              if (process.platform !== 'win32' || attempt >= 2 || !['EACCES', 'EPERM', 'EBUSY'].includes((error as NodeJS.ErrnoException).code ?? '')) throw error;
              Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
            }
          }
        } finally {
          try { if (existsSync(temporary)) unlinkSync(temporary); } catch { /* Keep the previous durable ledger intact. */ }
        }
      }
    } catch { throw new ApiError(503, 'SERVICE_UNAVAILABLE', 'Assistant storage is unavailable.'); }
    this.data = next; return structuredClone(result);
  }
  session(id: string | undefined) {
    const s = id ? this.data.sessions[id] : undefined;
    if (!s || Date.parse(s.expiresAt) <= Date.now()) throw new ApiError(401, 'SESSION_REQUIRED', 'Start a local assistant session.');
    return structuredClone(s);
  }
  get<T>(id: string, owner: string): T {
    const r = this.data.resources[id];
    if (!r || r.owner !== owner || r.expires <= Date.now()) throw new ApiError(404, 'NOT_FOUND', 'Resource not found.');
    return structuredClone(r.value) as T;
  }
  put<T>(id: string, owner: string, value: T) {
    this.mutate(d => { d.resources[id] = { owner, value, expires: Date.parse(this.session(owner).expiresAt) }; }); return value;
  }
  remove(id: string, owner: string) { this.get(id, owner); this.mutate(d => { delete d.resources[id]; }); }
  purge() {
    const now = Date.now();
    this.mutate(d => {
      for (const [id, s] of Object.entries(d.sessions)) if (Date.parse(s.expiresAt) <= now) delete d.sessions[id];
      for (const [id, r] of Object.entries(d.resources)) if (r.expires <= now || !d.sessions[r.owner]) delete d.resources[id];
      for (const [id, r] of Object.entries(d.jobs)) {
        if (r.expires <= now || !d.sessions[r.owner]) delete d.jobs[id];
        else if (Date.parse(r.value.expiresAt) <= now) {
          r.value.result = null; r.value.status = 'failed'; r.value.stage = 'finished';
          r.value.error = { code: 'JOB_EXPIRED', message: 'Job payload expired; the request reservation is retained.', retryable: false };
        }
      }
      for (const [key, r] of Object.entries(d.idempotency)) if (r.expires <= now || !d.jobs[r.jobId]) delete d.idempotency[key];
    });
  }
}
