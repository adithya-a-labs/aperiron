import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { getDatabase } from '../server/deployment/database';
if(existsSync('.env')) loadEnvFile('.env');
await getDatabase().query(await readFile(new URL('../server/deployment/repair-jsonb.sql',import.meta.url),'utf8'));
console.log('Encoded JSON records repaired. Existing quota and ownership values were preserved.');
