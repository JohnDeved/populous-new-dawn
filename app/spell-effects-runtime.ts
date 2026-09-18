import constants from './original-constants.json' with { type: 'json' }
import rules from './original-rules.json' with { type: 'json' }
import modelAssets from './original-models.json' with { type: 'json' }
import type { NativeModel } from './model-faces.ts'
import {
  buildingFirePeople,
  createLivePerson,
  initializeLivePanic,
  registerLivePerson,
  setLivePersonAnimation,
  type LivePerson,
} from './live-people.ts'
import { nativePersonModel } from './live-combat.ts'
import {
  cellDistanceSquared,
  nativeAngle,
  positionDistance,
  random,
  short,
  spiralCell,
} from './native-math.ts'
import { moveObjectInCells, objectsInCell, removeObjectFromCell } from './object-cells.ts'
import { unitAnimationSource } from './selection-runtime.ts'
import {
  createFire,
  createAngel,
  effect,
  emitGroundSpark,
  moveVisual,
  shotVisual,
  sound,
} from './world-effects.ts'
import { addUnit, population } from './world-state.ts'
import { nativePosition, syncLandscapeObjects } from './world-terrain-runtime.ts'
import { browserPosition, nativeDistance, nativeStep3D, shotAngles } from './world-coordinates.ts'
import { release, releaseTasks } from './world-tasks.ts'
import {
  teamForTribe,
  tribeForTeam,
  type Building,
  type Effect,
  type NativePoint,
  type Point,
  type Spell,
  type Team,
  type Tree,
  type Unit,
  type World,
} from './world-types.ts'
import {
  buildingFirePoints,
  buildingModel,
  buildingOutsidePoint,
  buildingPose,
} from './building-shapes.ts'
import { ensureBuildingDamage, igniteBuilding } from './building-damage.ts'
import { createBlastWave, stepBlastWave, type BlastTarget, type BlastWave } from './blast-wave.ts'
import { terrainPointHeight } from './native-terrain.ts'
import { damagePerson } from './person-update.ts'
import { personAnimationObject, randomPersonSpeed } from './person-state.ts'
import { restingCellCollision } from './person-collision.ts'
import { isShaman, maxHp, TURNS_PER_SECOND } from './world-rules.ts'
import { createLandBridge } from './land-bridge.ts'
import { createFlatten } from './flatten.ts'
import { createErosion } from './erosion.ts'
import { createFirestorm } from './firestorm.ts'
import { createEarthquake } from './earthquake.ts'
import { createVolcano } from './volcano.ts'
import { createConvertWild, stepConvertWild } from './convert-wild.ts'
import { createTornado } from './tornado.ts'
import { createSwamp, excessSwamp, stepSwamp, type Swamp, type SwampTarget } from './swamp.ts'
import {
  SWARM_LIFETIME,
  createSwarmState,
  hasSwarmRuntime,
  initializeSwarmInsects,
  stepSwarmLifetime,
  stepSwarmMotion,
  swarmNeedsScan,
  swarmState,
} from './swarm.ts'
import { tell } from './live-command.ts'
import { unitKindFromModel } from './unit-kinds.ts'
import {
  boardLiveVehicle,
  damageLiveVehicle,
  leaveLiveVehicle,
  liveVehicleCellObjects,
} from './live-vehicles.ts'
import { startArmageddon } from './armageddon.ts'
import { setDirectPersonDestination } from './person-routes.ts'

const debrisModels: Record<number, NativeModel> = modelAssets
const SHIELD_TURNS = constants.SHIELD_COUNT_X8 * 8
const BLOODLUST_TURNS = constants.BLOODLUST_COUNT_X8 * 8
const INVISIBILITY_TURNS = constants.INVISIBLE_COUNT_X8 * 8
const HYPNOTISE_COUNT = constants.HYPNO_COUNT_X8

function retainedPeople(u: Unit) {
  return [
    ...new Set([u.native, u.flight, u.fight?.motion, u.entry?.person, u.builder?.person]),
  ].filter(Boolean) as LivePerson[]
}

function replaceHypnotisedUnit(w: World, source: Unit, team: Team, originalTeam?: Team) {
  const slot = w.units.indexOf(source)
  if (slot < 0) return
  const position = { x: source.x, z: source.z },
    { hp, cargo, heading, kind } = source,
    people = retainedPeople(source)
  releaseTasks(w, source)
  for (const p of people) if (p.flags2 & 0x20000) removeObjectFromCell(w.objectCells, p)
  w.objectCells.objects.delete(source.id)
  w.selected = w.selected.filter(id => id !== source.id)
  const replacement = addUnit(w, team, kind, position)
  Object.assign(replacement, { hp, cargo, heading })
  replacement.native = createLivePerson(w, replacement)
  if (originalTeam) {
    replacement.hypnotise = {
      originalTeam,
      remaining: HYPNOTISE_COUNT,
      counter: replacement.native.counter,
    }
    replacement.native.flags4 = (replacement.native.flags4 | 0x4000) >>> 0
  }
  registerLivePerson(w, replacement.native)
  w.units[slot] = replacement
  w.units.pop()
  return replacement
}

