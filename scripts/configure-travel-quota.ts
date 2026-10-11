import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { getDatabase, locked } from '../server/deployment/database';
if(existsSync('.env')) loadEnvFile('.env');
const args=process.argv.slice(2),remaining=Number(args[args.indexOf('--remaining')+1]),limit=args.includes('--limit')?Number(args[args.indexOf('--limit')+1]):120;
if(!args.includes('--remaining') || !Number.isSafeInteger(remaining) || !Number.isSafeInteger(limit) || remaining<0 || limit<1 || remaining>limit) throw new Error('Provide the actual allowance: npm run db:travel-quota -- --remaining N [--limit N].');
await locked(getDatabase(),'travel',async c=>{
  const active=await c.query("SELECT name FROM aperiron_leases WHERE name LIKE 'travel:%' AND expires_at>now()");
  if(active.length) throw new Error('Wait for active provider requests before reconciling the allowance.');
  const quota={remaining,limit,resetAt:0,blocked:false,retryAt:0,initialized:true};
  await c.query("INSERT INTO aperiron_records(scope,kind,id,data) VALUES ('travel','quota','account',$1::jsonb) ON CONFLICT(scope,kind,id) DO UPDATE SET data=excluded.data",[JSON.stringify(quota)]);
});
console.log('The explicitly supplied Travel Buddy allowance has been saved.');
