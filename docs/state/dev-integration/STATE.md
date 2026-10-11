# dev-integration state

- Updated at: 2026-10-11T02:15:20Z
- Status: ready_for_review
- Task: Integrate imagegen postcards and landmark pipeline into dev-integration
- Branch: dev-integration
- Baseline commit: 23524ea
- Latest run: [Postcard integration](runs/20261011T021520Z-postcard-cherry-picks-e6a49c.md)

## Completed

Imported source commits 69c7546 and 4585357 as be28c3e and c1637af with reviewed
resolutions preserving current summaries and other developers' records. All 210
WebPs are present, covering every one of the 199 catalog destinations. Imported
landmark registry, authoring scripts, generation inputs and regional batches.

Committed UI wiring and pipeline corrections as b347467. Explore and Trips share
the postcard component, with image loading, landmark/location badge, honest generic
SVG fallback and country-change recovery. Corrected JSON generation paths to match
the shipped registry and added three regression tests. Frontend documentation updated.

Prior R01-R09 frontend repairs, layout, companion behavior, comparison, notebook,
DNA, backend and Trips milestones remain preserved. See the
[previous grouped repair record](runs/20261011T014812Z-grouped-commits-c482a7.md)
and earlier integration history for their evidence and limits.

## In progress

None for the requested integration.

## Verification

Final npm run check passes TypeScript, 84/84 tests and production build. All 210
assets match the source commit byte for byte; all 199 runtime images decode in the
browser. Registry regeneration preserves metadata and image paths. Keyboard map
selection tested for France, Iran, Macau, Kosovo and Japan; failed image fallback
and subsequent recovery pass. Three desktop sizes have no horizontal overflow;
reduced-motion transitions disabled. Documentation and whitespace checks pass.

Initial sandbox HTTP fixture failures resolved with loopback-enabled execution.
Existing Vite loader/chunk warnings are non-fatal. Browser API calls intercepted;
no live provider generation, authenticated Trips or exhaustive pointer-map audit.

## Blockers

None for this task. Existing regulation/source review and provider operational
constraints remain separate from decorative artwork integration.

## Next actions

Review local integration commits; push only when requested. Preserve the corrected
registry generation input and the existing frontend repairs.

## Coordination

Explicit dev-integration task. Other developer histories unchanged; source imagegen
checkout untouched. Shared Artwork changes preserve DNA categories and existing CSS.
Catalog, baseline matrix and shared engine contracts unchanged. Existing app on
5174 reused for isolated browser verification. Commits and records remain local;
no push performed.
