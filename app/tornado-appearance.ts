import rules from './original-rules.json' with { type: 'json' }
import art from './original-tornado.json' with { type: 'json' }
import type { NativeTerrain } from './native-terrain.ts'

export interface TornadoAppearance {
  ordinal: number
  frame: number
  scaleX: number
  palette: number
}

// 0050f270: descriptor34 has no changing frame; only its birth variant varies.
export function tornadoAppearance(
  ordinal: number,
  birthPhase: number,
  water: boolean
): TornadoAppearance {
  return {
    ordinal,
    frame: (birthPhase - ordinal) & 15,
    scaleX: Math.trunc(512 / (ordinal + 1)),
    palette: water ? 5 : 4,
  }
}

export function tornadoCell(land: NativeTerrain, point: { x: number; y: number }) {
  const cell = ((point.y & 65535) >>> 9) * 128 + ((point.x & 65535) >>> 9)
  return {
    water: !!(rules.terrainCategoryFlags[land.categories[cell] & 15] & 2),
    cliff: land.cliffs[cell],
  }
}

// 0050f663: color travels up the linked column, one child per logical visit.
export function tornadoPalette(water: boolean, cliff: number) {
  if (water) return 5
  if (cliff > 212) return -1
  if (cliff > 200) return 3
  return cliff > 127 ? -2 : 4
}

export function tornadoColor(palette: number) {
  return (art.paletteColors as Record<string, number[]>)[palette]
}

export function validTornadoAppearance(p: TornadoAppearance) {
  return (
    Number.isInteger(p.ordinal) &&
    p.ordinal >= 0 &&
    p.ordinal < 16 &&
    Number.isInteger(p.frame) &&
    p.frame >= 0 &&
    p.frame < 16 &&
    p.scaleX === Math.trunc(512 / (p.ordinal + 1)) &&
    [-2, -1, 3, 4, 5].includes(p.palette)
  )
}
