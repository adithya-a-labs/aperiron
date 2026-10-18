import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { createApiHandler } from './api-server';
import { BASE, createAssistantHandler } from './assistant/routes';
import { AssistantStore, ApiError, type Job, type Conversation, type TripResource } from './assistant/store';
import { Jobs } from './assistant/jobs';
import { GroqModel, extractSources, safeSourceUrl, type Model } from './assistant/groq';
import type { Schema } from '../src/shared/assistant/schema';
import { generatedAnswer, mapProposal, profile, profileProposal, requests, type ContextRef } from '../src/shared/assistant/schemas';
import { responses, job as jobSchema } from '../src/shared/assistant/responses';
import { operations } from '../src/shared/assistant/operations';
import { exampleActions, exampleCards, exampleProfile } from '../src/shared/assistant/fixtures';
import { TravelCache } from './travel-cache';
import { TravelService } from './travel-details';
import type { Message, Brief } from './assistant/service';
import { Contexts, type Evidence } from './assistant/context';

class FakeModel implements Model {
  configured = true; model = 'test-120b'; calls = 0; searches = 0; delay = 0; searchPrompts: string[] = [];
  answer = { text: 'Review unresolved requirements.', cards: [], claims: [], questions: [], actions: [], warnings: [] };
  searchAnswer = 'Unreviewed official-source discovery.';
  async generate<T>(schema: Schema<T>, _prompt: string, signal: AbortSignal): Promise<T> {
    this.calls++; if (this.delay) await new Promise<void>((resolve, reject) => { const timer = setTimeout(resolve, this.delay); signal.addEventListener('abort', () => { clearTimeout(timer); reject(signal.reason); }, { once: true }); });
    const value = schema === profileProposal ? { proposedProfile: null, fields: [{ field: 'passportId', state: 'missing' }], questions: [], unsupportedConstraints: [] } :
      schema === mapProposal ? { actions: [], proposedProfile: null, questions: [], unsupportedConstraints: ['Weather is not assessed.'] } : this.answer;
    return schema.parse(value);
  }
  async search(prompt: string) { this.searches++; this.searchPrompts.push(prompt); return { text: this.searchAnswer, sources: [{ url: 'https://www.mofa.go.jp/j_info/visit/visa/index.html', title: 'Visa', excerpt: null }], usage: { total_tokens: 250 } }; }
}
type ResponseData<T> = { status: number; data: T; error?: { code: string }; headers: Headers; raw: string };
async function fixture(t: TestContext, options: { rate?: number; deadlineMs?: number; quota?: number; model?: FakeModel } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'aperiron-assistant-')), store = new AssistantStore(join(dir, 'assistant.json'));
  const model = options.model ?? new FakeModel(); let providerCalls = 0;
  const travel = new TravelService(new TravelCache(join(dir, 'travel'), options.quota ?? 120), { apiKey: 'fixture-not-secret', fetchImpl: async (_url, init) => {
    providerCalls++; const r = JSON.parse(String(init?.body)) as { passport: string; destination: string };
    return Response.json({ data: { passport: { code: r.passport }, destination: { code: r.destination }, visa_rules: { primary_rule: { name: 'eVisa', duration: '90 days' } } }, meta: { version: '2.0', language: 'en' } });
  } });
  const server = createServer(createApiHandler({ store, travel, model, allowedOrigins: ['http://127.0.0.1:5184'], jobs: { rate: options.rate ?? 100, deadlineMs: options.deadlineMs ?? 90_000 } }));
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve)); const address = server.address(); assert(address && typeof address !== 'string');
  t.after(async () => { await new Promise<void>(resolve => server.close(() => resolve())); await rm(dir, { recursive: true, force: true }); });
  const baseUrl = `http://127.0.0.1:${address.port}${BASE}`;
  const covered = new Set<string>();
  const client = () => {
    let cookie = '', csrf = '';
    const call = async <T = unknown>(method: string, path: string, body?: unknown, headers: Record<string, string> = {}): Promise<ResponseData<T>> => {
      const operation = operations.find(o => o[0] === method && new RegExp(`^${o[1].replace(/\{\w+\}/g, '[^/]+')}$`).test(path.split('?')[0]));
      if (operation) covered.add(`${method} ${operation[1]}`);
      const response = await fetch(`${baseUrl}${path}`, { method, headers: { Origin: 'http://127.0.0.1:5184', 'Content-Type': 'application/json', Cookie: cookie, 'X-CSRF-Token': csrf, ...headers }, ...(body !== undefined ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}) });
      const raw = await response.text(); let parsed: { data: T; error?: { code: string } } = { data: undefined as T }; try { parsed = JSON.parse(raw) as typeof parsed; } catch { /* exports/204 */ }
      if (path === '/sessions' && response.status === 201) { cookie = response.headers.get('set-cookie')!.split(';')[0]; csrf = (parsed.data as { csrfToken: string }).csrfToken; }
      return { status: response.status, ...parsed, headers: response.headers, raw };
    };
    const postJob = async (path: string, body: unknown, key = randomUUID()) => { const r = await call<Job>('POST', path, body, { 'Idempotency-Key': key }); assert.equal(r.status, 202, r.raw); jobSchema.parse(r.data); return r.data; };
    const done = async (job: Job) => { for (let i = 0; i < 200; i++) { const r = await call<Job>('GET', `/jobs/${job.id}`); assert.equal(r.status, 200, r.raw); jobSchema.parse(r.data); if (!['queued', 'running'].includes(r.data.status)) return r.data; await new Promise(r => setTimeout(r, 5)); } throw new Error('Job did not complete'); };
    return { call, postJob, done };
  };
  const a = client(); assert.equal((await a.call('POST', '/sessions', {})).status, 201);
  assert.equal((await a.call('PUT', '/profile', { expectedRevision: 0, profile: exampleProfile })).status, 200);
  return { ...a, client, store, travel, model, dir, providerCalls: () => providerCalls, covered };
}
const countryRef: ContextRef = { kind: 'country', destinationId: 'JP', profileRevision: 1 };
const mapRef: ContextRef = { kind: 'map', profileRevision: 1, selectedCountryIds: ['JP'], mapRevision: 'map_1' };
const filters = { regionIds: [], accessLevels: [] }, page = { cursor: null, limit: 50 };
const tripInput = { name: 'Synthetic group', travellers: [{ id: 'a', label: 'A', profile: exampleProfile }, { id: 'b', label: 'B', profile: { ...exampleProfile, passportId: 'DE' } }], departureDate: null, returnDate: null, durationDays: 5, budget: null, shortlistCountryIds: ['JP'] };

