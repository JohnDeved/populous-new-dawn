import {
  addUnit,
  buildingModel,
  buildingPose,
  browserPosition,
  ensureBuildingDamage,
  releaseTasks,
  sound,
  type Building,
  type Unit,
  type World,
} from './model.ts'
import {
  createLivePerson,
  moveLivePerson,
  setLivePersonAnimation,
  syncLivePersonCells,
  type LivePerson,
} from './live-people.ts'
import {
  enterBuilding,
  removeBuildingOccupant,
  setPersonOccupancy,
  repriceTraining,
  trainingOccupantWeight,
  type OccupancyEffects,
} from './building-occupants.ts'
import {
  stepTrainingPerson,
  rebuildTrainingQueue,
  selectTrainingOccupants,
  type TrainingBuilding,
} from './training.ts'
import { stepTrainingConversion, type ConvertingBuilding } from './training-conversion.ts'
import { startPersonOrders } from './person-order-start.ts'
import {
  allocatePersonOrder,
  attachPersonOrder,
  clearPersonOrders,
  prepareMovementOrder,
  currentPersonOrder,
  type OrderPool,
  type OrderEffects,
} from './person-orders.ts'
import { clearLivePath, planLivePath, acceptLivePath, stepLiveRoute } from './live-pathfinding.ts'
import { releasePersonRoute, setDirectPersonDestination } from './person-routes.ts'
import {
  insertObjectIntoCell,
  removeObjectFromCell,
  moveObjectInCells,
  objectsInCell,
} from './object-cells.ts'
import { finishPersonPreparation, preparePersonTurn } from './person-update.ts'
import {
  personAnimationObject,
  initializePersonState,
  defaultPersonState,
  resetPersonMotion,
} from './person-state.ts'
import { terrainPointHeight } from './native-terrain.ts'
import { buildingOutsidePoint, buildingSocketPoint } from './building-shapes.ts'
import { dropCarriedTimber, timberTransfer } from './timber.ts'
import { stepDismantling, toggleDismantling } from './building-dismantle.ts'
import { changeBuildingWork } from './building-damage.ts'
import { rebuildRestingSlots } from './resting-slots.ts'
import { initializeIdleApproach } from './person-idle.ts'
import { restingCellCollision } from './person-collision.ts'
import { startIndexedSearch, nextIndexedSearch, endIndexedSearch } from './indexed-search.ts'
import { setPersonAnchor, personStateAfterOrders } from './person-order-update.ts'
import { startBuildingOccupantAnimation } from './animation.ts'
import sprites from './original-units.json' with { type: 'json' }
import rules from './original-rules.json' with { type: 'json' }

type EntryPerson = LivePerson & { savedVehicle: number; orderDelay: number }
export interface BuildingEntry {
  person: EntryPerson
  orders: OrderPool
}
export type BuildingAdmission = ConvertingBuilding & TrainingBuilding & { manaNext: number }

function unsupported(): never {
  throw new Error('Building entry reached an unported world consumer')
}
const orderEffects: OrderEffects = {
  prepare: unsupported,
  stopWork: unsupported,
  releaseSpell: unsupported,
  deleteObject: unsupported,
  releaseFight: unsupported,
}
const person = (w: World, u: Unit): EntryPerson =>
  Object.assign(createLivePerson(w, u), { savedVehicle: 0, orderDelay: 0 })

function begin(w: World, u: Unit, b: Building): BuildingEntry | undefined {
  const p = person(w, u),
    orders = w.buildingOrders,
    id = allocatePersonOrder(orders)
  if (!id) return
  Object.assign(orders.records[id], {
    model: b.admission?.activity && b.admission.activity & 0x8000 ? 10 : 8,
    a: b.id,
  })
  attachPersonOrder(orders, p, id, 0, orderEffects)
  p.previousState = p.state
  p.state = defaultPersonState(p, w.manaWorld.gameFlags)
  initializeBuildingPerson(w, p)
  return { person: p, orders }
}

