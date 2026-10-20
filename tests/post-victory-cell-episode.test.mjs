import assert from 'node:assert/strict'
import test from 'node:test'
import { addUnit, createWorldState } from '../app/world-state.ts'
import { addBuilding } from '../app/construction-runtime.ts'
import {
  beginLivePersonPass,
  createLivePerson,
  stepLivePerson,
  syncLivePersonCells,
} from '../app/live-people.ts'
import { browserPosition } from '../app/world-coordinates.ts'
import { queueTerrain, updateWalkMasks } from '../app/native-terrain.ts'
import { refreshTerrainSurface, terrainTextures } from '../app/world-terrain-runtime.ts'
import { objectsInCell } from '../app/object-cells.ts'
import { tick } from '../app/world-turn.ts'
import { createWorld } from '../app/world-initialization.ts'
import { vehicleSeat } from '../app/vehicle-seats.ts'

// The reference deliberately calls the public, unconditional full-sync visitor.
// No timing assertions, transform loader, production counters or cached oracle.
function fixture(count = 3, capacity = 'classic') {
  const w = createWorldState(1, capacity)
  w.land.heights.fill(135)
  queueTerrain(w.land, 0, 64, 1, terrainTextures)
  updateWalkMasks(w.land, 0, 64)
  refreshTerrainSurface(w)
  w.land.landFlags |= 0x2000000
  w.status = 'won'
  if (capacity === 'scalable') w.nextId = 65536
  for (let i = 0; i < count; i++) {
    const u = addUnit(w, 'blue', 'warrior', browserPosition({ x: 2816 + i * 32, y: 3840 }))
    u.native = createLivePerson(w, u)
    Object.assign(u.native, {
      state: 41,
      previousState: 41,
      substate: 7,
      flags2: 0,
      counter: 0,
      speed: 0,
      timer: 100,
      commandPhase: 50,
      assignment: 0,
    })
  }
  return w
}
const packed = p => (p.y & 0xfe00) | ((p.x >>> 8) & 254)
const chain = (w, p) => [...objectsInCell(w.objectCells, packed(p))].map(p => p.id)
function parity(w, reference) {
  assert.deepEqual(w, reference)
  for (const u of w.units) {
    const p = u.flight ?? u.fight?.motion ?? u.native ?? u.entry?.person
    if (p && w.objectCells.objects.has(u.id)) assert.equal(w.objectCells.objects.get(u.id), p)
  }
}
function countRosterFilters(w) {
  let count = 0
  Object.defineProperty(w.units, 'filter', {
    configurable: true,
    value(predicate, thisArg) {
      count++
      return Array.prototype.filter.call(this, predicate, thisArg)
    },
  })
  return {
    count: () => count,
    restore: () => {
      delete w.units.filter
    },
  }
}
function visitPair(w, reference, pass, index) {
  pass.next(w.units[index])
  pass.step(w.units[index])
  stepLivePerson(reference, reference.units[index])
  parity(w, reference)
}

for (const capacity of ['classic', 'scalable']) {
  test(`${capacity}: consecutive lazy-read visits share private membership, not public snapshots`, () => {
    const w = fixture(3, capacity),
      reference = structuredClone(w)
    const visits = countRosterFilters(w),
      full = countRosterFilters(reference)
    const pass = beginLivePersonPass(w)
    try {
      for (let i = 0; i < w.units.length; i++) visitPair(w, reference, pass, i)
      assert.equal(visits.count(), 1, 'one roster filter for the complete owned episode')
      assert.equal(full.count(), 6, 'reference previsit plus first context read per person')
      const first = syncLivePersonCells(w),
        second = syncLivePersonCells(w)
      assert.notEqual(first, second)
      assert.equal(first.get(w.units[0].id), w.units[0].native)
      first.clear()
      first.set(-1, w.units[0].native)
      assert.equal(second.size, 3)
      assert.equal(w.objectCells.objects.size, 3)
      w.units[0].native.timer++
      assert.equal(second.get(w.units[0].id).timer, w.units[0].native.timer)
      const old = second.get(w.units[1].id)
      w.units[1].native = createLivePerson(w, w.units[1])
      const replacement = syncLivePersonCells(w)
      assert.equal(second.get(w.units[1].id), old, 'old membership snapshot is unchanged')
      assert.equal(replacement.get(w.units[1].id), w.units[1].native)
    } finally {
      pass.close()
      visits.restore()
      full.restore()
    }
  })
}

