import assert from 'node:assert/strict'
import test from 'node:test'
import units from '../app/original-units.json' with { type: 'json' }
import rules from '../app/original-rules.json' with { type: 'json' }
import native from './fixtures/follower-corpse-native.json' with { type: 'json' }
import {
  followerCorpseFrame,
  followerCorpsePose,
  setFollowerCorpsePhase,
} from '../app/follower-corpse-animation.ts'
import { createWorld, command, tick } from '../app/model.ts'
import { advanceGame } from '../app/game-clock.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { finishLevelStart } from './level-start-fixture.mjs'

const kinds = ['brave', 'warrior', 'preacher', 'spy', 'firewarrior']
const teams = ['blue', 'red', 'yellow', 'green']
const clock = () => ({ animationTime: 0, animationFrame: 0 })

function corpse(kind = 'brave', team = 'blue', phase = 0) {
  const f = {
    id: 1, kind: 'death', x: 0, z: 0, age: 0, duration: Infinity,
    unit: { team, kind, heading: 0 },
    corpse: { remaining: phase === 3 ? 333 : 468, phase, ground: 240 },
  }
  setFollowerCorpsePhase(f, phase)
  return f
}

test('native corpse rows resolve source directions, clothing and all original frame chains', () => {
  // Original005029d0 selects rows19/18/20; source304/312/320 have8/1/5
  // frames. These are native-source expectations, not packed atlas offsets.
  for (const team of teams) for (const [index, kind] of kinds.entries()) {
    for (const phase of [0, 1, 2, 3, 4]) {
      const pose = followerCorpsePose({ team, kind }, phase)
      assert.equal(pose.source, [304, 312, 320][Math.min(phase, 2)])
      assert.equal(pose.draw, 14 + index)
      assert.equal(pose.directions.length, 8)
      // Immutable independent original VSTART/VFRA witness, not current mappings.
      for (const [heading, direction] of pose.directions.entries()) {
        const expected = native.sources[pose.source][heading]
        assert.equal(direction.source, expected.vstart)
        assert.equal(direction.flip, expected.mirror)
        assert.deepEqual(direction.frames.map(frame => units.frames[frame].source), expected.vfra)
        assert.equal(direction.frames.length, [8, 1, 5][Math.min(phase, 2)])
        assert.equal(direction.frames.length, units.frameCounts[direction.source])
        assert.ok(direction.frames.every(frame => units.frames[frame]?.layers.length))
      }
    }
  }
  assert.notEqual(followerCorpsePose({ team: 'blue', kind: 'brave' }, 0).directions[0].frames[0], 304)
  assert.notEqual(followerCorpsePose({ team: 'blue', kind: 'brave' }, 1).directions[0].frames[0], 312)
  assert.notEqual(followerCorpsePose({ team: 'blue', kind: 'brave' }, 2).directions[0].frames[0], 320)
})

test('wild corpse uses model1 source248 rather than a clothed follower corpse', () => {
  const f = corpse('brave', 'wild', 3),
    pose = followerCorpsePose(f.unit, 3)
  assert.equal(pose.source, 248)
  assert.equal(pose.draw, 13)
  assert.equal(f.animation.f2, 0)
  assert.equal(followerCorpseFrame(f), 0)
  assert.equal(f.animation.renderFlags & 0x6002, 0x6000)
  assert.equal(pose.freezeRise, false)
  for (const [heading, direction] of pose.directions.entries()) {
    const expected = native.sources[248][heading]
    assert.equal(direction.source, expected.vstart)
    assert.equal(direction.flip, expected.mirror)
    assert.deepEqual(direction.frames.map(frame => units.frames[frame].source), expected.vfra)
  }
  const w = createWorld(), c = clock()
  w.units = []
  w.effects = [f]
  w.speed = 0
  const shown = []
  for (let visit = 0; visit < 8; visit++) {
    advanceGame(w, c, 1 / 24)
    shown.push(followerCorpseFrame(f))
  }
  assert.deepEqual(shown, [0, 1, 2, 3, 0, 1, 2, 3])
})

