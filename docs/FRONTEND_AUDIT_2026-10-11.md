# Desktop frontend audit — 2026-10-11

Current follow-up: [desktop re-audit](FRONTEND_REAUDIT_2026-10-11.md) records
regressions in baseline 59333b4. The findings/resolution below describe their
historical baselines and do not certify the latest integrated styling.

Audit baseline: `dev-integration`, `11bc22adab3efbf52fab7ed6dce0d86dc4d5a541`.
Original read-only implementation review. The original findings below describe
that baseline; the resolution section records the subsequent fixes requested by
the user. Desktop remains the priority; mobile optimization is excluded.

## Assessment

Preserve the cream/navy palette, yellow primary actions, illustrated passport
motif, and map-first navigation. They form a coherent visual identity across the
five active screens. The main weaknesses are keyboard workflow, motion preference
handling, desktop space allocation, and getting from comparison insights to details.
No P0 blocker was established. Three P1 issues should precede visual polish.

Used Emil's `emil-design-eng`, `review-animations` and `break-ui` guidance.
The latter was adapted to this read-only request: real catalog extremes and
browser-only response fixtures, with no fixture switch or application changes.
Mobile-native, Expo, Swift, library selection and animation implementation skills
were unnecessary. Motion opportunities below favor simplification; no new motion
is needed to solve the primary problems.

## Coverage and evidence limits

- Inspected active `App.tsx`, `AccessMap.tsx`, `Artwork.tsx`, `TravelBrief.tsx`,
  styles, selection/detail stores, adapter, relevant shared types and engine paths.
- Visited Explore, Country Notebook, Compare, Visa DNA and More in the running app.
  Paused game URL `#/market` renders Explore; game implementation was not evaluated
  as an active user journey. Starter `WorldMap.tsx`/`DestinationPanel.tsx` are not
  imported by the active App; backend assistant operations have no active UI here.
- Primary visual inspection: 1440×900. Explore additionally captured at 1366×768,
  1920×1080 and 960×540. Compare captured at 960×540. The latter is a viewport
  equivalent of 200% zoom on 1920×1080, not an actual browser zoom test. Phone
  layouts and touch optimization were deliberately excluded.
- Exercised search/no results/clear, list selection, passport search/Enter/Escape,
  long passport names, same-passport comparison, map Enter activation, notebook
  non-tourism unknowns, lottery and globe rotation, and reduced-motion media.
- Research 503 and synthetic success were intercepted at the browser API boundary.
  Remaining refresh requests were stubbed during adverse-state checks. Stubs were
  removed afterward. Synthetic answers are labeled fixtures, not travel guidance.
  Initial notebook inspection used existing cached provider information. No live
  research was requested; provider accounting was not audited.
- No screen reader, automated accessibility scanner, frame profiler, exhaustive
  contrast inventory, actual zoom, or all-route/all-resolution matrix was run.
  Keyboard and semantic findings are concrete; this is not accessibility certification.
- Screenshots are local ignored artifacts in `output/playwright/frontend-audit/`.
  They will not travel through Git unless separately preserved. Durable source
  references and reproduction steps appear below.

## Prioritized findings

P1 = significant accessibility/workflow problem. P2 = usability or comprehension
problem. P3 = polish. “Observed” means browser/source evidence; “source” marks a
behavior inferred from implementation rather than a separately reproduced failure.

