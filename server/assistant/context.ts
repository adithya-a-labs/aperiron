import { RealAperironEngine } from '../../src/engine/realEngine';
import { COUNTRIES } from '../../src/data/countryCatalog';
import { INITIAL_WORLD_STATE, type DestinationAccess, type Result } from '../../src/shared/contracts';
import type { ContextRef, Filters, Profile } from '../../src/shared/assistant/schemas';
import type { TravelService } from '../travel-details';
import { ApiError, type AssistantStorage, hash, opaque, stamp, type TripResource } from './store';

export interface Evidence {
  id: string; sourceType: 'snapshot' | 'travel_buddy' | 'official_page' | 'third_party_page'; url: string | null; title: string; issuer: string | null;
  excerpt: string | null; retrievedAt: string | null; reviewedAt: string | null; reviewStatus: 'unreviewed' | 'reviewed_supported' | 'conflicting';
  applicability: { passportId: string; destinationId: string; purpose: string; passportType: string; status: 'reference_only' | 'applicable' | 'unresolved' };
  effectiveFrom: string | null; effectiveUntil: string | null; contentHash: string;
}
export function unwrap<T>(r: Result<T>): T { if (!r.success) throw new ApiError(422, 'UNSUPPORTED_CONTEXT', r.error.message); return r.data; }
export const supported = (p: Profile) => p.purpose === 'tourism' && p.passportType === 'ordinary' && !p.activity;
export const duration = (p: Profile) => p.durationDays ?? (p.departureDate && p.returnDate ? (Date.parse(p.returnDate) - Date.parse(p.departureDate)) / 86_400_000 + 1 : null);
/** Coarse viewports from bundled geography, never model-provided coordinates. */
export const regionViewports = [...new Set(COUNTRIES.map(c => c.continent))].map(continent => {
  const points = COUNTRIES.filter(c => c.continent === continent).map(c => c.coordinates);
  return { regionId: continent.toLowerCase().replaceAll(' ', '_'), bounds: [[Math.max(-180, Math.min(...points.map(p => p[0])) - 5), Math.max(-90, Math.min(...points.map(p => p[1])) - 5)],
    [Math.min(180, Math.max(...points.map(p => p[0])) + 5), Math.min(90, Math.max(...points.map(p => p[1])) + 5)]] };
});
export function profileGaps(p: Profile): string[] {
  return [
    ...(!supported(p) ? ['The snapshot and provider do not assess this passport type, purpose or activity.'] : []),
    ...(p.heldDocuments.length ? ['Held-document exceptions need reviewed rules and matching document conditions.'] : []),
    ...(p.residenceCountryId ? ['Residence-specific application rules are not assessed.'] : []),
    ...(p.departureDate || p.returnDate ? ['Future rule validity for these dates has not been established.'] : []),
  ];
}
export class Contexts {
  engine = new RealAperironEngine();
  catalog = this.engine.getCatalog();
  constructor(public store: AssistantStorage, public travel: TravelService) {}
  async profile(owner: string, revision: number) {
    const resource = (await this.store.session(owner)).profile;
    if (!resource.profile || resource.revision !== revision) throw new ApiError(409, 'CONTEXT_CHANGED', 'The traveller profile changed or is missing.');
    return resource.profile;
  }
  async trip(owner: string, id: string, revision?: number) {
    if (!id.startsWith('trip_')) throw new ApiError(404, 'NOT_FOUND', 'Trip not found.');
    const t = (await this.store.get<TripResource>(id, owner));
    if (revision !== undefined && t.revision !== revision) throw new ApiError(409, 'CONTEXT_CHANGED', 'The trip revision changed.');
    return t;
  }
  async assert(owner: string, ref: ContextRef) {
    if (ref.kind === 'group') (await this.trip(owner, ref.tripId, ref.tripRevision)); else (await this.profile(owner, ref.profileRevision));
  }
  async saveEvidence(owner: string, input: Omit<Evidence, 'id' | 'contentHash'>): Promise<Evidence> {
    const digest = hash(input), evidence = { ...input, id: `ev_${digest.slice(0, 40)}`, contentHash: digest };
    // IDs are content-addressed within an owned namespace so another session cannot replace a record.
    evidence.id = `ev_${hash([owner, digest]).slice(0, 40)}`;
    (await this.store.put(evidence.id, owner, evidence)); return evidence;
  }
  private async snapshot(owner: string, ref: ContextRef, data: unknown) {
    const contextHash = hash({ ref, data }); (await this.store.put(`ctx_${contextHash}`, owner, { contextRef: ref, data })); return contextHash;
  }
  async country(owner: string, profile: Profile, destinationId: string, ref: ContextRef) {
    const requirements = unwrap(this.engine.getDestinationRequirements({ passportId: profile.passportId, destinationId,
      travellerContext: { purpose: profile.purpose, passportType: profile.passportType, ...(duration(profile) !== null ? { durationDays: duration(profile)! } : {}) } }));
    const snapshot = !profile.activity ? requirements : { ...requirements, accessLevel: 'unknown' as const, maxStayDays: null };
    const providerDetails = await this.travel.read({ passportId: profile.passportId, destinationId, purpose: profile.purpose, passportType: profile.passportType });
    const evidence: Evidence[] = [];
    for (const source of snapshot.sources) evidence.push((await this.saveEvidence(owner, {
      sourceType: 'snapshot', url: source.url, title: source.title, issuer: source.issuingAuthority,
      excerpt: `Bundled snapshot: ${profile.passportId}/${destinationId}: ${snapshot.accessLevel}; stay ${snapshot.maxStayDays ?? 'unknown'}.`,
      retrievedAt: source.retrievedAt || null, reviewedAt: null, reviewStatus: 'unreviewed',
      applicability: { passportId: profile.passportId, destinationId, purpose: profile.purpose, passportType: profile.passportType, status: supported(profile) ? 'reference_only' : 'unresolved' }, effectiveFrom: null, effectiveUntil: null,
    })));
    for (const detail of providerDetails.entries) evidence.push((await this.saveEvidence(owner, {
      sourceType: 'travel_buddy', url: detail.primary?.link ?? null, title: 'Travel Buddy cached detail', issuer: 'Travel Buddy',
      excerpt: JSON.stringify({ primary: detail.primary, secondary: detail.secondary, exception: detail.exception, registration: detail.registration, passportValidity: detail.passportValidity }).slice(0, 6000),
      retrievedAt: detail.fetchedAt, reviewedAt: null, reviewStatus: 'unreviewed', applicability: { passportId: profile.passportId, destinationId, purpose: profile.purpose, passportType: profile.passportType, status: supported(profile) ? 'reference_only' : 'unresolved' }, effectiveFrom: null, effectiveUntil: null,
    })));
    const data = { snapshot, providerDetails, supportedContext: supported(profile), evidence,
      gaps: [...profileGaps(profile), 'Document requirements, fees, processing times and official deadlines need applicable reviewed sources.'],
      suggestedQuestions: ['Explain this snapshot classification', 'Which conditions are still unknown?', 'Research official sources'],
      freshness: { datasetVersion: this.catalog.datasetVersion, providerFresh: providerDetails.fresh, reviewedAt: null } };
    return { contextRef: ref, contextHash: (await this.snapshot(owner, ref, data)), ...data };
  }
  groupProfile(t: TripResource, index: number): Profile {
    const p = t.trip.travellers[index].profile;
    return { ...p, departureDate: p.departureDate ?? t.trip.departureDate, returnDate: p.returnDate ?? t.trip.returnDate,
      durationDays: p.durationDays ?? t.trip.durationDays };
  }
  async collect(owner: string, ref: ContextRef) {
    (await this.assert(owner, ref));
    if (ref.kind === 'country') return this.country(owner, (await this.profile(owner, ref.profileRevision)), ref.destinationId, ref);
    if (ref.kind === 'map') {
      const p = (await this.profile(owner, ref.profileRevision));
      const data = { profile: p, destinations: ref.selectedCountryIds.map(d => this.cell(p, d)), evidence: [] as Evidence[], gaps: profileGaps(p) };
      return { contextRef: ref, contextHash: (await this.snapshot(owner, ref, data)), ...data };
    }
    const t = (await this.trip(owner, ref.tripId, ref.tripRevision));
    const travellers = await Promise.all(t.trip.travellers.map(async (traveller, i) => ({ travellerId: traveller.id, label: traveller.label,
      context: ref.destinationId ? await this.country(owner, this.groupProfile(t, i), ref.destinationId, ref) : { profile: this.groupProfile(t, i), gaps: profileGaps(this.groupProfile(t, i)), evidence: [] as Evidence[] } })));
    const data = { travellers, evidence: travellers.flatMap(t => t.context.evidence), gaps: travellers.flatMap(t => t.context.gaps) };
    return { contextRef: ref, contextHash: (await this.snapshot(owner, ref, data)), ...data };
  }
  private views = new Map<string, readonly DestinationAccess[]>();
  cell(p: Profile, destinationId: string) {
    let view = this.views.get(p.passportId); if (!view) { view = unwrap(this.engine.getPassportView(p.passportId, INITIAL_WORLD_STATE)).destinations; this.views.set(p.passportId, view); }
    const d = view.find(d => d.destinationId === destinationId)!;
    const requestedStay = duration(p), stayAssessment = requestedStay === null || p.passportId === destinationId ? 'not_requested' : !supported(p) || d.maxStayDays == null ? 'unknown' : requestedStay > d.maxStayDays ? 'exceeds_snapshot' : 'within_snapshot';
    return { ...d, notes: d.notes ?? null, accessLevel: supported(p) ? d.accessLevel : 'unknown', maxStayDays: supported(p) ? d.maxStayDays ?? null : null,
      basis: 'snapshot', stayAssessment, unknownConditions: [...profileGaps(p), ...(stayAssessment === 'unknown' ? ['Requested stay cannot be assessed from the numeric snapshot data.'] : [])], assumptions: ['Bundled unreviewed snapshot; ordinary-passport tourism baseline.'], matchedConditions: [] };
  }
  query(profiles: Array<{ id: string; profile: Profile }>, f: Filters, ids: string[], page: { cursor: string | null; limit: number } | null, group = profiles.length > 1) {
    const requestHash = hash({ profiles, f, ids, group }), size = page?.limit ?? 20;
    let offset = 0;
    if (page?.cursor) { try { const c = JSON.parse(Buffer.from(page.cursor, 'base64url').toString()) as { offset: number; hash: string };
      if (c.hash !== requestHash || !Number.isSafeInteger(c.offset) || c.offset < 0) throw new Error(); offset = c.offset;
    } catch { throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid or stale page cursor.'); } }
    const all = this.catalog.destinations.filter(d => (!ids.length || ids.includes(d.id)) && (!f.regionIds.length || f.regionIds.includes(d.continent.toLowerCase().replaceAll(' ', '_'))));
    let unassessedCount = 0;
    const rows = all.map(d => {
      const travellers = profiles.map(p => ({ travellerId: p.id, ...this.cell(p.profile, d.id) }));
      const stay = 'minimumStayDays' in f ? f.minimumStayDays : null;
      const unknown = travellers.some(t => t.accessLevel === 'unknown' || t.stayAssessment === 'unknown' || (!!stay && t.maxStayDays === null));
      const allowed = f.accessLevels.length ? f.accessLevels : group ? ['visa_free', 'visa_on_arrival', 'evisa'] : [];
      const matches = !unknown && travellers.every(t => t.stayAssessment !== 'exceeds_snapshot' && (!allowed.length || allowed.includes(t.accessLevel as never)) && (!stay || (t.maxStayDays !== null && t.maxStayDays >= stay)));
      if (unknown) unassessedCount++;
      return { destinationId: d.id, destinationName: d.name, travellers, groupAssessment: unknown ? 'unassessed' : !matches ? 'does_not_match' : travellers.some(t => t.unknownConditions.length) ? 'needs_review' : 'baseline_match', matches };
    });
    // Category visibility is separate from eligibility: unknown or over-stay
    // destinations must remain reviewable without becoming group matches.
    const minimumStay = f.minimumStayDays;
    const filtered = rows.filter(r => r.travellers.every(t =>
      (!f.accessLevels.length || f.accessLevels.includes(t.accessLevel as Filters['accessLevels'][number])) &&
      (!minimumStay || (t.maxStayDays !== null && t.maxStayDays >= minimumStay))));
    const accessBreakdown: Record<string, number> = {};
    for (const row of filtered) for (const t of row.travellers) accessBreakdown[t.accessLevel] = (accessBreakdown[t.accessLevel] ?? 0) + 1;
    const destinations = filtered.slice(offset, offset + size);
    return { datasetVersion: this.catalog.datasetVersion, basis: 'snapshot', destinations, total: filtered.length, accessBreakdown, unassessedCount, unsupportedConstraints: [],
      nextCursor: offset + size < filtered.length ? Buffer.from(JSON.stringify({ offset: offset + size, hash: requestHash })).toString('base64url') : null };
  }
  async checklist(owner: string, ref: ContextRef, destinationIds: string[]) {
    (await this.assert(owner, ref));
    // No reviewed document fixtures have been imported. Do not fabricate a generic visa checklist.
    const travellerIds = ref.kind === 'group' ? (await this.trip(owner, ref.tripId)).trip.travellers.map(t => t.id) : [];
    return { contextRef: ref, items: destinationIds.map(destinationId => ({ id: opaque('item'), travellerIds,
      title: `Review official requirements for ${destinationId}`, category: 'preparation', requirementStatus: 'suggested', condition: null, dueDate: null, evidenceIds: [] })),
      gaps: destinationIds.map(d => `${d}: no applicable reviewed document requirements or official deadlines are available.`), createdAt: stamp() };
  }
}
