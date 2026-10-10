/**
 * Phase 4 Parity Verification Script
 * Validates interface parity, error code consistency, and behavioral conformity
 * between MockAperironEngine and RealAperironEngine across shared fixtures and live datasets.
 *
 * @see docs/CONTRACTS.md (Shared fixtures and compatibility)
 * @see docs/DEVELOPMENT.md (First implementation milestone)
 */

import {
  AperironEngine,
  FIXTURE_CATALOG,
  FIXTURE_INITIAL_STATE,
  INITIAL_WORLD_STATE,
  MockAperironEngine,
  mockEngine,
  RealAperironEngine,
  realEngine
} from '../src';

function runParityTests() {
  console.log('--- Verifying Phase 4: Mock & Real Engine Contract Parity ---');

  // Instantiate both engines against the EXACT same synthetic fixture catalog
  const fixtureMock: AperironEngine = new MockAperironEngine(FIXTURE_CATALOG);
  const fixtureReal: AperironEngine = new RealAperironEngine(FIXTURE_CATALOG);

  // Test 1: Interface Method Signatures
  const requiredMethods: (keyof AperironEngine)[] = [
    'getCatalog',
    'getPassportView',
    'comparePassports',
    'generateVisaDNA',
    'purchaseTreaty',
    'calculateImpact',
    'optimizeTreaties',
    'getDestinationRequirements'
  ];

  for (const method of requiredMethods) {
    if (typeof fixtureMock[method] !== 'function' || typeof fixtureReal[method] !== 'function') {
      throw new Error(`Engine missing required method: ${method}`);
    }
  }
  console.log('✓ Both MockAperironEngine and RealAperironEngine implement all 8 AperironEngine methods');

  // Test 2: Catalog Structure Parity
  const mockCat = fixtureMock.getCatalog();
  const realCat = fixtureReal.getCatalog();
  if (
    mockCat.passports.length !== realCat.passports.length ||
    mockCat.destinations.length !== realCat.destinations.length ||
    mockCat.treaties.length !== realCat.treaties.length
  ) {
    throw new Error('Catalog structure mismatch between mock and real engine');
  }
  console.log(`✓ Catalog Parity: exactly ${realCat.passports.length} passports, ${realCat.destinations.length} destinations, and ${realCat.treaties.length} treaties`);

  // Test 3: Passport View & Score Parity on Shared Fixture
  const mockView = fixtureMock.getPassportView('SG', FIXTURE_INITIAL_STATE);
  const realView = fixtureReal.getPassportView('SG', FIXTURE_INITIAL_STATE);

  if (!mockView.success || !realView.success) {
    throw new Error('getPassportView failed on fixture engines');
  }
  if (mockView.data.score !== realView.data.score) {
    throw new Error(`Score parity mismatch: mock=${mockView.data.score}, real=${realView.data.score}`);
  }
  if (mockView.data.destinations.length !== realView.data.destinations.length) {
    throw new Error('Destination length parity mismatch');
  }
  console.log(`✓ Passport View Parity: SG fixture score matches exactly (${realView.data.score}/100)`);

  // Test 4: Comparison Parity
  const mockComp = fixtureMock.comparePassports('SG', 'IN', FIXTURE_INITIAL_STATE);
  const realComp = fixtureReal.comparePassports('SG', 'IN', FIXTURE_INITIAL_STATE);

  if (!mockComp.success || !realComp.success) {
    throw new Error('comparePassports failed on fixture engines');
  }
  if (mockComp.data.sharedAccessible.length !== realComp.data.sharedAccessible.length) {
    throw new Error('Comparison sharedAccessible count mismatch');
  }
  if (mockComp.data.onlyA.length !== realComp.data.onlyA.length) {
    throw new Error('Comparison onlyA count mismatch');
  }
  console.log(`✓ Comparison Parity: SG vs IN shared (${realComp.data.sharedAccessible.length}) and exclusive (${realComp.data.onlyA.length}) counts match`);

  // Test 5: Treaty Purchase & State Immutability Parity
  const mockPurchase = fixtureMock.purchaseTreaty(FIXTURE_INITIAL_STATE, 'treaty-in-jp-voa');
  const realPurchase = fixtureReal.purchaseTreaty(FIXTURE_INITIAL_STATE, 'treaty-in-jp-voa');

  if (!mockPurchase.success || !realPurchase.success) {
    throw new Error('purchaseTreaty failed on fixture engines');
  }
  if (mockPurchase.data.nextState.creditsRemaining !== realPurchase.data.nextState.creditsRemaining) {
    throw new Error('Remaining credits mismatch between mock and real engine');
  }
  if (mockPurchase.data.nextState.creditsRemaining !== 80) {
    throw new Error(`Expected 80 credits, got ${realPurchase.data.nextState.creditsRemaining}`);
  }
  console.log('✓ Purchase Parity: both deduct exactly 20 credits (100 -> 80) and update state');

  // Test 6: Typed Error Code Parity
  // Case A: INVALID_PASSPORT
  const mockErrP = fixtureMock.getPassportView('INVALID_XX', FIXTURE_INITIAL_STATE);
  const realErrP = fixtureReal.getPassportView('INVALID_XX', FIXTURE_INITIAL_STATE);
  if (mockErrP.success || realErrP.success || mockErrP.error.code !== realErrP.error.code || realErrP.error.code !== 'INVALID_PASSPORT') {
    throw new Error('INVALID_PASSPORT error code mismatch');
  }

  // Case B: ALREADY_PURCHASED
  const boughtState = realPurchase.data.nextState;
  const mockErrD = fixtureMock.purchaseTreaty(boughtState, 'treaty-in-jp-voa');
  const realErrD = fixtureReal.purchaseTreaty(boughtState, 'treaty-in-jp-voa');
  if (mockErrD.success || realErrD.success || mockErrD.error.code !== realErrD.error.code || realErrD.error.code !== 'ALREADY_PURCHASED') {
    throw new Error('ALREADY_PURCHASED error code mismatch');
  }

  // Case C: INSUFFICIENT_CREDITS
  const brokeState = { creditsRemaining: 5, purchasedTreatyIds: [] };
  const mockErrC = fixtureMock.purchaseTreaty(brokeState, 'treaty-in-jp-voa');
  const realErrC = fixtureReal.purchaseTreaty(brokeState, 'treaty-in-jp-voa');
  if (mockErrC.success || realErrC.success || mockErrC.error.code !== realErrC.error.code || realErrC.error.code !== 'INSUFFICIENT_CREDITS') {
    throw new Error('INSUFFICIENT_CREDITS error code mismatch');
  }

  // Case D: INVALID_BUDGET
  const mockErrB = fixtureMock.optimizeTreaties(FIXTURE_INITIAL_STATE, -10);
  const realErrB = fixtureReal.optimizeTreaties(FIXTURE_INITIAL_STATE, -10);
  if (mockErrB.success || realErrB.success || mockErrB.error.code !== realErrB.error.code || realErrB.error.code !== 'INVALID_BUDGET') {
    throw new Error('INVALID_BUDGET error code mismatch');
  }
  console.log('✓ Error Code Parity: INVALID_PASSPORT, ALREADY_PURCHASED, INSUFFICIENT_CREDITS, INVALID_BUDGET perfectly match');

  // Test 7: Visa DNA Vector Determinism & Structure Parity
  const mockDna = fixtureMock.generateVisaDNA('SG', FIXTURE_INITIAL_STATE);
  const realDna = fixtureReal.generateVisaDNA('SG', FIXTURE_INITIAL_STATE);
  if (!mockDna.success || !realDna.success) {
    throw new Error('generateVisaDNA failed on fixture engines');
  }
  if (mockDna.data.vector.length !== realDna.data.vector.length) {
    throw new Error('DNA vector length mismatch');
  }
  if (!realDna.data.hash.startsWith('dna-sg-')) {
    throw new Error('DNA hash format invalid');
  }
  console.log(`✓ Visa DNA Parity: vector lengths match (${realDna.data.vector.length}-dim) and hash prefix conforms (dna-sg-)`);

  // Test 8: Sourced Regulations Parity
  const mockReq = fixtureMock.getDestinationRequirements({ passportId: 'IN', destinationId: 'JP' });
  const realReq = fixtureReal.getDestinationRequirements({ passportId: 'IN', destinationId: 'JP' });
  if (!mockReq.success || !realReq.success) {
    throw new Error('getDestinationRequirements failed on fixture engines');
  }
  if (mockReq.data.accessLevel !== realReq.data.accessLevel || realReq.data.accessLevel !== 'visa_required') {
    throw new Error('Requirements accessLevel mismatch');
  }
  if (realReq.data.sources.length === 0 || !realReq.data.sources[0].url.startsWith('https://')) {
    throw new Error('Requirements sources missing on real engine');
  }
  console.log(`✓ Sourced Regulations Parity: IN -> JP access matches (visa_required) with official consular citations`);

  // Test 9: Live Engine Swappability Check
  // dev-adithyaa can swap mockEngine with realEngine seamlessly:
  const engines: { label: string; instance: AperironEngine }[] = [
    { label: 'Mock Singleton (mockEngine)', instance: mockEngine },
    { label: 'Real Singleton (realEngine)', instance: realEngine }
  ];

  for (const { label, instance } of engines) {
    const liveCat = instance.getCatalog();
    const liveView = instance.getPassportView(liveCat.passports[0].id, INITIAL_WORLD_STATE);
    if (!liveView.success || liveView.data.destinations.length === 0) {
      throw new Error(`Engine swap verification failed on ${label}`);
    }
    console.log(`✓ Swappable Singleton: '${label}' executes cleanly with score=${liveView.data.score}`);
  }

  console.log('\nAll Phase 4 Contract Parity & Swappability verification tests PASSED successfully!');
}

runParityTests();
