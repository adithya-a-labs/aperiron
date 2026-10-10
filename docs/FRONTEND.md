# Frontend environment

## Setup

Use Node 22.12+ in the 22.x line, or Node 24+. Install the committed npm lockfile:

```text
npm ci
npm run dev
npm run check
```

Vite binds to loopback on strict port 5173. If occupied, use an explicit free port,
for example `npm run dev -- --port 5175`. On Windows use `npm.cmd` if PowerShell
blocks the npm shim. No secrets, remote map service, database or backend server
are required. The current user requested implementation in the main checkout on
`dev-adithyaa`; sibling worktrees are not involved.

`check` runs TypeScript, Node tests through tsx, and a production build. `npm run
preview` serves the build. No lint configuration exists.

## Visual system

The user authorized applying the [colour palette](COLOUR_PALETTE.md) and the
`output/design-concepts/playful-v3` reference boards. The interface uses warm ivory,
navy typography, yellow pill actions, teal and blue map/DNA accents, and red stamps.
Locally authored SVG postcard art, passport booklets and landscapes reflect the
references without embedding a screenshot as a page. System fonts and bundled
world-atlas geography work offline. Layouts adapt from 360px to desktop, with
keyboard focus, native controls/dialogs and reduced-motion support.

React, TypeScript, Vite, Zustand, Lucide and Tailwind's Vite plugin remain the stack.
Most visual styling is semantic CSS. D3 and TopoJSON render the map and rotating
orthographic globe. React Simple Maps remains installed but is not used by this
implementation. No new runtime dependencies were needed.

## Pages and API mapping

| Hash route | Interface | Engine method(s) |
| --- | --- | --- |
| `#/explore` | Passport selection, searchable map/list, destination postcard, baseline/simulation toggle | `getCatalog`, `getPassportView` |
| `#/country` | Country notebook, purpose, missing-data and source context, separate fictional effect | `getDestinationRequirements`, `getPassportView` |
| `#/compare` | Two passports, swap, shared/unique sets, category differences, scores | `comparePassports` |
| `#/dna` | Deterministic petals, baseline/simulation patterns | `generateVisaDNA` |
| `#/market` | Category filters, preview dialog, purchase, balance, reset | `getCatalog`, `purchaseTreaty` |
| `#/impact` | Before/after maps and DNA, global delta, new pairs, purchased treaties | `calculateImpact`, `getPassportView`, `generateVisaDNA` |
| `#/optimizer` | Budget, greedy suggestions, projected world, explicit individual purchase | `optimizeTreaties`, `purchaseTreaty`, `getPassportView` |
| `#/more` | Supported-passport lottery and rotating globe; unavailable route/AI concepts | `getCatalog`, `getPassportView` |

## Engine integration

`src/frontend/engine.ts` selects the implementation of the authoritative
`src/shared/engineApi.ts` interface. It currently configures `MockAperironEngine`
with the 12-passport, 30-destination baseline matrix and 16 fictional treaties.
This is a functional local prototype, not the planned production engine.
The optional mock constructor dependencies are additive; default shared fixtures
and public method signatures remain unchanged.

`src/store/appStore.ts` holds passport/comparison/destination, world state and
purchase feedback. Pages derive calculations from the engine. Navigation uses
hash routes; selection and simulation survive page changes but reset on reload.
Preview and optimizer calls never mutate the active world. Reset preserves UI
selection. Engine failures on purchase become visible status messages.

The country notebook deliberately returns unknown requirements from the adapter.
Existing generic data fallbacks invent fees, stay limits and URLs; curated records
also lack claim-level verification evidence. These are not displayed as verified
travel information. Missing details are rendered explicitly. The notebook renders
contract fields and sources when a reviewed resolver supplies them.
See [DATA_POLICY.md](DATA_POLICY.md) for the review gate.

The old `frontend/types.ts`, `mocks/frontendAdapter.ts`, `store/explorerStore.ts`
and starter map/panel components are retained for compatibility with earlier
component work, but are no longer wired into `App.tsx`.

## Verification

`src/store/appStore.test.ts` covers all 360 matrix entries, destination preservation,
invalid IDs, immutable previews, purchases, duplicates, insufficient credits,
reset, DNA changes, optimizer bounds/projected impact, and honest missing data.
Browser QA covers all eight routes, desktop/mobile layouts, search misses,
passport changes, purchase/preview/reset, budget edges, lottery and globe controls.
Local evidence is written to ignored `output/playwright/`.
