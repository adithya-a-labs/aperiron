import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
import { normalizeTravelDetails, record } from '../src/shared/travelDetails';
import { createDefaultTravelService, validateDetailRequest } from '../server/travel-details';

const env = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(env)) loadEnvFile(env);
const files = process.argv.slice(2);
if (!files.length) throw new Error('Pass local trial JSON paths; this command makes no API requests.');
const service = createDefaultTravelService();
let imported = 0, skipped = 0;
let remaining: number | undefined, resetAt = 0;
for (const file of files) {
  const report = record(JSON.parse(await readFile(file, 'utf8')));
  for (const raw of Array.isArray(report.results) ? report.results : []) {
    const item = record(raw), payload = item.body ?? item.response ?? item.providerResponse;
    const data = record(record(payload).data), passport = record(data.passport).code, destination = record(data.destination).code;
    try {
      if (item.status !== 200 || typeof report.testedAt !== 'string') throw new Error();
      const request = validateDetailRequest({ passportId: passport, destinationId: destination }, true);
      const details = normalizeTravelDetails(payload, request.passportId, request.destinationId!, report.testedAt);
      const old = (await service.read(request)).entries[0];
      if (!old || Date.parse(old.fetchedAt) < Date.parse(details.fetchedAt)) { await service.cache.put(details); imported++; }
    } catch { skipped++; }
    const quota = record(item.quota ?? item.quotaHeaders);
    const value = quota['x-ratelimit-requests-remaining'] ?? item.remaining;
    if (value !== undefined && value !== null && /^\d+$/.test(String(value))) remaining = Math.min(remaining ?? Infinity, Number(value));
    const seconds = Number(quota['x-ratelimit-requests-reset']);
    if (Number.isFinite(seconds) && seconds >= 0 && typeof report.testedAt === 'string') resetAt = Math.max(resetAt, Date.parse(report.testedAt) + seconds * 1000);
  }
}
if (remaining !== undefined) await service.cache.mutate(d => {
  // Only an empty uninitialized ledger may be seeded; importing must not undo newer reservations.
  if (d.quota.remaining === 0 && d.quota.resetAt === 0 && !d.quota.blocked && !d.quota.initialized) {
    d.quota.remaining = Math.min(120, remaining!); d.quota.resetAt = resetAt; d.quota.initialized = true;
  }
});
console.log(`Imported ${imported} pair responses; skipped ${skipped} non-detail/invalid entries. No API requests made.`);
