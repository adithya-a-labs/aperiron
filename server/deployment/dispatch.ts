import { start } from 'workflow/api';
import { assistantWorkflow } from '../../workflows/assistant';
import { getDatabase, locked } from './database';

export async function dispatchPending(owner?:string) {
  const db=getDatabase();
  const rows=await locked(db,'assistant',async c=>{
    const selected=await c.query<{job_id:string;owner:string}>(`SELECT job_id,owner FROM aperiron_dispatch WHERE (state='pending' OR (state='dispatching' AND lease_until < now())) ${owner?'AND owner=$1':''} ORDER BY created_at LIMIT 20 FOR UPDATE`,owner?[owner]:[]);
    for(const row of selected) await c.query("UPDATE aperiron_dispatch SET state='dispatching',lease_until=$2 WHERE job_id=$1",[row.job_id,new Date(Date.now()+30_000).toISOString()]);
    return selected;
  });
  for(const row of rows) {
    try {
      const run=await start(assistantWorkflow,[row.job_id,row.owner]);
      await db.query("UPDATE aperiron_dispatch SET state='sent',workflow_id=$2,lease_until=NULL WHERE job_id=$1",[row.job_id,run.runId]);
    } catch {
      await db.query("UPDATE aperiron_dispatch SET state='pending',lease_until=NULL WHERE job_id=$1",[row.job_id]);
    }
  }
}