test('the presentation visitor honors each original descriptor then freezes the final rise frame', () => {
  for (const kind of kinds) for (const phase of [0, 1, 2, 3, 4]) {
    const w = createWorld(), f = corpse(kind, 'blue', phase), c = clock()
    // Supplied effect fixture isolates the real shared presentation visitor.
    w.units = []
    w.effects = [f]
    w.speed = 0
    const before = { turn: w.turn, random: w.randomState, cosmetic: w.cosmeticRandom.randomState },
      length = phase === 0 ? 8 : phase === 1 ? 1 : 5,
      descriptor = native.descriptors.find(value => value.draw === f.animation.draw),
      expected = phase >= 3 ? 4 : 0
    for (const field of ['mode', 'step', 'hold', 'reset', 'flags', 'person', 'variant', 'palette'])
      assert.equal(rules.animationDescriptors[f.animation.draw][field], descriptor[field])
    assert.equal(followerCorpseFrame(f), expected)
    const shown = []
    for (let visit = 0; visit < 20; visit++) {
      advanceGame(w, c, 1 / 24)
      shown.push(followerCorpseFrame(f))
    }
    assert.deepEqual(shown, Array.from({ length: 20 }, (_, i) =>
      phase >= 3 ? 4 : Math.ceil(i / (descriptor.step + 1)) % length))
    assert.equal(!!(f.animation.renderFlags & 16), phase >= 4)
    assert.deepEqual(
      { turn: w.turn, random: w.randomState, cosmetic: w.cosmeticRandom.randomState },
      before,
    )
    const paused = structuredClone(f)
    w.paused = true
    advanceGame(w, c, 1)
    assert.deepEqual(f, paused)
    w.paused = false
    w.land.landFlags |= 2
    advanceGame(w, c, 1)
    assert.deepEqual(f, paused)
    const restored = migrateCheckpoint(structuredClone(w))
    assert.deepEqual(restored.effects.find(effect => effect.id === f.id), f)
  }
})

test('corpse presentation is identical at 30/60/120/144 Hz and irregular rendering intervals', () => {
  const schedules = [30, 60, 120, 144].map(hz => [1 / hz]).concat([[0.007, 0.08, 0.013, 0.4]])
  for (const kind of kinds) {
    let expected
    for (const schedule of schedules) {
      const w = createWorld(), f = corpse(kind), c = clock()
      w.units = []
      w.effects = [f]
      w.speed = 0
      for (let remaining = 1, frame = 0; remaining > 1e-10; frame++) {
        const elapsed = Math.min(remaining, schedule[frame % schedule.length])
        advanceGame(w, c, elapsed)
        remaining -= elapsed
      }
      const actual = { animation: f.animation, corpse: f.corpse, visits: c.animationFrame }
      expected ??= structuredClone(actual)
      assert.deepEqual(actual, expected, `${kind} at ${schedule}`)
    }
  }
})

let ordinaryDeath
function deathWorld() {
  if (!ordinaryDeath) {
    const w = finishLevelStart(createWorld(2)),
      brave = w.units.find(u => u.team === 'blue' && u.kind === 'brave')
    w.selected = [brave.id]
    assert.equal(command(w, w.units.find(u => u.id === 13)), true)
    for (let turns = 0; turns < 2000 && w.units.includes(brave); turns++) tick(w, 1 / 12)
    assert.equal(w.units.includes(brave), false)
    const f = w.effects.find(effect =>
      effect.corpse && effect.unit?.team === brave.team && effect.unit.kind === brave.kind &&
      effect.x === brave.x && effect.z === brave.z)
    assert.ok(f, 'ordinary command/movement/combat produces the follower corpse')
    assert.equal(f.corpse.phase, 0)
    ordinaryDeath = { w, id: f.id }
  }
  return structuredClone(ordinaryDeath)
}

test('ordinary combat death selects the body, corpse, transition and frozen spirit across save/load', () => {
  const { w, id } = deathWorld(), c = clock(),
    body = world => world.effects.find(effect => effect.id === id)
  for (const phase of [0, 1, 2, 3, 4]) {
    while (body(w).corpse.phase < phase) tick(w, 1 / 12)
    const f = body(w)
    assert.equal(f.animation.object, [304, 312, 320, 320, 320][phase])
    assert.equal(followerCorpseFrame(f), phase >= 3 ? 4 : 0)
    w.speed = 0
    advanceGame(w, c, 2 / 24)
    assert.equal(followerCorpseFrame(f), phase >= 3 ? 4 : phase === 1 ? 0 : 1)
    const restored = migrateCheckpoint(structuredClone(w))
    advanceGame(w, c, 1 / 24)
    advanceGame(restored, clock(), 1 / 24)
    assert.deepEqual(body(restored), body(w))
    w.speed = 1
  }
  for (let turns = 0; turns < 400 && body(w); turns++) tick(w, 1 / 12)
  assert.equal(body(w), undefined)
})

test('wild land death enters the native immediate-rise branch', () => {
  const w = finishLevelStart(createWorld(3)),
    wild = w.units.find(u => u.team === 'wild')
  assert.ok(wild)
  // Supplied health exercises the ordinary producer; not a natural-death witness.
  wild.hp = 0
  tick(w, 1 / 12)
  const f = w.effects.find(effect => effect.corpse && effect.unit?.team === 'wild')
  assert.ok(f)
  assert.equal(f.corpse.remaining, 333)
  assert.equal(f.corpse.phase, 3)
  assert.equal(f.animation.object, 248)
  assert.equal(f.animation.draw, 13)
  assert.equal(followerCorpseFrame(f), 0)
  const angle = Math.round(((Math.PI - f.unit.heading) * 1024) / Math.PI) & 2047
  tick(w, 1 / 12)
  assert.equal(f.corpse.phase, 3)
  assert.equal(Math.round(((Math.PI - f.unit.heading) * 1024) / Math.PI) & 2047, (angle + 91) & 2047)
})
