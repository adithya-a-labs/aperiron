# Shared contract specification

## Status and source of truth

The pasted project context supplies a draft TypeScript API. There are currently no
implementation files for it. This document preserves the agreed direction and
identifies decisions needed before freezing the first executable contract.

Once created, `src/shared/contracts.ts` and `src/shared/engineApi.ts` are the
authoritative executable definitions. This document explains their semantics and
compatibility rules; do not maintain a second copied set of complete type bodies.
Any implementation that differs from the docs is drift to investigate, not
automatic proof that either side expresses the intended behavior.

## Core vocabulary

| Term | Meaning |
| --- | --- |
| CountryId | Uppercase ISO alpha-2 identifier used consistently by data and UI. |
| TreatyId | Stable identifier for a fictional treaty in the loaded catalog. |
| AccessLevel | `visa_free`, `visa_on_arrival`, `evisa`, `visa_required`, `restricted`, or `unknown`. |
| Catalog | Supported passports, destinations, treaty summaries, and dataset label. |
| WorldState | `creditsRemaining` and `purchasedTreatyIds`; not UI selection state. |
| Result | Discriminated success with `data`, or failure with typed `code` and `message`. |
| Accessible | For v1 simulation, visa-free, visa on arrival, or eVisa. This is a modeling definition. |

Baseline and treaty data must use the same destination ordering. Missing baseline
permissions produce `unknown`, never inferred access. A restricted destination
and a destination without data are different states even if a score weights both
at zero.

## Original seven methods

| Method | Inputs | Output and invariants |
| --- | --- | --- |
| `getCatalog()` | None | Stable catalog suitable for selectors and market cards. Callers must not be able to corrupt internal data by mutating a returned object. |
| `getPassportView()` | Passport ID, state | Result with all supported destination classifications in catalog order and normalized mobility score. |
| `comparePassports()` | Two passport IDs, state | Result with shared accessible IDs, only-A IDs, only-B IDs, and both scores from the same scoring function. |
| `generateVisaDNA()` | Passport ID, state | Result with passport ID and a fixed-length numeric vector in the documented range. Same effective permissions produce the same vector. |
| `purchaseTreaty()` | State, treaty ID | Result with a new state and impact, or typed failure. Never mutates input, including on failure. |
| `calculateImpact()` | Before state, after state | Global before/after score, delta, and newly accessible passport-destination pairs. Uses one frozen dataset. |
| `optimizeTreaties()` | State, budget | Result with recommended IDs, cost, and projected impact. Does not purchase anything. |

The draft typed errors are `INVALID_PASSPORT`, `INVALID_TREATY`,
`INSUFFICIENT_CREDITS`, `ALREADY_PURCHASED`, and `INVALID_BUDGET`.
Validation failures should use stable codes; message wording may improve without
breaking consumers. Never branch UI logic on an English error message.

## Country regulation extension

The user explicitly requires passport-specific regulation details on country
click. The original interface is insufficient for this feature. Add a coordinated
lookup interface; the following shape is proposed rather than frozen:

```text
getDestinationRequirements({ passportId, destinationId, travellerContext })
  -> Result<DestinationRequirements>
```

Define a structured result with the resolved passport/destination, applicable
purpose and stay assumptions, entry category, documents, application information,
stay conditions, fees, processing-time guidance, source references, and verification
metadata. Include unresolved conditions instead of forcing a definitive answer.
See [DATA_POLICY.md](DATA_POLICY.md) for field semantics.

Prefer a separate baseline-regulations service or interface over making historical
source records depend on purchased treaties. If a composite panel includes a
simulation overlay, label and return that overlay separately.

Resolve these before wiring the UI: supported traveller-context fields; not-found
versus unknown versus conditional outcomes; `INVALID_DESTINATION` and other new
error codes; synchronous bundled lookup versus asynchronous detail loading; and
which information is available for each dataset record. Updating return types and
mock fixtures is part of the same contract change.

## Semantics to freeze before engine implementation

### Scoring

The initial direction requires scores in 0-100 and global impact across supported
passport-destination pairs. Exact weights and denominator policy remain open.
An initial candidate is weighted access, with visa-free = 1, visa on arrival = 0.8,
eVisa = 0.6, and other categories = 0. This candidate is not an accepted formula.

Whatever formula is chosen, record weights, eligible pairs, self-destination
handling, unknown-data handling, aggregation, and rounding. Unknown must never
silently receive visa-free credit. If unknown counts in the denominator, disclose
the coverage penalty; if excluded, disclose coverage and avoid inflated comparisons.
Compute with full precision and round for display consistently.

`newlyAccessiblePairs` counts a transition from inaccessible/unknown to one of the
three accessible categories exactly once per pair. An eVisa-to-visa-free upgrade
may improve a weighted score without adding a newly accessible pair. Do not call
these pairs flight routes or journeys with validated transit.

### Treaty precedence and state validity

Treaties can overlap. Decide explicitly whether v1 permits only improvements or
also restrictions. For improvement-only treaties, selecting the most permissive
applicable category under a documented total order is a simple candidate. Do not
resolve overlaps by accidental purchase-array order. If restrictions are allowed,
define their priority and test both purchase orders.

The draft does not define malformed-state behavior. Resolve negative/non-finite
credits, duplicate/unknown purchased IDs, and impossible saved states before
persistence or external inputs. Options include a separate validated state factory
or additional typed errors. Do not silently mutate or repair caller state.

### DNA

Choose and version the destination ordering, category encoding, vector length,
and handling of self/unknown destinations. Determinism must not depend on random
numbers, current time, object iteration order, or remaining credits. The same
effective access pattern should not change because purchase order changes.

### Optimizer

Specify the objective, integer/fractional budget rules, finite nonnegative input
validation, tie-breaking, and stopping rule. Its spend must not exceed either the
requested budget or remaining credits. Recompute marginal benefit as treaties
overlap; exclude purchased treaties and avoid duplicate recommendations. Document
how zero-cost or zero-benefit candidates are handled to prevent division by zero
or a non-terminating greedy loop.

## Shared fixtures and compatibility

Create a small synthetic dataset with at least one unknown permission, two
overlapping treaties, an affordable purchase, and an unaffordable purchase. Record
expected permissions, credits, score deltas, and DNA values after the semantics
are agreed. Use the same contract checks for mock and real engines.

A mock may simplify implementation, not contradict the fixtures. Mark unsupported
mock capabilities explicitly rather than returning plausible-looking random data.

When changing the contract:

1. Identify affected engine functions, callers, mock behavior, tests, and data.
2. Describe the proposal and migration in the run log or decision record.
3. Coordinate with the other developer when it affects their work; do not silently
   freeze breaking changes on their behalf.
4. Update types, implementations, consumers, fixtures, and semantics together.
5. Run type and contract checks and record actual results.

No HTTP endpoint is required for the initial engine. The optional AI service has
a separate network contract if adopted.
