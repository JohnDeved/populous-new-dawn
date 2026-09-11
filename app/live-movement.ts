import { buildingPose, buildingModel, type World, type Unit } from './model.ts'
import {
  createLivePerson,
  leaveLiveBuilding,
  changeLivePersonState,
  registerLivePerson,
  setLivePersonAnimation,
  stepLivePhysics,
  type LivePerson,
} from './live-people.ts'
import { initializeBuildingPerson } from './live-building-entry.ts'
import { stepLiveWorship } from './live-worship.ts'
import { liveBuildingAttackTarget, releaseLiveAttackReservation } from './live-building-combat.ts'
import { clearLivePath, stepLiveRoute, replanLivePath } from './live-pathfinding.ts'
import { releasePersonRoute } from './person-routes.ts'
import { buildingOutsidePoint } from './building-shapes.ts'
import { objectsInCell } from './object-cells.ts'
import {
  startPersonOrders,
  configurePersonOrder,
  type OrderStartEffects,
} from './person-order-start.ts'
import { stepPersonOrders, type OrderUpdateEffects } from './person-order-update.ts'
import { recoverPersonMovement, defaultPersonState, resetPersonMotion } from './person-state.ts'
import {
  currentPersonOrder,
  allocatePersonOrder,
  attachPersonOrder,
  appendPersonOrders,
  clearPersonOrders,
  removePersonOrder,
  advancePersonOrder,
  stepMovementOrder,
  prepareMovementOrder,
  prepareBuildingEntryOrder,
  prepareCombatOrder,
  type OrderEffects,
  type PersonOrder,
} from './person-orders.ts'
import {
  joinMarchingFormation,
  stepMarchingFormation,
  type MarchingFormation,
} from './marching-formations.ts'

const unsupported = (): never => {
  throw new Error('Unported live movement order consumer')
}
export type LiveFormation = MarchingFormation & { tribe: number }
const orderEffects = (w: World): OrderEffects => ({
  prepare: unsupported,
  stopWork: person => releaseLiveAttackReservation(w, person.workTarget),
  releaseSpell: unsupported,
  deleteObject: unsupported,
  releaseFight: p =>
    recoverPersonMovement(w, p as LivePerson, (person, object) =>
      setLivePersonAnimation(w, person as LivePerson, object)
    ),
})

