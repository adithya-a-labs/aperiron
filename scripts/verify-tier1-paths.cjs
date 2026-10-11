const fs = require('fs');
const content = fs.readFileSync('src/data/countryLandmarks.ts', 'utf8');
const list = ['IN', 'JP', 'FR', 'US', 'DE', 'BR', 'AU', 'GB', 'IT', 'CA', 'AE', 'SG'];
for (const c of list) {
  const m = content.match(new RegExp('"' + c + '":\\s*\\{[^}]*imagePath:\\s*"([^"]+)"', 's'));
  console.log(c, '->', m ? m[1] : 'none');
}
