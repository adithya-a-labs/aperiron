# Vercel deployment

The production target is `main`. The application keeps React/Vite and the browser
engine. Nitro deploys the existing `/api` routes as Node functions; Workflow runs
assistant jobs. Managed Postgres stores private resources, provider accounting,
job inputs and the dispatch outbox. Railway is not used.

## Connect the project

1. Import this Git repository into Vercel. Set **Settings → Environments → Production
   → Branch Tracking** (or the Production Branch setting shown by your dashboard)
   to `main`. Repository configuration cannot set the project's production branch.
2. Use the repository root, Node **22.x**, and Fluid Compute. `vercel.json` selects
   `npm ci` and `npm run build:vercel`. Clear any previous Output Directory override:
   Nitro generates `.vercel/output`, including static files and functions. Do not
   point the deployment at `server/` or configure a long-running start command.
3. Add a managed Postgres integration through Vercel Marketplace, such as Neon.
   Connect its pooled URL as `DATABASE_URL` or `POSTGRES_URL`. Use separate databases
   or branches for Production and Preview. The database is a managed service; all
   application code and background execution are hosted on Vercel.
4. Configure the server environment variables below. Redeploy after changing them.
5. Run the schema migration against the intended database before serving the API.
   Pull environment variables through Vercel's environment UI/CLI or supply them
   securely in your shell; never commit them. `npm run db:migrate` is idempotent and
   creates only the application's `aperiron_*` tables. It does not import local trips.
6. Set the actual remaining Travel Buddy subscription allowance, if enabling it:
   `npm run db:travel-quota -- --remaining N --limit 120`. This explicitly reconciles
   the ledger, refuses to run while refreshes are active, and is never run on builds
   or cold starts. Keep the default zero if the subscription is unavailable.
7. Deploy the reviewed `main` commit. Check `/api/health`, then the acceptance checks
   below. This guide/configuration does not itself push or publish changes.

## Server environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` or `POSTGRES_URL` | Pooled managed Postgres connection URL; required for the hosted API. |
| `GROQ_API_KEY` | Required for research and model-backed assistant operations. |
| `GROQ_ASSISTANT_MODEL` | Defaults to `openai/gpt-oss-120b`; legacy research retains its existing model. |
| `ASSISTANT_DAILY_TOKEN_BUDGET` | Shared conservative token reservations; default 500000. |
| `ASSISTANT_DAILY_SEARCH_BUDGET` | Shared search allowance including legacy research; default 10. |
| `ASSISTANT_ALLOWED_ORIGINS` | Comma-separated exact custom frontend origins. Vercel's deployment and production URLs are also allowed. |
| `TRAVEL_BUDDY_API_KEY` | Optional RapidAPI provider key; required for live destination enrichment. |
| `TRAVEL_BUDDY_REFRESH_DAYS` | Cache freshness; default 7. |
| `TRAVEL_BUDDY_RETENTION_DAYS` | Cached-record retention; default 30. |
| `TRAVEL_BUDDY_QUOTA_RESERVE` | Allowance kept unused; default 20. |
| `TRAVEL_BUDDY_CONCURRENCY` | Shared maximum provider refreshes; default 2. |
| `CRON_SECRET` | Generated secret for Vercel's maintenance cron authorization. |

Never prefix provider/database credentials with `VITE_`. The deployed API forces
Secure, HttpOnly, SameSite=Strict session cookies. Same-origin API requests and CSRF
protection are retained. There are no public accounts: session-owned resources
still expire after seven days. Losing the cookie loses access to that session.

`ASSISTANT_STORE_DIR`, `TRAVEL_BUDDY_CACHE_DIR`, server ports and
`TRAVEL_BUDDY_INITIAL_REMAINING` are local-runtime settings, not production storage.
Missing hosted storage returns unavailable errors; it never falls back to ephemeral
files. The static map, comparison and Visa DNA remain available independently.

## Persistence and concurrency

`server/deployment/schema.sql` creates records keyed by session scope, collection
and resource ID, plus lease and dispatch tables. Records include sessions/profiles,
trips, conversations/messages, evidence, briefs, answer/context caches, jobs,
idempotency keys, inputs, daily budgets and cooldowns. Travel cache entries and quota
use separate scopes. JSON payload shapes preserve the existing HTTP contracts.

