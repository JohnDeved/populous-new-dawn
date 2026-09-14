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
import { removeObjectFromCell } from './object-cells.ts'
import { unitAnimationSource } from './selection-runtime.ts'
import {
  createFire,
  effect,
  emitGroundSpark,
  moveVisual,
  shotVisual,
  sound,
} from './world-effects.ts'
import { addUnit } from './world-state.ts'
import { nativePosition, syncLandscapeObjects } from './world-terrain-runtime.ts'
import { campaignTribe } from './campaign-runtime.ts'
import { browserPosition, nativeDistance, nativeStep3D, shotAngles } from './world-coordinates.ts'
import { release, releaseTasks } from './world-tasks.ts'
import type {
  Building,
  Effect,
  NativePoint,
  Point,
  Spell,
  Team,
  Tree,
  Unit,
  World,
} from './world-types.ts'
import { buildingFirePoints, buildingModel, buildingPose } from './building-shapes.ts'
import { ensureBuildingDamage, igniteBuilding } from './building-damage.ts'
import { createBlastWave, stepBlastWave, type BlastTarget, type BlastWave } from './blast-wave.ts'
import { terrainPointHeight } from './native-terrain.ts'
import { damagePerson } from './person-update.ts'
import { personAnimationObject } from './person-state.ts'
import { isShaman, maxHp, SPELLS } from './world-rules.ts'
import { createLandBridge } from './land-bridge.ts'
import { createFlatten } from './flatten.ts'
import { createErosion } from './erosion.ts'
import { createFirestorm } from './firestorm.ts'
import { createEarthquake } from './earthquake.ts'
import { createVolcano } from './volcano.ts'
import { createConvertWild } from './convert-wild.ts'
import { createTornado } from './tornado.ts'
import { createSwamp, excessSwamp } from './swamp.ts'
import { tell } from './live-command.ts'
import { unitKindFromModel } from './unit-kinds.ts'

const debrisModels: Record<number, NativeModel> = modelAssets
const SHIELD_TURNS = constants.SHIELD_COUNT_X8 * 8
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
    const tribe = status.originalTeam === 'blue' ? 0 : status.originalTeam === 'red' ? 1 : -1
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
    p.tribe = u.team === 'blue' ? 0 : u.team === 'red' ? 1 : -1
    p.flags4 = (p.flags4 & ~0x4000) >>> 0
  }
}

function setUnitShield(u: Unit, turns: number) {
  u.shield = turns
  for (const p of [u.native, u.flight, u.fight?.motion, u.entry?.person, u.builder?.person])
    if (p) p.flags3 = turns ? (p.flags3 | 0x80000) >>> 0 : (p.flags3 & ~0x80000) >>> 0
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
    u.team !== (w.manaWorld.playerTribe === 0 ? 'blue' : 'red') &&
    !(w.manaTribes[w.manaWorld.playerTribe]?.flags2 & 8)
  )
}

export function unitInvisibilityRenderBit(w: World, u: Unit) {
  return u.team !== (w.manaWorld.playerTribe === 0 ? 'blue' : 'red') &&
    !(w.manaTribes[w.manaWorld.playerTribe]?.flags2 & 8)
    ? 16
    : 0x4000
}

