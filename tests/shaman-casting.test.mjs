import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { addBuilding, addUnit, nativePosition } from '../app/model.ts'
import { cast, command, spellTargetError } from '../app/live-command.ts'
import { cancelInteraction, setSelection } from '../app/selection-runtime.ts'
import { beginCast } from '../app/spell-casting.ts'
import { advanceGame } from '../app/game-clock.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import {
  animateLiveObjects, beginLiveCasting, changeLivePersonState, createLivePerson,
  setLivePersonAnimation, stepLiveCasting,
} from '../app/live-people.ts'
import { clearLivePath } from '../app/live-pathfinding.ts'
import { nativeCellPoint } from '../app/world-coordinates.ts'
import { SPELLS } from '../app/world-rules.ts'
import {
  facePersonCasting, initializePersonCasting, stepPersonCasting,
} from '../app/person-casting.ts'
import { unitRenderAnimationSource } from '../app/unit-animation-source.ts'
import { shamanNativeDirections } from '../app/shaman-appearance.ts'
import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import units from '../app/original-units.json' with { type: 'json' }
import rules from '../app/original-rules.json' with { type: 'json' }
import native from './fixtures/shaman-casting-native.json' with { type: 'json' }

// Controlled mechanics fixtures, not claims of an ordinary campaign acquisition.
function scenario(team = 'blue') {
  const w = createStartedWorld(1)
  retainFixtureUnits(w, () => false)
  w.buildings = []; w.trees = []; w.shrines = []
  w.terrain.fill(3); w.terrainVersion++
  w.manaWorld.gameFlags = 0 // Ordinary stock payment, not alternate-mode unlimited Blast.
  const u = addUnit(w, team, 'shaman', { x: 1, z: -1 })
  // Keep an opposing tribe alive rather than disabling outcome/payment rules.
  addUnit(w, team === 'blue' ? 'red' : 'blue', 'brave', { x: 40, z: -40 })
  u.native = createLivePerson(w, u)
  w.shots.blast = 3
  return { w, u, p: u.native, target: { x: 9, z: -1 } }
}
const clock = () => ({ animationTime: 0, animationFrame: 0 })
const pose = p => [p.state, p.object, p.draw, p.f1, p.f2, p.timer, p.counter]
function linked(w, p) {
  assert.equal(w.objectCells.objects.get(p.id), p, 'registry retains the exact physical owner')
  const cell = ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9), seen = new Set()
  let id = w.objectCells.heads[cell]
  while (id) {
    assert.ok(!seen.has(id), 'cell chain contains no cycle')
    seen.add(id)
    id = w.objectCells.objects.get(id).cellNext
  }
  assert.ok(seen.has(p.id), 'owner is linked in the actual coordinate cell')
}
const advance = (w, c, n) => {
  for (let i = 0; i < n; i++) advanceGame(w, c, 1 / 12)
}

test('cast artwork and all tribe/direction chains match independent original table/link bytes', () => {
  assert.deepEqual(rules.animationObjects[109], native.objects[109])
  assert.equal(rules.personStateFlags[22], native.state22Flags)
  const { rawHex, ...descriptor } = native.descriptor14
  assert.equal(rawHex, '0a000000020000f0000000')
  assert.deepEqual(rules.animationDescriptors[14], descriptor)
  for (const expected of native.cycles) {
    const direction = shamanNativeDirections(expected.team, 520)[expected.direction]
    assert.equal(direction.source, expected.source)
    assert.equal(direction.flip, expected.flip)
    assert.deepEqual(direction.frames.map(i => units.frames[i].source), expected.frames)
    assert.equal(units.frameCounts[expected.source], expected.frames.length)
  }
  assert.equal(native.cycles.length, 32)
  assert.equal(native.cycles.reduce((n, c) => n + c.frames.length, 0), 382)
})

test('native entry stops velocity, retains valid phase, and uses only seat/current-cell pose alternatives', () => {
  const { w, p } = scenario()
  for (const [vehicle, cellObject, cargo, flags2, flags4, object] of [
    [0, false, 0, 0, 0, 109],
    [0, false, 100, 0, 0, 109],
    [1, false, 0, 0, 0, native.shamanRows[0]],
    [0, true, 100, 0, 0, native.shamanRows[4]],
    [1, false, 0, 0x88000, 0, native.shamanRows[2]],
    [0, true, 0, 0x80000, 0x400, native.shamanRows[12]],
  ]) {
    Object.assign(p, { state: 22, vehicle, cargo, flags2, flags4, speed: 47, f1: 4, f2: 3,
      velocity: { x: 13, y: -7, z: -19 } })
    initializePersonCasting(p, cellObject,
      (person, selected) => setLivePersonAnimation(w, person, selected))
    assert.deepEqual([p.object, p.draw], native.objects[object])
    assert.deepEqual(p.velocity, { x: 0, y: 0, z: 0 })
    assert.equal(p.speed, 0)
    assert.equal(p.timer, 10)
    assert.equal(p.f1, 0)
    assert.equal(p.f2, 3, 'valid native phase is retained, not restarted')
  }
  p.vehicle = 0; p.flags2 = 0; p.flags4 = 0; p.f2 = 12
  p.velocity = { x: 0, y: 65535, z: 0 }
  initializePersonCasting(p, false, (person, selected) => setLivePersonAnimation(w, person, selected))
  assert.equal(p.f2, 0, 'only an out-of-range phase resets')
  assert.equal(p.velocity.y, 0, 'the native comparison is signed-short')
  p.velocity.y = 8
  initializePersonCasting(p, false, () => {})
  assert.equal(p.velocity.y, 8, 'upward velocity is retained')
})

