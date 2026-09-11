import assert from 'node:assert/strict'
import test from 'node:test'
import { advanceGame } from '../app/game-clock.ts'
import {
  HOME,
  addBuilding,
  addUnit,
  command,
  createWorld,
  maxHp,
  nativePosition,
  random,
  syncLandscapeObjects,
  tick,
  unitAnimationSource,
} from '../app/model.ts'
import { stepLiveConversionVictim } from '../app/live-movement.ts'
import {
  conversionDelay,
  stepConversionVictim,
  stepPreachingOrder,
} from '../app/preacher-conversion.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

function scenario(forced = false) {
  const w = createWorld()
  w.units = w.units.filter(u => u.kind === 'shaman')
  w.selected = []
  if (forced) w.manaTribes[1].flags2 |= 64
  const preacher = addUnit(w, 'blue', 'preacher', { x: HOME.x + 2, z: HOME.z })
  const victim = addUnit(w, 'red', 'brave', { x: HOME.x + 3, z: HOME.z })
  return { w, preacher, victim, oldId: victim.id }
}

function until(w, condition, limit = 700) {
  for (let turn = 0; turn < limit && !condition(); turn++) tick(w, 1 / 12)
  assert.ok(condition(), 'preacher lifecycle must reach the expected state')
}

test('native conversion delay uses the recovered 200/3 timing basis', () => {
  const normal = { randomState: 0x12345678, loadFlags: 0 }
  assert.deepEqual(
    Array.from({ length: 5 }, () => conversionDelay(normal)),
    [105, 96, 99, 96, 101]
  )
  const special = { randomState: 0x12345678, loadFlags: 0x4000000 }
  assert.deepEqual(
    Array.from({ length: 5 }, () => conversionDelay(special)),
    [203, 191, 196, 205, 189]
  )
})

test('inside command 31 binds its building and uses the native five-cell sermon radius', () => {
  const { w, preacher } = scenario()
  until(
    w,
    () => preacher.native && currentPersonOrder(w.buildingOrders, preacher.native)?.model === 17
  )
  const order = currentPersonOrder(w.buildingOrders, preacher.native)
  order.model = 31
  for (const inside of [false, true]) {
    const p = {
        ...preacher.native,
        commandStatus: 31,
        substate: 0,
        counter: 0,
        goalX: preacher.native.x,
        goalY: preacher.native.y,
        flags2: inside ? preacher.native.flags2 | 0x800000 : preacher.native.flags2 & ~0x800000,
        flags4: 0x10007,
        building: inside ? 99 : null,
        workTarget: 0,
      },
      radii = []
    stepPreachingOrder(
      {
        randomState: w.randomState,
        loadFlags: w.manaWorld.loadFlags,
        orders: w.buildingOrders,
        tribeFlags: w.manaTribes.map(tribe => tribe.flags2),
      },
      p,
      order,
      {
        animate: () => {},
        animationDuration: () => 1,
        stop: () => {},
        acquire: radius => (radii.push(radius), 0),
        release: () => {},
      }
    )
    assert.equal(p.commandAux, inside ? 5 : 3)
    assert.equal(p.workTarget, inside ? 99 : 0)
    assert.equal(p.flags4 & 0x10007, inside ? 2 : 0x10007)
    assert.deepEqual(radii, [inside ? 5 : 3])
  }
})

test('conversion moves a newborn outside a building footprint before centering it', () => {
  const { w, preacher, victim, oldId } = scenario()
  until(w, () => victim.native?.state === 23)
  victim.native.timer = 0
  w.manaTribes[1].flags2 |= 64
  const seed = 0x12345678,
    rng = { randomState: seed }
  random(rng)
  random(rng)
  const angle = (random(rng) & 63) << 5,
    building = addBuilding(w, 'blue', 'camp', { x: HOME.x + 10, z: HOME.z })
  syncLandscapeObjects(w)
  const rawCell = w.land.buildingIds.findIndex(
    (id, cell) => id === building.id && !!(w.land.flags[cell] & 512)
  )
  assert.ok(rawCell >= 0)
  const point = { x: ((rawCell & 127) << 9) + 256, y: ((rawCell >> 7) << 9) + 256 }
  preacher.native.x =
    (point.x - (Math.imul(rules.sine[(angle + 512) & 2047], 0x500) >> 16)) & 0xffff
  preacher.native.y = (point.y - (Math.imul(rules.sine[angle], 0x500) >> 16)) & 0xffff
  w.randomState = seed
  assert.ok(w.land.flags[rawCell] & 512)
  stepLiveConversionVictim(w, victim)
  const converted = w.units.find(unit => unit.kind === 'brave' && unit.id !== oldId)
  assert.ok(converted)
  const position = nativePosition(w, converted),
    cell = (position.y >> 9) * 128 + (position.x >> 9)
  assert.equal(w.land.flags[cell] & 512, 0)
})

