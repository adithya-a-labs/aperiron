import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTravelDetailsStore } from './travelDetailsStore';
import { normalizeTravelDetails, travelKey } from '../shared/travelDetails';

const details = (destination: string, date = new Date().toISOString()) => normalizeTravelDetails({ data: { passport: { code: 'IN' }, destination: { code: destination }, visa_rules: { primary_rule: { name: 'eVisa' } } } }, 'IN', destination, date);
test('late detail responses remain keyed to their own destination and do not overwrite another pair', async () => {
  let resolveJapan!: (r: Response) => void, calls = 0;
  const api = createTravelDetailsStore((async (_url, init) => {
    calls++; const d = JSON.parse(String(init?.body)).destinationId;
    if (d === 'JP') return new Promise<Response>(resolve => { resolveJapan = resolve; });
    return Response.json({ entries: [details('SG')], fresh: true, outcome: 'updated' });
  }) as typeof fetch);
  const japan = api.refresh('IN', 'JP'); const same = api.refresh('IN', 'JP');
  await api.refresh('IN', 'SG'); resolveJapan(Response.json({ entries: [details('JP')], fresh: true, outcome: 'updated' })); await Promise.all([japan, same]);
  assert.equal(calls, 2); assert.equal(api.store.getState().entries[travelKey('IN', 'SG')].destinationId, 'SG');
  assert.equal(api.store.getState().entries[travelKey('IN', 'JP')].destinationId, 'JP');
});
test('late older cache read cannot overwrite a newer successful refresh', async () => {
  let finish!: (r: Response) => void;
  const api = createTravelDetailsStore((async (_url, init) => init?.method === 'POST'
    ? Response.json({ entries: [details('JP', '2026-10-11T00:00:00Z')], fresh: true, outcome: 'updated' })
    : new Promise<Response>(resolve => { finish = resolve; })) as typeof fetch);
  const read = api.load('IN'); await api.refresh('IN', 'JP');
  finish(Response.json({ entries: [details('JP', '2026-10-10T00:00:00Z')], fresh: false, outcome: 'cached' })); await read;
  assert.equal(api.store.getState().entries[travelKey('IN', 'JP')].fetchedAt, '2026-10-11T00:00:00Z');
});
