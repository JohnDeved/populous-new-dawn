import * as THREE from 'three'
import type { Painter } from './painter.ts'

// Keep the existing meshes as the source of transforms and native painter slots.
// Only their opaque GPU submission is replaced, then restored after the draw.
export class HealthBars {
  enabled = true
  batches: THREE.InstancedMesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>[] = []
  hidden: THREE.Mesh[] = []

  update(scene: THREE.Scene, painter: Painter) {
    if (!this.enabled) return
    const shapes: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>[][] = [[], []]
    scene.traverseVisible(object => {
      const shape = object.userData.healthShape
      if (object instanceof THREE.Mesh && (shape === 0 || shape === 1)) shapes[shape].push(object)
    })
    for (const [shape, sources] of shapes.entries()) {
      if (!sources.length) continue
      let batch = this.batches[shape]
      if (!batch || batch.instanceMatrix.count < sources.length) {
        if (batch) this.release(batch)
        const [source] = sources,
          capacity = Math.max(16, sources.length * 2),
          geometry = source.geometry.clone(),
          material = source.material.clone()
        material.color.set(0xffffff)
        material.onBeforeCompile = source.material.onBeforeCompile
        material.customProgramCacheKey = () => `${source.material.customProgramCacheKey()}-health`
        material.defines = { ...material.defines, NATIVE_HEALTH_INSTANCES: 1 }
        geometry.setAttribute(
          'nativeHealthSlot',
          new THREE.InstancedBufferAttribute(new Float32Array(capacity), 1)
        )
        geometry.setAttribute(
          'nativeHealthCell',
          new THREE.InstancedBufferAttribute(new Float32Array(capacity * 2), 2)
        )
        batch = new THREE.InstancedMesh(geometry, material, capacity)
        batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
        batch.frustumCulled = false
        batch.userData.nativeIgnore = true
        batch.name = `health-bars-${shape}`
        this.batches[shape] = batch
      }
      const slot = batch.geometry.getAttribute(
          'nativeHealthSlot'
        ) as THREE.InstancedBufferAttribute,
        cell = batch.geometry.getAttribute('nativeHealthCell') as THREE.InstancedBufferAttribute
      for (const [i, source] of sources.entries()) {
        batch.setMatrixAt(i, source.matrixWorld)
        batch.setColorAt(i, source.material.color)
        slot.setX(i, painter.ranges.get(source)![0])
        const anchor = source.parent!.userData.cellPosition
        cell.setXY(i, anchor.x, anchor.z)
        source.visible = false
        this.hidden.push(source)
      }
      batch.count = sources.length
      for (const attribute of [batch.instanceMatrix, batch.instanceColor!, slot, cell]) {
        attribute.setUsage(THREE.DynamicDrawUsage)
        attribute.clearUpdateRanges()
        attribute.addUpdateRange(0, sources.length * attribute.itemSize)
        attribute.needsUpdate = true
      }
      scene.add(batch)
    }
  }

  afterRender() {
    for (const source of this.hidden) source.visible = true
    this.hidden.length = 0
    for (const batch of this.batches) batch?.removeFromParent()
  }

  release(batch: THREE.InstancedMesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>) {
    batch.removeFromParent()
    batch.dispose()
    batch.geometry.dispose()
    batch.material.dispose()
  }

  dispose() {
    this.afterRender()
    for (const batch of this.batches) if (batch) this.release(batch)
    this.batches.length = 0
  }
}
