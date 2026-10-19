import type { Projection } from './projection.ts'

// Aggregate across the entire query, NOT per terrain instance. See the memory
// budget in references/runtime-ordinary-projection-cache.md. Overflow is uncached.
const capacity = 32768
const instanceCapacity = 9

export class OrdinaryProjectionCache {
  private values = new Float64Array(capacity * 9)
  private tags = new Uint32Array(capacity)
  private contexts: { values: Float64Array; tag: number }[] = []
  private serial = 0
  private cursor = 0
  private instance = 0
  private tag = 0

  beginQuery() {
    this.cursor = 0
    this.instance = 0
    this.tag = 0
  }

  beginInstance(matrix: number[], centerX: number, centerY: number, p: Projection, depth: number) {
    const instance = this.instance++
    if (instance >= instanceCapacity) {
      this.tag = 0
      return
    }
    const inputs = [
      ...matrix,
      centerX,
      centerY,
      ...p.matrix,
      p.curvature,
      p.depth,
      p.perspective,
      p.scale,
      p.width,
      p.height,
      p.centerX,
      p.centerY,
      p.fractionX,
      p.fractionY,
      p.pixelScaleX,
      p.pixelScaleY,
      depth,
    ]
    // Only standard producer matrices have these lengths; do not grow retained
    // storage for malformed/custom data even if an internal caller supplies it.
    if (inputs.length !== 40) {
      this.tag = 0
      return
    }
    let context = this.contexts[instance]
    if (!context || !inputs.every((value, i) => Object.is(value, context!.values[i]))) {
      if (this.serial === 0xffffffff) {
        this.tags.fill(0)
        this.contexts.length = 0
        this.serial = 0
      }
      context = { values: new Float64Array(inputs), tag: ++this.serial }
      this.contexts[instance] = context
    }
    this.tag = context.tag
  }

  restore(x: number, y: number, z: number, output: Float64Array, offset: number) {
    const slot = this.cursor++,
      at = slot * 9
    if (
      !this.tag ||
      slot >= capacity ||
      this.tags[slot] !== this.tag ||
      !Object.is(x, this.values[at]) ||
      !Object.is(y, this.values[at + 1]) ||
      !Object.is(z, this.values[at + 2])
    )
      return false
    for (let lane = 0; lane < 6; lane++) output[offset + lane] = this.values[at + 3 + lane]
    return true
  }

  save(x: number, y: number, z: number, output: Float64Array, offset: number) {
    const slot = this.cursor - 1,
      at = slot * 9
    if (!this.tag || slot < 0 || slot >= capacity) return
    this.tags[slot] = this.tag
    this.values[at] = x
    this.values[at + 1] = y
    this.values[at + 2] = z
    for (let lane = 0; lane < 6; lane++) this.values[at + 3 + lane] = output[offset + lane]
  }
}
