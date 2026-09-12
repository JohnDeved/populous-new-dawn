import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import { createEarthquake, stepEarthquake } from '../app/earthquake.ts'
import {
  addBuilding,
  browserPosition,
  cast,
  createWorld,
  nativePosition,
  tick,
} from '../app/model.ts'

const ground = (height = 512) => ({
  heights: new Int16Array(16384).fill(height),
  flags: new Uint32Array(16384),
  categories: new Uint8Array(16384),
})
const noop = {
  buildings: () => [],
  model: () => 0,
  evacuate: () => {},
  damage: () => {},
  spark: () => {},
  fissure: () => {},
  terrain: () => {},
}
const offset = (cell, x, y) =>
  (((cell & 255) + x) & 255) | ((((cell >>> 8) + y) & 255) << 8)

test('Earthquake matches the native initializer and central deformation phase', () => {
  const initializedGame = { randomState: 0x12345678 },
    initialized = createEarthquake({ x: 0x40ff, y: 0x4199 }, 2, initializedGame)
  assert.deepEqual(initialized, { anchor: 0x4040, tribe: 2, remaining: 120, orientation: 3 })
  assert.equal(initializedGame.randomState, 0x32be789b)

  const land = ground(),
    game = { randomState: 0x12345678 },
    quake = { anchor: 0x4040, tribe: 0, remaining: 61, orientation: 0 },
    sounds = [],
    shakes = [],
    terrain = []
  let sparks = 0,
    fissures = 0
  assert.ok(
    stepEarthquake(land, quake, game, {
      ...noop,
      sound: cue => sounds.push(cue),
      shake: amount => shakes.push(amount),
      spark: () => sparks++,
      fissure: () => fissures++,
      terrain: (...args) => terrain.push(args),
    })
  )
  const records = Buffer.alloc(0x40000)
  for (let i = 0; i < land.heights.length; i++) records.writeInt16LE(land.heights[i], i * 16 + 4)
  assert.deepEqual({ remaining: quake.remaining, randomState: game.randomState }, {
    remaining: 60,
    randomState: 0x5de0e729,
  })
  assert.deepEqual({ sounds, shakes, sparks, fissures, terrain }, {
    sounds: [0xad, 0x15],
    shakes: [181],
    sparks: 89,
    fissures: 20,
    terrain: [[0x4040, 10]],
  })
  assert.equal(
    createHash('sha256').update(records).digest('hex'),
    '24051e612de1b928c7ed7b9f72bea4d70b17fabc7ddf9d5e6dae24b12ca02a2a'
  )
})

test('Earthquake building scans preserve protected models, RNG and ejection-before-damage', () => {
  const land = ground(),
    game = { randomState: 0 },
    quake = { anchor: 0x4040, tribe: 2, remaining: 97, orientation: 0 },
    protectedBuilding = { model: 18 },
    building = { model: 1 },
    events = []
  assert.ok(
    stepEarthquake(land, quake, game, {
      ...noop,
      sound: cue => events.push(['sound', cue]),
      shake: amount => events.push(['shake', amount]),
      buildings: cell =>
        cell === offset(quake.anchor, -16, -16) ? [protectedBuilding, building] : [],
      model: target => target.model,
      evacuate: target => events.push(['evacuate', target.model]),
      damage: target => events.push(['damage', target.model]),
    })
  )
  assert.equal(quake.remaining, 96)
  assert.equal(game.randomState, 0x26f80001)
  assert.deepEqual(events, [
    ['sound', 0xad],
    ['shake', 78],
    ['evacuate', 1],
    ['damage', 1],
  ])
})

test('live Earthquake casts, damages and deforms independently of refresh rate', () => {
  const run = schedule => {
    const w = createWorld(),
      shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    w.units = [shaman]
    w.buildings = []
    Object.assign(shaman, { x: 0, z: 20, path: [], casting: null })
    w.selected = [shaman.id]
    w.shots.earthquake = 1
    assert.ok(cast(w, 'earthquake', { x: 0, z: 8 }))
    let frame = 0
    const turn = () => {
      const target = w.turn + 1
      while (w.turn < target) {
        const untilTarget = (target - w.turn) / 12 - w.pendingTime
        tick(w, Math.min(schedule[frame++ % schedule.length], untilTarget))
      }
    }
    for (let i = 0; !w.effects.some(f => f.earthquake) && i < 64; i++) turn()
    const controller = w.effects.find(f => f.earthquake)
    assert.ok(controller)

    const building = addBuilding(w, 'red', 'hut', { x: 0, z: 8 }),
      buildingPoint = nativePosition(w, building),
      buildingCell = ((buildingPoint.x >>> 8) & 254) | (buildingPoint.y & 0xfe00)
    controller.earthquake.anchor = offset(buildingCell, 16, 16)
    controller.earthquake.remaining = 97
    w.randomState = 0
    turn()
    assert.equal(building.damageState.plan.remaining, 200)
    assert.equal(building.damageState.stage, 2)

    controller.earthquake.remaining = 61
    controller.earthquake.orientation = 0
    w.randomState = 0x12345678
    const before = Buffer.from(w.land.heights.buffer).toString('base64')
    turn()
    assert.notEqual(Buffer.from(w.land.heights.buffer).toString('base64'), before)
    controller.earthquake.remaining = 1
    turn()
    assert.ok(!w.effects.includes(controller))
    for (const cue of [0x82, 0xad, 0x12, 0x15])
      assert.ok(w.sounds.some(sound => sound.cue === cue))
    return {
      turn: w.turn,
      shots: w.shots.earthquake,
      randomState: w.randomState,
      building: building.damageState.plan.remaining,
      heightHash: createHash('sha256').update(w.land.heights).digest('hex'),
    }
  }
  const expected = run([1 / 60])
  for (const schedule of [[1 / 5], [1 / 144], [0.002, 0.04, 0.17, 0.3]])
    assert.deepEqual(run(schedule), expected)
})
