# Run 20261010T200030Z-travel-buddy-live-87d4b2

- Developer/work lane: dev-integration
- Started at: 2026-10-10T19:57:38Z
- Finished at: 2026-10-10T20:00:48.609Z
- Task: Test configured Travel Buddy Basic API for data breadth and latency
- Outcome: completed
- Branch: dev-integration
- Baseline commit: 61befb1

## Work performed

No application code changed. Initial authenticated IN/JP request timed out at 10,011 ms. Unauthenticated connectivity probe returned 401; DNS succeeded. Ten subsequent authenticated requests succeeded with 30-second limits and no automatic retries: five checks (IN/JP, CN/ID, IN/SG, IN/US, IN/TR), three maps (IN, SG, US), one weighted ranking and one history probe. Raw results and human-readable report saved under ignored output/travel-buddy/. No credentials recorded.

Maps each contain 211 unique codes including the passport itself in red (633 total entries). Check responses include country metadata, primary rules, optional duration/link, secondary rule, registration and conditional exception. IN/TR exception contains SH among raw country_codes; interpretation requires clarification. Basic ranking explicitly limited to ten passports with eight category counts. History explicitly demo and returns KZ/ME despite requesting IN/JP; unusable for real history. Provider links redirect; embassy directory is third-party. No complete document checklist, fees or processing times observed. generated_at is not source verification.

Successful latency 423–10,886 ms, median 1,120.5 ms. Successful response bodies total 9,787 bytes. Last quota headers show limit 120, remaining 109; timed-out call appears counted. Do not mistake separate 500,000 RapidAPI hard-limit header for subscription allowance. No paid action or source migration.

## Files changed

- Own STATE.md and this run entry: observed trial results.
- Ignored output/travel-buddy/: raw JSON and REPORT.md; not synchronized through Git.

## Verification

| Check | Result | Evidence or reason |
| --- | --- | --- |
| Authenticated API exploration | passed | Ten HTTP 200 responses across four endpoint types |
| Initial bounded trial | failed | 10-second timeout; no response received |
| Coverage and timing aggregation | passed | Three maps each 211 unique codes; latency/body counts computed from results |
| Application suite | not run | No application code changed |

## Blockers and remaining work

No exploration blocker. Official-source verification, redirect targets, conditional-code semantics, caching terms and production reliability remain unverified. Full worldwide detailed matrix not fetched; free quota insufficient for 39,601 detail calls.

## Next actions

Design server-side provider resolver with snapshot fallback, quota-aware caching and longer timeout; reject demo history, filter self-map entries, preserve coarse map semantics. Confirm caching terms before bulk retention or migration.

## Coordination and handoff

Only integration records changed. Application remains on bundled snapshot. No commits or pushes this run. Earlier trial setup was committed by user in 61befb1.