function initializeBuildingPerson(w: World, p: EntryPerson) {
  const startup = {
    randomState: w.randomState,
    instantFacing: false,
    levelFlags: w.manaWorld.gameFlags,
    orders: w.buildingOrders,
    tribes: w.manaTribes.map(t => ({
      x: 0,
      y: 0,
      angle: 0,
      selectedCount: 0,
      flags: t.flags2,
      vehicleMode: 0,
    })),
  }
  const effects: Parameters<typeof startPersonOrders>[2] = {
    setAnimation: (_, object) => setLivePersonAnimation(w, p, object),
    setDestination: unsupported,
    commandPosition: unsupported,
    allowVehicleOrder: unsupported,
    initializeCommand: (_, order) => {
      const b = w.buildings.find(b => b.id === order.a)
      if (order.model !== 10 || !b) unsupported()
      const point = buildingOutsidePoint(buildingPose(b))
      order.b = ((point.x >>> 8) & 254) | (point.y & 0xfe00)
    },
    adjacentBuilding: unsupported,
    canStayForTarget: unsupported,
    leaveBuilding: unsupported,
    resetVehicleMovement: unsupported,
    leaveSelectedVehicle: unsupported,
    initializeState: unsupported,
  }
  const initialize = () =>
    initializePersonState(startup, p, {
      setAnimation: effects.setAnimation,
      startOrders: () => startPersonOrders(startup, p, effects),
      releaseMotion: () => {
        releasePersonRoute(w.motionRoutes, p)
        const u = w.units.find(u => u.id === p.id)
        if (u) clearLivePath(w, u)
      },
      rebuildTrainingQueue: id => {
        const b = w.buildings.find(b => b.id === id)?.admission
        if (b) rebuildTrainingQueue(context(w), b)
      },
      idleApproach: () =>
        initializeIdleApproach(w.manaWorld.gameFlags, p, {
          setAnimation: effects.setAnimation,
          collision: point => {
            const cell = (point.y >> 9) * 128 + (point.x >> 9)
            return restingCellCollision(
              { flags: w.land.flags[cell], category: w.land.categories[cell] },
              w.land.walkMasks[0],
              point
            )
          },
          height: point => terrainPointHeight(w.land, point),
          searchStart: () => startIndexedSearch(w.indexedSearch, 2, 0, 0, 32),
          searchNext: id => nextIndexedSearch(w.indexedSearch, id),
          searchEnd: id => endIndexedSearch(w.indexedSearch, id),
          destination: point => setDirectPersonDestination(w.motionRoutes, p, point),
          allocateOrder: unsupported,
          adjacentBuilding: unsupported,
          buildingPoint: unsupported,
          prepareOrder: unsupported,
          occupied: unsupported,
          clearOrders: unsupported,
          attachOrder: unsupported,
          initialize,
        }),
      occupying: () => {
        p.timer = startBuildingOccupantAnimation(
          p,
          object => setLivePersonAnimation(w, p, object),
          sprites.frameCounts
        )
        setPersonOccupancy(context(w), p, 0, occupancyEffects(w))
        releasePersonRoute(w.motionRoutes, p)
        const u = w.units.find(unit => unit.id === p.id)
        if (u) clearLivePath(w, u)
        if (p.model === 4) unsupported() // Preacher tower behavior is a separate unported class.
      },
      deselectPassengers: unsupported,
      rebuildFormation: cell =>
        rebuildRestingSlots(
          {
            cellObjects: cell => objectsInCell(w.objectCells, cell) as Iterable<LivePerson>,
          },
          cell
        ),
    })
  initialize()
  w.randomState = startup.randomState
}