test('category filtering preserves unknown and over-stay rows without granting group eligibility', () => {
  const contexts = new Contexts(undefined as never, undefined as never);
  const unsupported = [{ id: 'a', profile: { ...exampleProfile, purpose: 'business' as const } }];
  const unknown = contexts.query(unsupported, { ...filters, accessLevels: ['unknown'], minimumStayDays: null }, [], null, true);
  assert.equal(unknown.total, 199);
  assert(unknown.destinations.every(row => !row.matches && row.groupAssessment === 'unassessed'));
  assert(unknown.destinations.every(row => row.travellers.every(t => t.accessLevel === 'unknown')));
  const minimum = contexts.query(unsupported, { ...filters, accessLevels: ['unknown'], minimumStayDays: 5 }, [], null, true);
  assert.equal(minimum.total, 0, 'Unknown stays cannot satisfy a numeric minimum');

  const profiles = [{ id: 'a', profile: { ...exampleProfile, durationDays: 3650 } }];
  const all = contexts.query(profiles, { ...filters, minimumStayDays: null }, [], { cursor: null, limit: 50 }, true);
  const exceeded = all.destinations.find(row => row.travellers[0].stayAssessment === 'exceeds_snapshot');
  assert(exceeded, 'Fixture must contain a known numeric stay limit');
  const category = exceeded.travellers[0].accessLevel;
  const selected = contexts.query(profiles, { ...filters, accessLevels: [category], minimumStayDays: null }, [exceeded.destinationId], null, true);
  assert.equal(selected.total, 1, 'Category filtering must not hide a stay warning');
  assert.equal(selected.destinations[0].matches, false);
  assert.equal(selected.destinations[0].groupAssessment, 'does_not_match');
});
const msg = (ref = countryRef, revision = 0) => ({ clientMessageId: randomUUID(), expectedConversationRevision: revision, contextRef: ref, text: 'Explain what is unknown', intent: 'ask', dataPolicy: { travelBuddy: 'cache_only', research: 'never' } });

