// Earned Mission 6 acceptance stage. Run through check-mission6-earned-victory.mjs.
import { outputPath } from './output-path.mjs'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { deserialize, serialize } from 'node:v8'
import { createGameStore } from '../../../app/game-store.ts'
import { tick } from '../../../app/model.ts'
const store = createGameStore()
store.startMission(6)
const w = store.getWorld()
Object.assign(w, structuredClone(deserialize(readFileSync(outputPath('live-yellow-terminal.v8')))))
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
console.log(JSON.stringify({ event: 'observed live melee continuation', ...snap() }))
for (let i = 0; i < 600 && w.status === 'playing' && !w.manaTribes[2].defeatTimer; i++) {
  tick(w, 1 / 12)
  tick(replay, 1 / 12)
  assert.deepEqual(w, replay)
  if (i % 100 === 99) console.log(JSON.stringify(snap()))
}
writeFileSync(outputPath('chumara-defeat.v8'), serialize(w))
console.log(JSON.stringify({ event: 'frontier', ...snap() }))
assert.ok(w.manaTribes[2].defeatTimer > 0)
assert.equal(w.units.filter(u => u.team === 'yellow' && u.hp > 0).length, 0)
