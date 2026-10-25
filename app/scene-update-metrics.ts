// Three disjoint subsets of otherCallbackCpuMs, not additional callback costs.
// Missing means unavailable. The unmeasured remainder remains unclassified.
export interface SceneUpdateMetrics {
  terrainCpuMs: number
  waterCpuMs: number
  hudCpuMs: number
}
export const SCENE_UPDATE_FIELDS = ['terrainCpuMs', 'waterCpuMs', 'hudCpuMs'] as const
export function validSceneUpdateMetrics(value: unknown): value is SceneUpdateMetrics {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const metrics = value as SceneUpdateMetrics
  return SCENE_UPDATE_FIELDS.every(key => Number.isFinite(metrics[key]) && metrics[key] >= 0)
}
