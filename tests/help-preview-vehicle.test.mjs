import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { prepareHelpVehicle, helpVehicleUV } from '../app/help-preview-vehicle.ts'
import { createHelpVehicleCanvas } from '../app/help-preview-vehicle-canvas.ts'
import { planHelpObjectPreview } from '../app/help-preview-object.ts'
import { helpPreview } from '../app/help-preview.ts'
import help from '../app/original-help.json' with { type: 'json' }
import source from './help-preview-vehicle-source.json' with { type: 'json' }

const ctx = (patch = {}) => ({ objectBank: 2, player: 0, width: 640, height: 480,
  shadeTable: Array.from({ length: 1024 }, (_, i) => i % 64),
  profile: 'linear-argb4444-alpha2', vertexShiftX: 0, vertexShiftY: 0, ...patch })
const request = (model = 143, angle = 0) => ({ kind: 'object', category: 'vehicle',
  objects: [{ model, angle, x: 300, y: 250, renderParameter: 30, fixedParameter: 1866 }] })

test('vehicle profile constants and addressed static spans remain original-byte bound', () => {
  assert.equal(source.exeSha256, '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f')
  for (const span of Object.values(source.spans)) {
    const bytes = Buffer.from(span.bytes, 'hex')
    assert.equal(bytes.length, parseInt(span.end, 16) - parseInt(span.start, 16))
    assert.equal(createHash('sha256').update(bytes).digest('hex'), span.sha256)
  }
  const f = address => Buffer.from(source.constants[address], 'hex').readFloatLE()
  const u = address => Buffer.from(source.constants[address], 'hex').readUInt32LE()
  assert.equal(f('0058f47c'), 1 / 2097152); assert.equal(f('0058f4ec'), 1 / 16384)
  assert.equal(f('005dd324'), 0.5); assert.equal(f('005dd328'), 0)
  assert.equal(f('005dd32c'), -0.5); assert.equal(f('005dd330'), 0)
  assert.equal(u('005d54c8'), 1); assert.equal(u('005d54cc'), 0)
  assert.equal(u('005d56e8'), 0); assert.equal(u('005d56ec'), 0x3ff)
})

test('vehicle profile, current inputs and resource bounds fail closed', () => {
  for (const patch of [{ profile: undefined }, { profile: 'nearest' }, { vertexShiftX: undefined },
    { vertexShiftX: Infinity }, { vertexShiftX: 0.1 }, { vertexShiftY: 32768 },
    { shadeTable: undefined }, { player: 4 }, { objectBank: 3 }, { width: 4097 },
    { width: 4096, height: 1025 }, { width: -1 }, { height: NaN }]) {
    assert.equal(prepareHelpVehicle(request(), ctx(patch)).status, 'unsupported', JSON.stringify(patch))
  }
  for (const r of [request(30), { ...request(), category: 'ring' },
    { ...request(), objects: [] }, { ...request(), objects: [...request().objects, ...request().objects] }])
    assert.equal(prepareHelpVehicle(r, ctx()).status, 'unsupported')
  assert.equal(prepareHelpVehicle(request(), ctx({ width: 4096, height: 1024 })).status, 'prepared')
})

test('linear raw21-bit UV mapping preserves inset endpoints and fractional coordinates', () => {
  assert.deepEqual(helpVehicleUV(0, 0, 0), [0.5 / 256, 0.5 / 1024])
  assert.deepEqual(helpVehicleUV(255, 2097152, 2097152), [255.5 / 256, 1023.5 / 1024])
  for (const tile of [0, 61, 138, 150, 160, 186, 210, 255]) for (const n of [1, 123456, 1048576, 2097151]) {
    const expected = [((tile & 7) * 67108864 + 1048576 + n * 31) / 536870912,
      ((tile >> 3) * 67108864 + 1048576 + (2097152 - n) * 31) / 2147483648].map(Math.fround)
    assert.deepEqual(helpVehicleUV(tile, n, 2097152 - n), expected)
  }
})

