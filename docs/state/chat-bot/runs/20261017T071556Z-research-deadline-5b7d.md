# Run 20261017T071556Z-research-deadline-5b7d

- Developer/work lane: chat-bot
- Started at: 2026-10-17T07:09:00Z
- Finished at: 2026-10-17T07:15:56Z
- Task: Repair country-chat provider deadline failures and make the resulting error helpful to the visitor.
- Outcome: completed
- Branch: chat-bot
- Baseline commit: 742380815fcec19b8388a748f1a7746b93c96f02

## Work performed

- Inspected local assistant job metadata without reading or recording user transcript content. Recent country-research attempts showed strict-response validation failures and one upstream deadline failure; a normal assistant request had also timed out.
- Kept browser-backed country discovery to one provider stage: the completed browser-search answer is grounded with its owned source evidence and returned directly, avoiding a second strict-JSON generation call after a successful search.
- Split the browser-search model setting from ordinary assistant generation. Browser-source discovery defaults to `openai/gpt-oss-20b`; structured assistant generation remains `openai/gpt-oss-120b`.
- Added concise retry messages for provider timeouts and malformed provider responses in the country-chat drawer.
- Updated the test fixture so the visitor-discovery test verifies the direct browser answer, named-place Markdown, source search, and the absence of the visa-only warning.

## Files changed

- `.env.example` — documents the separately configurable browser-search model.
- `docs/ASSISTANT_BACKEND.md` — documents country visitor discovery and its single-stage response path.
- `server/assistant/groq.ts` — routes browser search to its configured lightweight search model.
- `server/assistant/service.ts` — returns explicit country-research answers directly with unreviewed-source grounding.
- `server/assistant.test.ts` — covers the direct visitor-discovery answer and model selection.
- `src/components/CountryChatDrawer.tsx` — maps provider failures to clear retry text.
- `docs/state/chat-bot/STATE.md` and this run entry — record the local, uncommitted result.

## Verification

| Check | Result | Evidence or reason |
| --- | --- | --- |
| `git diff --check` | passed | No whitespace errors; Git reported existing line-ending conversion warnings only. |
| `npm run typecheck` | passed | TypeScript completed with no errors. |
| Focused assistant and country-chat suite | passed | 23 tests passed, including destination-discovery routing and direct browser-answer coverage. |
| `npm test` | passed | 92 tests passed with local loopback access allowed. |
| `npm run build` | passed | Production Vite/Nitro build completed; only existing bundle-size and bundler diagnostic warnings were reported. |
| `scripts/check-docs.ps1` | passed | Verified 148 Markdown files and 6 project skills after the state record was written. |
| Live Groq request and visual browser review | not run | Avoided spending provider allowance; mocked checks do not prove current provider availability or source quality. |

## Blockers and remaining work

No implementation blocker. A configured Groq server must be restarted before it loads the new search-model setting. A live provider outage can still prevent any request from completing; returned attraction data remains unreviewed and is not entry guidance.

## Next actions

- Restart the local assistant server and retry a Japan tourist-places question.
- Confirm the displayed source links and visual layout with a live response when provider access is available.
- Keep detailed visitor data unreviewed unless it has a separate approved validation pipeline.

## Coordination and handoff

This follow-up is limited to the user-assigned `chat-bot` branch and country-chat assistant path. It introduces no shared engine, regulation-data, or simulation contract changes. All changes are local and uncommitted; no Git commit, push, deployment, or live provider request was made. It follows [the preceding tourism-routing run](20261017T070749Z-tourism-chat-7b2f.md).
