/** Manual trial only; never changes application data or runs in npm test. */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
import { getPassportIndexEntry } from '../src/data/runtimePassportIndexData';

const pairs = [{ passport: 'IN', destination: 'JP' }, { passport: 'IN', destination: 'SG' }, { passport: 'CN', destination: 'ID' }];
const host = 'visa-requirement.p.rapidapi.com';
const envPath = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(envPath)) loadEnvFile(envPath);

function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

async function main() {
  if (!process.argv.includes('--live')) {
    console.log(JSON.stringify({ mode: 'dry-run', maximumRequests: 3, retries: 0, pairs, endpoint: 'https://' + host + '/v2/visa/check' }, null, 2));
    console.log('No requests sent. Add TRAVEL_BUDDY_API_KEY to ignored .env, then rerun with --live.');
    return;
  }
  const key = (process.env.TRAVEL_BUDDY_API_KEY || process.env.RAPIDAPI_KEY || '').trim();
  if (!key) { console.error('Missing TRAVEL_BUDDY_API_KEY. No requests sent.'); process.exitCode = 1; return; }
  const results: Record<string, unknown>[] = [];
  for (const pair of pairs) {
    const start = performance.now();
    try {
      const response = await fetch('https://' + host + '/v2/visa/check', {
        method: 'POST', redirect: 'error',
        headers: { 'Content-Type': 'application/json', 'X-RapidAPI-Key': key, 'X-RapidAPI-Host': host },
        body: JSON.stringify(pair), signal: AbortSignal.timeout(10_000),
      });
      const quotaHeaders = Object.fromEntries([...response.headers].filter(([name]) => /ratelimit|rate-limit|retry-after/.test(name)));
      const base = { pair, status: response.status, latencyMs: Math.round(performance.now() - start), quotaHeaders };
      if (!response.ok) { results.push({ ...base, error: 'Provider rejected request; trial stopped without retry.' }); break; }
      const text = await response.text();
      if (text.length > 1_000_000) throw Error('Response too large');
      const payload = object(JSON.parse(text));
      const data = object(payload.data), passport = object(data.passport), destination = object(data.destination);
      const rules = object(data.visa_rules), primary = object(rules.primary_rule);
      if (passport.code !== pair.passport || destination.code !== pair.destination || typeof primary.name !== 'string') {
        results.push({ ...base, error: 'Unexpected schema or returned country pair; trial stopped.' }); break;
      }
      results.push({ ...base, latencyMs: Math.round(performance.now() - start),
        snapshot: getPassportIndexEntry(pair.passport, pair.destination),
        providerPrimary: primary, providerSecondary: rules.secondary_rule ?? null,
        providerException: rules.exception_rule ?? null,
        passportValidity: destination.passport_validity ?? null,
        registration: data.mandatory_registration ?? null,
        embassyLink: destination.embassy_url ?? null,
        providerResponse: { data, meta: payload.meta ?? null },
      });
    } catch {
      results.push({ pair, latencyMs: Math.round(performance.now() - start), error: 'Network, timeout, redirect or response-validation failure; trial stopped without retry.' });
      break;
    }
    // Deliberate pacing; actual account rate limits still govern requests.
    await new Promise(resolve => setTimeout(resolve, 1_100));
  }
  const directory = fileURLToPath(new URL('../output/travel-buddy/', import.meta.url));
  mkdirSync(directory, { recursive: true });
  const report = JSON.stringify({ testedAt: new Date().toISOString(), note: 'Provider data is unverified. Differences from snapshot are observations, not proof of accuracy.', results }, null, 2).split(key).join('[REDACTED]');
  const filename = 'trial-' + Date.now() + '.json';
  writeFileSync(directory + filename, report + '\n');
  console.log('Saved ignored report: output/travel-buddy/' + filename);
  console.table(results.map(r => ({ pair: JSON.stringify(r.pair), status: r.status ?? 'failed', latencyMs: r.latencyMs, outcome: r.error ?? 'Response recorded for review' })));
  if (results.some(r => r.error)) process.exitCode = 1;
}
main().catch(() => { console.error('Trial could not complete. No automatic retry.'); process.exitCode = 1; });