// Keep physical slot order across departures. Legacy/load adapters can still
// supply residents through u.inside; ordinary object registration remains open.
export function buildingAdmission(w: World, b: Building): BuildingAdmission {
  b.admission ??= {
    ...buildingPose(b),
    id: b.id,
    class: 2,
    model: buildingModel(b),
    tribe: b.team === 'blue' ? 0 : 1,
    flags2: 0,
    flags3: 0,
    activity: 8,
    inside: 0,
    occupants: Array(6).fill(0),
    trainingTimer: 0,
    trainingCost: 0,
    entryDelay: 0,
    lastActivity: 0,
    queueHead: 0,
    queueFrom: 0,
    entering: 0,
    entryTimer: 0,
    counter: b.counter,
    storedMana: b.timer,
    manaNext: 0,
  }
  const state = b.admission
  Object.assign(state, buildingPose(b), {
    model: buildingModel(b),
    counter: b.counter,
    storedMana: b.timer,
  })
  const previous = [...state.occupants]
  const residents = new Set(w.units.filter(u => u.inside === b.id && u.hp > 0).map(u => u.id))
  for (let i = 0; i < state.occupants.length; i++) {
    const id = state.occupants[i]
    if (!residents.delete(id)) state.occupants[i] = 0
  }
  for (const id of residents) {
    const slot = state.occupants.indexOf(0)
    if (slot >= 0) state.occupants[slot] = id
  }
  state.inside = state.occupants.filter(Boolean).length
  if (b.kind === 'camp' && state.occupants.some((id, i) => id !== previous[i])) {
    const ctx = context(w),
      weight = trainingOccupantWeight(ctx, state)
    state.activity = weight ? state.activity | 128 : state.activity & ~128
    if (weight) repriceTraining(ctx, state)
  }
  return state
}

function context(w: World) {
  const people = new Map<number, EntryPerson>()
  const tribes = w.manaTribes.map(t => ({
    playerType: t.playerType,
    personCounts: Array(9).fill(0),
    buildingIds: [] as number[],
  }))
  for (const u of w.units) {
    if (u.hp <= 0) continue
    const tribe = u.team === 'blue' ? 0 : u.team === 'red' ? 1 : -1
    if (tribe >= 0)
      tribes[tribe].personCounts[u.kind === 'brave' ? 2 : u.kind === 'warrior' ? 3 : 7]++
    if (u.entry || u.inside !== null) people.set(u.id, u.entry?.person ?? person(w, u))
  }
  const buildings = new Map<number, BuildingAdmission>()
  for (const b of w.buildings) {
    tribes[b.team === 'blue' ? 0 : 1].buildingIds.push(b.id)
    if (b.admission) buildings.set(b.id, b.admission)
  }
  return {
    randomState: w.randomState,
    people,
    buildings,
    tribes,
    orders: w.buildingOrders,
    towerTribes: 0,
    turn: w.turn,
    playerTribe: w.manaWorld.playerTribe,
    buildingAt: (cell: number) =>
      w.land.buildingIds[(cell >> 9) * 128 + ((cell & 254) >> 1)] & 1023,
  }
}

function occupancyEffects(w: World): OccupancyEffects {
  return {
    orders: orderEffects,
    leaveVehicle: p => {
      if ((p as EntryPerson).vehicle) unsupported()
    },
    adjacentBuilding: (p, model) => {
      const cell = (p.y >> 9) * 128 + (p.x >> 9)
      if (!(w.land.flags[cell] & 512)) return 0
      const id = w.land.buildingIds[cell] & 1023
      return w.buildings.some(b => b.id === id && (!model || buildingModel(b) === model)) ? id : 0
    },
    towerPosition: id => {
      const b = w.buildings.find(b => b.id === id)!
      const point = buildingSocketPoint(buildingPose(b), 1)
      return { ...point, supportHeight: point.heightOffset }
    },
    terrainHeight: (x, y) => terrainPointHeight(w.land, { x, y }),
    moveToCell: (person, x, y, h) => {
      const p = person as EntryPerson
      moveObjectInCells(w.objectCells, p, { x, y, h })
      const u = w.units.find(unit => unit.id === p.id)!
      Object.assign(u, browserPosition(p))
    },
    insertCell: p => {
      w.objectCells.objects.set(p.id, p as EntryPerson)
      insertObjectIntoCell(w.objectCells, p as EntryPerson, p)
    },
    removeCell: p => removeObjectFromCell(w.objectCells, p as EntryPerson),
    planExitPoint: unsupported,
    updateIndicator: b => {
      for (const u of w.units) {
        if (b.occupants.includes(u.id)) u.inside = b.id
        else if (u.inside === b.id) u.inside = null
      }
    },
  }
}

