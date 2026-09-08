import rules from './original-rules.json' with { type: 'json' }
import type { NativeTerrain } from './native-terrain.ts'
import { restingCellCollision } from './person-collision.ts'
import { startIndexedSearch, nextIndexedSearch, endIndexedSearch } from './indexed-search.ts'

interface Point {
  x: number
  y: number
}
export type Replant = Point & { model: number; remaining: number }

// 0x4a79f0's delayed class-17 request. Computer harvesting shortens the delay.
export function replantDelay(model: number, computer: boolean) {
  const delay = rules.sceneryReplantDelay[model]
  return computer ? (delay >>> 1) + (delay >>> 3) : delay
}

// 0x4a6f40's growth phase; the caller advances the object's counter.
export function stepTreeGrowth(t: {
  model: number
  counter: number
  wood: number
  growth: number
}) {
  if (t.counter & 15 || !(rules.sceneryResourceFlags[t.model] & 5)) return
  if (t.wood < rules.sceneryWood[t.model])
    t.wood = Math.max(0, Math.min(rules.sceneryWood[t.model], t.wood + t.growth))
  else t.growth = rules.sceneryGrowth[t.model]
}

// Complete 0x4a8440: original ring order, cell exclusions and quarter-cell walks.
export function findReplantSite(
  land: Pick<NativeTerrain, 'flags' | 'categories' | 'walkMasks' | 'landFlags'>,
  search: Uint8Array,
  origin: Point,
  objects: (cell: number) => Iterable<{ class: number; model: number }>
) {
  const id = startIndexedSearch(search, 2, 0, 0, 16)
  if (!id) return null
  try {
    for (let delta = nextIndexedSearch(search, id); delta; delta = nextIndexedSearch(search, id)) {
      const x = (((origin.x >> 8) & 254) + delta.x * 2) & 255,
        y = (((origin.y >> 8) & 254) + delta.y * 2) & 255,
        cell = (y >> 1) * 128 + (x >> 1),
        flags = land.flags[cell],
        category = land.categories[cell]
      if (!(rules.terrainCategoryFlags[category & 15] & 1) || flags & 0x10606) continue
      let occupied = false
      for (const object of objects(cell))
        if (
          object.class === 5
            ? object.model !== 17
            : object.class === 10 && object.model === 16 && !(land.landFlags & 8)
        ) {
          occupied = true
          break
        }
      if (
        occupied ||
        restingCellCollision({ flags, category }, land.walkMasks[0], {
          x: (x + 1) * 256,
          y: (y + 1) * 256,
        })
      )
        continue
      return { x: x * 256, y: y * 256 }
    }
    return null
  } finally {
    endIndexedSearch(search, id)
  }
}

// 0x4a8370: the allocator consumer receives the site; failure retains the request.
export function stepReplant(request: Replant, plant: () => boolean) {
  request.remaining = (request.remaining - 1) | 0
  if (request.remaining > 0) return false
  if (plant()) return true
  request.remaining = 256
  return false
}
