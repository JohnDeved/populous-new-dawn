// Optional F8-only detail nested within terrainPickMs. Never affects picking.
export const ORDINARY_TERRAIN_FIELDS = [
  'visibilityMs',
  'projectionMs',
  'triangleScanMs',
  'resolutionMs',
  'projectedVertices',
  'visitedTriangles',
] as const

// Pointer-side only. Renderer preparation is not observed by these counters.
export const TERRAIN_VISIBILITY_FIELDS = [
  'indexEntriesWritten',
  'indexReuseCalls',
  'selectionRebuilds',
] as const
export type TerrainVisibilityMetrics = Record<(typeof TERRAIN_VISIBILITY_FIELDS)[number], number>
export function createTerrainVisibilityMetrics(): TerrainVisibilityMetrics {
  return { indexEntriesWritten: 0, indexReuseCalls: 0, selectionRebuilds: 0 }
}

export type OrdinaryTerrainMetrics = { version: 1; visibility?: TerrainVisibilityMetrics } & Record<
  (typeof ORDINARY_TERRAIN_FIELDS)[number],
  number
>

export function createOrdinaryTerrainMetrics(includeVisibility = false): OrdinaryTerrainMetrics {
  return {
    version: 1,
    ...(includeVisibility ? { visibility: createTerrainVisibilityMetrics() } : {}),
    visibilityMs: 0,
    projectionMs: 0,
    triangleScanMs: 0,
    resolutionMs: 0,
    projectedVertices: 0,
    visitedTriangles: 0,
  }
}

export function resetOrdinaryTerrainMetrics(metrics: OrdinaryTerrainMetrics) {
  for (const key of ORDINARY_TERRAIN_FIELDS) metrics[key] = 0
  if (metrics.visibility) for (const key of TERRAIN_VISIBILITY_FIELDS) metrics.visibility[key] = 0
}
