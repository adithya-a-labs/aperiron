/**
 * Phase 1 Verification Script
 * Validates mock engine behavior against contracts and fixtures.
 */

import { MockAperironEngine } from '../src/mocks/mockEngine';
import {
  FIXTURE_INITIAL_STATE,
  FIXTURE_PASSPORTS,
  FIXTURE_TREATIES
} from '../src/shared/fixtures';

function runTests() {
  console.log('--- Verifying Phase 1 Contracts & Mock Engine ---');
  const engine = new MockAperironEngine();

  // Test 1: getCatalog
  const catalog = engine.getCatalog();
  if (catalog.passports.length !== FIXTURE_PASSPORTS.length) {
    throw new Error('getCatalog failed: passport count mismatch');
  }
  console.log('✓ getCatalog() returned valid catalog');

  // Test 2: getPassportView
  const viewResult = engine.getPassportView('SG', FIXTURE_INITIAL_STATE);
  if (!viewResult.success) {
    throw new Error(`getPassportView failed: ${viewResult.error.message}`);
  }
  if (viewResult.data.score <= 0 || viewResult.data.destinations.length === 0) {
    throw new Error('getPassportView failed: invalid score or empty destinations');
  }
  console.log(`✓ getPassportView('SG') score: ${viewResult.data.score}, destinations: ${viewResult.data.destinations.length}`);

  // Test 3: Invalid Passport error
  const invalidView = engine.getPassportView('INVALID', FIXTURE_INITIAL_STATE);
  if (invalidView.success || invalidView.error.code !== 'INVALID_PASSPORT') {
    throw new Error('getPassportView failed: expected INVALID_PASSPORT error');
  }
  console.log('✓ getPassportView correctly returned INVALID_PASSPORT for invalid input');

  // Test 4: comparePassports
  const compResult = engine.comparePassports('SG', 'IN', FIXTURE_INITIAL_STATE);
  if (!compResult.success) {
    throw new Error(`comparePassports failed: ${compResult.error.message}`);
  }
  console.log(`✓ comparePassports('SG', 'IN') shared: ${compResult.data.sharedAccessible.length}, only SG: ${compResult.data.onlyA.length}, only IN: ${compResult.data.onlyB.length}`);

  // Test 5: generateVisaDNA determinism
  const dna1 = engine.generateVisaDNA('SG', FIXTURE_INITIAL_STATE);
  const dna2 = engine.generateVisaDNA('SG', FIXTURE_INITIAL_STATE);
  if (!dna1.success || !dna2.success) {
    throw new Error('generateVisaDNA failed');
  }
  if (dna1.data.hash !== dna2.data.hash || dna1.data.vector.join(',') !== dna2.data.vector.join(',')) {
    throw new Error('generateVisaDNA failed: non-deterministic output');
  }
  console.log(`✓ generateVisaDNA('SG') deterministic hash: ${dna1.data.hash}`);

  // Test 6: purchaseTreaty immutability & validation
  const initialState = { ...FIXTURE_INITIAL_STATE };
  const purchaseResult = engine.purchaseTreaty(initialState, 'treaty-in-jp-voa');
  if (!purchaseResult.success) {
    throw new Error(`purchaseTreaty failed: ${purchaseResult.error.message}`);
  }
  if (initialState.creditsRemaining !== 100 || initialState.purchasedTreatyIds.length !== 0) {
    throw new Error('purchaseTreaty failed: input state was mutated!');
  }
  if (purchaseResult.data.nextState.creditsRemaining !== 80) {
    throw new Error(`purchaseTreaty failed: expected 80 credits, got ${purchaseResult.data.nextState.creditsRemaining}`);
  }
  console.log(`✓ purchaseTreaty succeeded with immutability preserved (remaining credits: ${purchaseResult.data.nextState.creditsRemaining})`);

  // Test 7: Duplicate treaty purchase failure
  const duplicateResult = engine.purchaseTreaty(purchaseResult.data.nextState, 'treaty-in-jp-voa');
  if (duplicateResult.success || duplicateResult.error.code !== 'ALREADY_PURCHASED') {
    throw new Error('purchaseTreaty failed: expected ALREADY_PURCHASED error');
  }
  console.log('✓ purchaseTreaty rejected duplicate purchase');

  // Test 8: Insufficient credits failure
  const brokeState = { creditsRemaining: 10, purchasedTreatyIds: [] };
  const brokeResult = engine.purchaseTreaty(brokeState, 'treaty-in-jp-voa');
  if (brokeResult.success || brokeResult.error.code !== 'INSUFFICIENT_CREDITS') {
    throw new Error('purchaseTreaty failed: expected INSUFFICIENT_CREDITS error');
  }
  console.log('✓ purchaseTreaty rejected purchase with insufficient credits');

  // Test 9: optimizeTreaties
  const optResult = engine.optimizeTreaties(FIXTURE_INITIAL_STATE, 60);
  if (!optResult.success) {
    throw new Error(`optimizeTreaties failed: ${optResult.error.message}`);
  }
  if (optResult.data.totalCost > 60) {
    throw new Error('optimizeTreaties exceeded requested budget!');
  }
  console.log(`✓ optimizeTreaties recommended ${optResult.data.recommendedTreatyIds.length} treaties for cost ${optResult.data.totalCost} (budget: 60)`);

  // Test 10: getDestinationRequirements
  const reqResult = engine.getDestinationRequirements({ passportId: 'IN', destinationId: 'JP' });
  if (!reqResult.success) {
    throw new Error(`getDestinationRequirements failed: ${reqResult.error.message}`);
  }
  if (!reqResult.data.sources || reqResult.data.sources.length === 0) {
    throw new Error('getDestinationRequirements failed: missing official sources');
  }
  console.log(`✓ getDestinationRequirements('IN', 'JP') access: ${reqResult.data.accessLevel}, sources: ${reqResult.data.sources[0].title}`);

  console.log('\nAll 10 Phase 1 Contract & Mock Engine verification tests PASSED successfully!');
}

runTests();
