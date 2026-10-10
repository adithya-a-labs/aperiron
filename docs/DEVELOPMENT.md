# Development and device handoffs

## Working agreement

The module owners, `dev-adithyaa` and `dev-prabhu`, work against one shared contract.
The user assigned `dev-adithyaa` to frontend experience and `dev-prabhu` to the
core engine. These are explicit role assignments, independent of device identity.

The intended responsibility split is:

| Role | Primary responsibility |
| --- | --- |
| Core engine developer (dev-prabhu) | Data, access rules, regulation lookup, comparison calculations, DNA values, purchases, scoring, and optimizer. |
| Experience developer (dev-adithyaa) | UI shell, map, country panel, DNA rendering, market, interaction, and UI state. |
| Frontend collaborator (dev-frontend) | Dedicated frontend branch for UI implementation and polish within the boundaries below; coordinate overlapping files with dev-adithyaa. |
| Both | Shared contract review, regulation assumptions, fixtures, integration, and demo readiness. |

For the user-assigned integration task, `dev-integration` coordinates both layers
on the exact `dev-integration` branch and writes its own state/run records. This
does not reassign either developer’s module ownership.

Ownership reduces conflicting work; it does not prohibit agreed collaboration.
Record role assignments when the users decide them. Coordinate changes across
the boundary before changing another developer's expected interface.

### dev-adithyaa frontend scope and first milestones

Own React/Vite setup, styling, responsive layout, accessibility, components/pages,
UI store, engine adapter, and contract-compatible UI mocks. Build passport and
destination selectors, interactive map, passport-specific regulation panel,
comparison views, Visa DNA rendering, treaty marketplace, impact displays,
optimizer presentation, and reset/feedback interactions.

Start by coordinating shared types and sample responses, then build the app shell
and the passport-selection to country-panel flow. Next render DNA from engine
values, wire purchase/results through the store, and add comparison and optimizer
views. Finish each milestone with relevant UI verification and a run log.

Consume engine calculations rather than duplicating scoring, access resolution,
treaty effects, DNA numeric generation, or optimization. UI mocks follow shared
fixtures and are replaced through the adapter when the engine is available.
Source regulation content through the agreed data interface; frontend ownership
does not authorize inventing visa information. Optional AI explanation UI is only
in scope if the integration is adopted.

### dev-frontend dedicated frontend branch

The user created the exact branch `dev-frontend` for a friend to work solely on
frontend experience. It is a separate collaboration lane, not a reassignment of
dev-adithyaa's experience ownership or dev-prabhu's engine ownership. Use the
branch-scoped [state and run history](state/dev-frontend/STATE.md); `dev-frontend`
identifies this work lane, not a person's identity.

| Area | Scope on dev-frontend |
| --- | --- |
| UI implementation | React components, page layout, navigation, selectors, map interaction, country notebook, passport comparison presentation, Visa DNA rendering, and existing More-page UI. |
| Visual quality | Styling, approved palette/artwork, responsive layouts, keyboard access, focus, contrast, reduced motion, loading, empty and error states, and concise product copy. |
| UI state and integration | Selection/navigation state and engine adapter wiring through existing shared types; display engine results without recalculating them. Optional research UI may consume the existing endpoint. |
| Verification and docs | Frontend tests, browser checks, frontend documentation, and this lane's state/run records. Coordinate shared integration tests before editing. |
| Coordinated files | `src/App.tsx`, `src/main.tsx`, `src/styles.css`, `src/components/`, `src/frontend/`, `src/store/`, and UI assets. Agree on file/page assignments with dev-adithyaa before concurrent edits. |

Outside this branch's independent scope: `src/engine/`, `src/data/`, dataset
generation scripts, regulation sourcing/content, access classification, scoring,
comparison calculations, numeric DNA generation, treaty logic, and optimization.
Request these changes from dev-prabhu. Shared contracts (`src/shared/`), common
fixtures/mocks, server/API behavior, dependency/lockfile changes, and build/runtime
configuration require coordination with affected owners and dev-integration.
Record a needed interface change and its consumers before implementation; do not
silently change signatures or duplicate engine logic in the UI.

Prioritize the active map-first exploration, country information, comparison and
Visa DNA journeys. The game remains paused; restoring game routes, simulation
controls or treaty actions needs a new user instruction. Existing optional Groq
research stays visibly unverified. Do not invent missing visa information, promote
research into verified requirements, or expand into proposed AI/planning features.
Deployment remains last priority.

Integrate reviewed frontend work through dev-integration after checks appropriate
to the change (see [VERIFICATION.md](VERIFICATION.md)). Separate branches do not
prevent merge conflicts in shared UI files. Preserve all lanes' run histories,
review diffs against the integration baseline, and commit/push only when authorized.

### dev-prabhu core engine scope and first milestones

Own `src/engine/` and `src/data/`: the catalog and validated dataset, passport
access resolution, passport-specific regulation lookup, comparison calculations,
deterministic Visa DNA values, immutable treaty purchases, global impact scoring,
and budget-constrained optimization. Maintain shared contracts in coordination
with dev-adithyaa, including error semantics and common expected-result fixtures.

Begin with contract semantics, initial world state, a small labeled fixture dataset,
and passport/regulation lookup. Then implement comparison/DNA, purchases/impact,
and the optimizer with focused invariant tests. Keep the engine independent of
React, Zustand, and rendering. Return structured data the frontend can consume.
Source claims and review timestamps remain evidence-based; prototype fixtures must
not imply verified visa guidance. Both developers share integration responsibility.

