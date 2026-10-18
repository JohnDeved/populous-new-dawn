#!/usr/bin/env node
import assert from 'node:assert/strict'
import { createWorld } from '../app/model.ts'
import { advanceGame } from '../app/game-clock.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { currentPersonOrder } from '../app/person-orders.ts'

// Ordinary shipped clock and original actors/resources. No fixture injections.
const w = createWorld(7)
const clock = { animationTime: 0, animationFrame: 0 }
let replayClock
const shaman = w.units.find(u => u.team === 'yellow' && u.kind === 'shaman')
const conversions = []
const start = { x: shaman.x, z: shaman.z }
const active = () => w.ai.tasks.find(t => t.flags & 1 && t.type === 2)
const phases = new Set(), events = []
let replay, firstTask, retired = false
function step() {
  const wild = w.units.filter(u => u.team === 'wild').map(u => ({ id: u.id, x: u.x, z: u.z })),
    ids = new Set(w.units.map(u => u.id))
  advanceGame(w, clock, 1 / 12)
  if (replay) advanceGame(replay, replayClock, 1 / 12)
  for (const old of wild.filter(u => !w.units.some(next => next.id === u.id))) {
    const replacement = w.units.find(u => !ids.has(u.id) && u.team === 'yellow' &&
      u.kind === 'brave' && u.native?.flags4 & 0x40000 && u.x === old.x && u.z === old.z)
    assert.ok(replacement, 'each removed Wildman must have a same-position Chumara conversion newborn')
    conversions.push({ turn: w.turn, wild: old.id, brave: replacement.id })
  }
}
assert.equal(w.manaWorld.spells[2].stocks[17], 0)
assert.equal(w.spellCasts[2][17], 0)
for (let i = 0; i < 2500 && !retired; i++) {
  const before = { casts: w.spellCasts[2][17], mana: w.manaTribes[2].mana }
  step()
  const task = active()
  if (task) { firstTask ??= task; phases.add(task.phase) }
  if (task?.phase === 8 && !replay) {
    assert.equal(currentPersonOrder(w.buildingOrders, shaman.native)?.model, 3)
    replay = migrateCheckpoint(structuredClone(w))
    replayClock = structuredClone(clock)
    events.push({ turn: w.turn, phase: 8, x: shaman.x, z: shaman.z })
  }
  if (w.spellCasts[2][17] !== before.casts) {
    events.push({ turn: w.turn, cast: w.spellCasts[2][17], manaBefore: before.mana, manaAfter: w.manaTribes[2].mana, stock: w.manaWorld.spells[2].stocks[17], usage: { ...w.castingTribes[2].spells[17] } })
    assert.ok(w.manaTribes[2].mana < before.mana)
    assert.equal(w.ai.flags & 0x40000, 0x40000)
    assert.deepEqual(w.castingTribes[2].spells[17], { used: 1, interval: 1, remaining: 64 })
  }
  retired = !!firstTask && !(firstTask.flags & 1) && w.spellCasts[2][17] > 0
}
console.log(JSON.stringify({ turn: w.turn, phases: [...phases], events, retired, conversions, position: [shaman.x, shaman.z] }))
assert.deepEqual([...phases], [0, 2, 4, 5, 6, 7, 8, 3])
assert.ok(retired)
assert.notDeepEqual({ x: shaman.x, z: shaman.z }, start)
assert.ok(replay)
assert.deepEqual(replay, w)
for (let n = 0; n < 64; n++) step()
assert.ok(conversions.length > 0)
assert.deepEqual(replay, w)
console.log(JSON.stringify({ completeSaveLoadTwin: true, conversions, randomState: w.randomState, turn: w.turn }))
