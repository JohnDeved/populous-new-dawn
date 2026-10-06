import { tribeForTeam, type Point, type Unit, type World } from './world-types.ts'
import {
  createLivePerson,
  registerLivePerson,
  changeLivePersonState,
  leaveLiveBuilding,
  type LivePerson,
} from './live-people.ts'
import { unitAnimationSource } from './selection-runtime.ts'
import { nativePosition, nativeCellIndex } from './world-terrain-runtime.ts'
import { combatPerson, nativePersonModel } from './live-combat.ts'
import {
  buildingFootprintCells,
  buildingModel,
  buildingPose,
  buildingPosition,
  buildingOutsidePoint,
  buildingInsidePoint,
} from './building-shapes.ts'
import { buildingAdmission } from './live-building-entry.ts'
import {
  currentPersonOrder,
  deselectPerson,
  emptyPersonOrder,
  writePersonOrder,
  commitPersonOrders,
  clearPersonOrders,
  prepareMovementOrder,
  queuePersonOrder,
  allocatePersonOrder,
  attachPersonOrder,
  prepareCellOrder,
} from './person-orders.ts'
import {
  appendLiveOrders,
  appendLiveGuardOrders,
  startLiveConstructionOrder,
  returnLivePerson,
  orderEffects,
  adoptLiveOrders,
} from './live-movement.ts'
import { cellDistanceSquared, random, spiralCell } from './native-math.ts'
import { isShaman, SPELLS } from './world-rules.ts'
import {
  campaignPersonCount,
  campaignAttackEntity,
  campaignAttackTarget,
  campaignTeam,
  campaignTribe,
} from './campaign-runtime.ts'
import {
  availableTrainingPeople,
  selectComputerPeople,
  selectComputerPerson,
  type SelectionUnit,
  type SelectionWorld,
} from './computer-selection.ts'
import {
  computerPhase,
  acquireSelection,
  dispatchComputerTask,
  hasComputerTrainingCapacity,
  produceComputerTasks,
  releaseSelection,
  requestConstruction,
  requestEarlyResponseTask,
  requestPreacherTask,
  requestTraining,
  stepAttackTask,
  stepEarlyResponseTask,
  stepMarkerTask,
  stepShamanGuardTask,
  stepTrainingTask,
  type ComputerTask,
  type TrainingBuilding,
} from './computer.ts'
import { missionData } from './mission-data.ts'
import rules from './original-rules.json' with { type: 'json' }
import {
  beginCast,
  canShamanCast,
  computerSpellAllowed,
  computerSpellInRange,
  spellCaster,
  spellPaymentType,
  nativeSpellRange,
} from './spell-casting.ts'
import { clearLivePath, planLivePath } from './live-pathfinding.ts'
import { nativeCellPoint, browserPosition } from './world-coordinates.ts'
import {
  requestConvertTask,
  convertWildRegion,
  findConvertTarget,
  standableConvertTarget,
} from './computer-convert.ts'
import {
  castShoreBlast,
  chooseSpellTarget,
  processComputerSpells,
  stepConvertWildTarget,
  convertWildDensity,
  summarizeSpellEnemies,
  type SpellTargetUnit,
  type SpellTargetWorld,
} from './computer-spells.ts'
import { defaultPersonState, resetPersonMotion } from './person-state.ts'
import { refreshBuildingTerritory } from './territory.ts'
import { addBuilding, checkBuildingSite } from './construction-runtime.ts'
import { entrance, findPath, route } from './live-command.ts'
import { release, releaseTasks } from './world-tasks.ts'
import { objectsInCell } from './object-cells.ts'
import {
  collectDefenseTargets,
  defendedResponseCell,
  requestDefenseTask,
  stepDefenseTask,
  type DefenseObject,
} from './computer-defense.ts'

const mission11TowerRequested = 0x80000000,
  mission11HousingRequested = 0x40000000,
  mission12TowerRequested = 0x20000000

export function computerSelectionWorld(w: World, tribe: number, rawNative = false) {
  const team = campaignTeam(w, tribe),
    sources = new Map<number, LivePerson>(),
    people: SelectionUnit[] = []
  for (const u of w.units) {
    if (u.team !== team || u.hp <= 0) continue
    const source = unitAnimationSource(u) ?? (rawNative ? u.native : null),
      position = source ?? nativePosition(w, u)
    if (source) sources.set(u.id, source)
    people.push({
      id: u.id,
      class: 1,
      model: nativePersonModel(u),
      state: source?.state ?? (u.path.length ? 10 : 17),
      tribe,
      x: position.x & 65535,
      y: position.y & 65535,
      flags2: source?.flags2 ?? (u.inside === null ? 0 : 0x800000),
      flags3: source?.flags3 ?? 0,
      flags4: source?.flags4 ?? 0,
      assignment: source?.assignment ?? 0,
      busy:
        source?.computerAssignment ||
        source?.workFlags ||
        Number(!!u.fight || u.fighting || !!u.casting || u.work !== null || !!u.lift),
      vehicle: source?.vehicle ?? 0,
      driver: 0,
      inside: source?.building ?? u.inside ?? 0,
      immediateCommand: source?.immediateCommand ?? 0,
      commands: source?.commands ?? Array(8).fill(0),
      commandCursor: source?.commandCursor ?? 0,
    })
  }
  const units = new Map<number, SelectionUnit>(people.map(p => [p.id, p]))
  for (const b of w.buildings) {
    if (b.hp <= 0) continue
    const position = buildingPosition(buildingPose(b))
    units.set(b.id, {
      id: b.id,
      class: 2,
      model: buildingModel(b),
      state: b.progress === 1 ? 2 : 1,
      tribe: tribeForTeam(b.team),
      x: position.x & 65535,
      y: position.y & 65535,
      flags2: 0,
      flags3: 0,
      flags4: 0,
      assignment: 0,
      busy: 0,
      vehicle: 0,
      driver: 0,
      inside: b.admission?.inside ?? w.units.filter(u => u.hp > 0 && u.inside === b.id).length,
      immediateCommand: 0,
      commands: Array(8).fill(0),
      commandCursor: 0,
    })
  }
  const orders = new Map<number, { model: number; flags: number }>()
  w.buildingOrders.records.forEach((order, id) => orders.set(id, order))
  const world: SelectionWorld = {
    people,
    units,
    orders,
    tribes: Array.from({ length: 4 }, (_, id) => {
      const shaman = w.units.find(u => u.hp > 0 && isShaman(u) && u.team === campaignTeam(w, id)),
        p = shaman && nativePosition(w, shaman)
      return {
        hasBase: id === tribe && !!(w.ai.flags & 0x100),
        base: id === tribe ? w.ai.defencePosition : 0,
        shaman: p ? ((p.x >>> 8) & 254) | (p.y & 0xfe00) : 0,
        radius: id === tribe ? w.ai.defenceRadius : 0,
      }
    }),
    buildingAt: cell =>
      w.land.buildingIds[((cell & 0xfe00) >>> 9) * 128 + ((cell & 254) >>> 1)] & 1023,
  }
  return { world, sources }
}

//0x4f5680/0x4df0e0: this predicate is about active preaching orders,
//not the transient preaching/listening animation states.
export function computerPreachingAt(w: World, tribe: number, marker: number) {
  for (const u of w.units) {
    if (u.hp <= 0 || u.team !== campaignTeam(w, tribe)) continue
    const p = unitAnimationSource(u) ?? u.native
    if (!p || ![10, 33].includes(p.state)) continue
    const order = currentPersonOrder(w.buildingOrders, p)
    if (!order || order.flags & 1 || ![17, 31, 32].includes(order.model)) continue
    const cell = ((p.x >>> 8) & 254) | (p.y & 0xfe00)
    if (cell === (marker & 0xfefe) || (p.model === 4 && order.a === marker)) return true
  }
  return false
}

//0x4f4520. Selection happens before the native slot/state gate and retains its
//flags3 side effect even when the task cannot subsequently be allocated.
export function requestComputerPreacher(w: World, tribe: number, marker: number) {
  if (computerPreachingAt(w, tribe, marker)) return false
  const selected = computerSelectionWorld(w, tribe, true),
    id = selectComputerPerson(selected.world, 4, 4, -1, 1, marker, 0x47)
  if (id === null) return false
  const source = selected.sources.get(id)
  if (source) source.flags3 = selected.world.units.get(id)!.flags3
  return requestPreacherTask(w.ai, id, marker, w.ai.states, campaignPersonCount(w, tribe, 4))
}

//0x4f3280: only current order30 people return, with uncentered even coordinates.
export function returnComputerGuards(w: World, tribe: number) {
  const team = campaignTeam(w, tribe),
    shaman = w.units.find(u => u.hp > 0 && u.team === team && isShaman(u)),
    p = shaman && nativePosition(w, shaman),
    cell = w.ai.constructionBase ?? (p ? ((p.x >>> 8) & 254) | (p.y & 0xfe00) : 0),
    point = { x: (cell & 254) << 8, y: cell & 0xfe00 }
  for (const u of w.units) {
    if (u.hp <= 0 || u.team !== team) continue
    const source = unitAnimationSource(u) ?? u.native
    if (!source || ![10, 33].includes(source.state)) continue
    const order = currentPersonOrder(w.buildingOrders, source)
    if (order && !(order.flags & 1) && order.model === 30) returnLivePerson(w, u, point)
  }
}

