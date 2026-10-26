// Portable, sequential tests of the unchanged preparer module body. Distinct
// query URLs avoid reusing fulfilled/rejected ESM evaluations; these are not
// separate CLI exit-code observations or OS-crash/durability evidence.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { createRequire, syncBuiltinESMExports } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { sceneFixtureIdentity, sceneFixtureSource, sceneFixtureSourceForApp } from './support/scene-fixture-source.mjs'

const script = new URL('../scripts/prepare-scene-fixture.mjs', import.meta.url)
const require = createRequire(script), compiler = require.resolve('typescript')
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const cacheKeys = ['PND_SCENE_FIXTURE_PRECOMPILED', 'PND_SCENE_FIXTURE_PRECOMPILED_SHA256']

function fixture(t, name, sources = { 'tiny.ts': 'export const value: number = 7\n' }) {
  const root = fs.mkdtempSync(join(tmpdir(), 'pnd-scene-preparer-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const sourceRoot = join(root, 'source'), output = join(root, 'output')
  fs.mkdirSync(join(sourceRoot, 'app'), { recursive: true })
  const entries = Object.entries(sources).sort(([a], [b]) => a.localeCompare(b)).map(([file, source]) => {
    fs.writeFileSync(join(sourceRoot, 'app', file), source)
    return { name: file, sourceBytes: Buffer.byteLength(source), sourceSha256: hash(source) }
  })
  const request = { format: 'scene-fixture-input-v1', sourceRoot,
    // Synthetic fixture identity, not a claim that these sources belong to Git.
    sourceCommit: '0'.repeat(40), identity: sceneFixtureIdentity(), entries }
  const requestPath = join(root, 'request.json')
  const publish = () => {
    const bytes = Buffer.from(JSON.stringify(request))
    fs.writeFileSync(requestPath, bytes)
    return hash(bytes)
  }
  const invoke = async digest => {
    const saved = process.argv, url = new URL(script)
    url.searchParams.set('fixture-case', name)
    process.argv = [process.execPath, fileURLToPath(script), requestPath, digest, output]
    try { return await import(url.href) } finally { process.argv = saved }
  }
  return { root, sourceRoot, output, request, publish, invoke }
}

for (const [name, message] of [
  ['request-pin', 'Preparation request changed'],
  ['tool-options', 'Preparation tool/source/runtime identity mismatch'],
  ['source-pin', 'Preparation source changed'],
  ['existing-output', 'EEXIST'],
  ['oversized-output', 'Preparation output bound'],
]) test(`preparer rejects ${name} without publishing a manifest`, { concurrency: false }, async t => {
  assert.equal(require.cache[compiler], undefined, 'Only the last guard case loads TypeScript')
  const sources = name === 'oversized-output' ? {
    'oversized.ts': 'export enum TooLarge {\n' + Array.from({ length: 16000 }, (_, i) => `E${String(i).padStart(5, '0')}`).join(',\n') + '\n}\n',
  } : undefined
  const f = fixture(t, name, sources)
  if (name === 'tool-options') f.request.identity.options.module = 'CommonJS'
  if (name === 'source-pin') f.request.entries[0].sourceSha256 = '0'.repeat(64)
  if (name === 'existing-output') {
    fs.mkdirSync(f.output)
    fs.writeFileSync(join(f.output, 'keep-me.txt'), 'owned existing sentinel\n')
  }
  const digest = f.publish()
  await assert.rejects(f.invoke(name === 'request-pin' ? '0'.repeat(64) : digest), error => {
    assert.match(error.message, new RegExp(message))
    assert.equal(error.code, name === 'existing-output' ? 'EEXIST' : 'ERR_ASSERTION')
    return true
  })
  assert.equal(fs.existsSync(join(f.output, 'manifest.json')), false)
  if (name === 'request-pin' || name === 'tool-options') assert.equal(fs.existsSync(f.output), false)
  else if (name === 'existing-output') {
    assert.deepEqual(fs.readdirSync(f.output), ['keep-me.txt'])
    assert.equal(fs.readFileSync(join(f.output, 'keep-me.txt'), 'utf8'), 'owned existing sentinel\n')
  } else {
    assert.deepEqual(fs.readdirSync(f.output), ['modules'])
    assert.deepEqual(fs.readdirSync(join(f.output, 'modules')), [])
  }
  if (name === 'oversized-output') assert(require.cache[compiler], 'The real TypeScript emitter ran')
  else assert.equal(require.cache[compiler], undefined)
})

test('preparer publishes complete source-bound output consumed by the cache reader', { concurrency: false }, async t => {
  const source = 'export default class Fixture { declare absent: number; value: number; constructor(readonly count: number) {} }\n'
  const f = fixture(t, 'complete-output', { 'tiny.ts': source }), requestHash = f.publish()
  await f.invoke(requestHash)
  const manifestPath = join(f.output, 'manifest.json'), bytes = fs.readFileSync(manifestPath)
  const manifest = JSON.parse(bytes)
  assert.equal(manifest.requestSha256, requestHash)
  assert.deepEqual(manifest.identity, f.request.identity)
  assert.equal(manifest.entries.length, 1)
  const emitted = sceneFixtureSource(source), entry = manifest.entries[0]
  assert.deepEqual(entry, { ...f.request.entries[0], outputBytes: Buffer.byteLength(emitted), outputSha256: hash(emitted) })
  assert.equal(fs.readFileSync(join(f.output, 'modules/tiny.ts.mjs'), 'utf8'), emitted)
  const saved = cacheKeys.map(key => process.env[key])
  try {
    process.env[cacheKeys[0]] = manifestPath
    process.env[cacheKeys[1]] = hash(bytes)
    const app = pathToFileURL(join(f.sourceRoot, 'app') + '/')
    const loaded = sceneFixtureSourceForApp(app)(new URL('tiny.ts', app).href, source)
    assert.equal(loaded, emitted)
    const Fixture = (await import(`data:text/javascript;base64,${Buffer.from(loaded).toString('base64')}`)).default
    const instance = new Fixture(7)
    assert.equal(instance.count, 7)
    assert(Object.hasOwn(instance, 'value'))
    assert.equal(Object.hasOwn(instance, 'absent'), false)
  } finally {
    cacheKeys.forEach((key, i) => {
      if (saved[i] === undefined) delete process.env[key]
      else process.env[key] = saved[i]
    })
  }
})

test('writer failure after the first real output never publishes a complete manifest', { concurrency: false }, async t => {
  const f = fixture(t, 'writer-failure', {
    'alpha.ts': 'export const first: number = 1\n',
    'beta.ts': 'export const second: number = 2\n',
  }), requestHash = f.publish()
  const first = join(f.output, 'modules/alpha.ts.mjs'), original = fs.writeFileSync
  const injected = new Error('injected failure after first completed module write')
  try {
    fs.writeFileSync = function (...args) {
      const result = Reflect.apply(original, this, args)
      if (args[0] === first) throw injected
      return result
    }
    syncBuiltinESMExports()
    await assert.rejects(f.invoke(requestHash), error => error === injected)
  } finally {
    fs.writeFileSync = original
    syncBuiltinESMExports()
  }
  assert.deepEqual(fs.readdirSync(f.output), ['modules'])
  assert.deepEqual(fs.readdirSync(join(f.output, 'modules')), ['alpha.ts.mjs'])
  assert.equal(fs.readFileSync(first, 'utf8'), sceneFixtureSource('export const first: number = 1\n'))
})
