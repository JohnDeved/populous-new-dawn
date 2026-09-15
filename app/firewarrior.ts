import type { Effect, Unit, World } from './world-types.ts'
import rules from './original-rules.json' with { type: 'json' }
import { nativeAngle, short } from './native-math.ts'
import { browserPosition, nativeDistance, nativeStep3D } from './world-coordinates.ts'
import { nativePosition } from './world-terrain-runtime.ts'
import { effect, sound } from './world-effects.ts'
import { applyUnitDamage } from './combat-runtime.ts'
import { TURNS_PER_SECOND } from './world-rules.ts'

export const firewarriorRange = rules.personModels[6].idleRange
export const firewarriorCooldown = 25 / TURNS_PER_SECOND

function locate(fx: Effect, p: { x: number; y: number; h: number }) {
  Object.assign(fx, browserPosition(p))
  fx.height = p.h / 45
}

export function launchFirewarrior(w: World, source: Unit, target: Unit) {
  const origin = nativePosition(w, source),
    destination = nativePosition(w, target),
    yaw = nativeAngle(short(destination.x - origin.x), -short(destination.y - origin.y))
  origin.h += 80
  for (const side of [-1, 1]) {
    const position = nativeStep3D(origin, yaw + side * 512, 512, 0x60),
      fx = effect(w, 'firewarriorShot', browserPosition(position))
    fx.height = position.h / 45
    fx.duration = Infinity
    fx.sprite = { sequence: 'blastShot', frame: 0, fixed: true }
    fx.firewarriorShot = { source: source.id, target: target.id, remaining: 16 }
  }
  source.cooldown = firewarriorCooldown
  sound(w, 0xa1, source)
}

export function stepFirewarriorShots(w: World) {
  for (const fx of w.effects.filter(effect => effect.firewarriorShot)) {
    const shot = fx.firewarriorShot!,
      target = w.units.find(unit => unit.id === shot.target && unit.hp > 0)
    if (!target || !shot.remaining--) {
      fx.duration = fx.age
      continue
    }
    const position = nativePosition(w, fx),
      destination = nativePosition(w, target)
    position.h = Math.round((fx.height ?? position.h / 45) * 45)
    destination.h += 80
    if (nativeDistance(position, destination) <= 0x200) {
      // ponytail: this slice proves the ordinary Brave result. Add the native
      // target table, splash, protection, tower, bloodlust, and LOS as those live paths land.
      applyUnitDamage(target, 10)
      effect(w, 'hit', target)
      fx.duration = fx.age
      continue
    }
    const dx = short(destination.x - position.x),
      dy = short(destination.y - position.y),
      yaw = nativeAngle(dx, -dy),
      pitch = nativeAngle(Math.max(Math.abs(dx), Math.abs(dy)), -2 * (destination.h - position.h))
    locate(fx, nativeStep3D(position, yaw, pitch, 0x200))
  }
}