test('both vehicles retain all64 headings, both banks and four players through the draw stream', () => {
  const seen = new Set()
  for (const model of [143, 144]) for (const objectBank of [2, 6]) for (let player = 0; player < 4; player++)
    for (let angle = 0; angle < 2048; angle += 32) {
      const c = ctx({ objectBank, player }), r = request(model, angle)
      const plan = planHelpObjectPreview(r, c), stream = prepareHelpVehicle(r, c)
      assert.equal(plan.status, 'planned'); assert.equal(stream.status, 'prepared')
      const triangles = plan.plan.objects[0].triangles
      assert.equal(stream.stream.vertices.length, triangles.length * 21)
      assert.equal(stream.stream.translucentVertices, triangles.filter(t => t.mode === 22).length * 3)
      assert.equal(stream.stream.opaqueVertices + stream.stream.translucentVertices, triangles.length * 3)
      const ordered = [...triangles.filter(t => t.mode !== 22), ...triangles.filter(t => t.mode === 22)]
      for (let i = 0; i < ordered.length; i++) {
        const t = ordered[i]; seen.add(t.mode)
        for (let j = 0; j < 3; j++) {
          const values = stream.stream.vertices.subarray(i * 21 + j * 7, i * 21 + j * 7 + 7)
          assert.equal(values[0], t.vertices[j].x); assert.equal(values[1], t.vertices[j].y)
          assert.equal(values[5], Math.fround((t.mode === 3 ? 255 : Math.min(255, t.shade * 8)) / 255))
          assert.equal(values[6], Math.fround(t.mode === 22 ? 170 / 255 : 1))
        }
      }
    }
  assert.deepEqual([...seen].sort((a, b) => a - b), [3, 6, 22])
})

test('queue depth is assigned before pass partitioning and shifts occur after visibility', () => {
  const c = ctx(), r = request(), original = structuredClone({ c, r })
  const triangles = planHelpObjectPreview(r, c).plan.objects[0].triangles
  const index = new Map(triangles.map((t, i) => [t, i]))
  const order = [...triangles.filter(t => t.mode !== 22), ...triangles.filter(t => t.mode === 22)]
  const plain = prepareHelpVehicle(r, c).stream
  const shifted = prepareHelpVehicle(r, { ...c, vertexShiftX: -32767, vertexShiftY: 0.5 }).stream
  assert.equal(shifted.vertices.length, plain.vertices.length)
  for (let i = 0; i < order.length; i++) for (let j = 0; j < 3; j++) {
    const at = i * 21 + j * 7
    assert.equal(plain.vertices[at + 2], Math.fround(Math.fround(0.999) - index.get(order[i]) / 16384))
    assert.equal(shifted.vertices[at], Math.fround(plain.vertices[at] - 32767))
    assert.equal(shifted.vertices[at + 1], Math.fround(plain.vertices[at + 1] + 0.5))
  }
  assert.deepEqual({ c, r }, original)
  const statuses = help.topics.map(topic => helpPreview(topic.illustration,
    { pane: { x: 0, y: 0, width: 192, height: 156 }, counter: 1, phase: { counter: 1, frame: 1 }, treeVariant: 0,
      person: { player: 0, spriteMode: 2, screenWidth: 640, screenHeight: 480 } }).status)
  assert.equal(statuses.filter(s => s === 'unsupported').length, 46)
})

