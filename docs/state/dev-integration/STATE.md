# dev-integration state

- Updated at: 2026-10-10T22:31:13Z
- Status: ready_for_review
- Task: Group and commit backend integration changes
- Branch: dev-integration
- Baseline commit: f8789dd
- Latest run: [Grouped assistant commits](runs/20261010T222917Z-grouped-assistant-commits-a943ce.md)

## Completed

Implemented all 30 versioned assistant operations: sessions/profiles, proposals,
deterministic map queries, cache-only country context, scoped conversations,
research/evidence/jobs, explanation actions, local trips/group overlap, bounded
enrichment, preparation checklists and immutable brief exports. Shared runtime
schemas/types/fixtures, generated OpenAPI, origin/CSRF checks, ownership, revisions,
persistent idempotency, queue/rate/budget controls, restart interruption and
provider cooldown are delivered. New model work uses 120B; legacy 20B and the
three original routes remain compatible. No frontend, engine or dataset edits.

Live 120B strict JSON, map proposals, cached country chat and browser research
succeeded. Real schema incompatibilities were fixed and account TPM rejection
handled explicitly. Discovered sources and model explanations remain unreviewed;
held-document exceptions cannot grant access. No reviewed document rules exist,
so checklists provide preparation tasks and gaps. Brief saving is deterministic.

[Backend guide](../../ASSISTANT_BACKEND.md) and
[accepted decision](../../decisions/0009-backend-map-assistant.md) document the
frontend handoff, runtime limits and evidence boundaries. Project docs reconciled.

Previously delivered full snapshot coverage remains 199 passports/destinations,
39,601 pairs, version 1.1.0-passport-index-full and 199-value DNA. Existing Travel
Buddy enrichment/cache and quota controls remain; no live Travel Buddy calls
were made this run. The game stays paused. Prior implementation/evaluation
history is preserved in the runs directory.

## In progress

No remaining backend implementation work in this milestone. Frontend integration,
official evidence review/import and multilingual semantic evaluation are separate
follow-ups, not delivered UI or verified travel guidance.

## Verification

npm run check passed: typecheck, 65 tests, production build. Final focused
assistant regression after resource-type/CORS tightening: 21/21 and typecheck
passed. All 30 operations exercise runtime response validation. Existing engine,
Travel Buddy and legacy research tests passed. OpenAPI generation/drift and docs
checks passed; no independent external OpenAPI linter. JavaScript remains
489.92 KB (gzip 155.51 KB), with the same frontend bundle filename.

Twelve bounded authenticated Groq attempts across diagnostics: five successful,
six schema rejections during calibration, one TPM rejection. Successful strict
probe about 2.5 s; HTTP map about 1.6 s, chat about 2.7 s; searches about 13.1 s
and 5.3 s. Successful responses reported 44,877 total tokens. No live Travel Buddy
refreshes. Timing is observational, not a guarantee. Raw diagnostic reports are
ignored and do not enter branch logs.

## Blockers

No implementation blocker. Account 8000 TPM requires pacing/cooldown. Snapshot,
provider details and browser findings remain unreviewed; no reviewed document
coverage or automatic permit exceptions. Single-process private file store only.
Translation guards do not establish complete semantic correctness. Existing Vite
future-native-loader advisory remains nonblocking.

## Next actions

Frontend team can consume the backend guide/OpenAPI/fixtures without changing
engine calculations. Review/import official evidence before required document
checklists or permit-dependent eligibility. Review the grouped commits; push only
when requested.

## Coordination

Explicit dev-integration assignment; both module owners' records untouched.
Additive assistant contracts serve future frontend consumers; existing eight
engine methods and legacy payloads are unchanged. TravelService gains an internal
optional dispatch observer for accurate per-job counts. Server/Vite middleware
configuration changed; frontend implementation files did not. Planning edits
preserved. Backend work and documentation are grouped into 34 focused local
commits, including the final state/run record. No push.
