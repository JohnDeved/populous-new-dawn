import { selectorWorlds } from './world-selector-data.ts'
import {
  bodyDepth,
  projectPoint,
  type SceneCamera,
  type ScenePoint,
} from './world-selector-motion.ts'
import {
  createPointStars,
  orbitRibbon,
  orbitState,
  projectStar,
  sceneGlobeMesh,
  sceneOrbits,
  sceneVertex,
  sunAnnulus,
  SunWobble,
  type SceneVertex,
} from './world-selector-geometry.ts'

// Page-lifetime recovery namespace. Returning to the selector after a successful
// Retry must not revert to the original URL whose decoded image may be corrupt.
// Only an explicit recovery load rotates it; asynchronous callbacks never do.
let textureRecoveryQuery = ''

const vertexSource = `#version 300 es
in vec3 position;
in float reciprocalW;
in vec2 uv;
in vec4 color;
in float specular;
uniform float pointSize;
uniform vec2 frameScale;
out vec2 textureUV;
out vec4 vertexColor;
out float vertexSpecular;
void main() {
  float w = 1.0 / reciprocalW;
  gl_Position = vec4((position.x / 320.0 - 1.0) * frameScale.x * w,
    (1.0 - position.y / 240.0) * frameScale.y * w, (position.z * 2.0 - 1.0) * w, w);
  gl_PointSize = pointSize;
  textureUV = uv; vertexColor = color; vertexSpecular = specular;
}`
const fragmentSource = `#version 300 es
precision highp float;
uniform sampler2D surface;
in vec2 textureUV;
in vec4 vertexColor;
in float vertexSpecular;
out vec4 result;
void main() {
  vec4 sampleColor = texture(surface, textureUV);
  result = vec4(min(vec3(1.0), sampleColor.rgb * vertexColor.rgb + vertexSpecular),
    sampleColor.a * vertexColor.a);
}`

