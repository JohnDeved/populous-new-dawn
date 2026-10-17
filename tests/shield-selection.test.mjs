import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createWorld,
  addUnit,
  browserPosition,
  shieldFollowers,
  cast,
  tick,
  stepUnitShields,
} from '../app/model.ts'
import { createLivePerson, syncLivePersonCells } from '../app/live-people.ts'
import { syncLandscapeObjects } from '../app/world-terrain-runtime.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import constants from '../app/original-constants.json' with { type: 'json' }

function field() {
  const w = createWorld()
  w.manaWorld.loadFlags |= 0x200
  w.terrain.fill(3)
  w.terrainVersion++
  w.units = []
  w.buildings = []
  w.trees = []
  w.shrines = []
  syncLandscapeObjects(w)
  return w
}
function person(w, x, y, team = 'blue', kind = 'brave') {
  const u = addUnit(w, team, kind, browserPosition({ x, y }))
  u.native = createLivePerson(w, u)
  return u
}
const aim = (x, y) => browserPosition({ x, y })
const ids = units => units.map(u => u.id)

for (const exclusion of [
  'shield',
  'ghost',
  'hypnotised',
  'wild model',
  'shaman model',
  'angel model',
  'other class',
  'enemy',
  'neutral',
]) {
  test(`Shield native predicate excludes ${exclusion} before applying the cap`, () => {
    const w = field(),
      excluded = person(w, 0x2100, 0x2100),
      eligible = person(w, 0x2120, 0x2100)
    if (exclusion === 'shield') {
      excluded.shield = 7
      excluded.native.flags3 |= 0x8000
    }
    if (exclusion === 'ghost') {
      excluded.ghost = true
      excluded.native.flags4 |= 0x800
    }
    if (exclusion === 'hypnotised') {
      excluded.hypnotise = { originalTeam: 'red', remaining: 55, counter: 0 }
      excluded.native.flags4 |= 0x4000
    }
    if (exclusion === 'wild model') excluded.native.model = 1
    if (exclusion === 'shaman model') excluded.native.model = 7
    if (exclusion === 'angel model') excluded.native.model = 8
    if (exclusion === 'other class') excluded.native.class = 2
    if (exclusion === 'enemy') {
      excluded.team = 'red'
      excluded.native.tribe = 1
    }
    if (exclusion === 'neutral') {
      excluded.team = 'wild'
      excluded.native.tribe = -1
    }
    eligible.bloodlust = 40
    eligible.native.flags3 |= 0x80000
    syncLivePersonCells(w)
    const randomState = w.randomState
    assert.deepEqual(shieldFollowers(w, aim(0x2100, 0x2100), 'blue'), [eligible])
    assert.equal(excluded.shield, exclusion === 'shield' ? 7 : undefined)
    assert.equal(eligible.shield, 1440)
    assert.equal(eligible.native.flags3 & 0x88000, 0x88000, 'Bloodlust coexists')
    assert.equal(w.randomState, randomState)
  })
}

test('Shield visits the exact even-cell square including byte wrapping', () => {
  for (const center of [0x2200, 0]) {
    const w = field(),
      low = (center - 512) & 65535,
      high = (center + 1023) & 65535
    const inside = [
      [low, low],
      [high, high],
      [center, center],
    ].map(([x, y]) => person(w, x, y))
    const outside = [
      [(low - 1) & 65535, center],
      [(high + 1) & 65535, center],
      [center, (low - 1) & 65535],
      [center, (high + 1) & 65535],
    ].map(([x, y]) => person(w, x, y))
    syncLivePersonCells(w)
    assert.deepEqual(
      new Set(ids(shieldFollowers(w, aim(center, center), 'blue'))),
      new Set(ids(inside))
    )
    assert.ok(outside.every(u => u.shield === undefined))
  }
})

test('equal-distance Shield ties follow reversed cell-chain discovery, not unit array order', () => {
  const w = field(),
    people = Array.from({ length: 8 }, () => person(w, 0x2100, 0x2100))
  syncLivePersonCells(w)
  w.units.reverse()
  assert.deepEqual(ids(shieldFollowers(w, aim(0x2100, 0x2100), 'blue')), ids(people.slice(0, 6)))
})

test('a later cell wins a distance tie and a later closer candidate is considered before the cap', () => {
  for (const closer of [false, true]) {
    const w = field(),
      earlier = Array.from({ length: 6 }, () => person(w, 0x1fff, 0x2100)),
      later = person(w, closer ? 0x2200 : 0x2201, 0x2100)
    syncLivePersonCells(w)
    assert.deepEqual(ids(shieldFollowers(w, aim(0x2100, 0x2100), 'blue')), [
      later.id,
      ...ids(earlier.slice(0, 5)),
    ])
  }
})

test('ordinary Shield cast does not refresh six protected followers and shields an eligible seventh', () => {
  const w = field()
  addUnit(w, 'blue', 'shaman', { x: 0, z: 8 })
  const old = Array.from({ length: 6 }, () => addUnit(w, 'blue', 'brave', { x: 0, z: 0 })),
    fresh = addUnit(w, 'blue', 'brave', { x: 1, z: 0 })
  for (const u of old) {
    u.shield = 1000
    u.native = createLivePerson(w, u)
    u.native.flags3 |= 0x8000
  }
  fresh.native = createLivePerson(w, fresh)
  syncLivePersonCells(w)
  w.shots.shield = 1
  assert.equal(cast(w, 'shield', { x: 0, z: 0 }), true)
  for (let n = 0; w.projectiles.length && n < 120; n++) tick(w, 1 / 12)
  assert.equal(w.projectiles.length, 0)
  assert.equal(w.shots.shield, 0)
  assert.equal(w.turn, 8)
  assert.ok(old.every(u => u.shield === 1000 - w.turn))
  assert.equal(fresh.shield, constants.SHIELD_COUNT_X8 * 8)
})

test('checkpoint preserves eligibility, separate expiry, and newly applied status', () => {
  const w = field(),
    old = person(w, 0x2100, 0x2100),
    fresh = person(w, 0x2120, 0x2100)
  old.shield = 2
  old.native.flags3 |= 0x8000
  syncLivePersonCells(w)
  const restored = migrateCheckpoint(structuredClone(w))
  assert.deepEqual(ids(shieldFollowers(w, aim(0x2100, 0x2100), 'blue')), [fresh.id])
  assert.deepEqual(ids(shieldFollowers(restored, aim(0x2100, 0x2100), 'blue')), [fresh.id])
  for (let n = 0; n < 2; n++) {
    stepUnitShields(w)
    stepUnitShields(restored)
  }
  assert.equal(old.shield, 0)
  assert.equal(old.native.flags3 & 0x8000, 0)
  assert.equal(fresh.shield, 1438)
  assert.deepEqual(restored, w)
  assert.deepEqual(ids(shieldFollowers(w, aim(0x2100, 0x2100), 'blue')), [old.id])
  assert.equal(fresh.shield, 1438, 'still-active Shield is not refreshed after neighbor expiry')
})
