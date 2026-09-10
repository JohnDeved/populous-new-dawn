import * as THREE from 'three'
import { dragBorderQuad, dragBorderPoints, dragBorderUV } from './drag-border.ts'
import { terrainPointHeight, type NativeTerrain } from './native-terrain.ts'
import { browserPosition } from './model.ts'
import type { RenderView } from './render-view.ts'

// Clip the existing terrain fragments instead of allocating the original temporary
// terrain/edge polygon pools. Atlas tile 15 supplies the native translucent fill.
export const dragOverlayShader = `
uniform bool dragActive;
uniform vec2 dragQuad[4];
uniform sampler2D dragAtlas;
varying vec2 dragPoint;
float dragCross(vec2 a,vec2 b,vec2 p){return (b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);}
bool dragTriangle(vec2 a,vec2 b,vec2 c,vec2 p){
 return dragCross(a,b,p)<=0.&&dragCross(b,c,p)<=0.&&dragCross(c,a,p)<=0.;
}
vec4 dragOverlay(vec4 ground){
 if(!dragActive)return ground;
 vec2 p=mod(dragPoint,65536.);
 vec2 high=max(max(dragQuad[0],dragQuad[1]),max(dragQuad[2],dragQuad[3]));
 vec2 low=min(min(dragQuad[0],dragQuad[1]),min(dragQuad[2],dragQuad[3]));
 if(high.x>=65536.&&p.x<32768.)p.x+=65536.;
 if(high.y>=65536.&&p.y<32768.)p.y+=65536.;
 if(any(lessThan(p,low))||any(greaterThan(p,high)))return ground;
 if(!dragTriangle(dragQuad[0],dragQuad[1],dragQuad[2],p)&&
    !dragTriangle(dragQuad[0],dragQuad[2],dragQuad[3],p))return ground;
 vec4 fill=texture2D(dragAtlas,(vec2(224.5,1024.-32.5)+vec2(fract(p.x/512.),-fract(p.y/512.))*31.)/vec2(256.,1024.));
 return vec4(mix(ground.rgb,fill.rgb,fill.a),ground.a);
}
`

// The border retains screen-space extrusion while the fill stays in the terrain
// shader. One reusable buffer replaces separate original edge/corner submissions.
export class DragBorder extends THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial> {
  constructor(atlas: THREE.Texture, view: RenderView, terrain: THREE.InstancedMesh) {
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
        vertexShader: `attribute float slot; uniform sampler2D painter; uniform int base;
        varying vec2 tex; void main(){int index=base+int(slot);
        float depth=texelFetch(painter,ivec2(index%1024,index/1024),0).r;
        tex=uv;gl_Position=vec4(position.xy,depth*2.-1.-.000001,1.);}`,
        fragmentShader: `uniform sampler2D map;uniform bool dragActive;varying vec2 tex;
        void main(){if(!dragActive)discard;gl_FragColor=texture2D(map,tex);}`,
      })
    )
    this.userData.nativeIgnore = true
    this.frustumCulled = false
    this.visible = false
    this.onBeforeRender = () => {
      this.material.uniforms.painter.value = view.painter.texture
      this.material.uniforms.base.value = view.painter.ranges.get(terrain)?.[0] ?? 0
    }
  }
  update(
    corners: { x: number; y: number }[],
    quadrant: number,
    land: NativeTerrain,
    view: RenderView,
    terrain: THREE.InstancedMesh
  ) {
    // 0x422fc0 suppresses borders when either side is at most 32 native units.
    if (
      [0, 1].some(
        i => Math.hypot(corners[i + 1].x - corners[i].x, corners[i + 1].y - corners[i].y) <= 32
      )
    ) {
      this.geometry.setDrawRange(0, 0)
      return
    }
    const positions: number[] = [],
      uv: number[] = [],
      slots: number[] = []
    const project = (p: { x: number; y: number }) => {
      const screen = view.project(browserPosition(p), terrainPointHeight(land, p) / 45)
      return { x: screen.screenX, y: screen.screenY, flags: screen.flags }
    }
    const add = (
      a: { x: number; y: number },
      b: { x: number; y: number },
      direction: number,
      corner = false
    ) => {
      const pa = project(a),
        pb = corner ? pa : project(b)
      if ((pa.flags & pb.flags & 0x1e) !== 0) return
      const center = { x: Math.round((a.x + b.x) / 2), y: Math.round((a.y + b.y) / 2) }
      if (!view.visible(browserPosition(center))) return
      const x = center.x & 65535,
        y = center.y & 65535,
        cell = (y >> 9) * 128 + (x >> 9)
      const triangle =
        land.flags[cell] & 1 ? Number((x & 511) + (y & 511) < 512) : Number((x & 511) > (y & 511))
      const face = (((59 - (y >> 9)) & 127) * 128 + (((x >> 9) + 60) & 127)) * 2 + triangle
      // Use the matching rendered terrain copy's depth, including map seams.
      // ponytail: native selection's separate buckets/mixed alpha order remain open;
      // the terrain depth prevents this feedback painting through solid objects.
      const point = {
        x: view.rawCenter.x + (((x - view.center.x) << 16) >> 16),
        y: view.rawCenter.y + (((y - view.center.y) << 16) >> 16),
      }
      const tileX = Math.floor((point.x / 256 - 8 + 128) / 256),
        tileZ = Math.floor((-point.y / 256 - 8 + 128) / 256)
      let instance = -1
      for (let i = 0; i < terrain.count; i++)
        if (
          terrain.instanceMatrix.array[i * 16 + 12] === tileX * 256 &&
          terrain.instanceMatrix.array[i * 16 + 14] === tileZ * 256
        ) {
          instance = i
          break
        }
      if (instance < 0) return
      const slot = instance * 32768 + face,
        quad = dragBorderQuad(pa, pb, direction, corner),
        tile = corner ? 31 : 23
      for (const i of [0, 1, 2, 0, 2, 3]) {
        positions.push(
          (quad[i].x * 2) / view.projection.width - 1,
          1 - (quad[i].y * 2) / view.projection.height,
          0
        )
        uv.push(((tile & 7) + dragBorderUV[i][0]) / 8, 1 - ((tile >> 3) + dragBorderUV[i][1]) / 32)
        slots.push(slot)
      }
    }
    for (let i = 0; i < 4; i++) {
      const points = dragBorderPoints(corners[i], corners[(i + 1) & 3])
      for (let j = 1; j < points.length; j++) add(points[j - 1], points[j], (i + quadrant + 1) & 3)
      add(corners[i], corners[i], (i + quadrant) & 3, true)
    }
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
  }
}
