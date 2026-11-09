import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import source from './help-preview-object-source.json' with { type: 'json' }
import extra from '../app/original-help-previews.json' with { type: 'json' }
import rules from '../app/original-rules.json' with { type: 'json' }
import models from '../app/original-models.json' with { type: 'json' }
import bank6 from '../app/original-models-bank6.json' with { type: 'json' }
import help from '../app/original-help.json' with { type: 'json' }
import { helpPreview } from '../app/help-preview.ts'
import { helpObjectBasis, helpObjectBucket, planHelpObjectPreview } from '../app/help-preview-object.ts'

const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const shadeTable = Array.from({ length: 1024 }, (_, i) => i & 255)
const context = (patch = {}) => ({ objectBank: 2, player: 0, width: 640, height: 480, shadeTable, ...patch })
const object = (model, angle = 0, patch = {}) => ({ model, angle, x: 250, y: 360, renderParameter: 30, fixedParameter: 1866, ...patch })
const request = (...objects) => ({ kind: 'object', category: 'vehicle', objects })
function raw(model, bank) {
  const row = source.records[bank][model] ?? source.records[2][model]
  const header = Buffer.from(row.object, 'hex'), faces = Buffer.from(row.faces, 'hex'), points = Buffer.from(row.points, 'hex')
  return {
    header, faces, points,
    faceRows: Array.from({ length: header.readInt16LE(2) }, (_, i) => {
      const f = faces.subarray(i * 60, i * 60 + 60)
      return {
        count: f[6], tile: f.readInt16LE(2), mode: f[7], bias: -header.readInt8(6) - f.readInt8(58),
        normal: f.readUInt16LE(48), uv: Array.from({ length: 8 }, (_, k) => f.readInt32LE(8 + k * 4)),
        p: Array.from({ length: f[6] }, (_, k) => {
          const at = f.readInt16LE(40 + k * 2) * 6
          return [0, 2, 4].map(offset => points.readInt16LE(at + offset))
        }),
      }
    }),
  }
}

function reference(model, angle, ctx, patch = {}) {
  const o = object(model, angle, patch), basis = source.matrices[angle / 32]
  const triangles = []; let order = 0
  for (const [face, row] of raw(model, ctx.objectBank).faceRows.entries()) {
    const vertices = row.p.map((p, k) => {
      const rotated = [0, 3, 6].map(i => (Math.imul(basis[i], p[0]) + Math.imul(basis[i + 1], p[1]) + Math.imul(basis[i + 2], p[2])) >> 14)
      return { x: Math.fround(o.x + Math.imul(rotated[0], o.renderParameter) / 256),
        y: Math.fround(o.y - Math.imul(rotated[1], o.renderParameter) / 256), depth: rotated[2], u: row.uv[k * 2], v: row.uv[k * 2 + 1] }
    })
    for (const indices of row.count === 3 ? [[0, 1, 2]] : [[0, 2, 3], [0, 1, 2]]) {
      const v = indices.map(i => vertices[i]), submission = order++
      const mean = Math.imul(v[0].depth + v[1].depth + v[2].depth + 3072, 85) >> 8
      const bucket = mean < 64 ? 0 : Math.min(3584, Math.max(0, Math.trunc(mean / 16) + row.bias))
      const [a, b, c] = v
      if (!row.mode || bucket > 256 || v.every(v => v.x < 0) || v.every(v => v.x >= ctx.width) || v.every(v => v.y >= ctx.height) ||
          (b.x - a.x) * (c.y - b.y) <= (b.y - a.y) * (c.x - b.x)) continue
      const flags = Buffer.from(source.textureFlags, 'hex')
      triangles.push({ face, bucket, order: submission, tile: row.tile + (flags[row.tile] & 1 ? ctx.player : 0), mode: row.mode,
        shade: Math.max(1, Math.min(63, ctx.shadeTable[row.normal])), vertices: v })
    }
  }
  return triangles.sort((a, b) => b.bucket - a.bucket || b.order - a.order)
}

test('supplemental fields and recovered geometry match exact selected original records', () => {
  assert.equal(extra.models.length, 22)
  assert.deepEqual(Object.keys(extra.banks[6]).map(Number), [13, 14, 15, 16, 17, 18])
  assert.deepEqual(rules.textureFlags, [...Buffer.from(source.textureFlags, 'hex')])
  for (const bank of [2, 6]) for (const model of extra.models) {
    const r = raw(model, bank), identity = extra.identities[bank][model]
    assert.equal(hash(r.faces), identity.facesSha256)
    assert.equal(hash(r.points), identity.pointsSha256)
    // Non-tree bank6 geometry is identical but its source offsets can differ.
    if (source.records[bank][model]) assert.equal(hash(r.header), identity.objectSha256)
    const supplement = extra.banks[bank][model] ?? extra.banks[2][model]
    assert.deepEqual(supplement.normals, r.faceRows.map(f => f.normal))
    assert.deepEqual(supplement.uv, r.faceRows.map(f => f.uv))
    const rawPositions = r.faceRows.flatMap(f => (f.count === 3 ? [0, 1, 2] : [0, 1, 2, 0, 2, 3]).flatMap(i => f.p[i]))
    if (model === 7) {
      assert.equal(models[7], undefined)
      assert.deepEqual(supplement.geometry.positions, rawPositions)
      for (const [name, field] of [['counts', 'count'], ['tiles', 'tile'], ['modes', 'mode'], ['biases', 'bias']])
        assert.deepEqual(supplement.geometry[name], r.faceRows.map(f => f[field]))
    } else {
      const m = (bank === 6 && bank6.models[model]) || models[model]
      assert.deepEqual(m.p.map((n, i) => Math.round(n * m.scale * 3 * (i % 3 === 2 ? -1 : 1)) || 0), rawPositions)
      assert.deepEqual(m.faces.filter((_, i) => i % 2 === 0), r.faceRows.map(f => f.count))
    }
  }
})

