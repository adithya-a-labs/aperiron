/**
 * aperiron: The Passport Paradox
 * Engine: Destination Regulations Lookup Service
 *
 * Resolves structured, official destination requirements with consular citations,
 * while isolating baseline provenance from simulated treaty unlocks.
 *
 * @see docs/DATA_POLICY.md (Simulation isolation)
 * @see docs/CONTRACTS.md (Country regulation extension)
 */

import { resolveDestinationRequirements } from '../data/regulations';
import {
  Catalog,
  DestinationRequirements,
  DestinationRequirementsParams,
  failure,
  Result,
  success,
  WorldState
} from '../shared/contracts';
import { resolveEffectiveAccess } from './access';

export function getDestinationRequirements(
  params: DestinationRequirementsParams,
  state: WorldState,
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

  // 1. Resolve authentic baseline requirement record
  const baselineRecord = resolveDestinationRequirements(params);

  // 2. Check effective access under active treaties
  const effective = resolveEffectiveAccess(passportId, destinationId, state, catalog, customMatrix);

  if (effective.isSimulated) {
    // Return composite record with simulation overlay, strictly preserving baseline provenance
    return success({
      ...baselineRecord,
      accessLevel: effective.accessLevel,
      maxStayDays: effective.maxStayDays ?? baselineRecord.maxStayDays,
      isSimulated: true,
      simulatedEffect: `Simulated entry unlocked under ${effective.simulatedViaTreatyName ?? 'active treaty'}.`,
      baselineAccessLevel: baselineRecord.accessLevel
    });
  }

  return success(baselineRecord);
}
