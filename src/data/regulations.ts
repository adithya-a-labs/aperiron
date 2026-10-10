import type { AccessLevel } from '../shared/contracts';
/**
 * aperiron: The Passport Paradox
 * Legacy Regulation Drafts and Baseline Snapshot Lookup
 *
 * Legacy records below are unreviewed drafts, excluded from runtime lookup.
 * Snapshot classifications retain missing details pending claim-level review.
 *
 * @see docs/DATA_POLICY.md
 * @see docs/CONTRACTS.md
 */

import type {
  DestinationRequirements,
  DestinationRequirementsParams
} from '../shared/contracts';
import { BASELINE_ACCESS_MATRIX } from './baselineMatrix';

import { getPassportIndexEntry } from './supportedPassportIndexData';

export const SOURCED_REGULATIONS: readonly DestinationRequirements[] = [
  // ==========================================================================
  // 1. INDIA -> JAPAN (Tourism Visa Required)
  // ==========================================================================
  {
    recordId: 'reg-IN-JP-tourism',
    passportId: 'IN',
    destinationId: 'JP',
    accessLevel: 'visa_required',
    purpose: 'tourism',
    maxStayDays: 15,
    validityPeriod: '3 months (Single Entry)',
    documents: [
      { title: 'Valid Passport', required: true, description: 'Must have at least 2 blank pages and 6 months validity.' },
      { title: 'Visa Application Form', required: true, description: 'Completed form with one 2x2 inch photograph taken within 6 months.' },
      { title: 'Confirmed Flight Itinerary', required: true, description: 'Round-trip air ticket booking.' },
      { title: 'Proof of Financial Solvency', required: true, description: 'Latest 6 months bank statement with bank seal and ITR-V for past 2 years.' },
      { title: 'Daily Schedule in Japan', required: true, description: 'Day-by-day travel itinerary with accommodation contact details.' }
    ],
    applicationChannel: {
      type: 'visa_center',
      name: 'VFS Global Japan Application Centre',
      url: 'https://visa.vfsglobal.com/ind/en/jpn',
      notes: 'Submission in person or through accredited travel agency'
    },
    fees: {
      amount: 500,
      currency: 'INR',
      notes: 'Consular visa fee; VFS handling service fee extra'
    },
    processingTime: {
      estimateDaysMin: 5,
      estimateDaysMax: 8,
      unit: 'days',
      isExpeditedAvailable: false,
      notes: 'Working days from receipt by the Embassy of Japan'
    },
    sources: [
      {
        id: 'src-mofa-japan-visas',
        title: 'Exemption of Visa (Short-Term Stay)',
        issuingAuthority: 'Ministry of Foreign Affairs of Japan (MOFA)',
        url: 'https://www.mofa.go.jp/j_info/visit/visa/short/novisa.html',
        retrievedAt: '2026-10-10T12:00:00Z',
        verifiedAt: '2026-10-10T12:00:00Z',
        notes: 'List of visa exemption countries and short-stay tourism requirements'
      }
    ],
    verifiedAt: '2026-10-10T12:00:00Z',
    unresolvedConditions: [],
    isSimulated: false,
    baselineAccessLevel: 'visa_required'
  },

  // ==========================================================================
  // 2. SINGAPORE -> JAPAN (Visa Free Exemption)
  // ==========================================================================
  {
    recordId: 'reg-SG-JP-tourism',
    passportId: 'SG',
    destinationId: 'JP',
    accessLevel: 'visa_free',
    purpose: 'tourism',
    maxStayDays: 90,
    validityPeriod: 'Continuous 90-day stay per entry',
    documents: [
      { title: 'Valid Singapore Passport', required: true, description: 'Biometric passport valid for duration of stay.' },
      { title: 'Confirmed Return/Onward Ticket', required: true, description: 'Proof of departure from Japan within 90 days.' },
      { title: 'Visit Japan Web Declaration', required: false, description: 'Recommended electronic customs and immigration pre-registration.' }
    ],
    applicationChannel: {
      type: 'none',
      name: 'No prior application required',
      url: 'https://www.vjw.digital.go.jp/',
      notes: 'Entry granted at Japanese immigration checkpoint upon arrival'
    },
    fees: {
      amount: 0,
      currency: 'JPY',
      notes: 'No consular or entry fee'
    },
    processingTime: {
      estimateDaysMin: 0,
      estimateDaysMax: 0,
      unit: 'hours',
      isExpeditedAvailable: false,
      notes: 'Instant biometric clearance upon arrival'
    },
    sources: [
      {
        id: 'src-mofa-japan-sg',
        title: 'Reciprocal Visa Exemption Arrangements',
        issuingAuthority: 'Ministry of Foreign Affairs of Japan (MOFA)',
        url: 'https://www.mofa.go.jp/j_info/visit/visa/short/novisa.html',
        retrievedAt: '2026-10-10T12:00:00Z',
        verifiedAt: '2026-10-10T12:00:00Z'
      }
    ],
    verifiedAt: '2026-10-10T12:00:00Z',
    unresolvedConditions: [],
    isSimulated: false,
    baselineAccessLevel: 'visa_free'
  },

  // ==========================================================================
  // 3. INDIA -> GERMANY (Schengen Tourist Visa)
  // ==========================================================================
  {
    recordId: 'reg-IN-DE-tourism',
    passportId: 'IN',
    destinationId: 'DE',
    accessLevel: 'visa_required',
    purpose: 'tourism',
    maxStayDays: 90,
    validityPeriod: 'Up to 90 days in any 180-day period across Schengen zone',
    documents: [
      { title: 'Valid Passport', required: true, description: 'Issued within past 10 years with at least 3 months validity beyond intended departure.' },
      { title: 'Schengen Visa Application Form (VIDEX)', required: true, description: 'Completed and signed online VIDEX application form.' },
      { title: 'Travel Health Insurance', required: true, description: 'Minimum coverage of EUR 30,000 valid across all Schengen states.' },
      { title: 'Flight & Hotel Reservation', required: true, description: 'Detailed travel plan and proof of accommodation.' },
      { title: 'Proof of Financial Means', required: true, description: 'Personal bank statements showing regular income for past 3 months.' }
    ],
    applicationChannel: {
      type: 'visa_center',
      name: 'VFS Global Germany Centre',
      url: 'https://visa.vfsglobal.com/ind/en/deu',
      notes: 'Mandatory in-person biometric appointment'
    },
    fees: {
      amount: 90,
      currency: 'EUR',
      waivedFor: ['Children under 6 years of age'],
      notes: 'Standard Schengen short-stay visa fee for adults (EUR 90 as of 2024 revised EU fee)'
    },
    processingTime: {
      estimateDaysMin: 15,
      estimateDaysMax: 45,
      unit: 'days',
      isExpeditedAvailable: false,
      notes: 'Recommended to apply at least 4 weeks before scheduled departure'
    },
    sources: [
      {
        id: 'src-germany-diplo-schengen',
        title: 'Short-Stay Schengen Visa Regulations',
        issuingAuthority: 'Federal Foreign Office of Germany (Auswärtiges Amt)',
        url: 'https://www.auswaertiges-amt.de/en/visa-service/buergerservice/faq',
        retrievedAt: '2026-10-10T12:00:00Z',
        verifiedAt: '2026-10-10T12:00:00Z'
      }
    ],
    verifiedAt: '2026-10-10T12:00:00Z',
    unresolvedConditions: [],
    isSimulated: false,
    baselineAccessLevel: 'visa_required'
  },

  // ==========================================================================
  // 4. UNITED STATES -> GERMANY (Schengen Visa Waiver)
  // ==========================================================================
  {
    recordId: 'reg-US-DE-tourism',
    passportId: 'US',
    destinationId: 'DE',
    accessLevel: 'visa_free',
    purpose: 'tourism',
    maxStayDays: 90,
    validityPeriod: '90 days within any 180-day window across Schengen area',
    documents: [
      { title: 'Valid US Passport', required: true, description: 'Must be valid for at least 3 months beyond departure date from Schengen.' },
      { title: 'Proof of Funds & Return Ticket', required: false, description: 'May be requested by border control officers upon arrival.' }
    ],
    applicationChannel: {
      type: 'none',
      name: 'Direct entry at border control',
      url: 'https://www.bmi.bund.de/EN',
      notes: 'ETIAS pre-authorization required once European travel authorization system is active'
    },
    fees: {
      amount: 0,
      currency: 'USD',
      notes: 'No fee for standard visa waiver entry'
    },
    processingTime: {
      estimateDaysMin: 0,
      estimateDaysMax: 0,
      unit: 'hours',
      isExpeditedAvailable: false,
      notes: 'Immediate entry clearance at border control'
    },
    sources: [
      {
        id: 'src-bmi-germany-us',
        title: 'Visa Requirements for US Citizens Visiting Germany',
        issuingAuthority: 'German Missions in the United States',
        url: 'https://www.germany.info/us-en/service/visa',
        retrievedAt: '2026-10-10T12:00:00Z',
        verifiedAt: '2026-10-10T12:00:00Z'
      }
    ],
    verifiedAt: '2026-10-10T12:00:00Z',
    unresolvedConditions: [],
    isSimulated: false,
    baselineAccessLevel: 'visa_free'
  },

  // ==========================================================================
  // 5. GERMANY -> INDIA (Indian e-Tourist Visa)
  // ==========================================================================
  {
    recordId: 'reg-DE-IN-tourism',
    passportId: 'DE',
    destinationId: 'IN',
    accessLevel: 'evisa',
    purpose: 'tourism',
    maxStayDays: 30,
    validityPeriod: '30 days double entry (also available as 1-year and 5-year multiple entry)',
    documents: [
      { title: 'Valid German Passport', required: true, description: 'Must have at least 6 months validity from date of arrival and two blank pages.' },
      { title: 'Recent Digital Photograph', required: true, description: 'White background, square aspect ratio.' },
      { title: 'Passport Bio Page Copy', required: true, description: 'PDF scan showing personal details.' }
    ],
    applicationChannel: {
      type: 'online_portal',
      name: 'Government of India Official e-Visa Portal',
      url: 'https://indianvisaonline.gov.in/evisa/',
      notes: 'Must apply online at least 4 calendar days before departure'
    },
    fees: {
      amount: 25,
      currency: 'USD',
      notes: 'April to June USD 10; July to March USD 25 for 30-day tourist eVisa'
    },
    processingTime: {
      estimateDaysMin: 2,
      estimateDaysMax: 4,
      unit: 'days',
      isExpeditedAvailable: false,
      notes: 'Electronic Travel Authorization (ETA) sent by email'
    },
    sources: [
      {
        id: 'src-india-boi-evisa',
        title: 'e-Visa Eligibility and Guidelines',
        issuingAuthority: 'Bureau of Immigration, Ministry of Home Affairs, India',
        url: 'https://indianvisaonline.gov.in/evisa/tvoa.html',
        retrievedAt: '2026-10-10T12:00:00Z',
        verifiedAt: '2026-10-10T12:00:00Z'
      }
    ],
    verifiedAt: '2026-10-10T12:00:00Z',
    unresolvedConditions: [],
    isSimulated: false,
    baselineAccessLevel: 'evisa'
  },

  // ==========================================================================
  // 6. SOUTH AFRICA -> UNITED KINGDOM (Standard Visitor Visa)
  // ==========================================================================
  {
    recordId: 'reg-ZA-GB-tourism',
    passportId: 'ZA',
    destinationId: 'GB',
    accessLevel: 'visa_required',
    purpose: 'tourism',
    maxStayDays: 180,
    validityPeriod: '6 months multiple entry',
    documents: [
      { title: 'Valid Passport', required: true, description: 'Valid for entire duration of intended stay with blank page.' },
      { title: 'Proof of Sufficient Funds', required: true, description: 'Bank statements or pay slips covering past 6 months.' },
      { title: 'Details of Travel Plans', required: true, description: 'Where you will stay and planned itinerary.' },
      { title: 'Proof of Ties to Home Country', required: true, description: 'Employment letter, property, or family ties.' }
    ],
    applicationChannel: {
      type: 'visa_center',
      name: 'UK Visas and Immigration (TLScontact / VFS)',
      url: 'https://www.gov.uk/standard-visitor',
      notes: 'Apply online and book biometric appointment at visa application centre'
    },
    fees: {
      amount: 115,
      currency: 'GBP',
      notes: 'Standard 6-month visitor visa fee as of 2024 UK Home Office schedule'
    },
    processingTime: {
      estimateDaysMin: 15,
      estimateDaysMax: 21,
      unit: 'days',
      isExpeditedAvailable: true,
      notes: 'Priority visa service available for an additional fee'
    },
    sources: [
      {
        id: 'src-uk-gov-visas',
        title: 'Standard Visitor Visa Guidance',
        issuingAuthority: 'UK Home Office & UK Visas and Immigration',
        url: 'https://www.gov.uk/standard-visitor/apply',
        retrievedAt: '2026-10-10T12:00:00Z',
        verifiedAt: '2026-10-10T12:00:00Z'
      }
    ],
    verifiedAt: '2026-10-10T12:00:00Z',
    unresolvedConditions: [],
    isSimulated: false,
    baselineAccessLevel: 'visa_required'
  },

  // ==========================================================================
  // 7. PHILIPPINES -> SINGAPORE (ASEAN Bilateral Exemption)
  // ==========================================================================
  {
    recordId: 'reg-PH-SG-tourism',
    passportId: 'PH',
    destinationId: 'SG',
    accessLevel: 'visa_free',
    purpose: 'tourism',
    maxStayDays: 30,
    validityPeriod: '30-day visit pass issued upon entry',
    documents: [
      { title: 'Philippine Passport', required: true, description: 'Must have at least 6 months validity beyond arrival date.' },
      { title: 'SG Arrival Card (SGAC)', required: true, description: 'Electronic health and arrival declaration submitted within 3 days prior.' },
      { title: 'Confirmed Onward Ticket', required: true, description: 'Return ticket to Philippines or onward flight confirmation.' }
    ],
    applicationChannel: {
      type: 'online_portal',
      name: 'Immigration & Checkpoints Authority (ICA) SGAC',
      url: 'https://eservices.ica.gov.sg/sgarrivalcard/',
      notes: 'Free SGAC online declaration; entry clearance at checkpoint'
    },
    fees: {
      amount: 0,
      currency: 'SGD',
      notes: 'SG Arrival Card and visit pass are free of charge'
    },
    processingTime: {
      estimateDaysMin: 0,
      estimateDaysMax: 0,
      unit: 'hours',
      isExpeditedAvailable: false,
      notes: 'Automated clearance gate entry for eligible e-passports'
    },
    sources: [
      {
        id: 'src-ica-singapore-visas',
        title: 'Entry Requirements and Visa Exemption for ASEAN Nationals',
        issuingAuthority: 'Immigration & Checkpoints Authority Singapore (ICA)',
        url: 'https://www.ica.gov.sg/enter-transit-depart/entering-singapore',
        retrievedAt: '2026-10-10T12:00:00Z',
        verifiedAt: '2026-10-10T12:00:00Z'
      }
    ],
    verifiedAt: '2026-10-10T12:00:00Z',
    unresolvedConditions: [],
    isSimulated: false,
    baselineAccessLevel: 'visa_free'
  },

  // ==========================================================================
  // 8. NIGERIA -> KENYA (Kenya Electronic Travel Authorisation)
  // ==========================================================================
  {
    recordId: 'reg-NG-KE-tourism',
    passportId: 'NG',
    destinationId: 'KE',
    accessLevel: 'evisa',
    purpose: 'tourism',
    maxStayDays: 90,
    validityPeriod: 'Single entry, valid for entry within 3 months of issue',
    documents: [
      { title: 'Nigerian Passport', required: true, description: 'Valid for at least 6 months with one blank page.' },
      { title: 'Passport Bio Page Scan & Photo', required: true, description: 'Clear colour image.' },
      { title: 'Confirmed Return Air Ticket', required: true, description: 'Booking confirmation.' },
      { title: 'Proof of Accommodation', required: true, description: 'Hotel confirmation or host invitation letter.' }
    ],
    applicationChannel: {
      type: 'online_portal',
      name: 'Kenya Electronic Travel Authorisation (eTA) Official Portal',
      url: 'https://www.etakenya.go.ke/',
      notes: 'Mandatory online application prior to boarding'
    },
    fees: {
      amount: 32.5,
      currency: 'USD',
      notes: 'Standard eTA government processing fee per traveller'
    },
    processingTime: {
      estimateDaysMin: 1,
      estimateDaysMax: 3,
      unit: 'days',
      isExpeditedAvailable: false,
      notes: 'Average processing window is 72 hours'
    },
    sources: [
      {
        id: 'src-kenya-immigration-eta',
        title: 'Kenya Electronic Travel Authorisation Guidelines',
        issuingAuthority: 'State Department for Immigration and Citizen Services, Kenya',
        url: 'https://www.etakenya.go.ke/en/pages/faqs',
        retrievedAt: '2026-10-10T12:00:00Z',
        verifiedAt: '2026-10-10T12:00:00Z'
      }
    ],
    verifiedAt: '2026-10-10T12:00:00Z',
    unresolvedConditions: [],
    isSimulated: false,
    baselineAccessLevel: 'evisa'
  }
];

