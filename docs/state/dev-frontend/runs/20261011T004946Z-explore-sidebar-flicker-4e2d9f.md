# Run 20261011T004946Z-explore-sidebar-flicker-4e2d9f

- Developer/work lane: dev-frontend
- Started at: 2026-10-11T00:38:00Z
- Finished at: 2026-10-11T00:49:46Z
- Task: Stop the Explore postcard and Bot Explorer flicker on destination changes; slightly increase Bot Explorer size
- Outcome: completed
- Branch: dev-frontend
- Baseline commit: 328692e

## Work performed

- Added an Explore-only `stableImage` option to `PostcardArt`. On country changes, the postcard no longer makes its artwork transparent or inserts the shimmer overlay.
- Kept the Bot Explorer's 2-loop country-change animation, but start it only after all 52 current WebP frames have loaded and retain the preloaded image objects for the component lifetime.
- Increased the Bot Explorer image width from 160px to 180px.
- Preserved the existing bot frame format and all unrelated local work. No contracts, engine logic, data or text changed.

## Files changed

- `src/App.tsx`: Enables stable postcard artwork only in the Explore sidebar.
- `src/components/Artwork.tsx`: Adds the opt-in stable artwork rendering behavior.
- `src/components/BotExplorer.tsx`: Gates playback on completed frame preloading to prevent image-source flashes.
- `src/styles.css`: Increases Bot Explorer width to 180px.
- `docs/state/dev-frontend/STATE.md`: Updates the frontend-lane summary.
- `docs/state/dev-frontend/runs/20261011T004946Z-explore-sidebar-flicker-4e2d9f.md`: Records this run.

## Verification

| Check | Result | Evidence or reason |
| --- | --- | --- |
| `npm run typecheck` | passed | Completed with zero TypeScript diagnostics. |
| `npm test` | passed | 44 tests passed, 0 failed. |
| Browser country switching | passed | Repeated Canada → Japan selection retained one postcard and one Bot Explorer, showed no postcard shimmer, and advanced cached bot frames at 180px width. |
| `git diff --check` | passed | No whitespace errors; only Windows line-ending warnings were reported. |
| Production build | not run | The change is localized frontend presentation behavior; typecheck, full tests and browser verification passed. |

## Blockers and remaining work

None.

## Next actions

- Await user feedback from the active local Explore view.

## Coordination and handoff

- Changes stay within the `dev-frontend` UI scope. The current `.webp` bot-frame asset format was preserved.
- No commit, push, branch change or remote operation was performed. Existing local changes and untracked assets remain untouched.
