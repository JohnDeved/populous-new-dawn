import rules from './original-rules.json' with { type: 'json' }

// 0x46e930 / 0x4673b0: only terrain buckets below the depth midpoint contribute.
// Reuse the painter's accepted triangles; no second projection or world scan.
export class TerrainAmbience {
  buckets = new Uint32Array(3585 * 3)
  min = 3584
  max = 0

  clear() {
    this.buckets.fill(0)
    this.min = 3584
    this.max = 0
  }

  add(bucket: number, height: number, category: number) {
    this.min = Math.min(this.min, bucket)
    this.max = Math.max(this.max, bucket)
    let kind = height < 513 ? 0 : 2
    if (rules.terrainCategoryFlags[category & 15] & 2) kind = 1
    this.buckets[bucket * 3 + kind]++
  }

  result() {
    const middle = this.min + ((this.max - this.min) >>> 1)
    let low = 0,
      water = 0,
      high = 0
    // Native draw traversal compares bucket + 1, not bucket, against the midpoint.
    for (let bucket = this.min; bucket + 1 < middle && bucket <= this.max; bucket++) {
      low += this.buckets[bucket * 3]
      water += this.buckets[bucket * 3 + 1]
      high += this.buckets[bucket * 3 + 2]
    }
    return { total: low + water + high, low, water, high }
  }
}
