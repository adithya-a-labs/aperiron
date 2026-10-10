---
name: aperiron-handoff
description: Log completed or checkpointed aperiron runs and prepare factual developer handoffs for analysis, implementation, failures, blockers, and device switching.
---

# Record a resumable handoff

Read [state protocol](../../../docs/state/README.md) and use
[RUN_TEMPLATE.md](../../../docs/state/RUN_TEMPLATE.md). Resolve developer identity
from trusted session context; never infer it from the machine or Git author, and
do not re-ask when already supplied.

Inspect branch, baseline commit, changed files, performed work, and check results.
Create a unique UTC-based run ID with a collision-resistant suffix. Write only
that developer's records unless cross-maintenance was authorized.

Capture accomplishments, files/purpose, actual verification, remaining work,
blockers, dependencies, interface proposals, and concrete next actions. Include
meaningful analysis with no code changes. Explain missing input/external conditions
for a blocked run. Planned work is not completed work.

Update the current summary and relative latest-run link. Check links and agreement
with actual code. Checkpoint long work and recover interruptions from actual files
on resumption. Correct historical errors with a new linked entry.

For device switching, state the branch/commit and whether work is local or actually
pushed. Commit/push only under existing authorization. Logging does not authorize
merge, reset, or force-push. Another device still needs fetch/integration.

Finish with outcome and material limitations. Do not duplicate status/handoff
documents or promise logging will survive a crash.