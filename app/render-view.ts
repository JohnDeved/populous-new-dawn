import { inHitTriangle } from './world-picking.ts'
import * as THREE from 'three'
import { Painter } from './painter.ts'
import { widenGroundBounds } from './viewport-bounds.ts'
import { visibleTerrainCells, visibleTerrainCopies, terrainTiles } from './terrain-visibility.ts'
import { globePoint, globeVisible, globePick } from './globe.ts'
import {
  cameraConfig,
  cameraConfigIndex,
  cameraMatrix,
  modelMatrix,
  modelPoint,
  relativeCoordinate,
  projectPoint,
  circularMeshBounds,
  polygonMeshBounds,
  meshCellVisible,
  type Projection,
  type CameraConfig,
} from './projection.ts'

// WebGL2 port of the CPU-compared projection. Unsigned operations preserve x86
// wrap explicitly; splitting the final sum avoids premature float32 rounding.
export const nativeVertexShader = `
uniform sampler2D nativePainter;
uniform ivec2 nativePainterRange;
uniform float nativePainterSprite;
uniform ivec3 nativeBasis[3];
uniform ivec3 nativeObjectBasis[3];
uniform ivec4 nativeSettings;
uniform ivec4 nativeScreen;
uniform ivec2 nativeCenter;
uniform ivec2 nativeRawCenter;
uniform float nativeModelScale;
uniform float nativeObjectScale;
uniform float nativeRelative;
uniform vec4 nativeCellAnchor;
uniform float nativeMode;
varying vec2 nativeCell;
#ifdef USE_MODEL_WAVE
attribute vec2 nativeWaveOffset;
#endif
int nativeMul(int a,int b){return int(uint(a)*uint(b));}
int nativeDot(ivec3 a,ivec3 b){return int(uint(nativeMul(a.x,b.x))+uint(nativeMul(a.y,b.y))+uint(nativeMul(a.z,b.z)));}
int nativeShift16(int a,int b){
 uint al=uint(a)&65535u,bl=uint(b)&65535u;
 return int((al*bl>>16u)+uint(a>>16)*bl+uint(b>>16)*al+(uint(nativeMul(a>>16,b>>16))<<16u));
}
int nativeDelta(int coordinate,int center){
 int d=(coordinate&65535)-(center&65535),m=abs(d);
 return ((m&32768)!=0?(d>0?m-65536:65536-m):d)>>1;
}
float nativePixel(int value,int center,bool inverted){
 int hi=value>>16,lo=value&65535;
 if(inverted){hi=-hi;lo=-lo;}
 lo+=center*16;hi+=lo>>16;lo&=65535;
 return (float(hi)*65536.+float(lo))*.0625;
}
vec3 nativeScreenPoint(ivec3 p){
 int x=int(uint(nativeMul(p.x,nativeBasis[0].x))+uint(nativeMul(p.z,nativeBasis[0].z)))>>14;
 int y=nativeDot(p,nativeBasis[1])>>14,z=nativeDot(p,nativeBasis[2])>>14;
 int r=int(uint(nativeMul(x*2,x*2))+uint(nativeMul(z*2,z*2)));
 y-=nativeShift16(r,nativeSettings.x)>>16;
 int depth=z+nativeSettings.y;
 int sx,sy;
 if(depth<=0){sx=-(nativeScreen.z<<8);sy=-(nativeScreen.w<<8);}
 else{
  int perspective=(1<<((nativeSettings.z+16)&31))/depth;
  sx=nativeShift16(nativeMul(nativeSettings.w,x)>>12,perspective);
  sy=nativeShift16(nativeMul(nativeSettings.w,y)>>12,perspective);
 }
 vec2 screen=vec2(nativePixel(sx,nativeScreen.z,false),nativePixel(sy,nativeScreen.w,true));
 return vec3(screen,float(depth));
}
vec4 nativeProject(ivec3 p){
 vec3 screen=nativeScreenPoint(p);
 return vec4(screen.x*2./float(nativeScreen.x)-1.,1.-screen.y*2./float(nativeScreen.y),screen.z/16384.-1.,1.);
}
vec2 nativeCellPoint(vec3 world){
 ivec2 coordinate=ivec2(round(vec2(world.x+8.,-world.z-8.)*256.));
 ivec2 center=nativeRelative>0.?nativeRawCenter:nativeCenter;
 ivec2 cell=(coordinate>>9)-(center>>9);
 if(nativeRelative<=0.)cell=((cell+64)&ivec2(127))-64;
 return vec2(cell)+vec2(coordinate&ivec2(511))/512.;
}
ivec3 nativeOrigin(vec3 world){
 ivec2 coordinate=ivec2(round(vec2(world.x+8.,-world.z-8.)*256.));
 ivec2 relative=nativeRelative>0.?(coordinate-nativeRawCenter)>>1:ivec2(nativeDelta(coordinate.x,nativeCenter.x),nativeDelta(coordinate.y,nativeCenter.y));
 return ivec3(relative.x,int(round(world.y*128.)),relative.y);
}
vec4 nativePosition(vec3 position){
 vec3 world=(modelMatrix*vec4(position,1.)).xyz;
 #ifdef USE_INSTANCING
 world=(modelMatrix*instanceMatrix*vec4(position,1.)).xyz;
 #endif
 ivec3 p=nativeOrigin(world);
 if(nativeModelScale>0.){
  ivec3 raw=ivec3(round(vec3(position.x,position.y,-position.z)*nativeModelScale*3.));
  ivec3 scaled=ivec3(nativeMul(raw.x,int(nativeObjectScale)),nativeMul(raw.y,int(nativeObjectScale)),nativeMul(raw.z,int(nativeObjectScale)))>>8;
  ivec3 origin=nativeOrigin(modelMatrix[3].xyz);
  p=ivec3(nativeDot(scaled,nativeObjectBasis[0]),nativeDot(scaled,nativeObjectBasis[1]),nativeDot(scaled,nativeObjectBasis[2]))>>14;
  p+=origin;
  #ifdef USE_MODEL_WAVE
  p.xz+=ivec2(nativeWaveOffset);
  #endif
  nativeCell=nativeCellPoint(modelMatrix[3].xyz);
 }else nativeCell=nativeCellPoint(world);
 if(nativeCellAnchor.w>0.)nativeCell=nativeCellPoint(nativeCellAnchor.xyz);
 vec4 projected=nativeProject(p);
 if(nativeMode>0.&&nativePainterRange.x>=0){
  int slot=nativePainterRange.x+(nativePainterSprite>0.?0:gl_VertexID/3);
  #ifdef USE_INSTANCING
  slot+=gl_InstanceID*nativePainterRange.y;
  #endif
  projected.z=texelFetch(nativePainter,ivec2(slot%1024,slot/1024),0).r*2.-1.;
 }
 return projected;
}
`
const fragment = `
uniform float nativeMode;
uniform sampler2D nativeBounds;
varying vec2 nativeCell;
bool nativeCellVisible(){
 vec2 cell=nativeCell+110.;
 int row=int(floor(cell.y))+1;
 if(row<0||row>=222)return false;
 vec2 span=texelFetch(nativeBounds,ivec2(row,0),0).rg;
 return span.x>0.&&cell.x>=span.x&&cell.x<span.y;
}
`