export function leaveBuildingEntry(w: World, u: Unit) {
  const b = w.buildings.find(b => b.id === u.inside)
  if (!u.entry || !b?.admission) return
  const p = u.entry.person
  removeBuildingOccupant(context(w), b.admission, p, occupancyEffects(w))
  u.heading = Math.PI - (p.angle * Math.PI) / 1024
  return p
}

export function selectBuildingOccupants(w: World, b: Building, clicked: number, group: boolean) {
  if (w.inputMask || w.land.landFlags & 0x800 || b.team !== 'blue' || b.hp <= 0) return
  const selected = new Set(w.selected)
  const occupants =
    (b.progress < 1 ? b.builders : b.admission?.occupants)?.flatMap(id => {
      const u =
        id &&
        w.units.find(
          unit =>
            unit.id === id &&
            unit.hp > 0 &&
            (b.progress < 1 ? unit.work === b.id : unit.inside === b.id)
        )
      if (!u) return []
      const p = u.entry?.person ?? createLivePerson(w, u)
      // Shared browser selection still owns the displayed roster. Keep native
      // selection bits in step until all selection-state/command dispatch is live.
      p.selectionFlags = (p.selectionFlags & ~128) | (selected.has(id) ? 128 : 0)
      return [p]
    }) ?? []
  selectTrainingOccupants(occupants, clicked, group)
  for (const p of occupants) {
    if (p.selectionFlags & 128) selected.add(p.id)
    else selected.delete(p.id)
  }
  w.selected = [...selected]
  w.mode = null
}

export function isDismantling(w: World, u: Unit) {
  return !!u.entry && currentPersonOrder(w.buildingOrders, u.entry.person)?.model === 10
}

export function dismantleBuilding(w: World, b: Building) {
  if (w.inputMask || w.land.landFlags & 0x800 || b.team !== 'blue' || b.hp <= 0) return
  const admission = buildingAdmission(w, b),
    ctx = context(w)
  toggleDismantling(w.buildingOrders, ctx.people, admission, !(admission.activity & 0x8000), {
    buildingAt: ctx.buildingAt,
    assign: (id, order) => {
      const u = w.units.find(u => u.id === id)!,
        p = ctx.people.get(id)!
      u.entry ??= { person: p, orders: w.buildingOrders }
      leaveBuildingEntry(w, u)
      clearPersonOrders(w.buildingOrders, p, orderEffects)
      attachPersonOrder(w.buildingOrders, p, order, 0, orderEffects)
      resetPersonMotion(p)
      u.work = b.id
      if (!(p.flags2 & 0x100000)) {
        p.previousState = p.state
        p.state = defaultPersonState(p, w.manaWorld.gameFlags)
        initializeBuildingPerson(w, p)
      }
    },
  })
  // Construction still owns browser work tasks rather than shared native orders.
  // Apply the same reassignment to those workers, preserving position and cargo.
  if (admission.activity & 0x8000) {
    for (const u of w.units)
      if (u.work === b.id && u.builder && u.hp > 0 && u.team === b.team) {
        releaseTasks(w, u)
        u.work = b.id
        u.entry = begin(w, u, b)
      }
    b.builders?.fill(0)
  }
}

export function cancelBuildingEntry(w: World, u: Unit) {
  if (!u.entry) return
  const p = u.entry.person
  clearPersonOrders(w.buildingOrders, p, orderEffects)
  if (p.flags3 & 32) {
    const b = w.buildings.find(b => b.id === p.workTarget)?.admission
    if (b) rebuildTrainingQueue(context(w), b)
  }
  releasePersonRoute(w.motionRoutes, p)
  u.supportHeight = p.supportHeight || undefined
  u.entry = undefined
  clearLivePath(w, u)
}

