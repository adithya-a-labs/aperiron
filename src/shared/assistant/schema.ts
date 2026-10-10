/** Small JSON Schema subset used identically by runtime validation and OpenAPI. */
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export interface Schema<T = unknown> {
  json: Record<string, unknown>;
  optional?: boolean;
  parse(value: unknown, path?: string): T;
}
export type Infer<S> = S extends Schema<infer T> ? T : never;
export class ValidationError extends Error {
  constructor(public fieldErrors: Array<{ field: string; message: string }>) { super('Invalid request.'); }
}
const fail = (path: string, message: string): never => { throw new ValidationError([{ field: path, message }]); };
export const str = (max = 4000, pattern?: string): Schema<string> => ({
  json: { type: 'string', minLength: 1, maxLength: max, ...(pattern ? { pattern } : {}) },
  parse: (v, p = '$') => typeof v === 'string' && v.length > 0 && v.length <= max && (!pattern || new RegExp(pattern).test(v)) ? v : fail(p, 'Invalid string.'),
});
export const integer = (min = 0, max = 1_000_000): Schema<number> => ({
  json: { type: 'integer', minimum: min, maximum: max },
  parse: (v, p = '$') => typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max ? v : fail(p, 'Invalid integer.'),
});
export const number = (min: number, max: number): Schema<number> => ({ json: { type: 'number', minimum: min, maximum: max },
  parse: (v, p = '$') => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : fail(p, 'Invalid number.') });
export function defaulted<T>(s: Schema<T>, value: T): Schema<T> {
  return { json: { ...s.json, default: value }, optional: true, parse: (v, p) => v === undefined ? structuredClone(value) : s.parse(v, p) };
}
export const bool: Schema<boolean> = { json: { type: 'boolean' }, parse: (v, p = '$') => typeof v === 'boolean' ? v : fail(p, 'Boolean required.') };
export const nullValue: Schema<null> = { json: { type: 'null' }, parse: (v, p = '$') => v === null ? null : fail(p, 'Null required.') };
export function enumeration<const T extends readonly string[]>(values: T): Schema<T[number]> {
  return { json: { type: 'string', enum: values }, parse: (v, p = '$') => typeof v === 'string' && values.includes(v) ? v as T[number] : fail(p, 'Unsupported value.') };
}
export function nullable<T>(s: Schema<T>): Schema<T | null> {
  return { json: { anyOf: [s.json, { type: 'null' }] }, parse: (v, p) => v === null ? null : s.parse(v, p) };
}
export function array<T>(s: Schema<T>, max = 10, min = 0): Schema<T[]> {
  return { json: { type: 'array', items: s.json, minItems: min, maxItems: max }, parse: (v, p = '$') => {
    if (!Array.isArray(v) || v.length < min || v.length > max) return fail(p, 'Invalid array length.');
    return v.map((item, i) => s.parse(item, `${p}[${i}]`));
  } };
}
export function object<P extends Record<string, Schema>>(props: P): Schema<{ [K in keyof P]: Infer<P[K]> }> {
  return { json: { type: 'object', properties: Object.fromEntries(Object.entries(props).map(([k, s]) => [k, s.json])), required: Object.entries(props).filter(([, s]) => !s.optional).map(([k]) => k), additionalProperties: false },
    parse: (v, p = '$') => {
      if (!v || typeof v !== 'object' || Array.isArray(v)) return fail(p, 'Object required.');
      const r = v as Record<string, unknown>;
      for (const key of Object.keys(r)) if (!Object.hasOwn(props, key)) fail(`${p}.${key}`, 'Unknown field.');
      return Object.fromEntries(Object.entries(props).map(([k, s]) => [k, s.parse(r[k], `${p}.${k}`)])) as { [K in keyof P]: Infer<P[K]> };
    } };
}
export function union<const T extends readonly Schema[]>(...schemas: T): Schema<Infer<T[number]>> {
  return { json: { anyOf: schemas.map(s => s.json) }, parse: (v, p = '$') => {
    for (const s of schemas) { try { return s.parse(v, p) as Infer<T[number]>; } catch (error) { if (!(error instanceof ValidationError)) throw error; } }
    return fail(p, 'Does not match any supported request variant.');
  } };
}
export function refine<T>(s: Schema<T>, check: (v: T) => string | null): Schema<T> {
  return { json: s.json, parse(v, p = '$') { const result = s.parse(v, p), error = check(result); if (error) fail(p, error); return result; } };
}
export const jsonValue: Schema<Json> = { json: {}, parse(v, p = '$') {
  if (v === null || typeof v === 'string' || typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v))) return v;
  if (Array.isArray(v)) return v.map(x => jsonValue.parse(x, p));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, jsonValue.parse(x, p)]));
  return fail(p, 'JSON value required.');
} };
