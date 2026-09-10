import assert from 'node:assert/strict'
import test from 'node:test'
import firePeople from './fixtures/building-fire-people.json' with { type: 'json' }
import { buildingFirePoints } from '../app/building-shapes.ts'
import { createLivePerson, buildingFirePeople } from '../app/live-people.ts'
import fixture from './fixtures/person-panic.json' with { type: 'json' }
import manifest from '../decomp/exports.json' with { type: 'json' }
import {
  stepPersonPanic,
  stepPersonFireTrail,
  ignitePeopleInFireCell,
} from '../app/person-panic.ts'
import {
  createWorld,
  tick,
  cast,
  select,
  addBuilding,
  addUnit,
  nativePosition,
  browserPosition,
  buildingPose,
  unitAnimationSource,
} from '../app/model.ts'
import { advanceGame } from '../app/game-clock.ts'

test('panic and personal fire trails retain original timer, sound, anchor and allocation decisions', () => {
  assert.equal(fixture.executableSha256, manifest.executableSha256)
  for (const { case: c, expected } of fixture.controller) {
    const p = structuredClone(c.person),
      events = []
    const result = stepPersonPanic(p, c.gameFlags, {
      sound: () => events.push('sound'),
      outside: () => c.outside,
    })
    assert.deepEqual(
      {
        timer: p.timer,
        anchorX: p.anchorX,
        anchorY: p.anchorY,
        anchorFlags: p.anchorFlags,
        result,
        events,
      },
      expected
    )
  }
  for (const { case: c, expected } of fixture.emitters) {
    const p = structuredClone(c.person),
      events = []
    stepPersonFireTrail(p, c.displacement, (model, position) => {
      const particle =
        c.fail & (1 << events.length) ? undefined : { flags2: c.flags2, flags3: c.flags3 }
      events.push({ model, position, particle: particle ?? null })
      return particle
    })
    assert.deepEqual({ burnTrail: p.burnTrail, events }, expected)
  }
})

function burningOccupant(direction = 0) {
  const w = createWorld()
  w.manaWorld.gameFlags = 32
  const b = addBuilding(w, 'blue', 'hut', { x: -2, z: 32 }, true, {
    angle: (direction * Math.PI) / 2,
  })
  const u = w.units.find(u => u.team === 'blue' && u.kind === 'brave')
  Object.assign(u, { x: b.x, z: b.z, inside: b.id, work: b.id, path: [] })
  w.shots.lightning = 1
  select(w, 'shaman')
  assert.ok(cast(w, 'lightning', b))
  for (let i = 0; i < 100 && u.inside !== null; i++) tick(w, 1 / 12)
  assert.equal(u.inside, null)
  assert.equal(u.native?.state, 26)
  assert.ok(Math.hypot(u.x - b.x, u.z - b.z) < 1.5, 'first panic step starts inside the hut, without a door teleport')
  return { w, b, u }
}

test('burning huts eject running followers with distinct panic and trail lifetimes in all orientations', () => {
  for (let direction = 0; direction < 4; direction++) {
    const { w, b, u } = burningOccupant(direction)
    const p = u.native,
      start = { x: u.x, z: u.z },
      particles = new Map()
    assert.equal(p.timer, 63)
    assert.equal(p.speed, 110)
    assert.equal(u.burnTrail, 23)
    assert.equal(unitAnimationSource(u), p)
    assert.equal(w.selected.includes(u.id), false)
    for (let i = 0; i < 64; i++) {
      for (const fx of w.effects) if (fx.animation?.displacement) particles.set(fx.id, fx)
      tick(w, 1 / 12)
      if (i < 63) assert.equal(u.native?.state, 26)
      assert.equal(u.inside, null)
    }
    assert.equal(u.native, null)
    assert.equal(u.burnTrail, 0)
    assert.ok(Math.hypot(u.x - start.x, u.z - start.z) > 0.2, 'panic uses actual native movement')
    assert.equal(particles.size, 40, '24 sparks plus 16 bright particles')
    assert.ok([...particles.values()].every(f => f.animation.flags2 & 0x4000))
    assert.ok([...particles.values()].some(f => f.sprite.sequence === 'blastShot'))
    assert.ok(w.sounds.some(e => e.cue === 0x51 && e.owner === u.id))
    assert.ok(
      w.effects.every(f => !f.animation?.displacement),
      'all personal particles expire'
    )
    assert.ok(b.burn)
  }
})

