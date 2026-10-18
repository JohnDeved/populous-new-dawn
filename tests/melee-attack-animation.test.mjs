import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, select, command, unitAnimationSource, addUnit, canPickUnit, canOrder } from '../app/model.ts'
import { advanceGame } from '../app/game-clock.ts'
import { createMeleePerson } from '../app/live-people.ts'
import { processBattles } from '../app/combat-runtime.ts'
import { unitRenderAnimationSource } from '../app/unit-animation-source.ts'
import { meleeAnimationObject, meleeDuration } from '../app/melee.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { finishLevelStart } from './level-start-fixture.mjs'
import rules from '../app/original-rules.json' with { type: 'json' }

const clock = () => ({ animationTime: 0, animationFrame: 0 })
const attacks = ['attack', 'strike', 'special']
let attackStart
function ordinaryAttack() {
  if (!attackStart) {
    const world = createWorld(2), timing = clock()
    finishLevelStart(world)
    select(world, 'shaman')
    assert.equal(command(world, world.units.find(unit => unit.id === 13)), true)
    // Authored people and normal command/clock; no position, health, RNG or AI edits.
    for (let turns = 0; turns < 600; turns++) {
      advanceGame(world, timing, 1 / 12)
      const unit = world.units.find(unit => attacks.includes(unit.fight?.action))
      if (unit) {
        attackStart = { world, timing, id: unit.id }
        break
      }
    }
    assert.ok(attackStart, 'ordinary Mission 2 combat reaches an attack')
  }
  return structuredClone(attackStart)
}

function suppliedAttack(kind, action) {
  // Controlled action-entry coverage, not an ordinary recruitment/combat witness.
  const world = createWorld()
  world.units = []
  world.buildings = []
  world.shrines = []
  world.terrain.fill(3)
  world.terrainVersion++
  const target = addUnit(world, 'red', 'warrior', { x: 0, z: 0 })
  const unit = addUnit(world, 'blue', kind, { x: 180 / 256, z: 0 })
  const battle = { id: world.nextId++, x: 0, z: 0, angle: 512, members: [target.id, unit.id] }
  world.fights = [battle]
  for (const actor of [target, unit]) {
    actor.fight = {
      group: battle.id,
      opponent: actor === unit ? target.id : unit.id,
      action: actor === unit ? action : 'strike',
      animation: actor === unit ? action : 'strike',
      started: world.turn,
      remaining: actor === unit ? undefined : 100,
    }
    actor.fight.motion = createMeleePerson(world, actor)
  }
  return { world, unit, target, timing: clock() }
}

function expectedPose(unit) {
  return rules.animationObjects[meleeAnimationObject(unit.kind, unit.fight.action)]
}

test('ordinary Mission 2 attack adopts its native pose and logical frame owner', () => {
  const { world, timing, id } = ordinaryAttack()
  const unit = world.units.find(unit => unit.id === id), fight = unit.fight, person = fight.motion
  const [object, draw] = expectedPose(unit)
  assert.equal(fight.nativeAttackAnimation, true)
  assert.equal(unitRenderAnimationSource(unit), person)
  assert.deepEqual([person.object, person.draw, person.f1, person.f2], [object, draw, 0, 0])
  assert.equal(fight.remaining, meleeDuration(unit.kind, fight.action) - 1)
  const first = structuredClone(person)
  advanceGame(world, timing, 1 / 24)
  assert.deepEqual(person, first, 'an extra presentation visit cannot consume a combat frame')
  advanceGame(world, timing, 1 / 24)
  assert.equal(person.f2, 1)
})

test('all attack entries select original rows and Firewarrior descriptor delay owns advancement', () => {
  for (const kind of ['brave', 'warrior', 'preacher', 'spy', 'firewarrior', 'shaman']) {
    for (const action of attacks) {
      const { world, unit, timing } = suppliedAttack(kind, action)
      processBattles(world)
      const person = unit.fight.motion, [object, draw] = expectedPose(unit)
      assert.equal(unit.fight.nativeAttackAnimation, true, `${kind}/${action}`)
      assert.equal(unitRenderAnimationSource(unit), person)
      assert.deepEqual([person.object, person.draw, person.f1, person.f2], [object, draw, 1, 0])
      assert.equal(unit.fight.remaining, meleeDuration(kind, action) - 1)
      advanceGame(world, timing, 1 / 12)
      assert.equal(person.f2, 0, 'the reset delay is consumed before frame 1')
      advanceGame(world, timing, 1 / 12)
      assert.equal(person.f2, 1)
      advanceGame(world, timing, 1 / 12)
      if (unit.fight?.nativeAttackAnimation && attacks.includes(unit.fight.action)) {
        assert.equal(person.f2, kind === 'firewarrior' ? 1 : 2)
      }
    }
  }
})

