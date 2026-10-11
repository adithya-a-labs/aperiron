# Desktop frontend re-audit — 2026-10-11

Branch: `dev-integration`. Baseline: `59333b420011c04814328e767827bcf0330060f6`.
Final browser evidence uses **http://127.0.0.1:5174 only**, following the user's
explicit port constraint. Desktop-first review; no mobile optimization. This is
the original audit and proposed repair plan. All nine repairs are now implemented; see the repair verification section below.

## Assessment

The map, companion and destination card are visibly undersized at laptop heights.
The main cause is a hard compact breakpoint, compounded by loss of the previous
shared audit CSS. The visual direction remains coherent; preserve it and repair
the layout rules rather than redesigning the product.

`git diff b5f9932..59333b4 -- src/styles.css` shows the former 97-line audit-fix
block was removed and companion/compact styling substituted. This explains the
comparison, notebook, research and DNA regressions below. The functional React
changes largely remain. Restore relevant shared styles selectively: blindly
restoring the old map-height cap would perpetuate the sizing complaint.

## Prioritized findings

“After” means the proposed fix; none has been implemented in this run.

| ID / priority | Before | After | Why / concrete evidence |
| --- | --- | --- | --- |
| R01 / P1 | Desktop heights ≤900px cap map SVG height at 340px, regardless of available width. The map is letterboxed inside its wide SVG element. Above 900px the cap disappears entirely. | Replace the hard compact mode with continuous desktop sizing. Give the map a deliberate working area, reduce excessive header spacing, and allow ordinary scrolling to preserve usable geography. Tune map and sidebar together. | At 1440×900 the SVG is 964×340 but painted bounds are only about 595×258. At 1440×901 painted width jumps to 949px and SVG height to 542px. At 1920×1080 the SVG bottom reaches y=1160. A one-pixel viewport change must not radically change the experience. `src/styles.css:416–440,2363–2367`; `src/components/AccessMap.tsx:65–66`. |
| R02 / P2 | Companion image is forced to 100×56px on laptop-height desktops, inside a 285px-wide button. The character itself occupies only about 40×52px. | Size the visible character deliberately, not its transparent frame. Keep the 52-frame alignment and use a stable frame viewport/crop consistently across frames; target a visible character around 80–110px wide as a starting design proposal. | Base image width is 180px, abruptly reduced to 100px. Frame 1 is 512×288; alpha >128 bounding box is x149–356, y18–283: about 40% of frame width. Thus a 100px image paints a 40px character. All-frame alignment must be checked before cropping. `src/styles.css:2344–2358,2371`; `public/bot-frames/ezgif-frame-001.webp`. |
| R03 / P2 | Destination panel is squeezed to a 285px column, with 125px artwork, 22px title and 10px provenance at ≤900px height. | Give the selected-destination panel a readable desktop width (start around 320–360px), retain useful artwork and clear information hierarchy, and keep provenance at least 12px. Check long destination names and provider conditions. | At 1366×768 the rotated card spans about 292×388px and ends at y774. Requirements action ends at y760, leaving almost no breathing room. At 1440×901 the same card grows by about 68px in height. `src/styles.css:416–420,2372–2377`; `src/App.tsx:260–306`. |
| R04 / P2 | Legend and provenance use 10px type; keyboard guidance is compressed to 11px. Map/List is absolutely positioned in the same top region and legend alignment relies on 125px compensating padding. | Use readable 12–14px interpretation text and a real controls/legend layout with explicit rows or columns. Avoid positional padding that depends on the toggle width. | At 1440×900 both legend and toggle start at y352; legend height is 14px, toggle height 44px. No text collision was established at this viewport, but the positioning is brittle and supporting text is visibly small. `src/styles.css:425–429,462–494,2368–2369`. |
| R05 / P2 | Comparison uses the new semantic table without its styling. It collapses to content width, packs category and Inspect together, and loses row separation. | Restore full-width table layout, cell padding, row borders, wrapping and distinct inspect actions, preserving search and both passport categories. | IN/DE filtered to Japan: table width 327px inside a 940px result panel; cell padding 0px, border-bottom 0px, inspect anchor inline. Screenshot confirms “eVisaInspect” adjacency. `.comparison-table*` styles are absent. `src/App.tsx:686–700`; removed styles in the baseline diff. |
| R06 / P2 | Notebook artwork again consumes roughly 44% of the card. Provider action links are inline-block and not underlined, so values and actions run together. | Restore narrower supporting artwork, two readable information columns, explicit block action rows and visible link styling. Keep unknown document/fee fields honest. | At 1440×900 notebook columns are 708px/567px. Both cached IN→JP rule actions compute `display:inline-block`, `text-decoration:none`; the prior `.rule-action` block treatment is gone. `src/styles.css:739–746,2325`; `src/components/TravelBrief.tsx:8`; `src/App.tsx:433–471`. |
| R07 / P2 | Six DNA counts use legacy flex styling intended for three `<b>/<span>` stats. Current `<dd>/<dt>` numbers render at ordinary 16px and category labels wrap awkwardly. | Restore a six-category grid with explicit count/label typography and enough horizontal space. Preserve all six counts, vector weights, category colors and accessible summary. | All six count elements compute 16px; `.dna-stats` computes flex. Screenshot shows narrow wrapped labels beside a large flower. Existing CSS targets `.dna-stats b` and `span`, while JSX uses `dd` and `dt`. `src/styles.css:1063–1078`; `src/App.tsx:742–750`. |
| R08 / P1 | Unbroken research URLs grow the notebook grid beyond its visible container, which clips the source list and neighboring information. | Restore `minmax(0,…)` columns, `min-width:0`, `overflow-wrap:anywhere` on answer/URL text, and a clearly separated lead list. Keep answers escaped and links validated/unverified. | Synthetic HTTPS lead with a 240-character path: notebook client width 1275px, scroll width 1899px, research width 1641px, URL width 1632px. Notebook has overflow:hidden, so content is cut off even though the document itself reports no overflow. `src/styles.css:739–746,815–823`; `src/components/ResearchAnswer.tsx:5–12`. |
| R09 / P2 | Every destination change starts two sprite loops, including keyboard selection. Keyboard activation of the companion itself also starts the full animation. Hover scale is ungated. | Keep repeated keyboard destination selection static. If decorative playback remains, limit it to an explicit pointer action and make it interruptible; gate hover movement to fine pointers and respect reduced motion. Retain cleanup and static reduced-motion behavior. | 104 steps ×32ms = about 3.33 seconds per playback. With no reduced-motion preference, browser observer saw 32 source changes after keyboard map selection and 22 after keyboard companion activation in short sampling windows. Reduced-motion sample had zero source changes. Counts include React attribute writes, not measured frame rate. `src/components/BotExplorer.tsx:49–107,110`; `src/styles.css:2355–2359`. |

