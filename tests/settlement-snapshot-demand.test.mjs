import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorldState, addUnit } from '../app/world-state.ts'
import {
  collisionWorld, createLivePerson, registerLivePerson,
  stepLiveImpulse, stepOwnedLiveImpulse,
} from '../app/live-people.ts'
import { ownedSettlementObjects } from '../app/live-settlement.ts'
import { settlePerson, stepPersonPhysics, stepOwnedPersonPhysics } from '../app/person-physics.ts'
import { terrainPointHeight } from '../app/native-terrain.ts'

// Supplied branch controls, not original-executable or natural-campaign evidence.
function fixture(alias = 'shared') {
  const w = createWorldState(1)
  Object.assign(w, { units: [], buildings: [], shrines: [], trees: [], effects: [], fights: [] })
  w.manaWorld.gameFlags = 32
  w.landVersion = w.terrainVersion
  w.land.heights.fill(1000)
  w.land.flags.fill(0)
  w.land.categories.fill(0)
  for (const mask of w.land.walkMasks) mask.fill(255)
  const u = addUnit(w, 'blue', 'brave', { x: 10, z: 10 })
  const p = createLivePerson(w, u)
  Object.assign(p, { state: 19, previousState: 17, substate: 5,
    h: terrainPointHeight(w.land, p), flags2: 0x80000, flags3: 0, flags4: 0,
    target: 0, counter: 9, timer: 20, reactionTimer: 10, reactionDuration: 20,
    goalX: p.x, goalY: p.y, anchorX: p.x, anchorY: p.y,
    velocity: { x: 0, y: 0, z: 0 } })
  u.flight = p
  u.native = alias === 'shared' ? p : alias === 'stale' ? structuredClone(p) : null
  registerLivePerson(w, p)
  return { w, u, p }
}

function physicalLinks(w) {
  return w.units.map(u => {
    const owners = [u.native, u.flight, u.fight?.motion, u.entry?.person, u.builder?.person]
    return owners.map(p => p ? {
      aliases: owners.map(other => p === other),
      cell: w.objectCells.objects.get(p.id) === p,
      path: w.pathfinding.people.get(p.id) === p,
    } : null)
  })
}

function physicsFixture() {
  const { w, p } = fixture()
  const trace = [], objects = new Map([[7, { class: 1, flags2: 0 }]])
  let reads = 0
  const collision = {
    cell: () => ({ flags: 0, category: 0, building: 0 }),
    walkMask: w.land.walkMasks[0], boatAt: () => false,
    get objects() { reads++; trace.push(['objects', p.flags2]); return objects },
  }
  const world = { land: w.land, collision, gameFlags: 0, levelFlags: 0,
    playerTribe: 0, buildingModel: () => 1, route: () => ({ x: p.x, y: p.y }) }
  const effects = {
    insert: to => { Object.assign(p, to); trace.push(['insert']); return false },
    sound: () => trace.push(['sound']), damage: () => trace.push(['damage']),
    animation: () => trace.push(['animation']), release: () => trace.push(['release']),
    initialize: () => trace.push(['initialize']), allocate: () => trace.push(['allocate']),
    reveal: () => trace.push(['reveal']), path: () => trace.push(['path']),
    class3: () => trace.push(['class3']), canFight: () => true, readyToFight: () => true,
  }
  return { w, p, world, collision, effects, objects, trace, reads: () => reads }
}
function runOwned(f) {
  stepOwnedPersonPhysics(f.world, f.p, f.effects,
    () => ownedSettlementObjects(f.w, f.p, f.collision))
}

test('no-target settlement matches shared reference and hand-authored callback trace', () => {
  const f = physicsFixture(), expected = structuredClone(f.p), expectedTrace = []
  // Shared settlement reference, not an independent physics implementation.
  // The throwing lookup independently checks the no-object-use boundary.
  settlePerson(f.w.land, expected, expected, 0,
    { get() { assert.fail('no-target settlement must not read objects') } }, {
      ...f.effects,
      release: () => expectedTrace.push(['release']),
      initialize: () => expectedTrace.push(['initialize']),
    })
  runOwned(f)
  assert.equal(f.reads(), 0)
  for (const key of ['state', 'previousState', 'flags2', 'flags3', 'flags4', 'motionMode', 'motionTimer'])
    assert.equal(f.p[key], expected[key], key)
  assert.deepEqual(f.trace.filter(([kind]) => kind === 'release' || kind === 'initialize'), expectedTrace)
  assert.deepEqual(f.trace, [['release'], ['initialize'], ['insert'], ['path']],
    'hand-authored callback-order oracle, not derived from either implementation')
  assert.equal(f.p.flags2 & 0x80000, 0)
})