test('panic motion, animation and fire trails are independent of presentation frame rate', () => {
  const run = steps => {
    const { w, u } = burningOccupant(),
      clock = { animationTime: 0, animationFrame: 0 }
    for (const dt of steps) advanceGame(w, clock, dt)
    return {
      turn: w.turn,
      random: w.randomState,
      cosmetic: w.cosmeticRandom,
      person: u.native,
      position: nativePosition(w, u),
      trails: u.burnTrail,
      particles: w.effects
        .filter(f => f.animation?.displacement)
        .map(f => ({ ...f, age: undefined, duration: undefined })),
    }
  }
  const expected = run(Array(144).fill(1 / 144))
  for (const hz of [5, 30, 60, 120, 240]) assert.deepEqual(run(Array(hz).fill(1 / hz)), expected)
  assert.deepEqual(run([0.37, 0.01, 0.4, 0.02, 0.2]), expected)
})

test('native building flames traverse matching cells in order, including repeated sockets and failed allocations', () => {
  assert.equal(firePeople.executableSha256, manifest.executableSha256)
  for (const { case: source, expected } of firePeople.cases) {
    const c = structuredClone(source),
      w = { randomState: c.seed },
      events = []
    buildingFirePoints(c.pose).forEach((point, i) => {
      if (c.fail & (1 << i)) return
      const people = c.records.filter(
        p => (p.x & 0xfe00) === (point.x & 0xfe00) && (p.y & 0xfe00) === (point.y & 0xfe00)
      )
      ignitePeopleInFireCell(w, c.tribe, people, p => {
        p.previousState = p.state
        p.state = 26
        events.push(['panic', p.id])
      })
    })
    assert.deepEqual({ records: c.records, events, randomState: w.randomState }, expected)
  }
})

test('live flame-cell adapter preserves protected followers, immunity, tribe and hidden occupants', () => {
  const w = createWorld(),
    b = w.buildings.find(b => b.team === 'blue' && b.kind === 'hut')
  const point = buildingFirePoints(buildingPose(b))[0]
  const people = w.units.filter(u => u.team === 'blue' && u.kind === 'brave').slice(0, 6)
  for (const u of people) Object.assign(u, browserPosition(point), { inside: null, path: [] })
  const [normal, protectedUnit, immune, enemy, inside, outside] = people
  protectedUnit.native = createLivePerson(w, protectedUnit)
  protectedUnit.native.flags2 |= 0x100000
  immune.native = createLivePerson(w, immune)
  immune.native.model = 7
  enemy.team = 'red'
  inside.inside = b.id
  Object.assign(outside, browserPosition({ x: point.x + 1024, y: point.y }))
  const ignite = buildingFirePeople(w)
  ignite(point, 0)
  assert.equal(normal.native.state, 26)
  assert.equal(normal.native.timer, 64)
  assert.ok(normal.burnTrail >= 8 && normal.burnTrail <= 15)
  assert.notEqual(protectedUnit.native.state, 26)
  assert.ok(protectedUnit.burnTrail >= 8 && protectedUnit.burnTrail <= 15)
  for (const u of [immune, enemy, inside, outside]) {
    assert.notEqual(u.native?.state, 26)
    assert.ok(!u.burnTrail)
  }
  const first = w.randomState
  ignite(point, 0)
  assert.notEqual(w.randomState, first, 'a second socket revisits this cell')
  assert.equal(normal.native.timer, 64)
})

test('real Lightning ignition reaches nearby surviving followers before occupant evacuation', () => {
  const w = createWorld()
  w.manaWorld.gameFlags = 32
  const b = w.buildings.find(b => b.team === 'blue' && b.kind === 'hut')
  // This flame cell is outside the bolt's lethal cell; direct-hit people die first.
  const point = buildingFirePoints(buildingPose(b))[2]
  w.shots.lightning = 1
  select(w, 'shaman')
  assert.ok(cast(w, 'lightning', b))
  // Place the follower when the bolt arrives; idle formations may move someone
  // away from this flame cell during the projectile's flight.
  while (w.projectiles.length) tick(w, 1 / 12)
  const u = addUnit(w, 'blue', 'brave', browserPosition(point))
  for (let i = 0; i < 20 && !b.burn; i++) tick(w, 1 / 12)
  assert.equal(u.native?.state, 26)
  assert.equal(u.native.timer, 63)
  assert.ok(u.hp > 0 && b.burn.remaining > 119)
  assert.ok(u.burnTrail >= 7 && u.burnTrail <= 14)
})
