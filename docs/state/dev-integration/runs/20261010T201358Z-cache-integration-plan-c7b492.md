# Run 20261010T201358Z-cache-integration-plan-c7b492

- Developer/work lane: dev-integration
- Started at: 2026-10-10T20:13:58.337Z
- Finished at: 2026-10-10T20:13:58.337Z
- Task: Detail quota-efficient Travel Buddy integration plan
- Outcome: completed (planning only)
- Branch: dev-integration
- Baseline commit: 61befb1

## Work performed

Reviewed current source, architecture, contracts and earlier live trials. Interrupted preceding planning turn produced no implementation or running commands to recover. No application changes and no provider requests this run. Active UI is App.tsx/appStore.ts; starter DestinationPanel/explorerStore are not the integration target. Eight-method synchronous engine remains local and unchanged.

## Proposed implementation sequence

1. Add shared travel-details contract and pure normalizer. Preserve provider raw primary/secondary/exception rules, validity, duration, registration and links. Track fetchedAt separately from provider generatedAt; verifiedAt stays unset. Recognize exact labels including Online visa required, Freedom of movement and Not admitted; unknown labels remain unmapped. Conditional exceptions cannot override primary access. Unsupported traveller purpose/passport types use existing unknown behavior.
2. Add server-side provider client, disk cache and quota ledger. Cache key includes provider/schema version, passport, destination, ordinary-passport tourism context and language. Ignored local cache directory, validated load, serialized atomic writes. Corrupt cache degrades safely. Successful trial data can be imported explicitly with zero provider calls. Cache retention remains subject to provider terms. One shared server cache for browsers; JSON implementation scoped to single local process.
3. Add cache-only GET /api/travel-details and POST /api/travel-details/refresh. Register handlers with existing Vite dev/preview middleware and standalone server. Existing Groq remains separate. Keys stay server-side; validate input, fixed upstream host, bounded responses, no arbitrary link-fetch proxy. Refresh rechecks freshness server-side.
4. Proposed configurable refresh age seven days for demo; older results displayed with actual date. One in-flight refresh per pair across clients, global concurrency at most two, no automatic upstream retries. Persistent conservative quota accounting reserves attempted calls including timeouts; reconcile actual request quota headers. Stop at reserve of twenty calls or auth/quota failure until reset/config correction. Short failure cooldown avoids repeated clicks spending calls. Manual refresh respects controls and cannot bypass reserve. Last observed quota 105/120 is historical, not a current guaranteed balance.
5. Add frontend detail store/hook separate from fictional world state. Existing snapshot renders immediately; cache read replaces available fields, stale/missing entry refreshes once after settled user selection (~400 ms). No refresh on hover, initial default selection, map draw, passport-only switching, search or comparison/DNA. Request identity prevents stale responses updating newly selected panel; old pair may still cache. Closing panel does not discard shared server refresh.
6. Compose provider-backed detail fields with explicit source/fetch metadata. Missing documents/fees/processing remain unknown. Show official/application links without scraping pages automatically. Update one exploration map/list cell only from supported unconditional precise primary rule; preserve simulation separation, self handling and unsupported contexts. Overlay per passport persists via cached records and local UI storage for immediate return visits. Scores, comparison and DNA stay snapshot-based, explicitly labeled to explain any difference from updated exploration cells. Small updated notice for material access changes; no layout reset or loading overlay.
7. Test normalizer, cache restart/corruption, concurrent dedupe, clock expiry, quota reservation/timeouts, rate limits, key absence, malformed/mismatched payloads, rapid selection race, source labels, unknown fields and simulation isolation. Mock provider requests for tests; run npm run check, docs checker and browser behavior. Live smoke limited to one explicitly budgeted uncached pair if necessary.
8. Update architecture/contracts/data policy/verification docs with implemented behavior, then own state/run log. Optional commit groups when user requests: provider/cache/contracts; UI integration; verification/docs. No automatic commits or paid upgrade.

## Files changed

Only own state and this plan/run record. Proposed files: src/shared/travelDetails.ts, server/travel-buddy.ts, server/travel-cache.ts, server/travel-details.ts, src/store/travelDetailsStore.ts, active App.tsx/appStore.ts and middleware registration. Names remain implementation choices.

## Verification

| Check | Result | Evidence or reason |
| --- | --- | --- |
| Source/contract review | passed | Active App.tsx routes, appStore, shared contracts, Vite research middleware inspected |
| Implementation tests | not run | Planning only |
| Provider calls | not run | Existing observed trial evidence sufficient |

## Blockers and remaining work

Implementation pending. Confirm provider retention terms before durable cached use. Seven-day refresh age and twenty-call reserve are proposed defaults, not accepted source freshness guarantees. No full matrix fetch or structured official-document extraction planned.

## Next actions

Implement normalizer/cache/quota first, then server route and active UI integration, followed by verification.

## Coordination and handoff

Preserve all previous run entries and other owners records. Shared contract addition only; no existing engine signature change. Local uncommitted planning/log changes; no push.
