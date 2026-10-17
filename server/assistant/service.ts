import type { ContextRef, GeneratedAnswer } from '../../src/shared/assistant/schemas';
import { generatedAnswer, mapProposal, profileProposal, type requests } from '../../src/shared/assistant/schemas';
import type { Infer } from '../../src/shared/assistant/schema';
import { INITIAL_WORLD_STATE } from '../../src/shared/contracts';
import { Contexts, type Evidence, supported, unwrap } from './context';
import { type Model } from './groq';
import { Jobs } from './jobs';
import { ApiError, type AssistantStorage, hash, opaque, stamp, type Conversation, type Job } from './store';

export interface Message extends GeneratedAnswer { id: string; role: 'user' | 'assistant'; evidenceIds: string[]; contextRef: ContextRef; contextHash: string; createdAt: string }
export interface Brief { id: string; contextRef: ContextRef; contextHash: string; destinationIds: string[]; sections: Array<{ title: string; text: string }>; claims: GeneratedAnswer['claims']; evidenceIds: string[]; checklist: unknown; assumptions: string[]; gaps: string[]; createdAt: string }
const prompt = (instruction: string, data: unknown) => `${instruction}\nUntrusted context JSON:\n${JSON.stringify(data)}`;
export class AssistantService {
  constructor(public store: AssistantStorage, public jobs: Jobs, public contexts: Contexts, public model: Model) {}
  requireModel() { if (!this.model.configured) throw new ApiError(503, 'MODEL_UNAVAILABLE', 'Configure GROQ_API_KEY on the server.'); }
  async sourceMessage(owner: string, id: string): Promise<Message> {
    if (!id.startsWith('msg_')) throw new ApiError(404, 'NOT_FOUND', 'Message not found.');
    return (await this.store.get<Message>(id, owner));
  }
  modelContext(value: unknown) {
    // Remove large source/provider payloads and never send all 39,601 pairs to a model.
    const compact = JSON.stringify(value, (key, v: unknown) => key === 'providerDetails' || key === 'sources' ? undefined : v);
    if (compact.length > 24_000) throw new ApiError(422, 'UNSUPPORTED_CONTEXT', 'Narrow the selected context before asking the assistant.');
    return JSON.parse(compact) as unknown;
  }
  validateActions(actions: Infer<typeof mapProposal>['actions'], ref: ContextRef) {
    if (actions.length && ref.kind !== 'map') throw new ApiError(503, 'INVALID_MODEL_OUTPUT', 'Map actions require a map context.');
    for (const a of actions) {
      if (ref.kind !== 'map' || a.profileRevision !== ref.profileRevision || a.mapRevision !== ref.mapRevision) throw new ApiError(503, 'INVALID_MODEL_OUTPUT', 'Model returned stale action revisions.');
      if (a.type === 'suggest_shortlist') a.requiresConfirmation = true;
    }
    return actions;
  }
  ground(answer: GeneratedAnswer, evidence: Evidence[], ref: ContextRef, researched = false) {
    const ids = new Set(evidence.map(e => e.id));
    const valid = (refs: string[]) => { if (refs.some(id => !ids.has(id))) throw new ApiError(503, 'INVALID_MODEL_OUTPUT', 'Model referred to unavailable evidence.'); };
    for (const c of answer.claims) {
      valid(c.evidenceIds);
      const sources = evidence.filter(e => c.evidenceIds.includes(e.id));
      // Exact source quotations can be supported; IDs alone cannot establish semantic support.
      c.support = sources.some(e => e.reviewStatus === 'conflicting') ? 'conflicting' :
        sources.some(e => e.reviewStatus === 'reviewed_supported' && e.applicability.status === 'applicable' && e.excerpt?.includes(c.text)) ? 'supported' : sources.some(e => e.excerpt?.includes(c.text)) ? 'partial' : 'unknown';
    }
    answer.cards = answer.cards.map(c => {
      if ('evidenceIds' in c.payload) valid(c.payload.evidenceIds);
      if (c.type === 'source') valid([c.payload.evidenceId]);
      if (c.type === 'requirement' && !c.payload.evidenceIds.some(id => evidence.some(e => e.id === id && e.reviewStatus === 'reviewed_supported' && e.applicability.status === 'applicable' && e.excerpt?.includes(c.payload.title))))
        return { type: 'gap' as const, payload: { text: 'This proposed requirement needs an applicable reviewed source.' } };
      if (c.type === 'checklist') return { type: 'gap' as const, payload: { text: 'Request a sourced checklist separately.' } };
      return c;
    });
    answer.actions = this.validateActions(answer.actions, ref);
    answer.warnings = [...new Set([...answer.warnings, researched
      ? 'AI summary based on unreviewed web sources. Check the linked sources for current visitor details.'
      : 'AI explanation of unreviewed evidence; requirements and admission are not confirmed.'])];
    return answer;
  }
  async research(owner: string, ref: ContextRef, question: string, refresh: boolean, travellerId: string | undefined, signal: AbortSignal, stage: (s: Job['stage']) => Promise<void>) {
    (await this.contexts.assert(owner, ref));
    if (ref.kind === 'map' || (ref.kind === 'group' && (!ref.destinationId || !travellerId))) throw new ApiError(422, 'UNSUPPORTED_CONTEXT', 'Research requires one destination and, for a group, one traveller.');
    const profile = ref.kind === 'country' ? (await this.contexts.profile(owner, ref.profileRevision)) : (await (async () => {
      const t = (await this.contexts.trip(owner, ref.tripId, ref.tripRevision)), i = t.trip.travellers.findIndex(t => t.id === travellerId);
      if (i < 0) throw new ApiError(400, 'VALIDATION_ERROR', 'Unknown traveller.'); return this.contexts.groupProfile(t, i);
    })());
    const key = `research_${hash([owner, ref, profile, question.trim().toLowerCase(), this.model.model])}`;
    const saved = (await this.store.read()).resources[key];
    if (!refresh && saved && saved.expires > Date.now()) return (await this.store.get<ResearchResult>(key, owner));
    (await stage('researching')); const found = await this.model.search(prompt('Research the user\'s exact question about this traveller and destination. Do not collect identity numbers. For visitor attractions, culture, or local experiences, prefer official tourism, venue, national-park, museum, or cultural-site sources. If the user asks for places to visit, return a short Markdown heading and a scannable list of named suggestions with one reason each. For entry questions, prefer official immigration, foreign-affairs, embassy, or consular sources. Do not present an attraction search as visa guidance.', { profile, destinationId: ref.destinationId, question }), signal);
    signal.throwIfAborted(); (await this.contexts.assert(owner, ref));
    const evidence = (await Promise.all(found.sources.map(async source => (await this.contexts.saveEvidence(owner, {
      sourceType: 'third_party_page', url: source.url, title: source.title || new URL(source.url).hostname, issuer: null, excerpt: source.excerpt,
      retrievedAt: stamp(), reviewedAt: null, reviewStatus: 'unreviewed', applicability: { passportId: profile.passportId, destinationId: ref.destinationId!, purpose: profile.purpose, passportType: profile.passportType, status: 'unresolved' }, effectiveFrom: null, effectiveUntil: null,
    })))));
    const result: ResearchResult = { contextRef: ref, answer: found.text, claims: [], evidenceIds: evidence.map(e => e.id), gaps: evidence.length ? ['Discovered sources need authority and traveller-applicability review.', ...(!evidence.some(e => e.excerpt) ? ['Provider supplied source metadata without page excerpts; factual support has not been established.'] : [])] : ['Search returned no usable citation metadata.'],
      conflicts: [], retrievedAt: stamp(), warnings: ['Unreviewed research; do not treat prose as confirmed requirements.'], usage: found.usage };
    (await this.store.put(key, owner, result));
    (await this.store.mutate(d => { d.resources[key].expires = Math.min(d.resources[key].expires, Date.now() + 86_400_000); }));
    return result;
  }
  async interpretProfile(owner: string, body: Infer<typeof requests.profileInterpret>, signal: AbortSignal) {
    const current = (await this.store.session(owner)).profile;
    const result = await this.model.generate(profileProposal, prompt('Propose an editable traveller profile. Never guess citizenship from residence. Missing passport means proposedProfile null. Dates must be unambiguous; ask questions otherwise. Do not apply changes.', { text: body.text, current }), signal);
    signal.throwIfAborted(); if ((await this.store.session(owner)).profile.revision !== body.expectedRevision) throw new ApiError(409, 'CONTEXT_CHANGED', 'Profile changed.'); return result;
  }
  async interpretMap(owner: string, body: Infer<typeof requests.mapInterpret>, signal: AbortSignal) {
    const ref: ContextRef = { kind: 'map', profileRevision: body.profileRevision, mapRevision: body.mapRevision, selectedCountryIds: body.selectedCountryIds };
    const profile = (await this.contexts.profile(owner, body.profileRevision));
    const result = await this.model.generate(mapProposal, prompt('Return only allowlisted map action proposals. Echo mapRevision and profileRevision exactly. Use continent region IDs. Warm weather, cheap destinations, flights and guaranteed access are unsupported. Any profile proposal needs confirmation.', { ...body, profile }), signal);
    signal.throwIfAborted(); (await this.contexts.assert(owner, ref)); result.actions = this.validateActions(result.actions, ref); return result;
  }
  async message(owner: string, conversationId: string, body: Infer<typeof requests.message>, signal: AbortSignal, stage: (s: Job['stage']) => Promise<void>) {
    const ref = body.contextRef;
    if (body.dataPolicy.travelBuddy === 'refresh_if_stale' && ref.kind === 'country') {
      (await stage('refreshing_details')); const p = (await this.contexts.profile(owner, ref.profileRevision));
      if (supported(p)) await this.contexts.travel.refresh({ passportId: p.passportId, destinationId: ref.destinationId, purpose: p.purpose, passportType: p.passportType }); signal.throwIfAborted();
    }
    let context = await this.contexts.collect(owner, ref);
    const research = (body.intent === 'research' || body.dataPolicy.research === 'if_gap' && context.gaps.length > 0) && ref.kind === 'country'
      ? await this.research(owner, ref, body.text ?? 'Find official sources for unresolved requirements', false, undefined, signal, stage) : null;
    if (research) context = await this.contexts.collect(owner, ref);
    const researchEvidence = (await Promise.all((research?.evidenceIds ?? []).map(async id => (await this.store.get<Evidence>(id, owner))))) ?? [];
    const evidence = [...context.evidence, ...researchEvidence];
    const conversation = (await this.store.get<Conversation>(conversationId, owner));
    const history = (await Promise.all(conversation.messageIds.slice(-6).map(async id => (await this.store.get<Message>(id, owner))))).map(m => ({ role: m.role, text: m.text.slice(0, 1500) }));
    const source = 'sourceMessageId' in body ? (await this.sourceMessage(owner, body.sourceMessageId)) : null;
    if (source && (hash(source.contextRef) !== hash(ref) || source.role !== 'assistant')) throw new ApiError(422, 'INVALID_EVIDENCE_SELECTION', 'Select an assistant message in this context.');
    if (source) for (const id of source.evidenceIds) if (!evidence.some(e => e.id === id)) evidence.push((await this.store.get<Evidence>(id, owner)));
    const cacheKey = `answer_${hash([owner, this.model.model, 'v1', ref, context.contextHash, body.intent, body.text, research?.retrievedAt, source?.id, 'targetLanguage' in body ? body.targetLanguage : null, history])}`;
    let answer: GeneratedAnswer;
    if (body.intent === 'checklist') {
      const ids = ref.kind === 'country' ? [ref.destinationId] : ref.kind === 'map' ? ref.selectedCountryIds : ref.destinationId ? [ref.destinationId] : (await this.contexts.trip(owner, ref.tripId)).trip.shortlistCountryIds;
      const checklist = (await this.contexts.checklist(owner, ref, ids));
      answer = { text: checklist.gaps.join('\n'), cards: checklist.gaps.map(text => ({ type: 'gap', payload: { text } })), claims: [], questions: [], actions: [], warnings: ['No reviewed requirement checklist is available.'] };
    } else if (research && body.intent === 'research') {
      // Browser search already returns the requested visitor answer. Reusing it
      // avoids a second strict-JSON model call that can fail after a successful
      // search and makes destination discovery fit the job deadline.
      answer = this.ground({ text: research.answer.slice(0, 8_000), cards: [], claims: [], questions: [], actions: [], warnings: [] }, evidence, ref, true);
    } else {
      const cached = (await this.store.read()).resources[cacheKey];
      (await stage('generating')); answer = cached && cached.expires > Date.now() ? (await this.store.get<GeneratedAnswer>(cacheKey, owner)) : await this.model.generate(generatedAnswer,
        prompt(research
          ? 'Answer the user\'s exact question directly from the supplied research and evidence. For questions about places, attractions, activities, or local experiences, use a short heading and a scannable bullet list of named suggestions with one plain-language reason each. Keep entry requirements out unless asked. Do not assert generated facts as confirmed: every factual claim needs exact supplied evidence IDs or unknown support. Map actions only for map context.'
          : 'Explain the supplied facts and gaps, preserving provenance and conditions. Do not assert generated facts as confirmed. Every factual claim needs exact supplied evidence IDs or unknown support. Map actions only for map context. For simplify/translate preserve the original claims, numbers, negations and conditions; no new facts.', this.modelContext({ context, evidence, research, history, source, request: body })), signal);
      if (source) this.verifyTransform(source, answer, body.intent === 'simplify');
      answer = this.ground(answer, evidence, ref, research !== null);
      signal.throwIfAborted(); (await this.contexts.assert(owner, ref)); (await this.store.put(cacheKey, owner, answer));
    }
    (await stage('validating')); signal.throwIfAborted(); (await this.contexts.assert(owner, ref));
    if (body.dataPolicy.travelBuddy === 'refresh_if_stale' && ref.kind !== 'country') answer.cards.push({ type: 'gap', payload: { text: 'Use explicit bounded group enrichment for selected pairs; map chat does not refresh destinations.' } });
    if ((body.intent === 'research' || body.dataPolicy.research === 'if_gap') && ref.kind !== 'country') answer.cards.push({ type: 'gap', payload: { text: 'Research needs one destination and, for a group, a selected traveller through the research endpoint.' } });
    const message: Message = { ...answer, id: opaque('msg'), role: 'assistant', evidenceIds: evidence.map(e => e.id), contextRef: ref, contextHash: context.contextHash, createdAt: stamp() };
    (await this.store.mutate(d => {
      if (signal.aborted || !d.sessions[owner]) return;
      d.resources[message.id] = { owner, value: message, expires: Date.parse(d.sessions[owner].expiresAt) };
      (d.resources[conversationId].value as Conversation).messageIds.push(message.id);
    })); return message;
  }
  verifyTransform(source: Message, answer: GeneratedAnswer, simplify = false) {
    const numbers = (text: string) => text.match(/\b\d+(?:[.,]\d+)*\b/g)?.sort().join('|') ?? '';
    if (numbers(source.text) !== numbers(answer.text)) throw new ApiError(503, 'INVALID_MODEL_OUTPUT', 'Transformation changed numerical facts.');
    if (simplify && /\b(no|not|never|without|cannot)\b/i.test(source.text) !== /\b(no|not|never|without|cannot)\b/i.test(answer.text)) throw new ApiError(503, 'INVALID_MODEL_OUTPUT', 'Simplification changed a negation.');
    // Keep immutable original claims rather than accepting rewritten factual assertions.
    answer.claims = structuredClone(source.claims); answer.warnings.push('Read alongside the original answer; translation has not been professionally reviewed.');
  }
  async explanation(owner: string, body: Infer<typeof requests.explanation>, signal: AbortSignal) {
    let facts: unknown, source: Message | null = null;
    switch (body.kind) {
      case 'comparison': { const comparison = unwrap(this.contexts.engine.comparePassports(body.passportIds[0], body.passportIds[1], INITIAL_WORLD_STATE));
        facts = { ...comparison, differences: comparison.differences.filter(d => !body.destinationIds.length || body.destinationIds.includes(d.destinationId)) }; break; }
      case 'dna': { const dna = unwrap(this.contexts.engine.generateVisaDNA(body.passportId, INITIAL_WORLD_STATE)); facts = { hash: dna.hash, summary: dna.summary, length: dna.vector.length, passportId: dna.passportId }; break; }
      case 'changes': { const before = (await this.store.get<{ contextRef: ContextRef; data: unknown }>(`ctx_${body.beforeContextHash}`, owner)), after = (await this.store.get<typeof before>(`ctx_${body.afterContextHash}`, owner));
        if (before.contextRef.kind !== after.contextRef.kind || before.contextRef.kind === 'country' && after.contextRef.kind === 'country' && before.contextRef.destinationId !== after.contextRef.destinationId) throw new ApiError(422, 'UNSUPPORTED_CONTEXT', 'Selected snapshots are not comparable.');
        facts = { before, after, changed: hash(before.data) !== hash(after.data) }; break; }
      case 'translate': case 'simplify': source = (await this.sourceMessage(owner, body.sourceMessageId)); if (source.role !== 'assistant') throw new ApiError(422, 'INVALID_EVIDENCE_SELECTION', 'Select an assistant answer.'); facts = source; break;
    }
    const answer = await this.model.generate(generatedAnswer, prompt('Explain only immutable supplied facts. No browser search. No map actions. For transforms preserve all numbers, conditions and negations. Evidence references must be preserved; no new facts.', this.modelContext({ request: body, facts })), signal);
    if (source) this.verifyTransform(source, answer, body.kind === 'simplify');
    if (answer.actions.length) throw new ApiError(503, 'INVALID_MODEL_OUTPUT', 'Explanations cannot issue map actions.');
    const refs = source?.evidenceIds ?? [];
    for (const c of answer.claims) { if (c.evidenceIds.some(id => !refs.includes(id))) throw new ApiError(503, 'INVALID_MODEL_OUTPUT', 'Unknown explanation evidence.'); c.support = 'unknown'; }
    signal.throwIfAborted();
    return { kind: body.kind, facts, ...answer, warnings: [...answer.warnings, 'Explanation is unreviewed; underlying engine facts are retained separately.'] };
  }
  async enrich(owner: string, tripId: string, body: Infer<typeof requests.enrichment>, signal: AbortSignal, stage: (s: Job['stage']) => Promise<void>) {
    const t = (await this.contexts.trip(owner, tripId, body.tripRevision)), pairs = new Set<string>(), outcomes: unknown[] = []; let attemptedCalls = 0, providerCalls = 0;
    if (body.travellerIds.some(id => !t.trip.travellers.some(t => t.id === id))) throw new ApiError(400, 'VALIDATION_ERROR', 'Unknown traveller.');
    (await stage('refreshing_details'));
    for (const travellerId of body.travellerIds) for (const destinationId of body.destinationIds) {
      signal.throwIfAborted(); (await this.contexts.trip(owner, tripId, body.tripRevision));
      const p = this.contexts.groupProfile(t, t.trip.travellers.findIndex(t => t.id === travellerId)), key = `${p.passportId}:${destinationId}:${p.purpose}:${p.passportType}`;
      if (pairs.has(key)) { outcomes.push({ travellerId, destinationId, outcome: 'deduplicated' }); continue; } pairs.add(key);
      const request = { passportId: p.passportId, destinationId, purpose: p.purpose, passportType: p.passportType };
      if (!supported(p)) { outcomes.push({ key, outcome: 'unsupported' }); continue; }
      const cached = await this.contexts.travel.read(request);
      if (cached.fresh || cached.outcome === 'unsupported') { outcomes.push({ key, ...cached }); continue; }
      if (attemptedCalls >= body.maxProviderCalls) { outcomes.push({ key, outcome: 'skipped_budget' }); continue; }
      attemptedCalls++; const result = await this.contexts.travel.refresh(request, false, () => { providerCalls++; }); outcomes.push({ key, ...result });
    }
    signal.throwIfAborted(); (await this.contexts.trip(owner, tripId, body.tripRevision));
    return { outcomes, refreshAttempts: attemptedCalls, providerCalls, maxProviderCalls: body.maxProviderCalls, warnings: ['Refresh attempts can reuse in-flight work or stop at the provider quota. providerCalls counts dispatches started by this job.'] };
  }
  async brief(owner: string, body: Infer<typeof requests.brief>, signal: AbortSignal) {
    const context = await this.contexts.collect(owner, body.contextRef);
    const ref = body.contextRef;
    const selected = await Promise.all(body.destinationIds.map(async destinationId => ref.kind === 'group'
      ? this.contexts.collect(owner, { ...ref, destinationId }) : this.contexts.country(owner, (await this.contexts.profile(owner, ref.profileRevision)), destinationId, ref)));
    const messages = (await Promise.all(body.messageIds.map(async id => (await this.sourceMessage(owner, id)))));
    if (messages.some(m => hash(m.contextRef) !== hash(body.contextRef) || m.role !== 'assistant')) throw new ApiError(422, 'INVALID_EVIDENCE_SELECTION', 'Brief messages must belong to the selected context.');
    const evidenceIds = [...new Set([...context.evidence.map(e => e.id), ...selected.flatMap(c => c.evidence.map(e => e.id)), ...messages.flatMap(m => m.evidenceIds)])];
    const contextHash = hash({ ref, selected: selected.map(c => c.contextHash), messages: messages.map(m => m.id) });
    const brief: Brief = { id: opaque('brief'), contextRef: body.contextRef, contextHash, destinationIds: body.destinationIds,
      sections: [{ title: 'Context', text: `Selected destinations: ${body.destinationIds.join(', ')}. Language: ${body.language}.` },
        ...selected.map((c, i) => ({ title: `${body.destinationIds[i]} snapshot facts (unreviewed)`, text: JSON.stringify('snapshot' in c ? { snapshot: c.snapshot, gaps: c.gaps } : 'travellers' in c ? { travellers: c.travellers.map(t => ({ travellerId: t.travellerId, label: t.label, snapshot: 'snapshot' in t.context ? t.context.snapshot : null })), gaps: c.gaps } : { gaps: c.gaps }) })),
        ...messages.map(m => ({ title: 'Saved assistant answer (unreviewed)', text: m.text }))],
      claims: messages.flatMap(m => m.claims), evidenceIds, checklist: body.includeChecklist ? (await this.contexts.checklist(owner, body.contextRef, body.destinationIds)) : null,
      assumptions: ['Immutable local travel brief; bundled and provider information is unreviewed.'], gaps: [...new Set([...context.gaps, ...selected.flatMap(c => c.gaps)])], createdAt: stamp() };
    signal.throwIfAborted(); (await this.contexts.assert(owner, body.contextRef)); (await this.store.put(`ctx_${contextHash}`, owner, { contextRef: ref, data: selected })); (await this.store.put(brief.id, owner, brief)); return brief;
  }
}
export interface ResearchResult { contextRef: ContextRef; answer: string; claims: GeneratedAnswer['claims']; evidenceIds: string[]; gaps: string[]; conflicts: string[]; retrievedAt: string; warnings: string[]; usage: Record<string, unknown> }