test('sermon poses preserve native multi-turn RNG timing', () => {
  const { w, preacher } = scenario()
  until(
    w,
    () => preacher.native && currentPersonOrder(w.buildingOrders, preacher.native)?.model === 17
  )
  const order = currentPersonOrder(w.buildingOrders, preacher.native),
    p = {
      ...preacher.native,
      substate: 3,
      flags2: preacher.native.flags2 & ~0x40000000,
      speed: 0,
      statusFlags: 0,
      timer: 0,
      counter: 0,
      animationMode: 0,
      assignment: 0,
      commandPhase: 0,
      turnAngle: 123,
    },
    state = {
      randomState: 1,
      loadFlags: w.manaWorld.loadFlags,
      orders: w.buildingOrders,
      tribeFlags: w.manaTribes.map(tribe => tribe.flags2),
    },
    effects = {
      animate: () => {},
      animationDuration: () => 1,
      stop: () => {},
      acquire: () => 0,
      release: () => {},
    }
  stepPreachingOrder(state, p, order, effects)
  assert.equal(p.animationMode, 2)
  assert.equal(p.turnAngle, 123)
  assert.equal(state.randomState, 1275068418)
  p.counter = 1
  stepPreachingOrder(state, p, order, effects)
  assert.equal(p.animationMode, 0)
  assert.equal(p.turnAngle, 3)
  assert.equal(state.randomState, 1896767491)

  Object.assign(p, { animationMode: 0, assignment: 0, commandPhase: 0, counter: 0 })
  state.randomState = 4
  stepPreachingOrder(state, p, order, effects)
  assert.equal(p.animationMode, 1)
  const poseRandom = state.randomState
  for (let turn = 1; turn <= 40; turn++) {
    p.counter = turn
    stepPreachingOrder(state, p, order, effects)
  }
  assert.equal(p.animationMode, 0)
  assert.equal(state.randomState, poseRandom)
})

