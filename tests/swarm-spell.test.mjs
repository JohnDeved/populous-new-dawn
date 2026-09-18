import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  addUnit,
  cast,
  command,
  createWorld,
  nativePosition,
  placeBuilding,
  select,
  setSelection,
  tick,
} from '../app/model.ts'
import { createLivePerson } from '../app/live-people.ts'
import { stepSwarm } from '../app/spell-effects-runtime.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { advanceGame } from '../app/game-clock.ts'
import {
  SWARM_INSECT_COUNT,
  SWARM_LIFETIME,
  createSwarmState,
  hasSwarmRuntime,
  initializeSwarmInsects,
  stepSwarmLifetime,
  swarmState,
} from '../app/swarm.ts'

test('Swarm uses the supplied standalone original insect texture', () => {
  const png = readFileSync(new URL('../public/original/insect.png', import.meta.url))
  assert.equal(
    crypto.createHash('sha256').update(png).digest('hex'),
    '84433882241475ba1ab76f14e7703b78a7ed02eb3cdfd7cc7c89f525b35a0f35'
  )
})

const stepUntil = (w, predicate, limit = 160) => {
  for (let i = 0; !predicate() && i < limit; i++) tick(w, 1 / 12)
  assert.ok(predicate())
}

const originalRandom = state => {
  const n = (Math.imul(state, 0x24a1) + 0x24df) >>> 0
  return ((n >>> 13) | (n << 19)) >>> 0
}
const signed9 = n => (n & 0x1ff) - 0x100
const signed7 = n => (n & 0x7f) - 0x40

test('Swarm creation and first controller visit preserve original gameplay RNG and child fields', () => {
  const seed = 0x12345678,
    rng = { randomState: seed },
    center = { x: 0x4567, y: 0x89ab, h: 0 },
    terrainHeight = () => 900,
    state = createSwarmState(rng, center, 2, terrainHeight)
  let expected = seed
  const next = () => (expected = originalRandom(expected))

  const headingDraw = next(),
    wanderDraw = next()
  assert.equal(rng.randomState, expected)
  assert.equal(state.heading, headingDraw & 0x7ff)
  assert.equal(state.wander, wanderDraw & 0x1f)
  assert.equal(state.h, 1100)
  assert.deepEqual(state.insects, [])

  const xDraw = next(),
    yDraw = next(),
    heightDraw = next(),
    xMotionDraw = next(),
    verticalMotionDraw = next(),
    yMotionDraw = next(),
    jitter = Array.from({ length: 10 }, () => signed9(next()))
  for (let i = 1; i < SWARM_INSECT_COUNT; i++) for (let draw = 0; draw < 16; draw++) next()

  initializeSwarmInsects(rng, state)
  assert.equal(rng.randomState, expected)
  assert.equal(state.insects.length, SWARM_INSECT_COUNT)
  assert.deepEqual(state.insects[0], {
    index: 0,
    x: (state.x + signed9(xDraw)) & 65535,
    y: (state.y + signed9(yDraw)) & 65535,
    h: state.h + signed7(heightDraw),
    vx: xMotionDraw & 0x7f,
    verticalVelocity: verticalMotionDraw & 0x7f,
    vy: yMotionDraw & 0x7f,
    verticalOffset: signed7(heightDraw),
    jitter,
  })
})

