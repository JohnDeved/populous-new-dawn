import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { missionData } from '../app/mission-data.ts'
import { createErosion, stepErosion } from '../app/erosion.ts'
import { processTerrain, queueTerrain, terrainPointHeight, updateWalkMasks } from '../app/native-terrain.ts'
import { finishLevelStart, retainFixtureUnits } from './level-start-fixture.mjs'

const seed = 0x12345678
const textures = { surface() {}, globe() {} }
const liveErosion = world => world.effects.filter(effect => effect.erosion)
const hashHeights = heights => {
  const bytes = Buffer.alloc(32768)
  heights.forEach((height, i) => bytes.writeInt16LE(height, i * 2))
  return createHash('sha256').update(bytes).digest('hex')
}

// Controlled activation fixtures begin after the real opening. They retain an
// authored shrine but supply raw authored heights, seed, completion and no actors.
function suppliedWorld(mission = 3) {
  const world = finishLevelStart(createWorld(mission))
  const head = world.shrines.find(shrine => shrine.kind === 'erosionEffect')
  assert.ok(head)
  const building = structuredClone(world.buildings[0])
  retainFixtureUnits(world, () => false)
  for (const name of ['vehicles', 'buildings', 'trees', 'effects', 'gifts', 'projectiles',
    'marching', 'combatMarches', 'fights', 'replants']) world[name] = []
  world.shrines = [head]
  world.manaWorld.gameFlags = 34
  world.land.heights.fill(0)
  for (const [x, y, h] of missionData(mission).level.heights) world.land.heights[y * 128 + x] = h
  world.land.flags.fill(0)
  world.land.buildingIds.fill(0)
  world.land.dirty.fill(0)
  world.land.queued = []
  world.land.textureUpdates = []
  world.land.landFlags = 0
  world.landVersion = world.terrainVersion
  world.randomState = seed
  head.reset = false
  head.forced = true
  return { world, head, building }
}

function reference(world) {
  return { land: structuredClone(world.land), randomState: world.randomState, controllers: [], cells: [] }
}
function advance(expected, controller) {
  stepErosion(expected.land, controller, expected, {
    sound() {},
    terrain(cell) {
      queueTerrain(expected.land, cell, 6, 1, textures)
      expected.cells.push(cell)
    },
  })
}
function allocate(expected, target) {
  const position = { x: Math.round((target.x + 8) * 256) & 65535,
    y: Math.round((-target.z - 8) * 256) & 65535 }
  const controller = createErosion({ ...position, h: terrainPointHeight(expected.land, position) })
  expected.controllers.push(controller)
  advance(expected, controller)
}
function finishTerrain(expected) {
  processTerrain(expected.land, textures)
  for (const cell of expected.cells) updateWalkMasks(expected.land, cell, 6)
  expected.cells = []
}
function compare(world, expected) {
  assert.equal(world.randomState, expected.randomState)
  assert.deepEqual(world.land.heights, expected.land.heights)
  assert.deepEqual(liveErosion(world).map(effect => effect.erosion), expected.controllers)
}

test('authored Mission 3 activation runs the first native Erosion call immediately and only once', () => {
  const { world, head } = suppliedWorld()
  const count = world.effectCounter
  assert.equal(hashHeights(world.land.heights), '5646f3ecfc50b22a46fd403f4838727ef0a2baeb2428cb54f2d511f0a4185269')
  tick(world, 1 / 12)
  const effect = liveErosion(world)[0]
  assert.equal(effect.erosion.remaining, 63)
  assert.equal(effect.age, 0, 'the immediate call is not another scheduled visit')
  assert.equal(world.effectCounter, (count + 1) & 255)
  assert.equal(world.randomState, 1317931103)
  assert.equal(hashHeights(world.land.heights), 'd503cb3d3f4ec9091ed26d2b67bd0a373a5ecc4c0a84840e906f7690d02fa9a6')
  assert.equal(head.uses, 1)
  const saved = structuredClone(world)
  tick(world, 1 / 12)
  tick(saved, 1 / 12)
  assert.equal(effect.erosion.remaining, 62)
  assert.equal(world.randomState, 2870622653)
  assert.equal(hashHeights(world.land.heights), 'dc9f487ed787a37dda89659c074980aa87084b9e231ec66b8832d34c9d8f0c2d')
  assert.deepEqual(world.land.heights, saved.land.heights)
  assert.equal(world.randomState, saved.randomState)
  assert.deepEqual(liveErosion(world), liveErosion(saved), 'restoring after activation does not replay visit1')
  for (let i = 0; i < 61; i++) tick(world, 1 / 12)
  assert.equal(effect.erosion.remaining, 1)
  tick(world, 1 / 12)
  assert.equal(effect.erosion.remaining, 0)
  assert.equal(liveErosion(world).length, 0)
})

