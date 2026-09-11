import { buildingPose, buildingModel, browserPosition, type World, type Unit } from './model.ts'
import {
  createLivePerson,
  changeLivePersonState,
  registerLivePerson,
  setLivePersonAnimation,
  stepLivePhysics,
  type LivePerson,
} from './live-people.ts'
import { stepLiveWorship } from './live-worship.ts'
import { liveBuildingAttackTarget } from './live-building-combat.ts'
import { clearLivePath, planLivePath, acceptLivePath, stepLiveRoute } from './live-pathfinding.ts'
import { releasePersonRoute } from './person-routes.ts'
import { buildingOutsidePoint } from './building-shapes.ts'
import { objectsInCell } from './object-cells.ts'
import {
  startPersonOrders,
  configurePersonOrder,
  type OrderStartEffects,
} from './person-order-start.ts'
import { stepPersonOrders } from './person-order-update.ts'
import { recoverPersonMovement, defaultPersonState, resetPersonMotion } from './person-state.ts'
import {
  currentPersonOrder,
  allocatePersonOrder,
  attachPersonOrder,
  appendPersonOrders,
  emptyPersonOrder,
  writePersonOrder,
  clearPersonOrders,
  removePersonOrder,
  advancePersonOrder,
  stepMovementOrder,
  prepareMovementOrder,
  type OrderEffects,
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
  stopWork: unsupported,
  releaseSpell: unsupported,
  deleteObject: unsupported,
  releaseFight: p =>
    recoverPersonMovement(w, p as LivePerson, (person, object) =>
      setLivePersonAnimation(w, person as LivePerson, object)
    ),
})

function orderContext(w: World, p: LivePerson, rng: { randomState: number }) {
  const order = currentPersonOrder(w.buildingOrders, p)
  if (!order || ![3, 19, 27].includes(order.model)) unsupported()
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
      clearLivePath(w, unit)
      acceptLivePath(
        w,
        unit,
        planLivePath(w, unit, browserPosition({ x, y }), person as LivePerson)
      )
    },
    commandPosition: unsupported,
    allowVehicleOrder: unsupported,
    initializeCommand: () => {
      // Command 19's specialized initialization only changes the radius for model 19.
      const b = liveBuildingAttackTarget(w, p)
      if (b && buildingModel(b) === 19) order!.flags |= 4
    },
    adjacentBuilding: unsupported,
    canStayForTarget: unsupported,
    leaveBuilding: unsupported,
    resetVehicleMovement: unsupported,
    leaveSelectedVehicle: unsupported,
    initializeState: unsupported,
  }
  return { state, effects }
}

export function startLiveOrders(w: World, p: LivePerson, rng: { randomState: number }) {
  const { state, effects } = orderContext(w, p, rng)
  startPersonOrders(state, p, effects)
  rng.randomState = state.randomState
}

// Player ground clicks append to the same eight-slot queues used by simulation.
export function appendLiveMovement(
  w: World,
  units: Unit[],
  to: { x: number; y: number },
  flags: number,
  replace: boolean
) {
  const command = emptyPersonOrder()
  writePersonOrder(command, 3, 0, ((to.x >>> 8) & 255) | (to.y & 0xff00), flags)
  let count = 0
  const accepted = appendPersonOrders(
    w.buildingOrders,
    command,
    units.map(u => {
      const p = u.native ?? createLivePerson(w, u)
      u.native = p
      p.selectionFlags |= 128
      if (replace) clearPersonOrders(w.buildingOrders, p, orderEffects(w))
      registerLivePerson(w, p)
      return p
    }),
    {
      ...orderEffects(w),
      prepare: (order, model, x, y, commandFlags = 0) => {
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
    const p = u.native!
    if (p.state === 25 || p.state === 29) continue
    // Native player input restarts the active order even when appending a later one.
    resetPersonMotion(p)
    p.previousState = 0
    p.state = defaultPersonState(p, w.manaWorld.gameFlags)
    changeLivePersonState(w, u)
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
  const remove = (slot: number) => removePersonOrder(w.buildingOrders, p, slot, orderEffects(w))
  const next = stepPersonOrders(
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
      commands: {
        3: order => Number(stepMovementOrder(p, order, w.land.categories, unsupported)),
        27: () => Number(stepLiveWorship(w, u)),
      },
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
      initialize: () => changeLivePersonState(w, u),
    }
  )
  if (next) {
    if (p.commandStatus === 27) u.work = null
    clearLivePath(w, u)
    changeLivePersonState(w, u, next)
  }
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
