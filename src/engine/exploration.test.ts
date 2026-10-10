import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RealAperironEngine } from './realEngine';
import { INITIAL_WORLD_STATE } from '../shared/contracts';
import { normalizeTravelDetails } from '../shared/travelDetails';
import { composeExploration } from './exploration';

test('precise exploration overrides leave baseline, score, DNA and simulation unchanged', () => {
  const engine = new RealAperironEngine(), result = engine.getPassportView('IN', INITIAL_WORLD_STATE); assert(result.success);
  const original = structuredClone(result.data), dna = engine.generateVisaDNA('IN', INITIAL_WORLD_STATE);
  const detail = normalizeTravelDetails({ data: { passport: { code: 'IN' }, destination: { code: 'JP' },
    visa_rules: { primary_rule: { name: 'Not admitted' }, exception_rule: { name: 'Visa-free', full_text: 'Only with qualifying residence' } } } }, 'IN', 'JP', new Date().toISOString());
  const view = composeExploration(original, [detail]);
  assert.equal(view.destinations.find(d => d.destinationId === 'JP')?.accessLevel, 'restricted'); assert.equal(view.score, original.score);
  assert.equal(view.accessBreakdown.total, 199); assert.deepEqual(result.data, original); assert.deepEqual(engine.generateVisaDNA('IN', INITIAL_WORLD_STATE), dna);
  const simulated = { ...original, destinations: original.destinations.map(d => d.destinationId === 'JP' ? { ...d, isSimulated: true } : d) };
  assert.deepEqual(composeExploration(simulated, [detail]).destinations, simulated.destinations);
});
