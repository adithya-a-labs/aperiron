# aperiron agent instructions

## Project context

aperiron: The Passport Paradox is a passport mobility exploration and policy
simulation platform. Its core experiences include passport-specific destination
regulations, a world map, passport comparison, and Visa DNA. The Border Market
strategy game is one component of the platform. AI assistance is under discussion,
not an accepted implementation requirement. Deployment is the last priority.

Verify implementation progress from actual source and the developer state map.
Do not describe planned features as implemented. Keep real regulation information
separate from fictional policy changes, and never invent missing visa requirements.

## Documentation map

- `docs/PRODUCT.md`: accepted direction, journeys, scope, and priorities.
- `docs/ARCHITECTURE.md`: module boundaries, dependencies, state, optional services.
- `docs/CONTRACTS.md`: API semantics, compatibility, unresolved freeze decisions.
- `docs/DATA_POLICY.md`: sources, applicability, unknowns, simulation isolation.
- `docs/DEVELOPMENT.md`: setup, ownership, branches, device sync, update triggers.
- `docs/VERIFICATION.md`: available checks and behavioral acceptance scenarios.
- `docs/decisions/README.md`: durable accepted choices and proposals.
- `docs/state/README.md`: developer states and per-run logging protocol.

Read product context at task start and relevant domain docs before edits. Use
actual shared TypeScript definitions for signatures once present; docs explain
their semantics. Treat drafts as drafts, and record meaningful drift.

## Repo-local skills

Skills live in `.agents/skills/`. Read the matching `SKILL.md` before using it:

| Skill | Use when |
| --- | --- |
| `aperiron-context` | Starting or resuming a project task. |
| `aperiron-contract-check` | Changing shared APIs, semantics, mocks, or fixtures. |
| `aperiron-data-review` | Adding or reviewing visa/regulation data. |
| `aperiron-verify` | Verifying affected behavior before completion. |
| `aperiron-doc-sync` | Reconciling docs after changes or an explicit audit. |
| `aperiron-handoff` | Writing the end-of-run record or a meaningful checkpoint. |

Select relevant skills; do not load every workflow for a simple task. Skills do
not install tools, create schedules, or authorize extra external actions. Per-run
logging applies even if a skill was not automatically selected.

## Start of every run

1. Read `docs/state/README.md` and both developer state files.
2. Inspect the current branch, working-tree changes, and relevant recent commits.
   Verify recorded claims against the code; state files can be stale.
3. Establish your developer identity from an explicit user instruction or an
   explicitly assigned task: `dev-adithyaa` or `dev-prabhu`. Do not infer identity
   from a computer username, Git author, or files you happen to edit. If it is
   unknown, ask which developer you represent before writing an attributed log.
   Independent read-only investigation may continue while awaiting the answer.
   Preserve an identity already supplied in this session; do not ask again each run.
4. Read your latest run entry and any relevant entry from the other developer.
   Identify overlapping work before editing shared files.

## End of every run

Before the final response, log the actual work according to `docs/state/README.md`:

- Add a new, uniquely named run entry under your own developer's `runs/` folder.
- Update your own `STATE.md` with the current task, status, branch, changes,
  verification, blockers, next actions, and the relative link to that entry.
- Log meaningful analysis-only, failed, and blocked runs too. Say explicitly when
  no implementation changed or checks were not run.
- Update affected project documentation when implementation or accepted decisions
  change. Do not turn proposals into decisions without user agreement.
- Only edit your own developer state and run entries unless explicitly authorized
  to maintain the other developer's records.
- Do not commit or push merely because this logging rule exists. Follow the user's
  Git authorization and report whether the records are local or pushed.

For a long run, checkpoint your state when the task or blocker changes materially.
On resuming interrupted work, reconcile the last checkpoint with the actual files
and record the interruption. Instructions cannot guarantee a final write after a
crash, cancellation, or lost connection.

## Coordination

State files are shared memory, not a lock or a live presence service. Use separate
task branches for concurrent work. Fetch and integrate remote changes when safe;
never discard uncommitted work or overwrite another developer's records to sync.
Do not silently change shared contracts. Record proposed interface changes and
their affected consumers before integration.

Keep secrets, personal traveller data, full transcripts, and machine-specific
absolute paths out of these records. Prefer repository-relative file references.
