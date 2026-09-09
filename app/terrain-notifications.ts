import type { NativeTerrain } from './native-terrain.ts'

const indexOf = (cell: number) => ((cell & 0xfe00) >> 9) * 128 + ((cell & 254) >> 1)
const offset = (cell: number, x: number, y: number) =>
  (((cell & 255) + x * 2) & 255) | ((((cell >> 8) + y * 2) & 255) << 8)

// Height-change object notifications from 0x44f2f0. Each changed vertex reaches
// its cell's object chain and the four building cells touching that vertex.
// The caller owns landscape redraw, walk-mask rebuilding and route invalidation.
export function notifyTerrainObjects(
  land: Pick<NativeTerrain, 'flags' | 'buildingIds'>,
  center: number,
  radius: number,
  cellObjects: (index: number) => Iterable<number>,
  changed: (id: number) => void
) {
  if (!Number.isInteger(radius) || radius < 0 || radius > 32767)
    throw new RangeError('Invalid terrain notification radius')
  for (let y = -radius; y <= radius; y++)
    for (let x = -radius; x <= radius; x++) {
      const cell = offset(center, x, y)
      for (const id of cellObjects(indexOf(cell))) changed(id)
      for (const [dx, dy] of [
        [0, 0],
        [0, -1],
        [-1, -1],
        [-1, 0],
      ]) {
        const i = indexOf(offset(cell, dx, dy)),
          id = land.buildingIds[i] & 1023
        if (!id) continue
        if (land.flags[i] & 512) land.flags[i] |= 0x20000
        changed(id)
      }
    }
}