export interface ViewPickCandidate {
  point: { x: number; z: number }
  object: THREE.Object3D
  depth: number
  triangle: number
  instance: number
}
interface PickSubmissionState {
  revision: number
  position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute
  positionVersion: number
  index: THREE.BufferAttribute | null
  indexVersion: number
  drawStart: number
  drawCount: number
  instances: number
  instanceVersion: number
  matrix: string
  cells: Uint32Array
}

export class RenderView {
  groundPickCache = new WeakMap<
    THREE.Object3D,
    Map<
      number,
      {
        key: string
        position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute
        world: THREE.Vector3[]
        screen: THREE.Vector4[]
      }
    >
  >()
  pickSubmissions = new WeakMap<THREE.Object3D, PickSubmissionState>()

  painter = new Painter(this)
  materials = new WeakMap<
    THREE.Material,
    {
      owner: THREE.Object3D
      compile: THREE.Material['onBeforeCompile']
      programKey: string
    }
  >()
  terrainHeights: [number, number] = [0, 63]
  config = cameraConfig(0)
  projection: Projection = {
    ...this.config,
    matrix: cameraMatrix(0, this.config.pitch),
    centerX: 320,
    centerY: 256,
    fractionX: 4,
    fractionY: 4,
    pixelScaleX: 0.0625,
    pixelScaleY: 0.0625,
  }
  center = { x: 0, y: 0 }
  angle = 0
  rawCenter = { x: 0, y: 0 }
  overview = false
  bounds = circularMeshBounds(50)
  boundsTexture = new THREE.DataTexture(
    new Float32Array(444),
    222,
    1,
    THREE.RGFormat,
    THREE.FloatType
  )
  uniforms = {
    nativePainter: { value: this.painter.texture },
    nativeBasis: { value: new Int32Array(9) },
    nativeSettings: { value: new Int32Array(4) },
    nativeScreen: { value: new Int32Array(4) },
    nativeCenter: { value: new Int32Array(2) },
    nativeRawCenter: { value: new Int32Array(2) },
    nativeMode: { value: 1 },
    nativeBounds: { value: this.boundsTexture },
  }
  update(
    width: number,
    height: number,
    point: { x: number; z: number },
    heading: number,
    zoom: number,
    overview: boolean,
    screenWidth = width,
    config?: CameraConfig
  ) {
    width = Math.max(1, Math.round(width))
    height = Math.max(1, Math.round(height))
    this.overview = overview
    this.config =
      config ?? cameraConfig(cameraConfigIndex(Math.round(screenWidth), height), Math.round(zoom))
    this.rawCenter = { x: Math.round((point.x + 8) * 256), y: Math.round((-point.z - 8) * 256) }
    this.center = { x: this.rawCenter.x & 65535, y: this.rawCenter.y & 65535 }
    const angle = Math.round((heading * 1024) / Math.PI) & 2047,
      matrix = cameraMatrix(angle, this.config.pitch)
    this.angle = angle
    this.projection = {
      ...this.projection,
      ...this.config,
      width,
      height,
      matrix,
      centerX: (width >> 1) + this.config.offsetX,
      centerY: (height >> 1) + this.config.offsetY,
    }
    this.bounds =
      this.config.boundsMode === 1
        ? polygonMeshBounds(
            widenGroundBounds(this.config, width, height, this.terrainHeights),
            angle
          )
        : circularMeshBounds(this.config.diameter)
    const pixels = this.boundsTexture.image.data as Float32Array
    for (let i = 0; i < 222; i++) pixels.set(this.bounds[i], i * 2)
    this.boundsTexture.needsUpdate = true
    this.uniforms.nativeBasis.value.set(matrix)
    this.uniforms.nativeSettings.value.set([
      this.config.curvature,
      this.config.depth,
      this.config.perspective,
      this.config.scale,
    ])
    this.uniforms.nativeScreen.value.set([
      width,
      height,
      this.projection.centerX,
      this.projection.centerY,
    ])
    this.uniforms.nativeCenter.value.set([this.center.x, this.center.y])
    this.uniforms.nativeMode.value = overview ? 0 : 1
    this.uniforms.nativeRawCenter.value.set([this.rawCenter.x, this.rawCenter.y])
  }
  relative(p: { x: number; z: number }, height: number, unwrapped = false) {
    const x = Math.round((p.x + 8) * 256),
      y = Math.round((-p.z - 8) * 256)
    return {
      x: unwrapped ? (x - this.rawCenter.x) >> 1 : relativeCoordinate(x, this.center.x),
      y: Math.round(height * 45),
      z: unwrapped ? (y - this.rawCenter.y) >> 1 : relativeCoordinate(y, this.center.y),
    }
  }
  globeBlend = 0
  globeFlatScale = 21
  get globe() {
    return {
      ...this.center,
      width: this.projection.width,
      height: this.projection.height,
      blend: this.globeBlend,
      flatScale: this.globeFlatScale,
    }
  }
  visible(p: { x: number; z: number }, unwrapped = false) {
    if (this.overview)
      return globeVisible(this.center, Math.round((p.x + 8) * 256), Math.round((-p.z - 8) * 256))
    return meshCellVisible(
      this.bounds,
      { x: Math.round((p.x + 8) * 256), y: Math.round((-p.z - 8) * 256) },
      unwrapped ? this.rawCenter : this.center,
      unwrapped
    )
  }
  project(p: { x: number; z: number }, height: number) {
    return projectPoint(this.relative(p, height), this.projection)
  }
  screen(world: THREE.Vector3, _camera: THREE.Camera, unwrapped = false) {
    if (!this.overview) {
      const p = projectPoint(this.relative(world, (world.y * 128) / 45, unwrapped), this.projection)
      return new THREE.Vector4(
        (p.screenX * 2) / this.projection.width - 1,
        1 - (p.screenY * 2) / this.projection.height,
        (p.z + this.config.depth) / 16384 - 1,
        1
      )
    }
    const p = globePoint(
      this.globe,
      Math.round((world.x + 8) * 256),
      Math.round((-world.z - 8) * 256)
    )
    return new THREE.Vector4(
      (p.x * 2) / this.projection.width - 1,
      1 - (p.y * 2) / this.projection.height,
      this.visible(world) ? 0 : 2,
      1
    )
  }

