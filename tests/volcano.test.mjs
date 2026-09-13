import assert from 'node:assert/strict'
import test from 'node:test'
import { createVolcano, stepVolcano } from '../app/volcano.ts'
import {
  addBuilding,
  addUnit,
  cast,
  createWorld,
  nativePosition,
  tick,
} from '../app/model.ts'
import { createLivePerson } from '../app/live-people.ts'
import { migrateCheckpoint } from '../app/game-store.ts'

const ground = () => ({
  heights: new Int16Array(16384).fill(512),
  flags: new Uint32Array(16384),
  cliffs: new Uint8Array(16384),
  shadows: new Uint8Array(16384),
})
const cellIndex = cell => (cell >>> 9) * 128 + ((cell & 254) >>> 1)
const stepUntil = (w, predicate, limit = 200) => {
  for (let i = 0; !predicate() && i < limit; i++) tick(w, 1 / 12)
  assert.ok(predicate())
}

test('Volcano replays its native terrain, emission and disruption lifecycle', () => {
  const land = ground(),
    game = { randomState: 0x12345678 },
    volcano = createVolcano({ x: 0x4000, y: 0x4000, h: 512 }, 2),
    shaman = { exempt: true },
    victim = { exempt: false },
    building = {},
    sounds = [],
    disturbed = [],
    collapsed = []
  let shakes = 0,
    rocks = 0,
    fireballs = 0,
    largeFireballs = 0,
    gloops = 0,
    bursts = 0,
    terrain = 0
  const effects = {
    sound: (...event) => sounds.push(event),
    shake: () => shakes++,
    people: cell => (cell === volcano.cell ? [shaman, victim] : []),
    exempt: person => person.exempt,
    disturb: (person, tribe) => disturbed.push([person, tribe]),
    buildings: cell => (cell === volcano.cell ? [building] : []),
    collapse: target => collapsed.push(target),
    rock: () => rocks++,
    fireball: (_position, large) => {
      fireballs++
      largeFireballs += Number(large)
    },
    gloop: () => gloops++,
    burst: () => bursts++,
    terrain: (cell, radius) => {
      assert.equal(cell, volcano.cell)
      assert.equal(radius, 7)
      terrain++
    },
  }

  let visits = 0
  while (stepVolcano(land, volcano, game, effects)) visits++
  assert.deepEqual({ visits, shakes, terrain, rocks, fireballs, largeFireballs, gloops, bursts }, {
    visits: 159,
    shakes: 159,
    terrain: 59,
    rocks: 26,
    fireballs: 28,
    largeFireballs: 3,
    gloops: 20,
    bursts: 1,
  })
  assert.deepEqual(sounds, [[0xaf, 2], [0xb0, 0]])
  assert.deepEqual(disturbed, [[victim, 2]])
  assert.deepEqual(collapsed, [building])
  assert.equal(game.randomState, 0xb7d11cc2)
  const center = cellIndex(volcano.cell)
  assert.equal(land.heights[center], 1)
  assert.equal(land.heights[cellIndex((volcano.cell + 2) & 65535)], 912)
  assert.equal(land.cliffs[center], 255)
  assert.equal(land.flags[center] & 0x0c000000, 0x0c000000)
  assert.equal(land.shadows[center], 128)
})

test('player and computer Volcano casts share the live controller and old saves migrate', () => {
  const w = createWorld(),
    shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  w.manaWorld.loadFlags |= 0x200
  w.terrain.fill(3)
  w.terrainVersion++
  w.units = [shaman]
  w.buildings = []
  w.trees = []
  w.shrines = []
  Object.assign(shaman, { x: 0, z: 20, path: [], casting: null })
  w.shots.volcano = 1
  assert.ok(cast(w, 'volcano', { x: 0, z: 14 }))
  stepUntil(w, () => w.effects.some(fx => fx.volcano))
  const controller = w.effects.find(fx => fx.volcano),
    victim = addUnit(w, 'red', 'brave', { x: 0, z: 14 }),
    building = addBuilding(w, 'red', 'hut', { x: 0, z: 14 })
  victim.native = createLivePerson(w, victim)
  victim.path = [{ x: 1, z: 1 }]
  controller.volcano.remaining = 51
  const landVersion = w.landVersion
  tick(w, 1 / 12)
  assert.equal(w.shots.volcano, 0)
  assert.equal(victim.native.flags2 & 8, 0)
  assert.equal(victim.native.state, 31)
  assert.equal(victim.native.previousState, 10)
  assert.equal(victim.native.timer, 69)
  assert.equal(victim.native.speed, 110)
  assert.deepEqual(victim.path, [])
  assert.equal(victim.hp, 47.85)
  assert.equal(victim.burnTrail, 3)
  assert.ok(w.sounds.some(event => event.cue === 0x51))
  assert.equal(victim.native.damageAttacker, 0)
  assert.equal(building.damageState.state, 3)
  assert.equal(building.terrainState.delay, 1)
  assert.equal(w.landVersion, landVersion + 1)
  assert.ok(w.effects.some(fx => fx.fire || fx.animation))
  tick(w, 1 / 12)
  assert.equal(building.hp, 0)

  const ai = createWorld(),
    red = ai.units.find(u => u.team === 'red' && u.kind === 'shaman'),
    blue = ai.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
    target = ai.units.find(u => u.team === 'blue' && u.kind === 'brave')
  ai.terrain.fill(3)
  ai.terrainVersion++
  ai.units = [red, blue, target]
  Object.assign(red, { x: 0, z: 0, path: [], casting: null })
  Object.assign(target, { x: 2, z: 0, path: [], casting: null })
  ai.turn = 16
  ai.manaTribes[1].mana = 900000
  ai.manaTribes[1].available = 0
  ai.manaWorld.spells[1].stocks[16] = 1
  ai.ai.spellEntries = ai.ai.spellEntries.map((entry, i) => ({
    ...entry,
    model: i ? 0 : 16,
    mana: 0,
    people: 1,
    mode: 0,
  }))
  const point = nativePosition(ai, target)
  ai.spellScan.targets[0] = ((point.y & 0xfe00) | ((point.x >>> 8) & 254)) || 1
  tick(ai, 1 / 12)
  assert.equal(ai.projectiles.at(-1)?.spell, 'volcano')

  delete ai.shots.volcano
  delete ai.giftCounts.volcano
  migrateCheckpoint(ai)
  assert.equal(ai.shots.volcano, 0)
  assert.equal(ai.giftCounts.volcano, 0)
})