test('nonzero target without the resume-fight flag still cannot consume objects', () => {
  const f = physicsFixture()
  f.p.target = 7
  assert.equal(f.p.flags3 & 0x10000, 0)
  runOwned(f)
  assert.equal(f.reads(), 0)
  assert.notEqual(f.p.state, 36)
  assert.deepEqual(f.trace, [['release'], ['initialize'], ['insert'], ['path']])
})

test('public physics retains observing and throwing objects getter at the original point', () => {
  const f = physicsFixture()
  stepPersonPhysics(f.world, f.p, f.effects)
  assert.equal(f.reads(), 1)
  assert.ok(f.trace.find(([kind]) => kind === 'objects')[1] & 0x80000)
  const throwing = physicsFixture(), sentinel = new Error('snapshot failed')
  Object.defineProperty(throwing.collision, 'objects', { get() { throw sentinel } })
  assert.throws(() => stepPersonPhysics(throwing.world, throwing.p, throwing.effects), error => error === sentinel)
  assert.ok(throwing.p.flags2 & 0x80000, 'getter throws before settlement clears airborne state')
  assert.equal(throwing.trace.some(([kind]) => kind === 'release'), false)
})

test('required target snapshot precedes settlement mutation and keeps missing-target behavior', () => {
  for (const target of [7, 999]) {
    const f = physicsFixture()
    Object.assign(f.p, { flags3: 0x10000, target })
    runOwned(f)
    assert.equal(f.reads(), 1)
    assert.ok(f.trace.find(([kind]) => kind === 'objects')[1] & 0x80000)
    assert.equal(f.p.flags3 & 0x10000, 0)
    assert.equal(f.p.state, target === 7 ? 36 : 19)
  }
})

test('dirty no-target path preserves snapshot exception and pre-settlement ordering', () => {
  const f = physicsFixture(), sentinel = new Error('dirty snapshot failed')
  f.w.terrainVersion++
  Object.defineProperty(f.collision, 'objects', { get() { throw sentinel } })
  assert.throws(() => runOwned(f), error => error === sentinel)
  assert.ok(f.p.flags2 & 0x80000)
})

for (const mutation of ['target', 'clear-target', 'animation-return', 'dirty-terrain']) {
  test(`landing callback ${mutation} is observed at the final argument point`, () => {
    const f = physicsFixture()
    f.p.flags4 = 0x400
    if (mutation === 'clear-target') Object.assign(f.p, { flags3: 0x10000, target: 7 })
    f.effects.allocate = () => {
      f.trace.push(['allocate'])
      if (mutation === 'target') Object.assign(f.p, { flags3: 0x10000, target: 7 })
      if (mutation === 'clear-target') f.p.target = 0
      if (mutation === 'animation-return') Object.assign(f.p, { flags3: 0x10000, flags4: 0x2000, target: 7 })
      if (mutation === 'dirty-terrain') f.w.terrainVersion++
    }
    runOwned(f)
    assert.equal(f.reads(), ['target', 'dirty-terrain'].includes(mutation) ? 1 : 0)
    if (mutation === 'target') assert.equal(f.p.state, 36)
    if (mutation === 'animation-return') assert.equal(f.p.flags4 & 0x2000, 0)
  })
}

test('animation-only settlement may create a fight target but returns without reading it', () => {
  const f = physicsFixture()
  f.p.flags4 = 0x2000
  f.effects.animation = () => Object.assign(f.p, { flags3: 0x10000, target: 7 })
  runOwned(f)
  assert.equal(f.reads(), 0)
  assert.equal(f.p.target, 7)
  assert.equal(f.p.flags3 & 0x10000, 0x10000)
  assert.equal(f.p.state, 19)
})

test('earlier building bounce shares the exact cache and does not resynchronize dirty terrain', () => {
  const f = physicsFixture()
  f.p.flags4 = 1
  f.collision.cell = () => ({ flags: 512, category: 0, building: 9 })
  let accesses = 0, builds = 0, cached
  Object.defineProperty(f.collision, 'objects', { get() {
    accesses++
    if (cached) return cached
    builds++
    cached = new Map([[9, { class: 2, state: 2, tribe: f.p.tribe, flags2: 0 }]])
    f.w.terrainVersion++
    return cached
  } })
  runOwned(f)
  assert.equal(accesses, 2, 'bounce then dirty settlement both use original getter')
  assert.equal(builds, 1, 'no replacement getter and no unconditional terrain synchronization')
  assert.notEqual(f.w.landVersion, f.w.terrainVersion)
})

