import assert from 'node:assert/strict';
import { test } from 'node:test';
import { engine, catalog } from '../frontend/engine';
import { realEngine, RealAperironEngine } from './realEngine';
import { INITIAL_WORLD_STATE, isAccessible, type Result, type PassportView, type VisaDNA, type DestinationRequirements } from '../shared/contracts';
import { BASELINE_ACCESS_MATRIX } from '../data/baselineMatrix';
import { getPassportIndexEntry } from '../data/passportIndexData';

function value<T>(result: Result<T>): T {
  if (!result.success) throw new Error(result.error.message);
  return result.data;
}

test('frontend uses the real engine and all country lookups agree with map data', () => {
  assert.equal(engine, realEngine);
  for (const passport of catalog.passports) {
    const view: PassportView = value(engine.getPassportView(passport.id, INITIAL_WORLD_STATE));
    const dna: VisaDNA = value(engine.generateVisaDNA(passport.id, INITIAL_WORLD_STATE));
    assert.equal(dna.vector.length, view.destinations.length);
    assert.deepEqual(dna.summary, view.accessBreakdown);
    for (const destination of view.destinations) {
      const req: DestinationRequirements = value(engine.getDestinationRequirements({ passportId: passport.id, destinationId: destination.destinationId }));
      assert.equal(req.accessLevel, destination.accessLevel);
      assert.equal(req.verifiedAt, '');
      assert.equal(req.fees, undefined);
      assert.equal(req.processingTime, undefined);
      assert.deepEqual(req.documents, []);
      assert.equal(req.applicationChannel.url, undefined);
      assert.equal(req.maxStayDays, getPassportIndexEntry(passport.id, destination.destinationId)?.maxStayDays ?? null);
      assert.equal(destination.maxStayDays, req.maxStayDays);
    }
  }
});

test('unsupported purposes and passport types never reuse tourism requirements', () => {
  for (const travellerContext of [{ purpose: 'business' }, { purpose: 'transit' }, { purpose: 'conference' }, { passportType: 'diplomatic' }, { passportType: 'service' }] as const) {
    const req = value(engine.getDestinationRequirements({ passportId: 'SG', destinationId: 'JP', travellerContext }));
    assert.equal(req.accessLevel, 'unknown');
    assert.equal(req.maxStayDays, null);
    assert.equal(req.sources.length, 0);
    assert.ok(req.unresolvedConditions?.length);
  }
});

test('comparison sets agree with every passport view', () => {
  for (const passport of catalog.passports) {
    const comparison = value(engine.comparePassports(passport.id, 'IN', INITIAL_WORLD_STATE));
    const a = value(engine.getPassportView(passport.id, INITIAL_WORLD_STATE));
    const b = value(engine.getPassportView('IN', INITIAL_WORLD_STATE));
    assert.equal(comparison.scoreA, a.score);
    assert.equal(comparison.scoreB, b.score);
    assert.deepEqual(comparison.sharedAccessible, a.destinations.filter((d, i) => isAccessible(d.accessLevel) && isAccessible(b.destinations[i].accessLevel)).map(d => d.destinationId));
    assert.deepEqual(comparison.onlyA, a.destinations.filter((d, i) => isAccessible(d.accessLevel) && !isAccessible(b.destinations[i].accessLevel)).map(d => d.destinationId));
    assert.deepEqual(comparison.onlyB, b.destinations.filter((d, i) => isAccessible(d.accessLevel) && !isAccessible(a.destinations[i].accessLevel)).map(d => d.destinationId));
  }
});

test('returned catalog mutations cannot corrupt the engine', () => {
  const isolated = new RealAperironEngine();
  const original = isolated.getCatalog();
  const mutable = isolated.getCatalog() as unknown as { passports: { name: string }[]; treaties: { grants: { grantedAccessLevel: string }[] }[] };
  mutable.passports[0].name = 'Corrupted';
  mutable.treaties[0].grants[0].grantedAccessLevel = 'unknown';
  assert.deepEqual(isolated.getCatalog(), original);
});

test('baseline regulation data stays unchanged after purchase and rejects invalid selections', () => {
  const params = { passportId: 'IN', destinationId: 'JP' };
  const before = engine.getDestinationRequirements(params);
  const purchase = value(engine.purchaseTreaty(INITIAL_WORLD_STATE, 'treaty-in-jp-fasttrack'));
  assert.notEqual(value(engine.getPassportView('IN', purchase.nextState)).destinations.find(d => d.destinationId === 'JP')?.accessLevel, BASELINE_ACCESS_MATRIX.IN.JP);
  assert.deepEqual(engine.getDestinationRequirements({ ...params, ...{ state: purchase.nextState } }), before);
  for (const [passportId, destinationId, code] of [['XX', 'JP', 'INVALID_PASSPORT'], ['IN', 'XX', 'INVALID_DESTINATION']]) {
    const result = engine.getDestinationRequirements({ passportId, destinationId });
    assert.equal(result.success, false);
    if (!result.success) assert.equal(result.error.code, code);
  }
});

test('optimizer with exhausted credits reports the actual unchanged world score', () => {
  const state = { creditsRemaining: 0, purchasedTreatyIds: [] };
  const result = value(engine.optimizeTreaties(state, 50));
  assert.deepEqual(result.recommendedTreatyIds, []);
  assert.equal(result.totalCost, 0);
  assert.deepEqual(result.projectedImpact, value(engine.calculateImpact(state, state)));
});
