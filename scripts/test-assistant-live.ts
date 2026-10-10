/** Explicit diagnostic; never part of npm test. At most two authenticated Groq calls. */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { GroqModel } from '../server/assistant/groq';
import { AssistantStore } from '../server/assistant/store';
import { object, str } from '../src/shared/assistant/schema';
if (existsSync('.env')) loadEnvFile('.env');
if (!process.argv.includes('--live')) { console.log('Dry run. Pass --live for at most two Groq requests.'); process.exit(0); }
const store = new AssistantStore('output/assistant-live/accounting.json');
const report: unknown[] = [];
const fetchImpl: typeof fetch = async (url, init) => {
  const response = await fetch(url, init);
  if (response.ok) {
    const payload = await response.clone().json() as Record<string, unknown>;
    mkdirSync('output/assistant-live', { recursive: true });
    // Fixed public research question, no traveller data or credentials in this response artifact.
    writeFileSync(`output/assistant-live/response-${Date.now()}.json`, JSON.stringify(payload, null, 2));
    console.log(JSON.stringify({ status: response.status, fields: Object.keys(payload), usage: payload.usage }));
  } else console.log(JSON.stringify({ status: response.status }));
  return response;
};
const model = new GroqModel(store, { fetchImpl });
console.log(JSON.stringify({ configured: model.configured, model: model.model }));
for (const kind of ['strict', 'search'] as const) {
  const started = performance.now();
  try {
    const result = kind === 'strict' ? await model.generate(object({ answer: str(100) }), 'Return answer exactly: schema works', AbortSignal.timeout(35_000)) :
      await model.search('Locate the official Japan Ministry of Foreign Affairs visa application guidance for ordinary Indian passport tourists. Give the official page URL, and identify missing traveller details. Do not determine eligibility.', AbortSignal.timeout(50_000));
    const item = { kind, ok: true, latencyMs: Math.round(performance.now() - started), result };
    report.push(item); console.log(JSON.stringify(item));
  } catch (error) { const item = { kind, ok: false, latencyMs: Math.round(performance.now() - started), error: error instanceof Error ? error.message : 'Failed' }; report.push(item); console.log(JSON.stringify(item)); }
}
mkdirSync('output/assistant-live', { recursive: true }); writeFileSync('output/assistant-live/report.json', JSON.stringify(report, null, 2));
