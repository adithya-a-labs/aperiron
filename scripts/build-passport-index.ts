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


function parseRequirement(req: string): {
  accessLevel: 'visa_free' | 'visa_on_arrival' | 'evisa' | 'visa_required' | 'restricted' | 'unknown';
  maxStayDays: number | null;
} {
  const trimmed = req.trim().toLowerCase();

  if (trimmed === '-1' || trimmed === 'visa free') {
    return { accessLevel: 'visa_free', maxStayDays: null };
  }

  // Numeric values in Passport Index indicate visa-free entry with N days stay (e.g. 90, 30, 180, etc.)
  if (/^\d+$/.test(trimmed)) {
    return { accessLevel: 'visa_free', maxStayDays: parseInt(trimmed, 10) };
  }

  if (trimmed === 'e-visa') {
    return { accessLevel: 'evisa', maxStayDays: null };
  }

  if (trimmed === 'eta') {
    return { accessLevel: 'evisa', maxStayDays: null };
  }

  if (trimmed === 'visa on arrival') {
    return { accessLevel: 'visa_on_arrival', maxStayDays: null };
  }

  if (trimmed === 'visa required') {
    return { accessLevel: 'visa_required', maxStayDays: null };
  }

  if (trimmed === 'no admission') {
    return { accessLevel: 'restricted', maxStayDays: null };
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
  const matrix: Record<string, Record<string, { accessLevel: string; maxStayDays: number | null; rawRequirement: string }>> = {};

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
      rawRequirement: rawReq
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
 * License information: see src/data/passport-index/README.md
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
 * Resolves entry requirements from the bundled third-party Passport Index snapshot.
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
  // Compile the entire matrix with dictionary encoding to keep browser assets small.
  const passportIds = Object.keys(matrix).sort();
  const destinationIds = [...new Set(Object.values(matrix).flatMap(row => Object.keys(row)))].sort();
  const metadata: { cca2: string; ccn3: string; name: string; region: string; subregion: string; flag: string; latlng: [number, number] }[] =
    JSON.parse(fs.readFileSync(path.resolve('src/data/passport-index/country-metadata.json'), 'utf8'));
  const countries = [...new Set([...passportIds, ...destinationIds])].map(id => {
    const country = metadata.find(c => c.cca2 === id);
    if (!country) throw new Error('Missing country metadata for ' + id);
    return {
      id, name: country.name,
      continent: country.region === 'Americas'
        ? (country.subregion === 'South America' ? 'South America' : 'North America')
        : country.region,
      flagEmoji: country.flag,
      isPassportSupported: passportIds.includes(id),
      isDestinationSupported: destinationIds.includes(id),
      numericCode: country.ccn3,
      coordinates: [country.latlng[1], country.latlng[0]],
    };
  });
  fs.writeFileSync(path.resolve('src/data/countryCatalog.ts'),
    '/** Generated by npm run data:build. Country metadata: mledoze/countries (ODbL-1.0). */\n' +
    "import type { CountrySummary } from '../shared/contracts';\n" +
    'export const COUNTRIES: readonly (CountrySummary & { readonly numericCode: string; readonly coordinates: [number, number] })[] = ' +
    JSON.stringify(countries, null, 2) + ';\n');
  const vocabulary: typeof matrix[string][string][] = [];
  const rows = passportIds.map(p => destinationIds.map(d => {
    const entry = matrix[p][d];
    if (!entry) throw new Error('Missing snapshot entry ' + p + ' -> ' + d);
    let index = vocabulary.findIndex(v => v.rawRequirement === entry.rawRequirement);
    if (index < 0) index = vocabulary.push(entry) - 1;
    return String.fromCharCode(65 + index);
  }).join(''));
  const runtimeCode = [
    '/** Generated full Passport Index runtime snapshot. See passport-index/README.md. */',
    "import type { CountryId } from '../shared/contracts';",
    "import type { PassportIndexEntry } from './passportIndexData';",
    'const passports: string[] = ' + JSON.stringify(passportIds) + ';',
    'const destinations: string[] = ' + JSON.stringify(destinationIds) + ';',
    'const vocabulary: readonly PassportIndexEntry[] = ' + JSON.stringify(vocabulary) + ';',
    'vocabulary.forEach(Object.freeze);',
    'const rows: string[] = ' + JSON.stringify(rows, null, 2) + ';',
    'export const PASSPORT_INDEX_DATA: Record<CountryId, Record<CountryId, PassportIndexEntry>> = Object.fromEntries(',
    '  passports.map((p, i) => [p, Object.fromEntries(destinations.map((d, j) => [d, vocabulary[rows[i].charCodeAt(j) - 65]]))])',
    ');',
    'export function getPassportIndexEntry(passportId: CountryId, destinationId: CountryId): PassportIndexEntry | undefined {',
    '  return PASSPORT_INDEX_DATA[passportId]?.[destinationId];',
    '}',
    '',
  ].join('\n');
  fs.writeFileSync(path.resolve('src/data/runtimePassportIndexData.ts'), runtimeCode);
  console.log(`Successfully generated ${outputPath}`);
}

build();
