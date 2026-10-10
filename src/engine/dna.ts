import type { AccessLevel } from '../shared/contracts';
/**
 * aperiron: The Passport Paradox
 * Engine: Visa DNA Generator
 *
 * Implements deterministic numeric representation and fingerprinting of
 * passport mobility permissions.
 *
 * Mathematical Invariants:
 * - Same effective access vector strictly produces the same numeric vector and hash.
 * - Determinism is completely independent of timestamps, random seeds, or remaining credits.
 * - Vector length matches the number of catalog destinations in fixed order.
 *
 * @see docs/CONTRACTS.md (Semantics to freeze: DNA)
 * @see docs/PRODUCT.md (Inspect Visa DNA)
 */

import {
  failure,
  success,
  type Catalog,
  type CountryId,
  type Result,
  type VisaDNA,
  type WorldState
} from '../shared/contracts';
import { getDestinationAccessList } from './access';
import { accessLevelToWeight, calculateAccessBreakdown } from './scoring';

export function generateVisaDNA(
  passportId: CountryId,
  state: WorldState,
  catalog: Catalog,
  customMatrix?: Record<CountryId, Record<CountryId, AccessLevel>>
): Result<VisaDNA> {
  const passport = catalog.passports.find((p) => p.id === passportId);
  if (!passport) {
    return failure('INVALID_PASSPORT', `Passport '${passportId}' not found in catalog.`);
  }

  const destinations = getDestinationAccessList(passportId, state, catalog, customMatrix);
  const levels = destinations.map((d) => d.accessLevel);

  // Generate normalized float vector [0.0 - 1.0] in catalog destination order
  const vector = levels.map((lvl) => accessLevelToWeight(lvl));

  // Generate deterministic hex hash from integer percentages
  const hexParts = vector.map((v) => Math.round(v * 100).toString(16).padStart(2, '0'));
  const hash = `dna-${passportId.toLowerCase()}-${hexParts.join('')}`;

  const summary = calculateAccessBreakdown(levels);

  return success({
    passportId,
    vector,
    hash,
    summary
  });
}
