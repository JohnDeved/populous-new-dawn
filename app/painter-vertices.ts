import type * as THREE from 'three'
import type { ProjectedPoint } from './projection.ts'

type PositionAttribute = THREE.BufferAttribute | THREE.InterleavedBufferAttribute

interface Vertices {
  version: number
  source: Uint32Array
  seen: Uint8Array // 0: uncomputed, 1: computed, 2: computed raised ground
  depth: Int32Array
  projected: ProjectedPoint[]
}

function gridSources(position: PositionAttribute, sources: Uint32Array) {
  // 128×128 native cells, plus the duplicated outer row/column. Validate the
  // shared height too; irregular edits must fall back to exact XYZ matching.
  const corners = new Uint32Array(129 * 129)
  for (let i = 0; i < position.count; i++) {
    const x = (position.getX(i) + 128) / 2,
      z = (position.getZ(i) + 128) / 2
    if (!Number.isInteger(x) || !Number.isInteger(z) || x < 0 || x > 128 || z < 0 || z > 128)
      return false
    const cell = z * 129 + x,
      first = corners[cell] - 1
    if (first < 0) corners[cell] = i + 1
    else if (position.getY(i) !== position.getY(first)) return false
    sources[i] = first < 0 ? i : first
  }
  return true
}

// Non-indexed faces repeat shared corners. Retain that identity, but recompute
// their transformed results for every instance/frame (including live land flags).
export class PainterVertices {
  entries = new WeakMap<PositionAttribute, Vertices>()

  get(position: PositionAttribute, grid = false) {
    const version = 'data' in position ? position.data.version : position.version
    let cached = this.entries.get(position)
    if (cached && cached.version === version) return cached
    if (cached && cached.source.length === position.count) {
      // Moving shared corners together keeps the mapping. Splitting any corner
      // rebuilds it, including edits to only one face of a non-indexed mesh.
      let shared = true
      for (let i = 0; i < position.count && shared; i++) {
        const source = cached.source[i]
        shared =
          source === i ||
          (position.getX(i) === position.getX(source) &&
            position.getY(i) === position.getY(source) &&
            position.getZ(i) === position.getZ(source))
      }
      if (shared) {
        cached.version = version
        return cached
      }
    }
    cached = {
      version,
      source: new Uint32Array(position.count),
      seen: new Uint8Array(position.count),
      depth: new Int32Array(position.count),
      // Source indices span the whole non-indexed mesh; reserve its slots so
      // sparse terrain writes do not turn this hot array into a dictionary.
      // oxlint-disable-next-line unicorn/no-new-array -- Reserve source-indexed slots; measured moving-crowd regression without it.
      projected: new Array(position.count),
    }
    if (!grid || !gridSources(position, cached.source)) {
      const sources = new Map<string, number>()
      for (let i = 0; i < position.count; i++) {
        const key = `${position.getX(i)},${position.getY(i)},${position.getZ(i)}`
        if (!sources.has(key)) sources.set(key, i)
        cached.source[i] = sources.get(key)!
      }
    }
    this.entries.set(position, cached)
    return cached
  }
}
