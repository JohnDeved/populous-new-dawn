// Separate from CPU ownership and RAF/presented cadence.
export const GPU_RENDER_STATUSES = [
  'pending',
  'available',
  'unsupported',
  'disjoint',
  'context-lost',
  'busy',
  'failed',
] as const
export interface GpuFrameTiming {
  status: (typeof GPU_RENDER_STATUSES)[number]
  milliseconds?: number
}
export interface GpuFrameToken {
  generation: number
  serial: number
}
export interface GpuFrameSample {
  token: GpuFrameToken
  timing: GpuFrameTiming
}
export function validGpuFrameTiming(value: unknown): value is GpuFrameTiming {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const v = value as GpuFrameTiming
  return (
    GPU_RENDER_STATUSES.includes(v.status) &&
    (v.status === 'available'
      ? typeof v.milliseconds === 'number' &&
        Number.isFinite(v.milliseconds) &&
        v.milliseconds >= 0 &&
        v.milliseconds <= Number.MAX_SAFE_INTEGER / 1e6
      : v.milliseconds === undefined)
  )
}
