import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'

const target = 8505
const ordinaryExit = { x: 107, z: 115 }
const alternateExit = { x: 65, z: 101 }

function newbornExit(cell, flags, reference) {
  const world = createWorld(2, 'scalable')
  while (world.turn < 51) tick(world, 1 / 12)
  const hut = world.buildings.find(building => building.id === 71)
  const neighbor = world.buildings.find(building => building.id === 1)
  assert.ok(hut?.progress === 1 && hut.kind === 'hut')
  assert.ok(neighbor?.progress === 1 && neighbor.kind === 'camp')
  assert.deepEqual([world.land.flags[target], world.land.buildingIds[target]], [49, 0])
  const known = new Set(world.units.map(unit => unit.id))
  if (cell !== null) {
    world.land.flags[cell] |= flags
    world.land.buildingIds[cell] = reference
  }
  tick(world, 1 / 12)
  assert.equal(world.turn, 52)
  const [baby, ...extra] = world.units.filter(unit => !known.has(unit.id))
  assert.deepEqual(extra, [])
  assert.deepEqual([baby.id, baby.team, baby.kind, baby.x, baby.z], [2158, 'green', 'brave', 103, 117])
  return baby.path.at(-1)
}

test('the actual authored newborn reads only the flagged next-cell building record', () => {
  // The authored door's 0x200 outward move has raw coords 29376/34048;
  // native 00405050 selects record 0x8a03e4+16*8505 before the center snap.
  assert.deepEqual(newbornExit(null, 0, 0), ordinaryExit)
  assert.deepEqual(newbornExit(target + 1, 512, 1), ordinaryExit, 'an adjacent flagged building does not redirect')
  assert.deepEqual(newbornExit(target, 0, 1), ordinaryExit, 'handle without building flag is ignored')
  assert.deepEqual(newbornExit(target, 512, 0x400 | 1), alternateExit, 'exact flagged record resolves low 10 owner bits')
})
