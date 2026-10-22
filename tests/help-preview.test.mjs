import test from 'node:test'
import assert from 'node:assert/strict'
import source from './help-preview-source.json' with { type: 'json' }
import help from '../app/original-help.json' with { type: 'json' }
import rules from '../app/original-rules.json' with { type: 'json' }
import units from '../app/original-units.json' with { type: 'json' }
import { helpPreview } from '../app/help-preview.ts'
import { helpPreviewPhase, paintHelpPersonPreview } from '../app/help-preview-person.ts'

const pane = { x: 154, y: 262, width: 192, height: 160 }
const context = patch => ({
  pane, counter: 0, phase: { counter: 0, frame: 0 },
  person: { player: 0, spriteMode: 2, screenWidth: 640, screenHeight: 480 },
  treeVariant: 0, ...patch,
})
const topic = (id, patch) => helpPreview(help.topics[id].illustration, context(patch))
const freeze = value => {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child)
    Object.freeze(value)
  }
  return value
}

test('all 88 imported descriptors match independently addressed executable bytes', () => {
  assert.equal(source.exeSha256, '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f')
  assert.equal(source.topics.length, 88)
  for (const { topic: id, address, bytes, kind, args } of source.topics) {
    const raw = Buffer.from(bytes, 'hex')
    assert.equal(parseInt(address, 16), 0x59a195 + id * 13)
    assert.equal(raw.length, 13)
    assert.equal(raw[0], kind)
    assert.deepEqual([1, 5, 9].map(i => raw.readUInt32LE(i)), args)
    assert.deepEqual(help.topics[id].illustration, { kind, args })
  }
})

test('preview person pairs, definitions and selected layers match original ANI data', () => {
  for (const [index, data] of Object.entries(source.people)) {
    const pair = Buffer.from(data.pairBytes, 'hex')
    const definition = Buffer.from(data.descriptorBytes, 'hex')
    assert.equal(parseInt(data.pairAddress, 16), 0x5a6858 + Number(index) * 4)
    assert.equal(parseInt(data.descriptorAddress, 16), 0x5a6af8 + data.descriptor * 11)
    assert.deepEqual([pair.readInt16LE(0), pair.readInt16LE(2)], [data.animation, data.descriptor])
    assert.deepEqual(rules.animationObjects[index], [data.animation, data.descriptor])
    assert.deepEqual([definition[5], definition[6]], [data.person, data.variant])
    assert.equal(rules.animationDescriptors[data.descriptor].person, data.person)
    assert.equal(rules.animationDescriptors[data.descriptor].variant, data.variant)
    const cycle = (units.followerSources[data.animation] ?? units.shamanSources[data.animation])[0]
    assert.equal(cycle.source, data.animation)
    assert.equal(cycle.flip, data.flip)
    assert.deepEqual(cycle.frames.map(frame => units.frames[frame].source), data.cycle)
    for (let i = 0; i < data.frames.length; i++) {
      const frame = units.frames[cycle.frames[i]]
      assert.deepEqual(frame.layers.map(layer => ({
        source: units.pieces[layer.piece].source, x: layer.x, y: layer.y, flags: layer.flags,
      })), data.frames[i].layers)
    }
  }
})

test('native-empty cases are different from missing renderers for every topic', () => {
  const statuses = {}
  for (const { topic: id, kind } of source.topics) {
    const result = topic(id)
    statuses[result.status] = (statuses[result.status] ?? 0) + 1
    if (kind === 3 || kind === 255) assert.deepEqual(result, { status: 'native-empty', nativeKind: kind })
    else if (kind === 0) assert.equal(result.status, 'ready')
    else assert.equal(result.status, 'unsupported')
  }
  assert.deepEqual(statuses, { 'native-empty': 34, unsupported: 46, ready: 8 })
  for (const id of [983, 984, 1051, 1057]) assert.equal(topic(id).status, 'native-empty')
  assert.notDeepEqual(help.topics[1030].illustration.args, [0, 0, 0])
  assert.equal(topic(1030).status, 'native-empty', 'command arguments do not authorize a fake illustration')
  assert.deepEqual(helpPreview({ kind: 7, args: [123, 456, 789] }, {}), { status: 'native-empty', nativeKind: 7 })
})

