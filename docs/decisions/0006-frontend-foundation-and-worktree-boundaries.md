# 0006 - Frontend foundation and isolated component work

- Date: 2026-10-10
- Status: accepted
- Accepted by: implementation choice within the user's frontend setup and parallel worktree request
- Supersedes: documentation-only runtime status; speculative frontend package selection
- Superseded by: none

## Decision

Use React/Vite/TypeScript, npm with pinned dependencies and one lockfile, Tailwind's
Vite plugin, Zustand UI selection, Lucide, and Node's test runner through tsx. Use D3 geographic projection
with locally packaged TopoJSON/world-atlas data for the initial map instead of
adding a React map wrapper. Defer additional UI/motion libraries until needed.

Create a provisional frontend adapter under `src/frontend/` rather than freezing
Prabhu's core contract through a UI setup task. The adapter's fixture classifications
are fictional and contain no invented fees, processing times, documents, or sources.

After the common scaffold passes checks, commit it as the shared worktree baseline.
Keep the integration branch exactly dev-adithyaa; independent component agents
use detached managed worktrees based on that commit. They own distinct map/panel
files, while the coordinator owns shared configuration, state, and integration.

## Rationale and consequences

This makes the frontend runnable and lets component agents work independently
without requiring a database, server, or premature engine decisions. Direct D3
projection keeps the geometry local and avoids coupling map behavior to another
React component abstraction. Engine integration remains a coordinated adapter change.

Individual worktree checks are followed by combined browser verification. Agent
state summaries must be reconciled without losing unique run entries. No remote
push, deployment, or AI integration is implied by this choice.

See [FRONTEND.md](../FRONTEND.md) and [PARALLEL_FRONTEND.md](../PARALLEL_FRONTEND.md).
