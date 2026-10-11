# Vercel route packaging correction

- Developer: dev-adithyaa (session attribution)
- Finished at: 2026-10-11T03:40:38Z
- Task: Fix deployed ERR_MODULE_NOT_FOUND for server/api-server
- Branch: main
- Baseline commit: 404a7cd861e7a511de9f08786361cc778740b50c
- Outcome: corrected locally and verified; cloud redeployment required

## Diagnosis and change

User runtime logs establish HTTP 500 loading raw /api/[...path].js, which imports
extensionless server modules. This is separate from the successful build reviewed
in the preceding run. The previous local compiled-function smoke check did not
cover Vercel's independent discovery of the top-level source API directory.

Nitro's official Vercel documentation explicitly requires routes/api instead of
top-level api. Moved the handler to routes/api/[...path].ts, adjusted relative imports
and TypeScript inclusion. Public paths/payloads and provider/database logic are unchanged.
Added build guards against source API folder collisions and checks that the emitted
API function resolves to Nitro's bundle, with Workflow routing still present.
Added npm run verify:vercel for compiled Node frontend/API/session smoke testing.
Updated deployment and verification docs.

## Verification

- Passed: npm run build:vercel, including typecheck and emitted packaging assertions.
- Passed: npm run verify:vercel over local HTTP, including frontend render, missing
  database errors, protected maintenance, unknown API path, session body/cookies
  and owned profile read. No providers or cloud database called.
- Passed: documentation links and git diff --check.
- Not run: full application suite; business logic unchanged and affected packaging
  verified directly. Earlier 88-test pass belongs to the original deployment run.
- Not run: Vercel CLI end-to-end upload/build and cloud request against a new commit;
  no new deployment exists from this local fix yet.

## Handoff

Commit/push this fix to main when authorized, then deploy that new commit and check
the app, /api/health and real Workflow execution. Redeploying old 404a7cd retains the
bug. Earlier setup/log-review records remain local; no commit or push performed
by this run. Other developer records untouched. Existing session attribution retained.

Reference: https://nitro.build/deploy/providers/vercel#api-routes
