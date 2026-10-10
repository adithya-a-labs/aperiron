# 0008 - Travel Buddy destination enrichment

- Date: 2026-10-11
- Status: accepted
- Accepted by: user in the dev-integration conversation
- Supersedes: none
- Superseded by: none

## Context

The bundled Passport Index snapshot powers 199 passports and 199 destinations.
Travel Buddy Basic live trials returned useful pair-specific rules, alternatives,
exceptions, passport validity, arrival formalities and application links. Some
links resolved to government guidance. No structured supporting-document
checklist was returned. Bulk map colours merge classifications, custom ranking
is limited to ten passports, and history returns explicitly marked demo data.
The last observed subscription balance was 105 of 120 requests; this is a
historical observation, not a guaranteed current balance.

## Alternatives

- Replacing the complete matrix with detailed provider calls exceeds the free
  allowance even for a single passport's 199 destinations.
- Using bulk provider maps loses distinctions required by the existing legend.
- Keeping only local data misses useful application and arrival-form discovery.

## Decision

Keep the local dataset as the primary source for map coverage, search,
comparison, scoring, Visa DNA and simulation. Use Travel Buddy as the preferred
source of additional details for a selected passport-destination pair, with a
persistent cache and graceful local fallback. Normal interaction uses only the
detail-check endpoint. No bulk map, ranking or history requests are required.

Show existing information immediately and refresh missing or stale details in
the background after deliberate destination selection. Visually quiet updates
retain source and retrieval labels. Material access changes receive a small
notice. Exact primary-rule changes may update the exploration cell, without
rewriting the baseline matrix or model calculations. Conditional alternatives
never become unconditional entry permissions.

Implementation is pending. The sequence and operational defaults below are
proposed implementation choices within this accepted direction.

## Implementation plan

### 1. Shared detail contract and normalizer

- Add `src/shared/travelDetails.ts` for additive provider-detail types; preserve
  the existing synchronous eight-method engine contract.
- Preserve primary, secondary and exception rules separately, raw rule labels,
  textual durations, passport-validity text, registration and application links.
- Store provider/schema version, passport/destination, supported traveller
  context, language, fetchedAt and provider generatedAt. Never infer verifiedAt.
- Map exact known rule names, rather than provider colours. Preserve unknown
  labels without a map override. Distinguish online visa required from eVisa;
  preserve eTA's raw label alongside the existing combined engine category.
- A conditional exception requires traveller evidence before use. The observed
  exception code SH must not be assumed to mean an ISO country or Schengen
  membership without provider clarification.
- Missing document lists, fees and processing estimates remain unavailable.
  Restrict provider application to ordinary-passport tourism; unsupported
  contexts retain existing unknown behavior. Self pairs never trigger requests.

### 2. Provider client, persistent cache and quota control

- Add `server/travel-buddy.ts` for the fixed upstream host, server-only key,
  bounded responses, 30-second timeout and validated response identity/schema.
- Add `server/travel-cache.ts` with an ignored, configurable local directory.
  Key entries by provider/schema version, passport, destination, supported
  context and language. Validate on load and use serialized atomic writes.
- Keep successful cached data when refresh or disk writes fail. Quota state
  must be reserved durably before dispatch; if reservation cannot be persisted,
  skip the upstream call. Corrupt cache entries fall back without guessing data.
- The first implementation supports one local server process. All its browser
  clients share the same cache, in-flight requests and quota ledger.
- Import validated successful pair responses from the ignored trial artifacts,
  retaining their original fetch timestamps. Ignore map/ranking/demo responses.
  Importing does not contact the provider.
- Proposed defaults: seven-day refresh age, 400 ms selection debounce, two
  concurrent upstream calls and twenty requests held in reserve. All are
  configurable; the refresh age is not an official freshness guarantee.
- Coalesce identical requests before reserving quota. Count attempted calls,
  including timeouts, conservatively. Reconcile request-specific remaining/reset
  headers with outstanding reservations; ignore the unrelated platform hard
  limit. Shared external use of the key can still reduce allowance unexpectedly.
- No automatic retries. Use a bounded failure cooldown; honor Retry-After.
  Stop calls on quota exhaustion or authentication failure. Reset behavior must
  use observed provider reset information, not a guessed calendar month.
- Confirm provider cache-retention terms before durable cached use. No paid
  subscription change is part of implementation.

### 3. Local service routes

- Add `server/travel-details.ts`: cache-only GET `/api/travel-details` and POST
  `/api/travel-details/refresh`. Both validate IDs and context.
- GET returns cached data and freshness metadata, or an explicit miss. POST
  rechecks freshness and quota and returns the completed refresh or a typed
  fallback outcome. Manual refresh cannot bypass quota controls.
