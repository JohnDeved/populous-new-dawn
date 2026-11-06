import rules from './original-rules.json' with { type: 'json' }
import models from './original-models.json' with { type: 'json' }
import bank6 from './original-models-bank6.json' with { type: 'json' }
import supplemental from './original-help-previews.json' with { type: 'json' }
import { rotateBasis } from './projection.ts'
import { modelTriangleVisible } from './painter-order.ts'
import type { NativeModel } from './model-faces.ts'
import type { HelpObjectPreview } from './help-preview.ts'

/** Source-equivalent current inputs only. No World, camera or lighting defaults. */
export interface HelpObjectContext {
  readonly objectBank: 2 | 6
  readonly player: number
  readonly width: number
  readonly height: number
  readonly shadeTable: ArrayLike<number>
}

interface MissingGeometry {
  positions: number[]
  counts: number[]
  tiles: number[]
  modes: number[]
  biases: number[]
}
interface FaceSupplement {
  normals: number[]
  uv: number[][]
  geometry?: MissingGeometry
}
const extras: Readonly<Record<string, Readonly<Record<string, FaceSupplement>>>> = supplemental.banks
const baseModels: Readonly<Record<number, NativeModel>> = models
const treeModels: Readonly<Record<number, NativeModel>> = bank6.models

export interface HelpObjectTriangle {
  readonly face: number
  readonly bucket: number
  readonly order: number
  readonly tile: number
  readonly mode: number
  readonly shade: number
  readonly vertices: readonly {
    readonly x: number
    readonly y: number
    readonly depth: number
    /** Original21-bit fixed UV, deliberately not recovered from rounded atlas UV. */
    readonly u: number
    readonly v: number
  }[]
}
export interface HelpObjectPlan {
  readonly kind: 'object-triangles'
  /** Preserve call/flush order. Never globally depth-sort separate ring objects. */
  readonly objects: readonly {
    readonly model: number
    readonly triangles: readonly HelpObjectTriangle[]
  }[]
}

const identity = [16384, 0, 0, 0, 16384, 0, 0, 0, 16384]
const dot = (a: number[], b: number[]) =>
  (Math.imul(a[0], b[0]) + Math.imul(a[1], b[1]) + Math.imul(a[2], b[2])) | 0

/**00472da0 calls yaw0047fab0 first, then pitch0047f930/0047f7b0.
 * Do not replace with live modelMatrix: integer rounding order differs. */
export function helpObjectBasis(heading: number, pitch: number) {
  const yaw = rotateBasis(identity, -heading, 2)
  const s = rules.sine[pitch & 2047] >> 2, c = rules.sine[(pitch + 512) & 2047] >> 2
  const rows = [[16384, 0, 0], [0, c, -s], [0, s, c]]
  return rows.flatMap(row => [0, 1, 2].map(i => dot(row, [yaw[i], yaw[3 + i], yaw[6 + i]]) >> 14))
}

/** Separate257-bucket preview path, not the world's0x15000 depth offset. */
export function helpObjectBucket(depths: readonly number[], bias: number) {
  const distance = Math.imul((depths[0] + depths[1] + depths[2] + 0xc00) | 0, 85) >> 8
  return distance < 64 ? 0 : Math.max(0, Math.min(3584, (Math.trunc(distance / 16) + bias) | 0))
}

function geometry(model: number, bank: 2 | 6, extra: FaceSupplement): MissingGeometry | undefined {
  if (extra.geometry) return extra.geometry
  const data = (bank === 6 && treeModels[model]) || baseModels[model]
  if (!data) return undefined
  return {
    positions: data.p.map((n, i) => Math.round(n * data.scale * 3 * (i % 3 === 2 ? -1 : 1))),
    counts: data.faces.filter((_, i) => i % 2 === 0),
    tiles: data.tiles, modes: data.modes, biases: data.biases,
  }
}

/** Pure source-grounded triangle planning, NOT a renderer readiness claim.
 * The live dispatch remains unsupported until atlas/filter/primitive rendering
 * is implemented and reviewed. All data/context is borrowed and left unchanged.
 * Exact routine/data identities are recorded in original-help-previews.json. */
