import { COUNTRIES } from './countryCatalog';

const numericCodes = new Map(COUNTRIES.filter(c => c.numericCode).map(c => [c.numericCode, c.id]));

/** World Atlas omits Kosovo's numeric ID; match only that explicit named feature. */
export function getMapCountryId(id: string | number | undefined, name?: string): string | undefined {
  if (id != null) return numericCodes.get(String(id).padStart(3, '0'));
  return name === 'Kosovo' ? COUNTRIES.find(c => c.id === 'XK')?.id : undefined;
}
