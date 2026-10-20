import artwork from './original-shield.json'
import { spriteCoordinate, type CameraConfig } from './projection.ts'

export interface ShieldAppearance {
  remaining: number
  counter: number
  unitIndex: number
  animationFrame: number
  owner: number
  frameHeight: number
  scaled: boolean
  bucket: number
  flags: number
}

// The current gameplay adapter stores whole turns, not the original timer byte.
// Keep its lifetime unchanged, using the rendered person's counter for blinking.
export function shieldRectangles(
  state: ShieldAppearance,
  view: Pick<CameraConfig, 'scale' | 'spriteScale' | 'shamanScale'>
) {
  if (
    state.remaining <= 0 ||
    (state.remaining < 128 && state.counter & 2) ||
    state.frameHeight <= 0 ||
    !artwork.tints[state.owner]
  )
    return []
  const phase = ((state.unitIndex & 0xffff) + (state.animationFrame >>> 0)) & 15,
    size = (value: number) =>
      state.scaled ? spriteCoordinate(value, state.bucket, state.flags, view) : value,
    base = Math.trunc(state.frameHeight / 8)
  return [0, 1, 2].flatMap(piece => {
    const { source, lift } = artwork.phases[(phase - piece) & 15],
      frame = artwork.frames[source + piece * 5 - 1538],
      width = size(frame.w),
      height = size(frame.h),
      span = state.scaled ? height : Math.trunc((state.frameHeight * 28) / 32)
    return width > 0 && height > 0
      ? [
          {
            frame,
            rgb: artwork.tints[state.owner].rgb,
            x: -Math.trunc(width / 2),
            y: -Math.trunc((lift * span) / 256) - base,
            width,
            height,
          },
        ]
      : []
  })
}
