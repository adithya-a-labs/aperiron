/** Explicit end-to-end diagnostic: at most three Groq calls, zero Travel Buddy refreshes. */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createApiHandler } from '../server/api-server';
import { AssistantStore, type Conversation, type Job } from '../server/assistant/store';
import { GroqModel, type Model } from '../server/assistant/groq';
import { exampleProfile } from '../src/shared/assistant/fixtures';
import { job as jobSchema } from '../src/shared/assistant/responses';

if (!process.argv.includes('--live')) { console.log('Dry run. Pass --live for at most three Groq calls through HTTP.'); process.exit(0); }
const store = new AssistantStore('output/assistant-live/http-accounting.json'), provider = new GroqModel(store, { fetchImpl: async (url, init) => {
  const response = await fetch(url, init);
  if (!response.ok) { const p = await response.clone().json() as { error?: { message?: string; schema_code?: string; schema_path?: string } };
    console.log(JSON.stringify({ providerStatus: response.status, schemaCode: p.error?.schema_code, schemaPath: p.error?.schema_path, ...(response.status === 400 ? { message: p.error?.message } : {}) })); }
  return response;
} });
let calls = 0; const consume = () => { if (++calls > 3) throw new Error('Live diagnostic call cap exceeded.'); };
const model: Model = { configured: provider.configured, model: provider.model,
  generate: (schema, prompt, signal) => { consume(); return provider.generate(schema, prompt, signal); }, search: (prompt, signal) => { consume(); return provider.search(prompt, signal); } };
const server = createServer(createApiHandler({ store, model }));
await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve)); const address = server.address(); assert(address && typeof address !== 'string');
const root = `http://127.0.0.1:${address.port}/api/v1/assistant`; let cookie = '', csrf = '';
const report: unknown[] = [];
async function request<T>(method: string, path: string, body?: unknown) {
  const response = await fetch(`${root}${path}`, { method, headers: { Origin: 'http://127.0.0.1:5184', Cookie: cookie, 'X-CSRF-Token': csrf, 'Content-Type': 'application/json', 'Idempotency-Key': randomUUID() }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const payload = await response.json() as { data: T; error?: { code: string; message: string } };
  if (response.status >= 400) throw new Error(`${response.status}: ${payload.error?.code} ${payload.error?.message}`);
  if (path === '/sessions') { cookie = response.headers.get('set-cookie')!.split(';')[0]; csrf = (payload.data as { csrfToken: string }).csrfToken; }
  return payload.data;
}
async function run(path: string, body: unknown) {
  const started = performance.now(), job = await request<Job>('POST', path, body);
  for (let i = 0; i < 100; i++) {
    const current = await request<Job>('GET', `/jobs/${job.id}`); jobSchema.parse(current);
    if (!['queued', 'running'].includes(current.status)) { const result = { path, status: current.status, latencyMs: Math.round(performance.now() - started), error: current.error, result: current.result }; report.push(result); console.log(JSON.stringify(result)); return current; }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('Live job timed out.');
}
try {
  await request('POST', '/sessions', {}); await request('PUT', '/profile', { expectedRevision: 0, profile: exampleProfile });
  const contextRef = { kind: 'country', destinationId: 'JP', profileRevision: 1 };
  if (!process.argv.includes('--chat-only')) {
    const mapJob = await run('/map/interpret', { text: 'Show visa-free and visa-on-arrival countries in Asia', profileRevision: 1, mapRevision: 'map_live', selectedCountryIds: [], filters: { regionIds: [], accessLevels: [] } });
    if (mapJob.status !== 'completed' && process.argv.includes('--stop-on-failure')) throw new Error('Map schema diagnostic stopped after one call.');
  }
  const conv = await request<Conversation>('POST', '/conversations', { contextRef });
  await run(`/conversations/${conv.id}/messages`, { clientMessageId: randomUUID(), expectedConversationRevision: 0, contextRef, text: 'Explain this snapshot classification and which details remain unknown. Do not search.', intent: 'ask', dataPolicy: { travelBuddy: 'cache_only', research: 'never' } });
  if (!process.argv.includes('--structured-only')) await run('/research', { contextRef, question: 'Locate official Japan visa application guidance for ordinary Indian passport tourism. Identify source and traveller-applicability gaps.', refresh: false });
  console.log(JSON.stringify({ maximumCalls: process.argv.includes('--structured-only') ? 2 : 3, actualCalls: calls }));
} finally {
  await new Promise<void>(resolve => server.close(() => resolve()));
  mkdirSync('output/assistant-live', { recursive: true }); writeFileSync('output/assistant-live/http-report.json', JSON.stringify(report, null, 2));
}
