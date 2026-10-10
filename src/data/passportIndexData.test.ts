import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { PASSPORT_INDEX_DATA } from './passportIndexData';
import { PASSPORT_INDEX_DATA as RUNTIME_DATA } from './runtimePassportIndexData';
import { PASSPORTS, DESTINATIONS } from './catalog';

test('full runtime dataset exactly matches the audited snapshot for every catalog country', () => {
  assert.deepEqual(Object.keys(RUNTIME_DATA), PASSPORTS.map(p => p.id));
  for (const passport of PASSPORTS) {
    assert.deepEqual(Object.keys(RUNTIME_DATA[passport.id]), DESTINATIONS.map(d => d.id));
    for (const destination of DESTINATIONS)
      assert.deepEqual(RUNTIME_DATA[passport.id][destination.id], PASSPORT_INDEX_DATA[passport.id][destination.id]);
  }
});

test('every compiled entry preserves the CSV value and only numeric stays', () => {
  const rows = readFileSync(new URL('./passport-index/passport-index-tidy-iso2.csv', import.meta.url), 'utf8')
    .trim().split(/\r?\n/).slice(1);
  let count = 0;
  for (const row of rows) {
    const [passport, destination, raw] = row.split(',');
    const entry = PASSPORT_INDEX_DATA[passport][destination];
    assert.equal(entry.rawRequirement, raw, `${passport} -> ${destination}`);
    assert.equal(entry.maxStayDays, /^\d+$/.test(raw) ? Number(raw) : null);
    const expected = /^\d+$/.test(raw) || raw === 'visa free' || raw === '-1' ? 'visa_free'
      : raw === 'e-visa' || raw === 'eta' ? 'evisa'
      : raw === 'visa on arrival' ? 'visa_on_arrival'
      : raw === 'visa required' ? 'visa_required'
      : raw === 'no admission' ? 'restricted' : 'unknown';
    assert.equal(entry.accessLevel, expected);
    count++;
  }
  assert.equal(Object.values(PASSPORT_INDEX_DATA).reduce((n, row) => n + Object.keys(row).length, 0), count);
  assert.equal(count, 39601);
});
