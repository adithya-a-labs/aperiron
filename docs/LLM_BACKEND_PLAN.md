# LLM integration: backend implementation plan and proposed HTTP contracts

- Date: 2026-10-11 (Asia/Calcutta)
- Work lane: dev-integration
- Status: backend milestone implemented; see [guide](ASSISTANT_BACKEND.md) and [OpenAPI](api/assistant.openapi.json)
- Scope: backend services, shared schemas, API contracts, fixtures and verification
- Existing baseline inspected: f8789dd

## 1. Outcome and boundaries

Support three connected frontend experiences: conversational map exploration,
contextual country chat and a local group trip planner. Deliver reliable structured
responses that the frontend team can render as messages, cards and map actions.
This work does not implement React components, chat layouts, map animations or
client-side stores. Frontend changes are a separate handoff.

GPT-OSS 120B interprets requests and explains evidence. Existing TypeScript engine
code calculates access, passport comparisons, Visa DNA facts and group overlap.
Cached Travel Buddy details supply selected pair enrichment. Targeted Groq browser
search discovers additional evidence. Only supported explicit rules can affect
access; model prose cannot grant eligibility or mutate simulation state.

The existing eight-method engine interface stays synchronous and unchanged.
Additive backend contracts provide richer profile and assistant context without
silently expanding existing engine traveller coverage.

### Feature coverage

| Feature | Backend deliverable |
| --- | --- |
| Describe a trip / ask the map | Validated profile/filter proposals, deterministic map queries and action objects |
| Open a country and chat | Cache-only context, scoped conversation history and evidence-grounded messages |
| Compare selected places | Local comparison facts plus optional explanatory cards |
| Use held documents | Structured user-confirmed descriptors, condition questions and reviewed-rule evaluation |
| Research missing details | Bounded asynchronous official-source discovery and evidence records |
| Build a checklist | Source-linked required/conditional items and explicit unresolved gaps |
| Follow-ups | Conversation tied to exact profile, destination or trip revision |
| Explain changes | Diff actual server-held context/evidence snapshots; explain supported differences |
| Simplify or translate | Transform a stored answer while preserving evidence references and numerical facts |
| Save/share a brief | Persist and export a selected, contextual evidence summary |
| Group planning | Local trip records, deterministic passport overlap, per-traveller matrix and bounded enrichment |

Warm-weather ranking, live budgets, flights, transit feasibility, scanned-document
uploads, visa authenticity checks, voice, public sharing, invitations and live
multi-user editing are outside the first implementation. Budget and dates can be
recorded without claiming that cost or future-entry feasibility was assessed.

## 2. Existing routes and compatibility

These existing routes continue to work with their current payloads:

| Method | Path | Existing role |
| --- | --- | --- |
| POST | `/api/groq-research` | Selected passport/destination/purpose research using 20B |
| GET | `/api/travel-details` | Cache-only provider-detail read |
| POST | `/api/travel-details/refresh` | Deduplicated, quota-controlled selected-pair refresh |

New routes use base **`/api/v1/assistant`**. Do not silently change the legacy
research model or response shape. New assistant services use configurable 120B.
Register routes through `server/api-server.ts` so Vite dev, preview and the local
API launcher use the same implementation. A future legacy migration is separate.

## 3. API conventions

- JSON request/response bodies; ISO alpha-2 catalog IDs; UTC ISO timestamps;
  calendar dates are `YYYY-MM-DD`. Monetary preferences specify ISO currency.
- IDs are server-generated opaque identifiers. All resources are scoped to the
  current local session; an ID alone grants no access across sessions.
- A local session uses an HttpOnly, SameSite=Strict cookie. Mutating routes check
  allowed Origin and a session CSRF token. Session bootstrap checks Origin before
  issuing either. Bind local server to loopback; public identity/accounts are not
  implied. Use Secure cookies when HTTPS is configured.
- Read responses containing profile/chat/evidence use `Cache-Control: no-store`.
- Metered POSTs require an `Idempotency-Key` UUID, persisted with request hash.
  Repeating the same request returns the original job; changed body with the same
  key returns 409. Scope keys to session and route; retain at least 24 hours.
- Mutations carry `expectedRevision`; stale writes return 409 without side effects.
  Profile extraction never applies changes automatically.
- JSON body limit: proposed 32 KiB, message limit 4,000 characters; bound histories,
  arrays and stored excerpts independently. List pagination uses opaque cursor,
  default limit 20, maximum 50. Reject unknown fields and invalid enum values.