## First implementation milestone

1. Agree on the scoring and treaty semantics listed in [CONTRACTS.md](CONTRACTS.md).
2. Define shared TypeScript interfaces, including country regulation lookup.
3. Create a small labeled dataset, initial state, and expected-result fixtures.
4. Build a contract-compatible mock so UI development can proceed independently.
5. Scaffold the local app and add real scripts for type checking, build, and tests.
6. Integrate one vertical flow: passport selection, country selection, and correct
   passport-specific information. Then add DNA and treaty updates.

Use frequent small integrations. Protect the final build time for reliability and
demo validation rather than infrastructure setup.

## Repository setup on either device

Clone the same remote and use a separate local checkout on each device. Install
the runtime/package-manager versions chosen during scaffolding. Use the committed
lockfile for dependency installation and document required environment variables
in an example file without secrets. Store actual credentials in ignored local
files or the provider's credential mechanism.

The frontend now has package.json and an npm lockfile. Use Node 22.12+ in the 22.x
line, `npm ci`, and `npm run dev`. See [FRONTEND.md](FRONTEND.md) for exact commands
and the implemented eight-method API integration; unresolved engine semantics still require coordination.

Repo-local skills live in `.agents/skills/` and travel through Git. Personal skills,
MCP connections, authentication, and chats do not travel with the repository. On
the second device confirm skill discovery; restart the agent session if newly
added skills do not appear. A skill's instructions do not install its external tools.

## Per-run procedure

### Start

- Read root `AGENTS.md`, both module-owner states, your lane's state, the integration
  state when relevant, and docs relevant to the task.
- Confirm identity from the user/task; identity persists for the session unless changed.
- Inspect the actual branch, starting commit, and uncommitted changes.
- Fetch remote updates when access is available; inspect before integrating them.
- Check the other developer's recorded work for shared-file or interface overlap.
- Record a checkpoint for substantial work using the [state protocol](state/README.md).

### Work

Use the exact assigned branch names `dev-adithyaa`, `dev-prabhu`, `dev-frontend`,
or `dev-integration`, without slash prefixes or task suffixes. These names do not
by themselves assign module ownership; the scope above defines each work lane.
Respect a user-requested branch name. Avoid mixing independent tasks into
the same branch and never reset another task's local changes to get a clean tree.

Review diffs as you work. Choose checks from [VERIFICATION.md](VERIFICATION.md).
For parallel frontend agents, use detached worktrees from the committed foundation
and the file ownership in [PARALLEL_FRONTEND.md](PARALLEL_FRONTEND.md).
Update affected explanation docs together with changed behavior. Keep evolving
implementation details out of product-facing copy unless they help the user.

### Finish

Add one unique run log and update your own state before the final response. Record
what changed, actual verification, remaining work, dependencies, and the branch.
Commit/push according to the user's authorization. State logging alone is not
permission to publish a branch or alter repository settings.

## Switching devices

Before leaving device A, inspect the final diff, update the run record, and commit
and push authorized work. On device B, inspect local changes first, fetch the remote
branch, integrate safely, and read the latest state and run entry. Continue from
the recorded commit and verify actual files before relying on the summary.

If the branch is only local, the other device cannot see it. If work is pushed to
a task branch, it does not appear in another branch until integrated. Say which
branch contains the work rather than claiming the whole project is synchronized.

## Concurrent editing and conflicts

- Each developer writes their own state and unique run entries.
- Avoid a shared append-only log or a duplicated global status board.
- For same-developer parallel tasks, use unique entries and reconcile the current
  summary after integration. A state file does not reserve files or act as a lock.
- Preserve both sides' meaningful run history when resolving conflicts.
- Review shared contract changes against consumers and fixtures, not just conflict markers.
- Re-run checks affected by the resolved code. Previous passes may no longer apply.

## Documentation ownership and update triggers

| Document | Update when |
| --- | --- |
| PRODUCT | The user accepts a change to scope, journey, or priority. |
| ARCHITECTURE | Module boundaries, state flow, runtime, or services change. |
| CONTRACTS | Public type semantics, errors, scoring, or compatibility change. |
| DATA_POLICY | Sourcing, applicability, review, or coverage policy changes. |
| DEVELOPMENT | Setup commands, role assignments, or collaboration workflow change. |
| VERIFICATION | Actual check commands or meaningful test requirements change. |
| Decision record | A significant accepted choice or explicit proposal needs rationale. |
| Own state and run history | Every normally completed run and meaningful checkpoint. |

Link existing explanations instead of copying them. Proposed functionality stays
proposed until accepted; planned functionality stays planned until implemented.

## Recurring analysis and automation

The baseline is per-run documentation maintenance, not an always-running agent.
CI can enforce deterministic checks on pushes and pull requests once scripts
exist. A scheduled agent audit can inspect changes, identify documentation drift,
and prepare focused corrections on an isolated branch.

Use one designated audit runner to avoid duplicate cross-device edits. A local
runner requires its device and app to be available. Store a portable audit prompt
or workflow in the repo, while configuring host-specific scheduling separately.
Keep quiet on unchanged, non-actionable results; report meaningful drift, failed
checks, completion, or required user input.

Do not silently rewrite product decisions, auto-merge changes, invent verification,
or push simply to make a status file appear fresh. No recurring job or CI workflow
is configured yet. Add one only when requested and its runtime is established.
