# Local assistant backend and frontend handoff

The backend milestone implements all 30 operations from the
[plan](LLM_BACKEND_PLAN.md) under `/api/v1/assistant`. Frontend components, styles,
stores and the eight-method engine interface are unchanged.

The subsequent [Trips frontend](TRIP_PLANNER.md) now consumes the existing group
routes for local planning, review tasks and export. This frontend addition needed
no new HTTP endpoints. The original backend milestone and its recorded validation
below remain historical evidence for that implementation.

Authoritative contracts:

- [Request schemas and inferred types](../src/shared/assistant/schemas.ts).
- [Response schemas](../src/shared/assistant/responses.ts).
- [Operation catalog](../src/shared/assistant/operations.ts).
- [Generated OpenAPI 3.1](api/assistant.openapi.json).
- [Synthetic profile, card and action fixtures](../src/shared/assistant/fixtures.ts).

Generate with `npm.cmd run assistant:openapi`; check drift with
`npm.cmd run assistant:openapi -- --check`. HTTP tests exercise every operation
and validate runtime response schemas. Nested existing engine/provider facts
retain their existing TypeScript contracts and are described as JSON in OpenAPI.

## Start and configure

`npm.cmd run dev` and `npm.cmd run preview` install the common API middleware.
`npm.cmd run server` starts the API-only loopback server on port 8787 by default;
`API_SERVER_PORT` overrides it. Static hosting alone cannot serve the assistant.
Use one process per storage directory. No public accounts or deployment are added.

Set secrets only in ignored `.env`; never use a VITE-prefixed API key.

| Variable | Default / meaning |
| --- | --- |
| `GROQ_API_KEY` | Required only for model/search work |
| `GROQ_ASSISTANT_MODEL` | `openai/gpt-oss-120b` |
| `GROQ_ASSISTANT_SEARCH_MODEL` | `openai/gpt-oss-20b` for browser-source discovery |
| `ASSISTANT_DAILY_TOKEN_BUDGET` | 500000 reserved tokens per UTC day |
| `ASSISTANT_DAILY_SEARCH_BUDGET` | 10 browser-search API requests per UTC day |
| `ASSISTANT_ALLOWED_ORIGINS` | Exact comma-separated origins; defaults to localhost and 127.0.0.1 on ports 5173, 4173, 5184, 8787 |
| `ASSISTANT_STORE_DIR` | Ignored `.local/assistant` directory |
| `ASSISTANT_COOKIE_SECURE` | Set true when the API uses HTTPS |

Invalid budget values fail closed at zero. Normal calls conservatively reserve
12000 tokens and browser requests 65536 before dispatch. Actual token usage and
excess above reservations are also persisted. Failed reservations remain spent.
One browser API request may perform multiple internal searches; the search budget
counts API requests, not a guaranteed number of billed internal operations.

