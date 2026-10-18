import {
  createOrdinaryTerrainMetrics,
  resetOrdinaryTerrainMetrics,
  type OrdinaryTerrainMetrics,
} from './ordinary-terrain-metrics.ts'
import {
  createNativeOcclusionMetrics,
  resetNativeOcclusionMetrics,
  type NativeOcclusionMetrics,
} from './native-occlusion-metrics.ts'

// Optional per-callback diagnostics. These fields never feed gameplay state.
export interface PointerFrameMetrics {
  ordinaryTerrain?: OrdinaryTerrainMetrics
  /** Optional versioned native-terrain detail, nested within objectOcclusionMs. */
  nativeOcclusion?: NativeOcclusionMetrics
  /** Default-edge terrain queries made by pointer/tooltip input, excluding native occlusion. */
  terrainPickMs: number
  terrainPickCalls: number
  /** Object/person/overview query time, INCLUDING any native-edge terrain occlusion. */
  objectPickMs: number
  objectPickCalls: number
  /** Nested phases within objectPickMs; models include buildings, scenery and shrines. */
  objectUnitsMs: number
  objectModelsMs: number
  objectOcclusionMs: number
  objectCacheHits: number
  /** Tooltip input publication, INCLUDING nested object/default-edge terrain queries. */
  tooltipInputMs: number
  /** Tooltip DOM/canvas presentation, OUTSIDE the pointer CPU bucket. */
  tooltipRenderMs: number
}

export function createPointerFrameMetrics(includeNative = false): PointerFrameMetrics {
  return {
    ...(includeNative
      ? {
          nativeOcclusion: createNativeOcclusionMetrics(),
          ordinaryTerrain: createOrdinaryTerrainMetrics(true),
        }
      : {}),
    terrainPickMs: 0,
    terrainPickCalls: 0,
    objectPickMs: 0,
    objectPickCalls: 0,
    objectUnitsMs: 0,
    objectModelsMs: 0,
    objectOcclusionMs: 0,
    objectCacheHits: 0,
    tooltipInputMs: 0,
    tooltipRenderMs: 0,
  }
}

export function resetPointerFrameMetrics(metrics: PointerFrameMetrics) {
  if (metrics.nativeOcclusion) resetNativeOcclusionMetrics(metrics.nativeOcclusion)
  if (metrics.ordinaryTerrain) resetOrdinaryTerrainMetrics(metrics.ordinaryTerrain)
  metrics.terrainPickMs = 0
  metrics.terrainPickCalls = 0
  metrics.objectPickMs = 0
  metrics.objectPickCalls = 0
  metrics.tooltipInputMs = 0
  metrics.tooltipRenderMs = 0
  metrics.objectUnitsMs = 0
  metrics.objectModelsMs = 0
  metrics.objectOcclusionMs = 0
  metrics.objectCacheHits = 0
}

const now = () => performance.now()

// Call only on the diagnostic-enabled branch, so disabled frames allocate no closures
// and perform no clock reads. Inclusive durations deliberately remain unsummed.
export function measurePointerQuery<T>(
  metrics: PointerFrameMetrics,
  kind: 'terrain' | 'object',
  query: () => T,
  clock: () => number = now
): T {
  const start = clock()
  try {
    return query()
  } finally {
    const elapsed = clock() - start
    if (kind === 'terrain') {
      metrics.terrainPickMs += elapsed
      metrics.terrainPickCalls++
    } else {
      metrics.objectPickMs += elapsed
      metrics.objectPickCalls++
    }
  }
}
