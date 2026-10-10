/**
 * aperiron: The Passport Paradox
 * Baseline Access Matrix (Powered by Passport Index)
 *
 * 12 Passports x 30 Destinations = 360 modeled baseline access entries.
 * Derived directly from the third-party Passport Index snapshot repository:
 * https://github.com/imorte/passport-index-data
 *
 * @see docs/DATA_POLICY.md
 * @see docs/PRODUCT.md
 */

import type { AccessLevel, CountryId } from '../shared/contracts';
import { DESTINATIONS, PASSPORTS } from './catalog';
import { PASSPORT_INDEX_DATA } from './supportedPassportIndexData';

function buildBaselineMatrix(): Record<CountryId, Record<CountryId, AccessLevel>> {
  const matrix: Record<CountryId, Record<CountryId, AccessLevel>> = {};

  for (const passport of PASSPORTS) {
    matrix[passport.id] = {};
    for (const destination of DESTINATIONS) {
      if (passport.id === destination.id) {
        matrix[passport.id][destination.id] = 'visa_free';
      } else {
        const entry = PASSPORT_INDEX_DATA[passport.id]?.[destination.id];
        matrix[passport.id][destination.id] = entry ? entry.accessLevel : 'unknown';
      }
    }
  }

  return matrix;
}

export const BASELINE_ACCESS_MATRIX: Record<CountryId, Record<CountryId, AccessLevel>> = buildBaselineMatrix();
