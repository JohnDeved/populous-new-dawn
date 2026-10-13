// Earned Mission 6 acceptance stage. Run through check-mission6-earned-victory.mjs.
import { outputPath } from './output-path.mjs'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { deserialize, serialize } from 'node:v8'
import { createGameStore } from '../../../app/game-store.ts'
import { command, setSelection, cast, tick, spellTargetError } from '../../../app/model.ts'
const store = createGameStore()
store.startMission(6)
const w = store.getWorld()
Object.assign(
  w,
  structuredClone(deserialize(readFileSync(outputPath('recovery-raid-terminal.v8'))))
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

const shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
const move = (ids, p) => {
  for (const world of [w, replay]) {
    setSelection(world, ids)
    assert.ok(command(world, p))
  }
}
move([shaman.id], { x: -53, z: -121 })
let firestorm = false,
  lastLightning = -100,
  lastMove = -100
for (let i = 0; i < 1600 && w.status === 'playing'; i++) {
  const enemy = w.units.find(u => u.team === 'green' && u.kind === 'shaman')
  if (
    enemy &&
    w.shots.lightning > 0 &&
    w.turn - lastLightning > 60 &&
    !spellTargetError(w, 'lightning', enemy)
  ) {
    for (const world of [w, replay]) assert.ok(cast(world, 'lightning', { x: enemy.x, z: enemy.z }))
    lastLightning = w.turn
    console.log(
      JSON.stringify({ event: 'public earned Lightning', target: enemy.id, turn: w.turn })
    )
  } else if (
    !firestorm &&
    w.shots.firestorm > 0 &&
    !spellTargetError(w, 'firestorm', { x: -57, z: 117 })
  ) {
    for (const world of [w, replay]) assert.ok(cast(world, 'firestorm', { x: -57, z: 117 }))
    firestorm = true
    console.log(JSON.stringify({ event: 'public earned Firestorm', turn: w.turn }))
  }
  if (!enemy && w.turn - lastMove > 200 && !shaman.casting) {
    move([shaman.id], { x: -57, z: 123 })
    lastMove = w.turn
  }
  if (i % 200 === 0) {
    const targets = w.buildings.filter(b => b.team === 'green')
    const b =
      targets.find(b => b.kind === 'camp') ?? targets.find(b => b.kind === 'hut') ?? targets[0]
    if (b)
      move(
        w.units.filter(u => u.team === 'blue' && u.kind === 'warrior').map(u => u.id),
        { id: b.id, x: b.x, z: b.z }
      )
  }
  tick(w, 1 / 12)
  tick(replay, 1 / 12)
  assert.deepEqual(w, replay)
  if (i % 100 === 99) {
    writeFileSync(outputPath('recovery-spells-progress.v8'), serialize(w))
    console.log(JSON.stringify(snap()))
  }
}
writeFileSync(outputPath('recovery-spells-terminal.v8'), serialize(w))
console.log(JSON.stringify({ event: 'frontier', ...snap() }))