function finishComputerPerson(w: World, u: Unit, p: LivePerson, cleanup: boolean) {
  if (cleanup) clearPersonOrders(w.buildingOrders, p, orderEffects(w))
  resetPersonMotion(p)
  if (!(p.flags2 & 0x100000)) {
    u.native = p
    changeLivePersonState(w, u, defaultPersonState(p, w.manaWorld.gameFlags))
  }
  adoptLiveOrders(w, u, p)
  if (cleanup) {
    const cell = (p.y >>> 9) * 128 + (p.x >>> 9),
      building =
        w.land.flags[cell] & 512
          ? w.buildings.find(b => b.id === (w.land.buildingIds[cell] & 1023))
          : undefined,
      point = building ? buildingOutsidePoint(buildingPose(building)) : p
    //0x405090 snaps the idle anchor, not the active goal/route fields.
    p.anchorX = (point.x & 0xfe00) + 0x100
    p.anchorY = (point.y & 0xfe00) + 0x100
    p.anchorFlags = 0
  }
}

function finishPreacherSelection(w: World, tribe: number, cleanup: boolean) {
  for (const u of w.units) {
    if (u.hp <= 0 || u.team !== campaignTeam(w, tribe)) continue
    const p = unitAnimationSource(u) ?? u.native
    if (p?.state === 14) finishComputerPerson(w, u, p, cleanup)
  }
}

//0x4c8c50, authored1074 phase4 path only; no unrelated phase2 RNG/search.
function stepComputerPreacher(w: World, tribe: number, index: number) {
  const task = w.ai.tasks[index],
    unit = w.units.find(u => u.id === task.entity && u.hp > 0),
    source = unit && (unitAnimationSource(unit) ?? unit.native)
  if (!unit || (source?.flags2 ?? 0) & 1 || task.flags & 2 || task.phase === 7) {
    if (acquireSelection(w.ai, index)) {
      finishPreacherSelection(w, tribe, true)
      releaseSelection(w.ai, index)
    }
    task.flags &= ~3
    return
  }
  if (task.phase === 4) {
    if (!acquireSelection(w.ai, index)) return
    task.phase = 5
    w.ai.commandDelay = 20
    const p = source ?? createLivePerson(w, unit)
    if (!(p.flags2 & 0x100000)) {
      unit.native = p
      changeLivePersonState(w, unit, 14)
    }
    return
  }
  if (task.phase === 5) {
    task.phase = 6
    return
  }
  if (task.phase === 6) {
    const group = { records: Array.from({ length: 8 }, emptyPersonOrder), count: 0, cursor: 0 }
    queuePersonOrder(group, 17, 0, task.target)
    releaseSelection(w.ai, index)
    const people = w.units.flatMap(u => {
      const p = unitAnimationSource(u) ?? u.native
      return u.hp > 0 && u.team === campaignTeam(w, tribe) && p ? [p] : []
    })
    commitPersonOrders(w.buildingOrders, group, people, [-1, -1, -1], {
      ...orderEffects(w),
      prepare: (order, model, a, b, flags = 0) => {
        if (model !== 17) throw new Error('Unexpected marker Preacher command')
        Object.assign(order, { model, a, b, flags: order.flags | flags })
      },
    })
    finishPreacherSelection(w, tribe, false)
    task.phase = 7
  }
}

// 0x4c7370: native type2 task, scoped to Mission3 until other producers are integrated.
function stepComputerConvert(w: World, tribe: number, index: number) {
  const task = w.ai.tasks[index],
    unit = w.units.find(u => u.hp > 0 && u.team === campaignTeam(w, tribe) && isShaman(u)),
    // The simulator's person may live in a fight/flight record even when its
    // current animation intentionally has no selectable presentation source.
    p =
      unit &&
      (unit.builder?.person ??
        unit.flight ??
        unit.fight?.motion ??
        unit.native ??
        unit.entry?.person ??
        (unit.native = createLivePerson(w, unit)))
  if (!p || p.computerAssignment) task.phase = 3
  if (task.phase === 3) {
    if (acquireSelection(w.ai, index)) {
      finishPreacherSelection(w, tribe, true)
      releaseSelection(w.ai, index)
    }
    task.flags &= ~3
    return
  }
  if (!unit || !p) return
  if (task.phase === 0) {
    task.target = w.ai.constructionBase ?? ((p.x >>> 8) & 254) | (p.y & 0xfe00)
    let target: number | null
    if (w.ai.flags & 0x40) {
      target = w.ai.coordinateLatch
      w.ai.flags = (w.ai.flags & ~0x40) >>> 0
    } else {
      const wild = w.units
          .filter(u => u.hp > 0 && u.team === 'wild')
          .map(u => nativePosition(w, u)),
        counts = new Uint8Array(64)
      for (const person of wild) counts[convertWildRegion(person)]++
      target = findConvertTarget(task.target, counts, wild, 0, w.ai.attributes[0] & 255)
    }
    if (target === null) task.phase = 3
    else {
      task.target = target
      task.remaining = 360
      task.elapsed = 0
      task.extra = 20
      task.phase = 2
    }
    return
  }
  if (task.phase === 2) {
    const target = standableConvertTarget(task.target, w.land)
    if (target === null) {
      task.phase = 3
      return
    }
    task.target = target
    const vehicles = w.vehicles.filter(v => v.active && v.team === campaignTeam(w, tribe)),
      counts = [1, 2, 3, 4].map(
        model => (vehicles.filter(v => v.model === model).length << 16) >> 16
      )
    if (counts.reduce((sum, count) => sum + count, 0)) task.phase = 4
    else {
      const point = { x: ((target & 254) + 1) << 8, y: (((target >>> 8) & 254) + 1) << 8 },
        reachable = planLivePath(w, unit, browserPosition(point), p, true)
      if (!reachable) p.flags4 = (p.flags4 & ~0x10000000) >>> 0
      task.phase = reachable ? 4 : 3
    }
    return
  }
  if (task.phase === 4) {
    if (acquireSelection(w.ai, index)) task.phase = 5
    return
  }
  if (task.phase === 5) {
    if (!(rules.personStateFlags[p.state] & 8) || p.computerAssignment) {
      task.phase = 3
      return
    }
    task.phase = 6
    if (!(p.flags2 & 0x100000)) {
      unit.native = p
      changeLivePersonState(w, unit, 14)
    }
    w.ai.commandDelay = 20
    return
  }
  if (task.phase === 6) {
    task.phase = 7
    return
  }
  if (task.phase === 7) {
    const group = { records: Array.from({ length: 8 }, emptyPersonOrder), count: 0, cursor: 0 }
    queuePersonOrder(group, 3, 0, task.target)
    releaseSelection(w.ai, index)
    const people = w.units.flatMap(u => {
      const source = unitAnimationSource(u) ?? u.native
      return u.hp > 0 && u.team === campaignTeam(w, tribe) && source ? [source] : []
    })
    commitPersonOrders(w.buildingOrders, group, people, [-1, -1, -1], {
      ...orderEffects(w),
      prepare: (order, model, a, b, flags = 0) => {
        if (model !== 3) throw new Error('Unexpected Convert Wild movement command')
        prepareMovementOrder(order, { x: a, y: b }, flags, w.land, id =>
          buildingOutsidePoint(buildingPose(w.buildings.find(building => building.id === id)!))
        )
      },
    })
    finishPreacherSelection(w, tribe, false)
    task.elapsed = 0
    task.phase = 8
    return
  }
  if (task.phase !== 8) return
  task.elapsed = (task.elapsed + w.ai.tasks.filter(t => t.flags & 1).length) & 65535
  const spellWorld = computerSpellWorld(w, tribe),
    target = stepConvertWildTarget(spellWorld, task.target),
    casterCell = ((p.x >>> 8) & 254) | (p.y & 0xfe00)
  if (task.elapsed < 601) {
    task.target = target.cell
    const movingFallback = !(rules.personStateFlags[p.state] & 8) && target.count < 4
    if (movingFallback && convertWildDensity(spellWorld, casterCell) < 5) return
    if (movingFallback || target.count) {
      const casting = w.castingTribes[tribe],
        caster = {
          ...spellCaster(w, unit),
          height: p.h, // 0x4c2e30 reads the signed person+0x41, not the terrain beneath it.
          state: p.state,
          flags2: p.flags2 | (unit.inside === null ? 0 : 0x800000),
          flags4: p.flags4 | (unit.casting ? 0x400 : 0),
        },
        range = Math.trunc(nativeSpellRange(w.manaWorld.gameFlags, casting.flags, caster, 17) / 512)
      if (!canShamanCast(casting, w.manaTribes[tribe].playerType, caster)) return
      if (w.manaTribes[tribe].mana < rules.spellCharging[17].cost) return
      if (!movingFallback && Math.imul(range, range) < cellDistanceSquared(task.target, casterCell))
        return
      if (!computerSpellAllowed(casting, w.ai.flags, w.manaWorld.gameFlags, 17)) return
      allocateComputerSpell(w, unit, 17, task.target)
      returnLivePerson(w, unit, { x: p.x, y: p.y }, p)
      task.phase = 3
      return
    }
  }
  // Native +0x9f/+0x7a identity protects a vehicle's first passenger/driver.
  if (!w.vehicles.some(v => v.active && v.id === p.vehicle && v.passengers[0] === p.id))
    finishComputerPerson(w, unit, p, true)
  task.phase = 3
}

