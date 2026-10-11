# aperiron — The Passport Paradox

**aperiron** is a local-first passport-mobility exploration tool. Pick a
passport, explore destination classifications on a map or list, compare two
passports, and inspect a deterministic visual "Visa DNA" derived from the same
modelled access data. It also includes a local group-trip planning flow.

The project is deliberately careful about what it does *not* know. Its active
map uses a bundled third-party Passport Index snapshot, not a live or
claim-reviewed visa database. aperiron is for exploration and discussion; it is
not travel advice and cannot guarantee admission.

## What is available

| Area | Current behaviour |
| --- | --- |
| **Explore** | Browse a map or searchable list for the selected passport. The bundled snapshot has 199 passport origins × 199 destinations (39,601 modelled pairs). |
| **Country Notebook** | Shows the snapshot classification, a numeric stay only where the snapshot supplies one, explicit missing-field states, and the selected tourism context. |
| **Compare** | Compares two passports’ shared and distinct accessible destinations, category differences, and modelled scores. |
| **Visa DNA** | Renders a reproducible vector/fingerprint and category breakdown from the access model. |
| **Trips** | Create one local group trip (1–6 travellers), browse matching destinations, shortlist places, review person-by-person context, generate suggested preparation tasks, and export a local brief. |
| **Optional enrichment** | A local Travel Buddy integration can display cached, unverified provider details for an explicitly selected passport–destination pair. |
| **Optional source research** | A local Groq Browser Search action can find unverified leads for the current Country Notebook selection. |
| **Border Market simulation** | The fictional treaty/game engine remains in the source, but the game navigation, routes, simulation switches, and treaty prompts are currently paused. |

The interface is a React/Vite application backed by a pure TypeScript engine.
The engine implements a shared eight-method contract for catalog access,
passport views, comparison, Visa DNA, treaty simulation, impact, optimisation,
and baseline requirement lookup.

## Read this before relying on any result

- The bundled Passport Index data is third-party snapshot data. Its upstream
  README reports an update on 17 February 2026; that is **not** a record-level
  verification date or a guarantee that it remains current.
- Runtime requirement lookup supports ordinary-passport tourism only. Other
  purposes and passport types are honestly returned as unknown. Residency,
  existing visas/permits, requested duration, eligibility exceptions, fees,
  document checklists, processing times, and application links are not verified
  by the bundled data.
- Cached Travel Buddy data and Groq research are explicitly unverified. They do
  not change the baseline matrix, comparison, score, Visa DNA, or simulation.
- Fictional treaty effects are a policy sandbox, never real-world entry rules.
- A destination classification does not establish transit feasibility, flight
  availability, booking cost, or admission at the border. Consult the relevant
  official immigration or consular authority before making travel decisions.

See the [data policy](docs/DATA_POLICY.md) for the evidence boundary and
[product definition](docs/PRODUCT.md) for the accepted scope.

## Quick start

### Requirements

- Node.js `>=22.12.0 <23` or Node.js `>=24`
- npm (the committed lockfile is used)

```sh
npm ci
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). The development server is
loopback-only and uses a strict port; if `5173` is already occupied, choose an
explicit free port, for example `npm run dev -- --port 5175`.

`npm run dev` serves both the frontend and the local API routes. Core
exploration, comparison, Visa DNA, and the local trips workflow need no API key,
remote map service, database, or separate server process.

The full app is configured for Vercel from `main`, including API functions,
durable background jobs and managed Postgres. Follow the
[deployment guide](docs/DEPLOYMENT.md) to connect storage, set secrets and migrate.

### Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local app and API middleware. |
| `npm run server` | Start only the local API server on `127.0.0.1:8787` by default. |
| `npm run typecheck` | Run the TypeScript compiler without emitting files. |
| `npm test` | Run Node/TypeScript tests, including engine, data, store, and server checks. |
| `npm run build` | Type-check and build the frontend and Nitro API. |
| `npm run build:vercel` | Build static assets, API functions and background workflows for Vercel. |
| `npm run check` | Run type-checking, tests, and production build in sequence. |
| `npm run data:build` | Regenerate the Passport Index runtime data and country catalog after changing the bundled CSV or country metadata. |
| `npm run assistant:openapi -- --check` | Check generated assistant OpenAPI output against its runtime schemas. |
| `npm run travel:import -- <report...>` | Import eligible local Travel Buddy trial reports into its ignored cache. |

For documentation-only checks, run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check-docs.ps1
git diff --check
```

