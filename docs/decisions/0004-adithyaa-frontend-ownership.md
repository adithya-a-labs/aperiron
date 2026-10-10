# 0004 - dev-adithyaa owns frontend experience

- Date: 2026-10-10
- Status: accepted
- Accepted by: user's explicit selection of Frontend experience
- Supersedes: previously unassigned frontend ownership
- Superseded by: none

## Context and decision

The user identified as dev-adithyaa and selected frontend experience as their
development role. Assign that developer the UI, interaction, rendering, UI state,
frontend setup, and engine integration responsibilities in
[DEVELOPMENT.md](../DEVELOPMENT.md).

## Consequences

The frontend uses shared contracts and compatible mocks to progress independently
of the engine. It renders engine-provided access, scores, DNA values, treaty impact,
and optimizer results without duplicating their calculations. Shared contract
changes remain coordinated. Country information retains sourced provenance.

This choice does not assign dev-prabhu the engine role, adopt AI, or claim any
frontend implementation has begun. The actual branch is dev-adithyaa.
