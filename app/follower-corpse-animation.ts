import units from './original-units.json' with { type: 'json' }
import rules from './original-rules.json' with { type: 'json' }
import { setAnimationObject } from './animation.ts'
import { nativeUnitModel } from './unit-kinds.ts'
import type { Effect, Unit } from './world-types.ts'

type Direction = { frames: number[]; flip: boolean; source: number }
const sources: Partial<Record<number, Direction[]>> = units.followerSources

// The model-12 controller selects person rows 19, 18 and 20, not packed
// atlas-frame indices. Draw descriptors retain each follower's clothing/cadence.
const poses = Array.from({ length: 7 }, (_, model) =>
  [19, 18, 20].map(row => {
    const object = rules.personAnimationObjects[row * 9 + model],
      [source, draw] = rules.animationObjects[object],
      directions = sources[source]
    if (!directions) throw new RangeError(`Missing original corpse source ${source}`)
    return { source, draw, directions, freezeRise: object !== 108 }
  })
)

export function followerCorpsePose(unit: Pick<Unit, 'team' | 'kind'>, phase: number) {
  const model = unit.team === 'wild' ? 1 : nativeUnitModel(unit.kind)
  if (model > 6) throw new RangeError('Shaman corpses require their tribe-specific presentation')
  return poses[model][phase === 0 ? 0 : phase === 1 ? 1 : 2]
}

// Phase entry resets f2 explicitly; the ordinary object setter retains it.
export function setFollowerCorpsePhase(effect: Effect, phase: number) {
  const corpse = effect.corpse
  if (
    !corpse ||
    !effect.unit ||
    (corpse.phase === phase && effect.animation && corpse.displayedFrame !== undefined)
  )
    return
  corpse.phase = phase
  if (phase >= 4 && effect.animation) {
    effect.animation.renderFlags |= 0x10
    corpse.displayedFrame = effect.animation.f2
    return
  }
  const pose = followerCorpsePose(effect.unit, phase)
  effect.animation ??= {
    object: 0,
    draw: pose.draw,
    morph: 0,
    palette: 0,
    renderFlags: 0,
    f1: 0,
    f2: 0,
    stamp: 0,
    flags3: 0,
    morphTimer: 0,
    morphFrames: 0,
  }
  const { animation } = effect
  setAnimationObject(animation, pose.draw, pose.source)
  const frozen = phase >= 3 && pose.freezeRise
  animation.f2 = frozen ? units.frameCounts[pose.source] - 1 : 0
  if (phase >= 3) animation.renderFlags |= frozen ? 0x6002 : 0x6000
  if (phase >= 4) animation.renderFlags |= 0x10
  corpse.displayedFrame = animation.f2
}

// The native draw precedes animation advancement. Retain that displayed sample
// on the existing presentation visit, independently of simulation/render rates.
export function latchFollowerCorpseFrame(effect: Effect) {
  if (!effect.corpse) return
  setFollowerCorpsePhase(effect, effect.corpse.phase)
  effect.corpse.displayedFrame = effect.animation!.f2
}

export function followerCorpseFrame(effect: Effect) {
  const corpse = effect.corpse!,
    pose = followerCorpsePose(effect.unit!, corpse.phase)
  return corpse.phase >= 3 && pose.freezeRise
    ? units.frameCounts[pose.source] - 1
    : (corpse.displayedFrame ?? 0)
}
