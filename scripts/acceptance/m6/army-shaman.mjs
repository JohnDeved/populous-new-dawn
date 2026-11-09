// Earned Mission 6 acceptance stage. Run through check-mission6-earned-victory.mjs.
import { outputPath } from './output-path.mjs'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { deserialize, serialize } from 'node:v8'
import { createGameStore } from '../../../app/game-store.ts'
import { command, setSelection, tick } from '../../../app/model.ts'
import { currentPersonOrder } from '../../../app/person-orders.ts'
import { liveCommandContext } from '../../../app/live-command.ts'
const store = createGameStore()
store.startMission(6)
const w = store.getWorld()
Object.assign(
  w,
  structuredClone(deserialize(readFileSync(outputPath('army-approach-terminal.v8'))))
)
const ids = w.units
    .filter(u => u.team === 'blue' && u.hp > 0 && ['shaman', 'warrior'].includes(u.kind))
    .map(u => u.id),
  target = w.units.find(u => u.id === 16)
assert.ok(target?.hp > 0)
setSelection(w, ids)
const context = liveCommandContext(w, { ...target, id: 16 })
console.log(
  JSON.stringify({
    event: 'public squad target context',
    turn: w.turn,
    selected: w.selected,
    context,
  })
)
assert.ok(command(w, { ...target, id: 16 }))
const records = [
  ...new Set(
    ids.flatMap(id => {
      const p = w.units.find(u => u.id === id)?.native
      return p ? [p.immediateCommand, ...p.commands].filter(Boolean) : []
    })
  ),
]
const snap = () => ({
  turn: w.turn,
  status: w.status,
  target: { id: 16, hp: target.hp, present: w.units.includes(target), x: target.x, z: target.z },
  army: ids.map(id => {
    const u = w.units.find(u => u.id === id),
      p = u?.fight?.motion ?? u?.native
    return {
      id,
      present: !!u,
      team: u?.team,
      hp: u?.hp,
      x: u?.x,
      z: u?.z,
      state: p?.state,
      fight: u?.fight && { opponent: u.fight.opponent, action: u.fight.action },
      order: p && structuredClone(currentPersonOrder(w.buildingOrders, p)),
      registry: !!p && w.objectCells.objects.get(id) === p,
    }
  }),
  records: records.map(id => ({ id, ...w.buildingOrders.records[id] })),
  shots: w.shots,
  population: w.units.filter(u => u.team === 'yellow' && u.hp > 0).length,
})
console.log(JSON.stringify({ event: 'actual squad admission', ...snap() }))
await store.saveCheckpoint()
assert.ok(store.loadCheckpoint())
const replay = store.getWorld()
assert.deepEqual(replay, w)
let last = ''
for (
  let i = 0;
  i < 1500 &&
  target.hp > 0 &&
  ids.some(id => w.units.some(u => u.id === id && u.team === 'blue' && u.hp > 0));
  i++
) {
  tick(w, 1 / 12)
  tick(replay, 1 / 12)
  assert.deepEqual(replay, w)
  const sig = JSON.stringify([
    target.hp,
    ids.map(id => {
      const u = w.units.find(u => u.id === id)
      return [u?.hp, u?.team, u?.fight?.opponent]
    }),
  ])
  if (sig !== last || i % 200 === 0) {
    console.log(JSON.stringify({ event: 'actual squad engagement', ...snap() }))
    last = sig
  }
}
console.log(JSON.stringify({ event: 'bounded squad outcome', ...snap() }))
writeFileSync(outputPath('army-shaman-terminal.v8'), serialize(w))