- Every field shown as required is required. Optional values are explicit null
  where schema permits. Invalid bodies produce field errors rather than coercion.
- Queued model/research/enrichment operations return 202 with Location pointing
  to the job route. Polling never invokes Groq or Travel Buddy.
- Server emits request IDs and typed error codes. Never return credentials,
  hidden reasoning, upstream bodies or full private profile data in logs.

Example metered HTTP request (session cookie comes from POST `/sessions`):

```http
POST /api/v1/assistant/research HTTP/1.1
Content-Type: application/json
Cookie: aperiron_session=<opaque-session-cookie>
X-CSRF-Token: <session-csrf-token>
Idempotency-Key: b88cbd59-fd1c-4b78-9ddc-25a28d7080f7
Origin: http://127.0.0.1:5173

{
  "contextRef": { "kind": "country", "destinationId": "TR", "profileRevision": 3 },
  "question": "Does the held residence permit affect this destination's entry requirements?",
  "refresh": false
}
```

Configure allowed local origins for actual Vite ports; the example is not a hard
requirement to use port 5173. Never accept arbitrary reflected cross-origin access.

### Success envelope

```json
{
  "data": {},
  "meta": {
    "requestId": "req_opaque",
    "schemaVersion": "1",
    "generatedAt": "2026-10-11T08:00:00Z"
  }
}
```

`data` is the route-specific type below, including job results. DELETE success is
204 with no body. Exports use their declared download content type, not this envelope.

### Error envelope and HTTP mapping

```json
{
  "error": {
    "code": "CONTEXT_CHANGED",
    "message": "The traveller profile changed. Start a conversation with its current revision.",
    "retryable": false,
    "fieldErrors": []
  },
  "meta": { "requestId": "req_opaque", "schemaVersion": "1" }
}
```

| HTTP | Codes / semantics |
| --- | --- |
| 400 | `INVALID_JSON`, `VALIDATION_ERROR` |
| 401 | `SESSION_REQUIRED` |
| 403 | `ORIGIN_REJECTED`, `CSRF_REJECTED` |
| 404 | `NOT_FOUND` (including resources belonging to another session) |
| 409 | `REVISION_CONFLICT`, `CONTEXT_CHANGED`, `IDEMPOTENCY_CONFLICT`, `CONVERSATION_BUSY` |
| 413 | `BODY_TOO_LARGE` |
| 422 | `UNSUPPORTED_CONTEXT`, `UNSUPPORTED_FILTER`, `INVALID_EVIDENCE_SELECTION` |
| 429 | `RATE_LIMITED`, `BUDGET_EXHAUSTED`; bounded Retry-After where known |
| 503 | `MODEL_UNAVAILABLE`, `SERVICE_UNAVAILABLE`, `QUEUE_FULL` |

Cached/unknown answers may be successful partial results with warnings. Once a job
is accepted, later upstream errors appear in its typed `error`, rather than making
GET job fail with that upstream HTTP status. Failed jobs may use `UPSTREAM_TIMEOUT`,
`UPSTREAM_FAILURE`, `INVALID_MODEL_OUTPUT` or `INSUFFICIENT_EVIDENCE`.

## 4. Shared models

Authoritative runtime schemas now live under `src/shared/assistant/`, with generated
OpenAPI 3.1 and shared fixtures. The formats below record the original plan;
the current guide documents defaults and provider-driven schema adjustments.
Tests consume executable schemas.

### Traveller profile

```json
{
  "passportId": "IN",
  "passportType": "ordinary",
  "residenceCountryId": "DE",
  "heldDocuments": [
    {
      "id": "doc_opaque",
      "kind": "residence_permit",
      "issuerCountryId": "DE",
      "validFrom": null,
      "validUntil": null,
      "entryType": null
    }
  ],
  "purpose": "tourism",
  "activity": null,
  "departureDate": null,
  "returnDate": null,
  "durationDays": 5,
  "preferences": {
    "regionIds": [],
    "accessLevels": ["visa_free", "visa_on_arrival"],
    "budget": null
  },
  "language": "en"
}
```

`kind`: `visa | residence_permit`; `entryType`: `single | multiple | null`.
`purpose`: current `tourism | business | conference | transit` vocabulary.
Unconfirmed dates remain null. Validate actual calendar dates, ordering and
duration consistency; ask about inconsistent or ambiguous dates instead of guessing.
Do not collect passport numbers or scans. Residence does not imply citizenship.
Travel Buddy coverage remains ordinary-passport tourism; held documents do not
establish exceptions until reviewed rules match their actual conditions.

