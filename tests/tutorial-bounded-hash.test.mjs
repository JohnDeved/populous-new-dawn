import { historicalCaptureRunnerDigest } from './support/corpse-scheduling-transition.mjs'
import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileSha256 } from '../scripts/browser-performance/browser-runtime.mjs'

// Only fresh disposable fixtures are removed; no user saves or retained evidence.
const directory = mkdtempSync(join(tmpdir(), 'tutorial-hash-'))
after(() => rmSync(directory, { recursive: true, force: true }))
for (const size of [0, 1, 1048575, 1048576, 1048577, 2097169]) {
  test(`bounded Tutorial digest matches previous bytes at length ${size}`, () => {
    const bytes = Buffer.alloc(size)
    for (let n = 0; n < size; n++) bytes[n] = n % 251
    const path = join(directory, `${size}.bin`)
    writeFileSync(path, bytes, { flag: 'wx' })
    assert.equal(fileSha256(path), createHash('sha256').update(readFileSync(path)).digest('hex'))
  })
}
test('missing file still rejects instead of inventing a digest', () => {
  assert.throws(() => fileSha256(join(directory, 'missing')), { code: 'ENOENT' })
})
test('Tutorial uses the existing bounded helper for unchanged source and browser hash callsites', () => {
  const source = readFileSync(new URL('../scripts/tutorial-browser/run.mjs', import.meta.url), 'utf8')
  assert.match(source, /import \{ fileSha256 \} from '\.\.\/browser-performance\/browser-runtime.mjs'/)
  assert.match(source, /const hash = fileSha256/)
  assert.match(source, /browserSha256: hash\(browserPath\)/)
  assert.match(source, /hash\(resolve\(root, name\)\)/)
})

test('historical capture pin preserved after inverse scheduling transition', () => {
  const pins = JSON.parse(readFileSync(new URL('../scripts/tutorial-browser/capture-qualified-inputs.json', import.meta.url), 'utf8'))
  const runner = new URL('../scripts/tutorial-browser/run.mjs', import.meta.url)
  assert.equal(pins['scripts/tutorial-browser/run.mjs'], historicalCaptureRunnerDigest(readFileSync(runner, 'utf8')))
})
