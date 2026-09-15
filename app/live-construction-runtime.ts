import { tribeForTeam, type Building, type Point, type Unit, type World } from './world-types.ts'
import { BUILDINGS, buildingHp, unitSpeed } from './world-rules.ts'
import { breedingWork } from './world-state.ts'
import { short, positionDistance } from './native-math.ts'
import rules from './original-rules.json' with { type: 'json' }
import { changedBuildingGround, debrisModels } from './building-runtime.ts'
import { timberCell } from './construction-runtime.ts'
import {
  buildingFootprintCells,
  buildingGradeVertices,
  buildingInsidePoint,
  buildingModel,
  buildingOutsidePoint,
  buildingPose,
} from './building-shapes.ts'
import { collisionWorld, createLivePerson, setLivePersonAnimation } from './live-people.ts'
import { nativePersonModel } from './live-combat.ts'
import { removeObjectFromCell } from './object-cells.ts'
import { turnPerson } from './person-motion.ts'
import { clearLivePath, probeLivePathCost } from './live-pathfinding.ts'
import { releasePersonRoute, setDirectPersonDestination } from './person-routes.ts'
import { browserPosition, distance } from './world-coordinates.ts'
import { buildingDoor, entrance, findPath, route, tell } from './live-command.ts'
import { BuilderTask } from './building-workers.ts'
import { stepBuildingFetch } from './building-fetch.ts'
import {
  findTimber,
  looseTimberInCell,
  orderedTimberCells,
  refreshTimberSearch,
  stepTimberSearches,
  type TimberSearchWorld,
} from './timber-search.ts'
import {
  dropCarriedTimber,
  releaseTimberReservation,
  reserveTimber,
  startTimberHarvest,
  stepTimberHarvest,
  timberTransfer,
} from './timber.ts'
import { depleteTree, sound } from './world-effects.ts'
import { changeBuildingWork } from './building-damage.ts'
import {
  SceneryPhase,
  stepBuildingPeople,
  stepBuildingScenery,
  type ClearingPerson,
} from './building-clearing.ts'
import { restingCellAvailable } from './resting-slots.ts'
import { release } from './world-tasks.ts'
import { stepBuildingLevel } from './building-preparation.ts'
import { stepBuildingApproach, stepBuildingDeparture, stepBuildingWork } from './building-work.ts'
import { faceTribe } from './person-state.ts'
import { looseWoodInCell } from './hut-upgrade.ts'
import { nativePosition } from './world-terrain-runtime.ts'
import { personStepCollision } from './person-collision.ts'

// Native slots retain registration order. Browser work orders supply eligibility
// until the complete native person/plan command ownership is connected.

export function completeBuildingConstruction(w: World, b: Building) {
  if (!b.upgrading && !b.damageState) w.stats.built++
  b.upgrading = false
  if (b.kind === 'hut') b.timer = short(breedingWork(w, b) - 54)
  tell(w, `${BUILDINGS.find(s => s.id === b.kind)!.name} completed.`)
}

