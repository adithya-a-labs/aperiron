import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { pageHash, readPage, readSelection } from '../src/frontend/navigation';
import { researchLinks } from '../src/frontend/researchLinks';

const selection = { passport: 'IN', destination: 'JP', comparison: 'DE' };

test('country deep links preserve the comparison pair and second-passport inspection', () => {
  const hash = pageHash('country', selection, 'second');
  assert.equal(readPage(hash), 'country');
  assert.deepEqual(readSelection(hash, { passport: 'US', destination: 'FR', comparison: 'GB' }), selection);
  assert.equal(new URLSearchParams(hash.split('?')[1]).get('inspect'), 'second');
  assert.ok(!pageHash('compare', selection, 'second').includes('inspect'));
});

test('untrusted hashes validate catalog identifiers and paused routes', () => {
  assert.deepEqual(readSelection('#/country?passport=zz&destination=%3Cscript%3E&comparison=de', selection), selection);
  assert.deepEqual(readSelection('#/dna?passport=us&destination=fr&comparison=gb', selection),
    { passport: 'US', destination: 'FR', comparison: 'GB' });
  for (const route of ['market', 'impact', 'optimizer', 'missing']) assert.equal(readPage(`#/${route}?passport=IN`), 'explore');
  assert.deepEqual(readSelection('#/country', selection), selection);
});

test('research leads accept explicit credential-free HTTPS links only and deduplicate', () => {
  assert.deepEqual(researchLinks('See https://example.gov/visa. Again [source](https://example.gov/visa). '
    + 'http://example.gov/no javascript:alert(1) https://user:secret@example.gov/private <script>bad</script>'),
  ['https://example.gov/visa']);
  assert.deepEqual(researchLinks('No explicit URL was returned.'), []);
});