/**
 * Resolves destination requirements for any passport-destination pair.
 * Returns unreviewed snapshot classifications with honest missing fields;
 * the legacy SOURCED_REGULATIONS above are pending claim-level review.
 */
export function resolveDestinationRequirements(
  params: DestinationRequirementsParams,
  baselineAccess?: AccessLevel,
  usePassportIndex = true
): DestinationRequirements {
  const { passportId, destinationId, travellerContext } = params;
  const purpose = travellerContext?.purpose ?? 'tourism';
  const applicable = purpose === 'tourism' &&
    (!travellerContext?.passportType || travellerContext.passportType === 'ordinary');
  const accessLevel = applicable
    ? baselineAccess ?? BASELINE_ACCESS_MATRIX[passportId]?.[destinationId] ?? 'unknown'
    : 'unknown';
  const entry = applicable && usePassportIndex && passportId !== destinationId
    ? getPassportIndexEntry(passportId, destinationId) : undefined;
  return {
    recordId: `unreviewed-${passportId}-${destinationId}-${purpose}`,
    passportId,
    destinationId,
    purpose,
    accessLevel,
    maxStayDays: entry?.maxStayDays ?? null,
    documents: [],
    applicationChannel: { type: 'none', name: 'Not verified', notes: 'Application information is unavailable.' },
    sources: entry ? [{
      id: 'src-passport-index-snapshot',
      title: 'Bundled Passport Index snapshot (third-party)',
      issuingAuthority: 'imorte/passport-index-data contributors',
      url: 'https://github.com/imorte/passport-index-data',
      retrievedAt: '',
      verifiedAt: '',
      notes: `Bundled classification: ${entry.rawRequirement}. Snapshot dates and official applicability have not been verified.`
    }] : [],
    verifiedAt: '',
    unresolvedConditions: [
      'Detailed passport-specific requirements have not been verified against official guidance.',
      ...(applicable ? ['The baseline models ordinary-passport tourism; residency, existing visas and other exceptions are not resolved.']
        : ['The tourism baseline does not establish requirements for this purpose or passport type.']),
      ...(travellerContext?.durationDays !== undefined ? ['The requested duration has not been validated against entry conditions.'] : []),
      ...(passportId === destinationId ? ['Domestic entry is modeled as visa-free for scoring; this is not an international visa requirement.'] : [])
    ],
    isSimulated: false
  };
}
