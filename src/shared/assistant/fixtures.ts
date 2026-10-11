import type { Profile } from './schemas';
import { action, card } from './schemas';
/** Synthetic traveller descriptors, not a fixture claiming verified regulations. */
export const exampleProfile: Profile = { passportId: 'IN', passportType: 'ordinary', residenceCountryId: null, heldDocuments: [], purpose: 'tourism', activity: null,
  departureDate: null, returnDate: null, durationDays: null, preferences: { regionIds: [], accessLevels: [], budget: null }, language: 'en' };
const actionBase = { mapRevision: 'map_example', profileRevision: 1, requiresConfirmation: false, reason: 'Synthetic UI contract fixture.' };
export const exampleActions = [
  { ...actionBase, type: 'set_filters', payload: { regionIds: ['asia'], accessLevels: ['visa_free'], minimumStayDays: null } },
  { ...actionBase, type: 'focus_region', payload: { regionId: 'asia' } },
  { ...actionBase, type: 'select_country', payload: { destinationId: 'JP' } },
  { ...actionBase, type: 'compare_countries', payload: { destinationIds: ['JP', 'SG'] } },
  { ...actionBase, type: 'suggest_shortlist', requiresConfirmation: true, payload: { destinationIds: ['JP'] } },
  { ...actionBase, type: 'clear_filters', payload: null },
].map(v => action.parse(v));
export const exampleCards = [
  { type: 'summary', payload: { title: 'Synthetic summary', text: 'Snapshot information is unreviewed.', evidenceIds: [] } },
  { type: 'requirement', payload: { title: 'Synthetic reviewed requirement fixture', condition: 'Fixture only', evidenceIds: ['ev_fixture'] } },
  { type: 'condition', payload: { text: 'A condition remains unresolved.', evidenceIds: [] } },
  { type: 'source', payload: { evidenceId: 'ev_fixture' } },
  { type: 'comparison', payload: { title: 'Synthetic comparison', rows: [{ label: 'A', value: 'unknown' }], evidenceIds: [] } },
  { type: 'checklist', payload: { itemIds: ['item_fixture'] } },
  { type: 'gap', payload: { text: 'No reviewed document requirements available.' } },
].map(v => card.parse(v));
