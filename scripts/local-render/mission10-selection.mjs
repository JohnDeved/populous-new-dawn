import assert from 'node:assert/strict'

// Independent witness oracle from retained 0043e8e0 (0x48/0x53/0x72/0x7d),
// 00451720/004518c0 and 004e3430. Do not call the implementation under test.
export const mission10OwnedIds = [63, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123]
const models = [7, 3, 3, 3, 3, 4, 4, 4, 4, 2, 2, 2, 2, 2]
export const mission10Controls = ['Select warrior', 'Select follower']
export const mission10Modifiers = ['single', 'Control', 'Shift']
const priorities = [0, 2, 4, 3, 1, 5, 6]
const integer = (n, min, max) => Number.isInteger(n) && n >= min && n <= max

// Compact the complete ordered living Blue roster; this particular authored
// witness fails closed on loss, conversion, birth or reordering. Full other-tribe
// and controller records remain in the raw pre/post observations.
export function mission10SelectionQuery(state) {
  assert.equal(state.paused, true)
  assert.deepEqual(state.selected, [])
  const people = state.people.filter(p => p.team === 'blue' && p.hp > 0)
  assert.deepEqual(people.map(p => p.id), mission10OwnedIds, 'Complete authored Blue roster changed')
  assert.deepEqual(people.map(p => p.model), models, 'Authored Blue classes changed')
  assert.ok(people.every(p => Number.isFinite(p.hp)))
  const boat = state.vehicles.find(v => v.id === 62)
  assert.ok(boat?.active && boat.model === 1)
  assert.ok(state.vehicles.every(v => v.id === 62 || !people.some(p => p.vehicle === v.id)), 'Unexpected occupied craft')
  const slots = Array.from({ length: 5 }, (_, i) => boat.passengers[i] ?? 0)
  assert.ok(slots.every(id => !id || people.some(p => p.id === id)), 'Unexpected crew ownership')
  const query = { point: [state.point.x, state.point.y], nearby: state.nearby,
    boat: [boat.passengerCount, ...slots],
    // Exact native query bits, not rounded distance rankings. Raw records retain
    // the unmasked assignment/flags and full health/controller observations.
    people: people.map(p => [p.id, p.model, p.x & 65535, p.y & 65535, (p.assignment >>> 12) & 7, p.flags4 & 0x880, p.vehicle]) }
  validateMission10Query(query)
  return query
}
export function validateMission10Query(q) {
  assert.ok(q && Array.isArray(q.point) && q.point.length === 2 && q.point.every(n => integer(n, -32768, 65535)), 'Mission 10 camera missing')
  assert.equal(typeof q.nearby, 'boolean')
  assert.ok(Array.isArray(q.boat) && q.boat.length === 6 && q.boat.every(n => integer(n, 0, 65535)))
  assert.equal(q.boat[0], q.boat.slice(1).filter(Boolean).length)
  assert.ok(new Set(q.boat.slice(1).filter(Boolean)).size === q.boat[0])
  assert.ok(Array.isArray(q.people) && q.people.length === mission10OwnedIds.length)
  for (const [i, p] of q.people.entries()) {
    assert.ok(Array.isArray(p) && p.length === 7 && p.every(n => integer(n, 0, 65535)))
    assert.equal(p[0], mission10OwnedIds[i]); assert.equal(p[1], models[i])
    assert.ok(p[4] <= 7 && !(p[5] & ~0x880) && [0, 62].includes(p[6]))
    assert.equal(q.boat.slice(1).includes(p[0]), p[6] === 62, 'Mission 10 crew/owner differs')
  }
}
export function mission10ExpectedSelection(q, name, modifier) {
  validateMission10Query(q)
  assert.ok(mission10Controls.includes(name) && mission10Modifiers.includes(modifier))
  const model = name === 'Select warrior' ? 3 : 0, selected = new Set(), primary = []
  const center = q.point.map(value => (value & 0xfe00) + 256)
  const squared = p => {
    const dx = ((center[0] - p[2]) << 16) >> 16, dy = ((center[1] - p[3]) << 16) >> 16
    return (dx * dx + dy * dy) >>> 0
  }
  const acquire = p => {
    primary.push(p[0]); selected.add(p[0])
    if (p[6] === 62 && q.boat[0]) for (const id of q.boat.slice(1)) if (id) selected.add(id)
  }
  if (modifier === 'Shift') {
    for (const p of q.people) if ((model ? p[1] === model : p[1] !== 7) && !(p[5] & 128) &&
      (!q.nearby || p[1] === 7 || squared(p) < 0x2400000)) acquire(p)
  } else {
    for (let iteration = 0; iteration < (modifier === 'Control' ? 5 : 1); iteration++) {
      const eligible = q.people.filter(p => !(p[5] & 0x880) && (!model || p[1] === model) && !selected.has(p[0]))
      let next
      for (const priority of priorities) {
        const ranked = eligible.filter(p => p[1] !== 7 && p[4] === priority && Math.floor(Math.sqrt(squared(p))) < 6144)
        // Stable sort retains the original ordered roster on truncated ties.
        ranked.sort((a, b) => Math.floor(Math.sqrt(squared(a))) - Math.floor(Math.sqrt(squared(b))))
        if (ranked.length) { next = ranked[0]; break }
      }
      if (!next && !q.nearby) next = eligible.sort((a, b) => Math.floor(Math.sqrt(squared(a))) - Math.floor(Math.sqrt(squared(b))))[0]
      if (!next) break
      acquire(next)
    }
  }
  return { selected: [...selected].sort((a, b) => a - b), primary }
}
// Lossless fixed-width encoding of the seven exact query integers. The readable
// raw report keeps all named source facts. Canonical base64/length rejects junk.
export function encodeMission10Query(q) {
  validateMission10Query(q)
  const bytes = Buffer.alloc(q.people.length * 12)
  for (const [i, p] of q.people.entries()) {
    const at = i * 12
    bytes.writeUInt16LE(p[0], at); bytes.writeUInt8(p[1], at + 2)
    bytes.writeUInt16LE(p[2], at + 3); bytes.writeUInt16LE(p[3], at + 5)
    bytes.writeUInt8(p[4], at + 7); bytes.writeUInt16LE(p[5], at + 8); bytes.writeUInt16LE(p[6], at + 10)
  }
  return [q.point, q.nearby, q.boat, bytes.toString('base64')]
}
export function decodeMission10Query(tuple) {
  assert.ok(Array.isArray(tuple) && tuple.length === 4 && typeof tuple[3] === 'string')
  const bytes = Buffer.from(tuple[3], 'base64')
  assert.equal(bytes.length, mission10OwnedIds.length * 12); assert.equal(bytes.toString('base64'), tuple[3])
  const q = { point: tuple[0], nearby: tuple[1], boat: tuple[2],
    people: mission10OwnedIds.map((_, i) => { const at = i * 12; return [bytes.readUInt16LE(at), bytes.readUInt8(at + 2),
      bytes.readUInt16LE(at + 3), bytes.readUInt16LE(at + 5), bytes.readUInt8(at + 7), bytes.readUInt16LE(at + 8), bytes.readUInt16LE(at + 10)] }) }
  validateMission10Query(q); return q
}
export function mission10SelectionPreserved(before, after) {
  // Escape/selection may only change their documented selected/work bits. Every
  // other captured person, controller, ownership, camera and craft fact is exact.
  const stable = value => {
    const copy = structuredClone(value); delete copy.selected
    for (const person of copy.people) for (const owner of Object.values(person.owners ?? {})) if (owner) {
      if (owner.flags3 !== undefined) owner.flags3 = (owner.flags3 & ~0x10000080) >>> 0
      if (owner.selectionFlags !== undefined) owner.selectionFlags &= ~128
    }
    return copy
  }
  assert.deepEqual(stable(after), stable(before), 'Mission 10 selection changed roster/controller/ownership')
}
