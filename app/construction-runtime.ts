import {
  tribeForTeam,
  type World,
  type Unit,
  type Building,
  type BuildingKind,
  type Point,
  type Team,
  type NativePoint,
} from './world-types.ts'
import { currentPersonOrder } from './person-orders.ts'
import { release } from './world-tasks.ts'
import rules from './original-rules.json' with { type: 'json' }
import {
  buildingModel,
  buildingRepairArea,
  buildingPose,
  buildingOutsidePoint,
  buildingFootprintCells,
  buildingFootprintTiles,
  buildingShapeCells,
  buildingPosition,
  buildingGradeVertices,
  buildingPlanHeight,
  levelBuildingGround,
  chooseBuildingObject,
  type BuildingShapePose,
} from './building-shapes.ts'
import { isDismantling } from './live-building-entry.ts'
import { initializeLivePanic } from './live-people.ts'
import {
  pruneBuilders,
  assignBuilder,
  BuilderTask,
  stepConstructionCrew,
  stepUnbuiltPlan,
} from './building-workers.ts'
import {
  queueTerrain,
  processTerrain,
  updateWalkMasks,
  terrainPointHeight,
} from './native-terrain.ts'
import {
  terrainTextures,
  nativePosition,
  syncNativeTerrain,
  syncLandscapeObjects,
  refreshTerrainSurface,
} from './world-terrain-runtime.ts'
import { invalidateTimberSearch } from './timber-search.ts'
import { invalidateTimberRoutes } from './timber-search.ts'
import { buildingCellValid } from './building-validity.ts'
import { reincarnationStones } from './reincarnation.ts'
import { campaignPosition, campaignShamanTeams } from './campaign-runtime.ts'
import { browserPosition, distance, wrappedDistance } from './world-coordinates.ts'
import { BUILDINGS, buildingHp } from './world-rules.ts'
import { breedingWork } from './world-state.ts'
import { short } from './native-math.ts'

