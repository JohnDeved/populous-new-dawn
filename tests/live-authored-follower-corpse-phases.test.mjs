import assert from 'node:assert/strict'
import test from 'node:test'
import { cancelInteraction, command, createWorld, selectFollowers, tick } from '../app/model.ts'
import { interruptFlyby } from '../app/flyby.ts'

// Controlled input replay of the archived ordinary Follower route: supplied
// camera and Skip at turn 70, single selection at 107, one attack at 116.
// Fixed model visits do not witness browser frame pacing. No actor, HP,
// opponent, corpse or completion state is supplied.
function episode() {
  const world = createWorld(2, 'scalable')
  const advance = target => { while (world.turn < target) tick(world, 1 / 12) }
  advance(70)
  assert.deepEqual([world.inputMask, world.flyby.flags], [64, 21])
  interruptFlyby(world.flyby, { x: 17 * 256, y: -41 * 256, angle: 0, zoom: 0 })
  // Mirror the public Skip's input-mask boundary after the real flyby controller.
  assert.equal(world.flyby.flags & 1, 0)
  world.inputMask &= ~64
  advance(107)
  cancelInteraction(world)
  selectFollowers(world, 2, { x: 29696, y: 32679 }, 'single')
  assert.deepEqual(world.selected, [1235])
  const actor = world.units.find(unit => unit.id === 1235)
  assert.ok(actor && actor.team === 'blue' && actor.kind === 'brave')
  advance(116)
  const target = world.units.find(unit => unit.id === 20)
  assert.ok(target && target.team === 'green' && target.kind === 'shaman')
  assert.equal(command(world, target, { shiftKey: true }), true)
  assert.equal(world.lastOrderTurn, 116)
  assert.equal(actor.target, 20)
  advance(622)
  assert.ok(world.units.includes(actor))
  assert.equal(actor.hp, 1.3)
  assert.equal(actor.fight?.opponent, 20)
  const oldIds = new Set(world.effects.map(effect => effect.id))
  advance(623)
  assert.ok(!world.units.includes(actor))
  const spawned = world.effects.filter(effect =>
    !oldIds.has(effect.id) && effect.corpse && effect.unit?.kind === 'brave' && effect.unit.team === 'blue'
  )
  assert.equal(spawned.length, 1)
  const [corpse] = spawned
  assert.deepEqual([corpse.id, corpse.x, corpse.z, corpse.unit.heading],
    [2253, actor.x, actor.z, actor.heading])
  return { world, corpse, advance }
}

test('real authored follower death creates the initial landed corpse pose', () => {
  const { corpse } = episode()
  assert.deepEqual(corpse.corpse, { remaining: 468, phase: 0, ground: 131, displayedFrame: 0 })
  assert.deepEqual([corpse.animation.object, corpse.animation.draw, corpse.animation.f2], [304, 14, 0])
})

test('the same authored corpse changes phase, freezes the rise pose, and retires on its last visit', () => {
  const { world, corpse, advance } = episode()
  // Test only the subsequent owner, separate from initialization above.
  advance(628)
  const animation = corpse.animation
  const at = (turn, expected) => {
    advance(turn)
    assert.ok(world.effects.includes(corpse))
    assert.equal(corpse.animation, animation)
    assert.deepEqual(
      [corpse.corpse.remaining, corpse.corpse.phase, animation.object, animation.draw, animation.f2],
      expected
    )
  }
  at(628, [463, 1, 312, 14, 0])
  at(758, [333, 2, 320, 14, 0])
  at(759, [332, 3, 320, 14, 4])
  assert.equal(animation.renderFlags & 0x6002, 0x6002)
  at(1090, [1, 4, 320, 14, 4])
  assert.equal(animation.renderFlags & 0x10, 0x10)
  advance(1091)
  assert.ok(!world.effects.some(effect => effect.id === corpse.id))
})
