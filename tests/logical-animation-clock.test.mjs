import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, effect, tick } from '../app/model.ts'
import { advanceGame, afterCurrentGameTurn } from '../app/game-clock.ts'
import { createLivePerson, setLivePersonAnimation, animateLiveObjects } from '../app/live-people.ts'
import { animationUsesLogicalVisits, stepObjectAnimation } from '../app/animation.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

const clock = () => ({ animationTime: 0, animationFrame: 0 })

// A reserved nonzero-state person is still visited by the original primary
// dispatcher, even though the current person loop takes its state14 early return.
function reservedPerson() {
  const world = createWorld(),
    unit = world.units.find(u => u.team === 'blue' && u.kind === 'brave'),
    person = createLivePerson(world, unit)
  world.manaWorld.gameFlags = 32
  person.state = 14
  setLivePersonAnimation(world, person, rules.personAnimationObjects[person.model])
  person.f1 = person.f2 = 0
  unit.native = person
  return { world, unit, person, timing: clock() }
}

test('ordinary native constructors restore the logical gate without adding interpolation behavior', () => {
  const { world, unit } = reservedPerson()
  for (const kind of ['brave', 'warrior', 'preacher', 'spy', 'firewarrior', 'shaman']) {
    const person = createLivePerson(world, { ...unit, kind })
    assert.equal(person.flags3 & 0x40000, 0x40000, kind)
    assert.equal(person.flags3 & 0x100, 0, 'modern interpolation keeps its existing owner')
  }
  const wild = createLivePerson(world, { ...unit, team: 'wild' })
  assert.equal(wild.model, 1)
  assert.equal(wild.flags3 & 0x40000, 0, 'unproved model1 retains its existing adapter')
})

test('native person and Splash frames wait for logical visits while clear-bit effects keep 24 Hz', () => {
  const { world, unit, person, timing } = reservedPerson(),
    splash = effect(world, 'splash', unit, true),
    ordinary = effect(world, 'birth', unit, true)
  advanceGame(world, timing, 1 / 24)
  assert.equal(world.turn, 0)
  assert.equal(person.f2, 0)
  assert.equal(splash.animation.f1, 0)
  assert.equal(ordinary.animation.f1, 4)
  advanceGame(world, timing, 1 / 24)
  assert.equal(world.turn, 1)
  assert.equal(person.f2, 1)
  assert.equal(person.stamp, 1)
  assert.equal(splash.animation.f1, 4)
  assert.equal(splash.animation.stamp, 1)
  assert.equal(ordinary.animation.f1, 8)
  assert.equal(timing.animationFrame, 2, 'presentation frequency is unchanged')
})

test('each catch-up turn observes the prior frame before one post-observer logical advance', () => {
  const { world, person, timing } = reservedPerson(), events = []
  world.speed = 4
  timing.beforeTurn = () => {
    events.push(['before', person.f2])
    assert.equal(afterCurrentGameTurn(timing, () => events.push(['queued', person.f2])), true)
  }
  timing.afterTurn = () => events.push(['after', person.f2])
  advanceGame(world, timing, 1 / 4)
  assert.equal(world.turn, 12)
  assert.equal(timing.animationFrame, 6)
  assert.deepEqual(events, Array.from({ length: 12 }, (_, turn) => [
    ['before', turn % 6], ['after', turn % 6], ['queued', turn % 6],
  ]).flat())
  assert.equal(person.stamp, 12)
  assert.equal(person.f2, 0)
})

test('ordinary owner aliases and a post-turn handoff never advance twice', () => {
  for (const owner of ['native', 'flight', 'fight', 'entry', 'builder']) {
    const { world, unit, person, timing } = reservedPerson()
    timing.afterTurn = () => {
      unit.native = null
      if (owner === 'native') unit.native = person
      if (owner === 'flight') {
        unit.flight = person
        unit.native = person // Same object under two adapter names.
      }
      if (owner === 'fight') unit.fight = { action: 'encounter', motion: person }
      if (owner === 'entry') unit.entry = { person, orders: world.buildingOrders }
      if (owner === 'builder') unit.builder = { task: 2, phase: 4, person }
    }
    advanceGame(world, timing, 1 / 12)
    assert.equal(person.f2, 1, owner)
    assert.equal(person.stamp, world.turn, owner)
  }
})

test('state0 and removed gated sources do not fall through to presentation advancement', () => {
  for (const field of ['state', 'class']) {
    const { world, person, timing } = reservedPerson()
    timing.afterTurn = () => { person[field] = 0; person.f2 = 3 }
    advanceGame(world, timing, 1 / 12)
    assert.equal(person.f2, 3, field)
    advanceGame(world, timing, 1 / 24)
    assert.equal(person.f2, 3, `${field}: no intervening logical turn`)
  }
})

test('pause, land pause and speed changes preserve owned logical animation visits', () => {
  const { world, person, timing } = reservedPerson()
  world.paused = true
  advanceGame(world, timing, 3)
  assert.equal(person.f2, 0)
  world.paused = false
  world.land.landFlags |= 2
  advanceGame(world, timing, 1)
  assert.equal(world.turn, 0)
  assert.equal(person.f2, 0)
  world.land.landFlags &= ~2
  advanceGame(world, timing, 1 / 12)
  assert.equal(person.f2, 1)
  world.speed = 2
  advanceGame(world, timing, 1 / 12)
  assert.equal(world.turn, 3)
  assert.equal(person.f2, 3)
})

