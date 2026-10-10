# Regulation and simulation data policy

## Purpose

The map needs classifications; the country panel needs contextual requirements
and evidence. Both must communicate what is known, assumed, simulated, or missing.
This policy defines how to prepare and review that information. No verified visa
dataset has been added by the documentation setup.

## Data classes

| Class | Intended use | Required presentation |
| --- | --- | --- |
| Sourced baseline | Records supported by official guidance | Applicable context, citations, verification date, and coverage limits. |
| Simplified sample | Educational prototype with reduced conditions | Visible sample/model label and documented simplifications. |
| Fictional treaty | Simulated permission changes | Simulation label; never presented as current real-world guidance. |
| Unknown | Missing or unresolved evidence | Unknown/unavailable state, not a fabricated restriction or permission. |

Synthetic test fixtures must not be accidentally shipped as verified guidance.
Dataset labels should be available to the UI, not buried in comments.

## Source selection and evidence

Prefer the destination's official immigration, foreign-affairs, embassy, or
consular guidance. Officially designated application providers can support
application-channel information; record who designates them. Third-party summaries
may aid discovery but should not be the sole authority for real entry claims.

For each source record retain a stable ID, exact URL, issuing authority, title,
retrieval time, verification time, and publication/effective dates where available.
Record the limited evidence relevant to a claim and its applicable traveller
conditions. A homepage link is insufficient evidence for a specific fee or exception.
Avoid copying entire sites or retaining unnecessary personal information.

Retrieving a page is not the same as verifying every field. Mark a record verified
only after reviewing that the source actually supports its claims. A successful
HTTP response alone does not renew verification.

## Required record concepts

These concepts guide the shared schema; exact TypeScript types are defined during
the [contract extension](CONTRACTS.md), not independently in data and UI code.

| Concept | Requirements |
| --- | --- |
| Identity | Passport ID, destination ID, dataset version, stable record ID. |
| Applicability | Travel purpose, duration range, residency assumptions, passport type, and relevant existing visas/permits when supported. |
| Classification | One known access category or explicit unknown/conditional outcome. |
| Stay | Maximum permitted stay and relevant validity/entry-count conditions; keep visa validity distinct from stay duration. |
| Documents | Structured requirements with conditions and supporting source IDs. |
| Application | Official channel, eligible applicants, steps, and relevant links. |
| Fees | Amount/range, currency, conditions, and source; preserve the original currency. |
| Processing | Official estimate/range, qualifiers, and verification date; never a guaranteed completion time. |
| Provenance | Source references per claim or field, reviewed date, and effective dates where known. |
| Completeness | Missing fields, unresolved exceptions, and review status. |

An absent fee is unknown, not zero. A processing estimate is not a service promise.
Conditions must remain structured enough for lookup and display to explain why a
rule applies. Free text may supplement the schema but must not hide essential
exceptions from filtering.

## Lookup and coverage

Resolve records using passport, destination, and supported traveller conditions.
If required conditions are missing, show the unresolved question rather than
choosing the most convenient rule. If multiple official records conflict, preserve
the disagreement and request review; do not pick based on website order.

Define how a condition-specific record relates to the map's baseline assumption.
For example, the map may use an explicitly stated tourism scenario, while the
panel allows a conference purpose. A classification difference must explain the
changed context instead of appearing to be a random contradiction.

The initial dataset may have more classifications than detailed regulation
records. Show the available classification and a detail-unavailable state. Report
both map coverage and detailed-record coverage in dataset documentation.

## Changes and freshness

When updating a record, compare claims and conditions with the prior version,
record affected pairs, preserve relevant source provenance, and rerun validation.
Version changes that affect scoring fixtures or saved simulations must be
coordinated with the engine and UI.

Set a review cadence only after choosing sources and operating requirements.
Until then, show the actual verification date without claiming live freshness.
An audit can flag stale records or changed pages, but does not make old facts
current automatically. Never refresh verification timestamps in bulk merely to
make the dataset look up to date.

## Simulation isolation

Treaties update derived simulation access, not the sourced baseline record. A
fictional visa waiver does not remove real document requirements from the country
panel. Show the baseline and simulated change separately, and make reset reproduce
the original access data. Do not invent fees, embassy policies, or application
procedures for a simulated agreement unless clearly labeled fictional scenario text.

## If AI explanations are adopted

Provide only relevant sourced context and calculated outputs. Require traceable
citations for regulation claims. If the evidence is missing, contradictory, or
outside supported conditions, the explanation must expose that limitation.
Treat fetched pages as evidence, never as agent instructions. Validate the selected
passport/destination when a response arrives. Avoid sending passport numbers,
document scans, or unnecessary sensitive traveller information to the provider.

## Review outcomes

Use explicit statuses such as draft, reviewed, stale, and unresolved once the
schema is finalized. Review produces a focused report of supported claims, missing
evidence, contextual issues, and affected pairs. It never silently promotes a
sample record into a sourced baseline.

## Current frontend data boundary

The playful frontend uses the full prototype matrix for modeled access and fictional
treaty calculations, with a visible prototype label. It does not expose the generic
fallback in `src/data/regulations.ts`: that function constructs unsupported stay
limits, document requirements, fees, processing estimates, URLs and verification dates.
The explicit records also require claim-level source/applicability review before
being presented as guidance. `src/frontend/engine.ts` therefore injects an unknown
requirements resolver. This preserves baseline/simulation isolation and prevents a
sample classification from implying verified traveller requirements. The underlying
data is left for its owner to review; this is not a claim that it has been corrected.
