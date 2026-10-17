// Offline analysis only. Never import this into the frame loop or treat nested timings as additive.
const FRAME_FIELDS = [
  'timestampMs',
  'rafIntervalMs',
  'simulationCpuMs',
  'sceneRenderCpuMs',
  'sceneDrawCalls',
  'callbackCpuMs',
  'pointerTooltipCpuMs',
  'otherCallbackCpuMs',
] as const
const POINTER_FIELDS = [
  'terrainPickMs',
  'terrainPickCalls',
  'objectPickMs',
  'objectPickCalls',
  'objectUnitsMs',
  'objectModelsMs',
  'objectOcclusionMs',
  'objectCacheHits',
  'tooltipInputMs',
  'tooltipRenderMs',
] as const
const CPU_PHASES = [
  'simulationCpuMs',
  'sceneRenderCpuMs',
  'pointerTooltipCpuMs',
  'otherCallbackCpuMs',
] as const
const MAX_JSON_CODE_UNITS = 2 * 1024 * 1024

type RecordValue = Record<string, unknown>
type Frame = Record<(typeof FRAME_FIELDS)[number], number> & {
  pointerBreakdown: Record<(typeof POINTER_FIELDS)[number], number> | null
}

function object(value: unknown, path: string): RecordValue {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`Invalid ${path}: expected an object`)
  return value as RecordValue
}

function finite(value: unknown, path: string, minimum = 0): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum)
    throw new Error(`Invalid ${path}: expected a finite number >= ${minimum}`)
  return value
}

function statistics(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  return {
    sampleCount: sorted.length,
    mean: values.reduce((sum, value) => sum + value / values.length, 0),
    p50: sorted[Math.ceil(sorted.length * 0.5) - 1],
    p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
    max: sorted[sorted.length - 1],
  }
}

