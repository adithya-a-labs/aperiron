/**
 * aperiron: The Passport Paradox
 * Border Market Fictional Treaties
 *
 * 16 strategic treaties designed for the Border Market simulation.
 * Includes bilateral, multilateral, regional, and special category pacts
 * with costs ranging between 15 and 60 Influence Credits.
 *
 * @see docs/PRODUCT.md
 * @see docs/CONTRACTS.md
 */

import { Treaty } from '../shared/contracts';

export const TREATIES: readonly Treaty[] = [
  // --------------------------------------------------------------------------
  // Bilateral Accords (Cost: 15 - 25 Credits)
  // --------------------------------------------------------------------------
  {
    id: 'treaty-in-jp-fasttrack',
    name: 'India–Japan Bilateral FastTrack Mobility Accord',
    description: 'Bilateral agreement upgrading Indian travellers to Visa on Arrival in Japan and vice versa.',
    cost: 20,
    category: 'bilateral',
    grants: [
      { passportId: 'IN', destinationId: 'JP', grantedAccessLevel: 'visa_on_arrival' },
      { passportId: 'JP', destinationId: 'IN', grantedAccessLevel: 'visa_free' }
    ]
  },
  {
    id: 'treaty-br-ae-strategic',
    name: 'Brazil–UAE Strategic Friendship Accord',
    description: 'Upgrades tourism and commercial movement between Brazil and the UAE to mutual Visa-Free access.',
    cost: 15,
    category: 'bilateral',
    grants: [
      { passportId: 'BR', destinationId: 'AE', grantedAccessLevel: 'visa_free' },
      { passportId: 'AE', destinationId: 'BR', grantedAccessLevel: 'visa_free' }
    ]
  },
  {
    id: 'treaty-gb-za-heritage',
    name: 'UK–South Africa Commonwealth Heritage Link',
    description: 'Restores Visa-Free entry for South African citizens visiting the United Kingdom for stays up to 90 days.',
    cost: 25,
    category: 'bilateral',
    grants: [
      { passportId: 'ZA', destinationId: 'GB', grantedAccessLevel: 'visa_free' },
      { passportId: 'GB', destinationId: 'ZA', grantedAccessLevel: 'visa_free' }
    ]
  },
  {
    id: 'treaty-tr-de-dialogue',
    name: 'German–Turkish Mobility Partnership',
    description: 'Grants Turkish passport holders streamlined eVisa entry into Germany and the Schengen travel area.',
    cost: 20,
    category: 'bilateral',
    grants: [
      { passportId: 'TR', destinationId: 'DE', grantedAccessLevel: 'evisa' }
    ]
  },
  {
    id: 'treaty-ph-kr-cultural',
    name: 'Philippines–South Korea Cultural Exchange Pact',
    description: 'Grants Philippine citizens Visa-Free entry for short-term tourism in South Korea.',
    cost: 18,
    category: 'bilateral',
    grants: [
      { passportId: 'PH', destinationId: 'KR', grantedAccessLevel: 'visa_free' }
    ]
  },
  {
    id: 'treaty-ng-ke-trade',
    name: 'Nigeria–Kenya Intra-African Commerce Accord',
    description: 'Eliminates electronic travel fees and grants mutual unconditional Visa-Free access between Nigeria and Kenya.',
    cost: 15,
    category: 'bilateral',
    grants: [
      { passportId: 'NG', destinationId: 'KE', grantedAccessLevel: 'visa_free' }
    ]
  },

  // --------------------------------------------------------------------------
  // Regional & Multilateral Corridors (Cost: 25 - 40 Credits)
  // --------------------------------------------------------------------------
  {
    id: 'treaty-transpacific-freedom',
    name: 'Trans-Pacific Freedom of Movement Accord',
    description: 'Unlocks Visa-Free travel across key Pacific Rim destinations (US, Canada, Japan, Australia, New Zealand) for partner Asian nations.',
    cost: 40,
    category: 'multilateral',
    grants: [
      { passportId: 'SG', destinationId: 'AU', grantedAccessLevel: 'visa_free' },
      { passportId: 'JP', destinationId: 'AU', grantedAccessLevel: 'visa_free' },
      { passportId: 'PH', destinationId: 'AU', grantedAccessLevel: 'evisa' },
      { passportId: 'IN', destinationId: 'AU', grantedAccessLevel: 'evisa' }
    ]
  },
  {
    id: 'treaty-schengen-mercosur',
    name: 'Schengen–Mercosur Travel Bridge',
    description: 'Comprehensive mobility bridge granting Visa-Free reciprocal access between South America and European member states.',
    cost: 35,
    category: 'regional',
    grants: [
      { passportId: 'BR', destinationId: 'DE', grantedAccessLevel: 'visa_free' },
      { passportId: 'BR', destinationId: 'FR', grantedAccessLevel: 'visa_free' },
      { passportId: 'BR', destinationId: 'IT', grantedAccessLevel: 'visa_free' },
      { passportId: 'BR', destinationId: 'ES', grantedAccessLevel: 'visa_free' },
      { passportId: 'BR', destinationId: 'CH', grantedAccessLevel: 'visa_free' }
    ]
  },
  {
    id: 'treaty-panafrican-unified',
    name: 'Pan-African Unified Passport Accord',
    description: 'Accelerates the African Continental Free Trade Area by granting reciprocal Visa-Free or VoA access across all African destinations.',
    cost: 30,
    category: 'regional',
    grants: [
      { passportId: 'NG', destinationId: 'ZA', grantedAccessLevel: 'visa_free' },
      { passportId: 'NG', destinationId: 'EG', grantedAccessLevel: 'visa_on_arrival' },
      { passportId: 'NG', destinationId: 'MA', grantedAccessLevel: 'visa_free' },
      { passportId: 'ZA', destinationId: 'NG', grantedAccessLevel: 'visa_free' },
      { passportId: 'ZA', destinationId: 'EG', grantedAccessLevel: 'visa_on_arrival' },
      { passportId: 'ZA', destinationId: 'MA', grantedAccessLevel: 'visa_free' }
    ]
  },
  {
    id: 'treaty-asean-gcc-corridor',
    name: 'ASEAN–GCC Comprehensive Travel Corridor',
    description: 'Establishes streamlined Visa-Free or instant eVisa mobility between Southeast Asian nations and the Gulf States (UAE, Qatar).',
    cost: 32,
    category: 'multilateral',
    grants: [
      { passportId: 'PH', destinationId: 'AE', grantedAccessLevel: 'visa_free' },
      { passportId: 'PH', destinationId: 'QA', grantedAccessLevel: 'visa_free' },
      { passportId: 'IN', destinationId: 'AE', grantedAccessLevel: 'visa_on_arrival' },
      { passportId: 'IN', destinationId: 'QA', grantedAccessLevel: 'visa_free' }
    ]
  },
  {
    id: 'treaty-eurasian-gateway',
    name: 'Eurasian Silk Route Travel Compact',
    description: 'Streamlines travel through the Eurasian crossroads, upgrading Turkey and Georgia access for Asian and African passport holders.',
    cost: 25,
    category: 'regional',
    grants: [
      { passportId: 'IN', destinationId: 'TR', grantedAccessLevel: 'evisa' },
      { passportId: 'IN', destinationId: 'GE', grantedAccessLevel: 'evisa' },
      { passportId: 'PH', destinationId: 'TR', grantedAccessLevel: 'evisa' },
      { passportId: 'PH', destinationId: 'GE', grantedAccessLevel: 'evisa' },
      { passportId: 'ZA', destinationId: 'TR', grantedAccessLevel: 'visa_free' },
      { passportId: 'ZA', destinationId: 'GE', grantedAccessLevel: 'visa_free' }
    ]
  },

  // --------------------------------------------------------------------------
  // Special & High-Impact Accords (Cost: 45 - 60 Credits)
  // --------------------------------------------------------------------------
  {
    id: 'treaty-global-us-open-skies',
    name: 'United States Global ESTA Expansion Act',
    description: 'Extends US Visa Waiver (ESTA) privileges to all supported middle-mobility partner passports.',
    cost: 50,
    category: 'special',
    grants: [
      { passportId: 'BR', destinationId: 'US', grantedAccessLevel: 'evisa' },
      { passportId: 'ZA', destinationId: 'US', grantedAccessLevel: 'evisa' },
      { passportId: 'AE', destinationId: 'US', grantedAccessLevel: 'visa_free' },
      { passportId: 'TR', destinationId: 'US', grantedAccessLevel: 'evisa' }
    ]
  },
  {
    id: 'treaty-stem-research-mobility',
    name: 'Global Academic & STEM Research Accord',
    description: 'Special multi-nation mobility convention granting expedited Visa-Free travel for scientists and engineers into North America and Western Europe.',
    cost: 45,
    category: 'special',
    grants: [
      { passportId: 'IN', destinationId: 'DE', grantedAccessLevel: 'evisa' },
      { passportId: 'IN', destinationId: 'FR', grantedAccessLevel: 'evisa' },
      { passportId: 'IN', destinationId: 'GB', grantedAccessLevel: 'evisa' },
      { passportId: 'NG', destinationId: 'GB', grantedAccessLevel: 'evisa' },
      { passportId: 'PH', destinationId: 'DE', grantedAccessLevel: 'evisa' }
    ]
  },
  {
    id: 'treaty-island-nations-network',
    name: 'Global Island & Eco-Tourism Visa Waiver Network',
    description: 'Universal freedom of movement pact across tropical and eco-tourism island economies (Fiji, Thailand, Indonesia).',
    cost: 28,
    category: 'special',
    grants: [
      { passportId: '*', destinationId: 'FJ', grantedAccessLevel: 'visa_free' },
      { passportId: '*', destinationId: 'TH', grantedAccessLevel: 'visa_free' },
      { passportId: '*', destinationId: 'ID', grantedAccessLevel: 'visa_free' }
    ]
  },
  {
    id: 'treaty-universal-transit-compact',
    name: 'International Seamless Air Transit Compact',
    description: 'Eliminates all airport transit visas and guarantees seamless 72-hour air transit waivers in major global hubs (UK, Germany, France, Japan, UAE).',
    cost: 35,
    category: 'special',
    grants: [
      { passportId: '*', destinationId: 'AE', grantedAccessLevel: 'visa_free' },
      { passportId: '*', destinationId: 'QA', grantedAccessLevel: 'visa_free' }
    ]
  },
  {
    id: 'treaty-global-schengen-harmonization',
    name: 'Grand Schengen Harmonization Treaty',
    description: 'Flagship multilateral treaty granting Visa-Free entry across all European Schengen destinations for partner nations.',
    cost: 60,
    category: 'special',
    grants: [
      { passportId: 'TR', destinationId: 'DE', grantedAccessLevel: 'visa_free' },
      { passportId: 'TR', destinationId: 'FR', grantedAccessLevel: 'visa_free' },
      { passportId: 'TR', destinationId: 'IT', grantedAccessLevel: 'visa_free' },
      { passportId: 'TR', destinationId: 'ES', grantedAccessLevel: 'visa_free' },
      { passportId: 'TR', destinationId: 'CH', grantedAccessLevel: 'visa_free' },
      { passportId: 'ZA', destinationId: 'DE', grantedAccessLevel: 'visa_free' },
      { passportId: 'ZA', destinationId: 'FR', grantedAccessLevel: 'visa_free' },
      { passportId: 'ZA', destinationId: 'IT', grantedAccessLevel: 'visa_free' }
    ]
  }
];
