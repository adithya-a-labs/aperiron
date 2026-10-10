# 0002 - Per-developer state and run history

- Date: 2026-10-10
- Status: accepted
- Accepted by: user's request for state maps and automatic work logging
- Supersedes: none
- Superseded by: none

## Context

Agents on two devices need durable project memory without relying on local chats.
The user requested independent records for `dev-adithyaa` and `dev-prabhu` that
agents update after each run.

## Alternatives

- One shared progress document: creates routine editing conflicts and unclear attribution.
- Separate status, changelog, and handoff documents with repeated summaries: creates drift.
- One current state per developer plus uniquely named run entries: preserves a
  concise resume point and detailed history with fewer concurrent edits.

## Decision

Use separate developer state files and unique per-run logs under `docs/state/`.
Root agent instructions require agents to read both states and update their own
records before the final response. Git distributes committed records between devices.
Do not add duplicate `STATUS.md` or handoff summaries elsewhere.

## Consequences

Developer identity must be explicit and is independent of module ownership.
Agents record completed, analysis-only, failed, and blocked work honestly. Records
are not locks or online-presence indicators. Concurrent same-developer summaries
need reconciliation. Crashes can prevent final logging; resumed agents recover
from checkpoints and actual code.

Logging does not authorize automatic commits/pushes or create background jobs.
The current user identified this session as `dev-adithyaa`; this does not assign
that developer a permanent engine/frontend role.

## Acceptance and references

Based on the user's explicit per-developer state request and current identity
answer. See the [state protocol](../state/README.md) and
[development workflow](../DEVELOPMENT.md).
