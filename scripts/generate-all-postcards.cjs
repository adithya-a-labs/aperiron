const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const env = fs.readFileSync('.env', 'utf8');
const keyMatch = env.match(/OPENAI_API_KEY=([^\r\n]+)/);
const apiKey = keyMatch ? keyMatch[1].trim() : '';

if (!apiKey) {
  console.error('Error: OPENAI_API_KEY missing from .env');
  process.exit(1);
}

// Parse CLI args
const args = process.argv.slice(2);
let targetBatch = null;
let concurrency = 3;
let limit = null;

for (const arg of args) {
  if (arg.startsWith('--batch=')) {
    targetBatch = parseInt(arg.split('=')[1], 10);
  } else if (arg.startsWith('--concurrency=')) {
    concurrency = parseInt(arg.split('=')[1], 10);
  } else if (arg.startsWith('--limit=')) {
    limit = parseInt(arg.split('=')[1], 10);
  }
}

// Gather all items from batch-1 to batch-9
const allItems = [];
const startBatch = targetBatch || 1;
const endBatch = targetBatch || 9;

for (let b = startBatch; b <= endBatch; b++) {
  const batchFile = path.join('scripts', 'batches', `batch-${b}.json`);
  if (fs.existsSync(batchFile)) {
    const batchData = JSON.parse(fs.readFileSync(batchFile, 'utf8'));
    allItems.push(...batchData.items);
  }
}

// Filter down to only items that need generation
const pendingItems = allItems.filter(item => {
  const destPath = path.join('public', item.imagePath.replace(/^\//, ''));
  return !fs.existsSync(destPath);
});

console.log(`========================================`);
console.log(`Apeiron Postcard Generation Pipeline`);
console.log(`Model: gpt-image-1 (OpenAI)`);
console.log(`Total items in selected batches: ${allItems.length}`);
console.log(`Already present on disk: ${allItems.length - pendingItems.length}`);
console.log(`Pending generation: ${pendingItems.length}`);
console.log(`Concurrency: ${concurrency}`);
if (limit) console.log(`Limit: ${limit}`);
console.log(`========================================`);

const queue = limit ? pendingItems.slice(0, limit) : pendingItems;

async function generateSingleItem(item, index, total) {
  const destPath = path.join('public', item.imagePath.replace(/^\//, ''));
  fs.mkdirSync(path.dirname(destPath), { recursive: true });

  const prompt = `A whimsical 16:9 widescreen cartoon travel poster illustration of ${item.landmarkName}, ${item.name}. Retro gouache travel illustration with clean stylized shapes, vibrant warm lighting, palette featuring deep navy #032B43, sunny yellow #FFBA08, teal #136F63, blue #3F88C5, electric red #D00000, and warm ivory paper tones. Flat decorative style, no photo realism, no text, clean composition.`;

  let attempts = 0;
  const maxAttempts = 4;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt,
          size: '1024x1024',
          n: 1
        })
      });

      const data = await res.json();

      if (data.error) {
        if (data.error.code === 'rate_limit_exceeded' || res.status === 429) {
          const delay = attempts * 6000;
          console.warn(`[${item.id}] Rate limited (429). Retrying in ${delay / 1000}s (Attempt ${attempts}/${maxAttempts})...`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        throw new Error(data.error.message);
      }

      const tempFile = `temp-${item.id.toLowerCase()}-${Date.now()}.png`;

      if (data.data && data.data[0] && data.data[0].b64_json) {
        fs.writeFileSync(tempFile, Buffer.from(data.data[0].b64_json, 'base64'));
      } else if (data.data && data.data[0] && data.data[0].url) {
        const imgRes = await fetch(data.data[0].url);
        const buf = Buffer.from(await imgRes.arrayBuffer());
        fs.writeFileSync(tempFile, buf);
      } else {
        throw new Error(`Unexpected response format: ${JSON.stringify(data)}`);
      }

      // Convert using ffmpeg to 1280x720 16:9 WebP at quality 82
      execSync(`ffmpeg -i "${tempFile}" -c:v libwebp -quality 82 -vf "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720" "${destPath}" -y`, { stdio: 'pipe' });

      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }

      const stat = fs.statSync(destPath);
      const kb = (stat.size / 1024).toFixed(1);
      console.log(`[${index + 1}/${total}] SUCCESS: ${item.id} - ${item.name} (${item.landmarkName}) -> ${item.imagePath} [${kb} KB]`);
      return true;
    } catch (err) {
      console.error(`[${item.id}] Error on attempt ${attempts}: ${err.message}`);
      if (attempts >= maxAttempts) {
        console.error(`[${item.id}] FAILED permanently after ${maxAttempts} attempts.`);
        return false;
      }
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

async function runPool() {
  const total = queue.length;
  let currentIndex = 0;
  let completedCount = 0;
  let successCount = 0;
  let failCount = 0;

  async function worker(workerId) {
    while (currentIndex < total) {
      const idx = currentIndex++;
      const item = queue[idx];
      const ok = await generateSingleItem(item, idx, total);
      completedCount++;
      if (ok) successCount++;
      else failCount++;
    }
  }

  const workers = [];
  const activeConcurrency = Math.min(concurrency, total);
  for (let i = 0; i < activeConcurrency; i++) {
    workers.push(worker(i + 1));
  }

  await Promise.all(workers);

  console.log(`========================================`);
  console.log(`Batch Generation Completed!`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Remaining missing: ${queue.length - successCount}`);
  console.log(`========================================`);
}

runPool().catch(err => {
  console.error('Fatal runner error:', err);
  process.exit(1);
});
