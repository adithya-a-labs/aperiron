import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { operations } from '../src/shared/assistant/operations';
import { requests } from '../src/shared/assistant/schemas';
import { error, responses } from '../src/shared/assistant/responses';

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const envelope = (name: string) => ({ type: 'object', additionalProperties: false, required: ['data', 'meta'], properties: { data: ref(name), meta: ref('Meta') } });
const schemas: Record<string, unknown> = { Error: error.json, Meta: { type: 'object', additionalProperties: false, required: ['requestId', 'schemaVersion', 'generatedAt'], properties: { requestId: { type: 'string' }, schemaVersion: { const: '1' }, generatedAt: { type: 'string', format: 'date-time' } } } };
for (const [name, schema] of Object.entries(requests)) schemas[`Request_${name}`] = schema.json;
for (const [name, schema] of Object.entries(responses)) schemas[`Response_${name}`] = schema.json;
const paths: Record<string, Record<string, unknown>> = {};
for (const [method, path, request, response, status, metered] of operations) {
  const publicRoute = path === '/capabilities' || path === '/sessions';
  const parameters: unknown[] = [...path.matchAll(/\{(\w+)\}/g)].map(m => ({ name: m[1], in: 'path', required: true, schema: { type: 'string' } }));
  if (method !== 'GET') parameters.push({ name: 'Origin', in: 'header', required: true, schema: { type: 'string', format: 'uri' } });
  if (method !== 'GET' && !publicRoute) parameters.push({ name: 'X-CSRF-Token', in: 'header', required: true, schema: { type: 'string' } });
  if (metered) parameters.push({ name: 'Idempotency-Key', in: 'header', required: true, schema: { type: 'string', format: 'uuid' } });
  if (path.includes('/countries/') && method === 'GET') parameters.push({ name: path.startsWith('/trips/') ? 'tripRevision' : 'profileRevision', in: 'query', required: true, schema: { type: 'integer', minimum: 1 } });
  if (path === '/conversations/{conversationId}') parameters.push({ name: 'cursor', in: 'query', schema: { type: 'string' } }, { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 50, default: 20 } });
  if (path.endsWith('/export')) parameters.push({ name: 'format', in: 'query', required: true, schema: { type: 'string', enum: ['markdown', 'json'] } });
  const result: Record<string, unknown> = { [status]: { description: status === 202 ? 'Accepted job. Poll Location; polling never dispatches providers.' : status === 204 ? 'Deleted or cancellation requested' : 'Success',
    ...(response ? { content: { 'application/json': { schema: envelope(`Response_${response}`) } } } : status === 200 ? { content: { 'text/markdown': { schema: { type: 'string' } }, 'application/json': { schema: { type: 'object', description: 'Immutable brief plus provenance and staleContext, without the HTTP envelope.' } } } } : {}),
    ...(status === 202 ? { headers: { Location: { schema: { type: 'string' }, description: 'Job polling URL' } } } : {}) } };
  for (const code of [400, 401, 403, 404, 409, 413, 422, 429, 503]) result[code] = { description: 'Typed assistant error; no upstream bodies or secrets.', content: { 'application/json': { schema: ref('Error') } } };
  (paths[path] ??= {})[method.toLowerCase()] = { operationId: `${method.toLowerCase()}_${path.replace(/[{}]/g, '').replace(/[^A-Za-z0-9]+/g, '_')}`, parameters,
    security: publicRoute ? [] : [{ LocalSession: [] }], ...(request ? { requestBody: { required: true, content: { 'application/json': { schema: ref(`Request_${request}`) } } } } : {}), responses: result };
}
const document = { openapi: '3.1.0', info: { title: 'aperiron local assistant backend', version: '1.0.0', description: 'Single-process local backend. All research unreviewed. Eight-method engine and legacy HTTP APIs unchanged.' }, servers: [{ url: '/api/v1/assistant' }], paths,
  components: { securitySchemes: { LocalSession: { type: 'apiKey', in: 'cookie', name: 'aperiron_session' } }, schemas } };
const text = `${JSON.stringify(document, null, 2)}\n`, path = 'docs/api/assistant.openapi.json';
if (process.argv.includes('--check')) { if (readFileSync(path, 'utf8') !== text) throw new Error('OpenAPI is stale: run npm run assistant:openapi'); }
else { mkdirSync('docs/api', { recursive: true }); writeFileSync(path, text); }
console.log(`Assistant OpenAPI: ${operations.length} operations (${process.argv.includes('--check') ? 'current' : 'generated'}).`);
