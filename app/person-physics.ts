import rules from './original-rules.json' with { type: 'json' }
import {
  terrainSlopeRange,
  terrainDrift,
  terrainPointHeight,
  hasNonLand,
  type NativeTerrain,
} from './native-terrain.ts'
import {
  turnPerson,
  groundVelocity,
  positionsOverlap,
  stepMotionRecovery,
  recoverGroundObstacle,
  type RecoveryPerson,
} from './person-motion.ts'
import {
  buildingBlocksPerson,
  personStepCollision,
  type CollisionWorld,
  type CollisionPerson,
} from './person-collision.ts'
import { nativeAngle } from './native-math.ts'

type Position = { x: number; y: number }
type Velocity = { x: number; y: number; z: number }
type Ground = Pick<NativeTerrain, 'heights' | 'flags' | 'categories' | 'walkMasks'>
const short = (n: number) => (n << 16) >> 16

// 0x4e78f0 / 0x4e7980: ordinary and impulse velocity caps, respectively.
export function limitPersonVelocity(physics: number, v: Velocity, impulse = false) {
  const [xy, vertical] = impulse
    ? rules.personImpulseLimits[physics]
    : [short(rules.personVelocityLimits[physics]), short(rules.personVerticalLimits[physics])]
  v.x = Math.min(xy, Math.max(-xy, v.x))
  v.z = Math.min(xy, Math.max(-xy, v.z))
  v.y = Math.min(vertical, Math.max(-vertical, v.y))
}

// 0x4e7880: model flag 8 chooses triangle slope instead of the active walk map.
export function unsupportedGround(land: Ground, p: Position, physics: number, mask = 0) {
  if (rules.personPhysicsFlags[physics] & 8)
    return terrainSlopeRange(land, p) > short(rules.personSlopeLimits[physics])
  const bit = ((p.y >>> 8) & 255) * 256 + ((p.x >>> 8) & 255)
  return !(land.walkMasks[mask][bit >> 3] & (1 << (bit & 7)))
}

// 0x4e9050: terrain-change/impulse flags trigger airborne eligibility.
export function markPersonAirborne(
  land: Ground,
  p: Position & { physics: number; flags2: number },
  mask = 0
) {
  if (p.flags2 & 0x2004 && unsupportedGround(land, p, p.physics, mask)) {
    p.flags2 = (p.flags2 | 0x80000) >>> 0
    return true
  }
  return false
}

export type SettlingPerson = Position & {
  class: number
  model: number
  physics: number
  state: number
  previousState: number
  flags2: number
  flags3: number
  flags4: number
  motionTimer: number
  motionMode: number
  target: number
  velocity: Velocity
}
export type SettleEffects = {
  animation: () => void
  release: () => void
  initialize: () => void
  class3: () => void
  canFight: (target: number) => boolean
  readyToFight: () => boolean
}

// 0x4e9160: leave airborne motion, restore the correct state or resume a fight.
// State release/initialization, fight consumers and the class-3 consumer are
// explicit boundaries; this routine does not stand in for the whole physics loop.
export function settlePerson(
  land: Ground,
  p: SettlingPerson,
  to: Position,
  gameFlags: number,
  objects: ReadonlyMap<number, { class: number; flags2: number }>,
  effects: SettleEffects,
  mask = 0
) {
  let settle = false
  if (!(p.flags4 & 0x400) && !unsupportedGround(land, to, p.physics, mask)) {
    const speed = short(rules.personSpeeds[p.physics]),
      v = p.velocity
    settle =
      ((Math.imul(v.x, v.x) + Math.imul(v.z, v.z)) | 0) <=
      ((Math.imul(speed, speed) + Math.trunc(speed / 4)) | 0)
  }
  if (!settle && p.flags3 & 0x8000000)
    settle = hasNonLand(land, ((to.x >>> 8) & 254) | (to.y & 0xfe00), 1)
  if (!settle) return
  const flags2 = p.flags2,
    flags3 = p.flags3
  p.flags2 = (flags2 & ~0x80000) >>> 0
  p.flags3 = (flags3 & ~0x8000000) >>> 0
  if (p.flags4 & 0x2000) {
    if (p.class === 1) effects.animation()
    p.flags4 = (p.flags4 & ~0x2000) >>> 0
    return
  }
  if (flags3 & 0x10000) {
    p.flags3 = (flags3 & 0xf7feffff) >>> 0
    const target = p.target ? objects.get(p.target) : undefined
    if (
      !target ||
      !target.class ||
      target.flags2 & 1 ||
      !effects.canFight(p.target) ||
      !effects.readyToFight() ||
      p.flags2 & 0x100000
    )
      return
    p.previousState = p.state
    effects.release()
    p.state = 36
    effects.initialize()
    return
  }
  if (p.class !== 1) {
    if (p.class === 3) effects.class3()
    return
  }
  p.motionTimer = 0
  p.motionMode = 0
  p.flags2 = ((flags2 & 0xdff7f7ff) | 0x1000) >>> 0
  if (flags2 & 0x100000) return
  p.previousState = p.state
  const next = gameFlags & 2 && p.model === 7 ? 39 : rules.personModels[p.model].nextState
  effects.release()
  p.state = next
  effects.initialize()
}

