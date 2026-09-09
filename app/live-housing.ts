import {
  buildingModel,
  buildingPose,
  browserPosition,
  sound,
  type Building,
  type Unit,
  type World,
} from './model.ts'
import {
  createLivePerson,
  cancelHousingEntry,
  moveLivePerson,
  setLivePersonAnimation,
  syncLivePersonCells,
  type LivePerson,
} from './live-people.ts'
import {
  enterBuilding,
  type OccupiedBuilding,
  type OccupancyEffects,
} from './building-occupants.ts'
import { stepTrainingPerson, type TrainingBuilding } from './training.ts'
import { startPersonOrders } from './person-order-start.ts'
import { emptyPersonOrder, type OrderPool, type OrderEffects } from './person-orders.ts'
import { clearLivePath, planLivePath, acceptLivePath, stepLiveRoute } from './live-pathfinding.ts'
import { releasePersonRoute, setDirectPersonDestination } from './person-routes.ts'
import { removeObjectFromCell } from './object-cells.ts'
import { finishPersonPreparation } from './person-update.ts'
import { personAnimationObject } from './person-state.ts'
import { terrainPointHeight } from './native-terrain.ts'
import { dropCarriedTimber } from './timber.ts'

type HousingPerson = LivePerson & { clip: number; savedVehicle: number; orderDelay: number }
export interface HousingEntry {
  person: HousingPerson
  orders: OrderPool
}
export type HousingBuilding = OccupiedBuilding & TrainingBuilding

function unsupported(): never {
  throw new Error('Housing entry reached an unported world consumer')
}
const orderEffects: OrderEffects = {
  prepare: unsupported,
  stopWork: unsupported,
  releaseSpell: unsupported,
  deleteObject: unsupported,
  releaseFight: unsupported,
}

// Ordinary commands still belong to the browser. This scoped command record
// lets the native controller own entry and clear its real reference on admission.
// ponytail: migrate it to the shared command pool with ordinary order ownership.
function begin(w: World, u: Unit, b: Building): HousingEntry {
  const p = Object.assign(createLivePerson(w, u), { clip: 0, savedVehicle: 0, orderDelay: 0 })
  const order = { ...emptyPersonOrder(), model: 8, a: b.id, references: 1 }
  p.commands[0] = 1
  const orders = { records: [emptyPersonOrder(), order], cursor: 1, active: 1 }
  const startup = {
    randomState: w.randomState,
    instantFacing: false,
    levelFlags: w.manaWorld.gameFlags,
    orders,
    tribes: w.manaTribes.map(t => ({
      x: 0,
      y: 0,
      angle: 0,
      selectedCount: 0,
      flags: t.flags2,
      vehicleMode: 0,
    })),
  }
  startPersonOrders(startup, p, {
    setAnimation: (_, object) => setLivePersonAnimation(w, p, object),
    setDestination: unsupported,
    commandPosition: unsupported,
    allowVehicleOrder: unsupported,
    initializeCommand: unsupported,
    adjacentBuilding: unsupported,
    canStayForTarget: unsupported,
    leaveBuilding: unsupported,
    resetVehicleMovement: unsupported,
    leaveSelectedVehicle: unsupported,
    initializeState: unsupported,
  })
  w.randomState = startup.randomState
  return { person: p, orders }
}

// Building entry/congestion clocks persist; the existing unit list remains the
// source of ordinary occupant identity until all six native slots are integrated.
function building(w: World, b: Building): HousingBuilding {
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
  }
  const state = b.admission
  Object.assign(state, buildingPose(b), { model: buildingModel(b) })
  const residents = w.units.filter(u => u.inside === b.id && u.hp > 0)
  state.inside = residents.length
  state.occupants.fill(0)
  residents.slice(0, 6).forEach((u, i) => {
    state.occupants[i] = u.id
  })
  return state
}

export function stepHousingEntry(w: World, u: Unit, b: Building) {
  const fresh = !u.entry
  u.entry ??= begin(w, u, b)
  const entry = u.entry
  const p = entry.person,
    state = building(w, b)
  syncLivePersonCells(w)
  p.counter = (p.counter + 1) & 255
  p.cargo = Math.round(u.cargo * 100)
  const context = {
    randomState: w.randomState,
    people: new Map([[p.id, p]]),
    buildings: new Map([[b.id, state]]),
    orders: entry.orders,
    towerTribes: 0,
    turn: w.turn,
    buildingAt: () => b.id,
    tribes: [],
  }
  const stop = () => {
    releasePersonRoute(w.motionRoutes, p)
    clearLivePath(w, u)
  }
  const destination = (_: unknown, x: number, y: number) => {
    stop()
    acceptLivePath(w, u, planLivePath(w, u, browserPosition({ x, y }), p))
  }
  if (!fresh) {
    finishPersonPreparation(p, {
      animation: () => {
        const object = personAnimationObject(p)
        if (object !== -1) setLivePersonAnimation(w, p, object)
      },
      destination: point => destination(p, point.x, point.y),
    })
    moveLivePerson(w, u, p)
    stepLiveRoute(w, u)
  }
  const occupancy: OccupancyEffects = {
    orders: orderEffects,
    leaveVehicle: () => {
      if (p.vehicle) unsupported()
    },
    adjacentBuilding: (person, model) => {
      const i = (person.y >> 9) * 128 + (person.x >> 9)
      if (!(w.land.flags[i] & 512)) return 0
      const id = w.land.buildingIds[i] & 1023
      return w.buildings.some(
        candidate => candidate.id === id && buildingModel(candidate) === model
      )
        ? id
        : 0
    },
    towerPosition: unsupported,
    terrainHeight: (x, y) => terrainPointHeight(w.land, { x, y }),
    moveToCell: unsupported,
    insertCell: unsupported,
    removeCell: () => removeObjectFromCell(w.objectCells, p),
    planExitPoint: unsupported,
    // The live HUD derives occupant counts directly from u.inside.
    updateIndicator: () => {},
  }
  const done = stepTrainingPerson(context, p, {
    setAnimation: (_, object) => {
      setLivePersonAnimation(w, p, object)
      if (!p.speed) stop()
    },
    releaseMotion: stop,
    adjacentBuilding: person => {
      const i = (person.y >> 9) * 128 + (person.x >> 9)
      return w.land.flags[i] & 512 ? w.land.buildingIds[i] & 1023 : 0
    },
    setDestination: destination,
    directDestination: (_, x, y) => {
      stop()
      setDirectPersonDestination(w.motionRoutes, p, { x, y })
    },
    dropCargo: () =>
      dropCarriedTimber(
        p,
        () => {
          w.trees.push({ id: w.nextId++, ...browserPosition(p), logs: 1, model: 11 })
          return true
        },
        () => sound(w, 10, u)
      ),
    enterBuilding: () => {
      if (enterBuilding(context, p, state, occupancy)) u.inside = b.id
    },
    workInside: unsupported,
  })
  w.randomState = context.randomState
  u.cargo = p.cargo / 100
  u.heading = Math.PI - (p.angle * Math.PI) / 1024
  if (done) {
    cancelHousingEntry(w, u)
    if (u.inside === null) u.work = null
  }
}