export function planHelpObjectPreview(request: HelpObjectPreview, context: HelpObjectContext):
  { status: 'planned'; plan: HelpObjectPlan } | { status: 'unsupported'; reason: string } {
  if (![2, 6].includes(context.objectBank) ||
      !Number.isInteger(context.player) || context.player < 0 || context.player > 3 ||
      ![context.width, context.height].every(n => Number.isInteger(n) && n > 0 && n <= 32767) ||
      context.shadeTable?.length !== 1024 ||
      !Array.from(context.shadeTable).every(n => Number.isInteger(n) && n >= 0 && n <= 255))
    return { status: 'unsupported', reason: 'invalid-object-render-context' }
  if (!request.objects.length || request.objects.length > 8 || request.objects.some(object =>
    ![object.model, object.x, object.y, object.angle, object.renderParameter].every(Number.isInteger) ||
    object.model < 0 || object.model > 32767 || object.angle < 0 || object.angle > 2047 ||
    object.x < 0 || object.x > 32767 || object.y < 0 || object.y > 32767 ||
    object.renderParameter < 0 || object.renderParameter > 0xffffffff || object.fixedParameter !== 1866))
    return { status: 'unsupported', reason: 'invalid-object-preview-request' }
  const objects: { model: number; triangles: HelpObjectTriangle[] }[] = []
  for (const object of request.objects) {
    const extra = extras[context.objectBank][object.model] ?? extras[2][object.model]
    if (!extra) return { status: 'unsupported', reason: 'missing-object-preview-fields' }
    const data = geometry(object.model, context.objectBank, extra)
    if (!data) return { status: 'unsupported', reason: 'missing-object-preview-geometry' }
    const basis = helpObjectBasis(object.angle, object.fixedParameter)
    const projected = Array.from({ length: data.positions.length / 3 }, (_, i) => {
      const raw = data.positions.slice(i * 3, i * 3 + 3)
      const x = dot(basis.slice(0, 3), raw) >> 14
      const y = dot(basis.slice(3, 6), raw) >> 14
      return {
        x: Math.fround(object.x + Math.imul(x, object.renderParameter) / 256),
        y: Math.fround(object.y - Math.imul(y, object.renderParameter) / 256),
        depth: dot(basis.slice(6, 9), raw) >> 14,
      }
    })
    const triangles: HelpObjectTriangle[] = []
    let first = 0, order = 0
    for (let face = 0; face < data.counts.length; face++) {
      const count = data.counts[face], baseTile = data.tiles[face]
      const tile = rules.textureFlags[baseTile] & 1 ? baseTile + context.player : baseTile
      const shade = Math.max(1, Math.min(63, context.shadeTable[extra.normals[face]]))
      // Imported geometry is expanded [0,1,2,0,2,3]; source submission reverses
      // those two triangles before inserting each at the head of its bucket.
      for (const indices of count === 3 ? [[0, 1, 2]] : [[0, 2, 5], [0, 1, 2]]) {
        const vertices = indices.map(i => {
          const corner = i === 5 ? 3 : i
          return { ...projected[first + i], u: extra.uv[face][corner * 2], v: extra.uv[face][corner * 2 + 1] }
        })
        const bucket = helpObjectBucket(vertices.map(v => v.depth), data.biases[face])
        const submission = order++
        //0046c3f0 only visits256..0, even though insertion clamps at3584.
        if (bucket > 256 || data.modes[face] === 0 || !modelTriangleVisible(
          vertices.map(v => ({ screenX: v.x, screenY: v.y })), context.width, context.height)) continue
        triangles.push({ face, bucket, order: submission, tile, mode: data.modes[face], shade, vertices })
      }
      first += count === 3 ? 3 : 6
    }
    triangles.sort((a, b) => b.bucket - a.bucket || b.order - a.order)
    objects.push({ model: object.model, triangles })
  }
  return { status: 'planned', plan: { kind: 'object-triangles', objects } }
}