export function applyHypnotise(w: World, point: Point, team: Team) {
  const center = nativePosition(w, point),
    x = (center.x >>> 8) & 254,
    y = (center.y >>> 8) & 254,
    order = new Map<string, number>()
  for (const dy of [-2, 0, 2])
    for (const dx of [-2, 0, 2]) order.set(`${(x + dx) & 254}:${(y + dy) & 254}`, order.size)
  const targets = w.units
    .map((u, index) => {
      const p = nativePosition(w, u),
        scan = order.get(`${(p.x >>> 8) & 254}:${(p.y >>> 8) & 254}`)
      return { u, p, scan: scan === undefined ? -1 : scan * w.units.length + index }
    })
    .filter(({ u, scan }) => {
      const p = unitAnimationSource(u)
      return (
        scan >= 0 &&
        u.inside === null &&
        ![1, 7, 8].includes(nativePersonModel(u)) &&
        u.team !== team &&
        !((p?.flags4 ?? 0) & 0x1000) &&
        !u.invisibility
      )
    })
    .toSorted(
      (a, b) => positionDistance(a.p, center) - positionDistance(b.p, center) || b.scan - a.scan
    )
    .slice(0, constants.HYPNO_NUM_PEOPLE)
  for (const { u } of targets) {
    const p = unitAnimationSource(u)
    if ((p?.flags4 ?? 0) & 0x800) {
      releaseTasks(w, u)
      if ((p?.flags2 ?? 0) & 0x20000) removeObjectFromCell(w.objectCells, p as LivePerson)
      w.objectCells.objects.delete(u.id)
      w.selected = w.selected.filter(id => id !== u.id)
      w.units.splice(w.units.indexOf(u), 1)
      continue
    }
    replaceHypnotisedUnit(w, u, team, u.hypnotise?.originalTeam ?? u.team)
  }
  return targets
}

export function stepUnitHypnotise(w: World) {
  for (const u of [...w.units]) {
    const status = u.hypnotise
    if (!status || u.hp <= 0) continue
    status.counter = (status.counter + 1) & 255
    if (status.counter & 7 || --status.remaining > 0) continue
    const tribe = tribeForTeam(status.originalTeam)
    if (tribe >= 0 && w.manaTribes[tribe].defeatTimer) {
      delete u.hypnotise
      for (const p of retainedPeople(u)) p.flags4 = (p.flags4 & ~0x4000) >>> 0
    } else replaceHypnotisedUnit(w, u, status.originalTeam)
  }
}

export function restoreDeadHypnotisedUnit(u: Unit) {
  if (!u.hypnotise) return
  u.team = u.hypnotise.originalTeam
  delete u.hypnotise
  for (const p of retainedPeople(u)) {
    p.tribe = tribeForTeam(u.team)
    p.flags4 = (p.flags4 & ~0x4000) >>> 0
  }
}

function setUnitShield(u: Unit, turns: number) {
  u.shield = turns
  for (const p of [u.native, u.flight, u.fight?.motion, u.entry?.person, u.builder?.person])
    if (p) p.flags3 = turns ? (p.flags3 | 0x8000) >>> 0 : (p.flags3 & ~0x8000) >>> 0
}

export function stepUnitShields(w: World) {
  for (const u of w.units) if (u.shield) setUnitShield(u, u.shield - 1)
}

export function shieldFollowers(w: World, point: Point, team: Team) {
  const center = nativePosition(w, point)
  // ponytail: nearest candidates approximate the unavailable native radius-3
  // land-list callbacks; replace this ordering when 00515e30 is exportable.
  const targets = w.units
    .filter(
      u =>
        u.team === team &&
        u.kind !== 'shaman' &&
        u.hp > 0 &&
        u.inside === null &&
        positionDistance(nativePosition(w, u), center) <= 3 * 512
    )
    .toSorted(
      (a, b) =>
        positionDistance(nativePosition(w, a), center) -
        positionDistance(nativePosition(w, b), center)
    )
    .slice(0, constants.SHIELD_NUM_PEOPLE)
  for (const u of targets) setUnitShield(u, SHIELD_TURNS)
  return targets
}

function setUnitBloodlust(u: Unit, turns: number) {
  u.bloodlust = turns
  for (const p of [u.native, u.flight, u.fight?.motion, u.entry?.person, u.builder?.person])
    if (p) p.flags3 = turns ? (p.flags3 | 0x80000) >>> 0 : (p.flags3 & ~0x80000) >>> 0
}

export function stepUnitBloodlust(w: World) {
  for (const u of w.units) if (u.bloodlust) setUnitBloodlust(u, u.bloodlust - 1)
}

export function bloodlustFollowers(w: World, point: Point, team: Team) {
  const center = nativePosition(w, point),
    x = (center.x >>> 8) & 254,
    y = (center.y >>> 8) & 254,
    units = new Map(w.units.map(u => [u.id, u])),
    candidates: Unit[] = []
  for (const dy of [-2, 0, 2])
    for (const dx of [-2, 0, 2])
      for (const p of objectsInCell(w.objectCells, ((x + dx) & 254) | (((y + dy) & 254) << 8))) {
        const u = units.get(p.id),
          person = p as LivePerson
        if (
          u?.team === team &&
          nativePersonModel(u) !== 1 &&
          nativePersonModel(u) !== 7 &&
          nativePersonModel(u) !== 8 &&
          !(person.flags4 & 0x4800) &&
          !(p.flags3 & 0x80000)
        )
          candidates.push(u)
      }
  const targets = candidates
    .map((u, order) => ({ u, order }))
    .toSorted(
      (a, b) =>
        positionDistance(nativePosition(w, a.u), center) -
          positionDistance(nativePosition(w, b.u), center) || b.order - a.order
    )
    .slice(0, constants.BLOODLUST_NUM_PEOPLE)
    .map(({ u }) => u)
  for (const u of targets) setUnitBloodlust(u, BLOODLUST_TURNS)
  return targets
}

export function setUnitInvisibility(w: World, u: Unit, turns: number) {
  const wasInvisible = !!u.invisibility,
    renderFlag = unitInvisibilityRenderBit(w, u)
  u.invisibility = turns
  for (const p of new Set([
    u.native,
    u.flight,
    u.fight?.motion,
    u.entry?.person,
    u.builder?.person,
  ])) {
    if (!p) continue
    if (turns) {
      if (!wasInvisible) p.invisibilityRender = p.renderFlags & renderFlag ? 0 : renderFlag
      p.flags4 = (p.flags4 | 0x1000) >>> 0
      p.renderFlags |= renderFlag
    } else {
      if (p.invisibilityRender) p.renderFlags &= ~p.invisibilityRender
      delete p.invisibilityRender
      p.flags4 = (p.flags4 & ~0x1000) >>> 0
    }
  }
}

