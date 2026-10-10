/** Full catalog derived from country IDs in the bundled Passport Index snapshot. */
import type { Catalog, CountrySummary } from '../shared/contracts';
import { COUNTRIES } from './countryCatalog';
import { TREATIES } from './treaties';

// ISO alpha-2 order is fixed across environments and defines DNA vector order.
export const PASSPORTS: readonly CountrySummary[] = COUNTRIES.filter(c => c.isPassportSupported);
export const DESTINATIONS: readonly CountrySummary[] = COUNTRIES.filter(c => c.isDestinationSupported);
export const DATASET_VERSION = '1.1.0-passport-index-full';
export const DATASET_LABEL = 'aperiron Passport Index snapshot (unverified; ' + PASSPORTS.length + ' passports, ' + DESTINATIONS.length + ' destinations)';

export function getFullCatalog(): Catalog {
  return { datasetVersion: DATASET_VERSION, datasetLabel: DATASET_LABEL, passports: PASSPORTS, destinations: DESTINATIONS, treaties: TREATIES };
}
