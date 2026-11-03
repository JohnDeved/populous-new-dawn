import rules from './original-rules.json' with { type: 'json' }
import { startIndexedSearch, nextIndexedSearch, endIndexedSearch } from './indexed-search.ts'

interface Resource {
  id: number
  class: number
  model: number
  x: number
  y: number
}
interface Point {
  x: number
  y: number
}

// 004a74e0: descriptor eligibility and type-2 traversal only. Object lifetime
// and cell-list order belong to the caller, not wood/fog/reachability filters.
export function searchQueuedResource<T extends Resource>(
  pool: Uint8Array,
  center: Point,
  angle: number,
  mode: 0 | 1 | 2,
  objects: (cell: number) => Iterable<T>,
  approach: (object: T) => void
): T | undefined {
  const search = startIndexedSearch(pool, 2, angle, 0, 8)
  if (!search) return
  try {
    const x = (center.x >>> 8) & 254,
      y = (center.y >>> 8) & 254
    for (
      let offset = nextIndexedSearch(pool, search);
      offset;
      offset = nextIndexedSearch(pool, search)
    ) {
      const cell = (((y + offset.y * 2) & 255) >>> 1) * 128 + (((x + offset.x * 2) & 255) >>> 1)
      for (const object of objects(cell)) {
        if (object.class !== 5) continue
        const flags = rules.sceneryResourceFlags[object.model] ?? 0
        if (flags & 16 ? mode === 2 : !(flags & 4) || mode === 1) continue
        approach(object)
        return object
      }
    }
  } finally {
    endIndexedSearch(pool, search)
  }
}

// 004340a0 phase 1: one preferred search, then either resource family.
export function acquireQueuedResource<T extends Resource>(
  pool: Uint8Array,
  center: Point,
  angle: number,
  flags: number,
  objects: (cell: number) => Iterable<T>,
  approach: (object: T) => void
) {
  const selector = flags & 12
  let mode: 0 | 1 | 2 = 0
  if (selector === 4) mode = 1
  else if (selector === 8) mode = 2
  return (
    (mode ? searchQueuedResource(pool, center, angle, mode, objects, approach) : undefined) ??
    searchQueuedResource(pool, center, angle, 0, objects, approach)
  )
}
