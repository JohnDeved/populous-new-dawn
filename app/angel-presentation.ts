import { setAnimationObject, stepObjectAnimation, type AnimatedUnit } from './animation.ts'
import { morphCoordinate } from './morph.ts'
import data from './original-angel-presentation.json' with { type: 'json' }
import strike from './original-angel-strike.json' with { type: 'json' }
import type { AngelState, World } from './world-types.ts'

// Raw controller state 6/substate 2 is the proved 28-tick striking phase.
// Seeking still uses the initial model adapter: no guessed native pursuit mode.
export interface AngelDisplayPose {
  object: 62 | 69
  from: number
  to: number
  numerator: number
  denominator: number
}
export const INITIAL_ANGEL_POSE: AngelDisplayPose = {
  object: 69,
  from: 70,
  to: 71,
  numerator: 0,
  denominator: 2,
}
export type AngelPresentation = AnimatedUnit & {
  displayedFrame: number
  displayedPose: AngelDisplayPose
  pendingObject: 62 | 69
  transitionCounter: number
  sourceKey: number
  targetKey: number
}

function asset(object: number) {
  if (object === 69) return data
  if (object === 62) return strike
  throw new RangeError(`Unsupported Angel object: ${object}`)
}

export function createAngelPresentation(): AngelPresentation {
  const state: AngelPresentation = {
    object: 69,
    draw: 4,
    morph: 5,
    palette: 0,
    renderFlags: 0,
    f1: 0,
    f2: 0,
    stamp: 0,
    flags3: 0x100100,
    morphTimer: 0,
    morphFrames: 0,
    displayedFrame: 0,
    displayedPose: { ...INITIAL_ANGEL_POSE },
    pendingObject: 69,
    transitionCounter: 0,
    sourceKey: 0,
    targetKey: 0,
  }
  setAnimationObject(state, 4, 69)
  state.morph = data.morphIndex
  state.renderFlags |= 0x8080
  return state
}

const animationData = {
  frameCounts: [],
  modelFrames: [],
  morphDurations: [0, 0, 0, 0, strike.frames - 1, data.frames - 1],
}

// 004de440 non-initial request. Matching the current object deliberately does
// not cancel an already-pending opposite object. Request visits are logical
// controller visits, not GPU frames or the 24 Hz presentation visitor.
export function requestAngelModel(state: AngelPresentation, requested: 62 | 69) {
  asset(requested)
  if (requested !== state.object) state.pendingObject = requested
  if (state.pendingObject === state.object) return
  const target = state.pendingObject,
    complete = target === 62 ? state.transitionCounter >= 5 : state.transitionCounter <= 0
  if (complete) {
    setAnimationObject(state, 4, target)
    state.morph = asset(target).morphIndex
    state.renderFlags |= 0x8080
    return
  }
  state.transitionCounter += target === 62 ? 1 : -1
  state.sourceKey ||= 69
  state.targetKey = 76 + Math.trunc(state.transitionCounter / 2)
  state.morphTimer = 0
  state.morphFrames = 2
  // set_unit_anim preserves other render bits, including completed-override bit.
  state.renderFlags |= 0x1000
}

export function requestAngelStrikePresentation(angel: AngelState) {
  angel.presentation ??= createAngelPresentation()
  requestAngelModel(angel.presentation, angel.phase === 'striking' ? 62 : 69)
}

export function stepAngelPresentation(state: AngelPresentation) {
  // Native display precedes the shared animation visitor. The renderer only
  // reads this serialized object/pose latch; it never advances native state.
  const source = asset(state.object),
    object = source.base as 62 | 69
  state.displayedFrame = ((state.f1 & 65535) >>> 2) % source.frames
  if (state.renderFlags & 0x1000) {
    state.displayedPose = {
      object,
      from: state.sourceKey,
      to: state.targetKey,
      numerator: state.renderFlags & 0x400 ? state.morphFrames : state.morphTimer >> 2,
      denominator: state.morphFrames,
    }
  } else {
    const segment = source.segments.find(
      s => state.displayedFrame >= s.first && state.displayedFrame <= s.last
    )!
    state.sourceKey = segment.from
    state.displayedPose = {
      object,
      from: segment.from,
      to: segment.to,
      numerator: state.displayedFrame - segment.first,
      denominator: segment.duration,
    }
  }
  stepObjectAnimation(state, { counter: 0, levelFlags: 0, levelFlags2: 0 }, animationData, () => {})
}