test('facing follows eight native octants, wrap, reverse-facing and turn-request bits', () => {
  const { p } = scenario()
  for (const [dx, dy, angle] of [
    [0, 256, 0], [256, 256, 256], [256, 0, 512], [256, -256, 768],
    [0, -256, 1024], [-256, -256, 1280], [-256, 0, 1536], [-256, 256, 1792],
  ]) for (const flags2 of [0, 128, 0x8000, 0x8080]) {
    Object.assign(p, { x: 65500, y: 65500, flags2, turnAngle: 99 })
    facePersonCasting(p, { x: (p.x + dx) & 65535, y: (p.y + dy) & 65535 })
    assert.equal(p.heading, angle)
    assert.equal(p.angle, flags2 & 0x8000 ? (angle + 1024) & 2047 : angle)
    assert.equal(p.turnAngle, flags2 & 128 ? angle : 99)
  }
})

test('live pose lookup tests the current flagged cell, not adjacent objects', () => {
  const { w, u, p } = scenario()
  const building = addBuilding(w, 'blue', 'hut', { x: 9, z: -1 }),
    cell = (p.y >> 9) * 128 + (p.x >> 9)
  w.land.flags[cell] &= ~512
  w.land.flags[cell + 1] |= 512
  w.land.buildingIds[cell + 1] = building.id
  beginLiveCasting(w, u, { x: p.x + 512, y: p.y })
  assert.equal(p.object, 520, 'a neighboring indexed object is irrelevant')
  w.land.flags[cell] |= 512
  assert.ok(building.id > 0 && building.id < 1024, 'fixture uses native land-object ID domain')
  w.land.buildingIds[cell] = building.id | 0xfc00
  beginLiveCasting(w, u, { x: p.x + 512, y: p.y })
  assert.deepEqual([p.object, p.draw], native.objects[native.shamanRows[0]])
  linked(w, p)
})

test('expiry preserves cargo and airborne row choices, clearing reverse-facing only for row2', () => {
  const { p } = scenario()
  for (const [cargo, flags2, flags4, row, reverse] of [
    [0, 0x8000, 0, 0, 0x8000],
    [100, 0x8000, 0, 4, 0x8000],
    [0, 0x88000, 0, 2, 0],
    [100, 0x88000, 0, 2, 0],
    [0, 0x88000, 0x400, 12, 0x8000],
    [100, 0x88000, 0x400, 12, 0x8000],
  ]) {
    Object.assign(p, { state: 22, timer: 1, cargo, flags2, flags4, animationMode: 0,
      vehicle: 0, velocity: { x: 5, y: 9, z: 6 } })
    const selected = [], initialized = []
    stepPersonCasting(p, 0, {
      animation: (_, object) => selected.push(object),
      destination: () => {},
      outside: point => point,
      release: () => {},
      initialize: state => initialized.push(state),
    })
    assert.deepEqual(selected, [native.shamanRows[row]])
    assert.equal(p.flags2 & 0x8000, reverse)
    assert.equal(p.flags2 & 0x80000, flags2 & 0x80000)
    assert.deepEqual(p.velocity, { x: 0, y: 9, z: 0 })
    assert.deepEqual(initialized, [native.defaultState])
  }
})

