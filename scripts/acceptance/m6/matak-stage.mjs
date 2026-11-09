// Earned Mission 6 acceptance stage. Run through check-mission6-earned-victory.mjs.
import { outputPath } from './output-path.mjs'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { deserialize, serialize } from 'node:v8'
import { createGameStore } from '../../../app/game-store.ts'
import { command, setSelection, placeBuilding, tick } from '../../../app/model.ts'
const store = createGameStore()
store.startMission(6)
const w = store.getWorld()
Object.assign(w, structuredClone(deserialize(readFileSync(outputPath('population-terminal.v8')))))
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

for (const world of [w, replay]) {
  setSelection(
    world,
    world.units.filter(u => u.team === 'blue' && u.kind === 'warrior').map(u => u.id)
  )
  assert.ok(command(world, { x: -65, z: -111 }))
  setSelection(
    world,
    world.units.filter(u => u.team === 'blue' && u.kind === 'brave').map(u => u.id)
  )
  assert.ok(placeBuilding(world, 'hut', { x: 41, z: -55 }))
}
assert.deepEqual(w, replay)
const hut = w.buildings.findLast(b => b.team === 'blue' && b.kind === 'hut')
console.log(JSON.stringify({ event: 'public army staging and second hut', hut, ...snap() }))
for (let i = 0; i < 1800 && w.status === 'playing'; i++) {
  tick(w, 1 / 12)
  tick(replay, 1 / 12)
  assert.deepEqual(w, replay)
  if (i % 300 === 299)
    console.log(
      JSON.stringify({ event: 'staging and construction', progress: hut.progress, ...snap() })
    )
}
writeFileSync(outputPath('matak-stage-terminal.v8'), serialize(w))
console.log(JSON.stringify({ event: 'frontier', progress: hut.progress, ...snap() }))
