import assert from 'node:assert/strict'
import test from 'node:test'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import { addUnit, command, HOME, setSelection, unitAnimationSource } from '../app/model.ts'
import { createLivePerson, setLivePersonAnimation, animateLiveObjects } from '../app/live-people.ts'
import { appendLiveOrders, stepLivePreaching } from '../app/live-movement.ts'
import { currentPersonOrder, emptyPersonOrder, writePersonOrder } from '../app/person-orders.ts'
import { advanceGame } from '../app/game-clock.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { random } from '../app/native-math.ts'
import { AUDIO_CUES, playWorldSounds, Soundscape } from '../app/audio.ts'
import nativeSound from '../app/original-sound.json' with { type: 'json' }

const clock = () => ({ animationTime: 0, animationFrame: 0 })
// Supplied phase/seed isolates the real live adapter and logical clock. These
// mechanics fixtures are not an ordinary acquisition or natural gesture witness.
function sermon(seed = 0, team = 'blue') {
  const world = createStartedWorld()
  retainFixtureUnits(world, unit => unit.kind === 'shaman')
  const unit = addUnit(world, team, 'preacher', { x: HOME.x + 2, z: HOME.z })
  unit.native = createLivePerson(world, unit)
  const order = emptyPersonOrder()
  writePersonOrder(order, 17, unit.native.x, unit.native.y, 0)
  assert.equal(appendLiveOrders(world, [unit], order, true).count, 1)
  const person = unit.native
  Object.assign(person, {
    substate: 3, counter: 15, speed: 0, timer: 0, statusFlags: 2,
    assignment: 0, animationMode: 0,
    flags2: person.flags2 & ~0x40002004,
    goalX: person.x, goalY: person.y,
  })
  setLivePersonAnimation(world, person, 97)
  person.f1 = person.f2 = 0
  world.cosmeticRandom.randomState = seed
  return { world, unit, person, timing: clock() }
}
const phase = p => ({
  object: p.object, draw: p.draw, f1: p.f1, f2: p.f2, statusFlags: p.statusFlags,
  assignment: p.assignment, timer: p.timer, counter: p.counter, stamp: p.stamp,
})

for (const [seed, source, frames] of [[0, 176, 10], [3, 184, 18]]) {
  test(`live sermon selects original source${source} with the shared cosmetic RNG and returns on its logical boundary`, () => {
    const { world, unit, person, timing } = sermon(seed)
    const owner = world.cosmeticRandom, simulation = world.randomState
    const expected = { randomState: seed }
    random(expected)
    stepLivePreaching(world, unit)
    assert.equal(unitAnimationSource(unit), person)
    assert.equal(person.object, source)
    assert.deepEqual([person.draw, person.f1, person.f2, person.statusFlags & 1], [14, 1, 0, 1])
    assert.equal(world.cosmeticRandom, owner)
    assert.equal(owner.randomState, expected.randomState)
    assert.equal(world.randomState, simulation, 'an empty listener scan does not consume simulation RNG')
    animateLiveObjects(world, 'logical')
    assert.deepEqual([person.f1, person.f2], [0, 0])
    for (let frame = 1; frame < frames; frame++) {
      advanceGame(world, timing, 1 / 12)
      assert.deepEqual([person.object, person.f1, person.f2], [source, 0, frame])
    }
    advanceGame(world, timing, 1 / 12)
    assert.deepEqual([person.object, person.f1, person.f2, person.statusFlags & 1], [168, 0, 1, 0])
  })

  test(`source${source} checkpoints preserve active ownership, phase and RNG without a second birth`, () => {
    const original = sermon(seed)
    stepLivePreaching(original.world, original.unit)
    assert.equal(original.person.object, source)
    animateLiveObjects(original.world, 'logical')
    advanceGame(original.world, original.timing, 2 / 12)
    const saved = structuredClone(original.world)
    const restored = migrateCheckpoint(structuredClone(saved)), timing = clock()
    const unit = restored.units.find(u => u.id === original.unit.id)
    assert.deepEqual(phase(unit.native), phase(original.person))
    assert.deepEqual(restored.cosmeticRandom, saved.cosmeticRandom)
    assert.equal(unitAnimationSource(unit), unit.native)
    for (let turn = 0; turn < frames; turn++) {
      advanceGame(original.world, original.timing, 1 / 12)
      advanceGame(restored, timing, 1 / 12)
      assert.deepEqual(phase(unit.native), phase(original.person))
      assert.deepEqual(restored.cosmeticRandom, original.world.cosmeticRandom)
      assert.equal(restored.randomState, original.world.randomState)
    }
    assert.equal(unit.native.statusFlags & 1, 0)
    assert.equal(unit.native.object, 168)
  })
}