test('circle and chain neighbors retain same-turn alias changes, cell order and RNG', () => {
  for (const mode of ['circle', 'chain']) {
    const w = fixture(3)
    const [a, b, c] = w.units.map(u => u.native)
    if (mode === 'circle') {
      a.substate = 3
      b.substate = c.substate = 4
    } else {
      Object.assign(a, { substate: 5, link: b.id, animationMode: 0, assignment: 16, counter: 6 })
      Object.assign(b, { substate: 6, target: a.id, link: c.id })
      Object.assign(c, { substate: 6, target: a.id })
    }
    const reference = structuredClone(w),
      pass = beginLivePersonPass(w)
    try {
      for (let i = 0; i < w.units.length; i++) visitPair(w, reference, pass, i)
      assert.deepEqual(chain(w, a), chain(reference, reference.units[0].native))
      assert.equal(w.randomState, reference.randomState)
      if (mode === 'chain') assert.equal(b.link, c.id)
    } finally {
      pass.close()
    }
  }
})

test('moving off a supported footprint publishes support only at an original boundary', () => {
  for (const lazy of [false, true]) {
    const w = fixture(2),
      u = w.units[0],
      p = u.native
    const building = addBuilding(w, 'blue', 'boatHouse', { x: 0, z: -24 }, true)
    // One supported starting cell; the adjacent dry cell is intentionally clear.
    w.land.flags.fill(0)
    w.land.buildingIds.fill(0)
    const point = { x: 3070, y: 3840 }
    Object.assign(u, browserPosition(point), { supportHeight: 70 })
    Object.assign(p, point, {
      supportHeight: 70,
      heading: 512,
      angle: 512,
      speed: 110,
      substate: lazy ? 7 : 8,
      flags2: 0,
      counter: 0,
    })
    const cell = (point.y >> 9) * 128 + (point.x >> 9)
    w.land.flags[cell] = 512
    w.land.buildingIds[cell] = building.id
    const reference = structuredClone(w),
      pass = beginLivePersonPass(w)
    try {
      visitPair(w, reference, pass, 0)
      assert.notEqual(p.x >> 9, point.x >> 9, 'fixture crossed the support-cell boundary')
      assert.equal(u.supportHeight, lazy ? undefined : 70)
      assert.equal(p.supportHeight, lazy ? 0 : 70)
      if (!lazy) {
        visitPair(w, reference, pass, 1)
        assert.equal(u.supportHeight, undefined)
        assert.equal(p.supportHeight, 0)
      }
    } finally {
      pass.close()
    }
  }
})

test('ending an episode adds no publication and explicit zero support keeps the old quirk', () => {
  const w = fixture(2),
    pass = beginLivePersonPass(w),
    u = w.units[0]
  u.native.substate = 8
  pass.next(u)
  pass.step(u)
  // These external edits are made only AFTER explicitly leaving the owned run.
  pass.stop()
  u.supportHeight = 70
  u.native.supportHeight = 0
  u.x += 3
  const oldX = u.native.x
  pass.close()
  assert.equal(u.native.x, oldX, 'close never introduces a synchronization')
  syncLivePersonCells(w)
  assert.notEqual(u.native.x, oldX)
  assert.equal(u.supportHeight, 70, 'zero native offset skips the old support loop body')
})

test('initialization reentry cannot activate an outer retained snapshot', () => {
  const w = fixture(2),
    reference = structuredClone(w)
  const install = world => {
    let calls = 0
    Object.defineProperty(world.units, 'filter', {
      configurable: true,
      value(predicate, thisArg) {
        calls++
        if (calls === 1) syncLivePersonCells(world)
        return Array.prototype.filter.call(this, predicate, thisArg)
      },
    })
    return {
      calls: () => calls,
      restore: () => {
        delete world.units.filter
      },
    }
  }
  const actual = install(w),
    expected = install(reference),
    pass = beginLivePersonPass(w)
  try {
    visitPair(w, reference, pass, 0)
    assert.equal(actual.calls(), 3, 'nested sync plus outer previsit and lazy sync')
    assert.equal(actual.calls(), expected.calls())
    const prior = actual.calls()
    visitPair(w, reference, pass, 1)
    assert.equal(actual.calls(), prior + 1, 'a later visit may start a fresh episode')
  } finally {
    pass.close()
    actual.restore()
    expected.restore()
  }
})

