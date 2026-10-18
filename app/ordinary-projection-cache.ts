// Four hot mesh/instance slots, each one shipped-grid corner table. Mesh identity
// is weak: no geometry, material, scene graph, candidate or Vector is retained.
// FIFO eviction is deliberate.
export const ORDINARY_PROJECTION_CAPACITY = 4
export const ORDINARY_PROJECTION_CORNERS = 129 * 129
const WIDTH = 7 // exact transformed x/y/z followed by screen x/y/z/w

export class OrdinaryProjectionEntry {
  readonly values = new Float64Array(ORDINARY_PROJECTION_CORNERS * WIDTH)
  readonly valid = new Uint8Array(ORDINARY_PROJECTION_CORNERS)
  meshRef: WeakRef<object>
  instance: number
  private state: number[]
  constructor(mesh: object, instance: number, state: number[]) {
    this.meshRef = new WeakRef(mesh)
    this.instance = instance
    this.state = state
  }

  prepare(mesh: object, instance: number, state: number[]) {
    if (
      this.meshRef.deref() !== mesh ||
      this.instance !== instance ||
      state.length !== this.state.length ||
      state.some((value, i) => !Object.is(value, this.state[i]))
    ) {
      this.valid.fill(0)
      this.meshRef = new WeakRef(mesh)
      this.instance = instance
      this.state = state
    }
  }
  lookup(corner: number, x: number, y: number, z: number) {
    const offset = corner * WIDTH
    return this.valid[corner] &&
      Object.is(x, this.values[offset]) &&
      Object.is(y, this.values[offset + 1]) &&
      Object.is(z, this.values[offset + 2])
      ? offset
      : -1
  }
  store(
    corner: number,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    sw: number
  ) {
    const offset = corner * WIDTH
    this.values[offset] = x
    this.values[offset + 1] = y
    this.values[offset + 2] = z
    this.values[offset + 3] = sx
    this.values[offset + 4] = sy
    this.values[offset + 5] = sz
    this.values[offset + 6] = sw
    this.valid[corner] = 1
  }
}

export class OrdinaryProjectionCache {
  private entries: OrdinaryProjectionEntry[] = []
  private next = 0
  prepare(mesh: object, instance: number, state: number[]) {
    let entry = this.entries.find(
      value => value.meshRef.deref() === mesh && value.instance === instance
    )
    if (!entry) {
      if (this.entries.length < ORDINARY_PROJECTION_CAPACITY) {
        entry = new OrdinaryProjectionEntry(mesh, instance, state)
        this.entries.push(entry)
      } else {
        entry = this.entries[this.next]
        this.next = (this.next + 1) % ORDINARY_PROJECTION_CAPACITY
      }
    }
    entry.prepare(mesh, instance, state)
    return entry
  }
}

// Read only ordinary own data properties, never invoke custom accessors while
// constructing a certificate. Numeric comparison retains signed-zero identity.
function data(object: object, key: PropertyKey): unknown {
  return Object.getOwnPropertyDescriptor(object, key)?.value
}
function plain(value: unknown): value is object {
  return !!value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype
}
function numbers(object: object, keys: readonly PropertyKey[], output: number[]) {
  for (const key of keys) {
    const value = data(object, key)
    if (typeof value !== 'number' || !Number.isFinite(value)) return false
    output.push(value)
  }
  return true
}
const MATRIX_KEYS = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const
const TRANSFORM_KEYS = [...MATRIX_KEYS, 9, 10, 11, 12, 13, 14, 15]
const PROJECTION_KEYS = [
  'curvature',
  'depth',
  'perspective',
  'scale',
  'width',
  'height',
  'centerX',
  'centerY',
  'fractionX',
  'fractionY',
  'pixelScaleX',
  'pixelScaleY',
] as const

export function ordinaryProjectionState(view: object, transform: object): number[] | null {
  const projection = data(view, 'projection'),
    rawCenter = data(view, 'rawCenter'),
    config = data(view, 'config')
  if (data(view, 'overview') !== false || !plain(projection) || !plain(rawCenter) || !plain(config))
    return null
  const matrix = data(projection, 'matrix'),
    elements = data(transform, 'elements'),
    values: number[] = []
  if (
    !Array.isArray(matrix) ||
    Object.getPrototypeOf(matrix) !== Array.prototype ||
    matrix.length !== 9 ||
    !Array.isArray(elements) ||
    Object.getPrototypeOf(elements) !== Array.prototype ||
    elements.length !== 16
  )
    return null
  if (
    !numbers(projection, PROJECTION_KEYS, values) ||
    !numbers(matrix, MATRIX_KEYS, values) ||
    !numbers(rawCenter, ['x', 'y'], values) ||
    !numbers(config, ['depth'], values)
  )
    return null
  // The actual transformed vertex is compared during visitation, but a transform
  // accessor could mutate projection state mid-loop; only plain finite matrices qualify.
  for (const key of TRANSFORM_KEYS) {
    const value = data(elements, key)
    if (typeof value !== 'number' || !Number.isFinite(value)) return null
  }
  return values
}
