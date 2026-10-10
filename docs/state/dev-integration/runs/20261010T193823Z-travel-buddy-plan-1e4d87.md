# Run 20261010T193823Z-travel-buddy-plan-1e4d87

- Developer: dev-integration
- Started at: not recorded precisely
- Finished at: 2026-10-10T19:39:08.908Z
- Task: Frame a tight implementation plan for Travel Buddy enrichment
- Outcome: completed investigation and proposed plan; no implementation changed
- Branch: dev-integration
- Baseline commit: fa67371444b972d6d09a57474147e8af8d420fc7

## Work performed

Read the supplied proposal, current engine requirements types, Groq handler,
Vite dev/preview setup, policy docs and all developer state summaries including
the merged frontend collaboration lane. Checked current provider documentation:
[Travel Buddy API](https://travel-buddy.ai/api/) and
[RapidAPI playground](https://rapidapi.com/TravelBuddyAI/api/visa-requirement/playground).

Provider page currently advertises 120 free requests/month. Actual subscribed
quota, reset period, authentication and caching terms still require account-level
confirmation. The current response is nested data.passport, data.destination,
data.visa_rules and data.mandatory_registration, not the pasted flat example.
Provider example contains redirect application links and a third-party embassy
directory; fetched data/links must not automatically be marked officially verified.
Free history must not be presented as real policy history; provider docs restrict
real history to higher-tier access and mark demo responses.

## Proposed implementation sequence

1. Confirm account Basic entitlement, auth snippet, reset timing and storage terms.
   Obtain 2-3 sanitized real visa-check responses only after key configuration;
   use fixtures for the remaining development/testing. Do not infer rate limits.
2. Add src/shared/liveVisa.ts, separate from synchronous AperironEngine and
   DestinationRequirements. Include passport/destination/context, primary/secondary
   rules with their own durations, conditional exceptions, passport validity,
   registration, URLs, destination metadata, fetchedAt/providerGeneratedAt,
   cache status and provider/unverified provenance. Preserve unknowns and text;
   do not parse arbitrary duration strings or stamp verifiedAt on retrieval.
3. Implement POST /api/visa-details in server/travel-buddy.ts; integrate dev,
   preview and standalone API startup. Validate supported different country IDs,
   ordinary-tourism applicability, returned pair and response shape. Use fixed
   upstream host, server-only key, bounded response/body size and a 10-second
   timeout. No automatic retries. Return typed configuration, unsupported,
   quota/rate-limit, timeout and provider-unavailable states without upstream leaks.
4. Add server-side shared persistent cache and durable request budget, with locked
   atomic reserve-before-dispatch, concurrent same-key coalescing, conservative
   failure accounting and a configured budget below the confirmed allowance.
   Proposed cap 100 if the confirmed account has all 120 available. Start with
   24-hour freshness only if terms permit; expired results are visibly stale.
   Match actual billing reset; never guess a calendar reset. Store locally in an
   ignored cache directory, not browser-local quota counters. No bulk fetch,
   prefetch, polling or forced-refresh bypass. Account usage outside this app is
   not covered by its ledger; observe provider remaining/reset headers when present.
5. Add explicit Check current visa details to Country Notebook. Render a separate
   provider section beneath the unchanged snapshot. Lazy request only on button;
   preserve raw eTA/registration distinctions, conditional exceptions and rule-
   specific durations. Label third-party data, retrieval date and stale/conflict
   states. Never overwrite map, scores, comparison, DNA or simulation. Restrict
   URLs to safe HTTPS; do not auto-fetch arbitrary redirects or label links
   verified official without review. Abort/ignore stale selection responses.
6. Verify parser variants, mismatched pairs, unknown categories, unsafe links,
   cache hits/expiry, restart/concurrent budget enforcement, provider errors,
   zero automatic calls on navigation, stale-response isolation and unchanged
   engine results. Run npm run check, actual loopback tests with mocked upstream,
   desktop/mobile browser checks, then at most 2-3 authenticated smoke checks
   within budget. Update API/data/setup/verification docs and own handoff records.

Scope is optional ordinary-tourism notebook enrichment. Historical timelines,
remote map/rank APIs, automatic baseline updates, business/transit inference,
new paid plans, deployment and additional databases are excluded from the first
implementation slice. This is a proposed technical plan, not delivered behavior.

## Files changed

This planning run and own STATE.md only; no application/config/provider call changes.

## Verification

| Check | Result | Evidence or reason |
| --- | --- | --- |
| Repo/source review | passed | Current branch clean before writing; shared contracts and API entry points inspected. |
| Provider documentation | passed | Official provider page inspected; live authenticated contract not confirmed. |
| Documentation/whitespace | passed | Project checker and git diff --check after logging. |
| Application checks and provider calls | not run | Planning-only request; no implementation or API key used. |

## Blockers and remaining work

No blocker to planning. Authenticated integration needs a subscribed server-side
credential and account-level quota/cache confirmation. Source verification remains
separate from provider retrieval. No promise that free quota supports production load.

## Next actions

Implement the scoped adapter, server cache/budget and notebook integration when
execution is requested. Keep tests mocked except a small bounded live smoke check.

## Coordination and handoff

Integration identity preserved; frontend lane and other developers' records remain
untouched. Shared type additions/server changes and notebook consumer should land
as coordinated changes on dev-integration. Current HEAD includes merge fa67371;
older log statements refer to earlier checkpoints. This plan/state update is local
and uncommitted; no commit, push, task creation or external message performed.
