# 0001 - Product scope and local-first direction

- Date: 2026-10-10
- Status: accepted
- Accepted by: user direction in the project context and follow-up clarification
- Supersedes: none
- Superseded by: [0003](0003-project-name-aperiron.md) for project naming only; direction unchanged

## Context

Two developers need to build an integrated passport mobility experience quickly.
The user clarified that the game is only part of the project and explicitly
requires country clicks to reveal passport-specific regulations and visa norms.
Independent UI and engine work needs a common interface to avoid integration drift.

## Alternatives

- Organize the whole application around gameplay: does not cover the user's wider
  exploration and regulation needs.
- Introduce separate backend services immediately: adds integration and deployment
  work before the local simulation needs it.
- Keep a browser-first shared engine with multiple product experiences: supports
  exploration, comparison, DNA, and gameplay against consistent calculations.

## Decision

Use the third direction. Start with React/Vite/TypeScript, local data, a pure
TypeScript simulation engine, and a shared interface consumed by the UI. Treat
passport-specific country information as a core exploration feature. Keep
deployment last. Add a service only when an adopted feature needs one.

The exact dependencies, scoring, regulation schema, and named role assignments
remain open. The original seven-method interface is a draft and needs a regulation
lookup extension. An LLM was discussed but has not been adopted.

## Consequences

The explorer must work outside game mode. The engine has no React/store imports.
The UI consumes calculation results rather than recreating them. Sourced
regulations and simulated access changes remain separate. Detailed transit or
journey claims require additional modeling before they are displayed.

## Acceptance and references

Based on the user's supplied project context, correction about the game scope,
and country-regulations requirement. See [PRODUCT.md](../PRODUCT.md),
[ARCHITECTURE.md](../ARCHITECTURE.md), and [CONTRACTS.md](../CONTRACTS.md).
This record documents direction, not a claim of implemented software.