function mockEnvironment(patch = {}) {
  const calls = [], flags = { lost: false, shader: true, link: true, error: 0, upload: false, ...patch }
  const constants = new Map([['NO_ERROR', 0]]); let next = 1
  const gl = new Proxy({}, { get(_, name) {
    if (/^[A-Z_0-9]+$/.test(name)) { if (!constants.has(name)) constants.set(name, next++); return constants.get(name) }
    return (...args) => {
      calls.push([name, ...args])
      if (name === 'getShaderParameter') return flags.shader
      if (name === 'getProgramParameter') return flags.link
      if (name === 'getParameter') return flags.maxSize ?? 4096
      if (name === 'getError') { const value = flags.error; flags.error = 0; return value }
      if (name === 'isContextLost') return flags.lost
      if (name === 'getUniformLocation') return { name: args[1] }
      if (name.startsWith('create')) return { type: name, id: calls.length }
      if (name === 'texImage2D' && flags.upload) throw Error('supplied upload failure')
    }
  } })
  const canvas = { width: 300, height: 150, style: {}, getContext(type, attributes) {
    calls.push(['getContext', type, attributes])
    if (flags.contextThrows) throw Error('supplied context failure')
    return flags.noContext ? null : gl
  } }
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document')
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { createElement(tag) {
    assert.equal(tag, 'canvas'); return canvas
  } } })
  return { gl, flags, calls, canvas, restore() {
    if (previous) Object.defineProperty(globalThis, 'document', previous)
    else delete globalThis.document
  } }
}
const atlas = () => ({ complete: true, naturalWidth: 256, naturalHeight: 1024, src: '/original/atlas.png', currentSrc: '' })

test('owned canvas submits opaque and translucent passes with native depth and browser composition', () => {
  const e = mockEnvironment()
  try {
    const created = createHelpVehicleCanvas(); assert.equal(created.status, 'created')
    const image = atlas(), before = structuredClone(image), renderer = created.renderer
    const result = renderer.draw(request(), ctx(), image); assert.equal(result.status, 'drawn')
    assert.equal(renderer.canvas, e.canvas); assert.equal(e.canvas.style.pointerEvents, 'none')
    assert.equal(e.canvas.width, 640); assert.equal(e.canvas.height, 480)
    const draws = e.calls.filter(c => c[0] === 'drawArrays')
    const stream = prepareHelpVehicle(request(), ctx()).stream
    assert.deepEqual(draws, [['drawArrays', e.gl.TRIANGLES, 0, stream.opaqueVertices],
      ['drawArrays', e.gl.TRIANGLES, stream.opaqueVertices, stream.translucentVertices]])
    assert.deepEqual(e.calls.filter(c => c[0] === 'depthFunc'), [['depthFunc', e.gl.LEQUAL]])
    assert.deepEqual(e.calls.filter(c => c[0] === 'depthMask').slice(-3), [['depthMask', true], ['depthMask', false], ['depthMask', true]])
    assert.deepEqual(e.calls.find(c => c[0] === 'blendFuncSeparate'), ['blendFuncSeparate', e.gl.SRC_ALPHA,
      e.gl.ONE_MINUS_SRC_ALPHA, e.gl.ONE, e.gl.ONE_MINUS_SRC_ALPHA])
    const fragment = e.calls.filter(c => c[0] === 'shaderSource').map(c => c[2]).find(s => s.includes('outputColor'))
    assert.match(fragment, /texel\.rgb \* v_color\.x/)
    assert.match(fragment, /u_translucent \? texel\.a \* v_color\.y : 1\.0/)
    assert.deepEqual(image, before)
    renderer.dispose()
  } finally { e.restore() }
})

test('loading, absent or broken atlas never produces a successful empty preview', () => {
  const e = mockEnvironment()
  try {
    const { renderer } = createHelpVehicleCanvas()
    assert.equal(renderer.draw(request(), ctx(), undefined).reason, 'vehicle-atlas-unavailable')
    assert.equal(renderer.draw(request(), ctx(), { ...atlas(), complete: false }).status, 'loading')
    assert.equal(renderer.draw(request(), ctx(), { ...atlas(), naturalWidth: 0 }).status, 'unsupported')
    assert.equal(renderer.draw(request(), ctx(), { ...atlas(), naturalHeight: 512 }).status, 'unsupported')
    assert.equal(e.calls.filter(c => c[0] === 'drawArrays').length, 0)
    assert.equal(e.calls.filter(c => c[0] === 'clear').length, 4)
    renderer.dispose()
  } finally { e.restore() }
})

