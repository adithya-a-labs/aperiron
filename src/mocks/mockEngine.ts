/**
 * aperiron: The Passport Paradox
 * Mock Engine Implementation
 *
 * Contract-compliant mock engine providing realistic, deterministic
 * responses for UI development, store integration, and testing.
 *
 * @see docs/CONTRACTS.md
 * @see src/shared/engineApi.ts
 */

import {
  AccessBreakdown,
  AccessDifference,
  AccessiblePairTransition,
  AccessLevel,
  Catalog,
  CountryId,
  DestinationAccess,
  DestinationRequirements,
  DestinationRequirementsParams,
  DocumentRequirement,
  failure,
  isAccessible,
  OptimizationResult,
  PassportComparison,
  PassportView,
  PurchaseResult,
  Result,
  SimulationImpact,
  success,
  Treaty,
  TreatyId,
  VisaDNA,
  WorldState
} from '../shared/contracts';
import { AperironEngine } from '../shared/engineApi';
import {
  FIXTURE_BASELINE_MATRIX,
  FIXTURE_CATALOG,
  FIXTURE_REQUIREMENTS_IN_JP
} from '../shared/fixtures';

export class MockAperironEngine implements AperironEngine {
  private readonly catalog: Catalog;

  constructor(customCatalog: Catalog = FIXTURE_CATALOG) {
    this.catalog = customCatalog;
  }

  public getCatalog(): Catalog {
    // Return a shallow clone to prevent caller mutation of internal references
    return {
      ...this.catalog,
      passports: [...this.catalog.passports],
      destinations: [...this.catalog.destinations],
      treaties: [...this.catalog.treaties]
    };
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

    const destinations: DestinationAccess[] = this.catalog.destinations.map(
      (dest) => {
        const effective = this.resolveEffectiveAccess(passportId, dest.id, state);
        return {
          destinationId: dest.id,
          destinationName: dest.name,
          accessLevel: effective.level,
          maxStayDays: effective.maxStayDays,
          isSimulated: effective.isSimulated,
          notes: effective.notes
        };
      }
    );

    const breakdown = this.computeBreakdown(destinations.map((d) => d.accessLevel));
    const score = this.calculateMobilityScore(destinations.map((d) => d.accessLevel));

    return success({
      passportId: passport.id,
      passportName: passport.name,
      score,
      destinations,
      accessBreakdown: breakdown
    });
  }