export function stepBuildingEntry(w: World, u: Unit, b: Building) {
  const fresh = !u.entry
  u.entry ??= begin(w, u, b)
  if (!u.entry) return
  const p = u.entry.person
  if (p.state === 21) {
    // Native state-21 pose freezes once its signed timer expires. AI reassignment
    // and other occupied classes remain separate scheduler consumers.
    p.counter = (p.counter + 1) & 255
    if (p.timer) {
      p.timer = ((p.timer - 1) << 16) >> 16
      if (p.timer < 1) p.renderFlags |= 2
    }
    return
  }
  const state = buildingAdmission(w, b),
    ctx = context(w),
    order = currentPersonOrder(w.buildingOrders, p)!
  syncLivePersonCells(w)
  p.counter = (p.counter + 1) & 255
  p.cargo = Math.round(u.cargo * 100)
  const owner = (p: { id: number }) => w.units.find(u => u.id === p.id)!
  const stop = (p: EntryPerson) => {
    releasePersonRoute(w.motionRoutes, p)
    clearLivePath(w, owner(p))
  }
  const destination = (p: EntryPerson, x: number, y: number) => {
    stop(p)
    const unit = owner(p)
    acceptLivePath(w, unit, planLivePath(w, unit, browserPosition({ x, y }), p))
  }
  if (!fresh) {
    const preparation = {
      animation: () => {
        const object = personAnimationObject(p)
        if (object !== -1) setLivePersonAnimation(w, p, object)
      },
      destination: (point: { x: number; y: number }) => destination(p, point.x, point.y),
    }
    if (order.model === 10)
      preparePersonTurn(p, w.manaWorld.gameFlags, {
        ...preparation,
        initialize: () => initializeBuildingPerson(w, p),
      })
    else finishPersonPreparation(p, preparation)
    ctx.randomState = w.randomState
    moveLivePerson(w, u, p)
    stepLiveRoute(w, u)
  }
  const dropCargo = () =>
    dropCarriedTimber(
      p,
      () => {
        w.trees.push({ id: w.nextId++, ...browserPosition(p), logs: 1, model: 11 })
        return true
      },
      () => sound(w, 10, u)
    )
  let done = 1
  if (!(order.flags & 1)) {
    if (order.model === 10)
      done = stepDismantling(ctx, p, order, {
        building: id => {
          const target = w.buildings.find(b => b.id === id && b.hp > 0)
          return target && buildingAdmission(w, target)
        },
        plan: () => b.damageState?.plan,
        adjacentBuilding: () => {
          const cell = (p.y >> 9) * 128 + (p.x >> 9)
          return w.land.flags[cell] & 512 ? w.land.buildingIds[cell] & 1023 : 0
        },
        animation: (_, object) => {
          setLivePersonAnimation(w, p, object)
          if (!p.speed) stop(p)
        },
        destination: (point, direct) => {
          if (direct) {
            stop(p)
            setDirectPersonDestination(w.motionRoutes, p, point)
          } else destination(p, point.x, point.y)
        },
        dropCargo,
        removeOccupant: () => {
          const resident = w.units.find(u => u.inside === b.id && u.hp > 0)
          if (resident) leaveBuildingEntry(w, resident)
        },
        ensurePlan: () => {
          const state = ensureBuildingDamage(b)
          if (state.state === 2 && !(state.flags2 & 0x100000)) state.state = 1
        },
        takeTimber: (plan, requested) => {
          const state = b.damageState!,
            amount = timberTransfer(plan.remaining, p.cargo, rules.personWood[p.model], requested)
          changeBuildingWork(plan, -amount, state, null, {
            move: () => {},
            release: unsupported,
            init: unsupported,
          })
          p.cargo += amount
          b.progress = Math.max(0, plan.remaining) / rules.buildingLife[state.model]
          b.logs = Math.max(0, plan.remaining / 100)
        },
        removePlan: () => {}, // The live damage plan is owned by the building object.
        removeBuilding: () => {
          b.hp = 0
          b.dismantled = true
        },
      })
    else
      done = stepTrainingPerson(ctx, p, {
        setAnimation: (person, object) => {
          const p = person as EntryPerson
          setLivePersonAnimation(w, p, object)
          if (!p.speed) stop(p)
        },
        releaseMotion: person => stop(person as EntryPerson),
        adjacentBuilding: person => {
          const cell = (person.y >> 9) * 128 + (person.x >> 9)
          return w.land.flags[cell] & 512 ? w.land.buildingIds[cell] & 1023 : 0
        },
        setDestination: (p, x, y) => destination(p as EntryPerson, x, y),
        directDestination: (person, x, y) => {
          const p = person as EntryPerson
          stop(p)
          setDirectPersonDestination(w.motionRoutes, p, { x, y })
        },
        dropCargo,
        enterBuilding: () => {
          enterBuilding(ctx, p, state, occupancyEffects(w))
        },
        workInside: unsupported,
      })
  }
  w.randomState = ctx.randomState
  u.cargo = p.cargo / 100
  u.heading = Math.PI - (p.angle * Math.PI) / 1024
  if (done) {
    if (u.inside !== null && state.model === 4) {
      setPersonAnchor(p, buildingOutsidePoint(state))
      p.previousState = p.state
      p.state = personStateAfterOrders(
        {
          landFlags: w.land.landFlags,
          playerTribe: w.manaWorld.playerTribe,
          survivingTribes: () => w.manaTribes.filter(t => t.active && !t.defeatTimer).length,
        },
        p
      )
      initializeBuildingPerson(w, p)
    } else cancelBuildingEntry(w, u)
    if (u.inside === null) u.work = null
  }
}

