import * as THREE from 'three'
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
  type Projection,
} from './projection.ts'

// WebGL2 port of the CPU-compared projection. Unsigned operations preserve x86
// wrap explicitly; splitting the final sum avoids premature float32 rounding.
export const nativeVertexShader = `
uniform ivec3 nativeBasis[3];
uniform ivec3 nativeObjectBasis[3];
uniform ivec4 nativeSettings;
uniform ivec4 nativeScreen;
uniform ivec2 nativeCenter;
uniform ivec2 nativeRawCenter;
uniform float nativeModelScale;
uniform float nativeObjectScale;
uniform float nativeRelative;
uniform float nativeMode;
varying vec2 nativeCell;
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
  nativeCell=vec2(origin.xz);
  world=modelMatrix[3].xyz+vec3(p.x-origin.x,p.y-origin.y,-(p.z-origin.z))/128.;
 }else nativeCell=vec2(p.xz);
 if(nativeMode>0.)return nativeProject(p);
 float a=world.x*0.02454369260617026,b=world.z*0.01227184630308513,r=70.+world.y*128./45.;
 vec3 globe=vec3(sin(a)*cos(b)*r,cos(a)*cos(b)*r-70.,sin(b)*r);
 return projectionMatrix*viewMatrix*vec4(globe,1.);
}
`
const fragment = `
uniform float nativeMode;
uniform sampler2D nativeBounds;
uniform vec2 nativeCellFraction;
varying vec2 nativeCell;
bool nativeCellVisible(){
 vec2 cell=(nativeCell+nativeCellFraction)/256.+110.;
 int row=int(floor(cell.y));
 if(row<0||row>=222)return false;
 vec2 span=texelFetch(nativeBounds,ivec2(row,0),0).rg;
 return span.x>0.&&cell.x>=span.x&&cell.x<=span.y;
}
`