export const footprint = (kind: BuildingKind) => (kind === 'temple' ? 3.9 : 3)
export function footprintPoints(kind: BuildingKind, p: Point) {
  const r = footprint(kind),
    points: Point[] = []
  for (let z = Math.floor(p.z - r); z <= Math.ceil(p.z + r); z++)
    for (let x = Math.floor(p.x - r); x <= Math.ceil(p.x + r); x++) points.push({ x, z })
  return points
}
export function checkBuildingSite(
  w: World,
  pose: BuildingShapePose,
  model: number,
  team: Team,
  plan = 0
) {
  syncNativeTerrain(w)
  syncLandscapeObjects(w)
  const tribe = {
    tribe: tribeForTeam(team),
    playerType: w.manaTribes[tribeForTeam(team)].playerType,
    flags: 0,
  }
  // ponytail: build a read-only cell view until all scenery and shrine classes
  // share the world's native object index.
  const land = { ...w.land, flags: w.land.flags.slice(), buildingIds: w.land.buildingIds.slice() }
  const buildings = new Map(
    w.buildings
      .filter(b => b.hp > 0)
      .map(b => [b.id & 1023, { model: buildingModel(b), tribe: tribeForTeam(b.team) }])
  )
  const scenery = new Map<number, { class: number; model: number }[]>()
  const add = (p: NativePoint, model: number) => {
    const i = ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9)
    const row = scenery.get(i) ?? []
    row.push({ class: 5, model })
    scenery.set(i, row)
    land.flags[i] |= 2
  }
  for (const tree of w.trees) if (tree.logs > 0) add(nativePosition(w, tree), tree.model)
  for (const shrine of w.shrines) {
    if (shrine.kind !== 'vault') {
      add(nativePosition(w, shrine), 9)
      continue
    }
    const p = nativePosition(w, shrine),
      id = shrine.id & 1023
    buildings.set(id, { model: 18, tribe: 255 })
    for (const i of buildingFootprintCells({
      object: rules.buildingObjects[18],
      angle: Math.round((shrine.angle * 1024) / Math.PI) & 2047,
      anchorX: p.x & 0xfe00,
      anchorY: p.y & 0xfe00,
    })) {
      land.flags[i] |= 512
      land.buildingIds[i] = (land.buildingIds[i] & 0xfc00) | id
    }
  }
  for (const team of campaignShamanTeams(w)) {
    const center = campaignPosition(w, team)
    for (const stone of reincarnationStones(land, nativePosition(w, center))) add(stone, 12)
  }
  const world = {
    land,
    // ponytail: the live first mission has no fog ownership; connect these
    // original visibility gates when level loading owns the native fog flags.
    landFlags: 0,
    levelFlags: 0,
    building: (id: number) => {
      const b = buildings.get(id)
      if (!b) throw new Error(`Missing placement object ${id}`)
      return b
    },
    scenery: (i: number) => scenery.get(i) ?? [],
  }
  const valid = buildingFootprintTiles(pose).every(({ index, mask }) =>
    buildingCellValid(
      world,
      tribe,
      ((index & 127) << 1) | ((index >> 7) << 9),
      mask,
      model,
      plan,
      tribe.playerType === 1
    )
  )
  return { valid, flags: tribe.flags }
}
export function buildingPlanPose(w: World, kind: BuildingKind, p: Point) {
  return {
    object: rules.buildingObjects[buildingModel({ kind, level: 1 })],
    angle: w.buildingDirections[kind] * 512,
    anchorX: Math.round((p.x + 8) * 256) & 0xfe00,
    anchorY: Math.round((-p.z - 8) * 256) & 0xfe00,
  }
}
export function placementError(w: World, kind: BuildingKind, p: Point) {
  const plan = buildingPlanPose(w, kind, p)
  const result = checkBuildingSite(w, plan, buildingModel({ kind, level: 1 }), 'blue')
  if (!result.valid) {
    if (result.flags & 0x800000) return 'Leave room around the other buildings and their entrances.'
    if (result.flags & 0x10000000) return 'This slope is too steep. Choose a level building site.'
    if (result.flags & 0x20000000) return 'Leave the worship site clear.'
    return 'The whole building needs dry land, including its fence and doorway.'
  }
  if (kind === 'boatHouse') {
    const launch = buildingShapeCells(plan).find(cell => cell.mask & 16)
    if (
      !launch ||
      !(rules.terrainCategoryFlags[w.land.categories[launch.index] & 15] & 60) ||
      w.land.flags[launch.index] & 4
    )
      return 'The Boat House dock must face navigable water.'
  }
  p = browserPosition({ x: plan.anchorX, y: plan.anchorY })
  // ponytail: placement reach still uses settlement proximity until the full
  // preview controller's territory and capacity queries are connected.
  if (
    !w.buildings.some(b => b.team === 'blue' && distance(b, p) < 16) &&
    wrappedDistance(campaignPosition(w, 'blue'), p) > (kind === 'boatHouse' ? 32 : 16)
  )
    return 'Build next to your settlement or reincarnation site.'
  return null
}
export function groundBuilding(w: World, b: Building, prepare = b.progress < 1) {
  syncNativeTerrain(w)
  const pose = buildingPose(b),
    model = buildingModel(b)
  if (prepare) {
    const target = buildingPlanHeight(w.land, pose, model, 0, 0)
    // Direct building insertion prepares immediately; player plans are graded
    // by their workers and pass false during delayed allocation.
    for (const c of buildingGradeVertices(pose)) w.land.heights[c.index] = target
  }
  levelBuildingGround(w.land.heights, pose, model, (cell, radius) => {
    queueTerrain(w.land, cell, radius, 1, terrainTextures)
    processTerrain(w.land, terrainTextures)
    updateWalkMasks(w.land, cell, radius + 1)
    invalidateTimberRoutes(w.timberSearches, cell, radius)
  })
  if (model === 13 || model === 14)
    for (const cell of buildingShapeCells(pose))
      if (cell.mask & 16) w.land.flags[cell.index] &= ~0x1000000
  b.foundation = terrainPointHeight(w.land, buildingPosition(pose)) / 45
  refreshTerrainSurface(w)
}
export const buildingContainsPoint = (b: Building, p: Point) =>
  b.progress === 1 && distance(b, p) < 2.35
export const buildingBlocksStep = (b: Building, start: Point, next: Point) =>
  buildingContainsPoint(b, next) && !buildingContainsPoint(b, start)