| ID / priority | Before | After / concrete fix | Why / evidence |
| --- | --- | --- | --- |
| F01 / P1 | Passport picker loses focus after Enter or Escape; its accessible trigger name is only “My passport”/“First passport”. Arrow highlighting uses `data-active` without exposing the active option to assistive technology. | Restore trigger focus on selection/Escape; include current passport in its accessible name. Use a complete combobox/listbox pattern with stable IDs, `aria-controls`, `aria-activedescendant`, and one keyboard navigation model. Close on focus leaving the widget. | Observed `document.activeElement.tagName === BODY` after both closing paths. Source `src/App.tsx:83–218`, especially 129, 157 and 179–205. Current arrows scroll correctly, but the highlighted choice is not programmatically conveyed. Acceptance: open, filter, Arrow, Enter/Escape, then Tab continues from the trigger; screen reader announces active and selected values. |
| F02 / P1 | Explore map contributes 199 sequential Tab stops before the requirements CTA. More's globe retains focusable paths with empty geometry on the hidden hemisphere. | Make map keyboard entry a single stop with roving focus/navigation, or provide a prominent keyboard bypass to the searchable list/details. Remove hidden globe paths from keyboard and accessibility navigation. Preserve Enter/Space activation and visible focus. | Observed 199 `.map-country[tabindex="0"]` on Explore and 25 empty-`d` focusable globe paths at the inspected rotation. `src/components/AccessMap.tsx:139–225`. Keyboard Enter on Canada did update its postcard. Acceptance: reach details without traversing the world; no invisible globe stop receives focus. |
| F03 / P1 | Reduced-motion CSS disables CSS keyframes, but SVG SMIL still mounts and is explicitly restarted. Route motion is 1.2s and destination pop is 1.6s from scale zero. | Render a static route/endpoints when reduced motion is requested; bypass decorative replay for keyboard selections. Prefer removing the flight/pop sequence for frequent selections. If pointer feedback remains, use a short opacity/transform response under 300ms, starting around scale .95. | Browser media emulation confirmed `reduce=true`, CSS animation `none`, but active SVG `animateMotion`/`animateTransform` durations remained 1.2s/1.6s. Source `AccessMap.tsx:116–131, 288–380`; `styles.css:469–501,1685`. CSS and SMIL both animate the pin/mask, adding competing timelines. Source confirms no reduced-motion branch around SMIL. |
| F04 / P2 | Large heading/decoration and a width-scaled map push the legend below the first desktop viewport. Important category text is only 10px. | Keep the legend and data-context sentence beside/above the map controls; bound the map by available desktop height. Reduce top spacing before reducing map readability. Use readable 12–14px supporting text. | Observed Explore legend top y=905 at 1440×900. At 1366×768 its initial measured top was 779; subsequent full-page capture showed a taller settled layout, so exact height is content-dependent. At 1920×1080 top was 997. `styles.css:190,419–442,503–535,1701`. Acceptance: map, legend and primary action are easy to locate at 1366×768 and 1440×900 without relying on color memory. |
| F05 / P2 | Compare renders up to 169 shared destinations as static chips, ordered by engine/catalog order rather than names. No chip opens details; categories appear only in the differences group. | Add name search and name sorting; render a scannable destination table/list with explicit passport A/B category columns and a clear inspect action. Preserve engine-provided sets/scores. Decide how an inspect action retains both comparison selections before implementation. | Observed VC vs DE: 169 shared places and zero result links/buttons. `src/App.tsx:738–872`, `styles.css:1051–1082`. The attractive summary works; the long chip wall creates a dead end after identifying a place. Acceptance: find Japan, read both classifications, then open its relevant notebook without re-searching Explore. |
| F06 / P2 | Country Notebook gives a large illustration roughly half the card while repeating provider stay/application data in two sections. Application links visually run into values: “90 daysOpen application / guidance”. | Consolidate the primary rule, stay, action and provenance into one summary. Place application/registration actions on separate lines with spacing and link styling. Reduce the illustration column and prioritize the useful next action before unknown secondary fields. | Observed cached IN→JP notebook screenshot. `src/App.tsx:581–654`, `src/components/TravelBrief.tsx:3–10`; global anchors remove underline and the inline link has no leading separation. Acceptance: distinguish visa rule, arrival form and unknown documents in a quick scan; retain honest unavailable fields. |
| F07 / P2 | Research source URLs are plain model text with no clickable source list. Users must select/copy URLs to review leads. | Render validated HTTPS links as clearly labeled unverified leads, or consume structured source records through a coordinated contract change. Never imply model prose verifies a rule. | Observed synthetic success with a plausible long example.org URL: zero `.research-result a`; no page overflow. `src/App.tsx:665–671`, `src/shared/research.ts:10–15`. Source/citation rendering should improve reviewability without introducing unsafe HTML. Acceptance: open a lead by keyboard and retain its unreviewed label. |
| F08 / P2 | Search replaces the map with results while the Map toggle remains pressed. Selection clears search and can snap users back to the map; no result-count announcement exists. | Make the temporary search-results state explicit and keep the view control truthful. Retain a deliberate return-to-map action; announce result counts/empty results politely. | Observed “zzzz” produces “No places found” while Map has `aria-pressed=true`. `src/App.tsx:338–388`. Clear recovery works. Acceptance: searching never presents contradictory Map/List state, and the user knows when results changed. |
| F09 / P2 | More's globe offers colored countries without a legend or visible current-passport selector/label in its card. Lottery immediately changes the global passport used elsewhere. | Show the passport context and shared legend beside the globe. Explain that a draw changes the active passport; consider previewing a draw before adopting it. | Observed More has zero `.legend` elements. Drawing North Korea immediately changed the globe's accessible map name. `src/App.tsx:1414–1490`. This is a discoverability issue, not a request to restore game features. Acceptance: interpret globe colors and identify the passport without returning to Explore. |
| F10 / P2 | DNA legend promises Unknown and Restricted as separate categories, but the flower derives both from the same zero weight and paints zero as Restricted red. Statistics show only visa-free, eVisa and total. | Explain the collapsed encoding next to the flower and provide a complete textual category summary. If separately coloring Unknown is desired, obtain per-destination category data through the existing engine view rather than inventing numeric distinctions. | Source `src/components/Artwork.tsx` DnaFlower (zero-value color branch), `src/App.tsx:879–974`; the details disclosure already admits zero-weight equivalence. Visual appearance alone cannot convey every legend category. Acceptance: a user can identify unknown coverage without interpreting it as a restriction. |
| F11 / P2 | Country selection/passports live only in memory, while URLs identify only the page. Reloading a copied notebook link returns to IN→JP defaults. | Encode validated passport/destination context in the URL and preserve it across navigation/history. Keep traveller information out unless explicitly appropriate. | Source `src/App.tsx:56–68`; `src/store/appStore.ts:25–29`. Full navigation to paused market during this audit reinitialized the app with default selections. Direct selected-notebook reload was not separately exercised: this finding is source-supported. Acceptance: copy/reload a notebook link retains its two countries. |
| F12 / P2 | Curated postcard image paths point to absent assets; fallback artwork is shown with specific landmark names. | Either include the intended local images or deliberately use illustrations with accurate illustration captions. Keep the robust error fallback and test asset existence as an asset check. | Browser showed generic Fuji/garden SVG rather than a photo. Filesystem check found all 27 literal `imagePath` entries missing under public; `public/images/postcards` is absent. `src/data/countryLandmarks.ts:16+`, `src/components/Artwork.tsx:77–140`. This is a packaging/content mismatch, not a demand for photography. |
| F13 / P3 | Every button lifts on hover; active press feedback is absent. Route entrances run even for keyboard navigation. | Scope hover motion to intentional controls; add subtle pointer press feedback (about scale .97, 100–160ms) where useful. Keep keyboard route changes immediate. | Source `styles.css:63–79,2360–2380`. Prioritize F01–F03 first. Reduced-motion CSS already disables the CSS entrance; avoid adding more animation to routine exploration. |

