import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { deserialize } from 'node:v8'
import { createHash } from 'node:crypto'
import { createWorld, addBuilding, browserPosition, nativePosition, tick } from '../app/model.ts'
import {
  createLivePerson,
  registerLivePerson,
  collisionWorld,
  stepLiveBuilderPhysics,
  stepLiveImpulse,
  registerLiveBuilder,
  syncLivePersonCells,
} from '../app/live-people.ts'
import { processBuilderWork } from '../app/live-construction-runtime.ts'
import { preparePersonTurn, stepPersonReaction } from '../app/person-update.ts'
import { markPersonAirborne, stepPersonPhysics } from '../app/person-physics.ts'
import { recoverGroundObstacle, stepMotionRecovery } from '../app/person-motion.ts'
import { terrainPointHeight } from '../app/native-terrain.ts'
import { personStepCollision } from '../app/person-collision.ts'
import { moveObjectInCells } from '../app/object-cells.ts'
import { stepLiveRoute, replanLivePath } from '../app/live-pathfinding.ts'
import { BuilderTask } from '../app/building-workers.ts'
import { releaseTasks } from '../app/world-tasks.ts'
import { command, liveCommandContext } from '../app/live-command.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { withStorage } from './support/profile-storage.mjs'

// Original browser world at d91c735 turn5819, before the failing compatibility
// step. Supplied diagnostic replay is not native-executable or new natural proof.
function suppliedCoast() {
  const bytes = gunzipSync(
    readFileSync(new URL('../references/fixtures/builder-ground/pre5820.v8.gz', import.meta.url))
  )
  assert.equal(
    createHash('sha256').update(bytes).digest('hex'),
    '806f745e4f08f85625a56bb41351a57f9ca255467d8cd77962f7c320ebf2cade'
  )
  const { world: w } = deserialize(bytes),
    u = w.units.find(u => u.id === 1127),
    p = u.builder.person
  return { w, u, p, b: w.buildings.find(b => b.id === u.work) }
}
function adopt(w, u, p) {
  Object.assign(p, nativePosition(w, u))
  p.x &= 65535
  p.y &= 65535
  registerLivePerson(w, p)
  w.pathfinding.people.set(u.id, p)
}
const physical = p =>
  Object.fromEntries(
    [
      'x',
      'y',
      'h',
      'counter',
      'angle',
      'heading',
      'flags2',
      'motionMode',
      'motionTimer',
      'recoveryCounter',
      'goalX',
      'goalY',
      'destinationX',
      'destinationY',
      'turnAngle',
      'turnY',
      'motionGroup',
      'motionIndex',
      'velocity',
    ].map(k => [k, p[k]])
  )
const unexpected = () => assert.fail('supplied grounded boundary must not invoke this effect')

test('supplied pre5820 coast follows preparation, native physics and route sequence before one fetch controller', () => {
  const actual = suppliedCoast(),
    expected = suppliedCoast(),
    { w, u, p } = expected
  adopt(w, u, p)
  p.counter = (p.counter + 1) & 255
  preparePersonTurn(p, w.manaWorld.gameFlags, {
    initialize: unexpected,
    animation: unexpected,
    destination: to => replanLivePath(w, u, p, to),
  })
  stepPersonReaction(p)
  markPersonAirborne(w.land, p)
  const trace = []
  stepPersonPhysics(
    {
      land: w.land,
      collision: collisionWorld(w),
      gameFlags: w.manaWorld.gameFlags,
      levelFlags: w.manaWorld.levelFlags,
      playerTribe: w.manaWorld.playerTribe,
      buildingModel: unexpected,
      route: unexpected,
    },
    p,
    {
      insert: to => {
        trace.push('insert')
        return moveObjectInCells(w.objectCells, p, to)
      },
      path: () => {
        trace.push('path')
        stepLiveRoute(w, u)
      },
      initialize: unexpected,
      animation: unexpected,
      release: unexpected,
      allocate: unexpected,
      sound: unexpected,
      damage: unexpected,
      reveal: unexpected,
      class3: unexpected,
      canFight: unexpected,
      readyToFight: unexpected,
    }
  )
  p.flags2 = (p.flags2 & ~0x2004) >>> 0
  const rng = actual.w.randomState,
    timer = actual.p.timer
  processBuilderWork(actual.w, actual.u, actual.b)
  assert.deepEqual(trace, ['insert', 'path'])
  assert.deepEqual(physical(actual.p), physical(p))
  assert.equal(actual.p.timer, timer - 1)
  assert.equal(actual.w.randomState, rng)
  assert.ok(actual.p.flags2 & 0x800, 'native collision recovery entered')
  assert.equal(actual.u.flight, undefined)
  assert.equal(actual.w.pathfinding.people.get(actual.u.id), actual.p)
  assert.equal(actual.w.objectCells.objects.get(actual.u.id), actual.p)
  assert.ok(actual.u.path.length)
})