// 0x4e9be0: back out in eight-unit diagonal steps, reflecting the axis of the
// last cell boundary crossed. Accessible buildings bypass the entire bounce.
export function bouncePerson(
  w: CollisionWorld,
  p: CollisionPerson & { velocity: Velocity },
  to: Position,
  reflect: boolean
) {
  const cell = w.cell(to)
  if (
    !(cell.flags & 0x80200) ||
    (p.flags4 & 0x10007 && cell.flags & 0x200 && !buildingBlocksPerson(w, p, cell))
  )
    return
  const dx = p.velocity.x > 0 ? -8 : 8,
    dy = p.velocity.z > 0 ? -8 : 8
  let x = to.x,
    y = to.y,
    previousX = x,
    steps = 0
  do {
    // A fully blocked wrapped diagonal also never terminates in the executable.
    if (steps++ === 8192)
      throw new Error('Native bounce has no unblocked cell on its wrapped diagonal')
    previousX = x
    x = (x + dx) & 65535
    y = (y + dy) & 65535
  } while (w.cell({ x, y }).flags & 0x80200)
  if (reflect) {
    const axis = (previousX & 0xfe00) === (x & 0xfe00) ? 'z' : 'x'
    p.velocity[axis] = short(-p.velocity[axis])
  }
  to.x = x
  to.y = y
}

export type PhysicsPerson = RecoveryPerson & SettlingPerson & CollisionPerson & { life: number }
type Point = Position & { h: number }
export type PhysicsWorld = {
  land: Ground
  collision: CollisionWorld
  gameFlags: number
  levelFlags: number
  playerTribe: number
  buildingModel: (id: number) => number
  route: (outside: boolean) => Position
}
export type PhysicsEffects = SettleEffects & {
  // 0x4ee580 owns cell lists and updates the person's stored position.
  insert: (to: Point) => boolean
  allocate: (unitClass: number, model: number, tribe: number, to: Point) => void
  sound: (cue: number) => void
  damage: (attacker: number, amount: number, mode: number) => void
  reveal: (radius: number, cell: number) => void
  path: () => void
}

