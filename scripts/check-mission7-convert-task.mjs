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
const initialWild = new Set(w.units.filter(u => u.team === 'wild').map(u => u.id))
const start = { x: shaman.x, z: shaman.z }
const active = () => w.ai.tasks.find(t => t.flags & 1 && t.type === 2)
const phases = new Set(), events = []
let replay, firstTask, retired = false
assert.equal(w.manaWorld.spells[2].stocks[17], 0)
assert.equal(w.spellCasts[2][17], 0)
for (let i = 0; i < 2500 && !retired; i++) {
  const before = { casts: w.spellCasts[2][17], mana: w.manaTribes[2].mana }
  advanceGame(w, clock, 1 / 12)
  if (replay) advanceGame(replay, replayClock, 1 / 12)
  const task = active()
  if (task) { firstTask ??= task; phases.add(task.phase) }
  if (task?.phase === 8 && !replay) {
    assert.equal(currentPersonOrder(w.buildingOrders, shaman.native)?.model, 3)
    replay = migrateCheckpoint(structuredClone(w))
    replayClock = structuredClone(clock)
    events.push({ turn: w.turn, phase: 8, x: shaman.x, z: shaman.z })
  }
  if (w.spellCasts[2][17] !== before.casts) {
    events.push({ turn: w.turn, cast: w.spellCasts[2][17], manaBefore: before.mana, manaAfter: w.manaTribes[2].mana, stock: w.manaWorld.spells[2].stocks[17] })
    assert.ok(w.manaTribes[2].mana < before.mana)
  }
  retired = !!firstTask && !(firstTask.flags & 1) && w.spellCasts[2][17] > 0
}
console.log(JSON.stringify({ turn: w.turn, phases: [...phases], events, retired, converted: w.units.filter(u => initialWild.has(u.id) && u.team === 'yellow').length, position: [shaman.x, shaman.z] }))
assert.deepEqual([...phases], [0, 2, 4, 5, 6, 7, 8, 3])
assert.ok(retired)
assert.notDeepEqual({ x: shaman.x, z: shaman.z }, start)
assert.ok(replay)
assert.deepEqual(replay, w)
for (let n = 0; n < 64; n++) { advanceGame(w, clock, 1 / 12); advanceGame(replay, replayClock, 1 / 12) }
assert.ok(w.units.some(u => initialWild.has(u.id) && u.team === 'yellow'))
assert.deepEqual(replay, w)
console.log(JSON.stringify({ completeSaveLoadTwin: true, randomState: w.randomState, turn: w.turn }))
