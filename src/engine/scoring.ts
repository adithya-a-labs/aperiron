/**
 * aperiron: The Passport Paradox
 * Engine: Mobility Scoring & Analytics
 *
 * Implements weighted mobility scoring (0–100 scale) and access breakdowns
 * across supported passports and destinations.
 *
 * @see docs/CONTRACTS.md (Semantics to freeze: Scoring)
 */

import { AccessBreakdown, AccessLevel, Catalog, WorldState } from '../shared/contracts';
import { getDestinationAccessList } from './access';

/**
 * Weights assigned to each access classification for mobility calculation.
 * Reflects ease of entry and degree of border friction.
 */
export const ACCESS_WEIGHTS: Readonly<Record<AccessLevel, number>> = {
  visa_free: 1.0,
  visa_on_arrival: 0.8,
  evisa: 0.6,
  visa_required: 0.2,
  restricted: 0.0,
  unknown: 0.0
};

export function accessLevelToWeight(level: AccessLevel): number {
  return ACCESS_WEIGHTS[level] ?? 0.0;
}

/**
 * Computes normalized 0-100 mobility score from a list of destination access levels.
 */
export function calculateMobilityScore(levels: readonly AccessLevel[]): number {
  if (levels.length === 0) return 0;
  const weightedSum = levels.reduce((acc, lvl) => acc + accessLevelToWeight(lvl), 0);
  return Math.round((weightedSum / levels.length) * 100);
}

/**
 * Computes categorical count breakdown for destination access levels.
 */
export function calculateAccessBreakdown(levels: readonly AccessLevel[]): AccessBreakdown {
  const breakdown: AccessBreakdown = {
    visaFree: 0,
    visaOnArrival: 0,
    evisa: 0,
    visaRequired: 0,
    restricted: 0,
    unknown: 0,
    total: levels.length
  };

  for (const lvl of levels) {
    switch (lvl) {
      case 'visa_free':
        (breakdown as { visaFree: number }).visaFree++;
        break;
      case 'visa_on_arrival':
        (breakdown as { visaOnArrival: number }).visaOnArrival++;
        break;
      case 'evisa':
        (breakdown as { evisa: number }).evisa++;
        break;
      case 'visa_required':
        (breakdown as { visaRequired: number }).visaRequired++;
        break;
      case 'restricted':
        (breakdown as { restricted: number }).restricted++;
        break;
      case 'unknown':
        (breakdown as { unknown: number }).unknown++;
        break;
    }
  }

  return breakdown;
}

/**
 * Computes global average mobility score across all supported passports
 * under the given simulation state.
 */
export function calculateGlobalMobilityScore(
  catalog: Catalog,
  state: WorldState,
  customMatrix?: Record<CountryId, Record<CountryId, AccessLevel>>
): number {
  if (catalog.passports.length === 0) return 0;

  let totalScore = 0;
  for (const passport of catalog.passports) {
    const destinations = getDestinationAccessList(passport.id, state, catalog, customMatrix);
    const score = calculateMobilityScore(destinations.map((d) => d.accessLevel));
    totalScore += score;
  }

  return Math.round((totalScore / catalog.passports.length) * 10) / 10;
}
