import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { TravelCache } from './travel-cache';
import { TravelService, createTravelHandler } from './travel-details';
import { normalizeTravelDetails, primaryAccess } from '../src/shared/travelDetails';

const payload = (p = 'IN', d = 'JP', name = 'eVisa') => ({ data: { passport: { code: p }, destination: { code: d, passport_validity: '6 months' },
  visa_rules: { primary_rule: { name, duration: '90 days', link: 'https://link.travel-buddy.ai/?link=sample' },
    exception_rule: { name: 'Visa-free', exception_type_name: 'If holding a visa', country_codes: ['SH', 'US'] } } }, meta: { version: '2.0', language: 'en' } });
const request = { passportId: 'IN', destinationId: 'JP' };
async function setup(t: TestContext, initial = 105) {
  const dir = await mkdtemp(join(tmpdir(), 'aperiron-travel-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return { dir, cache: new TravelCache(dir, initial) };
}
test('normalizer preserves conditional alternatives and never derives categories from colours', () => {
  const d = normalizeTravelDetails(payload(), 'IN', 'JP', new Date().toISOString());
  assert.equal(primaryAccess(d), 'evisa'); assert.deepEqual(d.exception?.countryCodes, ['SH', 'US']);
  assert.equal('verifiedAt' in d, false); assert.equal('documents' in d, false);
  assert.equal(primaryAccess(normalizeTravelDetails(payload('IN', 'JP', 'Online visa required'), 'IN', 'JP', d.fetchedAt)), 'visa_required');
  assert.equal(primaryAccess(normalizeTravelDetails(payload('IN', 'JP', 'Unknown new rule'), 'IN', 'JP', d.fetchedAt)), null);
  assert.throws(() => normalizeTravelDetails(payload('US'), 'IN', 'JP', d.fetchedAt));
  assert.throws(() => normalizeTravelDetails({ ...payload(), meta: { is_demo: true } }, 'IN', 'JP', d.fetchedAt));
});
test('persistent fresh cache and unsupported contexts make zero upstream calls', async t => {
  const { dir, cache } = await setup(t); let calls = 0;
  await cache.put(normalizeTravelDetails(payload(), 'IN', 'JP', new Date().toISOString()));
  const s = new TravelService(new TravelCache(dir), { apiKey: 'test', fetchImpl: (async () => { calls++; throw new Error(); }) as typeof fetch });
  assert.equal((await s.refresh(request)).outcome, 'cached');
  assert.equal((await s.refresh({ ...request, purpose: 'business' })).outcome, 'unsupported');
  assert.equal((await s.refresh({ passportId: 'IN', destinationId: 'IN' })).outcome, 'unsupported');
  assert.equal(calls, 0);
});
test('concurrent identical refreshes share one request and ignore the platform hard-limit header', async t => {
  const { cache } = await setup(t); let calls = 0;
  const s = new TravelService(cache, { apiKey: 'test', fetchImpl: (async () => { calls++; await new Promise(r => setTimeout(r, 10));
    return Response.json(payload(), { headers: { 'x-ratelimit-requests-remaining': '104', 'x-ratelimit-requests-limit': '120',
      'x-ratelimit-rapid-free-plans-hard-limit-remaining': '499999', 'x-ratelimit-requests-reset': '3600' } }); }) as typeof fetch });
  const results = await Promise.all([s.refresh(request), s.refresh(request), s.refresh(request)]);
  assert.equal(calls, 1); assert(results.every(r => r.outcome === 'updated')); assert.equal((await cache.quota()).remaining, 104);
  assert((await cache.quota()).resetAt > Date.now());
});
test('reserve threshold survives restart and blocks forced refresh', async t => {
  const { dir, cache } = await setup(t, 20); await cache.mutate(() => {}); let calls = 0;
  const s = new TravelService(new TravelCache(dir, 120), { apiKey: 'test', fetchImpl: (async () => { calls++; return Response.json(payload()); }) as typeof fetch });
  assert.equal((await s.refresh(request, true)).outcome, 'quota'); assert.equal(calls, 0);
});
test('different pairs respect global concurrency and cannot spend the reserve concurrently', async t => {
  const { cache } = await setup(t, 23); let active = 0, maximum = 0, calls = 0;
  const s = new TravelService(cache, { apiKey: 'test', fetchImpl: (async (_url, init) => {
    active++; calls++; maximum = Math.max(maximum, active);
    await new Promise(r => setTimeout(r, 15)); active--;
    const r = JSON.parse(String(init?.body)); return Response.json(payload(r.passport, r.destination));
  }) as typeof fetch });
  const results = await Promise.all(['JP', 'SG', 'TR', 'AU', 'GB'].map(destinationId => s.refresh({ passportId: 'IN', destinationId })));
  assert.equal(maximum, 2); assert.equal(calls, 3); assert.equal((await cache.quota()).remaining, 20);
  assert.equal(results.filter(r => r.outcome === 'quota').length, 2);
});
test('timeout keeps stale data, consumes one reservation and suppresses repeated clicks', async t => {
  const { dir, cache } = await setup(t); let calls = 0;
  await cache.put(normalizeTravelDetails(payload(), 'IN', 'JP', new Date(Date.now() - 8 * 86400000).toISOString()));
  const s = new TravelService(cache, { apiKey: 'test', fetchImpl: (async () => { calls++; throw new DOMException('timeout', 'TimeoutError'); }) as typeof fetch });
  const r = await s.refresh(request); assert.equal(r.outcome, 'unavailable'); assert.equal(r.entries.length, 1);
  assert.equal((await s.refresh(request)).outcome, 'cooldown'); assert.equal(calls, 1);
  assert.equal((await new TravelCache(dir).quota()).remaining, 104);
});
test('corrupt quota fails closed and expired responses are not served', async t => {
  const { dir, cache } = await setup(t);
  await cache.put(normalizeTravelDetails(payload(), 'IN', 'JP', new Date(Date.now() - 31 * 86400000).toISOString()));
  assert.equal((await cache.read('IN')).length, 0);
  await writeFile(join(dir, 'cache.json'), '{broken');
  assert.equal((await new TravelCache(dir, 120).quota()).remaining, 0);
});
test('failed quota persistence prevents upstream dispatch', async t => {
  const { dir } = await setup(t); const file = join(dir, 'not-a-directory'); await writeFile(file, 'blocked'); let calls = 0;
  const s = new TravelService(new TravelCache(file, 105), { apiKey: 'test', fetchImpl: (async () => { calls++; return Response.json(payload()); }) as typeof fetch });
  assert.equal((await s.refresh(request)).outcome, 'unavailable'); assert.equal(calls, 0);
});
test('authentication failure is persisted and key rotation permits recovery after cooldown', async t => {
  const { dir, cache } = await setup(t); let calls = 0;
  const bad = new TravelService(cache, { apiKey: 'bad', fetchImpl: (async () => { calls++; return new Response('', { status: 401 }); }) as typeof fetch });
  await bad.refresh(request);
  const same = new TravelService(new TravelCache(dir), { apiKey: 'bad', fetchImpl: (async () => { calls++; throw new Error(); }) as typeof fetch });
  assert.equal((await same.refresh(request)).outcome, 'unavailable'); assert.equal(calls, 1);
  await cache.mutate(d => { d.quota.retryAt = 0; });
  const good = new TravelService(cache, { apiKey: 'new', fetchImpl: (async () => Response.json(payload())) as typeof fetch });
  assert.equal((await good.refresh(request)).outcome, 'updated');
});
test('429 honors Retry-After, preserves cached data and waits for observed quota reset', async t => {
  const { cache } = await setup(t); let now = Date.now(), calls = 0;
  const s = new TravelService(cache, { now: () => now, apiKey: 'test', fetchImpl: (async () => {
    calls++; return calls === 1 ? new Response('', { status: 429, headers: { 'retry-after': '600', 'x-ratelimit-requests-reset': '900' } }) : Response.json(payload());
  }) as typeof fetch });
  assert.equal((await s.refresh(request)).outcome, 'quota');
  assert.equal((await s.refresh(request)).outcome, 'cooldown');
  now += 901000; assert.equal((await s.refresh(request)).outcome, 'updated');
  assert.equal(calls, 2);
});
test('mismatched or oversized provider responses cannot replace saved data', async t => {
  const { cache } = await setup(t); const saved = normalizeTravelDetails(payload(), 'IN', 'JP', new Date().toISOString()); await cache.put(saved);
  for (const body of [payload('US'), { large: 'x'.repeat(129000) }]) {
    await cache.mutate(d => { d.quota.retryAt = 0; });
    const s = new TravelService(cache, { apiKey: 'test', fetchImpl: (async () => Response.json(body)) as typeof fetch });
    assert.equal((await s.refresh(request, true)).outcome, 'unavailable');
    assert.equal((await cache.read('IN'))[0].fetchedAt, saved.fetchedAt);
  }
});
test('HTTP cache reads never fetch; invalid input and cross-origin writes are rejected', async t => {
  const { cache, dir } = await setup(t); let calls = 0;
  const s = new TravelService(cache, { apiKey: 'test', fetchImpl: (async () => { calls++; return Response.json(payload()); }) as typeof fetch });
  const server = createServer(createTravelHandler(s)); await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve())));
  const address = server.address(); assert(address && typeof address === 'object'); const url = `http://127.0.0.1:${address.port}`;
  assert.equal((await fetch(`${url}/api/travel-details?passportId=IN`)).status, 200);
  assert.equal((await fetch(`${url}/api/travel-details?passportId=XX`)).status, 400);
  assert.equal((await fetch(`${url}/api/travel-details/refresh`, { method: 'POST', headers: { Origin: 'https://example.com' }, body: JSON.stringify(request) })).status, 403);
  assert.equal(calls, 0);
  assert.equal((await fetch(`${url}/api/travel-details/refresh`, { method: 'POST', body: JSON.stringify(request) })).status, 200);
  assert.equal(calls, 1);
  assert(!(await readFile(join(dir, 'cache.json'), 'utf8')).includes('X-RapidAPI-Key'));
});