## Suggested repair order and desktop acceptance

1. Restore shared table/notebook/research/DNA styles lost in integration. Fix clipped
   research content first. Preserve the new Trips styles and companion assets.
2. Rebalance Explore as one layout: map, companion and selected-destination card.
   Do not shrink each independently merely to put everything above the fold.
3. Replace the 900px height cliff. Compare 1440×899, ×900 and ×901: map/character
   size should vary smoothly; no sudden doubling of the character or map area.
4. Check 1366×768, 1440×900 and 1920×1080 with IN/JP and long country names.
   The map should use most of its allocated area, the character should read as an
   intentional companion, and the panel should be useful without tiny text.
5. Re-run keyboard, reduced-motion, comparison inspection, reload/history,
   empty search and long research URL checks. Visually inspect screenshots;
   typechecking alone cannot catch these regressions.

## Motion verdict

**Feel-breaking:** keyboard map selection initiates repeated 3.33-second decorative
sprite playback. **Missed simplification:** destination changes need no companion
replay; the static character retains its personality. **Accessibility:** reduced
motion and unmount cleanup work, but hover movement is not pointer-gated.
**Decision: Block motion approval** until keyboard-triggered replay is removed or
input-modality gated. No dropped-frame or GPU-performance claim is made; frame
profiling was not performed.

## Coverage, retained behavior and limitations

Final evidence was collected on port 5174 at the baseline above. Earlier exploration
used an extra audit-owned port before the user's correction; that server was stopped,
and all report measurements/screenshots were reproduced on 5174. No alternate
branch, checkout, commit, push or implementation change was made.

Explore was measured at 1366×768, 1440×900, 1440×901 and 1920×1080. Compare,
Country Notebook, DNA and More were inspected at 1440×900, including cached IN→JP
and long VC names during the source/visual review. Trips entry/error state was
inspected under a deliberately unavailable service fixture. Its create action was
disabled because session creation was stubbed; that is not reported as a defect.
The authenticated Trips editing/export journey was not re-audited in this run.

Retained checks: one Tab stop per interactive map/globe, zero empty globe targets,
working picker Enter focus restoration, List bounded to 390px with scrolling,
empty-search recovery, static map markers and honest unknown/provider labels.
No claim is made that all earlier fixes regressed: the styling loss is selective.
Tailwind still supplies the `sr-only` utility despite deletion of the custom rule.