test('active native attack checkpoints continue frames without replaying entry or damage', () => {
  const { world, timing, id } = ordinaryAttack()
  const restored = migrateCheckpoint(structuredClone(world)), resumed = structuredClone(timing)
  for (let turn = 0; turn < 10; turn++) {
    advanceGame(world, timing, 1 / 12)
    advanceGame(restored, resumed, 1 / 12)
    assert.deepEqual(restored, world)
  }
  assert.ok(world.units.some(unit => unit.id === id))
})

test('legacy active attacks retain fallback and flight still overrides the native attack owner', () => {
  const { world, unit } = suppliedAttack('firewarrior', 'attack')
  unit.fight.remaining = 5
  assert.equal(unitRenderAnimationSource(unit), null, 'unmarked legacy poses are not guessed')
  processBattles(world)
  assert.equal(unitRenderAnimationSource(unit), null, 'mid-action legacy saves are not reset')
  unit.fight.nativeAttackAnimation = true
  assert.equal(unitRenderAnimationSource(unit), unit.fight.motion)
  const flight = { ...unit.fight.motion }
  unit.flight = flight
  assert.equal(unitRenderAnimationSource(unit), flight)
  unit.flight = undefined
  unit.fight.action = 'recoil'
  assert.equal(unitRenderAnimationSource(unit), null, 'recoil/knockback keep their existing owner')
})

test('actual Scene attack frames consume the retained native phase without mutating the world', async () => {
  const { makeBuilderAnimationScene } = await import('./support/builder-animation-scene.mjs')
  const { shamanNativeDirections } = await import('../app/shaman-appearance.ts')
  const { spriteDirection } = await import('../app/projection.ts')
  const { default: sprites } = await import('../app/original-units.json', { with: { type: 'json' } })
  const { world, timing, id } = ordinaryAttack(), unit = world.units.find(unit => unit.id === id)
  const fixture = await makeBuilderAnimationScene(world, { clock: timing })
  const shown = []
  try {
    for (let visit = 0; visit < 4; visit++) {
      const before = structuredClone(world)
      fixture.render()
      assert.deepEqual(world, before)
      const group = fixture.scene.unitMeshes.get(id), person = unit.fight.motion
      const call = fixture.personCalls.find(args => args[0] === group)
      const directions = shamanNativeDirections(unit.team, person.object)
      const direction = spriteDirection(
        Math.round(fixture.scene.cameraBearing * 1024 / Math.PI),
        Math.round((Math.PI - unit.heading) * 1024 / Math.PI)
      )
      const frame = directions[direction].frames[person.f2]
      assert.equal(call[5], person.f2)
      assert.equal(group.userData.frame, frame)
      assert.ok(group.userData.layers.some(layer => layer.visible))
      assert.equal(group.userData.nativeFrameHeight, sprites.frames[frame].nativeHeight)
      shown.push(frame)
      if (visit < 3) fixture.advance(1 / 24)
    }
    assert.equal(shown[0], shown[1], 'extra presentation visits retain the same frame')
    assert.notEqual(shown[1], shown[2], 'the logical combat visit changes original artwork')
    assert.equal(shown[2], shown[3])
  } finally {
    fixture.close()
  }
})

test('ordinary combat remains frame-schedule independent with pause and speed changes', () => {
  function run(schedule) {
    const { world, timing } = ordinaryAttack()
    const beforePause = structuredClone(world)
    world.paused = true
    advanceGame(world, timing, 2)
    world.paused = false
    assert.deepEqual(world, beforePause)
    for (const speed of [0.5, 1, 2]) {
      world.speed = speed
      let elapsed = 0, frame = 0
      while (elapsed < 1 - 1e-9) {
        const dt = Math.min(1 - elapsed, schedule[frame++ % schedule.length])
        advanceGame(world, timing, dt)
        elapsed += dt
      }
    }
    assert.ok(Math.abs(world.pendingTime) < 1e-9)
    world.pendingTime = 0
    return world
  }
  const baseline = run([1 / 60])
  for (const schedule of [[1 / 30], [1 / 120], [1 / 144], [.01, .09, .03, .2]])
    assert.deepEqual(run(schedule), baseline)
})


test('native attack presentation leaves gameplay animation-source and eligibility semantics unchanged', () => {
  const { world, unit } = suppliedAttack('firewarrior', 'attack')
  processBattles(world)
  const person = unit.fight.motion
  person.flags2 |= 0x100000
  person.renderFlags &= ~128
  const before = structuredClone(world)
  assert.equal(unitRenderAnimationSource(unit), person)
  assert.equal(unitAnimationSource(unit), null)
  assert.equal(canOrder(unit), true, 'the existing gameplay eligibility adapter is unchanged')
  assert.equal(canPickUnit(world, unit), true)
  assert.deepEqual(world, before, 'neither source query mutates gameplay or animation')
})