- Add a cache-only passport overlay read (for example a passport filter on GET)
  so previously fetched pairs can restore map overlays after browser restarts
  without fetching each destination separately.
- Register routes in Vite development/preview middleware and the local standalone
  server. Keep Groq research independent. Do not add an arbitrary URL-fetch proxy.
- Return usable cached data with explicit freshness/source metadata when the
  provider is unavailable. Never expose keys or raw upstream authentication errors.

### 4. Active frontend integration

- Add `src/store/travelDetailsStore.ts` and a small selection hook. Integrate the
  active `src/App.tsx` and `src/store/appStore.ts` flow, not starter components.
- Render engine snapshot information immediately. Load saved details from the
  local server; a fresh entry needs no provider request.
- Only deliberate destination selection/opening triggers refresh eligibility.
  Debounce selection; recheck the same pair server-side before any upstream call.
- Map render, hover, country search, initial default selection, passport-only
  changes, comparison and DNA do not contact Travel Buddy. Opening details after
  a passport change checks the new pair rather than reusing the former passport.
- Identify every result by pair/context. Late responses may populate their own
  cache entry but cannot overwrite another selected panel. Browser cancellation
  must not cancel a refresh shared by other clients.
- Preserve existing selection, map position, panel layout and focus during
  refresh. Show a compact source and last-checked label; materially changed rules
  receive a quiet update notice. Older results retain their actual date.

### 5. Exploration overlays and useful links

- Apply only an unambiguous primary-rule category to that passport's exploration
  map/list entry. Cache reads restore overrides; no full matrix replacement.
- Resolve map/list tags and visible category counts from one composed exploration
  view. Keep snapshot scores, comparison and DNA explicitly labeled as snapshot
  calculations, so a fresher exploration cell does not imply recalculation.
- Place the composition outside rendering code; reuse engine classification and
  breakdown helpers where present. Keep fictional treaty calculations separate.
- Present application links, arrival-form links, validity, alternatives and
  conditions. Distinguish arrival registration from a visa application.
- Preserve safe HTTPS provider redirects as provider links. Only describe a final
  destination as checked government guidance when that redirect was actually
  inspected; a URL alone does not verify its complete requirements.
- Do not automatically scrape official pages or generate document checklists.
  Those need a separately scoped source extraction and applicability review.

### 6. Verification and documentation

- Normalizer fixtures: observed primary/secondary/exception shapes, unknown
  labels, malformed/mismatched IDs, missing fields and unsupported contexts.
- Cache/service checks: persistence across restart, corrupt files, atomic writes,
  failed quota reservation, expiry, concurrent deduplication, reserve threshold,
  timeouts, authentication failure and quota reset handling.
- UI checks: quick selection races, repeated selection, reload, no key/server,
  offline provider, stable layout, conditional display and simulation separation.
- Use mocked provider responses for automated tests. Run `npm run check`, the
  documentation checker and browser acceptance checks. If needed, limit a live
  smoke check to one budgeted uncached pair; do not repeat the exploratory suite.
- Update architecture/contracts/data policy/setup/verification docs to describe
  actual implemented behavior. Record implementation in the integration lane.

## Acceptance criteria

| Interaction | Expected provider calls |
| --- | --- |
| Initial map, search, hover, passport switching | Zero |
| Open a fresh cached pair, including after restart | Zero |
| Select an uncached or stale supported pair | At most one |
| Several clients request the same stale pair concurrently | One shared call |
| Offline provider, invalid key or reserve reached | Zero further calls; retain usable data |
| Comparison, Visa DNA and simulation | Zero |

For a timed-out dispatch, a request may still count against provider quota even
though no data is received. Missing API fields remain explicit, cached timestamps
are honest, precise overrides never come from colour groups, and no secret enters
the browser bundle or logs.

## Consequences

This gives the hackathon full immediate map coverage with useful pair-specific
enrichment at a bounded request cost. The local Node service must run for cache
reads and refreshes; static hosting alone retains the bundled experience.
The single-process disk cache is adequate for the local demo; multi-instance
deployment would require shared persistence and cross-process coordination.

## Acceptance and references

The user accepted the strengths-based local-map/provider-detail approach and
requested a revised detailed implementation plan. Earlier agent suggestions to
make Travel Buddy primary for the whole map are not the selected direction.

- [Architecture](../ARCHITECTURE.md)
- [Shared contract semantics](../CONTRACTS.md)
- [Data policy](../DATA_POLICY.md)
- [Observed Basic trial](../state/dev-integration/runs/20261010T200030Z-travel-buddy-live-87d4b2.md)
- [Observed document-link trial](../state/dev-integration/runs/20261010T200500Z-document-links-56e9a1.md)