function orderContext(w: World, p: LivePerson, rng: { randomState: number }) {
  const order = currentPersonOrder(w.buildingOrders, p)
  if (!order || ![3, 8, 10, 19, 27].includes(order.model)) unsupported()
  const state = {
    randomState: rng.randomState,
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
  const effects: OrderStartEffects = {
    setAnimation: (person, object) => setLivePersonAnimation(w, person as LivePerson, object),
    setDestination: (person, x, y) => {
      const unit = w.units.find(u => u.id === person.id)!
      replanLivePath(w, unit, person as LivePerson, { x, y })
    },
    commandPosition: unsupported,
    allowVehicleOrder: unsupported,
    initializeCommand: () => {
      if (order!.model === 10) {
        const b = w.buildings.find(building => building.id === order!.a)
        if (b) {
          const point = buildingOutsidePoint(buildingPose(b))
          order!.b = ((point.x >>> 8) & 254) | (point.y & 0xfe00)
        }
        return
      }
      // Command 19's specialized initialization only changes the radius for model 19.
      const b = liveBuildingAttackTarget(w, p)
      if (b && buildingModel(b) === 19) order!.flags |= 4
    },
    adjacentBuilding: (person, model) => {
      const cell = (person.y >> 9) * 128 + (person.x >> 9)
      if (!(w.land.flags[cell] & 512)) return 0
      const id = w.land.buildingIds[cell] & 1023
      return w.buildings.some(b => b.id === id && (!model || buildingModel(b) === model)) ? id : 0
    },
    canStayForTarget: unsupported,
    leaveBuilding: person => {
      leaveLiveBuilding(w, w.units.find(u => u.id === person.id)!)
    },
    resetVehicleMovement: unsupported,
    leaveSelectedVehicle: unsupported,
    initializeState: person => {
      w.randomState = state.randomState
      const unit = w.units.find(u => u.id === person.id)!
      if (unit.entry?.person === person) initializeBuildingPerson(w, person as LivePerson)
      else changeLivePersonState(w, unit)
      state.randomState = w.randomState
    },
  }
  return { state, effects }
}

export function startLiveOrders(w: World, p: LivePerson, rng: { randomState: number }) {
  const { state, effects } = orderContext(w, p, rng)
  startPersonOrders(state, p, effects)
  rng.randomState = state.randomState
}

// Keep the person and shared queue intact when a different live controller takes over.
export function adoptLiveOrders(w: World, u: Unit, p: LivePerson) {
  const order = currentPersonOrder(w.buildingOrders, p)
  if (order && [8, 10].includes(order.model)) {
    u.native = null
    u.entry ??= { person: p, orders: w.buildingOrders }
    u.work = order.a
  } else {
    if (order?.model === 27) u.work = order.a
    else if (u.entry) u.work = null
    u.entry = undefined
    u.native = p
  }
}

// Player clicks append to the same eight-slot queues used by simulation.
export function appendLiveOrders(w: World, units: Unit[], command: PersonOrder, replace: boolean) {
  let count = 0
  const accepted = appendPersonOrders(
    w.buildingOrders,
    command,
    units.map(u => {
      const p = u.native ?? u.entry?.person ?? createLivePerson(w, u)
      if (!u.entry) u.native = p
      p.selectionFlags |= 128
      if (replace) clearPersonOrders(w.buildingOrders, p, orderEffects(w))
      registerLivePerson(w, p)
      return p
    }),
    {
      ...orderEffects(w),
      prepare: (order, model, x, y, commandFlags = 0) => {
        if (model === 19) {
          prepareCombatOrder(order, { a: x, b: y }, commandFlags, w.land.categories, 19)
          return
        }
        if (model === 8) {
          prepareBuildingEntryOrder(
            order,
            x,
            y,
            commandFlags,
            !!((w.buildings.find(b => b.id === x)?.admission?.activity ?? 0) & 0x8000)
          )
          return
        }
        if (model === 27) {
          if (order.model !== model || order.a !== x || order.b !== y)
            Object.assign(order, { model, a: x, b: y, flags: order.flags | commandFlags })
          return
        }
        if (model !== 3) unsupported()
        prepareMovementOrder(order, { x, y }, commandFlags, w.land, id =>
          buildingOutsidePoint(buildingPose(w.buildings.find(b => b.id === id)!))
        )
      },
      acknowledge: (_, counts) => {
        count = counts.reduce((a, b) => a + b, 0)
      },
      special: unsupported,
    }
  )
  for (const u of units) {
    const p = (u.native ?? u.entry?.person)!
    if (p.state === 25 || p.state === 29) continue
    // Native player input restarts the active order even when appending a later one.
    resetPersonMotion(p)
    p.previousState = 0
    p.state = defaultPersonState(p, w.manaWorld.gameFlags)
    if (u.entry) initializeBuildingPerson(w, p)
    else changeLivePersonState(w, u)
    adoptLiveOrders(w, u, p)
  }
  return { accepted, count }
}

export function movementOrder(w: World, to: { x: number; y: number }) {
  const id = allocatePersonOrder(w.buildingOrders)
  if (id)
    prepareMovementOrder(w.buildingOrders.records[id], to, 0, w.land, buildingId =>
      buildingOutsidePoint(buildingPose(w.buildings.find(b => b.id === buildingId)!))
    )
  return id
}

export function startLiveOrder(w: World, u: Unit, id: number) {
  const p = u.native ?? createLivePerson(w, u)
  u.native = p
  attachPersonOrder(w.buildingOrders, p, id, 0, orderEffects(w))
  registerLivePerson(w, p)
  changeLivePersonState(w, u, 10)
}

export function cancelLiveOrder(w: World, u: Unit) {
  const p = u.native ?? u.flight ?? u.fight?.motion
  if (!p || ![3, 27].includes(currentPersonOrder(w.buildingOrders, p)?.model ?? 0)) return
  clearPersonOrders(w.buildingOrders, p, orderEffects(w))
  releasePersonRoute(w.motionRoutes, p)
  clearLivePath(w, u)
}

function join(w: World, p: LivePerson) {
  joinMarchingFormation(
    {
      search: w.indexedSearch,
      cellPeople: cell => objectsInCell(w.objectCells, cell) as Iterable<LivePerson>,
    },
    p,
    w.marching.filter(g => g.tribe === p.tribe),
    leader => {
      const group: LiveFormation = {
        id: w.nextId++,
        class: 10,
        model: 0,
        tribe: leader.tribe,
        x: leader.x,
        y: leader.y,
        heading: 0,
        destinationX: 0,
        destinationY: 0,
        shape: 0,
        speed: 0,
        timer: 0,
        shapeTimer: 0,
        count: 0,
        freeSlot: 0,
        members: Array(12).fill(0),
        offsets: Array.from({ length: 12 }, () => ({ x: 0, y: 0 })),
      }
      // Native allocation prepends the tribe list. Browser object allocation has no cap yet.
      w.marching.unshift(group)
      return group
    }
  )
}

export function stepLiveMovement(w: World, u: Unit) {
  const p = u.native!
  stepLivePhysics(w, u, p)
  stepLiveRoute(w, u)
  if (p.state !== 10) return
  const next = stepLiveOrderQueue(w, u, p, {
    3: order => Number(stepMovementOrder(p, order, w.land.categories, unsupported)),
    27: () => Number(stepLiveWorship(w, u)),
  })
  if (next) {
    if (p.commandStatus === 27) u.work = null
    clearLivePath(w, u)
    changeLivePersonState(w, u, next)
  }
  adoptLiveOrders(w, u, p)
}

// Shared native state-10 completion: entry and movement advance the same queue.
export function stepLiveOrderQueue(
  w: World,
  u: Unit,
  p: LivePerson,
  commands: OrderUpdateEffects['commands']
) {
  const remove = (slot: number) => removePersonOrder(w.buildingOrders, p, slot, orderEffects(w))
  return stepPersonOrders(
    {
      orders: w.buildingOrders,
      landFlags: w.land.landFlags,
      levelFlags2: w.levelFlags2,
      playerTribe: w.manaWorld.playerTribe,
      objects: new Map(),
      survivingTribes: () => w.manaTribes.filter(t => t.active && !t.defeatTimer).length,
    },
    p,
    {
      commands,
      commandPosition: order => ({ x: order.a, y: order.b }),
      vehicleDestination: unsupported,
      vehicleReady: unsupported,
      changeTribe: unsupported,
      effectiveTribe: unsupported,
      cellObjects: unsupported,
      arrival: unsupported,
      leaveVehicle: () => {
        if (p.vehicle) unsupported()
        return false
      },
      outside: to => {
        const cell = (to.y >> 9) * 128 + (to.x >> 9)
        return w.land.flags[cell] & 512
          ? buildingOutsidePoint(
              buildingPose(w.buildings.find(b => b.id === (w.land.buildingIds[cell] & 1023))!)
            )
          : to
      },
      destination: unsupported,
      stop: unsupported,
      formation: () => join(w, p),
      remove,
      advance: () =>
        advancePersonOrder(w.buildingOrders, p, {
          remove,
          resumeVehicle: () => false,
          resumeBuilding: () => false,
          // 0x436870 only rewrites command 31; ground/head queues do not use it.
          prepareNext: () => {
            if (w.buildingOrders.records[p.commands[p.commandCursor]].model === 31) unsupported()
          },
          configure: () => {
            const { state, effects } = orderContext(w, p, w)
            configurePersonOrder(state, p, effects)
            w.randomState = state.randomState
          },
          recover: () =>
            recoverPersonMovement(w, p, (person, object) =>
              setLivePersonAnimation(w, person as LivePerson, object)
            ),
        }),
      initialize: () => {
        if (u.entry) initializeBuildingPerson(w, p)
        else changeLivePersonState(w, u)
      },
    }
  )
}

// 0x4ec6f0 visits tribe formations before encounters and ordinary objects.
// New groups recruited by people therefore begin on the next simulation turn.
export function stepLiveMarchingFormations(w: World) {
  if (!w.marching.length) return
  const people = new Map<number, LivePerson>()
  for (const u of w.units) {
    const p = u.flight ?? u.fight?.motion ?? u.native ?? u.entry?.person ?? u.builder?.person
    if (p) {
      if (u.hp <= 0) p.flags2 |= 1
      people.set(p.id, p)
    }
  }
  for (let tribe = 0; tribe < 4; tribe++) {
    for (const g of w.marching) {
      if (!g.class || g.tribe !== tribe) continue
      // Retain removed records until this visit, as the native object pool does.
      for (const id of g.members)
        if (id && !people.has(id)) {
          const p = w.objectCells.objects.get(id) as LivePerson | undefined
          if (p) {
            p.class = 0
            people.set(id, p)
          }
        }
      const state = { randomState: w.randomState, poseRandom: w.cosmeticRandom, people }
      stepMarchingFormation(state, g, {
        remove: () => {
          g.class = 0
        },
        destination: (p, to) => {
          p.turnAngle = to.x
          p.turnY = to.y
          p.flags2 = ((p.flags2 & ~128) | 4096) >>> 0
        },
        setAnimation: (p, object) => setLivePersonAnimation(w, p as LivePerson, object),
      })
      w.randomState = state.randomState
    }
  }
  w.marching = w.marching.filter(g => g.class)
}