export function processBuilderWork(w: World, u: Unit, b: Building) {
  const task = u.builder!,
    p = (task.person ??= u.native ?? createLivePerson(w, u)),
    pose = buildingPose(b)
  if (u.native === p) {
    if (p.flags2 & 0x20000) removeObjectFromCell(w.objectCells, p)
    w.objectCells.objects.delete(p.id)
    u.native = null
  }
  Object.assign(p, nativePosition(w, u))
  p.x &= 65535
  p.y &= 65535
  p.counter = w.turn & 255
  p.state = 10
  p.cargo = Math.round(u.cargo * 100)
  const leaving = task.task === BuilderTask.Leave
  if (leaving || task.task === BuilderTask.ClearScenery || task.task === BuilderTask.ClearPeople)
    turnPerson(p)
  // 0x495520 clears movement mode when a construction subtask restarts.
  if (task.restart) p.flags4 = (p.flags4 & 0xfffefff8) >>> 0
  if (leaving && task.restart) {
    u.tree = null
    u.harvest = undefined
    u.delivery = undefined
  }
  const cell = (p.y >> 9) * 128 + (p.x >> 9)
  const destination = (to: { x: number; y: number }, direct = false) => {
    clearLivePath(w, u)
    setDirectPersonDestination(w.motionRoutes, p, to)
    if (direct) u.path = [browserPosition(to)]
    else route(w, u, browserPosition(to), true)
  }
  const animation = (_: unknown, object: number) => {
    setLivePersonAnimation(w, p, object)
    if (!p.speed) clearLivePath(w, u)
  }
  const releaseMotion = () => {
    releasePersonRoute(w.motionRoutes, p)
    clearLivePath(w, u)
  }
  const allocateLog = () => {
    w.trees.push({ id: w.nextId++, ...browserPosition(p), logs: 1, model: 11 })
    return true // ponytail: unbounded scenery until native object-pool allocation is connected.
  }
  let finished = 0
  if (task.task === BuilderTask.Fetch) {
    const searchWorld = liveTimberWorld(w),
      site = {
        id: b.id,
        class: 9,
        model: buildingModel(b),
        building: b.preparation ? 0 : b.id,
        flags3: b.woodUnavailable ? 0x1000 : 0,
        searchIndex: b.timberSearch ?? -1,
        angle: pose.angle,
        inside: buildingInsidePoint(pose),
        outside: buildingOutsidePoint(pose),
        occupied: w.land.buildingIds[cell],
      }
    const timber = (id: number) => {
      const tree = w.trees.find(tree => tree.id === id)
      return tree
        ? {
            ...nativePosition(w, tree),
            id: tree.id,
            class: tree.logs > 0 ? 5 : 0,
            model: tree.model,
            flags2: 0,
          }
        : { x: p.goalX, y: p.goalY, id, class: 0, model: 0, flags2: 1 }
    }
    finished = stepBuildingFetch(w, p, task, site, {
      animation,
      destination,
      directDestination: to => destination(to, true),
      releaseMotion,
      sound: cue => sound(w, cue, u),
      target: timber,
      refreshSearch: (point, angle) => {
        refreshTimberSearch(w.timberSearches, site, timberCell(point), angle, p)
        b.timberSearch = site.searchIndex
      },
      findWood: index => findTimber(w.timberSearches, searchWorld, index, p.id, true, false).target,
      looseWood: to => {
        const targetCell = ((to.y & 65535) >> 9) * 128 + ((to.x & 65535) >> 9)
        return (
          w.trees.find(tree => {
            const point = nativePosition(w, tree)
            return (
              tree.logs > 0 &&
              ((point.y & 65535) >> 9) * 128 + ((point.x & 65535) >> 9) === targetCell
            )
          })?.id ?? 0
        )
      },
      reserve: id => {
        const tree = w.trees.find(tree => tree.id === id)
        if (tree) reserveTimber(tree, Math.round(tree.logs * 100))
        u.tree = id
      },
      transfer: (from, _to, requested) => {
        if (from !== p.id) {
          const tree = w.trees.find(tree => tree.id === from)
          if (!tree) return
          const amount = timberTransfer(
            Math.round(tree.logs * 100),
            short(p.cargo),
            short(rules.personWood[p.model]),
            requested
          )
          if (amount) releaseTimberReservation(tree)
          tree.logs -= amount / 100
          p.cargo = (p.cargo + amount) & 65535
          if (amount && tree.logs < 1) depleteTree(w, tree, w.manaTribes[p.tribe].playerType === 1)
          return
        }
        const capacity = b.preparation
            ? rules.buildingPreparationWork[site.model]
            : rules.buildingLife[site.model],
          work =
            b.preparation?.work ??
            b.damageState?.plan.remaining ??
            Math.round(b.progress * capacity),
          amount = timberTransfer(short(p.cargo), work, capacity, requested),
          wasIncomplete = b.progress < 1
        p.cargo = (p.cargo - amount) & 65535
        if (b.preparation) {
          b.preparation.work = work + amount
          b.logs = (work + amount) / 100
        } else if (b.damageState) {
          const state = b.damageState
          changeBuildingWork(state.plan, amount, state, null, {
            move: () => {},
            release: () => {},
            init: () => {},
          })
          b.progress = Math.max(0, state.plan.remaining) / capacity
          b.logs = Math.max(0, state.plan.remaining) / 100
          b.hp = buildingHp(b.kind) * b.progress
        } else {
          b.progress = (work + amount) / capacity
          b.logs = (work + amount) / 100
        }
        if (wasIncomplete && b.progress === 1) completeBuildingConstruction(w, b)
      },
    })
    b.woodUnavailable = !!(site.flags3 & 0x1000)
    if (finished === 2) u.tree = null
  } else if (task.task === BuilderTask.ClearScenery) {
    const scenery = w.trees.map(tree => ({
      ...nativePosition(w, tree),
      id: tree.id,
      class: tree.logs > 0 ? 5 : 0,
      model: tree.model,
      flags2: 0,
    }))
    const target = (id: number) => scenery.find(tree => tree.id === id)
    const cells = buildingFootprintCells(pose)
    finished = stepBuildingScenery(
      w,
      p,
      task,
      {
        outside: buildingOutsidePoint(pose),
        target,
        scenery: () =>
          cells.flatMap(i =>
            scenery.filter(
              object =>
                object.class && ((object.y & 65535) >> 9) * 128 + ((object.x & 65535) >> 9) === i
            )
          ),
      },
      {
        animation,
        destination,
        releaseMotion,
        sound: cue => sound(w, cue, u),
        transfer: (id, capacity) => {
          const tree = w.trees.find(t => t.id === id)!
          const amount = timberTransfer(
            Math.round(tree.logs * 100),
            short(p.cargo),
            capacity,
            capacity
          )
          if (amount) releaseTimberReservation(tree)
          tree.logs -= amount / 100
          p.cargo = (p.cargo + amount) & 65535
          if (amount && tree.logs < 1) depleteTree(w, tree, w.manaTribes[p.tribe].playerType === 1)
        },
        remove: id => {
          const tree = w.trees.find(t => t.id === id)!
          // State 5 starts a 76-turn fire; timber depletion can remove it sooner.
          tree.burn ??= {
            remaining: 76,
            started: false,
            wood: Math.round(tree.logs * 100),
            scale: debrisModels[tree.model + 12]?.scale ?? 0,
          }
        },
        dropTimber: () => dropCarriedTimber(p, allocateLog, () => sound(w, 11, u)),
      }
    )
  } else if (task.task === BuilderTask.ClearPeople) {
    const people: ClearingPerson[] = w.units
      .filter(u => u.hp > 0 && u.inside === null)
      .map(u => ({
        ...nativePosition(w, u),
        id: u.id,
        class: 1,
        model: nativePersonModel(u),
        tribe: tribeForTeam(u.team),
        state: u.native?.state ?? (u.work === null ? 1 : 10),
        speed: u.native?.speed ?? (u.path.length ? unitSpeed(u) : 0),
        flags2: u.native?.flags2 ?? 0,
        commands: [],
        commandCursor: 0,
        immediateCommand: 0,
      }))
    const cellPeople = (i: number) =>
      people.filter(o => ((o.y & 65535) >> 9) * 128 + ((o.x & 65535) >> 9) === i)
    const orders = { records: [], cursor: 0, active: 0 }
    // Browser commands still own routes; this supplies the existing terrain/cell
    // predicate without pretending browser orders are native command records.
    const resting = { land: w.land, orders, cellObjects: () => [] }
    let displacement: Point | null = null
    finished = stepBuildingPeople(
      w,
      p,
      task,
      {
        tribe: p.tribe,
        orders,
        search: w.indexedSearch,
        flags: w.land.flags,
        occupants: () => buildingFootprintCells(pose).flatMap(cellPeople),
        cellPeople,
        available: i => restingCellAvailable(resting, ((i & 127) << 1) | ((i >> 7) << 9)),
      },
      {
        animation,
        destination,
        releaseMotion,
        // ponytail: browser orders have no native pool limit; connect command ownership.
        allocateOrder: to => {
          displacement = browserPosition(to)
          return 1
        },
        displace: other => {
          const follower = w.units.find(u => u.id === other.id)!
          release(w, follower)
          route(w, follower, displacement!)
        },
      }
    )
  } else if (task.task === BuilderTask.Level && b.preparation) {
    turnPerson(p)
    const result = stepBuildingLevel(
      w,
      p,
      task,
      b.preparation,
      w.land,
      () => buildingGradeVertices(pose),
      {
        animation,
        destination: to => destination(to, true),
        releaseMotion,
        terrainChanged: index => changedBuildingGround(w, index),
        sound: cue => sound(w, cue, u),
      }
    )
    if (result === 2) {
      task.task = BuilderTask.Work
      task.restart = true
    }
  } else {
    const step =
      task.task === BuilderTask.Approach
        ? stepBuildingApproach
        : task.task === BuilderTask.Leave
          ? stepBuildingDeparture
          : stepBuildingWork
    step(
      w,
      p,
      task,
      {
        model: buildingModel(b),
        building: b.preparation ? 0 : b.id,
        occupied: w.land.buildingIds[cell],
        onBuilding: !!(w.land.flags[cell] & 512),
        angle: 0,
        center: buildingInsidePoint(pose),
        outside: buildingOutsidePoint(pose),
      },
      {
        destination,
        animation,
        releaseMotion,
        outsideBuilding: point => {
          const index = (point.y >> 9) * 128 + (point.x >> 9)
          if (!(w.land.flags[index] & 512)) return point
          const building = w.buildings.find(b => b.id === (w.land.buildingIds[index] & 1023))
          if (!building) throw new Error('Missing building at construction resting anchor')
          return buildingOutsidePoint(buildingPose(building))
        },
        allocateLog,
        sound: cue => sound(w, cue, u),
        rest: () =>
          faceTribe(
            {
              instantFacing: false,
              // Shared live selection adapter supplies tribe interest until camera
              // ownership is connected to native tribe records.
              tribes: w.manaTribes.map(() => ({ x: 0, y: 0, angle: 0 })),
            },
            p,
            { releaseMotion }
          ),
      }
    )
  }
  if (finished === 2) {
    task.task = BuilderTask.Work
    task.restart = true
  }
  u.cargo = p.cargo / 100
  u.heading = Math.PI - (p.angle * Math.PI) / 1024
}

