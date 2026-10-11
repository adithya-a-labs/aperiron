# 0010: Full application on Vercel

- Date: 2026-10-11
- Status: accepted
- Accepted by: explicit user request and managed Postgres selection in this session
- Supersedes: none (extends the local runtime)
- Superseded by: none

## Context and acceptance

The user explicitly requested configuring `main` for Vercel-only application
hosting, including storage and background work, and selected managed Postgres via
Vercel Marketplace. Earlier requests were analysis-only; this request authorizes
local implementation. It does not authorize provisioning, publishing or Git pushes.

## Decision

Host the Vite frontend, Node API and durable jobs on Vercel. Connect managed
Postgres via Marketplace for server persistence. Use Nitro and Workflow to retain
the existing API without a frontend framework migration. Keep bundled images
static, and preserve the local file-backed development option.

## Alternatives and consequences

A separate Railway backend is unnecessary with this runtime. Static-only hosting
would omit the existing API/provider and persistent job features. Server files
and in-memory queues cannot provide production persistence across function instances.

The hosted runtime requires database migrations, server secrets and cloud Workflow
verification. Shared transactional locks favor correctness over write throughput.
Private session cookies still provide no public accounts. Browser engine semantics,
regulation data and public HTTP payload schemas are unchanged. See the
[deployment guide](../DEPLOYMENT.md) for setup, recovery limits and acceptance checks.
