import { planHelpObjectPreview } from './help-preview-object.ts'
import type { HelpObjectContext } from './help-preview-object.ts'
import type { HelpObjectPreview } from './help-preview.ts'

export interface HelpVehicleContext extends HelpObjectContext {
  /** Bounded original profile, not a claim about unknown device/settings state:
   * 005218d0 blended-object capability 2 / ARGB4444, 005d54c8 nonzero,
   * 005d56e8=0 and 005d56ec=0x3ff. Other profiles remain unsupported. */
  readonly profile: 'linear-argb4444-alpha2'
  /** Current native float32 offsets, applied AFTER unshifted triangle culling. */
  readonly vertexShiftX: number
  readonly vertexShiftY: number
}

export interface HelpVehicleStream {
  /** Seven floats per vertex: native x,y, queue depth, u,v, diffuse, opacity.
   * Opaque vertices precede translucent vertices. No borrowed data is changed. */
  readonly vertices: Float32Array
  readonly opaqueVertices: number
  readonly translucentVertices: number
}

export type HelpVehicleStreamResult =
  | { status: 'prepared'; stream: HelpVehicleStream }
  | { status: 'unsupported'; reason: string }

/** 0046c800 normalized into the existing 256x1024, 32px-tile atlas.
 * This is only the linear half-texel path. Preserve raw21-bit UV precision. */
export function helpVehicleUV(tile: number, u: number, v: number) {
  return [
    Math.fround(((tile % 8) * 32 + 0.5 + u * 31 / 2097152) / 256),
    Math.fround((Math.floor(tile / 8) * 32 + 0.5 + v * 31 / 2097152) / 1024),
  ]
}

/** Inactive draw prerequisite. This does not change helpPreview readiness.
 * Only one vehicle (143/144), modes3/6/22 and in-tile UVs are admitted.
 * A multi-object ring needs one shared primitive queue, not independent depth
 * resets; it is deliberately outside this adapter. Current shadeTable remains
 * required. Never substitute sunlightShades() or reconstruct it at Help mount. */
export function prepareHelpVehicle(
  request: HelpObjectPreview, context: HelpVehicleContext,
): HelpVehicleStreamResult {
  if (context.profile !== 'linear-argb4444-alpha2')
    return { status: 'unsupported', reason: 'unsupported-vehicle-render-profile' }
  if (![context.vertexShiftX, context.vertexShiftY].every(n =>
    Number.isFinite(n) && Math.abs(n) <= 32767 && Math.fround(n) === n))
    return { status: 'unsupported', reason: 'invalid-native-vertex-offset' }
  // Browser resource bound, not an inferred original screen-size restriction.
  if (context.width > 4096 || context.height > 4096 || context.width * context.height > 4194304)
    return { status: 'unsupported', reason: 'vehicle-canvas-resource-bound' }
  if (request.kind !== 'object' || request.category !== 'vehicle' || request.objects.length !== 1 ||
      ![143, 144].includes(request.objects[0].model))
    return { status: 'unsupported', reason: 'unsupported-vehicle-request' }
  const result = planHelpObjectPreview(request, context)
  if (result.status === 'unsupported') return result
  const triangles = result.plan.objects[0].triangles
  if (triangles.length > 256 || triangles.some(t => ![3, 6, 22].includes(t.mode) ||
      !Number.isInteger(t.tile) || t.tile < 0 || t.tile > 255 || t.vertices.some(v =>
        ![v.u, v.v].every(n => Number.isInteger(n) && n >= 0 && n <= 2097152))))
    return { status: 'unsupported', reason: 'unsupported-vehicle-material-or-uv' }
  const opaque: number[] = [], translucent: number[] = []
  // 0047c7e0 assigns depth BEFORE opaque/translucent partitioning. The stored
  // float decrements once per primitive, regardless of its material or tile.
  let depth = Math.fround(0.999)
  for (const triangle of triangles) {
    const output = triangle.mode === 22 ? translucent : opaque
    const diffuse = triangle.mode === 3 || triangle.shade >= 32 ? 255 : triangle.shade * 8
    const opacity = triangle.mode === 22 ? 170 : 255
    for (const vertex of triangle.vertices) {
      const [u, v] = helpVehicleUV(triangle.tile, vertex.u, vertex.v)
      output.push(Math.fround(vertex.x + context.vertexShiftX),
        Math.fround(vertex.y + context.vertexShiftY), depth, u, v, diffuse / 255, opacity / 255)
    }
    depth = Math.fround(depth - 1 / 16384)
  }
  // 0047cc60 disables SPECULARENABLE (state29); 0047d6f0 only enables it for
  // flag8. Modes3/6/22 do not set that flag in this profile. Although 0046c800
  // writes warm specular vertex words, adding them in this shader is incorrect.
  return { status: 'prepared', stream: {
    vertices: new Float32Array([...opaque, ...translucent]),
    opaqueVertices: opaque.length / 7, translucentVertices: translucent.length / 7,
  } }
}