// Door arrival for timber delivery and the remaining temple admission adapter.
export function atBuildingEntrance(w: World, p: Point, b: Building) {
  const door = entrance(w, b)
  return Math.abs(p.x - door.x) < 112 / 256 && Math.abs(p.z - door.z) < 112 / 256
}
export function entranceWood(w: World, b: Building) {
  return looseWoodInCell(
    buildingOutsidePoint(buildingPose(b)),
    w.trees.map(t => ({
      ...nativePosition(w, t),
      model: t.model,
      wood: Math.round(t.logs * 100),
    }))
  )
}

function* liveTimberObjects(w: World, cell: number) {
  // ponytail: scan the live tree array; index it by native cell if scenery scale makes this hot.
  for (let i = w.trees.length - 1; i >= 0; i--) {
    const tree = w.trees[i],
      point = nativePosition(w, tree),
      index = ((point.y & 65535) >> 9) * 128 + ((point.x & 65535) >> 9)
    if (index === cell)
      yield {
        id: tree.id,
        class: tree.logs > 0 ? 5 : 0,
        model: tree.model,
        flags4: tree.flags4 ?? 0,
        wood: Math.round(tree.logs * 100),
      }
  }
}

function liveTimberWorld(w: World): TimberSearchWorld {
  return {
    landFlags: w.land.landFlags,
    levelFlags: w.manaWorld.levelFlags,
    playerTribe: w.manaWorld.playerTribe,
    land: w.land,
    objects: cell => liveTimberObjects(w, cell),
    building: id => {
      const b = w.buildings.find(b => b.id === id)
      if (!b) return
      const model = buildingModel(b),
        life = rules.buildingLife[model],
        work = b.damageState?.plan.remaining ?? Math.round(b.progress * life)
      return {
        class: b.preparation ? 9 : 2,
        flags2: b.hp > 0 ? 0 : 1,
        outside: timberCell(buildingOutsidePoint(buildingPose(b))) & 0xfefe,
        needed: Math.max(0, life - work),
      }
    },
  }
}

