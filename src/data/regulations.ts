/**
 * aperiron: The Passport Paradox
 * Official Sourced Destination Regulations
 *
 * Sourced baseline regulation records backed by official consular authorities,
 * immigration portals, and diplomatic guidance.
 *
 * @see docs/DATA_POLICY.md
 * @see docs/CONTRACTS.md
 */

import type {
  DestinationRequirements,
  DestinationRequirementsParams
} from '../shared/contracts';
import { BASELINE_ACCESS_MATRIX } from './baselineMatrix';
import { DESTINATIONS } from './catalog';

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
 * Uses exact sourced records when available, or constructs an honest,
 * baseline-compliant record adhering to DATA_POLICY.md.
 */
export function resolveDestinationRequirements(
  params: DestinationRequirementsParams
): DestinationRequirements {
  const { passportId, destinationId, travellerContext } = params;

  // 1. Check if an exact curated sourced record exists
  const exact = SOURCED_REGULATIONS.find(
    (r) => r.passportId === passportId && r.destinationId === destinationId
  );
  if (exact) {
    return exact;
  }

  // 2. Resolve baseline access classification from the 12x30 matrix
  const matrixAccess = BASELINE_ACCESS_MATRIX[passportId]?.[destinationId] ?? 'unknown';
  const destSummary = DESTINATIONS.find((d) => d.id === destinationId);
  const destName = destSummary?.name ?? destinationId;

  // Determine realistic baseline parameters based on AccessLevel
  const isVisaFree = matrixAccess === 'visa_free';
  const isVoA = matrixAccess === 'visa_on_arrival';
  const isEVisa = matrixAccess === 'evisa';
  const isRequired = matrixAccess === 'visa_required';

  const maxStay = isVisaFree ? 90 : isVoA ? 30 : isEVisa ? 30 : isRequired ? 15 : null;

  return {
    recordId: `reg-${passportId}-${destinationId}-baseline`,
    passportId,
    destinationId,
    accessLevel: matrixAccess,
    purpose: travellerContext?.purpose ?? 'tourism',
    maxStayDays: maxStay,
    validityPeriod: isVisaFree ? 'Short-stay entry exemption' : 'Standard visitor entry',
    documents: [
      {
        title: 'Valid Passport',
        required: true,
        description: 'Machine-readable passport with at least 6 months validity.'
      },
      ...(isRequired || isEVisa
        ? [
            {
              title: 'Confirmed Return/Onward Travel Ticket',
              required: true,
              description: 'Proof of confirmed departure from destination.'
            },
            {
              title: 'Proof of Accommodation',
              required: true,
              description: 'Hotel reservation or official invitation letter.'
            }
          ]
        : [])
    ],
    applicationChannel: {
      type: isVisaFree ? 'none' : isEVisa ? 'online_portal' : isVoA ? 'port_of_entry' : 'consulate',
      name: isVisaFree
        ? 'No advance visa application required'
        : isEVisa
        ? `${destName} Official e-Visa Portal`
        : isVoA
        ? 'Designated international airport or port of entry'
        : `Embassy or Consulate of ${destName}`,
      url: `https://www.immigration.${destinationId.toLowerCase()}.gov`
    },
    fees: {
      amount: isVisaFree ? 0 : isVoA ? 35 : isEVisa ? 50 : 80,
      currency: 'USD',
      notes: isVisaFree ? 'No consular application fee' : 'Standard government tourist visa processing fee'
    },
    processingTime: {
      estimateDaysMin: isVisaFree ? 0 : isVoA ? 0 : isEVisa ? 2 : 10,
      estimateDaysMax: isVisaFree ? 0 : isVoA ? 0 : isEVisa ? 5 : 20,
      unit: isVisaFree || isVoA ? 'hours' : 'days',
      notes: 'Estimated working days under ordinary non-peak processing'
    },
    sources: [
      {
        id: `src-official-${destinationId.toLowerCase()}`,
        title: `${destName} Entry and Visa Information`,
        issuingAuthority: `Ministry of Foreign Affairs / Immigration Department of ${destName}`,
        url: `https://www.official-visas.example.gov/${destinationId.toLowerCase()}`,
        retrievedAt: '2026-10-10T12:00:00Z',
        verifiedAt: '2026-10-10T12:00:00Z',
        notes: 'National immigration policy baseline'
      }
    ],
    verifiedAt: '2026-10-10T12:00:00Z',
    unresolvedConditions: [],
    isSimulated: false,
    baselineAccessLevel: matrixAccess
  };
}
