# Product definition

## Purpose and authority

aperiron: The Passport Paradox helps people explore how nationality shapes
international mobility, inspect passport-specific entry requirements, and
experiment with fictional policy changes. The Border Market game is one
experience within the platform, not the definition of the whole product.

This document captures the user's agreed direction as of 2026-10-10. It describes
requirements, not delivered functionality. Consult the [developer state map](state/README.md)
and actual source for implementation progress. Significant changes to this
direction belong in a [decision record](decisions/README.md).

The accepted [Travel Buddy integration direction](decisions/0008-travel-buddy-destination-enrichment.md)
keeps the full local map, comparison and Visa DNA, while adding cached selected
destination details, application links and arrival formalities. Implementation
is available through the local API; complete document checklists are not supplied
by the tested API. Selected precise provider rules can update exploration cells;
comparison, scores and Visa DNA remain explicitly based on the bundled snapshot.

## Users and outcomes

| User intent | Successful outcome |
| --- | --- |
| Understand my passport's reach | Select a passport and see modeled destination access on a map. |
| Understand a destination's rules | Click a country and immediately see the requirements relevant to the selected passport. |
| Compare nationality-based differences | Keep the destination or map view fixed and switch or compare passports. |
| Understand a passport's pattern | Inspect Visa DNA generated from the same mobility data as the map. |
| Explore policy consequences | Apply a fictional agreement and inspect consistent before-and-after effects. |
| Play a strategy challenge | Spend a limited credit budget and evaluate the resulting mobility improvement. |

Exploration must work without entering a game or buying a treaty. Reading basic
regulations must not depend on an LLM response.

## Primary journeys

### Explore and inspect

1. Select a supported passport. Keep the current selection visible.
2. Color supported destinations by their entry classification. Distinguish unknown
   data and unsupported destinations from known restrictions.
3. Click a country. Open a panel titled with both passport and destination.
4. Show the available structured information immediately from the loaded dataset.
   If additional detail must load, retain the classification and show loading state.
5. Change the passport while the panel remains open. Update all relevant details;
   discard or ignore responses for the old selection.

The panel should support visa classification, travel-purpose applicability, stay
conditions, required documents, application channel, fees, processing time, official
sources, and last verification date. Display unavailable fields honestly. These are
desired fields, not a promise that every passport-destination record is complete.

Purpose, duration, residency, and existing visas can change which rule applies.
Show the assumptions used. Request additional details only where the data supports
conditional rules; never pretend the baseline covers every traveller.

### Compare passports

Select two passports and show shared access, access unique to each, differences in
entry category, and modeled scores. A score describes the supported dataset, not
an official global ranking. Category differences remain visible even if two
categories are both considered accessible for simulation scoring.

### Inspect Visa DNA

Generate a reproducible numeric representation from passport access data. Render
it as a distinctive pattern and explain the relationship between permissions and
appearance. The same input must produce the same output. A treaty that changes the
encoded access vector changes the fingerprint. Cosmetic animation must not alter
the underlying values or imply biological meaning.

Similarity calculations are a possible extension. Do not claim perceptual or
mathematical similarity unless a documented metric is implemented and verified.

### Simulate and play

The simulation applies fictional treaty effects to a separate baseline. All
simulation views recalculate from the resulting world state. Users can inspect
impact and reset to baseline. The country panel must keep sourced real-world
requirements distinguishable from simulated changes.

The Border Market adds a starting budget of 100 Influence Credits, treaty costs,
purchase validation, and measurable objectives. Credits have no monetary value.
Duplicate purchases and insufficient funds produce actionable errors without
changing state. Reset is required; individual undo can follow if its interaction
and credit behavior are defined.

### Optimize

Recommend affordable, unpurchased treaties using the same impact calculations as
manual purchases. Display cost, objective, projected impact, and algorithm limits.
Recommendations do not apply themselves. A greedy recommendation must not be
called a guaranteed global optimum. A player may compare their results with it.

## Scope and sequence

| Priority | Deliverable | Completion evidence |
| --- | --- | --- |
| Foundation | Shared contracts and dataset assumptions | Engine and mock consume the same types and fixtures. |
| Core | Passport map and country regulations panel | Country selection and passport switching show matching records. |
| Core | Visa DNA | Deterministic values derive from modeled permissions. |
| Core | Treaty simulation and Border Market | Purchase updates credits, permissions, DNA, and impact consistently. |
| Important | Passport comparison | Displayed sets and scores match the engine. |
| Important | Treaty optimizer | Recommendations respect budget and already-purchased treaties. |
| Optional | Passport Lottery | Scenario assumptions and supported outcomes are explicit. |
| Optional | Detailed routes and transit | Requires a separately defined journey model and route data. |
| Optional | 3D globe | Added after core interactions are reliable. |
| Proposed | Verified regulation explanations | Reviewed source coverage and semantic claim evaluation are still needed. |
| Accepted backend milestone | Map/country assistant and local group planning | [Decision 0009](decisions/0009-backend-map-assistant.md); services implemented, frontend deferred. |
| Last | Public deployment | Local build and demo work first. |

The original prototype target is about 12 passports, 30 destinations, and 15-20
fictional treaties. Treat this as a scope target, not current coverage. Prefer a
smaller honest dataset to unsupported worldwide claims. On 2026-10-11 the user
authorized exposing the existing full Passport Index snapshot through the active
application. This expands classification coverage without accepting unverified
detailed regulation claims.

The user has authorized optional local Groq Browser Search in the Country Notebook
([decision 0007](decisions/0007-local-groq-research.md)). It returns unreviewed
research for the selected passport, country and purpose. Verified AI explanations
still require reviewed evidence. The user additionally authorized the backend-only
map/country assistant and group planner; see [backend handoff](ASSISTANT_BACKEND.md).
This preserves the map-first UI and unreviewed research status.

## Interaction requirements

- Use a visible legend with text labels, not color alone.
- Offer a searchable destination list as an alternative to precise map interaction.
- Keep selected passport, selected destination, and real/simulation context clear.
- Provide keyboard access, visible focus, readable contrast, and reduced-motion support.
- Preserve useful information during loading and surface recoverable errors.
- Cache bundled data locally; the core demonstration should work after assets load.
- If AI is later added, an outage must not disable exploration or simulation.

## Product boundaries

The platform does not issue visas, process payments, or guarantee admission. The
initial access model is not a flight planner: direct destination permission cannot
establish transit feasibility, seat availability, or total trip cost. Those claims
require their own data and validation.

See [architecture](ARCHITECTURE.md), [contracts](CONTRACTS.md), and
[data policy](DATA_POLICY.md) before implementing these journeys.

## Temporary game pause

The user deferred the Border Market game on 2026-10-10 to focus on passport
exploration, country information, comparison and Visa DNA. Keep the game code
available for later, but hide its navigation, routes, simulation switches, treaty
prompts and impact comparisons. Active experiences use baseline data. This does
not promote the prototype matrix into verified travel guidance.