test('person preview follows the exact animation-object pair, not named idle art or tribe offset', () => {
  const expected = {
    992: [0, 8, 13, 21], 1023: [93, 520, 14, 2794], 1024: [38, 96, 14, 220],
    1025: [54, 104, 15, 440], 1026: [25, 40, 18, 61], 1027: [97, 168, 14, 757],
    1028: [24, 40, 17, 61], 1050: [93, 520, 14, 2794],
  }
  for (const [id, expectedFields] of Object.entries(expected)) for (let player = 0; player < 4; player++) {
    const result = topic(id, { person: { ...context().person, player } })
    assert.equal(result.status, 'ready')
    const p = result.request
    assert.deepEqual([p.animationObject, p.animation, p.descriptor, p.sourceFrame], expectedFields)
    const original = source.people[p.animationObject].frames[0].layers
    const expectedPieces = original.filter(layer => {
      const category = layer.flags >>> 4 & 31, choice = layer.flags >>> 9
      if (category === 0) return choice !== 1
      if (category === 1) return choice === player
      return category === source.people[p.animationObject].person && choice === source.people[p.animationObject].variant
    }).map(layer => layer.source)
    assert.deepEqual(p.layers.map(layer => units.pieces[layer.piece].source), expectedPieces)
    for (const layer of p.layers) {
      const originalLayer = original.find(candidate => candidate.source === units.pieces[layer.piece].source)
      assert.equal(layer.target.x, 250 + originalLayer.x)
      assert.equal(layer.target.y, 342 + originalLayer.y)
    }
  }
})

test('frame progression is counter-gated, retained, and wraps without using wall time', () => {
  const previous = { counter: 4, frame: 2 }
  assert.equal(helpPreviewPhase(previous, 4, 4), previous)
  assert.deepEqual(helpPreviewPhase(previous, 5, 4), { counter: 5, frame: 3 })
  assert.deepEqual(helpPreviewPhase(previous, 5000, 4), { counter: 5000, frame: 3 })
  assert.deepEqual(helpPreviewPhase({ counter: 4, frame: 3 }, 5, 4), { counter: 5, frame: 0 })
  assert.deepEqual(helpPreviewPhase({ counter: 0xffffffff, frame: 0 }, 0, 1), { counter: 0, frame: 0 })
  assert.throws(() => helpPreviewPhase(previous, NaN, 4), /Invalid/)
  assert.throws(() => helpPreviewPhase(previous, 4, 0), /Invalid/)
})

test('all original person cycles can be visited repeatedly with stable same-counter redraws', () => {
  for (const { topic: id, kind, args } of source.topics) {
    if (kind !== 0) continue
    const original = source.people[args[0]]
    let phase = { counter: 0, frame: 0 }
    for (let counter = 0; counter < original.cycle.length * 3; counter++) {
      const result = topic(id, { counter, phase })
      assert.equal(result.status, 'ready')
      assert.equal(result.request.sourceFrame, original.cycle[counter % original.cycle.length])
      phase = result.request.phase
      assert.deepEqual(topic(id, { counter, phase }), result)
    }
  }
})

test('same-counter topic changes do not silently repair a native out-of-range phase', () => {
  assert.deepEqual(topic(992, { counter: 7, phase: { counter: 7, frame: 5 } }),
    { status: 'unsupported', reason: 'person-phase-out-of-range' })
  assert.equal(topic(992, { counter: 8, phase: { counter: 7, frame: 5 } }).request.phase.frame, 0)
})

