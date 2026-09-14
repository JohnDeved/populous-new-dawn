import type { World, Point, NativePoint, Building } from './world-types.ts'
import { GRID } from './world-rules.ts'
import { height, nativeTerrainHeight } from './world-coordinates.ts'
import { short } from './native-math.ts'
import {
  terrainPointHeight,
  createNativeTerrain,
  queueTerrain,
  processTerrain,
  updateWalkMasks,
} from './native-terrain.ts'
import { notifyTerrainObjects } from './terrain-notifications.ts'
import { invalidateTimberRoutes } from './timber-search.ts'
import { buildingWorkStage } from './building-damage.ts'
import {
  buildingModel,
  buildingPose,
  buildingFootprintCells,
  registerBuildingFootprint,
  refreshSceneryShadow,
  nativeCellShade,
  type RegisteredBuilding,
  type SceneryShapePose,
} from './building-shapes.ts'
import rules from './original-rules.json' with { type: 'json' }
import levelOne from './level-one.ts'

export function createMissionLand(level: typeof levelOne) {
  const land = createNativeTerrain(new Int16Array(16384))
  for (const [x, y, h] of level.heights) land.heights[y * 128 + x] = h
  // 0x44e850: complete two-traversal initialization before browser resampling.
  // ponytail: original texture assets still supply rendering; native texture
  // consumers join this queue when palette/texture rebuilding is integrated.
  queueTerrain(land, 0, 64, 1, { surface: () => {}, globe: () => {} })
  updateWalkMasks(land, 0, 64)
  return land
}

export const originalLand = createMissionLand(levelOne)
export const originalTerrain = originalLand.heights

export function makeTerrain(land = originalLand) {
  return Array.from({ length: GRID * GRID }, (_, i) => {
    const x = (i % GRID) - 48,
      z = Math.floor(i / GRID) - 48,
      h = nativeTerrainHeight(land.heights, (x + 8) * 256, (-z - 8) * 256) / 45
    // ponytail: cropped/resampled terrain and artificial seabed remain until the native world grid is ported.
    return h === 0 ? -0.35 : h
  })
}

export function nativePosition(w: World, p: Point): NativePoint {
  syncNativeTerrain(w)
  const position = {
    x: short(Math.round((p.x + 8) * 256)),
    y: short(Math.round((-p.z - 8) * 256)),
  }
  return { ...position, h: terrainPointHeight(w.land, position) }
}
export function refreshTerrainSurface(w: World) {
  // Resample the compatibility grid after native writes; keep collision, picking
  // and the rendered native terrain on the same surface.
  for (let i = 0; i < w.terrain.length; i++) {
    const x = (i % GRID) - 48,
      z = Math.floor(i / GRID) - 48
    const h = terrainPointHeight(w.land, { x: (x + 8) * 256, y: (-z - 8) * 256 }) / 45
    w.terrain[i] = h || -0.35
  }
  w.terrainVersion++
  w.landVersion = w.terrainVersion
}
export const nativeCellIndex = (cell: number) => (cell >>> 9) * 128 + ((cell & 254) >>> 1)
export const terrainTextures = { surface: () => {}, globe: () => {} }

export function buildingStage(b: Building) {
  // The browser stores native plan work as a fraction of the model
  // capacity; complete plan allocation and order dispatch remain separate.
  const life = rules.buildingLife[buildingModel(b)]
  return b.damageState?.stage ?? buildingWorkStage(Math.trunc(b.progress * life), life)
}

function cellShade(w: World, i: number) {
  const b = w.buildings.find(b => b.id === (w.land.buildingIds[i] & 1023))
  const scenery = w.trees
    .filter(
      t =>
        t.logs > 0 &&
        nativeCellIndex(
          ((nativePosition(w, t).x >>> 8) & 254) | (nativePosition(w, t).y & 0xfe00)
        ) === i
    )
    .map(t => ({ class: 5, model: t.model }))
  return nativeCellShade(
    w.land.flags[i],
    b
      ? {
          class: 2,
          model: buildingModel(b),
          state: b.progress === 1 ? 2 : 1,
          flags2: b.hp > 0 ? 0 : 1,
          stage: buildingStage(b),
        }
      : undefined,
    scenery
  )
}

