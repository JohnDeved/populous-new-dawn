import type { World, Point, NativePoint } from './world-types.ts'
import { GRID } from './world-rules.ts'
import { height } from './world-coordinates.ts'
import { short } from './native-math.ts'
import { terrainPointHeight, queueTerrain, processTerrain, updateWalkMasks } from './native-terrain.ts'
import { notifyTerrainObjects } from './terrain-notifications.ts'
import { invalidateTimberRoutes } from './timber-search.ts'

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
