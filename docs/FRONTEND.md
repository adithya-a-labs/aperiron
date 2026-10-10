# Frontend environment

## Setup

Use Node 22.12 or newer in the 22.x line (the repository's `.nvmrc` selects 22).
Node 24+ also satisfies the package engine requirement. Install using the committed
npm lockfile, not a second package manager's lockfile:

```text
npm ci
npm run dev
```

Open the local address printed by Vite, normally `http://127.0.0.1:5173`. The
development server binds to loopback. If port 5173 is occupied, explicitly choose
another port with `npm run dev -- --port 5174`. Separate worktrees need distinct
ports and their own dependency installation.

```text
npm run typecheck
npm test
npm run build
npm run preview
npm run check
```

On Windows, use `npm.cmd` if PowerShell blocks the npm script shim. `check` runs
type checks, focused unit tests, and a production build. There is no configured
lint command yet; do not claim lint passed. No secret or environment variable is
required for the local preview.

## Foundation

- React + TypeScript + Vite for the application and build.
- Tailwind's Vite plugin plus semantic CSS tokens in `src/styles.css`.
- Zustand for passport/destination UI selection.
- Lucide for consistent interface icons.
- D3 geographic projection and TopoJSON tooling with locally bundled world-atlas
  geometry for the map component. No runtime remote map request is required.
- Node's test runner through tsx for frontend adapter/store invariants. The test
  script explicitly names the starter suite; extend it as new suites are added.

The visual direction is a restrained dark geographic workspace: mint for primary
actions, muted green-gray surfaces, compact uppercase labels, and readable data.
Do not use color as the only access indicator. Preserve focus visibility, mobile
layout, reduced motion, and offline-safe system fonts.

## Provisional view contract

`src/frontend/types.ts` defines UI view models and the synchronous `FrontendAdapter`.
It is not a frozen core-engine API and does not replace the seven methods in
[CONTRACTS.md](CONTRACTS.md). Prabhu's implementation will be adapted at
`src/store/explorerStore.ts`, where `frontendAdapter` is selected. Coordinated
changes to this seam may be required after the core contract is agreed.

The mock in `src/mocks/frontendAdapter.ts` contains explicitly fictional data for
three passports and six destinations. It implements lookup only, not scoring,
treaties, DNA, or optimization. Document requirements, fees, stay conditions,
processing times, and sources are unavailable rather than fabricated. It must not
be presented as real travel guidance.

The store owns only selection and reset. Requirements are derived from the current
passport/destination pair, so passport switching cannot retain another nationality's
details. A future asynchronous adapter needs request cancellation or input-key
validation before displaying results.

## Component integration boundary

`WorldMap` receives destinations, access categories, selected destination, and a
selection callback. `DestinationPanel` receives passport, destination, requirements,
and a close callback. These are controlled components; they do not import the store,
mock, or core engine. The app owns their wiring.

Map styles belong in `WorldMap.css`; panel styles belong in `DestinationPanel.css`.
Shared tokens and page layout belong in `styles.css`. Agent-specific work must not
change package files, shared types, store, or app wiring without coordination.

See [PARALLEL_FRONTEND.md](PARALLEL_FRONTEND.md) for worktree tasks and integration.
