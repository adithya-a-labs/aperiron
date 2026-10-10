/**
 * aperiron: The Passport Paradox
 * Shared Contract Fixtures
 *
 * Synthetic reference dataset used to test and verify both
 * the calculation engine and mock engine.
 *
 * Conforms to requirements in docs/CONTRACTS.md:
 * - Includes known access classifications and at least one unknown permission.
 * - Includes overlapping treaties.
 * - Includes affordable and unaffordable purchases.
 */

import {
  AccessLevel,
  Catalog,
  CountryId,
  DestinationRequirements,
  INITIAL_CREDITS,
  Treaty,
  WorldState
} from './contracts';

export const FIXTURE_PASSPORTS = [
  { id: 'SG', name: 'Singapore', continent: 'Asia', flagEmoji: '🇸🇬', isPassportSupported: true, isDestinationSupported: true },
  { id: 'DE', name: 'Germany', continent: 'Europe', flagEmoji: '🇩🇪', isPassportSupported: true, isDestinationSupported: true },
  { id: 'IN', name: 'India', continent: 'Asia', flagEmoji: '🇮🇳', isPassportSupported: true, isDestinationSupported: true }
] as const;

export const FIXTURE_DESTINATIONS = [
  { id: 'SG', name: 'Singapore', continent: 'Asia', flagEmoji: '🇸🇬', isPassportSupported: true, isDestinationSupported: true },
  { id: 'DE', name: 'Germany', continent: 'Europe', flagEmoji: '🇩🇪', isPassportSupported: true, isDestinationSupported: true },
  { id: 'IN', name: 'India', continent: 'Asia', flagEmoji: '🇮🇳', isPassportSupported: true, isDestinationSupported: true },
  { id: 'JP', name: 'Japan', continent: 'Asia', flagEmoji: '🇯🇵', isPassportSupported: false, isDestinationSupported: true },
  { id: 'US', name: 'United States', continent: 'North America', flagEmoji: '🇺🇸', isPassportSupported: false, isDestinationSupported: true },
  { id: 'XX', name: 'Terra Incognita', continent: 'Antarctica', flagEmoji: '🏳️', isPassportSupported: false, isDestinationSupported: true }
] as const;

/**
 * Baseline access matrix: passportId -> destinationId -> AccessLevel
 */
export const FIXTURE_BASELINE_MATRIX: Record<CountryId, Record<CountryId, AccessLevel>> = {
  SG: {
    SG: 'visa_free',
    DE: 'visa_free',
    IN: 'evisa',
    JP: 'visa_free',
    US: 'visa_free',
    XX: 'unknown'
  },
  DE: {
    SG: 'visa_free',
    DE: 'visa_free',
    IN: 'evisa',
    JP: 'visa_free',
    US: 'visa_free',
    XX: 'unknown'
  },
  IN: {
    SG: 'visa_required',
    DE: 'visa_required',
    IN: 'visa_free',
    JP: 'visa_required',
    US: 'visa_required',
    XX: 'unknown'
  }
};

export const FIXTURE_TREATIES: readonly Treaty[] = [
  {
    id: 'treaty-in-jp-voa',
    name: 'India-Japan Bilateral Arrival Visa Accord',
    description: 'Grants Indian passport holders Visa on Arrival for short-term tourism in Japan.',
    cost: 20, // Affordable with 100 credits
    category: 'bilateral',
    grants: [
      { passportId: 'IN', destinationId: 'JP', grantedAccessLevel: 'visa_on_arrival' }
    ]
  },
  {
    id: 'treaty-in-jp-free',
    name: 'India-Japan Comprehensive Travel Accord',
    description: 'Upgrades Indian passport holders to full Visa-Free entry in Japan (overlaps with VoA accord).',
    cost: 35, // Affordable, overlapping improvement
    category: 'bilateral',
    grants: [
      { passportId: 'IN', destinationId: 'JP', grantedAccessLevel: 'visa_free' }
    ]
  },
  {
    id: 'treaty-global-us-waiver',
    name: 'Trans-Regional US Travel Partnership',
    description: 'Universal grant making the United States Visa-Free for all supported partner nations.',
    cost: 50, // Affordable
    category: 'multilateral',
    grants: [
      { passportId: '*', destinationId: 'US', grantedAccessLevel: 'visa_free' }
    ]
  },
  {
    id: 'treaty-expensive-super-accord',
    name: 'Global Freedom of Movement Pact',
    description: 'High-tier global pact providing universal access across all continents.',
    cost: 150, // Unaffordable with initial 100 credits
    category: 'special',
    grants: [
      { passportId: '*', destinationId: 'DE', grantedAccessLevel: 'visa_free' },
      { passportId: '*', destinationId: 'JP', grantedAccessLevel: 'visa_free' }
    ]
  }
];

export const FIXTURE_CATALOG: Catalog = {
  datasetVersion: '0.1.0-fixture',
  datasetLabel: 'Aperiron Synthetic Verification Fixture',
  passports: FIXTURE_PASSPORTS,
  destinations: FIXTURE_DESTINATIONS,
  treaties: FIXTURE_TREATIES
};

export const FIXTURE_INITIAL_STATE: WorldState = {
  creditsRemaining: INITIAL_CREDITS,
  purchasedTreatyIds: []
};

export const FIXTURE_REQUIREMENTS_IN_JP: DestinationRequirements = {
  recordId: 'req-IN-JP-tourism-v1',
  passportId: 'IN',
  destinationId: 'JP',
  accessLevel: 'visa_required',
  purpose: 'tourism',
  maxStayDays: 15,
  validityPeriod: '3 months single-entry',
  documents: [
    { title: 'Valid Passport', required: true, description: 'Must have at least 6 months remaining validity.' },
    { title: 'Visa Application Form', required: true, description: 'With 2x2 inch photograph.' },
    { title: 'Flight Itinerary', required: true, description: 'Confirmed round-trip ticket reservation.' },
    { title: 'Proof of Financial Solvency', required: true, description: 'Bank statements for the past 6 months.' }
  ],
  applicationChannel: {
    type: 'visa_center',
    name: 'VFS Global Japan Application Centre',
    url: 'https://visa.vfsglobal.com/ind/en/jpn',
    notes: 'In-person submission or designated travel agent'
  },
  fees: {
    amount: 500,
    currency: 'INR',
    notes: 'Consular visa fee; VFS service charge extra'
  },
  processingTime: {
    estimateDaysMin: 5,
    estimateDaysMax: 8,
    unit: 'days',
    isExpeditedAvailable: false,
    notes: 'Working days excluding consular holidays'
  },
  sources: [
    {
      id: 'src-mofa-japan-visas',
      title: 'Exemption of Visa (Short-Term Stay)',
      issuingAuthority: 'Ministry of Foreign Affairs of Japan',
      url: 'https://www.mofa.go.jp/j_info/visit/visa/short/novisa.html',
      retrievedAt: '2026-10-10T12:00:00Z',
      verifiedAt: '2026-10-10T12:00:00Z',
      notes: 'Official entry requirements by nationality'
    }
  ],
  verifiedAt: '2026-10-10T12:00:00Z',
  unresolvedConditions: [],
  isSimulated: false
};
