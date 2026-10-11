import { getDatabase } from './database';
import { PostgresAssistantStore } from './assistant-store';
import { PostgresTravelCache } from './travel-cache';
import { TravelService } from '../travel-details';
import { createAssistantHandler } from '../assistant/routes';
import { ApiError } from '../assistant/store';

export function allowedOrigins() {
  return [...new Set([
    ...(process.env.ASSISTANT_ALLOWED_ORIGINS?.split(',').map(s=>s.trim()).filter(Boolean) ?? []),
    ...[process.env.VERCEL_URL,process.env.VERCEL_PROJECT_PRODUCTION_URL].filter(Boolean).map(host=>`https://${host}`),
    ...(!process.env.VERCEL ? ['http://127.0.0.1:5173','http://localhost:5173','http://127.0.0.1:4173','http://localhost:4173'] : []),
  ])];
}
export function createDeployedTravel() {
  return new TravelService(new PostgresTravelCache(getDatabase(),setting('TRAVEL_BUDDY_RETENTION_DAYS',30,1)*86_400_000), {
    apiKey:process.env.TRAVEL_BUDDY_API_KEY ?? process.env.RAPIDAPI_KEY,
    freshMs:setting('TRAVEL_BUDDY_REFRESH_DAYS',7,1)*86_400_000,
    reserve:setting('TRAVEL_BUDDY_QUOTA_RESERVE',20,0),concurrency:setting('TRAVEL_BUDDY_CONCURRENCY',2,1),
  });
}
export function createDeployedAssistant(owner?: string, afterCommit?:()=>Promise<void>) {
  const store=new PostgresAssistantStore(getDatabase(),owner);
  return createAssistantHandler({store,travel:createDeployedTravel(),allowedOrigins:allowedOrigins(),jobs:{durable:true},afterCommit});
}
export async function reserveLegacyResearch() {
  if(!process.env.GROQ_API_KEY?.trim()) throw new ApiError(503,'MODEL_UNAVAILABLE','Configure GROQ_API_KEY on the server.');
  const store=new PostgresAssistantStore(getDatabase());
  await store.mutate(d=>{
    if(d.providerCooldownUntil>Date.now()) throw new ApiError(429,'RATE_LIMITED','Groq is cooling down. Try again later.');
    const day=new Date().toISOString().slice(0,10), b=d.budgets[day] ??= {tokens:0,searches:0,calls:0,actualTokens:0};
    if(b.tokens+65536>setting('ASSISTANT_DAILY_TOKEN_BUDGET',500000,0) || b.searches+1>setting('ASSISTANT_DAILY_SEARCH_BUDGET',10,0)) throw new ApiError(429,'BUDGET_EXHAUSTED','Server research allowance is exhausted.');
    b.tokens+=65536;b.searches++;b.calls++;
  });
}
export async function recordLegacyCooldown(seconds:number) {
  await new PostgresAssistantStore(getDatabase()).mutate(d=>{d.providerCooldownUntil=Math.max(d.providerCooldownUntil,Date.now()+seconds*1000);});
}
export function sessionCookie(cookie:string|undefined) {
  const value=cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('aperiron_session='))?.slice(17);
  return value && /^session_[a-f0-9]{32}$/.test(value) ? value : undefined;
}
function setting(name:string,fallback:number,minimum:number) {
  if(!process.env[name]?.trim()) return fallback;
  const n=Number(process.env[name]);if(!Number.isSafeInteger(n) || n<minimum) throw new Error(`Invalid ${name}.`);return n;
}
