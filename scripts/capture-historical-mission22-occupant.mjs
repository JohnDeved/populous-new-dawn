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
const expectedTest = '74b51e7529bf147e8662ebe5920f3cda3d89b5d7c74753886a3ea799a4b13151'
assert.equal(git('rev-parse', 'HEAD'), expectedHead)
assert.equal(git('status', '--porcelain', '--untracked-files=no'), '')
const paths = git('ls-files', 'app', 'public', 'package-lock.json', 'tests/hypnotise-registered-occupants.test.mjs').split('\n')
const inputs = Object.fromEntries(paths.map(path => [path, sha(readFileSync(path))]))
let captured, metadata
assert.equal(globalThis.__m22OccupantCapture, undefined)
globalThis.__m22OccupantCapture = (world, targetId, towerId, effectId) => {
  assert.equal(captured, undefined)
  assert.equal(world.turn, 6246)
  captured = structuredClone(world)
  metadata = { targetId, towerId, effectId, nextId: world.nextId }
}
globalThis.__m22OccupantFinish = world => {
  assert.equal(world.turn, 6721)
  assert.ok(captured)
  assert.equal(git('rev-parse', 'HEAD'), expectedHead)
  assert.equal(git('status', '--porcelain', '--untracked-files=no'), '')
  for (const [path, hash] of Object.entries(inputs)) assert.equal(sha(readFileSync(path)), hash, path)
  const serialized = serialize(captured), compressed = gzipSync(serialized)
  assert.deepEqual(deserialize(serialized), captured)
  const provenance = {
    kind: 'historical pre-newborn complete M22 pre-conversion browser world', head: expectedHead,
    tree: git('rev-parse', 'HEAD^{tree}'), node: process.version,
    producerSha256: sha(readFileSync(fileURLToPath(import.meta.url))), inputs,
    capturedTurn: captured.turn, validatedOriginalLifecycleThrough: world.turn,
    ...metadata, serializedSha256: sha(serialized), gzipSha256: sha(compressed),
    serializedBytes: serialized.length, gzipBytes: compressed.length,
  }
  writeFileSync('work/m22-occupant-historical-0427/world-6246.v8.gz', compressed, { flag: 'wx' })
  writeFileSync('work/m22-occupant-historical-0427/provenance.json', JSON.stringify(provenance, null, 2)+'\n', { flag: 'wx' })
  console.log('HISTORICAL_CAPTURE_QUALIFIED', JSON.stringify({ ...metadata, capturedTurn: captured.turn, validatedThrough: world.turn, serializedSha256: sha(serialized), gzipSha256: sha(compressed) }))
}
registerHooks({ load(url, context, nextLoad) {
  const result = nextLoad(url, context)
  if (!url.endsWith('/tests/hypnotise-registered-occupants.test.mjs')) return result
  const source = readFileSync(fileURLToPath(url), 'utf8')
  assert.equal(sha(source), expectedTest)
  assert.equal(sha(result.source), expectedTest)
  const capture = '  return { store, w, target, tower, effect }'
  const finish = '  while (w.turn < 6721) step()\n  assert.ok(!w.units.includes(converted))\n  assert.ok(!w.objectCells.objects.has(converted.id))\n})'
  assert.equal(source.split(capture).length, 2)
  assert.equal(source.split(finish).length, 2)
  return { ...result, source: source.replace(capture, '  globalThis.__m22OccupantCapture(w, target.id, tower.id, effect.id)\n'+capture).replace(finish, finish.replace('\n})', '\n  globalThis.__m22OccupantFinish(w)\n})')) }
}})
