/**
 * aperiron: The Passport Paradox
 * Passport Index Data Compiler
 *
 * Reads raw CSV from src/data/passport-index/passport-index-tidy-iso2.csv
 * and compiles it into a type-safe TypeScript module for in-memory, browser-safe usage.
 *
 * Source: https://github.com/imorte/passport-index-data
 */

import * as fs from 'fs';
import * as path from 'path';

interface ParsedEntry {
  passport: string;
  destination: string;
  rawRequirement: string;
  accessLevel: 'visa_free' | 'visa_on_arrival' | 'evisa' | 'visa_required' | 'restricted' | 'unknown';
  maxStayDays: number | null;
}

function parseRequirement(req: string): {
  accessLevel: 'visa_free' | 'visa_on_arrival' | 'evisa' | 'visa_required' | 'restricted' | 'unknown';
  maxStayDays: number | null;
} {
  const trimmed = req.trim().toLowerCase();

  if (trimmed === '-1' || trimmed === 'visa free') {
    return { accessLevel: 'visa_free', maxStayDays: 90 };
  }

  // Numeric values in Passport Index indicate visa-free entry with N days stay (e.g. 90, 30, 180, etc.)
  if (/^\d+$/.test(trimmed)) {
    return { accessLevel: 'visa_free', maxStayDays: parseInt(trimmed, 10) };
  }

  if (trimmed === 'e-visa') {
    return { accessLevel: 'evisa', maxStayDays: 30 };
  }

  if (trimmed === 'eta') {
    return { accessLevel: 'evisa', maxStayDays: 90 };
  }

  if (trimmed === 'visa on arrival') {
    return { accessLevel: 'visa_on_arrival', maxStayDays: 30 };
  }

  if (trimmed === 'visa required') {
    return { accessLevel: 'visa_required', maxStayDays: null };
  }

  if (trimmed === 'no admission') {
    return { accessLevel: 'restricted', maxStayDays: 0 };
  }

  return { accessLevel: 'unknown', maxStayDays: null };
}

function build() {
  const csvPath = path.resolve(process.cwd(), 'src/data/passport-index/passport-index-tidy-iso2.csv');
  const outputPath = path.resolve(process.cwd(), 'src/data/passportIndexData.ts');

  console.log(`Reading CSV from ${csvPath}...`);
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

  // Skip header: Passport,Destination,Requirement
  const matrix: Record<string, Record<string, { accessLevel: string; maxStayDays: number | null; raw: string }>> = {};

  let recordCount = 0;
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < 3) continue;

    const passport = parts[0].trim().toUpperCase();
    const destination = parts[1].trim().toUpperCase();
    const rawReq = parts.slice(2).join(',').trim();

    if (!passport || !destination) continue;

    const parsed = parseRequirement(rawReq);

    if (!matrix[passport]) {
      matrix[passport] = {};
    }

    matrix[passport][destination] = {
      accessLevel: parsed.accessLevel,
      maxStayDays: parsed.maxStayDays,
      raw: rawReq
    };
    recordCount++;
  }

  console.log(`Parsed ${recordCount} passport-destination records across ${Object.keys(matrix).length} passports.`);

  // Write TypeScript module
  const tsCode = `/**
 * aperiron: The Passport Paradox
 * Compiled Passport Index Dataset
 *
 * Source: https://github.com/imorte/passport-index-data
 * License: ODbL / Open Data
 * Total Records: ${recordCount} across ${Object.keys(matrix).length} sovereign nations and territories.
 */

import type { AccessLevel, CountryId } from '../shared/contracts';

export interface PassportIndexEntry {
  readonly accessLevel: AccessLevel;
  readonly maxStayDays: number | null;
  readonly rawRequirement: string;
}

export const PASSPORT_INDEX_DATA: Record<CountryId, Record<CountryId, PassportIndexEntry>> = ${JSON.stringify(
    matrix,
    null,
    2
  )};

/**
 * Resolves entry requirements from the official Passport Index dataset.
 */
export function getPassportIndexEntry(
  passportId: CountryId,
  destinationId: CountryId
): PassportIndexEntry | undefined {
  if (passportId === destinationId) {
    return {
      accessLevel: 'visa_free',
      maxStayDays: null,
      rawRequirement: 'Domestic entry'
    };
  }
  return PASSPORT_INDEX_DATA[passportId]?.[destinationId];
}
`;

  fs.writeFileSync(outputPath, tsCode, 'utf-8');
  console.log(`Successfully generated ${outputPath}`);
}

build();
