import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import vectors from './fixtures/shaman-guard-native.json' with { type: 'json' }
import { guardShamanOrders } from '../app/shaman-guard.ts'
import { emptyPersonOrder } from '../app/person-orders.ts'
import { stepShamanGuard } from '../app/live-movement.ts'

const digest = bytes => createHash('sha256').update(bytes).digest('hex')
function poolBytes(records, semantic = false) {
  const bytes = Buffer.alloc(8000)
  records.forEach((r, i) => {
    bytes.writeUInt8(r.model, i * 10); bytes.writeUInt8(r.flags, i * 10 + 1)
    for (const [j, value] of [r.references, r.object, r.a, semantic && r.model === 30 ? 0 : r.b].entries()) bytes.writeUInt16LE(value, i * 10 + 2 + j * 2)
  })
  return bytes
}
const aliases = { status: 'commandStatus', selection: 'selectionFlags', immediate: 'immediateCommand', source: 'object' }
const person = p => ({
  ...structuredClone(p), x: 4096, y: 4096, substate: 0, flags3: 0x40000, flags4: 0,
  assignment: 0, commandCursor: 0, orderLocation: 0, workTarget: 0,
  ...Object.fromEntries(Object.entries(aliases).map(([a, b]) => [b, p[a]])),
})
const project = (p, template) => Object.fromEntries(Object.keys(template).map(k => [k, p[aliases[k] ?? k]]))

for (const c of vectors.producer) for (const s of c.steps) test(`native G producer: ${c.label} / ${s.label}`, () => {
  const records = Array.from({ length: 800 }, (_, i) => ({ ...emptyPersonOrder(), ...(c.filledPool && i ? { model: 3, references: 1, a: 4096, b: 4096 } : {}) }))
  for (const [id, record] of Object.entries(s.before.records)) records[Number(id)] = structuredClone(record)
  assert.equal(digest(poolBytes(records)), s.before.poolSha256, 'reconstructed supplied native pool is byte-exact')
  const pool = { records, cursor: s.before.poolCursor, active: s.before.poolActive }, people = s.before.people.map(person)
  const shaman = s.before.shamanPointer === '00000000' ? null : s.before.shamanPointer === '02000800' ? 74 : 73
  let guards = s.before.guardCount, anchors = 0, releases = 0
  const unexpected = () => assert.fail('unexpected producer consumer')
  const changed = guardShamanOrders(pool, people, shaman, {
    prepare: unexpected, stopWork: unexpected, deleteObject: unexpected, releaseFight: unexpected,
    releaseSpell: () => { releases++; guards = Math.max(0, guards - 1) },
  }, () => { anchors++ })
  assert.deepEqual(people.map((p, i) => project(p, s.before.people[i])), s.after.people)
  assert.equal(pool.cursor, s.after.poolCursor); assert.equal(pool.active, s.after.poolActive)
  assert.equal(guards, s.after.guardCount)
  assert.equal(anchors, s.calls.filter(n => n === 'cancel-anchor').length)
  assert.equal(changed.length, s.calls.filter(n => n === 'clear').length)
  assert.equal(releases, s.before.people.filter(p => changed.some(a => a.id === p.id)).reduce((n, p) => n + p.commands.filter(id => id && s.before.records[id]?.model === 30).length + Number(p.immediate && s.before.records[p.immediate]?.model === 30), 0))
  const expected = Array.from({ length: 800 }, (_, i) => ({ ...emptyPersonOrder(), ...(c.filledPool && i ? { model: 3, references: 1, a: 4096, b: 4096 } : {}) }))
  for (const [id, record] of Object.entries(s.after.records)) expected[Number(id)] = structuredClone(record)
  assert.equal(digest(poolBytes(expected)), s.after.poolSha256, 'retained expected pool is byte-exact before semantic projection')
  assert.deepEqual(poolBytes(records, true), poolBytes(expected, true), 'all pool bytes except unused command30 b')
})

for (const c of vectors.distances) test(`native Guard distance: ${c.label}`, () => {
  const p = { x: c.person[0], y: c.person[1], goalX: c.goal[0], goalY: c.goal[1], counter: 0, substate: 1, flags2: 0x2000000, assignment: 8, speed: 1 }
  let destination = false
  assert.equal(stepShamanGuard(p, { x: c.target[0], y: c.target[1] }, { recover: () => assert.fail('unexpected recovery'), destination: () => { destination = true } }), 0)
  assert.deepEqual({ pursuit: !!(p.flags2 & 0x2000000), formation: !!(p.assignment & 8), destination }, c.native)
})