export function computerTrainingBuilding(w: World, model: number, tribe = campaignTribe(w)) {
  const team = campaignTeam(w, tribe)
  return (
    w.buildings.find(
      b =>
        b.team === team &&
        b.hp > 0 &&
        b.progress === 1 &&
        b.damageState?.state !== 3 &&
        buildingModel(b) === model
    )?.id ?? 0
  )
}

function trainingBuilding(w: World, id: number, tribe: number): TrainingBuilding | null {
  const team = campaignTeam(w, tribe)
  const b = w.buildings.find(
    b =>
      b.id === id && b.team === team && b.hp > 0 && b.progress === 1 && b.damageState?.state !== 3
  )
  if (!b) return null
  const admission = buildingAdmission(w, b),
    model = buildingModel(b),
    capacity = rules.buildingCapacity[model]
  return {
    id: b.id,
    owner: tribe,
    state: 2,
    model,
    capacity,
    inside: admission.inside,
    occupants: admission.occupants.slice(0, capacity).map(id => {
      const u = id && w.units.find(u => u.id === id && u.hp > 0)
      return u ? { id: u.id, model: nativePersonModel(u) } : null
    }),
  }
}

// 0x4f2ac0: reservations in sibling tasks and live command-8 people prevent
// zero-count training requests from committing the same capacity again.
function committedTraining(w: World, current: number, model: number, tribe: number) {
  const team = campaignTeam(w, tribe)
  const matches = (id: number) => {
    const b = w.buildings.find(b => b.id === id && b.hp > 0)
    return !!b && buildingModel(b) === model
  }
  let count = 0
  for (let index = 0; index < w.ai.tasks.length; index++) {
    const task = w.ai.tasks[index]
    if (index === current || !(task.flags & 1) || task.type !== 6 || !matches(task.target)) continue
    if (task.phase === 0 || task.phase === 2) count += 5
    else if (task.phase === 3 || task.phase === 4) count += task.remaining
    else if (task.phase === 5 || task.phase === 6) count += task.selected
  }
  for (const u of w.units) {
    if (u.team !== team || u.hp <= 0) continue
    const p = unitAnimationSource(u) ?? u.native,
      order = p && (p.state === 10 || p.state === 33) && currentPersonOrder(w.buildingOrders, p)
    if (order && !(order.flags & 1) && order.model === 8 && matches(p.target)) count++
  }
  return count | 0
}

function restoreComputerSelection(w: World, index: number) {
  for (const id of w.ai.trainingSelections[index]) {
    const u = w.units.find(u => u.id === id)
    if (u?.native?.state === 14) changeLivePersonState(w, u, 10)
  }
  w.ai.trainingSelections[index].length = 0
}

function ejectComputerOccupant(w: World, id: number) {
  const u = w.units.find(u => u.id === id),
    person = u && leaveLiveBuilding(w, u)
  if (!u || !person) return
  u.entry = undefined
  u.native = person
  u.work = null
  changeLivePersonState(w, u, 10)
}

function computerAttackUnits(w: World, index: number) {
  return w.ai.tasks[index].members.flatMap(id => {
    const unit = w.units.find(u => u.id === id && u.hp > 0)
    return unit ? [unit] : []
  })
}
const computerAttackReady = (u: Unit) =>
  !u.flight && !u.fight && !u.fighting && !u.casting && !u.lift

function computerAttackHasOrder(w: World, index: number, model: number, target: number) {
  const units = computerAttackUnits(w, index)
  return (
    units.length > 0 &&
    units.every(u => {
      const p = u.native ?? u.fight?.motion
      const order = p && currentPersonOrder(w.buildingOrders, p)
      return order?.model === model && order.a === target
    })
  )
}

function computerAttackTargetsRemain(w: World, tribe: number, target: number) {
  const team = campaignTeam(w, tribe === 0 ? campaignTribe(w) : 0)
  if (!team) return false
  const within = (object: Point) => {
    const p = nativePosition(w, object),
      cell = ((p.x >>> 8) & 254) | (p.y & 0xfe00)
    return cellDistanceSquared(cell, target) <= 100
  }
  return (
    w.units.some(
      u =>
        u.team === team &&
        u.hp > 0 &&
        u.inside === null &&
        u.native?.state !== 23 &&
        !u.flight &&
        within(u)
    ) ||
    w.buildings.some(b => b.team === team && b.hp > 0 && b.damageState?.state !== 3 && within(b))
  )
}

function produceMissionTraining(w: World, tribe: number) {
  if (w.ai.tasks.every(task => task.flags & 1)) return false
  if (!(w.ai.states & (1 << 6))) return false
  const population = campaignPersonCount(w, tribe),
    eligible = [
      ...(w.outcome.level === 6 && tribe === 2 ? [{ model: 4, building: 5, preference: 6 }] : []),
      { model: 3, building: 7, preference: 7 },
    ]
      .map(candidate => ({
        ...candidate,
        target: computerTrainingBuilding(w, candidate.building, tribe),
      }))
      .filter(
        candidate =>
          candidate.target &&
          Math.trunc((w.ai.attributes[candidate.preference] * population) / 100) >
            campaignPersonCount(w, tribe, candidate.model)
      )
  if (!eligible.length) return false
  const { model, building, target } = eligible[random(w) % eligible.length]
  const selection = computerSelectionWorld(w, tribe),
    available = availableTrainingPeople(selection.world),
    capacity = rules.buildingCapacity[building]
  // Original 0x4e59a0 requires capacity, including equality. Later-mission
  // adapters outside the already proved Mission6 path retain their current gate.
  if (
    (w.outcome.level >= 1 && w.outcome.level <= 3) || w.outcome.level === 6
      ? !hasComputerTrainingCapacity(available, capacity)
      : available >= capacity
  )
    return false
  return requestTraining(w.ai, 0, model, available, candidate =>
    candidate === building ? target : 0
  )
}

// The ordinary 0x4e5580 producer reaches training buildings before housing.
function produceMissionBuilding(w: World, tribe: number) {
  const team = campaignTeam(w, tribe),
    has = (model: number) =>
      w.buildings.some(
        building => building.team === team && building.hp > 0 && buildingModel(building) === model
      ) ||
      w.ai.tasks.some(
        task => task.flags & 1 && task.type === 0 && task.requested === model && task.phase < 3
      ),
    base = w.buildings.find(
      building => building.team === team && building.hp > 0 && buildingModel(building) === 4
    ),
    housing = w.buildings
      .filter(building => building.team === team && building.hp > 0)
      .reduce((sum, building) => {
        const model = buildingModel(building)
        const counts = w.outcome.level !== 2 || building.preparation || building.progress === 1
        return (
          sum + (counts && rules.buildingFlags[model] & 0x20 ? rules.buildingCapacity[model] : 0)
        )
      }, 0)
  if (
    ![2, 3, 6, 11, 12, 23].includes(w.outcome.level) ||
    !(w.ai.states & 1) ||
    w.ai.tasks.filter(task => task.flags & 1 && task.type === 0).length >= w.ai.attributes[9]
  )
    return false
  const selection = computerSelectionWorld(w, tribe)
  const available =
    w.outcome.level === 2
      ? selection.world.people.filter(
          person => rules.personStateFlags[person.state] & 8 && !person.busy && person.model !== 7
        ).length
      : availableTrainingPeople(selection.world)
  if (available < 2) return false
  const shaman = w.units.find(unit => unit.team === team && isShaman(unit) && unit.hp > 0),
    position = shaman && nativePosition(w, shaman),
    origin =
      w.outcome.level === 2 && w.ai.constructionBase !== undefined
        ? w.ai.constructionBase
        : (w.outcome.level === 2 || w.outcome.level === 12) && position
          ? ((position.x >>> 8) & 254) | (position.y & 0xfe00)
          : base
            ? ((buildingPose(base).anchorX >>> 8) & 254) | (buildingPose(base).anchorY & 0xfe00)
            : position
              ? ((position.x >>> 8) & 254) | (position.y & 0xfe00)
              : 0
  if (!origin) return false
  if (w.outcome.level === 2) {
    // The authored outpost is not the construction base. Native 0x461d70 starts
    // without a base; the first ordinary Tower plan establishes it in phase 3.
    const model =
      !(w.ai.flags & 0x400) && (w.ai.constructionBase === undefined || !has(4))
        ? 4
        : housing < w.ai.attributes[10]
          ? 1
          : 0
    return !!model && requestConstruction(w.ai, model, origin)
  }
  // ponytail: only the first proved Mission 12 producer request belongs to this opening slice.
  if (w.outcome.level === 12 && w.ai.flags & mission12TowerRequested) return false
  if (
    w.outcome.level === 11 &&
    ((!base && !!(w.ai.flags & mission11TowerRequested)) ||
      (base && (tribe !== 3 || !!(w.ai.flags & mission11HousingRequested))))
  )
    return false
  // ponytail: one school of each kind is enough for the currently integrated specialist paths;
  // use native attribute target counts when later missions need multiple schools.
  const model = !base
    ? 4
    : w.outcome.level === 23
      ? tribe === 2 && !has(13) && w.ai.attributes[35]
        ? 13
        : housing < w.ai.attributes[10]
          ? 1
          : 0
      : w.outcome.level === 12
        ? 4
        : w.outcome.level === 11
          ? housing < w.ai.attributes[10]
            ? 1
            : 0 // ponytail: one Matak Hut only; later housing and schools await their own slices.
          : !has(7) && w.ai.attributes[3]
            ? 7
            : tribe === 2 && !has(5) && w.ai.attributes[2]
              ? 5
              : housing < w.ai.attributes[10]
                ? 1
                : 0
  if (!model || !requestConstruction(w.ai, model, origin)) return false
  // ponytail: keep each proved Mission 11 request one-shot until its next native slice.
  if (w.outcome.level === 11)
    w.ai.flags =
      (w.ai.flags | (model === 4 ? mission11TowerRequested : mission11HousingRequested)) >>> 0
  else if (w.outcome.level === 12) w.ai.flags = (w.ai.flags | mission12TowerRequested) >>> 0
  return true
}