test('exceptions and stale/reentrant pass capabilities do not retain ownership', () => {
  const w = fixture(2),
    first = beginLivePersonPass(w)
  Object.defineProperty(w.units, 'filter', {
    configurable: true,
    value() {
      throw new Error('fixture sync failure')
    },
  })
  assert.throws(() => first.step(w.units[0]), /fixture sync failure/)
  delete w.units.filter
  first.close()
  const second = beginLivePersonPass(w),
    third = beginLivePersonPass(w)
  const reference = structuredClone(w)
  try {
    second.step(w.units[0]) // A replaced capability can only use the public path.
    stepLivePerson(reference, reference.units[0])
    parity(w, reference)
    second.close() // Must not close the newer capability.
    third.step(w.units[1])
    stepLivePerson(reference, reference.units[1])
    parity(w, reference)
  } finally {
    second.close()
    third.close()
  }
})

test('a retained context sees its original membership after nested synchronization replaces the roster', () => {
  for (const throws of [false, true]) {
    const w = fixture(2)
    const shaman = addUnit(w, 'blue', 'shaman', browserPosition({ x: 4096, y: 3840 }))
    shaman.native = createLivePerson(w, shaman)
    Object.assign(shaman.native, { state: 41, substate: 8, flags2: 0, speed: 0, timer: 100 })
    w.units[0].native.counter = 3 // faceShaman actually consumes the captured Map.
    const reference = structuredClone(w)
    const install = world => {
      const original = world.units
      let entered = false
      Object.defineProperty(original, 'find', {
        configurable: true,
        value(predicate, thisArg) {
          if (!entered) {
            entered = true
            const unit = original[2]
            // Old owner is due east (bearing 512); replacement is due north (bearing 0).
            Object.assign(unit, browserPosition({ x: 2816, y: 5120 }))
            unit.native = createLivePerson(world, unit)
            world.units = [...original]
            syncLivePersonCells(world)
            if (throws) throw new Error('nested observer exit')
          }
          return Array.prototype.find.call(original, predicate, thisArg)
        },
      })
      return () => {
        delete original.find
      }
    }
    const removeActual = install(w),
      removeReference = install(reference)
    const pass = beginLivePersonPass(w)
    try {
      if (throws) {
        assert.throws(() => pass.step(w.units[0]), /nested observer exit/)
        assert.throws(() => stepLivePerson(reference, reference.units[0]), /nested observer exit/)
        parity(w, reference)
      } else {
        visitPair(w, reference, pass, 0)
        assert.equal(w.units[2].native.x, 2816)
        assert.equal(w.units[2].native.y, 5120)
        // faceShaman schedules a turn rather than updating heading immediately.
        assert.equal(w.units[0].native.turnAngle, 512, 'retained Map faces the original east owner')
        assert.notEqual(
          w.units[0].native.turnAngle,
          0,
          'refreshed membership would face the replacement north owner'
        )
      }
      removeActual()
      removeReference()
      visitPair(w, reference, pass, 1)
    } finally {
      pass.close()
      removeActual()
      removeReference()
    }
  }
})

test('an excluded live route really boards and relocates another passenger before the next visit', () => {
  const w = fixture(4),
    boarding = w.units[1],
    passenger = w.units[2]
  const boat = structuredClone(createWorld(5).vehicles.find(v => v.model === 1))
  assert.ok(boat, 'authored Mission5 Boat template')
  const p = boarding.native,
    q = passenger.native
  Object.assign(boat, {
    id: w.nextId++,
    x: (p.x & 0xfe00) + 256,
    y: (p.y & 0xfe00) + 256,
    h: p.h,
    active: true,
    speed: -1,
    navigationFlags: 0,
    reservation: 0,
    passengers: [q.id],
    passengerCount: 1,
  })
  w.vehicles.push(boat)
  q.vehicle = boat.id
  q.x += 1024
  Object.assign(passenger, browserPosition(q))
  w.pathfinding.people.set(q.id, q)
  w.pathfinding.people.set(p.id, p)
  w.land.flags.fill(0)
  w.land.categories.fill(2)
  const a = 109,
    records = w.motionRoutes.records
  new DataView(records.buffer).setInt16(a, 1, true)
  records[a + 2] = 1
  records[a + 108] = 1
  records[a + 12] = (boat.x >> 8) & 254
  records[a + 13] = (boat.y >> 8) & 254
  records[a + 14] = 1 // Water waypoint makes route-advance invoke actual boarding.
  w.motionRoutes.active = w.motionRoutes.last = 1
  Object.assign(p, { motionGroup: 1, motionIndex: 0, goalX: boat.x, goalY: boat.y })
  const reference = structuredClone(w),
    pass = beginLivePersonPass(w)
  const oldPassengerX = q.x
  try {
    visitPair(w, reference, pass, 0)
    visitPair(w, reference, pass, 1)
    assert.equal(p.vehicle, boat.id)
    assert.equal(boat.passengerCount, 2)
    assert.notEqual(q.x, oldPassengerX, 'boarding projects the earlier passenger as well')
    assert.deepEqual({ x: q.x, y: q.y, h: q.h }, vehicleSeat(boat, 0))
    visitPair(w, reference, pass, 3)
  } finally {
    pass.close()
  }
})