test('all 30 assistant HTTP operations return their documented success contracts', async t => {
  const f = await fixture(t), { call, postJob, done } = f;
  assert.equal((await call('GET', '/capabilities')).status, 200);
  assert.equal((await call('GET', '/sessions/current')).status, 200);
  assert.equal((await call('GET', '/profile')).status, 200);
  assert.equal((await done(await postJob('/profile/interpret', { text: 'I live in Germany', expectedRevision: 1 }))).status, 'completed');
  assert.equal((await done(await postJob('/map/interpret', { text: 'Warm places', profileRevision: 1, mapRevision: 'map_1', selectedCountryIds: [], filters }))).status, 'completed');
  const map = await call<ReturnType<typeof responses.mapResult.parse>>('POST', '/map/query', { profileRevision: 1, filters, destinationIds: [], page }); assert.equal(map.status, 200, map.raw); assert.equal(map.data.total, 199);
  const context = await call<ReturnType<typeof responses.countryContext.parse>>('GET', '/countries/JP/context?profileRevision=1'); assert.equal(context.status, 200, context.raw);
  const conv = await call<Conversation>('POST', '/conversations', { contextRef: countryRef }); assert.equal(conv.status, 201, conv.raw);
  const answer = await done(await postJob(`/conversations/${conv.data.id}/messages`, msg())); assert.equal(answer.status, 'completed');
  const message = (answer.result as { data: Message }).data;
  const history = await call('GET', `/conversations/${conv.data.id}`); assert.equal(history.status, 200, history.raw);
  const research = await done(await postJob('/research', { contextRef: countryRef, question: 'Find official sources', refresh: false })); assert.equal(research.status, 'completed');
  const evidenceIds = (research.result as { data: { evidenceIds: string[] } }).data.evidenceIds;
  assert.equal((await call('GET', `/evidence/${evidenceIds[0]}`)).status, 200);
  const exp = await done(await postJob('/explanations', { kind: 'dna', passportId: 'IN', language: 'en' })); assert.equal(exp.status, 'completed');
  const created = await call<TripResource>('POST', '/trips', tripInput); assert.equal(created.status, 201, created.raw); const tripId = created.data.id;
  assert.equal((await call('GET', `/trips/${tripId}`)).status, 200);
  const group = await call('POST', `/trips/${tripId}/destinations/query`, { tripRevision: 1, filters, destinationIds: ['JP', 'SG'], page }); assert.equal(group.status, 200, group.raw);
  const groupContext = await call('GET', `/trips/${tripId}/countries/JP/context?tripRevision=1`); assert.equal(groupContext.status, 200, groupContext.raw);
  const enriched = await done(await postJob(`/trips/${tripId}/enrichment`, { tripRevision: 1, destinationIds: ['JP'], travellerIds: ['a', 'b'], maxProviderCalls: 0 })); assert.equal(enriched.status, 'completed');
  assert.equal((await done(await postJob('/checklists', { contextRef: countryRef, destinationIds: ['JP'] }))).status, 'completed');
  const briefJob = await done(await postJob('/briefs', { contextRef: countryRef, destinationIds: ['JP'], messageIds: [message.id], includeChecklist: true, language: 'en' })); assert.equal(briefJob.status, 'completed');
  const briefId = (briefJob.result as { data: Brief }).data.id;
  assert.equal((await call('GET', `/briefs/${briefId}`)).status, 200);
  const markdown = await call('GET', `/briefs/${briefId}/export?format=markdown`); assert.equal(markdown.status, 200); assert.match(markdown.raw, /Evidence and provenance/);
  const json = await call('GET', `/briefs/${briefId}/export?format=json`); assert.equal(json.status, 200); assert.equal(JSON.parse(json.raw).id, briefId);
  assert.equal((await call('DELETE', `/briefs/${briefId}`)).status, 204);
  assert.equal((await call('PUT', `/trips/${tripId}`, { expectedRevision: 1, trip: { ...tripInput, name: 'Updated' } })).status, 200);
  assert.equal((await call('DELETE', `/trips/${tripId}`)).status, 204);
  assert.equal((await call('DELETE', `/jobs/${exp.id}`)).status, 204);
  assert.equal(f.providerCalls(), 0); assert.equal(f.model.searches, 1);
  assert.equal((await call('DELETE', '/sessions/current')).status, 204);
  assert.equal(f.covered.size, 30, `Missing: ${operations.filter(o => !f.covered.has(`${o[0]} ${o[1]}`)).map(o => o[1])}`);
});

test('sessions enforce Origin, CSRF, ownership, unknown fields, body and JSON boundaries', async t => {
  const f = await fixture(t);
  for (const [method, path, body, headers, status] of [
    ['POST', '/sessions', {}, { Origin: 'https://attacker.example' }, 403],
    ['POST', '/sessions', {}, { Origin: '' }, 403],
    ['PUT', '/profile', { expectedRevision: 1, profile: exampleProfile }, { 'X-CSRF-Token': '' }, 403],
    ['POST', '/trips', '{invalid', {}, 400],
    ['POST', '/trips', { ...tripInput, extra: 1 }, {}, 400],
    ['POST', '/trips', 'x'.repeat(33000), {}, 413],
    ['GET', '/countries/ZZ/context?profileRevision=1', undefined, {}, 400],
    ['GET', '/countries/JP/context?profileRevision=1&extra=x', undefined, {}, 400],
  ] as const) assert.equal((await f.call(method, path, body, headers)).status, status);
  const b = f.client(); assert.equal((await b.call('GET', '/profile')).status, 401); await b.call('POST', '/sessions', {});
  const trip = await f.call<TripResource>('POST', '/trips', tripInput);
  assert.equal((await b.call('GET', `/trips/${trip.data.id}`)).status, 404);
  const refContext = await f.call<ReturnType<typeof responses.countryContext.parse>>('GET', '/countries/JP/context?profileRevision=1');
  const ev = refContext.data.evidence[0]; assert(ev); assert.equal((await b.call('GET', `/evidence/${ev.id}`)).status, 404);
  assert.equal((await f.call('GET', `/evidence/${trip.data.id}`)).status, 404);
  const oldCookie = (await f.call<{ sessionId: string }>('GET', '/sessions/current')).data.sessionId;
  assert.equal((await f.call<{ sessionId: string }>('POST', '/sessions', {})).data.sessionId, oldCookie);
  assert.equal((await f.call('PUT', '/profile', { expectedRevision: 0, profile: exampleProfile })).status, 409);
  assert.equal(f.model.calls + f.model.searches + f.providerCalls(), 0);
});

