import * as THREE from 'three'

// Capture once, not from the mutable prototypes at each query. A prototype-level
// override is just as custom as an own-method override on an individual object.
const geometryMethods = {
  getAttribute: THREE.BufferGeometry.prototype.getAttribute,
  getIndex: THREE.BufferGeometry.prototype.getIndex,
  setIndex: THREE.BufferGeometry.prototype.setIndex,
  setDrawRange: THREE.BufferGeometry.prototype.setDrawRange,
}
const indexPrototype = THREE.BufferAttribute.prototype,
  indexGetX = indexPrototype.getX,
  indexSetX = indexPrototype.setX

export function standardTerrainSubmissionIndex(index: THREE.BufferAttribute) {
  return (
    Object.getPrototypeOf(index) === indexPrototype &&
    index.getX === indexGetX &&
    index.setX === indexSetX &&
    Object.getPrototypeOf(index.array) === Uint32Array.prototype &&
    index.array.buffer instanceof ArrayBuffer &&
    !index.normalized &&
    index.itemSize === 1
  )
}

// Only initializeTerrain registers this contract. The terrain producer owns the
// index; outside writers must either set index.needsUpdate after edits or revoke
// ownership BEFORE unversioned raw writes. userData flags never grant ownership.
// Position/water updates are independent: visibility depends on vertex count,
// not coordinates. Replacement geometry/index or custom methods revoke ownership.
interface TerrainSubmissionOwner {
  geometry: THREE.BufferGeometry
  index: THREE.BufferAttribute | null
  array: THREE.BufferAttribute['array'] | null
  arrayLength: number
  indexCount: number
  selection: object | null
  version: number
  count: number
}
const owners = new WeakMap<THREE.Mesh, TerrainSubmissionOwner>()

export function registerTerrainSubmissionOwner(mesh: THREE.Mesh) {
  owners.set(mesh, {
    geometry: mesh.geometry,
    index: mesh.geometry.index,
    array: mesh.geometry.index?.array ?? null,
    arrayLength: mesh.geometry.index?.array.length ?? 0,
    indexCount: mesh.geometry.index?.count ?? 0,
    selection: null,
    version: -1,
    count: -1,
  })
}

// Debug/custom consumers opting into raw edits must call this first. Revocation
// is permanent for this mesh; normal render preparation uses exact validation.
export function revokeTerrainSubmissionOwner(mesh: THREE.Mesh) {
  owners.delete(mesh)
}

// The shipped rebuild path is the only supported owned geometry replacement.
export function replaceTerrainSubmissionGeometry(mesh: THREE.Mesh, geometry: THREE.BufferGeometry) {
  const owner = terrainSubmissionOwner(mesh)
  mesh.geometry = geometry
  if (owner) {
    owner.geometry = geometry
    owner.index = geometry.index
    owner.array = geometry.index?.array ?? null
    owner.arrayLength = owner.array?.length ?? 0
    owner.indexCount = geometry.index?.count ?? 0
    owner.selection = null
  }
}

export function terrainSubmissionOwner(mesh: THREE.Mesh) {
  const owner = owners.get(mesh)
  if (!owner) return undefined
  const geometry = mesh.geometry
  if (
    geometry !== owner.geometry ||
    geometry.index !== owner.index ||
    (owner.index !== null &&
      (owner.index.array !== owner.array ||
        owner.index.array.length !== owner.arrayLength ||
        owner.index.count !== owner.indexCount ||
        !standardTerrainSubmissionIndex(owner.index))) ||
    geometry.getAttribute !== geometryMethods.getAttribute ||
    geometry.getIndex !== geometryMethods.getIndex ||
    geometry.setIndex !== geometryMethods.setIndex ||
    geometry.setDrawRange !== geometryMethods.setDrawRange
  ) {
    owners.delete(mesh)
    return undefined
  }
  return owner
}

export function reuseTerrainSubmission(owner: TerrainSubmissionOwner, selection: object) {
  const { geometry, index } = owner
  return (
    owner.selection === selection &&
    index !== null &&
    owner.version === index.version &&
    geometry.drawRange.start === 0 &&
    geometry.drawRange.count === owner.count
  )
}

export function certifyTerrainSubmission(owner: TerrainSubmissionOwner, selection: object) {
  owner.index = owner.geometry.index
  owner.array = owner.index!.array
  owner.arrayLength = owner.array.length
  owner.indexCount = owner.index!.count
  owner.selection = selection
  owner.version = owner.index!.version
  owner.count = owner.geometry.drawRange.count
}
