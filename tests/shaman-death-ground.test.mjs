import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, select, command, tick } from '../app/model.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { nativePosition } from '../app/world-terrain-runtime.ts'
import { setShamanDeathPhase } from '../app/shaman-death-vfx.ts'
import { finishLevelStart } from './level-start-fixture.mjs'

const body = w => w.effects.find(f => f.reincarnation?.team === 'blue')
const advance = w => tick(w, 1 / 12)
const remaining = w => Math.round(w.respawns[0] * 12)
const nativeHeight = f => Math.round(f.height * 45)
let death

function deathWorld() {
  if (!death) {
    const w = finishLevelStart(createWorld(2))
    const shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    select(w, 'shaman')
    assert.equal(command(w, w.units.find(u => u.id === 13)), true)
    for (let turns = 0; turns < 2000 && !body(w); turns++) advance(w)
    assert.equal(shaman.hp, 0)
    assert.equal(w.units.includes(shaman), false)
    assert.equal(body(w)?.reincarnation.phase, 0)
    death = w
  }
  return structuredClone(death)
}

function atPhase(w, phase) {
  for (let turns = 0; turns < 500 && body(w)?.reincarnation.phase < phase; turns++) advance(w)
  assert.equal(body(w)?.reincarnation.phase, phase)
  return body(w)
}

// Only the post-death terrain is supplied. Combat, the effect producer and the
// world-turn consumer remain live; shipped terrain-spell/rendering has a separate check.
function changeGround(w, height) {
  const f = body(w), point = nativePosition(w, f)
  const x = (point.x & 65535) >> 9, y = (point.y & 65535) >> 9
  for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]])
    w.land.heights[((y + dy) & 127) * 128 + ((x + dx) & 127)] = height
  assert.equal(nativePosition(w, f).h, height)
}

test('ordinary Shaman phase1 follows both rising and lowering death-site ground', () => {
  const w = deathWorld(), f = atPhase(w, 1)
  const anchor = { x: f.x, z: f.z, heading: f.unit.heading }
  for (const height of [480, 80, 640]) {
    changeGround(w, height)
    const beforeRemaining = remaining(w)
    advance(w)
    assert.equal(f.reincarnation.phase, 1)
    assert.equal(f.reincarnation.ground, height)
    assert.equal(nativeHeight(f), height)
    assert.equal(remaining(w), beforeRemaining - 1)
    assert.deepEqual({ x: f.x, z: f.z, heading: f.unit.heading }, anchor)
    assert.equal(w.status, 'playing')
  }
})

test('the last processed phase1 sample survives checkpoint, transition and rise', () => {
  const w = deathWorld(), f = atPhase(w, 1)
  while (remaining(w) > 337) advance(w)
  changeGround(w, 640)
  advance(w)
  assert.equal(remaining(w), 336)
  assert.equal(f.reincarnation.phase, 1, 'last phase1 visit still owns its ground sample')
  assert.equal(f.reincarnation.ground, 640)
  const restored = migrateCheckpoint(structuredClone(w))
  assert.deepEqual(body(restored), f)
  for (const current of [w, restored]) {
    changeGround(current, 960)
    for (let visit = 0; visit < 3; visit++) {
      advance(current)
      assert.equal(body(current).reincarnation.phase, 2)
      assert.equal(body(current).reincarnation.ground, 640)
      assert.equal(nativeHeight(body(current)), 640)
    }
    advance(current)
    assert.equal(body(current).reincarnation.phase, 3)
    assert.equal(nativeHeight(body(current)), 680)
    assert.equal(body(current).reincarnation.ground, 640)
  }
  assert.deepEqual(body(restored), body(w))
  assert.deepEqual(restored.respawns, w.respawns)
  assert.equal(restored.randomState, w.randomState)
})

test('phase0 retains the death height until the first processed phase1 visit', () => {
  const w = deathWorld(), f = body(w), original = f.reincarnation.ground
  changeGround(w, 640)
  while (remaining(w) > 464) {
    advance(w)
    assert.equal(f.reincarnation.phase, 0)
    assert.equal(f.reincarnation.ground, original)
    assert.equal(nativeHeight(f), original)
  }
  advance(w)
  assert.equal(f.reincarnation.phase, 1)
  assert.equal(f.reincarnation.ground, 640)
  assert.equal(nativeHeight(f), 640)
})

test('a direct drowning-entry fixture rises from its initial height without phase1 resampling', () => {
  const w = deathWorld(), f = body(w), original = f.reincarnation.ground
  // Explicit controller-entry fixture: full drowning gameplay is outside this
  // regression; original00502910 supplies this same phase3 entry in the native check.
  w.respawns[0] = w.respawn = 333 / 12
  setShamanDeathPhase(f, 3)
  for (const [index, height] of [480, 80, 640].entries()) {
    changeGround(w, height)
    advance(w)
    assert.equal(f.reincarnation.phase, 3)
    assert.equal(f.reincarnation.ground, original)
    assert.equal(nativeHeight(f), original + 40 * (index + 1))
  }
})
