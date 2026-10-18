import { comparePolygons } from './painter-order.ts'

type OrderedCommand = { bucket: number; order: number }
const canonicalSort = Array.prototype.sort
// Provisional, not measured/tuned. Bound retained scratch and leave small scenes
// on the existing comparison sort. Shipped polygon/sprite buckets are 0..3584.
export const DISTRIBUTION_MIN = 4096
export const DISTRIBUTION_MAX = 65536
const BUCKETS = 3585

// Only Painter's locally constructed command records enter this helper. They
// have plain own data fields and cannot be retained/customized before sorting.
// This is not a general sorter for proxies/accessor-bearing external records.
export class PainterDepthOrder {
  private counts?: Uint32Array
  private scratch: (OrderedCommand | undefined)[] = []

  clear() {
    this.counts = undefined
    this.scratch = []
  }

  sort<T extends OrderedCommand>(commands: T[]) {
    const length = commands.length
    if (length < DISTRIBUTION_MIN || length > DISTRIBUTION_MAX || commands.sort !== canonicalSort)
      return commands.sort(comparePolygons)

    const counts = (this.counts ??= new Uint32Array(BUCKETS))
    counts.fill(0)
    for (let i = 0; i < length; i++) {
      const { bucket, order } = commands[i]
      // Unique original orders remove comparator ties/NaN ambiguity. Objects,
      // fractions, infinities and custom selection ranges keep the exact sorter.
      if (
        typeof bucket !== 'number' ||
        !Number.isInteger(bucket) ||
        bucket < 0 ||
        bucket >= BUCKETS ||
        order !== i
      )
        return commands.sort(comparePolygons)
      counts[bucket]++
    }
    let offset = 0
    for (let bucket = BUCKETS - 1; bucket >= 0; bucket--) {
      const count = counts[bucket]
      counts[bucket] = offset
      offset += count
    }
    if (this.scratch.length < length)
      this.scratch.length = Math.min(DISTRIBUTION_MAX, 2 ** Math.ceil(Math.log2(length)))
    // Reverse input order means descending unique order within each bucket.
    for (let i = length - 1; i >= 0; i--) {
      const command = commands[i]
      this.scratch[counts[command.bucket]++] = command
    }
    for (let i = 0; i < length; i++) {
      commands[i] = this.scratch[i] as T
      this.scratch[i] = undefined // Retain capacity, never prior-frame commands.
    }
    return commands
  }
}
