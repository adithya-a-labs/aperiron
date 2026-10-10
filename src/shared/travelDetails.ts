import type { AccessLevel } from './contracts';

export interface TravelRule {
  name: string;
  duration: string | null;
  link: string | null;
  condition: string | null;
  countryCodes: string[];
}
export interface TravelDetails {
  schemaVersion: 1;
  source: 'travel-buddy';
  providerVersion: string | null;
  passportId: string;
  destinationId: string;
  purpose: 'tourism';
  passportType: 'ordinary';
  language: 'en';
  fetchedAt: string;
  expiresAt?: string;
  generatedAt: string | null;
  primary: TravelRule;
  secondary: TravelRule | null;
  exception: TravelRule | null;
  registration: TravelRule | null;
  passportValidity: string | null;
  embassyUrl: string | null;
}
export type TravelOutcome = 'cached' | 'updated' | 'miss' | 'unavailable' | 'cooldown' | 'quota' | 'unsupported';
export interface TravelResponse {
  entries: TravelDetails[];
  fresh: boolean;
  outcome: TravelOutcome;
  message?: string;
  remaining?: number;
  retryAt?: number;
}
export const travelKey = (passport: string, destination: string) => `v1:v2:${passport}:${destination}:ordinary:tourism:en`;
export const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (v: unknown): string | null => typeof v === 'string' && v.trim() && v.length <= 6000 ? v.trim() : null;
export function safeTravelUrl(value: unknown): string | null {
  try {
    const u = new URL(String(value));
    return u.protocol === 'https:' && !u.username && !u.password ? u.href : null;
  } catch { return null; }
}
function rule(value: unknown): TravelRule | null {
  const v = record(value), name = text(v.name);
  if (!name) return null;
  return { name, duration: text(v.duration), link: safeTravelUrl(v.link),
    condition: text(v.full_text) ?? text(v.exception_type_name),
    countryCodes: Array.isArray(v.country_codes) ? v.country_codes.filter((x): x is string => typeof x === 'string' && x.length <= 10).slice(0, 250) : [] };
}
export function primaryAccess(details: TravelDetails): AccessLevel | null {
  if (details.primary.condition) return null;
  const levels: Record<string, AccessLevel> = {
    'Visa-free': 'visa_free', 'Visa not required': 'visa_free', 'Freedom of movement': 'visa_free',
    'Visa on arrival': 'visa_on_arrival', eVisa: 'evisa', eTA: 'evisa',
    'Visa required': 'visa_required', 'Online visa required': 'visa_required', 'Not admitted': 'restricted',
  };
  return levels[details.primary.name] ?? null;
}
export function normalizeTravelDetails(payload: unknown, passport: string, destination: string, fetchedAt: string): TravelDetails {
  const p = record(payload), data = record(p.data), meta = record(p.meta), rules = record(data.visa_rules);
  const primary = rule(rules.primary_rule);
  if (!/^[A-Z]{2}$/.test(passport) || !/^[A-Z]{2}$/.test(destination) || passport === destination ||
      record(data.passport).code !== passport || record(data.destination).code !== destination || !primary ||
      meta.is_demo === true || meta.data_mode === 'demo' || (meta.language && meta.language !== 'en') ||
      !Number.isFinite(Date.parse(fetchedAt))) throw new Error('Invalid provider response.');
  return { schemaVersion: 1, source: 'travel-buddy', providerVersion: text(meta.version), passportId: passport,
    destinationId: destination, purpose: 'tourism', passportType: 'ordinary', language: 'en', fetchedAt,
    generatedAt: text(meta.generated_at), primary, secondary: rule(rules.secondary_rule), exception: rule(rules.exception_rule),
    registration: rule(data.mandatory_registration), passportValidity: text(record(data.destination).passport_validity),
    embassyUrl: safeTravelUrl(record(data.destination).embassy_url) };
}
export function isTravelDetails(value: unknown): value is TravelDetails {
  const d = record(value);
  const validRule = (v: unknown) => {
    const r = record(v);
    return Boolean(text(r.name)) && (r.duration === null || Boolean(text(r.duration))) &&
      (r.link === null || safeTravelUrl(r.link) === r.link) && (r.condition === null || Boolean(text(r.condition))) &&
      Array.isArray(r.countryCodes) && r.countryCodes.every(x => typeof x === 'string' && x.length <= 10);
  };
  return d.schemaVersion === 1 && d.source === 'travel-buddy' && d.purpose === 'tourism' && d.passportType === 'ordinary' &&
    d.language === 'en' && typeof d.passportId === 'string' && /^[A-Z]{2}$/.test(d.passportId) &&
    typeof d.destinationId === 'string' && /^[A-Z]{2}$/.test(d.destinationId) && d.passportId !== d.destinationId &&
    typeof d.fetchedAt === 'string' && Number.isFinite(Date.parse(d.fetchedAt)) && validRule(d.primary) &&
    (d.expiresAt === undefined || (typeof d.expiresAt === 'string' && Number.isFinite(Date.parse(d.expiresAt)))) &&
    [d.secondary, d.exception, d.registration].every(x => x === null || validRule(x)) &&
    (d.passportValidity === null || Boolean(text(d.passportValidity))) &&
    (d.embassyUrl === null || safeTravelUrl(d.embassyUrl) === d.embassyUrl);
}
