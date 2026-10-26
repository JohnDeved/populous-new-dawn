import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, select, command, addUnit } from '../app/model.ts'
import { advanceGame } from '../app/game-clock.ts'
import { processBattles } from '../app/combat-runtime.ts'
import { createMeleePerson, startMeleeKnockback, animateLiveObjects } from '../app/live-people.ts'
import { unitAnimationSource, unitRenderAnimationSource } from '../app/unit-animation-source.ts'
import { meleeAnimationObject, meleeDuration } from '../app/melee.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { stepObjectAnimation } from '../app/animation.ts'
import { finishLevelStart } from './level-start-fixture.mjs'
import rules from '../app/original-rules.json' with { type: 'json' }
import sprites from '../app/original-units.json' with { type: 'json' }

const clock = () => ({ animationTime: 0, animationFrame: 0 })
let ordinary
function ordinaryRecoil() {
  if (!ordinary) {
    const world = createWorld(2), timing = clock()
    finishLevelStart(world)
    select(world, 'shaman')
    assert.equal(command(world, world.units.find(unit => unit.id === 13)), true)
    // Authored people, normal command and actual game clock. No HP, pose, RNG,
    // position or AI edits are used to acquire this recoil.
    for (let turns = 0; turns < 650; turns++) {
      advanceGame(world, timing, 1 / 12)
      const unit = world.units.find(unit => unit.fight?.action === 'recoil' && unit.fight.remaining !== undefined)
      if (unit) { ordinary = { world, timing, id: unit.id }; break }
    }
    assert.ok(ordinary, 'ordinary Mission 2 combat reaches a processed recoil')
  }
  return structuredClone(ordinary)
}

function suppliedRecoil(kind, knockback) {
  // Explicit class/entry fixtures, not ordinary recruitment or original execution.
  const world = createWorld()
  world.units = []
  world.buildings = []
  world.shrines = []
  world.terrain.fill(3)
  world.terrainVersion++
  const target = addUnit(world, 'red', 'warrior', { x: 0, z: 0 }),
    unit = addUnit(world, 'blue', kind, { x: 180 / 256, z: 0 }),
    group = { id: world.nextId++, x: 0, z: 0, angle: 512, members: [target.id, unit.id] }
  world.fights = [group]
  for (const actor of [target, unit]) {
    actor.fight = {
      group: group.id, opponent: actor === unit ? target.id : unit.id,
      action: actor === unit ? 'recoil' : 'strike', animation: actor === unit ? 'idle' : 'strike',
      started: world.turn, remaining: actor === unit ? undefined : 100, knockback,
    }
    actor.fight.motion = createMeleePerson(world, actor)
  }
  return { world, unit, timing: clock() }
}

const phase = p => [p.object, p.draw, p.f1, p.f2]

test('ordinary Mission 2 recoil resets its native phase before the logical animation visit', () => {
  const { world, timing, id } = ordinaryRecoil(), unit = world.units.find(u => u.id === id), person = unit.fight.motion,
    [object, draw] = rules.animationObjects[meleeAnimationObject(unit.kind, 'recoil')]
  assert.equal(unit.fight.nativeRecoilAnimation, true)
  assert.equal(unitAnimationSource(unit), null, 'gameplay animation queries retain their existing owner')
  assert.equal(unitRenderAnimationSource(unit), person)
  assert.deepEqual(phase(person), [object, draw, 0, 0], 'entry f1=1 is consumed by exactly one post-controller logical visit')
  assert.equal(unit.fight.remaining, meleeDuration(unit.kind, 'recoil', unit.fight.knockback) - 1)
  const before = structuredClone(person)
  advanceGame(world, timing, 1 / 24)
  assert.deepEqual(person, before, 'extra presentation visit cannot age recoil')
  advanceGame(world, timing, 1 / 24)
  assert.equal(person.f2, 1)
})

test('all recoil entries use row9, f1=1 and f2=0, retaining original delays and countdowns', () => {
  for (const kind of ['brave', 'warrior', 'preacher', 'spy', 'firewarrior', 'shaman'])
    for (const knockback of [false, true]) {
      const { world, unit, timing } = suppliedRecoil(kind, knockback)
      processBattles(world)
      const person = unit.fight.motion, [object, draw] = rules.animationObjects[meleeAnimationObject(kind, 'recoil')]
      assert.equal(unit.fight.nativeRecoilAnimation, true, `${kind}/${knockback}`)
      assert.deepEqual(phase(person), [object, draw, 1, 0])
      assert.equal(unit.fight.remaining, meleeDuration(kind, 'recoil', knockback) - 1)
      const reference = structuredClone(person), frames = []
      for (let turn = 0; turn < 3; turn++) {
        advanceGame(world, timing, 1 / 12)
        reference.stamp = world.turn
        stepObjectAnimation(reference, { counter: world.turn, levelFlags: 0, levelFlags2: world.levelFlags2 },
          { frameCounts: sprites.frameCounts, modelFrames: [], morphDurations: [] }, () => {})
        assert.deepEqual(phase(person), phase(reference), `${kind}/${knockback}/visit${turn + 1}`)
        frames.push([person.f1, person.f2])
      }
      assert.deepEqual(frames, kind === 'firewarrior' ? [[0, 0], [1, 1], [0, 1]] : [[0, 0], [0, 1], [0, 2]],
        'descriptor18 step1 holds for two logical visits; the other recoil descriptors use step0')
    }
})