function stepComputerConstruction(w: World, tribe: number, index: number) {
  const task = w.ai.tasks[index],
    team = campaignTeam(w, tribe),
    cleanup = (removePlan = false) => {
      for (const id of task.members) {
        const unit = w.units.find(unit => unit.id === id)
        if (unit?.native?.state === 14) changeLivePersonState(w, unit, 10)
      }
      if (removePlan)
        w.buildings = w.buildings.filter(
          building => building.id !== task.entity || !building.preparation
        )
      releaseSelection(w.ai, index)
      task.flags &= ~3
      task.members.length = 0
    }
  if (![1, 4, 5, 7, 13].includes(task.requested))
    throw new Error(`Unbound computer construction ${task.requested}`)
  if (task.phase === 0) {
    if (w.outcome.level === 11 && tribe === 3 && task.requested === 1) {
      const towerReady = w.buildings.some(
          building =>
            building.team === team &&
            building.hp > 0 &&
            buildingModel(building) === 4 &&
            building.progress === 1
        ),
        towerPending =
          w.buildings.some(
            building =>
              building.team === team &&
              building.hp > 0 &&
              buildingModel(building) === 4 &&
              building.progress !== 1
          ) ||
          w.ai.tasks.some(
            candidate =>
              candidate !== task &&
              !!(candidate.flags & 1) &&
              candidate.type === 0 &&
              candidate.requested === 4
          )
      // ponytail: wait only while the slower browser tower is genuinely pending;
      // if it is lost, continue the native request from its captured origin.
      if (!towerReady && towerPending) return
    }
    task.target =
      task.requested === 4 && !task.extra && w.ai.flags & 0x20 ? w.ai.coordinateLatch : task.origin
    task.elapsed = 0
    task.remaining = 2000
    task.mode = w.ai.attributes[30] ? random(w) & 3 : 1
    task.fallback = random(w) & 3
    task.phase = 2
  }
  if (task.phase === 2) {
    for (let scanned = 0; scanned < 40 && task.elapsed < task.remaining; scanned++) {
      const cell = spiralCell(task.target, task.elapsed++, task.mode),
        point = nativeCellPoint(cell),
        pose = {
          object: rules.buildingObjects[task.requested],
          angle: task.fallback * 512,
          anchorX: (cell & 254) << 8,
          anchorY: cell & 0xfe00,
        },
        footprint = new Set(buildingFootprintCells(pose))
      if (!checkBuildingSite(w, pose, task.requested, team).valid) continue
      // ponytail: wild units lack native wandering; remove this veto when their movement is live.
      if (
        w.units.some(unit => {
          const p = nativePosition(w, unit)
          return (
            unit.team === 'wild' &&
            unit.hp > 0 &&
            unit.inside === null &&
            !unit.lift &&
            footprint.has(nativeCellIndex(((p.x >>> 8) & 254) | (p.y & 0xfe00)))
          )
        })
      )
        continue
      const selection = computerSelectionWorld(w, tribe),
        [worker] = selectComputerPeople(selection.world, 2, 2, -1, 1, cell, 0, 1),
        unit = w.units.find(unit => unit.id === worker)
      if (!unit || !findPath(w, unit, point).length) continue
      const building = addBuilding(
        w,
        team,
        task.requested === 1
          ? 'hut'
          : task.requested === 13
            ? 'boatHouse'
            : task.requested === 5
              ? 'temple'
              : task.requested === 7
                ? 'camp'
                : 'tower',
        point,
        false,
        {
          angle: (task.fallback * Math.PI) / 2,
          plan: true,
        }
      )
      building.builders = Array(rules.buildingMaxWorkers[task.requested]).fill(0)
      task.target = cell
      task.entity = building.id
      task.retries = 0
      task.phase = [2, 3].includes(w.outcome.level) && task.requested === 4 ? 3 : 4
      return
    }
    if (task.elapsed >= task.remaining) cleanup()
    return
  }
  if (task.phase === 3 && [2, 3].includes(w.outcome.level)) {
    const building = w.buildings.find(b => b.id === task.entity && b.hp > 0)
    if (!task.extra && w.ai.constructionBase === undefined && building) {
      const outside = buildingOutsidePoint(buildingPose(building))
      w.ai.constructionBase = ((outside.x >>> 8) & 254) | (outside.y & 0xfe00)
    }
    task.phase = 4
    return
  }
  if (task.phase === 4) {
    if (acquireSelection(w.ai, index)) task.phase = 5
    return
  }
  if (task.phase === 5) {
    const building = w.buildings.find(building => building.id === task.entity && building.hp > 0),
      selection = computerSelectionWorld(w, tribe),
      ids = selectComputerPeople(selection.world, 2, 2, -1, 1, task.target, 0, 2)
    if (!building) {
      cleanup(true)
      return
    }
    if (!ids.length) {
      if (task.retries) {
        releaseSelection(w.ai, index)
        task.phase = 8
      } else cleanup(true)
      return
    }
    for (const id of ids) {
      const unit = w.units.find(unit => unit.id === id)!,
        source = selection.sources.get(id)
      if (source) source.flags3 = selection.world.units.get(id)!.flags3
      unit.native ??= createLivePerson(w, unit)
      registerLivePerson(w, unit.native)
      changeLivePersonState(w, unit, 14)
    }
    task.members = ids
    task.phase = 6
    w.ai.commandDelay = 20
    return
  }
  if (task.phase === 6) {
    task.phase = 7
    return
  }
  if (task.phase === 7) {
    const building = w.buildings.find(building => building.id === task.entity && building.hp > 0),
      units = task.members.flatMap(id => {
        const unit = w.units.find(unit => unit.id === id && unit.hp > 0)
        return unit ? [unit] : []
      }),
      order = emptyPersonOrder()
    if (!building || !units.length) {
      cleanup(true)
      return
    }
    writePersonOrder(order, 6, building.id, task.target, 0)
    const issued = appendLiveOrders(w, units, order, true)
    if (!issued.accepted || issued.count !== units.length) {
      cleanup(true)
      return
    }
    for (const unit of units)
      if (startLiveConstructionOrder(w, unit)) route(w, unit, entrance(w, building), true)
    releaseSelection(w.ai, index)
    task.phase = 8
    task.retries = 0
    return
  }
  if (task.phase === 8) {
    const building = w.buildings.find(building => building.id === task.entity && building.hp > 0)
    if (!building || building.progress === 1) cleanup()
    else if ((building.builders?.filter(Boolean).length ?? 0) < 2) {
      if (task.retries < 16) task.retries++
      else task.phase = 4
    }
  }
}

export function computerMarkerOrderCount(
  w: World,
  tribe: number,
  marker: number,
  secondary: number
) {
  const level = missionData(w.outcome.level).level
  const team = campaignTeam(w, tribe),
    primary = level.markers[marker],
    alternate = secondary === -1 ? -1 : level.markers[secondary],
    matches = (a: number, b: number) => b !== -1 && (a & 0xfefe) === (b & 0xfefe)
  if (primary === undefined || (secondary !== -1 && alternate === undefined))
    throw new RangeError('Invalid computer marker route')
  let count = 0
  for (const u of w.units) {
    if (u.team !== team || u.hp <= 0) continue
    const p = unitAnimationSource(u) ?? u.native
    if (!p || ![10, 33].includes(p.state)) continue
    const active = currentPersonOrder(w.buildingOrders, p)
    if (!active || active.flags & 1 || ![11, 25].includes(active.model)) continue
    const id = p.commands[p.commandCursor],
      queued = id ? w.buildingOrders.records[id] : undefined,
      flags = queued ? (rules.personCommands[queued.model]?.flags ?? 0) : 0
    if (!queued) continue
    const position = flags & 0x800 ? queued.a : ((queued.a >>> 8) & 254) | (queued.b & 0xfe00)
    if (
      flags & 0x800
        ? matches(position, primary)
        : flags & 1 && (matches(position, primary) || matches(position, alternate))
    )
      count++
  }
  return count
}

