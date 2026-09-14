import { buildingPose } from './building-shapes.ts'
import {
  nativePosition,
  browserPosition,
  supportsFollower,
  type World,
  type Unit,
  type Point,
  type Vehicle,
} from './model.ts'
import { createLivePerson, collisionWorld, type LivePerson } from './live-people.ts'
import { buildingOutsidePoint } from './building-shapes.ts'
import { buildingBlocksPerson, pathCellBlocked } from './person-collision.ts'
import { terrainCellHeightRange } from './native-terrain.ts'
import {
  buildPersonRoute,
  correctRouteEndpoints,
  type RouteEffects,
  setPlannedPersonDestination,
  personRoutePosition,
  releasePersonRoute,
  routeVehicleAvailable,
} from './person-routes.ts'
import { advancePersonRoute } from './route-advance.ts'
import {
  boardingVehicle,
  findVehicleLanding,
  vehicleCanApproach,
  vehicleCanDisembark,
  vehicleCellFree,
  vehicleReady,
} from './vehicle-routing.ts'
import {
  boardLiveVehicle,
  leaveLiveVehicle,
  liveVehicleCellObjects,
  liveVehicles,
  nearestLiveBoat,
} from './live-vehicles.ts'
import { searchPersonPath, collectSearchPath } from './path-search.ts'
import { createPathSolver, solvePersonPath } from './path-solver.ts'
import {
  preparePathCandidates,
  choosePathCandidate,
  clearPathSegment,
  smoothSearchPath,
  measureSearchPath,
} from './path-geometry.ts'
import rules from './original-rules.json' with { type: 'json' }

export { createLivePathfinding } from './world-state.ts'

// Input/query wrapper retains the existing destination and terrain validation.
// Query records are released by the caller; native retries bypass these gates.
export function planLivePath(
  w: World,
  u: Unit,
  end: Point,
  p = createLivePerson(w, u),
  probeOnly = false,
  transport = false
): LivePerson | null {
  if (
    !probeOnly &&
    !transport &&
    !w.vehicles.some(v => v.active) &&
    !supportsFollower(w, end)
  )
    return null
  if (!probeOnly) p.flags2 = (p.flags2 | 0x2000000) >>> 0
  try {
    const planned = planDestination(w, u, p, nativePosition(w, end), probeOnly)
    if (probeOnly) return planned ? p : null
    const vehicleRoute =
      p.motionGroup && !!(w.motionRoutes.records[p.motionGroup * 109 + 2] & 3)
    if (
      !(p.flags4 & 0x10000000) &&
      (vehicleRoute || liveRoutePoints(w, p).every(point => supportsFollower(w, point)))
    )
      return p
  } catch (error) {
    releasePersonRoute(w.motionRoutes, p)
    throw error
  }
  releasePersonRoute(w.motionRoutes, p)
  return null
}

// 0x4d42a0 retries the original goal through 0x4e9d80, retaining route reuse,
// person flags and failed-search fallback. This is not a new player command.
export function replanLivePath(w: World, u: Unit, p: LivePerson, goal: { x: number; y: number }) {
  planDestination(w, u, p, goal)
  w.pathfinding.people.set(u.id, p)
  u.path = liveRoutePoints(w, p)
}

