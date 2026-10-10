---
name: aperiron-contract-check
description: Coordinate and verify aperiron shared interface changes, including engine APIs, regulation lookup, scoring semantics, errors, mocks, and fixtures.
---

# Review a contract change

Read [CONTRACTS.md](../../../docs/CONTRACTS.md) and actual shared type/API files if
present. Draft semantics are not a frozen executable contract.

Trace affected engine, data, UI/store, mock, fixture, persistence, and test consumers.
Identify additive versus breaking changes and overlap with the other developer.
Coordinate breaking cross-owner changes through the existing user/task process;
do not invent approval gates for routine compatible edits already authorized.

Check implicated semantics: ordering, category meanings, unknown/self handling,
immutable purchases, treaty precedence, DNA encoding, optimizer bounds, and
regulation provenance. Keep baseline lookup separate from fictional treaty effects.

Update types, implementations, consumers, semantic docs, and fixtures together.
A mock must honor the same fixture behavior. Do not copy complete type definitions
into multiple documents.

Run available type and focused contract checks. If no scaffold exists, record the
limitation rather than claim draft interfaces were tested. Verify behavioral
boundaries, not only matching function names. Log compatibility effects, actual
results, remaining migrations, and coordination needs. Significant accepted
choices may need a decision record; unaccepted choices remain proposed.