test('an idle preacher sermons, converts by replacement, and releases listeners on a new order', () => {
  const first = scenario()
  until(first.w, () => first.victim.native?.state === 23 && first.preacher.native?.object === 168)
  assert.equal(currentPersonOrder(first.w.buildingOrders, first.preacher.native)?.model, 17)
  assert.equal(first.preacher.native.object, 168)
  for (const model of [17, 31, 32]) {
    first.preacher.native.commandStatus = model
    assert.equal(unitAnimationSource(first.preacher), first.preacher.native)
  }
  first.preacher.native.commandStatus = 17
  assert.equal(first.victim.native.workTarget, first.preacher.id)
  const oldPosition = [first.victim.native.x, first.victim.native.y]
  Object.assign(first.victim, {
    cargo: 3,
    cooldown: 4,
    lift: 1,
    burnTrail: 24,
    supportHeight: 64,
    attackReservation: { flags4: 0, reactionTimer: 0, reactionDuration: 0 },
  })
  first.victim.native.cargo = 300
  first.victim.native.burnTrail = 24
  first.victim.native.timer = 0
  first.w.manaTribes[1].flags2 |= 64
  const sentinel = addUnit(first.w, 'blue', 'warrior', { x: HOME.x + 20, z: HOME.z })
  sentinel.cooldown = 1
  const deaths = first.w.effects.filter(effect => effect.kind === 'death').length
  tick(first.w, 1 / 12)
  const converted = first.w.units.find(unit => unit.kind === 'brave' && unit.team === 'blue')
  assert.ok(converted)
  assert.notEqual(converted, first.victim)
  assert.equal(first.victim.hp, 0)
  assert.equal(first.victim.native.class, 0)
  assert.equal(converted.hp, maxHp('brave'))
  assert.equal(converted.cargo, 0)
  assert.equal(converted.native.cargo, 0)
  assert.equal(converted.cooldown, 0)
  assert.equal(converted.lift, 0)
  for (const field of ['burnTrail', 'supportHeight', 'attackReservation'])
    assert.equal(converted[field], undefined)
  assert.notDeepEqual([converted.native.x, converted.native.y], oldPosition)
  assert.ok(converted.native.speed >= 70 && converted.native.speed <= 86)
  assert.ok(converted.native.flags4 & 0x40000)
  assert.ok(converted.native.flags3 & 0x1000000)
  assert.ok(sentinel.cooldown < 1)
  assert.equal(first.w.effects.filter(effect => effect.kind === 'death').length, deaths)
  assert.ok(!first.w.units.some(u => u.id === first.oldId))

  const second = scenario()
  until(second.w, () => second.victim.native?.state === 23)
  second.w.selected = [second.preacher.id]
  command(second.w, { x: second.preacher.x + 1, z: second.preacher.z + 1 })
  assert.equal(currentPersonOrder(second.w.buildingOrders, second.preacher.native)?.model, 3)
  assert.notEqual(second.victim.native.state, 23)
  assert.equal(second.victim.native.workTarget, 0)

  const exhausted = scenario()
  until(exhausted.w, () => exhausted.victim.native?.state === 23)
  for (let id = 1; id < exhausted.w.buildingOrders.records.length; id++)
    exhausted.w.buildingOrders.records[id].references ||= 1
  exhausted.w.units = [
    exhausted.victim,
    ...exhausted.w.units.filter(unit => unit !== exhausted.victim),
  ]
  const timer = exhausted.victim.native.timer
  exhausted.w.selected = [exhausted.preacher.id]
  command(
    exhausted.w,
    { x: exhausted.preacher.x + 1, z: exhausted.preacher.z + 1 },
    { ctrlKey: true }
  )
  assert.equal(currentPersonOrder(exhausted.w.buildingOrders, exhausted.preacher.native)?.model, 17)
  assert.equal(exhausted.victim.native.state, 23)
  assert.equal(exhausted.victim.native.timer, timer)
  tick(exhausted.w, 1 / 12)
  assert.equal(exhausted.victim.native.state, 23)
  assert.equal(exhausted.victim.native.workTarget, exhausted.preacher.id)

  const overlap = scenario()
  const other = addUnit(overlap.w, 'blue', 'preacher', {
    x: HOME.x + 2,
    z: HOME.z + 1,
  })
  until(overlap.w, () => overlap.victim.native?.state === 23)
  const owner = overlap.victim.native.workTarget,
    nonowner = [overlap.preacher, other].find(person => person.id !== owner)
  assert.ok(nonowner)
  overlap.w.selected = [nonowner.id]
  command(overlap.w, { x: nonowner.x + 1, z: nonowner.z + 1 })
  assert.equal(overlap.victim.native.state, 23)
  assert.equal(overlap.victim.native.workTarget, owner)

  const interrupted = scenario()
  until(interrupted.w, () => interrupted.victim.native?.state === 23)
  interrupted.victim.native.flags2 |= 4
  tick(interrupted.w, 1 / 12)
  assert.notEqual(interrupted.victim.native.state, 23)

  const dying = scenario()
  until(dying.w, () => dying.victim.native?.state === 23)
  dying.preacher.hp = 0
  tick(dying.w, 1 / 12)
  assert.notEqual(dying.victim.native.state, 23)

  const dead = scenario()
  until(dead.w, () => dead.victim.native?.state === 23)
  dead.preacher.native.life = 0
  assert.equal(
    stepConversionVictim(
      {
        randomState: dead.w.randomState,
        loadFlags: dead.w.manaWorld.loadFlags,
        orders: dead.w.buildingOrders,
        tribeFlags: dead.w.manaTribes.map(tribe => tribe.flags2),
      },
      dead.victim.native,
      dead.preacher.native
    ),
    'cancel'
  )

  const listener = scenario()
  until(listener.w, () => listener.victim.native?.state === 23)
  listener.victim.native.substate = 3
  listener.victim.native.counter = 16
  listener.victim.native.timer = 10
  const state = {
    randomState: 1,
    loadFlags: 0,
    orders: listener.w.buildingOrders,
    tribeFlags: listener.w.manaTribes.map(tribe => tribe.flags2),
  }
  assert.equal(
    stepConversionVictim(state, listener.victim.native, listener.preacher.native),
    'waiting'
  )
  assert.equal(state.randomState, 1275068418)
  assert.equal(listener.victim.native.substate, 5)

  listener.preacher.native.speed = 1
  assert.equal(
    stepConversionVictim(state, listener.victim.native, listener.preacher.native),
    'cancel'
  )
  const sermonTimer = listener.preacher.native.timer
  listener.preacher.native.substate = 3
  listener.preacher.native.animationMode = 0
  stepPreachingOrder(
    state,
    listener.preacher.native,
    currentPersonOrder(listener.w.buildingOrders, listener.preacher.native),
    {
      animate: () => {},
      animationDuration: () => 1,
      stop: () => {},
      acquire: () => 0,
      release: () => {},
    }
  )
  assert.equal(listener.preacher.native.animationMode, 1)
  assert.equal(listener.preacher.native.timer, sermonTimer)
})

test('preacher conversion is independent of display refresh rate', () => {
  const run = hz => {
    const { w, preacher, victim, oldId } = scenario(true)
    const clock = { animationTime: 0, animationFrame: 0 }
    for (let frame = 0; frame < hz * 4; frame++) advanceGame(w, clock, 1 / hz)
    const converted = w.units.find(unit => unit.kind === 'brave' && unit.id !== oldId)
    return {
      turn: w.turn,
      randomState: w.randomState,
      order: currentPersonOrder(w.buildingOrders, preacher.native)?.model,
      preacher: [preacher.native.state, preacher.native.substate, preacher.native.timer],
      victim: [!!converted, converted?.team, converted?.native?.state, victim.hp],
    }
  }
  const expected = run(144)
  for (const hz of [5, 30, 60, 120, 240]) assert.deepEqual(run(hz), expected)
})