function routeContext(w: World, u: Unit, p: LivePerson, searchOption = 0) {
  const r = w.pathfinding,
    { state, path, geometry: g, solver } = r,
    collision = collisionWorld(w)
  const boats = w.vehicles.some(v => v.active)
  const tribes = w.manaTribes.map((t, i) => ({
    playerType: t.playerType,
    requests: (solver.tribeRequests[i] << 16) >> 16,
    flags: w.castingTribes[i].flags | (boats ? 32 : 0),
    active: t.active,
    defeatTimer: t.defeatTimer,
  }))
  const vehicles = liveVehicles(w)
  const vehicleWorld = {
    flags: w.land.flags,
    categories: w.land.categories,
    boatsEnabled: Number(vehicles.size > 0),
    vehicles,
    people: w.pathfinding.people,
    tribes,
    cellObjects: (cell: number) => liveVehicleCellObjects(w, cell),
  }
  const probe = {
    buildingAccess: (cell: number) =>
      buildingBlocksPerson(
        collision,
        p,
        collision.cell({ x: (cell & 254) << 8, y: cell & 0xfe00 })
      ),
    boardingBoat: (cell: number) => boardingVehicle(vehicleWorld, p, cell),
    disembark: (id: number, to: { x: number; y: number }) =>
      vehicleCanDisembark(vehicleWorld, vehicles.get(id)!, to),
    boatCell: (cell: number, id: number) => vehicleCellFree(vehicleWorld, cell, id),
  }
  const searchWorld = {
    state,
    path,
    result: w.motionRoutes.pathResult,
    categories: w.land.categories,
    flags: w.land.flags,
    walkMasks: w.land.walkMasks,
    boatsEnabled: vehicleWorld.boatsEnabled,
    landLimit: rules.pathLandLimit,
    computerLimit: r.computerLimit,
    humanLimit: r.humanLimit,
    tribes,
    cellObjects: vehicleWorld.cellObjects,
  }
  const planner = {
    routes: w.motionRoutes,
    skip: r.skip,
    get checkingPerson() {
      return state.checkingPerson
    },
    set checkingPerson(id: number) {
      state.checkingPerson = id
    },
    levelFlags2: w.levelFlags2,
    computerLimit: r.computerRequests,
    humanLimit: r.humanRequests,
    tribes,
    land: w.land,
    vehicles,
  }
  const search = (
    person: LivePerson,
    a: { x: number; y: number },
    b: { x: number; y: number },
    option: number,
    vehicles: boolean
  ) =>
    searchPersonPath(
      searchWorld,
      person,
      Uint8Array.of(a.x, a.y, 0, 0),
      Uint8Array.of(b.x, b.y, 0, 0),
      option,
      vehicles,
      {
        prepare: () => preparePathCandidates(searchWorld, g),
        choose: i => choosePathCandidate(searchWorld, g, i),
        solve: () => solvePersonPath(searchWorld, g, solver, p, probe),
        smooth: () =>
          smoothSearchPath(path, 0, (a, b, k) =>
            clearPathSegment(searchWorld, g, p, a, b, k, probe)
          ),
        measure: () => measureSearchPath(path, g.line, r.measure, w.land.regions, tribes),
        collect: () => {
          state.truncated = Number(collectSearchPath(path, w.motionRoutes.pathResult, 0))
        },
      }
    )
  const routeEffects: RouteEffects = {
    outside: id => {
      const b = w.buildings.find(b => b.id === id)
      if (!b) throw new Error(`Missing native route building ${id}`)
      return buildingOutsidePoint(buildingPose(b))
    },
    buildingBlocks: cell =>
      !!pathCellBlocked(
        collision,
        p,
        cell,
        () => terrainCellHeightRange(w.land, cell),
        state.landLimit,
        () => u.inside ?? 0
      ),
    coastDirection: to =>
      rules.terrainCategoryDirections[
        w.land.categories[((to.y & 65535) >> 9) * 128 + ((to.x & 65535) >> 9)] & 15
      ],
    vehicleReady: id => vehicleReady(vehicleWorld, vehicles.get(id)!),
    advance: () => advanceLiveRoute(w, p),
    build: (_, from, to) =>
      buildPersonRoute(w.motionRoutes, p, from, to, searchOption, tribes[p.tribe], {
        findVehicle: (_, center, minimum, maximum) =>
          nearestLiveBoat(w, center, minimum, maximum) ?? null,
        search: (_, _person, a, b, option, vehicles) => search(p, a, b, option, vehicles),
      }),
  }
  return { planner, routeEffects, search }
}

// 0x494d10 consumes path cost synchronously without allocating or attaching a
// motion route. The search scratch buffers are shared, as in the native game.
export function probeLivePathCost(w: World, u: Unit, source: LivePerson, from: number, to: number) {
  const p = { ...source },
    { search } = routeContext(w, u, p),
    measure = w.pathfinding.measure
  Object.assign(measure, { dirty: 1, distance: 0, tribes: 0 })
  const failed = search(p, { x: from & 255, y: from >>> 8 }, { x: to & 255, y: to >>> 8 }, 0, false)
  measure.dirty = 0
  return {
    result: failed ? 1 : measure.tribes & ~(1 << (p.tribe & 31)) ? 2 : 0,
    cost: measure.distance,
  }
}

// 0x4ea920: recovery corrects copied endpoints, then builds with its current
// search option. The caller owns release/cache clearing/reserved attachment.
export function buildLiveRecoveryRoute(w: World, u: Unit, p: LivePerson, option: number) {
  const { planner, routeEffects } = routeContext(w, u, p, option)
  const from = { x: p.x >>> 8, y: p.y >>> 8 },
    to = { x: p.goalX >>> 8, y: p.goalY >>> 8 }
  correctRouteEndpoints(planner, p, from, to, routeEffects)
  return routeEffects.build(p, from, to)
}

