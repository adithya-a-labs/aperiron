/**
 * aperiron: The Passport Paradox
 * Shared Contract Specifications
 *
 * Authoritative types, errors, and data structures shared across
 * the core engine, data layers, UI store, and adapters.
 *
 * @see docs/CONTRACTS.md
 * @see docs/DATA_POLICY.md
 */

// ============================================================================
// Core Identifiers & Primitives
// ============================================================================

/** ISO 3166-1 alpha-2 uppercase country code (e.g., 'SG', 'DE', 'JP', 'IN', 'US') */
export type CountryId = string;

/** Stable identifier for a simulated treaty (e.g., 'treaty-schengen-pacific-accord') */
export type TreatyId = string;

/**
 * Access classifications recognized by aperiron.
 * - `visa_free`: Entry permitted without a prior visa.
 * - `visa_on_arrival`: Visa issued upon arrival at the port of entry.
 * - `evisa`: Electronic travel authorization or electronic visa applied online prior to travel.
 * - `visa_required`: Traditional embassy/consulate visa required prior to travel.
 * - `restricted`: Entry banned, suspended, or special pre-clearance required.
 * - `unknown`: Incomplete or unverified data (never inferred as accessible).
 */
export type AccessLevel =
  | 'visa_free'
  | 'visa_on_arrival'
  | 'evisa'
  | 'visa_required'
  | 'restricted'
  | 'unknown';

/**
 * Determines whether an access level is considered "accessible" under v1 simulation modeling.
 * By policy, visa_free, visa_on_arrival, and evisa represent accessible pathways.
 */
export function isAccessible(level: AccessLevel): boolean {
  return level === 'visa_free' || level === 'visa_on_arrival' || level === 'evisa';
}

// ============================================================================
// Result Pattern & Typed Errors
// ============================================================================

export type ErrorCode =
  | 'INVALID_PASSPORT'
  | 'INVALID_DESTINATION'
  | 'INVALID_TREATY'
  | 'INSUFFICIENT_CREDITS'
  | 'ALREADY_PURCHASED'
  | 'INVALID_BUDGET'
  | 'MALFORMED_STATE';

export interface EngineError {
  readonly code: ErrorCode;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

export type Result<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: EngineError };

export function success<T>(data: T): Result<T> {
  return { success: true, data };
}

export function failure<T = never>(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): Result<T> {
  return { success: false, error: { code, message, details } };
}

// ============================================================================
// Simulation State
// ============================================================================

/**
 * WorldState models the mutable simulation context (Influence credits and unlocked treaties).
 * This state is completely decoupled from UI selection state.
 */
export interface WorldState {
  readonly creditsRemaining: number;
  readonly purchasedTreatyIds: readonly TreatyId[];
}

export const INITIAL_CREDITS = 100;

export const INITIAL_WORLD_STATE: WorldState = {
  creditsRemaining: INITIAL_CREDITS,
  purchasedTreatyIds: []
};

// ============================================================================
// Catalog Definitions
// ============================================================================

export interface CountrySummary {
  readonly id: CountryId;
  readonly name: string;
  readonly continent: string;
  readonly flagEmoji?: string;
  readonly isPassportSupported: boolean;
  readonly isDestinationSupported: boolean;
}

export interface TreatyGrant {
  /** Target passport, or '*' for universal grant across all supported passports */
  readonly passportId: CountryId | '*';
  /** Target destination country */
  readonly destinationId: CountryId;
  /** Access classification granted under this treaty */
  readonly grantedAccessLevel: AccessLevel;
}

export interface Treaty {
  readonly id: TreatyId;
  readonly name: string;
  readonly description: string;
  readonly cost: number;
  readonly category: 'bilateral' | 'multilateral' | 'regional' | 'special';
  readonly grants: readonly TreatyGrant[];
}

export interface Catalog {
  readonly datasetVersion: string;
  readonly datasetLabel: string;
  readonly passports: readonly CountrySummary[];
  readonly destinations: readonly CountrySummary[];
  readonly treaties: readonly Treaty[];
}

// ============================================================================
// Destination Access & Passport Views
// ============================================================================

export interface DestinationAccess {
  readonly destinationId: CountryId;
  readonly destinationName: string;
  readonly accessLevel: AccessLevel;
  readonly maxStayDays?: number | null;
  readonly isSimulated: boolean;
  readonly notes?: string;
}

export interface AccessBreakdown {
  readonly visaFree: number;
  readonly visaOnArrival: number;
  readonly evisa: number;
  readonly visaRequired: number;
  readonly restricted: number;
  readonly unknown: number;
  readonly total: number;
}

