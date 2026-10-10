/**
 * aperiron: The Passport Paradox
 * Engine API Contract
 *
 * The official interface that both the real calculation engine
 * and development mocks must implement.
 *
 * @see docs/CONTRACTS.md
 */

import {
  type Catalog,
  type CountryId,
  type DestinationRequirements,
  type DestinationRequirementsParams,
  type OptimizationResult,
  type PassportComparison,
  type PassportView,
  type PurchaseResult,
  type Result,
  type SimulationImpact,
  type TreatyId,
  type VisaDNA,
  type WorldState
} from './contracts';

export interface AperironEngine {
  /**
   * Returns the stable dataset catalog including supported passports,
   * destinations, metadata, and available fictional treaties.
   */
  getCatalog(): Catalog;

  /**
   * Resolves destination access classifications and normalized mobility score
   * for a given passport under the active simulation world state.
   */
  getPassportView(passportId: CountryId, state: WorldState): Result<PassportView>;

  /**
   * Compares mobility access between two passports, computing shared, unique,
   * and contrasting destination permissions.
   */
  comparePassports(
    passportA: CountryId,
    passportB: CountryId,
    state: WorldState
  ): Result<PassportComparison>;

  /**
   * Computes a deterministic, normalized numeric vector representing
   * passport mobility across all destinations.
   */
  generateVisaDNA(passportId: CountryId, state: WorldState): Result<VisaDNA>;

  /**
   * Purchases a treaty with Influence credits, returning an updated immutable
   * WorldState and the resulting impact delta.
   */
  purchaseTreaty(state: WorldState, treatyId: TreatyId): Result<PurchaseResult>;

  /**
   * Computes the global mobility delta and newly unlocked pairs between
   * any two simulation world states.
   */
  calculateImpact(
    beforeState: WorldState,
    afterState: WorldState
  ): Result<SimulationImpact>;

  /**
   * Evaluates affordable treaties and provides a greedy recommendation of
   * purchases that maximize global mobility within the given credit budget.
   */
  optimizeTreaties(state: WorldState, budget: number): Result<OptimizationResult>;

  /**
   * Resolves detailed, official entry requirements for a specific passport
   * and destination pair, including documents, stay limits, fees, and provenance.
   */
  getDestinationRequirements(
    params: DestinationRequirementsParams
  ): Result<DestinationRequirements>;
}