function buildingId(w: World) {
  if (w.nextId < 1024) return w.nextId++
  // Terrain packs a ten-bit building handle beside lighting. Browser effects
  // have unbounded IDs, so they must not push new buildings out of that range.
  // Full native allocation/list ownership remains separate from this adapter.
  const used = new Set(
    [w.units, w.buildings, w.trees, w.shrines, w.effects, w.fights, w.projectiles].flatMap(
      objects => objects.map(o => o.id)
    )
  )
  for (let id = 1023; id > 0; id--) if (!used.has(id)) return id
  throw new Error('No free terrain building handles')
}
export function addBuilding(
  w: World,
  team: Team,
  kind: BuildingKind,
  p: Point,
  complete = true,
  { angle = 0, level: buildingLevel = 1, plan = false } = {}
) {
  const b: Building = {
    x: p.x,
    z: p.z,
    id: buildingId(w),
    anchor: { x: Math.round((p.x + 8) * 256) & 0xfe00, y: Math.round((-p.z - 8) * 256) & 0xfe00 },
    team,
    kind,
    object: plan
      ? rules.buildingObjects[buildingModel({ kind, level: buildingLevel })]
      : chooseBuildingObject(buildingModel({ kind, level: buildingLevel }), tribeForTeam(team), w),
    hp: buildingHp(kind),
    progress: complete ? 1 : 0,
    timer: 0,
    foundation: 0,
    level: buildingLevel,
    logs: complete ? (BUILDINGS.find(b => b.id === kind)?.cost ?? 0) : 0,
    upgrade: 0,
    upgrading: false,
    angle,
    counter: 0,
    damageState: null,
  }
  Object.assign(b, browserPosition(buildingPosition(buildingPose(b))))
  if (plan) {
    syncNativeTerrain(w)
    b.preparation = {
      model: buildingModel(b),
      counter: 0,
      dirty: true,
      revalidate: false,
      timeout: 0,
      height: buildingPlanHeight(w.land, buildingPose(b), buildingModel(b), 0, 0),
      alternateHeight: 0,
      work: 0,
    }
    b.foundation = terrainPointHeight(w.land, buildingPosition(buildingPose(b))) / 45
  } else groundBuilding(w, b)
  w.buildings.push(b)
  if (complete && kind === 'hut') b.timer = short(breedingWork(w, b) - 54)
  return b
}

// 0x4aab80 command 0x7b: each building icon retains its quarter-turn direction.
export function rotateBuildingPlan(w: World) {
  if (
    !w.mode ||
    !Object.hasOwn(w.buildingDirections, w.mode) ||
    w.inputMask ||
    w.status !== 'playing'
  )
    return false
  const kind = w.mode as BuildingKind
  w.buildingDirections[kind] = (w.buildingDirections[kind] + 1) & 3
  return true
}

export function finishQueuedConstruction(w: World, u: Unit) {
  const p = u.builder?.person ?? u.native,
    order = p && currentPersonOrder(w.buildingOrders, p)
  if (!p || order?.model !== 6) return false
  order.flags |= 1
  const building = w.buildings.find(b => b.id === u.work),
    slot = building?.builders?.indexOf(u.id) ?? -1
  if (building?.builders && slot >= 0) building.builders[slot] = 0
  u.native = p
  release(w, u, true)
  return true
}

// Native plan decisions run before their registered workers. Resource/object
// ownership and ordinary movement still use the live world adapters.
export function prepareBuildingSite(w: World, b: Building, workers: Unit[]) {
  const plan = b.preparation!,
    pose = buildingPose(b),
    cells = new Set(buildingFootprintCells(pose)),
    cell = (p: Point) => {
      const n = nativePosition(w, p)
      return ((n.y & 65535) >> 9) * 128 + ((n.x & 65535) >> 9)
    },
    onSite = (p: Point) => cells.has(cell(p)),
    crew = workers.map(
      u => (u.builder ??= { task: BuilderTask.Approach, busy: 0, phase: 0, restart: true })
    )
  plan.counter = b.counter
  const action = stepUnbuiltPlan(
    plan,
    crew,
    () => checkBuildingSite(w, pose, plan.model, b.team, b.id).valid,
    () => {
      const people = w.units.filter(u => u.hp > 0 && u.inside === null && onSite(u)),
        scenery = w.trees.filter(t => t.logs > 0 && onSite(t))
      return {
        timber: plan.work < rules.buildingPreparationWork[plan.model],
        grade: buildingGradeVertices(pose).some(
          v => Math.abs(w.land.heights[v.index] - plan.height) > 1
        ),
        scenery: scenery.length,
        friendly: people.filter(u => u.team === b.team && u.work !== b.id).length,
        enemies: people.filter(u => u.team !== b.team).length,
        vehicles: 0,
        crew: people.filter(u => u.team === b.team && u.work === b.id).length,
        wooden: scenery.some(t => !!(rules.sceneryResourceFlags[t.model] & 16)),
      }
    }
  )
  if (action === 'remove') {
    workers.forEach(u => {
      if (!finishQueuedConstruction(w, u)) release(w, u)
    })
    invalidateBuildingTimberSearch(w, b)
    w.buildings = w.buildings.filter(other => other !== b)
    return
  }
  if (action === 'allocate') {
    b.object = chooseBuildingObject(plan.model, tribeForTeam(b.team), w)
    b.progress = plan.work / rules.buildingLife[plan.model]
    b.preparation = undefined
    Object.assign(b, browserPosition(buildingPosition(buildingPose(b))))
    // Workers already graded the site. Allocation performs only the original
    // model foundation pass, without the legacy immediate-plan preparation.
    groundBuilding(w, b, false)
    for (const u of workers) if (u.builder?.person) u.builder.person.assignment |= 16
    return
  }
  for (const u of workers) {
    const task = u.builder!
    if (task.task === 5 || task.task === 6) {
      // 0x495520 returns task 2 immediately for these two preparation requests.
      task.task = BuilderTask.Work
      task.restart = true
    }
  }
}