function allocateComputerSpell(w: World, u: Unit, model: number, cell: number) {
  const spell = SPELLS.find(s => s.model === model)
  if (!spell) throw new Error(`Unimplemented computer spell effect ${model}`)
  clearLivePath(w, u)
  beginCast(w, u, spell.id, nativeCellPoint(cell))
  const fightingPerson = u.fight?.motion
  if (fightingPerson && (fightingPerson.state === 25 || fightingPerson.state === 29)) {
    u.native = fightingPerson
    changeLivePersonState(w, u, 22)
    u.fight = null
  }
}

function castAttackTaskSpell(w: World, tribe: number, task: ComputerTask) {
  const models = task.spells ?? []
  if (!models.some(Boolean)) return null
  const team = campaignTeam(w, tribe),
    shaman = w.units.find(u => u.team === team && isShaman(u) && u.hp > 0)
  if (!shaman) return null
  const person = combatPerson(shaman),
    casting = w.castingTribes[tribe],
    caster = {
      ...spellCaster(w, shaman),
      ...person,
      landIndex: person.vehicle,
      casting,
      playerType: w.manaTribes[tribe].playerType,
    }
  if (shaman.casting) caster.flags4 |= 0x400
  let model = 0
  for (const candidate of models) {
    if (!candidate || candidate === 6 || candidate === 19) continue
    if (computerSpellAllowed(casting, w.ai.flags, w.manaWorld.gameFlags, candidate)) {
      model = candidate
      break
    }
  }
  if (!model || !canShamanCast(casting, caster.playerType, caster)) return null
  const stock = w.manaWorld.spells[tribe],
    payment = spellPaymentType(w.manaWorld.gameFlags, casting.flags, stock, model)
  if (payment !== 3 && w.manaTribes[tribe].mana < rules.spellCharging[model].cost) return null
  const position = nativePosition(w, shaman),
    shamanCell = ((position.x >>> 8) & 254) | (position.y & 0xfe00),
    center = person.state === 25 || person.state === 29 ? shamanCell : task.target & 65535
  if (
    !computerSpellInRange(
      w.manaWorld.gameFlags,
      casting.flags,
      { ...caster, x: person.x, y: person.y },
      center,
      model
    )
  )
    return null
  const target = chooseSpellTarget(computerSpellWorld(w, tribe), model, center, null)
  if (!target.accepted) return null
  allocateComputerSpell(w, shaman, model, target.cell)
  return model
}

const defensePerson = (u: Unit) =>
  u.builder?.person ?? u.flight ?? u.fight?.motion ?? u.native ?? u.entry?.person

// Native cell chains retain their order; the existing browser-only objects
// retain world-list order until their ordinary native record is materialized.
function computerResponseWorld(w: World, tribe: number) {
  const cells = new Map<number, DefenseObject[]>()
  const add = (p: DefenseObject) => {
    const cell = ((p.x >>> 8) & 254) | (p.y & 0xfe00),
      row = cells.get(cell) ?? []
    row.push(p)
    cells.set(cell, row)
  }
  for (const u of w.units) {
    if (u.hp <= 0 || u.inside !== null) continue
    const source = defensePerson(u)
    if (source && w.objectCells.objects.get(u.id) === source && !(source.flags2 & 0x20000)) continue
    const person = combatPerson(u)
    add({
      ...person,
      x: source?.x ?? person.x,
      y: source?.y ?? person.y,
      assignment: source?.assignment ?? 0,
    })
  }
  for (const b of w.buildings) {
    if (b.hp <= 0 || b.preparation) continue
    const p = buildingPosition(buildingPose(b))
    add({
      ...p,
      id: b.id,
      class: 2,
      model: buildingModel(b),
      state: b.progress === 1 ? 2 : 1,
      tribe: tribeForTeam(b.team),
      flags2: 0,
      flags4: 0,
      assignment: 0,
      disguise: 0,
    })
  }
  for (const [cell, row] of cells) {
    const indexed = [...objectsInCell(w.objectCells, cell)].flatMap(p => {
      const object = row.find(candidate => candidate.id === p.id)
      return object ? [object] : []
    })
    cells.set(cell, [...indexed, ...row.filter(p => !indexed.includes(p))])
  }
  return {
    tribe,
    alliances: w.outcome.alliances[tribe],
    cells,
    terrainFlags: (cell: number) => w.land.flags[nativeCellIndex(cell)],
  }
}

function requestComputerDefense(w: World, tribe: number, entity: number, cell: number) {
  return requestDefenseTask(w.ai, w.ai.states, w.ai.attributes[15], entity, cell, () =>
    summarizeSpellEnemies(computerResponseWorld(w, tribe), cell, 4, {
      preachers: campaignPersonCount(w, tribe, 4),
      firewarriors: campaignPersonCount(w, tribe, 6),
      braves: campaignPersonCount(w, tribe, 2),
      // Complete CPSCR012 assigns attribute46=1 once; no auto-training leaf.
      autoTrain: false,
      queuedPreachers: () => {
        throw new Error('Unreachable Mission3 defense training query')
      },
      request: () => {
        throw new Error('Unreachable Mission3 defense training request')
      },
    })
  )
}

function assignDefensePerson(u: Unit, p: LivePerson, owner: number) {
  u.nativeFlags7f = (u.nativeFlags7f ?? 0) & 254
  p.computerAssignment = owner & 255
  if (!owner) p.flags3 = (p.flags3 & ~0x2000) >>> 0
}

//0x43b540 allocates before clearing, and does not restart the current state.
function retargetDefensePerson(w: World, u: Unit, p: LivePerson, cell: number) {
  const id = allocatePersonOrder(w.buildingOrders)
  if (!id) return false
  prepareCellOrder(w.buildingOrders.records[id], { a: cell, b: 0x0404 }, 0, w.land.categories, 19)
  p.flags2 = (p.flags2 | 0x10) >>> 0
  clearPersonOrders(w.buildingOrders, p, orderEffects(w))
  attachPersonOrder(w.buildingOrders, p, id, p.commandCursor, orderEffects(w))
  adoptLiveOrders(w, u, p)
  return true
}

