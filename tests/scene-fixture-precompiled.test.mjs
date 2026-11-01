// Cache boundary tests only. Existing scene-fixture-source tests remain unchanged
// and own exact compiler/output semantics; actual scene suites remain required.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { appendFileSync, mkdtempSync, mkdirSync, rmSync, truncateSync, writeFileSync } from 'node:fs'
import { createRequire, syncBuiltinESMExports } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'
import { sceneFixtureIdentity, sceneFixtureReadBounded, sceneFixtureSourceForApp } from './support/scene-fixture-source.mjs'

const require = createRequire(import.meta.url)
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const keys = ['PND_SCENE_FIXTURE_PRECOMPILED', 'PND_SCENE_FIXTURE_PRECOMPILED_SHA256']
const source = 'export const demo: number = 7\n', output = 'export const demo = 7;\n'
function bundle(t) {
  const dir = mkdtempSync(join(tmpdir(), 'scene-fixture-output-'))
  const saved = keys.map(key => process.env[key])
  t.after(() => {
    keys.forEach((key, i) => {
      if (saved[i] === undefined) delete process.env[key]
      else process.env[key] = saved[i]
    })
    rmSync(dir, { recursive: true })
  })
  mkdirSync(join(dir, 'modules'))
  writeFileSync(join(dir, 'modules/demo.ts.mjs'), output)
  const manifest = {
    format: 'scene-fixture-output-v1', sourceCommit: 'a'.repeat(40),
    requestSha256: 'b'.repeat(64), identity: sceneFixtureIdentity(),
    entries: [{ name: 'demo.ts', sourceSha256: hash(source), sourceBytes: Buffer.byteLength(source),
      outputSha256: hash(output), outputBytes: Buffer.byteLength(output) }],
  }
  const publish = () => {
    const bytes = Buffer.from(JSON.stringify(manifest))
    writeFileSync(join(dir, 'manifest.json'), bytes)
    process.env[keys[0]] = join(dir, 'manifest.json')
    process.env[keys[1]] = hash(bytes)
  }
  publish()
  const app = pathToFileURL(join(dir, 'app') + '/')
  return { dir, manifest, publish, app, url: new URL('demo.ts', app).href }
}

test('precompiled fixture returns bound output without loading TypeScript', t => {
  const compiler = require.resolve('typescript')
  assert.equal(require.cache[compiler], undefined)
  const b = bundle(t), load = sceneFixtureSourceForApp(b.app)
  assert.equal(load(b.url, source), output)
  assert.equal(require.cache[compiler], undefined)
})

test('configured fixture output rejects missing, changed and foreign source without fallback', t => {
  const b = bundle(t), load = sceneFixtureSourceForApp(b.app)
  assert.throws(() => load(new URL('missing.ts', b.app).href, source), /No precompiled/)
  assert.throws(() => load(b.url, source.replace('7', '8')), /Stale fixture source/)
  assert.throws(() => load(b.url, source + '\n'), /Stale fixture source/)
  assert.throws(() => load('file:///foreign/demo.ts', source), /Foreign URL/)
  assert.equal(require.cache[require.resolve('typescript')], undefined)
})

test('configured fixture rejects mutated output and manifest bytes', t => {
  const b = bundle(t), load = sceneFixtureSourceForApp(b.app)
  writeFileSync(join(b.dir, 'modules/demo.ts.mjs'), output.replace('7', '8'))
  assert.throws(() => load(b.url, source), /output hash/)
  writeFileSync(join(b.dir, 'manifest.json'), '{}')
  assert.throws(() => sceneFixtureSourceForApp(b.app), /manifest hash/)
})

test('fixture rejects changed compiler/source/runtime/options identity even with a new manifest pin', t => {
  const b = bundle(t)
  for (const field of ['node', 'typescript', 'compilerSha256', 'compilerPackageSha256',
    'transformerSha256', 'hookSha256', 'preparerSha256', 'options']) {
    const old = b.manifest.identity[field]
    b.manifest.identity[field] = 'changed'
    b.publish()
    assert.throws(() => sceneFixtureSourceForApp(b.app), /identity mismatch/)
    b.manifest.identity[field] = old
  }
})

test('fixture rejects incomplete settings, duplicate names and path traversal', t => {
  const b = bundle(t)
  delete process.env[keys[1]]
  assert.throws(() => sceneFixtureSourceForApp(b.app), /Both pinned/)
  b.publish()
  b.manifest.entries.push({ ...b.manifest.entries[0] })
  b.publish()
  assert.throws(() => sceneFixtureSourceForApp(b.app), /Invalid\/duplicate/)
  b.manifest.entries.pop()
  b.manifest.entries[0].name = '../foreign.ts'
  b.publish()
  assert.throws(() => sceneFixtureSourceForApp(b.app), /Invalid\/duplicate/)
})

test('bounded fixture reader rejects oversized, growing and shrinking files', t => {
  const b = bundle(t), path = join(b.dir, 'changing.mjs')
  writeFileSync(path, '1234')
  assert.throws(() => sceneFixtureReadBounded(path, 3), /oversized/)
  const fs = require('node:fs'), original = fs.readSync
  try {
    let changed = false
    fs.readSync = (...args) => {
      const count = original(...args)
      if (!changed) { changed = true; appendFileSync(path, '5') }
      return count
    }
    syncBuiltinESMExports()
    assert.throws(() => sceneFixtureReadBounded(path, 4), /grew during read/)
    fs.readSync = (...args) => { truncateSync(path, 0); return original(...args) }
    syncBuiltinESMExports()
    assert.throws(() => sceneFixtureReadBounded(path, 5), /shrank during read/)
  } finally {
    fs.readSync = original
    syncBuiltinESMExports()
  }
})
