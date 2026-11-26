import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { once } from 'node:events'

const [workload, output, revision] = process.argv.slice(2)
assert.equal(resolve(workload), process.cwd())
assert.match(revision, /^[0-9a-f]{40}$/)
const stock = spawn(process.execPath, [
  resolve('scripts/browser-performance/build.mjs'), workload, output, revision,
], { stdio: ['ignore', 'inherit', 'inherit'] })
const [code, signal] = await once(stock, 'close')
assert.equal(code, 0, 'Real pinned Vite child did not exit successfully')
assert.equal(signal, null)
const block = Buffer.from('PND1174-OUTPUT!\n'.repeat(4096), 'ascii')
assert.equal(block.length, 64 * 1024)
for (let i = 0; i < 96; i++)
  await new Promise((done, fail) => process.stdout.write(block, error => error ? fail(error) : done()))