test('screen-scaled persons retain native 30/32 factor and independent signed truncation', () => {
  const base = topic(1025).request
  for (const [width, height] of [[1280, 960], [965, 721]]) {
    const scaled = topic(1025, { person: { ...context().person, screenWidth: width, screenHeight: height } }).request
    const sx = Math.trunc(Math.trunc(width * 256 / 640) * 30 / 32)
    const sy = Math.trunc(Math.trunc(height * 256 / 480) * 30 / 32)
    for (let i = 0; i < base.layers.length; i++) {
      const a = base.layers[i], b = scaled.layers[i]
      assert.deepEqual(b.source, a.source, 'source crop is never scaled')
      assert.deepEqual(b.target, {
        x: 250 + Math.trunc((a.target.x - 250) * sx / 256),
        y: 342 + Math.trunc((a.target.y - 342) * sy / 256),
        width: Math.trunc(a.target.width * sx / 256), height: Math.trunc(a.target.height * sy / 256),
      })
    }
  }
  assert.deepEqual(topic(1025, { person: { ...context().person, screenHeight: 960 } }).request, base)
  assert.deepEqual(topic(1025, { person: { ...context().person, spriteMode: 0, screenWidth: 1280 } }).request, base)
})

test('unknown person source, projection and player inputs remain explicit blockers', () => {
  assert.equal(topic(1024, { person: undefined }).reason, 'missing-person-render-context')
  assert.equal(topic(1024, { person: { ...context().person, spriteMode: 1 } }).reason, 'person-projection-scaling')
  for (const player of [-1, 4, NaN, 0.1])
    assert.equal(topic(1024, { person: { ...context().person, player } }).reason, 'invalid-person-render-context')
  assert.equal(helpPreview({ kind: 0, args: [9999, 0, 0] }, context()).reason, 'missing-person-animation-object')
})

test('objects preserve native model lookup, raw parameter and counter angle without fake meshes', () => {
  for (const { topic: id, kind, args } of source.topics) {
    if (![1, 2, 5].includes(kind)) continue
    const result = topic(id, { counter: 65 })
    assert.equal(result.status, 'unsupported')
    assert.equal(result.reason, 'native-object-renderer')
    const draw = result.request.objects[0]
    assert.deepEqual([draw.x, draw.y, draw.angle, draw.renderParameter, draw.fixedParameter],
      [250, 368, 32, args[1], 1866])
  }
  assert.equal(topic(996).request.objects[0].model, 107)
  assert.equal(topic(990).request.objects[0].model, 152)
  for (const row of source.vehicles) {
    assert.equal(Buffer.from(row.bytes, 'hex').readInt16LE(), row.object)
    assert.equal(helpPreview({ kind: 2, args: [row.model, 32, 0] }, context()).request.objects[0].model, row.object)
  }
  for (const [id, model] of [[989, 45], [991, 149], [1070, 8]])
    assert.equal(topic(id).request.objects[0].model, model)
  assert.equal(topic(996, { counter: 63 }).request.objects[0].angle, 2016)
  assert.equal(topic(996, { counter: 64 }).request.objects[0].angle, 0)
})

test('tree variants must be retained by the owner; planning does not sample or mutate RNG', () => {
  for (let variant = 0; variant < 6; variant++)
    assert.equal(topic(986, { treeVariant: variant }).request.objects[0].model, 13 + variant)
  for (const treeVariant of [undefined, -1, 6, 1.5])
    assert.equal(topic(986, { treeVariant }).reason, 'missing-retained-tree-variant')
})

test('reincarnation ring is eight source model30 objects with asymmetric fixed-point rounding', () => {
  const result = topic(988, { pane: { x: 0, y: 0, width: 192, height: 160 } })
  assert.equal(result.status, 'unsupported')
  assert.equal(result.reason, 'native-object-renderer')
  assert.deepEqual(result.request.objects.map(o => [o.x, o.y]),
    [[160, 80], [141, 117], [96, 133], [50, 117], [32, 80], [50, 42], [96, 27], [141, 42]])
  assert.deepEqual(result.request.objects.map(o => o.angle), [512, 768, 1024, 1280, 1536, 1792, 0, 256])
  for (const o of result.request.objects) assert.deepEqual([o.model, o.renderParameter, o.fixedParameter], [30, 24, 1866])
})

test('all spell requests retain source control2/model override and absolute pane without fabricated stock', () => {
  let count = 0
  for (const { topic: id, kind, args } of source.topics) {
    if (kind !== 4) continue
    count++
    assert.deepEqual(topic(id), {
      status: 'unsupported', reason: 'native-spell-control-renderer',
      request: { kind: 'spell-control', model: args[0], templateControl: 2, pane },
    })
  }
  assert.equal(count, 29)
})

