# Run 20261010T203352Z-groq-proposal-evaluation-d6a8c2

- Developer/work lane: dev-integration
- Started at: 2026-10-10T20:30:00Z (approximate)
- Finished at: 2026-10-10T20:33:52Z
- Task: Evaluate supplied LLM integration proposals against current source and Groq documentation
- Outcome: completed (analysis only)
- Branch: dev-integration
- Baseline commit: c1376e5

## Work performed

Read supplied proposals as evaluation material, not implementation instructions.
Compared the AI-home proposal with later map-first proposals and accepted local
map/provider-detail direction. Recommend contextual destination explanations,
targeted official-source research, deterministic comparison/DNA explanations and
editable natural-language filters. Broader redesign remains a proposal.

Inspected source: existing server/groq-browser-search.ts uses gpt-oss-20b with
browser_search required on every research call. ResearchRequest has only passport,
destination and purpose; ResearchResponse is answer/model/retrievedAt/disclaimer,
not structured evidence cards. TravellerContext lacks residence and held documents.
Working tree contains Travel Buddy service, cache, UI and documentation changes
added since the previous commit task. Source exists, but its application tests
were not run in this evaluation. Own state had still described implementation as
pending; this run records that drift without claiming verification.

Checked official Groq docs: 120B supports browser search, local function calling
and strict structured outputs. Browser search cannot run with structured outputs;
structured outputs do not currently support streaming/tool use. GPT-OSS parallel
tool use is listed unsupported. Suggested staged requests rather than a single
strict-schema browsing agent.

## Evaluation and proposed execution

1. Keep map-first entry and add Explain / Ask / Research actions in the active
   country notebook. Render structured data even when AI is unavailable.
2. Add an additive AssistantProfile with passport, residence, held-document type,
   issuer and optional validity, purpose/activity, dates/duration and preferences.
   Existing engine receives only fields it supports. Profile extraction returns
   editable proposals; it never silently changes eligibility or persistent profile.
3. Build one context collector for local engine results, cached provider details,
   evidence provenance and unresolved fields. Normal explanations use one 120B
   call without browser search. No new Travel Buddy call merely to explain data.
4. Explicit gap research uses one bounded browser-search request for one destination
   and question. A separate no-tool structured pass may normalize findings into
   cards. Capture actual returned URLs/snippets or trace references, not invented
   links from opaque citation markers. Schema validity is not evidence validity.
5. Validate source IDs and applicability; distinguish provider, retrieved,
   reviewed-supported, conflicting and unknown states. Model text cannot grant
   verification or alter baseline/provider overlays. Conflicts stay visible.
6. Expose read-only getDestinationContext, getComparison, getDNAExplanationFacts
   and findOfficialSources tools only as needed. Prefer deterministic routing
   for fixed actions; cap general tool loops, queries and tokens. No purchase or
   arbitrary state-mutation tools; safe rendered links/text and untrusted-page
   treatment remain necessary.
7. Natural-language filters support known geography/categories/stay where backed
   by evidence. Minimal paperwork is an explicit category proxy until document
   coverage exists. Warm in December requires climate data; budget and flight
   feasibility require separate sources. Unknown constraints remain unsupported.
8. Residence/held-visa rules, business/conference colors and checklists require a
   narrow reviewed rule set. Merely adding profile fields cannot grant access.
   Study/work/transit itineraries need additional contracts and coverage.
9. Cache research by exact context/question and explanation by evidence hash,
   profile and model/prompt version. Deduplicate and apply per-session/server
   budgets. Search has separate costs/limits; fast token generation is not a
   browsing latency guarantee. Keep selected data visible on timeout or 429.
10. Verify with curated supported/unknown/conflicting/conditional/injection cases,
    profile-change races and offline behavior. Measure time to first/final response,
    tokens, search usage, URLs and unsupported claims. Account entitlement and
    authenticated 120B search behavior remain untested.

Recommended hackathon sequence: configure/test 120B capability; ship Explain this
destination; add evidence cards and targeted gap research; add local comparison/DNA
explanations; then editable filters and a small reviewed conditional-rule demo.
No full global browser search, automatic source verification, complete checklists,
route feasibility or home-screen replacement is implied by this recommendation.

## Sources inspected

- https://console.groq.com/docs/tool-use/built-in-tools/browser-search
- https://console.groq.com/docs/structured-outputs
- https://console.groq.com/docs/tool-use/overview
- https://console.groq.com/docs/tool-use/local-tool-calling

## Files changed

Only this evaluation record and own STATE.md. Existing user implementation and
documentation edits preserved; no application or shared contract changes.

## Verification

| Check | Result | Evidence or reason |
| --- | --- | --- |
| Current source / proposal review | passed | Existing research endpoint, contracts, cache and exploration composition inspected |
| Groq capability documentation | passed | Official provider documentation retrieved |
| Application tests | not run | Evaluation only; existing dirty implementation is not this run's work |
| Authenticated Groq API | not run | No live paid/quota-consuming capability test requested |

## Blockers and remaining work

No evaluation blocker. Proposed broader AI scope remains unaccepted. Need actual
account/model/search smoke tests and evidence-shape inspection before claiming
working structured citations or latency. Current data cannot support all examples.

## Next actions

Select a bounded contextual-assistant milestone, then implement additive contracts,
context assembly and evidence rendering with regression/evaluation checks.

## Coordination and handoff

Explicit dev-integration lane. No other developer records changed, no provider
quota consumed and no commit/push. All pre-existing working changes preserved.
