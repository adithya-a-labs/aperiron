# Local Groq Browser Search

- Date: 2026-10-10
- Status: accepted

## Context and acceptance

The user requested Groq integration, then asked for correct backend integration
where setting the environment key is sufficient to use it locally. Map-first
exploration remains the primary experience.

## Decision

Use Groq's GPT-OSS Browser Search behind a Node server handler. Vite dev and local
preview install this handler on the same origin as the frontend. The Country
Notebook requests research for supported passport, destination and purpose values.
Credentials load server-side from ignored `.env` or the shell.

## Alternatives and consequences

An API-only process remains available, but two terminals are not required for
local development. A static-only public host needs a separate server runtime.
Research text stays unreviewed and cannot update baseline regulations or simulation.
Provider selection does not establish source accuracy. Broader conversational
planning, claim verification and evidence caching remain future work.
