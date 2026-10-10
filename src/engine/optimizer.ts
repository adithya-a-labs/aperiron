/**
 * aperiron: The Passport Paradox
 * Engine: Treaty Optimizer
 *
 * Implements a greedy impact-per-credit recommendation heuristic that
 * identifies optimal unpurchased treaties within a credit budget.
 *
 * Invariants:
 * - Pure function: does NOT purchase treaties or mutate active WorldState.
 * - Total cost will never exceed the requested budget or remaining credits.
 * - Recomputes marginal mobility gain at each iteration to account for treaty overlaps.
 * - Handles zero-benefit / zero-cost candidates safely without infinite loops.
 *
 * @see docs/CONTRACTS.md (Semantics to freeze: Optimizer)
 * @see docs/PRODUCT.md (Optimize)
 */

import {
  Catalog,
  failure,
  OptimizationResult,
  Result,
  success,
  Treaty,
  TreatyId,
  WorldState
} from '../shared/contracts';
import { calculateImpact } from './treaties';

export function optimizeTreaties(
  state: WorldState,
  budget: number,
  catalog: Catalog,
  customMatrix?: Record<CountryId, Record<CountryId, AccessLevel>>
): Result<OptimizationResult> {
  if (!Number.isFinite(budget) || budget <= 0) {
    return failure('INVALID_BUDGET', 'Requested budget must be a finite, positive number of credits.');
  }

  const effectiveBudget = Math.min(Math.floor(budget), state.creditsRemaining);
  if (effectiveBudget <= 0) {
    return success({
      recommendedTreatyIds: [],
      totalCost: 0,
      budgetRequested: budget,
      projectedImpact: {
        beforeGlobalScore: 0,
        afterGlobalScore: 0,
        scoreDelta: 0,
        newlyAccessiblePairs: []
      },
      rationale: 'No credits available in active state or budget too low.'
    });
  }

  let remainingBudget = effectiveBudget;
  let hypotheticalState: WorldState = {
    creditsRemaining: state.creditsRemaining,
    purchasedTreatyIds: [...state.purchasedTreatyIds]
  };

  const recommendedIds: TreatyId[] = [];
  const consideredTreatyIds = new Set<TreatyId>(state.purchasedTreatyIds);

  // Iterative greedy selection
  while (true) {
    const affordableCandidates = catalog.treaties.filter(
      (t) => !consideredTreatyIds.has(t.id) && t.cost <= remainingBudget
    );

    if (affordableCandidates.length === 0) {
      break;
    }

    // Evaluate marginal score gain for each candidate given hypothetical current state
    let bestCandidate: Treaty | null = null;
    let bestEfficiency = -1;
    let bestDelta = 0;

    for (const treaty of affordableCandidates) {
      const trialState: WorldState = {
        creditsRemaining: hypotheticalState.creditsRemaining - treaty.cost,
        purchasedTreatyIds: [...hypotheticalState.purchasedTreatyIds, treaty.id]
      };

      const impact = calculateImpact(hypotheticalState, trialState, catalog, customMatrix);
      const delta = impact.success ? impact.data.scoreDelta : 0;
      const efficiency = treaty.cost > 0 ? delta / treaty.cost : 0;

      // Prefer higher efficiency; tie-break on lower cost, then earlier catalog order
      if (
        efficiency > bestEfficiency ||
        (Math.abs(efficiency - bestEfficiency) < 1e-6 && delta > bestDelta)
      ) {
        bestCandidate = treaty;
        bestEfficiency = efficiency;
        bestDelta = delta;
      }
    }

    // Stop if no candidate adds positive mobility value or none found
    if (!bestCandidate || bestDelta <= 0) {
      // If we have budget remaining but all treaties provide 0 marginal gain (e.g. redundant overlaps),
      // we gracefully stop rather than recommending redundant treaties.
      break;
    }

    // Accept best candidate
    recommendedIds.push(bestCandidate.id);
    consideredTreatyIds.add(bestCandidate.id);
    remainingBudget -= bestCandidate.cost;

    hypotheticalState = {
      creditsRemaining: hypotheticalState.creditsRemaining - bestCandidate.cost,
      purchasedTreatyIds: [...hypotheticalState.purchasedTreatyIds, bestCandidate.id]
    };
  }

  const finalImpact = calculateImpact(state, hypotheticalState, catalog, customMatrix);
  const totalCost = effectiveBudget - remainingBudget;

  const rationale =
    recommendedIds.length > 0
      ? `Greedy selection of ${recommendedIds.length} treaties providing +${finalImpact.success ? finalImpact.data.scoreDelta : 0} global mobility score for ${totalCost} credits.`
      : 'No treaties found within the specified budget that produce a net mobility improvement.';

  return success({
    recommendedTreatyIds: recommendedIds,
    totalCost,
    budgetRequested: budget,
    projectedImpact: finalImpact.success
      ? finalImpact.data
      : { beforeGlobalScore: 0, afterGlobalScore: 0, scoreDelta: 0, newlyAccessiblePairs: [] },
    rationale
  });
}
