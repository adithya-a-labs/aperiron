# Developer state map

This directory is the shared, versioned memory for agents working on aperiron.
The developer records are independent so routine logging does not require
multiple work lanes to edit the same document.

| Developer | Current state | Run history |
| --- | --- | --- |
| dev-adithyaa | [STATE.md](dev-adithyaa/STATE.md) | [runs/](dev-adithyaa/runs/) |
| dev-prabhu | [STATE.md](dev-prabhu/STATE.md) | [runs/](dev-prabhu/runs/) |
| dev-integration | [STATE.md](dev-integration/STATE.md) | [runs/](dev-integration/runs/) |
| dev-frontend (branch-scoped frontend collaborator) | [STATE.md](dev-frontend/STATE.md) | [runs/](dev-frontend/runs/) |

The user explicitly assigned dev-integration to integrate both layers on the
dev-integration branch. Its records preserve the two module owners’ history.
The user also created dev-frontend as a dedicated frontend-only branch for a
friend. Its records track that explicitly assigned work lane without assigning
a personal identity or replacing dev-adithyaa's history. See
[development guidance](../DEVELOPMENT.md#dev-frontend-dedicated-frontend-branch)
for allowed work, exclusions and coordination boundaries.

This table is an index, not a duplicate progress summary. The linked state files
contain the current summaries. The user assigned dev-adithyaa to frontend
experience and dev-prabhu to the core engine. See development guidance for scope.

## What a run means

A run is one agent task/turn that does meaningful project work, including analysis,
implementation, review, debugging, or verification. Tool calls are not separate
runs. Every normally completed run produces one entry, before the final response.
If a run stops unexpectedly, the next run records recovery from the interruption.

## Write procedure

1. Confirm which developer or explicitly assigned work lane you represent; never
   guess attribution. Tasks explicitly assigned to dev-frontend use its own records.
2. Choose an ID using UTC time and a unique suffix, for example
   `20261010T143000Z-a7c9d2f1`. The example is a format, not an existing run.
3. Create `docs/state/<developer>/runs/<run-id>.md` using [RUN_TEMPLATE.md](RUN_TEMPLATE.md).
   Never reuse an ID. If a file already exists, choose a new suffix.
4. Record the actual branch and the starting commit used as the work's baseline.
   Do not guess the hash of a future commit containing the log itself.
5. Describe only observed work and results. Mark checks `passed`, `failed`, or
   `not run`, and include the reason when a check was not run.
6. Update your `STATE.md` to summarize the resulting state and link the new entry.
7. Verify that links resolve and the state agrees with the implementation. Report
   remaining blockers and whether this work has been pushed in the final response.

Completed run entries are historical records. Correct a material mistake in a
new entry that references the old one rather than rewriting history. During an
active run, checkpoints may be updated; mark them as in progress.

## Current-state fields

Each developer's `STATE.md` contains:

- **Updated at:** ISO 8601 UTC timestamp of the last state write.
- **Status:** `not_started`, `in_progress`, `ready_for_review`, `blocked`, or `idle`.
- **Task and branch:** Work being performed and its branch; use `unassigned` when unknown.
- **Baseline commit:** Commit against which the work was performed.
- **Latest run:** Relative link to the newest run entry, or `none`.
- **Completed:** Actual delivered work, including significant analysis.
- **In progress:** Remaining work on the current task.
- **Verification:** Checks performed and their outcomes; distinguish unverified work.
- **Blockers:** Concrete impediments, or `none`.
- **Next actions:** Specific continuation steps.
- **Coordination:** Dependencies, overlapping files, and proposed contract changes.

Status describes the latest recorded work, not whether an agent is currently
online. A file can say `in_progress` after the agent stops; check the timestamp,
branch, and actual changes before resuming.

## Synchronization between devices

These files travel with the repository through Git. Local edits are not visible on
another device until they are committed, pushed, fetched, and integrated there.
Credentials, local chats, installed personal skills, and uncommitted files are not
synchronized by this directory.

Before starting, inspect local changes, fetch remote updates when available, and
integrate the intended branch when safe. Before switching devices, commit and push
authorized work including its state and run entry. On the next device, fetch the
branch and read the latest records before continuing.

Concurrent tasks for the same developer must use separate branches and unique run
entries. If their `STATE.md` changes conflict, preserve both run entries and
reconcile the summary to the integrated code. Timestamps do not decide which work
is correct. Never resolve a state conflict by blindly choosing the newest file.

## Automatic updates and limits

The root `AGENTS.md` instructs agents to update these records after each run.
It is a workflow instruction, not a background process or a technical guarantee.
A recurring audit, hooks, or CI enforcement can be added separately. No scheduler,
automatic Git push, or cross-device watcher is configured by this setup.

## Setup record

Created on 2026-10-10 with both developer records unassigned. This scaffolding run
has not been attributed to either developer because no developer identity was
provided. The initial records intentionally claim no developer work.
