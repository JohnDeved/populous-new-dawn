import original from './original-angel.json' with { type: 'json' }
import { setAnimationObject, stepObjectAnimation, type AnimatedUnit } from './animation.ts'
import { morphCoordinate } from './morph.ts'
import type { NativeModel } from './model-faces.ts'

export type AngelBase = 62 | 69
export interface AngelPose {
  base: AngelBase
  from: number
  to: number
  frame: number
  duration: number
  scale: number
}
export type AngelPresentation = AnimatedUnit & {
  pendingBase: AngelBase
  stage: number
  sourceKey: number
  destinationKey: number
  holdFrame: number
  scale: number
  displayed: AngelPose
}

export const angelBases: Record<
  AngelBase,
  { model: NativeModel; pointIndices: number[]; morph: number }
> = original.bases
const points: Record<number, number[][]> = original.points
const cycles: Record<
  number,
  {
    base: number
    lastFrame: number
    segments: { from: number; to: number; first: number; last: number; duration: number }[]
  }
> = original.cycles
const animationData = {
  frameCounts: [],
  modelFrames: [],
  morphDurations: [0, 0, 0, 0, cycles[4].lastFrame, cycles[5].lastFrame],
}

export function createAngelPresentation(base: AngelBase = 69): AngelPresentation {
  const [first] = cycles[angelBases[base].morph].segments
  const state: AngelPresentation = {
    object: base,
    draw: 4,
    morph: 0,
    palette: 0,
    renderFlags: 0,
    f1: 0,
    f2: 0,
    stamp: 0,
    flags3: 0x100104,
    morphTimer: 0,
    morphFrames: 0,
    pendingBase: base,
    stage: 0,
    sourceKey: 0,
    destinationKey: 0,
    holdFrame: 0,
    scale: 160,
    // A deterministic first view, not a consumed draw visit. The first latch
    // still owns the source-key write and displays phase zero before advancing.
    displayed: { base, from: first.from, to: first.to, frame: 0, duration: 2, scale: 160 },
  }
  requestAngelBase(state, base, true)
  return state
}

// Source selector 004de440. A current-base request does not cancel a pending
// other base. Restarting a transition retains the held/restart flag bits.
export function requestAngelBase(state: AngelPresentation, base: AngelBase, immediate = false) {
  if (!immediate) {
    if (base !== state.object) state.pendingBase = base
    if (state.pendingBase === state.object) return
    const finished = state.pendingBase === 62 ? state.stage >= 5 : state.stage <= 0
    if (!finished) {
      state.stage += state.pendingBase === 62 ? 1 : -1
      state.sourceKey ||= 69
      state.destinationKey = 76 + Math.trunc(state.stage / 2)
      state.morphTimer = 0
      state.morphFrames = 2
      state.renderFlags |= 0x1000
      return
    }
    base = state.pendingBase
  }
  setAnimationObject(state, 4, base)
  state.morph = angelBases[base].morph
  state.renderFlags |= 0x8080
  if (immediate) {
    state.pendingBase = base
    state.stage = base === 62 ? 3 : 0
  }
}

// The native queued draw samples before counter advancement and mutates the
// ordinary source-key/hold flags. Our presentation owner latches every Angel,
// not only native-visible objects; GPU renders are strictly read-only consumers.
export function latchAngelPose(state: AngelPresentation) {
  const base = state.object as AngelBase
  if (state.renderFlags & 0x1000) {
    state.displayed = {
      base,
      from: state.sourceKey,
      to: state.destinationKey,
      frame: state.renderFlags & 0x400 ? state.morphFrames : state.morphTimer >> 2,
      duration: state.morphFrames,
      scale: state.scale,
    }
    return
  }
  const cycle = cycles[state.morph]
  let phase = ((state.f1 & 65535) >>> 2) % (cycle.lastFrame + 1)
  if (state.renderFlags & 0x800) {
    if (state.holdFrame - phase === 1) state.renderFlags &= ~0x800
  } else if (state.renderFlags & 0x400) phase = state.holdFrame
  const segment = cycle.segments.find(s => s.first <= phase && phase <= s.last)
  if (!segment) throw new RangeError('Invalid Angel morph phase')
  const { from, to, duration } = segment
  state.sourceKey = from
  state.displayed = {
    base,
    from,
    to,
    frame: phase - segment.first,
    duration,
    scale: state.scale,
  }
}