Profile resource: `{ revision, profile, updatedAt }`. A missing profile returns
`{ revision: 0, profile: null, updatedAt: null }`. User confirms a proposal with PUT.

### Context reference

Use a discriminated union; validate its branch:

```json
{ "kind": "country", "destinationId": "TR", "profileRevision": 3 }
```

- `map`: profileRevision, selectedCountryIds (maximum 10), mapRevision.
- `country`: profileRevision, destinationId.
- `group`: tripId, tripRevision, destinationId (nullable).

Server assembles its own evidence and engine facts. Client-provided prose, scores,
eligibility and citations are never trusted as tool results. `mapRevision` is a
client echo token; frontend discards outdated actions, rather than treating it as
a server-held data revision.

### Evidence and claims

Evidence fields: `id`, `sourceType`, `url`, `title`, `issuer`, `excerpt`,
`retrievedAt`, `reviewedAt`, `reviewStatus`, `applicability`, `effectiveFrom`,
`effectiveUntil`, `contentHash`. Nullable fields remain null.

- sourceType: `snapshot | travel_buddy | official_page | third_party_page`.
- reviewStatus: `unreviewed | reviewed_supported | conflicting`.
- Missing coverage is represented by gaps, rather than an evidence object without
  evidence. Relevance status is assessed separately for the exact context.
- A URL's host alone cannot establish authority; reviewed-source metadata records
  issuing authority/designated provider. Retrieved government pages remain unreviewed.
- `reviewed_supported` is assigned only by a reviewed evidence fixture/import
  workflow, never by a model or a public review-status mutation route.

Claim: `{ id, text, evidenceIds, support: supported|partial|unknown|conflicting }`.
Each material factual claim requires applicable references or explicit unknown.
Source-ID validation does not prove semantic support; evaluate groundedness against
reviewed fixtures and return tentative research where it cannot be established.

### Cards and assistant messages

Message resource: `{ id, role, text, cards, claims, evidenceIds, questions,
actions, contextRef, contextHash, createdAt, warnings }`.

Card discriminants: `summary`, `requirement`, `condition`, `source`, `comparison`,
`checklist`, `gap`. Each has its own validated payload. Cards reference evidence
IDs; they do not carry arbitrary HTML. Questions are typed text/choice inputs
with the profile field they would clarify. Never expose model chain-of-thought.

### Map actions

```json
{
  "type": "set_filters",
  "payload": { "regionIds": ["asia"], "accessLevels": ["visa_free", "visa_on_arrival"] },
  "mapRevision": "map_17",
  "profileRevision": 3,
  "requiresConfirmation": false,
  "reason": "Filter to the requested region and access categories."
}
```

Allow only `set_filters`, `focus_region`, `select_country`, `compare_countries`,
`suggest_shortlist` and `clear_filters`, each with a separate payload schema.
No arbitrary JavaScript, coordinates, URL navigation, baseline writes or treaty tools.
Generate viewport bounds from trusted geography for focus actions. If region
definitions are unavailable, return unsupported rather than let the model invent them.
Shortlist/profile changes require frontend confirmation followed by explicit PUT.

Undo is frontend-owned: restore its previous view state and resubmit map query if
needed. The backend returns action proposals and echoes revisions; it does not
directly operate UI or persist an undo stack for transient map changes.

### Job resource

```json
{
  "id": "job_opaque",
  "type": "country_message",
  "status": "queued",
  "stage": "waiting",
  "contextRef": { "kind": "country", "destinationId": "TR", "profileRevision": 3 },
  "result": null,
  "error": null,
  "createdAt": "2026-10-11T08:00:00Z",
  "expiresAt": "2026-10-11T09:00:00Z"
}
```

Statuses: `queued | running | completed | failed | cancelled | superseded`.
Stages: `waiting | collecting_context | refreshing_details | researching |
generating | validating | finished`. Do not invent numerical progress.
Completed `result` is a tagged union by job type. Cancellation aborts model work
best-effort; a dispatched provider call may still consume quota. Do not cancel a
shared Travel Buddy refresh used by other jobs. Changed profile/trip revisions
supersede pending answers; retain context binding on historical messages.

## 5. Endpoint catalog

All paths in this section are relative to `/api/v1/assistant`.
GET/DELETE requests have no JSON body. Async success uses the Job envelope.

### Capabilities, session and profile

