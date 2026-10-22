import { prepareHelpVehicle } from './help-preview-vehicle.ts'
import type { HelpVehicleContext } from './help-preview-vehicle.ts'
import type { HelpObjectPreview } from './help-preview.ts'

export type HelpVehicleDrawResult =
  | { status: 'drawn'; triangles: number }
  | { status: 'loading'; reason: 'vehicle-atlas-loading' }
  | { status: 'unsupported'; reason: string }

export interface HelpVehicleCanvas {
  /** Owned, unattached transparent overlay. Caller owns placement/unmount. */
  readonly canvas: HTMLCanvasElement
  draw(request: HelpObjectPreview, context: HelpVehicleContext, atlas: HTMLImageElement): HelpVehicleDrawResult
  /** Required on unmount. Idempotent; never disposes the borrowed atlas. */
  dispose(): void
}

const vertexSource = `#version 300 es
precision highp float;
layout(location=0) in vec3 a_position;
layout(location=1) in vec2 a_uv;
layout(location=2) in vec2 a_color;
uniform vec2 u_size;
out vec2 v_uv;
out vec2 v_color;
void main() {
  // D3D9 and earlier use integer pixel centers; WebGL uses half-integers.
  vec2 screen = a_position.xy + vec2(0.5);
  gl_Position = vec4(screen.x * 2.0 / u_size.x - 1.0,
                     1.0 - screen.y * 2.0 / u_size.y,
                     a_position.z * 2.0 - 1.0, 1.0);
  v_uv = a_uv;
  v_color = a_color;
}`
const fragmentSource = `#version 300 es
precision highp float;
uniform sampler2D u_atlas;
uniform bool u_translucent;
in vec2 v_uv;
in vec2 v_color;
out vec4 outputColor;
void main() {
  vec4 texel = texture(u_atlas, v_uv);
  // Modes3/6: opaque MODULATE. Mode22: MODULATEALPHA with diffuse alpha0xaa.
  // SPECULARENABLE is OFF for this bounded native profile. No world highlight,
  // distance fade, color-space conversion, alpha-test or guessed warm light.
  outputColor = vec4(texel.rgb * v_color.x, u_translucent ? texel.a * v_color.y : 1.0);
}`

/** Inactive, owned WebGL2 adapter for the two native Help vehicles only.
 * No fetch, timer, input handler, live scene, World, shared canvas or renderer.
 * Atlas must be the existing verified ARGB4444/edge-prepared256x1024 asset;
 * loading and lifecycle remain the caller's responsibility. No PNG copies.
 * Current shadeTable/vertex offsets and the supported profile are explicit.
 * Drawn means commands submitted, not original-frame or GPU-parity acceptance.
 */
