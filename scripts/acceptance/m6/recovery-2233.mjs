// Earned Mission 6 acceptance stage. Run through check-mission6-earned-victory.mjs.
import { outputPath } from './output-path.mjs'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { deserialize, serialize } from 'node:v8'
import { createGameStore } from '../../../app/game-store.ts'
import { command, setSelection, tick } from '../../../app/model.ts'
const store = createGameStore()
store.startMission(6)
const w = store.getWorld()
Object.assign(w, structuredClone(deserialize(readFileSync(outputPath('matak-stage-terminal.v8')))))
await store.saveCheckpoint()
assert.ok(store.loadCheckpoint())
const replay = store.getWorld()
assert.deepEqual(replay, w)
const snap = () => ({
  turn: w.turn,
  status: w.status,
  units: w.units
    .filter(u => u.team === 'blue' || u.team === 'yellow')
    .map(u => ({
      id: u.id,
      team: u.team,
      kind: u.kind,
      hp: u.hp,
      x: u.x,
      z: u.z,
      fight: u.fight?.action,
    })),
  pop: w.units.filter(u => u.team === 'green').length,
  shots: w.shots,
  defeat: w.manaTribes.map(t => t.defeatTimer),
})

const target = w.units.find(u => u.team === 'green' && u.kind === 'shaman')
const head = w.shrines.find(s => s.reward === 'hypnotise')
const camp = w.buildings.find(b => b.team === 'blue' && b.kind === 'camp')
const trainees = w.units
  .filter(u => u.team === 'blue' && u.kind === 'brave')
  .slice(0, 6)
  .map(u => u.id)
for (const world of [w, replay]) {
  setSelection(world, [523])
  assert.ok(command(world, { id: head.id, x: head.x, z: head.z }))
  setSelection(world, [521, 522, 524])
  assert.ok(command(world, { id: target.id, x: target.x, z: target.z }))
  setSelection(world, trainees)
  assert.ok(command(world, { id: camp.id, x: camp.x, z: camp.z }))
  setSelection(world, [9277])
  assert.ok(command(world, { x: 109, z: -79 }))
}
assert.deepEqual(w, replay)
console.log(
  JSON.stringify({
    event: 'public Matak attack, head worship, training and shaman approach',
    target: target.id,
    head: head.id,
    trainees,
    ...snap(),
  })
)
for (let i = 0; i < 2000 && w.status === 'playing'; i++) {
  tick(w, 1 / 12)
  tick(replay, 1 / 12)
  assert.deepEqual(w, replay)
  if (i % 250 === 249) writeFileSync(outputPath('recovery-2233-progress.v8'), serialize(w))
  if (i % 250 === 249)
    console.log(JSON.stringify({ event: 'actual battle and training', ...snap() }))
}
writeFileSync(outputPath('recovery-2233-terminal.v8'), serialize(w))
console.log(JSON.stringify({ event: 'frontier', ...snap() }))
