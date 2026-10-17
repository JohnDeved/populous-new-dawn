import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, addUnit, HOME, tick, random, cast } from '../app/model.ts'
import { stepLiveConversionVictim } from '../app/live-movement.ts'
import { objectsInCell } from '../app/object-cells.ts'
import { migrateCheckpoint } from '../app/game-store.ts'

function listener(ghost = true) {
  const w = createWorld()
  w.units = []
  w.buildings = []
  w.trees = []
  w.shrines = []
  w.manaWorld.loadFlags |= 0x200
  const preacher = addUnit(w, 'blue', 'preacher', { x: HOME.x + 2, z: HOME.z })
  const victim = addUnit(w, 'red', 'brave', { x: HOME.x + 3, z: HOME.z })
  victim.ghost = ghost
  for (let i = 0; i < 50 && victim.native?.state !== 23; i++) tick(w, 1 / 12)
  assert.equal(victim.native.state, 23)
  assert.equal(!!(victim.native.flags4 & 0x800), ghost)
  return { w, preacher, victim }
}
function forceSuccess(w) { w.manaTribes[1].flags2 |= 64 }
function afterDraws(seed, count) {
  const state = { randomState: seed }
  for (let i = 0; i < count; i++) random(state)
  return state.randomState
}

test('successful ghost conversion bypasses replacement allocation and its three port RNG draws', () => {
  const { w, victim } = listener()
  forceSuccess(w)
  const seed = w.randomState, nextId = w.nextId
  stepLiveConversionVictim(w, victim)
  assert.equal(w.nextId, nextId)
  assert.equal(w.randomState, afterDraws(seed, 1))
  assert.equal(victim.hp, 0)
  assert.equal(victim.native.life, 0)
  assert.equal(w.units.filter(u => u.kind === 'brave' && u.team === 'blue').length, 0)
})

test('successful ghost conversion enters existing removal cleanup without corpse or kill credit', () => {
  const { w, victim } = listener()
  forceSuccess(w)
  w.selected = [victim.id]
  victim.native.damageAttacker = 0
  const credit = structuredClone(w.killCredits)
  const cell = ((victim.native.x >>> 8) & 254) | (victim.native.y & 0xfe00)
  assert.ok([...objectsInCell(w.objectCells, cell)].some(p => p.id === victim.id))
  stepLiveConversionVictim(w, victim)
  assert.equal(victim.work, null)
  assert.equal(victim.target, null)
  assert.equal(victim.fight, null)
  assert.equal(victim.casting, null)
  assert.ok(!w.pathfinding.people.has(victim.id))
  assert.deepEqual(victim.path, [])
  assert.equal(victim.entry, undefined)
  assert.equal(victim.builder, undefined)
  tick(w, 1 / 12)
  assert.ok(!w.units.includes(victim))
  assert.ok(!w.selected.includes(victim.id))
  assert.ok(!w.objectCells.objects.has(victim.id))
  assert.ok(![...objectsInCell(w.objectCells, cell)].some(p => p.id === victim.id))
  assert.ok(victim.native.commands.every(id => id === 0))
  assert.deepEqual(w.killCredits, credit)
  assert.ok(!w.effects.some(fx => fx.corpse || fx.kind === 'death'))
})

test('ordinary replacement retains allocation and four success-path RNG draws', () => {
  const { w, victim } = listener(false)
  forceSuccess(w)
  const seed = w.randomState, nextId = w.nextId
  stepLiveConversionVictim(w, victim)
  assert.equal(w.nextId, nextId + 1)
  assert.equal(w.randomState, afterDraws(seed, 4))
  assert.ok(!w.units.includes(victim))
  const newborn = w.units.find(u => u.id === nextId)
  assert.equal(newborn.team, 'blue')
  assert.equal(newborn.hp, 50)
  assert.ok(!newborn.ghost)
})

for (const failure of ['dead', 'missing']) test(`ghost survives cancelled conversion with ${failure} preacher`, () => {
  const { w, preacher, victim } = listener()
  forceSuccess(w)
  if (failure === 'dead') preacher.hp = 0
  else w.units = w.units.filter(u => u !== preacher)
  const hp = victim.hp, nextId = w.nextId
  stepLiveConversionVictim(w, victim)
  assert.equal(victim.hp, hp)
  assert.ok(victim.ghost)
  assert.notEqual(victim.native.state, 23)
  assert.equal(w.nextId, nextId)
})

test('ordinary Ghost Army and sermon never manufacture real followers', () => {
  const w = createWorld(), shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  w.units = [shaman]
  w.buildings = []
  w.trees = []
  w.shrines = []
  w.manaWorld.loadFlags |= 0x200
  w.terrain.fill(3)
  w.terrainVersion++
  Object.assign(shaman, { x: 0, z: 20, path: [], casting: null })
  w.shots.ghostArmy = 1
  assert.ok(cast(w, 'ghostArmy', { x: 1, z: 13 }))
  for (let i = 0; i < 100 && !w.units.some(u => u.ghost); i++) tick(w, 1 / 12)
  const ghosts = w.units.filter(u => u.ghost)
  assert.equal(ghosts.length, 6)
  addUnit(w, 'red', 'preacher', { x: 2, z: 13 })
  let acquired = false
  for (let i = 0; i < 600 && ghosts.every(u => w.units.includes(u)); i++) {
    tick(w, 1 / 12)
    acquired ||= ghosts.some(u => u.native?.state === 23)
  }
  assert.ok(acquired)
  assert.ok(ghosts.some(u => !w.units.includes(u)), 'ordinary sermon reaches a successful terminal path')
  assert.ok(!w.units.some(u => u.team === 'red' && u.kind === 'brave'))
  assert.ok(w.units.filter(u => u.kind === 'brave').every(u => u.ghost))
})

test('successful ghost removal does not depend on receiving tribe population capacity', () => {
  const { w, victim } = listener()
  victim.native.timer = -1
  let seed = 1
  while (random({ randomState: seed }) % 3 !== 1) seed++
  w.randomState = seed
  for (let i = 0; i < 200; i++) addUnit(w, 'blue', 'brave', { x: HOME.x + 50, z: HOME.z })
  const nextId = w.nextId
  stepLiveConversionVictim(w, victim)
  assert.equal(victim.hp, 0)
  assert.equal(w.nextId, nextId)
})

test('checkpoint preserves successful ghost-removal continuation exactly', () => {
  const { w, victim } = listener()
  forceSuccess(w)
  const restored = structuredClone(w)
  migrateCheckpoint(restored)
  stepLiveConversionVictim(w, victim)
  stepLiveConversionVictim(restored, restored.units.find(u => u.id === victim.id))
  assert.deepEqual(restored, w)
  tick(w, 1 / 12)
  tick(restored, 1 / 12)
  assert.deepEqual(restored, w)
  assert.ok(!w.units.some(u => u.id === victim.id))
})