test('profile schema checks actual dates, inclusive durations, document uniqueness and group schedules', () => {
  for (const patch of [{ departureDate: '2026-02-30' }, { departureDate: '2026-10-12', returnDate: '2026-10-11' }, { departureDate: '2026-10-11', returnDate: '2026-10-15', durationDays: 4 }, { passportId: 'ZZ' }, { passportType: 'other' }, { residenceCountryId: 'ZZ' }]) assert.throws(() => profile.parse({ ...exampleProfile, ...patch }));
  profile.parse({ ...exampleProfile, departureDate: '2028-02-29', returnDate: '2028-03-01', durationDays: 2 });
  assert.throws(() => requests.trip.parse({ ...tripInput, travellers: [...tripInput.travellers, tripInput.travellers[0]] }));
  assert.throws(() => requests.trip.parse({ ...tripInput, travellers: [{ ...tripInput.travellers[0], profile: { ...exampleProfile, durationDays: 6 } }] }));
});

test('idempotency and client-message duplicates cannot spend twice; changed requests conflict', async t => {
  const f = await fixture(t), conv = (await f.call<Conversation>('POST', '/conversations', { contextRef: countryRef })).data;
  const b = msg(), key = randomUUID(), path = `/conversations/${conv.id}/messages`;
  const one = await f.postJob(path, b, key); const two = await f.postJob(path, b, key); assert.equal(two.id, one.id);
  await f.done(one); assert.equal(f.model.calls, 1);
  assert.equal((await f.postJob(path, b)).id, one.id);
  assert.equal((await f.call('POST', path, { ...b, text: 'changed' }, { 'Idempotency-Key': key })).status, 409);
  assert.equal((await f.call('POST', path, { ...b, text: 'changed' }, { 'Idempotency-Key': randomUUID() })).status, 409);
  assert.equal((await f.call('POST', path, { ...msg(), expectedConversationRevision: 0 }, { 'Idempotency-Key': randomUUID() })).status, 409);
  assert.equal(f.model.calls, 1);
});

test('conversation busy, profile supersession and cancellation prevent late publication', async t => {
  const model = new FakeModel(); model.delay = 200;
  const f = await fixture(t, { model }), conv = (await f.call<Conversation>('POST', '/conversations', { contextRef: countryRef })).data;
  const job = await f.postJob(`/conversations/${conv.id}/messages`, msg());
  assert.equal((await f.call('POST', `/conversations/${conv.id}/messages`, msg(countryRef, 1), { 'Idempotency-Key': randomUUID() })).status, 409);
  await f.call('PUT', '/profile', { expectedRevision: 1, profile: { ...exampleProfile, passportId: 'DE' } });
  assert.equal((await f.done(job)).status, 'superseded');
  const historical = await f.call<{ historical: boolean; messages: Message[] }>('GET', `/conversations/${conv.id}`); assert(historical.data.historical); assert.equal(historical.data.messages.length, 1);
  const cancelled = await f.postJob('/profile/interpret', { expectedRevision: 2, text: 'Tourism in Japan' }); await f.call('DELETE', `/jobs/${cancelled.id}`); assert.equal((await f.done(cancelled)).status, 'cancelled');
});

test('map/group queries remain local and unsupported contexts are unassessed', async t => {
  const f = await fixture(t);
  await f.call('PUT', '/profile', { expectedRevision: 1, profile: { ...exampleProfile, purpose: 'business' } });
  const context = await f.call<ReturnType<typeof responses.countryContext.parse>>('GET', '/countries/JP/context?profileRevision=2'); assert.equal(context.status, 200, context.raw); assert.equal(context.data.supportedContext, false);
  const map = await f.call<ReturnType<typeof responses.mapResult.parse>>('POST', '/map/query', { profileRevision: 2, filters: { regionIds: [], accessLevels: ['visa_free'] }, destinationIds: ['JP'], page }); assert.equal(map.status, 200); assert.equal(map.data.total, 0); assert.equal(map.data.unassessedCount, 1);
  const unknownStay = await f.call<ReturnType<typeof responses.mapResult.parse>>('POST', '/map/query', { profileRevision: 2, filters: { regionIds: [], accessLevels: [], minimumStayDays: 90 }, destinationIds: ['JP'], page }); assert.equal(unknownStay.data.unassessedCount, 1);
  assert.equal((await f.call('POST', '/map/query', { profileRevision: 2, filters: { ...filters, warm: true }, destinationIds: [], page })).status, 400);
  assert.equal(f.model.calls + f.model.searches + f.providerCalls(), 0);
});

