import assert from 'node:assert/strict'
import test from 'node:test'
import {
  HOME, addUnit, createWorld, nativePosition, setUnitInvisibility,
  tick, unitAnimationSource,
} from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { combatPerson } from '../app/live-combat.ts'
import { stepComputerSpells } from '../app/computer-runtime.ts'
import { processComputerSpells } from '../app/computer-spells.ts'
import { spellCaster } from '../app/spell-casting.ts'

const packedCell = p => ((p.x >>> 8) & 254) | (p.y & 0xfe00)

// Actors/readiness are staged to bound this adapter regression. The assignment
// bit is produced by actual fixed-turn preaching, never injected by the test.
function scenario() {
  const w = createWorld()
  w.units = w.units.filter(u => u.kind === 'shaman')
  w.selected = []
  const preacher = addUnit(w, 'blue', 'preacher', { x: HOME.x + 2, z: HOME.z })
  const victim = addUnit(w, 'red', 'brave', { x: HOME.x + 3, z: HOME.z })
  for (let i = 0; i < 24 && !(preacher.native?.assignment & 64); i++) tick(w, 1 / 12)
  assert.equal(w.turn, 6, 'The ordinary sermon acquires its listener in six fixed turns')
  assert.equal(currentPersonOrder(w.buildingOrders, preacher.native)?.model, 17)
  assert.equal(unitAnimationSource(preacher), preacher.native)
  assert.equal(preacher.native.assignment & 64, 64)
  assert.equal(victim.native.state, 23)
  assert.equal(victim.native.workTarget, preacher.id)

  const shaman = w.units.find(u => u.team === 'red' && u.kind === 'shaman')
  w.units = [shaman, preacher, victim]
  Object.assign(shaman, { x: preacher.x - 6, z: preacher.z, path: [], work: null })
  Object.assign(shaman.native, nativePosition(w, shaman))
  // Turn one excludes normal 16-turn dispatch and shoreline Blast. No early
  // response flags/frequency are enabled; the entry only supplies scan readiness.
  w.turn = 1
  w.ai.flags = 0
  w.ai.attributes[32] = 0
  w.ai.attributes[43] = 12
  w.ai.spellEntries = Array.from({ length: 8 }, (_, i) =>
    ({ model: i ? 0 : 2, mana: 0, people: 99, mode: 0, range: 0 }))
  w.manaTribes[1].mana = 120000
  Object.assign(w.manaWorld.spells[1], { available: (1 << 2) | (1 << 5) | (1 << 3), disabled: 0 })
  w.manaWorld.spells[1].stocks.fill(0)
  w.castingTribes[1].cooldown = 0
  w.castingTribes[1].aiCooldown = 0
  Object.assign(w.spellScan, { cursor: 0, paused: 0, targets: [0, 0, 0, 0] })
  assert.equal(w.projectiles.length, 0)
  return { w, preacher, victim, shaman }
}

// Reuse the complete native-backed controller as a reference at the existing
// adapter boundary. Supply the actual produced person rather than a second
// implementation of the private adapter or an invented native byte layout.
function referenceResponse({ w, preacher, shaman }) {
  const p = preacher.native, position = nativePosition(w, preacher)
  const caster = structuredClone({
    ...spellCaster(w, shaman), ...combatPerson(shaman),
    landIndex: combatPerson(shaman).vehicle,
    casting: w.castingTribes[1], playerType: w.manaTribes[1].playerType,
  })
  const casts = []
  processComputerSpells({
    tribe: 1, alliances: w.outcome.alliances[1],
    cells: new Map([[packedCell(position), [{ ...p, ...position }]]]),
    terrainFlags: () => 0,
  }, structuredClone(w.spellScan), caster, {
    turn: w.turn, mana: w.manaTribes[1].mana, reserve: 0,
    gameFlags: w.manaWorld.gameFlags, aiFlags: w.ai.flags,
    blastFrequency: w.ai.attributes[32], stock: structuredClone(w.manaWorld.spells[1]),
  }, w.ai.spellEntries, {
    enemyShaman: null, enemyBuildings: [], categoryFlags: () => 1, regionFlags: () => 0,
    cast: (model, cell) => { casts.push([model, cell]); caster.casting.aiCooldown = 12 },
  })
  return casts
}

