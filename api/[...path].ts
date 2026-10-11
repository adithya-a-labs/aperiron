import { fromNodeHandler } from 'nitro/h3';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApiHandler } from '../server/api-server';
import { createResearchHandler, ResearchServiceError } from '../server/groq-browser-search';
import { createTravelHandler } from '../server/travel-details';
import { ApiError, opaque } from '../server/assistant/store';
import { allowedOrigins, createDeployedAssistant, createDeployedTravel, reserveLegacyResearch, recordLegacyCooldown, sessionCookie } from '../server/deployment/runtime';
import { dispatchPending } from '../server/deployment/dispatch';
import { getDatabase } from '../server/deployment/database';

let local: ReturnType<typeof createApiHandler> | undefined;
export default fromNodeHandler(async (req,res)=>{
  // Nitro's Node bridge can describe HTTP/2 too; these handlers use its HTTP/1-compatible API.
  const request=req as IncomingMessage, response=res as ServerResponse;
  const path=request.url?.split('?')[0];
  response.setHeader('Cache-Control','no-store');
  response.setHeader('X-Content-Type-Options','nosniff');
  try {
    if(path==='/api/maintenance') {
      if(request.method!=='GET' || !process.env.CRON_SECRET || request.headers.authorization!==`Bearer ${process.env.CRON_SECRET}`) {
        response.writeHead(401);response.end();return;
      }
      const db=getDatabase();
      await db.query('DELETE FROM aperiron_records WHERE expires_at <= now()');
      await db.query("DELETE FROM aperiron_records r WHERE r.scope NOT IN ('provider','travel') AND NOT EXISTS (SELECT 1 FROM aperiron_records s WHERE s.scope=r.scope AND s.kind='sessions' AND s.expires_at>now())");
      await db.query("DELETE FROM aperiron_dispatch d WHERE NOT EXISTS (SELECT 1 FROM aperiron_records r WHERE r.scope=d.owner AND r.kind='jobs' AND r.id=d.job_id)");
      await dispatchPending(); response.writeHead(200,{'Content-Type':'application/json'});response.end(JSON.stringify({ok:true}));return;
    }
    if(path==='/api/health') {
      const locks=await getDatabase().query('SELECT name FROM aperiron_locks WHERE name=$1',['assistant']);
      if(locks.length!==1) throw new Error('Deployment migrations are required.');
      response.writeHead(200,{'Content-Type':'application/json'});response.end(JSON.stringify({ok:true}));return;
    }
    if(!process.env.VERCEL && !process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
      local ??= createApiHandler(); await local(request,response);return;
    }
    if(path?.startsWith('/api/v1/assistant')) {
      const owner=sessionCookie(request.headers.cookie) ?? opaque('session');
      const connected=createDeployedAssistant(owner,()=>dispatchPending(owner));
      await connected.handler(request,response);return;
    }
    if(request.method==='POST' && (!request.headers.origin || !allowedOrigins().includes(request.headers.origin))) throw new ApiError(403,'ORIGIN_REJECTED','Origin is not configured.');
    if(path==='/api/groq-research') {
      const handler=createResearchHandler({beforeCall:async()=>{
        try {await reserveLegacyResearch();}catch(error){if(error instanceof ApiError) throw new ResearchServiceError(error.status,error.message,error.status===429?60:0);throw error;}
      },onCooldown:recordLegacyCooldown});
      await handler(request,response);return;
    }
    if(path==='/api/travel-details' || path==='/api/travel-details/refresh') {
      await createTravelHandler(createDeployedTravel())(request,response);return;
    }
    response.writeHead(404,{'Content-Type':'application/json'});response.end(JSON.stringify({error:'Not found.'}));
  } catch(error) {
    if(response.headersSent) {response.end();return;}
    response.writeHead(error instanceof ApiError?error.status:503,{'Content-Type':'application/json'});
    response.end(JSON.stringify({error:error instanceof ApiError?error.message:'The API is unavailable. Check database configuration and migrations.'}));
  }
});
