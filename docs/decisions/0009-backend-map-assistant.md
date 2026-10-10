# 0009: Backend-only map assistant and group planning

- Date: 2026-10-11 (Asia/Calcutta)
- Status: accepted
- Work lane: dev-integration

## Context and acceptance

The user requested a detailed backend endpoint plan for map interaction, contextual
country chat and group planning, then explicitly instructed implementation and
live testing of Groq GPT-OSS 120B/browser search without frontend changes. The
next request resumed that interrupted implementation. This authorizes the local
backend milestone, without approving an AI-first UI redesign or deployment.

## Decision

Implement additive `/api/v1/assistant` services using the existing synchronous
engine, cached Travel Buddy details, bounded 120B generation and targeted browser
research. Keep the engine and legacy three routes compatible. Preserve the local
snapshot as map/comparison/DNA basis. Model output proposes UI/profile edits;
it cannot write baseline eligibility.

Use owned local sessions, CSRF, revisions, persistent idempotency, bounded jobs
and atomic single-process storage. Country opening, manual queries and polling
make no upstream calls. Group enrichment is explicit, deduplicated and bounded
by selected stale pairs and existing quota reservations.

Discovery remains unreviewed. Required checklists need reviewed rules; current
coverage produces preparation tasks and gaps. Briefs save facts and selected
answers deterministically. UI implementation, public accounts/share links,
document uploads and booking remain outside this milestone.

## Alternatives and consequences

A generic autonomous loop would complicate predictable usage; fixed intent
routing covers these endpoints. Full live-map fetching would spend quota on
routine exploration already supported by the snapshot/cache. A hosted database
would require account/deployment decisions outside this local milestone.

Storage requires one process per directory. Search may return empty excerpts or
mismatched jurisdictions. Strict JSON validates shape, not truth, and source IDs
do not prove support. Conservative grounding, gaps and retained facts are required.
The account's measured rate limit requires paced usage and explicit retries after
cooldown. Frontend integration remains a separate handoff.

See [backend guide](../ASSISTANT_BACKEND.md), [plan](../LLM_BACKEND_PLAN.md) and
[run evidence](../state/dev-integration/runs/20261010T215243Z-assistant-backend-c8b731.md).
