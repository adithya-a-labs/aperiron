import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { PostgresAssistantStore } from './deployment/assistant-store';
import { PostgresTravelCache } from './deployment/travel-cache';
import type { Database, Connection } from './deployment/database';
import { Jobs } from './assistant/jobs';
import { ApiError } from './assistant/store';
import { acquireLease, releaseLease } from './deployment/leases';
import { resolveWork } from './deployment/worker';
import { createAssistantHandler } from './assistant/routes';
import { TravelCache } from './travel-cache';
import { TravelService } from './travel-details';
import { exampleProfile } from '../src/shared/assistant/fixtures';
import type { TestContext } from 'node:test';

async function fixture(t:TestContext) {
  const pg=new PGlite();t.after(()=>pg.close());
  await pg.exec(await readFile(new URL('./deployment/schema.sql',import.meta.url),'utf8'));
  const connection=(c:Pick<PGlite,'query'>):Connection=>({query:async<T>(sql:string,params:unknown[]=[])=> (await c.query<T>(sql,params)).rows});
  const db:Database={...connection(pg),transaction:work=>pg.transaction(tx=>work(connection(tx as unknown as PGlite)))};
  const a=new PostgresAssistantStore(db,'session_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  await a.mutate(d=>{d.sessions[a.owner]={sessionId:a.owner,csrfToken:'synthetic',expiresAt:new Date(Date.now()+3600000).toISOString(),profile:{revision:1,profile:exampleProfile,updatedAt:null},submissions:[]};});
  return {db,a,b:new PostgresAssistantStore(db,a.owner)};
}
test('Postgres instances share owned resources; transactions rollback and serialize revision checks',async t=>{
  const {a,b,db}=await fixture(t);
  await a.put('trip_fixture',a.owner,{revision:1,name:'before'});
  assert.equal((await b.get<{revision:number}>('trip_fixture',b.owner)).revision,1);
  const update=(store:PostgresAssistantStore)=>store.atomic(async()=>{
    const trip=await store.get<{revision:number}>('trip_fixture',store.owner);
    if(trip.revision!==1) throw new ApiError(409,'REVISION_CONFLICT','Stale revision');
    await store.put('trip_fixture',store.owner,{revision:2});
  });
  const result=await Promise.allSettled([update(a),update(b)]);
  assert.equal(result.filter(r=>r.status==='fulfilled').length,1);
  await assert.rejects(a.atomic(async()=>{await a.put('trip_fixture',a.owner,{revision:3});throw new Error('rollback');}));
  assert.equal((await b.get<{revision:number}>('trip_fixture',b.owner)).revision,2);
  await assert.rejects(new PostgresAssistantStore(db,'session_other').get('trip_fixture','session_other'));
});
test('durable reservations survive a new instance; worker cancellation prevents late writes and duplicate dispatch',async t=>{
  const {a,b,db}=await fixture(t), jobs=new Jobs(a,{durable:true});
  let dispatched=0;
  const job=await a.atomic(()=>jobs.submit(a.owner,'/api/v1/assistant/checklists','synthetic_key',{contextRef:{kind:'country',profileRevision:1,destinationId:'JP'},destinationIds:['JP']},'checklist',{kind:'country',profileRevision:1,destinationId:'JP'},async()=>{dispatched++;}));
  assert.equal(dispatched,0);
  assert.equal((await db.query<{job_id:string}>('SELECT job_id FROM aperiron_dispatch'))[0].job_id,job.id);
  const second=new Jobs(b,{durable:true});
  assert.equal((await second.prior(a.owner,'/api/v1/assistant/checklists','synthetic_key',{contextRef:{kind:'country',profileRevision:1,destinationId:'JP'},destinationIds:['JP']}))?.id,job.id);
  let resume!:()=>void,started!:()=>void;
  const ready=new Promise<void>(r=>{started=r;}),wait=new Promise<void>(r=>{resume=r;});
  const run=jobs.execute(job.id,()=>a.withJob(job.id,async()=>{dispatched++;started();await wait;await a.put('msg_late',a.owner,{text:'must not publish'});}));
  await ready;await second.cancel(job.id,b.owner);resume();await run;
  assert.equal((await second.get(job.id,b.owner)).status,'cancelled');
  await assert.rejects(b.get('msg_late',b.owner));
  await second.execute(job.id,async()=>{dispatched++;});assert.equal(dispatched,1);
});
test('provider budgets and refresh leases are shared; quota initialization never repeats on cold starts',async t=>{
  const {a,b,db}=await fixture(t);
  const reserve=(s:PostgresAssistantStore)=>s.mutate(d=>{const q=d.budgets['2026-10-11'] ??= {tokens:0,searches:0,calls:0,actualTokens:0};if(q.calls>=1)throw new ApiError(429,'BUDGET_EXHAUSTED','Allowance spent');q.calls++;});
  const settled=await Promise.allSettled([reserve(a),reserve(b)]);assert.equal(settled.filter(r=>r.status==='fulfilled').length,1);
  const first=new PostgresTravelCache(db),second=new PostgresTravelCache(db);
  assert.equal((await first.quota()).remaining,0);
  await first.mutate(d=>{d.quota.remaining=21;});
  await second.mutate(d=>{if(d.quota.remaining<=20)throw new Error('reserve');d.quota.remaining--;});
  assert.equal((await new PostgresTravelCache(db).quota()).remaining,20);
  const token=await first.acquire('travel:IN:JP',2);assert(token);
  assert.equal(await second.acquire('travel:IN:JP',2),null);
  await first.release('travel:IN:JP',token);assert(await second.acquire('travel:IN:JP',2));
  const lease=await acquireLease(db,'assistant:one','assistant:',1,10000);assert(lease);
  assert.equal(await acquireLease(db,'assistant:two','assistant:',1,10000),null);
  await releaseLease(db,'assistant:one',lease);assert(await acquireLease(db,'assistant:two','assistant:',1,10000));
  await db.query("UPDATE aperiron_records SET data='{}'::jsonb WHERE scope='travel' AND kind='quota'");
  await assert.rejects(second.quota(),/accounting needs recovery/);
  await db.query("UPDATE aperiron_records SET data='{}'::jsonb WHERE scope='provider' AND kind='budgets'");
  await assert.rejects(b.read(),/accounting needs recovery/);
});
test('serialized checklist input can execute against a fresh process runtime without providers',async t=>{
  const {a,b}=await fixture(t),jobs=new Jobs(a,{durable:true});
  const body={contextRef:{kind:'country',profileRevision:1,destinationId:'JP'},destinationIds:['JP']};
  const job=await jobs.submit(a.owner,'/api/v1/assistant/checklists','key',body,'checklist',body.contextRef as never,async()=>null);
  const runtime=createAssistantHandler({store:b,travel:new TravelService(new TravelCache('output/deployment/no-live-travel')),jobs:{durable:true}});
  const input=(await b.read()).inputs![job.id];
  await runtime.jobs.execute(job.id,(signal,stage)=>b.withJob(job.id,()=>resolveWork(runtime.service,input)(signal,stage)));
  const completed=await runtime.jobs.get(job.id,b.owner);assert.equal(completed.status,'completed');
  assert.equal((completed.result as {data:{items:unknown[]}}).data.items.length,1);
});
