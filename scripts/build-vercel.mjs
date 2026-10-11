import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

// Vercel discovers top-level api/ files independently, overwriting Nitro's output.
if (existsSync('api') && readdirSync('api').length) {
  throw new Error('Move Nitro API source files to routes/api/. Top-level api/ conflicts with Vercel function discovery.');
}
const result=spawnSync(process.execPath,['node_modules/vite/bin/vite.js','build'],{
  stdio:'inherit',env:{...process.env,NITRO_PRESET:'vercel'},
});
if(result.status!==0) process.exit(result.status ?? 1);
const output=resolve('.vercel/output');
assert.equal(realpathSync(`${output}/functions/api/[...path].func`),realpathSync(`${output}/functions/__server.func`),'API must use Nitro bundled function');
assert(existsSync(`${output}/functions/.well-known/workflow/v1/flow.func/.vc-config.json`),'Missing Workflow function');
const config=JSON.parse(readFileSync(`${output}/config.json`,'utf8'));
assert(config.routes.some(route=>route.dest==='/api/[...path]'),'Missing API routing');
console.log('Verified Nitro API packaging and Workflow function output.');