// Complete 0x4e6d00 driver. World consumers remain explicit: cell insertion,
// object allocation, damage/audio, state transitions, reveal and path groups.
export function stepPersonPhysics(
  w: PhysicsWorld,
  p: PhysicsPerson,
  effects: PhysicsEffects,
  mask = 0
) {
  if (p.flags2 & 0x4000) return
  const to = { x: p.x, y: p.y, h: p.h },
    v = p.velocity,
    physics = p.physics
  const height = (x: number, y: number) => terrainPointHeight(w.land, { x, y })
  const move = () => {
    to.x = (to.x + v.x) & 65535
    to.y = (to.y + v.z) & 65535
    to.h = short(to.h + v.y)
  }
  const clampHeight = () => {
    to.h = Math.max(to.h, height(to.x, to.y))
  }
  const decay = (value: number, amount: number) =>
    short(Math.abs(value) < amount ? 0 : value <= 0 ? value + amount : value - amount)
  const fall = () => {
    p.flags4 = (p.flags4 | 0x400) >>> 0
    if (!(p.flags2 & 0x40000)) v.y = short(v.y - short(rules.personGravity[physics]))
    v.x = decay(v.x, 2)
    v.z = decay(v.z, 2)
    limitPersonVelocity(p.physics, v)
    move()
  }
  const landingEffect = () => effects.allocate(7, 3, p.tribe, { ...to })
  if (p.flags2 & 0x2000) {
    limitPersonVelocity(p.physics, v, true)
    move()
    v.y = short(v.y - short(rules.personGravity[physics]))
    if (!(rules.personPhysicsFlags[physics] & 4)) bouncePerson(w.collision, p, to, false)
    if (!(p.flags2 & 2)) clampHeight()
    effects.insert(to)
  }
  if (!(p.flags2 & 0x80000)) {
    const turning = turnPerson(p)
    if (height(to.x, to.y) < to.h) {
      fall()
      bouncePerson(w.collision, p, to, true)
      if (to.h <= height(to.x, to.y)) {
        p.flags2 = (p.flags2 | 0x1000) >>> 0
        p.flags4 = (p.flags4 & ~0x400) >>> 0
      }
    } else {
      if (p.flags4 & 0x400) landingEffect()
      p.flags4 = (p.flags4 & ~0x400) >>> 0
      let speed = p.speed
      const destination = { x: p.turnAngle, y: p.turnY }
      if (p.flags2 & 0x200 && !(p.flags2 & 128) && positionsOverlap(p, 56, destination, 1024)) {
        const dx = short(destination.x - p.x),
          dy = short(destination.y - p.y),
          distance = (dx * dx + dy * dy) | 0
        if (distance < speed * speed) speed = Math.floor(Math.sqrt(distance >>> 0))
      }
      if (speed) {
        const cell = w.collision.cell(p),
          onBuilding = !!(cell.flags & 0x200)
        stepMotionRecovery(
          p,
          onBuilding,
          () => !!buildingBlocksPerson(w.collision, p, cell),
          w.route
        )
        v.x = v.z = 0
        if (v.y < 0) v.y = 0
        groundVelocity(v, to, speed, short(p.heading), height)
        limitPersonVelocity(p.physics, v)
        move()
        to.h = height(to.x, to.y)
        const blocked = (point: Point) => personStepCollision(w.collision, p, point)
        if (blocked(to)) {
          if (turning) Object.assign(to, { x: p.x, y: p.y, h: height(p.x, p.y) })
          else if (
            !recoverGroundObstacle(p, to, onBuilding, height, blocked) &&
            unsupportedGround(w.land, p, p.physics, mask)
          )
            p.flags2 = (p.flags2 | 0x80000) >>> 0
        }
      }
    }
  } else {
    if (height(to.x, to.y) < to.h) {
      if (!(p.flags4 & 0x400)) {
        if (p.model === 7) effects.sound(p.tribe === w.playerTribe ? 0x1a : 0x89)
        else if (v.y >= 91) effects.sound(0xc4)
      }
      fall()
      p.heading = (p.heading + 0x93) & 2047
      p.angle = p.heading
    } else {
      const landed = !!(p.flags4 & 0x400)
      p.flags4 = (p.flags4 & ~0x400) >>> 0
      if (landed) {
        if (v.y < -99 && !(rules.terrainCategoryFlags[w.collision.cell(to).category & 15] & 2)) {
          if (v.y < -199) effects.damage(-1, rules.personFallDamage, 1)
          if (p.life > 0) {
            if (p.model === 7) effects.sound(0x1b)
            else if (p.model !== 1) effects.sound(9)
          }
        }
        if (p.class === 1) effects.animation()
        landingEffect()
      }
      const drift = terrainDrift(w.land, to)
      v.x = short(v.x + drift.x)
      v.y = short(v.y + drift.y)
      v.z = short(v.z + drift.z)
      const bit = (to.y >>> 8) * 256 + (to.x >>> 8)
      if (w.land.walkMasks[mask][bit >> 3] & (1 << (bit & 7))) {
        const friction = short(
          rules.personFriction[physics][
            rules.terrainCategoryFlags[w.collision.cell(to).category & 15] & 0x3e ? 1 : 0
          ]
        )
        v.x = decay(v.x, friction)
        v.z = decay(v.z, friction)
      }
      limitPersonVelocity(p.physics, v)
      move()
      p.heading = nativeAngle(short(to.x - p.x), -short(to.y - p.y))
      p.angle = p.flags2 & 0x8000 ? (p.heading + 1024) & 2047 : p.heading
    }
    bouncePerson(w.collision, p, to, true)
    settlePerson(w.land, p, to, w.gameFlags, w.collision.objects, effects, mask)
  }
  if (!(p.flags2 & 2)) clampHeight()
  const moved = effects.insert(to)
  if (p.supportHeight) {
    const cell = w.collision.cell(p)
    if (
      !(cell.flags & 0x200) ||
      !rules.buildingSupportHeight[w.buildingModel(cell.building & 1023)]
    )
      p.supportHeight = 0
  }
  if (w.levelFlags & 4 && moved && p.tribe === w.playerTribe) {
    const heading = p.heading & 2047,
      dx = (rules.sine[heading] << 9) >> 16,
      dy = (rules.sine[(heading + 512) & 2047] << 9) >> 16
    let x = p.x,
      y = p.y
    for (let i = 0; i < 5; i++, x = (x + dx) & 65535, y = (y + dy) & 65535) {
      if (!(w.collision.cell({ x, y }).flags & 8)) {
        effects.reveal(2, ((p.x >>> 8) & 254) | (p.y & 0xfe00))
        break
      }
    }
  }
  effects.path()
}
