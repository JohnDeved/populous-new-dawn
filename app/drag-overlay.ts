import * as THREE from 'three'
import { dragBorderQuad, dragBorderUV, selectionFillUV } from './drag-border.ts'
import { selectionMesh } from './selection-mesh.ts'
import { selectionDraws, type SelectionVertex } from './selection-raster.ts'
import { terrainPointHeight, type NativeTerrain } from './native-terrain.ts'
import { browserPosition } from './model.ts'
import type { RenderView } from './render-view.ts'
import { projectPoint } from './projection.ts'
import rules from './original-rules.json' with { type: 'json' }

// One atlas/buffer for the original fill, edges and corners. The painter batches
// consecutive selection triangles while retaining intervening transparent objects.
export class SelectionOverlay extends THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial> {
  meshKey = ''
  triangles: ReturnType<typeof selectionMesh> = []
  constructor(atlas: THREE.Texture, view: RenderView) {
    super(
      new THREE.BufferGeometry(),
      new THREE.ShaderMaterial({
        uniforms: {
          map: { value: atlas },
          painter: { value: view.painter.texture },
          base: { value: 0 },
          dragActive: { value: false },
        },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        vertexShader: `attribute float slot;uniform sampler2D painter;uniform int base;varying vec2 tex;
    void main(){int index=base+int(slot);float depth=texelFetch(painter,ivec2(index%1024,index/1024),0).r;
    tex=uv;gl_Position=vec4(position.xy,depth*2.-1.,1.);}`,
        fragmentShader: `uniform sampler2D map;uniform bool dragActive;varying vec2 tex;
    void main(){if(!dragActive)discard;gl_FragColor=texture2D(map,tex);}`,
      })
    )
    this.userData.nativeIgnore = true
    this.userData.selectionCommands = []
    this.frustumCulled = false
    this.visible = false
    this.onBeforeRender = (_renderer, _scene, _camera, _geometry, material) => {
      const { uniforms } = material as THREE.ShaderMaterial
      uniforms.painter.value = view.painter.texture
      uniforms.base.value = view.painter.ranges.get(this)?.[0] ?? 0
    }
  }
  update(
    corners: { x: number; y: number }[],
    camera: number,
    quadrant: number,
    land: NativeTerrain,
    view: RenderView
  ) {
    const key = JSON.stringify([corners, camera, quadrant])
    if (key !== this.meshKey) {
      this.triangles = selectionMesh(corners, camera, quadrant)
      this.meshKey = key
    }
    const projected = new Map<object, SelectionVertex>()
    const triangles = this.triangles.map(triangle =>
      triangle.map(p => {
        let point = projected.get(p)
        if (!point) {
          const screen = projectPoint(
            view.relative(browserPosition(p), terrainPointHeight(land, p) / 45),
            view.projection,
            false
          )
          const cell = ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9)
          point = {
            x: screen.screenX,
            y: screen.screenY,
            z: screen.z,
            flags: p.flags | (rules.terrainCategoryFlags[land.categories[cell] & 15] & 1 ? 0 : 128),
          }
          projected.set(p, point)
        }
        return point
      })
    )
    const borders = [0, 1].every(
      i => Math.hypot(corners[i + 1].x - corners[i].x, corners[i + 1].y - corners[i].y) > 32
    )
    const draws = selectionDraws(triangles, view.projection.width, view.projection.height, borders)
    const positions: number[] = [],
      uv: number[] = [],
      slots: number[] = []
    const commands: { bucket: number; order: number }[] = []
    draws.forEach((draw, order) => {
      if (!draw.visible) return
      const fill = draw.kind === 'fill',
        corner = draw.kind === 'corner'
      const quad = fill
        ? draw.points
        : dragBorderQuad(draw.points[0], draw.points[1] ?? draw.points[0], draw.direction, corner)
      const indices = fill ? [0, 1, 2] : [0, 1, 2, 0, 2, 3]
      let tile = 15
      if (!fill) tile = corner ? 31 : 23
      const tex = fill ? selectionFillUV : dragBorderUV
      for (let j = 0; j < indices.length; j++) {
        if (j % 3 === 0)
          commands.push({ bucket: draw.bucket, order: order * 2 - Math.floor(j / 3) })
        const i = indices[j]
        positions.push(
          (quad[i].x * 2) / view.projection.width - 1,
          1 - (quad[i].y * 2) / view.projection.height,
          0
        )
        uv.push(((tile & 7) + tex[i][0]) / 8, 1 - ((tile >> 3) + tex[i][1]) / 32)
        slots.push(commands.length - 1)
      }
    })
    for (const [name, data, size] of [
      ['position', positions, 3],
      ['uv', uv, 2],
      ['slot', slots, 1],
    ] as const) {
      let attribute = this.geometry.getAttribute(name) as THREE.BufferAttribute | undefined
      if (!attribute || attribute.array.length < data.length) {
        attribute = new THREE.BufferAttribute(
          new Float32Array(Math.max(128, 2 ** Math.ceil(Math.log2(data.length / size))) * size),
          size
        ).setUsage(THREE.DynamicDrawUsage)
        this.geometry.setAttribute(name, attribute)
      }
      attribute.array.set(data)
      attribute.clearUpdateRanges()
      attribute.addUpdateRange(0, data.length)
      attribute.needsUpdate = true
    }
    this.geometry.setDrawRange(0, positions.length / 3)
    this.userData.selectionCommands = commands
  }
}
