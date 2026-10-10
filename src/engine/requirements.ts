import type { AccessLevel, CountryId } from '../shared/contracts';
/**
 * aperiron: The Passport Paradox
 * Engine: Destination Regulations Lookup Service
 *
 * Resolves unreviewed snapshot data with explicit missing requirement details,
 * while isolating baseline provenance from simulated treaty unlocks.
 *
 * @see docs/DATA_POLICY.md (Simulation isolation)
 * @see docs/CONTRACTS.md (Country regulation extension)
 */

import { DATASET_VERSION } from '../data/catalog';
import { resolveDestinationRequirements } from '../data/regulations';
import {
  failure,
  success,
  type Catalog,
  type DestinationRequirements,
  type DestinationRequirementsParams,
  type Result
} from '../shared/contracts';
import { getBaselineAccess } from './access';

export function getDestinationRequirements(
  params: DestinationRequirementsParams,
  catalog: Catalog,
  customMatrix?: Record<CountryId, Record<CountryId, AccessLevel>>
): Result<DestinationRequirements> {
  const { passportId, destinationId } = params;

  const passport = catalog.passports.find((p) => p.id === passportId);
  if (!passport) {
    return failure('INVALID_PASSPORT', `Passport '${passportId}' not found in active catalog.`);
  }

  const destination = catalog.destinations.find((d) => d.id === destinationId);
  if (!destination) {
    return failure('INVALID_DESTINATION', `Destination '${destinationId}' not found in active catalog.`);
  }

  // Regulation lookup always uses baseline data. Fictional overlays belong in
  // getPassportView; they cannot change real requirements or stay limits.
  return success(resolveDestinationRequirements(
    params,
    getBaselineAccess(passportId, destinationId, customMatrix),
    catalog.datasetVersion === DATASET_VERSION
  ));
}
