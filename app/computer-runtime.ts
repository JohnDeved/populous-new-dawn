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
} from './building-shapes.ts'
import { buildingAdmission } from './live-building-entry.ts'
import {
  currentPersonOrder,
  deselectPerson,
  emptyPersonOrder,
  writePersonOrder,
} from './person-orders.ts'
import {
  appendLiveOrders,
  appendLiveGuardOrders,
  startLiveConstructionOrder,
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
  type SelectionUnit,
  type SelectionWorld,
} from './computer-selection.ts'
import {
  computerPhase,
  acquireSelection,
  dispatchComputerTask,
  releaseSelection,
  requestConstruction,
  requestTraining,
  stepAttackTask,
  stepMarkerTask,
  stepShamanGuardTask,
  stepTrainingTask,
  type TrainingBuilding,
} from './computer.ts'
import { missionData } from './mission-data.ts'
import rules from './original-rules.json' with { type: 'json' }
import { spellCaster, beginCast } from './spell-casting.ts'
import { clearLivePath } from './live-pathfinding.ts'
import { nativeCellPoint } from './world-coordinates.ts'
import {
  castShoreBlast,
  processComputerSpells,
  type SpellTargetUnit,
  type SpellTargetWorld,
} from './computer-spells.ts'
import { refreshBuildingTerritory } from './territory.ts'
import { addBuilding, checkBuildingSite } from './construction-runtime.ts'
import { entrance, findPath, route } from './live-command.ts'
import { releaseTasks } from './world-tasks.ts'

export function computerSelectionWorld(w: World, tribe: number) {
  const team = campaignTeam(w, tribe),
    sources = new Map<number, LivePerson>(),
    people: SelectionUnit[] = []
  for (const u of w.units) {
    if (u.team !== team || u.hp <= 0) continue
    const source = unitAnimationSource(u),
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

function produceMissionWarriorTraining(w: World, tribe: number) {
  if (w.ai.tasks.every(task => task.flags & 1)) return
  const model = 3,
    trainingModel = 7,
    trained = campaignPersonCount(w, tribe, model),
    target = computerTrainingBuilding(w, trainingModel, tribe)
  if (
    !(w.ai.states & (1 << 6)) ||
    !target ||
    Math.trunc((w.ai.attributes[7] * campaignPersonCount(w, tribe)) / 100) <= trained
  )
    return
  random(w) // Native producer chooses among eligible classes; mission one has only warrior training.
  const selection = computerSelectionWorld(w, tribe),
    available = availableTrainingPeople(selection.world),
    capacity = rules.buildingCapacity[trainingModel]
  // ponytail: preserve Mission 1's established gate until that producer is re-probed.
  if (w.outcome.level === 6 ? available < capacity : available >= capacity) return
  requestTraining(w.ai, 0, model, available, candidate =>
    candidate === trainingModel ? target : 0
  )
}

// Mission 6's ordinary 0x4e5580 producer reaches training buildings before housing.
function produceMissionSixBuilding(w: World, tribe: number) {
  const team = campaignTeam(w, tribe),
    has = (model: number) =>
      w.buildings.some(
        building => building.team === team && building.hp > 0 && buildingModel(building) === model
      ) ||
      w.ai.tasks.some(
        task =>
          task.flags & 1 && task.type === 0 && task.requested === model && task.phase < 3
      ),
    base = w.buildings.find(
      building => building.team === team && building.hp > 0 && buildingModel(building) === 4
    ),
    housing = w.buildings
      .filter(building => building.team === team && building.hp > 0)
      .reduce((sum, building) => {
        const model = buildingModel(building)
        return sum + (rules.buildingFlags[model] & 0x20 ? rules.buildingCapacity[model] : 0)
      }, 0)
  if (
    w.outcome.level !== 6 ||
    !(w.ai.states & 1) ||
    w.ai.tasks.filter(task => task.flags & 1 && task.type === 0).length >= w.ai.attributes[9]
  )
    return false
  const selection = computerSelectionWorld(w, tribe)
  if (availableTrainingPeople(selection.world) < 2) return false
  const shaman = w.units.find(unit => unit.team === team && isShaman(unit) && unit.hp > 0),
    position = shaman && nativePosition(w, shaman),
    origin = base
      ? ((buildingPose(base).anchorX >>> 8) & 254) | (buildingPose(base).anchorY & 0xfe00)
      : position
        ? ((position.x >>> 8) & 254) | (position.y & 0xfe00)
        : 0
  if (!origin) return false
  // ponytail: one school of each kind is enough for the currently integrated specialist paths;
  // use native attribute target counts when later missions need multiple schools.
  const model = !base
    ? 4
    : !has(7) && w.ai.attributes[3]
      ? 7
      : housing < w.ai.attributes[10]
        ? 1
        : 0
  return !!model && requestConstruction(w.ai, model, origin)
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
  if (![1, 4, 7].includes(task.requested))
    throw new Error(`Unbound computer construction ${task.requested}`)
  if (task.phase === 0) {
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
        task.requested === 1 ? 'hut' : task.requested === 7 ? 'camp' : 'tower',
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
      task.phase = 4
      return
    }
    if (task.elapsed >= task.remaining) cleanup()
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

export function stepComputerTasks(w: World, tribe: number) {
  const level = missionData(w.outcome.level).level
  const phase = computerPhase(w.turn, tribe)
  if (phase === 'produce') {
    if (produceMissionSixBuilding(w, tribe)) return
    produceMissionWarriorTraining(w, tribe)
    return
  }
  if (phase !== 'dispatch') return
  dispatchComputerTask(w.ai, index => {
    const task = w.ai.tasks[index]
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
          select: (model, count, destination) => {
            const current = (selection ??= computerSelectionWorld(w, tribe)),
              ids = selectComputerPeople(current.world, model, model, -1, 1, destination, 7, count)
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
          if (!u || u.inside !== null || u.entry || u.work !== null)
            throw new Error('Unsupported computer attack selection')
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
          if (action.kind === 'attack')
            Object.assign(order, { model: 19, a: action.target, b: 0x0808 })
          else writePersonOrder(order, 3, 0, action.target, 0)
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
    let selection: ReturnType<typeof computerSelectionWorld> | undefined
    const actions = stepTrainingTask(w.ai, index, target, {
      tribe,
      preference: w.ai.attributes[7],
      population: campaignPersonCount(w, tribe),
      trained: campaignPersonCount(w, tribe, 3),
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
    assignment: 0,
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
  const allocate = (model: number, cell: number) => {
    const spell = SPELLS.find(s => s.model === model)
    if (!spell) throw new Error(`Unimplemented computer spell effect ${model}`)
    clearLivePath(w, u!)
    beginCast(w, u!, spell.id, nativeCellPoint(cell))
    const fightingPerson = u!.fight?.motion
    if (fightingPerson && (fightingPerson.state === 25 || fightingPerson.state === 29)) {
      u!.native = fightingPerson
      changeLivePersonState(w, u!, 22)
      u!.fight = null
    }
  }
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