function stepComputerDefense(w: World, tribe: number, index: number) {
  const task = w.ai.tasks[index],
    team = campaignTeam(w, tribe)
  const owned = () =>
    w.units.flatMap(u => {
      const p = defensePerson(u)
      return u.team === team && p ? [{ u, p }] : []
    })
  const members = () => owned().filter(({ p }) => p.computerAssignment === index + 1)
  stepDefenseTask(w.ai, index, {
    targetAlive: () =>
      w.units.some(u => u.id === task.entity && u.hp > 0) ||
      w.buildings.some(b => b.id === task.entity && b.hp > 0),
    cast: center => {
      if (
        !w.ai.attributes[32] ||
        w.manaTribes[tribe].mana <= ((rules.spellCharging[2].cost + 50000) | 0)
      )
        return
      const u = w.units.find(
        candidate => candidate.team === team && isShaman(candidate) && candidate.hp > 0
      )
      if (!u) return
      const person = combatPerson(u),
        source = defensePerson(u),
        baseCaster = spellCaster(w, u),
        casting = w.castingTribes[tribe],
        caster = {
          ...baseCaster,
          ...person,
          //0x4f3040/0x4c2e30 read the same active person, including fight/flight.
          x: source?.x ?? person.x,
          y: source?.y ?? person.y,
          height: source?.h ?? baseCaster.height,
          flags4: person.flags4 | (u.casting ? 0x400 : 0),
        }
      if (
        !canShamanCast(casting, w.manaTribes[tribe].playerType, caster) ||
        !computerSpellInRange(w.manaWorld.gameFlags, casting.flags, caster, center, 2) ||
        !computerSpellAllowed(casting, w.ai.flags, w.manaWorld.gameFlags, 2)
      )
        return
      allocateComputerSpell(w, u, 2, center)
    },
    select: (model, count, center) => {
      const selection = computerSelectionWorld(w, tribe, true),
        ids = selectComputerPeople(selection.world, model, model, -1, 1, center, 0x47, count)
      for (const id of ids) {
        const u = w.units.find(candidate => candidate.id === id)!
        const p = selection.sources.get(id) ?? defensePerson(u) ?? createLivePerson(w, u)
        p.flags3 = selection.world.units.get(id)!.flags3
        if (!(p.flags2 & 0x100000)) {
          u.native = p
          registerLivePerson(w, p)
          changeLivePersonState(w, u, 14)
        }
        assignDefensePerson(u, p, index + 1)
      }
      return ids.length
    },
    dispatch: center => {
      const group = { records: Array.from({ length: 8 }, emptyPersonOrder), count: 0, cursor: 0 }
      const commit = (models: [number, number, number]) =>
        commitPersonOrders(
          w.buildingOrders,
          group,
          owned().map(({ p }) => p),
          models,
          {
            ...orderEffects(w),
            prepare: (order, model, a, b, flags = 0) => {
              if (model === 19) prepareCellOrder(order, { a, b }, flags, w.land.categories, 19)
              else if (model === 3)
                prepareMovementOrder(order, { x: a, y: b }, flags, w.land, id =>
                  buildingOutsidePoint(
                    buildingPose(w.buildings.find(building => building.id === id)!)
                  )
                )
              else throw new Error('Unexpected defense command')
            },
          }
        )
      // The standability helper's adjusted scratch point is deliberately unused.
      if (standableConvertTarget(center, w.land) !== null) {
        queuePersonOrder(group, 3, 0, center)
        commit([4, -1, -1])
        for (const { u, p } of owned())
          if (p.state === 14 && p.model === 4) finishComputerPerson(w, u, p, false)
      }
      queuePersonOrder(group, 19, 0x0808, center)
      releaseSelection(w.ai, index)
      commit([-1, -1, -1])
      for (const { u, p } of owned()) if (p.state === 14) finishComputerPerson(w, u, p, false)
    },
    monitor: current => {
      const { defense } = current as ComputerTask & {
          defense: NonNullable<ComputerTask['defense']>
        },
        world = computerResponseWorld(w, tribe),
        targets = collectDefenseTargets(
          tribe,
          world.alliances,
          defense.center,
          cell => world.cells.get(cell) ?? []
        )
      let count = 0
      for (const { u, p } of members()) {
        if (u.hp <= 0 || p.flags2 & 1) continue
        if (defense.recenter && [25, 29].includes(p.state)) {
          defense.recenter = false
          defense.center = ((p.x >>> 8) & 254) | (p.y & 0xfe00)
          for (const member of members())
            retargetDefensePerson(w, member.u, member.p, defense.center)
        }
        if (p.state === 33 && (p.substate === 3 || (p.substate === 2 && p.animationMode > 4))) {
          assignDefensePerson(u, p, 0)
          clearPersonOrders(w.buildingOrders, p, orderEffects(w))
          finishComputerPerson(w, u, p, false)
        }
        count++
        if (!(rules.personStateFlags[p.state] & 8)) continue
        const [personTarget] = targets.people,
          [buildingTarget] = targets.buildings
        if (personTarget)
          retargetDefensePerson(w, u, p, ((personTarget.x >>> 8) & 254) | (personTarget.y & 0xfe00))
        else if (buildingTarget) {
          const building = w.buildings.find(b => b.id === buildingTarget.id)!,
            point = buildingInsidePoint(buildingPose(building))
          retargetDefensePerson(w, u, p, ((point.x >>> 8) & 254) | (point.y & 0xfe00))
        }
      }
      if (!targets.people.length && !targets.buildings.length) {
        const shaman = w.units.find(u => u.team === team && isShaman(u) && u.hp > 0),
          shamanPosition = shaman && nativePosition(w, shaman),
          cell =
            w.ai.constructionBase ??
            (shamanPosition ? ((shamanPosition.x >>> 8) & 254) | (shamanPosition.y & 0xfe00) : 0)
        for (const { u, p } of members())
          returnLivePerson(w, u, { x: (cell & 254) << 8, y: cell & 0xfe00 }, p)
        return true
      }
      return !count
    },
    cleanup: () => {
      for (const { u, p } of members()) assignDefensePerson(u, p, 0)
      if (acquireSelection(w.ai, index)) {
        for (const { u, p } of owned()) if (p.state === 14) finishComputerPerson(w, u, p, true)
        releaseSelection(w.ai, index)
      }
    },
  })
}

