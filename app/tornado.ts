import rules from './original-rules.json' with { type: 'json' }
import { movePosition, nativeAngle, random } from './native-math.ts'
import { groundVelocity } from './person-motion.ts'
import { terrainPointHeight, type NativeTerrain } from './native-terrain.ts'

type Point = { x: number; y: number; h: number }
export type TornadoParticle = Point
export type Tornado = Point & {
  tribe: number
  destinationX: number
  destinationY: number
  spawnX: number
  spawnY: number
  remaining: number
  phase: number
  heading: number
  headingTimer: number
  step: number
  steering: number
  particles: TornadoParticle[]
  soundPlaying: boolean
}
export type TornadoPerson = Point & {
  id: number
  model: number
  state: number
  previousState: number
  substate: number
  flags2: number
  flags3: number
  flags4: number
  stateObject: number
  heading: number
  velocity: { x: number; y: number; z: number }
  damageAttacker: number
}
export type TornadoBuilding = { id: number; model: number }
export type TornadoScenery = { id: number; model: number }
type TornadoWorld = { randomState: number; land: NativeTerrain }
const short = (n: number) => (n << 16) >> 16

function placeParticles(w: TornadoWorld, tornado: Tornado, base: number) {
  let x = tornado.x,
    y = tornado.y,
    h = base
  for (const particle of tornado.particles) {
    x = short(x + (random(w) & 0x27) - 20)
    y = short(y + (random(w) & 0x27) - 20)
    h -= 90
    Object.assign(particle, { x, y, h })
  }
}

// 0x50f270: model-20 Whirlwind initialization.
export function createTornado(
  land: NativeTerrain,
  start: Point,
  destination: Pick<Point, 'x' | 'y'>,
  tribe: number,
  rng: { randomState: number }
): Tornado {
  const tornado: Tornado = {
    ...start,
    tribe,
    destinationX: destination.x,
    destinationY: destination.y,
    spawnX: start.x,
    spawnY: start.y,
    remaining: 200,
    phase: 0,
    headingTimer: random(rng) & 7,
    heading: random(rng) & 0x7ff,
    step: 120,
    steering: 100,
    particles: Array.from({ length: 16 }, () => ({ ...start })),
    soundPlaying: false,
  }
  const world = { land, randomState: rng.randomState }
  placeParticles(world, tornado, terrainPointHeight(land, tornado) + 1440)
  rng.randomState = world.randomState
  return tornado
}

// 0x50f490: active movement, follower scan, decay, and terminal cleanup.
export function stepTornado(
  w: TornadoWorld,
  tornado: Tornado,
  effects: {
    people: (cell: number) => TornadoPerson[]
    buildings: (cell: number) => TornadoBuilding[]
    scenery: (cell: number) => TornadoScenery[]
    capture: (person: TornadoPerson) => void
    damage: (building: TornadoBuilding) => void
    damageScenery: (scenery: TornadoScenery) => void
    sound: (stop: boolean) => void
  }
) {
  tornado.remaining--
  if (tornado.phase && tornado.remaining <= 0) {
    tornado.remaining = 24
    tornado.phase = 2
    if (tornado.soundPlaying) effects.sound(true)
    return false
  }
  if (!tornado.soundPlaying) {
    effects.sound(false)
    tornado.soundPlaying = true
  }
  tornado.steering--
  movePosition(tornado, tornado.heading, tornado.step)
  tornado.h = terrainPointHeight(w.land, tornado)
  placeParticles(w, tornado, tornado.h + (tornado.phase ? (tornado.remaining - 8) * 90 : 1440))
  if (!tornado.phase) {
    const cell = ((tornado.y & 0xfe00) | ((tornado.x >>> 8) & 254)) >>> 0
    for (const person of effects.people(cell))
      if (
        !(person.flags3 & 0x800) &&
        person.model !== 8 &&
        !(person.flags4 & 0x8000) &&
        person.state !== 24 &&
        !(person.flags2 & 0x100000)
      )
        effects.capture(person)
    for (const building of effects.buildings(cell))
      if (!(rules.buildingFlags[building.model] & 0x8000) && (random(w) & 7) < 2)
        effects.damage(building)
    for (const scenery of effects.scenery(cell))
      if (scenery.model >= 1 && scenery.model <= 6 && (random(w) & 7) < 4)
        effects.damageScenery(scenery)
  }
  if (--tornado.headingTimer <= 0) {
    if (tornado.steering) {
      tornado.headingTimer = random(w) & 7
      tornado.heading =
        (nativeAngle(short(tornado.spawnX - tornado.x), -short(tornado.spawnY - tornado.y)) +
          (random(w) % 455) -
          227) &
        2047
    } else {
      tornado.headingTimer = random(w) & 31
      tornado.heading =
        (nativeAngle(
          short(tornado.x - tornado.destinationX),
          -short(tornado.y - tornado.destinationY)
        ) +
          (random(w) % 853) -
          426) &
        2047
    }
  }
  if (!tornado.remaining) {
    tornado.remaining = 24
    tornado.phase = 1
  } else if (tornado.phase) {
    tornado.particles.shift()
    if (tornado.remaining < 12 && tornado.soundPlaying) {
      effects.sound(true)
      tornado.soundPlaying = false
    }
  }
  return true
}

// 0x4d8e40: state-24 Whirlwind carry and throw.
export function stepTornadoPerson(
  w: TornadoWorld,
  person: TornadoPerson,
  tornado: Tornado | undefined,
  gameFlags: number
) {
  if (tornado?.phase === 0 && ++person.substate < 19) {
    person.flags2 = (person.flags2 | 0x4000) >>> 0
    const angle = (323 * person.substate) & 2047,
      vertical = (19402 * person.substate) >> 8,
      jitter = (random(w) % 19402) >> 8,
      radius = Math.trunc((vertical * 255) / 1440)
    person.x = (tornado.x + (Math.imul(rules.sine[(angle + 512) & 2047], radius) >> 16)) & 65535
    person.y = (tornado.y + (Math.imul(rules.sine[angle], radius) >> 16)) & 65535
    person.h = Math.max(person.h, tornado.h + vertical + jitter - 37)
    return true
  }
  person.flags3 = (person.flags3 | 0x400) >>> 0
  person.flags2 = ((person.flags2 | 0x82000) & ~0x4000) >>> 0
  person.heading = random(w) & 2047
  person.velocity.x = person.velocity.z = 0
  groundVelocity(person.velocity, person, 192, person.heading, (x, y) =>
    terrainPointHeight(w.land, { x, y })
  )
  person.velocity.y = 230
  if (tornado) person.damageAttacker = tornado.tribe
  person.previousState = person.state
  person.state =
    gameFlags & 2 && person.model === 7 ? 39 : rules.personModels[person.model].nextState
  return false
}
