# chat-bot work lane — current state

- Updated at: 2026-10-17T07:15:56Z
- Status: ready_for_review
- Task: Make sourced country-chat discovery complete reliably and handle upstream failures clearly.
- Branch: chat-bot
- Baseline commit: 742380815fcec19b8388a748f1a7746b93c96f02
- Latest run: [Country-chat research deadline repair](runs/20261017T071556Z-research-deadline-5b7d.md)

## Completed

- Destination-discovery prompts such as “What are the tourist places in Japan?”
  now use the existing bounded country-research intent; entry, visa and document
  questions remain cache-only.
- Visitor-search prompts prefer official tourism and official attraction sources,
  then request concise titled lists with named bullet points rather than entry-rule
  gaps.
- The country chat now presents visual hierarchy for answer lists and lets a user
  expand the unreviewed web sources used for an answer.
- Explicit country research now returns the completed browser-search answer directly
  instead of issuing a second strict-JSON model request. Browser searches use the
  separately configurable 20B search model, while ordinary assistant generation
  retains its 120B model.
- Provider timeouts and malformed provider responses have concise retry messages
  in the country-chat drawer rather than raw upstream error text.

## In progress

None.

## Verification

- Passed: `npm run typecheck`.
- Passed: focused assistant and country-chat tests (23 tests) with local loopback
  access allowed.
- Passed: `npm test` (92 tests) with local loopback access allowed.
- Passed: `npm run build`.
- Passed: `scripts/check-docs.ps1` and `git diff --check`.
- Not run: a live Groq attraction search or manual browser review; neither was
  needed for the mocked behavior and no provider allowance was spent by this run.

## Blockers

Live source results remain unreviewed and require server-side Groq configuration.
The assistant cannot guarantee current opening hours, availability, or admission.

## Next actions

- Restart the local assistant server, then manually ask the Japan tourist-places
  question and review the returned source links and responsive drawer layout.
- Keep future entry and visa queries on the cache-only route unless the user
  explicitly authorizes research.

## Coordination

This explicit user-assigned `chat-bot` branch changes no engine, data, shared
schema, passport classification, or simulation behavior. The working tree is
local and uncommitted; no commit or push was made.
