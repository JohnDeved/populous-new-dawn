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
Object.assign(w, structuredClone(deserialize(readFileSync(outputPath('army-shaman-terminal.v8')))))
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
function issue(target) {
  for (const world of [w, replay]) {
    setSelection(
      world,
      army(world).map(u => u.id)
    )
    assert.ok(command(world, { x: target.x, z: target.z, id: target.id }))
  }
  assert.deepEqual(replay, w)
}
console.log(JSON.stringify({ event: 'recovered ordinary army', ...snap() }))
const wrap = v => ((((v + 128) % 256) + 256) % 256) - 128
let targetCount = 0
while (
  w.turn < 10000 &&
  army(w).length &&
  w.status === 'playing' &&
  w.units.some(u => u.team === 'yellow' && u.hp > 0)
) {
  const anchor = army(w)[0]
  const enemies = w.units.filter(u => u.team === 'yellow' && u.hp > 0 && u.inside === null)
  const enemy = enemies.sort(
    (a, b) =>
      Math.hypot(wrap(a.x - anchor.x), wrap(a.z - anchor.z)) -
      Math.hypot(wrap(b.x - anchor.x), wrap(b.z - anchor.z))
  )[0]
  const buildings = w.buildings.filter(b => b.team === 'yellow' && b.hp > 0)
  const target =
    enemy ??
    buildings.sort(
      (a, b) =>
        Math.hypot(wrap(a.x - anchor.x), wrap(a.z - anchor.z)) -
        Math.hypot(wrap(b.x - anchor.x), wrap(b.z - anchor.z))
    )[0]
  if (!target) break
  issue(target)
  console.log(
    JSON.stringify({
      event: 'public nearest enemy attack',
      target: { id: target.id, kind: target.kind, x: target.x, z: target.z },
      ...snap(),
    })
  )
  const start = w.turn
  while (
    w.turn < start + 1600 &&
    (w.units.includes(target) || w.buildings.includes(target)) &&
    target.hp > 0 &&
    army(w).length &&
    w.status === 'playing'
  ) {
    step()
    if ((w.turn - start) % 400 === 0)
      console.log(
        JSON.stringify({ event: 'actual follower engagement', target: target.id, ...snap() })
      )
  }
  console.log(JSON.stringify({ event: 'follower attack frontier', target: target.id, ...snap() }))
  writeFileSync(outputPath('army-followers-progress.v8'), serialize(w))
  if (target.hp > 0 && (w.units.includes(target) || w.buildings.includes(target))) break
  if (++targetCount > 60) break
}
console.log(JSON.stringify({ event: 'ordinary follower frontier', ...snap() }))
writeFileSync(outputPath('army-followers-terminal.v8'), serialize(w))
