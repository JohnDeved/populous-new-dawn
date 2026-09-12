import assert from 'node:assert/strict'
import test from 'node:test'
import { createNativeTerrain } from '../app/native-terrain.ts'
import { createTornado, stepTornado, stepTornadoPerson } from '../app/tornado.ts'
import { addBuilding, browserPosition, cast, createWorld, tick } from '../app/model.ts'

test('Tornado replays native initialization, lifetime, carry and throw', () => {
  const land = createNativeTerrain(new Int16Array(16384).fill(512)),
    w = { land, randomState: 0x12345678 },
    tornado = createTornado(land, { x: 16384, y: 16640, h: 512 }, { x: 12000, y: 13000 }, 2, w)
  assert.deepEqual(
    [tornado.remaining, tornado.phase, tornado.headingTimer, tornado.heading, w.randomState],
    [200, 0, 3, 1534, 0x2dd1b2e7]
  )
  assert.deepEqual(tornado.particles.slice(0, 3), [
    { x: 16365, y: 16626, h: 1862 },
    { x: 16384, y: 16606, h: 1772 },
    { x: 16368, y: 16620, h: 1682 },
  ])
  assert.deepEqual(tornado.particles.at(-1), { x: 16351, y: 16675, h: 512 })

  const person = {
    id: 1,
    model: 1,
    state: 24,
    previousState: 10,
    substate: 0,
    flags2: 0,
    flags3: 0,
    flags4: 0,
    stateObject: 1,
    heading: 0,
    velocity: { x: 0, y: 0, z: 0 },
    damageAttacker: 255,
    x: 0,
    y: 0,
    h: 900,
  }
  w.randomState = 0x12345678
  assert.ok(stepTornadoPerson(w, person, tornado, 0))
  assert.deepEqual([person.x, person.y, person.h, person.flags2, w.randomState], [
    16391, 16650, 900, 0x4000, 0x32be789b,
  ])
  person.substate = 18
  assert.equal(stepTornadoPerson(w, person, tornado, 0), false)
  assert.deepEqual(
    [person.state, person.flags2, person.flags3, person.velocity, person.damageAttacker, w.randomState],
    [8, 0x82000, 0x400, { x: -204, y: 230, z: -2 }, 2, 0x52d595fe]
  )

  let visits = 0
  while (
    ++visits &&
    stepTornado(w, tornado, {
      people: () => [],
      buildings: () => [],
      scenery: () => [],
      capture: () => {},
      damage: () => {},
      damageScenery: () => {},
      sound: () => {},
    })
  ) {}
  assert.equal(visits, 224)
  assert.equal(tornado.phase, 2)
})

test('Tornado uses the native building protection and one-draw damage gate', () => {
  const land = createNativeTerrain(new Int16Array(16384).fill(512)),
    tornado = {
      tribe: 2,
      destinationX: 0,
      destinationY: 0,
      spawnX: 0,
      spawnY: 0,
      remaining: 200,
      phase: 0,
      heading: 0,
      headingTimer: 2,
      step: 0,
      steering: 100,
      particles: [],
      soundPlaying: true,
      x: 0,
      y: 0,
      h: 512,
    },
    run = (seed, building, scenery) => {
      const w = { land, randomState: seed },
        damaged = [],
        damagedScenery = []
      stepTornado(w, structuredClone(tornado), {
        people: () => [],
        buildings: () => (building ? [building] : []),
        scenery: () => (scenery ? [scenery] : []),
        capture: () => {},
        damage: candidate => damaged.push(candidate.id),
        damageScenery: candidate => damagedScenery.push(candidate.id),
        sound: () => {},
      })
      return { randomState: w.randomState, damaged, damagedScenery }
    }

  assert.deepEqual(run(0, { id: 7, model: 1 }), {
    randomState: 0x26f80001,
    damaged: [7],
    damagedScenery: [],
  })
  assert.deepEqual(run(3, { id: 7, model: 1 }), {
    randomState: 0x96100004,
    damaged: [],
    damagedScenery: [],
  })
  assert.deepEqual(run(3, { id: 18, model: 18 }), {
    randomState: 3,
    damaged: [],
    damagedScenery: [],
  })
  assert.deepEqual(run(0, undefined, { id: 9, model: 1 }), {
    randomState: 0x26f80001,
    damaged: [],
    damagedScenery: [9],
  })
  assert.deepEqual(run(3, undefined, { id: 9, model: 6 }), {
    randomState: 0x96100004,
    damaged: [],
    damagedScenery: [],
  })
  assert.deepEqual(run(3, undefined, { id: 9, model: 0 }), {
    randomState: 3,
    damaged: [],
    damagedScenery: [],
  })
})

