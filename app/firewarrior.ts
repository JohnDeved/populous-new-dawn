import type { Effect, Unit, World } from './world-types.ts'
import { tribeForTeam } from './world-types.ts'
import rules from './original-rules.json' with { type: 'json' }
import { nativeAngle, short } from './native-math.ts'
import { browserPosition, nativeDistance, nativeStep3D } from './world-coordinates.ts'
import { nativePosition } from './world-terrain-runtime.ts'
import { terrainPointHeight } from './native-terrain.ts'
import { effect, sound } from './world-effects.ts'
import { applyUnitDamage } from './combat-runtime.ts'
import { TURNS_PER_SECOND } from './world-rules.ts'
import { automaticTowerFirewarriorTarget } from './live-combat.ts'
import { engagementRange } from './melee-engagement.ts'
import constants from './original-constants.json' with { type: 'json' }

export const firewarriorRange = rules.personModels[6].idleRange
export const firewarriorCooldown = 25 / TURNS_PER_SECOND
export const towerFirewarriorCooldown = 36 / TURNS_PER_SECOND

function locate(fx: Effect, p: { x: number; y: number; h: number }) {
  Object.assign(fx, browserPosition(p))
  fx.height = p.h / 45
}

export function launchFirewarrior(w: World, source: Unit, target: Unit) {
  const origin = nativePosition(w, source),
    destination = nativePosition(w, target),
    tower = w.buildings.find(
      building => building.id === source.inside && building.kind === 'tower'
    ),
    yaw = nativeAngle(short(destination.x - origin.x), -short(destination.y - origin.y))
  const heightOffset = tower
    ? (source.entry?.person.supportHeight ?? source.supportHeight ?? 0) + 16
    : 80
  for (const side of [-1, 1]) {
    const position = nativeStep3D(origin, yaw + side * 512, 512, 0x60),
      fx = effect(w, 'firewarriorShot', browserPosition(position))
    position.h = Math.max(position.h, terrainPointHeight(w.land, position)) + heightOffset
    fx.height = position.h / 45
    fx.duration = Infinity
    fx.sprite = { sequence: 'blastShot', frame: 0, fixed: true }
    fx.firewarriorShot = {
      source: source.id,
      target: target.id,
      remaining: 16,
      tower: !!tower,
      bloodlust: !!source.bloodlust,
    }
  }
  source.cooldown =
    (tower ? towerFirewarriorCooldown : firewarriorCooldown) /
    (source.bloodlust ? 1 << constants.BLOODLUST_SW_BLAST_X : 1)
  sound(w, 0xa1, source)
}

export function stepTowerFirewarrior(w: World, source: Unit) {
  const target = automaticTowerFirewarriorTarget(w, source)
  if (!target || !towerFirewarriorReady(w, source, target)) return
  const origin = nativePosition(w, source),
    destination = nativePosition(w, target)
  source.heading = Math.atan2(short(destination.x - origin.x), -short(destination.y - origin.y))
  source.fighting = true
  launchFirewarrior(w, source, target)
}

export function towerFirewarriorReady(w: World, source: Unit, target: Unit) {
  const origin = nativePosition(w, source),
    destination = nativePosition(w, target),
    person = source.entry?.person,
    range = engagementRange(
      {
        model: 6,
        state: person?.state ?? 21,
        commandStatus: person?.commandStatus ?? 0,
        h: origin.h,
      },
      undefined,
      true
    ),
    threshold = range * 256 + 56
  return (
    Math.abs(short(destination.x - origin.x)) < threshold &&
    Math.abs(short(destination.y - origin.y)) < threshold
  )
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
      // target table, splash, protection, and LOS as those live paths land.
      const source = w.units.find(unit => unit.id === shot.source),
        damaged = applyUnitDamage(
          target,
          (shot.tower ? 25 : 10) * (shot.bloodlust ? constants.BLOODLUST_DAMAGE_X : 1)
        )
      if (damaged && source) {
        const attacker = tribeForTeam(source.team),
          person =
            target.fight?.motion ?? target.native ?? target.entry?.person ?? target.builder?.person
        target.damageAttacker = attacker
        if (person) person.damageAttacker = attacker
      }
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