  public comparePassports(
    passportA: CountryId,
    passportB: CountryId,
    state: WorldState
  ): Result<PassportComparison> {
    const pA = this.catalog.passports.find((p) => p.id === passportA);
    const pB = this.catalog.passports.find((p) => p.id === passportB);

    if (!pA) {
      return failure('INVALID_PASSPORT', `Passport A '${passportA}' not found.`);
    }
    if (!pB) {
      return failure('INVALID_PASSPORT', `Passport B '${passportB}' not found.`);
    }

    const viewA = this.getPassportView(passportA, state);
    const viewB = this.getPassportView(passportB, state);

    if (!viewA.success) return viewA;
    if (!viewB.success) return viewB;

    const sharedAccessible: CountryId[] = [];
    const onlyA: CountryId[] = [];
    const onlyB: CountryId[] = [];
    const differences: AccessDifference[] = [];

    for (const dest of this.catalog.destinations) {
      const accessA = viewA.data.destinations.find((d) => d.destinationId === dest.id)
        ?.accessLevel ?? 'unknown';
      const accessB = viewB.data.destinations.find((d) => d.destinationId === dest.id)
        ?.accessLevel ?? 'unknown';

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
      scoreA: viewA.data.score,
      scoreB: viewB.data.score,
      sharedAccessible,
      onlyA,
      onlyB,
      differences
    });
  }

  public generateVisaDNA(
    passportId: CountryId,
    state: WorldState
  ): Result<VisaDNA> {
    const viewResult = this.getPassportView(passportId, state);
    if (!viewResult.success) {
      return viewResult;
    }

    const view = viewResult.data;
    // Map each destination's access level to a deterministic float [0.0 - 1.0]
    const vector = view.destinations.map((d) => this.accessLevelToWeight(d.accessLevel));

    // Create a deterministic hash string based on vector
    const hashValues = vector.map((v) => Math.round(v * 100).toString(16).padStart(2, '0'));
    const hash = `dna-${passportId.toLowerCase()}-${hashValues.join('')}`;

    return success({
      passportId,
      vector,
      hash,
      summary: view.accessBreakdown
    });
  }

  public purchaseTreaty(
    state: WorldState,
    treatyId: TreatyId
  ): Result<PurchaseResult> {
    const treaty = this.catalog.treaties.find((t) => t.id === treatyId);
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
        `Insufficient Influence Credits. Requires ${treaty.cost}, but only ${state.creditsRemaining} available.`
      );
    }

    const nextState: WorldState = {
      creditsRemaining: state.creditsRemaining - treaty.cost,
      purchasedTreatyIds: [...state.purchasedTreatyIds, treatyId]
    };

    const impactResult = this.calculateImpact(state, nextState);
    if (!impactResult.success) {
      return impactResult;
    }

    return success({
      nextState,
      impact: impactResult.data,
      purchasedTreaty: treaty
    });
  }

  public calculateImpact(
    beforeState: WorldState,
    afterState: WorldState
  ): Result<SimulationImpact> {
    let beforeScoreSum = 0;
    let afterScoreSum = 0;
    const newlyAccessiblePairs: AccessiblePairTransition[] = [];

    for (const passport of this.catalog.passports) {
      const beforeView = this.getPassportView(passport.id, beforeState);
      const afterView = this.getPassportView(passport.id, afterState);

      if (!beforeView.success || !afterView.success) {
        return failure('MALFORMED_STATE', 'Failed to calculate passport views during impact analysis.');
      }

      beforeScoreSum += beforeView.data.score;
      afterScoreSum += afterView.data.score;

      for (const dest of this.catalog.destinations) {
        const levelBefore = beforeView.data.destinations.find(
          (d) => d.destinationId === dest.id
        )?.accessLevel ?? 'unknown';

        const levelAfter = afterView.data.destinations.find(
          (d) => d.destinationId === dest.id
        )?.accessLevel ?? 'unknown';

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

    const count = this.catalog.passports.length || 1;
    const beforeGlobalScore = Math.round((beforeScoreSum / count) * 10) / 10;
    const afterGlobalScore = Math.round((afterScoreSum / count) * 10) / 10;
    const scoreDelta = Math.round((afterGlobalScore - beforeGlobalScore) * 10) / 10;

    return success({
      beforeGlobalScore,
      afterGlobalScore,
      scoreDelta,
      newlyAccessiblePairs
    });
  }

  public optimizeTreaties(
    state: WorldState,
    budget: number
  ): Result<OptimizationResult> {
    if (!Number.isFinite(budget) || budget <= 0) {
      return failure('INVALID_BUDGET', 'Budget must be a finite positive number of Influence Credits.');
    }

    const availableBudget = Math.min(budget, state.creditsRemaining);
    const unpurchased = this.catalog.treaties.filter(
      (t) => !state.purchasedTreatyIds.includes(t.id) && t.cost <= availableBudget
    );

    const recommendedIds: TreatyId[] = [];
    let currentBudget = availableBudget;
    let currentState = state;

    // Greedy heuristic: evaluate impact per credit cost
    const candidates = unpurchased.map((treaty) => {
      const trialState: WorldState = {
        creditsRemaining: currentState.creditsRemaining - treaty.cost,
        purchasedTreatyIds: [...currentState.purchasedTreatyIds, treaty.id]
      };
      const impact = this.calculateImpact(currentState, trialState);
      const scoreDelta = impact.success ? impact.data.scoreDelta : 0;
      const efficiency = treaty.cost > 0 ? scoreDelta / treaty.cost : 0;
      return { treaty, efficiency, scoreDelta };
    });

    candidates.sort((a, b) => b.efficiency - a.efficiency || a.treaty.cost - b.treaty.cost);

    for (const candidate of candidates) {
      if (candidate.treaty.cost <= currentBudget) {
        recommendedIds.push(candidate.treaty.id);
        currentBudget -= candidate.treaty.cost;
        currentState = {
          creditsRemaining: currentState.creditsRemaining - candidate.treaty.cost,
          purchasedTreatyIds: [...currentState.purchasedTreatyIds, candidate.treaty.id]
        };
      }
    }

    const finalImpact = this.calculateImpact(state, currentState);
    const totalCost = availableBudget - currentBudget;

    return success({
      recommendedTreatyIds: recommendedIds,
      totalCost,
      budgetRequested: budget,
      projectedImpact: finalImpact.success
        ? finalImpact.data
        : { beforeGlobalScore: 0, afterGlobalScore: 0, scoreDelta: 0, newlyAccessiblePairs: [] },
      rationale:
        recommendedIds.length > 0
          ? `Greedy selection of ${recommendedIds.length} treaties maximizing global mobility gain within ${availableBudget} credits.`
          : 'No affordable treaties found within the requested budget.'
    });
  }

  public getDestinationRequirements(
    params: DestinationRequirementsParams
  ): Result<DestinationRequirements> {
    const { passportId, destinationId } = params;

    const passport = this.catalog.passports.find((p) => p.id === passportId);
    if (!passport) {
      return failure('INVALID_PASSPORT', `Passport '${passportId}' not found.`);
    }

    const destination = this.catalog.destinations.find((d) => d.id === destinationId);
    if (!destination) {
      return failure('INVALID_DESTINATION', `Destination '${destinationId}' not found.`);
    }

    // If matching synthetic fixture, return rich fixture data
    if (passportId === 'IN' && destinationId === 'JP') {
      return success(FIXTURE_REQUIREMENTS_IN_JP);
    }

    // Default mock response with authentic structure
    const baseline = this.resolveBaselineAccess(passportId, destinationId);
    const documents: DocumentRequirement[] = [
      {
        title: 'Valid Passport',
        required: true,
        description: 'Machine-readable passport valid for at least 6 months beyond travel dates.'
      }
    ];

    if (baseline === 'visa_required' || baseline === 'evisa') {
      documents.push({
        title: 'Proof of Accommodation & Onward Travel',
        required: true,
        description: 'Hotel reservations and confirmed return/onward flight booking.'
      });
    }

    return success({
      recordId: `mock-req-${passportId}-${destinationId}-v1`,
      passportId,
      destinationId,
      accessLevel: baseline,
      purpose: params.travellerContext?.purpose ?? 'tourism',
      maxStayDays: baseline === 'visa_free' ? 90 : baseline === 'visa_on_arrival' ? 30 : 15,
      validityPeriod: 'Short-stay entry',
      documents,
      applicationChannel: {
        type: baseline === 'visa_free' ? 'none' : baseline === 'evisa' ? 'online_portal' : 'consulate',
        name: baseline === 'visa_free' ? 'No prior application' : `${destination.name} Immigration Authority`,
        url: `https://www.immigration.gov.${destinationId.toLowerCase()}`
      },
      fees: {
        amount: baseline === 'visa_free' ? 0 : 50,
        currency: 'USD',
        notes: baseline === 'visa_free' ? 'No consular fee' : 'Standard tourist visa processing fee'
      },
      processingTime: {
        estimateDaysMin: baseline === 'visa_free' ? 0 : 3,
        estimateDaysMax: baseline === 'visa_free' ? 0 : 7,
        unit: 'days',
        notes: 'Official business processing estimation'
      },
      sources: [
        {
          id: `src-official-${destinationId.toLowerCase()}`,
          title: `${destination.name} Official Immigration Service`,
          issuingAuthority: `Ministry of Foreign Affairs of ${destination.name}`,
          url: `https://www.official-visas.example.gov/${destinationId.toLowerCase()}`,
          retrievedAt: '2026-10-10T00:00:00Z',
          verifiedAt: '2026-10-10T00:00:00Z'
        }
      ],
      verifiedAt: '2026-10-10T00:00:00Z',
      unresolvedConditions: [],
      isSimulated: false,
      baselineAccessLevel: baseline
    });
  }

  // ==========================================================================
  // Internal Helpers
  // ==========================================================================

  private resolveBaselineAccess(passportId: CountryId, destinationId: CountryId): AccessLevel {
    if (passportId === destinationId) return 'visa_free';
    const matrixEntry = FIXTURE_BASELINE_MATRIX[passportId]?.[destinationId];
    return matrixEntry ?? 'unknown';
  }

  private resolveEffectiveAccess(
    passportId: CountryId,
    destinationId: CountryId,
    state: WorldState
  ): { level: AccessLevel; maxStayDays: number | null; isSimulated: boolean; notes?: string } {
    const baseline = this.resolveBaselineAccess(passportId, destinationId);

    // Check active treaties in state
    let highestLevel = baseline;
    let isSimulated = false;
    let treatyName: string | undefined;

    for (const treatyId of state.purchasedTreatyIds) {
      const treaty = this.catalog.treaties.find((t) => t.id === treatyId);
      if (!treaty) continue;

      for (const grant of treaty.grants) {
        const matchesPassport = grant.passportId === '*' || grant.passportId === passportId;
        const matchesDest = grant.destinationId === destinationId;

        if (matchesPassport && matchesDest) {
          if (this.isMorePermissive(grant.grantedAccessLevel, highestLevel)) {
            highestLevel = grant.grantedAccessLevel;
            isSimulated = true;
            treatyName = treaty.name;
          }
        }
      }
    }

    return {
      level: highestLevel,
      maxStayDays: highestLevel === 'visa_free' ? 90 : highestLevel === 'visa_on_arrival' ? 30 : null,
      isSimulated,
      notes: isSimulated ? `Unlocked via ${treatyName}` : undefined
    };
  }

  private isMorePermissive(a: AccessLevel, b: AccessLevel): boolean {
    const rank: Record<AccessLevel, number> = {
      visa_free: 5,
      visa_on_arrival: 4,
      evisa: 3,
      visa_required: 2,
      restricted: 1,
      unknown: 0
    };
    return rank[a] > rank[b];
  }

  private accessLevelToWeight(level: AccessLevel): number {
    switch (level) {
      case 'visa_free':
        return 1.0;
      case 'visa_on_arrival':
        return 0.8;
      case 'evisa':
        return 0.6;
      case 'visa_required':
        return 0.2;
      case 'restricted':
      case 'unknown':
      default:
        return 0.0;
    }
  }

  private calculateMobilityScore(levels: readonly AccessLevel[]): number {
    if (levels.length === 0) return 0;
    const totalWeighted = levels.reduce((sum, lvl) => sum + this.accessLevelToWeight(lvl), 0);
    return Math.round((totalWeighted / levels.length) * 100);
  }

  private computeBreakdown(levels: readonly AccessLevel[]): AccessBreakdown {
    const counts = {
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
          counts.visaFree++;
          break;
        case 'visa_on_arrival':
          counts.visaOnArrival++;
          break;
        case 'evisa':
          counts.evisa++;
          break;
        case 'visa_required':
          counts.visaRequired++;
          break;
        case 'restricted':
          counts.restricted++;
          break;
        case 'unknown':
          counts.unknown++;
          break;
      }
    }

    return counts;
  }
}

/** Default singleton instance of the mock engine */
export const mockEngine = new MockAperironEngine();