function failedRecovery() {
  const w = createWorld(22),
    u = w.units.find(u => u.id === 89)
  Object.assign(u, browserPosition({ x: 10085, y: 33991 }))
  const p = createLivePerson(w, u)
  Object.assign(p, {
    x: 10085,
    y: 33991,
    h: 334,
    heading: 1175,
    angle: 1175,
    speed: 60,
    flags2: 33692160,
    flags3: 264192,
    flags4: 537395456,
    physics: 18,
    turnAngle: 8960,
    turnY: 33536,
    slowTurn: 0,
    velocity: { x: 156, y: -192, z: 182 },
    state: 10,
    counter: 60,
    motionMode: 48,
    recoveryCounter: 0,
  })
  u.native = null
  u.builder = { task: BuilderTask.Fetch, busy: 0, phase: 24, restart: false, person: p }
  registerLivePerson(w, p)
  return { w, u, p }
}

test('22 failed ground probes transfer the same builder to flight with exactly one controller and counter visit', () => {
  const { w, u, p } = failedRecovery(),
    probes = [],
    to = { x: p.x, y: p.y, h: p.h }
  assert.equal(
    recoverGroundObstacle(
      structuredClone(p),
      to,
      false,
      (x, y) => terrainPointHeight(w.land, { x, y }),
      point => {
        const result = personStepCollision(collisionWorld(w), p, point)
        probes.push(result)
        return result
      }
    ),
    false
  )
  assert.deepEqual(probes, Array(22).fill(3))
  const rng = w.randomState
  let visits = 0
  stepLiveBuilderPhysics(w, u, p, () => visits++)
  assert.equal(visits, 1)
  assert.equal(p.counter, 61)
  assert.equal(u.flight, p)
  assert.equal(u.builder.person, p)
  assert.equal(w.objectCells.objects.get(u.id), p)
  assert.deepEqual(p.velocity, { x: -2, y: 0, z: -3 })
  assert.equal(w.randomState, rng)
  const before = p.counter
  tick(w, 1 / 12)
  assert.equal(p.counter, (before + 1) & 255)
})

test('currently turning collision retains position and visits controller once', () => {
  const { w, u, p } = failedRecovery(),
    before = [p.x, p.y, p.h]
  p.flags2 = (p.flags2 & ~(0x800 | 0x200000)) | 0x1000 | 128
  p.turnAngle = (p.heading + 1024) & 2047
  let visits = 0
  stepLiveBuilderPhysics(w, u, p, () => {
    visits++
    w.randomState = 123456
  })
  assert.equal(visits, 1)
  assert.equal(w.randomState, 123456)
  assert.deepEqual([p.x, p.y, p.h], before)
  assert.equal(u.flight, undefined)
  assert.equal(p.flags2 & 0x800, 0)
})

for (const counter of [64, 65, 128, 255])
  test(`native recovery uses signed counter ${counter} and deterministic 22 probes`, () => {
    const { p } = failedRecovery(),
      probes = []
    p.recoveryCounter = counter
    p.motionMode = 7
    p.flags2 &= ~0x80000000
    recoverGroundObstacle(
      p,
      { x: p.x, y: p.y, h: p.h },
      false,
      () => 334,
      point => {
        probes.push([point.x, point.y])
        return 3
      }
    )
    assert.equal(probes.length, 22)
    assert.equal(p.motionMode, counter === 65 ? 0 : 8)
    assert.equal(!!(p.flags2 & 0x80000000), counter === 65)
    assert.ok(p.flags2 & 0x800)
    assert.notDeepEqual(probes.slice(0, 11), probes.slice(11))
  })

for (const facing of [false, true])
  test(`preparation high retry preserves canonical owner; explicit-facing=${facing}`, () => {
    const { w, u, p } = suppliedCoast()
    adopt(w, u, p)
    p.speed = 0
    p.flags2 = ((p.flags2 & ~0x2004) | 0x80000000 | (facing ? 128 : 0)) >>> 0
    const goal = [p.goalX, p.goalY],
      route = [p.destinationX, p.destinationY, p.turnAngle, p.turnY, p.motionGroup, p.motionIndex]
    let visits = 0
    stepLiveBuilderPhysics(w, u, p, () => visits++)
    assert.equal(visits, 1)
    assert.equal(p.flags2 >>> 31, 0)
    assert.deepEqual([p.goalX, p.goalY], goal)
    assert.equal(w.pathfinding.people.get(u.id), p)
    if (facing)
      assert.deepEqual(
        [p.destinationX, p.destinationY, p.turnAngle, p.turnY, p.motionGroup, p.motionIndex],
        route
      )
  })

