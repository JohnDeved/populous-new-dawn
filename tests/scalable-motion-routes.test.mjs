import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createMotionRoutes, buildPersonRoute, attachPersonRoute, releasePersonRoute,
  reusablePersonRoute, motionRouteReferences, motionRouteCapacity,
  planPersonDestination, ageFailedRoutes, validateScalableMotionRoutes,
} from '../app/person-routes.ts'

const person = id => ({ id, tribe: 0, vehicle: 0, flags2: 0x2000000, flags3: 0, flags4: 0,
  motionGroup: 0, motionIndex: 0, recoveryCounter: 0, x: 2560, y: 5120,
  goalX: 0, goalY: 0, destinationX: 0, destinationY: 0, turnAngle: 0, turnY: 0 })
const from = { x: 10, y: 20 }, to = { x: 60, y: 80 }
function build(w, p, seed = p.id, fail = false) {
  return buildPersonRoute(w, p, { ...from }, { ...to }, 0, { flags: 0 }, {
    findVehicle() { assert.fail('No vehicle search for tribe without transport') },
    search() {
      if (fail) return 1
      w.pathResult.set([from.x, from.y, 0, 0, to.x, to.y, 0, 0])
      w.pathResult[1032] = 24
      for (let i = 0; i < 24; i++) w.pathResult.set([(seed + i) & 255, (seed * 3 + i) & 255, i === 7 ? 1 : 0, 0], 8 + i * 4)
      return 0
    },
  })
}
function logical(w) {
  const payload = w.records.slice(), counts = []
  for (let id = 0; id < payload.length / 109; id++) {
    counts.push(w.references ? w.references[id] : new DataView(w.records.buffer).getInt16(id * 109, true))
    payload[id * 109] = payload[id * 109 + 1] = 0
  }
  return { payload, counts, active: w.active, last: w.last, cursor: w.cursor,
    failedSearches: w.failedSearches, pathResult: w.pathResult }
}

test('classic-sized traces preserve every route payload byte, logical ownership, cursor and reuse choice', () => {
  const classic = createMotionRoutes(), scalable = createMotionRoutes(true), people = [[], []]
  for (let step = 0; step < 700; step++) {
    for (const [which, w] of [classic, scalable].entries()) {
      const p = person(step + 1), id = build(w, p)
      assert.ok(id)
      attachPersonRoute(w, p, id, step % 7 === 0)
      people[which].push(p)
      if (people[which].length > 200) releasePersonRoute(w, people[which].shift())
      if (step % 9 === 0) {
        const old = people[which][0]
        releasePersonRoute(w, old)
        attachPersonRoute(w, old, id)
      }
    }
    assert.deepEqual(people[1], people[0])
    assert.deepEqual(logical(scalable), logical(classic), `complete payload and logical counts ${step}`)
    assert.equal(reusablePersonRoute(scalable, person(0), from, to), reusablePersonRoute(classic, person(0), from, to))
  }
  for (const w of [classic, scalable]) {
    assert.equal(build(w, person(999), 1, true), 0)
    for (let i = 0; i < 16; i++) ageFailedRoutes(w)
  }
  assert.deepEqual(logical(scalable), logical(classic), 'failed-search cache and allocator advance are unchanged')
})

