# Verification guide

## Hosted runtime

`server/deployment.test.ts` uses embedded Postgres to verify instance sharing,
ownership, concurrent revisions, rollback, durable job inputs/outbox, cancellation,
shared provider budgets/leases, quota persistence and serialized checklist work.
`server/postgres-driver.test.ts` additionally uses the actual production postgres.js
driver over PGlite Socket to cover JSONB serialization, quota/cache persistence,
session/resource reload and atomic repair of historically encoded records. Direct
embedded queries alone do not test driver parameter serialization.
`npm run build:vercel` verifies compilation of API and Workflow functions alongside
static assets. Its packaging guard rejects top-level source API files and checks
the API function resolves to Nitro's bundle. `npm run verify:vercel` then exercises
the compiled Node handler over local HTTP with synthetic sessions and no provider
calls, including frontend rendering and fail-closed hosted API errors.
Follow [deployment acceptance checks](DEPLOYMENT.md#verification-before-production-use)
against a connected preview project before production use; local tests do not
verify cloud Workflow execution or live provider credentials.

## Evidence standard

Verify observable behavior and meaningful invariants. Record the command or manual
scenario, outcome, and relevant failure details in the run log. A check that was
not executed is `not run`, never a pass. A type check does not prove visual behavior;
a successful build does not prove data accuracy.

Use checks proportionate to the change. Documentation edits need link/format and
consistency checks; they do not justify inventing application tests. Broaden
verification when new code, a failure, or an unresolved concern warrants it.

## Current commands

The documentation repository supports:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check-docs.ps1
git diff --check
```

The first checks local Markdown links and repo-local skill metadata. It does not
check external sites, prove prose correctness, or validate visas. The second
checks tracked diff whitespace; newly created files also need review.
The process-only policy override allows this unsigned repository script on Windows
without changing persistent execution policy. The checker uses inline local links
and simple skill frontmatter; it does not validate arbitrary Markdown or YAML.

The frontend supports `npm run typecheck`, `npm test`, `npm run build`, and
`npm run check` (all three). See [FRONTEND.md](FRONTEND.md) for installation and
ports. Node's test runner covers invalid IDs, destination preservation across passport
switching, reset, and fictional/unverified fixture provenance. There is no lint
configuration yet. Browser checks cover the integrated map/panel flow separately.

For the local sibling page workspaces, the coordinator can use
`node scripts/verify-page-worktree-ports.mjs` after building each workspace. It
checks simultaneous development/production-preview HTTP responses and strict
port collision handling, then stops its own server processes. Assigned ports
must be free. See [PARALLEL_FRONTEND.md](PARALLEL_FRONTEND.md) for setup and ports.

## Checks by change

| Area | Useful verification |
| --- | --- |
| Shared contract | Type check consumers; run shared fixtures against mock and real implementations. |
| Access and comparison | Known category mapping, stable ordering, invalid IDs, unknown permissions, set membership and scores. |
| DNA | Repeated-input determinism; length/range; known fixture; encoding changes only when relevant inputs change. |
| Purchases | Exact credit cost, no input mutation, duplicates, insufficient funds, overlap precedence, reset. |
| Impact | No-op delta, unique newly accessible pairs, category upgrades, before/after consistency. |
| Optimizer | Budget bounds, unpurchased unique IDs, repeatability, overlapping effects, zero-cost handling, actual projected impact. |
| Regulations | Schema, source support, applicable conditions, missing fields, review status, baseline/simulation isolation. |
| UI | Selection flow, keyboard access, loading/error states, stale-response handling, small screens. |
| Docs and skills | Local links, metadata, correct instructions, no unsupported claims or machine-specific paths. |

For immutability tests, retain a before snapshot or freeze a fixture and exercise
both success and failure paths. For optimizer verification, apply recommendations
to a copy through actual engine functions and compare the reported result. A tiny
exhaustive oracle may help assess greedy behavior; do not demand global optimality
from an algorithm that promises only a heuristic recommendation.

## Core integration scenarios

1. Select passport A, open destination X, and check the panel's classification and
   source context against the dataset. Switch to B with X still open; no A data remains.
2. Compare A and B and check highlighted destinations against returned comparison sets.
3. Generate DNA twice for the same effective state and verify the numeric output matches.
4. Purchase a known treaty. Verify cost, affected permissions, calculated impact,
   and the map/DNA/dashboard updates agree. Unaffected results remain consistent.
5. Attempt a duplicate and an unaffordable purchase. Verify state stays unchanged.
6. Run the optimizer and inspect its recommendation. Verify active state is unchanged
   until an explicit apply action. Check the actual applied impact if supported.
7. Reset and confirm baseline results return. Real source records were never overwritten.
8. After initial load, disconnect external services and check the supported local
   experience. If AI exists, its failure should leave structured information usable.

These scenarios become automated browser tests where useful once the app exists.
Until then they are acceptance criteria, not completed checks.

## Optional AI evaluation

If adopted, include supported questions, missing source data, contradictory
guidance, incomplete traveller context, stale responses after passport switching,
and model/API failures. Check claim-level citation support and avoid measuring
quality solely by fluent wording. Verify no model output changes engine state.

## Completion reporting

Summarize what changed, why it matters, checks performed, and material remaining
limitations. Write the same factual verification result in the developer run log.
Do not describe the other developer's work as verified unless you performed the
relevant checks against the integrated code.

## Playful frontend regression coverage

Retained app source consumes all eight engine methods; game pages are paused.
`npm test` includes the
`src/store/appStore.test.ts` integration suite, starter adapter tests, real-engine
integration tests, full CSV/runtime consistency and catalog/map coverage checks, and all five legacy
verification scripts under `tests/verify-*.ts`. The runner counts each legacy
script as one test containing several assertions.
Browser acceptance includes every active hash route at desktop widths,
keyboard activation of supported map countries, missing search results, preserved
destination after passport switching, comparison groups, deterministic DNA,
non-spending previews, successful purchases, reset, budget zero, lottery and globe.
Bundled snapshot classifications are not verified visa advice. Browser/source checks do
not validate travel guidance. Transit planning remains unavailable. Optional Groq
research is available in the Country Notebook. `npm test` includes actual loopback
HTTP tests for successful research, invalid/oversized inputs, missing configuration,
provider auth/rate-limit failures, malformed responses and credential non-disclosure.
Provider responses in automated tests are mocked; authenticated Groq requests need
an account key and are a separate verification step.

Research regressions also cover upstream cooldown preservation, no repeated
dispatch during cooldown and truncated empty completions. Assistant schema tests
exercise nullable enum/type handling across every generation schema without
changing the public runtime contracts. The manual HTTP assistant diagnostic exits
nonzero when a submitted job fails; inspect its report for provider rate limits
instead of treating successful script startup as API success.

Storage fault regressions cover failed running/result writes, no provider dispatch
before a saved transition, no unsaved result publication, retained idempotency and
queue recovery. They run in `npm test` alongside all assistant HTTP operations.

## Desktop frontend audit regression

The [desktop audit resolution](FRONTEND_AUDIT_2026-10-11.md#resolution--2026-10-11)
records the original 13 findings and fixes. Verify all five active pages at
1366×768, 1440×900 and 1920×1080 with a long passport name. Compare document
scroll width to client width, accounting for the vertical scrollbar. Mobile
optimization is outside this audit's scope.

Check picker active-descendant semantics, Enter/Escape focus, Tab dismissal and
empty results. Each map/globe should have one Tab stop; arrows/Home/End browse
visible countries and Enter/Space select. Reduced motion must have no SMIL or
page-entry animations. Explore's legend and primary requirements action should
be easy to locate at the smallest target desktop viewport.

Search must truthfully select List, announce results and preserve the query after
selection. Compare must expose both access categories and open either passport's
notebook without losing the pair. Reload and browser back must preserve valid
catalog IDs; malformed IDs fall back safely and paused routes show Explore.
`tests/verify-frontend-navigation.ts` covers deep links, validation and safe research
URL extraction. Check same-passport and zero-search-result explanations.

Stub provider refreshes and research to avoid spending quota. Check distinct
notebook action rows, tourism-only provider details, safe clickable unverified
research leads and recovery after 503. Lottery draw must preview without changing
the globe until adoption. DNA must show six counts and distinguish unknown from
restricted without changing vector weights. Missing postcard photos must never
be requested. Record screen-reader/actual-zoom checks separately when available.

## Assistant backend checks

The [Trips frontend](TRIP_PLANNER.md) adds client-over-HTTP and store race/recovery
tests, plus browser scenarios for setup, shortlist, per-person context, tasks,
export downloads and responsive layout. See its branch state for observed results.

`npm test` includes `server/assistant.test.ts`: actual loopback HTTP coverage for
all 30 operations and runtime request/response schemas. Tests cover Origin/CSRF,
session isolation, malformed/oversized requests, calendar dates, idempotency,
duplicate messages, revisions, busy conversations, cancellation, supersession,
restart, queue/rate/budget limits, provider cooldown, map pagination, unknown stay,
group intersection/deduplication/quota reserve, source grounding, transforms and
immutable historical exports. Providers are mocked; these tests spend no quota.
The integrated suite currently passes 68 tests plus typecheck/build.

OpenAPI drift is checked against the authoritative runtime schemas and operation
catalog in that suite. Also run `npm.cmd run assistant:openapi -- --check`.
This is contract consistency verification, not an independent external OpenAPI
linter. Read [backend handoff](ASSISTANT_BACKEND.md) for endpoint formats and known
evidence limits.

Explicit diagnostic commands in the guide authenticate real 120B strict output,
map/chat HTTP jobs and browser search, with per-run call caps and ignored reports.
Actual source metadata can have empty excerpts or mismatched jurisdictions. A
successful API call validates entitlement and response format, not travel rules.
Account rate limits and strict-schema failures are distinct from mocked success.

## Manual Travel Buddy trial

The implemented service is covered by mocked provider tests for normalizing rules,
persistent fresh-cache reads, context/self exclusions, pair deduplication, global
concurrency, quota reserve/restart/reset, authentication correction, timeout fallback,
malformed/oversized output and HTTP boundaries. Frontend store tests cover late
responses and older cache reads; exploration tests preserve snapshot/DNA/simulation.
These tests run with npm test. They make no authenticated provider requests.

Browser acceptance: initial map/search/passport switching use zero upstream calls;
cached destination visits and reloads preserve quota. Deliberate uncached/stale
selection performs at most one shared call. Check tourism-only details, conditions,
links, source/fetch labels, quiet precise map/list updates and mobile overflow.
Verify fallback when no key/server/quota is available. Refreshing local cache routes
does not necessarily mean an upstream call: inspect the persistent quota ledger.

No application data source switches during this trial. Run the dry-run command:

```powershell
.\node_modules\.bin\tsx.cmd scripts/test-travel-buddy.ts
```

After subscribing to the free Basic plan, set TRAVEL_BUDDY_API_KEY in ignored .env.
Append --live to send at most three sequential visa-check requests (IN/JP, IN/SG,
CN/ID), with no retries and a ten-second timeout per request. Any HTTP, network or
schema failure stops the trial. Every manual rerun can consume three more requests;
this standalone diagnostic bypasses the implemented persistent quota service.
Prefer the application's refresh route for normal verification.

The report under ignored output/travel-buddy/ includes provider response fields,
snapshot values, latency and available quota headers. Review missing fields,
primary/secondary rules, conditions and link destinations before deciding on a
source migration. Successful retrieval does not verify travel requirements.

Consumer authentication follows [RapidAPI Auth](https://docs.rapidapi.com/docs/configuring-api-security);
response expectations follow [Travel Buddy v2](https://travel-buddy.ai/api/).
The script is excluded from the automatic test glob and the browser bundle.

## Desktop re-audit regression acceptance

Use the assigned running app origin. For this repair run it is
http://127.0.0.1:5174 only. Compare Explore at 1366×768, 1440×899/900/901 and
1920×1080. Map, character and destination panel must retain useful sizing; the
three adjacent heights must not change their dimensions abruptly. Allow vertical
scrolling instead of compressing content. Check a long country name and unknown
stay fields. Supporting desktop text is at least 12px.

Filter comparison to Japan and inspect the second passport; reload must preserve
its context. Check full-width cells and separated actions. Check notebook block
links, all six DNA counts and a synthetic research HTTPS URL with an unbroken
240-character path. Compare the notebook's own client/scroll widths, since outer
page overflow alone can miss internal clipping. Keep prose escaped and leads
explicitly unverified. Intercept provider writes for these layout checks.

Observe companion image source changes with no reduced-motion preference:
keyboard destination selection must stay static, explicit pointer playback may
run, destination changes must cancel it, and reduced motion must remain static.
The companion is decoration and should add no keyboard control. Check one Tab
stop per map/globe and empty-search recovery. Browser evidence for the repaired
run is documented in the frontend re-audit report.