export function stepLiveTimberSearches(w: World) {
  const world = liveTimberWorld(w),
    collision = collisionWorld(w)
  stepTimberSearches(
    w.timberSearches,
    world,
    w.indexedSearch,
    (search, candidate) => {
      const u = w.units.find(u => u.id === search.person && u.hp > 0),
        p = u?.builder?.person
      if (!u || !p) return { result: 1, cost: candidate.cost }
      for (const { cell } of orderedTimberCells(search.center, candidate.cell)) {
        if (!looseTimberInCell(world, cell, search.tribe)) continue
        const center = {
          x: (((cell & 0xfe) + 1) << 8) & 65535,
          y: ((((cell >>> 8) & 0xfe) + 1) << 8) & 65535,
        }
        if (personStepCollision(collision, p, center)) continue
        const route = probeLivePathCost(w, u, p, search.center, cell)
        if (route.result !== 1) return route
      }
      return { result: 1, cost: candidate.cost }
    },
    id => w.units.some(u => u.id === id && u.hp > 0)
  )
}

export function findBuildingWood(w: World, u: Unit, b: Building) {
  const door = buildingOutsidePoint(buildingPose(b))
  return w.trees
    .filter(t => {
      if (t.logs < 1) return false
      if (b.progress < 1) return true
      const p = nativePosition(w, t)
      return !!(((p.x ^ door.x) | (p.y ^ door.y)) & 0xfe00)
    })
    .sort((a, c) => distance(a, u) - distance(c, u))
    .find(t => findPath(w, u, t).length)
}

