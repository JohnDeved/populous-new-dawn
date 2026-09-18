import units from './original-units.json' with { type: 'json' }
import { setAnimationObject } from './animation.ts'
import type { Effect } from './world-types.ts'

// 005029d0: reset on entry to the processed phase, not on a rendered frame.
// The original object setter retains f2, so the phase controller clears it.
export function setShamanDeathPhase(effect: Effect, phase: number) {
  const death = effect.reincarnation
  if (!death || (death.phase === phase && effect.animation && death.displayedFrame !== undefined))
    return
  death.phase = phase
  effect.animation ??= {
    object: 0,
    draw: 14,
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
  let object = 360
  if (phase === 0) object = 680
  else if (phase === 1) object = 352
  setAnimationObject(animation, 14, object)
  animation.f2 = phase >= 3 ? units.frameCounts[360] - 1 : 0
  if (phase >= 3) animation.renderFlags |= 0x6002
  if (phase >= 4) animation.renderFlags |= 0x10
  death.displayedFrame = animation.f2
}

// 004a4960 draws before 004ee770 advances. Called only on the existing
// presentation clock, immediately before this effect's shared animation step.
export function latchShamanDeathFrame(effect: Effect) {
  if (!effect.reincarnation) return
  // Old checkpoints have no animation state; recover frame0 without replaying
  // death/spawn or guessing a historical draw count from simulation age.
  setShamanDeathPhase(effect, effect.reincarnation.phase)
  effect.reincarnation.displayedFrame = effect.animation!.f2
}

// Renderer-only: earlier phases consume the latched frame; rise freezes the
// final source360 frame and the death-site spirit is hidden during the wait.
export function shamanDeathVfx(phase: number, displayedFrame = 0) {
  return {
    visible: phase < 4,
    frame: phase >= 3 ? units.frameCounts[360] - 1 : displayedFrame,
  }
}
