# Travel Buddy production persistence correction

- Developer: dev-adithyaa (session attribution)
- Finished at: 2026-10-11T03:58:40Z
- Branch: main
- Baseline commit: 40799252fe9e43594f3d973fd39d5046d549b9ec
- Task: Diagnose and fix Travel Buddy integration failure on Vercel
- Outcome: correction verified locally; deployment, data repair and quota reconciliation pending

## Observed failure

Read production /api/health (200, ok) and a cache-only destination read (200, miss).
One normal IN/JP refresh returned request accounting unavailable before provider
dispatch. No Travel Buddy provider request was spent by that probe. User queried
Neon and confirmed the travel quota record is a JSON string containing encoded
JSON, with remaining zero and limit 120. A nonempty key is configured sufficiently
to reach accounting, but real provider authentication has not been verified.

postgres.js infers a JSONB parameter and serializes an already JSON.stringify'd
value a second time. The same write pattern existed in assistant storage and the
quota configuration script. Direct PGlite queries used by prior tests did not
exercise the production driver's serialization. The first attempted socket test
used a non-URL helper return and was corrected; the actual reproduction then failed
with quota accounting needs recovery before the fix.

## Changes

All four JSON write sites now explicitly bind text before casting to JSONB.
Exported a production connection factory for actual-driver testing and added the
official PGlite Socket development test dependency. Added a real postgres.js wire
test covering refresh/cache reuse, quota persistence, session/resource reload and
stored JSON object types. Added a single-statement repair-jsonb.sql plus
npm run db:repair-json for previously encoded records. Repair takes state locks,
preserves quota/ownership/expiry, is idempotent and rolls back malformed payloads.
No allowance is fabricated or automatically reset. Deployment and verification
docs describe rollout and the prior test coverage gap.

## Verification

- Passed: reproduction fails before JSON cast fix, passes after it.
- Passed: full npm test, 89/89, including atomic repair/rollback and real-driver regression.
- Passed: Vercel build/typecheck, packaging assertions and compiled HTTP smoke checks.
- Passed: documentation links and git diff --check.
- npm install reports zero vulnerabilities.
- Not run: cloud repair, quota initialization, new deployment or real provider validation.
  No local database credentials are configured; user has not supplied the actual
  current RapidAPI remaining allowance/limit requested asynchronously. The user
  does not know those numbers; guide them to the RapidAPI subscription usage page
  before changing the persisted allowance.

## Next actions and coordination

Publish and deploy this correction before repairing the production rows, then run
server/deployment/repair-jsonb.sql in the matching production Neon SQL Editor (or
the repair command). Reconcile actual RapidAPI allowance; preserving zero will
correctly keep live calls blocked by reserve. Verify one real refresh and cache reuse.
The health check only establishes schema/connection health, not ledger integrity.

Changes and records are local, uncommitted and unpushed. Prior deployment-source
record changes were preserved. Other developer records untouched. HTTP payload
contracts, baseline engine and visa classifications are unchanged. No unverified
provider information was promoted to verified regulation data.