test('malformed descriptors and impossible panes fail without reinterpretation', () => {
  for (const descriptor of [
    { kind: -1, args: [0, 0, 0] }, { kind: 256, args: [0, 0, 0] }, { kind: 1.5, args: [0, 0, 0] },
    { kind: 0, args: [0, 0] }, { kind: 0, args: [NaN, 0, 0] }, { kind: 0, args: [-1, 0, 0] },
  ]) assert.deepEqual(helpPreview(descriptor, context()), { status: 'unsupported', reason: 'invalid-preview-descriptor' })
  const boundary = { ...pane, x: 32767 - pane.width, y: 32767 - pane.height }
  for (const kind of [0, 1, 2, 4, 5, 6]) {
    const row = source.topics.find(row => row.kind === kind)
    assert.notEqual(topic(row.topic, { pane: boundary }).reason, 'invalid-preview-context')
    for (const badPane of [
      { ...pane, width: 0 }, { ...pane, x: NaN }, { ...pane, height: 0.5 },
      { ...pane, x: 32767 }, { ...pane, y: 32767 },
      { ...boundary, x: boundary.x + 1 }, { ...boundary, y: boundary.y + 1 },
    ]) assert.equal(topic(row.topic, { pane: badPane }).reason, 'invalid-preview-context')
  }
})

test('preview planning cannot mutate input state or advance the game', () => {
  const ctx = freeze(context()), before = structuredClone(ctx)
  for (const row of source.topics) helpPreview(freeze(help.topics[row.topic].illustration), ctx)
  assert.deepEqual(ctx, before)
})

function painter() {
  const calls = []
  const ctx = { imageSmoothingEnabled: true }
  for (const name of ['save', 'restore', 'translate', 'scale', 'drawImage'])
    ctx[name] = (...args) => calls.push([name, ...args])
  return { ctx, calls }
}
const atlas = { complete: true, naturalWidth: units.width, naturalHeight: units.height }

test('person painter borrows the live atlas, uses exact source rectangles and never clips or fills a pane', () => {
  const preview = topic(1024).request, { ctx, calls } = painter()
  assert.deepEqual(paintHelpPersonPreview(ctx, atlas, preview), { status: 'drawn' })
  assert.equal(ctx.imageSmoothingEnabled, false)
  const draws = calls.filter(([name]) => name === 'drawImage')
  assert.equal(draws.length, preview.layers.length)
  for (let i = 0; i < draws.length; i++) {
    const { source: s, target: t } = preview.layers[i]
    assert.deepEqual(draws[i], ['drawImage', atlas, s.x, s.y, s.width, s.height, 0, 0, t.width, t.height])
  }
  assert.equal(calls.filter(([name]) => name === 'save').length,
    calls.filter(([name]) => name === 'restore').length)
})

test('person painter rejects failed or wrong-sized atlases instead of reporting blank success', () => {
  for (const image of [{ ...atlas, complete: false }, { ...atlas, naturalWidth: 0 }, { ...atlas, naturalHeight: 1 }]) {
    const { ctx, calls } = painter()
    assert.deepEqual(paintHelpPersonPreview(ctx, image, topic(1024).request),
      { status: 'unsupported', reason: 'person-atlas-not-ready' })
    assert.equal(calls.length, 0)
  }
})

test('painter handles mirrored rectangles and always restores borrowed context on draw failure', () => {
  const preview = topic(1024).request
  const mirrored = { ...preview, layers: [{ ...preview.layers[0], mirror: true }] }
  const { ctx, calls } = painter()
  const target = mirrored.layers[0].target
  paintHelpPersonPreview(ctx, atlas, mirrored)
  assert.deepEqual(calls.find(([name]) => name === 'translate'), ['translate', target.x + target.width, target.y])
  assert.deepEqual(calls.find(([name]) => name === 'scale'), ['scale', -1, 1])
  calls.length = 0
  ctx.drawImage = () => { throw Error('lost context') }
  assert.throws(() => paintHelpPersonPreview(ctx, atlas, preview), /lost context/)
  assert.equal(calls.filter(([name]) => name === 'save').length,
    calls.filter(([name]) => name === 'restore').length)
})
