import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { serialize, deserialize } from 'node:v8'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
const sha = value => createHash('sha256').update(value).digest('hex')
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()
const expectedHead = '9f7a4758aaabd11b0b57e89d150265c313d9a13a'
const expectedTest = '2859ebbf26f3786ad272b7ffc2b4999bda5d71baff5577cdb65aa1872d353765'
assert.equal(git('rev-parse', 'HEAD'), expectedHead)
assert.equal(git('status', '--porcelain', '--untracked-files=no'), '')
const paths = git('ls-files', 'app', 'public', 'package-lock.json', 'tests/mission6.test.mjs').split('\n')
const inputs = Object.fromEntries(paths.map(path => [path, sha(readFileSync(path))]))
let captured, metadata
assert.equal(globalThis.__m6HistoricalCapture, undefined)
globalThis.__m6HistoricalCapture = (world, members, raidSlot, preacherId) => {
  assert.equal(captured, undefined)
  assert.equal(world.turn, 8529)
  captured = structuredClone(world)
  metadata = { originalMembers: [...members], raidSlot, preacherId }
}
globalThis.__m6HistoricalFinish = world => {
  assert.equal(world.turn, 8702)
  assert.ok(captured)
  assert.equal(git('rev-parse', 'HEAD'), expectedHead)
  assert.equal(git('status', '--porcelain', '--untracked-files=no'), '')
  for (const [path, hash] of Object.entries(inputs)) assert.equal(sha(readFileSync(path)), hash, path)
  const serialized = serialize(captured), compressed = gzipSync(serialized)
  assert.deepEqual(deserialize(serialized), captured)
  const provenance = {
    kind: 'historical pre-newborn complete browser world', head: expectedHead,
    tree: git('rev-parse', 'HEAD^{tree}'), node: process.version,
    producerSha256: sha(readFileSync(fileURLToPath(import.meta.url))), inputs,
    capturedTurn: captured.turn, validatedOriginalLifecycleThrough: world.turn,
    ...metadata, serializedSha256: sha(serialized), gzipSha256: sha(compressed),
    serializedBytes: serialized.length, gzipBytes: compressed.length,
  }
  writeFileSync('work/m6-historical-0404/world-8529.v8.gz', compressed, { flag: 'wx' })
  writeFileSync('work/m6-historical-0404/provenance.json', JSON.stringify(provenance, null, 2)+'\n', { flag: 'wx' })
  console.log('HISTORICAL_CAPTURE_QUALIFIED', JSON.stringify({ ...metadata, capturedTurn: captured.turn, validatedThrough: world.turn, serializedSha256: sha(serialized), gzipSha256: sha(compressed) }))
}
registerHooks({ load(url, context, nextLoad) {
  const result = nextLoad(url, context)
  if (!url.endsWith('/tests/mission6.test.mjs')) return result
  const source = readFileSync(fileURLToPath(url), 'utf8')
  assert.equal(sha(source), expectedTest)
  assert.equal(sha(result.source), expectedTest)
  const capture = '  assert.equal(raiding.turn, 8529)'
  const finish = '  assert.ok(reusedForTraining)\n  assert.ok(originalMembers.every(id => !raiding.units.some(unit => unit.id === id)))\n})'
  assert.equal(source.split(capture).length, 2)
  assert.equal(source.split(finish).length, 2)
  return { ...result, source: source.replace(capture, capture+'\n  globalThis.__m6HistoricalCapture(raiding, originalMembers, raidSlot, preacherId)').replace(finish, finish.replace('\n})', '\n  globalThis.__m6HistoricalFinish(raiding)\n})')) }
}})
