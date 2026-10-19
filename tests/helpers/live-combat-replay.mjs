import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createWorld } from '../../app/world-initialization.ts'
import { addUnit } from '../../app/world-state.ts'
import { tick } from '../../app/world-turn.ts'
import { command } from '../../app/live-command.ts'
import { migrateCheckpoint } from '../../app/game-store.ts'

// V8 serialization bytes depend on incidental object representations (e.g.
// integer/double fields), even when deserialized worlds are deeply equal. Encode
// every enumerable state field, collection order, typed value and object alias
// deterministically instead; do not whitelist or omit simulation fields.
function hash(world) {
  const seen = new Map()
  const encode = value => {
    if (value === undefined) return ['undefined']
    if (typeof value === 'number' && !Number.isFinite(value)) return ['number', String(value)]
    if (Object.is(value, -0)) return ['number', '-0']
    if (value === null || typeof value !== 'object') return value
    if (seen.has(value)) return ['ref', seen.get(value)]
    const id = seen.size
    seen.set(value, id)
    if (ArrayBuffer.isView(value)) return ['view', id, value.constructor.name,
      Buffer.from(value.buffer, value.byteOffset, value.byteLength).toString('base64')]
    if (value instanceof ArrayBuffer) return ['buffer', id, Buffer.from(value).toString('base64')]
    if (value instanceof Map) return ['map', id, [...value].map(([k, v]) => [encode(k), encode(v)])]
    if (value instanceof Set) return ['set', id, [...value].map(encode)]
    if (Array.isArray(value)) return ['array', id, Array.from({ length: value.length }, (_, i) =>
      i in value ? encode(value[i]) : ['hole'])]
    return ['object', id, Object.keys(value).sort().map(key => [key, encode(value[key])])]
  }
  return createHash('sha256').update(JSON.stringify(encode(world))).digest('hex')
}
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