// Live object adapter: native masks/shade, browser-owned building and tree lifetimes.
// Full plan/scenery class registration and native texture scheduling remain open.
export function syncLandscapeObjects(w: World) {
  const current = new Map(
    w.buildings
      .filter(b => b.hp > 0)
      .map(b => [
        b.id,
        { ...buildingPose(b), id: b.id, tribe: b.team === 'blue' ? 0 : 1, plan: !!b.preparation },
      ])
  )
  const shade = (i: number) => cellShade(w, i)
  const update = (b: RegisteredBuilding & { plan: boolean }, mode: number) => {
    if (!b.plan) return registerBuildingFootprint(w.land, b, mode, shade, () => {})
    // 0x4b9190 modes 2/3/4: reserve cells without marking an actual building.
    for (const i of buildingFootprintCells(b)) {
      if (mode === 1) {
        w.land.flags[i] |= 0x410
        w.land.buildingIds[i] = (w.land.buildingIds[i] & 0xfc00) | (b.id & 1023)
        w.land.owners[i] = (w.land.owners[i] & 0xf0) | (b.tribe + 1)
      } else {
        w.land.flags[i] = (w.land.flags[i] & ~0x4400) | 16
        w.land.buildingIds[i] &= 0xfc00
        w.land.owners[i] &= 0xf0
      }
    }
  }
  for (const [id, old] of w.buildingFootprints) {
    const next = current.get(id)
    if (
      !next ||
      Object.keys(old).some(
        k => old[k as keyof RegisteredBuilding] !== next[k as keyof RegisteredBuilding]
      )
    ) {
      update(old, 0)
      update(old, 4)
      w.buildingFootprints.delete(id)
    }
  }
  for (const [id, b] of current)
    if (!w.buildingFootprints.has(id)) {
      update(b, 1)
      w.buildingFootprints.set(id, b)
    }
  const scenery = new Map<number, SceneryShapePose>()
  for (const tree of w.trees) {
    if (tree.logs <= 0 || !(rules.sceneryFlags[tree.model] & 1)) continue
    const p = nativePosition(w, tree)
    scenery.set(tree.id, {
      object: rules.sceneryObjects[tree.model],
      anchorX: p.x & 0xfe00,
      anchorY: p.y & 0xfe00,
    })
  }
  const refresh = (p: SceneryShapePose) => refreshSceneryShadow(w.land, p, shade, () => {})
  for (const [id, old] of w.sceneryShadows) {
    const next = scenery.get(id)
    if (
      !next ||
      old.object !== next.object ||
      old.anchorX !== next.anchorX ||
      old.anchorY !== next.anchorY
    ) {
      refresh(old)
      w.sceneryShadows.delete(id)
    }
  }
  for (const [id, p] of scenery)
    if (!w.sceneryShadows.has(id)) {
      refresh(p)
      w.sceneryShadows.set(id, p)
    }
}
// ponytail: construction/deformation still write the cropped browser grid.
// Feed its native vertices through the recovered queue until those producers
// write the full native map directly; interpolated browser vertices are ignored.
export function notifyHeightChanges(w: World, changes: Iterable<{ cell: number; radius: number }>) {
  // Notifications only mark dirty state; positions stay fixed throughout this batch.
  // Index once per terrain edit, including edits that change thousands of cells.
  const objects = new Map<number, number[]>()
  const add = (o: Point & { id: number }) => {
    const p = nativePosition(w, o),
      i = ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9)
    const row = objects.get(i) ?? []
    row.push(o.id)
    objects.set(i, row)
  }
  w.units.filter(u => u.hp > 0 && u.inside === null).forEach(add)
  w.trees.filter(t => t.logs > 0).forEach(add)
  w.effects.forEach(add)
  for (const { cell, radius } of changes) {
    notifyTerrainObjects(
      w.land,
      cell,
      radius,
      i => objects.get(i) ?? [],
      id => {
        const b = w.buildings.find(b => (b.id & 1023) === id)
        if (b?.preparation) b.preparation.revalidate = true
        else if (b && b.hp > 0) {
          b.terrainState ??= { flooded: 0, delay: 0, reason: 0, dirty: true }
          b.terrainState.dirty = true
        }
        if (b?.damageState) b.damageState.flags2 |= 4
        const u = w.units.find(u => u.id === id)
        if (u?.native) u.native.flags2 |= 4
        if (u?.builder?.person) u.builder.person.flags2 |= 4
        const fx = w.effects.find(fx => fx.id === id)
        if (fx?.fire) fx.fire.groundDirty = true
        if (fx?.smoke) fx.smoke.flags2 |= 4
        // Rendered tree heights already follow landVersion. Active person-route
        // invalidation remains with the native command/movement integration.
      }
    )
    invalidateTimberRoutes(w.timberSearches, cell, radius)
  }
}
export function syncNativeTerrain(w: World) {
  if (w.landVersion === w.terrainVersion) return
  const changed: number[] = []
  for (let z = -48; z <= 48; z += 2)
    for (let x = -48; x <= 48; x += 2) {
      const cell = ((((x + 8) * 256) >>> 8) & 254) | (((-z - 8) * 256) & 0xfe00),
        i = nativeCellIndex(cell),
        h = short(Math.max(0, Math.round(height(w.terrain, x, z) * 45)))
      if (w.land.heights[i] !== h) {
        w.land.heights[i] = h
        changed.push(cell)
      }
    }
  for (const cell of changed) queueTerrain(w.land, cell, 1, 0, terrainTextures)
  processTerrain(w.land, terrainTextures)
  // Height notifications may query positions; all native heights are current now.
  w.landVersion = w.terrainVersion
  for (const cell of changed) updateWalkMasks(w.land, cell, 1)
  if (changed.length)
    notifyHeightChanges(
      w,
      changed.map(cell => ({ cell, radius: 1 }))
    )
}
