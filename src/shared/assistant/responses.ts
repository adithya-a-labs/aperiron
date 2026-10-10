import { array, bool, enumeration, integer, jsonValue, nullable, number, object, str, union } from './schema';
import { access, action, card, claim, contextRef, country, generatedAnswer, id, mapProposal, profile, profileProposal, question, trip } from './schemas';

const strings = array(str(16000), 200), ids = array(id, 500), timestamp = str(50);
export const evidence = object({ id, sourceType: enumeration(['snapshot', 'travel_buddy', 'official_page', 'third_party_page'] as const), url: nullable(str(4000)), title: str(500), issuer: nullable(str(500)), excerpt: nullable(str(6000)),
  retrievedAt: nullable(timestamp), reviewedAt: nullable(timestamp), reviewStatus: enumeration(['unreviewed', 'reviewed_supported', 'conflicting'] as const),
  applicability: object({ passportId: country, destinationId: country, purpose: str(100), passportType: str(100), status: enumeration(['reference_only', 'applicable', 'unresolved'] as const) }),
  effectiveFrom: nullable(timestamp), effectiveUntil: nullable(timestamp), contentHash: id });
export const session = object({ sessionId: id, csrfToken: id, expiresAt: timestamp });
export const profileResource = object({ revision: integer(), profile: nullable(profile), updatedAt: nullable(timestamp) });
export const tripResource = object({ id, revision: integer(1), trip, createdAt: timestamp, updatedAt: timestamp });
const conversationFields = { id, revision: integer(), contextRef, contextHash: id, messageIds: ids, activeJobId: nullable(id), createdAt: timestamp };
export const conversation = object(conversationFields);
export const message = object({ id, role: enumeration(['user', 'assistant'] as const), text: str(8000), cards: array(card, 30), claims: array(claim, 40), evidenceIds: ids, questions: array(question, 10), actions: array(action, 10), contextRef, contextHash: id, createdAt: timestamp, warnings: strings });
export const conversationPage = object({ ...conversationFields, historical: bool, messages: array(message, 50), nextCursor: nullable(str(500)) });
const countryFields = { contextRef, contextHash: id,
  // Engine/provider nested facts retain their existing public TypeScript contracts.
  snapshot: jsonValue, providerDetails: jsonValue, supportedContext: bool, evidence: array(evidence, 30), gaps: strings, suggestedQuestions: strings,
  freshness: object({ datasetVersion: str(100), providerFresh: bool, reviewedAt: nullable(timestamp) }) };
export const countryContext = object(countryFields);
export const groupContext = object({ contextRef, contextHash: id, travellers: array(object({ travellerId: id, label: str(80), context: countryContext }), 6), evidence: array(evidence, 180), gaps: strings });
const cell = object({ destinationId: country, destinationName: str(150), accessLevel: access, maxStayDays: nullable(integer(0, 3650)), notes: nullable(str(1000)), isSimulated: bool, basis: enumeration(['snapshot'] as const), stayAssessment: enumeration(['not_requested', 'unknown', 'exceeds_snapshot', 'within_snapshot'] as const), unknownConditions: strings, assumptions: strings, matchedConditions: strings, travellerId: id });
export const mapResult = object({ datasetVersion: str(100), basis: enumeration(['snapshot'] as const), destinations: array(object({ destinationId: country, destinationName: str(150), travellers: array(cell, 6), groupAssessment: enumeration(['unassessed', 'does_not_match', 'needs_review', 'baseline_match'] as const), matches: bool }), 50),
  total: integer(0, 199), accessBreakdown: jsonValue, unassessedCount: integer(0, 199), unsupportedConstraints: strings, nextCursor: nullable(str(500)) });
export const checklist = object({ contextRef, items: array(object({ id, travellerIds: ids, title: str(500), category: enumeration(['requirement', 'preparation'] as const), requirementStatus: enumeration(['required', 'conditional', 'suggested', 'unknown'] as const), condition: nullable(str(1000)), dueDate: nullable(timestamp), evidenceIds: ids }), 100), gaps: strings, createdAt: timestamp });
const briefFields = { id, contextRef, contextHash: id, destinationIds: array(country), sections: array(object({ title: str(500), text: str(16000) }), 40), claims: array(claim, 400), evidenceIds: ids, checklist: nullable(checklist), assumptions: strings, gaps: strings, createdAt: timestamp };
export const brief = object(briefFields);
export const briefRead = object({ ...briefFields, staleContext: bool });
export const researchResult = object({ contextRef, answer: str(16000), claims: array(claim, 40), evidenceIds: ids, gaps: strings, conflicts: strings, retrievedAt: timestamp, warnings: strings, usage: jsonValue });
export const explanationResult = object({ kind: enumeration(['comparison', 'dna', 'changes', 'simplify', 'translate'] as const), facts: jsonValue, text: str(8000), cards: array(card, 15), claims: array(claim, 40), questions: array(question, 10), actions: array(action, 10), warnings: strings });
export const enrichmentResult = object({ outcomes: array(jsonValue, 60), refreshAttempts: integer(0, 3), providerCalls: integer(0, 3), maxProviderCalls: integer(0, 3), warnings: strings });
export const jobResult = union(
  object({ type: enumeration(['profile_proposal'] as const), data: profileProposal }), object({ type: enumeration(['map_proposal'] as const), data: mapProposal }),
  object({ type: enumeration(['message'] as const), data: message }), object({ type: enumeration(['research'] as const), data: researchResult }),
  object({ type: enumeration(['explanation'] as const), data: explanationResult }), object({ type: enumeration(['enrichment'] as const), data: enrichmentResult }),
  object({ type: enumeration(['checklist'] as const), data: checklist }), object({ type: enumeration(['brief'] as const), data: brief }),
);
export const job = object({ id, type: enumeration(['profile_proposal', 'map_proposal', 'message', 'research', 'explanation', 'enrichment', 'checklist', 'brief'] as const),
  status: enumeration(['queued', 'running', 'completed', 'failed', 'cancelled', 'superseded'] as const), stage: enumeration(['waiting', 'collecting_context', 'refreshing_details', 'researching', 'generating', 'validating', 'finished'] as const),
  contextRef: nullable(contextRef), result: nullable(jobResult), error: nullable(object({ code: str(100), message: str(1000), retryable: bool })), createdAt: timestamp, expiresAt: timestamp });
export const capabilities = object({ model: object({ configured: bool, id: str(100), authenticatedEntitlement: enumeration(['not_probed'] as const) }), purposes: strings, regions: strings, regionViewports: array(object({ regionId: str(100), bounds: array(array(number(-180, 180), 2, 2), 2, 2) }), 10), actions: strings, filters: strings,
  evidenceCoverage: object({ baseline: str(100), reviewedDocumentRules: integer(), provider: str(100) }),
  features: object({ map: bool, countryChat: bool, research: bool, groups: bool, checklists: str(100), briefs: bool, heldDocumentEligibility: bool }),
  limits: object({ bodyBytes: integer(), messageCharacters: integer(), travellers: integer(), shortlist: integer(), enrichmentCalls: integer(), activeJobs: integer(), queue: integer(), meteredPerMinute: integer() }) });
export const error = object({ error: object({ code: str(100), message: str(1000), retryable: bool, fieldErrors: array(object({ field: str(500), message: str(1000) }), 100) }), meta: object({ requestId: id, schemaVersion: enumeration(['1'] as const) }) });
export const responses = { capabilities, session, profileResource, tripResource, conversation, conversationPage, countryContext, groupContext, mapResult, checklist, brief, briefRead, researchResult, explanationResult, enrichmentResult, job, message, generatedAnswer, evidence };
