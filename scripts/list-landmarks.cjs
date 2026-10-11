const fs = require('fs');

const catContent = fs.readFileSync('src/data/countryCatalog.ts', 'utf8');
const idMatches = [...catContent.matchAll(/"id":\s*"([A-Z]{2})",\s*"name":\s*"([^"]+)",\s*"continent":\s*"([^"]+)"/g)];
const countries = idMatches.map(m => ({ id: m[1], name: m[2], continent: m[3] }));

const lmContent = fs.readFileSync('src/data/countryLandmarks.ts', 'utf8');
const lmMatches = [...lmContent.matchAll(/([A-Z]{2}):\s*\{[^}]*landmarkName:\s*"([^"]+)"[^}]*\}/gs)];
const curated = {};
for (const m of lmMatches) {
  curated[m[1]] = m[2];
}

const list = countries.map(c => {
  return {
    id: c.id,
    name: c.name,
    continent: c.continent,
    landmark: curated[c.id] || `${c.name} Heritage & Landscapes`,
    isCurated: Boolean(curated[c.id]),
    imageFilename: `${c.id.toLowerCase()}-${(curated[c.id] || c.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.png`
  };
});

fs.writeFileSync('all-landmarks.json', JSON.stringify(list, null, 2), 'utf8');
console.log('Saved all-landmarks.json successfully.');
console.log('Total countries:', list.length);
console.log('Curated landmarks:', list.filter(x => x.isCurated).length);
console.log('Uncurated landmarks (auto-named):', list.filter(x => !x.isCurated).length);
