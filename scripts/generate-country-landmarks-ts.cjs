const fs = require('fs');
const list = JSON.parse(fs.readFileSync('src/data/allLandmarksCatalog.json', 'utf8'));

let out = `import { COUNTRIES } from "./countryCatalog";

export interface CountryLandmark {
  readonly countryId: string;
  readonly countryName: string;
  readonly landmarkName: string;
  readonly location: string;
  readonly caption: string;
  readonly imagePath?: string;
}

/**
 * Comprehensive iconic landmark registry for all 199 countries worldwide.
 * Follows the 16:9 cartoonish travel illustration aesthetic (WebP format).
 */
export const CURATED_LANDMARKS: Record<string, { landmarkName: string; location: string; caption: string; imagePath?: string }> = {
`;

const continents = ['Asia', 'Europe', 'North America', 'South America', 'Africa', 'Oceania'];

for (const cont of continents) {
  out += `  // ${cont}\n`;
  const items = list.filter(c => c.continent === cont);
  for (const item of items) {
    const webpPath = item.imagePath.replace(/\.png$/, '.webp');
    out += `  ${JSON.stringify(item.id)}: {\n`;
    out += `    landmarkName: ${JSON.stringify(item.landmarkName)},\n`;
    out += `    location: ${JSON.stringify(item.location)},\n`;
    out += `    caption: ${JSON.stringify(item.caption)},\n`;
    out += `    imagePath: ${JSON.stringify(webpPath)},\n`;
    out += `  },\n`;
  }
  out += `\n`;
}

out += `};

/**
 * Returns the landmark for any country ID.
 * Resolves from CURATED_LANDMARKS with fallback to country metadata from catalog.
 */
export function getCountryLandmark(countryId: string): CountryLandmark {
  const code = countryId.toUpperCase();
  const curated = CURATED_LANDMARKS[code];
  const catalogEntry = COUNTRIES.find((c) => c.id === code);
  const countryName = catalogEntry?.name ?? countryId;

  if (curated) {
    return {
      countryId: code,
      countryName,
      landmarkName: curated.landmarkName,
      location: curated.location,
      caption: curated.caption,
      imagePath: curated.imagePath,
    };
  }

  // Graceful fallback for any unrecognized code
  return {
    countryId: code,
    countryName,
    landmarkName: \`\${countryName} National Wonders\`,
    location: catalogEntry?.continent ?? "World",
    caption: \`Discover the breathtaking sights and unique heritage of \${countryName}.\`,
    imagePath: undefined,
  };
}
`;

fs.writeFileSync('src/data/countryLandmarks.ts', out, 'utf8');
console.log('src/data/countryLandmarks.ts updated successfully with all 199 countries!');
