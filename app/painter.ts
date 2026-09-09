import * as THREE from 'three'
import { modelMatrix, modelPoint, projectPoint, spriteBucket } from './projection.ts'
import {
  comparePolygons,
  modelTriangleVisible,
  painterDepth,
  polygonBucket,
} from './painter-order.ts'
import type { RenderView } from './render-view.ts'

interface Command {
  slot: number
  bucket: number
  cell: number
  object: number
  face: number
  ground: number
  order: number
}

// One depth stream is shared by terrain, models and sprite layers. The GPU
// fetches a constant per-triangle value; texture batching cannot change it.
export class Painter {
  view: RenderView
  landFlags: Uint32Array = new Uint32Array(16384)
  ranges = new WeakMap<THREE.Object3D, [number, number]>()
  transparentMeshes: {
    mesh: THREE.Mesh
    material: THREE.Material | THREE.Material[]
    groups: THREE.BufferGeometry['groups']
  }[] = []
  texture = new THREE.DataTexture(new Float32Array(1024), 1024, 1, THREE.RedFormat, THREE.FloatType)
  constructor(view: RenderView) {
    this.view = view
  }

  update(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    const objects: (THREE.Mesh | THREE.Sprite)[] = []
    let length = 0
    scene.traverseVisible(object => {
      if (
        object.userData.nativeIgnore ||
        !(object instanceof THREE.Mesh || object instanceof THREE.Sprite)
      )
        return
      const material = Array.isArray(object.material) ? object.material[0] : object.material
      if (!this.view.materials.has(material)) return
      const triangles =
        object instanceof THREE.Sprite ? 1 : object.geometry.getAttribute('position').count / 3
      this.ranges.set(object, [length, triangles])
      length += triangles * (object instanceof THREE.InstancedMesh ? object.count : 1)
      objects.push(object)
    })
    if (length > this.texture.image.data!.length) {
      this.texture.dispose()
      this.texture.image = {
        data: new Float32Array(Math.ceil(length / 1024) * 1024),
        width: 1024,
        height: Math.ceil(length / 1024),
      }
    }
    const pixels = this.texture.image.data as Float32Array
    pixels.fill(2)
    const commands: Command[] = [],
      view = this.view,
      basis = view.uniforms.nativeBasis.value
    const depth = (p: { x: number; y: number; z: number }) =>
      (Math.imul(p.x, basis[6]) + Math.imul(p.y, basis[7]) + Math.imul(p.z, basis[8])) >> 14
    const world = new THREE.Vector3(),
      anchor = new THREE.Vector3(),
      local = new THREE.Matrix4()
    for (const object of objects) {
      const [offset, triangles] = this.ranges.get(object)!,
        sprite = object instanceof THREE.Sprite
      const ground = !!object.userData.painterGround,
        unwrapped = !!object.userData.nativeRelative
      const geometry = object.geometry,
        position = geometry.getAttribute('position'),
        bias = geometry.getAttribute('painterBias')
      const scale = object.userData.nativeScale as number | undefined
      const group = object.parent!,
        metadata = group.userData
      const id = metadata.unit ?? metadata.building ?? metadata.shrine ?? metadata.point?.id
      // ponytail: non-person object chains are not retained by the simulation yet.
      // Preserve creation order within their cells until all native lists are live.
      const sourceOrder =
        object.userData.painterSequence ??
        (id === undefined ? (sprite ? group.id : object.id) : -id)
      const rotation = modelMatrix(
        metadata.nativeHeading ?? 0,
        metadata.nativeTilt ?? 0,
        metadata.nativeRoll ?? 0
      )
      const instances = object instanceof THREE.InstancedMesh ? object.count : 1
      for (let instance = 0; instance < instances; instance++) {
        const transform = object.matrixWorld.clone()
        if (object instanceof THREE.InstancedMesh) {
          object.getMatrixAt(instance, local)
          transform.multiply(local)
        }
        const origin = new THREE.Vector3().setFromMatrixPosition(transform)
        const nativeOrigin = view.relative(origin, (origin.y * 128) / 45, unwrapped)
        for (let triangle = 0; triangle < triangles; triangle++) {
          if (sprite || scale) anchor.copy(origin)
          else {
            anchor.set(0, 0, 0)
            for (let j = 0; j < 3; j++)
              anchor.add(world.fromBufferAttribute(position, triangle * 3 + j))
            anchor.multiplyScalar(1 / 3).applyMatrix4(transform)
          }
          if (!view.visible(anchor, unwrapped)) continue
          const x = Math.round((anchor.x + 8) * 256),
            y = Math.round((-anchor.z - 8) * 256)
          const center = unwrapped ? view.rawCenter : view.center
          const relative = (coordinate: number, center: number) => {
            const cell = (coordinate >> 9) - (center >> 9)
            return unwrapped ? cell : ((cell + 64) & 127) - 64
          }
          const cell = (relative(y, center.y) + 110) * 222 + relative(x, center.x) + 110
          let bucket: number
          if (sprite)
            bucket =
              spriteBucket(
                depth(nativeOrigin),
                object === metadata.shadow ? -192 : (metadata.depthBias ?? -300)
              ) - 1
          else {
            const depths: number[] = []
            const projected = []
            let raised = !!object.userData.painterRaised
            for (let j = 0; j < 3; j++) {
              world.fromBufferAttribute(position, triangle * 3 + j)
              if (scale) {
                const raw = [
                  Math.round(world.x * scale * 3),
                  Math.round(world.y * scale * 3),
                  Math.round(-world.z * scale * 3),
                ]
                const point = modelPoint(
                  raw,
                  object.userData.nativeSize ?? scale,
                  rotation,
                  nativeOrigin
                )
                depths.push(depth(point))
                if (object.userData.stage === 4)
                  projected.push(projectPoint(point, view.projection))
              } else {
                world.applyMatrix4(transform)
                depths.push(depth(view.relative(world, (world.y * 128) / 45, unwrapped)))
                if (ground) {
                  const i =
                    ((Math.round((-world.z - 8) / 2) & 127) << 7) |
                    (Math.round((world.x + 8) / 2) & 127)
                  const flags = this.landFlags[i]
                  raised ||= !!(flags & 0x200) && !(flags & 0x100000)
                }
              }
            }
            if (
              projected.length &&
              !modelTriangleVisible(projected, view.projection.width, view.projection.height)
            )
              continue
            bucket = polygonBucket(
              depths,
              bias?.getX(triangle * 3) ?? object.userData.painterBias ?? 0,
              ground && raised
            )
          }
          commands.push({
            slot: offset + instance * triangles + triangle,
            bucket,
            cell,
            object: sourceOrder,
            face: sprite ? -group.children.indexOf(object) : triangle,
            ground: object.userData.painterSequence === undefined ? Number(ground) : 0,
            order: 0,
          })
        }
      }
    }
    commands.sort(
      (a, b) => a.cell - b.cell || a.ground - b.ground || a.object - b.object || a.face - b.face
    )
    commands.forEach((command, i) => {
      command.order = i
    })
    commands.sort(comparePolygons)
    // ponytail: full original batch capacity/flush ownership remains unported.
    // Keep a larger browser frame ordered inside the depth range in the meantime.
    const stretch = Math.max(1, commands.length / 16000)
    commands.forEach((command, i) => {
      pixels[command.slot] = painterDepth(i / stretch)
    })
    // 0x47c7e0 retains command order in its deferred alpha list. A transparent
    // mesh may straddle a sprite, so expose each triangle to Three's draw sorter.
    for (const object of objects) {
      if (!(object instanceof THREE.Mesh)) continue
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      if (!materials.some(m => m.transparent)) continue
      const geometry = object.geometry
      this.transparentMeshes.push({
        mesh: object,
        material: object.material,
        groups: geometry.groups,
      })
      const groups = Array.isArray(object.material)
        ? geometry.groups
        : [{ start: 0, count: geometry.getAttribute('position').count, materialIndex: 0 }]
      geometry.groups = groups.flatMap(group =>
        Array.from({ length: group.count / 3 }, (_, i) => ({
          start: group.start + i * 3,
          count: 3,
          materialIndex: group.materialIndex,
        }))
      )
      object.material = materials
    }
    const drawDepth = (item: THREE.RenderItem) =>
      this.depth(
        item.object,
        ((item.group as unknown as { start: number } | null)?.start ?? 0) / 3,
        0
      )
    renderer.setTransparentSort((a: THREE.RenderItem, b: THREE.RenderItem) => {
      const ad = drawDepth(a),
        bd = drawDepth(b)
      return (
        a.groupOrder - b.groupOrder ||
        a.renderOrder - b.renderOrder ||
        (!this.view.overview && ad !== null && bd !== null ? bd - ad : b.z - a.z) ||
        a.id - b.id
      )
    })
    this.texture.needsUpdate = true
  }

  afterRender() {
    // Keep scene material edits and geometry ownership unchanged between frames.
    while (this.transparentMeshes.length) {
      const { mesh, material, groups } = this.transparentMeshes.pop()!
      mesh.material = material
      mesh.geometry.groups = groups
    }
  }

  depth(object: THREE.Object3D, triangle: number, instance: number) {
    const range = this.ranges.get(object)
    return range
      ? this.texture.image.data![range[0] + range[1] * instance + triangle] * 2 - 1
      : null
  }
}