export class RenderView {
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
    nativeBasis: { value: new Int32Array(9) },
    nativeSettings: { value: new Int32Array(4) },
    nativeScreen: { value: new Int32Array(4) },
    nativeCenter: { value: new Int32Array(2) },
    nativeRawCenter: { value: new Int32Array(2) },
    nativeMode: { value: 1 },
    nativeBounds: { value: this.boundsTexture },
    nativeCellFraction: { value: new THREE.Vector2() },
  }
  update(
    width: number,
    height: number,
    point: { x: number; z: number },
    heading: number,
    zoom: number,
    overview: boolean,
    screenWidth = width
  ) {
    width = Math.max(1, Math.round(width))
    height = Math.max(1, Math.round(height))
    this.overview = overview
    this.config = cameraConfig(cameraConfigIndex(Math.round(screenWidth), height), Math.round(zoom))
    this.rawCenter = { x: Math.round((point.x + 8) * 256), y: Math.round((-point.z - 8) * 256) }
    this.center = { x: this.rawCenter.x & 65535, y: this.rawCenter.y & 65535 }
    const angle = Math.round((heading * 1024) / Math.PI) & 2047,
      matrix = cameraMatrix(angle, this.config.pitch)
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
        ? polygonMeshBounds(this.config.bounds, angle)
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
    this.uniforms.nativeCellFraction.value.set(
      (this.center.x & 510) >> 1,
      (this.center.y & 510) >> 1
    )
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
  visible(p: { x: number; z: number }, unwrapped = false) {
    const q = this.relative(p, 0, unwrapped),
      x = (q.x + ((this.center.x & 510) >> 1)) / 256 + 110,
      row = Math.floor((q.z + ((this.center.y & 510) >> 1)) / 256) + 110
    const span = this.bounds[row]
    return !!span && span[0] > 0 && x >= span[0] && x <= span[1]
  }
  project(p: { x: number; z: number }, height: number) {
    return projectPoint(this.relative(p, height), this.projection)
  }
  screen(world: THREE.Vector3, camera: THREE.Camera, unwrapped = false) {
    if (!this.overview) {
      const p = projectPoint(this.relative(world, (world.y * 128) / 45, unwrapped), this.projection)
      return new THREE.Vector4(
        (p.screenX * 2) / this.projection.width - 1,
        1 - (p.screenY * 2) / this.projection.height,
        (p.z + this.config.depth) / 16384 - 1,
        1
      )
    }
    const a = (world.x * Math.PI) / 128,
      b = (world.z * Math.PI) / 256,
      r = 70 + (world.y * 128) / 45
    const v = new THREE.Vector4(
      Math.sin(a) * Math.cos(b) * r,
      Math.cos(a) * Math.cos(b) * r - 70,
      Math.sin(b) * r,
      1
    )
      .applyMatrix4(camera.matrixWorldInverse)
      .applyMatrix4(camera.projectionMatrix)
    return new THREE.Vector4(v.x / v.w, v.y / v.w, v.z / v.w, v.w)
  }
  // Pick the projected triangles themselves. A straight 3D ray cannot invert the
  // native nonlinear surface; affine ground view and perspective overview differ.
  pick(mouse: THREE.Vector2, objects: THREE.Object3D[], camera: THREE.Camera) {
    let best: { point: { x: number; z: number }; object: THREE.Object3D; depth: number } | null =
      null
    for (const root of objects)
      root.traverseVisible(object => {
        if (!(object instanceof THREE.Mesh) || !object.visible) return
        object.updateWorldMatrix(true, false)
        const geometry = object.geometry,
          position = geometry.getAttribute('position'),
          index = geometry.getIndex()
        const copies = object instanceof THREE.InstancedMesh ? object.count : 1
        for (let instance = 0; instance < copies; instance++) {
          const transform = object.matrixWorld.clone()
          if (object instanceof THREE.InstancedMesh) {
            // Only the center tile is needed for the overview's complete sphere.
            if (this.overview && instance !== 0) continue
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
          const world: THREE.Vector3[] = [],
            screen: THREE.Vector4[] = [],
            scale = object.userData.nativeScale
          const origin = new THREE.Vector3().setFromMatrixPosition(transform),
            basis = modelMatrix(object.parent?.userData.nativeHeading ?? 0),
            unwrapped = !!object.userData.nativeRelative
          for (let i = 0; i < position.count; i++) {
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
            world.push(p)
            screen.push(this.screen(p, camera, unwrapped))
          }
          const count = index ? index.count : position.count
          for (let i = 0; i < count; i += 3) {
            const ids = index
              ? [index.getX(i), index.getX(i + 1), index.getX(i + 2)]
              : [i, i + 1, i + 2]
            const [a, b, c] = ids.map(i => screen[i])
            if (
              [a, b, c].every(p => p.z < -1) ||
              [a, b, c].every(p => p.z > 1) ||
              [a, b, c].some(p => p.w <= 0)
            )
              continue
            const determinant = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y)
            if (Math.abs(determinant) < 1e-12) continue
            const u = ((b.y - c.y) * (mouse.x - c.x) + (c.x - b.x) * (mouse.y - c.y)) / determinant
            const v = ((c.y - a.y) * (mouse.x - c.x) + (a.x - c.x) * (mouse.y - c.y)) / determinant,
              t = 1 - u - v
            if (u < 0 || v < 0 || t < 0) continue
            const depth = u * a.z + v * b.z + t * c.z
            if (depth < -1 || depth > 1 || (best && depth >= best.depth)) continue
            const weights = [u / a.w, v / b.w, t / c.w],
              sum = weights.reduce((a, b) => a + b),
              p = new THREE.Vector3()
            ids.forEach((id, j) => p.addScaledVector(world[id], weights[j] / sum))
            if (!this.overview && !this.visible(p, unwrapped)) continue
            const wrap = (n: number) => ((((n + 128) % 256) + 256) % 256) - 128
            best = { point: { x: wrap(p.x), z: wrap(p.z) }, object, depth }
          }
        }
      })
    return best as { point: { x: number; z: number }; object: THREE.Object3D; depth: number } | null
  }
  prepare(scene: THREE.Scene) {
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
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (material.userData.nativeView === this) continue
        material.userData.nativeView = this
        material.fog = false
        const local = {
          nativeModelScale: { value: object.userData.nativeScale ?? 0 },
          nativeObjectScale: { value: object.userData.nativeScale ?? 0 },
          nativeRelative: { value: object.userData.nativeRelative ? 1 : 0 },
          nativeObjectBasis: { value: new Int32Array(modelMatrix(0)) },
        }
        if (object.userData.nativeScale)
          object.onBeforeRender = () => {
            local.nativeObjectScale.value =
              object.userData.nativeSize ?? object.userData.nativeScale
            local.nativeObjectBasis.value.set(
              modelMatrix(object.parent?.userData.nativeHeading ?? 0)
            )
          }
        material.onBeforeCompile = (shader: Parameters<THREE.Material['onBeforeCompile']>[0]) => {
          Object.assign(shader.uniforms, this.uniforms, local)
          shader.vertexShader = nativeVertexShader + shader.vertexShader
          if (object instanceof THREE.Sprite) {
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
              'vec4 mvPosition=modelViewMatrix*vec4(transformed,1.);gl_Position=nativePosition(transformed);'
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
          object instanceof THREE.Sprite ? 'native-sprite' : 'native-mesh'
        material.needsUpdate = true
      }
    })
  }
  dispose() {
    this.boundsTexture.dispose()
  }
}
