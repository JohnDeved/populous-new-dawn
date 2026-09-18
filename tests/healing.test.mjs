import assert from 'node:assert/strict'
import test from 'node:test'
import { addUnit, createWorld, tick, maxHp } from '../app/model.ts'
import { advanceGame } from '../app/game-clock.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { createLivePerson, stepLivePersonHealth } from '../app/live-people.ts'

function emptyWorld() {
  const w = createWorld()
  w.units = []
  w.buildings = []
  w.trees = []
  w.shrines = []
  return w
}

test('ordinary person turns apply native follower and Shaman healing without reviving excluded units', () => {
  const w = emptyWorld()
  const brave = addUnit(w, 'blue', 'brave', { x: 0, z: 0 })
  const shaman = addUnit(w, 'blue', 'shaman', { x: 2, z: 0 })
  const excluded = addUnit(w, 'red', 'brave', { x: 4, z: 0 })
  const full = addUnit(w, 'blue', 'warrior', { x: 6, z: 0 })
  const dead = addUnit(w, 'red', 'warrior', { x: 8, z: 0 })

  brave.hp = maxHp('brave') - 1
  shaman.hp = maxHp('shaman') - 2
  excluded.hp = maxHp('brave') - 1
  excluded.native = createLivePerson(w, excluded)
  excluded.native.state = 22
  excluded.native.timer = 100
  full.hp = maxHp('warrior')
  dead.hp = 0

  const before = {
    brave: brave.hp,
    shaman: shaman.hp,
    excluded: excluded.hp,
    full: full.hp,
    dead: dead.id,
  }

  w.turn = 7
  tick(w, 1 / 12)

  assert.equal(brave.hp, before.brave + 4 / 20)
  assert.equal(shaman.hp, before.shaman + 32 / 20)
  assert.equal(excluded.hp, before.excluded, 'state-flag bit 1 excludes health updates')
  assert.equal(full.hp, before.full)
  assert.ok(!w.units.some(u => u.id === before.dead), 'ordinary death cleanup must not be bypassed')
})

test('live health adapter preserves airborne/state exclusions and combat status flags', () => {
  const w = emptyWorld()
  const eligible = addUnit(w, 'blue', 'brave', { x: 0, z: 0 })
  const excluded = addUnit(w, 'blue', 'brave', { x: 2, z: 0 })
  const airborne = addUnit(w, 'blue', 'brave', { x: 4, z: 0 })

  eligible.hp = maxHp('brave') - 2
  eligible.native = createLivePerson(w, eligible)
  eligible.native.flags3 = 0x89000

  excluded.hp = maxHp('brave') - 2
  excluded.native = createLivePerson(w, excluded)
  excluded.native.state = 22

  airborne.hp = maxHp('brave') - 2
  airborne.flight = createLivePerson(w, airborne)
  airborne.flight.flags2 |= 0x80000

  const beforeExcluded = excluded.hp
  const beforeAirborne = airborne.hp
  const randomState = w.randomState
  w.turn = 8
  stepLivePersonHealth(w)

  assert.equal(w.randomState, randomState, 'healing does not consume simulation RNG')
  assert.equal(eligible.hp, maxHp('brave') - 2 + 4 / 20)
  assert.equal(eligible.native.flags3 & 0x88000, 0x88000, 'Shield/Bloodlust flags survive healing')
  assert.equal(eligible.native.flags3 & 0x1000, 0, 'native low-health marker follows healed life')
  assert.equal(excluded.hp, beforeExcluded)
  assert.equal(airborne.hp, beforeAirborne)
})

test('each original healing model receives exactly one recovered increment on the eighth turn', () => {
  const w = emptyWorld()
  const expected = new Map([
    ['brave', 4],
    ['warrior', 6],
    ['preacher', 4],
    ['spy', 4],
    ['firewarrior', 6],
    ['shaman', 32],
  ])
  const units = [...expected].map(([kind], index) => {
    const unit = addUnit(w, 'blue', kind, { x: index * 3, z: 0 })
    unit.hp = maxHp(kind) - 4
    return unit
  })

  w.turn = 7
  tick(w, 1 / 12)
  for (const unit of units)
    assert.equal(unit.hp, maxHp(unit.kind) - 4 + expected.get(unit.kind) / 20)

  const afterHealing = units.map(unit => unit.hp)
  tick(w, 1 / 12)
  assert.deepEqual(
    units.map(unit => unit.hp),
    afterHealing,
    'the following off-cadence turn must not apply a second increment'
  )
})

