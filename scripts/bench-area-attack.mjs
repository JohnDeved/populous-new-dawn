import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { cpus } from 'node:os'
import { createWorld, addUnit, addBuilding, command, tick } from '../app/model.ts'

const samples = []
let checksum
for (let pass = 0; pass < 5; pass++) {
  const w = createWorld()
  Object.assign(w, { units: [], buildings: [], trees: [], shrines: [] })
  w.manaWorld.gameFlags = 96
  w.terrain.fill(3)
  w.terrainVersion++
  const hut = addBuilding(w, 'red', 'hut', { x: 0, z: 0 })
  for (let i = 0; i < 200; i++) addUnit(w, 'blue', 'warrior', { x: i % 20 / 5, z: 20 + Math.floor(i / 20) / 5 })
  w.selected = w.units.map(u => u.id)
  const start = performance.now()
  command(w, hut, { ctrlKey: true })
  command(w, { x: 16, z: 12 })
  const inputMs = performance.now() - start, turns = []
  for (let i = 0; i < 600; i++) {
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
const report = { runtime: process.version, cpu: cpus()[0].model, units: 200, samples,
  limits: 'Five deterministic 600-turn replays of 200 attackers approaching one hut and continuing to a waypoint. Includes live simulation, input preflight and target scans; no rendering. First replay includes JIT warmup. Dense arrival crowd remains subject to native route/retry limits. No hardware FPS or before/after speedup claim.' }
writeFileSync('references/performance/2026-09-11-area-attack-cpu.json', JSON.stringify(report, null, 2) + '\n')
console.log(samples.map(({ turns, ...summary }) => summary))
