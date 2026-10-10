# Decision records

Use decision records for durable choices that materially affect product behavior,
architecture, data, or collaboration. Routine implementation details belong in
code and run logs. Keep existing records stable so later agents can understand
why a choice was made.

## Index

| Record | Status | Subject |
| --- | --- | --- |
| [0001](0001-product-and-local-first-direction.md) | Accepted direction | Product scope, browser-first engine, and shared contract. |
| [0002](0002-per-developer-state-and-run-history.md) | Accepted | Separate developer state and per-run logs synchronized through Git. |
| [0003](0003-project-name-aperiron.md) | Accepted | Use aperiron throughout project docs and repo-local skills. |
| [0004](0004-adithyaa-frontend-ownership.md) | Accepted | dev-adithyaa owns frontend experience. |
| [0005](0005-prabhu-core-engine-ownership.md) | Accepted | dev-prabhu owns the core engine. |
| [0006](0006-frontend-foundation-and-worktree-boundaries.md) | Accepted | Runnable frontend scaffold, provisional adapter, and isolated component worktrees. |
| [0007](0007-local-groq-research.md) | Accepted | Local Groq Browser Search through a server endpoint and optional Country Notebook action. |

## Adding or superseding a record

Copy [TEMPLATE.md](TEMPLATE.md), choose the next available number and descriptive
filename, and add an index row. Check remote records before choosing a number
during concurrent work. Record date, status, context, alternatives, decision,
consequences, and evidence of acceptance.

Allowed statuses: `proposed`, `accepted`, `superseded`, and `rejected`. A useful
idea or agent recommendation is still proposed until the user or explicitly
authorized team process accepts it. Routine coding choices within existing scope
do not need a new approval ceremony.

When replacing a decision, add a new record and link both records. Keep the old
rationale and mark it superseded; do not erase inconvenient history. Update the
relevant explanation docs as part of the same change.

Open topics include final scoring/precedence,
regulation lookup types, dataset selection, and broader AI explanation workflows.
Do not create accepted records for these without an actual decision.
