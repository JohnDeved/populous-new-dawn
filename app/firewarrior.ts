import {
  tribeForTeam,
  type Building,
  type Effect,
  type NativePoint,
  type Unit,
  type World,
} from './world-types.ts'
import rules from './original-rules.json' with { type: 'json' }
import { nativeAngle, short } from './native-math.ts'
import { browserPosition, nativeDistance, nativeStep3D } from './world-coordinates.ts'
import { nativePosition } from './world-terrain-runtime.ts'
import { terrainPointHeight } from './native-terrain.ts'
import { effect, sound } from './world-effects.ts'
import { applyUnitDamage } from './combat-runtime.ts'
import { damageBuilding, ensureBuildingDamage } from './building-damage.ts'
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

type FirewarriorTarget =
  | { entity: Unit | Building }
  | { point: NativePoint; origin: NativePoint; heading: number }

export function launchFirewarrior(w: World, source: Unit, target: Unit | Building) {
  return launchShots(w, source, { entity: target })
}

export function launchCelebrationShots(
  w: World,
  source: Unit,
  person: NativePoint & { heading: number },
  point: NativePoint
) {
  return launchShots(w, source, { point, origin: person, heading: person.heading })
}

function launchShots(w: World, source: Unit, target: FirewarriorTarget) {
  const pointTarget = 'point' in target,
    origin = pointTarget ? target.origin : nativePosition(w, source),
    destination = pointTarget ? target.point : nativePosition(w, target.entity),
    tower = w.buildings.find(
      building => building.id === source.inside && building.kind === 'tower'
    ),
    yaw = pointTarget
      ? target.heading
      : nativeAngle(short(destination.x - origin.x), -short(destination.y - origin.y))
  let tracked = 0
  const heightOffset = tower
    ? (source.entry?.person.supportHeight ?? source.supportHeight ?? 0) + 16
    : 80
  for (const side of [-1, 1]) {
    const position = nativeStep3D(origin, yaw + side * 512, 512, 0x60),
      fx = effect(w, 'firewarriorShot', browserPosition(position))
    position.h = Math.max(position.h, terrainPointHeight(w.land, position)) + heightOffset
    if (pointTarget) position.h = short(position.h)
    fx.height = position.h / 45
    fx.duration = Infinity
    fx.sprite = { sequence: 'blastShot', frame: 0, fixed: true }
    fx.firewarriorShot = {
      source: source.id,
      attacker: tribeForTeam(source.team),
      tower: !!tower,
      bloodlust: !!source.bloodlust,
      impact: side === 1,
      ...(pointTarget
        ? {
            pointTarget: {
              x: short(destination.x),
              y: short(destination.y),
              h: short(destination.h),
            },
          }
        : {
            target: target.entity.id,
            remaining: 16,
            destination: { ...destination, h: destination.h + 80 },
          }),
    }
    if (pointTarget) sound(w, 0xa1, fx)
    tracked = fx.id
  }
  source.cooldown =
    (tower ? towerFirewarriorCooldown : firewarriorCooldown) /
    (source.bloodlust ? 1 << constants.BLOODLUST_SW_BLAST_X : 1)
  if (!pointTarget) sound(w, 0xa1, source)
  return tracked
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

export function firewarriorReady(w: World, source: Unit, target: Unit | Building, inTower = false) {
  const origin = nativePosition(w, source),
    destination = nativePosition(w, target),
    person = source.entry?.person ?? source.native,
    range = engagementRange(
      {
        model: 6,
        state: person?.state ?? source.native?.state ?? (inTower ? 21 : 17),
        commandStatus: person?.commandStatus ?? 0,
        h: origin.h,
      },
      undefined,
      inTower
    ),
    threshold = range * 256 + 56
  return (
    Math.abs(short(destination.x - origin.x)) < threshold &&
    Math.abs(short(destination.y - origin.y)) < threshold
  )
}

export const towerFirewarriorReady = (w: World, source: Unit, target: Unit) =>
  firewarriorReady(w, source, target, true)

// Point-mode flight uses the native strict arrival gate and terminal sound,
// without an entity lookup, damage consumer or the legacy combat-shot timeout.
function stepCelebrationShot(w: World, fx: Effect, destination: NativePoint, impact: boolean) {
  const position = nativePosition(w, fx)
  position.h = Math.round((fx.height ?? position.h / 45) * 45)
  destination.h = Math.max(destination.h, terrainPointHeight(w.land, destination))
  const distance = nativeDistance(position, destination),
    arrived =
      Math.abs(short(destination.x) - short(position.x)) < 0x408 &&
      Math.abs(short(destination.y) - short(position.y)) < 0x408 &&
      Math.abs(destination.h - position.h) < 0x408 &&
      distance < 0x200,
    length = arrived ? Math.trunc((distance * 15) / 16) : 0x200,
    dx = short(destination.x - position.x),
    dy = short(destination.y - position.y),
    yaw = nativeAngle(dx, -dy),
    pitch = nativeAngle(Math.max(Math.abs(dx), Math.abs(dy)), -2 * (destination.h - position.h)),
    next = nativeStep3D(position, yaw, pitch, length)
  next.h = Math.max(next.h, terrainPointHeight(w.land, next))
  locate(fx, next)
  if (arrived) {
    if (impact) sound(w, 0xb2, fx)
    fx.duration = fx.age
  }
}

export function stepFirewarriorShots(w: World) {
  for (const fx of w.effects.filter(effect => effect.firewarriorShot)) {
    const shot = fx.firewarriorShot!
    if (shot.pointTarget) {
      if (fx.age < fx.duration) stepCelebrationShot(w, fx, shot.pointTarget, !!shot.impact)
      continue
    }
    const unit = w.units.find(unit => unit.id === shot.target && unit.hp > 0),
      building = w.buildings.find(building => building.id === shot.target && building.hp > 0),
      target = unit ?? building
    if (!shot.remaining--) {
      fx.duration = fx.age
      continue
    }
    const position = nativePosition(w, fx),
      destination = target ? nativePosition(w, target) : shot.destination
    if (!destination) {
      fx.duration = fx.age
      continue
    }
    position.h = Math.round((fx.height ?? position.h / 45) * 45)
    if (target) destination.h += 80
    if (nativeDistance(position, destination) <= 0x200) {
      // ponytail: this slice proves the ordinary Brave result. Add the native
      // target table, splash, protection, and LOS as those live paths land.
      const source = w.units.find(unit => unit.id === shot.source && unit.hp > 0),
        // Older in-flight checkpoints may omit the marker; retain their unit
        // impact behavior. Every current launch explicitly identifies its side.
        ownsImpact = shot.impact !== false,
        damaged =
          ownsImpact &&
          unit &&
          applyUnitDamage(
            unit,
            (shot.tower ? 25 : 10) * (shot.bloodlust ? constants.BLOODLUST_DAMAGE_X : 1)
          )
      if (damaged && source) {
        const attacker = tribeForTeam(source.team),
          person = unit.fight?.motion ?? unit.native ?? unit.entry?.person ?? unit.builder?.person
        unit.damageAttacker = attacker
        if (person) person.damageAttacker = attacker
      }
      if (building && shot.impact) {
        const state = ensureBuildingDamage(building),
          position = nativePosition(w, building),
          context = {
            levelFlags2: w.levelFlags2,
            playerTribe: w.manaWorld.playerTribe,
            attackAlert: w.attackAlert,
            attackCell: w.attackCell,
            tribes: w.manaTribes.map(tribe => ({ flags: tribe.flags2 })),
          },
          targetState = { ...state, ...position, tribe: tribeForTeam(building.team) }
        damageBuilding(context, targetState, 40, shot.attacker)
        Object.assign(state, { damage: targetState.damage, attacker: targetState.attacker })
        w.attackAlert = context.attackAlert
        w.attackCell = context.attackCell
        context.tribes.forEach((tribe, i) => (w.manaTribes[i].flags2 = tribe.flags))
      }
      if (target && ownsImpact) effect(w, 'hit', target)
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
