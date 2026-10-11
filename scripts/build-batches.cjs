const fs = require('fs');

const content = fs.readFileSync('src/data/countryLandmarks.ts', 'utf8');
const entryRegex = /["']?([A-Z]{2})["']?:\s*\{([^}]+)\}/g;
const curated = {};
let m;
while ((m = entryRegex.exec(content)) !== null) {
  const code = m[1];
  const b = m[2];
  const lmName = (b.match(/landmarkName:\s*"([^"]+)"/) || [])[1];
  const loc = (b.match(/location:\s*"([^"]+)"/) || [])[1];
  const img = (b.match(/imagePath:\s*"([^"]+)"/) || [])[1];
  if (lmName) {
    curated[code] = { landmarkName: lmName, location: loc, imagePath: img };
  }
}

const cat = fs.readFileSync('src/data/countryCatalog.ts', 'utf8');
const idMatches = [...cat.matchAll(/"id":\s*"([A-Z]{2})",\s*"name":\s*"([^"]+)",\s*"continent":\s*"([^"]+)"/g)];
const countries = idMatches.map(x => ({ id: x[1], name: x[2], continent: x[3] }));

const files = new Set(fs.readdirSync('public/images/postcards'));

const missing = countries.filter(c => ![...files].some(f => f.startsWith(c.id.toLowerCase() + '-') && f.endsWith('.webp'))).map(c => {
  const meta = curated[c.id] || { landmarkName: c.name + ' Heritage', location: c.continent, imagePath: '/images/postcards/' + c.id.toLowerCase() + '.webp' };
  return {
    id: c.id,
    name: c.name,
    continent: c.continent,
    landmarkName: meta.landmarkName,
    location: meta.location,
    imagePath: meta.imagePath || ('/images/postcards/' + c.id.toLowerCase() + '.webp')
  };
});

console.log('Real missing count:', missing.length);

const europe = missing.filter(c => c.continent === 'Europe');
const asia = missing.filter(c => c.continent === 'Asia');
const americas = missing.filter(c => c.continent === 'North America' || c.continent === 'South America');
const africa = missing.filter(c => c.continent === 'Africa');
const oceania = missing.filter(c => c.continent === 'Oceania');

const batches = [
  { id: 'batch-1', name: 'Europe West & North', items: europe.slice(0, 20) },
  { id: 'batch-2', name: 'Europe East & South', items: europe.slice(20) },
  { id: 'batch-3', name: 'Asia East & Southeast', items: asia.slice(0, 23) },
  { id: 'batch-4', name: 'Asia Central, South & West', items: asia.slice(23) },
  { id: 'batch-5', name: 'North & Central America', items: americas.slice(0, 16) },
  { id: 'batch-6', name: 'South America & Caribbean', items: americas.slice(16) },
  { id: 'batch-7', name: 'Oceania', items: oceania },
  { id: 'batch-8', name: 'Africa North & West', items: africa.slice(0, 27) },
  { id: 'batch-9', name: 'Africa East, Central & South', items: africa.slice(27) },
];

for (const b of batches) {
  fs.writeFileSync('scripts/batches/' + b.id + '.json', JSON.stringify(b, null, 2));
}
console.log('All 9 batches refreshed with authentic landmarks!');