test('the actual scheduler ends an episode before a controller kills an intervening person', () => {
  const w = fixture(3),
    doomed = w.units[1],
    later = w.units[2]
  Object.assign(doomed, browserPosition({ x: 8192, y: 8192 }))
  doomed.native = createLivePerson(w, doomed)
  // The ordinary unsupported-ground branch kills this living owner AFTER the
  // first celebrant's sync. The next celebrant must not retain its membership.
  w.land.categories[(8192 >> 9) * 128 + (8192 >> 9)] = 2
  const p = later.native
  let counter = p.counter,
    observed = false
  Object.defineProperty(p, 'counter', {
    configurable: true,
    enumerable: true,
    get: () => counter,
    set(value) {
      counter = value
      observed = true
      assert.equal(doomed.hp, 0)
      assert.equal(w.objectCells.objects.has(doomed.id), false)
    },
  })
  try {
    tick(w, 1 / 12)
    assert.ok(observed, 'observed the next actual person visit before its controller')
  } finally {
    Object.defineProperty(p, 'counter', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: counter,
    })
  }
})

test('preparation, route and occupancy exclusions split the episode before their callbacks', () => {
  for (const excluded of ['route', 'initialize', 'occupant', 'non-victory']) {
    const w = fixture(3),
      b = w.units[1],
      p = b.native
    if (excluded === 'route') w.pathfinding.people.set(b.id, p)
    if (excluded === 'initialize') p.flags2 |= 16
    if (excluded === 'occupant') {
      const building = addBuilding(w, 'blue', 'hut', { x: 0, z: -24 }, true)
      b.inside = building.id
      p.building = building.id
      p.substate = 0
      p.flags2 |= 0x40800000
    }
    if (excluded === 'non-victory') w.land.landFlags &= ~0x2000000
    const reference = structuredClone(w),
      pass = beginLivePersonPass(w)
    try {
      for (let i = 0; i < w.units.length; i++) visitPair(w, reference, pass, i)
    } finally {
      pass.close()
    }
  }
})

test('external phase changes, backing replacements and duplicate IDs take the full path', () => {
  for (const change of ['terrain', 'registry', 'roster', 'land-flags', 'duplicate', 'new-turn']) {
    const w = fixture(3),
      reference = structuredClone(w),
      pass = beginLivePersonPass(w)
    try {
      visitPair(w, reference, pass, 0)
      for (const world of [w, reference]) {
        if (change === 'terrain') world.terrainVersion++
        if (change === 'registry') world.objectCells.objects = new Map(world.objectCells.objects)
        if (change === 'roster') world.units = [...world.units]
        if (change === 'land-flags') world.land.flags = world.land.flags.slice()
        if (change === 'new-turn') world.turn++
        if (change === 'duplicate') world.units.push(world.units[0])
        world.units[2].x += 2
      }
      visitPair(w, reference, pass, 1)
      assert.equal(w.units[2].native.x, reference.units[2].native.x)
    } finally {
      pass.close()
    }
  }
})

test('clone restarts without an episode and the normal scheduler continues real victory', () => {
  const w = fixture(3)
  w.land.landFlags &= ~0x2000000
  w.status = 'playing'
  for (const u of w.units) u.native = null
  // Ordinary outcome processing, not a directly assigned won flag.
  for (let i = 0; i < 32; i++) tick(w, 1 / 12)
  assert.equal(w.status, 'won')
  assert.ok(w.units.every(u => u.native?.state === 41))
  const restored = structuredClone(w)
  for (let i = 0; i < 3; i++) {
    tick(w, 1 / 12)
    tick(restored, 1 / 12)
    parity(w, restored)
  }
  const pass = beginLivePersonPass(w),
    u = w.units[0]
  try {
    const before = structuredClone(w)
    pass.close()
    assert.deepEqual(w, before, 'capability state is not part of the serialized world')
    stepLivePerson(w, u)
    stepLivePerson(restored, restored.units[0])
    parity(w, restored)
  } finally {
    pass.close()
  }
})
