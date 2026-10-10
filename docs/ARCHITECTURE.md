# Architecture and boundaries

## Current state and direction

The React/Vite/TypeScript frontend uses the executable eight-method
`AperironEngine` interface in `src/shared/engineApi.ts`. The provider in
`src/frontend/engine.ts` selects `RealAperironEngine` over the bundled Passport Index catalog;
`src/store/appStore.ts` owns selection and fictional world state. The pure
TypeScript engine runs in the browser across 199 passport origins and 199 destinations;
detailed official regulation coverage remains future work. See
[FRONTEND.md](FRONTEND.md) for implemented routes, dependency details and integration.
Progress and verification belong in the [state map](state/README.md).

Accepted next integration: [Travel Buddy destination enrichment](decisions/0008-travel-buddy-destination-enrichment.md).
The local snapshot remains the map and model foundation; a server-side persistent
cache will provide selected destination details and precise exploration overrides.
This integration is planned, not implemented.
## Dependency direction

| Layer | Owns | May depend on |
| --- | --- | --- |
| Shared contracts | Types, result shapes, interface definitions | TypeScript primitives and explicitly shared schemas |
| Data | Catalog, permissions, regulation records, treaty effects | Shared types and validation helpers |
| Engine | Access, comparison, DNA values, purchases, impact, optimization | Shared contracts and validated data |
| Adapter/provider | Select real or mock engine | Shared interface and selected implementation |
| UI store | Selected passport/destination, comparison, screen, current world state | Shared contracts and engine adapter |
| Components/pages | Map, country panel, DNA renderer, market, controls | Store and public engine interface |
| Optional AI service | Retrieval and explanation | Explicit source records and server-side model provider |

The engine must not import React, Zustand, browser rendering APIs, or UI components.
The UI must not duplicate access, scoring, treaty, or optimizer calculations.
An adapter permits switching between a mock and real implementation without
rewriting components.

## Planned module layout

This is a target layout; directories are created as needed, not pre-populated with
empty implementation placeholders.

```text
src/
  shared/       contracts.ts, engineApi.ts, shared fixtures
  data/         catalog, access records, regulations, treaty definitions
  engine/       access, comparison, DNA, treaties, scoring, optimizer
  mocks/        contract-compatible development implementation
  store/        world state and UI selection state
  components/   map, country panel, selectors, DNA, treaty cards
  pages/        exploration, comparison/DNA, simulation/market
  App.tsx
  main.tsx
public/         bundled geography and other local assets
tests/          behavior and integration checks where appropriate
```

## State model

Separate these concerns explicitly:

1. **Baseline data:** Versioned catalog, classifications, and sourced regulations.
2. **Simulation state:** Remaining credits and purchased treaty IDs.
3. **UI state:** Selected passports, destination, current view, open panels, animations.
4. **Derived results:** Access lists, scores, comparisons, DNA, and impact.

Derived results should be calculated from baseline plus simulation state. Avoid
storing a second independently editable permission matrix or score in UI state.
Memoization is permitted; cache keys must cover dataset version, selected passport,
and effective treaty state. UI selection changes do not mutate baseline data.

Persistence is optional. If added, version saved simulation state and validate it
against the loaded catalog. Old treaty IDs or a changed dataset require explicit
migration or reset, not silent acceptance.

## Main flows

### Country selection

The map sets a destination ID. The country panel reads the selected passport and
traveller context, resolves the matching baseline regulation record, and renders
known fields and provenance. Simulation effects appear in a labeled section.

If detail loading is asynchronous, tag requests with their input context or cancel
obsolete requests. A response for passport A must not populate the panel after the
user switches to passport B. Optional AI text follows the same rule.

### Treaty purchase

The UI calls `purchaseTreaty(state, treatyId)`. The engine validates the request,
computes a new immutable state, and returns its calculated impact. On success the
store replaces the world state; dependent views recompute. On failure the store
retains the original state and displays the typed error.

The animation uses calculated before/after results. It does not guess unlocked
countries or optimistically decrement credits outside the authoritative result.

### Optimizer

Read the same catalog and evaluate hypothetical next states without changing the
active state. Show the recommendation for inspection. Applying it uses validated
purchases, either sequentially or through a separately specified atomic batch API.
Do not imply atomicity if only sequential purchases exist.

## Regulation lookup is a separate contract

The original seven-method simulation interface returns access classifications,
not document checklists, fees, conditions, or provenance. The country panel needs
a structured lookup contract in addition to that interface. See
[CONTRACTS.md](CONTRACTS.md) for the executable extension and remaining semantic questions.

Do not force regulation details into `VisaDNA`, `WorldState`, or a generic string
that loses source information. Simulation score and real entry guidance answer
different questions and must remain distinguishable.

## Optional LLM boundary

The user authorized local Groq Browser Search integration. Its boundaries are:

- Place provider credentials behind a server-side endpoint, never in client assets
  or a frontend-exposed environment variable.
- Retrieve relevant source material using the exact passport, destination, and
  traveller context. Return citations tied to the claims they support.
- Keep explanations downstream of records and calculations. Model output cannot
  alter access rules or approve a treaty purchase.
- Handle unavailable sources, ambiguity, obsolete requests, timeouts, and quota
  failures with useful structured information still visible.
- Evaluate unsupported claims and conditional requirements before demoing them.

The optional Groq research endpoint is implemented locally at
`server/groq-browser-search.ts`. It accepts only canonical catalog passport,
destination and purpose values, uses Groq Browser Search with `openai/gpt-oss-20b`,
and returns an explicitly unverified research brief. It does not write baseline
records, affect the engine, or include the API key in client assets. Vite dev and
preview install the server handler at `/api/groq-research`; `npm run dev` starts
the complete local flow. `npm run server` remains an API-only alternative. It is an
optional supplement, not a source-verification pipeline or a production deployment
decision. A full vector database is not a prerequisite for a small curated source
collection.

The provider request times out after 45 seconds. Public errors distinguish missing
configuration, provider authentication/model access, rate limits and other failures
without returning upstream bodies. The frontend aborts and invalidates requests on
selection changes and unmount. HTTP request/response types live in
`src/shared/research.ts`; these do not change the eight-method engine API.

## Runtime and deployment

Bundle geography assets needed for the local demo rather than assuming an external
map URL will remain available. The baseline application should build to static
assets. Confirm actual package scripts before documenting runnable commands.

No hosting, authentication, database, CI pipeline, scheduled agent, or automatic
sync service is created by this documentation. See [development](DEVELOPMENT.md)
for how to add verification and recurring review without duplicate writers.