export function unitInvisibleToPlayer(w: World, u: Unit) {
  return !!(
    u.invisibility &&
    u.team !== teamForTribe(w.manaWorld.playerTribe) &&
    !(w.manaTribes[w.manaWorld.playerTribe]?.flags2 & 8)
  )
}

export function unitInvisibilityRenderBit(w: World, u: Unit) {
  return u.team !== teamForTribe(w.manaWorld.playerTribe) &&
    !(w.manaTribes[w.manaWorld.playerTribe]?.flags2 & 8)
    ? 16
    : 0x4000
}

export function unitInvisibilityRenderFlag(w: World, u: Unit) {
  if (!u.invisibility) return 0
  const flag = unitInvisibilityRenderBit(w, u)
  if (flag !== 0x4000 || u.team !== teamForTribe(w.manaWorld.playerTribe)) return flag
  const timer = Math.ceil(u.invisibility! / 8),
    mask = timer < 6 ? 1 : timer < 14 ? 2 : timer < 24 ? 4 : 0
  return mask && !(w.turn & mask) ? 0 : flag
}

export function revealUnitInvisibility(w: World, u: Unit, audible = true) {
  if (!u.invisibility) return false
  if (audible) sound(w, 0x35, u, u.id)
  setUnitInvisibility(w, u, 0)
  return true
}

export function stepUnitInvisibility(w: World) {
  for (const u of w.units)
    if (u.invisibility && u.invisibility <= 1) revealUnitInvisibility(w, u)
    else if (u.invisibility) u.invisibility--
}

export function invisibilityFollowers(w: World, point: Point, team: Team) {
  const center = nativePosition(w, point),
    x = (center.x >>> 8) & 254,
    y = (center.y >>> 8) & 254,
    order = new Map<string, number>()
  for (const dy of [-2, 0, 2])
    for (const dx of [-2, 0, 2]) order.set(`${(x + dx) & 254}:${(y + dy) & 254}`, order.size)
  const targets = w.units
    .map((u, index) => {
      const p = nativePosition(w, u),
        scan = order.get(`${(p.x >>> 8) & 254}:${(p.y >>> 8) & 254}`)
      return { u, p, scan: scan === undefined ? -1 : scan * w.units.length + index }
    })
    .filter(
      ({ u, scan }) =>
        scan >= 0 &&
        u.team === team &&
        u.kind !== 'shaman' &&
        u.hp > 0 &&
        u.inside === null &&
        !u.invisibility &&
        !((unitAnimationSource(u)?.flags4 ?? 0) & 0x1000)
    )
    .toSorted(
      (a, b) => positionDistance(a.p, center) - positionDistance(b.p, center) || b.scan - a.scan
    )
    .slice(0, constants.INVIS_NUM_PEOPLE)
    .map(({ u }) => u)
  for (const u of targets) setUnitInvisibility(w, u, INVISIBILITY_TURNS)
  return targets
}

function igniteBuildingAt(w: World, target: NativePoint, tribe: number) {
  const index = ((target.y & 65535) >> 9) * 128 + ((target.x & 65535) >> 9)
  const id = w.land.buildingIds[index] & 1023
  const building = w.buildings.find(b => b.id === id && b.hp > 0)
  if (building) {
    const state = ensureBuildingDamage(building)
    igniteBuilding(state, tribe, () => {
      building.burn = { remaining: 127, soundPlaying: false }
      const ignitePeople = buildingFirePeople(w)
      for (const point of buildingFirePoints(buildingPose(building))) {
        createFire(w, browserPosition(point), {
          size: point.size,
          light: point.light,
          snap: false,
          smoke: true,
          turns: 135,
          suppressEmbers: true,
        })
        building.burn.soundPlaying = true
        ignitePeople(point, tribeForTeam(building.team))
      }
    })
  }
}

// 0x511ae0's first bolt turn: ignite burnable scenery in the target cell;
// without scenery, create the short-lived, cell-centered fire instead.
export function igniteLightningScenery(w: World, target: NativePoint, tribe: number) {
  igniteBuildingAt(w, target, tribe)
  const trees = w.trees.filter(tree => {
    const p = nativePosition(w, tree)
    return (
      tree.model <= 6 &&
      tree.logs > 0 &&
      !tree.burn &&
      (p.x & 0xfe00) === (target.x & 0xfe00) &&
      (p.y & 0xfe00) === (target.y & 0xfe00)
    )
  })
  for (const tree of trees)
    tree.burn = {
      remaining: 76,
      started: false,
      wood: Math.round(tree.logs * 100),
      scale: debrisModels[tree.model + 12].scale,
    }
  const fires = w.effects.filter(
    ({ fire }) =>
      fire &&
      !fire.expiring &&
      (fire.x & 0xfe00) === (target.x & 0xfe00) &&
      (fire.y & 0xfe00) === (target.y & 0xfe00)
  )
  for (const { fire } of fires) {
    fire!.expiring = true
    fire!.remaining = 0
  }
  if (!trees.length && !fires.length)
    createFire(w, browserPosition(target), { size: 16, snap: true, smoke: false, turns: 24 })
}

// 0x511800: effect model 28, emitted by a Firestorm projectile at impact.
function impactFirestorm(w: World, target: NativePoint, tribe: number) {
  const index = ((target.y & 65535) >> 9) * 128 + ((target.x & 65535) >> 9),
    point = browserPosition(target)
  if (rules.terrainCategoryFlags[w.land.categories[index] & 15] & 2) {
    effect(w, 'splash', point, true)
    sound(w, 0x55, point)
  } else {
    createFire(w, point, {
      size: 32,
      snap: false,
      smoke: false,
      turns: 22,
      suppressEmbers: true,
    })
    sound(w, 0xb6, point)
  }
  const wave = emitBlastWave(w, point, teamForTribe(tribe))
  wave.panic = true
  wave.scatter = true
  igniteBuildingAt(w, target, tribe)
}

