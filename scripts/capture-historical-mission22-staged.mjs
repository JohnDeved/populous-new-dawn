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
const expectedTest = '6db888befde75d6e96924291d02cd1c4eae36b70a01c71eee3a46cee23095924'
assert.equal(git('rev-parse', 'HEAD'), expectedHead)
assert.equal(git('status', '--porcelain', '--untracked-files=no'), '')
const paths = git('ls-files', 'app', 'public', 'package-lock.json', 'tests/balloon-staged-movement.test.mjs').split('\n')
const inputs = Object.fromEntries(paths.map(path => [path, sha(readFileSync(path))]))
let captured, metadata
assert.equal(globalThis.__m22StagedCapture, undefined)
globalThis.__m22StagedCapture = (world, shamanId, balloonId) => {
  assert.equal(captured, undefined)
  assert.equal(world.turn, 3566)
  captured = structuredClone(world)
  metadata = { shamanId, balloonId }
}
globalThis.__m22StagedFinish = (world, branchTurns) => {
  assert.deepEqual(branchTurns,{staged:4266,idle:4853,departure:3866,successor:3966})
  assert.equal(world.turn, 3966)
  assert.ok(captured)
  assert.equal(git('rev-parse', 'HEAD'), expectedHead)
  assert.equal(git('status', '--porcelain', '--untracked-files=no'), '')
  for (const [path, hash] of Object.entries(inputs)) assert.equal(sha(readFileSync(path)), hash, path)
  const serialized = serialize(captured), compressed = gzipSync(serialized)
  assert.deepEqual(deserialize(serialized), captured)
  const provenance = {
    kind: 'historical pre-newborn complete M22 staged-input browser world', head: expectedHead,
    tree: git('rev-parse', 'HEAD^{tree}'), node: process.version,
    producerSha256: sha(readFileSync(fileURLToPath(import.meta.url))), inputs,
    capturedTurn: captured.turn, validatedSuccessorThrough: world.turn, validatedBranchTurns: branchTurns,
    ...metadata, serializedSha256: sha(serialized), gzipSha256: sha(compressed),
    serializedBytes: serialized.length, gzipBytes: compressed.length,
  }
  writeFileSync('work/m22-staged-historical-0444/world-3566.v8.gz', compressed, { flag: 'wx' })
  writeFileSync('work/m22-staged-historical-0444/provenance.json', JSON.stringify(provenance, null, 2)+'\n', { flag: 'wx' })
  console.log('HISTORICAL_CAPTURE_QUALIFIED', JSON.stringify({ ...metadata, capturedTurn: captured.turn, validatedThrough: world.turn, serializedSha256: sha(serialized), gzipSha256: sha(compressed) }))
}
registerHooks({ load(url, context, nextLoad) {
  const result = nextLoad(url, context)
  if (!url.endsWith('/tests/balloon-staged-movement.test.mjs')) return result
  const source = readFileSync(fileURLToPath(url), 'utf8')
  assert.equal(sha(source), expectedTest)
  assert.equal(sha(result.source), expectedTest)
  const capture = '  assert.deepEqual([world.turn, shaman.native.counter], [3566, 238])'
  const finish = '  assert.equal(craft.passengerCount, 0)\n})'
  assert.equal(source.split(capture).length, 2)
  assert.equal(source.split(finish).length, 2)
  return { ...result, source: source.replace(capture, capture+'\n  globalThis.__m22StagedCapture(world, shaman.id, balloon.id)').replace(finish, finish.replace('\n})', '\n  globalThis.__m22StagedFinish(successor,{staged:world.turn,idle:idle.turn,departure:departing.turn,successor:successor.turn})\n})')) }
}})