export function needsDirectTimber(w: World, u: Unit, b: Building) {
  if (b.team !== u.team || b.hp <= 0 || b.progress >= 1) return false
  const model = buildingModel(b),
    life = rules.buildingLife[model],
    work = b.damageState?.plan.remaining ?? b.preparation?.work ?? Math.round(b.progress * life)
  return life - work - entranceWood(w, b) > 0
}

export function directTimberDestination(w: World, u: Unit) {
  const origin = nativePosition(w, u)
  return w.buildings
    .filter(
      b => needsDirectTimber(w, u, b) && positionDistance(origin, nativePosition(w, b)) < 0x2800
    )
    .sort(
      (a, b) =>
        positionDistance(origin, nativePosition(w, a)) -
        positionDistance(origin, nativePosition(w, b))
    )
    .find(b => findPath(w, u, entrance(w, b)).length)
}

// Hut upgrades retain the existing loose-log delivery adapter.
export function harvestAssignedTree(w: World, u: Unit, destination?: Point, queued = false) {
  if (u.tree === null || u.cargo || u.fight || u.native?.immediateCommand) return false
  const tree = w.trees.find(t => t.id === u.tree)
  if (!tree) {
    u.tree = null
    u.harvest = undefined
    return true
  }
  if (u.path.length) return false
  if (distance(u, tree) >= 1) {
    route(w, u, tree)
    return false
  }
  if (!u.harvest) {
    u.harvest = startTimberHarvest(2, tree.model)
    sound(w, 1, u)
  }
  if (!stepTimberHarvest(u.harvest)) {
    if (tree.model === 11) sound(w, 10, u)
    return false
  }
  const wood = timberTransfer(
    Math.round(tree.logs * 100),
    Math.round(u.cargo * 100),
    rules.personWood[2],
    rules.personWood[2]
  )
  if (wood) releaseTimberReservation(tree)
  tree.logs -= wood / 100
  if (wood && tree.logs < 1)
    depleteTree(w, tree, w.manaTribes[tribeForTeam(u.team)].playerType === 1)
  u.cargo += wood / 100
  if (!destination && u.native) u.native.cargo = Math.round(u.cargo * 100)
  u.harvest = undefined
  if (destination) route(w, u, destination)
  else {
    u.tree = null
    if (queued) return true
    const building = directTimberDestination(w, u)
    if (building && route(w, u, entrance(w, building)).length) {
      u.delivery = { target: building.id }
    }
  }
  return true
}

export function stepQueuedTreeOrder(w: World, u: Unit, order: { a: number; b: number }) {
  if (u.cargo) return 1
  if (u.tree === null) {
    // Native command 7 stores the coarse-cell center, then resolves scenery later.
    const tree = w.trees.findLast(t => {
      const point = nativePosition(w, t)
      return (
        t.logs > 0 &&
        t.model >= 1 &&
        t.model <= 6 &&
        (point.x & 0xff00) + 128 === order.a &&
        (point.y & 0xff00) + 128 === order.b
      )
    })
    if (!tree) return 1
    u.tree = tree.id
  }
  return Number(harvestAssignedTree(w, u, undefined, true))
}

export function haulBuildingWood(w: World, b: Building, workers: Unit[]) {
  for (const u of workers) {
    if (u.cargo && atBuildingEntrance(w, u, b) && !u.path.length) {
      const point = buildingDoor(b)
      w.trees.push({ ...point, id: w.nextId++, model: 11, logs: u.cargo })
      sound(w, 0xb, u)
      u.cargo = 0
      u.tree = null
    }
    harvestAssignedTree(w, u, entrance(w, b))
  }
}
