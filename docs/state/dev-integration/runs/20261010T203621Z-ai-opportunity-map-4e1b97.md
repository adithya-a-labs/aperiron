# Run 20261010T203621Z-ai-opportunity-map-4e1b97

- Developer/work lane: dev-integration
- Started at: 2026-10-10T20:35:00Z (approximately)
- Finished at: 2026-10-10T20:36:21Z
- Task: Explore broad AI integration possibilities beyond the first contextual-assistant milestone
- Outcome: completed (analysis only)
- Branch: dev-integration
- Baseline commit: c1376e5

## Work performed

Expanded the earlier proposal evaluation into a product opportunity map. All
features below are proposals, not claims of implementation or newly accepted scope.
Reviewed current source selection and updated implementation run: Travel Buddy
implementation has its own recorded 44-test/browser/live verification. This run
did not repeat those checks. Current Groq source remains 20B/browser-search with
unstructured answers. Preserved all existing application and documentation edits.

### Opportunities using current engine/cache inputs

- Explain a selected classification, raw provider rule and alternative options.
- Explain a conditional rule and identify which traveller fact is unresolved.
- Compare selected destinations with explicit missing-field comparisons.
- Explain passport comparison, access gains/losses and DNA encoding patterns.
- Translate or simplify sourced explanations, retaining numbers/conditions.
- Turn supported natural-language constraints into editable deterministic filters.
- Preserve map selection for follow-ups such as why not this country or nearby
  alternatives; use geometry/catalog for location, never model-generated geography.
- Create a saved/shareable brief with sources, assumptions and unanswered questions.
- Group-passport overlap discovery using deterministic intersection, labeled as
  snapshot access rather than guaranteed suitability for every party member.
- Explain snapshot/provider differences and actual observed cached changes.

### Opportunities needing reviewed evidence and additional rules

- Residence/held-document conditional access and expiry-sensitive what-if views.
- Activity-specific tourism/business/conference questions and explanations.
- Source-linked document checklists with required/conditional/unknown states.
- Preparation timelines with sourced deadlines and separately marked user targets.
- Compare primary/alternative application routes, forms and application channels.
- Passport-validity/date checks using explicit calendar rules and documented context.
- Shortlist preparation burden based on actual reviewed requirements rather than
  claiming visa categories measure paperwork completely.
- Identify missing evidence and ask only questions needed by supported branches.
- Research tray showing retrieved/reviewed/conflicting/unknown evidence.
- Official guidance clause summaries, change candidates and source freshness.
- Draft factual embassy/consular clarification messages for the user to review;
  no sending or representation without explicit later authorization.

### Opportunities needing other data/services

- Seasonal climate preferences, live weather and destination-event discovery.
- Flight options, actual trip budget, travel time and accommodation constraints.
- Transit/airside/landside checks based on airports, tickets, baggage and route.
- Multi-stop itinerary constraints, stay limits and dated entry/re-entry rules.
- Arrival-registration windows and sourced deadline reminders.
- Saved-trip policy-change monitoring and disruption alternatives; separate
  scheduler, dated sources and notification authorization required at implementation.
- General itinerary suggestions distinct from verified logistical feasibility.
- Health/advisory information sourced separately from visa eligibility.

### Document, accessibility and platform possibilities

- Explain uploaded official letters/forms after text extraction; scanned images
  need OCR or a vision service because GPT-OSS 120B is text-in/text-out.
- Extract proposed document dates/fields for user confirmation, check completeness
  against a reviewed checklist, explain form fields and draft answers for review.
  No authenticity determination, approval prediction or automatic application submission.
- Voice trip questions via separate speech-to-text plus 120B; optional speech
  output uses a separate service. Text translation quality requires evaluation.
- Evidence-navigation interface for accessibility and plain-language explanations.
- Researcher tooling: discover sources, extract candidate clauses, classify
  applicability, suggest conflicts and produce review diffs with human approval.
- Fictional policy explanation/strategy discussion if game is deliberately resumed;
  existing optimizer computes results. No model world-state mutation or claim that
  fictional rules are real guidance. Game remains paused.

### Technical architecture and priorities

Use 120B for intent/explanation/research synthesis, engine helpers for calculations,
Travel Buddy for cached pair enrichment, official evidence for supported claims,
and explicit adapters for other external data. A small evidence/context bundle
avoids shipping the whole matrix in prompts. Start fixed actions before generic
agent loops. Search only for gaps or explicit research; cache and deduplicate by
exact context/evidence/prompt versions. User-editable proposals control filters
and profile changes; model text cannot silently alter access.

Browser search and strict structured output are separate stages. Search returns
evidence candidates; a no-tool pass may organize them. Prefer actual returned
annotation/source metadata when available; inspect live response shape before
promising a structured citation adapter. Schema validity does not establish fact
validity. Groq prompt caching can reduce repeated-prefix compute but is not an
application answer/evidence cache and is not a guaranteed hit.

Suggested tiers: first contextual explain/research/source cards/comparison; then
group discovery, reviewed preparation plan and conditional demo; later route,
climate, uploads, voice and monitoring. Core map remains usable without AI. The
strong demo loop is shortlist -> compare -> investigate exception -> source cards
-> preparation brief, with evidence states rather than unsupported confidence
scores or admission predictions. Authenticated model capability/latency remains
untested in this evaluation.

## Sources inspected

- https://console.groq.com/docs/model/openai/gpt-oss-120b
- https://console.groq.com/docs/tool-use/built-in-tools/browser-search
- https://console.groq.com/docs/prompt-caching
- https://console.groq.com/docs/speech-to-text
- https://console.groq.com/docs/text-to-speech
- https://console.groq.com/docs/changelog
- https://console.groq.com/docs/api-reference

## Files changed

Own STATE.md and this run entry only. Existing user implementation preserved.

## Verification

| Check | Result | Evidence or reason |
| --- | --- | --- |
| Provider documentation/source review | passed | Official documentation and current model selection inspected |
| Documentation check | passed | Run after logging; no application changes |
| Application/model live tests | not run | Opportunity evaluation only; no API quota consumed |

## Blockers and remaining work

No exploration blocker. Feature feasibility depends on evidence/contract coverage,
actual account limits, citation response shape and separately scoped services.
Broad opportunities are not implementation authorization.

## Next actions

Choose a coherent demo bundle rather than implementing every candidate. Start
with evidence/context assembly and a bounded 120B capability smoke test when
implementation is authorized.

## Coordination and handoff

Preserved the concurrent completed implementation log and its recorded checks.
No app code changed, no message sent externally, no schedule created, no commit
or push. Prior evaluation remains historical; current analysis records new scope.