export function stepLiveTraining(w: World, b: Building) {
  if (w.manaWorld.gameFlags & 32) return
  const state = buildingAdmission(w, b),
    ctx = context(w),
    created: Unit[] = []
  const effects = occupancyEffects(w)
  stepTrainingConversion(ctx, state, {
    ...effects,
    orders: {
      ...orderEffects,
      prepare: (order, model, x, y, flags = 0) => {
        if (model !== 3) unsupported()
        prepareMovementOrder(order, { x, y }, flags, w.land, id =>
          buildingOutsidePoint(buildingPose(w.buildings.find(b => b.id === id)!))
        )
      },
      deleteObject: id => {
        const u = w.units.find(u => u.id === id),
          p = ctx.people.get(id)
        if (!u || !p) unsupported()
        p.class = 0
        ctx.tribes[p.tribe].personCounts[p.model]--
        u.hp = 0
        cancelBuildingEntry(w, u)
      },
    },
    // The renderer observes admission for panel art; native allocation/lifetime
    // and remaining panel commands still need their original UI controller.
    updateTrainingPanel: () => {},
    addMana: (tribe, amount) => {
      w.manaTribes[tribe].available = (w.manaTribes[tribe].available + amount) | 0
    },
    allocateTrainee: (model, tribe, x, y, angle) => {
      if (![2, 3].includes(model)) unsupported()
      const u = addUnit(
        w,
        tribe === 0 ? 'blue' : 'red',
        model === 3 ? 'warrior' : 'brave',
        browserPosition({ x, y })
      )
      u.heading = Math.PI - (angle * Math.PI) / 1024
      const p = person(w, u)
      ctx.people.set(p.id, p)
      ctx.tribes[tribe].personCounts[model]++
      created.push(u)
      // Keep the native command record until ordinary routing takes ownership below.
      u.entry = { person: p, orders: w.buildingOrders }
      return p
    },
  })
  b.timer = state.storedMana
  for (const u of created) {
    if (u.hp <= 0) continue
    const p = u.entry!.person,
      order = w.buildingOrders.records[p.commands[0]]
    if (order?.model === 3)
      acceptLivePath(w, u, planLivePath(w, u, browserPosition({ x: order.a, y: order.b })))
    // ponytail: conversion preserves native shared commands; ordinary movement
    // still uses the browser adapter until the complete order dispatcher owns it.
    clearPersonOrders(w.buildingOrders, p, orderEffects)
    u.entry = undefined
    if (u.team === 'blue' && u.kind === 'warrior') w.stats.trained++
  }
}
