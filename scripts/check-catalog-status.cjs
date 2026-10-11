const fs = require('fs');

const content = fs.readFileSync('src/data/countryLandmarks.ts', 'utf8');
const lines = content.split('\n');

const countries = {};
let currentCode = null;

for (const line of lines) {
  const codeMatch = line.match(/^\s*"([A-Z]{2})":\s*\{/);
  if (codeMatch) {
    currentCode = codeMatch[1];
    countries[currentCode] = {};
  }
  if (currentCode) {
    const lmMatch = line.match(/landmarkName:\s*"([^"]+)"/);
    if (lmMatch) countries[currentCode].landmarkName = lmMatch[1];
    const locMatch = line.match(/location:\s*"([^"]+)"/);
    if (locMatch) countries[currentCode].location = locMatch[1];
    const imgMatch = line.match(/imagePath:\s*"([^"]+)"/);
    if (imgMatch) countries[currentCode].imagePath = imgMatch[1];
  }
}

const codes = Object.keys(countries);
console.log('Total countries parsed from countryLandmarks.ts:', codes.length);

let existingCount = 0;
let missingCount = 0;
const missingList = [];
const existingList = [];

for (const code of codes) {
  const item = countries[code];
  if (item.imagePath && fs.existsSync('public' + item.imagePath)) {
    existingCount++;
    existingList.push({ code, path: item.imagePath });
  } else {
    missingCount++;
    missingList.push({ code, landmarkName: item.landmarkName, location: item.location, imagePath: item.imagePath });
  }
}

console.log('Existing images on disk:', existingCount);
console.log('Missing images on disk:', missingCount);
console.log('Existing samples:', existingList.slice(0, 10));
console.log('Missing samples (first 10):', missingList.slice(0, 10));

const catalogContent = fs.readFileSync('src/data/countryCatalog.ts', 'utf8');
const catCodes = [];
for (const line of catalogContent.split('\n')) {
  const m = line.match(/"id":\s*"([A-Z]{2})"/);
  if (m) catCodes.push(m[1]);
}
console.log('Total countries in countryCatalog.ts:', catCodes.length);
const unmapped = catCodes.filter(c => !codes.includes(c));
console.log('Unmapped in countryLandmarks.ts:', unmapped);

