import { randomUUID } from 'node:crypto';
import { locked, type Database } from './database';
export async function acquireLease(db: Database, name: string, prefix: string, limit: number, durationMs: number) {
  return locked(db, 'leases', async c => {
    await c.query('DELETE FROM aperiron_leases WHERE expires_at <= now()');
    const rows = await c.query<{ name: string }>('SELECT name FROM aperiron_leases WHERE name LIKE $1', [`${prefix}%`]);
    if (rows.some(r => r.name === name) || rows.length >= limit) return null;
    const token = randomUUID();
    await c.query('INSERT INTO aperiron_leases(name,token,expires_at) VALUES ($1,$2,$3)', [name,token,new Date(Date.now()+durationMs).toISOString()]); return token;
  });
}
export async function releaseLease(db: Database, name: string, token: string) {
  await db.query('DELETE FROM aperiron_leases WHERE name=$1 AND token=$2', [name,token]);
}
