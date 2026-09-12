import assert from 'node:assert/strict'
import test from 'node:test'
import constants from '../app/original-constants.json' with { type: 'json' }
import {
  addUnit,
  canPickUnit,
  cast,
  createWorld,
  invisibilityFollowers,
  nativePosition,
  setUnitInvisibility,
  stepUnitInvisibility,
  tick,
  unitInvisibilityRenderFlag,
  unitInvisibleToPlayer,
} from '../app/model.ts'
import { createLivePerson, createMeleePerson, enterLiveCombat } from '../app/live-people.ts'
import { migrateCheckpoint } from '../app/game-store.ts'

const emptyWorld = () => {
  const w = createWorld()
  w.manaWorld.loadFlags |= 0x200
  w.terrain.fill(3)
  w.terrainVersion++
  w.units = []
  w.buildings = []
  w.trees = []
  w.shrines = []
  return w
}
const stepUntil = (w, predicate, limit = 160) => {
  for (let i = 0; !predicate() && i < limit; i++) tick(w, 1 / 12)
  assert.ok(predicate())
}

test('Invisibility marks the native six, does not refresh, and reveals on time or combat', () => {
  const w = emptyWorld()
  addUnit(w, 'blue', 'shaman', { x: 0, z: 0 })
  const existing = addUnit(w, 'blue', 'brave', { x: 2, z: 0 })
  setUnitInvisibility(w, existing, 7)
  const fresh = Array.from({ length: 7 }, () => addUnit(w, 'blue', 'brave', { x: 2, z: 0 }))
  const enemy = addUnit(w, 'red', 'brave', { x: 2, z: 0 })
  addUnit(w, 'blue', 'warrior', { x: 10, z: 0 })

  assert.deepEqual(invisibilityFollowers(w, { x: 2, z: 0 }, 'blue'), fresh.slice(1).reverse())
  assert.equal(existing.invisibility, 7)
  assert.equal(fresh[0].invisibility, undefined)
  assert.equal(fresh[1].invisibility, constants.INVISIBLE_COUNT_X8 * 8)
  assert.equal(enemy.invisibility, undefined)

  fresh[1].native = createLivePerson(w, fresh[1])
  fresh[1].native.renderFlags |= 16
  assert.ok(fresh[1].native.flags4 & 0x1000)
  assert.ok(fresh[1].native.renderFlags & 0x4000)
  fresh[1].invisibility = 1
  stepUnitInvisibility(w)
  assert.equal(fresh[1].invisibility, 0)
  assert.equal(fresh[1].native.flags4 & 0x1000, 0)
  assert.ok(fresh[1].native.renderFlags & 16)
  assert.ok(w.sounds.some(event => event.cue === 0x35 && event.owner === fresh[1].id))

  const alreadyBlended = addUnit(w, 'blue', 'brave', { x: 2, z: 0 })
  alreadyBlended.native = createLivePerson(w, alreadyBlended)
  alreadyBlended.native.flags4 |= 0x800
  alreadyBlended.native.renderFlags |= 0x4000
  setUnitInvisibility(w, alreadyBlended, 10)
  setUnitInvisibility(w, alreadyBlended, 0)
  assert.ok(alreadyBlended.native.renderFlags & 0x4000)

  setUnitInvisibility(w, enemy, 10)
  assert.equal(unitInvisibleToPlayer(w, enemy), true)
  assert.equal(canPickUnit(w, enemy), false)
  w.manaTribes[0].flags2 |= 8
  assert.equal(unitInvisibleToPlayer(w, enemy), false)
  assert.equal(unitInvisibilityRenderFlag(w, enemy), 0x4000)
  enemy.native = createLivePerson(w, enemy)
  w.manaTribes[0].flags2 &= ~8
  setUnitInvisibility(w, enemy, 0)
  assert.equal(enemy.native.renderFlags & 0x4000, 0)
  setUnitInvisibility(w, enemy, 10)
  createMeleePerson(w, enemy)
  assert.equal(enemy.invisibility, 0)
  assert.equal(enemy.native.flags4 & 0x1000, 0)

  const unowned = addUnit(w, 'red', 'warrior', { x: 2, z: 0 })
  setUnitInvisibility(w, unowned, 10)
  assert.equal(enterLiveCombat(w, unowned, 25).flags4 & 0x1000, 0)
})

test('player and computer casts share Invisibility application and old saves migrate', () => {
  const w = emptyWorld()
  addUnit(w, 'blue', 'shaman', { x: 0, z: 0 })
  const follower = addUnit(w, 'blue', 'brave', { x: 2, z: 0 })
  w.shots.invisibility = 1
  assert.ok(cast(w, 'invisibility', follower))
  stepUntil(w, () => !!follower.invisibility)
  assert.equal(w.shots.invisibility, 0)
  assert.ok(w.sounds.some(event => event.cue === 0x31))

  const ai = createWorld(),
    red = ai.units.find(u => u.team === 'red' && u.kind === 'shaman'),
    blue = ai.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
    ally = addUnit(ai, 'red', 'brave', { x: 2, z: 0 }),
    target = ai.units.find(u => u.team === 'blue' && u.kind === 'brave')
  ai.terrain.fill(3)
  ai.terrainVersion++
  ai.units = [red, blue, ally, target]
  Object.assign(red, { x: 0, z: 0, path: [], casting: null })
  Object.assign(ally, { x: 2, z: 0, path: [], casting: null })
  Object.assign(target, { x: 2, z: 0, path: [], casting: null })
  ai.turn = 16
  ai.manaTribes[1].mana = 50000
  ai.manaWorld.spells[1].stocks[6] = 1
  ai.ai.spellEntries = ai.ai.spellEntries.map((entry, i) => ({
    ...entry,
    model: i ? 0 : 6,
    mana: 0,
    people: 1,
    mode: 0,
  }))
  const p = nativePosition(ai, target)
  ai.spellScan.targets[0] = (p.y & 0xfe00) | ((p.x >>> 8) & 254) || 1
  tick(ai, 1 / 12)
  assert.equal(ai.projectiles.at(-1)?.spell, 'invisibility')
  stepUntil(ai, () => !!ally.invisibility)
  assert.equal(red.team, 'red')

  delete ai.shots.invisibility
  delete ai.giftCounts.invisibility
  migrateCheckpoint(ai)
  assert.equal(ai.shots.invisibility, 0)
  assert.equal(ai.giftCounts.invisibility, 0)
})
