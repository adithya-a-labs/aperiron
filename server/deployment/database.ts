import postgres from 'postgres';

export interface Connection {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
}
export interface Database extends Connection {
  transaction<T>(work: (connection: Connection) => Promise<T>): Promise<T>;
}
let database: Database | undefined;
export function getDatabase(): Database {
  if (database) return database;
  const url = process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim();
  if (!url) throw new Error('DATABASE_URL is required for the deployed API.');
  const sql = postgres(url, { max: 3, idle_timeout: 20, connect_timeout: 10, prepare: false });
  const connection = (client: Pick<typeof sql, 'unsafe'>): Connection => ({
    query: async <T>(text: string, params: unknown[] = []) => [...await client.unsafe(text, params as never[])] as T[],
  });
  database = { ...connection(sql), transaction: async <T>(work: (c: Connection) => Promise<T>) =>
    await sql.begin(async tx => work(connection(tx as unknown as typeof sql))) as T };
  return database;
}

/** Serialize short state transitions, never provider calls. Locks are released by PostgreSQL on failure. */
export async function locked<T>(db: Database, name: string, work: (c: Connection) => Promise<T>) {
  return db.transaction(async c => {
    const rows=await c.query('SELECT name FROM aperiron_locks WHERE name = $1 FOR UPDATE', [name]);
    if(rows.length!==1) throw new Error('Deployment migrations are required.');
    return work(c);
  });
}