| Method / path | Request | Success | Provider use |
| --- | --- | --- | --- |
| GET `/capabilities` | None | 200 CapabilityResponse | None; configuration is not proof of authenticated entitlement |
| POST `/sessions` | `{}` | 201 `{sessionId, csrfToken, expiresAt}` + cookie | None; reuse unexpired cookie session |
| GET `/sessions/current` | None | 200 `{sessionId, csrfToken, expiresAt}` | None |
| DELETE `/sessions/current` | None | 204; delete owned data and cancel jobs | None |
| GET `/profile` | None | 200 ProfileResource | None |
| PUT `/profile` | `{expectedRevision, profile}` | 200 ProfileResource | None |
| POST `/profile/interpret` | `{text, expectedRevision}` | 202 job -> ProfileProposal | One bounded no-tool model call |

CapabilityResponse contains model configured state, supported action/filter/purpose
enums, available evidence coverage, enabled jobs, limits and feature availability.
Do not probe providers on every capabilities read. Never disclose keys or full quotas.
ProfileProposal contains `proposedProfile`, per-field `extracted|ambiguous|missing`
states, questions and unsupported constraints. It is never automatically applied.

### Map interpretation and deterministic results

| Method / path | Request | Success | Provider use |
| --- | --- | --- | --- |
| POST `/map/interpret` | `{text, profileRevision, mapRevision, selectedCountryIds, filters}` | 202 job -> MapProposal | One bounded no-tool model call |
| POST `/map/query` | `{profileRevision, filters, destinationIds, page}` | 200 MapResult | None |

MapProposal: `{actions, proposedProfile, questions, unsupportedConstraints}`.
MapResult: `{datasetVersion, basis, destinations, total, accessBreakdown,
unassessedCount, unsupportedConstraints, nextCursor}`. Each destination contains
its exact classification, basis and matched/unknown conditions. `basis` defaults
to `snapshot`; do not silently use differently sourced data across travellers.

Supported filters initially: catalog continent/region IDs, exact access categories,
explicit destination IDs, and maximum stay only where an applicable numeric field
exists. Unknown stay data is unassessed, not treated as an exact match. Preference
text such as warm/cheap remains unsupported until an adapter exists.

Example request:

```json
{
  "text": "Show visa-free and arrival access in Asia",
  "profileRevision": 3,
  "mapRevision": "map_17",
  "selectedCountryIds": [],
  "filters": { "regionIds": [], "accessLevels": [] }
}
```

Frontend polls the job, validates its current revisions, applies supported action
proposals and calls `/map/query`. Filters can also be submitted manually without AI.

### Country context, conversations and messages

| Method / path | Request | Success | Provider use |
| --- | --- | --- | --- |
| GET `/countries/{destinationId}/context?profileRevision=3` | No body | 200 CountryContext | Cache-only engine/provider/evidence reads |
| POST `/conversations` | `{contextRef}` | 201 Conversation | None |
| GET `/conversations/{conversationId}?cursor=...&limit=20` | No body | 200 conversation + paginated messages | None |
| POST `/conversations/{conversationId}/messages` | MessageRequest below | 202 job -> AssistantMessage | Bounded model call; optional policy-controlled refresh/research |

CountryContext: `{contextRef, contextHash, snapshot, providerDetails,
supportedContext, evidence, gaps, suggestedQuestions, freshness}`. Opening a country
does not invoke Groq or upstream Travel Buddy. Unsupported contexts return explicit
unknowns; optional cached tourism references are labeled non-applicable.

```json
{
  "clientMessageId": "b88cbd59-fd1c-4b78-9ddc-25a28d7080f7",
  "text": "Does my residence permit affect this requirement?",
  "intent": "ask",
  "expectedConversationRevision": 0,
  "contextRef": { "kind": "country", "destinationId": "TR", "profileRevision": 3 },
  "dataPolicy": { "travelBuddy": "cache_only", "research": "never" }
}
```

`intent`: `ask | explain | compare | checklist | research | simplify | translate`.
`text` must be nonempty for ask/research; preset intents allow null. Translation
requires targetLanguage and sourceMessageId; simplify requires sourceMessageId.
These are discriminated request branches, not arbitrary optional combinations.
One active message job per conversation; duplicates return the same job, different
concurrent messages return CONVERSATION_BUSY. Client message IDs are unique per
conversation; body mismatch returns 409. Message acceptance and revision increment
are atomic. Failed attempts remain visible and are never duplicated by polling.

