import type { Tree, World } from './world-types.ts'
import type { TimberSearchObject } from './timber-search.ts'

const treeDataFields = ['x', 'z', 'id', 'logs', 'model', 'flags4'] as const

// Only synchronous expansion lookups use this phase-local index. Short route
// checks and mutating Fetch callbacks retain the original live iterator.
export function timberPhaseObjects(
  world: Pick<World, 'trees'>,
  cellOf: (tree: Tree) => number,
  fallback: (cell: number) => Iterable<TimberSearchObject>
) {
  let buckets: Map<number, Tree[]> | undefined
  let unsupported = false
  return function* (cell: number): Generator<TimberSearchObject> {
    if (!buckets && !unsupported) {
      const roster = Object.getOwnPropertyDescriptor(world, 'trees')
      const trees = roster && 'value' in roster ? (roster.value as Tree[]) : undefined
      unsupported = !Array.isArray(trees) || Object.getPrototypeOf(trees) !== Array.prototype
      // Descriptor admission does not invoke custom getters. Proxy traps are not
      // a supported world-storage contract; no Proxy-equivalence is claimed.
      for (let i = unsupported ? -1 : trees!.length - 1; !unsupported && i >= 0; i--) {
        const entry = Object.getOwnPropertyDescriptor(trees!, String(i))
        const tree = entry && 'value' in entry ? entry.value : undefined
        unsupported = !tree || Object.getPrototypeOf(tree) !== Object.prototype
        for (const key of treeDataFields) {
          if (unsupported) break
          const descriptor = Object.getOwnPropertyDescriptor(tree, key)
          unsupported = descriptor
            ? !('value' in descriptor) ||
              !(
                typeof descriptor.value === 'number' ||
                (key === 'flags4' && descriptor.value === undefined)
              )
            : key !== 'flags4' || !!Object.getOwnPropertyDescriptor(Object.prototype, key)
        }
      }
      if (!unsupported) {
        buckets = new Map()
        for (let i = trees!.length - 1; i >= 0; i--) {
          const tree = trees![i],
            index = cellOf(tree)
          // The first nativePosition synchronizes terrain here, at the same
          // first actual lookup as the original iterator, never before fog gates.
          const row = buckets.get(index)
          if (row) row.push(tree)
          else buckets.set(index, [tree])
        }
      }
    }
    if (unsupported) {
      yield* fallback(cell)
      return
    }
    for (const tree of buckets!.get(cell) ?? [])
      yield {
        id: tree.id,
        class: tree.logs > 0 ? 5 : 0,
        model: tree.model,
        flags4: tree.flags4 ?? 0,
        wood: Math.round(tree.logs * 100),
      }
  }
}
