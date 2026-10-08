import * as THREE from 'three'
import {
  BUILDING_ACQUISITION_TRIANGLE_CAPACITY,
  type BuildingAcquisitionTriangle,
} from './building-acquisition-triangles.ts'

type TriangleRenderer = Pick<
  THREE.WebGLRenderer,
  | 'domElement'
  | 'sortObjects'
  | 'setClearColor'
  | 'setPixelRatio'
  | 'setSize'
  | 'clear'
  | 'render'
  | 'dispose'
  | 'forceContextLoss'
>

/** One detached, pooled pass owned by the existing acquisition overlay.
 * The caller supplies mapped corners and composites the returned canvas at the
 * building command. There is no scheduling, projection, or controller mutation. */
export class BuildingAcquisitionTriangleSurface {
  private readonly renderer: TriangleRenderer
  private atlas: THREE.Texture
  private atlasSource: THREE.Texture
  private readonly geometry = new THREE.BufferGeometry()
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.Camera()
  private readonly material: THREE.RawShaderMaterial
  private readonly position = new THREE.BufferAttribute(
    new Float32Array(BUILDING_ACQUISITION_TRIANGLE_CAPACITY * 9),
    3
  )
  private readonly uv = new THREE.BufferAttribute(
    new Float32Array(BUILDING_ACQUISITION_TRIANGLE_CAPACITY * 6),
    2
  )
  private readonly light = new THREE.BufferAttribute(
    new Float32Array(BUILDING_ACQUISITION_TRIANGLE_CAPACITY * 3),
    1
  )
  private readonly cutout = new THREE.BufferAttribute(
    new Float32Array(BUILDING_ACQUISITION_TRIANGLE_CAPACITY * 3),
    1
  )
  private width = 0
  private height = 0
  private ratio = 0
  private disposed = false

  constructor(
    atlas: THREE.Texture,
    createRenderer = (): TriangleRenderer =>
      new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
      })
  ) {
    this.renderer = createRenderer()
    this.renderer.sortObjects = false
    this.renderer.setClearColor(0, 0)
    // Own only the texture wrapper. The existing atlas image/source is shared;
    // disposing this surface must never dispose the world's texture.
    this.atlasSource = atlas
    this.atlas = atlas.clone()
    this.atlas.colorSpace = THREE.NoColorSpace
    this.atlas.minFilter = THREE.LinearFilter
    this.atlas.magFilter = THREE.LinearFilter
    this.atlas.generateMipmaps = false
    this.atlas.anisotropy = 1
    this.material = new THREE.RawShaderMaterial({
      uniforms: { atlas: { value: this.atlas }, shell: { value: new THREE.Vector2() } },
      vertexShader: `
precision highp float;
uniform vec2 shell;
attribute vec3 position;
attribute vec2 uv;
attribute float faceLight;
attribute float alphaCutout;
varying vec2 atlasUV;
varying float diffuse;
varying float cutout;
void main() {
  atlasUV = uv;
  diffuse = faceLight;
  cutout = alphaCutout;
  gl_Position = vec4(position.x * 2.0 / shell.x - 1.0,
    1.0 - position.y * 2.0 / shell.y, 0.0, 1.0);
}`,
      fragmentShader: `
precision highp float;
uniform sampler2D atlas;
varying vec2 atlasUV;
varying float diffuse;
varying float cutout;
void main() {
  vec4 texel = texture2D(atlas, atlasUV);
  // D3DCMP_GREATER, reference127. Accepted texels are opaque, not blended.
  if (cutout > 0.5 && texel.a <= 127.0 / 255.0) discard;
  gl_FragColor = vec4(texel.rgb * diffuse, 1.0);
}`,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending,
      toneMapped: false,
    })
    for (const [name, attribute] of [
      ['position', this.position],
      ['uv', this.uv],
      ['faceLight', this.light],
      ['alphaCutout', this.cutout],
    ] as const) {
      attribute.setUsage(THREE.DynamicDrawUsage)
      this.geometry.setAttribute(name, attribute)
    }
    const mesh = new THREE.Mesh(this.geometry, this.material)
    mesh.frustumCulled = false
    this.scene.add(mesh)
  }

  setAtlas(atlas: THREE.Texture) {
    if (this.disposed) throw new Error('Acquisition triangle surface is disposed')
    if (this.atlasSource === atlas) return
    this.atlas.dispose()
    this.atlasSource = atlas
    this.atlas = atlas.clone()
    this.atlas.colorSpace = THREE.NoColorSpace
    this.atlas.minFilter = this.atlas.magFilter = THREE.LinearFilter
    this.atlas.generateMipmaps = false
    this.atlas.anisotropy = 1
    this.material.uniforms.atlas.value = this.atlas
  }

  draw(
    triangles: readonly BuildingAcquisitionTriangle[],
    width: number,
    height: number,
    ratio = 1
  ) {
    if (this.disposed) throw new Error('Acquisition triangle surface is disposed')
    if (triangles.length > BUILDING_ACQUISITION_TRIANGLE_CAPACITY)
      throw new Error('Acquisition triangle capacity exceeded')
    if (!(width > 0 && height > 0 && ratio > 0) || !Number.isFinite(width + height + ratio))
      throw new Error('Invalid acquisition surface size')
    if (this.width !== width || this.height !== height || this.ratio !== ratio) {
      this.width = width
      this.height = height
      this.ratio = ratio
      this.renderer.setPixelRatio(ratio)
      this.renderer.setSize(width, height, false)
      this.material.uniforms.shell.value.set(width, height)
    }
    let vertex = 0
    for (const triangle of triangles) {
      for (const point of triangle.points) {
        this.position.setXYZ(vertex, point.x, point.y, 0)
        this.uv.setXY(vertex, point.u, point.v)
        this.light.setX(vertex, triangle.diffuse / 255)
        this.cutout.setX(vertex, triangle.mode === 7 || triangle.mode === 32 ? 1 : 0)
        vertex++
      }
    }
    for (const attribute of [this.position, this.uv, this.light, this.cutout])
      attribute.needsUpdate = true
    this.geometry.setDrawRange(0, vertex)
    this.renderer.clear()
    if (vertex) this.renderer.render(this.scene, this.camera)
    return this.renderer.domElement
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.geometry.dispose()
    this.material.dispose()
    this.atlas.dispose()
    this.renderer.dispose()
    this.renderer.forceContextLoss()
  }
}
