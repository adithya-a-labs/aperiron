import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { createDatabase } from './deployment/database';
import { PostgresTravelCache } from './deployment/travel-cache';
import { PostgresAssistantStore } from './deployment/assistant-store';
import { TravelService } from './travel-details';
import { exampleProfile } from '../src/shared/assistant/fixtures';

test('production postgres driver stores JSON objects once; quota, cache and sessions survive reload', {timeout:30000}, async t=>{
  const pg=await PGlite.create();
  const server=new PGLiteSocketServer({db:pg,host:'127.0.0.1',port:0});
  t.after(async()=>{await server.stop();await pg.close();});
  await server.start();
  const db=createDatabase(`postgresql://postgres:postgres@${server.getServerConn()}/postgres`);
  t.after(()=>db.close());
  await pg.exec(await readFile(new URL('./deployment/schema.sql',import.meta.url),'utf8'));
  const cache=new PostgresTravelCache(db);
  await cache.mutate(d=>{d.quota.remaining=30;});
  assert.equal((await new PostgresTravelCache(db).quota()).remaining,30);
  let calls=0;
  const service=new TravelService(cache,{apiKey:'synthetic',fetchImpl:(async()=>{
    calls++;
    return Response.json({data:{passport:{code:'IN'},destination:{code:'JP'},visa_rules:{primary_rule:{name:'Visa required'}}},meta:{version:'2.0',language:'en'}},
      {headers:{'x-ratelimit-requests-remaining':'29','x-ratelimit-requests-limit':'120'}});
  }) as typeof fetch});
  assert.equal((await service.refresh({passportId:'IN',destinationId:'JP'})).outcome,'updated');
  assert.equal(calls,1);
  assert.equal((await new PostgresTravelCache(db).read('IN','JP')).length,1);
  assert.equal((await service.refresh({passportId:'IN',destinationId:'JP'})).outcome,'cached');
  assert.equal(calls,1);
  const owner='session_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',store=new PostgresAssistantStore(db,owner);
  await store.mutate(d=>{d.sessions[owner]={sessionId:owner,csrfToken:'synthetic',expiresAt:new Date(Date.now()+3600000).toISOString(),profile:{revision:1,profile:exampleProfile,updatedAt:null},submissions:[]};});
  await store.put('trip_synthetic',owner,{revision:1});
  assert.equal((await new PostgresAssistantStore(db,owner).session(owner)).profile.revision,1);
  assert.equal((await new PostgresAssistantStore(db,owner).get<{revision:number}>('trip_synthetic',owner)).revision,1);
  const rows=await db.query<{type:string}>("SELECT jsonb_typeof(data) AS type FROM aperiron_records WHERE kind IN ('sessions','resources','quota','entries')");
  assert(rows.length>=4);assert(rows.every(row=>row.type==='object'));

  // Recreate historical encoded rows, then verify repair is atomic and preserves allowance.
  const repair=await readFile(new URL('./deployment/repair-jsonb.sql',import.meta.url),'utf8');
  await db.query("UPDATE aperiron_records SET data=to_jsonb(data::text) WHERE kind IN ('quota','sessions')");
  await db.query("INSERT INTO aperiron_records(scope,kind,id,data) VALUES ('synthetic','resources','invalid',to_jsonb('not-json'::text))");
  await assert.rejects(db.query(repair));
  assert.equal((await db.query<{type:string}>("SELECT jsonb_typeof(data) AS type FROM aperiron_records WHERE kind='quota'"))[0].type,'string');
  await db.query("DELETE FROM aperiron_records WHERE scope='synthetic'");
  await db.query(repair);await db.query(repair);
  assert.equal((await new PostgresTravelCache(db).quota()).remaining,29);
  assert.equal((await new PostgresAssistantStore(db,owner).session(owner)).profile.revision,1);
});
