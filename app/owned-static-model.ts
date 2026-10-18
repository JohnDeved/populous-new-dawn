import type * as THREE from 'three'
import type { NativeModelResource } from './model-resources.ts'
import type { ModelRawBounds, ModelPickBounds } from './model-pick-bounds.ts'
import type { RenderView } from './render-view.ts'

interface OwnedModelAsset {
  resource: NativeModelResource
  bounds: Readonly<ModelRawBounds>
}
const assets = new WeakMap<NativeModelResource, OwnedModelAsset>()
const int32 = (value: number) =>
  Number.isInteger(value) && value >= -2147483648 && value <= 2147483647

// Separate immutable source tier. The legacy resource and geometry caches remain
// mutable and are never promoted by bank/id/stage or identity/version checks.
export function ownedStaticModelAsset(source: NativeModelResource): OwnedModelAsset | undefined {
  const cached = assets.get(source)
  if (cached) return cached
  const data = structuredClone(source.data)
  const bounds: ModelRawBounds = {
    minX: Infinity,
    maxX: -Infinity,
    minY: Infinity,
    maxY: -Infinity,
    minZ: Infinity,
    maxZ: -Infinity,
  }
  if (
    !int32(data.scale) ||
    !data.p.length ||
    data.p.length % 3 ||
    data.faces.length !== data.tiles.length * 2
  )
    return undefined
  let coordinates = 0
  for (let face = 0; face < data.tiles.length; face++)
    coordinates += data.faces[face * 2] === 3 ? 9 : 18
  if (coordinates !== data.p.length) return undefined
  for (let i = 0; i < data.p.length; i++) {
    // Visible coordinates round through Float32; hidden pick-only coordinates do
    // not. Preserve both conversions and the picker's multiplication order.
    const sourceValue = data.p[i],
      floatValue = Math.fround(sourceValue),
      axis = i % 3,
      raw = Math.round((axis === 2 ? -sourceValue : sourceValue) * data.scale * 3),
      floatRaw = Math.round((axis === 2 ? -floatValue : floatValue) * data.scale * 3),
      low = Math.min(raw, floatRaw),
      high = Math.max(raw, floatRaw)
    if (!int32(low) || !int32(high)) return undefined
    if (axis === 0) {
      bounds.minX = Math.min(bounds.minX, low)
      bounds.maxX = Math.max(bounds.maxX, high)
    } else if (axis === 1) {
      bounds.minY = Math.min(bounds.minY, low)
      bounds.maxY = Math.max(bounds.maxY, high)
    } else {
      bounds.minZ = Math.min(bounds.minZ, low)
      bounds.maxZ = Math.max(bounds.maxZ, high)
    }
  }
  for (const row of data.normals) Object.freeze(row)
  for (const values of [
    data.p,
    data.uv,
    data.faces,
    data.tiles,
    data.normals,
    data.modes,
    data.biases,
  ])
    Object.freeze(values)
  Object.freeze(data)
  const asset = Object.freeze({
    resource: Object.freeze({
      id: source.id,
      bank: source.bank,
      data,
      shapeIndices: Object.freeze([...source.shapeIndices]),
    }),
    bounds: Object.freeze(bounds),
  })
  assets.set(source, asset)
  return asset
}

// Explicit GameScene-only lifetime capability, not a generic shape certifier.
// Static producer methods/prototypes, asset/stage, position storage, parent and ID
// remain fixed while owned. Pose/nativeSize and ordinary RenderView.update may
// change: their values already participate in the complete model cache key.
// Raw writes, shared mutable clones and custom view/model hooks must leave this
// context before mutation. Generic nativeModel/ScenePicking never acquire it.
const owners = new WeakMap<THREE.Mesh, OwnedModelAsset>()
export function registerOwnedStaticModel(mesh: THREE.Mesh, asset: OwnedModelAsset) {
  owners.set(mesh, asset)
}
export const runtimeModelAsset = (mesh: THREE.Mesh) => owners.get(mesh)

interface BoundsRecord {
  key: string
  asset: OwnedModelAsset
  x: number
  y: number
  width: number
  height: number
}
export interface RuntimeModelPicking {
  readonly view: RenderView
  readonly bounds: WeakMap<THREE.Mesh, BoundsRecord>
  workspace: ModelPickBounds | undefined
}
// Called once by the real GameScene producer. Do not use for arbitrary scenes,
// proxy receivers or method-decorated views: these keep the unchanged eager path.
export function createRuntimeModelPicking(view: RenderView): RuntimeModelPicking {
  return { view, bounds: new WeakMap(), workspace: undefined }
}

// Deliberate ownership exit before a supported mutable/custom handoff. Versioning
// invalidates existing complete records as well as uploading subsequent writes.
// No current building/tree/vehicle writer needs this; shrines remain generic.
export function releaseRuntimeModel(mesh: THREE.Mesh, runtime: RuntimeModelPicking) {
  owners.delete(mesh)
  runtime.bounds.delete(mesh)
  mesh.geometry.getAttribute('position').needsUpdate = true
}