test('push initialization retains the owned recoil pose and both frame counters', () => {
  const { world, unit } = suppliedRecoil('firewarrior', true)
  processBattles(world)
  const person = unit.fight.motion
  assert.equal(unit.fight.nativeRecoilAnimation, true)
  // These are an already-owned, saved intermediate phase and an unrelated wall
  // age; the state7 entry must not reconstruct phase from elapsed browser time.
  person.f1 = 0
  person.f2 = 2
  unit.fight.action = 'push'
  world.time = 15
  const before = phase(person)
  startMeleeKnockback(world, unit)
  assert.equal(unit.flight, person)
  assert.deepEqual(phase(person), before)
  assert.equal(unitRenderAnimationSource(unit), person, 'flight retains precedence')
  const reference = structuredClone(person)
  reference.stamp = world.turn
  stepObjectAnimation(reference, { counter: world.turn, levelFlags: 0, levelFlags2: world.levelFlags2 },
    { frameCounts: sprites.frameCounts, modelFrames: [], morphDurations: [] }, () => {})
  animateLiveObjects(world, 'logical')
  assert.deepEqual(phase(person), phase(reference), 'fight/flight alias receives one visit, not two')
})

test('recoil uses the direct native row even with airborne flags, and later controller visits do not reset entry', () => {
  const { world, unit } = suppliedRecoil('firewarrior', false), person = unit.fight.motion,
    [object, draw] = rules.animationObjects[meleeAnimationObject('firewarrior', 'recoil')]
  person.flags2 |= 0x80000
  person.flags4 |= 0x400
  processBattles(world)
  assert.deepEqual(phase(person), [object, draw, 1, 0], 'native cases5/6 bypass the attack airborne-row substitution')
  person.flags2 &= ~0x80000
  person.flags4 &= ~0x400
  person.f1 = 1
  person.f2 = 3
  const remaining = unit.fight.remaining
  processBattles(world)
  assert.deepEqual([person.f1, person.f2], [1, 3])
  assert.equal(unit.fight.remaining, remaining - 1)
})

test('the actual clock retains recoil counters while native settlement and later movement own push art', () => {
  const { world, unit, timing } = suppliedRecoil('firewarrior', true)
  processBattles(world)
  for (let turn = 0; turn < 3; turn++) advanceGame(world, timing, 1 / 12)
  assert.equal(unit.fight.action, 'push')
  assert.equal(unit.fight.remaining, undefined, 'expiry does not process push entry early')
  const person = unit.fight.motion, reference = structuredClone(person), recoilObject = person.object
  advanceGame(world, timing, 1 / 12)
  reference.stamp = world.turn
  stepObjectAnimation(reference, { counter: world.turn, levelFlags: 0, levelFlags2: world.levelFlags2 },
    { frameCounts: sprites.frameCounts, modelFrames: [], morphDurations: [] }, () => {})
  assert.equal(unit.flight, person)
  assert.equal(unit.fight.remaining, 1)
  // Flat-ground settlement follows the controller in this turn: 0x4e9160
  // clears airborne flags and 0x4d3ea0 selects grounded state25's row0.
  const [groundedObject, groundedDraw] = rules.animationObjects[rules.personAnimationObjects[person.model]]
  assert.deepEqual(phase(person), [groundedObject, groundedDraw, reference.f1, reference.f2],
    'settlement may replace art, but push must not reset either retained frame counter')
  assert.equal(person.flags2 & 0x80000, 0)
  assert.equal(person.flags4 & 0x2000, 0)
  advanceGame(world, timing, 1 / 12)
  assert.equal(unit.fight.remaining, 0)
  assert.notEqual(person.object, recoilObject, 'only the second push visit selects its movement row')
})

test('flight interruption owns the animation visit and death retires recoil without trailing advances', () => {
  const { world, unit, timing } = suppliedRecoil('brave', false)
  processBattles(world)
  const person = unit.fight.motion, before = phase(person), flight = { ...person, f2: 2 }
  unit.flight = flight
  assert.equal(unitRenderAnimationSource(unit), flight)
  animateLiveObjects(world, 'logical')
  assert.deepEqual(phase(person), before, 'detached recoil does not advance behind its interruption')
  assert.equal(flight.f1, 0)
  delete unit.flight
  unit.hp = 0
  advanceGame(world, timing, 1 / 12)
  assert.equal(world.units.includes(unit), false)
  assert.deepEqual(phase(person), before, 'removed recoil has no final animation visit')
})