export function advanceAngelPresentation(state: AngelPresentation) {
  latchAngelPose(state)
  stepObjectAnimation(state, { counter: 0, levelFlags: 0, levelFlags2: 0 }, animationData, () => {})
}

// This adapter deliberately retains the browser's existing three-phase
// gameplay. It does not fabricate native approach, speed, pitch or bank inputs.
export function syncAngelPresentation(
  state: AngelPresentation,
  phase: 'seeking' | 'striking' | 'dying',
  timer: number
) {
  requestAngelBase(state, phase === 'striking' ? 62 : 69)
  // Existing death entry displays 16, then countdown visits display 15..1.
  // Keep the expiry boundary unchanged rather than duplicating the entry scale.
  state.scale = phase === 'dying' ? timer * 10 : 160
}

export function angelPosePositions(pose: AngelPose) {
  const base = angelBases[pose.base],
    from = points[pose.from],
    to = points[pose.to],
    positions = new Float32Array(base.pointIndices.length * 3)
  for (let vertex = 0; vertex < base.pointIndices.length; vertex++) {
    const index = base.pointIndices[vertex]
    for (let axis = 0; axis < 3; axis++)
      positions[vertex * 3 + axis] =
        morphCoordinate(from[index][axis], to[index][axis], pose.frame, pose.duration) /
        (base.model.scale * (axis === 2 ? -3 : 3))
  }
  return positions
}

const integer = (n: unknown, min: number, max: number): n is number =>
  typeof n === 'number' && Number.isInteger(n) && min <= n && n <= max
const isAngelBase = (n: unknown): n is AngelBase => n === 62 || n === 69

// Current-format checkpoints must carry the next counters and last displayed
// pose. Reject missing/malformed state; never reconstruct obsolete draw history.
export function validAngelPresentation(value: unknown) {
  if (!value || typeof value !== 'object') return false
  const state = value as Partial<AngelPresentation>,
    pose = state.displayed
  if (!pose || typeof pose !== 'object') return false
  if (!isAngelBase(state.object) || !isAngelBase(state.pendingBase) || !isAngelBase(pose.base))
    return false
  return (
    state.draw === 4 &&
    state.morph === angelBases[state.object].morph &&
    integer(state.palette, 0, 255) &&
    integer(state.renderFlags, 0, 65535) &&
    integer(state.flags3, 0, 0xffffffff) &&
    integer(state.stamp, 0, 0xffffffff) &&
    integer(state.f1, -32768, 32767) &&
    integer(state.f2, 0, 255) &&
    integer(state.morphTimer, -32768, 32767) &&
    (state.morphFrames === 0 || state.morphFrames === 2) &&
    integer(state.stage, 0, 5) &&
    (state.sourceKey === 0 || integer(state.sourceKey, 62, 78)) &&
    (state.destinationKey === 0 || integer(state.destinationKey, 62, 78)) &&
    (!(state.renderFlags & 0x1000) ||
      (state.morphFrames === 2 &&
        integer(state.sourceKey, 62, 78) &&
        integer(state.destinationKey, 62, 78))) &&
    integer(state.holdFrame, 0, 11) &&
    integer(state.scale, 0, 160) &&
    integer(pose.from, 62, 78) &&
    integer(pose.to, 62, 78) &&
    integer(pose.frame, -8192, 8191) &&
    pose.duration === 2 &&
    integer(pose.scale, 0, 160)
  )
}
