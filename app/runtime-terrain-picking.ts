import type * as THREE from 'three'
import type { GameScene } from './scene.ts'
import type { RenderView } from './render-view.ts'
import type { PointerFrameMetrics } from './pointer-frame-metrics.ts'

interface Binding {
  scene: GameScene
  terrain: THREE.InstancedMesh
  geometry: THREE.BufferGeometry
  position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute
}
const bindings = new WeakMap<RenderView, Binding>()
const released = new WeakSet<RenderView>()

// Internal GameScene producer contract, not shape-based admission. The owned
// view/terrain have plain fields and standard methods. Raw XYZ edits are allowed;
// custom hooks/proxies must release BEFORE handoff. Generic APIs stay generic.
export function createRuntimeTerrainPicking(scene: GameScene) {
  if (released.has(scene.view)) return
  bindings.set(scene.view, {
    scene,
    terrain: scene.terrain,
    geometry: scene.terrain.geometry,
    position: scene.terrain.geometry.getAttribute('position'),
  })
}

// Only the authored rebuild producer may rebind replacement position storage.
// Rebuilding after explicit release must not resurrect the capability.
export function rebindRuntimeTerrainPicking(scene: GameScene) {
  const binding = bindings.get(scene.view)
  if (binding?.scene === scene && binding.terrain === scene.terrain)
    createRuntimeTerrainPicking(scene)
}

export function runtimeTerrainPicking(view: RenderView, terrain: THREE.Object3D) {
  const binding = bindings.get(view)
  return (
    !!binding &&
    binding.scene.view === view &&
    binding.scene.terrain === terrain &&
    binding.terrain === terrain &&
    binding.geometry === binding.terrain.geometry &&
    binding.position === binding.geometry.getAttribute('position')
  )
}

export function releaseRuntimeTerrainPicking(view: RenderView) {
  const owned = bindings.delete(view)
  released.add(view)
  if (owned) view.releaseOrdinaryNumericProjection()
}

export function pickRuntimeTerrain(scene: GameScene, metrics?: PointerFrameMetrics) {
  const view = scene.view
  // Preserve the generic entry's method/argument access order. Do not inspect
  // terrain or camera ahead of a custom view.pick getter on an unowned scene.
  if (!bindings.has(view))
    return view.pick(scene.mouse, [scene.terrain], scene.camera, false, metrics?.ordinaryTerrain)
  return runtimeTerrainPicking(view, scene.terrain)
    ? view.pickOwnedTerrain(scene.mouse, scene.terrain, scene.camera, metrics?.ordinaryTerrain)
    : view.pick(scene.mouse, [scene.terrain], scene.camera, false, metrics?.ordinaryTerrain)
}