test('preview basis matches independently derived fixed-point source matrices at all64 headings', () => {
  for (let i = 0; i < 64; i++) assert.deepEqual(helpObjectBasis(i * 32, 1866), source.matrices[i])
})

test('both vehicles match raw-source projection, face order and shading at all64 headings and4 players', () => {
  for (const model of [143, 144]) for (let angle = 0; angle < 2048; angle += 32) for (let player = 0; player < 4; player++) {
    const ctx = context({ player }), result = planHelpObjectPreview(request(object(model, angle)), ctx)
    assert.equal(result.status, 'planned')
    assert.deepEqual(result.plan.objects[0].triangles, reference(model, angle, ctx))
  }
})

test('all required objects, both banks and source modes use lossless fields, including missing model7', () => {
  const modes = new Set()
  for (const bank of [2, 6]) for (const model of extra.models) for (const angle of [0, 512, 1024, 1536]) {
    const ctx = context({ objectBank: bank }), result = planHelpObjectPreview(request(object(model, angle)), ctx)
    assert.equal(result.status, 'planned')
    assert.deepEqual(result.plan.objects[0].triangles, reference(model, angle, ctx))
    for (const triangle of result.plan.objects[0].triangles) modes.add(triangle.mode)
  }
  assert.deepEqual([...modes].sort((a, b) => a - b), [3, 4, 6, 7, 22, 32])
})

test('source screen coordinates remain float32 and culling is full-frame, not pane-local', () => {
  for (const patch of [{ x: 0, y: 0 }, { x: 639, y: 479 }, { renderParameter: 0xffffffff }, { renderParameter: 257 }]) {
    const ctx = context(), result = planHelpObjectPreview(request(object(144, 0, patch)), ctx)
    assert.equal(result.status, 'planned')
    assert.deepEqual(result.plan.objects[0].triangles, reference(144, 0, ctx, patch))
  }
})

test('source257-bucket preview offset and reverse insertion differ from the world painter', () => {
  assert.equal(helpObjectBucket([0, 0, 0], 0), 63)
  assert.equal(helpObjectBucket([-1024, -1024, -1024], 100), 0)
  assert.equal(helpObjectBucket([0, 0, 0], -100), 0)
  assert.equal(helpObjectBucket([32767, 32767, 32767], 0), 2103)
  assert.equal(helpObjectBucket([32767, 32767, 32767], 4000), 3584)
  const triangles = planHelpObjectPreview(request(object(143)), context()).plan.objects[0].triangles
  for (let i = 1; i < triangles.length; i++) {
    const a = triangles[i - 1], b = triangles[i]
    assert.ok(a.bucket > b.bucket || a.bucket === b.bucket && a.order > b.order)
  }
})

test('ring objects retain independent native flush order and dispatch stays explicitly unsupported', () => {
  const pane = { x: 154, y: 262, width: 192, height: 160 }
  const row = Object.values(help.topics).find(t => t.illustration.kind === 6)
  const dispatch = helpPreview(row.illustration, { pane, counter: 0, phase: { counter: 0, frame: 0 } })
  assert.equal(dispatch.status, 'unsupported')
  const result = planHelpObjectPreview(dispatch.request, context())
  assert.equal(result.status, 'planned')
  assert.equal(result.plan.objects.length, 8)
  for (let i = 0; i < 8; i++) assert.deepEqual(result.plan.objects[i],
    planHelpObjectPreview(request(dispatch.request.objects[i]), context()).plan.objects[0])
})

test('object context/request validation rejects missing current inputs without defaults or mutation', () => {
  for (const patch of [{ objectBank: 3 }, { player: -1 }, { width: 0 }, { height: 32768 }, { shadeTable: [] },
    { shadeTable: Array(1024).fill(NaN) }, { shadeTable: Array(1024).fill(256) }])
    assert.deepEqual(planHelpObjectPreview(request(object(143)), context(patch)), { status: 'unsupported', reason: 'invalid-object-render-context' })
  for (const patch of [{ x: 32768 }, { y: -1 }, { angle: 2048 }, { renderParameter: -1 }, { fixedParameter: 0 }])
    assert.equal(planHelpObjectPreview(request(object(143, 0, patch)), context()).reason, 'invalid-object-preview-request')
  assert.equal(planHelpObjectPreview(request(object(999)), context()).reason, 'missing-object-preview-fields')
  const ctx = Object.freeze(context({ shadeTable: Object.freeze([...shadeTable]) }))
  const req = Object.freeze(request(Object.freeze(object(143))))
  Object.freeze(req.objects)
  const before = structuredClone({ ctx, req })
  assert.equal(planHelpObjectPreview(req, ctx).status, 'planned')
  assert.deepEqual({ ctx, req }, before)
})
