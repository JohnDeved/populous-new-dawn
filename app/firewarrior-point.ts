import type { Effect, NativePoint, Point, Unit, World } from './world-types.ts'
import { nativeAngle, short } from './native-math.ts'
import { browserPosition, nativeDistance, nativeStep3D } from './world-coordinates.ts'
import { terrainPointHeight } from './native-terrain.ts'
import { TURNS_PER_SECOND } from './world-rules.ts'
import { createSpellTrail } from './spell-trails.ts'
import constants from './original-constants.json' with { type: 'json' }

type PointShotPerson = NativePoint & {
  heading: number
  supportHeight: number
  tribe: number
  flags3: number
  disguise: number
}
interface PointShotHooks {
  effect: (world: World, kind: Effect['kind'], point: Point) => Effect
  sound: (world: World, cue: number, point: Point) => void
}
function locate(fx: Effect, p: NativePoint) {
  Object.assign(fx, browserPosition(p))
  fx.height = p.h / 45
}

// 0x51fbf0 / 0x4bbcf0: celebration passes a null actor and an explicit sky
// point. Ordinary actor-target shots remain in firewarrior.ts.
export function launchFirewarriorPoint(
  w: World,
  source: Unit,
  person: PointShotPerson,
  destination: NativePoint,
  hooks: PointShotHooks
) {
  let tracked = 0
  for (const side of [-1, 1]) {
    const position = nativeStep3D(person, person.heading + side * 512, 512, 0x60),
      fx = hooks.effect(w, 'firewarriorShot', browserPosition(position))
    position.h = short(
      Math.max(position.h, terrainPointHeight(w.land, position)) + person.supportHeight + 16
    )
    locate(fx, position)
    fx.duration = Infinity
    fx.sprite = { sequence: 'blastShot', frame: 0, fixed: true }
    fx.firewarriorShot = {
      source: source.id,
      target: 0,
      attacker: person.tribe,
      remaining: 0,
      point: true,
      impact: side === 1,
      destination: { ...destination },
    }
    tracked = fx.id
    hooks.sound(w, 0xa1, fx)
  }
  const cooldown = 25 >> (person.flags3 & 0x80000 ? constants.BLOODLUST_SW_BLAST_X : 0)
  person.disguise = cooldown
  source.cooldown = cooldown / TURNS_PER_SECOND
  return tracked
}

export function stepFirewarriorPoint(
  w: World,
  fx: Effect,
  position: NativePoint,
  hooks: PointShotHooks
) {
  const shot = fx.firewarriorShot!,
    destination = shot.destination!
  position.h = Math.round((fx.height ?? position.h / 45) * 45)
  destination.h = Math.max(destination.h, terrainPointHeight(w.land, destination))
  const distance = nativeDistance(position, destination),
    // 0x4bc059–0x4bc09a: subtract sign-extended coordinates, not wrapped deltas.
    // A short toroidal distance alone must not retire a shot across the seam.
    arrived =
      Math.abs(short(destination.x) - short(position.x)) < 0x408 &&
      Math.abs(short(destination.y) - short(position.y)) < 0x408 &&
      Math.abs(short(destination.h) - short(position.h)) < 0x408 &&
      distance < 0x200,
    length = arrived ? Math.trunc((distance * 15) / 16) : 0x200,
    trail = hooks.effect(w, 'trail', browserPosition(position))
  trail.sprite = { sequence: 'blastTrail', frame: 0 }
  const animation = createSpellTrail(
    w.land,
    position,
    3,
    (w.effectCounter - 1) & 255,
    w.cosmeticRandom
  )
  trail.animation = animation
  trail.height = animation.h / 45
  trail.duration = Infinity
  const dx = short(destination.x - position.x),
    dy = short(destination.y - position.y),
    yaw = nativeAngle(dx, -dy),
    pitch = nativeAngle(Math.max(Math.abs(dx), Math.abs(dy)), -2 * (destination.h - position.h)),
    next = nativeStep3D(position, yaw, pitch, length)
  next.h = Math.max(next.h, terrainPointHeight(w.land, next))
  locate(fx, next)
  if (arrived) {
    if (shot.impact) hooks.sound(w, 0xb2, fx)
    fx.duration = fx.age
  }
}
