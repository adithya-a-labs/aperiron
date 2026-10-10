import type { AccessLevel } from '../shared/contracts';
/**
 * aperiron: The Passport Paradox
 * Engine: Passport Comparison
 *
 * Implements side-by-side mobility comparison, set operations,
 * and category-level contrasts between two passports.
 *
 * @see docs/CONTRACTS.md
 */

import {
  failure,
  isAccessible,
  success,
  type AccessDifference,
  type Catalog,
  type CountryId,
  type PassportComparison,
  type Result,
  type WorldState
} from '../shared/contracts';
import { getDestinationAccessList } from './access';
import { calculateMobilityScore } from './scoring';

export function comparePassports(
  passportA: CountryId,
  passportB: CountryId,
  state: WorldState,
  catalog: Catalog,
  customMatrix?: Record<CountryId, Record<CountryId, AccessLevel>>
): Result<PassportComparison> {
  const pA = catalog.passports.find((p) => p.id === passportA);
  if (!pA) {
    return failure('INVALID_PASSPORT', `Passport A '${passportA}' not found in catalog.`);
  }

  const pB = catalog.passports.find((p) => p.id === passportB);
  if (!pB) {
    return failure('INVALID_PASSPORT', `Passport B '${passportB}' not found in catalog.`);
  }

  const destsA = getDestinationAccessList(passportA, state, catalog, customMatrix);
  const destsB = getDestinationAccessList(passportB, state, catalog, customMatrix);

  const scoreA = calculateMobilityScore(destsA.map((d) => d.accessLevel));
  const scoreB = calculateMobilityScore(destsB.map((d) => d.accessLevel));

  const sharedAccessible: CountryId[] = [];
  const onlyA: CountryId[] = [];
  const onlyB: CountryId[] = [];
  const differences: AccessDifference[] = [];

  for (const dest of catalog.destinations) {
    const accessA = destsA.find((d) => d.destinationId === dest.id)?.accessLevel ?? 'unknown';
    const accessB = destsB.find((d) => d.destinationId === dest.id)?.accessLevel ?? 'unknown';

    const isAccA = isAccessible(accessA);
    const isAccB = isAccessible(accessB);

    if (isAccA && isAccB) {
      sharedAccessible.push(dest.id);
    } else if (isAccA && !isAccB) {
      onlyA.push(dest.id);
    } else if (!isAccA && isAccB) {
      onlyB.push(dest.id);
    }

    if (accessA !== accessB) {
      differences.push({
        destinationId: dest.id,
        destinationName: dest.name,
        accessLevelA: accessA,
        accessLevelB: accessB
      });
    }
  }

  return success({
    passportA,
    passportB,
    scoreA,
    scoreB,
    sharedAccessible,
    onlyA,
    onlyB,
    differences
  });
}
