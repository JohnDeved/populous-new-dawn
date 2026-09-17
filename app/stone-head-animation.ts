import { setAnimationObject, stepObjectAnimation, type AnimatedUnit } from './animation.ts'
import { morphCoordinate } from './morph.ts'
import { missionData } from './mission-data.ts'
import type { Point, Shrine, World } from './world-types.ts'
import data from './original-stone-heads.json' with { type: 'json' }

// This is the model45/46/47 family only. Other scenery families and cue193 are
// intentionally not inferred from the browser's legacy model45 fallback.
export type StoneHeadAnimation = AnimatedUnit & {
  family: 45
  triggerIndex: number
  sceneryIndex: number
  enabled: boolean
  holdFrame: number
}
export type StoneHeadSource = { triggerIndex: number; sceneryIndex: number }
const sourceCache = new Map<number, Map<string, StoneHeadSource>>()
const key = (p: Point) => `${p.x}:${p.z}`
const cell = (p: Point) =>
  (((Math.round((p.x + 8) * 256) & 65535) >>> 9) |
    (((Math.round((-p.z - 8) * 256) & 65535) >>> 9) << 7))

// 004851e0: a linked class6/model2 grant-mode3 sets trigger flag0x20, then the
// colocated class5/model9 is linked. Modes3/5 override that family in004fbd20.
export function originalStoneHeadSource(mission: number, point: Point): StoneHeadSource | null {
  let sources = sourceCache.get(mission)
  if (!sources) {
    sources = new Map()
    const objects = missionData(mission).level.objects
    const byLink = new Map(objects.map(o => [o.index + 1, o]))
    for (const trigger of objects) {
      const settings = trigger.settings
      if (trigger.type !== 6 || trigger.model !== 6 || !settings || [3, 4, 5].includes(settings[0]))
        continue
      const links = Array.from({ length: 10 }, (_, i) =>
        byLink.get(settings[6 + i * 2] | (settings[7 + i * 2] << 8))
      )
      if (!links.some(o => o?.type === 6 && o.model === 2 && o.settings?.[2] === 3)) continue
      const scenery = objects.find(o => o.type === 5 && o.model === 9 && cell(o) === cell(trigger))
      if (scenery) sources.set(key(trigger), { triggerIndex: trigger.index, sceneryIndex: scenery.index })
    }
    sourceCache.set(mission, sources)
  }
  return sources.get(key(point)) ?? null
}

export function createStoneHeadAnimation(enabled: boolean, source: StoneHeadSource): StoneHeadAnimation {
  const state: StoneHeadAnimation = {
    ...source, family: 45, enabled, holdFrame: 1,
    object: 45, draw: 4, morph: 1, palette: 0, renderFlags: 0,
    f1: 0, f2: 0, stamp: 0, flags3: 0, morphTimer: 0, morphFrames: 0,
  }
  setAnimationObject(state, 4, 45)
  state.morph = data.morphIndex
  if (!enabled) state.renderFlags = (state.renderFlags | 0x400) & ~0x800
  return state
}

// Old saves have no presentation field. Reconstruct only a proven authored family
// at deterministic phase0 (held1 when disabled), without replaying work/rewards.
// New saves retain the complete per-head counter through structured cloning.
export function initializeStoneHead(shrine: Shrine, mission: number): StoneHeadAnimation | null {
  if (shrine.kind === 'vault' || shrine.model !== 45) return null
  if (shrine.stoneHead === undefined) {
    const source = originalStoneHeadSource(mission, shrine)
    shrine.stoneHead = source ? createStoneHeadAnimation(shrine.enabled, source) : null
  }
  return shrine.stoneHead
}

const animationData = { frameCounts: [], modelFrames: [], morphDurations: [0, data.frames - 1] }

export function syncStoneHeadEnabled(state: StoneHeadAnimation, enabled: boolean) {
  if (state.enabled !== enabled) {
    if (enabled) {
      // The refill branch reselects the object before releasing its hold.
      setAnimationObject(state, 4, 45)
      state.morph = data.morphIndex
      state.renderFlags &= ~0x400
    } else {
      // 0040cb90: hold frame1 without resetting the retained raw counter.
      state.holdFrame = 1
      state.renderFlags = (state.renderFlags | 0x400) & ~0x800
    }
    state.enabled = enabled
  }
}

// Record transitions even when fast simulation performs disable+refill between
// presentation boundaries. This notification never advances the animation clock.
export function syncStoneHeadPresentation(shrine: Shrine) {
  if (shrine.kind !== 'vault' && shrine.stoneHead)
    syncStoneHeadEnabled(shrine.stoneHead, shrine.enabled)
}

export function stepStoneHeadAnimation(state: StoneHeadAnimation, enabled: boolean) {
  syncStoneHeadEnabled(state, enabled)
  stepObjectAnimation(state, { counter: 0, levelFlags: 0, levelFlags2: 0 }, animationData, () => {})
}

// One call on the existing chronological24Hz boundary; no render-FPS timer.
// Trigger exhaustion does not delete its independently linked decorative scenery.
// Enabled remains unchanged on that original deletion branch, so the loop survives.
export function animateStoneHeads(world: World) {
  if (world.paused || world.land.landFlags & 2) return
  for (const shrine of world.shrines) {
    const state = initializeStoneHead(shrine, world.outcome.level)
    if (state) stepStoneHeadAnimation(state, shrine.enabled)
  }
}

export function stoneHeadFrame(state: StoneHeadAnimation) {
  return state.renderFlags & 0x400 && !(state.renderFlags & 0x800)
    ? state.holdFrame
    : ((state.f1 & 65535) >>> 2) % data.frames
}

// Native interpolation writes corresponding raw points into the BASE object.
// Keep its52faces/scale150/UVs; keys46/47 have92faces and must not replace them.
export function stoneHeadRawPoints(frame: number) {
  if (!Number.isInteger(frame) || frame < 0 || frame >= data.frames)
    throw new RangeError(`Invalid original Stone Head frame: ${frame}`)
  const segment = data.segments.find(s => frame >= s.first && frame <= s.last)!
  const keys: Record<string, number[]> = data.keypoints
  const from = keys[segment.from], to = keys[segment.to]
  return from.map((value, i) => morphCoordinate(value, to[i], frame - segment.first, segment.duration))
}

const frameCache = new Map<number, Float32Array>()
export function stoneHeadPositions(frame: number) {
  let positions = frameCache.get(frame)
  if (!positions) {
    const points = stoneHeadRawPoints(frame), scale = data.scale * 3
    positions = new Float32Array(data.visiblePointIndices.flatMap(index => [
      points[index * 3] / scale, points[index * 3 + 1] / scale, -points[index * 3 + 2] / scale,
    ]))
    frameCache.set(frame, positions)
  }
  return positions
}
