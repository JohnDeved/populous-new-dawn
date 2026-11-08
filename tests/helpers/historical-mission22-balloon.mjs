// Historical campaign-derived acquisition with supplied spell-focus setup, followed by current-runtime
// checkpoint continuation. This never substitutes for fresh-route coverage.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import crypto from 'node:crypto'
import v8 from 'node:v8'
import { gunzipSync } from 'node:zlib'
import {  createHistoricalFixtureHarness, normalizeHistoricalFixture  } from './historical-checkpoint.ts'

const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
export async function loadHistoricalMission22Balloon() {
  const base = new URL('../fixtures/mission22-historical/', import.meta.url),
    metadata = JSON.parse(fs.readFileSync(new URL('mission22-balloon-c44.json', base), 'utf8')),
    compressed = fs.readFileSync(new URL('mission22-balloon-c44.v8.gz', base))
  assert.equal(metadata.sourceHead, 'c44dadfc91ba5bdca9b97552c84e42ebff63d62f')
  assert.equal(metadata.nativeExecutableExecuted, false)
  assert.equal(
    metadata.compressedSha256,
    '10c0791d73815a927a083cad0a77ffdb9e0c4330e7e675232cb053c647acf1c9'
  )
  assert.equal(hash(compressed), metadata.compressedSha256)
  const serialized = gunzipSync(compressed)
  assert.equal(serialized.length, metadata.serializedBytes)
  assert.equal(hash(serialized), metadata.serializedSha256)
  assert.equal(
    metadata.serializedSha256,
    '02e304e776c28f4aa8c43c4ef7ec54bcf6c6bdae25df6929e2ec48cbda3f044c'
  )
  assert.equal(
    hash(
      fs.readFileSync(
        new URL('../../scripts/capture-historical-mission22-balloon.mjs', import.meta.url)
      )
    ),
    metadata.producerSha256
  )
  const historical = v8.deserialize(serialized),
    store = createHistoricalFixtureHarness()
  assert.equal(historical.turn, 2206)
  assert.equal(historical.randomState, 4125041181)
  store.startMission(22)
  // Restore the complete recorded world, not selected actor/counter/RNG fields.
  for (const key of Object.keys(store.getWorld())) if (!(key in historical)) delete store.getWorld()[key]
  Object.assign(store.getWorld(), historical)
  assert.deepEqual(store.getWorld(), historical)
  await store.saveCheckpoint()
  const expected = normalizeHistoricalFixture(structuredClone(store.getWorld()))
  assert.ok(store.loadCheckpoint())
  const world = store.getWorld()
  assert.deepEqual(world, expected)
  const shaman = world.units.find(unit => unit.id === metadata.shamanId),
    balloon = world.vehicles.find(vehicle => vehicle.id === metadata.balloonId)
  assert.equal(world.turn, metadata.turn)
  assert.equal(world.randomState, metadata.randomState)
  assert.deepEqual([shaman.hp, shaman.native.counter, shaman.native.state], [100.6, 158, 30])
  assert.equal(world.objectCells.objects.get(shaman.id), shaman.native)
  assert.equal(shaman.native.vehicle, balloon.id)
  assert.deepEqual(balloon.passengers, [shaman.id])
  assert.deepEqual([balloon.x, balloon.y, balloon.speed], [-19200, 14592, -1])
  return { store, world, shaman, balloon }
}
