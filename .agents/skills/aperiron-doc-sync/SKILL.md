---
name: aperiron-doc-sync
description: Reconcile aperiron documentation with meaningful code changes or a requested drift audit while preserving accepted decisions and accurate implementation status.
---

# Reconcile documentation

Read the update-trigger table in [DEVELOPMENT.md](../../../docs/DEVELOPMENT.md).
Inspect the actual change or requested audit range before choosing docs to update.
For a branch audit, establish the real comparison baseline and scope.

Map behavior changes to product, architecture, contracts, data policy, setup,
ownership, or verification. Confirm claims with source/configuration/test evidence.
Never invent implementation, acceptance, verification results, or freshness dates.

Correct factual drift within scope. If code contradicts an accepted product
decision, report the discrepancy instead of rewriting the product to bless the
code. Keep alternatives proposed until accepted. Executable types define actual
signatures; contract docs explain agreed semantics. Investigate disagreements.

Maintain one explanation per topic and link it elsewhere. Current progress and
handoffs belong in developer state/run records, not a competing global status file.
Preserve completed history and decision rationale.

Run the doc checker, review consistency, and log reconciled facts, unresolved
issues, and actual validation. This workflow does not schedule, push, merge, or
access private work. An unchanged audit needs no artificial documentation churn.