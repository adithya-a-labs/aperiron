const fs = require('fs');

// Read countryLandmarks.ts
const tsContent = fs.readFileSync('src/data/countryLandmarks.ts', 'utf8');
const lines = tsContent.split('\n');

const curated = {};
let currentCode = null;

for (const line of lines) {
  const codeMatch = line.match(/^\s*"([A-Z]{2})":\s*\{/);
  if (codeMatch) {
    currentCode = codeMatch[1];
    curated[currentCode] = {};
  }
  if (currentCode) {
    const lmMatch = line.match(/landmarkName:\s*"([^"]+)"/);
    if (lmMatch) curated[currentCode].landmarkName = lmMatch[1];
    const locMatch = line.match(/location:\s*"([^"]+)"/);
    if (locMatch) curated[currentCode].location = locMatch[1];
    const imgMatch = line.match(/imagePath:\s*"([^"]+)"/);
    if (imgMatch) curated[currentCode].imagePath = imgMatch[1];
  }
}

// Read all batches
const batchItems = [];
for (let i = 1; i <= 9; i++) {
  const batch = JSON.parse(fs.readFileSync(`scripts/batches/batch-${i}.json`, 'utf8'));
  batchItems.push(...batch.items);
}

console.log('Total items in batches:', batchItems.length);
console.log('Total curated in TS:', Object.keys(curated).length);

let pathMismatches = 0;
for (const item of batchItems) {
  const tsItem = curated[item.id];
  if (!tsItem) {
    console.log(`Missing in TS: ${item.id} (${item.name})`);
  } else if (tsItem.imagePath !== item.imagePath) {
    pathMismatches++;
    // console.log(`Path mismatch for ${item.id}: Batch='${item.imagePath}' vs TS='${tsItem.imagePath}'`);
  }
}

console.log('Path mismatches between batches and TS:', pathMismatches);
