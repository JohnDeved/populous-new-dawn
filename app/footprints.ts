// 0x4bf630 / 0x4bf740: four terrain stains per eligible animation visit.
// Retain native replacement order; counts avoid traversing every old footprint
// whenever a tile is redrawn. Saturation is applied only when shading pixels.
const corners = [
  [0, 0],
  [-16, 0],
  [-16, -16],
  [0, -16],
]

export function createFootprints() {
  return {
    cursor: 0,
    positions: new Uint32Array(65536),
    next: new Int32Array(65536).fill(-1),
    heads: new Int32Array(16384).fill(-1),
    tails: new Int32Array(16384).fill(-1),
    totals: new Uint16Array(16384),
    pixels: new Map<number, Uint16Array>(),
    dirty: new Set<number>(),
  }
}
export type Footprints = ReturnType<typeof createFootprints>

export function stampFootprints(f: Footprints, x: number, y: number) {
  for (const [dx, dy] of corners) {
    add(f, (x + dx) & 65535, (y + dy) & 65535, f.cursor)
    f.cursor = (f.cursor + 1) & 65535
  }
}

function add(f: Footprints, x: number, y: number, slot: number) {
  const cell = (y >> 9) * 128 + (x >> 9)
  if (f.totals[cell] > 1499) slot = f.heads[cell]
  if (f.next[slot] !== -1) {
    const old = f.positions[slot],
      oldCell = (old >>> 25) * 128 + ((old & 65535) >> 9)
    slot = f.heads[oldCell]
    if (f.tails[oldCell] === slot) {
      f.heads[oldCell] = -1
      f.tails[oldCell] = -1
    } else f.heads[oldCell] = f.next[slot]
    const removed = f.positions[slot]
    change(f, oldCell, removed & 65535, removed >>> 16, -1)
  }
  f.positions[slot] = (y << 16) | x
  f.next[slot] = -2
  if (f.tails[cell] === -1) f.heads[cell] = slot
  else f.next[f.tails[cell]] = slot
  f.tails[cell] = slot
  change(f, cell, x, y, 1)
}

function change(f: Footprints, cell: number, x: number, y: number, delta: number) {
  let pixels = f.pixels.get(cell)
  if (!pixels) f.pixels.set(cell, (pixels = new Uint16Array(1024)))
  const at = ((y & 496) >> 4) * 32 + ((x & 496) >> 4),
    before = pixels[at]
  pixels[at] += delta
  f.totals[cell] += delta
  // Counts above four all shade identically. Skip invisible saturation churn.
  if (Math.min(4, before) !== Math.min(4, pixels[at])) f.dirty.add(cell)
  if (!f.totals[cell]) f.pixels.delete(cell)
}
