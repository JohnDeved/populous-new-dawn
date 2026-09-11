import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { cpus } from 'node:os'
import { createWorld, addUnit, addBuilding, command, tick, GRID } from '../app/model.ts'

import { dismantleBuilding } from '../app/live-building-entry.ts'

const blocked = process.argv.includes('--blocked'), dismantling = process.argv.includes('--dismantle'), samples = []
assert.ok(!(blocked && dismantling), 'Choose one scenario')
let checksum
for (let pass = 0; pass < 5; pass++) {
  const w = createWorld()
  Object.assign(w, { units: [], buildings: [], trees: [], shrines: [] })
  w.manaWorld.gameFlags = 96
  w.terrain.fill(blocked ? 0 : 3)
  if (blocked) for (let z = -9; z <= 9; z++) for (let x = -29; x <= 29; x++)
    if (x <= -10 || x >= 10) w.terrain[(z + 48) * GRID + x + 48] = 3
  w.terrainVersion++
  const hut = addBuilding(w, dismantling ? 'blue' : 'red', 'hut', { x: blocked ? 20 : 0, z: 0 })
  for (let i = 0; i < 200; i++) addUnit(w, 'blue', dismantling ? 'brave' : 'warrior', blocked ? { x: -20 + i % 20 / 5, z: Math.floor(i / 20) / 5 } : { x: i % 20 / 5, z: 20 + Math.floor(i / 20) / 5 })
  w.selected = w.units.map(u => u.id)
  if (dismantling) { w.inputMask = 0; dismantleBuilding(w, hut) }
  const start = performance.now()
  if (dismantling) command(w, { x: 0, z: 12 }, { ctrlKey: true })
  command(w, hut, { ctrlKey: true })
  command(w, blocked ? { x: 20, z: 6 } : { x: 16, z: 12 })
  const inputMs = performance.now() - start, turns = []
  for (let i = 0; i < 600; i++) {
    if (blocked && i === 120) {
      assert.ok(w.units.every(u => u.native?.state === 33))
      w.terrain.fill(3); w.terrainVersion++
    }
    const start = performance.now()
    tick(w, 1 / 12)
    turns.push(performance.now() - start)
  }
  assert.equal(hut.hp, 0)
  assert.ok(w.units.every(u => u.hp > 0))
  const result = JSON.stringify(w.units.map(u => [u.id, u.x, u.z, u.native?.commands]))
  if (checksum !== undefined) assert.equal(result, checksum)
  checksum = result
  const sorted = turns.toSorted((a, b) => a - b)
  samples.push({ inputMs, medianTurnMs: sorted[300], p95TurnMs: sorted[570], maxTurnMs: sorted[599], turns, remainingOrders: w.buildingOrders.active })
}
const report = { dismantling, runtime: process.version, cpu: cpus()[0].model, blocked, units: 200, samples,
  limits: 'Five deterministic 600-turn replays of 200 followers approaching one hut and continuing to a waypoint. Blocked mode connects two islands at turn 120. Dismantling mode queues ground/work/ground for 200 braves. Includes live simulation, command input and target scans; no rendering. First replay includes JIT warmup. Dense arrival crowd remains subject to native route/retry limits. No hardware FPS or before/after speedup claim.' }
writeFileSync(`references/performance/2026-09-11-${blocked ? 'route-recovery' : dismantling ? 'queued-dismantling' : 'area-attack'}-cpu.json`, JSON.stringify(report, null, 2) + '\n')
console.log(samples.map(({ turns, ...summary }) => summary))