// One retained GPU stream and a bounded CPU staging buffer. No per-pixel CPU
// rasterization, GPU readback, renderer scene graph or new dependency is required.
export class SelectorRenderer {
  private gl: WebGL2RenderingContext
  private program: WebGLProgram
  private buffer: WebGLBuffer
  private vao: WebGLVertexArrayObject
  private textures = new Map<string, WebGLTexture>()
  private images = new Map<HTMLImageElement, () => void>()
  private stream = new Float32Array(65536 * 11)
  private pointSize: WebGLUniformLocation | null
  private frameScale: WebGLUniformLocation | null
  private horizontalExpansion = 0
  private disposed = false
  private stars = createPointStars()
  readonly sun = new SunWobble()
  readonly canvas: HTMLCanvasElement
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: true,
      preserveDrawingBuffer: false,
    })
    if (!gl) throw new Error('WebGL2 unavailable')
    this.gl = gl
    const shaders: WebGLShader[] = []
    const program = gl.createProgram(),
      buffer = gl.createBuffer(),
      vao = gl.createVertexArray()
    if (!program || !buffer || !vao) {
      gl.deleteProgram(program)
      gl.deleteBuffer(buffer)
      gl.deleteVertexArray(vao)
      throw new Error('Scene allocation failed')
    }
    this.program = program
    this.buffer = buffer
    this.vao = vao
    try {
      for (const [type, source] of [
        [gl.VERTEX_SHADER, vertexSource],
        [gl.FRAGMENT_SHADER, fragmentSource],
      ] as const) {
        const shader = gl.createShader(type)
        if (!shader) throw new Error('Scene shader allocation failed')
        shaders.push(shader)
        gl.shaderSource(shader, source)
        gl.compileShader(shader)
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
          throw new Error('Scene shader compilation failed')
        gl.attachShader(program, shader)
      }
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw new Error('Scene shader linking failed')
      gl.useProgram(program)
      gl.bindVertexArray(vao)
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, this.stream.byteLength, gl.DYNAMIC_DRAW)
      for (const [name, size, offset] of [
        ['position', 3, 0],
        ['reciprocalW', 1, 3],
        ['uv', 2, 4],
        ['color', 4, 6],
        ['specular', 1, 10],
      ] as const) {
        const location = gl.getAttribLocation(program, name)
        gl.enableVertexAttribArray(location)
        gl.vertexAttribPointer(location, size, gl.FLOAT, false, 44, offset * 4)
      }
      gl.uniform1i(gl.getUniformLocation(program, 'surface'), 0)
      this.pointSize = gl.getUniformLocation(program, 'pointSize')
      this.frameScale = gl.getUniformLocation(program, 'frameScale')
      const white = this.makeTexture('white')
      gl.bindTexture(gl.TEXTURE_2D, white)
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([255, 255, 255, 255])
      )
      gl.enable(gl.DEPTH_TEST)
      gl.depthFunc(gl.LEQUAL)
      gl.depthMask(true)
      gl.disable(gl.CULL_FACE)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      gl.clearColor(0, 0, 0, 1)
    } catch (error) {
      this.dispose()
      throw error
    } finally {
      for (const shader of shaders) gl.deleteShader(shader)
    }
  }
  private makeTexture(name: string) {
    const gl = this.gl,
      texture = gl.createTexture()
    if (!texture) throw new Error('Scene texture allocation failed')
    this.textures.set(name, texture)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
    return texture
  }
  async load(retry = false) {
    // Explicit reload attempts must not reuse a previously decoded corrupt
    // image. A fresh token also remains distinct across selector remounts.
    // Loads before any recovery retain static URLs. Later remounts inherit the
    // latest namespace, captured once so overlapping loads stay independent.
    if (retry) textureRecoveryQuery = `?retry=${crypto.randomUUID()}`
    const query = textureRecoveryQuery
    await Promise.all(
      ['sun', 'ring', ...selectorWorlds.slice(1).map(body => `mission-${body.mission}`)].map(
        name =>
          new Promise<void>((resolve, reject) => {
            const image = new Image()
            this.images.set(image, resolve)
            image.onload = () => {
              this.images.delete(image)
              if (this.disposed) {
                resolve()
                return
              }
              try {
                const expected = name === 'ring' ? 64 : 128
                if (image.naturalWidth !== expected || image.naturalHeight !== expected)
                  throw new Error('Invalid scene texture dimensions')
                const gl = this.gl
                this.makeTexture(name)
                gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE)
                gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
                resolve()
              } catch (error) {
                reject(error)
              }
            }
            image.onerror = () => {
              this.images.delete(image)
              reject(new Error(`Scene texture unavailable: ${name}`))
            }
            image.src = `/original/world-selector/globes/${name}.png${query}`
          })
      )
    )
  }
  resize() {
    const box = this.canvas.getBoundingClientRect()
    // Bound backing allocation independently of logical projection/tessellation.
    const scale = Math.min(window.devicePixelRatio || 1, 4096 / Math.max(box.width, box.height))
    const width = Math.max(1, Math.round(box.width * scale)),
      height = Math.max(1, Math.round(box.height * scale))
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width
      this.canvas.height = height
    }
    this.gl.viewport(0, 0, width, height)
    // Keep the native 640×480 composition at a uniform scale, revealing more
    // scene horizontally on wide displays rather than stretching the globes.
    // Use CSS dimensions so DPR and rounded backing sizes cannot move the art
    // relative to the DOM panel. Point size alone is measured in backing pixels.
    const logicalScale = Math.min(box.width / 640, box.height / 480)
    this.horizontalExpansion =
      logicalScale > 0 ? Math.max(0, (box.width / logicalScale - 640) / 2) : 0
    this.gl.uniform2f(
      this.frameScale,
      (640 * logicalScale) / Math.max(1, box.width),
      (480 * logicalScale) / Math.max(1, box.height)
    )
    this.gl.uniform1f(this.pointSize, logicalScale * scale)
  }
  private submit(
    vertices: readonly SceneVertex[],
    indices: readonly number[] | undefined,
    texture: string,
    blend: boolean,
    points = false
  ) {
    const gl = this.gl
    const count = indices?.length ?? vertices.length
    if (count === 0) return
    if (count * 11 > this.stream.length) throw new Error('Scene stream capacity exceeded')
    let offset = 0
    for (let i = 0; i < count; i++) {
      const v = vertices[indices ? indices[i] : i]
      this.stream[offset] = v.x
      this.stream[offset + 1] = v.y
      this.stream[offset + 2] = v.depth
      this.stream[offset + 3] = v.rhw
      this.stream[offset + 4] = v.u
      this.stream[offset + 5] = v.v
      this.stream[offset + 6] = v.red / 255
      this.stream[offset + 7] = v.green / 255
      this.stream[offset + 8] = v.blue / 255
      this.stream[offset + 9] = v.alpha / 255
      this.stream[offset + 10] = v.specular / 255
      offset += 11
    }
    if (blend) gl.enable(gl.BLEND)
    else gl.disable(gl.BLEND)
    gl.bindTexture(gl.TEXTURE_2D, this.textures.get(texture) ?? null)
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.stream.subarray(0, offset))
    gl.drawArrays(points ? gl.POINTS : gl.TRIANGLES, 0, count)
  }
  advanceSun(positions: readonly ScenePoint[], camera: SceneCamera, seconds: number) {
    const projected = projectPoint(positions[0], camera)
    const depth = bodyDepth(150, projected.depth, camera)
    if (projected.depth > 10 && depth.front > 10)
      this.sun.advance(sceneGlobeMesh((400 * 150) / projected.depth).vertices.length, seconds)
  }
  render(
    positions: readonly ScenePoint[],
    camera: SceneCamera,
    elapsed: number,
    progressionAnchor: number
  ) {
    if (this.disposed) return
    const gl = this.gl
    this.resize()
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    for (const body of selectorWorlds) {
      const p = projectPoint(positions[body.index], camera),
        depth = bodyDepth(body.radius, p.depth, camera)
      if (p.depth <= 10 || depth.front <= 10) continue
      const radius = (400 * body.radius) / p.depth,
        mesh = sceneGlobeMesh(radius)
      const vertices = mesh.vertices.map((vertex, index) => {
        const value = sceneVertex(
          p.x + radius * vertex.x,
          p.y + radius * vertex.y,
          depth.base + depth.delta * Math.hypot(vertex.x, vertex.y),
          vertex.diffuse
        )
        value.specular = vertex.specular
        value.rhw = 1 / (value.depth + 0.05)
        value.u =
          body.index === 0
            ? 2 * vertex.u + Math.fround(0.03) * Math.cos(this.sun.phasesU[index])
            : vertex.u + elapsed * 0.6
        value.v =
          body.index === 0
            ? 2 * vertex.v + Math.fround(0.03) * Math.cos(this.sun.phasesV[index])
            : vertex.v
        return value
      })
      this.submit(
        vertices,
        mesh.triangles,
        body.index === 0 ? 'sun' : `mission-${body.mission}`,
        false
      )
      if (body.index === 0) {
        const width = Math.fround(0.2 * radius),
          peak = radius + Math.fround(-0.2 * width)
        for (const [a, b, alphaA, alphaB] of [
          [peak, radius + width, 255, 0],
          [radius - width, peak, 0, 255],
        ]) {
          const halo = sunAnnulus(p.x, p.y, depth.base, a, b, alphaA, alphaB, mesh.fullSegments)
          this.submit(halo.vertices, halo.triangles, 'white', true)
        }
      }
    }
    for (const orbit of sceneOrbits) {
      const ribbon = orbitRibbon(
        positions[orbit.parent],
        orbit.radius,
        orbitState(orbit.members, progressionAnchor),
        camera
      )
      this.submit(ribbon.vertices, ribbon.triangles, 'ring', true)
    }
    let batch: SceneVertex[] = []
    for (const star of this.stars) {
      const vertex = projectStar(star, camera, this.horizontalExpansion)
      if (!vertex) continue
      batch.push(vertex)
      if (batch.length === 128) {
        this.submit(batch, undefined, 'white', false, true)
        batch = []
      }
    }
    this.submit(batch, undefined, 'white', false, true)
  }
  dispose() {
    if (this.disposed) return
    this.disposed = true
    for (const [image, cancel] of this.images) {
      image.onload = null
      image.onerror = null
      image.src = ''
      cancel()
    }
    this.images.clear()
    for (const texture of this.textures.values()) this.gl.deleteTexture(texture)
    this.textures.clear()
    this.gl.deleteBuffer(this.buffer)
    this.gl.deleteVertexArray(this.vao)
    this.gl.deleteProgram(this.program)
  }
}
