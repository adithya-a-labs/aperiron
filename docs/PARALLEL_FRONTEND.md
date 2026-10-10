# Parallel frontend worktrees

## Model

The integration checkout stays on `dev-adithyaa`. Parallel agents also represent
dev-adithyaa and work in detached worktrees based on the same committed foundation.
They do not create suffixed developer branches or use dev-prabhu's identity.
Prabhu retains ownership of actual engine/data implementation.

## Page workspace setup

Five detached worktrees were created from commit `bc18264` and relocated at the
user's request to sibling folders beside the integration checkout:
`../aperiron-explore`, `../aperiron-compare`, `../aperiron-dna`,
`../aperiron-market`, and `../aperiron-optimizer`. These are ordinary local Git
worktrees and can be opened directly by any local editor or agent with filesystem
access. The older map/panel worktrees were removed at the user's request; their
commits are retained locally at `refs/archive/frontend-map` and
`refs/archive/frontend-panel`.
The integration checkout keeps port 5173.

| Workspace | Development port | Production preview port | Owned page directory |
| --- | --- | --- | --- |
| aperiron-explore | 5174 | 6174 | `src/pages/explore/` plus map/panel component files |
| aperiron-compare | 5175 | 6175 | `src/pages/compare/` |
| aperiron-dna | 5176 | 6176 | `src/pages/dna/` |
| aperiron-market | 5177 | 6177 | `src/pages/market/`, including impact |
| aperiron-optimizer | 5178 | 6178 | `src/pages/optimizer/` |

These page directories describe ownership; page implementation is still pending.
Every workspace initially runs the same foundation app. Each has independent
dependencies installed from the lockfile, a workspace-specific `WORKTREE.md`, an
`AGENTS.md` pointer to it, and Vite development/preview port overrides. Both ports
are strict; occupied ports cause failure rather than automatic reassignment.

From the relevant workspace use `npm.cmd run dev`. For production preview use
`npm.cmd run build`, then `npm.cmd run preview`. The workspace notes also define
scope, shared-file boundaries, design direction and verification expectations.
No page workers or long-running servers are started by setup.

The coordinator can rerun `scripts/setup-page-worktree.ps1 -Page explore` (or
another table entry) after creating the local sibling workspace. The script checks the
expected Git root, retains existing work, configures the assigned ports and runs
`npm ci`. It reinstalls dependencies; do not run it during an active package task.
It needs filesystem access to the sibling checkout and registry access when the
npm cache lacks a package. It does not create worktrees itself.

Workspace-specific `WORKTREE.md`, the local `AGENTS.md` pointer and Vite port
overrides are setup changes, not shared page implementation. Exclude or reconcile
them when integrating page commits; do not overwrite the coordinator's port 5173.
The coordinator setup scripts remain in the integration checkout; they are newer
than the common workspace baseline.

Shared types and the mock engine now exist in `src/shared/` and
`src/mocks/mockEngine.ts`. The explorer still consumes its provisional adapter.
Read actual TypeScript contracts before wiring pages; do not infer integration
or verified regulation coverage from mock fixtures or generated concept images.

Setup also corrected type-only imports in `src/shared/engineApi.ts`,
`src/shared/fixtures.ts` and `src/mocks/mockEngine.ts`, including one unused import.
The merged baseline failed the existing TypeScript configuration without these
corrections. The same import-only patch is present in the coordinator and all five
page workspaces; API signatures, fixture values and calculation semantics are
unchanged. These corrections are local until committed/integrated.

After builds exist, `node scripts/verify-page-worktree-ports.mjs` verifies that all
five development servers and all five production previews can respond at once,
and that a duplicate Explore instance refuses port 5174. It stops only processes
it started. Run it while the assigned ports are free; it does not stop existing
servers. This is an environment check, not browser behavior or visual validation.

## Initial assignments

| Task | Allowed implementation files | Result |
| --- | --- | --- |
| World map | `src/components/WorldMap.tsx`, `src/components/WorldMap.css` | Responsive offline SVG country map, access colors, selectable supported countries, selected state, and an accessible destination list. |
| Destination panel | `src/components/DestinationPanel.tsx`, `src/components/DestinationPanel.css` | Controlled country brief with category, context, missing-data states, sample label, available sources, and close action. |

Both agents may add a uniquely named entry in their own `dev-adithyaa/runs/`
folder and update their worktree's own state summary as required. The coordinator
reconciles competing state summaries while preserving all unique histories.

The coordinator owns `App.tsx`, `styles.css`, store, adapter, config, dependencies,
lockfile, shared docs, and integration. No parallel agent changes engine semantics,
shared interfaces, or package versions. Report required boundary changes instead.

## Agent handoff requirements

Read root instructions and relevant product/frontend docs. Keep established props
and fixture assumptions intact. Work only in the assigned worktree. Use the
foundation's installed dependencies; run `npm ci` in that worktree if necessary.
Do not connect components directly to a store or invent regulation details.

Run typecheck, focused tests, and build when available. Include keyboard/focus,
selected/empty states, mobile layout, and sample-vs-sourced differentiation. Log
actual work and limitations. Commit only assigned component files plus your own
unique run entry/state update. Return the commit hash and worktree path. No push.

## Integration

Review each returned diff before bringing it into dev-adithyaa. Integrate one task
at a time, reconcile current-state conflicts, and preserve both unique log entries.
Then run the combined checks and exercise the actual browser flow on desktop and
mobile. Passing isolated builds does not prove the combined UI works.

Keep worktrees until their work is committed and integrated. Archive disposable
managed worktrees after verification; they can be restored through the app. A
worktree is local isolation, not cross-device synchronization. Git push/fetch is
still needed when sharing authorized work with the other device.