test('40,000 distinct owned routes grow through signed-word handles and keep all geometry', () => {
  const w = createMotionRoutes(true), people = []
  for (let i = 1; i <= 40_000; i++) {
    const p = person(i), id = build(w, p)
    assert.equal(id, i)
    attachPersonRoute(w, p, id)
    people.push(p)
  }
  assert.equal(w.active, 40_000)
  assert.equal(motionRouteCapacity(w), 51_072)
  assert.equal(w.records.length, w.references.length * 109)
  for (const p of people) {
    const a = p.motionGroup * 109
    assert.equal(motionRouteReferences(w, p.motionGroup), 1)
    assert.deepEqual([...w.records.subarray(a + 4, a + 12)], [10, 20, 0, 0, 60, 80, 0, 0])
    assert.equal(w.records[a + 108], 23)
    assert.equal(w.records[a + 2], 1)
    for (let i = 0; i < 23; i++)
      assert.deepEqual([...w.records.subarray(a + 12 + i * 4, a + 16 + i * 4)], [(p.id + i) & 255, (p.id * 3 + i) & 255, i === 7 ? 1 : 0, 0])
  }
  validateScalableMotionRoutes(w, [...people, ...people])
  const released = people[32_999], id = released.motionGroup
  releasePersonRoute(w, released)
  w.cursor = id - 1
  assert.equal(build(w, released), id, 'reuse exactly the released wide slot')
  attachPersonRoute(w, released, id)
  for (const p of people) releasePersonRoute(w, p)
  assert.equal(w.active, 0)
  assert.ok(w.references.every(n => n === 0))
})

test('wide shared counts release exactly once per real person and preserve reservation flags', () => {
  const w = createMotionRoutes(true), people = Array.from({ length: 40_000 }, (_, i) => person(i + 1))
  const id = build(w, people[0])
  for (const p of people) attachPersonRoute(w, p, id, true)
  assert.equal(motionRouteReferences(w, id), 40_000)
  assert.equal(w.active, 1)
  assert.equal(reusablePersonRoute(w, people[0], from, to), id, 'owner keeps its reserved route')
  assert.equal(reusablePersonRoute(w, person(0), from, to), 0, 'other people cannot reuse reservation')
  validateScalableMotionRoutes(w, people)
  for (const p of people) releasePersonRoute(w, p)
  assert.equal(w.active, 0)
  assert.equal(w.records[id * 109 + 2], 5)
  validateScalableMotionRoutes(w, people)
  // Native reservation preserves payload at zero owners, not a permanent slot lock.
  w.cursor = id - 1
  assert.equal(build(w, people[0]), id)
  attachPersonRoute(w, people[0], id)
  assert.equal(w.records[id * 109 + 2], 1, 'ordinary reattachment clears reservation')
})

test('scalable count and handle failures are explicit and do not alter owner, counters or cursor', () => {
  const w = createMotionRoutes(true), p = person(1)
  for (const id of [-1, 0.5, 400, 65536, NaN, Number.MAX_SAFE_INTEGER]) {
    const before = structuredClone({ w, p })
    assert.throws(() => attachPersonRoute(w, p, id), /handle/)
    assert.deepEqual({ w, p }, before)
  }
  w.references[1] = Number.MAX_SAFE_INTEGER
  w.active = 1
  const before = structuredClone({ w, p })
  assert.throws(() => attachPersonRoute(w, p, 1), /count/)
  assert.deepEqual({ w, p }, before)
  w.references[1] = 0
  p.motionGroup = 1
  const unowned = structuredClone({ w, p })
  assert.throws(() => releasePersonRoute(w, p), /Unowned/)
  assert.deepEqual({ w, p }, unowned)
  w.references[1] = 1
  const owned = structuredClone({ w, p })
  assert.throws(() => attachPersonRoute(w, p, 2), /release prior/)
  assert.deepEqual({ w, p }, owned)
})

test('scalable allocation failure does not publish either replacement array or move cursor', () => {
  const w = createMotionRoutes(true), p = person(1)
  w.references.fill(1, 1, 400)
  w.active = 399
  const before = structuredClone(w), oldRecords = w.records, oldReferences = w.references,
    Original = globalThis.Float64Array
  // Force the second allocation, after the new payload has allocated, to fail.
  globalThis.Float64Array = class extends Original { constructor() { throw new RangeError('injected host allocation failure') } }
  try { assert.throws(() => build(w, p), /injected host allocation failure/) }
  finally { globalThis.Float64Array = Original }
  assert.equal(w.records, oldRecords)
  assert.equal(w.references, oldReferences)
  assert.deepEqual(w, before)
  assert.equal(p.motionGroup, 0)
})

