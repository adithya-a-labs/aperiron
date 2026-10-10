import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { COUNTRIES } from './countryCatalog';
import { PASSPORTS, DESTINATIONS } from './catalog';
import { PASSPORT_INDEX_DATA } from './runtimePassportIndexData';
import { getMapCountryId } from './mapCountries';

test('catalog exposes exactly the full snapshot IDs with deterministic ordering and metadata', () => {
  assert.equal(PASSPORTS.length, 199);
  assert.equal(DESTINATIONS.length, 199);
  assert.deepEqual(PASSPORTS.map(c => c.id), Object.keys(PASSPORT_INDEX_DATA).sort());
  assert.deepEqual(DESTINATIONS.map(c => c.id), Object.keys(PASSPORT_INDEX_DATA.AF).sort());
  for (const c of COUNTRIES) {
    assert.ok(c.name && c.continent && c.flagEmoji);
    assert.ok(c.coordinates.every(Number.isFinite));
    assert.ok(Math.abs(c.coordinates[0]) <= 180 && Math.abs(c.coordinates[1]) <= 90);
    if (c.numericCode) assert.equal(getMapCountryId(c.numericCode), c.id);
  }
});

test('map resolves new countries, leading zero IDs and Kosovo without assigning unsupported areas', () => {
  const world = JSON.parse(readFileSync(new URL('../../node_modules/world-atlas/countries-110m.json', import.meta.url), 'utf8'));
  const mapped = world.objects.countries.geometries.map((g: { id?: string; properties: { name: string } }) => getMapCountryId(g.id, g.properties.name));
  for (const id of ['CN', 'IS', 'CA', 'FR', 'XK', 'AF']) assert.ok(mapped.includes(id), id);
  assert.equal(getMapCountryId(4), 'AF');
  assert.equal(getMapCountryId(undefined, 'Somaliland'), undefined);
  assert.equal(getMapCountryId('010', 'Antarctica'), undefined);
  assert.equal(getMapCountryId('304', 'Greenland'), undefined);
  // Singapore has no polygon in this coarse map; metadata supplies its point marker.
  assert.ok(!mapped.includes('SG'));
  assert.ok(COUNTRIES.find(c => c.id === 'SG')?.coordinates);
});
