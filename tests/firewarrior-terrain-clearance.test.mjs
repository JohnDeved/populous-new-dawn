import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, addUnit, addBuilding } from '../app/model.ts'
import { createLivePerson } from '../app/live-people.ts'
import { firewarriorReady, stepTowerFirewarrior } from '../app/firewarrior.ts'
import { firewarriorTerrainClear } from '../app/firewarrior-clearance.ts'

function fixture() {
  const world = createWorld()
  world.land.heights.fill(128)
  world.land.flags.fill(0)
  world.landVersion = world.terrainVersion
  const source = addUnit(world, 'blue', 'firewarrior', { x: 0, z: 0 }),
    target = addUnit(world, 'red', 'brave', { x: 8, z: 0 })
  source.native = createLivePerson(world, source)
  source.native.state = 17
  target.native = createLivePerson(world, target)
  return { world, source, target }
}

for (const inTower of [false, true]) {
  test(`${inTower ? 'tower' : 'ground'} readiness rejects an intervening ridge without mutating gameplay`, () => {
    const { world, source, target } = fixture()
    assert.equal(firewarriorReady(world, source, target, inTower), true)
    for (let y = 0; y < 128; y++) world.land.heights[y * 128 + 6] = 500
    const before = structuredClone(world)
    assert.equal(firewarriorReady(world, source, target, inTower), false)
    assert.deepEqual(world, before)
    world.land.heights.fill(128)
    assert.equal(firewarriorReady(world, source, target, inTower), true)
  })
}

// Pure native-line boundary cases intentionally supply object heights separately
// from terrain. They are algorithm fixtures, not ordinary campaign evidence.

function land(height = 128) {
  return { heights: new Int16Array(16384).fill(height), flags: new Uint32Array(16384) }
}
const point = (x, y = 0, h = 128) => ({ x, y, h })

test('clearance permits exactly 140 native height units and rejects 141', () => {
  const ground = land(268)
  assert.equal(firewarriorTerrainClear(ground, point(0), point(1536)), true)
  ground.heights.fill(269)
  assert.equal(firewarriorTerrainClear(ground, point(0), point(1536)), false)
})

test('descending height divides toward zero and accumulates the truncated step', () => {
  const ground = land(0)
  ground.heights[3] = 266
  // Four samples, (125 - 130) / 4 truncates to -1; final h is 126, not 125.
  assert.equal(firewarriorTerrainClear(ground, point(0, 0, 130), point(1536, 0, 125)), true)
  ground.heights[3] = 267
  assert.equal(firewarriorTerrainClear(ground, point(0, 0, 130), point(1536, 0, 125)), false)
})

test('terrain samples follow signed-short horizontal wrap', () => {
  const ground = land()
  assert.equal(firewarriorTerrainClear(ground, point(65024), point(1024)), true)
  ground.heights[0] = 500
  assert.equal(firewarriorTerrainClear(ground, point(65024), point(1024)), false)
})

test('stored endpoint heights are interpreted as signed short values', () => {
  assert.equal(firewarriorTerrainClear(land(139), point(0, 0, 65535), point(1536, 0, 65535)), true)
  assert.equal(firewarriorTerrainClear(land(140), point(0, 0, 65535), point(1536, 0, 65535)), false)
})

test('sample count is bounded to 1–16, including a zero-distance endpoint test', () => {
  for (const [distance, count] of [[0, 1], [383, 1], [768, 2], [7000, 16]]) {
    let reads = 0
    const ground = {
      heights: new Proxy({}, { get: () => { reads++; return 128 } }),
      flags: new Uint32Array(16384),
    }
    assert.equal(firewarriorTerrainClear(ground, point(0), point(distance)), true)
    assert.equal(reads, count * 4, 'four authoritative terrain corners per bounded sample')
  }
  assert.equal(firewarriorTerrainClear(land(269), point(0), point(0)), false)
})

test('live stored heights, not display support, own the tower sight line', () => {
  const { world, source, target } = fixture()
  for (let y = 0; y < 128; y++) world.land.heights[y * 128 + 6] = 500
  source.supportHeight = source.native.supportHeight = 2000
  target.supportHeight = target.native.supportHeight = 2000
  assert.equal(firewarriorReady(world, source, target, true), false)
  source.native.h = target.native.h = 500
  assert.equal(firewarriorReady(world, source, target, true), true)
})

test('flight motion height takes precedence over a retained ground record', () => {
  const { world, source, target } = fixture()
  for (let y = 0; y < 128; y++) world.land.heights[y * 128 + 6] = 500
  source.flight = { ...source.native, h: 500 }
  target.flight = { ...target.native, h: 500 }
  assert.equal(source.native.h, 128)
  assert.equal(firewarriorReady(world, source, target), true)
})


test('building targets use stored foundation height rather than sampled center terrain', () => {
  const { world, source, target } = fixture(),
    building = addBuilding(world, 'red', 'hut', target, true)
  for (let y = 0; y < 128; y++) world.land.heights[y * 128 + 6] = 600
  source.native.h = 500
  building.foundation = 500 / 45
  assert.equal(firewarriorReady(world, source, building), true)
  building.foundation = 128 / 45
  assert.equal(firewarriorReady(world, source, building), false)
})

test('actual tower firing caller withholds its volley behind a ridge and resumes on clear land', () => {
  const { world, source, target } = fixture()
  world.units = [source, target]
  world.turn = 0
  source.native.state = 21
  source.native.flags3 |= 0x800
  world.effects = []
  source.cooldown = 0
  for (let y = 0; y < 128; y++) world.land.heights[y * 128 + 6] = 500
  stepTowerFirewarrior(world, source)
  assert.equal(world.effects.filter(effect => effect.firewarriorShot).length, 0)
  assert.equal(source.cooldown, 0)
  world.land.heights.fill(128)
  stepTowerFirewarrior(world, source)
  assert.equal(world.effects.filter(effect => effect.firewarriorShot).length, 2)
  assert.ok(source.cooldown > 0)
})