test('group enrichment deduplicates passport pairs, obeys hard cap and quota reserve', async t => {
  const f = await fixture(t, { quota: 22 }), trip = await f.call<TripResource>('POST', '/trips', { ...tripInput, travellers: tripInput.travellers.map(t => ({ ...t, profile: exampleProfile })) });
  const result = await f.done(await f.postJob(`/trips/${trip.data.id}/enrichment`, { tripRevision: 1, destinationIds: ['JP', 'TR', 'SG', 'AU'], travellerIds: ['a', 'b'], maxProviderCalls: 3 }));
  assert.equal(result.status, 'completed'); assert.equal(f.providerCalls(), 2); assert.equal((result.result as { data: { providerCalls: number } }).data.providerCalls, 2); assert.equal((await f.travel.cache.quota()).remaining, 20);
  assert.equal(f.model.calls + f.model.searches, 0);
  assert.equal((await f.call('POST', `/trips/${trip.data.id}/enrichment`, { tripRevision: 1, destinationIds: ['JP'], travellerIds: ['a'], maxProviderCalls: 4 }, { 'Idempotency-Key': randomUUID() })).status, 400);
});

test('research caches exact scopes, keeps source discovery unreviewed, and restricts group fanout', async t => {
  const f = await fixture(t), body = { contextRef: countryRef, question: 'Official links?', refresh: false };
  const first = await f.done(await f.postJob('/research', body)); assert.equal(first.status, 'completed');
  await f.done(await f.postJob('/research', body)); assert.equal(f.model.searches, 1);
  const evidenceId = (first.result as { data: { evidenceIds: string[] } }).data.evidenceIds[0];
  const evidence = await f.call<ReturnType<typeof responses.evidence.parse>>('GET', `/evidence/${evidenceId}`); assert.equal(evidence.data.reviewStatus, 'unreviewed'); assert.equal(evidence.data.excerpt, null);
  assert.equal((await f.call('POST', '/research', { ...body, contextRef: mapRef }, { 'Idempotency-Key': randomUUID() })).status, 422);
  const trip = (await f.call<TripResource>('POST', '/trips', tripInput)).data;
  const ref: ContextRef = { kind: 'group', tripId: trip.id, tripRevision: 1, destinationId: 'JP' };
  assert.equal((await f.call('POST', '/research', { ...body, contextRef: ref }, { 'Idempotency-Key': randomUUID() })).status, 422);
  assert.equal((await f.done(await f.postJob('/research', { ...body, contextRef: ref, travellerId: 'a' }))).status, 'completed'); assert.equal(f.model.searches, 2);
});

test('country research answers visitor-discovery questions without a visa-only warning', async t => {
  const f = await fixture(t), conv = (await f.call<Conversation>('POST', '/conversations', { contextRef: countryRef })).data;
  f.model.searchAnswer = '### Places to consider\n- **Kyoto** — historic temples and gardens.';
  const result = await f.done(await f.postJob(`/conversations/${conv.id}/messages`, {
    ...msg(countryRef, conv.revision), intent: 'research', text: 'What are the tourist places in Japan?',
  }));
  assert.equal(result.status, 'completed');
  const answer = (result.result as { data: Message }).data;
  assert.equal(f.model.searches, 1);
  assert.equal(f.model.calls, 0, 'research-mode chat reuses the browser-search answer instead of issuing a second model request');
  assert.match(f.model.searchPrompts[0], /visitor attractions/i);
  assert.match(f.model.searchPrompts[0], /Do not use Markdown tables/i);
  assert.match(answer.text, /Places to consider/);
  assert.match(answer.warnings.join(' '), /unreviewed web sources/i);
  assert.doesNotMatch(answer.warnings.join(' '), /requirements and admission/i);

  const retry = (await f.call<Conversation>('POST', '/conversations', { contextRef: countryRef })).data;
  const reused = await f.done(await f.postJob(`/conversations/${retry.id}/messages`, {
    ...msg(countryRef, retry.revision), intent: 'research', text: 'What tourist spots should I see in Japan?',
  }));
  assert.equal(reused.status, 'completed');
  assert.equal(f.model.searches, 1, 'a recent same-destination visitor answer avoids another browser request');
  assert.match(((reused.result as { data: Message }).data).warnings.join(' '), /recent source-backed suggestions/i);
});

