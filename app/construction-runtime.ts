import { type World, type Unit, type Building } from './world-types.ts'
import { currentPersonOrder } from './person-orders.ts'
import { release } from './world-tasks.ts'
import rules from './original-rules.json' with { type: 'json' }
import { buildingModel, buildingRepairArea, buildingPose, buildingOutsidePoint } from './building-shapes.ts'
import { isDismantling } from './live-building-entry.ts'
import { pruneBuilders, assignBuilder, BuilderTask, stepConstructionCrew } from './building-workers.ts'
import { queueTerrain, processTerrain } from './native-terrain.ts'
import { terrainTextures } from './world-terrain-runtime.ts'
import { invalidateTimberSearch } from './timber-search.ts'

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
    evacuate: worker => release(w, workers.find(u => u.builder === worker)!),
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
