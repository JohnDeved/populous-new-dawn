import assert from 'node:assert/strict'
import test from 'node:test'
import { createGameStore } from '../app/game-store.ts'
import { browserPosition, command, createWorld, setSelection, tick } from '../app/model.ts'
import { naturalPreacherJourney } from '../scripts/mission3-natural-preacher-scenario.mjs'

test('ordinary M3 conversion requests one victim cue and its flash follows after checkpoint load', async () => {
  const store = createGameStore()
  store.startMission(3)
  const journey = naturalPreacherJourney(store.getWorld())
  const { world, victim, preacher, authoredVictimId, step } = journey
  assert.equal(world.turn, 2922)
  assert.deepEqual([authoredVictimId, preacher.id], [53, 4082])
  const firstSerial = world.soundSerial
  while (world.turn < 3118) step()
  const person = victim.native
  assert.deepEqual([person.id, person.state, person.substate, person.workTarget, victim.hp],
    [53, 23, 5, preacher.id, 50])
  assert.equal(person.flags4 & 0x800, 0)
  const victimPoint = browserPosition(person)
  assert.deepEqual(victimPoint, { x: -41.59375, z: -108.07421875 })
  const previousSerial = world.soundSerial
  const expectedReplacementId = world.nextId
  const previousEffectCounter = world.effectCounter
  step()

  assert.equal(world.turn, 3119)
  assert.ok(!world.units.some(unit => unit.id === authoredVictimId))
  assert.equal(world.objectCells.objects.get(authoredVictimId), undefined)
  const replacement = world.units.find(unit => unit.id === expectedReplacementId)
  assert.ok(replacement?.native)
  assert.equal(world.objectCells.objects.get(replacement.id), replacement.native)
  assert.deepEqual([replacement.id, replacement.team, replacement.kind], [4107, 'blue', 'brave'])
  assert.equal(replacement.native.flags4 & 0x40000, 0x40000)
  assert.equal(replacement.native.flags3 & 0x1000000, 0x1000000)
  assert.equal(world.randomState, 1689499174, 'the request introduces no gameplay RNG draw')

  const flashes = world.effects.filter(effect => effect.startConversionLink === replacement.id)
  assert.equal(flashes.length, 1, 'the terminal native cue is gated on one linked effect')
  const flash = flashes[0]
  assert.equal(world.nextId, expectedReplacementId + 2, 'the replacement and one flash consume consecutive IDs')
  assert.equal(world.effectCounter, (previousEffectCounter + 1) & 255)
  assert.deepEqual([flash.id, flash.x, flash.z, flash.height, flash.turnsRemaining],
    [expectedReplacementId + 1, victimPoint.x, victimPoint.z, 192 / 45, 8])
  assert.deepEqual([flash.sprite.sequence, flash.animation.object, flash.animation.draw],
    ['startConversion', 1240, 45])
  assert.deepEqual(world.sounds.filter(sound => sound.serial > previousSerial && sound.cue === 5),
    [{ serial: previousSerial + 1, cue: 5, ...victimPoint, turn: 3119, owner: 53 }])

  function linkedFlashState(state) {
    const actor = state.units.find(unit => unit.id === replacement.id)
    assert.ok(actor?.native)
    assert.equal(state.objectCells.objects.get(actor.id), actor.native)
    assert.equal(state.objectCells.objects.get(authoredVictimId), undefined)
    const linked = state.effects.filter(effect => effect.startConversionLink === actor.id)
    assert.ok(linked.length <= 1)
    assert.equal(
      state.sounds.filter(sound =>
        sound.serial > firstSerial && sound.owner === authoredVictimId && sound.cue === 5
      ).length,
      1
    )
    return {
      turn: state.turn,
      point: browserPosition(actor.native),
      flash: structuredClone(linked[0]),
    }
  }

  const saved = linkedFlashState(world)
  // Node exercises the store's in-session checkpoint, not durable IndexedDB.
  await store.saveCheckpoint()
  assert.ok(store.loadCheckpoint())
  const restored = store.getWorld()
  assert.notEqual(restored, world)
  assert.deepEqual(linkedFlashState(restored), saved)
  const trail = [saved]
  for (let i = 0; i < 9; i++) {
    const previous = trail.at(-1)
    step()
    tick(restored, 1 / 12)
    const current = linkedFlashState(world)
    assert.deepEqual(linkedFlashState(restored), current)
    if (current.flash) {
      assert.equal(current.flash.id, flash.id)
      assert.deepEqual({ x: current.flash.x, z: current.flash.z }, previous.point)
    }
    trail.push(current)
  }
  assert.deepEqual(trail.map(state => state.flash?.turnsRemaining), [8, 7, 6, 5, 4, 3, 2, 1, undefined, undefined])
  assert.notDeepEqual(trail[2].point, trail[1].point, 'the authored replacement really moved')
  assert.deepEqual(trail[2].point, { x: -43.23046875, z: -114.7421875 })
  assert.equal(trail[3].flash.height, 191 / 45)
  assert.ok(store.loadCheckpoint())
  assert.deepEqual(linkedFlashState(store.getWorld()), saved)
})

test('ordinary player cancellation of the M3 sermon queues no victim cue or conversion flash', () => {
  const { world, victim, preacher, step, observation } = naturalPreacherJourney(createWorld(3, 'scalable'))
  const before = world.soundSerial
  setSelection(world, [preacher.id])
  assert.ok(command(world, { x: -33, z: -113 }))
  assert.notEqual(victim.native.state, 23)
  for (let i = 0; i < 197; i++) step()
  assert.equal(world.turn, 3119)
  assert.equal(observation().events.length, 0)
  assert.ok(world.units.includes(victim) && victim.hp > 0 && victim.team === 'yellow')
  assert.ok(!world.sounds.some(sound => sound.serial > before && sound.owner === victim.id && sound.cue === 5))
  assert.ok(!world.effects.some(effect => effect.startConversionLink !== undefined))
})
