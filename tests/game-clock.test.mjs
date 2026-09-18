import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, command, tick, cast, placeBuilding, addUnit } from '../app/model.ts'
import { advanceGame } from '../app/game-clock.ts'
import { UnitMotion } from '../app/unit-motion.ts'
import { addMessage, messageTop, stepMessages } from '../app/messages.ts'

const schedules = [
  ...[5, 30, 60, 120, 144, 240].map(hz => [1 / hz]),
  [0.007, 0.013, 0.28, 0.6, 0.1],
]
function advance(w, clock, seconds, schedule) {
  for (let i = 0; seconds > 1e-10; i++) {
    const dt = Math.min(seconds, schedule[i % schedule.length])
    advanceGame(w, clock, dt)
    seconds -= dt
  }
}
test('render cadence cannot change gameplay, RNG or owned animation state', () => {
  for (const scenario of ['movement', 'celebration', 'construction', 'blast', 'combat'])
    for (const speed of [0.25, 1, 2]) {
      const results = schedules.map((schedule, index) => {
        const w = createWorld(),
          clock = { animationTime: 0, animationFrame: 0 }
        // The first schedule is the unchanged simulation; all others observe turns.
        if (index) {
          const motion = new UnitMotion()
          clock.beforeTurn = () => motion.beforeTurn(w)
          clock.afterTurn = () => motion.afterTurn(w)
        }
        w.speed = speed
        if (scenario === 'celebration') {
          w.units = w.units.filter(u => u.team === 'blue')
          w.turn = 31
          w.ai.variables[57] = 1
          tick(w, 1 / 12)
          assert.equal(w.status, 'won')
        } else if (scenario === 'construction') {
          w.manaWorld.gameFlags = 32
          w.selected = w.units.filter(u => u.team === 'blue' && u.kind === 'brave').map(u => u.id)
          assert.ok(placeBuilding(w, 'hut', { x: -2, z: 32 }))
          const working = () =>
            w.units.some(
              u => u.builder?.task === 2 && u.builder.phase === 4 && u.builder.person?.timer > 2
            )
          for (let i = 0; i < 1000 && !working(); i++) {
            tick(w, 1 / 12)
          }
          assert.ok(working(), 'construction setup must reach an active work pose')
        } else if (scenario === 'blast') {
          w.manaWorld.gameFlags = 32
          const shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
          w.selected = [shaman.id]
          assert.ok(cast(w, 'blast', { x: shaman.x + 2, z: shaman.z + 2 }))
          assert.ok(w.projectiles.length)
        } else if (scenario === 'combat') {
          w.terrain.fill(3)
          w.terrainVersion++
          w.units = []
          w.buildings = []
          const a = addUnit(w, 'blue', 'warrior', { x: 0, z: 0 }),
            b = addUnit(w, 'red', 'brave', { x: 180 / 256, z: 0 }),
            group = { id: w.nextId++, x: 0, z: 0, angle: 512, members: [a.id, b.id] }
          w.fights = [group]
          for (const [unit, other] of [
            [a, b],
            [b, a],
          ])
            unit.fight = {
              group: group.id,
              opponent: other.id,
              action: 'ready',
              started: 0,
              remaining: 0,
            }
        } else {
          w.selected = w.units.filter(u => u.team === 'blue').map(u => u.id)
          command(w, { x: 7, z: 33 })
        }
        advance(w, clock, 4, schedule)
        assert.equal(clock.animationFrame, 96)
        assert.ok(clock.animationTime < 1e-9)
        assert.ok(w.pendingTime < 1e-9)
        return { ...w, pendingTime: 0 }
      })
      for (const result of results)
        for (const key of Object.keys(result))
          assert.deepEqual(result[key], results[0][key], `${scenario}, speed=${speed}, ${key}`)
    }
})
test('paused time stays paused; long active frames retain elapsed time', () => {
  const w = createWorld(),
    clock = { animationTime: 0, animationFrame: 0 },
    turn = w.turn
  advanceGame(w, clock, 2)
  assert.equal(w.turn, turn + 24)
  assert.equal(clock.animationFrame, 48)
  const snapshot = JSON.stringify(w)
  w.paused = true
  advanceGame(w, clock, 300)
  w.paused = false
  assert.equal(JSON.stringify(w), snapshot)
  assert.equal(clock.animationFrame, 48)
  for (const dt of [-1, NaN, Infinity]) assert.throws(() => advanceGame(w, clock, dt), RangeError)
})

test('campaign messages use the presentation clock and freeze while paused', () => {
  const results = schedules.map(schedule => {
    const w = createWorld(),
      clock = { animationTime: 0, animationFrame: 0 }
    w.speed = 0
    for (const [age, stringId] of [
      [3, 615],
      [2, 616],
      [1, 611],
    ]) {
      const slot = addMessage(w.messages, stringId, () => 0)
      w.messages.slots[slot].age = age
      if (age === 3) w.messages.slots[slot].flags |= 0x20000
    }
    advance(w, clock, 5, schedule)
    return w.messages.slots.filter(Boolean).map(message => ({
      top: messageTop(message),
      speed: message.speed,
      flags: message.flags,
    }))
  })
  results.forEach(result => assert.deepEqual(result, results[0]))
  assert.deepEqual(
    results[0].map(message => message.top),
    [455, 430, 405]
  )
  assert.equal(results[0][0].flags & 0x20000, 0, 'settled pending message is consumed')
  assert.equal(results[0][0].flags & 2, 2, 'consumed popup produces the native transient draw bit')

  const sounded = createWorld(),
    soundedClock = { animationTime: 0, animationFrame: 0 }
  sounded.speed = 0
  addMessage(sounded.messages, 615, () => 0)
  advanceGame(sounded, soundedClock, 5)
  assert.ok(sounded.sounds.some(event => event.cue === 0xe4))

  const w = createWorld(),
    clock = { animationTime: 0, animationFrame: 0 }
  const pausedSlot = addMessage(w.messages, 615, () => 0)
  w.messages.slots[pausedSlot].flags |= 0x20000
  w.paused = true
  const before = structuredClone(w.messages)
  advanceGame(w, clock, 5)
  assert.deepEqual(w.messages, before)
})

test('campaign pending auto-open waits for settled motion and consumes one oldest record per presentation visit', () => {
  const entering = createWorld(),
    enteringSlot = addMessage(entering.messages, 615, () => 0)
  entering.messages.slots[enteringSlot].flags |= 0x20000
  entering.messages.slots[enteringSlot].speed = 1
  entering.messages.slots[enteringSlot].position = 0
  stepMessages(entering.messages)
  assert.equal(entering.messages.slots[enteringSlot].flags & 0x20000, 0x20000)
  assert.equal(entering.messages.slots[enteringSlot].flags & 2, 0)

  const state = createWorld().messages,
    firstSlot = addMessage(state, 615, () => 0),
    secondSlot = addMessage(state, 616, () => 0),
    first = state.slots[firstSlot],
    second = state.slots[secondSlot]
  first.age = 2
  second.age = 1
  first.flags |= 0x20000
  second.flags |= 0x20000
  first.speed = 1
  second.speed = 1
  const firstTarget = 0x10000 - first.height
  first.position = firstTarget - 1
  second.position = firstTarget - second.height - 1

  stepMessages(state)
  assert.equal(first.flags & 0x20000, 0)
  assert.equal(first.flags & 2, 2)
  assert.equal(second.flags & 0x20000, 0x20000, 'only one pending popup is consumed per visit')
  assert.equal(second.flags & 2, 0)

  stepMessages(state)
  assert.equal(second.flags & 0x20000, 0)
  assert.equal(second.flags & 2, 2)
})