export function animateAngelPresentations(world: Pick<World, 'paused' | 'land' | 'effects'>) {
  if (world.paused || world.land.landFlags & 2) return
  for (const effect of world.effects) {
    if (!effect.angel) continue
    effect.angel.presentation ??= createAngelPresentation()
    stepAngelPresentation(effect.angel.presentation)
  }
}

const keys: Record<string, number[]> = { ...data.keypoints, ...strike.keypoints }

// Current-format validation only: do not silently upgrade an old initial-only
// latch into a different in-flight transition when loading a saved game.
export function validAngelPresentation(value: unknown): value is AngelPresentation {
  if (!value || typeof value !== 'object') return false
  const state = value as AngelPresentation,
    pose = state.displayedPose
  return (
    (state.object === 62 || state.object === 69) &&
    state.morph === (state.object === 62 ? 4 : 5) &&
    state.draw === 4 &&
    (state.pendingObject === 62 || state.pendingObject === 69) &&
    Number.isInteger(state.transitionCounter) &&
    state.transitionCounter >= 0 &&
    state.transitionCounter <= 5 &&
    Number.isInteger(state.sourceKey) &&
    Number.isInteger(state.targetKey) &&
    (state.sourceKey === 0 || !!keys[state.sourceKey]) &&
    (state.targetKey === 0 || !!keys[state.targetKey]) &&
    [
      state.f1,
      state.f2,
      state.stamp,
      state.flags3,
      state.palette,
      state.renderFlags,
      state.morphTimer,
      state.morphFrames,
      state.displayedFrame,
    ].every(Number.isInteger) &&
    state.morphTimer >= -32768 &&
    state.morphTimer <= 32767 &&
    state.displayedFrame >= 0 &&
    state.displayedFrame < 12 &&
    (state.morphFrames === 0 || state.morphFrames === 2) &&
    (!(state.renderFlags & 0x1000) ||
      (state.morphFrames === 2 &&
        !!keys[state.sourceKey] &&
        !!keys[state.targetKey] &&
        (!!(state.renderFlags & 0x400) ||
          (state.morphTimer >= 0 && state.morphTimer < state.morphFrames * 4)))) &&
    !!pose &&
    (pose.object === 62 || pose.object === 69) &&
    Number.isInteger(pose.from) &&
    Number.isInteger(pose.to) &&
    !!keys[pose.from] &&
    !!keys[pose.to] &&
    pose.denominator === 2 &&
    Number.isInteger(pose.numerator) &&
    pose.numerator >= 0 &&
    pose.numerator <= 2
  )
}

export function angelPoseRawPoints(pose: AngelDisplayPose): number[] {
  asset(pose.object)
  const from = keys[pose.from],
    to = keys[pose.to]
  if (
    !Number.isInteger(pose.from) ||
    !Number.isInteger(pose.to) ||
    !from ||
    !to ||
    !Number.isInteger(pose.numerator) ||
    !Number.isInteger(pose.denominator) ||
    pose.denominator <= 0 ||
    pose.numerator < 0 ||
    pose.numerator > pose.denominator
  )
    throw new RangeError('Invalid original Angel pose')
  return from.map((value, i) => morphCoordinate(value, to[i], pose.numerator, pose.denominator))
}

function framePose(frame: number, object: 62 | 69): AngelDisplayPose {
  const source = asset(object)
  if (!Number.isInteger(frame) || frame < 0 || frame >= source.frames)
    throw new RangeError(`Invalid original Angel frame: ${frame}`)
  const segment = source.segments.find(s => frame >= s.first && frame <= s.last)!
  return {
    object,
    from: segment.from,
    to: segment.to,
    numerator: frame - segment.first,
    denominator: segment.duration,
  }
}

export function angelRawPoints(frame: number, object: 62 | 69 = 69): number[] {
  return angelPoseRawPoints(framePose(frame, object))
}

const positionCache = new Map<string, Float32Array>()
export function angelPosePositions(pose: AngelDisplayPose): Float32Array {
  const key = `${pose.object}:${pose.from}:${pose.to}:${pose.numerator}:${pose.denominator}`
  let positions = positionCache.get(key)
  if (!positions) {
    const points = angelPoseRawPoints(pose),
      source = asset(pose.object),
      scale = source.scale * 3
    positions = new Float32Array(
      source.visiblePointIndices.flatMap(index => [
        points[index * 3] / scale,
        points[index * 3 + 1] / scale,
        -points[index * 3 + 2] / scale,
      ])
    )
    positionCache.set(key, positions)
  }
  return positions
}

export function angelPositions(frame: number, object: 62 | 69 = 69): Float32Array {
  return angelPosePositions(framePose(frame, object))
}
