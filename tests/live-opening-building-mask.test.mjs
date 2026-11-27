import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, placeBuilding } from '../app/model.ts'

const spot = { x: 24, z: 70 }

test('the initial Blue building record gates the actual ordinary plan command independently per model', () => {
  // The little-endian original HDR bytes 4..7 decode to 0xfffc000f (M1)
  // and 0xfffc0083 (M3). Bit 7 is Camp, bit 5 is Temple.
  const first = createWorld(1, 'scalable')
  const third = createWorld(3, 'scalable')
  assert.deepEqual([first.unlockedCamp, first.unlockedTemple], [false, false])
  assert.deepEqual([third.unlockedCamp, third.unlockedTemple], [true, false])
  const firstCount = first.buildings.length, thirdCount = third.buildings.length
  assert.equal(placeBuilding(first, 'camp', spot), false)
  assert.match(first.message, /must discover the Warrior Training Hut/)
  assert.equal(first.buildings.length, firstCount)
  assert.equal(placeBuilding(third, 'temple', spot), false)
  assert.match(third.message, /must discover the Temple/)
  assert.equal(third.buildings.length, thirdCount)
  assert.equal(placeBuilding(third, 'camp', spot), true)
  assert.equal(third.buildings.length, thirdCount + 1)
  const plan = third.buildings.at(-1)
  assert.deepEqual([plan.kind, plan.team, plan.progress], ['camp', 'blue', 0])
})
