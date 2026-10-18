# chat-bot work lane — current state

- Updated at: 2026-10-17T07:47:16Z
- Status: ready_for_review
- Task: Keep country-chat visitor recommendation text and its styled bullet marker in one readable flow.
- Branch: chat-bot
- Baseline commit: fa90372c12f872685ab91bef896203e90696e52b
- Latest run: [Country-chat bullet layout recovery](runs/20261017T074716Z-bullet-layout-recovery-6d4c.md)

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
- The answer renderer now recognizes Markdown numbered lists as well as ordinary
  bullets. Its recommendations are left-aligned teal-marker rows, with clearer
  heading, emphasis, source, and caution styles based on the existing palette.
- Raw Markdown attraction tables now become the same titled bullet list before
  rendering, and provider citation tokens are removed from answer text because
  the saved source links are presented separately.
- A broadly phrased repeat visitor question for the same session and country now
  reuses the most recent source-backed visitor result before calling Groq again.
  Uncached browser discovery has a 75-second provider deadline within its
  90-second job deadline.
- Assistant answers now use a definite responsive width and preserve ordinary
  word boundaries, preventing destination-list copy from being laid out one
  character per line.
- The styled marker no longer uses a CSS Grid column that captured inline bold
  text; it is now an independent positioned marker beside the full list row.

## In progress

None.

## Verification

- Passed: `npm run typecheck`.
- Passed: focused assistant and country-chat tests (23 tests) with local loopback
  access allowed.
- Passed: country-chat parser and routing regression tests (2 tests).
- Passed: combined assistant and country-chat suite (25 tests), including the
  raw-table and citation-normalization regression.
- Passed: assistant and country-chat timeout-recovery suite (25 tests), typecheck,
  production build, docs checks, and diff whitespace checks.
- Passed: country-chat parser regression tests (3 tests), typecheck, production
  build, and diff whitespace checks after the answer-width recovery.
- Passed: a real local-browser 470px recommendation probe after the bullet-layout
  recovery. The first item reduced from 1299px to 80px high while retaining a
  359px text row.
- Passed: `npm test` (92 tests) with local loopback access allowed.
- Passed: `npm run build`.
- Passed: `scripts/check-docs.ps1` and `git diff --check`.
- Passed: manual local visual check of the ready Japan drawer at a narrow width;
  no live provider request was submitted.
- Not run: a live Groq attraction search or manual browser review; neither was
  needed for the mocked behavior and no provider allowance was spent by this run.

## Blockers

Live source results remain unreviewed and require server-side Groq configuration.
An uncached visitor query still depends on Groq availability; the assistant cannot
guarantee current opening hours, availability, or admission.

## Next actions

- Restart the local app/server and refresh the Explore page. Cached Japan visitor
  recommendations should now remain readable as normal multi-line bullet rows;
  hard-refresh once if the browser is still serving an older stylesheet.
- Keep future entry and visa queries on the cache-only route unless the user
  explicitly authorizes research.

## Coordination

This explicit user-assigned `chat-bot` branch changes no engine, data, shared
schema, passport classification, or simulation behavior. The working tree has
local chat presentation, prompting, and cache-recovery edits; this run made no
commit or push.
