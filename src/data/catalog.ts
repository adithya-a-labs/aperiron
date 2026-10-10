/**
 * aperiron: The Passport Paradox
 * Data Catalog
 *
 * Defines the 12 supported passports and 30 supported destination countries
 * for the v1 prototype dataset.
 *
 * @see docs/PRODUCT.md
 * @see docs/DATA_POLICY.md
 */

import type { Catalog, CountrySummary } from '../shared/contracts';
import { TREATIES } from './treaties';

export const PASSPORTS: readonly CountrySummary[] = [
  { id: 'SG', name: 'Singapore', continent: 'Asia', flagEmoji: '🇸🇬', isPassportSupported: true, isDestinationSupported: true },
  { id: 'DE', name: 'Germany', continent: 'Europe', flagEmoji: '🇩🇪', isPassportSupported: true, isDestinationSupported: true },
  { id: 'JP', name: 'Japan', continent: 'Asia', flagEmoji: '🇯🇵', isPassportSupported: true, isDestinationSupported: true },
  { id: 'US', name: 'United States', continent: 'North America', flagEmoji: '🇺🇸', isPassportSupported: true, isDestinationSupported: true },
  { id: 'GB', name: 'United Kingdom', continent: 'Europe', flagEmoji: '🇬🇧', isPassportSupported: true, isDestinationSupported: true },
  { id: 'AE', name: 'United Arab Emirates', continent: 'Middle East', flagEmoji: '🇦🇪', isPassportSupported: true, isDestinationSupported: true },
  { id: 'BR', name: 'Brazil', continent: 'South America', flagEmoji: '🇧🇷', isPassportSupported: true, isDestinationSupported: true },
  { id: 'ZA', name: 'South Africa', continent: 'Africa', flagEmoji: '🇿🇦', isPassportSupported: true, isDestinationSupported: true },
  { id: 'IN', name: 'India', continent: 'Asia', flagEmoji: '🇮🇳', isPassportSupported: true, isDestinationSupported: true },
  { id: 'TR', name: 'Turkey', continent: 'Europe/Asia', flagEmoji: '🇹🇷', isPassportSupported: true, isDestinationSupported: true },
  { id: 'PH', name: 'Philippines', continent: 'Asia', flagEmoji: '🇵🇭', isPassportSupported: true, isDestinationSupported: true },
  { id: 'NG', name: 'Nigeria', continent: 'Africa', flagEmoji: '🇳🇬', isPassportSupported: true, isDestinationSupported: true }
] as const;