test('planned destination keeps a route handle above 32,767 without narrowing', () => {
  const routes = createMotionRoutes(true)
  // Supplied storage isolates plan/attach handle behavior, not a gameplay-tier claim.
  routes.records = new Uint8Array(40_002 * 109)
  routes.references = new Float64Array(40_002)
  const id = 32_768, p = person(1), land = { flags: new Uint32Array(16384), categories: new Uint8Array(16384), buildingIds: new Uint16Array(16384) }
  routes.records.set([10, 20, 0, 0, 60, 80, 0, 0], id * 109 + 4)
  let advances = 0
  assert.equal(planPersonDestination({ routes, land, vehicles: new Map(), skip: 0,
    checkingPerson: 0, levelFlags2: 0, computerLimit: 0, humanLimit: 0,
    tribes: [{ playerType: 2, requests: 0 }] }, p, { x: 15360, y: 20480 }, {
      outside() { assert.fail() }, buildingBlocks() { assert.fail() }, coastDirection() { return 0 },
      build() { return id }, vehicleReady() { return true }, advance() { advances++ },
    }), id)
  assert.equal(p.motionGroup, id)
  assert.equal(motionRouteReferences(routes, id), 1)
  assert.equal(advances, 1)
})

test('current scalable route validation rejects damaged shape, refs, counts, owners and raw count aliases', () => {
  const valid = createMotionRoutes(true), p = person(1), id = build(valid, p)
  attachPersonRoute(valid, p, id)
  const mutations = [
    w => { delete w.references }, w => { w.references = new Uint16Array(401) },
    w => { w.references = new Float64Array(400) },
    w => { w.references = new Float64Array(w.records.buffer, 0, 401) },
    w => { w.pathResult = w.records.subarray(0, 1033) }, w => { w.records = new Uint8Array(400 * 109) },
    w => { w.references[id] = NaN }, w => { w.references[id] = -1 }, w => { w.references[id] = 2 },
    w => { w.references[0] = 1 }, w => { w.references[400] = 1 }, w => { w.references[id] = Number.MAX_SAFE_INTEGER + 1 },
    w => { w.active = 0 }, w => { w.last = 400 }, w => { w.cursor = 400 },
    w => { w.pathResult = new Uint8Array(1032) }, w => { w.failedSearches = new Uint8Array(79) },
    w => { w.records[id * 109] = 1 }, w => { w.records[id * 109 + 108] = 24 },
  ]
  for (const mutate of mutations) {
    const w = structuredClone(valid); mutate(w)
    const before = structuredClone(w)
    assert.throws(() => validateScalableMotionRoutes(w, [p]), RangeError)
    assert.deepEqual(w, before, 'no inferred sidecar, resizing or repaired ownership')
  }
  for (const motionGroup of [-1, 0.5, 400, NaN])
    assert.throws(() => validateScalableMotionRoutes(valid, [{ ...p, motionGroup }]), RangeError)
  assert.doesNotThrow(() => validateScalableMotionRoutes(valid, [p, p, p]))
  assert.throws(() => validateScalableMotionRoutes(valid, [p, { ...p }]), /ownership/)
})

test('zero adoption preserves native classic bookkeeping but scalable sentinel is never owned', () => {
  for (const scalable of [false, true]) {
    const routes = createMotionRoutes(scalable), p = person(1)
    attachPersonRoute(routes, p, 1)
    releasePersonRoute(routes, p)
    p.motionIndex = 7
    attachPersonRoute(routes, p, 0)
    assert.equal(p.motionGroup, 0)
    assert.equal(p.motionIndex, 0)
    assert.equal(routes.last, 0)
    assert.equal(routes.active, scalable ? 0 : 1)
    assert.equal(scalable ? routes.references[0] : new DataView(routes.records.buffer).getInt16(0, true), scalable ? 0 : 1)
    if (scalable) validateScalableMotionRoutes(routes, [p])
  }
})