dataPolicy Travel Buddy: `cache_only | refresh_if_stale`; research: `never | if_gap`.
Defaults are cache_only/never. Explicit research intent authorizes one bounded
research operation. `if_gap` allows a research stage only for a material unanswered
question. Neither option bypasses quota controls. Permit-dependent questions should
ask for missing document facts before requesting unrelated data.

Message-driven provider refresh is allowed only for a single country context.
Map/group messages requiring provider refresh return a gap card suggesting an
explicit enrichment request; group refresh uses the bounded route below. No message can
silently refresh a whole shortlist. Jobs recheck revisions before publishing;
already dispatched provider calls may still consume quota after supersession.

Each conversation is permanently bound to its context revision. Profile changes
require a new conversation; GET historical conversations labels them historical.
Opening another country does not rewrite an existing conversation's context.

### Research, evidence and asynchronous jobs

| Method / path | Request | Success | Provider use |
| --- | --- | --- | --- |
| POST `/research` | `{contextRef, question, refresh}` | 202 job -> ResearchResult | Search on cache miss; optional no-tool structured normalization |
| GET `/evidence/{evidenceId}` | None | 200 EvidenceResource | None |
| GET `/jobs/{jobId}` | None | 200 Job | None |
| DELETE `/jobs/{jobId}` | None | 204 cancellation requested; GET reveals final status | Best-effort abort only |

ResearchResult: `{contextRef, answer, claims, evidenceIds, gaps, conflicts,
retrievedAt, warnings}`. Research must be scoped to one destination/question;
group research targets an explicit traveller or bounded context, not every country.
Refresh defaults false and remains subject to server budget/cooldown limits.

For group research, the request branch additionally requires `travellerId` and a
non-null destinationId. A broad group question becomes a user-visible gap list
before additional per-person searches, rather than an unbounded fan-out.

Use actual returned source/annotation metadata where supported. Inspect live response
shape before committing a citation adapter. Opaque citation markers are not URLs.
Missing usable source metadata produces an insufficient-evidence result or explicit
gap, never fabricated cards. Do not add a general fetch-any-URL proxy; any source
retrieval adapter enforces allowed HTTPS destinations and blocks private networks
and redirects to them. Web text is untrusted evidence, never tool instructions.

Example accepted response (HTTP 202, Location header contains the job URL):

```json
{
  "data": {
    "id": "job_opaque",
    "type": "research",
    "status": "queued",
    "stage": "waiting",
    "contextRef": { "kind": "country", "destinationId": "TR", "profileRevision": 3 },
    "result": null,
    "error": null,
    "createdAt": "2026-10-11T08:00:00Z",
    "expiresAt": "2026-10-11T09:00:00Z"
  },
  "meta": { "requestId": "req_opaque", "schemaVersion": "1", "generatedAt": "2026-10-11T08:00:00Z" }
}
```

### Standalone explanation actions

| Method / path | Request | Success | Provider use |
| --- | --- | --- | --- |
| POST `/explanations` | Discriminated ExplanationRequest | 202 job -> ExplanationResult | No browsing unless separately requested through research |

Branches:

- comparison: `{kind, passportIds: [A,B], destinationIds, language}`; engine computes.
- dna: `{kind, passportId, language}`; no invented similarity metric.
- changes: `{kind, beforeContextHash, afterContextHash, language}`; both hashes must
  reference owned retained snapshots, with supported comparable contexts.
- simplify: `{kind, sourceMessageId, language}`.
- translate: `{kind, sourceMessageId, targetLanguage}`.

ExplanationResult contains kind, immutable fact/evidence references, text, cards
and warnings. Any translation preserves conditions and source provenance; verify
numbers, dates, country IDs and negations using fixtures and deterministic checks
where possible. Unsupported changes become gaps, not speculative explanations.

### Group trip planner

| Method / path | Request | Success | Provider use |
| --- | --- | --- | --- |
| POST `/trips` | TripInput | 201 TripResource | None |
| GET `/trips/{tripId}` | None | 200 TripResource | None |
| PUT `/trips/{tripId}` | `{expectedRevision, trip}` | 200 TripResource | None |
| DELETE `/trips/{tripId}` | None | 204 | None |
| POST `/trips/{tripId}/destinations/query` | `{tripRevision, filters, destinationIds, page}` | 200 GroupMapResult | None |
| GET `/trips/{tripId}/countries/{destinationId}/context?tripRevision=2` | No body | 200 GroupCountryContext | Cache-only |
| POST `/trips/{tripId}/enrichment` | `{tripRevision, destinationIds, travellerIds, maxProviderCalls}` | 202 job -> EnrichmentResult | Bounded unique pair refreshes |

