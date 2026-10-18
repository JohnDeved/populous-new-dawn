import * as THREE from 'three'

// Only the shipped body-layer producer owns this render-only capability.
// Logical Sprite visibility, hierarchy, Painter slots and picking stay intact.
const materialOwners = new WeakMap<THREE.Material, THREE.Sprite>()
const defaultCompile = THREE.Material.prototype.onBeforeCompile
const defaultMaterialRender = THREE.Material.prototype.onBeforeRender
const defaultAfterRender = THREE.Object3D.prototype.onAfterRender

const owners = new WeakMap<
  THREE.Sprite,
  {
    material: THREE.SpriteMaterial
    map: THREE.Texture | null
    originalCompile: THREE.Material['onBeforeCompile']
    compile?: THREE.Material['onBeforeCompile']
    draw?: THREE.Object3D['onBeforeRender']
    uniforms?: { nativePainterSprite: { value: number } }
    programKey?: THREE.Material['customProgramCacheKey']
  }
>()

export function ownBodyLayer(layer: THREE.Sprite) {
  const material = layer.material
  if (material.onBeforeCompile !== defaultCompile || materialOwners.has(material)) return
  materialOwners.set(material, layer)
  owners.set(layer, { material, map: material.map, originalCompile: material.onBeforeCompile })
}

export function releaseBodyLayer(layer: THREE.Sprite) {
  owners.delete(layer)
}

// Called from the existing preparation traversal, before material cloning. A
// shared/custom handoff permanently revokes this small producer capability.
export function observeBodyLayerMaterial(object: THREE.Object3D, material: THREE.Material) {
  const owner = materialOwners.get(material)
  if (owner && owner !== object) releaseBodyLayer(owner)
}

export function bodyLayerCallbacksAreDefault(object: THREE.Object3D, material: THREE.Material) {
  return (
    object.onAfterRender === defaultAfterRender && material.onBeforeRender === defaultMaterialRender
  )
}

export function bindBodyLayerShader(
  object: THREE.Object3D,
  material: THREE.Material,
  originalCompile: THREE.Material['onBeforeCompile']
) {
  if (!(object instanceof THREE.Sprite)) return
  const owner = owners.get(object)
  if (!owner || owner.material !== material || owner.originalCompile !== originalCompile) return
  owner.compile = material.onBeforeCompile
  owner.programKey = material.customProgramCacheKey
  owner.draw = object.onBeforeRender
  owner.uniforms = material.userData.nativeUniforms
}

export function suppressBodyLayer(layer: THREE.Sprite, depth: number) {
  const owner = owners.get(layer),
    material = layer.material
  if (
    !owner ||
    owner.material !== material ||
    owner.map !== material.map ||
    !owner.compile ||
    owner.compile !== material.onBeforeCompile ||
    owner.draw !== layer.onBeforeRender ||
    owner.programKey !== material.customProgramCacheKey ||
    !bodyLayerCallbacksAreDefault(layer, material) ||
    owner.uniforms?.nativePainterSprite.value !== 1 ||
    Object.hasOwn(owner.uniforms, 'nativeMode') ||
    Object.hasOwn(owner.uniforms, 'nativePainter') ||
    owner.uniforms !== material.userData.nativeUniforms ||
    Object.getOwnPropertyDescriptor(material, 'visible')?.value !== true ||
    Object.getOwnPropertyDescriptor(material, 'visible')?.writable !== true ||
    material.transparent ||
    material.opacity !== 1 ||
    !material.depthWrite ||
    !material.depthTest ||
    material.alphaTest !== 0.5 ||
    material.depthFunc !== THREE.LessEqualDepth ||
    depth !== 2
  )
    return
  // Native sprite shaders overwrite z = 2*2-1 = 3 with w = 1, then change xy
  // only. The entire primitive clips, so no material-visible draw is required.
  material.visible = false
  return material
}