export interface PassportView {
  readonly passportId: CountryId;
  readonly passportName: string;
  readonly score: number; // 0-100 normalized score
  readonly destinations: readonly DestinationAccess[]; // catalog order
  readonly accessBreakdown: AccessBreakdown;
}

// ============================================================================
// Passport Comparison
// ============================================================================

export interface AccessDifference {
  readonly destinationId: CountryId;
  readonly destinationName: string;
  readonly accessLevelA: AccessLevel;
  readonly accessLevelB: AccessLevel;
}

export interface PassportComparison {
  readonly passportA: CountryId;
  readonly passportB: CountryId;
  readonly scoreA: number;
  readonly scoreB: number;
  readonly sharedAccessible: readonly CountryId[];
  readonly onlyA: readonly CountryId[];
  readonly onlyB: readonly CountryId[];
  readonly differences: readonly AccessDifference[];
}

// ============================================================================
// Visa DNA
// ============================================================================

export interface VisaDNA {
  readonly passportId: CountryId;
  /** Fixed-length normalized vector (0.0 to 1.0) for visual rendering */
  readonly vector: readonly number[];
  /** Deterministic hex fingerprint derived from vector values */
  readonly hash: string;
  readonly summary: AccessBreakdown;
}

// ============================================================================
// Simulation Purchases & Impact
// ============================================================================

export interface AccessiblePairTransition {
  readonly passportId: CountryId;
  readonly destinationId: CountryId;
  readonly previousLevel: AccessLevel;
  readonly newLevel: AccessLevel;
}

export interface SimulationImpact {
  readonly beforeGlobalScore: number;
  readonly afterGlobalScore: number;
  readonly scoreDelta: number;
  readonly newlyAccessiblePairs: readonly AccessiblePairTransition[];
}

export interface PurchaseResult {
  readonly nextState: WorldState;
  readonly impact: SimulationImpact;
  readonly purchasedTreaty: Treaty;
}

export interface OptimizationResult {
  readonly recommendedTreatyIds: readonly TreatyId[];
  readonly totalCost: number;
  readonly budgetRequested: number;
  readonly projectedImpact: SimulationImpact;
  readonly rationale: string;
}

// ============================================================================
// Country Regulations Lookup (Official Sourced Context)
// ============================================================================

export interface TravellerContext {
  readonly purpose?: 'tourism' | 'business' | 'transit' | 'conference';
  readonly durationDays?: number;
  readonly passportType?: 'ordinary' | 'diplomatic' | 'service';
}

export interface DestinationRequirementsParams {
  readonly passportId: CountryId;
  readonly destinationId: CountryId;
  readonly travellerContext?: TravellerContext;
}

export interface DocumentRequirement {
  readonly title: string;
  readonly required: boolean;
  readonly description?: string;
  readonly condition?: string;
}

export interface ApplicationChannel {
  readonly type: 'online_portal' | 'consulate' | 'visa_center' | 'port_of_entry' | 'none';
  readonly name: string;
  readonly url?: string;
  readonly notes?: string;
}

export interface FeeInfo {
  readonly amount: number;
  readonly currency: string;
  readonly waivedFor?: readonly string[];
  readonly notes?: string;
}

export interface ProcessingTimeInfo {
  readonly estimateDaysMin: number;
  readonly estimateDaysMax: number;
  readonly unit: 'hours' | 'days' | 'weeks';
  readonly isExpeditedAvailable?: boolean;
  readonly notes?: string;
}

export interface SourceReference {
  readonly id: string;
  readonly title: string;
  readonly issuingAuthority: string;
  readonly url: string;
  readonly retrievedAt: string;
  readonly verifiedAt: string;
  readonly notes?: string;
}

export interface DestinationRequirements {
  readonly recordId: string;
  readonly passportId: CountryId;
  readonly destinationId: CountryId;
  readonly accessLevel: AccessLevel;
  readonly purpose: string;
  readonly maxStayDays: number | null;
  readonly validityPeriod?: string;
  readonly documents: readonly DocumentRequirement[];
  readonly applicationChannel: ApplicationChannel;
  readonly fees?: FeeInfo;
  readonly processingTime?: ProcessingTimeInfo;
  readonly sources: readonly SourceReference[];
  readonly verifiedAt: string;
  readonly unresolvedConditions?: readonly string[];
  readonly isSimulated: boolean;
  readonly simulatedEffect?: string;
  readonly baselineAccessLevel?: AccessLevel;
}
