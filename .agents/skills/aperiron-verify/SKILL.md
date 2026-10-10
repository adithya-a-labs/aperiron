---
name: aperiron-verify
description: Select and run proportionate verification for a aperiron implementation or documentation change and record observed outcomes before handoff.
---

# Verify affected behavior

Read [VERIFICATION.md](../../../docs/VERIFICATION.md) and inspect the actual diff,
runtime configuration, and available scripts. Select checks based on changed
behavior. Do not run nonexistent app commands or install a suite for a small edit.

For docs/skills, run scripts/check-docs.ps1, review whitespace, and check factual
consistency. For code, run available focused tests/type checks and add integration
or browser evidence where the affected flow needs it.

Prioritize meaningful invariants: input mutation on purchase failure, unknown
data, treaty overlap, optimizer bounds, stale country-panel responses, and
baseline/simulation isolation. Avoid tests that merely restate implementation text.

On failure, distinguish change-caused, pre-existing, and environment issues. Fix
within scope and rerun affected checks. Broaden only when new failures or unresolved
concerns justify it. Never substitute a weaker check silently.

Report passed, failed, and not-run checks with evidence/reasons. Keep final and
run-log claims consistent. A build pass does not establish source accuracy,
accessibility, or visual correctness.