Two jobs run concurrently; twenty can wait. Each session can submit five metered
jobs per minute. No-tool calls time out at thirty seconds, browser calls at
forty-five seconds and jobs at ninety seconds. Provider 429 responses persist a
cooldown using Retry-After or sixty seconds. No automatic retries or model
fallbacks occur. Strict schemas use `$defs` to reduce repeated enum overhead.
The provider compiler translates nullable values into type unions and includes
null in nullable enums, matching [Groq's structured-output guidance](https://console.groq.com/docs/structured-outputs).
Discriminated object unions and authoritative runtime/public schemas stay intact.

Persistence failures are contained within each job. If the running transition
cannot be saved, no provider work is dispatched. If result persistence fails,
polling reports a storage failure without publishing an unsaved result. The
accepted idempotency reservation remains intact; restart never replays the work.
Queue slots are released so recovered storage can serve new explicit attempts.
Windows atomic renames have at most two short retries for transient file locks;
these retries never repeat a provider request or reset accounting.

Travel Buddy retains its independent cache, seven-day refresh age, quota
reservations, deduplication and twenty-request reserve; see
[setup](DEVELOPMENT.md#travel-buddy-destination-enrichment).

## HTTP sequence

1. POST `/sessions` with `{}` and an allowed Origin. Keep the HttpOnly cookie and
   returned CSRF token. Existing unexpired sessions are reused.
2. GET `/profile`, then PUT `/profile` with its expectedRevision and complete
   confirmed profile. The missing initial profile has revision zero.
3. GET `/countries/JP/context?profileRevision=1` for an immediate cache-only read.
4. POST `/conversations` with an exact contextRef.
5. POST `/conversations/{id}/messages` with a UUID Idempotency-Key,
   clientMessageId, current conversation revision and the same contextRef.
6. Poll the job's Location until terminal; render completed results.
7. After profile/trip changes, create a new conversation. Historical conversations
   and briefs remain readable and indicate stale context.

Every mutation requires an allowed Origin; all except bootstrap require
X-CSRF-Token. Owned reads require the cookie. A separate browser origin must send
credentials and be allowlisted. Responses disable caching. Foreign or wrong-type
resource IDs return 404.

```sh
curl -c cookies.txt -H 'Origin: http://127.0.0.1:5173' \
  -H 'Content-Type: application/json' -d '{}' \
  http://127.0.0.1:8787/api/v1/assistant/sessions

# Copy the returned csrfToken. profile.json uses the shared exampleProfile shape.
curl -b cookies.txt -X PUT -H 'Origin: http://127.0.0.1:5173' \
  -H 'X-CSRF-Token: <csrfToken>' -H 'Content-Type: application/json' \
  --data-binary @profile.json \
  http://127.0.0.1:8787/api/v1/assistant/profile

curl -b cookies.txt \
  'http://127.0.0.1:8787/api/v1/assistant/countries/JP/context?profileRevision=1'

curl -b cookies.txt -H 'Origin: http://127.0.0.1:5173' \
  -H 'X-CSRF-Token: <csrfToken>' -H 'Idempotency-Key: <new-UUID>' \
  -H 'Content-Type: application/json' \
  -d '{"contextRef":{"kind":"country","destinationId":"JP","profileRevision":1},"question":"Find official visa application sources","refresh":false}' \
  http://127.0.0.1:8787/api/v1/assistant/research

curl -b cookies.txt \
  http://127.0.0.1:8787/api/v1/assistant/jobs/<jobId>
```

`profile.json` is `{ "expectedRevision": 0, "profile": <exampleProfile> }`.
Nullable profile fields must be supplied. Dates are actual calendar dates;
duration includes arrival and departure days. Group/individual schedules must
agree. Residence and held visas do not imply citizenship or eligibility.

Success uses `{data, meta}`; errors use `{error: {code, message, retryable,
fieldErrors}, meta}`. Async submissions return 202 and a job. Completed results
are `{type, data}`; type is profile_proposal, map_proposal, message, research,
explanation, enrichment, checklist or brief. DELETE success is 204; downloads
are Markdown or JSON without an envelope.

Same idempotency keys return the original job without spending again; changed
normalized bodies conflict. Client-message IDs are also deduplicated. Explicit
retry of failed work needs a new key. One message job runs per conversation,
with at most 200 stored messages. Profile/trip edits supersede pending jobs.
Cancellation cannot undo dispatched usage or cancel another consumer's refresh.

## Map and group semantics

Interpretation proposes actions/profile edits without applying them. Apply
supported transient actions in the frontend, then submit `/map/query`. Confirm
profile/shortlist edits before explicit PUT. Echoed revisions let the frontend
discard stale proposals. For focus_region, use trusted capabilities.regionViewports
from bundled coordinates; models return region IDs rather than arbitrary bounds.

API filters accept regionIds/accessLevels and default omitted minimumStayDays
to null. Generated set_filters actions always include minimumStayDays explicitly;
clear_filters uses a null payload. These choices fix actual Groq strict-schema
rejections observed during integration.

Query destination rows contain a travellers array (one self entry for a single
profile), classification, numeric stay, stayAssessment, assumptions and unresolved
conditions. All query calculations use one bundled version, with zero Groq/upstream
Travel Buddy calls. Cursors bind profiles and filters. Unknown purpose/stay data
is unassessed. Group baseline matches use visa-free, arrival or eVisa by default;
a visa-required member prevents a match. Documents/residence/future validity stay
unresolved and never grant access.

Trip CRUD, overlap and group context are local. Explicit enrichment deduplicates
supported stale passport pairs, at most three refresh attempts per job. Results
include refreshAttempts and providerCalls started by the job; shared/cache work
or quota blocks can make the latter smaller. Unsupported activities/types/purposes
do not trigger enrichment.

## Research, grounding and preparation

Ordinary messages default to cache-only Travel Buddy and no search; dataPolicy is
optional. Explicit country research or if_gap authorizes one search stage and
at most one structured finalization. A country-chat client may use explicit
research for narrowly detected destination-discovery questions, such as places to
visit, attractions, or things to do; it must keep entry questions cache-only.
Visitor discovery prefers official tourism and venue sources, remains unreviewed,
and never changes the passport matrix or entry guidance. Map/group chat never
fans out. Group research selects one destination and traveller through `/research`;
enrichment is separate.

For an explicit country-chat research question, the browser-search response is
rendered directly with its owned source links. This avoids a second strict-JSON
generation request after a successful search; ordinary map-context questions
continue through the configured assistant model.

Exact research cache reuse is one day. For a repeated broad visitor-discovery
question in the same session and selected country, country chat may also reuse the
most recent cached visitor answer rather than dispatch another browser search. The
message says that the suggestions are recent, source-backed, and still unreviewed;
entry research never uses this broader fallback. A fresh browser-search call is
bounded to 75 seconds within the 90-second job deadline.

Sources come from actual annotations or
`message.executed_tools[].search_results.results[]`, as observed live. The adapter
ignores prose URLs, opaque markers, reasoning, unsafe addresses and arbitrary tool
arguments. There is no fetch-any-URL proxy. Discovery leaves records unreviewed,
with null issuer/review dates until separate review. Empty excerpts and pages
for other jurisdictions remain gaps.

Evidence IDs must belong to the exact owned context. IDs alone cannot prove a
claim: absent support remains unknown, exact unreviewed quotations are partial,
and fixture conflicts remain conflicting. Unsupported requirement cards become
gap cards. Model wording remains unreviewed; runtime checks cannot prove every
paraphrase correct. Render text as text/escaped Markdown, never executable HTML.

No reviewed document rules are imported. Checklists return suggested review tasks
and gaps without invented documents, fees or deadlines. Held-document eligibility
is unavailable. Browser discovery is not a review/import pipeline.

Comparison/DNA explanations retain actual engine facts; change explanations use
owned snapshots. Transforms retain original claims and reject changed numbers;
English simplification also checks dropped negation. These conservative guards
are not complete multilingual semantic verification. Original facts stay available.

Briefs deterministically save selected country/group facts, chosen answers,
evidence, gaps and optional preparation tasks without another model call. Exports
include provenance and stale context. The language field records a preference;
brief saving does not silently translate answers. Request translation first.
Public links, invitations and multi-user synchronization are outside v1.

## Persistence and checks

Local sessions/profiles/chat/evidence/briefs expire after seven days. Job payloads
expire after one hour; idempotency reservations remain twenty-four hours. Research
reuse is limited to one day and exact session/question/context, except for the
explicitly labelled same-session/country visitor-discovery fallback above. Answer
caches also bind history/model/intent. Cleanup occurs during requests, not while
stopped.
Restart interrupts pending work without replay. Corrupt accounting fails closed
without disabling legacy APIs.

`npm.cmd run check` passed typecheck, 65 tests and build. Assistant coverage includes
all operations, ownership/CSRF, validation, idempotency, races, cancellation,
restart, budgets, grounding, transforms, pagination, group assessment and exports.
Existing engine, Travel Buddy and legacy research regressions remain in the suite.

Explicit live diagnostics are excluded from npm test:

```powershell
npm.cmd run assistant:live -- --live
.\node_modules\.bin\tsx.cmd scripts/test-assistant-http-live.ts --live --structured-only --chat-only
```

The first sends at most two requests; the HTTP script sends at most three (one
with the shown flags). Each rerun consumes fresh allowance. Reports stay in
ignored output. Live 120B strict JSON, map, chat and browser research succeeded.
Successful HTTP map/chat took about 1.6/2.7 seconds; browser checks took about
5.3/13.1 seconds. These are samples, not promises. Calibration exposed strict
schema incompatibilities and the account's 8000 TPM limit; see the
[implementation run](state/dev-integration/runs/20261010T215243Z-assistant-backend-c8b731.md).