export function createHelpVehicleCanvas():
  { status: 'created'; renderer: HelpVehicleCanvas } | { status: 'unsupported'; reason: string } {
  if (typeof document === 'undefined') return { status: 'unsupported', reason: 'vehicle-canvas-unavailable' }
  let canvas: HTMLCanvasElement, webgl: WebGL2RenderingContext | null
  try {
    canvas = document.createElement('canvas')
    canvas.style.pointerEvents = 'none'
    webgl = canvas.getContext('webgl2', {
      alpha: true, antialias: false, depth: true, stencil: false,
      premultipliedAlpha: true, preserveDrawingBuffer: false,
    })
  } catch { return { status: 'unsupported', reason: 'vehicle-canvas-setup-failed' } }
  const gl = webgl
  if (!gl) return { status: 'unsupported', reason: 'vehicle-webgl2-unavailable' }
  let disposed = false
  let program: WebGLProgram | null = null, buffer: WebGLBuffer | null = null
  let texture: WebGLTexture | null = null, vao: WebGLVertexArrayObject | null = null
  const shaders: WebGLShader[] = []
  const dispose = () => {
    if (disposed) return
    disposed = true
    for (const shader of shaders) gl.deleteShader(shader)
    gl.deleteProgram(program); gl.deleteBuffer(buffer)
    gl.deleteTexture(texture); gl.deleteVertexArray(vao)
    canvas.width = 1; canvas.height = 1
  }
  const clear = () => {
    gl.depthMask(true)
    gl.clearColor(0, 0, 0, 0); gl.clearDepth(1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  }
  try {
    program = gl.createProgram(); buffer = gl.createBuffer()
    texture = gl.createTexture(); vao = gl.createVertexArray()
    if (!program || !buffer || !texture || !vao) throw new Error('allocation')
    for (const [type, source] of [[gl.VERTEX_SHADER, vertexSource], [gl.FRAGMENT_SHADER, fragmentSource]] as const) {
      const shader = gl.createShader(type)
      if (!shader) throw new Error('shader-allocation')
      shaders.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('shader-compile')
      gl.attachShader(program, shader)
    }
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('program-link')
    const size = gl.getUniformLocation(program, 'u_size')
    const atlasUniform = gl.getUniformLocation(program, 'u_atlas')
    const translucent = gl.getUniformLocation(program, 'u_translucent')
    if (size === null || atlasUniform === null || translucent === null) throw new Error('uniform')
    gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    for (const [index, count, offset] of [[0, 3, 0], [1, 2, 12], [2, 2, 20]]) {
      gl.enableVertexAttribArray(index)
      gl.vertexAttribPointer(index, count, gl.FLOAT, false, 28, offset)
    }
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    // Only in-tile inset UVs are accepted, so wrapping/cache neighbors cannot
    // affect this subset. Native flag0x80 selects WRAP, not perspective mode.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE)
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL)
    gl.disable(gl.CULL_FACE); gl.disable(gl.SCISSOR_TEST)
    const maxSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number
    if (gl.getParameter(gl.MAX_TEXTURE_SIZE) < 1024 || gl.getError() !== gl.NO_ERROR) throw new Error('gpu-limits')
    let uploaded: HTMLImageElement | undefined, uploadedSrc: string | undefined
    const renderer: HelpVehicleCanvas = { canvas, dispose, draw(request, context, atlas) {
      if (disposed) return { status: 'unsupported', reason: 'vehicle-renderer-disposed' }
      if (gl.isContextLost()) return { status: 'unsupported', reason: 'vehicle-context-lost' }
      const prepared = prepareHelpVehicle(request, context)
      if (prepared.status === 'unsupported') { clear(); return prepared }
      if (context.width > maxSize || context.height > maxSize) {
        clear(); return { status: 'unsupported', reason: 'vehicle-gpu-size-limit' }
      }
      if (!atlas) { clear(); return { status: 'unsupported', reason: 'vehicle-atlas-unavailable' } }
      if (!atlas.complete) { clear(); return { status: 'loading', reason: 'vehicle-atlas-loading' } }
      if (atlas.naturalWidth !== 256 || atlas.naturalHeight !== 1024) {
        clear(); return { status: 'unsupported', reason: 'vehicle-atlas-dimensions' }
      }
      try {
        if (canvas.width !== context.width) canvas.width = context.width
        if (canvas.height !== context.height) canvas.height = context.height
        gl.viewport(0, 0, context.width, context.height); clear()
        gl.useProgram(program); gl.bindVertexArray(vao)
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(gl.ARRAY_BUFFER, prepared.stream.vertices, gl.DYNAMIC_DRAW)
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture)
        const src = atlas.currentSrc || atlas.src
        if (uploaded !== atlas || uploadedSrc !== src) {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, atlas)
          uploaded = atlas; uploadedSrc = src
        }
        gl.uniform2f(size, context.width, context.height); gl.uniform1i(atlasUniform, 0)
        const { opaqueVertices, translucentVertices } = prepared.stream
        // 0047cc60/0047ce50: opaque depth writes, then native-order translucent
        // depth tests WITHOUT writes. Queue depth preserves opaque reordering.
        gl.disable(gl.BLEND); gl.depthMask(true); gl.uniform1i(translucent, 0)
        if (opaqueVertices) gl.drawArrays(gl.TRIANGLES, 0, opaqueVertices)
        gl.enable(gl.BLEND); gl.depthMask(false); gl.uniform1i(translucent, 1)
        gl.blendEquation(gl.FUNC_ADD)
        // RGB matches native SRCALPHA/INVSRCALPHA. Separate alpha retains the
        // premultiplied transparent overlay for browser composition.
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
        if (translucentVertices) gl.drawArrays(gl.TRIANGLES, opaqueVertices, translucentVertices)
        gl.depthMask(true)
        if (gl.getError() !== gl.NO_ERROR) throw new Error('draw')
        return { status: 'drawn', triangles: (opaqueVertices + translucentVertices) / 3 }
      } catch {
        uploaded = undefined; uploadedSrc = undefined; clear()
        return { status: 'unsupported', reason: 'vehicle-gpu-draw-failed' }
      }
    } }
    return { status: 'created', renderer }
  } catch {
    dispose()
    return { status: 'unsupported', reason: 'vehicle-gpu-setup-failed' }
  }
}
