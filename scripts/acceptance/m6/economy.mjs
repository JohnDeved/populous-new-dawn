// Earned Mission 6 acceptance stage. Run through check-mission6-earned-victory.mjs.
import { outputPath } from './output-path.mjs'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { deserialize, serialize } from 'node:v8'
import { createGameStore } from '../../../app/game-store.ts'
import { setSelection, placeBuilding, tick } from '../../../app/model.ts'
const store = createGameStore()
store.startMission(6)
const w = store.getWorld()
Object.assign(
  w,
  structuredClone(deserialize(readFileSync(outputPath('army-followers-terminal.v8'))))
)
const army = world => world.units.filter(u => u.kind === 'warrior' && u.team === 'blue' && u.hp > 0)
const snap = () => ({
  turn: w.turn,
  status: w.status,
  army: army(w).map(u => ({
    id: u.id,
    hp: u.hp,
    x: u.x,
    z: u.z,
    team: u.team,
    fight: u.fight && { opponent: u.fight.opponent, action: u.fight.action },
  })),
  shamans: w.units
    .filter(u => u.kind === 'shaman')
    .map(u => ({ id: u.id, team: u.team, hp: u.hp, x: u.x, z: u.z })),
  population: Object.fromEntries(
    ['blue', 'yellow', 'green'].map(team => [
      team,
      w.units.filter(u => u.team === team && u.hp > 0).length,
    ])
  ),
  yellowBuildings: w.buildings
    .filter(b => b.team === 'yellow')
    .map(b => ({ id: b.id, hp: b.hp, progress: b.progress })),
  reincarnation: w.effects
    .filter(e => e.reincarnation)
    .map(e => ({ team: e.reincarnation.team, phase: e.reincarnation.phase, age: e.age })),
})
await store.saveCheckpoint()
assert.ok(store.loadCheckpoint())
const replay = store.getWorld()
assert.deepEqual(replay, w)
function step() {
  tick(w, 1 / 12)
  tick(replay, 1 / 12)
  assert.deepEqual(replay, w)
}
console.log(JSON.stringify({ event: 'recovered ordinary army', ...snap() }))
for (const [x, z] of [
  [61, -53],
  [61, -65],
  [41, -55],
]) {
  for (const world of [w, replay]) {
    setSelection(
      world,
      world.units.filter(u => u.team === 'blue' && u.kind === 'brave' && u.hp > 0).map(u => u.id)
    )
    assert.ok(placeBuilding(world, 'hut', { x, z }))
  }
  assert.deepEqual(replay, w)
  const hut = w.buildings.findLast(b => b.team === 'blue' && b.kind === 'hut')
  console.log(
    JSON.stringify({ event: 'public reinforcement hut plan', id: hut.id, x, z, ...snap() })
  )
  for (let i = 0; i < 4500 && hut.progress < 1 && w.status === 'playing'; i++) {
    step()
    if (i % 600 === 0)
      console.log(
        JSON.stringify({
          event: 'ordinary hut construction',
          id: hut.id,
          progress: hut.progress,
          ...snap(),
        })
      )
  }
  console.log(
    JSON.stringify({ event: 'hut frontier', id: hut.id, progress: hut.progress, ...snap() })
  )
  writeFileSync(outputPath('economy-progress.v8'), serialize(w))
  if (hut.progress < 1) break
  for (let i = 0; i < 300 && w.units.some(u => u.team === 'blue' && u.builder); i++) step()
}
console.log(JSON.stringify({ event: 'ordinary reinforcement economy frontier', ...snap() }))
writeFileSync(outputPath('economy-terminal.v8'), serialize(w))