test('a supplied route-recovery state dispatches once and retires construction without an extra physics visit', () => {
  const { w, u, p } = suppliedCoast()
  adopt(w, u, p)
  p.speed = 0
  p.flags2 = (p.flags2 & ~0x2004) >>> 0
  p.previousState = p.state
  p.state = 33
  stepLiveBuilderPhysics(w, u, p, unexpected)
  assert.notEqual(p.state, 10)
  assert.equal(u.builder, undefined)
  assert.equal(u.native, p)
  const before = p.counter
  tick(w, 1 / 12)
  assert.equal(p.counter, (before + 1) & 255)
  assert.equal(u.builder, undefined)
})

test('public Save/Load twins preserve builder, route and cells through collision, retry and cancellation', async () => {
  await withStorage({}, async ({ freshStore }) => {
    const store = await freshStore(),
      { w, u, p, b } = suppliedCoast()
    store.startMission(7)
    Object.assign(store.getWorld(), w)
    const live = store.getWorld()
    processBuilderWork(live, u, b)
    p.flags2 = (p.flags2 | 0x80000000) >>> 0
    assert.ok(await store.saveCheckpoint())
    assert.ok(store.loadCheckpoint())
    const twin = store.getWorld(),
      other = twin.units.find(v => v.id === u.id),
      q = other.builder.person
    assert.equal(twin.pathfinding.people.get(u.id), q)
    assert.equal(twin.objectCells.objects.get(u.id), q)
    for (let n = 0; n < 8; n++) {
      tick(live, 1 / 12)
      tick(twin, 1 / 12)
      assert.deepEqual(twin, live)
    }
    releaseTasks(live, u)
    releaseTasks(twin, other)
    assert.equal(u.native, p)
    assert.equal(other.native, q)
    assert.equal(u.builder, undefined)
    syncLivePersonCells(live)
    syncLivePersonCells(twin)
    assert.equal(live.objectCells.objects.get(u.id), p)
    for (let n = 0; n < 8; n++) {
      tick(live, 1 / 12)
      tick(twin, 1 / 12)
      assert.deepEqual(twin, live)
    }
  })
})

test('default state10 preparation preserves the single construction controller RNG', () => {
  const { w, u, p } = suppliedCoast()
  adopt(w, u, p)
  p.speed = 0
  p.flags2 = ((p.flags2 & ~0x2004) | 16) >>> 0
  let visits = 0
  stepLiveBuilderPhysics(w, u, p, () => {
    visits++
    w.randomState = 98765
  })
  assert.equal(visits, 1)
  assert.equal(p.state, 10)
  assert.equal(p.flags2 & 16, 0)
  assert.equal(w.randomState, 98765)
  assert.equal(u.builder.person, p)
})

for (const facing of [false, true])
  test(`timed steering completion and periodic retry preserve explicit-facing=${facing}`, () => {
    const { p } = failedRecovery()
    Object.assign(p, {
      counter: 32,
      motionTimer: 2,
      recoveryCounter: 65,
      flags2: 0x800 | (facing ? 128 : 0),
    })
    stepMotionRecovery(p, false, unexpected, unexpected)
    assert.equal(p.motionTimer, 1)
    assert.equal(!!(p.flags2 & 0x80000000), !facing)
    p.flags2 &= ~0x80000000
    stepMotionRecovery(p, false, unexpected, unexpected)
    assert.equal(p.motionTimer, 0)
    assert.equal(p.recoveryCounter, 0)
    assert.equal(p.flags2 & 0x800, 0)
    assert.ok(p.flags2 & 0x1000)
    assert.equal(p.flags2 >>> 31, 0)
  })

// An ordinary acquired builder is made player-controlled only to exercise the
// public replacement command; this is a supplied player-ownership boundary.
test('public movement replacement retires construction references and keeps the physical owner', () => {
  const w = createWorld(7)
  let u
  while (w.turn < 400 && !u) {
    tick(w, 1 / 12)
    u = w.units.find(person => person.builder?.person && person.path.length)
  }
  assert.ok(u)
  const p = u.builder.person
  u.team = 'blue'
  p.tribe = 0
  w.selected = [u.id]
  const oldOrder = currentPersonOrder(w.buildingOrders, p),
    oldReferences = oldOrder.references
  let target
  for (let dx = 2; dx <= 8 && !target; dx += 2)
    for (let dz = 0; dz <= 8 && !target; dz += 2) {
      if (!dx && !dz) continue
      const point = { x: u.x + dx, z: u.z + dz },
        context = liveCommandContext(w, point)
      if (context?.enabled && context.model === 3) target = point
    }
  assert.ok(target)
  assert.equal(command(w, target), true)
  assert.equal(u.builder, undefined)
  assert.equal(u.native, p)
  assert.equal(w.objectCells.objects.get(u.id), p)
  assert.equal(oldOrder.references, oldReferences - 1)
  assert.equal(currentPersonOrder(w.buildingOrders, p)?.model, 3)
  for (let n = 0; n < 4 && !w.pathfinding.people.has(u.id); n++) tick(w, 1 / 12)
  assert.equal(w.pathfinding.people.get(u.id), p)
  assert.equal(w.objectCells.objects.get(u.id), p)
})

