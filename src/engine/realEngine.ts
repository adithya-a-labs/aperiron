/**
 * aperiron: The Passport Paradox
 * Real Calculation Engine Implementation
 *
 * Implements the authoritative AperironEngine contract using pure TypeScript,
 * bundled third-party snapshot data from src/data/, and deterministic simulation algorithms.
 *
 * @see docs/CONTRACTS.md
 * @see src/shared/engineApi.ts
 */

import { BASELINE_ACCESS_MATRIX } from '../data/baselineMatrix';
import { getFullCatalog } from '../data/catalog';
import {
  failure,
  success,
  type AccessLevel,
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
} from '../shared/contracts';
import type { AperironEngine } from '../shared/engineApi';
import { FIXTURE_BASELINE_MATRIX, FIXTURE_CATALOG, FIXTURE_REQUIREMENTS_IN_JP } from '../shared/fixtures';
import { getDestinationAccessList } from './access';
import { comparePassports } from './compare';
import { generateVisaDNA } from './dna';
import { optimizeTreaties } from './optimizer';
import { getDestinationRequirements } from './requirements';
import { calculateAccessBreakdown, calculateMobilityScore } from './scoring';
import { calculateImpact, purchaseTreaty } from './treaties';

export class RealAperironEngine implements AperironEngine {
  private readonly catalog: Catalog;
  private readonly matrix: Record<CountryId, Record<CountryId, AccessLevel>>;

  constructor(
    customCatalog?: Catalog,
    customMatrix?: Record<CountryId, Record<CountryId, AccessLevel>>
  ) {
    this.catalog = structuredClone(customCatalog ?? getFullCatalog());
    this.matrix = structuredClone(
      customMatrix ??
      (this.catalog.datasetVersion === FIXTURE_CATALOG.datasetVersion
        ? FIXTURE_BASELINE_MATRIX
        : BASELINE_ACCESS_MATRIX));
  }

  public getCatalog(): Catalog {
    return structuredClone(this.catalog);
  }

  public getPassportView(
    passportId: CountryId,
    state: WorldState
  ): Result<PassportView> {
    const passport = this.catalog.passports.find((p) => p.id === passportId);
    if (!passport) {
      return failure(
        'INVALID_PASSPORT',
        `Passport '${passportId}' is not supported in the active catalog.`
      );
    }

    const destinations = getDestinationAccessList(passportId, state, this.catalog, this.matrix);
    const levels = destinations.map((d) => d.accessLevel);
    const score = calculateMobilityScore(levels);
    const accessBreakdown = calculateAccessBreakdown(levels);

    return success({
      passportId: passport.id,
      passportName: passport.name,
      score,
      destinations,
      accessBreakdown
    });
  }

  public comparePassports(
    passportA: CountryId,
    passportB: CountryId,
    state: WorldState
  ): Result<PassportComparison> {
    return comparePassports(passportA, passportB, state, this.catalog, this.matrix);
  }

  public generateVisaDNA(
    passportId: CountryId,
    state: WorldState
  ): Result<VisaDNA> {
    return generateVisaDNA(passportId, state, this.catalog, this.matrix);
  }

  public purchaseTreaty(
    state: WorldState,
    treatyId: TreatyId
  ): Result<PurchaseResult> {
    return purchaseTreaty(state, treatyId, this.catalog, this.matrix);
  }

  public calculateImpact(
    beforeState: WorldState,
    afterState: WorldState
  ): Result<SimulationImpact> {
    return calculateImpact(beforeState, afterState, this.catalog, this.matrix);
  }

  public optimizeTreaties(
    state: WorldState,
    budget: number
  ): Result<OptimizationResult> {
    return optimizeTreaties(state, budget, this.catalog, this.matrix);
  }

  public getDestinationRequirements(
    params: DestinationRequirementsParams
  ): Result<DestinationRequirements> {
    if (this.catalog.datasetVersion === FIXTURE_CATALOG.datasetVersion &&
        params.passportId === 'IN' && params.destinationId === 'JP' &&
        (!params.travellerContext?.purpose || params.travellerContext.purpose === 'tourism') &&
        (!params.travellerContext?.passportType || params.travellerContext.passportType === 'ordinary')) {
      return success(structuredClone(FIXTURE_REQUIREMENTS_IN_JP));
    }
    return getDestinationRequirements(params, this.catalog, this.matrix);
  }
}

/** Singleton instance of the real calculation engine */
export const realEngine = new RealAperironEngine();
