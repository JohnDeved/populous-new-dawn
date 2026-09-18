import { missionData } from './mission-data.ts'
import type { Shrine } from './world-types.ts'

// 0x4851e0 links class-6/model-6 heads to colocated model-9 scenery; 0x4fbd20 selects the presentation object.
// This issue-22 slice restores only the proved mode-3 Obelisk identity. Model8 remains outside model45 Stone Head animation.
export const WORSHIP_STONE_HEAD_MODEL = 45
export const WORSHIP_OBELISK_MODEL = 8

export function worshipAppearanceModel(mode: number | undefined): number {
  return mode === 3 ? WORSHIP_OBELISK_MODEL : WORSHIP_STONE_HEAD_MODEL
}

// Legacy checkpoints predate Shrine.mode. Recover the authored trigger without
// rebuilding the world: x/z, worship range and native heading are immutable source
// identity fields, while work/followers/rewards/RNG remain checkpoint-owned state.
// If multiple authored records share that identity, accept it only when their mode
// agrees (Mission23 has one such same-mode overlap).
export function authoredWorshipMode(
  missionNumber: number,
  shrine: Pick<Shrine, 'x' | 'z' | 'range' | 'angle'>
): number | undefined {
  const heading = Math.round((shrine.angle * 2048) / (Math.PI * 2)) & 2047,
    modes = new Set(
      missionData(missionNumber).level.objects
        .filter(
          object =>
            object.type === 6 &&
            object.model === 6 &&
            object.settings &&
            object.x === shrine.x &&
            object.z === shrine.z &&
            object.settings[1] === shrine.range &&
            (object.angle & 2047) === heading
        )
        .map(object => object.settings![0])
    )
  return modes.size === 1 ? modes.values().next().value : undefined
}
