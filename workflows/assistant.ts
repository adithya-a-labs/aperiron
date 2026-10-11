import { sleep } from 'workflow';
import { createDeployedAssistant } from '../server/deployment/runtime';
import { PostgresAssistantStore } from '../server/deployment/assistant-store';
import { getDatabase } from '../server/deployment/database';
import { acquireLease, releaseLease } from '../server/deployment/leases';
import { resolveWork } from '../server/deployment/worker';
import { ApiError } from '../server/assistant/store';

export async function assistantWorkflow(jobId:string,owner:string) {
  'use workflow';
  // Keep provider concurrency shared across all function instances.
  for(let attempt=0;attempt<24;attempt++) {
    if(await executeJob(jobId,owner)) return;
    await sleep('5s');
  }
  await expireQueued(jobId,owner);
}
async function executeJob(jobId:string,owner:string) {
  'use step';
  const db=getDatabase(), runtime=createDeployedAssistant(owner);
  const data=await runtime.store.read(), job=data.jobs[jobId]?.value;
  if(!job || !['queued','running'].includes(job.status)) return true;
  const name=`assistant:${jobId}`, token=await acquireLease(db,name,'assistant:',2,120_000);
  if(!token) return false;
  try {
    if(job.status==='running') {
      await runtime.jobs.finish(jobId,'failed',null,new ApiError(503,'INTERRUPTED','Worker stopped after accepting work. Retry explicitly.',true)); return true;
    }
    const input=data.inputs?.[jobId];if(!input) throw new Error('Missing durable input.');
    const store=runtime.store as PostgresAssistantStore, work=resolveWork(runtime.service,input);
    await runtime.jobs.execute(jobId,(signal,stage)=>store.withJob(jobId,()=>work(signal,stage)));
    return true;
  } finally { await releaseLease(db,name,token); }
}
// A persisted running claim is never re-executed after an ambiguous provider failure.
executeJob.maxRetries=3;
async function expireQueued(jobId:string,owner:string) {
  'use step';
  await createDeployedAssistant(owner).jobs.finish(jobId,'failed',null,new ApiError(503,'QUEUE_FULL','Worker capacity was unavailable. Retry explicitly.',true));
}
