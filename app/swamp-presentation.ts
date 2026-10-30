import art from './original-swamp.json' with { type: 'json' }
import rules from './original-rules.json' with { type: 'json' }
import { terrainPointHeight, type NativeTerrain } from './native-terrain.ts'
import type { Swamp } from './swamp.ts'

type Ground = Pick<NativeTerrain, 'heights' | 'flags' | 'cliffs' | 'categories'>
const cells = [
  [-1, 1],
  [0, 1],
  [1, 1],
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, -1],
  [-1, 0],
  [0, 0],
]

// Original draw type 19: nine terrain samples and five variant-positioned plants.
// The global presentation clock animates bubbles; the trap's scan counter does not.
export function swampPresentation(land: Ground, swamp: Swamp, id: number, animationFrame: number) {
  const { center, variant } = swamp
  const sample = (x: number, y: number, frame: number, bubble: boolean) => {
    x &= 65535
    y &= 65535
    const cell = (y >>> 9) * 128 + (x >>> 9)
    return {
      x,
      y,
      h: terrainPointHeight(land, { x, y }) - (bubble ? 32 : 0),
      frame,
      visible:
        land.cliffs[cell] < 128 && !(rules.terrainCategoryFlags[land.categories[cell] & 15] & 2),
    }
  }
  return [
    ...cells.map(([x, y], i) =>
      sample(
        (center.x & 0xfe00) + x * 512 + 256,
        (center.y & 0xfe00) + y * 512 + 256,
        ((animationFrame + i) >>> 0) % 10,
        true
      )
    ),
    ...art.offsets[variant].map(([x, y], i) =>
      sample(center.x + x, center.y + y, 10 + (((id & 65535) + i * variant) % 12), false)
    ),
  ]
}
