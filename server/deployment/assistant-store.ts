import { AsyncLocalStorage } from 'node:async_hooks';
import { ApiError, empty, opaque, type AssistantStorage, type StoreData, type Session } from '../assistant/store';
import { locked, type Database, type Connection } from './database';

type RecordRow = { scope: string; kind: string; id: string; data: unknown; expires_at: string | null };
type Context = { connection: Connection; data: StoreData };
const kinds = ['sessions', 'resources', 'jobs', 'idempotency', 'budgets', 'inputs'] as const;
export class PostgresAssistantStore implements AssistantStorage {
  private transaction = new AsyncLocalStorage<Context>();
  private guard = new AsyncLocalStorage<string>();
  constructor(public database: Database, public owner: string = opaque('session')) {}
  newSessionId() { return this.owner; }
  private check(data: StoreData) {
    const id = this.guard.getStore(); if (!id) return;
    const job = data.jobs[id]?.value, input = data.inputs?.[id];
    if (!job || job.status !== 'running' || !input || Date.parse(job.expiresAt) <= Date.now()) throw new ApiError(409, 'CONTEXT_CHANGED', 'Work is no longer active.');
    const session = data.sessions[this.owner];
    if (!session || Date.parse(session.expiresAt) <= Date.now()) throw new ApiError(401, 'SESSION_REQUIRED', 'Session expired.');
    const ref = job.contextRef;
    if (ref?.kind === 'group') {
      const trip = data.resources[ref.tripId]?.value as { revision?: number } | undefined;
      if (trip?.revision !== ref.tripRevision) throw new ApiError(409, 'CONTEXT_CHANGED', 'Trip changed.');
    } else if (ref && session.profile.revision !== ref.profileRevision) throw new ApiError(409, 'CONTEXT_CHANGED', 'Profile changed.');
  }
  async withJob<T>(id: string, work: () => Promise<T>) { return this.guard.run(id, work); }
  private async load(c: Connection) {
    const rows = await c.query<RecordRow>('SELECT scope,kind,id,data,expires_at FROM aperiron_records WHERE scope = $1 OR scope = $2', [this.owner, 'provider']);
    const data = empty();
    for (const row of rows) {
      if (row.kind === 'meta') {
        if(typeof row.data!=='number' || !Number.isFinite(row.data) || row.data<0) throw new Error('Provider accounting needs recovery.');
        data.providerCooldownUntil = row.data;
      }
      else if (kinds.includes(row.kind as typeof kinds[number])) {
        const target = data[row.kind as typeof kinds[number]] as Record<string, unknown>;
        if(row.kind==='budgets') {
          const budget=row.data as Record<string,unknown>;
          if(!budget || ['tokens','searches','calls','actualTokens'].some(key=>!Number.isSafeInteger(budget[key]) || Number(budget[key])<0)) throw new Error('Provider accounting needs recovery.');
        }
        target[row.id] = row.data;
      }
    }
    this.check(data); return data;
  }
  async read() {
    const data = this.transaction.getStore()?.data ?? await this.load(this.database);
    this.check(data); return structuredClone(data);
  }
  async queuedCount() {
    const c=this.transaction.getStore()?.connection ?? this.database;
    const rows=await c.query<{count:string}>("SELECT count(*)::text AS count FROM aperiron_records WHERE kind='jobs' AND data->'value'->>'status'='queued' AND expires_at>now()");
    return Number(rows[0].count);
  }
  private flatten(data: StoreData) {
    const rows = new Map<string, { scope: string; kind: string; id: string; data: unknown; expiry: string | null }>();
    for (const kind of kinds) for (const [id, value] of Object.entries(data[kind] ?? {})) {
      const scope = kind === 'budgets' ? 'provider' : this.owner;
      let expiry: string | null = null;
      if (kind === 'sessions') expiry = (value as Session).expiresAt;
      else if (kind === 'resources' || kind === 'jobs' || kind === 'idempotency') expiry = new Date((value as { expires: number }).expires).toISOString();
      else if (kind === 'inputs') expiry = data.jobs[id] ? new Date(data.jobs[id].expires).toISOString() : new Date().toISOString();
      else if (kind === 'budgets') expiry = new Date(Date.parse(id) + 8 * 86_400_000).toISOString();
      rows.set(`${scope}:${kind}:${id}`, { scope, kind, id, data: value, expiry });
    }
    rows.set('provider:meta:cooldown', { scope: 'provider', kind: 'meta', id: 'cooldown', data: data.providerCooldownUntil, expiry: null });
    return rows;
  }
  async atomic<T>(work: () => Promise<T>): Promise<T> {
    if (this.transaction.getStore()) return work();
    return locked(this.database, 'assistant', async connection => {
      const data = await this.load(connection), before = this.flatten(data);
      const result = await this.transaction.run({ connection, data }, work);
      const after = this.flatten(this.transaction.getStore()?.data ?? data);
      // mutate replaces fields on the transaction object without replacing its identity.
      for (const [key, row] of before) if (!after.has(key)) {
        await connection.query('DELETE FROM aperiron_records WHERE scope=$1 AND kind=$2 AND id=$3', [row.scope,row.kind,row.id]);
        if(row.kind==='inputs') await connection.query('DELETE FROM aperiron_dispatch WHERE job_id=$1 AND owner=$2',[row.id,this.owner]);
      }
      for (const [key, row] of after) if (JSON.stringify(before.get(key)) !== JSON.stringify(row)) {
        await connection.query('INSERT INTO aperiron_records(scope,kind,id,data,expires_at) VALUES ($1,$2,$3,$4::text::jsonb,$5) ON CONFLICT(scope,kind,id) DO UPDATE SET data=excluded.data, expires_at=excluded.expires_at', [row.scope,row.kind,row.id,JSON.stringify(row.data),row.expiry]);
        if (row.kind === 'inputs' && !before.has(key)) await connection.query('INSERT INTO aperiron_dispatch(job_id,owner) VALUES ($1,$2) ON CONFLICT DO NOTHING', [row.id,this.owner]);
      }
      return result;
    });
  }
  async mutate<T>(update: (data: StoreData) => T): Promise<T> {
    return this.atomic(async () => {
      const context = this.transaction.getStore()!; this.check(context.data);
      const next = structuredClone(context.data), result = update(next);
      Object.assign(context.data, next); return structuredClone(result);
    });
  }
  async session(id: string | undefined) {
    const s = id ? (await this.read()).sessions[id] : undefined;
    if (!s || id !== this.owner || Date.parse(s.expiresAt) <= Date.now()) throw new ApiError(401, 'SESSION_REQUIRED', 'Start an assistant session.');
    return s;
  }
  async get<T>(id: string, owner: string): Promise<T> {
    await this.session(owner); const r = (await this.read()).resources[id];
    if (!r || r.owner !== owner || r.expires <= Date.now()) throw new ApiError(404, 'NOT_FOUND', 'Resource not found.');
    return structuredClone(r.value) as T;
  }
  async put<T>(id: string, owner: string, value: T) {
    const session = await this.session(owner);
    await this.mutate(d => {
      if(!d.sessions[owner] || Date.parse(d.sessions[owner].expiresAt)<=Date.now()) throw new ApiError(401,'SESSION_REQUIRED','Session expired.');
      d.resources[id] = { owner, value, expires: Date.parse(session.expiresAt) };
    }); return value;
  }
  async remove(id: string, owner: string) { await this.get(id, owner); await this.mutate(d => { delete d.resources[id]; }); }
  async purge() {
    await this.mutate(d => {
      const now = Date.now();
      for (const [id,s] of Object.entries(d.sessions)) if (Date.parse(s.expiresAt) <= now) delete d.sessions[id];
      for (const [id,r] of Object.entries(d.resources)) if (r.expires <= now || !d.sessions[r.owner]) delete d.resources[id];
      for (const [id,r] of Object.entries(d.jobs)) {
        if (r.expires <= now || !d.sessions[r.owner]) { delete d.jobs[id]; delete d.inputs?.[id]; }
        else if (Date.parse(r.value.expiresAt) <= now) { r.value.status='failed'; r.value.stage='finished'; r.value.result=null; r.value.error={code:'JOB_EXPIRED',message:'Job payload expired.',retryable:false}; }
      }
      for (const [key,r] of Object.entries(d.idempotency)) if (r.expires <= now || !d.jobs[r.jobId]) delete d.idempotency[key];
    });
  }
}
