import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { COUNTRIES } from './countryCatalog';
import { getCountryLandmark } from './countryLandmarks';

test('registry generation input preserves the shipped landmark metadata and image paths', () => {
  const input = JSON.parse(readFileSync(new URL('./allLandmarksCatalog.json', import.meta.url), 'utf8'));
  assert.equal(input.length, COUNTRIES.length);
  assert.equal(new Set(input.map((item: { id: string }) => item.id)).size, COUNTRIES.length);
  for (const item of input) {
    const landmark = getCountryLandmark(item.id);
    assert.equal(item.landmarkName, landmark.landmarkName, item.id);
    assert.equal(item.location, landmark.location, item.id);
    assert.equal(item.caption, landmark.caption, item.id);
    assert.equal(item.imagePath.replace(/\.png$/, '.webp'), landmark.imagePath, item.id);
  }
});

test('every supported destination resolves to a bundled WebP postcard', () => {
  for (const country of COUNTRIES.filter(c => c.isDestinationSupported)) {
    const landmark = getCountryLandmark(country.id);
    assert.equal(landmark.countryName, country.name);
    assert.match(landmark.imagePath ?? '', /^\/images\/postcards\/[a-z0-9-]+\.webp$/, country.id);
    const bytes = readFileSync(new URL(`../../public${landmark.imagePath}`, import.meta.url));
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF', country.id);
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP', country.id);
    assert.equal(bytes.readUInt32LE(4) + 8, bytes.length, `${country.id}: complete WebP container`);
  }
});

test('landmark lookup accepts lowercase IDs and leaves unknown images unavailable', () => {
  assert.deepEqual(getCountryLandmark('jp'), getCountryLandmark('JP'));
  assert.equal(getCountryLandmark('XX').imagePath, undefined);
});