test('expiry follows native ten-visit order, anchor, motion reset and protection', () => {
  const { p } = scenario()
  for (const animationMode of [0, 1]) for (const protectedState of [false, true]) {
    Object.assign(p, { state: 22, timer: 10, animationMode, x: 1025, y: 2049, heading: 768,
      flags2: 0x20000800 | (protectedState ? 0x100000 : 0), speed: 42,
      velocity: { x: 6, y: -2, z: 8 }, motionTimer: 4, motionMode: 9 })
    const events = [], effects = {
      animation: (_, object) => events.push(['animation', object]),
      destination: point => events.push(['destination', point]),
      outside: point => { events.push(['outside', point]); return { x: 4097, y: 8193 } },
      release: () => events.push(['release']),
      initialize: state => events.push(['initialize', state]),
    }
    for (let visit = 1; visit < 10; visit++) {
      stepPersonCasting(p, 0, effects)
      assert.equal(p.timer, 10 - visit)
      assert.deepEqual(events, [])
    }
    stepPersonCasting(p, 0, effects)
    const expected = [
      ['animation', native.shamanRows[0]],
      ['destination', { x: 1025, y: 2049 }],
      ...(animationMode ? [['outside', { x: 1025, y: 2049 }], ['release']] : []),
      ...(protectedState ? [] : [['initialize', native.defaultState]]),
    ]
    assert.deepEqual(events, expected)
    assert.deepEqual(p.velocity, { x: 0, y: 0, z: 0 })
    assert.deepEqual([p.speed, p.motionTimer, p.motionMode], [0, 0, 0])
    assert.equal(p.flags2 & 0x20000800, 0)
    if (animationMode) assert.deepEqual([p.anchorX, p.anchorY, p.anchorFlags, p.turnAngle],
      [4352, 8448, 0, 768])
  }
})

for (const team of ['blue', 'red', 'yellow', 'green'])
  test(`${team} grounded cast exposes native source 520 and retained phase to presentation`, () => {
    const { w, u, p, target } = scenario(team)
    p.f2 = 3
    beginCast(w, u, 'blast', target)
    assert.equal(u.native, p)
    assert.equal(unitRenderAnimationSource(u), p)
    linked(w, p)
    assert.deepEqual([p.state, p.object, p.draw, p.f2], [22, 520, 14, 3])
    for (const expected of native.cycles.filter(c => c.team === team)) {
      const cycle = shamanNativeDirections(team, p.object)[expected.direction]
      assert.equal(units.frames[cycle.frames[p.f2 % cycle.frames.length]].source,
        expected.frames[3])
    }
  })

for (const entry of ['rest', 'movement', 'combat'])
  test(`public cast from ${entry} retains one physical owner and one spell allocation`, () => {
    const { w, u, p, target } = scenario()
    if (entry === 'rest') p.state = 19
    if (entry === 'movement') {
      setSelection(w, [u.id])
      assert.ok(command(w, { x: 17, z: -1 }))
    }
    if (entry === 'combat') {
      p.state = 25
      u.fight = { action: 'attack', nativeAttackAnimation: true, motion: p }
      u.native = null
    }
    p.f2 = 3
    assert.ok(cast(w, 'blast', target))
    assert.equal(u.native, p)
    assert.equal(u.fight, null)
    assert.equal(unitRenderAnimationSource(u), p)
    linked(w, p)
    assert.deepEqual([p.state, p.object, p.draw, p.f2, p.timer], [22, 520, 14, 3, 10])
    assert.equal(w.projectiles.length, 1)
    assert.equal(w.shots.blast, 2)
    assert.equal(w.projectiles[0].remaining, 6)
    assert.deepEqual(w.projectiles[0].destination, nativePosition(w, target))
  })

test('logical visits separate the six-turn spell windup from the ten-turn cast pose', () => {
  const { w, u, p, target } = scenario(), c = clock()
  assert.ok(cast(w, 'blast', target))
  const shot = w.projectiles[0], counter = p.counter, initial = p.f2
  const twin = migrateCheckpoint(structuredClone(w)), tc = clock()
  for (let visit = 1; visit <= 10; visit++) {
    advanceGame(w, c, 1 / 24)
    assert.equal(p.timer, 11 - visit, 'presentation half-visit does not tick person state')
    advanceGame(w, c, 1 / 24)
    advanceGame(twin, tc, 1 / 12)
    assert.deepEqual(w, twin, 'current checkpoint preserves the unique cast owner')
    assert.equal(p.counter, (counter + visit) & 255)
    linked(w, p)
    if (visit < 6) {
      assert.ok(u.casting)
      assert.equal(shot.phase, 'windup')
      assert.equal(shot.remaining, 6 - visit)
    } else assert.equal(u.casting, null)
    if (visit === 6) assert.equal(shot.phase, 'flying')
    if (visit < 10) {
      assert.equal(p.state, 22)
      assert.equal(p.timer, 10 - visit)
      assert.equal(p.f2, (initial + visit) % 12)
      assert.equal(spellTargetError(w, 'blast', target)?.code, -1)
    }
    const before = pose(p)
    animateLiveObjects(w)
    animateLiveObjects(twin)
    assert.deepEqual(pose(p), before, 'presentation cannot advance the cast phase again')
  }
  assert.notEqual(p.state, 22)
  assert.equal(w.shots.blast, 2)
})