test('Swarm first live visit allocates children before wandering begins on the second visit', () => {
  const w = createWorld()
  w.units = []
  w.randomState = 0x17
  const center = { x: 0x4567, y: 0x89ab, h: 0 },
    state = createSwarmState(w, center, 0, () => 900),
    fx = {
      id: 999,
      kind: 'swarm',
      x: 0,
      z: 0,
      age: 0,
      duration: Infinity,
      swarm: state,
    }
  let expected = 0x17
  const next = () => (expected = originalRandom(expected)),
    creationHeading = next() & 0x7ff,
    creationWander = next() & 0x1f
  assert.equal(creationWander, 0)
  for (let draw = 0; draw < SWARM_INSECT_COUNT * 16; draw++) next()
  const afterAllocation = expected

  assert.equal(stepSwarm(w, fx), true)
  assert.equal(w.randomState, afterAllocation)
  assert.equal(state.heading, creationHeading)
  assert.equal(state.wander, creationWander)
  assert.equal(state.insects.length, SWARM_INSECT_COUNT)
  assert.equal(state.remaining, SWARM_LIFETIME - 1)
  assert.equal(state.phase, 'wandering')

  const secondWander = next() & 0x1f,
    secondHeading = next() & 0x7ff
  assert.equal(stepSwarm(w, fx), true)
  assert.equal(w.randomState, expected)
  assert.equal(state.wander, secondWander)
  assert.equal(state.heading, secondHeading)
  assert.equal(state.remaining, SWARM_LIFETIME - 2)
})

test('Swarm final fifteen controller visits progressively remove children before expiry', () => {
  const rng = { randomState: 0x76543210 },
    state = createSwarmState(rng, { x: 1000, y: 2000, h: 0 }, 0, () => 300)
  initializeSwarmInsects(rng, state)
  state.remaining = 15
  const counts = []
  for (let remaining = 15; remaining > 0; remaining--) {
    const alive = stepSwarmLifetime(state)
    counts.push(state.insects.length)
    assert.equal(alive, remaining > 1)
  }
  assert.ok(counts.slice(0, -1).every((count, i, all) => !i || count < all[i - 1]))
  assert.equal(counts.at(-1), 0)
})

test('Swarm reveals disguised Spies on panic and panic-protected non-removal paths', () => {
  const w = createWorld()
  w.manaWorld.loadFlags |= 0x200
  w.terrain.fill(3)
  w.terrainVersion++
  w.units = []
  w.buildings = []
  w.trees = []
  w.shrines = []
  addUnit(w, 'blue', 'shaman', { x: 0, z: 0 })
  const spy = addUnit(w, 'red', 'spy', { x: 2, z: 0 }),
    protectedSpy = addUnit(w, 'red', 'spy', { x: 2, z: 0 })
  for (const unit of [spy, protectedSpy]) {
    unit.native = createLivePerson(w, unit)
    unit.native.state = 14
    unit.native.disguise = 0
  }
  protectedSpy.native.flags2 |= 0x100000
  const life = spy.hp,
    protectedLife = protectedSpy.hp

  w.shots.swarm = 1
  assert.ok(cast(w, 'swarm', { x: 2, z: 0 }))
  stepUntil(w, () => w.effects.some(fx => fx.swarm?.applied), 1000)

  assert.equal(spy.native.state, 26)
  assert.equal(spy.native.disguise, 1 << 6)
  assert.equal(spy.hp - 4 / 20, life - 5)
  assert.equal(protectedSpy.native.state === 26, false)
  assert.equal(protectedSpy.native.disguise, 1 << 6)
  assert.equal(protectedSpy.hp - 4 / 20, protectedLife - 5)
})

test('confirmed invented generic and Angel success strings are not emitted', () => {
  for (const spell of ['bloodlust', 'angel']) {
    const world = createWorld(16),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
    world.manaWorld.loadFlags |= 0x200
    world.message = 'sentinel'
    world.shots[spell] = 1
    world.castingTribes[0].cooldown = 0
    assert.ok(cast(world, spell, { x: shaman.x + 1, z: shaman.z }))
    stepUntil(
      world,
      () => !shaman.casting && !world.projectiles.some(projectile => projectile.spell === spell),
      1000
    )
    assert.equal(world.message, 'sentinel')
  }
})