export function processProjectiles(w: World) {
  // Newest native allocations precede older objects. Full mixed-class scheduling remains to be ported.
  for (const shot of [...w.projectiles].reverse()) {
    const caster = w.units.find(u => u.team === shot.team && isShaman(u) && u.hp > 0)
    const remove = () => {
      w.projectiles.splice(w.projectiles.indexOf(shot), 1)
      for (const f of shot.visuals) f.duration = f.age
    }
    if (shot.fireball && shot.remaining > 0) {
      shot.remaining--
      continue
    }
    if (shot.phase === 'windup') {
      if (!caster) {
        remove()
        continue
      }
      if (--shot.remaining > 0) continue
      shot.source = { x: caster.x, z: caster.z }
      shot.origin = nativePosition(w, caster)
      shot.origin.h += 0x60
      shot.position = { ...shot.origin }
      // 0x4c21e0: Lightning aims 0x400 above, displaced 0x600 toward the shaman.
      if (shot.spell === 'lightning') {
        const d = shot.destination,
          yaw = nativeAngle(short(shot.origin.x - d.x), -short(shot.origin.y - d.y))
        shot.destination = nativeStep3D({ ...d, h: d.h + 0x400 }, yaw, 512, 0x600)
      }
      shot.phase = 'flying'
      if (shot.spell === 'blast') {
        sound(w, 0xa1, shot.source)
        shot.visuals = Array.from({ length: 5 }, (_, i) =>
          shotVisual(w, shot.position, shot.team, 'blastShot', i + 3)
        )
      }
      continue
    }
    if (shot.phase === 'arrived') {
      if (!shot.fireball && caster)
        finishCast(w, { id: shot.caster, team: shot.team, ...shot.source }, shot.spell, shot.target)
      remove()
      continue
    }
    const p = shot.position,
      d = shot.destination
    if (shot.spell === 'blast' || shot.fireball) {
      // 0x4bb440: model-4 projectiles snap inside the arrival sphere and delete next turn.
      const speed = shot.fireball ? 250 : 1000
      if (
        Math.abs(short(d.x - p.x)) < 0x408 &&
        Math.abs(short(d.y - p.y)) < 0x408 &&
        Math.abs(d.h - p.h) < 0x408 &&
        nativeDistance(p, d) < speed
      ) {
        shot.position = {
          ...d,
          h: Math.max(d.h, nativePosition(w, browserPosition(d)).h),
        }
        shot.phase = 'arrived'
        // 0x4bb440 removes the four attached tails, but the shot's own head
        // reaches the target and remains visible until deletion on its next visit.
        moveVisual(shot.visuals[0], shot.position)
        for (const f of shot.visuals.slice(1)) f.duration = f.age
        if (shot.fireball) impactFirestorm(w, d, tribeForTeam(shot.team))
        continue
      }
      const [yaw, pitch] = shotAngles(p, d)
      shot.position = nativeStep3D(p, yaw, pitch, speed)
      shot.position.h = Math.max(
        shot.position.h,
        nativePosition(w, browserPosition(shot.position)).h
      )
      const travelled = nativeDistance(shot.position, shot.origin)
      moveVisual(shot.visuals[0], shot.position)
      for (let i = 1; i <= 4; i++)
        if (i * 80 < travelled)
          moveVisual(shot.visuals[i], nativeStep3D(shot.position, yaw, pitch, -i * 80))
      // Four jitter trails; jitter uses game RNG, effect initialization uses cosmetic RNG.
      if (!shot.fireball && shot.turns > 0)
        for (let i = 1; i <= 4; i++)
          if (320 + i * 160 < travelled) {
            const tail = nativeStep3D(
              nativeStep3D(shot.position, yaw, pitch, -320),
              yaw,
              pitch,
              -i * 160
            )
            tail.x = short(tail.x + 8 - (random(w) & 15))
            tail.y = short(tail.y + 8 - (random(w) & 15))
            shotVisual(w, tail, shot.team, 'blastTrail')
          }
    } else {
      // 0x4baf00: 20 substeps of 70; each trail starts with four turns before its second phase.
      for (let i = 0; i < 20; i++) {
        const p = shot.position,
          tail = {
            ...p,
            x: short(p.x + 8 - (random(w) & 15)),
            y: short(p.y + 8 - (random(w) & 15)),
          }
        tail.h = Math.max(tail.h, nativePosition(w, browserPosition(tail)).h)
        shotVisual(w, tail, shot.team, 'spellTrail')
        if (
          Math.abs(short(d.x - p.x)) < 108 &&
          Math.abs(short(d.y - p.y)) < 108 &&
          Math.abs(d.h - p.h) < 108
        ) {
          if (caster)
            finishCast(
              w,
              { id: shot.caster, team: shot.team, ...shot.source },
              shot.spell,
              shot.target,
              shot.position
            )
          remove()
          break
        }
        const [yaw, pitch] = shotAngles(p, d)
        shot.position = nativeStep3D(p, yaw, pitch, 70)
      }
    }
    shot.turns++
  }
}
export function emitBlastWave(w: World, point: Point, team: Team, standardForce = false) {
  const position = nativePosition(w, point)
  position.h = terrainPointHeight(w.land, position)
  const fx = effect(w, 'blastWave', point)
  fx.wave = createBlastWave(
    position,
    tribeForTeam(team),
    !standardForce && !!(w.manaWorld.loadFlags & 0x04000000)
  )
  fx.duration = Infinity
  sound(w, 0xa1, point)
  return fx.wave
}

