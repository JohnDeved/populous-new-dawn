// Optional F8-only detail nested within terrainPickMs. Never affects picking.
export const ORDINARY_TERRAIN_FIELDS = [
  'visibilityMs',
  'projectionMs',
  'triangleScanMs',
  'resolutionMs',
  'projectedVertices',
  'visitedTriangles',
] as const

export type OrdinaryTerrainMetrics = { version: 1 } & Record<
  (typeof ORDINARY_TERRAIN_FIELDS)[number],
  number
>

export function createOrdinaryTerrainMetrics(): OrdinaryTerrainMetrics {
  return {
    version: 1,
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
}