test('builder-owned airborne turns retain one fetch controller through public Save/Load and cancellation', async () => {
  await withStorage({}, async ({ freshStore }) => {
    const store = await freshStore(),
      { w, u, p, b } = suppliedCoast()
    store.startMission(7)
    Object.assign(store.getWorld(), w)
    const live = store.getWorld()
    processBuilderWork(live, u, b)
    p.flags2 = (p.flags2 | 0x80000) >>> 0
    p.flags4 |= 0x400
    p.h = 1000
    p.velocity = { x: 0, y: 20, z: 0 }
    u.flight = p
    const timer = p.timer,
      counter = p.counter
    assert.ok(await store.saveCheckpoint())
    assert.ok(store.loadCheckpoint())
    const twin = store.getWorld(),
      other = twin.units.find(v => v.id === u.id),
      q = other.builder.person
    tick(live, 1 / 12)
    tick(twin, 1 / 12)
    assert.equal(p.timer, timer - 1)
    assert.equal(p.counter, (counter + 1) & 255)
    assert.equal(u.flight, p)
    assert.equal(other.flight, q)
    assert.equal(p.retainPhysicalOwner, true)
    assert.equal(q.retainPhysicalOwner, true)
    assert.deepEqual(twin, live)
    releaseTasks(live, u)
    releaseTasks(twin, other)
    assert.equal(u.native, p)
    assert.equal(u.flight, p)
    assert.equal(u.builder, undefined)
    for (let n = 0; n < 24; n++) {
      tick(live, 1 / 12)
      tick(twin, 1 / 12)
      assert.deepEqual(twin, live)
      assert.equal(live.objectCells.objects.get(u.id), p)
    }
  })
})

test('only canonical builder ownership changes no-order landing retention', () => {
  const outcomes = []
  for (const migrated of [false, true]) {
    const { w, u, p } = failedRecovery()
    u.builder = undefined
    u.native = p
    u.flight = p
    w.land.heights.fill(1000)
    w.land.flags.fill(0)
    w.land.categories.fill(0)
    w.land.walkMasks.forEach(mask => mask.fill(255))
    Object.assign(p, {
      h: 1000,
      flags2: 0x80000,
      flags4: 0x20000100,
      velocity: { x: 0, y: 0, z: 0 },
    })
    if (migrated) registerLiveBuilder(w, u, p)
    stepLiveImpulse(w, u)
    assert.equal(u.flight, undefined)
    assert.equal(u.native, migrated ? p : null)
    outcomes.push({ physical: physical(p), rng: w.randomState })
  }
  assert.deepEqual(outcomes[0], outcomes[1])
})

test('a separate flight person keeps its visit instead of being replaced by a builder adapter', () => {
  const { w, u, p } = failedRecovery(),
    q = structuredClone(p)
  q.h = 3000
  q.flags2 |= 0x80000
  q.flags4 |= 0x400
  u.flight = q
  registerLivePerson(w, q)
  u.work = addBuilding(w, 'blue', 'hut', { x: 20, z: 20 }, false).id
  const counter = p.counter
  tick(w, 1 / 12)
  assert.equal(q.counter, (counter + 1) & 255)
  assert.equal(p.counter, counter)
  assert.equal(u.flight, q)
  assert.equal(w.objectCells.objects.get(u.id), q)
})

test('construction controller observes the moved browser pose before epilogue flag clearing', () => {
  const { w, u, p } = suppliedCoast()
  adopt(w, u, p)
  const before = { x: u.x, z: u.z }
  let visits = 0
  stepLiveBuilderPhysics(w, u, p, () => {
    visits++
    assert.deepEqual({ x: u.x, z: u.z }, browserPosition(p))
    assert.notDeepEqual({ x: u.x, z: u.z }, before)
    assert.equal(p.flags2 & 4, 4)
  })
  assert.equal(visits, 1)
  assert.equal(p.flags2 & 0x2004, 0)
})
