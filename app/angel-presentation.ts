import { setAnimationObject, stepObjectAnimation, type AnimatedUnit } from './animation.ts'
import { morphCoordinate } from './morph.ts'
import data from './original-angel-presentation.json' with { type: 'json' }
import type { World } from './world-types.ts'

// Initial 004db980 -> 004de440(69, 1) attachment only. The current browser
// controller has no native movement-mode owner; do not guess model 62 selection
// from its broad "seeking"/"striking" phases. That transition remains unported.
export type AngelPresentation = AnimatedUnit & { displayedFrame: number }

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
  }
  setAnimationObject(state, 4, 69)
  state.morph = data.morphIndex
  state.renderFlags |= 0x8080
  return state
}

const animationData = {
  frameCounts: [],
  modelFrames: [],
  morphDurations: [0, 0, 0, 0, 0, data.frames - 1],
}

export function stepAngelPresentation(state: AngelPresentation) {
  // Native display precedes the shared animation visitor. Rendering only reads
  // this serialized latch, independent of the number of GPU frames.
  state.displayedFrame = ((state.f1 & 65535) >>> 2) % data.frames
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

export function angelRawPoints(frame: number): number[] {
  if (!Number.isInteger(frame) || frame < 0 || frame >= data.frames)
    throw new RangeError(`Invalid original Angel frame: ${frame}`)
  const segment = data.segments.find(s => frame >= s.first && frame <= s.last)!,
    keys: Record<string, number[]> = data.keypoints,
    from = keys[segment.from],
    to = keys[segment.to]
  return from.map((value, i) =>
    morphCoordinate(value, to[i], frame - segment.first, segment.duration)
  )
}

const positionCache = new Map<number, Float32Array>()
export function angelPositions(frame: number): Float32Array {
  let positions = positionCache.get(frame)
  if (!positions) {
    const points = angelRawPoints(frame),
      scale = data.scale * 3
    positions = new Float32Array(
      data.visiblePointIndices.flatMap(index => [
        points[index * 3] / scale,
        points[index * 3 + 1] / scale,
        -points[index * 3 + 2] / scale,
      ])
    )
    positionCache.set(frame, positions)
  }
  return positions
}