test('Swarm follows player and computer cast paths with native insects, victim cadence, and lifetime', () => {
  const w = createWorld()
  w.manaWorld.loadFlags |= 0x200
  w.terrain.fill(3)
  w.terrainVersion++
  w.units = []
  w.buildings = []
  w.trees = []
  w.shrines = []
  addUnit(w, 'blue', 'shaman', { x: 0, z: 0 })
  const victim = addUnit(w, 'red', 'brave', { x: 2, z: 0 }),
    protectedVictim = addUnit(w, 'red', 'warrior', { x: 2, z: 0 }),
    removedVictim = addUnit(w, 'red', 'preacher', { x: 2, z: 0 }),
    spy = addUnit(w, 'red', 'spy', { x: 2, z: 0 }),
    protectedSpy = addUnit(w, 'red', 'spy', { x: 2, z: 0 }),
    enemyShaman = addUnit(w, 'red', 'shaman', { x: 2, z: 0 }),
    ally = addUnit(w, 'blue', 'brave', { x: 2, z: 0 }),
    farEnemy = addUnit(w, 'red', 'brave', { x: 20, z: 20 })
  const untouchedLife = new Map(
    [protectedVictim, enemyShaman, ally, farEnemy].map(unit => [unit.id, unit.hp])
  )
  for (const unit of w.units) {
    unit.native = createLivePerson(w, unit)
    unit.native.state = 14
  }
  protectedVictim.native.flags2 |= 0x100000
  protectedSpy.native.flags2 |= 0x100000
  removedVictim.native.flags4 |= 0x800
  spy.native.disguise = 0
  protectedSpy.native.disguise = 0
  victim.hp = 20
  const life = victim.hp,
    spyLife = spy.hp,
    protectedSpyLife = protectedSpy.hp,
    randomBefore = w.randomState

  w.shots.swarm = 1
  assert.ok(cast(w, 'swarm', { x: 2, z: 0 }))
  stepUntil(w, () => w.effects.some(fx => fx.swarm?.applied))
  const fx = w.effects.find(candidate => candidate.swarm),
    swarm = swarmState(fx.swarm)
  assert.ok(fx)
  assert.equal(w.shots.swarm, 0)
  assert.equal(fx.sprite, undefined)
  assert.equal(swarm.insects.length, SWARM_INSECT_COUNT)
  assert.equal(swarm.remaining, SWARM_LIFETIME - 1)
  assert.notEqual(w.randomState, randomBefore)
  assert.equal(w.turn, 8, 'Swarm impact lands on the recovered eighth-turn healing cadence')
  assert.equal(victim.native.state, 26)
  assert.equal(victim.hp - 4 / 20, life - 5)
  assert.equal(protectedVictim.native.state === 26, false)
  assert.equal(protectedVictim.hp - 6 / 20, untouchedLife.get(protectedVictim.id) - 5)
  assert.equal(removedVictim.hp, 0)
  assert.equal(spy.native.state, 26)
  assert.equal(spy.native.disguise, 1 << 6)
  assert.equal(spy.hp - 4 / 20, spyLife - 5)
  assert.equal(protectedSpy.native.state === 26, false)
  assert.equal(protectedSpy.native.disguise, 1 << 6)
  assert.equal(protectedSpy.hp - 4 / 20, protectedSpyLife - 5)
  for (const unit of [enemyShaman, ally, farEnemy])
    assert.equal(unit.hp, untouchedLife.get(unit.id))
  assert.ok(w.sounds.some(sound => sound.cue === 0xa4))

  // Supporting fixture: pin a new eligible Brave to the moving native controller to prove
  // the recovered every-eight-visits scan cadence without depending on the cloud's random walk.
  const cadenceVictim = addUnit(w, 'red', 'brave', fx)
  cadenceVictim.native = createLivePerson(w, cadenceVictim)
  cadenceVictim.native.state = 14
  const cadenceLife = cadenceVictim.hp,
    changes = []
  for (let visit = 0; visit < 8; visit++) {
    const current = swarmState(fx.swarm),
      before = cadenceVictim.hp
    cadenceVictim.native.x = current.x
    cadenceVictim.native.y = current.y
    cadenceVictim.x = fx.x
    cadenceVictim.z = fx.z
    tick(w, 1 / 12)
    if (cadenceVictim.hp !== before) changes.push(visit + 1)
  }
  assert.deepEqual(changes, [8])
  assert.equal(cadenceVictim.hp - 4 / 20, cadenceLife - 5)
  assert.equal(cadenceVictim.native.state, 26)

  // Structured-clone checkpoints keep the controller and all 60 insects. Equal wall time
  // under different render schedules must yield the same fixed-turn simulation state.
  const checkpoint = structuredClone(w),
    regular = migrateCheckpoint(structuredClone(checkpoint)),
    irregular = migrateCheckpoint(structuredClone(checkpoint))
  const runSchedule = (world, schedule, seconds) => {
    const clock = { animationTime: 0, animationFrame: 0 }
    let elapsed = 0,
      frame = 0
    while (elapsed < seconds - 1e-9) {
      const dt = Math.min(schedule[frame++ % schedule.length], seconds - elapsed)
      advanceGame(world, clock, dt)
      elapsed += dt
    }
  }
  const stateOf = world => {
    const effect = world.effects.find(candidate => candidate.id === fx.id),
      state = swarmState(effect.swarm)
    return {
      turn: world.turn,
      randomState: world.randomState,
      remaining: state.remaining,
      applied: state.applied,
      parent: [state.x, state.y, state.h, state.heading, state.wander],
      insects: state.insects.map(insect => [
        insect.index,
        insect.x,
        insect.y,
        insect.h,
        insect.vx,
        insect.verticalVelocity,
        insect.vy,
        insect.verticalOffset,
        ...insect.jitter,
      ]),
    }
  }
  runSchedule(regular, [1 / 60], 2)
  runSchedule(irregular, [1 / 5, 1 / 240, 1 / 30, 1 / 120], 2)
  assert.deepEqual(stateOf(irregular), stateOf(regular))

  const legacy = migrateCheckpoint(structuredClone(checkpoint)),
    legacyFx = legacy.effects.find(candidate => candidate.id === fx.id)
  legacyFx.swarm = { tribe: legacyFx.swarm.tribe, remaining: 60, applied: true }
  legacyFx.sprite = { sequence: 'smoke', frame: 0 }
  tick(legacy, 1 / 12)
  assert.equal(hasSwarmRuntime(legacyFx.swarm), true)
  assert.equal(swarmState(legacyFx.swarm).insects.length, SWARM_INSECT_COUNT)

  const liveFx = w.effects.find(candidate => candidate.id === fx.id),
    remaining = swarmState(liveFx.swarm).remaining
  for (let visit = 0; visit < remaining - 1; visit++) tick(w, 1 / 12)
  assert.ok(w.effects.some(candidate => candidate.id === fx.id))
  tick(w, 1 / 12)
  assert.equal(
    w.effects.some(candidate => candidate.id === fx.id),
    false
  )

  const ai = createWorld(),
    red = ai.units.find(u => u.team === 'red' && u.kind === 'shaman'),
    blue = ai.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
    target = ai.units.find(u => u.team === 'blue' && u.kind === 'brave')
  ai.terrain.fill(3)
  ai.terrainVersion++
  ai.units = [red, blue, target]
  Object.assign(red, { x: 0, z: 0, path: [], casting: null })
  Object.assign(target, { x: 2, z: 0, path: [], casting: null })
  for (const unit of [blue, target]) {
    unit.native = createLivePerson(ai, unit)
    unit.native.state = 14
  }
  ai.turn = 16
  ai.manaTribes[1].mana = 40000
  ai.manaTribes[1].available = 0
  ai.manaWorld.spells[1].stocks[5] = 1
  ai.ai.spellEntries = ai.ai.spellEntries.map((entry, i) => ({
    ...entry,
    model: i ? 0 : 5,
    mana: 0,
    people: 1,
    mode: 0,
  }))
  const p = nativePosition(ai, target)
  ai.spellScan.targets[0] = (p.y & 0xfe00) | ((p.x >>> 8) & 254) || 1
  tick(ai, 1 / 12)
  assert.equal(ai.projectiles.at(-1)?.spell, 'swarm')
  stepUntil(ai, () => target.native?.state === 26)
  const aiSwarm = ai.effects.find(effect => effect.swarm)
  assert.ok(aiSwarm)
  assert.equal(aiSwarm.swarm.tribe, 1)
  assert.equal(swarmState(aiSwarm.swarm).insects.length, SWARM_INSECT_COUNT)

  delete ai.shots.swarm
  delete ai.giftCounts.swarm
  migrateCheckpoint(ai)
  assert.equal(ai.shots.swarm, 0)
  assert.equal(ai.giftCounts.swarm, 0)
})