test('a follower injured by the shipped missing-building release path later heals on an ordinary turn', () => {
  const w = emptyWorld()
  const brave = addUnit(w, 'blue', 'brave', { x: 0, z: 0 })
  const full = brave.hp
  brave.inside = 999

  tick(w, 1 / 12)
  assert.equal(brave.inside, null)
  assert.equal(brave.hp, full - 10, 'ordinary turn applied the existing release injury')
  const injured = brave.hp

  for (let i = 0; i < 7; i++) tick(w, 1 / 12)
  assert.equal(w.turn, 8)
  assert.equal(brave.hp, injured + 4 / 20, 'ordinary simulation healed the injured follower')
})

function scheduledHealing(speed, schedule) {
  const w = emptyWorld()
  const brave = addUnit(w, 'blue', 'brave', { x: 0, z: 0 })
  const shaman = addUnit(w, 'blue', 'shaman', { x: 2, z: 0 })
  const braveStart = maxHp('brave') - 10
  const shamanStart = maxHp('shaman') - 20
  brave.hp = braveStart
  shaman.hp = shamanStart
  w.speed = speed
  const clock = { animationTime: 0, animationFrame: 0 }
  let remaining = 4
  for (let frame = 0; remaining > 1e-10; frame++) {
    const dt = Math.min(remaining, schedule[frame % schedule.length])
    advanceGame(w, clock, dt)
    remaining -= dt
  }
  return { w, brave, shaman, braveStart, shamanStart }
}

test('healing follows simulation turns across speed, refresh cadence, irregular frames and pause', () => {
  const schedules = [
    ...[30, 60, 120, 144].map(hz => [1 / hz]),
    [0.007, 0.013, 0.28, 0.6, 0.1],
  ]
  for (const speed of [0.5, 1, 2]) {
    const results = schedules.map(schedule => scheduledHealing(speed, schedule))
    const first = results[0]
    const heals = Math.floor(first.w.turn / 8)
    assert.ok(Math.abs(first.brave.hp - (first.braveStart + (heals * 4) / 20)) < 1e-9)
    assert.ok(Math.abs(first.shaman.hp - (first.shamanStart + (heals * 32) / 20)) < 1e-9)
    for (const result of results.slice(1)) {
      assert.equal(result.w.turn, first.w.turn)
      assert.equal(result.brave.hp, first.brave.hp)
      assert.equal(result.shaman.hp, first.shaman.hp)
    }
  }

  const paused = scheduledHealing(1, [1 / 60])
  const before = { turn: paused.w.turn, brave: paused.brave.hp, shaman: paused.shaman.hp }
  paused.w.paused = true
  advanceGame(paused.w, { animationTime: 0, animationFrame: 0 }, 10)
  assert.deepEqual(
    { turn: paused.w.turn, brave: paused.brave.hp, shaman: paused.shaman.hp },
    before
  )
})

test('checkpoint migration preserves the next native healing turn', () => {
  const w = emptyWorld()
  const brave = addUnit(w, 'blue', 'brave', { x: 0, z: 0 })
  const shaman = addUnit(w, 'blue', 'shaman', { x: 2, z: 0 })
  brave.hp = maxHp('brave') - 2
  shaman.hp = maxHp('shaman') - 4
  w.turn = 7

  const restored = migrateCheckpoint(structuredClone(w))
  tick(w, 1 / 12)
  tick(restored, 1 / 12)

  assert.equal(restored.turn, w.turn)
  assert.equal(restored.units.find(u => u.id === brave.id)?.hp, brave.hp)
  assert.equal(restored.units.find(u => u.id === shaman.id)?.hp, shaman.hp)
})
