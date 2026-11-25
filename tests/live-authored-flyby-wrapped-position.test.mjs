import assert from 'node:assert/strict'
import test from 'node:test'
import { browserPosition, createWorld, nativePosition, tick } from '../app/model.ts'
import { levelStartCamera } from '../app/level-start.ts'
import { stepFlyby } from '../app/flyby.ts'

const signedWord = value => (value << 16) >> 16

test('the authored M2 flyby takes the short route across the signed map seam', () => {
  const world = createWorld(2)
  const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  assert.equal(shaman.id, 54)
  // Use the same authored startup seed and native-coordinate conversion as
  // the Scene before its first active update; drive only its logical consumer.
  const seed = levelStartCamera(nativePosition(world, shaman), world.manaWorld.gameFlags)
  const start = browserPosition(seed)
  const camera = {
    x: Math.round((start.x + 8) * 256),
    y: Math.round((-start.z - 8) * 256),
    angle: seed.angle,
    zoom: 0,
  }
  assert.deepEqual([camera.x, camera.y, camera.angle], [-25600, 23808, 256])
  const { flyby } = world
  assert.equal(flyby.flags & 1, 0)
  assert.equal(flyby.events.length, 0)
  while (!(flyby.flags & 1) && world.turn < 70) tick(world, 1 / 12)
  assert.equal(world.turn, 70)
  assert.equal(world.paused, false)
  assert.equal(flyby.warmup, 6)
  assert.deepEqual(
    flyby.events.filter(event => event.kind === 1).slice(0, 2).map(event => [event.value, event.start, event.duration]),
    [[24780, 5, 30], [34454, 40, 40]]
  )

  const frame = target => {
    for (let i = 0; i < 180 && (flyby.warmup || flyby.frame < target); i++)
      stepFlyby(flyby, camera, 24, world.paused)
    assert.equal(flyby.frame, target)
    assert.equal(world.turn, 70, 'camera presentation ticks do not advance the game')
  }
  frame(13)
  assert.deepEqual([flyby.cursor, camera.x, camera.y], [1, -25584, 23809])
  frame(92)
  assert.deepEqual([flyby.cursor, camera.x, camera.y], [4, -13002, 24838])
  assert.deepEqual(flyby.events[flyby.cursor], {
    kind: 1, flags: 0, value: (134 << 8) | 150, start: 92, duration: 92,
  })
  // 00449670 reads the centered signed word for target row 134 before shortest-path wrapping.
  const centeredY = signedWord(((134 & 254) + 1) * 256)
  assert.equal(centeredY - signedWord(camera.y), -55814)
  assert.equal(centeredY - signedWord(camera.y) + 65536, 9722)

  frame(115)
  assert.equal(flyby.cursor, 5)
  assert.deepEqual([camera.x, camera.y], [-15179, 26399])
  frame(167)
  assert.equal(flyby.tracks[1].active, true)
  assert.deepEqual([camera.x, camera.y], [-25450, -31893])
})
