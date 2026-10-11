const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const [,, inputJpg, outputWebp] = process.argv;

if (!inputJpg || !outputWebp) {
  console.error('Usage: node scripts/convert-one.cjs <inputJpg> <outputWebp>');
  process.exit(1);
}

if (!fs.existsSync(inputJpg)) {
  console.error(`Input file not found: ${inputJpg}`);
  process.exit(1);
}

const dir = path.dirname(outputWebp);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

try {
  const cmd = `ffmpeg -i "${inputJpg}" -c:v libwebp -quality 82 -vf "scale=1280:-1" "${outputWebp}" -y`;
  execSync(cmd, { stdio: 'pipe' });
  const stat = fs.statSync(outputWebp);
  console.log(`Converted ${outputWebp} (${(stat.size / 1024).toFixed(1)} KB)`);
} catch (err) {
  console.error(`Failed to convert: ${err.message}`);
  process.exit(1);
}
