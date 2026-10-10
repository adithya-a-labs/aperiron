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

At the 2026-10-10 documentation setup, application code and a verified visa
dataset have not been implemented. See the state map for current progress. The
LLM integration remains proposed. `dev-adithyaa` owns frontend experience; the
`dev-prabhu` owns the core engine. See development guidance for role boundaries.

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

Application install/dev/build commands will be documented after scaffolding.
The execution-policy override applies only to this checker process and does not
change the device's persistent policy. Inspect the script before running it.