test('live Tornado casts, captures and throws independently of refresh rate', () => {
  const run = (schedule, kind = 'hut', treeLogs = 2) => {
    const w = createWorld(),
      shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
      victim = w.units.find(u => u.team === 'red' && u.kind === 'brave')
    w.units = [shaman, victim]
    w.buildings = []
    w.trees = []
    Object.assign(shaman, { x: 0, z: 20, path: [], casting: null })
    w.selected = [shaman.id]
    w.shots.tornado = 1
    assert.ok(cast(w, 'tornado', { x: 0, z: 8 }))
    let frame = 0
    const turn = () => {
      const target = w.turn + 1
      while (w.turn < target) {
        const remaining = (target - w.turn) / 12 - w.pendingTime
        tick(w, Math.min(schedule[frame++ % schedule.length], remaining))
      }
    }
    for (let i = 0; !w.effects.some(f => f.tornado) && i < 64; i++) turn()
    const fx = w.effects.find(f => f.tornado)
    assert.ok(fx)
    fx.tornado.step = 0
    Object.assign(victim, { ...browserPosition(fx.tornado), native: null, flight: undefined, path: [] })
    turn()
    assert.equal(victim.native.state, 24)
    assert.equal(victim.native.stateObject, fx.id)
    victim.native.substate = 18
    turn()
    assert.equal(victim.flight, victim.native)
    assert.equal(victim.flight.velocity.y, 230)
    const thrownState = victim.native.state,
      thrownVelocity = { ...victim.flight.velocity }
    const point = browserPosition(fx.tornado),
      building = addBuilding(w, 'red', kind, point),
      tree = { ...point, id: w.nextId++, model: 1, logs: treeLogs }
    let buildingResult, treeResult
    w.trees.push(tree)
    for (let i = 0; (!buildingResult || !treeResult) && i < 32; i++) {
      turn()
      if (!buildingResult && building.progress < 1) {
        buildingResult = {
          remaining: building.damageState?.plan.remaining,
          stage: building.damageState?.stage,
          attacker: building.damageState?.attacker,
          planAttacker: building.damageState?.plan.attacker,
          repairDelay: building.damageState?.plan.repairDelay,
        }
        w.buildings = []
      }
      if (!treeResult && tree.logs < treeLogs) {
        treeResult = {
          logs: tree.logs,
          replant: w.replants.find(request => request.model === tree.model)?.remaining ?? null,
        }
        w.trees = []
      }
    }
    return {
      turn: w.turn,
      shots: w.shots.tornado,
      cast: w.stats.cast,
      state: thrownState,
      velocity: thrownVelocity,
      building: buildingResult,
      tree: treeResult,
      sounds: w.sounds.map(sound => [sound.cue, !!sound.stop]),
    }
  }
  const expected = run([1 / 60])
  for (const schedule of [[1 / 5], [1 / 144], [0.002, 0.04, 0.17]])
    assert.deepEqual(run(schedule), expected)
  assert.equal(expected.shots, 0)
  assert.equal(expected.cast, 1)
  assert.deepEqual(expected.building, {
    remaining: 200,
    stage: 2,
    attacker: 0,
    planAttacker: 0,
    repairDelay: 1199,
  })
  assert.deepEqual(expected.tree, { logs: 1, replant: null })
  assert.deepEqual(run([1 / 60], 'tower').building, {
    remaining: 400,
    stage: 3,
    attacker: 0,
    planAttacker: 0,
    repairDelay: 1199,
  })
  assert.deepEqual(run([1 / 60], 'hut', 1).tree, { logs: 0, replant: 4000 })
  assert.ok(expected.sounds.some(([cue]) => cue === 18))
  assert.ok(expected.sounds.some(([cue]) => cue === 0x78))
  assert.ok(expected.sounds.some(([cue]) => cue === 163))
})
