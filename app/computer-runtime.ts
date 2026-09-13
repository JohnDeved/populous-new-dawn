import type { Point, Unit, World } from './world-types.ts'
import {
  createLivePerson,
  registerLivePerson,
  changeLivePersonState,
  leaveLiveBuilding,
  type LivePerson,
} from './live-people.ts'
import { unitAnimationSource } from './selection-runtime.ts'
import { nativePosition } from './world-terrain-runtime.ts'
import { nativePersonModel } from './live-combat.ts'
import { buildingModel, buildingPose, buildingPosition } from './building-shapes.ts'
import { buildingAdmission } from './live-building-entry.ts'
import {
  currentPersonOrder,
  deselectPerson,
  emptyPersonOrder,
  writePersonOrder,
} from './person-orders.ts'
import { appendLiveOrders, appendLiveGuardOrders } from './live-movement.ts'
import { cellDistanceSquared, random } from './native-math.ts'
import { isShaman } from './world-rules.ts'
import {
  campaignPersonCount,
  campaignAttackEntity,
  campaignAttackTarget,
} from './campaign-runtime.ts'
import {
  availableTrainingPeople,
  selectComputerPeople,
  type SelectionUnit,
  type SelectionWorld,
} from './computer-selection.ts'
import {
  computerPhase,
  dispatchComputerTask,
  requestTraining,
  stepAttackTask,
  stepMarkerTask,
  stepShamanGuardTask,
  stepTrainingTask,
  type TrainingBuilding,
} from './computer.ts'
import level from './level-one.ts'
import rules from './original-rules.json' with { type: 'json' }

export function computerSelectionWorld(w: World, tribe: number) {
  const team = tribe === 0 ? 'blue' : tribe === 1 ? 'red' : null,
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
      tribe: b.team === 'blue' ? 0 : 1,
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
      const shaman = w.units.find(
          u => u.hp > 0 && isShaman(u) && u.team === (id === 0 ? 'blue' : id === 1 ? 'red' : null)
        ),
        p = shaman && nativePosition(w, shaman)
      return {
        hasBase: id === 1 && !!(w.ai.flags & 0x100),
        base: id === 1 ? w.ai.defencePosition : 0,
        shaman: p ? ((p.x >>> 8) & 254) | (p.y & 0xfe00) : 0,
        radius: id === 1 ? w.ai.defenceRadius : 0,
      }
    }),
    buildingAt: cell =>
      w.land.buildingIds[((cell & 0xfe00) >>> 9) * 128 + ((cell & 254) >>> 1)] & 1023,
  }
  return { world, sources }
}

export function computerTrainingBuilding(w: World, model: number) {
  return (
    w.buildings.find(
      b =>
        b.team === 'red' &&
        b.hp > 0 &&
        b.progress === 1 &&
        b.damageState?.state !== 3 &&
        buildingModel(b) === model
    )?.id ?? 0
  )
}

function trainingBuilding(w: World, id: number): TrainingBuilding | null {
  const b = w.buildings.find(
    b =>
      b.id === id && b.team === 'red' && b.hp > 0 && b.progress === 1 && b.damageState?.state !== 3
  )
  if (!b) return null
  const admission = buildingAdmission(w, b),
    model = buildingModel(b),
    capacity = rules.buildingCapacity[model]
  return {
    id: b.id,
    owner: 1,
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
function committedTraining(w: World, current: number, model: number) {
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
    if (u.team !== 'red' || u.hp <= 0) continue
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
  const team = tribe === 1 ? 'blue' : tribe === 0 ? 'red' : null
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

function produceMissionWarriorTraining(w: World) {
  if (w.ai.tasks.every(task => task.flags & 1)) return
  const model = 3,
    trainingModel = 7,
    trained = campaignPersonCount(w, 1, model),
    target = computerTrainingBuilding(w, trainingModel)
  if (
    !(w.ai.states & (1 << 6)) ||
    !target ||
    Math.trunc((w.ai.attributes[7] * campaignPersonCount(w, 1)) / 100) <= trained
  )
    return
  random(w) // Native producer chooses among eligible classes; mission one has only warrior training.
  const selection = computerSelectionWorld(w, 1),
    available = availableTrainingPeople(selection.world)
  if (available >= rules.buildingCapacity[trainingModel]) return
  requestTraining(w.ai, 0, model, available, candidate =>
    candidate === trainingModel ? target : 0
  )
}

export function computerMarkerOrderCount(
  w: World,
  tribe: number,
  marker: number,
  secondary: number
) {
  const team = tribe === 0 ? 'blue' : tribe === 1 ? 'red' : null,
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
  const phase = computerPhase(w.turn, tribe)
  if (phase === 'produce') {
    produceMissionWarriorTraining(w)
    return
  }
  if (phase !== 'dispatch') return
  dispatchComputerTask(w.ai, index => {
    const task = w.ai.tasks[index]
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
          u.native.computerAssignment = 99
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
            if (units.length) appendLiveGuardOrders(w, units, marker)
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
          u => u.hp > 0 && isShaman(u) && u.team === (tribe === 0 ? 'blue' : 'red')
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
      const shaman = w.units.find(u => u.team === 'red' && isShaman(u) && u.hp > 0),
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
          reacquire: () => campaignAttackTarget(w, tribe === 1 ? 0 : 1),
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
    const target = trainingBuilding(w, task.target)
    let selection: ReturnType<typeof computerSelectionWorld> | undefined
    const actions = stepTrainingTask(w.ai, index, target, {
      tribe,
      preference: w.ai.attributes[7],
      population: campaignPersonCount(w, tribe),
      trained: campaignPersonCount(w, tribe, 3),
      committed: target ? committedTraining(w, index, target.model) : 0,
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
        if (!u || u.inside !== null || u.entry || u.work !== null)
          throw new Error('Unsupported computer training selection')
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