test('restart preserves idempotency and fails interrupted work without re-dispatch', async t => {
  const f = await fixture(t), owner = Object.keys(f.store.data.sessions)[0], queue = new Jobs(f.store, { concurrency: 0 });
  const key = randomUUID(), b = { arbitrary: 'test' }; await queue.submit(owner, '/test', key, b, 'research', countryRef, async () => { throw new Error('must not dispatch'); });
  const restarted = new AssistantStore(join(f.dir, 'assistant.json')), resumed = await new Jobs(restarted).prior(owner, '/test', key, b);
  assert.equal(resumed?.status, 'failed'); assert.equal(resumed?.error?.code, 'INTERRUPTED');
  await assert.rejects(() => new Jobs(restarted).prior(owner, '/test', key, { changed: true }), ApiError);
  await writeFile(join(f.dir, 'bad.json'), '{broken'); assert.throws(() => new AssistantStore(join(f.dir, 'bad.json')), ApiError);
});

test('job deadlines and per-session budgets return safe failures', async t => {
  const model = new FakeModel(); model.delay = 200;
  const f = await fixture(t, { model, rate: 1, deadlineMs: 20 });
  const j = await f.postJob('/profile/interpret', { text: 'Tourism', expectedRevision: 1 }); const finished = await f.done(j); assert.equal(finished.status, 'failed'); assert.equal(finished.error?.code, 'UPSTREAM_TIMEOUT');
  const rate = await f.call('POST', '/profile/interpret', { text: 'Tourism', expectedRevision: 1 }, { 'Idempotency-Key': randomUUID() }); assert.equal(rate.status, 429); assert.equal(rate.headers.get('retry-after'), '60');
});

test('Groq adapter separates strict JSON from browser tools and accounts before dispatch', async () => {
  const store = new AssistantStore(null), captured: Record<string, unknown>[] = [];
  const groq = new GroqModel(store, { apiKey: 'never-return-this-secret', fetchImpl: async (_url, init) => {
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>; captured.push(body); assert.equal(Object.values(store.data.budgets)[0].calls, captured.length);
    return Response.json({ choices: [{ message: { content: body.tools ? 'Tentative discovery' : JSON.stringify({ text: 'Unknown.', cards: [], claims: [], questions: [], actions: [], warnings: [] }),
      executed_tools: [{ search_results: [{ title: 'Visa', url: 'https://www.mofa.go.jp/j_info/visit/visa/index.html' }] }] } }], usage: { total_tokens: 250 } });
  } });
  await groq.generate(generatedAnswer, 'Explain unknowns.', AbortSignal.timeout(1000)); await groq.search('Locate official sources.', AbortSignal.timeout(1000));
  assert(captured[0].response_format); assert.equal(captured[0].tools, undefined); assert(captured[1].tools); assert.equal(captured[1].response_format, undefined);
  assert.equal(captured[0].model, 'openai/gpt-oss-120b'); assert.equal(captured[1].model, 'openai/gpt-oss-20b');
  assert.equal(Object.values(store.data.budgets)[0].actualTokens, 500);
  const exhausted = new GroqModel(store, { apiKey: 'test', dailyTokens: 0, fetchImpl: async () => { throw new Error('should not dispatch'); } });
  await assert.rejects(exhausted.generate(generatedAnswer, 'Test', AbortSignal.timeout(1000)), (e: unknown) => e instanceof ApiError && e.code === 'BUDGET_EXHAUSTED');
});

test('source adapter rejects prose URLs, opaque citations and private addresses', () => {
  const sources = extractSources({ choices: [{ message: { content: 'https://invented.example 〖2†L6〗', annotations: [{ type: 'url_citation', url: 'https://www.mofa.go.jp/', title: 'Visa' }, { type: 'url_citation', url: 'http://127.0.0.1/private' }] } }] });
  assert.equal(sources.length, 1);
  for (const url of ['http://example.com', 'https://127.0.0.1/', 'https://[::1]/', 'https://localhost/a', 'https://user:pass@example.com/', 'javascript:alert(1)']) assert.equal(safeSourceUrl(url), null);
  assert.equal(extractSources({ choices: [{ message: { content: 'URL: https://example.com' } }] }).length, 0);
});

test('router and generated OpenAPI share all operation paths and runtime request schemas', async () => {
  const a = createAssistantHandler({ store: new AssistantStore(null), model: new FakeModel() });
  assert.deepEqual(a.endpoints.map(r => [r.method, r.path]), operations.map(o => [o[0], o[1]]));
  const spec = JSON.parse(await readFile('docs/api/assistant.openapi.json', 'utf8')) as { openapi: string; paths: Record<string, Record<string, unknown>>; components: { schemas: Record<string, unknown> } };
  assert.equal(spec.openapi, '3.1.0'); assert.equal(Object.values(spec.paths).reduce((n, methods) => n + Object.keys(methods).length, 0), 30);
  for (const [name, schema] of Object.entries(requests)) assert.deepEqual(spec.components.schemas[`Request_${name}`], schema.json);
  for (const [name, schema] of Object.entries(responses)) assert.deepEqual(spec.components.schemas[`Response_${name}`], schema.json);
});

