# Frontend environment

## Setup

Frontend-only collaboration uses `dev-frontend`. Read its
[scope and ownership boundaries](DEVELOPMENT.md#dev-frontend-dedicated-frontend-branch)
and maintain its [state/run records](state/dev-frontend/STATE.md). Unified application
integration continues on `dev-integration`.

Use Node 22.12+ in the 22.x line, or Node 24+. Install the committed npm lockfile:

```text
npm ci
npm run dev
npm run check
```

Vite binds to loopback on strict port 5173. If occupied, use an explicit free port,
for example `npm run dev -- --port 5175`. On Windows use `npm.cmd` if PowerShell
blocks the npm shim. No secrets, remote map service, database or backend server
are required. Integration uses the current checkout on `dev-integration`;
sibling worktrees are not involved.

`check` runs TypeScript, Node tests through tsx, and a production build. `npm run
preview` serves the build. No lint configuration exists.

To enable Groq Browser Search research locally, copy `.env.example` to a root
`.env` and set `GROQ_API_KEY`, then run **only `npm run dev`**. Vite serves the
backend endpoint `/api/groq-research` on the same local port as the frontend;
no second terminal or proxy configuration is needed. `npm run preview` also serves
the endpoint for local bundle review. Restart the process after changing `.env`.
Node's dotenv parser supports quoted values and comments; shell values take
precedence. The key stays on the server and never belongs in a `VITE_` variable.

The independent `npm run server` command remains available for API-only use on
loopback port 8787 (`GROQ_SERVER_PORT` overrides this standalone port). It is not
needed with dev or preview. A static host alone cannot run this endpoint; public
hosting requires a separately configured backend runtime. Without a key the
Country Notebook displays a configuration error while its other information
remains available.

## Visual system

The user authorized applying the [colour palette](COLOUR_PALETTE.md) and the
`output/design-concepts/playful-v3` reference boards. The interface uses warm ivory,
navy typography, yellow pill actions, teal and blue map/DNA accents, and red stamps.
Locally authored SVG postcard art, passport booklets and landscapes reflect the
references without embedding a screenshot as a page. System fonts and bundled
world-atlas geography work offline. The app is desktop first; current audit fixes
target 1366×768, 1440×900 and 1920×1080. Existing narrow-width reflow remains,
but mobile optimization is outside this work. Keyboard focus and reduced-motion
support apply across the active screens.

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
| `#/trips` | Local group setup, map/list, shortlist, per-person review, preparation and export | Existing `/api/v1/assistant` trip/group/job routes |
| `#/market` | Category filters, preview dialog, purchase, balance, reset | `getCatalog`, `purchaseTreaty` |
| `#/impact` | Before/after maps and DNA, global delta, new pairs, purchased treaties | `calculateImpact`, `getPassportView`, `generateVisaDNA` |
| `#/optimizer` | Budget, greedy suggestions, projected world, explicit individual purchase | `optimizeTreaties`, `purchaseTreaty`, `getPassportView` |
| `#/more` | Supported-passport lottery and rotating globe; unavailable route/AI concepts | `getCatalog`, `getPassportView` |

## Engine integration

The [local trip planner](TRIP_PLANNER.md) adds a Trips navigation item and consumes
the existing assistant backend with cookie/CSRF and revision-aware requests.
It requires the local Vite/API process for persistence and group queries; no model
key is needed for setup, queries, review tasks or brief exports.

`src/frontend/engine.ts` selects the implementation of the authoritative
`src/shared/engineApi.ts` interface. It selects `RealAperironEngine` with the
199-passport, 199-destination Passport Index snapshot and 16 fictional treaties.
Access, scores, comparison, DNA, purchases and optimization use the real pure
TypeScript implementation. The mock remains available for synthetic fixture
checks; active pages do not use it. No calculation server is required.

`src/store/appStore.ts` holds passport/comparison/destination, world state and
purchase feedback. Pages derive calculations from the engine. Navigation uses
hash routes with validated `passport`, `destination` and `comparison` catalog IDs
in the query portion of the hash. Selections survive reload and browser history;
simulation remains in memory and resets on reload. A comparison cell opens the
Country Notebook with the original pair preserved; `inspect=second` chooses its
second passport without swapping the pair. No traveller documents enter the URL.
Preview and optimizer calls never mutate the active world. Reset preserves UI
selection. Engine failures on purchase become visible status messages.

The country notebook uses the same snapshot classification as the map for ordinary
passport tourism and shows only numeric stay values actually present in the CSV.
Other purposes or passport types return unknown. Fees, documents, processing times
and application links remain missing; verification dates remain empty. Legacy
curated records are retained for review but are not returned by runtime lookup.
The snapshot citation is third-party and explicitly unverified. Run `npm run
data:build` after changing the CSV or country metadata to regenerate the audit
module, compact full runtime matrix and country catalog. All 39,601 pairs are
bundled; the large audit module is excluded from browser assets. Selectors sort
country names for browsing while the engine retains ISO alpha-2 destination order.
The map uses ISO numeric IDs plus point markers for countries omitted by its
coarse geography. Unsupported areas stay hatched.
See [DATA_POLICY.md](DATA_POLICY.md) for the review gate.

The searchable passport picker exposes its active option and restores trigger
focus on Enter/Escape. Interactive maps have one Tab stop: arrows browse visible
countries alphabetically, Home/End jump, and Enter/Space selects. Clipped globe
countries are omitted. Map connections and selection markers are static; repeated
keyboard use does not animate. Pointer press feedback uses a short 140ms scale
only when reduced motion is not requested. No page-entry animation runs.

Explore search explicitly enters List view and preserves results after selection.
The legend sits above the map. Compare provides name/code search, name sorting,
both snapshot access categories and notebook links. DNA shows all six category
counts and uses engine category colors, distinguishing unknown from restricted
even though both have zero modeled weight. Lottery draws preview a passport;
the separate explore action adopts it. Postcards use bundled SVG illustrations
with general illustration captions; no missing photograph paths are requested.

Country Notebook prioritizes provider entry/arrival rules and separates each
action link from its value. Documents, fees and processing retain explicit unknown
states. Research prose remains escaped text with a separate list of validated,
credential-free HTTPS leads, labeled unverified. Provider/research failures leave
the notebook usable. The [desktop audit](FRONTEND_AUDIT_2026-10-11.md) retains
original findings and a resolution table.

The old `frontend/types.ts`, `mocks/frontendAdapter.ts`, `store/explorerStore.ts`
and starter map/panel components are retained for compatibility with earlier
component work, but are no longer wired into `App.tsx`.

## Verification

`src/store/appStore.test.ts` covers all 39,601 matrix entries, destination preservation,
invalid IDs, immutable previews, purchases, duplicates, insufficient credits,
reset, DNA changes, optimizer bounds/projected impact, and honest missing data.
Browser acceptance covers active routes, paused-route fallback, desktop layouts, search misses,
passport changes, purchase/preview/reset, budget edges, lottery and globe controls.
Local evidence is written to ignored `output/playwright/`.

## Game temporarily disabled

`src/frontend/features.ts` sets `GAME_ENABLED` to false at the user's request.
The game implementations above remain in source for later restoration. Play is
hidden from navigation; market/impact/optimizer URLs display Explore. Simulation
switches, the country simulation section and DNA before/after comparison are hidden.
Explore, Compare, DNA and the globe use baseline data even if a prior session held
a purchased treaty. DNA's primary action now opens Explore. Re-enable the flag to
restore the retained game UI. Verified country data remains a separate dependency.
