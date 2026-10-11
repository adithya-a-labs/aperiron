import { ApiError, AssistantStore, opaque, stamp, hash, type Job, type StoreData } from './store';
import type { ContextRef } from '../../src/shared/assistant/schemas';

export class Jobs {
  private active = 0;
  private queue: Array<{ id: string; work: (signal: AbortSignal, stage: (s: Job['stage']) => void) => Promise<unknown> }> = [];
  private controllers = new Map<string, AbortController>();
  constructor(private store: AssistantStore, private options: { concurrency?: number; queueLimit?: number; rate?: number; deadlineMs?: number } = {}) {}
  get(id: string, owner: string) {
    const r = this.store.data.jobs[id];
    if (!r || r.owner !== owner || Date.parse(r.value.expiresAt) <= Date.now()) throw new ApiError(404, 'NOT_FOUND', 'Job not found.');
    return structuredClone(r.value);
  }
  prior(owner: string, route: string, key: string, body: unknown) {
    const r = this.store.data.idempotency[`${owner}:${route}:${key}`];
    if (!r || r.expires <= Date.now()) return null;
    if (r.hash !== hash(body)) throw new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'This key was already used with a different request.');
    return structuredClone(this.store.data.jobs[r.jobId]?.value ?? null);
  }
  submit(owner: string, route: string, key: string, body: unknown, type: string, contextRef: ContextRef | null,
    work: (signal: AbortSignal, stage: (s: Job['stage']) => void) => Promise<unknown>, accept?: (data: StoreData, job: Job) => void) {
    const prior = this.prior(owner, route, key, body); if (prior) return prior;
    if (this.queue.length >= (this.options.queueLimit ?? 20)) throw new ApiError(503, 'QUEUE_FULL', 'Assistant queue is full.', true);
    const session = this.store.session(owner), times = session.submissions.filter(t => t > Date.now() - 60_000);
    if (times.length >= (this.options.rate ?? 5)) throw new ApiError(429, 'RATE_LIMITED', 'Wait before submitting more work.', true);
    const job: Job = { id: opaque('job'), type, status: 'queued', stage: 'waiting', contextRef, result: null, error: null, createdAt: stamp(), expiresAt: new Date(Date.now() + 3_600_000).toISOString() };
    // accept is synchronous; route revisions are checked immediately before this atomic reservation.
    this.store.mutate(d => {
      d.jobs[job.id] = { owner, value: job, expires: Date.now() + 86_400_000 };
      d.idempotency[`${owner}:${route}:${key}`] = { hash: hash(body), jobId: job.id, expires: Date.now() + 86_400_000 };
      d.sessions[owner].submissions = [...times, Date.now()];
      accept?.(d, job);
    });
    this.queue.push({ id: job.id, work }); queueMicrotask(() => this.drain()); return job;
  }
  private update(id: string, fn: (job: Job) => void) { this.store.mutate(d => { const r = d.jobs[id]; if (r) fn(r.value); }); }
  private finish(id: string, status: Job['status'], result: unknown, error?: unknown) {
    try {
      this.update(id, j => { if (j.status !== 'running' && j.status !== 'queued') return;
        j.status = status; j.stage = 'finished'; j.result = result;
        j.error = error ? { code: error instanceof ApiError ? error.code : 'UPSTREAM_FAILURE', message: error instanceof ApiError ? error.message : 'Assistant work could not complete.', retryable: error instanceof ApiError && error.retryable } : null;
      });
    } catch {
      // The accepted reservation is already durable. Report failure in memory
      // without publishing an unsaved result or replaying work after restart.
      const job = this.store.data.jobs[id]?.value;
      if (job && ['queued', 'running'].includes(job.status)) {
        job.status = 'failed'; job.stage = 'finished'; job.result = null;
        job.error = { code: 'SERVICE_UNAVAILABLE', message: 'Assistant storage is unavailable. No result was saved; retry explicitly after storage recovers.', retryable: true };
      }
    }
  }
  private drain() {
    while (this.active < (this.options.concurrency ?? 2) && this.queue.length) {
      const entry = this.queue.shift()!, stored = this.store.data.jobs[entry.id];
      if (!stored || stored.value.status !== 'queued') continue;
      this.active++; const controller = new AbortController(); this.controllers.set(entry.id, controller);
      try {
        this.update(entry.id, j => { j.status = 'running'; j.stage = 'collecting_context'; });
      } catch (error) {
        this.finish(entry.id, 'failed', null, error);
        this.controllers.delete(entry.id); this.active--;
        continue;
      }
      const timer = setTimeout(() => controller.abort(new ApiError(503, 'UPSTREAM_TIMEOUT', 'Job deadline exceeded.', true)), this.options.deadlineMs ?? 90_000);
      const aborted = new Promise<never>((_, reject) => controller.signal.addEventListener('abort', () => reject(controller.signal.reason), { once: true }));
      void Promise.race([entry.work(controller.signal, stage => { if (!controller.signal.aborted) this.update(entry.id, j => { j.stage = stage; }); }), aborted])
        .then(result => this.finish(entry.id, 'completed', { type: stored.value.type, data: result }))
        .catch(error => this.finish(entry.id, 'failed', null, error))
        .finally(() => { clearTimeout(timer); this.controllers.delete(entry.id); this.active--; this.drain(); })
        .catch(() => { /* A storage failure leaves the durable reservation intact; never replay. */ });
    }
  }
  cancel(id: string, owner: string, superseded = false) {
    const r = this.store.data.jobs[id]; if (!r || r.owner !== owner) throw new ApiError(404, 'NOT_FOUND', 'Job not found.');
    this.finish(id, superseded ? 'superseded' : 'cancelled', null);
    this.controllers.get(id)?.abort(new ApiError(409, 'CONTEXT_CHANGED', 'Work cancelled.'));
  }
  supersede(owner: string, tripId?: string) {
    for (const [id, r] of Object.entries(this.store.data.jobs)) if (r.owner === owner && ['queued', 'running'].includes(r.value.status)) {
      const ref = r.value.contextRef;
      if (tripId ? ref?.kind === 'group' && ref.tripId === tripId : !ref || ref.kind !== 'group') this.cancel(id, owner, true);
    }
  }
}