// Native force/damage dispatch with live object adapters. Ordinary allocation
// still supplies cell order; complete mixed-class lists remain open.
export function stepLiveBlastWave(w: World, wave: BlastWave) {
  syncLandscapeObjects(w)
  const units = new Map(
    w.units.filter(u => u.hp > 0 || u.flight || u.native?.state === 44).map(u => [u.id, u])
  )
  const buildings = new Map(w.buildings.filter(b => b.hp > 0).map(b => [b.id, b]))
  const vehicles = new Map(w.vehicles.filter(v => v.active).map(v => [v.id, v]))
  const cells = new Map<number, BlastTarget[]>()
  const records = new Map<number, BlastTarget>()
  const people = new Map<number, LivePerson>()
  const shaken = new Map<number, Building | Tree>()
  const add = (p: BlastTarget) => {
    records.set(p.id, p)
    const index = ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9)
    const cell = cells.get(index) ?? []
    cell.unshift(p)
    cells.set(index, cell)
  }
  for (const u of units.values()) {
    if (u.inside !== null) continue
    const existing = u.flight ?? u.fight?.motion ?? u.native
    const p = existing ?? createLivePerson(w, u)
    p.life = Math.round(u.hp * 20)
    people.set(p.id, p)
    add(Object.assign(p, { shake: 0, shakeOrigin: 0 }))
  }
  const addShaken = (
    source: Building | Tree,
    objectClass: 2 | 5,
    model: number,
    tribe: number,
    state: number,
    flags2 = 0,
    flags3 = 0
  ) => {
    shaken.set(source.id, source)
    add({
      ...nativePosition(w, source),
      id: source.id,
      class: objectClass,
      model,
      tribe,
      state,
      previousState: 0,
      flags2,
      flags3,
      flags4: 0,
      velocity: { x: 0, y: 0, z: 0 },
      vehicle: 0,
      burnTrail: 0,
      life: 0,
      shake: source.shake ?? 0,
      shakeOrigin: source.shakeOrigin ?? 0,
    })
  }
  for (const b of buildings.values())
    addShaken(
      b,
      2,
      buildingModel(b),
      tribeForTeam(b.team),
      b.damageState?.state ?? (b.progress === 1 ? 2 : 1),
      b.damageState?.flags2,
      b.damageState?.flags3
    )
  for (const tree of w.trees)
    if (tree.logs > 0 && rules.sceneryResourceFlags[tree.model] & 0x40000)
      addShaken(tree, 5, tree.model, -1, 0)
  for (const v of vehicles.values())
    add({
      ...v,
      tribe: tribeForTeam(v.team),
      state: 0,
      previousState: 0,
      flags2: 0,
      flags3: 0,
      flags4: 256,
      velocity: { x: 0, y: 0, z: 0 },
      vehicle: 0,
      burnTrail: 0,
      shake: 0,
      shakeOrigin: 0,
    })
  const state = {
    randomState: w.randomState,
    search: w.indexedSearch,
    land: w.land,
    alliances: w.outcome.alliances,
    special: !!(w.manaWorld.loadFlags & 0x04000000),
  }
  const alive = stepBlastWave(
    state,
    wave,
    {
      cell: index => cells.get(index) ?? [],
      building: id => records.get(id),
    },
    {
      panic: p => {
        w.randomState = state.randomState
        initializeLivePanic(w, units.get(p.id)!, people.get(p.id)!, true)
        state.randomState = w.randomState
      },
      animation: p => {
        const u = units.get(p.id)
        if (!u) return
        const person = people.get(p.id)!
        const object = personAnimationObject(person)
        if (object !== -1) setLivePersonAnimation(w, person, object)
      },
      damage: (p, amount) => damagePerson(people.get(p.id)!, w.levelFlags2, wave.tribe, amount),
      buildingDamage: (p, amount) => {
        if (w.levelFlags2 & 0x04000000 || p.flags3 & 128) return
        const b = ensureBuildingDamage(buildings.get(p.id)!)
        b.damage = ((b.damage + amount) << 16) >> 16
        if (wave.tribe !== -1 && wave.tribe !== 255) b.attacker = wave.tribe
      },
      vehicleDamage: (p, amount) => damageLiveVehicle(w, vehicles.get(p.id)!, wave.tribe, amount),
      remove: p => {
        p.life = 0
      },
    }
  )
  for (const p of people.values()) {
    const u = units.get(p.id)
    if (!u) continue
    u.hp = p.life / 20
    u.burnTrail = p.burnTrail
    if (p.flags2 & 0x80000) {
      if (!u.flight) release(w, u)
      u.flight = p
      u.lift = 1
    }
  }
  for (const [id, source] of shaken) {
    const p = records.get(id)!
    if (p.shake && !source.shake) {
      source.shake = 1
      source.shakeOrigin = p.shakeOrigin
    }
  }
  w.randomState = state.randomState
  return alive
}

export function stepSwarm(w: World, fx: Effect) {
  const stored = fx.swarm!
  if (!hasSwarmRuntime(stored)) {
    const center = nativePosition(w, fx),
      migrated = createSwarmState(
        w,
        center,
        stored.tribe,
        point => terrainPointHeight(w.land, point)
      ),
      elapsed = Math.max(0, 65 - stored.remaining)
    migrated.remaining = Math.max(1, SWARM_LIFETIME - elapsed)
    migrated.applied = stored.applied
    fx.swarm = migrated
  }
  const swarm = swarmState(fx.swarm!)
  initializeSwarmInsects(w, swarm)
  if (swarmNeedsScan(swarm)) {
    const centerCell = ((swarm.y & 0xfe00) | ((swarm.x >>> 8) & 254)) >>> 0,
      cells = new Set([
        centerCell,
        ...Array.from({ length: 7 }, (_, i) => spiralCell(centerCell, i, 0)),
      ])
    for (const u of w.units) {
      if (u.hp <= 0 || u.inside !== null) continue
      const p =
          u.builder?.person ??
          u.flight ??
          u.fight?.motion ??
          u.native ??
          u.entry?.person ??
          createLivePerson(w, u),
        cell = ((p.y & 0xfe00) | ((p.x >>> 8) & 254)) >>> 0
      p.life = Math.round(u.hp * 20)
      if (
        !cells.has(cell) ||
        p.tribe === swarm.tribe ||
        p.state === 23 ||
        p.flags2 & 0x800000 ||
        rules.personModels[p.model].flags & 0x100
      )
        continue
      if (p.vehicle) {
        const vehicle = w.vehicles.find(candidate => candidate.id === p.vehicle)
        if (vehicle) leaveLiveVehicle(w, vehicle, p, { x: p.x, y: p.y })
      }
      if (p.flags4 & 0x800) {
        p.life = 0
        u.hp = 0
        continue
      }
      if (!(p.flags2 & 0x100000)) initializeLivePanic(w, u, p)
      if (p.model === 5) p.disguise = (p.tribe << 6) & 255
      damagePerson(p, w.levelFlags2, swarm.tribe, constants.SWARM_PERSON_DAMAGE)
      u.hp = p.life / 20
    }
    swarm.applied = true
  }
  stepSwarmMotion(w, swarm, point => terrainPointHeight(w.land, point))
  Object.assign(fx, browserPosition(swarm))
  fx.height = swarm.h / 45
  return stepSwarmLifetime(swarm)
}

