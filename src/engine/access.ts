/**
 * aperiron: The Passport Paradox
 * Engine: Effective Access Resolution
 *
 * Resolves destination access permissions for any passport given the
 * active simulation world state. Handles treaty overlays and ensures
 * deterministic precedence when multiple treaties apply.
 *
 * @see docs/CONTRACTS.md
 * @see docs/ARCHITECTURE.md
 */

import { BASELINE_ACCESS_MATRIX } from '../data/baselineMatrix';
import {
  AccessLevel,
  Catalog,
  CountryId,
  DestinationAccess,
  Treaty,
  WorldState
} from '../shared/contracts';

/**
 * Total precedence ordering for AccessLevel.
 * Higher number means greater freedom of movement.
 */
const ACCESS_LEVEL_RANK: Record<AccessLevel, number> = {
  visa_free: 5,
  visa_on_arrival: 4,
  evisa: 3,
  visa_required: 2,
  restricted: 1,
  unknown: 0
};

export function isMorePermissive(a: AccessLevel, b: AccessLevel): boolean {
  return ACCESS_LEVEL_RANK[a] > ACCESS_LEVEL_RANK[b];
}

export interface EffectiveAccessResult {
  readonly accessLevel: AccessLevel;
  readonly maxStayDays: number | null;
  readonly isSimulated: boolean;
  readonly simulatedViaTreatyId?: string;
  readonly simulatedViaTreatyName?: string;
  readonly baselineLevel: AccessLevel;
}

/**
 * Resolves the baseline (non-simulated) access level for a passport-destination pair.
 */
export function getBaselineAccess(
  passportId: CountryId,
  destinationId: CountryId,
  customMatrix: Record<CountryId, Record<CountryId, AccessLevel>> = BASELINE_ACCESS_MATRIX
): AccessLevel {
  if (passportId === destinationId) {
    return 'visa_free';
  }
  return customMatrix[passportId]?.[destinationId] ?? 'unknown';
}

/**
 * Resolves the effective access level for a passport-destination pair
 * considering all active treaties in the current WorldState.
 */
export function resolveEffectiveAccess(
  passportId: CountryId,
  destinationId: CountryId,
  state: WorldState,
  catalog: Catalog,
  customMatrix: Record<CountryId, Record<CountryId, AccessLevel>> = BASELINE_ACCESS_MATRIX
): EffectiveAccessResult {
  const baseline = getBaselineAccess(passportId, destinationId, customMatrix);

  let effectiveLevel = baseline;
  let isSimulated = false;
  let appliedTreaty: Treaty | undefined;

  for (const treatyId of state.purchasedTreatyIds) {
    const treaty = catalog.treaties.find((t) => t.id === treatyId);
    if (!treaty) continue;

    for (const grant of treaty.grants) {
      const matchesPassport = grant.passportId === '*' || grant.passportId === passportId;
      const matchesDest = grant.destinationId === destinationId;

      if (matchesPassport && matchesDest) {
        if (isMorePermissive(grant.grantedAccessLevel, effectiveLevel)) {
          effectiveLevel = grant.grantedAccessLevel;
          isSimulated = true;
          appliedTreaty = treaty;
        }
      }
    }
  }

  const maxStay =
    effectiveLevel === 'visa_free'
      ? 90
      : effectiveLevel === 'visa_on_arrival'
      ? 30
      : effectiveLevel === 'evisa'
      ? 30
      : effectiveLevel === 'visa_required'
      ? 15
      : null;

  return {
    accessLevel: effectiveLevel,
    maxStayDays: maxStay,
    isSimulated,
    simulatedViaTreatyId: appliedTreaty?.id,
    simulatedViaTreatyName: appliedTreaty?.name,
    baselineLevel: baseline
  };
}

/**
 * Builds the full ordered destination access list for a passport.
 */
export function getDestinationAccessList(
  passportId: CountryId,
  state: WorldState,
  catalog: Catalog,
  customMatrix: Record<CountryId, Record<CountryId, AccessLevel>> = BASELINE_ACCESS_MATRIX
): readonly DestinationAccess[] {
  return catalog.destinations.map((dest) => {
    const resolved = resolveEffectiveAccess(passportId, dest.id, state, catalog, customMatrix);
    return {
      destinationId: dest.id,
      destinationName: dest.name,
      accessLevel: resolved.accessLevel,
      maxStayDays: resolved.maxStayDays,
      isSimulated: resolved.isSimulated,
      notes: resolved.isSimulated
        ? `Unlocked via ${resolved.simulatedViaTreatyName}`
        : undefined
    };
  });
}
