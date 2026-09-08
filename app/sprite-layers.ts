import { spriteCoordinate, type CameraConfig } from './projection.ts'

interface Layer {
  piece: number
  x: number
  y: number
  flags: number
}
interface Piece {
  w: number
  h: number
}

// 0x45efd0 / 0x45f4a0 / 0x45f9d0 select layers before applying mirroring
// and scaling each signed offset and rectangle independently.
export function spriteLayers(
  layers: Layer[],
  pieces: Piece[],
  { owner = -1, person = 0, variant = 0, flags = 0, bucket = 1, scale = false, levelFlags = 0 },
  view: Pick<CameraConfig, 'scale' | 'spriteScale' | 'shamanScale'>
) {
  const size = (n: number) => (scale ? spriteCoordinate(n, bucket, levelFlags, view) : n)
  return layers.flatMap(layer => {
    const type = (layer.flags >> 4) & 31,
      choice = layer.flags >> 9
    if (!type && choice === 1 && flags & 2) return []
    if (
      owner !== -1 &&
      type &&
      !(type === 1 ? choice === owner : type === person && choice === variant)
    )
      return []
    const piece = pieces[layer.piece],
      mirror = !!(flags & 1)
    return [
      {
        piece: layer.piece,
        x: size(mirror ? -(layer.x + piece.w) : layer.x),
        y: size(layer.y),
        w: size(piece.w),
        h: size(piece.h),
        flags: ((layer.flags & 15) | ((flags & 4) * 2)) ^ (mirror ? 1 : 0),
      },
    ]
  })
}
