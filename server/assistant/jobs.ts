import { ApiError, AssistantStore, opaque, stamp, hash, type AssistantStorage, type Job, type StoreData } from './store';
import type { ContextRef } from '../../src/shared/assistant/schemas';

export type JobWork = (signal: AbortSignal, stage: (s: Job['stage']) => Promise<void>) => Promise<unknown>;
export interface JobOptions { concurrency?: number; queueLimit?: number; rate?: number; deadlineMs?: number; durable?: boolean }
export class Jobs {
  private active = 0;
  private queue: Array<{ id: string; work: JobWork }> = [];
  private controllers = new Map<string, AbortController>();
  constructor(public store: AssistantStorage, public options: JobOptions = {}) {}
  async get(id: string, owner: string) {
    const data = await this.store.read(), r = data.jobs[id];
    if (!r || r.owner !== owner || Date.parse(r.value.expiresAt) <= Date.now()) throw new ApiError(404, 'NOT_FOUND', 'Job not found.');
    const input = data.inputs?.[id];
    if (r.value.status === 'running' && input?.startedAt && Date.now() > input.startedAt + input.deadlineMs) {
      await this.finish(id,'failed',null,new ApiError(503,'UPSTREAM_TIMEOUT','Job deadline exceeded. Retry explicitly.',true));
      return (await this.store.read()).jobs[id].value;
    }
    return structuredClone(r.value);
  }
  async prior(owner: string, route: string, key: string, body: unknown) {
    const data = await this.store.read(), r = data.idempotency[`${owner}:${route}:${key}`];
    if (!r || r.expires <= Date.now()) return null;
    if (r.hash !== hash(body)) throw new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'This key was already used with different content.');
    return structuredClone(data.jobs[r.jobId]?.value ?? null);
  }
  async submit(owner: string, route: string, key: string, body: unknown, type: string, contextRef: ContextRef | null,
    work: JobWork, accept?: (data: StoreData, job: Job) => void) {
    const prior = await this.prior(owner, route, key, body); if (prior) return prior;
    const job: Job = { id: opaque('job'), type, status: 'queued', stage: 'waiting', contextRef, result: null, error: null,
      createdAt: stamp(), expiresAt: new Date(Date.now() + 3_600_000).toISOString() };
    const sharedQueued = await this.store.queuedCount?.();
    await this.store.mutate(d => {
      const queued = sharedQueued ?? Object.values(d.jobs).filter(r => r.value.status === 'queued').length;
      if (queued >= (this.options.queueLimit ?? 20)) throw new ApiError(503, 'QUEUE_FULL', 'Assistant queue is full.', true);
      const session = d.sessions[owner];
      if (!session || Date.parse(session.expiresAt) <= Date.now()) throw new ApiError(401, 'SESSION_REQUIRED', 'Start an assistant session.');
      const times = session.submissions.filter(t => t > Date.now() - 60_000);
      if (times.length >= (this.options.rate ?? 5)) throw new ApiError(429, 'RATE_LIMITED', 'Wait before submitting more work.', true);
      d.jobs[job.id] = { owner, value: job, expires: Date.now() + 86_400_000 };
      d.idempotency[`${owner}:${route}:${key}`] = { hash: hash(body), jobId: job.id, expires: Date.now() + 86_400_000 };
      (d.inputs ??= {})[job.id] = { route, body, owner, deadlineMs: this.options.deadlineMs ?? 90_000 };
      session.submissions = [...times, Date.now()]; accept?.(d, job);
    });
    if (!this.options.durable) {
      this.queue.push({ id: job.id, work }); queueMicrotask(() => { void this.drain().catch(() => {}); });
    }
    return job;
  }
  async finish(id: string, status: Job['status'], result: unknown, error?: unknown) {
    try { await this.store.mutate(d => {
      const j = d.jobs[id]?.value;
      if (!j || !['queued', 'running'].includes(j.status)) return;
      j.status = status; j.stage = 'finished'; j.result = result;
      j.error = error ? { code: error instanceof ApiError ? error.code : 'UPSTREAM_FAILURE',
        message: error instanceof ApiError ? error.message : 'Assistant work could not complete.', retryable: error instanceof ApiError && error.retryable } : null;
    }); } catch (failure) {
      // Local file mode may report a failure in memory; production never publishes unsaved results.
      if (!(this.store instanceof AssistantStore)) throw failure;
      const j=this.store.data.jobs[id]?.value;
      if(j && ['queued','running'].includes(j.status)) {
        j.status='failed';j.stage='finished';j.result=null;
        j.error={code:'SERVICE_UNAVAILABLE',message:'Assistant storage is unavailable. Retry explicitly after recovery.',retryable:true};
      }
    }
  }
  async execute(id: string, work: JobWork) {
    let claimed: boolean;
    try { claimed = await this.store.mutate(d => {
      const j = d.jobs[id]?.value;
      if (!j || j.status !== 'queued') return false;
      j.status = 'running'; j.stage = 'collecting_context';
      if (d.inputs?.[id]) d.inputs[id].startedAt = Date.now(); return true;
    }); } catch(error) {await this.finish(id,'failed',null,error);return;}
    if (!claimed) return;
    const controller = new AbortController(); this.controllers.set(id, controller);
    const timer = setTimeout(() => controller.abort(new ApiError(503, 'UPSTREAM_TIMEOUT', 'Job deadline exceeded.', true)), this.options.deadlineMs ?? 90_000);
    const aborted = new Promise<never>((_, reject) => controller.signal.addEventListener('abort', () => reject(controller.signal.reason), { once: true }));
    try {
      const result = await Promise.race([work(controller.signal, async stage => {
        controller.signal.throwIfAborted();
        await this.store.mutate(d => {
          const j = d.jobs[id]?.value;
          if (!j || j.status !== 'running') throw new ApiError(409, 'CONTEXT_CHANGED', 'Work cancelled.');
          j.stage = stage;
        });
      }), aborted]);
      controller.signal.throwIfAborted();
      const type = (await this.store.read()).jobs[id]?.value.type;
      await this.finish(id, 'completed', { type, data: result });
    } catch (error) { await this.finish(id, 'failed', null, error); }
    finally { clearTimeout(timer); this.controllers.delete(id); }
  }
  private async drain() {
    while (this.active < (this.options.concurrency ?? 2) && this.queue.length) {
      const entry = this.queue.shift()!; this.active++;
      void this.execute(entry.id, entry.work).catch(() => {}).finally(() => { this.active--; void this.drain().catch(() => {}); });
    }
  }
  async cancel(id: string, owner: string, superseded = false) {
    const r = (await this.store.read()).jobs[id];
    if (!r || r.owner !== owner) throw new ApiError(404, 'NOT_FOUND', 'Job not found.');
    await this.finish(id, superseded ? 'superseded' : 'cancelled', null);
    this.controllers.get(id)?.abort(new ApiError(409, 'CONTEXT_CHANGED', 'Work cancelled.'));
  }
  async supersede(owner: string, tripId?: string) {
    for (const [id, r] of Object.entries((await this.store.read()).jobs)) if (r.owner === owner && ['queued', 'running'].includes(r.value.status)) {
      const ref = r.value.contextRef;
      if (tripId ? ref?.kind === 'group' && ref.tripId === tripId : !ref || ref.kind !== 'group') await this.cancel(id, owner, true);
    }
  }
}