/** Parse an exported JSON string and return bounded, local-only timing summaries. */
export function analyzeFrameExport(json: string) {
  if (typeof json !== 'string' || json.length > MAX_JSON_CODE_UNITS)
    throw new Error('Invalid export: expected JSON text no longer than 2097152 UTF-16 code units')
  const report = object(
    JSON.parse(json, (_key, value) => {
      if (typeof value === 'number' && !Number.isFinite(value))
        throw new Error('Invalid export: nonfinite number')
      return value
    }),
    'export'
  )
  if (report.schema !== 'populous-new-dawn/frame-performance' || report.schemaVersion !== 1)
    throw new Error('Unsupported frame export schema or version')
  const units = object(report.units, 'units')
  if (
    units.durations !== 'milliseconds' ||
    units.timestamps !== 'milliseconds since performance.timeOrigin' ||
    units.counters !== 'per frame'
  )
    throw new Error('Unsupported frame export units')
  const timing = object(report.timing, 'timing')
  if (!Array.isArray(report.frames) || !report.frames.length || report.frames.length > 1200)
    throw new Error('Invalid frames: expected 1–1200 samples')
  if (timing.count !== report.frames.length || timing.capacityFrames !== 1200)
    throw new Error('Invalid timing: frame count or capacity mismatch')
  for (const key of ['timeOriginUnixMs', 'startTimestampMs', 'endTimestampMs', 'capturedSpanMs'])
    finite(timing[key], `timing.${key}`, key === 'startTimestampMs' ? -Infinity : 0)
  let buildRevision: string | null = null
  if (report.buildRevision !== undefined) {
    if (
      typeof report.buildRevision !== 'string' ||
      !/^(?:[a-fA-F0-9]{40}(?:-dirty)?|unknown)$/.test(report.buildRevision)
    )
      throw new Error(
        'Invalid buildRevision: expected a full commit hash, optional -dirty suffix, or unknown'
      )
    buildRevision = report.buildRevision
  }
  let level: number | null = null
  if (report.session !== undefined) {
    const session = object(report.session, 'session')
    if (session.level !== undefined && session.level !== null) {
      level = finite(session.level, 'session.level')
      if (!Number.isSafeInteger(level) || level > 255) throw new Error('Invalid session.level')
    }
  }
  let previous = -Infinity
  const frames: Frame[] = report.frames.map((raw, index) => {
    const frame = object(raw, `frames[${index}]`)
    for (const key of FRAME_FIELDS)
      finite(frame[key], `frames[${index}].${key}`, key === 'otherCallbackCpuMs' ? -Infinity : 0)
    if (frame.rafIntervalMs === 0 || (frame.timestampMs as number) <= previous)
      throw new Error('Invalid frames: non-positive RAF interval or non-chronological timestamps')
    const remainder =
      (frame.callbackCpuMs as number) -
      (frame.simulationCpuMs as number) -
      (frame.sceneRenderCpuMs as number) -
      (frame.pointerTooltipCpuMs as number)
    const tolerance =
      1e-6 +
      Number.EPSILON *
        8 *
        Math.max(
          Math.abs(remainder),
          frame.callbackCpuMs as number,
          frame.simulationCpuMs as number,
          frame.sceneRenderCpuMs as number,
          frame.pointerTooltipCpuMs as number
        )
    if (
      !Number.isFinite(remainder) ||
      Math.abs((frame.otherCallbackCpuMs as number) - remainder) > tolerance
    )
      throw new Error('Invalid otherCallbackCpuMs: inconsistent callback remainder')
    if (!Number.isSafeInteger(frame.sceneDrawCalls))
      throw new Error('Invalid sceneDrawCalls: expected an integer')
    previous = frame.timestampMs as number
    if (!['live', 'paused', 'menu', 'unknown'].includes(frame.state as string))
      throw new Error('Invalid frame state')
    if (frame.pointerBreakdown !== null) {
      const pointer = object(frame.pointerBreakdown, `frames[${index}].pointerBreakdown`)
      for (const key of POINTER_FIELDS)
        finite(pointer[key], `frames[${index}].pointerBreakdown.${key}`)
      for (const key of ['terrainPickCalls', 'objectPickCalls', 'objectCacheHits'])
        if (!Number.isSafeInteger(pointer[key]))
          throw new Error(`Invalid ${key}: expected an integer`)
    }
    return frame as Frame
  })
  const startTimestampMs = frames[0].timestampMs - frames[0].rafIntervalMs,
    endTimestampMs = frames[frames.length - 1].timestampMs,
    capturedSpanMs = endTimestampMs - startTimestampMs
  for (const [key, expected] of Object.entries({
    startTimestampMs,
    endTimestampMs,
    capturedSpanMs,
  }))
    if (Math.abs((timing[key] as number) - expected) > 1e-6)
      throw new Error(`Invalid timing.${key}: inconsistent with frames`)
  const topCpuPhases = CPU_PHASES.map(phase => ({
    phase,
    ...statistics(frames.map(frame => frame[phase])),
  })).sort((a, b) => b.mean - a.mean)
  const measured = frames.flatMap(frame => (frame.pointerBreakdown ? [frame.pointerBreakdown] : []))
  const pointerPhases = measured.length
    ? POINTER_FIELDS.filter(key => key.endsWith('Ms'))
        .map(phase => ({
          phase,
          ...statistics(measured.map(pointer => pointer[phase])),
        }))
        .sort((a, b) => b.mean - a.mean)
    : []
  const warnings = [
    'Callback CPU includes its stages. Pointer phases overlap: tooltipInput includes picks; objectPick includes units/models/occlusion. Do not sum nested phases.',
    'Tooltip rendering is outside pointerTooltip CPU. Deferred layout can execute in a later phase than the DOM writes that caused it.',
    'RAF cadence is not presented FPS; CPU wall times are not GPU timings or proof of hardware smoothness.',
  ]
  if (frames.some(frame => frame.otherCallbackCpuMs < 0))
    warnings.push(
      'Negative callback residual detected: timing ownership may be inconsistent; signed values are preserved.'
    )
  if (measured.length < frames.length)
    warnings.push(
      'Some frames lack pointer breakdowns; pointer summaries use only measured frames, not zero-filled samples.'
    )
  return {
    buildRevision,
    level,
    sampleCount: frames.length,
    startTimestampMs,
    endTimestampMs,
    capturedSpanMs,
    units: 'milliseconds',
    raf: statistics(frames.map(frame => frame.rafIntervalMs)),
    callback: statistics(frames.map(frame => frame.callbackCpuMs)),
    topCpuPhases,
    pointerPhases,
    warnings,
  }
}
