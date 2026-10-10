/**
 * Passport Index Data Verification Script
 * Validates the downloaded raw files in src/data/passport-index/
 * and the compiled PASSPORT_INDEX_DATA module.
 *
 * Source: https://github.com/imorte/passport-index-data
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  DESTINATIONS,
  getPassportIndexEntry,
  PASSPORT_INDEX_DATA,
  PASSPORTS,
  realEngine,
  resolveDestinationRequirements
} from '../src';

function runPassportIndexTests() {
  console.log('--- Verifying Real Passport Index Data Integration ---');

  // Test 1: Verify downloaded raw files exist
  const baseDir = path.resolve(process.cwd(), 'src/data/passport-index');
  const tidyCsv = path.join(baseDir, 'passport-index-tidy-iso2.csv');
  const matrixCsv = path.join(baseDir, 'passport-index-matrix-iso2.csv');
  const readme = path.join(baseDir, 'README.md');

  if (!fs.existsSync(tidyCsv) || !fs.existsSync(matrixCsv) || !fs.existsSync(readme)) {
    throw new Error('Missing downloaded raw files in src/data/passport-index/');
  }
  const tidySize = fs.statSync(tidyCsv).size;
  const matrixSize = fs.statSync(matrixCsv).size;
  console.log(`✓ Verified raw files in src/data/passport-index/ (tidy CSV: ${tidySize} bytes, matrix CSV: ${matrixSize} bytes)`);

  // Test 2: Check compiled dataset coverage across 199 countries
  const passportCount = Object.keys(PASSPORT_INDEX_DATA).length;
  if (passportCount < 195) {
    throw new Error(`Expected at least 195 passports in PASSPORT_INDEX_DATA, got ${passportCount}`);
  }
  console.log(`✓ PASSPORT_INDEX_DATA covers ${passportCount} sovereign countries and territories`);

  // Test 3: Coverage for all 12 aperiron passports and 30 destinations
  let checkedPairs = 0;
  for (const passport of PASSPORTS) {
    for (const destination of DESTINATIONS) {
      const entry = getPassportIndexEntry(passport.id, destination.id);
      if (!entry) {
        throw new Error(`Missing Passport Index entry for [${passport.id} -> ${destination.id}]`);
      }
      if (!['visa_free', 'visa_on_arrival', 'evisa', 'visa_required', 'restricted', 'unknown'].includes(entry.accessLevel)) {
        throw new Error(`Invalid accessLevel for [${passport.id} -> ${destination.id}]: ${entry.accessLevel}`);
      }
      checkedPairs++;
    }
  }
  if (checkedPairs !== 12 * 30) {
    throw new Error(`Expected 360 checked pairs, got ${checkedPairs}`);
  }
  console.log('✓ 100% coverage verified: all 360 aperiron passport-destination pairs resolve to real Passport Index data');

  // Test 4: Real-world ground truth checks from the downloaded dataset
  const sgJp = getPassportIndexEntry('SG', 'JP');
  if (sgJp?.accessLevel !== 'visa_free' || sgJp?.maxStayDays !== 90) {
    throw new Error(`Expected SG->JP to be visa_free for 90 days, got ${JSON.stringify(sgJp)}`);
  }

  const usDe = getPassportIndexEntry('US', 'DE');
  if (usDe?.accessLevel !== 'visa_free' || usDe?.maxStayDays !== 90) {
    throw new Error(`Expected US->DE to be visa_free for 90 days, got ${JSON.stringify(usDe)}`);
  }

  const inUs = getPassportIndexEntry('IN', 'US');
  if (inUs?.accessLevel !== 'visa_required') {
    throw new Error(`Expected IN->US to be visa_required, got ${JSON.stringify(inUs)}`);
  }

  const deIn = getPassportIndexEntry('DE', 'IN');
  if (deIn?.accessLevel !== 'evisa') {
    throw new Error(`Expected DE->IN to be evisa, got ${JSON.stringify(deIn)}`);
  }
  console.log('✓ Ground truth verified: SG->JP (90 days free), US->DE (90 days free), IN->US (visa required), DE->IN (eVisa)');

  // Test 5: Requirements resolver includes Passport Index citation
  const req = resolveDestinationRequirements({ passportId: 'SG', destinationId: 'FR' });
  const piCitation = req.sources.find((s) => s.id.startsWith('src-passport-index'));
  if (!piCitation) {
    throw new Error('resolveDestinationRequirements missing Passport Index citation in sources');
  }
  if (req.maxStayDays !== 90) {
    throw new Error(`Expected SG->FR stay to be 90 days from Passport Index, got ${req.maxStayDays}`);
  }
  console.log(`✓ Destination requirements resolver successfully incorporated Passport Index citation and stay limit (${req.maxStayDays} days)`);

  // Test 6: Real Engine operates smoothly with Passport Index dataset
  const catalog = realEngine.getCatalog();
  if (!catalog.datasetLabel.includes('Passport Index')) {
    throw new Error(`Catalog datasetLabel does not mention Passport Index: ${catalog.datasetLabel}`);
  }

  const inView = realEngine.getPassportView('IN', { creditsRemaining: 100, purchasedTreatyIds: [] });
  if (!inView.success || inView.data.score <= 0) {
    throw new Error('realEngine getPassportView failed with Passport Index data');
  }
  console.log(`✓ realEngine seamlessly computing mobility with real Passport Index data (India score: ${inView.data.score})`);

  console.log('\nAll Passport Index real data verification tests PASSED successfully!');
}

runPassportIndexTests();