test('AI combat admission initializes once, without a replacement person or speed RNG draw', () => {
  // Execute the exact private shipping caller, as in computer-spell-projection.
  // Binding changeLivePersonState deliberately catches a restored second init.
  const source = readFileSync(new URL('../app/computer-runtime.ts', import.meta.url), 'utf8'),
    start = source.indexOf('function allocateComputerSpell('),
    end = source.indexOf('// 0x4cc7d7:', start)
  assert.ok(start >= 0 && end > start)
  const bindings = { SPELLS, clearLivePath, beginCast, nativeCellPoint, changeLivePersonState },
    allocate = new Function(...Object.keys(bindings),
      `${stripTypeScriptTypes(source.slice(start, end))}\nreturn allocateComputerSpell`)(...Object.values(bindings))
  const { w, u, p } = scenario('red')
  p.state = 25; p.f2 = 5
  u.fight = { group: 0, opponent: 0, started: w.turn, action: 'attack',
    nativeAttackAnimation: true, motion: p }
  const randomState = w.randomState, counter = p.counter
  allocate(w, u, 2, 0x2010)
  assert.equal(u.native, p)
  assert.equal(u.fight, null)
  assert.deepEqual([p.previousState, p.state, p.timer, p.f2], [25, 22, 10, 5])
  assert.equal(p.counter, counter, 'allocation is not a person update')
  assert.equal(w.randomState, randomState, 'state22 flags 0x241 suppress speed RNG')
  assert.equal(w.projectiles.length, 1)
})

test('a preparation transition does not also decrement the replacement state timer', () => {
  const { w, u, p, target } = scenario()
  assert.ok(cast(w, 'blast', target))
  p.flags2 |= 16
  const counter = p.counter
  stepLiveCasting(w, u, p)
  assert.equal(p.state, native.defaultState)
  assert.equal(p.timer, 0)
  assert.equal(p.counter, (counter + 1) & 255)
})

test('pause, render rates, irregular frames and catch-up preserve the same logical cast history', () => {
  const run = (schedule, speed = 1) => {
    const { w, u, p, target } = scenario(), c = clock(), history = []
    assert.ok(cast(w, 'blast', target))
    w.paused = true
    const before = pose(p), turn = w.turn
    advanceGame(w, c, 3)
    assert.deepEqual(pose(p), before)
    assert.equal(w.turn, turn)
    w.paused = false
    w.speed = speed
    c.afterTurn = () => history.push([p.state, p.object, p.f2, p.timer, !!u.casting])
    for (const elapsed of schedule) advanceGame(w, c, elapsed)
    return history
  }
  const expected = run(Array(12).fill(1 / 12))
  for (const hz of [30, 60, 120, 144]) assert.deepEqual(run(Array(hz).fill(1 / hz)), expected)
  assert.deepEqual(run([0.01, 0.16, 0.03, 0.27, 0.02, 0.51]), expected)
  assert.deepEqual(run([1]), expected)
  assert.deepEqual(run([0.25], 4), expected)
  assert.deepEqual(run([2], 0.5), expected)
})

test('cancel targeting does not cancel an allocated spell; replacement orders cancel only the pose', () => {
  const { w, u, p, target } = scenario(), c = clock()
  const waves = new Set()
  c.afterTurn = () => {
    for (const effect of w.effects) if (effect.wave) waves.add(effect.id)
  }
  assert.ok(cast(w, 'blast', target))
  const first = w.projectiles[0], stock = w.shots.blast
  w.mode = 'blast'
  cancelInteraction(w)
  assert.equal(p.state, 22)
  assert.equal(w.projectiles[0], first)
  setSelection(w, [u.id])
  assert.ok(command(w, { x: 17, z: -1 }))
  assert.equal(u.casting, null)
  assert.notEqual(p.state, 22)
  assert.equal(w.projectiles[0], first)
  advance(w, c, 12)
  assert.equal(w.shots.blast, stock)
  assert.ok(cast(w, 'blast', target))
  assert.equal(w.shots.blast, stock - 1)
  assert.equal(w.projectiles.filter(s => s.caster === u.id && s.phase === 'windup').length, 1)
  assert.notEqual(w.projectiles.find(s => s.phase === 'windup').id, first.id)
  advance(w, c, 12)
  assert.equal(w.shots.blast, stock - 1)
  assert.equal(waves.size, 2, 'two admitted spells create exactly two effects despite cancellation')
})

test('public airborne and protected exclusions do not spend stock or create projectiles', () => {
  for (const excluded of ['airborne', 'protected']) {
    const { w, u, p, target } = scenario()
    if (excluded === 'airborne') { u.flight = p; u.lift = 1 }
    else {
      p.state = 19 // Existing public eligibility reads the active resting owner.
      p.flags2 |= 0x100000
    }
    assert.equal(cast(w, 'blast', target), false)
    assert.equal(w.shots.blast, 3)
    assert.equal(w.projectiles.length, 0)
    assert.notEqual(p.state, 22)
  }
})
