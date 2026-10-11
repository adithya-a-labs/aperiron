import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';
import { randomUUID } from 'node:crypto';
import { AssistantStore, ApiError } from './assistant/store';
import { Jobs } from './assistant/jobs';

for (const failAt of [2, 3]) {
  test(`job storage failure at ${failAt === 2 ? 'dispatch' : 'completion'} stays contained and preserves reservation`, async () => {
    const store = new AssistantStore(null), owner = 'synthetic_owner';
    store.data.sessions[owner] = { sessionId: owner, csrfToken: 'synthetic_csrf',
      expiresAt: new Date(Date.now() + 60_000).toISOString(), profile: { revision: 0, profile: null, updatedAt: null }, submissions: [] };
    const original = store.mutate.bind(store); let writes = 0, calls = 0;
    store.mutate = fn => {
      if (++writes >= failAt) throw new ApiError(503, 'SERVICE_UNAVAILABLE', 'Synthetic storage failure');
      return original(fn);
    };
    const jobs = new Jobs(store), key = randomUUID();
    const job = jobs.submit(owner, '/synthetic', key, {}, 'brief', null, async () => { calls++; return { saved: false }; });
    await setImmediate();
    const failed = jobs.get(job.id, owner);
    assert.equal(failed.status, 'failed'); assert.equal(failed.error?.code, 'SERVICE_UNAVAILABLE');
    assert.equal(failed.result, null, 'An unsaved result must never be published');
    assert.equal(calls, failAt === 2 ? 0 : 1);
    assert.equal(jobs.prior(owner, '/synthetic', key, {})?.id, job.id, 'Retain idempotency; never replay accepted work');
    store.mutate = original;
    const recovered = jobs.submit(owner, '/synthetic', randomUUID(), {}, 'brief', null, async () => 'recovered');
    await setImmediate();
    assert.equal(jobs.get(recovered.id, owner).status, 'completed', 'Failed persistence must release the queue slot');
  });
}
