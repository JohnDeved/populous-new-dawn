// 0x40cc60: interpolate raw signed-short coordinates with integer division.
export function morphCoordinate(from: number, to: number, frame: number, duration: number) {
  if (!Number.isInteger(duration) || duration <= 0) throw new Error('Invalid morph duration')
  return ((from + Math.trunc(Math.imul(to - from, frame) / duration)) << 16) >> 16
}

export type ModelMorph = { from: number; to: number; started: number; duration: number }
