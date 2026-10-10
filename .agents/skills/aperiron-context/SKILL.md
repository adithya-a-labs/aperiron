---
name: aperiron-context
description: Establish current aperiron context when starting or resuming a development task, including developer identity, repository state, scope, and relevant handoffs.
---

# Establish task context

Resolve the repository root and read its `AGENTS.md`. Read
[PRODUCT.md](../../../docs/PRODUCT.md), the [state protocol](../../../docs/state/README.md),
both developer states, and the latest relevant run entries. Load architecture,
contracts, or data policy only as needed for the task.

Confirm developer identity from user/task context, preserving a previously supplied
identity in the same session. Identity does not assign engine/frontend ownership.
If unknown, request it before attributing work; continue independent investigation.

Inspect branch, starting commit, uncommitted work, and relevant source. Distinguish
implemented code, accepted requirements, and proposals. Treat state summaries as
claims to verify, not a replacement for inspection. Check for overlap with the
other developer before editing shared interfaces or files.

If resuming after interruption, compare the last checkpoint with actual changes.
Preserve unrelated edits and identify what remains. Do not claim remote sync unless
the relevant branch has actually been fetched/integrated.

Produce a concise working understanding: requested outcome, affected modules,
dependencies, unresolved constraints, and the next useful action. Proceed within
the authorized task. Do not create extra tasks, schedule work, or install tools
just to establish context. Finish with the required state/run update.
