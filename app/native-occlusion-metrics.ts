// Optional F8-only nested diagnostics. These values never influence picking.
export const NATIVE_OCCLUSION_FIELDS = [
  'submissionKeyMs',
  'pixelCacheHits',
  'pixelCacheMisses',
  'projectionMs',
  'triangleScanMs',
  'cacheCold',
  'cachePositionChanged',
  'cacheKeyChanged',
  'cacheHits',
  'projectedVertices',
  'submittedTriangles',
] as const

export type NativeOcclusionMetrics = { version: 1 } & Record<
  (typeof NATIVE_OCCLUSION_FIELDS)[number],
  number
>

export function createNativeOcclusionMetrics(): NativeOcclusionMetrics {
  return {
    version: 1,
    submissionKeyMs: 0,
    pixelCacheHits: 0,
    pixelCacheMisses: 0,
    projectionMs: 0,
    triangleScanMs: 0,
    cacheCold: 0,
    cachePositionChanged: 0,
    // Existing serialized key changed: view, transform and position version are
    // deliberately not guessed apart. Reasons are exclusive per instance query.
    cacheKeyChanged: 0,
    cacheHits: 0,
    projectedVertices: 0,
    submittedTriangles: 0,
  }
}

export function resetNativeOcclusionMetrics(metrics: NativeOcclusionMetrics) {
  for (const key of NATIVE_OCCLUSION_FIELDS) metrics[key] = 0
}