TripInput / stored editable trip:

```json
{
  "name": "Friends December trip",
  "travellers": [
    { "id": "traveller_a", "label": "Traveller A", "profile": { "passportId": "IN", "passportType": "ordinary", "residenceCountryId": null, "heldDocuments": [], "purpose": "tourism", "activity": null, "departureDate": null, "returnDate": null, "durationDays": null, "preferences": { "regionIds": [], "accessLevels": [] , "budget": null }, "language": "en" } },
    { "id": "traveller_b", "label": "Traveller B", "profile": { "passportId": "DE", "passportType": "ordinary", "residenceCountryId": null, "heldDocuments": [], "purpose": "tourism", "activity": null, "departureDate": null, "returnDate": null, "durationDays": null, "preferences": { "regionIds": [], "accessLevels": [], "budget": null }, "language": "en" } }
  ],
  "departureDate": null,
  "returnDate": null,
  "durationDays": 5,
  "budget": null,
  "shortlistCountryIds": []
}
```

TripResource: `{id, revision, trip, createdAt, updatedAt}`. Proposed maximum six
travellers and ten shortlisted countries. Traveller IDs are stable client labels
within a trip, not authorization tokens; enforce uniqueness and length limits.
Shared trip dates/duration must agree with individual fields or validation fails;
do not silently choose precedence for conflicting plans.

GroupMapResult returns each destination with per-traveller access, assumptions,
unknown conditions and `groupAssessment: baseline_match | needs_review |
does_not_match | unassessed`. No destination is labeled guaranteed eligible.
Use one dataset version for baseline intersection. Unknowns/unsupported purpose
are not counted as confirmed matches. Residence/visas alter outcomes only through
explicit reviewed rules; otherwise return unresolved conditions.

GroupCountryContext returns a per-person matrix with sources, freshness and gaps.
Groups share Travel Buddy cache keys only for the same supported provider context;
individual permit-specific applicability is still evaluated separately.

Enrichment example:

```json
{
  "tripRevision": 2,
  "destinationIds": ["JP", "TR"],
  "travellerIds": ["traveller_a", "traveller_b"],
  "maxProviderCalls": 3
}
```

Hard cap is min(request budget, server configured limit, available quota); proposed
server limit three per job. Expand/deduplicate unique stale pairs in deterministic
input order; return refreshed/cached/skipped outcomes per pair and actual calls.
Do not scan every map destination or bypass existing TravelService reservations.
No research/Groq calls are implied by enrichment. Group conversation uses the
same conversations/messages routes with a group contextRef.

### Preparation and travel briefs

| Method / path | Request | Success | Provider use |
| --- | --- | --- | --- |
| POST `/checklists` | `{contextRef, destinationIds}` | 202 job -> ChecklistResult | Optional no-tool explanation; requirements are evidence-derived |
| POST `/briefs` | `{contextRef, destinationIds, messageIds, includeChecklist, language}` | 202 job -> BriefResource | Bounded no-tool synthesis |
| GET `/briefs/{briefId}` | None | 200 BriefResource | None |
| GET `/briefs/{briefId}/export?format=markdown` | format markdown/json | 200 download | None |
| DELETE `/briefs/{briefId}` | None | 204 | None |

ChecklistResult items: `{id, travellerIds, title, category, requirementStatus,
condition, dueDate, evidenceIds}` plus gaps. category is requirement/preparation;
requirementStatus is required/conditional/suggested/unknown. Only applicable
reviewed evidence populates required documents. Provider registration links can
appear as unreviewed references with explicit status. User planning targets must
not be labeled official deadlines. If coverage is absent, return a useful gap
list rather than a generic fabricated visa checklist.

BriefResource: `{id, contextRef, contextHash, destinationIds, sections, claims,
evidenceIds, checklist, assumptions, gaps, createdAt}`. Persist an immutable
snapshot; later profile changes do not rewrite its history. Exports carry source
and retrieval/review dates and note stale context. Sharing means a user-downloaded
artifact in v1, not a publicly accessible URL or real-time collaboration service.

## 6. Processing, budgets and persistence

### Request routing

1. Validate session, origin, body, idempotency and resource/context revisions.
2. For deterministic requests, use existing engine/read caches and return directly.
3. For model work, persist a bounded job and reserve its session/server budget.
4. Collect the smallest relevant engine, cached provider and evidence context.
5. If explicitly allowed and useful, refresh a selected stale pair through TravelService.
6. If explicitly requested or allowed for a material gap, perform targeted research.
7. Generate schema-constrained cards/actions in a separate no-tool call as needed.
8. Validate identifiers, revisions, evidence references and supported numeric facts;
   downgrade unsupported claims to gaps. Persist the answer/job atomically.