test('earlier bounce error precedes settlement selection', () => {
  const f = physicsFixture(), sentinel = new Error('bounce snapshot failed')
  f.p.flags4 = 1
  f.collision.cell = () => ({ flags: 512, category: 0, building: 9 })
  Object.defineProperty(f.collision, 'objects', { get() { throw sentinel } })
  let selected = false
  assert.throws(() => stepOwnedPersonPhysics(f.world, f.p, f.effects, () => {
    selected = true
    return ownedSettlementObjects(f.w, f.p, f.collision)
  }), error => error === sentinel)
  assert.equal(selected, false)
})

test('actual collision adapter avoids all projection only on the proved no-use branch', () => {
  const { w, p } = fixture()
  const spectator = addUnit(w, 'red', 'brave', { x: 30, z: 30 })
  const x = spectator.x
  let projected = 0
  // Counting-only instrumentation, not a claim of exotic-world equivalence.
  Object.defineProperty(spectator, 'x', { configurable: true, get() { projected++; return x } })
  const collision = collisionWorld(w)
  ownedSettlementObjects(w, p, collision)
  assert.equal(projected, 0)
  Object.assign(p, { flags3: 0x10000, target: spectator.id })
  const snapshot = ownedSettlementObjects(w, p, collision)
  assert.equal(projected, 1)
  assert.equal(snapshot, collision.objects)
  assert.equal(projected, 1)
})

test('actual dirty no-target snapshot retains terrain, walk-mask and owner notifications', () => {
  const { w, p } = fixture()
  const heights = w.land.heights.slice()
  for (const mask of w.land.walkMasks) mask.fill(0)
  const walkMask = w.land.walkMasks[0].slice()
  w.terrain.fill(40)
  w.terrainVersion++
  const snapshot = ownedSettlementObjects(w, p, collisionWorld(w))
  assert.equal(w.landVersion, w.terrainVersion)
  assert.notDeepEqual(w.land.heights, heights)
  assert.notDeepEqual(w.land.walkMasks[0], walkMask)
  assert.equal(p.flags2 & 4, 4, 'the live physical owner received height notification')
  assert.ok(snapshot.has(p.id), 'dirty no-target path built the original map')
})

test('required actual snapshot preserves last duplicate owner and snapshots flags before clearing', () => {
  const { w, u, p } = fixture()
  Object.assign(p, { flags3: 0x10000, target: p.id })
  const first = ownedSettlementObjects(w, p, collisionWorld(w))
  assert.ok(first.get(p.id).flags2 & 0x80000)
  const duplicate = structuredClone(u)
  duplicate.hp = 0
  w.units.push(duplicate)
  const second = ownedSettlementObjects(w, p, collisionWorld(w))
  assert.equal(second.get(p.id).flags2, 1, 'last unit with the ID overwrites earlier owners')
  assert.ok(first.get(p.id).flags2 & 0x80000, 'earlier snapshot is not live or refreshed')
})

for (const alias of ['shared', 'stale', 'null']) {
  for (const scenario of ['airborne', 'landing', 'target', 'duplicate', 'dirty']) {
    test(`shared-implementation eager differential: ${alias} native alias, ${scenario}`, () => {
      const { w, u, p } = fixture(alias)
      if (scenario === 'airborne') {
        p.h += 2000; p.flags4 |= 0x400
        p.velocity = { x: 40, y: 20, z: -30 }
      }
      if (scenario === 'target' || scenario === 'duplicate') {
        const target = addUnit(w, 'red', 'brave', { x: 12, z: 10 })
        p.flags3 |= 0x10000; p.target = target.id
        if (scenario === 'duplicate') {
          const duplicate = structuredClone(target)
          duplicate.hp = 0
          w.units.push(duplicate)
        }
      }
      if (scenario === 'dirty') {
        w.terrain.fill(40)
        w.terrainVersion++
      }
      const eager = structuredClone(w), owned = structuredClone(w)
      stepLiveImpulse(eager, eager.units.find(unit => unit.id === u.id))
      stepOwnedLiveImpulse(owned, owned.units.find(unit => unit.id === u.id))
      assert.deepEqual(owned, eager, 'entire world including RNG, events, terrain and registries')
      assert.deepEqual(physicalLinks(owned), physicalLinks(eager), 'physical ownership aliases')
      if (scenario === 'dirty') {
        assert.equal(owned.landVersion, owned.terrainVersion)
        assert.notDeepEqual(owned.land.heights, w.land.heights, 'real terrain synchronization occurred')
      }
    })
  }
}
