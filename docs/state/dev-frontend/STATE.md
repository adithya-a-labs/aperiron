# dev-frontend state

- Updated at: 2026-10-10T23:06:35Z
- Status: ready_for_review
- Task: Keep the active passport option visible during keyboard navigation
- Branch: dev-frontend
- Baseline commit: 9259c96f6157aa4449ee0ee80dba693a8bcd5bdb
- Latest run: [Passport selector scrolling](runs/20261010T230635Z-passport-selector-scroll-2a7f6e.md)

## Completed

- Converted route line stroke and endpoint anchor dots to solid black (`#000000`).
- Fixed animation replaying when changing clicked countries by adding SVG timeline reset (`setCurrentTime(0)`), `.beginElement()` triggers on all SMIL animation nodes, and CSS animation classes for persistent replay on every destination change.
- Replaced the reusable passport selector with a click-open, searchable dropdown. It filters by passport name or ISO code and retains the existing selection callback.
- Added a visible downward chevron beside the selected passport in the selector trigger.
- Added Arrow-key navigation, Enter selection and a visible active-option state to the passport dropdown.
- Kept the active passport option in view while Arrow-key navigation moves through the scrollable dropdown list.
- All changes are local and uncommitted (0 commits).

## In progress

None.

## Verification

`npm run typecheck` passed (0 diagnostics) after the selector change.
Prior `npm test` passed (44 of 44 suites passed).
Prior `npm run build` passed (production bundle compiled cleanly).
`git diff --check` passed for the selector change; an unrelated existing run record has a trailing-newline warning.
Local uncommitted working tree preserved; 0 commits made.

## Blockers

None.

## Next actions

Await further user instructions. Commit or push only when explicitly requested by the user.

## Coordination

Work performed strictly in the `dev-frontend` collaboration lane on `src/components/AccessMap.tsx`.
Engine calculation contracts remain untouched. All changes are local and uncommitted.

