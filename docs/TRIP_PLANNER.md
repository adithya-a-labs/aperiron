# Local group trip planner

The user authorized the Trips frontend and reuse of existing APIs on the exact
`dev-tripplanner` branch on 2026-10-11. The page is available at `#/trips` through
the main navigation. It follows the existing ivory, navy, yellow and illustrated
travel design. The generated concept is design input, not an embedded UI image.

## Delivered workflow

- Create and edit one active local trip with 1–6 labelled travellers, shared
  dates or duration and an optional group budget preference/currency.
- Enter passport country/type, purpose, optional residence and held visa/permit
  descriptors. Shared dates apply to all travellers. No document uploads or
  passport numbers are collected. Budget is not a cost estimate.
- Explore all returned group results on a map or searchable list. Region and
  entry-category filters use the backend; the group-match toggle filters the
  returned `matches` flag. All query pages load before map results are published.
  Countries outside the current result set stay hatched.
  Entry-category visibility is separate from group eligibility: the Unknown
  filter includes unassessed destinations, and stay warnings do not hide a
  matching category. A numeric minimum-stay filter still requires known capacity.
- Save up to ten shortlisted destinations. Select a country to review each
  person's snapshot classification, numeric stay where known, unresolved
  conditions, source provenance and cached provider information.
- Explicitly refresh one selected traveller/destination pair. No routine map,
  filter, trip-save or panel action calls a provider. An unavailable provider
  leaves snapshot facts usable.
- Generate suggested review tasks and gaps, then save/download an immutable
  Markdown or JSON brief through the existing backend. No model is required.

Current reviewed document coverage is empty. Tasks are suggested preparation,
not a verified document checklist. A baseline match never promises entry or
establishes route/transit feasibility. Unsupported purposes and passport types
remain unknown. Documents and residence never grant access automatically.

## API and state

No new HTTP endpoints or shared engine contracts were needed. The typed client
uses the existing schemas in `src/shared/assistant` and the routes documented in
[the backend handoff](ASSISTANT_BACKEND.md).

Integration corrected one internal query edge case: trip queries now always use
the group defaults (visa-free, arrival, eVisa) even with one traveller. Explicit
entry filters still override those defaults. Single-profile map queries preserve
their existing behavior. Pagination hashes include the query mode, so an old
cursor must be replaced by a fresh query after this update.

| Action | Existing endpoint under `/api/v1/assistant` |
| --- | --- |
| Establish owned local session | `POST /sessions` |
| Create / read / save trip | `POST /trips`, `GET /trips/{tripId}`, `PUT /trips/{tripId}` |
| Group map/list | `POST /trips/{tripId}/destinations/query` |
| Per-person destination context | `GET /trips/{tripId}/countries/{destinationId}/context` |
| Explicit bounded refresh | `POST /trips/{tripId}/enrichment` |
| Review tasks / brief | `POST /checklists`, `POST /briefs` |
| Poll / cancel work | `GET /jobs/{jobId}`, `DELETE /jobs/{jobId}` |
| Download | `GET /briefs/{briefId}/export?format=markdown` or `format=json` |

`src/frontend/assistantClient.ts` handles the same-origin cookie, in-memory CSRF
token, runtime response validation, pagination and job polling/cancellation.
Async submissions use UUID idempotency keys; mutations are not automatically
replayed after failures. The server keeps its existing Origin allowlist and quota
limits. Use normal port 5173, or explicitly configure a custom origin as described
in the backend guide. Port 5184 is already in the local allowlist.

Cancellation during job submission waits for the bounded acknowledgement, then
cancels the returned job rather than losing its ID by aborting the POST. Already
cancelled work is not submitted. A lost acknowledgement or failed cancellation
request can still leave server work running until its existing deadline; the
client does not retry mutations automatically.

`src/store/tripPlannerStore.ts` keeps confirmed resources separate from form
drafts. Query and context requests are cancelled and late results ignored when
selection/revision changes. Trip edits invalidate preparation/export results.
Revision conflicts preserve the draft and require loading the current revision
before resaving. Expired resources can be explicitly saved as a new local copy.

Only the opaque active-trip ID is stored in localStorage. Traveller descriptors
stay in memory and the owned server session, not URLs or browser storage.
Reload restores that ID when the cookie-owned session still exists. The existing
backend expires local sessions/resources after seven days; exports provide a
durable copy. There is no trip-list endpoint or public sharing/multi-user editing.

## Files and extension boundaries

The page is `src/pages/TripPlanner.tsx`, with scoped styling alongside it.
`src/components/trips/TripSetup.tsx` owns the native modal form; `GroupMap.tsx`
renders bundled geography using API group assessments without recalculating
eligibility. Existing Explore/Compare/DNA map semantics remain unchanged.

Task completion persistence, itinerary activities, booking, live pricing,
transit routing, document uploads and invitations require additional accepted
scope and coordinated contracts. Contextual AI chat remains optional future UI.

## Verification

`server/trip-planner-client.test.ts` exercises the browser client against real
loopback HTTP: cookie/CSRF, complete 199-country pagination, revision conflicts,
country context, preparation and export, with no provider calls.
`src/store/tripPlannerStore.test.ts` checks out-of-order results, conflicts,
expiry recovery and superseded preparation. Both run in `npm run check`.

Browser acceptance covers setup, save, restore, search, keyboard and pointer map
selection, shortlist, unsupported purpose, task generation, actual download,
mocked failures and recovery. Check 1366×768, 1440×900 and 1920×1080, plus a narrow
viewport. Current run evidence and limitations belong in the
[trip-planner state](state/dev-tripplanner/STATE.md).