test('multiple authored targets process in link order at activation and newest-first on later visits', () => {
  const { world, head } = suppliedWorld(10)
  assert.equal(head.effectTargets.length, 8)
  const expected = reference(world)
  for (const target of head.effectTargets) allocate(expected, target)
  finishTerrain(expected)
  tick(world, 1 / 12)
  compare(world, expected)
  assert.ok(liveErosion(world).every(effect => effect.age === 0 && effect.erosion.remaining === 63))
  assert.equal(world.land.queued.length, 0)
  for (const controller of [...expected.controllers].reverse()) advance(expected, controller)
  finishTerrain(expected)
  tick(world, 1 / 12)
  compare(world, expected)
  assert.ok(liveErosion(world).every(effect => effect.erosion.remaining === 62))
})

test('activation queues radius6 texture updates and notifies before allocating the next target', () => {
  const { world, head, building } = suppliedWorld()
  head.effectTargets = [head.effectTarget, head.effectTarget]
  const notifications = []
  const center = 35575 // Accepted native first-call terrain callback for this seed/input.
  for (const radius of [6, 7]) {
    const id = 900 + radius
    const cell = (((center & 254) + radius * 2) & 255) | (center & 0xfe00)
    const index = (cell >>> 9) * 128 + ((cell & 254) >>> 1)
    world.land.buildingIds[index] = id
    // A dead building is ignored by gameplay. Its pending plan receives the
    // existing notification adapter, exposing order without production hooks.
    const preparation = {}
    Object.defineProperty(preparation, 'revalidate', { set(value) {
      if (value) notifications.push({ radius, effects: liveErosion(world).length,
        queued: world.land.queued.length, textures: [...world.land.textureUpdates] })
    } })
    world.buildings.push({ ...building, id, hp: 0, preparation })
  }
  const version = world.landVersion
  tick(world, 1 / 12)
  assert.ok(notifications.some(row => row.radius === 6 && row.effects === 1))
  assert.ok(!notifications.some(row => row.radius === 7 && row.effects === 1))
  assert.ok(notifications.some(row => row.effects === 2))
  assert.ok(notifications.every(row => row.queued > 0 && row.textures.every(value => value === 1)))
  assert.equal(world.land.queued.length, 0)
  assert.equal(world.landVersion, version + 1, 'one deferred post-shrine surface refresh')
})

test('repeated rewards get one initial visit each and exhausted rewards never allocate again', () => {
  const { world, head } = suppliedWorld()
  head.remaining = 2
  tick(world, 1 / 12)
  assert.equal(liveErosion(world)[0].erosion.remaining, 63)
  tick(world, 2 / 12) // Original cooldown and reset visits, without another reward.
  assert.equal(head.uses, 1)
  head.forced = true
  tick(world, 1 / 12)
  assert.equal(head.uses, 2)
  assert.equal(head.remaining, 0)
  assert.equal(head.active, false)
  assert.deepEqual(liveErosion(world).map(effect => effect.erosion.remaining), [60, 63])
  const count = world.effectCounter
  head.forced = true
  for (let i = 0; i < 64; i++) tick(world, 1 / 12)
  assert.equal(head.uses, 2)
  assert.equal(world.effectCounter, count)
  assert.equal(liveErosion(world).length, 0)
})