test('live entry and loop setters restore first-frame delay and loop assignment without clearing other bits', () => {
  const { world, unit, person } = sermon(1)
  Object.assign(person, { substate: 2, counter: 6, flags2: person.flags2 | 0x40000000,
    f1: 7, f2: 2, assignment: 0x100 })
  stepLivePreaching(world, unit)
  assert.deepEqual([person.object, person.f1, person.f2, person.timer], [160, 1, 0, 7])
  Object.assign(person, { substate: 3, counter: 6, flags2: person.flags2 | 0x40000000,
    f1: 7, f2: 2 })
  stepLivePreaching(world, unit)
  assert.deepEqual([person.object, person.f1, person.f2, person.assignment], [168, 1, 0, 0x110])
})

test('unsuccessful gesture decisions advance the shared cosmetic stream once without taking simulation randomness', () => {
  for (const seed of [1, 2]) {
    const { world, unit, person } = sermon(seed), expected = { randomState: seed }
    random(expected)
    const simulation = world.randomState
    stepLivePreaching(world, unit)
    assert.equal(person.object, 168)
    assert.equal(person.statusFlags & 1, 0)
    assert.equal(world.cosmeticRandom.randomState, expected.randomState)
    assert.equal(world.randomState, simulation)
  }
})

test('a paused logical clock preserves an active gesture and presentation visits do not advance it', () => {
  const { world, unit, person, timing } = sermon()
  stepLivePreaching(world, unit)
  assert.equal(person.object, 176)
  const before = phase(person), randomBefore = world.cosmeticRandom.randomState
  animateLiveObjects(world, 'presentation')
  assert.deepEqual(phase(person), before)
  world.paused = true
  advanceGame(world, timing, 1)
  assert.deepEqual(phase(person), before)
  assert.equal(world.cosmeticRandom.randomState, randomBefore)
})

test('flight and encounter owners suppress the detached sermon animation; ordinary movement supersedes it', () => {
  const { world, unit, person } = sermon()
  stepLivePreaching(world, unit)
  assert.equal(person.object, 176)
  for (const owner of ['flight', 'fight']) {
    const alternate = { ...person, f1: 0, f2: 0 }
    if (owner === 'flight') unit.flight = alternate
    else unit.fight = { action: 'encounter', motion: alternate }
    assert.equal(unitAnimationSource(unit), alternate)
    const before = phase(person)
    animateLiveObjects(world, 'logical')
    assert.deepEqual(phase(person), before)
    assert.equal(alternate.f2, 1)
    delete unit.flight
    delete unit.fight
  }
  setSelection(world, [unit.id])
  assert.equal(command(world, { x: unit.x + 5, z: unit.z + 5 }), true)
  assert.equal(currentPersonOrder(world.buildingOrders, unit.native)?.model, 3)
  assert.ok(![176, 184].includes(unitAnimationSource(unit)?.object))
})

for (const [team, cue] of [['blue', 51], ['red', 189]]) {
  test(`live ${team} sermon requests cue${cue} with its actual owner before the empty scan clears listeners`, () => {
    const { world, unit, person } = sermon(0, team)
    person.assignment |= 64
    const serial = world.soundSerial, simulation = world.randomState
    stepLivePreaching(world, unit)
    const event = world.sounds.find(e => e.serial === serial + 1)
    assert.deepEqual(event, { serial: serial + 1, cue, x: unit.x, z: unit.z, turn: world.turn, owner: unit.id })
    assert.ok(person.flags4 & 16)
    assert.equal(person.assignment & 64, 0, 'cue observes assignment before acquisition')
    assert.equal(world.randomState, simulation)
    for (const enabled of [false, true]) {
      person.flags4 |= 16
      const audio = new Soundscape()
      audio.enabled = enabled
      if (enabled) { audio.context = {}; audio.master = {} }
      const scene = { world, soundSerial: serial, ownedSounds: new Map(),
        viewPoint: unit, screen: () => ({ x: 0 }), onSound: audio.cue.bind(audio) }
      playWorldSounds(scene)
      assert.equal(person.flags4 & 16, 0, enabled ? 'missing-buffer completion clears owner' : 'disabled completion clears owner')
      assert.equal(scene.ownedSounds.size, 0)
    }
  })
}

test('newly acquired listeners do not retroactively request a sermon cue', () => {
  const { world, unit, person } = sermon()
  addUnit(world, 'red', 'brave', { x: unit.x + 1, z: unit.z })
  const serial = world.soundSerial
  stepLivePreaching(world, unit)
  assert.equal(person.object, 176)
  assert.ok(person.assignment & 64)
  assert.equal(world.soundSerial, serial)
})

test('both sermon cue families have actual sample preload coverage', () => {
  for (const cue of [51, 189]) {
    assert.ok(AUDIO_CUES.includes(cue), `cue${cue} must be loaded before playback`)
    const { bank, samples } = nativeSound.cues[cue]
    assert.equal(samples.length, 4)
    for (const sample of samples)
      assert.ok(existsSync(fileURLToPath(new URL(`../public/original/audio/${bank}-${sample}.wav`, import.meta.url))))
  }
})
