import { semanticWorldGraph } from './semantic-world-graph.mjs'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createWorld } from '../../app/world-initialization.ts'
import { addUnit } from '../../app/world-state.ts'
import { tick } from '../../app/world-turn.ts'
import { command } from '../../app/live-command.ts'
import { migrateCheckpoint } from '../../app/game-store.ts'

// Do not whitelist simulation fields or omit aliases to make replay pass.
const hash = world => createHash('sha256').update(JSON.stringify(semanticWorldGraph(world))).digest('hex')
const traces = []
for (const mission of [1, 5, 22]) {
  let w = createWorld(mission)
  const states = []
  for (let turn = 0; turn < 36; turn++) {
    tick(w, 1 / 12)
    if (turn === 17) w = migrateCheckpoint(structuredClone(w))
    states.push(hash(w))
  }
  traces.push({ mission, states, units: w.units.length })
}
// Real simultaneous hostile movement, automatic scans, encounters, reservations,
// damage and death. Different destinations prevent a decorative/frozen workload.
let w = createWorld(1)
w.units = []; w.fights = []; w.buildings = []
w.terrain.fill(3); w.terrainVersion++
tick(w, 1 / 12)
w.land.flags.fill(0); w.land.buildingIds.fill(0); w.land.owners.fill(0)
for (let i = 0; i < 6; i++) {
  const a = addUnit(w, 'blue', 'warrior', { x: -2, z: i / 4 })
  const b = addUnit(w, 'red', i % 2 ? 'warrior' : 'brave', { x: 2, z: i / 4 })
  w.selected = [a.id]; command(w, { x: 3, z: i / 4 })
  w.selected = [b.id]; command(w, { x: -3, z: i / 4 })
}
w.selected = []
const start = w.units.map(u => ({ id: u.id, x: u.x, z: u.z, hp: u.hp }))
const states = []
let fights = 0, damaged = false, moved = false
for (let turn = 0; turn < 96; turn++) {
  tick(w, 1 / 12)
  fights = Math.max(fights, w.fights.length)
  damaged ||= start.some(old => !w.units.some(u => u.id === old.id && u.hp >= old.hp))
  moved ||= start.some(old => w.units.some(u => u.id === old.id && (u.x !== old.x || u.z !== old.z)))
  if (turn === 47) w = migrateCheckpoint(structuredClone(w))
  states.push(hash(w))
}
assert.ok(moved, 'hostile workload must actually move')
assert.ok(fights, 'hostile workload must create real fights')
assert.ok(damaged, 'hostile workload must cause real damage')
traces.push({ scenario: 'hostile-front', states, moved, fights, damaged, units: w.units.length })
process.stdout.write(JSON.stringify(traces))