9. Return the job result; never write map classifications or traveller profiles
   directly from generated prose.

Avoid a generic autonomous loop in v1. Fixed intent routing covers the agreed
features and makes maximum call counts testable. Internal read-only adapters:
getCountryContext, queryMap, comparePassports, getDNAFacts, getGroupContext,
findOfficialSources, buildEvidenceChecklist. No arbitrary HTTP, database execution,
world-state mutation, booking or application-submission tools.

### Groq configuration

- `GROQ_API_KEY`: existing server-only secret.
- `GROQ_ASSISTANT_MODEL=openai/gpt-oss-120b` for new routes.
- Proposed bounded timeout 30 seconds for no-tool calls, 45 seconds for browser
  search, total job deadline 90 seconds. Enrichment uses existing provider timeout.
- Start browser research with low reasoning effort, bounded completion tokens
  and exact scoped question. Measure actual behavior before promising latency.
- Separate strict JSON stages from browser search. Strict JSON ensures shape,
  not factual correctness. Streaming partial structured answers is not required;
  polling stages supports the frontend without exposing unvalidated actions.
- Proposed active model concurrency two; bounded queue length twenty; session
  limit five metered submissions/minute. Add server-wide daily token/search
  budgets from environment values, fail closed when configured budget exhausted.
- One normal answer or interpretation call; search path at most one browser-search
  request plus one structured finalization. Do not add an extra finalization after
  a structured result already satisfies the contract.
- One browser-search API request can contain multiple internal browsing operations;
  it is not a guarantee of one billed search. Inspect usage and enforce available
  provider controls. Reserve conservative allowances and stop at job deadlines.
- No automatic paid-model fallback or retries. A caller retry with the same key
  cannot re-spend; a genuinely new attempt requires a new idempotency key and budget.

Travel Buddy retains its existing independent quota controls, cache age, retention,
deduplication and twenty-request reserve. Cached/provider-explanation requests do
not silently spend its allowance. No bulk map/history/ranking fetch is introduced.

### Persistence and cache keys

Single local-process atomic store, ignored under `.local/assistant/`; no external
database required for the hackathon. Reuse atomic write patterns; do not couple
private chat storage to the shared provider cache. Proposed session/chat/profile
retention seven days, job payload retention one hour, evidence retention subject
to source/provider policy. Keep provenance for retained briefs or mark unavailable
evidence explicitly. Deleting a session deletes owned records and outstanding jobs.

On restart, mark queued/running work interrupted; never automatically replay a
quota-consuming request. Restore idempotency outcomes to prevent duplicate spends.
Public deployment/multiple server processes require a different shared store and
cross-process coordination and are outside this backend milestone.

Explanation cache key: evidence/context hash + prompt version + model + language
+ intent. Research key: exact normalized question + relevant traveller context +
destination + freshness policy. Trip changes invalidate group-specific results.
Do not reuse private answers across sessions. Reusable public source excerpts may
be stored independently with their own provenance and retention policy.

## 7. Implementation modules and delivery order

Proposed module layout (names can change without changing agreed HTTP contracts):

```text
src/shared/assistant/
  schemas.ts              Runtime request/response validation and inferred types
  fixtures.ts             Frontend examples and contract test fixtures
server/assistant/
  routes.ts               Versioned router and error envelopes
  sessions.ts             Local session ownership and revision checks
  store.ts                Atomic persisted records and idempotency
  jobs.ts                 Bounded queue, polling, cancellation and restart handling
  groq.ts                 Model adapter, deadlines and usage accounting
  context.ts              Existing engine + cached TravelService + evidence
  map.ts                  Validated map actions and deterministic query helpers
  conversations.ts        Scoped message processing
  research.ts             Search, evidence extraction and normalization
  evidence.ts             Applicability, provenance, conflicts and review fixtures
  groups.ts               Local trips, overlap and per-person matrix
  preparation.ts          Sourced checklist construction
  briefs.ts               Immutable brief storage and safe exports
docs/api/
  assistant.openapi.json  Generated OpenAPI 3.1 contract at implementation time
```

