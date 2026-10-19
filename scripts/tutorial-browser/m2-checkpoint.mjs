import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { serialize } from 'node:v8'
import { resolve } from 'node:path'
import { checkpointCodec } from './checkpoint-codec.mjs'

export async function createM2Checkpoint(output, source) {
  const { loadSceneFixture } = await import('../../tests/support/bloodlust-scene.mjs')
  const { createWorld, migrateCheckpoint } = await loadSceneFixture()
  const checkpoint = { version: 1, world: createWorld(2) }
  assert.equal(checkpoint.world.outcome.level, 2)
  const transfer = checkpointCodec(checkpoint)
  assert.deepEqual(checkpointCodec(transfer, true), checkpoint)
  // Model the shipped restore and load migrations, without changing the admitted save.
  const expected = migrateCheckpoint(migrateCheckpoint(structuredClone(checkpoint.world)))
  const encoded = JSON.stringify(transfer)
  assert.ok(Buffer.byteLength(encoded) < 16 * 1024 * 1024, 'Bound checkpoint artifact size')
  writeFileSync(resolve(output, 'm2-checkpoint-transfer.json'), encoded, { flag: 'wx' })
  const bytes = serialize(checkpoint)
  writeFileSync(resolve(output, 'm2-checkpoint.v8'), bytes, { flag: 'wx' })
  const sha = b => createHash('sha256').update(b).digest('hex')
  const receipt = {
    setup: 'TEST SETUP: exact-source createWorld(2), not campaign unlock proof or user save',
    sourceCommit: source.commit,
    node: process.version,
    checkpointSha256: sha(bytes),
    transferSha256: sha(encoded),
    expectedLoadedSha256: sha(JSON.stringify(checkpointCodec(expected))),
    level: checkpoint.world.outcome.level,
    turn: checkpoint.world.turn,
    time: checkpoint.world.time,
    randomState: checkpoint.world.randomState,
    cosmeticRandom: checkpoint.world.cosmeticRandom,
    sourceFiles: source.files,
  }
  writeFileSync(resolve(output, 'm2-checkpoint-source.json'), JSON.stringify(receipt, null, 2), {
    flag: 'wx',
  })
  return { transfer, expected: checkpointCodec(expected), receipt }
}