export function unitInvisibilityRenderFlag(w: World, u: Unit) {
  if (!u.invisibility) return 0
  const flag = unitInvisibilityRenderBit(w, u)
  if (flag !== 0x4000 || u.team !== (w.manaWorld.playerTribe === 0 ? 'blue' : 'red')) return flag
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
        ignitePeople(point, building.team === 'blue' ? 0 : 1)
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
  const wave = emitBlastWave(w, point, tribe === 0 ? 'blue' : 'red')
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
        if (shot.fireball) impactFirestorm(w, d, shot.team === 'blue' ? 0 : 1)
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
    team === 'blue' ? 0 : 1,
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
      b.team === 'blue' ? 0 : 1,
      b.damageState?.state ?? (b.progress === 1 ? 2 : 1),
      b.damageState?.flags2,
      b.damageState?.flags3
    )
  for (const tree of w.trees)
    if (tree.logs > 0 && rules.sceneryResourceFlags[tree.model] & 0x40000)
      addShaken(tree, 5, tree.model, -1, 0)
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
      vehicleDamage: () => {
        throw new Error('Live vehicle damage has no vehicle owner')
      },
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
  const swarm = fx.swarm!
  if (!swarm.applied) {
    const center = nativePosition(w, fx),
      centerCell = ((center.y & 0xfe00) | ((center.x >>> 8) & 254)) >>> 0,
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
      if (p.flags4 & 0x800) {
        p.life = 0
        u.hp = 0
        continue
      }
      if (!(p.flags2 & 0x100000)) initializeLivePanic(w, u, p)
      damagePerson(p, w.levelFlags2, swarm.tribe, constants.SWARM_PERSON_DAMAGE)
      u.hp = p.life / 20
    }
    swarm.applied = true
  }
  // ponytail: one proven native victim pass plus a 65-turn visible lifetime;
  // add native building pursuit when its controller duration and state 2 are recovered.
  return --swarm.remaining > 0
}

const ghostRanks = [0, 0, 1, 2, 4, 3, 5, 6]
function ghostArmyCell(w: World, p: Point) {
  const n = nativePosition(w, p)
  return ((n.x >>> 8) & 254) | (n.y & 0xfe00)
}
function ghostArmyModel(w: World, fx: Effect) {
  const tribe = fx.team === 'blue' ? 0 : 1
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

function finishCast(
  w: World,
  shaman: Pick<Unit, 'id' | 'team' | 'x' | 'z'>,
  spell: Spell,
  p: Point,
  endpoint?: NativePoint
) {
  // Effect 78 uses the default wave initializer, then enables scatter.
  if (spell === 'blast') emitBlastWave(w, p, shaman.team).scatter = true
  const upper =
      (spell === 'lightning' || spell === 'tornado') && endpoint ? browserPosition(endpoint) : p,
    fx = effect(w, spell, upper)
  if (spell === 'lightning') {
    // 0x511ef0 raises the displaced projectile endpoint above its local ground.
    // 0x511f70 creates the upper flash and bolt generator on the next turn.
    fx.lightning = {
      tribe: shaman.team === 'blue' ? 0 : 1,
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
      fx.firestorm = createFirestorm(nativePosition(w, p), shaman.team === 'blue' ? 0 : 1)
      fx.team = shaman.team
      fx.duration = Infinity
    } else if (spell === 'earthquake') {
      fx.earthquake = createEarthquake(nativePosition(w, p), shaman.team === 'blue' ? 0 : 1, w)
      fx.team = shaman.team
      fx.duration = Infinity
    } else if (spell === 'volcano') {
      fx.volcano = createVolcano(nativePosition(w, p), shaman.team === 'blue' ? 0 : 1)
      fx.team = shaman.team
      fx.duration = Infinity
    } else if (spell === 'convertWild') {
      fx.convertWild = createConvertWild(
        nativePosition(w, p),
        shaman.team === 'blue' ? 0 : 1,
        (w.effectCounter - 1) & 255,
        w.manaTribes[shaman.team === 'blue' ? 0 : 1].playerType === 1
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
        shaman.team === 'blue' ? 0 : 1,
        w
      )
      fx.team = shaman.team
      fx.duration = Infinity
      moveVisual(fx, fx.tornado)
    } else if (spell === 'swamp') {
      fx.swamp = createSwamp(
        nativePosition(w, p),
        shaman.team === 'blue' ? 0 : 1,
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
    } else if (spell === 'swarm') {
      fx.swarm = {
        tribe: shaman.team === 'blue' ? 0 : campaignTribe(w),
        remaining: 65,
        applied: false,
      }
      fx.sprite = { sequence: 'smoke', frame: 0 }
      fx.duration = Infinity
      sound(w, 0xa4, p)
    }
    if (shaman.team === 'blue')
      tell(w, `${SPELLS.find(s => s.id === spell)!.name}! The world bends to your will.`)
  }
}