for (const [name, available, model, spell] of [
  ['Blast priority', (1 << 2) | (1 << 5) | (1 << 3), 2, 'blast'],
  ['Swarm fallback', (1 << 5) | (1 << 3), 5, 'swarm'],
  ['Lightning fallback', 1 << 3, 3, 'lightning'],
]) test(`live active preaching reaches emergency ${name}`, () => {
  const s = scenario(), { w, preacher, shaman } = s
  w.manaWorld.spells[1].available = available
  const cell = packedCell(nativePosition(w, preacher))
  assert.deepEqual(referenceResponse(s), [[model, cell]], 'The native-backed consumer reaches this branch')
  stepComputerSpells(w, 1)
  assert.equal(w.spellScan.cursor, 80, 'The live general scan ran')
  assert.ok(w.spellScan.targets.includes(cell), 'The live adapter found the actual preaching person')
  assert.equal(w.spellCasts[1][model], 1, 'The live adapter must preserve the produced assignment bit')
  assert.equal(shaman.casting.spell, spell)
  assert.equal(w.projectiles.length, 1)
  assert.equal(packedCell(nativePosition(w, w.projectiles[0].target)), cell)
  assert.equal(w.castingTribes[1].aiCooldown, 12)
})

for (const [name, change] of [
  ['no active assignment', ({ preacher }) => { preacher.native.assignment &= ~64 }],
  ['no live person record', ({ preacher }) => { preacher.native = undefined }],
  ['same tribe', ({ preacher }) => { preacher.team = 'red'; preacher.native.tribe = 1 }],
  ['allied tribe', ({ w }) => { w.outcome.alliances[1] |= 1 }],
  ['invisible preacher', ({ w, preacher }) => { setUnitInvisibility(w, preacher, 100) }],
  ['caster cooldown', ({ w }) => { w.castingTribes[1].aiCooldown = 1 }],
  ['no ready spell entry', ({ w }) => { w.ai.spellEntries.forEach(e => { e.model = 0 }) }],
  ['paused target scan', ({ w }) => { w.spellScan.paused = 1 }],
  ['no spell payment', ({ w }) => { w.manaWorld.spells[1].available = 0 }],
  ['stored Lightning below its mana cost', ({ w }) => {
    w.manaWorld.spells[1].available = 0
    w.manaWorld.spells[1].stocks[3] = 1
    w.manaTribes[1].mana = 79999
  }],
]) test(`emergency preaching response excludes ${name}`, () => {
  const s = scenario()
  change(s)
  assert.deepEqual(referenceResponse(s), [])
  stepComputerSpells(s.w, 1)
  assert.equal(s.shaman.casting, null)
  assert.equal(s.w.projectiles.length, 0)
  assert.deepEqual(s.w.spellCasts[1], Array(22).fill(0))
})

test('the independent enemy-Shaman response still spends stored Lightning without mana', () => {
  const { w, preacher, shaman } = scenario()
  preacher.native.assignment &= ~64
  const enemy = addUnit(w, 'blue', 'shaman', { x: preacher.x, z: preacher.z + 2 })
  w.ai.enemyTribe = 0
  w.ai.flags = 0x4000
  w.ai.attributes[32] = 1
  w.turn = 3
  w.manaTribes[1].mana = 0
  w.manaWorld.spells[1].available = 0
  w.manaWorld.spells[1].stocks[3] = 1
  Object.assign(w.spellScan, { cursor: 79, paused: 1, targets: [1, 2, 3, 4] })
  const scan = structuredClone(w.spellScan)
  stepComputerSpells(w, 1)
  assert.equal(shaman.casting.spell, 'lightning')
  assert.equal(w.spellCasts[1][3], 1)
  assert.equal(w.manaWorld.spells[1].stocks[3], 0)
  assert.deepEqual(w.projectiles[0].target, { x: enemy.x, z: enemy.z })
  assert.deepEqual(w.spellScan, scan, 'An early response preserves pending scan work')
})
