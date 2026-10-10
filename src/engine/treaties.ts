/**
 * aperiron: The Passport Paradox
 * Engine: Treaty Simulation & Purchases
 *
 * Implements immutable state transitions for Border Market treaty purchases
 * and computes authoritative before/after mobility impact deltas.
 *
 * Invariants:
 * - State is strictly immutable: input objects are never mutated.
 * - Rejects purchases with insufficient funds or duplicate treaties.
 * - Authoritative impact calculations drive animations and dashboards.
 *
 * @see docs/CONTRACTS.md
 * @see docs/ARCHITECTURE.md (State model)
 */

import {
  AccessiblePairTransition,
  Catalog,
  failure,
  isAccessible,
  PurchaseResult,
  Result,
  SimulationImpact,
  success,
  TreatyId,
  WorldState
} from '../shared/contracts';
import { getDestinationAccessList } from './access';
import { calculateGlobalMobilityScore } from './scoring';

export function calculateImpact(
  beforeState: WorldState,
  afterState: WorldState,
  catalog: Catalog,
  customMatrix?: Record<CountryId, Record<CountryId, AccessLevel>>
): Result<SimulationImpact> {
  const beforeGlobalScore = calculateGlobalMobilityScore(catalog, beforeState, customMatrix);
  const afterGlobalScore = calculateGlobalMobilityScore(catalog, afterState, customMatrix);
  const scoreDelta = Math.round((afterGlobalScore - beforeGlobalScore) * 10) / 10;

  const newlyAccessiblePairs: AccessiblePairTransition[] = [];

  for (const passport of catalog.passports) {
    const beforeDests = getDestinationAccessList(passport.id, beforeState, catalog, customMatrix);
    const afterDests = getDestinationAccessList(passport.id, afterState, catalog, customMatrix);

    for (const dest of catalog.destinations) {
      const levelBefore = beforeDests.find((d) => d.destinationId === dest.id)?.accessLevel ?? 'unknown';
      const levelAfter = afterDests.find((d) => d.destinationId === dest.id)?.accessLevel ?? 'unknown';

      if (!isAccessible(levelBefore) && isAccessible(levelAfter)) {
        newlyAccessiblePairs.push({
          passportId: passport.id,
          destinationId: dest.id,
          previousLevel: levelBefore,
          newLevel: levelAfter
        });
      }
    }
  }

  return success({
    beforeGlobalScore,
    afterGlobalScore,
    scoreDelta,
    newlyAccessiblePairs
  });
}

export function purchaseTreaty(
  state: WorldState,
  treatyId: TreatyId,
  catalog: Catalog,
  customMatrix?: Record<CountryId, Record<CountryId, AccessLevel>>
): Result<PurchaseResult> {
  const treaty = catalog.treaties.find((t) => t.id === treatyId);
  if (!treaty) {
    return failure('INVALID_TREATY', `Treaty '${treatyId}' does not exist in the catalog.`);
  }

  if (state.purchasedTreatyIds.includes(treatyId)) {
    return failure(
      'ALREADY_PURCHASED',
      `Treaty '${treaty.name}' (${treatyId}) has already been purchased.`
    );
  }

  if (state.creditsRemaining < treaty.cost) {
    return failure(
      'INSUFFICIENT_CREDITS',
      `Insufficient credits. Treaty '${treaty.name}' requires ${treaty.cost} credits, but only ${state.creditsRemaining} available.`
    );
  }

  // Create next immutable state
  const nextState: WorldState = {
    creditsRemaining: state.creditsRemaining - treaty.cost,
    purchasedTreatyIds: [...state.purchasedTreatyIds, treatyId]
  };

  const impactResult = calculateImpact(state, nextState, catalog, customMatrix);
  if (!impactResult.success) {
    return impactResult;
  }

  return success({
    nextState,
    impact: impactResult.data,
    purchasedTreaty: treaty
  });
}
