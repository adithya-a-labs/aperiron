# aperiron: The Passport Paradox

An interactive passport mobility exploration and policy simulation platform.
The Border Market strategy game is one part of the project.

Select a passport, inspect destination-specific regulations on a world map,
compare mobility, and explore a passport's Visa DNA. Fictional treaty simulation
and the Border Market let users experiment with changing policy rules.

## Project documentation

| Document | Purpose |
| --- | --- |
| [Product](docs/PRODUCT.md) | User journeys, scope, priorities, and acceptance expectations. |
| [Architecture](docs/ARCHITECTURE.md) | Engine/UI boundaries, data flow, and optional AI service. |
| [Contracts](docs/CONTRACTS.md) | API semantics, regulation lookup, and decisions to freeze. |
| [Data policy](docs/DATA_POLICY.md) | Official sources, conditions, freshness, and simulation labels. |
| [Development](docs/DEVELOPMENT.md) | Two-developer workflow and Git synchronization between devices. |
| [Verification](docs/VERIFICATION.md) | Available checks and meaningful validation scenarios. |
| [Decisions](docs/decisions/README.md) | Accepted choices, rationale, and unresolved topics. |

The frontend preview now has a React/Vite foundation and fictional sample data.
The core engine and verified visa dataset remain unimplemented. See the state map
for current progress. The
LLM integration remains proposed. `dev-adithyaa` owns frontend experience; the
`dev-prabhu` owns the core engine. See development guidance for role boundaries.

## Run the frontend

Use Node 22.12+ (22.x) and npm:

```text
npm ci
npm run dev
```

Open `http://127.0.0.1:5173`. Use `npm run check` to typecheck, test, and build.
See [frontend setup](docs/FRONTEND.md) and [parallel tasks](docs/PARALLEL_FRONTEND.md).
Sample classifications are fictional and must not be used as travel guidance.

## Agent development

- [Agent instructions](AGENTS.md)
- [Shared developer state map](docs/state/README.md)
- [dev-adithyaa state](docs/state/dev-adithyaa/STATE.md)
- [dev-prabhu state](docs/state/dev-prabhu/STATE.md)

At the beginning of a task, tell the agent which developer it represents. Each
agent maintains its own state and adds a run log before finishing. Commit and push
these records with authorized work to share them between devices through Git.

Six project workflows are included in [.agents/skills/](.agents/skills/): context,
contract checking, data review, verification, documentation sync, and handoff.
Agents select relevant workflows and update their own records after each run.

There is no background scheduler or automatic push configured. State files
synchronize after Git commit/push/fetch/integration, not by being open on two devices.

## Check the documentation

From the repository root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check-docs.ps1
git diff --check
```

Application commands are documented in the frontend setup guide.
The execution-policy override applies only to this checker process and does not
change the device's persistent policy. Inspect the script before running it.
