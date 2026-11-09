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

// Counts selected instance paths after culling, not query calls or vertex work.
// Absent means unknown (historical exports and callers that did not opt in).
export const ORDINARY_PICK_PATH_FIELDS = ['numeric', 'packedVector', 'sparseVector'] as const
export type OrdinaryPickPaths = { version: 1 } & Record<
  (typeof ORDINARY_PICK_PATH_FIELDS)[number],
  number
>
export function createOrdinaryPickPaths(): OrdinaryPickPaths {
  return { version: 1, numeric: 0, packedVector: 0, sparseVector: 0 }
}

export type OrdinaryTerrainMetrics = {
  version: 1
  visibility?: TerrainVisibilityMetrics
  paths?: OrdinaryPickPaths
} & Record<(typeof ORDINARY_TERRAIN_FIELDS)[number], number>

export function createOrdinaryTerrainMetrics(
  includeVisibility = false,
  includePaths = false
): OrdinaryTerrainMetrics {
  return {
    version: 1,
    ...(includeVisibility ? { visibility: createTerrainVisibilityMetrics() } : {}),
    ...(includePaths ? { paths: createOrdinaryPickPaths() } : {}),
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
  if (metrics.paths) for (const key of ORDINARY_PICK_PATH_FIELDS) metrics.paths[key] = 0
  if (metrics.visibility) for (const key of TERRAIN_VISIBILITY_FIELDS) metrics.visibility[key] = 0
}