export function stepLiveSwamp(w: World, swamp: Swamp) {
  const units = new Map<number, Unit>(),
    people = new Map<number, LivePerson>(),
    cells = new Map<number, SwampTarget[]>()
  for (const u of w.units) {
    if (u.inside !== null || (u.hp <= 0 && !u.flight)) continue
    const p = u.flight ?? u.fight?.motion ?? u.native ?? u.entry?.person ?? createLivePerson(w, u),
      cell = ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9),
      row = cells.get(cell) ?? []
    units.set(p.id, u)
    people.set(p.id, p)
    row.unshift({ ...p, attached: p.vehicle, immune: false })
    cells.set(cell, row)
  }
  swamp.counter = (swamp.counter + 1) & 255
  return stepSwamp(w.land, swamp, !!(w.manaWorld.gameFlags & 2), {
    cell: packed => cells.get(((packed >>> 9) & 127) * 128 + ((packed & 254) >>> 1)) ?? [],
    kill: target => {
      const p = people.get(target.id)!,
        u = units.get(p.id)!
      releaseTasks(w, u)
      u.native = p
      p.previousState = p.state
      p.state = 27
      p.flags2 = (p.flags2 | 0x100000) >>> 0
      p.damageAttacker = swamp.tribe
      u.hp = 0
    },
    remove: target => {
      const p = people.get(target.id)!,
        u = units.get(p.id)!
      releaseTasks(w, u)
      const index = w.units.indexOf(u)
      if (index !== -1) w.units.splice(index, 1)
      w.selected = w.selected.filter(id => id !== u.id)
    },
    sound: () => sound(w, 0xaa, browserPosition(swamp.center)),
  })
}

export function stepLiveConvertWild(w: World, fx: Effect) {
  const spell = fx.convertWild!,
    team = teamForTribe(spell.tribe),
    units = new Map<number, Unit>(),
    cells = new Map<number, LivePerson[]>()
  for (const u of w.units) {
    if (u.team !== 'wild' || u.hp <= 0 || u.inside !== null) continue
    const p = (u.native ??= createLivePerson(w, u)),
      cell = ((p.x >>> 8) & 254) | (p.y & 0xfe00),
      row = cells.get(cell) ?? []
    units.set(p.id, u)
    row.unshift(p)
    cells.set(cell, row)
  }
  spell.counter = (spell.counter + 1) & 255
  return stepConvertWild(spell, w, {
    population: () => population(w, team),
    people: cell => cells.get(cell) ?? [],
    unsupported: p => {
      const index = ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9)
      return (
        restingCellCollision(
          { flags: w.land.flags[index], category: w.land.categories[index] },
          w.land.walkMasks[0],
          p
        ) === 4
      )
    },
    strand: p => {
      const u = units.get(p.id)
      if (!u) return
      const person = u.native!
      person.previousState = person.state
      person.state = 8
      person.substate = 3
      person.flags2 = (person.flags2 | 0x40000000) >>> 0
    },
    suppressed: () => !!(w.manaTribes[spell.tribe].flags2 & 64),
    convert: p => {
      const u = units.get(p.id),
        slot = u ? w.units.indexOf(u) : -1
      if (!u || slot < 0) return
      releaseTasks(w, u)
      if (u.native!.flags2 & 0x20000) removeObjectFromCell(w.objectCells, u.native!)
      w.objectCells.objects.delete(u.id)
      u.native!.class = 0
      u.hp = 0
      const replacement = addUnit(w, team, 'brave', browserPosition(p))
      w.units[slot] = replacement
      w.units.pop()
      replacement.heading = u.heading
      replacement.native = createLivePerson(w, replacement)
      replacement.native.speed = randomPersonSpeed(w, replacement.native)
      replacement.native.flags4 = (replacement.native.flags4 | 0x40000) >>> 0
      registerLivePerson(w, replacement.native)
      sound(w, 5, browserPosition(p))
      // ponytail: reuse the packed birth flash until an asset import adds native effect model 58.
      effect(w, 'birth', browserPosition(p))
    },
    sparkle: (position, turns) => {
      const sparkle = effect(w, 'trail', browserPosition(position))
      sparkle.sprite = { sequence: 'sparkle', frame: 0 }
      sparkle.height = position.h / 45
      sparkle.duration = turns / TURNS_PER_SECOND
    },
  })
}