test('Mission 2 naturally funds the Matak Shaman and casts Swarm through player orders', () => {
  const missionOne = createWorld()
  stepUntil(missionOne, () => missionOne.turn >= 4)
  assert.ok(missionOne.manaTribes[1].mana > 0)
  assert.equal(missionOne.manaTribes[3].mana, 0)

  const w = createWorld(2)
  stepUntil(w, () => w.turn >= 70, 1000)
  assert.equal(w.manaTribes[1].mana, 0)
  assert.ok(w.manaTribes[3].mana > 0)

  select(w, 'brave')
  assert.ok(placeBuilding(w, 'camp', { x: -99, z: -105 }))
  const camp = w.buildings.find(building => building.team === 'blue' && building.kind === 'camp')
  stepUntil(w, () => camp.progress === 1, 3000)
  stepUntil(w, () => !w.units.some(unit => unit.builder), 1000)
  setSelection(
    w,
    w.units
      .filter(unit => unit.team === 'blue' && unit.kind === 'brave' && unit.hp > 0)
      .slice(0, 6)
      .map(unit => unit.id)
  )
  assert.ok(command(w, camp))
  stepUntil(
    w,
    () => w.units.filter(unit => unit.team === 'blue' && unit.kind === 'warrior').length >= 6,
    10000
  )

  const bridge = w.shrines.find(shrine => shrine.kind === 'bridgeEffect'),
    tornado = w.shrines.find(shrine => shrine.kind === 'tornado')
  select(w, 'shaman')
  assert.ok(command(w, bridge))
  stepUntil(w, () => bridge.uses === 1, 10000)
  stepUntil(w, () => !w.effects.some(effect => effect.kind === 'bridge'), 5000)
  select(w, 'shaman')
  assert.ok(command(w, tornado))
  stepUntil(w, () => w.messages.slots.some(message => message?.stringId === 644), 10000)
  select(w, 'brave')
  assert.ok(command(w, tornado))
  stepUntil(w, () => w.messages.slots.some(message => message?.stringId === 642), 10000)

  setSelection(
    w,
    w.units
      .filter(unit => unit.team === 'blue' && unit.kind === 'warrior' && unit.hp > 0)
      .slice(0, 6)
      .map(unit => unit.id)
  )
  const inactive = { mana: w.manaTribes[1].mana, available: w.manaTribes[1].available },
    matakMana = w.manaTribes[3].mana
  assert.ok(command(w, { x: 83, z: 127 }))
  stepUntil(
    w,
    () =>
      w.projectiles.some(projectile => projectile.team === 'green' && projectile.spell === 'swarm'),
    5000
  )
  stepUntil(w, () => w.effects.some(effect => effect.swarm), 100)
  stepUntil(w, () => w.units.some(unit => unit.team === 'blue' && unit.native?.state === 26), 100)
  assert.deepEqual({ mana: w.manaTribes[1].mana, available: w.manaTribes[1].available }, inactive)
  assert.ok(w.manaTribes[3].mana < matakMana)
  assert.equal(w.spellCasts[3][5], 1)
  assert.equal(w.spellCasts[1][5], 0)
  assert.equal(w.effects.find(effect => effect.swarm).swarm.tribe, 3)
})
