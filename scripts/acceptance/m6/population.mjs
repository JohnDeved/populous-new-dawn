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
Object.assign(w, structuredClone(deserialize(readFileSync(outputPath('hut-resume-terminal.v8')))))
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

const hut = w.buildings.find(b => b.id === 1022)
assert.equal(hut.progress, 1)
for (const world of [w, replay]) {
  setSelection(world, [290])
  assert.ok(command(world, { id: hut.id, x: hut.x, z: hut.z }))
}
assert.deepEqual(w, replay)
console.log(JSON.stringify({ event: 'public housing order', hut, ...snap() }))
for (let i = 0; i < 3000 && w.status === 'playing'; i++) {
  tick(w, 1 / 12)
  tick(replay, 1 / 12)
  assert.deepEqual(w, replay)
  if (i % 500 === 499)
    console.log(
      JSON.stringify({
        event: 'earned population growth',
        hut: { progress: hut.progress, occupants: hut.occupants, birth: hut.birth },
        ...snap(),
      })
    )
}
writeFileSync(outputPath('population-terminal.v8'), serialize(w))
console.log(JSON.stringify({ event: 'frontier', ...snap() }))
