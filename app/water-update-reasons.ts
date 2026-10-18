// Optional F8 render-side call evidence, never gameplay state or predicted savings.
export interface WaterUpdateMetrics {
  reasons: number
}
export const WATER_UPDATE_REASON = {
  sameKey: 1,
  missingWaves: 2,
  unknownPreviousKey: 4,
  turn: 8,
  land: 16,
  light: 32,
  geometry: 64,
} as const
export function validWaterUpdateReasons(value: unknown): value is number {
  return Number.isInteger(value) && typeof value === 'number' && value >= 0 && value <= 127
}
// Invoke only on the enabled branch. The caller passes keys it already read;
// this performs no scene/attribute reads and retains no identifiers or history.
export function recordWaterUpdateKey(metrics: WaterUpdateMetrics, previous: unknown, key: string) {
  if (previous === key) {
    metrics.reasons |= WATER_UPDATE_REASON.sameKey
    return
  }
  const before = typeof previous === 'string' ? previous.split(':') : []
  const after = key.split(':')
  if (before.length !== 4 || after.length !== 4 || before.some(value => value === '')) {
    metrics.reasons |= WATER_UPDATE_REASON.unknownPreviousKey
    return
  }
  for (let i = 0; i < 4; i++) if (before[i] !== after[i]) metrics.reasons |= 8 << i
}
