# Parallel frontend worktrees

## Model

The integration checkout stays on `dev-adithyaa`. Parallel agents also represent
dev-adithyaa and work in detached worktrees based on the same committed foundation.
They do not create suffixed developer branches or use dev-prabhu's identity.
Prabhu retains ownership of actual engine/data implementation.

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