const ghostRanks = [0, 0, 1, 2, 4, 3, 5, 6]
function ghostArmyCell(w: World, p: Point) {
  const n = nativePosition(w, p)
  return ((n.x >>> 8) & 254) | (n.y & 0xfe00)
}
function ghostArmyModel(w: World, fx: Effect) {
  const tribe = tribeForTeam(fx.team!)
  if (w.manaTribes[tribe].playerType === 1) return 2
  const center = ghostArmyCell(w, fx)
  let model = 2,
    rank = ghostRanks[model]
  for (const u of w.units)
    if (
      u.team === fx.team &&
      u.hp > 0 &&
      u.inside === null &&
      cellDistanceSquared(ghostArmyCell(w, u), center) <= 2 &&
      ghostRanks[nativePersonModel(u)] > rank
    ) {
      model = nativePersonModel(u)
      rank = ghostRanks[model]
    }
  return model
}
function evictGhosts(w: World, team: Team, count: number, center: number) {
  const ghosts = [...w.units].reverse().filter(u => u.team === team && u.ghost && u.hp > 0)
  for (let excess = ghosts.length + count - 60; excess > 0; excess--) {
    let victim: Unit | undefined
    for (const group of [2, 7, 0]) {
      let farthest = 0
      for (const u of ghosts) {
        const model = nativePersonModel(u)
        if (
          u.hp <= 0 ||
          u.native?.state === 3 ||
          (group ? model !== group : model === 2 || model === 7)
        )
          continue
        const distance = cellDistanceSquared(ghostArmyCell(w, u), center)
        if (distance > farthest) {
          victim = u
          farthest = distance
        }
      }
      if (victim) break
    }
    if (victim && !((victim.native?.flags2 ?? 0) & 0x100000)) victim.hp = 0
  }
}
export function stepGhostArmy(w: World, fx: Effect) {
  if (fx.turnsRemaining === 4) {
    const center = nativePosition(w, fx),
      baseX = center.x & 0xfe00,
      baseY = center.y & 0xfe00
    for (let i = 0; i < 81; i++) {
      const position = {
        x: (baseX + (random(w) & 511)) & 65535,
        y: (baseY + (random(w) & 511)) & 65535,
        h: 0,
      }
      position.h = terrainPointHeight(w.land, position)
      random(w) // Successful class-7/model-3 initialization.
      emitGroundSpark(w, position)
    }
  }
  if (fx.turnsRemaining !== 0) return
  const model = ghostArmyModel(w, fx),
    kind = unitKindFromModel(model),
    count = model === 2 ? 6 : model === 7 ? 1 : 3,
    center = nativePosition(w, fx),
    team = fx.team!
  evictGhosts(w, team, count, ghostArmyCell(w, fx))
  for (let i = 0; i < count; i++) {
    const position = {
        x: short(center.x + (random(w) & 511) - 256),
        y: short(center.y + (random(w) & 511) - 256),
      },
      heading = random(w) & 2047,
      life = Math.round(maxHp(kind) * 20),
      hp = Math.floor((life * 3) / 4) + (random(w) % Math.floor(life / 4)),
      u = addUnit(w, team, kind, browserPosition(position))
    u.ghost = true
    u.heading = Math.PI - (heading * Math.PI) / 1024
    u.hp = hp / 20
    u.native = createLivePerson(w, u)
  }
}

// 0x515180: model-21 moves the owning tribe's Shaman when its height-banded
// effect visit arrives. It is not a generic person teleport.
export function stepTeleport(w: World, fx: Effect) {
  const teleport = fx.teleport!,
    visit = ++teleport.visits,
    height = (teleport.target.h << 16) >> 16,
    relocationVisit =
      height > 0x333
        ? 8
        : height > 0x267
          ? 9
          : height > 0x19b
            ? 10
            : height > 0xcf
              ? 11
              : height >= 0
                ? 12
                : Infinity
  if (visit === 1) {
    const visual = effect(w, 'trail', fx)
    visual.sprite = { sequence: 'sparkle', frame: 0 }
    visual.duration = 12 / TURNS_PER_SECOND
  }
  if (visit !== relocationVisit) return true
  const shaman = w.units.find(
    unit => unit.team === fx.team && unit.kind === 'shaman' && unit.hp > 0
  )
  if (!shaman) return false
  const origin = nativePosition(w, shaman),
    baseX = origin.x & 0xfe00,
    baseY = origin.y & 0xfe00
  for (let index = 0; index < 81; index++) {
    const position = {
      x: (baseX + (random(w) & 511)) & 65535,
      y: (baseY + (random(w) & 511)) & 65535,
      h: 0,
    }
    position.h = terrainPointHeight(w.land, position)
    emitGroundSpark(w, position)
  }
  const person = unitAnimationSource(shaman) ?? shaman.native ?? createLivePerson(w, shaman)
  if (person.vehicle) {
    const vehicle = w.vehicles.find(candidate => candidate.id === person.vehicle)
    if (vehicle) leaveLiveVehicle(w, vehicle, person, origin)
  }
  release(w, shaman)
  shaman.flight = undefined
  shaman.native = person
  let target = teleport.target,
    cell = ((target.y & 65535) >> 9) * 128 + ((target.x & 65535) >> 9)
  if (w.land.flags[cell] & 512) {
    const building = w.buildings.find(
      candidate => candidate.id === (w.land.buildingIds[cell] & 1023)
    )
    if (building) {
      const outside = buildingOutsidePoint(buildingPose(building))
      target = { ...outside, h: terrainPointHeight(w.land, outside) }
    }
  }
  target = {
    x: (target.x & 0xfe00) + 0x100,
    y: (target.y & 0xfe00) + 0x100,
    h: terrainPointHeight(w.land, target),
  }
  registerLivePerson(w, person)
  moveObjectInCells(w.objectCells, person, target)
  Object.assign(person, {
    anchorX: target.x,
    anchorY: target.y,
    speed: 0,
    previousState: person.state,
    state: w.manaWorld.levelFlags & 2 ? 39 : rules.personModels[7].nextState,
  })
  setDirectPersonDestination(w.motionRoutes, person, target)
  person.flags2 = (person.flags2 | 0x1080) >>> 0
  Object.assign(shaman, browserPosition(target))
  const vehicle = liveVehicleCellObjects(w, ((target.x >>> 8) & 254) | (target.y & 0xfe00)).find(
    candidate =>
      !candidate.passengerCount ||
      candidate.passengers.some(
        id => w.units.find(unit => unit.id === id)?.team === shaman.team
      )
  )
  if (vehicle) boardLiveVehicle(w, person, vehicle)
  return false
}