test('atlas upload retains hidden RGB and is reused only for the same loaded source', () => {
  const e = mockEnvironment()
  try {
    const { renderer } = createHelpVehicleCanvas(), image = atlas()
    renderer.draw(request(), ctx(), image); renderer.draw(request(144, 32), ctx(), image)
    assert.equal(e.calls.filter(c => c[0] === 'texImage2D').length, 1)
    image.currentSrc = '/original/atlas-s.png'; renderer.draw(request(), ctx(), image)
    assert.equal(e.calls.filter(c => c[0] === 'texImage2D').length, 2)
    assert.deepEqual(e.calls.filter(c => c[0] === 'pixelStorei'), [
      ['pixelStorei', e.gl.UNPACK_FLIP_Y_WEBGL, false],
      ['pixelStorei', e.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false],
      ['pixelStorei', e.gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, e.gl.NONE],
    ])
    renderer.dispose()
  } finally { e.restore() }
})

test('unsupported state clears stale pixels and upload failures remain retryable', () => {
  const e = mockEnvironment()
  try {
    const { renderer } = createHelpVehicleCanvas(), image = atlas()
    e.flags.upload = true
    assert.equal(renderer.draw(request(), ctx(), image).reason, 'vehicle-gpu-draw-failed')
    assert.equal(e.calls.filter(c => c[0] === 'drawArrays').length, 0)
    e.flags.upload = false
    assert.equal(renderer.draw(request(), ctx(), image).status, 'drawn')
    const count = e.calls.filter(c => c[0] === 'clear').length
    assert.equal(renderer.draw(request(), ctx({ profile: 'unknown' }), image).status, 'unsupported')
    assert.equal(e.calls.filter(c => c[0] === 'clear').length, count + 1)
    renderer.dispose()
  } finally { e.restore() }
})

test('owned resources dispose exactly once and later draws are rejected', () => {
  const e = mockEnvironment()
  try {
    const { renderer } = createHelpVehicleCanvas()
    renderer.dispose(); renderer.dispose()
    const count = e.calls.length
    assert.equal(renderer.draw(request(), ctx(), atlas()).reason, 'vehicle-renderer-disposed')
    assert.equal(e.calls.length, count)
    for (const name of ['deleteProgram', 'deleteBuffer', 'deleteTexture', 'deleteVertexArray'])
      assert.equal(e.calls.filter(c => c[0] === name).length, 1)
    assert.equal(e.calls.filter(c => c[0] === 'deleteShader').length, 2)
    assert.equal(e.canvas.width, 1); assert.equal(e.canvas.height, 1)
  } finally { e.restore() }
})

test('setup failure disposes partial allocations and context loss blocks submission', () => {
  for (const patch of [{ shader: false }, { link: false }, { error: 1 }, { maxSize: 512 }]) {
    const e = mockEnvironment(patch)
    try {
      assert.equal(createHelpVehicleCanvas().reason, 'vehicle-gpu-setup-failed')
      assert.equal(e.calls.filter(c => c[0] === 'deleteProgram').length, 1)
    } finally { e.restore() }
  }
  const e = mockEnvironment()
  try {
    const { renderer } = createHelpVehicleCanvas(); e.flags.lost = true
    assert.equal(renderer.draw(request(), ctx(), atlas()).reason, 'vehicle-context-lost')
    assert.equal(e.calls.filter(c => c[0] === 'drawArrays').length, 0)
    renderer.dispose()
  } finally { e.restore() }
})

test('missing browser or WebGL2 stays explicitly unsupported', () => {
  assert.equal(createHelpVehicleCanvas().reason, 'vehicle-canvas-unavailable')
  const e = mockEnvironment({ noContext: true })
  try { assert.equal(createHelpVehicleCanvas().reason, 'vehicle-webgl2-unavailable') }
  finally { e.restore() }
  const failure = mockEnvironment({ contextThrows: true })
  try { assert.equal(createHelpVehicleCanvas().reason, 'vehicle-canvas-setup-failed') }
  finally { failure.restore() }
})