The execution-policy override applies only to the documentation-check process.

## Optional local services

Copy [`.env.example`](.env.example) to an ignored root `.env` and add only the
credentials you intend to use. Never put credentials in `VITE_*` variables or
commit `.env`.

| Capability | Configuration | Notes |
| --- | --- | --- |
| Country Notebook research | `GROQ_API_KEY` | Enables the explicit Groq Browser Search action. Its output is unverified research, not a requirements record. |
| Local assistant model/search work | `GROQ_API_KEY` and, optionally, `GROQ_ASSISTANT_MODEL` | The default assistant model is `openai/gpt-oss-120b`; use the limits in `.env.example` and the backend guide. |
| Destination enrichment | `TRAVEL_BUDDY_API_KEY` and a correctly configured quota balance | Requests remain server-side, rate/quota constrained, and locally cached. Existing cached details can still be read without a key. |

The assistant uses cookie-owned local sessions and stores private state in the
ignored `.local/assistant` directory. Travel Buddy's operational cache defaults
to the ignored `.cache/travel-buddy` directory. Run only one local server process
per corresponding storage directory.

Detailed setup, quotas, request flows, and live-call limits are in the
[assistant backend guide](docs/ASSISTANT_BACKEND.md) and
[development guide](docs/DEVELOPMENT.md).

## Routes

| Hash route | Experience |
| --- | --- |
| `#/explore` | Passport selector, searchable destinations, map/list, and destination postcard. |
| `#/country` | Country Notebook with snapshot context, optional provider detail, and optional research leads. |
| `#/compare` | Two-passport comparison. |
| `#/dna` | Visa DNA and access-category breakdown. |
| `#/trips` | Local group-trip setup, group map/list, shortlist, review tasks, and export. |
| `#/more` | Passport lottery and globe exploration. |

`#/market`, `#/impact`, and `#/optimizer` belong to the retained fictional game
implementation. While the game is paused, those routes safely return to Explore.

## Design and data boundaries

```text
Bundled Passport Index snapshot ──► pure TypeScript engine ──► React/Zustand UI
          (unverified)                    │
                                          ├── comparison / Visa DNA / fictional simulation
                                          └── baseline tourism lookup

Optional local services ──► selected UI detail only
Travel Buddy / Groq         never mutate the snapshot, scores, DNA, or treaties
```

The app's 199-country matrix is bundled for local exploration. Country names,
regions, flags, coordinates, and numeric map identifiers come from a bundled
`mledoze/countries` metadata extract; it supplies geography, not visa claims.
The data compiler preserves raw Passport Index categories and only maps supported
values to aperiron's access levels. Missing or unrecognised values remain
`unknown` rather than being inferred as permission or restriction.

For the complete architecture and contract semantics, see:

- [Architecture](docs/ARCHITECTURE.md)
- [Shared contracts](docs/CONTRACTS.md)
- [Data policy and provenance](docs/DATA_POLICY.md)
- [Frontend implementation notes](docs/FRONTEND.md)
- [Local group Trips workflow](docs/TRIP_PLANNER.md)

## Project documentation and collaboration

| Document | Use it for |
| --- | --- |
| [Product](docs/PRODUCT.md) | Accepted journeys, scope, priorities, and product boundaries. |
| [Development](docs/DEVELOPMENT.md) | Local setup, ownership, branches, environment variables, and handoff rules. |
| [Verification](docs/VERIFICATION.md) | Proportionate checks and manual acceptance scenarios. |
| [Decision records](docs/decisions/README.md) | Accepted architectural and collaboration decisions. |
| [Developer state map](docs/state/README.md) | Current developer records and per-run history. |
| [Agent instructions](AGENTS.md) | Repository rules for contributors and coding agents. |

`dev-prabhu` owns core engine/data work, `dev-adithyaa` owns the frontend
experience, and `dev-integration` coordinates integrated work. Dedicated
`dev-frontend` and `dev-tripplanner` lanes maintain their own state records. See
the development guide and state map for the current, source-verified handoff
status rather than treating this README as a release ledger.

## License

This project is available under the [MIT License](LICENSE). The bundled Passport
Index and country-metadata materials retain their own provenance and licensing
notices in `src/data/passport-index/`.