  // Cache identity for the terrain that is actually submitted to the painter.
  // updateTerrainVisibility rewrites the same index buffer each render, so its raw
  // BufferAttribute version is not a stable cache key. Compare the submitted cell
  // list when that version changes and retain a revision while the contents match.
  pickSubmissionKey(objects: THREE.Object3D[]) {
    const keys: string[] = []
    for (const root of objects)
      root.traverseVisible(object => {
        if (!(object instanceof THREE.Mesh) || !object.visible) return
        object.updateWorldMatrix(true, false)
        const geometry = object.geometry,
          position = geometry.getAttribute('position'),
          index = geometry.getIndex(),
          positionVersion = 'data' in position ? position.data.version : position.version,
          drawStart = geometry.drawRange.start,
          drawCount = index ? Math.min(index.count, geometry.drawRange.count) : position.count,
          instances = object instanceof THREE.InstancedMesh ? object.count : 1,
          instanceVersion =
            object instanceof THREE.InstancedMesh ? object.instanceMatrix.version : -1,
          matrix = object.matrixWorld.elements.join(',')
        const cached = this.pickSubmissions.get(object)
        let same =
          !!cached &&
          cached.position === position &&
          cached.positionVersion === positionVersion &&
          cached.index === index &&
          cached.drawStart === drawStart &&
          cached.drawCount === drawCount &&
          cached.instances === instances &&
          cached.instanceVersion === instanceVersion &&
          cached.matrix === matrix
        let cells = cached?.cells ?? new Uint32Array(0)
        if (same && index && index.version !== cached!.indexVersion) {
          if (object.userData.terrainGrid) {
            const count = Math.ceil(drawCount / 6)
            if (cells.length !== count) same = false
            else
              for (let i = 0; i < count; i++)
                if (cells[i] !== index.getX(i * 6)) {
                  same = false
                  break
                }
          } else same = false
        }
        if (!same) {
          if (index && object.userData.terrainGrid) {
            const count = Math.ceil(drawCount / 6)
            cells = new Uint32Array(count)
            for (let i = 0; i < count; i++) cells[i] = index.getX(i * 6)
          } else cells = new Uint32Array(0)
        }
        const revision = same ? cached!.revision : (cached?.revision ?? 0) + 1
        this.pickSubmissions.set(object, {
          revision,
          position,
          positionVersion,
          index,
          indexVersion: index?.version ?? -1,
          drawStart,
          drawCount,
          instances,
          instanceVersion,
          matrix,
          cells,
        })
        keys.push(`${object.id}:${revision}`)
      })
    return keys.join('|')
  }