function planDestination(
  w: World,
  u: Unit,
  p: LivePerson,
  goal: { x: number; y: number },
  probeOnly = false
) {
  const { planner, routeEffects } = routeContext(w, u, p)
  if (probeOnly) {
    const from = { x: p.x >> 8, y: p.y >> 8 },
      to = { x: (goal.x >> 8) & 255, y: (goal.y >> 8) & 255 }
    correctRouteEndpoints(planner, p, from, to, routeEffects)
    return !!routeEffects.build(p, from, to)
  }
  setPlannedPersonDestination(planner, p, goal, routeEffects, () => {})
  w.pathfinding.skip = planner.skip
  return true
}

function liveRoutePoints(w: World, p: LivePerson) {
  const points: Point[] = []
  if (p.motionGroup)
    for (let i = p.motionIndex; i < w.motionRoutes.records[p.motionGroup * 109 + 108]; i++)
      points.push(browserPosition(personRoutePosition(w.motionRoutes, p.motionGroup, i)))
  const final = browserPosition({ x: p.goalX, y: p.goalY }),
    last = points.at(-1)
  if (!last || last.x !== final.x || last.z !== final.z) points.push(final)
  return points
}

export function findLivePath(w: World, u: Unit, end: Point): Point[] {
  const p = planLivePath(w, u, end)
  if (!p) return []
  try {
    return liveRoutePoints(w, p)
  } finally {
    releasePersonRoute(w.motionRoutes, p)
  }
}

export function clearLivePath(w: World, u: Unit) {
  const p = w.pathfinding.people.get(u.id)
  if (p) releasePersonRoute(w.motionRoutes, p)
  w.pathfinding.people.delete(u.id)
  u.path = []
}

export function acceptLivePath(w: World, u: Unit, p: LivePerson | null) {
  if (w.pathfinding.people.get(u.id) !== p) clearLivePath(w, u)
  else u.path = []
  if (p) {
    w.pathfinding.people.set(u.id, p)
    u.path = liveRoutePoints(w, p)
  }
  return u.path
}

function advanceLiveRoute(w: World, p: LivePerson) {
  const vehicles = liveVehicles(w),
    vehicleWorld = {
      flags: w.land.flags,
      categories: w.land.categories,
      boatsEnabled: Number(vehicles.size > 0),
      vehicles,
      people: w.pathfinding.people,
      tribes: w.manaTribes.map(t => ({ playerType: t.playerType })),
      cellObjects: (cell: number) => liveVehicleCellObjects(w, cell),
    }
  advancePersonRoute(
    { routes: w.motionRoutes, vehicles, people: w.pathfinding.people },
    p,
    {
      boarding: (person, cell) => boardingVehicle(vehicleWorld, person, cell),
      board: (person, vehicle) => boardLiveVehicle(w, person as LivePerson, vehicle as Vehicle),
      routeAvailable: person =>
        routeVehicleAvailable(w.motionRoutes, person, cell =>
          boardingVehicle(vehicleWorld, person, cell)
        ),
      approach: (vehicle, to) => vehicleCanApproach(vehicleWorld, vehicle, to),
      alternativeLanding: (vehicle, to) => {
        const landing = findVehicleLanding(vehicleWorld, w.indexedSearch, vehicle, to)
        return landing.found ? landing.point : null
      },
      landingBlocked: to =>
        !!p.vehicle && !vehicleCanDisembark(vehicleWorld, vehicles.get(p.vehicle)!, to),
      prepareLanding: (vehicle, to) => {
        vehicle.turnAngle = to.x
        vehicle.turnY = to.y
      },
      leaveVehicle: (vehicle, person, to) =>
        leaveLiveVehicle(w, vehicle as Vehicle, person as LivePerson, to),
      clearOrders: person => releasePersonRoute(w.motionRoutes, person),
    }
  )
}

// 0x4e6d00 advances routes after the position/cell update. Velocity and task
// arrival still belong to the browser controller; native advancement owns which
// waypoint comes next, including its 224-unit ground arrival square.
export function stepLiveRoute(w: World, u: Unit) {
  const p = w.pathfinding.people.get(u.id)
  if (!p) return
  if (p !== u.native) {
    const to = nativePosition(w, u)
    p.x = to.x & 65535
    p.y = to.y & 65535
    p.h = to.h
    p.counter = w.turn & 255
  }
  advanceLiveRoute(w, p)
  if (!p.motionGroup && p.x === p.goalX && p.y === p.goalY) clearLivePath(w, u)
  else u.path = liveRoutePoints(w, p)
}

export function removeDeadLiveRoutes(w: World) {
  const alive = new Set(w.units.filter(u => u.hp > 0).map(u => u.id))
  for (const [id, p] of w.pathfinding.people)
    if (!alive.has(id)) {
      releasePersonRoute(w.motionRoutes, p)
      w.pathfinding.people.delete(id)
    }
}
