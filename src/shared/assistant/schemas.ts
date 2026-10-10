import { getFullCatalog } from '../../data/catalog';
import { array, bool, defaulted, enumeration, integer, nullable, nullValue, number, object, refine, str, union, type Infer } from './schema';

const catalog = getFullCatalog();
export const country = enumeration(catalog.destinations.map(c => c.id));
export const passport = enumeration(catalog.passports.map(c => c.id));
export const regions = [...new Set(catalog.destinations.map(c => c.continent.toLowerCase().replaceAll(' ', '_')))];
export const region = enumeration(regions);
export const access = enumeration(['visa_free', 'visa_on_arrival', 'evisa', 'visa_required', 'restricted', 'unknown'] as const);
export const language = str(20, '^[a-z]{2,3}(-[A-Za-z]{2,8})?$');
export const id = str(100, '^[A-Za-z0-9_-]+$');
export const uuid = str(36, '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$');
export const date = refine(str(10, '^\\d{4}-\\d{2}-\\d{2}$'), v => {
  const d = new Date(`${v}T00:00:00Z`); return !Number.isFinite(+d) || d.toISOString().slice(0, 10) !== v ? 'Invalid calendar date.' : null;
});
export const budget = nullable(object({ amount: number(0, 1_000_000_000), currency: enumeration(Intl.supportedValuesOf('currency')) }));
const schedule = { departureDate: nullable(date), returnDate: nullable(date), durationDays: nullable(integer(1, 3650)) };
function dates(v: { departureDate: string | null; returnDate: string | null; durationDays: number | null }) {
  if (v.departureDate && v.returnDate) {
    const days = (Date.parse(v.returnDate) - Date.parse(v.departureDate)) / 86_400_000 + 1;
    if (days < 1 || (v.durationDays !== null && days !== v.durationDays)) return 'Dates and inclusive duration must agree.';
  }
  return null;
}
export const heldDocument = refine(object({ id, kind: enumeration(['visa', 'residence_permit'] as const), issuerCountryId: country,
  validFrom: nullable(date), validUntil: nullable(date), entryType: nullable(enumeration(['single', 'multiple'] as const)) }),
  v => v.validFrom && v.validUntil && v.validFrom > v.validUntil ? 'Document dates are reversed.' : null);
export const profile = refine(object({ passportId: passport, passportType: enumeration(['ordinary', 'diplomatic', 'service'] as const),
  residenceCountryId: nullable(country), heldDocuments: array(heldDocument, 10), purpose: enumeration(['tourism', 'business', 'conference', 'transit'] as const),
  activity: nullable(str(300)), ...schedule, preferences: object({ regionIds: array(region), accessLevels: array(access, 6), budget }), language }),
  v => dates(v) ?? (new Set(v.heldDocuments.map(d => d.id)).size !== v.heldDocuments.length ? 'Duplicate document IDs.' : null));
