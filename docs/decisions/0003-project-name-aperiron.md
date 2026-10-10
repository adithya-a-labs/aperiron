# 0003 - Project name aperiron

- Date: 2026-10-10
- Status: accepted
- Accepted by: user's explicit rename instruction
- Supersedes: naming in 0001; product and architecture direction remain accepted
- Superseded by: none

## Context

The user selected `aperiron` as the new project name and requested replacement
throughout the repository, including agent-facing references.

## Decision

Use the exact lowercase spelling `aperiron`. Keep the existing subtitle, The
Passport Paradox, and feature names such as Visa DNA and Border Market.
Use the `aperiron-` prefix for the six repo-local skills, their directory names,
metadata, agent routing, and the documentation checker's expected names.

## Consequences

Update project-name references in current repository content and file paths.
The workspace directory and GitHub remote already use this name. No remote rename,
Git history rewrite, application implementation, or unrelated feature rename is needed.
Historical decision rationale remains intact; this record documents the explicit
authorization for the naming update.

## Acceptance and references

The user explicitly supplied the spelling and requested all project-name instances
be changed. See [PRODUCT.md](../PRODUCT.md) and [agent instructions](../../AGENTS.md).