export function stepComputerTasks(w: World, tribe: number) {
  const level = missionData(w.outcome.level).level
  const earlyResponse = w.outcome.level >= 1 && w.outcome.level <= 3
  if (earlyResponse) {
    //0x461f90 invalidates targets even when another task gets this turn's visit.
    for (const task of w.ai.tasks) {
      const { responseScan: scan } = task
      if (
        task.flags & 1 &&
        task.type === 9 &&
        scan?.entity &&
        !w.units.some(u => u.id === scan.entity && u.hp > 0) &&
        !w.buildings.some(b => b.id === scan.entity && b.hp > 0)
      )
        scan.entity = 0
      if (
        task.flags & 1 &&
        task.type === 8 &&
        task.phase < 3 &&
        !w.units.some(u => u.id === task.entity && u.hp > 0) &&
        !w.buildings.some(b => b.id === task.entity && b.hp > 0)
      )
        task.flags |= 2
    }
  }
  const phase = computerPhase(w.turn, tribe)
  if (phase === 'produce') {
    if (w.outcome.level >= 1 && w.outcome.level <= 3) {
      produceComputerTasks(
        w.ai,
        id => {
          if (id === 1) return produceMissionBuilding(w, tribe)
          if (id === 0 && w.outcome.level === 3)
            return requestConvertTask(
              w.ai,
              w.ai.states,
              w.units.filter(u => u.hp > 0 && u.team === 'wild').length
            )
          if (id === 3) return produceMissionTraining(w, tribe)
          // Other producer bodies remain
          // unbound. Count unsuccessful adapter visits without inventing tasks.
          return false
        },
        earlyResponse ? () => requestEarlyResponseTask(w.ai, w.ai.states) : undefined
      )
      return
    }
    if (produceMissionBuilding(w, tribe)) return
    produceMissionTraining(w, tribe)
    return
  }
  if (phase !== 'dispatch') return
  dispatchComputerTask(w.ai, index => {
    const task = w.ai.tasks[index]
    if (earlyResponse && task.type === 9) {
      const cleanup = stepEarlyResponseTask(w.ai, index, {
        tribe,
        tribeCount: w.tribeCount,
        alliances: w.outcome.alliances[tribe],
        responseFlag: !!w.ai.attributes[15],
        entities: (category, owner) => {
          const team = campaignTeam(w, owner)
          const entities = category === 0 ? w.units : w.buildings
          return entities
            .filter(entity => entity.team === team && entity.hp > 0)
            .map(entity => {
              const p = nativePosition(w, entity)
              return { id: entity.id, cell: ((p.x >>> 8) & 254) | (p.y & 0xfe00) }
            })
        },
        territory: cell => !!(w.land.regions[nativeCellIndex(cell)] & (1 << (tribe + 4))),
        defended: cell => defendedResponseCell(w.ai, cell),
        defend:
          w.outcome.level === 3
            ? (entity, cell) => requestComputerDefense(w, tribe, entity, cell)
            : undefined,
      })
      if (cleanup) {
        if (acquireSelection(w.ai, index)) {
          finishPreacherSelection(w, tribe, true)
          releaseSelection(w.ai, index)
        }
        task.flags &= ~3
      }
      return
    }
    if (w.outcome.level === 3 && task.type === 8) {
      stepComputerDefense(w, tribe, index)
      return
    }
    if (w.outcome.level === 3 && task.type === 2) {
      stepComputerConvert(w, tribe, index)
      return
    }
    if (task.type === 11) {
      stepComputerPreacher(w, tribe, index)
      return
    }
    if (task.type === 0) {
      stepComputerConstruction(w, tribe, index)
      return
    }
    if (task.type === 7) {
      const target = w.buildings.find(
          building =>
            building.id === task.target &&
            building.team === campaignTeam(w, tribe) &&
            building.hp > 0 &&
            buildingModel(building) === 4
        ),
        occupants = target ? buildingAdmission(w, target).occupants.filter(Boolean) : []
      if (!target || task.flags & 2) {
        restoreComputerSelection(w, index)
        releaseSelection(w.ai, index)
        task.flags &= ~3
        return
      }
      if (task.phase === 0) {
        task.members.length = 0
        task.phase = 2
        for (const id of occupants) {
          const unit = w.units.find(unit => unit.id === id && unit.hp > 0)
          if (unit && (nativePersonModel(unit) === task.requested || isShaman(unit))) {
            task.phase = 7
            return
          }
          ejectComputerOccupant(w, id)
        }
      }
      if (task.phase === 2) {
        if (acquireSelection(w.ai, index)) task.phase = 3
        return
      }
      if (task.phase === 3) {
        const point = buildingPosition(buildingPose(target)),
          destination = ((point.x >>> 8) & 254) | (point.y & 0xfe00),
          current = computerSelectionWorld(w, tribe),
          [id] = selectComputerPeople(
            current.world,
            task.requested,
            task.requested,
            target.id,
            1,
            destination,
            0x4a,
            1
          )
        if (!id) {
          releaseSelection(w.ai, index)
          task.phase = 7
          return
        }
        const unit = w.units.find(unit => unit.id === id)!
        const source = current.sources.get(id)
        if (source) source.flags3 = current.world.units.get(id)!.flags3
        unit.native ??= createLivePerson(w, unit)
        registerLivePerson(w, unit.native)
        changeLivePersonState(w, unit, 14)
        task.members.push(id)
        w.ai.trainingSelections[index].push(id)
        task.phase = 4
        w.ai.commandDelay = 20
        return
      }
      if (task.phase === 4) {
        task.phase = 5
        return
      }
      if (task.phase === 5) {
        const units = task.members.flatMap(id => {
            const unit = w.units.find(unit => unit.id === id && unit.hp > 0)
            return unit ? [unit] : []
          }),
          order = emptyPersonOrder()
        if (target.progress !== 1) {
          restoreComputerSelection(w, index)
          releaseSelection(w.ai, index)
          task.phase = 7
          return
        }
        writePersonOrder(order, 8, target.id, 0, 0)
        if (units.length) appendLiveOrders(w, units, order, true)
        w.ai.trainingSelections[index].length = 0
        releaseSelection(w.ai, index)
        task.phase = 6
        for (const id of buildingAdmission(w, target).occupants.filter(Boolean)) {
          const unit = w.units.find(unit => unit.id === id && unit.hp > 0)
          if (unit && nativePersonModel(unit) !== task.requested && !isShaman(unit))
            ejectComputerOccupant(w, id)
        }
        return
      }
      if (task.phase === 6) {
        task.phase = 7
        return
      }
      if (task.phase === 7) {
        restoreComputerSelection(w, index)
        releaseSelection(w.ai, index)
        task.flags &= ~3
        task.members.length = 0
      }
      return
    }
    if (task.type === 24) {
      let selection: ReturnType<typeof computerSelectionWorld> | undefined
      const actions = stepMarkerTask(w.ai, index, {
        existing: (marker, secondary) => computerMarkerOrderCount(w, tribe, marker, secondary),
        select: (model, count, marker) => {
          const current = (selection ??= computerSelectionWorld(w, tribe)),
            ids = selectComputerPeople(
              current.world,
              model,
              model,
              -1,
              1,
              level.markers[marker],
              64,
              count
            )
          for (const id of ids) {
            const source = current.sources.get(id)
            if (source) source.flags3 = current.world.units.get(id)!.flags3
          }
          return ids
        },
      })
      for (const action of actions) {
        if (action.kind === 'select') {
          const u = w.units.find(u => u.id === action.id)
          if (!u || u.inside !== null || u.entry || u.work !== null)
            throw new Error('Unsupported computer marker selection')
          u.native ??= createLivePerson(w, u)
          if (task.extra) u.native.computerAssignment = 99
          registerLivePerson(w, u.native)
          changeLivePersonState(w, u, 14)
        } else if (action.kind === 'order' || action.kind === 'guard') {
          const marker = level.markers[action.marker],
            cell = ((marker & 0xfe00) >>> 9) * 128 + ((marker & 254) >>> 1),
            target = w.land.buildingIds[cell] & 1023,
            order = emptyPersonOrder(),
            units = action.ids.flatMap(id => {
              const u = w.units.find(u => u.id === id && u.hp > 0)
              return u ? [u] : []
            })
          if (action.kind === 'guard') {
            if (units.length)
              appendLiveGuardOrders(
                w,
                units,
                marker,
                action.secondary === -1 ? -1 : level.markers[action.secondary]
              )
          } else {
            writePersonOrder(order, target ? 8 : 3, target, marker, 0)
            if (units.length) appendLiveOrders(w, units, order, true)
          }
        } else {
          for (const id of action.ids) {
            const u = w.units.find(u => u.id === id)
            if (u?.native?.state === 14) changeLivePersonState(w, u, 10)
          }
        }
      }
      return
    }
    if (task.type === 28) {
      let selection: ReturnType<typeof computerSelectionWorld> | undefined
      const shaman = w.units.find(
          u => u.hp > 0 && isShaman(u) && u.team === campaignTeam(w, tribe)
        ),
        point = shaman && nativePosition(w, shaman),
        destination = point ? ((point.x >>> 8) & 254) | (point.y & 0xfe00) : 0,
        actions = stepShamanGuardTask(w.ai, index, {
          existing: () => {
            let count = 0
            for (const u of w.units) {
              const p = unitAnimationSource(u) ?? u.native,
                order = p && currentPersonOrder(w.buildingOrders, p),
                model = nativePersonModel(u)
              if (
                u.hp > 0 &&
                p &&
                [10, 33].includes(p.state) &&
                order?.model === 30 &&
                model >= 2 &&
                model <= 6
              )
                count++
            }
            return count
          },
          select: (model, count) => {
            if (!shaman) return []
            const current = (selection ??= computerSelectionWorld(w, tribe)),
              ids = selectComputerPeople(current.world, model, model, -1, 1, destination, 0, count)
            for (const id of ids) {
              const source = current.sources.get(id)
              if (source) source.flags3 = current.world.units.get(id)!.flags3
            }
            return ids
          },
        })
      for (const action of actions) {
        if (action.kind === 'select') {
          const u = w.units.find(u => u.id === action.id)
          if (!u || u.inside !== null || u.entry || u.work !== null)
            throw new Error('Unsupported shaman guard selection')
          u.native ??= createLivePerson(w, u)
          registerLivePerson(w, u.native)
          changeLivePersonState(w, u, 14)
        } else if (action.kind === 'order') {
          const units = action.ids.flatMap(id => {
              const u = w.units.find(u => u.id === id && u.hp > 0)
              return u ? [u] : []
            }),
            order = emptyPersonOrder()
          writePersonOrder(order, 30, shaman?.id ?? 0, 0, 0)
          const issued = shaman && units.length ? appendLiveOrders(w, units, order, true) : null
          if (!issued?.accepted || issued.count !== units.length)
            for (const u of units) if (u.native?.state === 14) changeLivePersonState(w, u, 10)
        } else {
          for (const id of action.ids) {
            const p = w.units.find(u => u.id === id)?.native
            if (p) deselectPerson(p)
          }
        }
      }
      return
    }
    if (task.type === 20) {
      let selection: ReturnType<typeof computerSelectionWorld> | undefined
      const shaman = w.units.find(
          u => u.team === campaignTeam(w, tribe) && isShaman(u) && u.hp > 0
        ),
        shamanPosition = shaman && nativePosition(w, shaman),
        staging =
          w.ai.flags & 0x100
            ? w.ai.defencePosition
            : shamanPosition
              ? ((shamanPosition.x >>> 8) & 254) | (shamanPosition.y & 0xfe00)
              : 0,
        actions = stepAttackTask(w.ai, index, {
          staging,
          ready: () => computerAttackUnits(w, index).every(computerAttackReady),
          activeMembers: () => computerAttackUnits(w, index).length,
          targetsRemain: target =>
            computerAttackHasOrder(w, index, 19, target) &&
            computerAttackTargetsRemain(w, tribe, target),
          random: () => random(w),
          entity: id => campaignAttackEntity(w, id),
          tracking: id => computerAttackHasOrder(w, index, 28, id),
          reacquire: () => campaignAttackTarget(w, tribe === 0 ? campaignTribe(w) : 0),
          selectShaman: () => {
            if (!shaman) return null
            const source = unitAnimationSource(shaman) ?? shaman.native
            if (source?.computerAssignment) return null
            if (
              w.ai.tasks.some(
                (other, otherIndex) =>
                  otherIndex !== index && !!(other.flags & 1) && other.members.includes(shaman.id)
              )
            )
              return null
            return shaman.id
          },
          taskSpell: () => castAttackTaskSpell(w, tribe, task),
          select: (model, count, destination) => {
            const recruitmentOrigin =
              w.outcome.level === 3
                ? w.ai.constructionBase !== undefined
                  ? w.ai.constructionBase
                  : shamanPosition
                    ? ((shamanPosition.x >>> 8) & 254) | (shamanPosition.y & 0xfe00)
                    : 0
                : destination
            const current = (selection ??= computerSelectionWorld(w, tribe)),
              ids = selectComputerPeople(
                current.world,
                model,
                model,
                -1,
                1,
                recruitmentOrigin,
                7,
                count
              )
            for (const id of ids) {
              const source = current.sources.get(id)
              if (source) source.flags3 = current.world.units.get(id)!.flags3
            }
            return ids
          },
          settled: () => {
            const units = computerAttackUnits(w, index)
            return units.length === 0
              ? null
              : units.every(
                  u =>
                    computerAttackReady(u) &&
                    (u.native?.state !== 10 ||
                      currentPersonOrder(w.buildingOrders, u.native)?.model !== 3)
                )
          },
          memberWithin: (target, radius) => {
            const unit = computerAttackUnits(w, index).find(u => {
              if (!computerAttackReady(u)) return false
              const p = nativePosition(w, u),
                cell = ((p.x >>> 8) & 254) | (p.y & 0xfe00)
              return cellDistanceSquared(cell, target) <= radius * radius
            })
            if (!unit) return null
            const p = nativePosition(w, unit)
            return ((p.x >>> 8) & 254) | (p.y & 0xfe00)
          },
        })
      for (const action of actions) {
        if (action.kind === 'select') {
          const u = w.units.find(u => u.id === action.id)
          if (!u) throw new Error('Missing computer attack selection')
          const person = unitAnimationSource(u)
          if (u.inside !== null || u.entry || u.work !== null)
            u.native = release(w, u) ?? person ?? u.native
          u.native ??= createLivePerson(w, u)
          registerLivePerson(w, u.native)
          changeLivePersonState(w, u, 14)
        } else {
          const units = computerAttackUnits(w, index),
            order = emptyPersonOrder()
          if (action.kind === 'attackPerson') {
            writePersonOrder(order, 28, action.target, 0, 0)
            for (const u of units)
              if (appendLiveOrders(w, [u], order, true).count === 1) u.target = action.target
            continue
          }
          if (action.kind === 'attack') {
            const preachers = units.filter(unit => unit.kind === 'preacher'),
              attackers = units.filter(unit => unit.kind !== 'preacher')
            Object.assign(order, { model: 19, a: action.target, b: 0x0808 })
            if (attackers.length) appendLiveOrders(w, attackers, order, action.replace)
            for (const preacher of preachers) {
              const sermon = emptyPersonOrder(),
                point = {
                  x: ((action.target & 255) << 8) + 0x80,
                  y: (action.target & 0xff00) + 0x80,
                }
              writePersonOrder(sermon, 17, point.x, point.y, 0)
              appendLiveOrders(w, [preacher], sermon, action.replace)
            }
            continue
          }
          writePersonOrder(order, 3, 0, action.target, 0)
          const issued = units.length ? appendLiveOrders(w, units, order, action.replace) : null
          if (action.kind === 'move') for (const u of units) u.target = null
          if (
            action.kind === 'move' &&
            task.fallback !== 23 &&
            (!issued?.accepted || issued.count !== units.length)
          ) {
            for (const u of units) if (u.native?.state === 14) changeLivePersonState(w, u, 10)
            task.flags &= ~3
            task.members.length = 0
          }
        }
      }
      return
    }
    if (task.type !== 6) throw new Error(`Unbound computer task ${task.type}`)
    const target = trainingBuilding(w, task.target, tribe)
    const trainedModel = target ? rules.buildingTrainedModel[target.model] : 3
    let selection: ReturnType<typeof computerSelectionWorld> | undefined
    const actions = stepTrainingTask(w.ai, index, target, {
      tribe,
      preference: w.ai.attributes[trainedModel === 4 ? 6 : 7],
      population: campaignPersonCount(w, tribe),
      trained: campaignPersonCount(w, tribe, trainedModel),
      committed: target ? committedTraining(w, index, target.model, tribe) : 0,
      maximum: w.ai.attributes[33],
      select: (building, count) => {
        const b = w.buildings.find(b => b.id === building.id)!,
          p = buildingPosition(buildingPose(b)),
          destination = ((p.x >>> 8) & 254) | (p.y & 0xfe00),
          current = (selection ??= computerSelectionWorld(w, tribe)),
          ids = selectComputerPeople(current.world, 2, 2, building.id, 1, destination, 6, count)
        for (const id of ids) {
          const source = current.sources.get(id)
          if (source) source.flags3 = current.world.units.get(id)!.flags3
        }
        return ids
      },
    })
    for (const action of actions) {
      if (action.kind === 'restore') {
        restoreComputerSelection(w, index)
      } else if (action.kind === 'select') {
        const u = w.units.find(u => u.id === action.id)
        if (!u || u.inside !== null || u.entry)
          throw new Error('Unsupported computer training selection')
        if (u.work !== null) releaseTasks(w, u)
        u.native ??= createLivePerson(w, u)
        registerLivePerson(w, u.native)
        changeLivePersonState(w, u, 14)
        w.ai.trainingSelections[index].push(u.id)
      } else if (action.kind === 'train') {
        const units = w.ai.trainingSelections[index].flatMap(id => {
          const u = w.units.find(u => u.id === id && u.hp > 0)
          return u ? [u] : []
        })
        const order = emptyPersonOrder()
        writePersonOrder(order, 8, action.id, 0, 0)
        const issued = units.length ? appendLiveOrders(w, units, order, true) : null
        if (!issued?.accepted || issued.count !== units.length) task.flags &= ~3
        w.ai.trainingSelections[index].length = 0
      } else {
        const u = w.units.find(u => u.id === action.id),
          p = u && leaveLiveBuilding(w, u)
        if (u && p) {
          u.entry = undefined
          u.native = p
          u.work = null
          changeLivePersonState(w, u, 10)
        }
      }
    }
  })
}