Short Postgres transactions serialize assistant state transitions with a database
row lock. A request's revision checks and accepted writes commit together. Provider
calls happen outside these transactions. The implementation reads the current
session's records rather than every user's records, but the shared assistant lock
is intentionally conservative: it favors correctness for this demo over high write
throughput. Higher traffic warrants narrower transaction methods and lock scopes.

Travel Buddy uses a separate transactional quota ledger and expiring shared leases.
Concurrent refreshes for the same pair do not dispatch twice; another instance
returns cached/miss information with a short cooldown. Reservations are persisted
before dispatch. Corrupt/unavailable quota fails closed. Cache age/provenance and
snapshot-versus-provider separation are unchanged.

## Background work and recovery

All eight existing job kinds store validated, serializable inputs. Submission
atomically creates the job, idempotency reservation, accepted resource changes and
outbox row. Dispatch occurs after commit and before returning the response when
possible. If dispatch fails, subsequent authenticated requests/polls retry it; the
daily maintenance task also reconciles the outbox.

Workflow executes a job with a shared concurrency lease (two jobs). Duplicate
workflow dispatches cannot execute a job twice. Database status/context guards
prevent cancelled, superseded or expired work from publishing late results. A
provider call already in progress may still consume quota after cancellation.

Current work retains its 90-second execution deadline. The workflow can wait for a
slot for up to about two minutes; the frontend polls with bounded backoff and a
four-minute overall wait. A restarted worker does not blindly replay an ambiguous
provider operation: an existing running claim becomes an explicit interrupted
failure after its lease expires. Deadline recovery also occurs on job polling.
Failures before provider dispatch can be retried by the workflow. This is durable
scheduling with conservative failure reporting, not an exactly-once provider API.

`/api/maintenance` is protected by `CRON_SECRET`; `vercel.json` schedules it daily at
03:00 UTC (08:30 India time). It removes expired/orphaned records and retries pending
dispatches. Expiration and authorization are checked at read time too. Physical
deletion can lag expiry until maintenance runs. Public responses disable caching.

## Static assets and local development

Images in `public/` are included as static assets; Blob storage is unnecessary for
the bundled postcards and companion frames. No application uploads are introduced.
The checked-in set contains 262 WebP files totaling about 25.1 MB; all are present
in the verified Vercel static output. Build on Vercel rather than uploading the
Windows-generated prebuilt functions, which trace platform-specific dependencies.

Use npm and the committed `package-lock.json`. `npm run dev` runs Vite/Nitro and
the API together. With no database URL and outside Vercel, the API uses the existing
file-backed services. With a database URL, it uses Postgres and Workflow. The
standalone `npm run server` command remains the local file-backed API alternative.
`npm run build` builds the default Nitro target; `npm run build:vercel` explicitly
builds the Vercel target. `npm run preview` previews the built Nitro application.

## Verification before production use

- Run `npm run typecheck`, `npm test`, `npm run assistant:openapi -- --check`, and
  `npm run build:vercel`. Embedded Postgres tests spend no provider quota.
- Confirm build output contains static images, API functions and Workflow routes,
  with a Node runtime and duration above the bounded provider work.
- Against the connected preview database, verify cookie bootstrap, CSRF, ownership,
  trip revision conflicts, duplicate submission, job completion/cancellation, brief
  exports and persistence across redeployments.
- Verify selected-pair cache reuse and shared quota/concurrency. Use synthetic
  providers first; live provider checks consume allowance and need valid credentials.
- Check rejected origins, missing keys/database, exhausted budgets, protected
  maintenance, and static exploration while the API is unavailable.
- Exercise a real Workflow on Vercel and verify lease/deadline recovery. Local build
  and embedded database checks do not prove cloud entitlement or provider access.

Official references: [Vite Workflow setup](https://workflow-sdk.dev/docs/getting-started/vite),
[Vercel storage](https://vercel.com/docs/storage),
[Vercel Workflows](https://vercel.com/docs/workflows), and
[function limits](https://vercel.com/docs/functions/limitations).

Nitro is pinned to its current v3 beta release for the documented Vite/Workflow
integration. Retest the build and hosted acceptance scenarios before dependency
upgrades. The local build verifies packaging; it does not establish cloud readiness.
