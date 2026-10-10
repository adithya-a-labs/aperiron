import { spawn } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const pages = ['explore', 'compare', 'dna', 'market', 'optimizer']
const children = []
const workspaceParent = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

function launch(page, preview = false) {
  const cwd = join(workspaceParent, `aperiron-${page}`)
  const child = spawn(process.execPath, [join(cwd, 'node_modules/vite/bin/vite.js'), ...(preview ? ['preview'] : []), '--host', '127.0.0.1'], {
    cwd, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  })
  children.push(child)
  let output = ''
  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${page}: startup timed out\n${output}`)), 20000)
    const receive = data => {
      output += data.toString()
      if (output.includes('http://127.0.0.1:')) { clearTimeout(timer); resolve(output) }
    }
    child.stdout.on('data', receive)
    child.stderr.on('data', receive)
    child.once('error', error => { clearTimeout(timer); reject(error) })
    child.once('exit', code => { clearTimeout(timer); reject(new Error(`${page}: exited ${code}\n${output}`)) })
  })
  return { child, ready }
}

try {
  const servers = pages.map(page => launch(page))
  await Promise.all(servers.map(server => server.ready))
  for (const [index, page] of pages.entries()) {
    const port = 5174 + index
    const response = await fetch(`http://127.0.0.1:${port}`, { signal: AbortSignal.timeout(10000) })
    const html = await response.text()
    if (!response.ok || !html.includes('/src/main.tsx')) throw new Error(`${page}: invalid development response`)
    console.log(`PASS ${page}: development HTTP ${response.status} on ${port}`)
  }
  // A second instance must fail rather than silently falling back to another page's port.
  const duplicate = launch('explore')
  try {
    await duplicate.ready
    throw new Error('Duplicate Explore server unexpectedly started')
  } catch (error) {
    if (!/Port 5174 is already in use/.test(error.message)) throw error
    console.log('PASS strictPort: duplicate Explore instance refused occupied port 5174')
  }
  const previews = pages.map(page => launch(page, true))
  await Promise.all(previews.map(server => server.ready))
  for (const [index, page] of pages.entries()) {
    const port = 6174 + index
    const response = await fetch(`http://127.0.0.1:${port}`, { signal: AbortSignal.timeout(10000) })
    const html = await response.text()
    if (!response.ok || !html.includes('/assets/')) throw new Error(`${page}: invalid production preview response`)
    console.log(`PASS ${page}: production preview HTTP ${response.status} on ${port}`)
  }
} finally {
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill()
  }
}