test('all map-action and card variants are executable shared fixtures; arbitrary actions are rejected', () => {
  assert.equal(exampleActions.length, 6); assert.equal(exampleCards.length, 7);
  for (const type of ['run_javascript', 'purchase_treaty', 'navigate_url']) assert.throws(() => mapProposal.parse({ actions: [{ ...exampleActions[0], type }], proposedProfile: null, questions: [], unsupportedConstraints: [] }));
  assert.throws(() => generatedAnswer.parse({ text: 'Unsafe fixture', cards: [{ type: 'source', payload: { evidenceId: 'ev_fixture', url: 'javascript:alert(1)' } }], claims: [], questions: [], actions: [], warnings: [] }));
  const parsed = requests.message.parse({ clientMessageId: randomUUID(), expectedConversationRevision: 0, contextRef: countryRef, intent: 'ask', text: 'Unknowns?' });
  assert.deepEqual(parsed.dataPolicy, { travelBuddy: 'cache_only', research: 'never' });
});

test('grounding rejects fabricated references and never promotes unreviewed prose to required documents', () => {
  const { service } = createAssistantHandler({ store: new AssistantStore(null), model: new FakeModel() });
  const ev: Evidence = { id: 'ev_fixture', sourceType: 'snapshot', url: 'https://example.org/synthetic', title: 'Synthetic evidence fixture', issuer: 'Fixture only', excerpt: 'Synthetic quoted condition.', retrievedAt: null, reviewedAt: null, reviewStatus: 'unreviewed',
    applicability: { passportId: 'IN', destinationId: 'JP', purpose: 'tourism', passportType: 'ordinary', status: 'unresolved' }, effectiveFrom: null, effectiveUntil: null, contentHash: 'synthetic_hash' };
  const answer = generatedAnswer.parse({ text: 'Unverified explanation.', cards: [exampleCards[1]], claims: [{ id: 'claim_fixture', text: 'Synthetic quoted condition.', evidenceIds: [ev.id], support: 'supported' }], questions: [], actions: [], warnings: [] });
  const grounded = service.ground(structuredClone(answer), [ev], countryRef); assert.equal(grounded.claims[0].support, 'partial'); assert.equal(grounded.cards[0].type, 'gap');
  const absent = { ...answer, claims: [{ ...answer.claims[0], evidenceIds: ['ev_invented'] }] }; assert.throws(() => service.ground(absent, [ev], countryRef));
  const conflicting = service.ground(structuredClone(answer), [{ ...ev, reviewStatus: 'conflicting' }], countryRef); assert.equal(conflicting.claims[0].support, 'conflicting');
  const noExcerpt = service.ground(structuredClone(answer), [{ ...ev, excerpt: null }], countryRef); assert.equal(noExcerpt.claims[0].support, 'unknown');
});

test('explanation branches retain exact engine facts, owned snapshots and original transform claims', async t => {
  const f = await fixture(t), conv = (await f.call<Conversation>('POST', '/conversations', { contextRef: countryRef })).data;
  const answer = await f.done(await f.postJob(`/conversations/${conv.id}/messages`, msg())), source = (answer.result as { data: Message }).data;
  const before = (await f.call<ReturnType<typeof responses.countryContext.parse>>('GET', '/countries/JP/context?profileRevision=1')).data.contextHash;
  for (const b of [
    { kind: 'comparison', passportIds: ['IN', 'DE'], destinationIds: ['JP', 'SG'], language: 'en' },
    { kind: 'changes', beforeContextHash: before, afterContextHash: before, language: 'en' },
    { kind: 'simplify', sourceMessageId: source.id, language: 'en' },
    { kind: 'translate', sourceMessageId: source.id, targetLanguage: 'es' },
  ]) { const result = await f.done(await f.postJob('/explanations', b)); assert.equal(result.status, 'completed', JSON.stringify(result.error)); }
  const bad = await f.done(await f.postJob('/explanations', { kind: 'changes', beforeContextHash: 'unowned', afterContextHash: before, language: 'en' })); assert.equal(bad.status, 'failed'); assert.equal(bad.error?.code, 'NOT_FOUND');
  assert.equal(f.providerCalls() + f.model.searches, 0);
});

test('transform validation catches changed numbers and dropped English negations', () => {
  const { service } = createAssistantHandler({ store: new AssistantStore(null), model: new FakeModel() });
  const source: Message = { id: 'msg_fixture', role: 'assistant', text: 'Not valid for stays over 30 days.', cards: [], claims: [], evidenceIds: [], questions: [], actions: [], contextRef: countryRef, contextHash: 'hash', createdAt: new Date().toISOString(), warnings: [] };
  const answer = (text: string) => generatedAnswer.parse({ text, cards: [], claims: [], questions: [], actions: [], warnings: [] });
  assert.throws(() => service.verifyTransform(source, answer('Valid for 90 days.'), true));
  assert.throws(() => service.verifyTransform(source, answer('Valid for stays over 30 days.'), true));
  service.verifyTransform(source, answer('Not valid above 30 days.'), true);
});

