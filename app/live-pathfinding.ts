import type { World, Unit, Point } from './model.ts'
import { nativePosition, browserPosition, buildingPose, supportsFollower } from './model.ts'
import { createLivePerson, collisionWorld, type LivePerson } from './live-people.ts'
import { buildingOutsidePoint } from './building-shapes.ts'
import { buildingBlocksPerson, pathCellBlocked } from './person-collision.ts'
import { terrainCellHeightRange } from './native-terrain.ts'
import {
  buildPersonRoute,
  planPersonDestination,
  personRoutePosition,
  releasePersonRoute,
  routeVehicleAvailable,
} from './person-routes.ts'
import { advancePersonRoute } from './route-advance.ts'
import { searchPersonPath, collectSearchPath, type PathSearchState } from './path-search.ts'
import { createPathSolver, solvePersonPath } from './path-solver.ts'
import {
  createPathGeometry,
  preparePathCandidates,
  choosePathCandidate,
  clearPathSegment,
  smoothSearchPath,
  measureSearchPath,
} from './path-geometry.ts'
import rules from './original-rules.json' with { type: 'json' }

export function createLivePathfinding() {
  const state: PathSearchState = {
    searches: 0,
    landLimit: 0,
    checkingPerson: 0,
    limit: 0,
    vehicles: 0,
    mode: 0,
    currentBoat: 0,
    candidateCount: 0,
    candidateIndex: 0,
    truncated: 0,
    walkMask: 0,
  }
  // 0x42b590 sets both node limits to 200 and both request limits to zero.
  return {
    people: new Map<number, LivePerson>(),
    state,
    path: { data: new Uint8Array(2580), count: 0 },
    geometry: createPathGeometry(),
    solver: createPathSolver(),
    measure: { dirty: 0, distance: 0, tribes: 0 },
    computerLimit: 200,
    humanLimit: 200,
    computerRequests: 0,
    humanRequests: 0,
    skip: 0,
  }
}

// Ordinary routing owns its person fields here until the native state/animation
// dispatcher owns ordinary followers. Query records are released by the caller.
export function planLivePath(w: World, u: Unit, end: Point): LivePerson | null {
  if (!supportsFollower(w, end)) return null
  const p = createLivePerson(w, u),
    r = w.pathfinding,
    { state, path, geometry: g, solver } = r,
    collision = collisionWorld(w)
  p.flags2 = (p.flags2 | 0x2000000) >>> 0
  const tribes = w.manaTribes.map((t, i) => ({
    playerType: t.playerType,
    requests: (solver.tribeRequests[i] << 16) >> 16,
    flags: w.castingTribes[i].flags,
    active: t.active,
    defeatTimer: t.defeatTimer,
  }))
  const unsupported = () => {
    throw Error('Live native vehicle actions are not integrated')
  }
  // The browser world currently has no vehicle objects. Empty vehicle lookups
  // are exact for that world; adding vehicles requires their real object records.
  const probe = {
    buildingAccess: (cell: number) =>
      buildingBlocksPerson(
        collision,
        p,
        collision.cell({ x: (cell & 254) << 8, y: cell & 0xfe00 })
      ),
    boardingBoat: () => 0,
    disembark: unsupported,
    boatCell: unsupported,
  }
  const searchWorld = {
    state,
    path,
    result: w.motionRoutes.pathResult,
    categories: w.land.categories,
    flags: w.land.flags,
    walkMasks: w.land.walkMasks,
    boatsEnabled: 0,
    landLimit: rules.pathLandLimit,
    computerLimit: r.computerLimit,
    humanLimit: r.humanLimit,
    tribes,
    cellObjects: () => [],
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
    vehicles: new Map(),
  }
  const goal = nativePosition(w, end)
  try {
    planPersonDestination(planner, p, goal, {
      outside: id => {
        const b = w.buildings.find(b => b.id === id)
        if (!b) throw Error(`Missing native route building ${id}`)
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
      vehicleReady: unsupported,
      advance: () => advanceLiveRoute(w, p),
      build: (_, from, to) =>
        buildPersonRoute(w.motionRoutes, p, from, to, 0, tribes[p.tribe], {
          findVehicle: () => null,
          search: (_, person, a, b, option, vehicles) =>
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
            ),
        }),
    })
    r.skip = planner.skip
    if (
      !(p.flags4 & 0x10000000) &&
      liveRoutePoints(w, p).every(point => supportsFollower(w, point))
    )
      return p
  } catch (error) {
    releasePersonRoute(w.motionRoutes, p)
    throw error
  }
  releasePersonRoute(w.motionRoutes, p)
  return null
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
  clearLivePath(w, u)
  if (p) {
    w.pathfinding.people.set(u.id, p)
    u.path = liveRoutePoints(w, p)
  }
  return u.path
}

function advanceLiveRoute(w: World, p: LivePerson) {
  const unsupported = () => {
    throw Error('Live native vehicle actions are not integrated')
  }
  advancePersonRoute(
    { routes: w.motionRoutes, vehicles: new Map(), people: w.pathfinding.people },
    p,
    {
      boarding: () => 0,
      board: unsupported,
      routeAvailable: () => routeVehicleAvailable(w.motionRoutes, p, () => 0),
      approach: unsupported,
      alternativeLanding: unsupported,
      landingBlocked: unsupported,
      prepareLanding: unsupported,
      leaveVehicle: unsupported,
      clearOrders: unsupported,
    }
  )
}

// 0x4e6d00 advances routes after the position/cell update. Velocity and task
// arrival still belong to the browser controller; native advancement owns which
// waypoint comes next, including its 224-unit ground arrival square.
export function stepLiveRoute(w: World, u: Unit) {
  const p = w.pathfinding.people.get(u.id)
  if (!p) return
  const to = nativePosition(w, u)
  p.x = to.x & 65535
  p.y = to.y & 65535
  p.h = to.h
  p.counter = w.turn & 255
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