// Native slots retain registration order. Browser work orders supply eligibility
// until the complete native person/plan command ownership is connected.
export function constructionWorkers(w: World, b: Building) {
  const slots = (b.builders ??= Array<number>(rules.buildingMaxWorkers[buildingModel(b)]).fill(0))
  const workers = new Map(
    w.units
      .filter(
        u =>
          u.work === b.id &&
          u.hp > 0 &&
          u.team === b.team &&
          u.kind === 'brave' &&
          !((b.admission?.activity ?? 0) & 0x8000) &&
          !isDismantling(w, u) &&
          (b.progress < 1 || u.builder)
      )
      .map(u => [u.id, u])
  )
  pruneBuilders(slots, id => workers.has(id))
  for (const u of workers.values()) if (!assignBuilder(slots, u.id)) release(w, u)
  return slots.filter(Boolean).map(id => workers.get(id)!)
}

export function dispatchConstructionCrew(w: World, b: Building, workers: Unit[]) {
  const state = b.damageState?.plan,
    plan = {
      model: buildingModel(b),
      counter: b.counter,
      burning: !!b.burn,
      work: state?.remaining ?? Math.round(b.progress * rules.buildingLife[buildingModel(b)]),
      repairDelay: state?.repairDelay ?? 0,
    }
  const crew = workers.map(u => {
    // Existing hauling orders may attach directly; player commands explicitly
    // begin task 1 and retain their carried timber until its arrival/drop consumer.
    u.builder ??= {
      task: u.cargo || u.tree !== null ? BuilderTask.Fetch : BuilderTask.Approach,
      busy: 0,
      phase: 0,
      restart: true,
    }
    if (u.builder.task === BuilderTask.Work && (u.cargo || u.tree !== null))
      u.builder.task = BuilderTask.Fetch
    return u.builder
  })
  const finished = stepConstructionCrew(plan, crew, {
    evacuate: worker => {
      const u = workers.find(u => u.builder === worker)!,
        p = u.builder?.person ?? u.native,
        cell = p && ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9),
        onBuilding = cell != null && !!(w.land.buildingIds[cell] & 1023)
      release(w, u)
      if (p && onBuilding) initializeLivePanic(w, u, p)
    },
    resume: () => {
      const area = buildingRepairArea(buildingPose(b)),
        cells = new Set(area.cells)
      for (const fx of w.effects) {
        const smoke = fx.smoke
        if (
          smoke &&
          smoke.lifetime > 0 &&
          cells.has(((smoke.y & 65535) >> 9) * 128 + ((smoke.x & 65535) >> 9))
        )
          smoke.lifetime = 16
      }
      queueTerrain(w.land, area.center, area.radius, 1, terrainTextures)
      processTerrain(w.land, terrainTextures)
    },
  })
  if (state) state.repairDelay = plan.repairDelay
  if (finished) {
    workers.forEach(u => {
      if (!finishQueuedConstruction(w, u)) release(w, u)
    })
    b.builders!.fill(0)
  }
}

export const timberCell = (p: { x: number; y: number }) => ((p.x >>> 8) & 255) | (p.y & 0xff00)

export function invalidateBuildingTimberSearch(w: World, b: Building) {
  if (b.timberSearch == null || b.timberSearch < 0) return
  const owner = { searchIndex: b.timberSearch }
  invalidateTimberSearch(w.timberSearches, owner, timberCell(buildingOutsidePoint(buildingPose(b))))
  b.timberSearch = owner.searchIndex
}
