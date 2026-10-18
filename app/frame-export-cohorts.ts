// Offline only: never import into the frame loop.
import { analyzeFrameExport } from './frame-export-analysis.ts'
import { ORDINARY_TERRAIN_FIELDS, TERRAIN_VISIBILITY_FIELDS } from './ordinary-terrain-metrics.ts'
import { NATIVE_OCCLUSION_FIELDS } from './native-occlusion-metrics.ts'
import type { PointerInteractionContext } from './pointer-interaction-context.ts'

const FRAME_METRICS = [
  'rafIntervalMs',
  'simulationCpuMs',
  'sceneRenderCpuMs',
  'sceneDrawCalls',
  'callbackCpuMs',
  'pointerTooltipCpuMs',
  'otherCallbackCpuMs',
] as const
const POINTER_METRICS = [
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
const METRICS = [
  ...FRAME_METRICS,
  'simulationSteps',
  'sceneRenderGpu.milliseconds',
  'sceneUpdateCpu.terrainCpuMs',
  'sceneUpdateCpu.waterCpuMs',
  'sceneUpdateCpu.hudCpuMs',
  'otherCallbackUnclassifiedCpuMs',
  'modelCacheBuilds',
  'modelFacesVisited',
  'modelFacesAccepted',
  'modelFacesRejected',
  ...POINTER_METRICS.map(key => `pointerBreakdown.${key}`),
  ...ORDINARY_TERRAIN_FIELDS.map(key => `pointerBreakdown.ordinaryTerrain.${key}`),
  ...TERRAIN_VISIBILITY_FIELDS.map(key => `pointerBreakdown.ordinaryTerrain.visibility.${key}`),
  ...NATIVE_OCCLUSION_FIELDS.map(key => `pointerBreakdown.nativeOcclusion.${key}`),
]
const GROUPS = {
  all: 'All validated frames',
  worldPointerMoving: 'World route and pointerMoved === true',
  worldPointerStationary: 'World route and pointerMoved === false',
  worldPointerUnknown: 'World route and pointerMoved === null',
  cameraChanged: 'viewChanged === true on any route; view inputs include camera and viewport',
  cameraUnknown: 'Missing context or viewChanged === null',
  hud: 'HUD route',
  outside: 'Outside route',
  unknown: 'Missing context, unknown route, or either change field is null',
} as const

type InputFrame = Record<string, unknown> & {
  pointerBreakdown: null | { interaction?: PointerInteractionContext }
}
function distribution(values: number[]) {
  values.sort((a, b) => a - b)
  const rank = (fraction: number) =>
    values.length ? values[Math.ceil(values.length * fraction) - 1] : null
  return {
    sampleCount: values.length,
    p50: rank(0.5),
    p95: rank(0.95),
    p99: rank(0.99),
    max: rank(1),
  }
}
function metric(frame: InputFrame, path: string): number | undefined {
  if (path === 'otherCallbackUnclassifiedCpuMs') {
    const sub = frame.sceneUpdateCpu as
      | { terrainCpuMs: number; waterCpuMs: number; hudCpuMs: number }
      | undefined
    return sub
      ? (frame.otherCallbackCpuMs as number) - sub.terrainCpuMs - sub.waterCpuMs - sub.hudCpuMs
      : undefined
  }
  const modelIndex = [
    'modelCacheBuilds',
    'modelFacesVisited',
    'modelFacesAccepted',
    'modelFacesRejected',
  ].indexOf(path)
  if (modelIndex >= 0) {
    const work = (frame.pointerBreakdown as { modelWork?: number[] } | null)?.modelWork
    return work ? (modelIndex === 3 ? work[1] - work[2] : work[modelIndex]) : undefined
  }
  let value: unknown = frame
  for (const part of path.split('.')) {
    if (!value || typeof value !== 'object') return undefined
    value = (value as Record<string, unknown>)[part]
  }
  return typeof value === 'number' ? value : undefined
}

/** Validate with the production offline parser, then summarize only known scalar fields. */
export function summarizeFrameExportCohorts(json: string) {
  const analysis = analyzeFrameExport(json)
  // Reparse bounded, already validated input rather than change the shared parser/schema API.
  const frames = (JSON.parse(json) as { frames: InputFrame[] }).frames
  const members: Record<keyof typeof GROUPS, InputFrame[]> = {
    all: frames,
    worldPointerMoving: [],
    worldPointerStationary: [],
    worldPointerUnknown: [],
    cameraChanged: [],
    cameraUnknown: [],
    hud: [],
    outside: [],
    unknown: [],
  }
  for (const frame of frames) {
    const context = frame.pointerBreakdown?.interaction
    if (context?.route === 'world') {
      members[
        context.pointerMoved === null
          ? 'worldPointerUnknown'
          : context.pointerMoved
            ? 'worldPointerMoving'
            : 'worldPointerStationary'
      ].push(frame)
    }
    if (context?.viewChanged === true) members.cameraChanged.push(frame)
    if (!context || context.viewChanged === null) members.cameraUnknown.push(frame)
    if (context?.route === 'hud') members.hud.push(frame)
    if (context?.route === 'outside') members.outside.push(frame)
    if (
      !context ||
      context.route === 'unknown' ||
      context.pointerMoved === null ||
      context.viewChanged === null
    )
      members.unknown.push(frame)
  }
  return {
    schema: 'populous-new-dawn/frame-cohorts',
    schemaVersion: 1,
    buildRevision: analysis.buildRevision,
    level: analysis.level,
    sampleCount: frames.length,
    startTimestampMs: analysis.startTimestampMs,
    endTimestampMs: analysis.endTimestampMs,
    groupsOverlap: true,
    quantileMethod: 'nearest-rank',
    warnings: [
      'Groups overlap, including unknown and camera groups; do not sum their sample counts.',
      'Missing context and null change fields are unknown, never inferred stationary. Stored changes compare recorded samples, not input-event counts.',
      'Each metric uses only measured samples; missing optional metrics are not zero-filled. Empty distributions contain null quantiles.',
      'Timings are reported independently: never sum nested CPU phases.',
      'sceneUpdateCpu regions are disjoint subsets of otherCallbackCpuMs. The derived remainder is unclassified, not an inferred phase; negative residuals expose inconsistent timing ownership.',
      'Unmatched captures and cohort differences do not establish causal speedup.',
      ...analysis.warnings,
    ],
    cohorts: Object.entries(GROUPS).map(([name, definition]) => ({
      name,
      definition,
      sampleCount: members[name as keyof typeof GROUPS].length,
      metrics: Object.fromEntries(
        METRICS.map(path => [
          path,
          {
            unit:
              path.endsWith('Ms') || path === 'sceneRenderGpu.milliseconds'
                ? 'milliseconds'
                : 'per frame',
            ...distribution(
              members[name as keyof typeof GROUPS].flatMap(frame => {
                const value = metric(frame, path)
                return value === undefined ? [] : [value]
              })
            ),
          },
        ])
      ),
    })),
  }
}
