// Explicit offline TypeScript conversion. Invoke only under the existing owned
// execution envelope; wait for this process to exit before starting scene tests.
// It does not import app modules, run tests, spawn children, or install packages.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'
import { sceneFixtureFileHash, sceneFixtureIdentity, sceneFixtureReadBounded, sceneFixtureSource } from '../tests/support/scene-fixture-source.mjs'

const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const [requestPath, requestHash, output] = process.argv.slice(2)
assert.equal(process.argv.length, 5)
assert(isAbsolute(requestPath) && isAbsolute(output))
assert(/^[a-f0-9]{64}$/.test(requestHash))
const requestBytes = sceneFixtureReadBounded(requestPath, 256 * 1024)
assert.equal(hash(requestBytes), requestHash, 'Preparation request changed')
const request = JSON.parse(requestBytes)
assert.equal(request.format, 'scene-fixture-input-v1')
assert(isAbsolute(request.sourceRoot))
assert(/^[a-f0-9]{40}$/.test(request.sourceCommit))
const identity = sceneFixtureIdentity()
assert.deepEqual(request.identity, identity, 'Preparation tool/source/runtime identity mismatch')
assert(Array.isArray(request.entries) && request.entries.length > 0 && request.entries.length <= 512)
let sourceBytes = 0, outputBytes = 0, previous = ''
for (const entry of request.entries) {
  assert(/^[a-z0-9-]+\.ts$/.test(entry.name) && entry.name > previous, 'Entries must be unique and sorted')
  assert(/^[a-f0-9]{64}$/.test(entry.sourceSha256))
  assert(Number.isSafeInteger(entry.sourceBytes) && entry.sourceBytes >= 0 && entry.sourceBytes <= 256 * 1024)
  sourceBytes += entry.sourceBytes
  assert(sourceBytes <= 6 * 1024 * 1024, 'Preparation source bound')
  previous = entry.name
}
mkdirSync(output, { mode: 0o700 }) // Exclusive attempt; no overwrite/reuse.
mkdirSync(join(output, 'modules'), { mode: 0o700 })
const entries = []
for (const entry of request.entries) {
  const path = join(request.sourceRoot, 'app', entry.name)
  const source = sceneFixtureReadBounded(path, 256 * 1024)
  assert.equal(source.length, entry.sourceBytes)
  assert.equal(hash(source), entry.sourceSha256, `Preparation source changed: ${entry.name}`)
  // No fileName, source map, native transform, or alternate compiler options.
  const emitted = Buffer.from(sceneFixtureSource(source.toString('utf8')))
  outputBytes += emitted.length
  assert(emitted.length <= 512 * 1024 && outputBytes <= 6 * 1024 * 1024, 'Preparation output bound')
  writeFileSync(join(output, 'modules', `${entry.name}.mjs`), emitted, { flag: 'wx', mode: 0o600 })
  entries.push({ ...entry, outputBytes: emitted.length, outputSha256: hash(emitted) })
}
// Revalidate source/tool identities before publishing the complete manifest.
for (const entry of request.entries)
  assert.equal(sceneFixtureFileHash(join(request.sourceRoot, 'app', entry.name)), entry.sourceSha256)
assert.deepEqual(sceneFixtureIdentity(), identity)
const manifest = Buffer.from(JSON.stringify({
  format: 'scene-fixture-output-v1', sourceCommit: request.sourceCommit,
  requestSha256: requestHash, identity, entries,
}, null, 2) + '\n')
assert(manifest.length <= 256 * 1024)
writeFileSync(join(output, 'manifest.json'), manifest, { flag: 'wx', mode: 0o600 })
console.log(JSON.stringify({ manifest: join(output, 'manifest.json'), sha256: hash(manifest),
  modules: entries.length, sourceBytes, outputBytes, manifestBytes: manifest.length }))