export type Profile = Infer<typeof profile>;
export const contextRef = union(
  object({ kind: enumeration(['map'] as const), profileRevision: integer(1), selectedCountryIds: array(country), mapRevision: id }),
  object({ kind: enumeration(['country'] as const), profileRevision: integer(1), destinationId: country }),
  object({ kind: enumeration(['group'] as const), tripId: id, tripRevision: integer(1), destinationId: nullable(country) }),
);
export type ContextRef = Infer<typeof contextRef>;
const filterFields = { regionIds: array(region), accessLevels: array(access, 6) };
export const filters = object({ ...filterFields, minimumStayDays: defaulted(nullable(integer(1, 3650)), null) });
// Strict model output requires a single closed shape with every field required.
export const actionFilters = object({ ...filterFields, minimumStayDays: nullable(integer(1, 3650)) });
export type Filters = Infer<typeof filters>;
export const page = nullable(object({ cursor: nullable(str(500)), limit: integer(1, 50) }));
export const trip = refine(object({ name: str(150), travellers: array(object({ id, label: str(80), profile }), 6, 1), ...schedule, budget, shortlistCountryIds: array(country) }), v => {
  if (dates(v)) return dates(v);
  if (new Set(v.travellers.map(t => t.id)).size !== v.travellers.length) return 'Duplicate traveller IDs.';
  for (const t of v.travellers) for (const field of ['departureDate', 'returnDate', 'durationDays'] as const)
    if (v[field] !== null && t.profile[field] !== null && v[field] !== t.profile[field]) return 'Individual and group schedules disagree.';
  return null;
});
export type Trip = Infer<typeof trip>;
const actionBase = { mapRevision: id, profileRevision: integer(1), requiresConfirmation: bool, reason: str(500) };
export const action = union(
  object({ ...actionBase, type: enumeration(['set_filters'] as const), payload: actionFilters }),
  object({ ...actionBase, type: enumeration(['focus_region'] as const), payload: object({ regionId: region }) }),
  object({ ...actionBase, type: enumeration(['select_country'] as const), payload: object({ destinationId: country }) }),
  object({ ...actionBase, type: enumeration(['compare_countries', 'suggest_shortlist'] as const), payload: object({ destinationIds: array(country, 10, 1) }) }),
  object({ ...actionBase, type: enumeration(['clear_filters'] as const), payload: nullValue }),
);
const refs = array(id, 30);
export const question = object({ field: str(100), text: str(500), choices: array(str(100), 10) });
export const claim = object({ id, text: str(1000), evidenceIds: refs, support: enumeration(['supported', 'partial', 'unknown', 'conflicting'] as const) });
export const card = union(
  object({ type: enumeration(['summary'] as const), payload: object({ title: str(150), text: str(2000), evidenceIds: refs }) }),
  object({ type: enumeration(['requirement'] as const), payload: object({ title: str(150), condition: nullable(str(1000)), evidenceIds: refs }) }),
  object({ type: enumeration(['condition'] as const), payload: object({ text: str(1000), evidenceIds: refs }) }),
  object({ type: enumeration(['source'] as const), payload: object({ evidenceId: id }) }),
  object({ type: enumeration(['comparison'] as const), payload: object({ title: str(150), rows: array(object({ label: str(100), value: str(500) }), 20), evidenceIds: refs }) }),
  object({ type: enumeration(['checklist'] as const), payload: object({ itemIds: refs }) }),
  object({ type: enumeration(['gap'] as const), payload: object({ text: str(1000) }) }),
);
export const generatedAnswer = object({ text: str(8000), cards: array(card, 15), claims: array(claim, 20), questions: array(question, 10), actions: array(action, 10), warnings: array(str(1000), 15) });
export type GeneratedAnswer = Infer<typeof generatedAnswer>;
export const mapProposal = object({ actions: array(action), proposedProfile: nullable(profile), questions: array(question), unsupportedConstraints: array(str(500)) });
export const profileProposal = object({ proposedProfile: nullable(profile), fields: array(object({ field: str(100), state: enumeration(['extracted', 'ambiguous', 'missing'] as const) }), 30), questions: array(question), unsupportedConstraints: array(str(500)) });
const messageBase = { clientMessageId: uuid, expectedConversationRevision: integer(), contextRef,
  dataPolicy: defaulted(object({ travelBuddy: enumeration(['cache_only', 'refresh_if_stale'] as const), research: enumeration(['never', 'if_gap'] as const) }), { travelBuddy: 'cache_only', research: 'never' }) };
export const messageRequest = union(
  object({ ...messageBase, intent: enumeration(['ask', 'research'] as const), text: str() }),
  object({ ...messageBase, intent: enumeration(['explain', 'compare', 'checklist'] as const), text: nullable(str()) }),
  object({ ...messageBase, intent: enumeration(['simplify'] as const), text: nullable(str()), sourceMessageId: id }),
  object({ ...messageBase, intent: enumeration(['translate'] as const), text: nullable(str()), sourceMessageId: id, targetLanguage: language }),
);
export const explanationRequest = union(
  object({ kind: enumeration(['comparison'] as const), passportIds: array(passport, 2, 2), destinationIds: array(country), language }),
  object({ kind: enumeration(['dna'] as const), passportId: passport, language }),
  object({ kind: enumeration(['changes'] as const), beforeContextHash: id, afterContextHash: id, language }),
  object({ kind: enumeration(['simplify'] as const), sourceMessageId: id, language }),
  object({ kind: enumeration(['translate'] as const), sourceMessageId: id, targetLanguage: language }),
);
export const requests = {
  empty: object({}), profilePut: object({ expectedRevision: integer(), profile }),
  profileInterpret: object({ text: str(), expectedRevision: integer() }),
  mapInterpret: object({ text: str(), profileRevision: integer(1), mapRevision: id, selectedCountryIds: array(country), filters }),
  mapQuery: object({ profileRevision: integer(1), filters, destinationIds: array(country, 199), page }),
  conversation: object({ contextRef }), message: messageRequest,
  research: union(object({ contextRef, question: str(), refresh: defaulted(bool, false) }), object({ contextRef, question: str(), refresh: defaulted(bool, false), travellerId: id })),
  explanation: explanationRequest, trip, tripPut: object({ expectedRevision: integer(1), trip }),
  groupQuery: object({ tripRevision: integer(1), filters, destinationIds: array(country, 199), page }),
  enrichment: object({ tripRevision: integer(1), destinationIds: array(country, 10, 1), travellerIds: array(id, 6, 1), maxProviderCalls: integer(0, 3) }),
  checklist: object({ contextRef, destinationIds: array(country, 10, 1) }),
  brief: object({ contextRef, destinationIds: array(country, 10, 1), messageIds: array(id, 20), includeChecklist: bool, language }),
};
