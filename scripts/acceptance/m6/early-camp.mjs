// Earned Mission 6 acceptance stage. Run through check-mission6-earned-victory.mjs.
import { outputPath } from './output-path.mjs'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { deserialize, serialize } from 'node:v8'
import { createGameStore } from '../../../app/game-store.ts'
import { command, setSelection, placeBuilding, tick } from '../../../app/model.ts'
import { currentPersonOrder } from '../../../app/person-orders.ts'
const store = createGameStore()
store.startMission(6)
const w = store.getWorld()
Object.assign(
  w,
  structuredClone(deserialize(readFileSync(outputPath('fresh-after-recruitment.v8'))))
)
const braves = () => w.units.filter(u => u.team === 'blue' && u.kind === 'brave' && u.hp > 0)
assert.equal(w.turn, 580)
assert.equal(braves().length, 7)
setSelection(
  w,
  braves().map(u => u.id)
)
assert.ok(placeBuilding(w, 'camp', { x: 51, z: -49 }))
const camp = w.buildings.findLast(b => b.team === 'blue' && b.kind === 'camp')
assert.ok(camp)
const snap = () => ({
  turn: w.turn,
  camp: {
    id: camp.id,
    progress: camp.progress,
    hp: camp.hp,
    x: camp.x,
    z: camp.z,
    occupants: camp.occupants,
    construction: camp.construction,
  },
  blue: w.units
    .filter(u => u.team === 'blue')
    .map(u => ({
      id: u.id,
      kind: u.kind,
      hp: u.hp,
      x: u.x,
      z: u.z,
      inside: u.inside,
      builder: !!u.builder,
      state: u.native?.state,
      order: u.native && structuredClone(currentPersonOrder(w.buildingOrders, u.native)),
    })),
  trees: w.trees.filter(t => t.id < 30).map(t => ({ id: t.id, logs: t.logs })),
  shots: w.shots,
})
console.log(JSON.stringify({ event: 'actual camp plan', selected: [...w.selected], ...snap() }))
for (let i = 0; i < 3000 && camp.progress < 1; i++) {
  tick(w, 1 / 12)
  if (i % 300 === 0) console.log(JSON.stringify({ event: 'actual construction', ...snap() }))
}
console.log(JSON.stringify({ event: 'camp construction frontier', ...snap() }))
writeFileSync(outputPath('early-camp-built.v8'), serialize(w))
assert.equal(camp.progress, 1, 'earned camp must complete')
const selected = braves()
  .slice(0, 4)
  .map(u => u.id)
assert.equal(selected.length, 4)
setSelection(w, selected)
assert.ok(command(w, { ...camp, id: camp.id }))
console.log(JSON.stringify({ event: 'public training admission', selected, ...snap() }))
await store.saveCheckpoint()
assert.ok(store.loadCheckpoint())
const replay = store.getWorld()
assert.deepEqual(replay, w)
for (
  let i = 0;
  i < 4000 && w.units.filter(u => u.team === 'blue' && u.kind === 'warrior' && u.hp > 0).length < 4;
  i++
) {
  tick(w, 1 / 12)
  tick(replay, 1 / 12)
  assert.deepEqual(replay, w)
  if (i % 400 === 0) console.log(JSON.stringify({ event: 'actual training', ...snap() }))
}
console.log(JSON.stringify({ event: 'early army frontier', ...snap() }))
writeFileSync(outputPath('early-army-terminal.v8'), serialize(w))
