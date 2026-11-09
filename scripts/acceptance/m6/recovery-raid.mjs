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
Object.assign(
  w,
  structuredClone(deserialize(readFileSync(outputPath('recovery-stage-terminal.v8'))))
)
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

const warriors = w.units.filter(u => u.team === 'blue' && u.kind === 'warrior').map(u => u.id)
const shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
const head = w.shrines.find(s => s.reward === 'firestorm')
const camp = w.buildings.find(b => b.team === 'green' && b.kind === 'camp')
for (const world of [w, replay]) {
  setSelection(world, [shaman.id])
  assert.ok(command(world, { x: -65, z: -111 }))
  setSelection(world, [warriors[0]])
  assert.ok(command(world, { id: head.id, x: head.x, z: head.z }))
  setSelection(world, warriors.slice(1))
  assert.ok(command(world, { id: camp.id, x: camp.x, z: camp.z }))
}
for (let i = 0; i < 900 && w.status === 'playing'; i++) {
  tick(w, 1 / 12)
  tick(replay, 1 / 12)
  assert.deepEqual(w, replay)
  if (i % 100 === 99) {
    writeFileSync(outputPath('recovery-raid-progress.v8'), serialize(w))
    console.log(JSON.stringify(snap()))
  }
}
writeFileSync(outputPath('recovery-raid-terminal.v8'), serialize(w))
console.log(JSON.stringify({ event: 'frontier', ...snap() }))