export const DESTINATIONS: readonly CountrySummary[] = [
  // Asia
  { id: 'SG', name: 'Singapore', continent: 'Asia', flagEmoji: '🇸🇬', isPassportSupported: true, isDestinationSupported: true },
  { id: 'JP', name: 'Japan', continent: 'Asia', flagEmoji: '🇯🇵', isPassportSupported: true, isDestinationSupported: true },
  { id: 'IN', name: 'India', continent: 'Asia', flagEmoji: '🇮🇳', isPassportSupported: true, isDestinationSupported: true },
  { id: 'TH', name: 'Thailand', continent: 'Asia', flagEmoji: '🇹🇭', isPassportSupported: false, isDestinationSupported: true },
  { id: 'ID', name: 'Indonesia', continent: 'Asia', flagEmoji: '🇮🇩', isPassportSupported: false, isDestinationSupported: true },
  { id: 'KR', name: 'South Korea', continent: 'Asia', flagEmoji: '🇰🇷', isPassportSupported: false, isDestinationSupported: true },
  { id: 'VN', name: 'Vietnam', continent: 'Asia', flagEmoji: '🇻🇳', isPassportSupported: false, isDestinationSupported: true },
  { id: 'AE', name: 'United Arab Emirates', continent: 'Middle East', flagEmoji: '🇦🇪', isPassportSupported: true, isDestinationSupported: true },
  { id: 'QA', name: 'Qatar', continent: 'Middle East', flagEmoji: '🇶🇦', isPassportSupported: false, isDestinationSupported: true },

  // Europe
  { id: 'DE', name: 'Germany', continent: 'Europe', flagEmoji: '🇩🇪', isPassportSupported: true, isDestinationSupported: true },
  { id: 'GB', name: 'United Kingdom', continent: 'Europe', flagEmoji: '🇬🇧', isPassportSupported: true, isDestinationSupported: true },
  { id: 'FR', name: 'France', continent: 'Europe', flagEmoji: '🇫🇷', isPassportSupported: false, isDestinationSupported: true },
  { id: 'IT', name: 'Italy', continent: 'Europe', flagEmoji: '🇮🇹', isPassportSupported: false, isDestinationSupported: true },
  { id: 'ES', name: 'Spain', continent: 'Europe', flagEmoji: '🇪🇸', isPassportSupported: false, isDestinationSupported: true },
  { id: 'CH', name: 'Switzerland', continent: 'Europe', flagEmoji: '🇨🇭', isPassportSupported: false, isDestinationSupported: true },
  { id: 'TR', name: 'Turkey', continent: 'Europe/Asia', flagEmoji: '🇹🇷', isPassportSupported: true, isDestinationSupported: true },
  { id: 'GE', name: 'Georgia', continent: 'Europe/Asia', flagEmoji: '🇬🇪', isPassportSupported: false, isDestinationSupported: true },

  // Americas
  { id: 'US', name: 'United States', continent: 'North America', flagEmoji: '🇺🇸', isPassportSupported: true, isDestinationSupported: true },
  { id: 'CA', name: 'Canada', continent: 'North America', flagEmoji: '🇨🇦', isPassportSupported: false, isDestinationSupported: true },
  { id: 'BR', name: 'Brazil', continent: 'South America', flagEmoji: '🇧🇷', isPassportSupported: true, isDestinationSupported: true },
  { id: 'MX', name: 'Mexico', continent: 'North America', flagEmoji: '🇲🇽', isPassportSupported: false, isDestinationSupported: true },
  { id: 'AR', name: 'Argentina', continent: 'South America', flagEmoji: '🇦🇷', isPassportSupported: false, isDestinationSupported: true },

  // Africa
  { id: 'ZA', name: 'South Africa', continent: 'Africa', flagEmoji: '🇿🇦', isPassportSupported: true, isDestinationSupported: true },
  { id: 'EG', name: 'Egypt', continent: 'Africa', flagEmoji: '🇪🇬', isPassportSupported: false, isDestinationSupported: true },
  { id: 'KE', name: 'Kenya', continent: 'Africa', flagEmoji: '🇰🇪', isPassportSupported: false, isDestinationSupported: true },
  { id: 'MA', name: 'Morocco', continent: 'Africa', flagEmoji: '🇲🇦', isPassportSupported: false, isDestinationSupported: true },
  { id: 'NG', name: 'Nigeria', continent: 'Africa', flagEmoji: '🇳🇬', isPassportSupported: true, isDestinationSupported: true },

  // Oceania
  { id: 'AU', name: 'Australia', continent: 'Oceania', flagEmoji: '🇦🇺', isPassportSupported: false, isDestinationSupported: true },
  { id: 'NZ', name: 'New Zealand', continent: 'Oceania', flagEmoji: '🇳🇿', isPassportSupported: false, isDestinationSupported: true },
  { id: 'FJ', name: 'Fiji', continent: 'Oceania', flagEmoji: '🇫🇯', isPassportSupported: false, isDestinationSupported: true }
] as const;

export const DATASET_VERSION = '1.0.1-passport-index';
export const DATASET_LABEL = 'aperiron Passport Index snapshot (unverified; 12 passports, 30 destinations)';

export function getFullCatalog(): Catalog {
  return {
    datasetVersion: DATASET_VERSION,
    datasetLabel: DATASET_LABEL,
    passports: PASSPORTS,
    destinations: DESTINATIONS,
    treaties: TREATIES
  };
}