## Motion verdict

**Block motion approval pending F03.** Accessibility: reduced-motion does not gate
SMIL. Feel/timing: frequent selection replays a long scale-zero pin/flight sequence
even for keyboard input. Simplification: remove the redundant CSS/SMIL timelines
and decorative replay before tuning easing. No measured dropped-frame claim is
made. F13 is lower-priority polish, not a reason for a broader animation rewrite.
When short feedback remains appropriate, Emil's reference uses
`cubic-bezier(0.23, 1, 0.32, 1)` and 100–160ms press feedback.

## What already works

- Main navigation exposes the current page; route changes update the document title
  and focus main. A skip link exists. Country notebook has a clear return action.
- Search has an explicit empty state and clear recovery. List selection and map
  keyboard Enter activation update destination details. Passport filtering and
  active-option scrolling are implemented.
- Long Saint Vincent and the Grenadines selections fit the inspected desktop
  controls without horizontal page overflow. Same-passport comparison returns zero
  differences with an empty-state message rather than crashing.
- Non-tourism notebook selection showed Unknown and unavailable detailed fields;
  it did not continue showing tourism provider details as business requirements.
- Stubbed research failure restores the actionable Research sources button and
  leaves the structured notebook available. Synthetic success is visibly unverified.
- No horizontal document overflow was measured in the inspected Explore desktop
  states or the 960px comparison state. This does not prove all zoom/reflow cases.
- Game navigation stays hidden and old game URLs show Explore. Existing provider
  labels and unavailable-document copy preserve important evidence boundaries.

## Recommended implementation order

1. Repair shared picker semantics/focus and map/globe keyboard navigation (F01–F02).
   Validate with a screen reader and keyboard before visual refinements.
2. Make selection feedback static under reduced motion; simplify route replay (F03).
3. Fit the Explore interpretation controls into desktop working space (F04), then
   improve compare-to-notebook navigation and the notebook summary (F05–F06).
4. Improve evidence actions, search state, globe context and DNA explanation
   (F07–F10); preserve engine calculations and unverified provenance.
5. Add shareable selection URLs and resolve asset packaging (F11–F12); polish
   pointer feedback only after the above (F13).

Use the same palette and artwork direction. A complete redesign or new library is
not justified by these findings. If the comparison table or notebook hierarchy
needs competing layouts, use `prototype` in a later implementation task.

## Verification

| Check | Outcome | Limits |
| --- | --- | --- |
| `npm.cmd run typecheck` | passed | Zero diagnostics; does not validate accessibility. |
| `npm.cmd test` | passed on rerun | 65/65. First sandbox run: 41 passed/24 failed with loopback fetch failures; rerun outside socket restrictions passed. |
| Running browser journeys | completed with findings | Scenarios and viewport coverage listed above; screenshots local only. |
| API adverse states | passed for exercised UI recovery | Browser stubs, not live provider evaluation. Expected stubbed 503s appear in console. No app console errors before stubs. |
| Build | not run | No implementation changed; typecheck/tests and running app used for this audit. |
| Full accessibility/actual 200% zoom/performance | not run | Follow-up validation required; viewport equivalent is explicitly limited. |

