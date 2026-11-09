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
  structuredClone(deserialize(readFileSync(outputPath('recovery-cleanup-terminal.v8'))))
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

const move = (ids, p) => {
  for (const world of [w, replay]) {
    setSelection(world, ids)
    assert.ok(command(world, p))
  }
}
let targetId = null,
  lastCast = -100
const assigned = new Set()
for (let i = 0; i < 2000 && w.status === 'playing'; i++) {
  let target =
    w.buildings.find(b => b.id === targetId && b.team === 'green') ??
    w.units.find(u => u.id === targetId && u.team === 'green')
  if (!target) {
    const sh = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    const dist = p => {
      let dx = Math.abs(p.x - (sh?.x ?? -49)),
        dz = Math.abs(p.z - (sh?.z ?? 97))
      return Math.min(dx, 256 - dx) ** 2 + Math.min(dz, 256 - dz) ** 2
    }
    target =
      w.buildings.find(b => b.team === 'green') ??
      w.units
        .filter(u => u.team === 'green' && u.kind !== 'shaman')
        .sort((a, b) => dist(a) - dist(b))[0] ??
      w.units.find(u => u.team === 'green')
    targetId = target?.id
    assigned.clear()
  }
  if (target) {
    for (const u of w.units.filter(u => u.team === 'blue' && u.kind === 'warrior'))
      if (!assigned.has(u.id) || i % 200 === 0) {
        move([u.id], { id: target.id, x: target.x, z: target.z })
        assigned.add(u.id)
      }
    if (i % 200 === 0) {
      const sh = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
      if (sh && !sh.casting) move([sh.id], { x: target.x - 6, z: target.z })
    }
  }
  const enemy = w.units.find(u => u.team === 'green' && u.kind === 'shaman')
  if (w.turn - lastCast > 48) {
    let spell = null,
      p = null
    if (enemy && w.shots.lightning > 0 && !spellTargetError(w, 'lightning', enemy)) {
      spell = 'lightning'
      p = enemy
    } else if (
      target?.kind === 'warrior' &&
      w.shots.lightning > 0 &&
      !spellTargetError(w, 'lightning', target)
    ) {
      spell = 'lightning'
      p = target
    } else if (target && w.shots.blast > 0 && !spellTargetError(w, 'blast', target)) {
      spell = 'blast'
      p = target
    }
    if (spell) {
      for (const world of [w, replay]) assert.ok(cast(world, spell, { x: p.x, z: p.z }))
      lastCast = w.turn
      console.log(
        JSON.stringify({ event: 'public earned spell', spell, target: p.id, turn: w.turn })
      )
    }
  }
  tick(w, 1 / 12)
  tick(replay, 1 / 12)
  assert.deepEqual(w, replay)
  if (i % 200 === 199) {
    writeFileSync(outputPath('recovery-pursuit-progress.v8'), serialize(w))
    console.log(
      JSON.stringify({
        ...snap(),
        green: w.units
          .filter(u => u.team === 'green')
          .map(({ id, hp, kind, x, z }) => ({ id, hp, kind, x, z })),
      })
    )
  }
}
writeFileSync(outputPath('recovery-pursuit-terminal.v8'), serialize(w))
console.log(JSON.stringify({ event: 'frontier', ...snap() }))
