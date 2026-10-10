/**
 * Phase 2 Verification Script
 * Validates the full catalog, 199x199 baseline access matrix, treaties,
 * and sourced destination regulations against DATA_POLICY.md and CONTRACTS.md.
 */

import {
  BASELINE_ACCESS_MATRIX,
  DESTINATIONS,
  getFullCatalog,
  PASSPORTS,
  resolveDestinationRequirements,
  SOURCED_REGULATIONS,
  TREATIES
} from '../src/data';
import { AccessLevel } from '../src/shared/contracts';

const VALID_ACCESS_LEVELS: ReadonlySet<AccessLevel> = new Set([
  'visa_free',
  'visa_on_arrival',
  'evisa',
  'visa_required',
  'restricted',
  'unknown'
]);

function runPhase2Tests() {
  console.log('--- Verifying Phase 2 Data Catalog, Baseline Matrix & Treaties ---');

  // Test 1: Passport & Destination counts
  if (PASSPORTS.length !== 199) {
    throw new Error(`Expected 199 passports, got ${PASSPORTS.length}`);
  }
  if (DESTINATIONS.length !== 199) {
    throw new Error(`Expected 199 destinations, got ${DESTINATIONS.length}`);
  }
  console.log(`✓ Catalog contains exactly 199 passports and 199 destinations`);

  // Test 2: Full Catalog generation
  const catalog = getFullCatalog();
  if (catalog.passports.length !== 199 || catalog.destinations.length !== 199 || catalog.treaties.length !== 16) {
    throw new Error('getFullCatalog() count mismatch');
  }
  console.log(`✓ getFullCatalog() produced valid catalog structure with version ${catalog.datasetVersion}`);

  // Test 3: Matrix completeness (199 x 199 = 39,601 entries)
  let totalEntries = 0;
  const passportIds = new Set(PASSPORTS.map((p) => p.id));
  const destinationIds = new Set(DESTINATIONS.map((d) => d.id));

  for (const p of PASSPORTS) {
    const passportRow = BASELINE_ACCESS_MATRIX[p.id];
    if (!passportRow) {
      throw new Error(`Missing matrix row for passport '${p.id}'`);
    }

    for (const d of DESTINATIONS) {
      const level = passportRow[d.id];
      if (!level) {
        throw new Error(`Missing access level for pair [${p.id} -> ${d.id}]`);
      }
      if (!VALID_ACCESS_LEVELS.has(level)) {
        throw new Error(`Invalid access level '${level}' for pair [${p.id} -> ${d.id}]`);
      }

      // Self-destination must be visa_free
      if (p.id === d.id && level !== 'visa_free') {
        throw new Error(`Self-destination [${p.id} -> ${d.id}] must be 'visa_free', got '${level}'`);
      }

      totalEntries++;
    }
  }

  if (totalEntries !== 199 * 199) {
    throw new Error(`Expected 39601 matrix entries, got ${totalEntries}`);
  }
  console.log(`✓ Verified 199x199 Baseline Matrix (39601 total entries, all valid AccessLevels, self-access is visa_free)`);

  // Test 4: Treaties Validation
  if (TREATIES.length !== 16) {
    throw new Error(`Expected 16 treaties, got ${TREATIES.length}`);
  }

  const treatyIds = new Set<string>();
  for (const treaty of TREATIES) {
    if (treatyIds.has(treaty.id)) {
      throw new Error(`Duplicate treaty ID: '${treaty.id}'`);
    }
    treatyIds.add(treaty.id);

    if (treaty.cost < 10 || treaty.cost > 60 || !Number.isInteger(treaty.cost)) {
      throw new Error(`Treaty '${treaty.id}' has invalid cost: ${treaty.cost}`);
    }

    if (!treaty.name || !treaty.description || treaty.grants.length === 0) {
      throw new Error(`Treaty '${treaty.id}' has incomplete metadata or empty grants`);
    }

    for (const grant of treaty.grants) {
      if (grant.passportId !== '*' && !passportIds.has(grant.passportId)) {
        throw new Error(`Treaty '${treaty.id}' references unknown passport '${grant.passportId}'`);
      }
      if (!destinationIds.has(grant.destinationId)) {
        throw new Error(`Treaty '${treaty.id}' references unknown destination '${grant.destinationId}'`);
      }
      if (!VALID_ACCESS_LEVELS.has(grant.grantedAccessLevel)) {
        throw new Error(`Treaty '${treaty.id}' has invalid grant level '${grant.grantedAccessLevel}'`);
      }
    }
  }
  console.log(`✓ Verified 16 Border Market Treaties (unique IDs, cost bounds [10-60], valid grant targets)`);

  // Test 5: Sourced Regulations Validation
  if (SOURCED_REGULATIONS.length < 8) {
    throw new Error(`Expected at least 8 curated sourced regulations, got ${SOURCED_REGULATIONS.length}`);
  }

  for (const reg of SOURCED_REGULATIONS) {
    if (!passportIds.has(reg.passportId)) {
      throw new Error(`Sourced record '${reg.recordId}' references invalid passport '${reg.passportId}'`);
    }
    if (!destinationIds.has(reg.destinationId)) {
      throw new Error(`Sourced record '${reg.recordId}' references invalid destination '${reg.destinationId}'`);
    }
    if (reg.sources.length === 0) {
      throw new Error(`Sourced record '${reg.recordId}' has no official sources`);
    }
    for (const src of reg.sources) {
      if (!src.title || !src.issuingAuthority || !src.url.startsWith('https://')) {
        throw new Error(`Source '${src.id}' in record '${reg.recordId}' is invalid or missing https URL`);
      }
    }
  }
  console.log(`✓ Validated legacy regulation schema only; claims remain unreviewed (${SOURCED_REGULATIONS.length} records with official HTTPS sources and authorities)`);

  // Test 6: Sourced Regulation Resolver
  const exactReq = resolveDestinationRequirements({ passportId: 'IN', destinationId: 'JP' });
  if (exactReq.accessLevel !== BASELINE_ACCESS_MATRIX.IN.JP || exactReq.verifiedAt !== '' || exactReq.documents.length !== 0) {
    throw new Error('Unreviewed curated requirements leaked into IN -> JP lookup');
  }

  const fallbackReq = resolveDestinationRequirements({ passportId: 'BR', destinationId: 'FR' });
  if (fallbackReq.accessLevel !== 'visa_free' || fallbackReq.documents.length !== 0 || fallbackReq.fees !== undefined) {
    throw new Error('resolveDestinationRequirements failed fallback generation for BR -> FR');
  }
  console.log(`✓ resolveDestinationRequirements() returns snapshot classifications without invented detailed requirements`);

  console.log('\nAll Phase 2 Catalog, Matrix, Treaties & Regulations tests PASSED successfully!');
}

runPhase2Tests();
