import { readFile } from 'node:fs/promises';
import { getDatabase } from '../server/deployment/database';
import { loadEnvFile } from 'node:process';
import { existsSync } from 'node:fs';
if(existsSync('.env')) loadEnvFile('.env');
const db=getDatabase();
const sql=await readFile(new URL('../server/deployment/schema.sql',import.meta.url),'utf8');
await db.transaction(async c=>{for(const statement of sql.split(';').map(s=>s.trim()).filter(Boolean)) await c.query(statement);});
console.log('Deployment schema is ready. Travel Buddy allowance remains zero until explicitly initialized.');