function finishCast(
  w: World,
  shaman: Pick<Unit, 'id' | 'team' | 'x' | 'z'>,
  spell: Spell,
  p: Point,
  endpoint?: NativePoint
) {
  if (spell === 'angel') {
    createAngel(w, shaman.team, p)
    return
  }
  if (spell === 'teleport') {
    const fx = effect(w, spell, p),
      target = nativePosition(w, p)
    fx.team = shaman.team
    fx.teleport = { visits: 0, target }
    fx.duration = Infinity
    fx.height = target.h / 45
    return
  }
  // Effect 78 uses the default wave initializer, then enables scatter.
  if (spell === 'blast') emitBlastWave(w, p, shaman.team).scatter = true
  const upper =
      (spell === 'lightning' || spell === 'tornado') && endpoint ? browserPosition(endpoint) : p,
    fx = effect(w, spell, upper)
  if (spell === 'armageddon') {
    fx.team = shaman.team
    if (!startArmageddon(w, fx)) fx.duration = fx.age
    return
  }
  if (spell === 'lightning') {
    // 0x511ef0 raises the displaced projectile endpoint above its local ground.
    // 0x511f70 creates the upper flash and bolt generator on the next turn.
    fx.lightning = {
      tribe: tribeForTeam(shaman.team),
      start: { ...nativePosition(w, upper), h: Math.round(fx.height! * 45) },
      target: nativePosition(w, p),
      seed: 0,
      turn: -1,
      segments: [],
    }
  }
  // Spell 2 allocates effect 78 (0x50b630) before effect 38 (0x509c10).
  if (spell === 'blast') {
    sound(w, 0xb2, p)
  } else if (spell === 'bridge') {
    sound(w, 0xab, p)
    sound(w, 0x29, p)
  } else if (spell === 'flatten') {
    sound(w, 0xae, p)
  } else if (spell === 'ghostArmy') {
    sound(w, 0xa8, p)
  }
  if (spell === 'bridge') {
    fx.bridge = createLandBridge(nativePosition(w, shaman), nativePosition(w, p))
    fx.team = shaman.team
    fx.duration = Infinity
    w.stats.bridges++
    tell(w, 'The earth rises. Lead your followers across the new Land Bridge.')
  } else {
    if (spell === 'flatten') {
      fx.flatten = createFlatten(w.land, nativePosition(w, p))
      fx.team = shaman.team
      fx.duration = Infinity
    } else if (spell === 'erosion') {
      fx.erosion = createErosion(nativePosition(w, p))
      fx.team = shaman.team
      fx.duration = Infinity
    } else if (spell === 'firestorm') {
      fx.firestorm = createFirestorm(nativePosition(w, p), tribeForTeam(shaman.team))
      fx.team = shaman.team
      fx.duration = Infinity
    } else if (spell === 'earthquake') {
      fx.earthquake = createEarthquake(nativePosition(w, p), tribeForTeam(shaman.team), w)
      fx.team = shaman.team
      fx.duration = Infinity
    } else if (spell === 'volcano') {
      fx.volcano = createVolcano(nativePosition(w, p), tribeForTeam(shaman.team))
      fx.team = shaman.team
      fx.duration = Infinity
    } else if (spell === 'convertWild') {
      fx.convertWild = createConvertWild(
        nativePosition(w, p),
        tribeForTeam(shaman.team),
        (w.effectCounter - 1) & 255,
        w.manaTribes[tribeForTeam(shaman.team)].playerType === 1
      )
      fx.team = shaman.team
      fx.duration = Infinity
      sound(w, 0xb4, p)
    } else if (spell === 'hypnotise') {
      fx.team = shaman.team
      fx.turnsRemaining = 16
      fx.duration = Infinity
      // ponytail: reuse the packed sparkle until the native effect-17 initializer is recovered.
      fx.sprite = { sequence: 'sparkle', frame: 0 }
    } else if (spell === 'ghostArmy') {
      fx.team = shaman.team
      fx.ghostArmy = true
      fx.turnsRemaining = 5
      fx.duration = Infinity
    } else if (spell === 'tornado') {
      fx.tornado = createTornado(
        w.land,
        endpoint ?? nativePosition(w, p),
        nativePosition(w, shaman),
        tribeForTeam(shaman.team),
        w
      )
      fx.team = shaman.team
      fx.duration = Infinity
      moveVisual(fx, fx.tornado)
    } else if (spell === 'swamp') {
      fx.swamp = createSwamp(
        nativePosition(w, p),
        tribeForTeam(shaman.team),
        (w.effectCounter - 1) & 255,
        w
      )
      fx.team = shaman.team
      fx.height = fx.swamp.center.h / 45
      fx.duration = Infinity
      const owned = w.effects.filter(candidate => candidate.swamp?.tribe === fx.swamp!.tribe),
        excess = excessSwamp(owned.map(candidate => candidate.swamp!))
      if (excess) {
        const oldest = owned.find(candidate => candidate.swamp === excess)!
        oldest.duration = oldest.age
      }
    } else if (spell === 'shield') {
      fx.sprite = { sequence: 'sparkle', frame: 0 }
      shieldFollowers(w, p, shaman.team)
    } else if (spell === 'invisibility') {
      fx.sprite = { sequence: 'sparkle', frame: 0 }
      if (invisibilityFollowers(w, p, shaman.team).length) sound(w, 0x31, p)
    } else if (spell === 'bloodlust') {
      fx.sprite = { sequence: 'sparkle', frame: 0 }
      bloodlustFollowers(w, p, shaman.team)
    } else if (spell === 'swarm') {
      const center = nativePosition(w, p)
      fx.swarm = createSwarmState(
        w,
        center,
        tribeForTeam(shaman.team),
        point => terrainPointHeight(w.land, point)
      )
      fx.duration = Infinity
      fx.height = swarmState(fx.swarm).h / 45
      sound(w, 0xa4, p)
    }
  }
}
