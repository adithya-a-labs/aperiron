// Run after build:vercel. Uses synthetic local sessions and makes no provider calls.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.VERCEL='1';
for (const name of ['DATABASE_URL','POSTGRES_URL','CRON_SECRET','GROQ_API_KEY','TRAVEL_BUDDY_API_KEY','RAPIDAPI_KEY','ASSISTANT_ALLOWED_ORIGINS']) delete process.env[name];
const {default:handler}=await import('../.vercel/output/functions/__server.func/index.mjs');
const directory=await mkdtemp(join(tmpdir(),'aperiron-vercel-smoke-'));
const server=createServer(handler);
try {
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  // The Vercel adapter expects separate invocation sockets.
  const headers={connection:'close'};
  for(const [path,status] of [['/api/health',503],['/api/maintenance',401],['/api/v1/assistant/capabilities',503],['/api/not-found',404]]) {
    const response=await fetch(base+path,{headers});
    assert.equal(response.status,status,path);
    assert.equal(response.headers.get('cache-control'),'no-store');
  }
  const response=await fetch(base+'/',{headers});
  assert.equal(response.status,200);
  assert.match(await response.text(),/<div id="root">/);
  delete process.env.VERCEL;
  process.env.ASSISTANT_STORE_DIR=join(directory,'assistant');
  process.env.TRAVEL_BUDDY_CACHE_DIR=join(directory,'travel');
  const bootstrap=await fetch(base+'/api/v1/assistant/sessions',{method:'POST',headers:{...headers,origin:'http://127.0.0.1:5173','content-type':'application/json'},body:'{}'});
  assert.equal(bootstrap.status,201);
  assert.match(bootstrap.headers.get('set-cookie'),/HttpOnly/);
  const cookie=bootstrap.headers.get('set-cookie').split(';')[0];
  const profile=await fetch(base+'/api/v1/assistant/profile',{headers:{...headers,cookie}});
  assert.equal(profile.status,200);
  console.log('Compiled Vercel frontend, API errors, body parsing, session and cookies passed. No cloud database or providers called.');
} finally {
  await new Promise(resolve=>server.close(resolve));
  // This exact directory was created for this check with mkdtemp above.
  await rm(directory,{recursive:true,force:true});
}
