import type { IncomingMessage, ServerResponse } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { resolve } from 'node:path';
import { requests, country, id, uuid, regions, type ContextRef } from '../../src/shared/assistant/schemas';
import { ValidationError, type Infer, type Schema } from '../../src/shared/assistant/schema';
import { operations } from '../../src/shared/assistant/operations';
import { responses } from '../../src/shared/assistant/responses';
import { createDefaultTravelService, type TravelService } from '../travel-details';
import { Contexts, regionViewports, type Evidence } from './context';
import { GroqModel, type Model } from './groq';
import { Jobs } from './jobs';
import { AssistantService, type Brief, type Message } from './service';
import { ApiError, AssistantStore, opaque, stamp, hash, type Conversation, type Job, type Session, type TripResource } from './store';

export const BASE = '/api/v1/assistant';
interface RequestContext { owner: string; url: URL; params: Record<string, string>; key: string; request: IncomingMessage; response: ServerResponse }
interface Reply { status?: number; data?: unknown; raw?: string; contentType?: string }
type Endpoint = { method: string; path: string; schema?: Schema; match: RegExp; handler: (c: RequestContext, body: unknown) => Promise<Reply> | Reply };
export interface AssistantOptions { store?: AssistantStore; travel?: TravelService; model?: Model; allowedOrigins?: string[]; jobs?: { rate?: number; deadlineMs?: number; concurrency?: number; queueLimit?: number } }
export function createAssistantHandler(options: AssistantOptions = {}) {
  const store = options.store ?? new AssistantStore(resolve(process.env.ASSISTANT_STORE_DIR ?? '.local/assistant', 'store.json'));
  const contexts = new Contexts(store, options.travel ?? createDefaultTravelService());
  const jobs = new Jobs(store, options.jobs), model = options.model ?? new GroqModel(store), service = new AssistantService(store, jobs, contexts, model);
  const origins = new Set(options.allowedOrigins ?? process.env.ASSISTANT_ALLOWED_ORIGINS?.split(',').map(s => s.trim()) ??
    [5173, 4173, 5184, 8787].flatMap(p => [`http://127.0.0.1:${p}`, `http://localhost:${p}`]));
  const endpoints: Endpoint[] = [];
  const add = <S extends Schema>(method: string, path: string, schema: S | undefined, handler: (c: RequestContext, body: Infer<S>) => Promise<Reply> | Reply) => {
    endpoints.push({ method, path, schema, match: new RegExp(`^${path.replace(/\{(\w+)\}/g, '(?<$1>[A-Za-z0-9_-]+)')}$`), handler: (c, body) => handler(c, body as Infer<S>) });
  };
  const resource = <T>(c: RequestContext, param: string, prefix: string): T => {
    const value = c.params[param]; id.parse(value); if (!value.startsWith(`${prefix}_`)) throw new ApiError(404, 'NOT_FOUND', 'Resource not found.'); return store.get<T>(value, c.owner);
  };
  const revision = (actual: number, expected: number) => { if (actual !== expected) throw new ApiError(409, 'REVISION_CONFLICT', 'Use the current revision.'); };
  const prior = (c: RequestContext, body: unknown) => jobs.prior(c.owner, c.url.pathname, uuid.parse(c.key, 'Idempotency-Key'), body);
  const accepted = (c: RequestContext, job: Job): Reply => { c.response.setHeader('Location', `${BASE}/jobs/${job.id}`); return { status: 202, data: job }; };
  const submit = (c: RequestContext, body: unknown, type: string, ref: ContextRef | null, work: Parameters<Jobs['submit']>[6], accept?: Parameters<Jobs['submit']>[7]) =>
    accepted(c, jobs.submit(c.owner, c.url.pathname, uuid.parse(c.key, 'Idempotency-Key'), body, type, ref, work, accept));
  const query = (c: RequestContext, allowed: string[]) => { for (const key of c.url.searchParams.keys()) if (!allowed.includes(key) || c.url.searchParams.getAll(key).length !== 1) throw new ApiError(400, 'VALIDATION_ERROR', 'Unsupported query parameter.'); };
  const numericQuery = (c: RequestContext, field: string) => { const v = c.url.searchParams.get(field); if (!v || !/^[1-9]\d*$/.test(v)) throw new ApiError(400, 'VALIDATION_ERROR', `Provide ${field}.`); return Number(v); };
  const selection = (ref: ContextRef, ids: string[]) => {
    if (ref.kind === 'country' && ids.some(id => id !== ref.destinationId) || ref.kind === 'group' && ref.destinationId && ids.some(id => id !== ref.destinationId)) throw new ApiError(422, 'INVALID_EVIDENCE_SELECTION', 'Destinations do not match this context.');
  };
  add('GET', '/capabilities', undefined, () => ({ data: {
    model: { configured: model.configured, id: model.model, authenticatedEntitlement: 'not_probed' },
    purposes: ['tourism', 'business', 'conference', 'transit'], regions, regionViewports, actions: ['set_filters', 'focus_region', 'select_country', 'compare_countries', 'suggest_shortlist', 'clear_filters'],
    filters: ['regionIds', 'accessLevels', 'minimumStayDays'], evidenceCoverage: { baseline: 'unreviewed snapshot', reviewedDocumentRules: 0, provider: 'ordinary-passport tourism' },
    features: { map: true, countryChat: model.configured, research: model.configured, groups: true, checklists: 'gaps_and_preparation', briefs: true, heldDocumentEligibility: false },
    limits: { bodyBytes: 32768, messageCharacters: 4000, travellers: 6, shortlist: 10, enrichmentCalls: 3, activeJobs: options.jobs?.concurrency ?? 2, queue: options.jobs?.queueLimit ?? 20, meteredPerMinute: options.jobs?.rate ?? 5 },
  } }));
  add('POST', '/sessions', requests.empty, c => {
    let s: Session;
    try { s = store.session(cookie(c.request)); } catch { s = { sessionId: opaque('session'), csrfToken: opaque('csrf'), expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(), profile: { revision: 0, profile: null, updatedAt: null }, submissions: [] };
      store.mutate(d => { d.sessions[s.sessionId] = s; }); }
    c.response.setHeader('Set-Cookie', `aperiron_session=${s.sessionId}; Path=${BASE}; HttpOnly; SameSite=Strict; Max-Age=604800${process.env.ASSISTANT_COOKIE_SECURE === 'true' ? '; Secure' : ''}`);
    return { status: 201, data: sessionView(s) };
  });
  add('GET', '/sessions/current', undefined, c => ({ data: sessionView(store.session(c.owner)) }));
  add('DELETE', '/sessions/current', undefined, c => {
    for (const [jobId, r] of Object.entries(store.data.jobs)) if (r.owner === c.owner) jobs.cancel(jobId, c.owner);
    store.mutate(d => { delete d.sessions[c.owner]; for (const [id, r] of Object.entries(d.resources)) if (r.owner === c.owner) delete d.resources[id];
      for (const [id, r] of Object.entries(d.jobs)) if (r.owner === c.owner) delete d.jobs[id];
      for (const key of Object.keys(d.idempotency)) if (key.startsWith(`${c.owner}:`)) delete d.idempotency[key]; });
    c.response.setHeader('Set-Cookie', `aperiron_session=; Path=${BASE}; HttpOnly; SameSite=Strict; Max-Age=0`); return { status: 204 };
  });
  add('GET', '/profile', undefined, c => ({ data: store.session(c.owner).profile }));
  add('PUT', '/profile', requests.profilePut, (c, b) => {
    revision(store.session(c.owner).profile.revision, b.expectedRevision); jobs.supersede(c.owner);
    const resource = { revision: b.expectedRevision + 1, profile: b.profile, updatedAt: stamp() };
    store.mutate(d => { d.sessions[c.owner].profile = resource; }); return { data: resource };
  });
  add('POST', '/profile/interpret', requests.profileInterpret, (c, b) => {
    const old = prior(c, b); if (old) return accepted(c, old);
    revision(store.session(c.owner).profile.revision, b.expectedRevision); service.requireModel();
    return submit(c, b, 'profile_proposal', null, signal => service.interpretProfile(c.owner, b, signal));
  });
  add('POST', '/map/interpret', requests.mapInterpret, (c, b) => {
    const old = prior(c, b); if (old) return accepted(c, old);
    contexts.profile(c.owner, b.profileRevision); service.requireModel();
    const ref: ContextRef = { kind: 'map', profileRevision: b.profileRevision, mapRevision: b.mapRevision, selectedCountryIds: b.selectedCountryIds };
    return submit(c, b, 'map_proposal', ref, signal => service.interpretMap(c.owner, b, signal));
  });
  add('POST', '/map/query', requests.mapQuery, (c, b) => ({ data: contexts.query([{ id: 'self', profile: contexts.profile(c.owner, b.profileRevision) }], b.filters, b.destinationIds, b.page) }));
  add('GET', '/countries/{destinationId}/context', undefined, async c => {
    query(c, ['profileRevision']); const destinationId = country.parse(c.params.destinationId), profileRevision = numericQuery(c, 'profileRevision');
    return { data: await contexts.collect(c.owner, { kind: 'country', profileRevision, destinationId }) };
  });
  add('POST', '/conversations', requests.conversation, async (c, b) => {
    const context = await contexts.collect(c.owner, b.contextRef); contexts.assert(c.owner, b.contextRef);
    const conversation: Conversation = { id: opaque('conv'), revision: 0, contextRef: b.contextRef, contextHash: context.contextHash, messageIds: [], activeJobId: null, createdAt: stamp() };
    store.put(conversation.id, c.owner, conversation); return { status: 201, data: conversation };
  });
  add('GET', '/conversations/{conversationId}', undefined, c => {
    query(c, ['cursor', 'limit']); const conversation = resource<Conversation>(c, 'conversationId', 'conv');
    const limit = c.url.searchParams.get('limit') ?? '20'; if (!/^[1-9]\d*$/.test(limit) || +limit > 50) throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid page limit.');
    let offset = 0; const cursor = c.url.searchParams.get('cursor');
    if (cursor) { try { const value = JSON.parse(Buffer.from(cursor, 'base64url').toString()) as { id: string; offset: number }; if (value.id !== conversation.id || !Number.isSafeInteger(value.offset) || value.offset < 0) throw new Error(); offset = value.offset; } catch { throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid message cursor.'); } }
    let historical = false; try { contexts.assert(c.owner, conversation.contextRef); } catch { historical = true; }
    return { data: { ...conversation, historical, messages: conversation.messageIds.slice(offset, offset + +limit).map(id => store.get<Message>(id, c.owner)),
      nextCursor: offset + +limit < conversation.messageIds.length ? Buffer.from(JSON.stringify({ id: conversation.id, offset: offset + +limit })).toString('base64url') : null } };
  });
  add('POST', '/conversations/{conversationId}/messages', requests.message, (c, b) => {
    const old = prior(c, b); if (old) return accepted(c, old);
    const conv = resource<Conversation>(c, 'conversationId', 'conv'), clientKey = `client_${hash([c.owner, conv.id, b.clientMessageId])}`;
    const duplicate = store.data.resources[clientKey]?.value as { hash: string; jobId: string } | undefined;
    if (duplicate) { if (duplicate.hash !== hash(b)) throw new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'Client message ID was reused with different content.'); return accepted(c, jobs.get(duplicate.jobId, c.owner)); }
    contexts.assert(c.owner, b.contextRef); if (hash(conv.contextRef) !== hash(b.contextRef)) throw new ApiError(409, 'CONTEXT_CHANGED', 'Start a conversation for this context.');
    if (conv.activeJobId && ['queued', 'running'].includes(store.data.jobs[conv.activeJobId]?.value.status)) throw new ApiError(409, 'CONVERSATION_BUSY', 'Wait for the current conversation answer.');
    revision(conv.revision, b.expectedConversationRevision); if (b.intent !== 'checklist') service.requireModel();
    if (conv.messageIds.length >= 200) throw new ApiError(429, 'RATE_LIMITED', 'Start a new conversation; this history is full.');
    if ('sourceMessageId' in b) { const source = service.sourceMessage(c.owner, b.sourceMessageId); if (source.role !== 'assistant' || hash(source.contextRef) !== hash(b.contextRef)) throw new ApiError(422, 'INVALID_EVIDENCE_SELECTION', 'Select a source answer in this context.'); }
    return submit(c, b, 'message', b.contextRef, (signal, stage) => service.message(c.owner, conv.id, b, signal, stage), (d, job) => {
      const message: Message = { id: opaque('msg'), role: 'user', text: b.text ?? b.intent, cards: [], claims: [], evidenceIds: [], questions: [], actions: [], contextRef: b.contextRef, contextHash: conv.contextHash, createdAt: stamp(), warnings: [] };
      const expires = Date.parse(d.sessions[c.owner].expiresAt);
      d.resources[message.id] = { owner: c.owner, value: message, expires };
      d.resources[clientKey] = { owner: c.owner, value: { hash: hash(b), jobId: job.id }, expires };
      const saved = d.resources[conv.id].value as Conversation; saved.revision++; saved.messageIds.push(message.id); saved.activeJobId = job.id;
    });
  });
  add('POST', '/research', requests.research, (c, b) => {
    const old = prior(c, b); if (old) return accepted(c, old);
    contexts.assert(c.owner, b.contextRef); service.requireModel();
    if (b.contextRef.kind === 'map' || b.contextRef.kind === 'group' && (!b.contextRef.destinationId || !('travellerId' in b) || !contexts.trip(c.owner, b.contextRef.tripId).trip.travellers.some(t => t.id === b.travellerId))) throw new ApiError(422, 'UNSUPPORTED_CONTEXT', 'Research requires one country and a valid group traveller.');
    return submit(c, b, 'research', b.contextRef, (signal, stage) => service.research(c.owner, b.contextRef, b.question, b.refresh, 'travellerId' in b ? b.travellerId : undefined, signal, stage));
  });
  add('GET', '/evidence/{evidenceId}', undefined, c => ({ data: resource<Evidence>(c, 'evidenceId', 'ev') }));
  add('GET', '/jobs/{jobId}', undefined, c => ({ data: jobs.get(c.params.jobId, c.owner) }));
  add('DELETE', '/jobs/{jobId}', undefined, c => { jobs.cancel(c.params.jobId, c.owner); return { status: 204 }; });
  add('POST', '/explanations', requests.explanation, (c, b) => {
    const old = prior(c, b); if (old) return accepted(c, old); service.requireModel();
    return submit(c, b, 'explanation', null, signal => service.explanation(c.owner, b, signal));
  });
  add('POST', '/trips', requests.trip, (c, b) => {
    const trip: TripResource = { id: opaque('trip'), revision: 1, trip: b, createdAt: stamp(), updatedAt: stamp() }; store.put(trip.id, c.owner, trip); return { status: 201, data: trip };
  });
  add('GET', '/trips/{tripId}', undefined, c => ({ data: resource<TripResource>(c, 'tripId', 'trip') }));
  add('PUT', '/trips/{tripId}', requests.tripPut, (c, b) => {
    const current = resource<TripResource>(c, 'tripId', 'trip'); revision(current.revision, b.expectedRevision); jobs.supersede(c.owner, current.id);
    const trip = { ...current, trip: b.trip, revision: current.revision + 1, updatedAt: stamp() }; store.put(current.id, c.owner, trip); return { data: trip };
  });
  add('DELETE', '/trips/{tripId}', undefined, c => { const trip = resource<TripResource>(c, 'tripId', 'trip'); jobs.supersede(c.owner, trip.id); store.remove(trip.id, c.owner); return { status: 204 }; });
  add('POST', '/trips/{tripId}/destinations/query', requests.groupQuery, (c, b) => {
    const t = contexts.trip(c.owner, c.params.tripId, b.tripRevision);
    return { data: contexts.query(t.trip.travellers.map((person, i) => ({ id: person.id, profile: contexts.groupProfile(t, i) })), b.filters, b.destinationIds, b.page) };
  });
  add('GET', '/trips/{tripId}/countries/{destinationId}/context', undefined, async c => {
    query(c, ['tripRevision']); const tripRevision = numericQuery(c, 'tripRevision'), destinationId = country.parse(c.params.destinationId);
    return { data: await contexts.collect(c.owner, { kind: 'group', tripId: c.params.tripId, tripRevision, destinationId }) };
  });
  add('POST', '/trips/{tripId}/enrichment', requests.enrichment, (c, b) => {
    const old = prior(c, b); if (old) return accepted(c, old); const t = contexts.trip(c.owner, c.params.tripId, b.tripRevision);
    if (b.travellerIds.some(id => !t.trip.travellers.some(t => t.id === id))) throw new ApiError(400, 'VALIDATION_ERROR', 'Unknown traveller.');
    const ref: ContextRef = { kind: 'group', tripId: t.id, tripRevision: b.tripRevision, destinationId: null };
    return submit(c, b, 'enrichment', ref, (signal, stage) => service.enrich(c.owner, t.id, b, signal, stage));
  });
  add('POST', '/checklists', requests.checklist, (c, b) => {
    const old = prior(c, b); if (old) return accepted(c, old); contexts.assert(c.owner, b.contextRef); selection(b.contextRef, b.destinationIds);
    return submit(c, b, 'checklist', b.contextRef, async () => contexts.checklist(c.owner, b.contextRef, b.destinationIds));
  });
  add('POST', '/briefs', requests.brief, (c, b) => {
    const old = prior(c, b); if (old) return accepted(c, old); contexts.assert(c.owner, b.contextRef); selection(b.contextRef, b.destinationIds);
    return submit(c, b, 'brief', b.contextRef, signal => service.brief(c.owner, b, signal));
  });
  add('GET', '/briefs/{briefId}', undefined, c => {
    const b = resource<Brief>(c, 'briefId', 'brief'); let staleContext = false; try { contexts.assert(c.owner, b.contextRef); } catch { staleContext = true; }
    return { data: { ...b, staleContext } };
  });
  add('GET', '/briefs/{briefId}/export', undefined, c => {
    query(c, ['format']); const b = resource<Brief>(c, 'briefId', 'brief'), format = c.url.searchParams.get('format');
    if (format !== 'markdown' && format !== 'json') throw new ApiError(400, 'VALIDATION_ERROR', 'Format must be markdown or json.');
    const evidence = b.evidenceIds.map(id => { try { return store.get<Evidence>(id, c.owner); } catch { return { id, unavailable: true }; } });
    let staleContext = false; try { contexts.assert(c.owner, b.contextRef); } catch { staleContext = true; }
    c.response.setHeader('Content-Disposition', `attachment; filename="${b.id}.${format === 'json' ? 'json' : 'md'}"`);
    const escape = (s: string) => s.replace(/[<>&\[\]`*_#]/g, c => `\\${c}`);
    return { raw: format === 'json' ? JSON.stringify({ ...b, staleContext, evidence }, null, 2) :
      `# Travel brief\n\nCreated: ${b.createdAt}\n\nStale context: ${staleContext}\n\n${b.sections.map(s => `## ${escape(s.title)}\n\n${escape(s.text)}`).join('\n\n')}\n\n## Gaps\n\n${b.gaps.map(escape).join('\n\n')}\n\n## Evidence and provenance\n\n${escape(JSON.stringify(evidence, null, 2))}\n\n## Preparation\n\n${escape(JSON.stringify(b.checklist, null, 2))}`,
      contentType: format === 'json' ? 'application/json' : 'text/markdown; charset=utf-8' };
  });
  add('DELETE', '/briefs/{briefId}', undefined, c => { const b = resource<Brief>(c, 'briefId', 'brief'); store.remove(b.id, c.owner); return { status: 204 }; });

  let lastPurge = 0;
  const handler = async (request: IncomingMessage, response: ServerResponse) => {
    const requestId = opaque('req'); response.setHeader('Cache-Control', 'no-store'); response.setHeader('X-Content-Type-Options', 'nosniff');
    const send = (status: number, value: unknown) => { response.writeHead(status, { 'Content-Type': 'application/json' }); response.end(JSON.stringify(value)); };
    try {
      const url = new URL(request.url ?? '/', 'http://localhost'), path = url.pathname.slice(BASE.length), origin = request.headers.origin;
      if (origin && !origins.has(origin)) throw new ApiError(403, 'ORIGIN_REJECTED', 'Origin is not configured for this local API.');
      if (origin) { response.setHeader('Access-Control-Allow-Origin', origin); response.setHeader('Access-Control-Allow-Credentials', 'true'); response.setHeader('Access-Control-Expose-Headers', 'Location, Retry-After'); response.setHeader('Vary', 'Origin'); }
      if (request.method === 'OPTIONS') {
        if (!origin) throw new ApiError(403, 'ORIGIN_REJECTED', 'Origin required.');
        response.writeHead(204, { 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE', 'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token, Idempotency-Key' }); response.end(); return;
      }
      const route = endpoints.find(r => r.method === request.method && r.match.test(path));
      if (!route) throw new ApiError(404, 'NOT_FOUND', 'Endpoint not found.');
      if (Date.now() - lastPurge > 60_000) { store.purge(); lastPurge = Date.now(); }
      const bootstrap = path === '/sessions' && request.method === 'POST', publicRead = path === '/capabilities' && request.method === 'GET';
      const session = bootstrap || publicRead ? null : store.session(cookie(request));
      if (!['GET', 'HEAD'].includes(request.method ?? '')) {
        if (!origin) throw new ApiError(403, 'ORIGIN_REJECTED', 'An allowed Origin is required.');
        if (!bootstrap && (!session || !equal(request.headers['x-csrf-token'], session.csrfToken))) throw new ApiError(403, 'CSRF_REJECTED', 'Invalid CSRF token.');
      }
      let body: unknown;
      if (route.schema) {
        if (!request.headers['content-type']?.startsWith('application/json')) throw new ApiError(400, 'VALIDATION_ERROR', 'Content-Type must be application/json.');
        const chunks: Buffer[] = []; let bytes = 0;
        for await (const chunk of request) { bytes += chunk.length; if (bytes > 32768) throw new ApiError(413, 'BODY_TOO_LARGE', 'JSON body exceeds 32 KiB.'); chunks.push(Buffer.from(chunk)); }
        try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new ApiError(400, 'INVALID_JSON', 'Invalid JSON.'); }
        body = route.schema.parse(body);
      }
      const c: RequestContext = { owner: session?.sessionId ?? '', url, params: route.match.exec(path)?.groups ?? {}, key: typeof request.headers['idempotency-key'] === 'string' ? request.headers['idempotency-key'] : '', request, response };
      const reply = await route.handler(c, body);
      if (reply.status === 204) { response.writeHead(204); response.end(); }
      else if (reply.raw !== undefined) { response.writeHead(reply.status ?? 200, { 'Content-Type': reply.contentType ?? 'text/plain' }); response.end(reply.raw); }
      else {
        const output = operations.find(o => o[0] === route.method && o[1] === route.path)?.[3];
        if (output) { try { responses[output].parse(reply.data); } catch { throw new ApiError(503, 'SERVICE_UNAVAILABLE', 'Assistant response failed contract validation.'); } }
        send(reply.status ?? 200, { data: reply.data, meta: { requestId, schemaVersion: '1', generatedAt: stamp() } });
      }
    } catch (error) {
      const e = error instanceof ApiError ? error : error instanceof ValidationError ? new ApiError(400, 'VALIDATION_ERROR', error.message) : new ApiError(503, 'SERVICE_UNAVAILABLE', 'Assistant service is unavailable.');
      if (e.status === 429) response.setHeader('Retry-After', '60');
      send(e.status, { error: { code: e.code, message: e.message, retryable: e.retryable, fieldErrors: error instanceof ValidationError ? error.fieldErrors : [] }, meta: { requestId, schemaVersion: '1' } });
    }
  };
  return { handler, endpoints, service, store, jobs };
}
function equal(value: string | string[] | undefined, expected: string) { if (typeof value !== 'string') return false; const a = Buffer.from(value), b = Buffer.from(expected); return a.length === b.length && timingSafeEqual(a, b); }
function cookie(req: IncomingMessage) { return req.headers.cookie?.split(';').map(s => s.trim()).find(s => s.startsWith('aperiron_session='))?.slice('aperiron_session='.length); }
function sessionView(s: Session) { return { sessionId: s.sessionId, csrfToken: s.csrfToken, expiresAt: s.expiresAt }; }