test('map pagination is scoped to its filters; group access does not label a visa-required pair as a match', async t => {
  const f = await fixture(t), query = { profileRevision: 1, filters, destinationIds: [], page: { cursor: null, limit: 20 } };
  const first = await f.call<ReturnType<typeof responses.mapResult.parse>>('POST', '/map/query', query); assert.equal(first.data.destinations.length, 20); assert(first.data.nextCursor);
  const second = await f.call<ReturnType<typeof responses.mapResult.parse>>('POST', '/map/query', { ...query, page: { cursor: first.data.nextCursor, limit: 20 } }); assert.equal(second.status, 200); assert(!second.data.destinations.some(d => first.data.destinations.some(a => a.destinationId === d.destinationId)));
  assert.equal((await f.call('POST', '/map/query', { ...query, filters: { regionIds: ['asia'], accessLevels: [] }, page: { cursor: first.data.nextCursor, limit: 20 } })).status, 400);
  const trip = (await f.call<TripResource>('POST', '/trips', { ...tripInput, durationDays: null })).data;
  const group = await f.call<ReturnType<typeof responses.mapResult.parse>>('POST', `/trips/${trip.id}/destinations/query`, { tripRevision: 1, filters, destinationIds: ['US', 'SG'], page });
  assert.equal(group.status, 200, group.raw); const required = group.data.destinations.find(d => d.travellers.some(t => ['visa_required', 'restricted'].includes(t.accessLevel))); assert(required); assert.equal(required.groupAssessment, 'does_not_match');
  assert.equal(f.providerCalls() + f.model.calls + f.model.searches, 0);
});

test('queue saturation, invalid output and unavailable configuration do not dispatch extra calls', async t => {
  const f = await fixture(t), queue = new Jobs(f.store, { concurrency: 0, queueLimit: 1, rate: 100 }), owner = Object.keys(f.store.data.sessions)[0];
  await queue.submit(owner, '/test', randomUUID(), {}, 'research', countryRef, async () => null);
  await assert.rejects(() => queue.submit(owner, '/test', randomUUID(), {}, 'research', countryRef, async () => null), (e: unknown) => e instanceof ApiError && e.code === 'QUEUE_FULL');
  f.model.configured = false;
  assert.equal((await f.call('POST', '/profile/interpret', { expectedRevision: 1, text: 'Tourism' }, { 'Idempotency-Key': randomUUID() })).status, 503);
  const bad = new GroqModel(new AssistantStore(null), { apiKey: 'test', fetchImpl: async () => Response.json({ choices: [{ message: { content: '{invalid' } }] }) });
  await assert.rejects(bad.generate(generatedAnswer, 'Test', AbortSignal.timeout(1000)), (e: unknown) => e instanceof ApiError && e.code === 'INVALID_MODEL_OUTPUT');
});

test('provider rate limits persist a cooldown and prevent repeated dispatches', async () => {
  const store = new AssistantStore(null); let calls = 0;
  const model = new GroqModel(store, { apiKey: 'secret-must-stay-private', fetchImpl: async () => { calls++; return new Response('private upstream failure', { status: 429, headers: { 'retry-after': '120' } }); } });
  for (let i = 0; i < 2; i++) await assert.rejects(model.generate(generatedAnswer, 'Test', AbortSignal.timeout(1000)), (e: unknown) => e instanceof ApiError && e.code === 'RATE_LIMITED' && !e.message.includes('private upstream'));
  assert.equal(calls, 1); assert(store.data.providerCooldownUntil > Date.now() + 100_000);
});

test('saved briefs include selected facts, preserve history after edits, and export without provider calls', async t => {
  const f = await fixture(t);
  const finished = await f.done(await f.postJob('/briefs', { contextRef: mapRef, destinationIds: ['JP', 'SG'], messageIds: [], includeChecklist: true, language: 'en' })); assert.equal(finished.status, 'completed');
  const brief = (finished.result as { data: Brief }).data; assert(brief.sections.some(s => s.title.startsWith('SG')));
  await f.call('PUT', '/profile', { expectedRevision: 1, profile: { ...exampleProfile, passportId: 'DE' } });
  const historical = await f.call<ReturnType<typeof responses.briefRead.parse>>('GET', `/briefs/${brief.id}`); assert.equal(historical.data.staleContext, true); assert.equal(historical.data.contextHash, brief.contextHash);
  const exported = await f.call('GET', `/briefs/${brief.id}/export?format=json`); assert.equal(JSON.parse(exported.raw).staleContext, true);
  assert.equal(f.model.calls + f.model.searches + f.providerCalls(), 0);
});