All browser API writes were intercepted; research used a synthetic successful
fixture and other write requests returned 503. Cached GET data was allowed. No
live provider calls, real traveller data entry or persistent trip writes were made.
Expected fixture console errors do not establish production API failures.

Typecheck passed. Full tests/build were not rerun for this read-only layout audit;
the previous run's 81-test result is historical, not a fresh verification claim.
Formal screen-reader/actual browser zoom, exhaustive contrast, frame profiling and
mobile optimization were not performed. Local screenshots are ignored under
`output/playwright/frontend-audit/re-audit-5174-*`.

At the end of the original audit, fixes were proposed only. This report and the integration audit
state/run records are local and uncommitted; no push performed.

## Repair verification — 2026-10-11

All nine findings are fixed on `dev-integration`. The findings above describe the
original audit baseline; this section records the subsequent implementation.
Browser inspection used only http://127.0.0.1:5174. No alternate checkout/server
was created. Desktop-first sizing preserves normal vertical scrolling.

| ID | Before | After | Why / verification |
| --- | --- | --- | --- |
| R01 | 340px height cap and 900/901px cliff | Width-driven map, maximum 1120px SVG width, no desktop height cap | At 1440px width SVG height is 508.05px at 899, 900 and 901px heights. Painted width 889px versus 595px before. At 1920px painted width 1102px; SVG bottom 1065px. |
| R02 | About 40px visible character at laptop heights | Stable 160×144px viewport, aligned 256×144px frames | Inspected all 52 alpha bounds: union x129–426/y2–285 on 512×288 canvas. First character paints about 104×133px; entire union fits. No raster assets changed. |
| R03 | 285px panel, 125px artwork, tiny provenance | Continuous 320–360px desktop column, natural artwork, 28px title, 12px provenance | Actual panel widths 328/346/360px at 1366/1440/1920. Long Saint Vincent title wraps without horizontal overflow. |
| R04 | Absolute toggle and 10–11px supporting text | Toggle, legend and captions in ordinary flow; 12px guidance | Screenshot and computed layout confirm separate control rows and readable legend. |
| R05 | Content-width unstyled table and adjacent action text | Full-width fixed-layout table, cell padding, borders and separated Inspect links | Japan table 938px in 938px wrapper; 14×18px cell padding, 1px header border. Second-passport inspection/reload preserves Germany. Last row deliberately omits its bottom border. |
| R06 | Artwork consumed 44%; inline unmarked actions | Supporting column about 31%; block, underlined actions | Notebook columns 879/396px. Both cached Japan actions compute block/underline; unknown fields remain explicit. |
| R07 | Flex row and ordinary 16px counts | Three-column/six-category grid, 26px counts and 12px labels | All six counts present: 27,25,59,88,0,0 for IN; weights and data unchanged. |
| R08 | Notebook scroll width 1899px inside 1275px card | Shrinkable columns, wrapped escaped prose/URLs, separated lead list | Same synthetic 240-character URL: notebook client/scroll width both 1275px. Source URL wraps; script-like text stays escaped and does not execute. |
| R09 | Destination and keyboard actions replayed two loops | Destination changes cancel/reset; decorative pointer-only playback; gated hover | Keyboard source writes 0, explicit pointer sample 4, reduced-motion writes 0. Destination interruption passed. Decorative companion is hidden from assistive technology and adds no nonfunctional keyboard control. |

Motion verdict after repair: **Approve for the reviewed behavior**. No decorative
replay accompanies keyboard/navigation actions. Pointer animation is optional,
interruptible and reduced-motion-aware. Hover scale is gated to fine pointers,
hover capability and no reduced-motion preference. No frame-rate/GPU claim.

Typecheck, production build and 81/81 tests passed. Existing non-fatal Vite native
loader/chunk-size advisories remain. Desktop screenshots captured at 1366×768,
1440×899/900/901 and 1920×1080; Explore, comparison, notebook/research, DNA and long
panel captures were inspected. One Tab stop per map/globe, no empty globe paths,
empty-search recovery and Trips entry under unavailable-service fixture passed.
All test browser API writes were intercepted; research success was synthetic.
Interception was removed afterward. No real provider calls were intentionally
made. Authenticated Trips editing/export, formal screen-reader/zoom, exhaustive
contrast and mobile optimization were not performed in this repair run.

Ignored evidence: `output/playwright/frontend-audit/fixed-reaudit-5174-*`.
At the end of the repair run, implementation, reports and state/run records were local and uncommitted. Subsequent commit grouping is recorded in the integration state/run history.
