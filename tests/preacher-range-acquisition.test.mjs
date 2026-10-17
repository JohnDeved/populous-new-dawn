import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorldState, addUnit } from '../app/world-state.ts'
import { browserPosition, nativePosition } from '../app/model.ts'
import { createLivePerson } from '../app/live-people.ts'
import { stepLivePreaching } from '../app/live-movement.ts'
import { inPreachingRange, conversionDelay } from '../app/preacher-conversion.ts'
import { nativeAngle } from '../app/native-math.ts'

function setup(radius = 3, x = 256, y = 256) {
  const w = createWorldState(3)
  w.units = []; w.buildings = []; w.fights = []
  w.land.heights.fill(155); w.land.flags.fill(0); w.land.categories.fill(0)
  w.land.buildingIds.fill(0); w.landVersion = w.terrainVersion
  w.outcome.alliances.fill(0); w.levelFlags2 = 0
  const preacher = addUnit(w, 'blue', 'preacher', browserPosition({ x, y }))
  const p = preacher.native = createLivePerson(w, preacher)
  Object.assign(p, { substate: 2, counter: 1, commandAux: radius, commandStatus: 17,
    timer: 100, commands: [1, 0, 0, 0, 0, 0, 0, 0], goalX: x, goalY: y })
  Object.assign(w.buildingOrders.records[1], { model: 17, references: 1, a: x, b: y })
  w.buildingOrders.active = 1; w.buildingOrders.cursor = 2
  w.randomState = 12345678
  return { w, preacher, p }
}
function victim(s, x, y, owner) {
  const u = addUnit(s.w, 'red', 'brave', browserPosition({ x, y }))
  if (owner) {
    const p = createLivePerson(s.w, u)
    if (owner === 'native') u.native = p
    if (owner === 'entry') u.entry = { person: p }
    if (owner === 'fight') u.fight = { motion: p, group: 0 }
    // Browser coordinates must not replace retained-owner coordinates.
    u.x += 64; u.z += 64
  }
  return u
}

for (const radius of [0, 1, 2, 3, 4, 5]) {
  for (const owner of [undefined, 'native', 'entry', 'fight']) {
    test(`live acquisition preserves cell boundaries, wrapping and ${owner ?? 'unowned'} coordinates at range ${radius}`, () => {
      const s = setup(radius), { w, preacher, p } = s
      const points = [[-1, 256], [511, 511], [512, 256], [1023, 256], [1024, 256],
        [1535, 1535], [1536, 256], [65536 + 256, -65536 + 256], [-513, -513]]
      const targets = points.map(([x, y]) => victim(s, x, y, owner))
      const records = targets.map(u => u.native ?? u.entry?.person ?? u.fight?.motion)
      const expected = points.map(([x, y]) => inPreachingRange(p, { x: x & 65535, y: y & 65535 }, radius))
      const rng = { randomState: w.randomState, loadFlags: w.manaWorld.loadFlags }
      const delays = expected.map(yes => yes ? conversionDelay(rng) : undefined)
      stepLivePreaching(w, preacher)
      assert.equal(w.randomState, rng.randomState)
      assert.deepEqual(w.units.slice(1), targets, 'scan does not reorder units')
      targets.forEach((u, i) => {
        assert.equal(u.native?.state === 23, expected[i], `candidate ${i}`)
        if (expected[i]) {
          assert.equal(u.native.workTarget, p.id)
          assert.equal(u.native.timer, delays[i])
          if (owner) assert.equal(u.native, records[i], 'adopt the exact retained owner')
          assert.equal(w.objectCells.objects.get(u.id), u.native)
        } else if (!owner) assert.equal(u.native, null, 'no out-of-range adoption')
      })
      const first = targets.find((_, i) => expected[i])?.native
      if (first && expected.filter(Boolean).length <= 4)
        assert.equal(p.turnAngle, nativeAngle(((first.x - p.x) << 16) >> 16, -(((first.y - p.y) << 16) >> 16)))
    })
  }
}

test('excluded candidates and owner precedence do not consume conversion RNG', () => {
  const s = setup(), { w, preacher } = s
  const dead = victim(s, 256, 256); dead.hp = 0
  const inside = victim(s, 256, 256); inside.inside = 99
  const flying = victim(s, 256, 256); flying.flight = createLivePerson(w, flying)
  const precedence = victim(s, 256, 256, 'native')
  precedence.entry = { person: { ...precedence.native, x: 256, y: 256 } }
  precedence.fight = { motion: precedence.entry.person, group: 0 }
  precedence.native.x = 8192
  const seed = w.randomState
  stepLivePreaching(w, preacher)
  assert.equal(w.randomState, seed)
  for (const u of [dead, inside, flying, precedence]) assert.notEqual(u.native?.state, 23)
})

test('out-of-range unowned candidates avoid full person construction but still synchronize terrain', () => {
  const s = setup(), { w, preacher } = s
  const far = victim(s, 8192, 8192)
  let selections = 0
  const includes = w.selected.includes
  w.selected.includes = function (id) { if (id === far.id) selections++; return includes.call(this, id) }
  w.terrainVersion++
  const seed = w.randomState
  stepLivePreaching(w, preacher)
  assert.equal(w.landVersion, w.terrainVersion)
  assert.equal(far.native, null)
  assert.equal(w.randomState, seed)
  assert.equal(selections, 0, 'rejected candidates must not allocate a full LivePerson')
})


test('reusing a synchronized position preserves constructor notification order and full world state', () => {
  const { w, preacher } = setup()
  const u = victim({ w }, 256, 256)
  w.terrain[0] += 5
  w.terrainVersion++
  const other = structuredClone(w), otherUnit = other.units.find(v => v.id === u.id)
  const reads = [], otherReads = []
  for (const [world, log] of [[w, reads], [other, otherReads]]) {
    let version = world.landVersion
    Object.defineProperty(world, 'landVersion', {
      configurable: true, enumerable: true,
      get() { log.push('read'); return version },
      set(value) { log.push(['write', value]); version = value },
    })
  }
  const ordinary = createLivePerson(w, u)
  const position = nativePosition(other, otherUnit)
  const reused = createLivePerson(other, otherUnit, position)
  assert.deepEqual(otherReads, reads, 'no second terrain synchronization, including notification queries')
  assert.deepEqual(reused, ordinary)
  assert.deepEqual(other, w)
  assert.equal(w.units[0], preacher)
})

test('rejected scan candidates synchronize terrain after an earlier listener visit', () => {
  const s = setup(), { w, preacher, p } = s
  const listener = victim(s, 256, 256, 'native')
  listener.native.state = 23
  let invalidated = false
  Object.defineProperty(listener.native, 'workTarget', { configurable: true, enumerable: true,
    get() {
      if (!invalidated) {
        invalidated = true
        w.terrainVersion++
        w.terrain.fill(4)
        p.flags2 &= ~4
      }
      return p.id
    },
  })
  const far = victim(s, 8192, 8192)
  let observedSynchronization = false
  const x = far.x
  Object.defineProperty(far, 'x', { configurable: true, enumerable: true,
    get() {
      if (invalidated) {
        assert.equal(w.landVersion, w.terrainVersion, 'sync precedes reading the rejected candidate position')
        observedSynchronization = true
      }
      return x
    },
  })
  stepLivePreaching(w, preacher)
  assert.ok(invalidated && observedSynchronization)
  assert.ok(p.flags2 & 4, 'terrain change still notifies the retained preacher')
  assert.equal(far.native, null)
})
