import { normalizeTravelDetails } from '../src/shared/travelDetails';

export class TravelProviderError extends Error {
  constructor(public kind: 'auth' | 'quota' | 'unavailable', public retryAt = 0) { super('Travel details could not refresh.'); }
}
export async function fetchTravelDetails(passport: string, destination: string, apiKey: string, fetchImpl: typeof fetch = fetch,
  onHeaders: (headers: Headers) => Promise<void> = async () => {}, timeoutMs = 30_000) {
  const response = await fetchImpl('https://visa-requirement.p.rapidapi.com/v2/visa/check', {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(timeoutMs),
    headers: { 'Content-Type': 'application/json', 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': 'visa-requirement.p.rapidapi.com' },
    body: JSON.stringify({ passport, destination }),
  });
  await onHeaders(response.headers);
  if (!response.ok) {
    await response.body?.cancel();
    const retry = response.headers.get('retry-after');
    const retryAt = retry ? (/^\d+$/.test(retry) ? Date.now() + Number(retry) * 1000 : Date.parse(retry)) : 0;
    throw new TravelProviderError(response.status === 401 || response.status === 403 ? 'auth' : response.status === 429 ? 'quota' : 'unavailable', Number.isFinite(retryAt) ? retryAt : 0);
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Empty response.');
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { value, done } = await reader.read(); if (done) break;
    size += value.length;
    if (size > 128_000) { await reader.cancel(); throw new Error('Response too large.'); }
    chunks.push(value);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  // Do not retain any upstream echo of the credential, even in unexpected fields.
  const payload: unknown = JSON.parse(raw.split(apiKey).join('[REDACTED]'));
  return normalizeTravelDetails(payload, passport, destination, new Date().toISOString());
}