test('current active-recoil checkpoints continue without replaying entry or visits', () => {
  const { world, timing, id } = ordinaryRecoil(), restored = migrateCheckpoint(structuredClone(world)), resumed = structuredClone(timing)
  assert.equal(restored.units.find(u => u.id === id).fight.nativeRecoilAnimation, true)
  for (let turn = 0; turn < 16; turn++) {
    advanceGame(world, timing, 1 / 12)
    advanceGame(restored, resumed, 1 / 12)
    assert.deepEqual(restored, world)
  }
})

test('actual Scene consumes native recoil frames read-only, including the Shaman loop rather than a clamped fallback', async () => {
  const { makeBuilderAnimationScene } = await import('./support/builder-animation-scene.mjs'),
    { shamanNativeDirections } = await import('../app/shaman-appearance.ts'),
    { spriteDirection } = await import('../app/projection.ts'),
    { world, timing, id } = ordinaryRecoil(), unit = world.units.find(u => u.id === id),
    fixture = await makeBuilderAnimationScene(world, { clock: timing }), frames = []
  try {
    assert.equal(unit.kind, 'shaman', 'ordinary first recoil is the authored Shaman')
    for (let visit = 0; visit < 6; visit++) {
      const before = structuredClone(world)
      fixture.render()
      assert.deepEqual(world, before, 'render does not mutate gameplay or animation')
      const person = unit.fight.motion, group = fixture.scene.unitMeshes.get(id),
        call = fixture.personCalls.find(args => args[0] === group),
        directions = shamanNativeDirections(unit.team, person.object),
        direction = spriteDirection(Math.round(fixture.scene.cameraBearing * 1024 / Math.PI), Math.round((Math.PI - unit.heading) * 1024 / Math.PI))
      assert.deepEqual(call[2], directions)
      assert.equal(call[3], 0)
      assert.equal(call[4], false)
      assert.equal(call[5], person.f2)
      assert.equal(group.userData.frame, directions[direction].frames[person.f2])
      assert.ok(group.userData.layers.some(layer => layer.visible))
      frames.push(person.f2)
      if (visit < 5) fixture.advance(1 / 12)
    }
    assert.deepEqual(frames, [0, 1, 2, 3, 4, 0], 'native five-frame source loops during the seven-turn Shaman recoil')
  } finally { fixture.close() }
})

test('recoil state is refresh-independent and pause preserves its complete current checkpoint', () => {
  const initial = ordinaryRecoil(), results = []
  for (const schedule of [[1 / 30], [1 / 60], [1 / 120], [1 / 144], [0.007, 0.013, 0.28, 0.6, 0.1]]) {
    const { world, timing } = structuredClone(initial)
    let remaining = 1
    for (let i = 0; remaining > 1e-10; i++) {
      const dt = Math.min(remaining, schedule[i % schedule.length])
      advanceGame(world, timing, dt)
      remaining -= dt
    }
    world.pendingTime = 0
    timing.animationTime = 0
    results.push(world)
  }
  for (const world of results) assert.deepEqual(world, results[0])
  const { world, timing } = ordinaryRecoil()
  world.paused = true
  const before = structuredClone(world)
  advanceGame(world, timing, 20)
  assert.deepEqual(world, before)
  world.paused = false
  world.land.landFlags |= 2
  const landPaused = structuredClone(world)
  advanceGame(world, timing, 1 / 24)
  assert.deepEqual(world.units, landPaused.units, 'native land pause freezes recoil owner')
})

test('coexisting native attack and recoil markers retain one physical render owner across fight phases and current checkpoints', () => {
  const { world, unit } = suppliedRecoil('shaman', true)
  unit.fight.nativeAttackAnimation = true
  processBattles(world)
  assert.equal(unit.fight.nativeRecoilAnimation, true)
  // Explicit branch-ownership fixture, not an ordinary encounter or browser run.
  for (const action of ['recoil', 'push', 'approach', 'attack']) {
    unit.fight.action = action
    assert.equal(unitRenderAnimationSource(unit), unit.fight.motion)
    const restored = migrateCheckpoint(structuredClone(world))
    const actor = restored.units.find(actor => actor.id === unit.id)
    assert.equal(actor.fight.nativeAttackAnimation, true)
    assert.equal(actor.fight.nativeRecoilAnimation, true)
    assert.equal(unitRenderAnimationSource(actor), actor.fight.motion)
  }
})