  // Pick the projected triangles themselves. A straight 3D ray cannot invert the
  // native nonlinear surface. The globe supplies its own native inverse. Keep
  // geometric candidates separate from painter depth so a cached pixel can be
  // re-resolved when building footprints or other painter ordering changes.
  pickCandidates(
    mouse: THREE.Vector2,
    objects: THREE.Object3D[],
    camera: THREE.Camera,
    nativeEdges = false
  ): ViewPickCandidate[] {
    if (this.overview) {
      const p = globePick(
        this.globe,
        Math.trunc(((mouse.x + 1) * this.projection.width) / 2),
        Math.trunc(((1 - mouse.y) * this.projection.height) / 2)
      )
      return p && objects[0]
        ? [
            {
              point: {
                x: (((p.x - 2048) << 16) >> 16) / 256,
                z: -(((p.y + 2048) << 16) >> 16) / 256,
              },
              object: objects[0],
              depth: 0,
              triangle: 0,
              instance: 0,
            },
          ]
        : []
    }
    const candidates: ViewPickCandidate[] = []
    for (const root of objects)
      root.traverseVisible(object => {
        if (!(object instanceof THREE.Mesh) || !object.visible) return
        object.updateWorldMatrix(true, false)
        if (!nativeEdges) this.updateTerrainVisibility(object)
        const geometry = object.geometry,
          position = geometry.getAttribute('position'),
          index = geometry.getIndex()
        const copies = object instanceof THREE.InstancedMesh ? object.count : 1
        for (let instance = 0; instance < copies; instance++) {
          const transform = object.matrixWorld.clone()
          if (object instanceof THREE.InstancedMesh) {
            const local = new THREE.Matrix4()
            object.getMatrixAt(instance, local)
            transform.multiply(local)
            if (!this.overview) {
              if (!geometry.boundingBox) geometry.computeBoundingBox()
              const box = geometry.boundingBox!.clone().applyMatrix4(transform),
                x = this.rawCenter.x / 256 - 8,
                z = -this.rawCenter.y / 256 - 8
              if (
                box.max.x < x - 128 ||
                box.min.x > x + 128 ||
                box.max.z < z - 128 ||
                box.min.z > z + 128
              )
                continue
            }
          }
          const cacheKey = nativeEdges
            ? [
                this.rawCenter.x,
                this.rawCenter.y,
                ...Object.values(this.projection),
                ...transform.elements,
                'version' in position ? position.version : position.data.version,
              ].join(',')
            : ''
          const cache = this.groundPickCache.get(object)?.get(instance)
          const reuse = nativeEdges && cache?.key === cacheKey && cache.position === position
          const world: THREE.Vector3[] = reuse ? cache.world : [],
            screen: THREE.Vector4[] = reuse ? cache.screen : [],
            scale = object.userData.nativeScale
          const origin = new THREE.Vector3().setFromMatrixPosition(transform),
            basis = modelMatrix(
              object.parent?.userData.nativeHeading ?? 0,
              object.parent?.userData.nativeTilt ?? 0,
              object.parent?.userData.nativeRoll ?? 0
            ),
            unwrapped = !!object.userData.nativeRelative
          const count = index ? Math.min(index.count, geometry.drawRange.count) : position.count
          for (let vertex = 0; vertex < count; vertex++) {
            const i = index ? index.getX(vertex) : vertex
            if (screen[i]) continue
            let p = new THREE.Vector3().fromBufferAttribute(position, i)
            if (scale) {
              const raw = [
                Math.round(p.x * scale * 3),
                Math.round(p.y * scale * 3),
                Math.round(-p.z * scale * 3),
              ]
              const q = modelPoint(raw, object.userData.nativeSize ?? scale, basis, {
                x: 0,
                y: 0,
                z: 0,
              })
              p = new THREE.Vector3(q.x, q.y, -q.z).multiplyScalar(1 / 128).add(origin)
            } else p.applyMatrix4(transform)
            world[i] = p
            screen[i] = this.screen(p, camera, unwrapped)
          }
          if (nativeEdges && !reuse) {
            let entries = this.groundPickCache.get(object)
            if (!entries) this.groundPickCache.set(object, (entries = new Map()))
            entries.set(instance, { key: cacheKey, position, world, screen })
          }
          for (let i = 0; i < count; i += 3) {
            const ids = index
              ? [index.getX(i), index.getX(i + 1), index.getX(i + 2)]
              : [i, i + 1, i + 2]
            const [a, b, c] = ids.map(id => screen[id])
            // Reject distant triangles before allocating pixel-edge test inputs.
            // One pixel of padding preserves native nearest-even rounding.
            if (
              nativeEdges &&
              (mouse.x < Math.min(a.x, b.x, c.x) - 2 / this.projection.width ||
                mouse.x > Math.max(a.x, b.x, c.x) + 2 / this.projection.width ||
                mouse.y < Math.min(a.y, b.y, c.y) - 2 / this.projection.height ||
                mouse.y > Math.max(a.y, b.y, c.y) + 2 / this.projection.height)
            )
              continue
            if (
              [a, b, c].every(p => p.z < -1) ||
              [a, b, c].every(p => p.z > 1) ||
              [a, b, c].some(p => p.w <= 0)
            )
              continue
            const determinant = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y)
            if (Math.abs(determinant) < 1e-12) continue
            const u = ((b.y - c.y) * (mouse.x - c.x) + (c.x - b.x) * (mouse.y - c.y)) / determinant,
              v = ((c.y - a.y) * (mouse.x - c.x) + (a.x - c.x) * (mouse.y - c.y)) / determinant,
              t = 1 - u - v
            if (nativeEdges) {
              const { width, height } = this.projection
              if (
                !inHitTriangle(
                  {
                    x: Math.trunc(((mouse.x + 1) * width) / 2),
                    y: Math.trunc(((1 - mouse.y) * height) / 2),
                  },
                  [c, b, a].map(p => ({
                    x: ((p.x + 1) * width) / 2,
                    y: ((1 - p.y) * height) / 2,
                  })),
                  true
                )
              )
                continue
            } else if (u < 0 || v < 0 || t < 0) continue
            const weights = [u / a.w, v / b.w, t / c.w],
              sum = weights.reduce((total, weight) => total + weight),
              p = new THREE.Vector3()
            ids.forEach((id, j) => p.addScaledVector(world[id], weights[j] / sum))
            if (!this.overview && !this.visible(p, unwrapped)) continue
            const wrap = (n: number) => ((((n + 128) % 256) + 256) % 256) - 128
            candidates.push({
              point: { x: wrap(p.x), z: wrap(p.z) },
              object,
              depth: u * a.z + v * b.z + t * c.z,
              triangle: ids[0] / 3,
              instance,
            })
          }
        }
      })
    return candidates
  }

  resolvePickCandidates(candidates: ViewPickCandidate[]) {
    let best: ViewPickCandidate | null = null
    for (const candidate of candidates) {
      const depth =
        (!this.overview
          ? this.painter.depth(candidate.object, candidate.triangle, candidate.instance)
          : null) ?? candidate.depth
      if (depth < -1 || depth > 1 || (best && depth >= best.depth)) continue
      best = { ...candidate, depth }
    }
    return best
  }

  pick(mouse: THREE.Vector2, objects: THREE.Object3D[], camera: THREE.Camera, nativeEdges = false) {
    return this.resolvePickCandidates(this.pickCandidates(mouse, objects, camera, nativeEdges))
  }
  updateTerrainVisibility(object: THREE.Object3D) {
    if (!(object instanceof THREE.Mesh) || !object.userData.terrainGrid) return
    if (object instanceof THREE.InstancedMesh) {
      const tiles = this.overview
          ? terrainTiles
          : visibleTerrainCopies(this.bounds, this.rawCenter),
        matrices = object.instanceMatrix.array
      if (
        object.count !== tiles.length ||
        tiles.some(
          ([x, z], i) => matrices[i * 16 + 12] !== x * 256 || matrices[i * 16 + 14] !== z * 256
        )
      ) {
        const matrix = new THREE.Matrix4()
        tiles.forEach(([x, z], i) =>
          object.setMatrixAt(i, matrix.makeTranslation(x * 256, 0, z * 256))
        )
        object.instanceMatrix.needsUpdate = true
        object.count = tiles.length
      }
    }
    const geometry = object.geometry,
      vertices = geometry.getAttribute('position').count
    if (!geometry.index) geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(vertices), 1))
    const index = geometry.index!,
      cells = this.overview ? null : visibleTerrainCells(this.bounds, this.rawCenter)
    let count = 0
    for (let cell = 0; cell < vertices / 6; cell++) {
      if (cells && !cells[cell]) continue
      for (let vertex = cell * 6; vertex < cell * 6 + 6; vertex++) index.setX(count++, vertex)
    }
    index.needsUpdate = true
    geometry.setDrawRange(0, count)
  }
  prepare(scene: THREE.Scene) {
    scene.onBeforeRender = renderer => {
      scene.traverseVisible(object => this.updateTerrainVisibility(object))
      if (!this.overview) {
        this.painter.update(scene, renderer)
      }
    }
    scene.onAfterRender = () => {
      this.painter.afterRender()
    }
    scene.traverse(object => {
      if (object.userData.nativeIgnore) return
      if (
        !(
          object instanceof THREE.Mesh ||
          object instanceof THREE.Sprite ||
          object instanceof THREE.Line
        )
      )
        return
      object.frustumCulled = false
      if (object instanceof THREE.Mesh && object.geometry.index && !object.userData.terrainGrid) {
        const indexed = object.geometry
        object.geometry = indexed.toNonIndexed()
        indexed.dispose()
      }
      // Each object needs its own native uniforms. Retain shared textures and
      // cached programs while giving shared source materials separate draw state.
      const ownMaterial = (material: THREE.Material) => {
        const state = this.materials.get(material)
        if (!state || state.owner === object) return material
        const copy = material.clone()
        copy.onBeforeCompile = state.compile
        copy.customProgramCacheKey = () => state.programKey
        return copy
      }
      object.material = Array.isArray(object.material)
        ? object.material.map(ownMaterial)
        : ownMaterial(object.material)
      object.onBeforeRender = (_renderer, _scene, _camera, _geometry, material) => {
        const local = material.userData.nativeUniforms
        if (!local) return
        if (object.userData.atlasTransform)
          local.nativeAtlasTransform.value = object.userData.atlasTransform
        local.nativePainterRange.value.set(
          !this.overview ? (this.painter.ranges.get(object) ?? [-1, 0]) : [-1, 0]
        )
        local.nativeModelScale.value = object.userData.nativeScale ?? 0
        local.nativeObjectScale.value =
          object.userData.nativeSize ?? object.userData.nativeScale ?? 0
        local.nativeRelative.value = object.userData.nativeRelative ? 1 : 0
        const cell = object.parent?.userData.cellPosition
        local.nativeCellAnchor.value.set(cell?.x ?? 0, 0, cell?.z ?? 0, cell ? 1 : 0)
        local.nativeObjectBasis.value.set(
          modelMatrix(
            object.parent?.userData.nativeHeading ?? 0,
            object.parent?.userData.nativeTilt ?? 0,
            object.parent?.userData.nativeRoll ?? 0
          )
        )
      }
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (this.materials.has(material)) continue
        material.fog = false
        const local = {
          nativePainterRange: { value: new Int32Array([-1, 0]) },
          nativePainterSprite: { value: object instanceof THREE.Sprite ? 1 : 0 },
          nativeModelScale: { value: object.userData.nativeScale ?? 0 },
          nativeObjectScale: { value: object.userData.nativeScale ?? 0 },
          nativeRelative: { value: object.userData.nativeRelative ? 1 : 0 },
          nativeCellAnchor: { value: new THREE.Vector4() },
          nativeObjectBasis: { value: new Int32Array(modelMatrix(0)) },
          nativeAtlasTransform: {
            value: object.userData.atlasTransform ?? new THREE.Vector4(1, 1, 0, 0),
          },
        }
        material.userData.nativeUniforms = local
        const compile = material.onBeforeCompile.bind(material),
          programKey = material.customProgramCacheKey(),
          encodedColors =
            material instanceof THREE.MeshBasicMaterial && !!material.map?.userData.encodedColors
        this.materials.set(material, { owner: object, compile, programKey })
        material.onBeforeCompile = (
          shader: Parameters<THREE.Material['onBeforeCompile']>[0],
          renderer: THREE.WebGLRenderer
        ) => {
          compile(shader, renderer)
          // Filter original palette bytes first. Decode the result only when
          // entering Three's material pipeline, which re-encodes at output.
          if (encodedColors)
            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <map_fragment>',
              THREE.ShaderChunk.map_fragment.replace(
                'diffuseColor *= sampledDiffuseColor;',
                'diffuseColor *= sRGBTransferEOTF(sampledDiffuseColor);'
              )
            )
          Object.assign(shader.uniforms, this.uniforms, local)
          shader.vertexShader = nativeVertexShader + shader.vertexShader
          if (object instanceof THREE.Sprite) {
            // Per-draw UVs retain independent frames without cloning/re-uploading the atlas.
            if (object.userData.atlasTransform)
              shader.vertexShader =
                'uniform vec4 nativeAtlasTransform;\n' +
                shader.vertexShader.replace(
                  '#include <uv_vertex>',
                  '#include <uv_vertex>\nvMapUv = uv * nativeAtlasTransform.xy + nativeAtlasTransform.zw;'
                )
            shader.vertexShader = shader.vertexShader.replace(
              'gl_Position = projectionMatrix * mvPosition;',
              'gl_Position=nativePosition(vec3(0.)); gl_Position.xy+=rotatedPosition*vec2(2./float(nativeScreen.x),2./float(nativeScreen.y))*gl_Position.w;'
            )
          } else if (material instanceof THREE.ShaderMaterial) {
            shader.vertexShader = shader.vertexShader.replace(
              /gl_Position\s*=\s*projectionMatrix\s*\*\s*modelViewMatrix\s*\*\s*vec4\((position|p),\s*1\.?0?\);/g,
              'gl_Position=nativePosition($1);'
            )
          } else
            shader.vertexShader = shader.vertexShader.replace(
              '#include <project_vertex>',
              `vec4 mvPosition=vec4(transformed,1.);
              #ifdef USE_INSTANCING
              mvPosition=instanceMatrix*mvPosition;
              #endif
              mvPosition=modelViewMatrix*mvPosition;gl_Position=nativePosition(transformed);`
            )
          shader.fragmentShader =
            fragment +
            shader.fragmentShader
              .replace(
                'void main() {',
                'void main() { if(nativeMode>0.&&!nativeCellVisible())discard;'
              )
              .replace(
                'void main(){',
                'void main(){if(nativeMode>0.&&!nativeCellVisible())discard;'
              )
        }
        material.customProgramCacheKey = () =>
          `${object instanceof THREE.Sprite ? 'native-sprite' : 'native-mesh'}-${encodedColors}-${!!object.userData.atlasTransform}-${programKey}`
        material.needsUpdate = true
      }
    })
  }
  dispose() {
    this.boundsTexture.dispose()
    this.painter.texture.dispose()
  }
}