The original audit changed no implementation files and performed no commit/push.
Integration run records carry each run's actual local handoff status.

## Resolution — 2026-10-11

All 13 findings have implementation fixes on `dev-integration`, based on
`ac38c6d0a0857aabe21819b4b0423fabef3b5c57`. This section supersedes the unresolved
status above, while preserving the original observations. No engine contract,
regulation, scoring or DNA-vector semantics changed. The game remains paused.

| Finding | Before | After | Why / evidence |
| --- | --- | --- | --- |
| F01 | Picker dropped focus and lacked an active option/name | Extracted `PassportSelect` exposes active descendant, selected passport, options and result status; Enter/Escape restore trigger focus | Browser keyboard checks passed, including empty results and long catalog names; active option ID resolves. |
| F02 | Hundreds of Tab stops and clipped globe targets | One roving Tab stop per interactive map, visible alphabetical arrow navigation, Home/End, Enter/Space selection; clipped paths omitted | Browser measured one Tab stop on map/globe and zero empty globe paths; arrows changed focus, Enter selected. |
| F03 | Replayed CSS/SMIL route and pin animation | Static dashed pair connection and markers; no animation timers or SMIL | Zero `animate`, `animateMotion` or `animateTransform` elements across five active pages under reduced motion. |
| F04 | Below-fold legend and tiny interpretation text | Legend above map, 12px supporting text, reduced Explore spacing and bounded map/list height | 1366×768 screenshot: legend y=370, requirements CTA visible; desktop screenshots at three target sizes. |
| F05 | Static, unsorted chip wall without inspection | Name/code search, name sorting, explicit A/B snapshot-category table and inspect links | Japan found; second passport notebook opened, reloaded and returned with IN/DE pair preserved. |
| F06 | Repeated primary stay/rule and cramped inline links | Provider summary first, secondary preparation fields grouped, smaller art column, separate underlined action rows | Cached IN→JP screenshot shows distinct application/registration actions; business purpose remains unknown and hides tourism provider rules. |
| F07 | Plain source URLs | Escaped answer plus deduplicated, validated HTTPS lead list with full URL and unverified label | Synthetic browser success produced two clickable leads; unit test rejects credentials and non-HTTPS leads. |
| F08 | Contradictory Map state and selection reset | Search explicitly opens List, announces count and preserves query/results on selection; Map deliberately clears search | Browser found Japan, selected it with List still pressed and query preserved; Map reset worked. |
| F09 | Globe lacked context; lottery immediately changed selection | Globe passport control and legend; lottery preview plus explicit adoption action | URL stayed IN after draw and changed only after adoption; rotation remains available. |
| F10 | Unknown and restricted shared red rendering; incomplete counts | Flower colors use engine access categories; six counts and accessible summary; zero-weight distinction explained | IN summary totals 199 (27/25/59/88/0/0); category rendering reads `AccessLevel`, while engine vector/hash stay unchanged. |
| F11 | Reload discarded catalog selections | Validated hash query stores passport, destination, comparison and second-passport inspection | Browser reload and back retained pair/context; automated deep-link and invalid-ID/paused-route tests pass. |
| F12 | Missing photograph paths and false landmark labels | Bundled SVG only, country + Illustrated landscape caption, descriptive illustration alternative text; removed missing paths from registry | Source no longer requests `/images/postcards/`; browser screenshots show local illustrations. |
| F13 | Broad hover lift and keyboard page entrances | Removed lifts/entrances; pointer press scale .97 for 140ms only with fine pointer and no reduced-motion preference | Source gates press feedback; keyboard navigation and reduced-motion browser checks have no page-entry animation. |

Final verification: typecheck, 68/68 tests and production build passed. Build emits
the existing future Vite native-config-loader advisory. All five active pages were
checked at 1366×768, 1440×900 and 1920×1080 with long passport names; document
scroll width equals client width in all 15 combinations. Decorative landscape
overflow found during verification was corrected without clipping shared controls.
Same-passport comparison has a precise empty explanation. Synthetic research 503
leaves the notebook usable. Browser provider refreshes and research were stubbed;
no authenticated provider calls were made for this verification.

Screenshots are local/ignored under `output/playwright/frontend-audit/fixed-*`.
Screen-reader software, actual browser zoom, exhaustive contrast measurement and
frame profiling were not run; keyboard/DOM checks are not accessibility certification.
Mobile optimization was intentionally not performed. Fixes and records are committed locally; no push performed. See the integration
state for the current commit handoff.