// ponytail: browser unit arrays supply cell order until native terrain lists and
// person records are live. Blast scoring does not consume terrain flags.
function computerSpellPerson(w: World, u: Unit): SpellTargetUnit {
  const p = nativePosition(w, u),
    live = unitAnimationSource(u)
  return {
    class: 1,
    model: nativePersonModel(u),
    state: live?.state ?? 0,
    tribe: tribeForTeam(u.team),
    x: p.x,
    y: p.y,
    flags2: u.inside === null ? 0 : 0x800000,
    flags4: live?.flags4 ?? (u.invisibility ? 0x1000 : 0),
    assignment: live?.assignment ?? 0,
    disguise: 0,
  }
}
function computerSpellWorld(w: World, tribe: number): SpellTargetWorld {
  const cells = new Map<number, SpellTargetUnit[]>()
  for (const u of w.units)
    if (u.hp > 0 && u.inside === null) {
      const p = computerSpellPerson(w, u)
      const cell = ((p.x >>> 8) & 254) | (p.y & 0xfe00)
      const objects = cells.get(cell) ?? []
      objects.push(p)
      cells.set(cell, objects)
    }
  return {
    tribe,
    alliances: w.outcome.alliances[tribe],
    cells,
    terrainFlags: cell => w.land.flags[nativeCellIndex(cell)],
  }
}
export function refreshTribeTerritory(w: World, id: number) {
  const team = campaignTeam(w, id)
  refreshBuildingTerritory(w.land, w.turn, {
    id,
    playerType: w.manaTribes[id].playerType,
    defenceRadius: id === campaignTribe(w) ? w.ai.defenceRadius : 11,
    buildings: w.buildings
      .filter(b => b.hp > 0 && b.team === team)
      .map(b => ({ ...nativePosition(w, b), tribe: id })),
  })
}
export function stepComputerSpells(w: World, tribe = campaignTribe(w)) {
  const team = campaignTeam(w, tribe),
    u = w.units.find(u => u.team === team && isShaman(u) && u.hp > 0)
  const person = u ? combatPerson(u) : null
  const caster =
    u && person
      ? {
          ...spellCaster(w, u),
          ...person,
          landIndex: person.vehicle,
          casting: w.castingTribes[tribe],
          playerType: w.manaTribes[tribe].playerType,
        }
      : null
  const world = computerSpellWorld(w, tribe),
    categoryFlags = (cell: number) =>
      rules.terrainCategoryFlags[w.land.categories[nativeCellIndex(cell)] & 15]
  const allocate = (model: number, cell: number) => allocateComputerSpell(w, u!, model, cell)
  // The live person owns native action flags; browser casting has no native record yet.
  if (caster && u?.casting) caster.flags4 |= 0x400
  const shore = castShoreBlast(
    world,
    caster,
    {
      turn: w.turn,
      population: w.units.filter(p => p.team === team && !p.ghost && p.hp > 0).length,
      mana: w.manaTribes[tribe].mana,
      reserve: 0,
      gameFlags: w.manaWorld.gameFlags,
      aiFlags: w.ai.flags,
    },
    { categoryFlags, cast: allocate }
  )
  refreshTribeTerritory(w, tribe)
  if (shore) return
  const enemyTeam = campaignTeam(w, w.ai.enemyTribe)
  const enemy = w.units.find(p => p.team === enemyTeam && isShaman(p) && p.hp > 0)
  const context = {
    turn: w.turn,
    mana: w.manaTribes[tribe].mana,
    reserve: 0,
    gameFlags: w.manaWorld.gameFlags,
    aiFlags: w.ai.flags,
    aiStates: w.ai.states,
    nativeConvertTask: w.outcome.level === 3,
    coordinateTarget: w.ai.coordinateLatch,
    blastFrequency: w.ai.attributes[32],
    stock: w.manaWorld.spells[tribe],
  }
  processComputerSpells(world, w.spellScan, caster, context, w.ai.spellEntries, {
    categoryFlags,
    regionFlags: cell => w.land.regions[nativeCellIndex(cell)],
    cast: allocate,
    enemyShaman: enemy ? computerSpellPerson(w, enemy) : null,
    enemyBuildings: w.buildings
      .filter(b => b.team === enemyTeam && b.hp > 0 && b.kind === 'tower')
      .map(b => {
        const people = w.units.filter(p => p.inside === b.id && p.hp > 0)
        return {
          ...buildingPose(b),
          model: 4,
          state: b.progress === 1 ? 2 : 1,
          occupants: people.length,
          firstOccupant: people[0] ? computerSpellPerson(w, people[0]) : null,
        }
      }),
  })
  w.ai.flags = context.aiFlags
}
