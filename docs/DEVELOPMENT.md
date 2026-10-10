# Development and device handoffs

## Working agreement

Two developers, `dev-adithyaa` and `dev-prabhu`, work against one shared contract.
Their named role assignments are still open. Until assigned, do not assume that
either developer owns the engine or frontend based on their identity or device.

The intended responsibility split is:

| Role | Primary responsibility |
| --- | --- |
| Core engine developer | Data, access rules, comparison calculations, DNA values, purchases, scoring, and optimizer. |
| Experience developer | UI shell, map, country panel, DNA rendering, market, interaction, and UI state. |
| Both | Shared contract review, regulation assumptions, fixtures, integration, and demo readiness. |

Ownership reduces conflicting work; it does not prohibit agreed collaboration.
Record role assignments when the users decide them. Coordinate changes across
the boundary before changing another developer's expected interface.

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

Current limitation: there is no `package.json`, lockfile, or app runtime requirement
yet. Commands such as `npm run dev`, `npm run build`, and `npm test` are target
conventions, not runnable checks in the documentation-only repository.

Repo-local skills live in `.agents/skills/` and travel through Git. Personal skills,
MCP connections, authentication, and chats do not travel with the repository. On
the second device confirm skill discovery; restart the agent session if newly
added skills do not appear. A skill's instructions do not install its external tools.

## Per-run procedure

### Start

- Read root `AGENTS.md`, both developer states, and docs relevant to the task.
- Confirm identity from the user/task; identity persists for the session unless changed.
- Inspect the actual branch, starting commit, and uncommitted changes.
- Fetch remote updates when access is available; inspect before integrating them.
- Check the other developer's recorded work for shared-file or interface overlap.
- Record a checkpoint for substantial work using the [state protocol](state/README.md).

### Work

Use the exact developer branch names `dev-adithyaa` and `dev-prabhu`, without
slash prefixes or task suffixes. These names do not assign module ownership.
Respect a user-requested branch name. Avoid mixing independent tasks into
the same branch and never reset another task's local changes to get a clean tree.

Review diffs as you work. Choose checks from [VERIFICATION.md](VERIFICATION.md).
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