test('legacy save aliases gain the gate without resetting frames or replaying on a new Scene clock', () => {
  const { world, unit, person, timing } = reservedPerson()
  advanceGame(world, timing, 1 / 12)
  const savedFrame = person.f2
  for (const [index, alias] of ['native', 'flight', 'entry', 'builder', 'fight'].entries()) {
    const record = { ...person, flags3: 0x88000, f1: index & 1, f2: index, stamp: 123 + index }
    if (alias === 'native' || alias === 'flight') unit[alias] = record
    if (alias === 'entry') unit.entry = { person: record, orders: world.buildingOrders }
    if (alias === 'builder') unit.builder = { task: 2, person: record }
    if (alias === 'fight') unit.fight = { action: 'encounter', motion: record }
  }
  const restored = migrateCheckpoint(structuredClone(world)),
    actor = restored.units.find(u => u.id === unit.id),
    records = [actor.native, actor.flight, actor.entry.person, actor.builder.person, actor.fight.motion]
  for (const [index, record] of records.entries()) {
    assert.equal(record.flags3, 0xc8000)
    assert.deepEqual([record.f1, record.f2, record.stamp], [index & 1, index, 123 + index])
  }
  actor.native = { ...person, f2: savedFrame }
  actor.flight = undefined
  actor.entry = actor.builder = undefined
  actor.fight = null
  const resumedClock = clock()
  advanceGame(restored, resumedClock, 1 / 24)
  assert.equal(actor.native.f2, savedFrame, 'new presentation clock cannot replay a saved turn')
  advanceGame(restored, resumedClock, 1 / 24)
  assert.equal(actor.native.f2, (savedFrame + 1) % 6)
})

test('a Splash allocated after processing gets one animation visit but no invented lifetime visit', () => {
  const { world, unit, timing } = reservedPerson()
  let splash
  timing.afterTurn = () => { splash ??= effect(world, 'splash', unit, true) }
  advanceGame(world, timing, 1 / 12)
  assert.equal(splash.age, 0)
  assert.equal(splash.turnsRemaining, 16)
  assert.equal(splash.animation.f1, 4)
  advanceGame(world, timing, 1 / 12)
  assert.equal(splash.age, 1 / 12)
  assert.equal(splash.turnsRemaining, 15)
  assert.equal(splash.animation.f1, 8)
  splash.turnsRemaining = 1
  const frame = splash.animation.f1
  advanceGame(world, timing, 1 / 12)
  assert.equal(world.effects.includes(splash), false)
  assert.equal(splash.animation.f1, frame, 'retired effects receive no trailing animation visit')
})

test('morph transitions keep one presentation owner even on coincident logical boundaries', () => {
  for (const transition of [false, true]) {
    const { world, person, timing } = reservedPerson()
    person.draw = 4
    person.renderFlags = transition ? 0x1000 : 0
    person.morphTimer = 0
    person.morphFrames = 20
    advanceGame(world, timing, 1 / 12)
    assert.equal(person.f1, transition ? 0 : 4)
    assert.equal(person.morphTimer, transition ? 8 : 0)
  }
  // Mode3 is not currently produced by the live person adapter. Verify its
  // native branch contract with the model table supplied by that consumer.
  const { person } = reservedPerson()
  person.draw = 3
  person.renderFlags = 0
  person.morph = 0
  assert.equal(animationUsesLogicalVisits(person), false)
  stepObjectAnimation(person, { counter: 99, levelFlags: 0, levelFlags2: 0 }, {
    frameCounts: [], modelFrames: [[40, 41, 42, 43, 44, 45, 46, 47, 8]], morphDurations: [],
  }, () => {})
  assert.equal(person.f1, 2, 'model sequence advances despite a mismatched logical stamp')
})

test('Firewarrior descriptor holds are measured in eligible logical visits', () => {
  const { world, unit, timing } = reservedPerson()
  unit.kind = 'firewarrior'
  const person = createLivePerson(world, unit)
  person.state = 14
  setLivePersonAnimation(world, person, rules.personAnimationObjects[person.model])
  person.f1 = person.f2 = 0
  unit.native = person
  assert.equal(person.draw, 18)
  const frames = []
  for (let i = 0; i < 6; i++) {
    advanceGame(world, timing, 1 / 12)
    frames.push([person.f1, person.f2])
  }
  assert.deepEqual(frames, [[1, 1], [0, 1], [1, 2], [0, 2], [1, 3], [0, 3]])
})

test('post-turn source replacement visits only the active record, including at turn wrap', () => {
  const { world, unit, person, timing } = reservedPerson(),
    replacement = { ...person }
  world.turn = 0xffffffff
  timing.afterTurn = () => { unit.native = replacement }
  advanceGame(world, timing, 1 / 12)
  assert.equal(world.turn, 0)
  assert.equal(person.f2, 0, 'detached owner receives no trailing frame')
  assert.equal(replacement.f2, 1)
  assert.equal(replacement.stamp, 0)
})

test('direct simulation ticks and presentation calls do not manufacture logical visits', () => {
  const { world, person } = reservedPerson()
  tick(world, 1 / 12)
  assert.equal(world.turn, 1)
  assert.equal(person.f2, 0)
  animateLiveObjects(world)
  assert.equal(person.f2, 0)
  person.model = 1
  person.flags3 &= ~0x40000
  animateLiveObjects(world)
  assert.equal(person.f2, 1, 'unproved model1 keeps its previous presentation path')
})
