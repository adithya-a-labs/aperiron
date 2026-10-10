# Verification guide

## Evidence standard

Verify observable behavior and meaningful invariants. Record the command or manual
scenario, outcome, and relevant failure details in the run log. A check that was
not executed is `not run`, never a pass. A type check does not prove visual behavior;
a successful build does not prove data accuracy.

Use checks proportionate to the change. Documentation edits need link/format and
consistency checks; they do not justify inventing application tests. Broaden
verification when new code, a failure, or an unresolved concern warrants it.

## Current commands

The documentation repository supports:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check-docs.ps1
git diff --check
```

The first checks local Markdown links and repo-local skill metadata. It does not
check external sites, prove prose correctness, or validate visas. The second
checks tracked diff whitespace; newly created files also need review.
The process-only policy override allows this unsigned repository script on Windows
without changing persistent execution policy. The checker uses inline local links
and simple skill frontmatter; it does not validate arbitrary Markdown or YAML.

The frontend supports `npm run typecheck`, `npm test`, `npm run build`, and
`npm run check` (all three). See [FRONTEND.md](FRONTEND.md) for installation and
ports. Node's test runner covers invalid IDs, destination preservation across passport
switching, reset, and fictional/unverified fixture provenance. There is no lint
configuration yet. Browser checks cover the integrated map/panel flow separately.

For the local sibling page workspaces, the coordinator can use
`node scripts/verify-page-worktree-ports.mjs` after building each workspace. It
checks simultaneous development/production-preview HTTP responses and strict
port collision handling, then stops its own server processes. Assigned ports
must be free. See [PARALLEL_FRONTEND.md](PARALLEL_FRONTEND.md) for setup and ports.

## Checks by change

| Area | Useful verification |
| --- | --- |
| Shared contract | Type check consumers; run shared fixtures against mock and real implementations. |
| Access and comparison | Known category mapping, stable ordering, invalid IDs, unknown permissions, set membership and scores. |
| DNA | Repeated-input determinism; length/range; known fixture; encoding changes only when relevant inputs change. |
| Purchases | Exact credit cost, no input mutation, duplicates, insufficient funds, overlap precedence, reset. |
| Impact | No-op delta, unique newly accessible pairs, category upgrades, before/after consistency. |
| Optimizer | Budget bounds, unpurchased unique IDs, repeatability, overlapping effects, zero-cost handling, actual projected impact. |
| Regulations | Schema, source support, applicable conditions, missing fields, review status, baseline/simulation isolation. |
| UI | Selection flow, keyboard access, loading/error states, stale-response handling, small screens. |
| Docs and skills | Local links, metadata, correct instructions, no unsupported claims or machine-specific paths. |

For immutability tests, retain a before snapshot or freeze a fixture and exercise
both success and failure paths. For optimizer verification, apply recommendations
to a copy through actual engine functions and compare the reported result. A tiny
exhaustive oracle may help assess greedy behavior; do not demand global optimality
from an algorithm that promises only a heuristic recommendation.

## Core integration scenarios

1. Select passport A, open destination X, and check the panel's classification and
   source context against the dataset. Switch to B with X still open; no A data remains.
2. Compare A and B and check highlighted destinations against returned comparison sets.
3. Generate DNA twice for the same effective state and verify the numeric output matches.
4. Purchase a known treaty. Verify cost, affected permissions, calculated impact,
   and the map/DNA/dashboard updates agree. Unaffected results remain consistent.
5. Attempt a duplicate and an unaffordable purchase. Verify state stays unchanged.
6. Run the optimizer and inspect its recommendation. Verify active state is unchanged
   until an explicit apply action. Check the actual applied impact if supported.
7. Reset and confirm baseline results return. Real source records were never overwritten.
8. After initial load, disconnect external services and check the supported local
   experience. If AI exists, its failure should leave structured information usable.

These scenarios become automated browser tests where useful once the app exists.
Until then they are acceptance criteria, not completed checks.

## Optional AI evaluation

If adopted, include supported questions, missing source data, contradictory
guidance, incomplete traveller context, stale responses after passport switching,
and model/API failures. Check claim-level citation support and avoid measuring
quality solely by fluent wording. Verify no model output changes engine state.

## Completion reporting

Summarize what changed, why it matters, checks performed, and material remaining
limitations. Write the same factual verification result in the developer run log.
Do not describe the other developer's work as verified unless you performed the
relevant checks against the integrated code.

## Playful frontend regression coverage

The current app uses all eight engine methods. `npm test` includes the new
`src/store/appStore.test.ts` integration suite as well as starter adapter tests.
Browser acceptance includes every hash route at desktop and mobile widths,
keyboard activation of supported map countries, missing search results, preserved
destination after passport switching, comparison groups, deterministic DNA,
non-spending previews, successful purchases, reset, budget zero, lottery and globe.
Prototype classifications are not verified visa advice. Browser/source checks do
not validate travel guidance. Transit planning remains unavailable. Optional Groq
research is available in the Country Notebook. `npm test` includes actual loopback
HTTP tests for successful research, invalid/oversized inputs, missing configuration,
provider auth/rate-limit failures, malformed responses and credential non-disclosure.
Provider responses in automated tests are mocked; authenticated Groq requests need
an account key and are a separate verification step.
