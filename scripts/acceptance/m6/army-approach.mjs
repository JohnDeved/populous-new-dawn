// Earned Mission 6 acceptance stage. Run through check-mission6-earned-victory.mjs.
import { outputPath } from './output-path.mjs'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { deserialize, serialize } from 'node:v8'
import { createGameStore } from '../../../app/game-store.ts'
import { command, setSelection, tick } from '../../../app/model.ts'
import { currentPersonOrder } from '../../../app/person-orders.ts'
const store = createGameStore()
store.startMission(6)
const w = store.getWorld()
Object.assign(w, structuredClone(deserialize(readFileSync(outputPath('early-army-terminal.v8')))))
const ids = w.units
  .filter(u => u.team === 'blue' && u.hp > 0 && ['shaman', 'warrior'].includes(u.kind))
  .map(u => u.id)
assert.equal(ids.length, 5)
setSelection(w, ids)
assert.deepEqual(
  [...w.selected].sort((a, b) => a - b),
  [...ids].sort((a, b) => a - b)
)
assert.ok(command(w, { x: 121, z: 75 }))
const shaman = w.units.find(u => u.id === 95),
  record = shaman.native.immediateCommand || shaman.native.commands[shaman.native.commandCursor]
const snap = () => ({
  turn: w.turn,
  record,
  order: structuredClone(w.buildingOrders.records[record]),
  army: ids.map(id => {
    const u = w.units.find(u => u.id === id),
      p = u?.native ?? u?.fight?.motion
    return {
      id,
      present: !!u,
      hp: u?.hp,
      kind: u?.kind,
      x: u?.x,
      z: u?.z,
      state: p?.state,
      substate: p?.substate,
      fight: u?.fight && { opponent: u.fight.opponent, action: u.fight.action },
      order: p && structuredClone(currentPersonOrder(w.buildingOrders, p)),
      registry: !!p && w.objectCells.objects.get(id) === p,
    }
  }),
  status: w.status,
})
console.log(JSON.stringify({ event: 'actual group admission', ...snap() }))
await store.saveCheckpoint()
assert.ok(store.loadCheckpoint())
const replay = store.getWorld()
assert.deepEqual(replay, w)
for (let i = 0; i < 1800 && w.buildingOrders.records[record].references && shaman.hp > 0; i++) {
  tick(w, 1 / 12)
  tick(replay, 1 / 12)
  assert.deepEqual(replay, w)
  if (i % 200 === 0) console.log(JSON.stringify({ event: 'actual army approach', ...snap() }))
}
console.log(JSON.stringify({ event: 'bounded army frontier', ...snap() }))
writeFileSync(outputPath('army-approach-terminal.v8'), serialize(w))