| Phase | Deliverable | Exit check |
| --- | --- | --- |
| 0: provider capability | Bounded plain/strict/search 120B smoke checks and actual citation/usage sample | Real account support measured; failures explicit; no secrets logged |
| 1: contracts/foundation | Shared schemas, OpenAPI, session/error/jobs/store and frontend fixtures | Invalid requests, ownership, revisions, idempotency and restart verified |
| 2: deterministic backend | Context, map queries, comparison/DNA facts and group overlap | Zero provider calls; same engine semantics/version as current app |
| 3: country assistant | Scoped conversations and Explain/Ask using cached context | Grounded answers, no automatic searches, races/cancellation tested |
| 4: map language | Profile proposals and map interpretation | Validated action union; no unsupported eligibility changes |
| 5: evidence research | Targeted search, source cards and context-specific cache | Usable real source references; missing metadata/conflicts visible |
| 6: group assistant | Trip CRUD, per-person context, bounded enrichment and group chat | Calls depend on unique stale pairs, not traveller count blindly |
| 7: preparation/briefs | Reviewed checklist, transforms/change explanation and export | No invented documents/deadlines; reproducible cited summaries |
| 8: handoff | Tests, OpenAPI/examples, startup/env guide, current state/run records | Backend runnable and frontend can integrate without guessing |

Capability smoke checks were performed during implementation after the planning task.
Use a maximum three Groq requests for initial plain/strict/search probing; any
additional live evaluation has an explicit bounded budget. Changing environment
configuration is not proof of model/search access.

## 8. Verification and frontend acceptance scenarios

- Preserve all existing engine, Travel Buddy and legacy research regression tests.
- Test JSON-schema boundaries, profiles/dates, unknown codes and unsupported purposes.
- Test session isolation, Origin/CSRF, missing config, body caps and safe export output.
- Test same-key duplicates, changed bodies, concurrent message jobs, stale revisions,
  cancellation, restart interruption and budget reservation failure.
- Test official-source metadata extraction using actual observed response fixtures;
  reject fake citations, unsafe source retrieval and instructions embedded in pages.
- Evaluation fixtures: primary/conditional rule, no evidence, conflicting guidance,
  unsupported purpose, held-document ambiguity, translation negation/date preservation.
- Test map action enums, manual filters, unknown stay data, group intersection,
  repeat-passport deduplication and per-traveller unsupported conditions.
- Test no LLM on context reads, no provider on polling/query, and existing reserve
  enforcement even when a model requests more research/enrichment.
- Run npm run check, documentation checker and OpenAPI validation. HTTP integration
  tests exercise the shared API router in dev/standalone-compatible paths.
- Deliver curl examples with cookie jar/CSRF and idempotency placeholders, plus
  fixtures for every route success/error and every card/action branch. No frontend
  browser implementation is required to prove backend acceptance.

### Required call-count acceptance

| Interaction | Groq requests | Travel Buddy requests |
| --- | --- | --- |
| Read map/country context | 0 | 0 |
| Manual map/group query | 0 | 0 |
| Explain from fresh cached evidence | At most 1 (0 on answer-cache hit) | 0 |
| Interpret a map request/profile | At most 1 | 0 |
| Targeted gap research | At most 2 API requests; internal browsing usage recorded | 0 by default |
| Enrich selected group pairs | 0 | At most requested/server budget, default cap 3 |
| Poll an existing job | 0 | 0 |
| Repeat accepted request with same idempotency key | 0 additional | 0 additional |

Frontend integration order: bootstrap session -> confirm profile -> read context
-> create scoped conversation -> submit message -> poll job -> render validated
cards/actions. For map commands: interpret -> inspect/apply proposals -> query.
For groups: create trip -> query overlap -> inspect destination matrix -> optionally
enrich bounded pairs -> group chat -> export brief.

## 9. Source references and status

Provider constraints checked against official documentation:

- [Groq browser search](https://console.groq.com/docs/tool-use/built-in-tools/browser-search)
- [Groq structured outputs](https://console.groq.com/docs/structured-outputs)
- [Groq tool-use overview](https://console.groq.com/docs/tool-use/overview)

Project boundaries: [architecture](ARCHITECTURE.md), [contracts](CONTRACTS.md),
[data policy](DATA_POLICY.md), [Travel Buddy decision](decisions/0008-travel-buddy-destination-enrichment.md).
The 30-operation catalog is implemented. Executable schemas and generated OpenAPI
are authoritative. The current guide records implementation adjustments, including
deterministic brief saving, reviewed-requirement gaps, normalized action filters
and null clear-filter payloads. Frontend work remains outside this milestone.
