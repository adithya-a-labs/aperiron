/**
 * Phase 3 Verification Script
 * Validates the core calculation engine implementation against contracts and mathematical invariants.
 */

import {
  INITIAL_WORLD_STATE,
  RealAperironEngine,
  realEngine,
  WorldState
} from '../src';

function runPhase3Tests() {
  console.log('--- Verifying Phase 3 Core Engine Implementation ---');

  // Test 1: Real Engine Catalog
  const catalog = realEngine.getCatalog();
  if (catalog.passports.length !== 12 || catalog.destinations.length !== 30 || catalog.treaties.length !== 16) {
    throw new Error('realEngine getCatalog() mismatch');
  }
  console.log('✓ realEngine instantiated successfully with 12 passports, 30 destinations, and 16 treaties');

  // Test 2: Passport View & Realistic Scoring Tiers
  const sgView = realEngine.getPassportView('SG', INITIAL_WORLD_STATE);
  const brView = realEngine.getPassportView('BR', INITIAL_WORLD_STATE);
  const inView = realEngine.getPassportView('IN', INITIAL_WORLD_STATE);
  const ngView = realEngine.getPassportView('NG', INITIAL_WORLD_STATE);

  if (!sgView.success || !brView.success || !inView.success || !ngView.success) {
    throw new Error('getPassportView failed for one or more passports');
  }

  console.log(`✓ Baseline Mobility Scores: SG=${sgView.data.score}, BR=${brView.data.score}, IN=${inView.data.score}, NG=${ngView.data.score}`);

  if (sgView.data.score < 80) {
    throw new Error(`Expected Singapore score >= 80, got ${sgView.data.score}`);
  }
  if (brView.data.score <= inView.data.score || inView.data.score <= ngView.data.score) {
    throw new Error('Score hierarchy mismatch across tiers (SG > BR > IN > NG)');
  }
  if (sgView.data.destinations.length !== 30 || sgView.data.accessBreakdown.total !== 30) {
    throw new Error('Breakdown or destination count mismatch');
  }
  console.log('✓ Scoring hierarchy adheres to realistic passport mobility tiers (Singapore > Brazil > India > Nigeria)');

  // Test 3: Invariant: State Immutability on Purchase
  const originalState: WorldState = { creditsRemaining: 100, purchasedTreatyIds: [] };
  const originalClone = JSON.stringify(originalState);

  const purchaseResult = realEngine.purchaseTreaty(originalState, 'treaty-in-jp-fasttrack');
  if (!purchaseResult.success) {
    throw new Error(`purchaseTreaty failed: ${purchaseResult.error.message}`);
  }

  if (JSON.stringify(originalState) !== originalClone) {
    throw new Error('purchaseTreaty violated immutability: original state object was mutated!');
  }
  if (purchaseResult.data.nextState.creditsRemaining !== 80) {
    throw new Error(`Expected 80 credits remaining, got ${purchaseResult.data.nextState.creditsRemaining}`);
  }
  if (!purchaseResult.data.nextState.purchasedTreatyIds.includes('treaty-in-jp-fasttrack')) {
    throw new Error('nextState missing purchased treaty ID');
  }
  console.log('✓ Invariant: purchaseTreaty strictly preserves state immutability (original state unchanged)');

  // Test 4: Invariant: Authoritative Impact Calculation
  const stateAfterTreaty = purchaseResult.data.nextState;
  const inViewAfter = realEngine.getPassportView('IN', stateAfterTreaty);
  if (!inViewAfter.success) {
    throw new Error('getPassportView failed for India after treaty');
  }

  const jpDestBefore = inView.data.destinations.find((d) => d.destinationId === 'JP');
  const jpDestAfter = inViewAfter.data.destinations.find((d) => d.destinationId === 'JP');

  if (jpDestBefore?.accessLevel !== 'evisa') {
    throw new Error(`Expected IN->JP before to be 'evisa', got ${jpDestBefore?.accessLevel}`);
  }
  if (jpDestAfter?.accessLevel !== 'visa_on_arrival') {
    throw new Error(`Expected IN->JP after to be 'visa_on_arrival', got ${jpDestAfter?.accessLevel}`);
  }
  if (!jpDestAfter?.isSimulated) {
    throw new Error('Expected IN->JP after treaty to be flagged as isSimulated: true');
  }

  console.log(`✓ India mobility score improved from ${inView.data.score} to ${inViewAfter.data.score} after Japan VoA accord`);

  // Test 5: Invariant: Reject Duplicate and Over-Budget Purchases
  const duplicatePurchase = realEngine.purchaseTreaty(stateAfterTreaty, 'treaty-in-jp-fasttrack');
  if (duplicatePurchase.success || duplicatePurchase.error.code !== 'ALREADY_PURCHASED') {
    throw new Error('purchaseTreaty failed to reject duplicate purchase with ALREADY_PURCHASED');
  }

  const brokeState: WorldState = { creditsRemaining: 5, purchasedTreatyIds: [] };
  const brokePurchase = realEngine.purchaseTreaty(brokeState, 'treaty-in-jp-fasttrack');
  if (brokePurchase.success || brokePurchase.error.code !== 'INSUFFICIENT_CREDITS') {
    throw new Error('purchaseTreaty failed to reject purchase with INSUFFICIENT_CREDITS');
  }
  console.log('✓ Successfully enforced ALREADY_PURCHASED and INSUFFICIENT_CREDITS error codes');

  // Test 6: Invariant: Visa DNA Determinism
  const dna1 = realEngine.generateVisaDNA('SG', INITIAL_WORLD_STATE);
  const dna2 = realEngine.generateVisaDNA('SG', { creditsRemaining: 25, purchasedTreatyIds: [] }); // different credits, same treaties
  if (!dna1.success || !dna2.success) {
    throw new Error('generateVisaDNA failed');
  }

  if (dna1.data.hash !== dna2.data.hash || dna1.data.vector.join(',') !== dna2.data.vector.join(',')) {
    throw new Error('Visa DNA non-deterministic across identical effective states!');
  }
  if (dna1.data.vector.length !== 30) {
    throw new Error(`Visa DNA vector length must be 30, got ${dna1.data.vector.length}`);
  }
  console.log(`✓ Invariant: Visa DNA produces strictly deterministic 30-dim vector and hash: ${dna1.data.hash}`);

  // Test 7: Passport Comparison Logic
  const comparison = realEngine.comparePassports('SG', 'IN', INITIAL_WORLD_STATE);
  if (!comparison.success) {
    throw new Error('comparePassports failed');
  }
  if (comparison.data.sharedAccessible.length === 0) {
    throw new Error('Expected shared accessible destinations between SG and IN');
  }
  if (comparison.data.onlyA.length === 0) {
    throw new Error('Expected destinations only accessible to SG');
  }
  console.log(`✓ Passport Comparison: SG vs IN has ${comparison.data.sharedAccessible.length} shared accessible destinations and ${comparison.data.onlyA.length} exclusive to SG`);

  // Test 8: Treaty Optimizer
  const optResult = realEngine.optimizeTreaties(INITIAL_WORLD_STATE, 50);
  if (!optResult.success) {
    throw new Error(`optimizeTreaties failed: ${optResult.error.message}`);
  }
  if (optResult.data.totalCost > 50) {
    throw new Error(`Optimizer exceeded budget: totalCost ${optResult.data.totalCost} > 50`);
  }
  if (optResult.data.recommendedTreatyIds.length === 0) {
    throw new Error('Optimizer failed to recommend affordable impactful treaties');
  }
  console.log(`✓ Optimizer recommended ${optResult.data.recommendedTreatyIds.length} treaties for ${optResult.data.totalCost} credits (Budget: 50): +${optResult.data.projectedImpact.scoreDelta} global score`);

  // Test 9: baseline-only requirements ignore extra simulation fields.
  const selection = { passportId: 'IN', destinationId: 'JP' };
  const reqBefore = realEngine.getDestinationRequirements(selection);
  const reqAfter = realEngine.getDestinationRequirements({ ...selection, ...{ state: stateAfterTreaty } });
  if (!reqBefore.success || !reqAfter.success) throw new Error('Requirements lookup failed');
  if (reqBefore.data.isSimulated || reqAfter.data.isSimulated ||
      JSON.stringify(reqBefore.data) !== JSON.stringify(reqAfter.data)) {
    throw new Error('Treaties must not alter baseline requirements');
  }
  if (reqBefore.data.verifiedAt !== '' || reqBefore.data.fees !== undefined) {
    throw new Error('Unreviewed requirements must not invent verification or fees');
  }
  console.log('✓ Baseline requirements unchanged by fictional state; details remain unverified');

  console.log('\nAll 9 Phase 3 Core Engine verification tests PASSED successfully!');
}

runPhase3Tests();
