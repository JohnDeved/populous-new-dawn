import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { buildRecordingManifest, inspectRecordingPair, inspectRecordingStream } from '../scripts/recording-manifest.mjs'

const header = (counter, size = 0, type = 0, auxiliary = 0) => {
  const data = Buffer.alloc(8)
  data.writeInt32LE(counter)
  data.writeInt16LE(size, 4)
  data[6] = type
  data[7] = auxiliary
  return data
}
const trailer = (start, end) => {
  const data = Buffer.alloc(8)
  data.writeInt32LE(start)
  data.writeInt32LE(end, 4)
  return data
}
const pair = () => {
  const gm = Buffer.alloc(858468)
  gm.writeInt32LE(100, 16)
  const version = Buffer.alloc(68)
  version.writeUInt32LE(106)
  return {
    recordingId: 5,
    gm,
    version,
    gp: Buffer.concat([header(110, 18, 1), Buffer.alloc(18, 255), header(130), header(-1), trailer(100, 130)]),
    cp: Buffer.concat([header(105, 8, 10, 4), Buffer.alloc(8, 255), header(120), header(-1)]),
  }
}

test('canonical file identities exactly retain both research input tables', () => {
  const module = readFileSync(new URL('../scripts/recording-manifest.mjs', import.meta.url), 'utf8')
  const actual = JSON.parse(module.split('const inputIdentities = ')[1].split('\nconst recordingOrder')[0])
  const prior = readFileSync(new URL('../scripts/check-static-recorded-demo-provenance.py', import.meta.url), 'utf8')
  const control = readFileSync(new URL('../scripts/check-static-rolling-demo-control.py', import.meta.url), 'utf8')
  assert.equal(createHash('sha256').update(prior).digest('hex'), '598dd207893cbbf328981426cfd790a82ef4d9028fdf6a6be83a7fd772a14f20')
  assert.equal(createHash('sha256').update(control).digest('hex'), '72a59d57fc11e95c3bb634054fdaaffa0609703fd4d7b123fac9d79a8d711ed9')
  const expected = JSON.parse(prior.split('INPUTS = ')[1].split('\n\ndef main')[0])
  const streamTable = control.split('STREAM_INPUTS = {')[1].split('\n}')[0]
  for (const match of streamTable.matchAll(/'([^']+)': \((\d+), '([a-f0-9]{64})'\)/g)) expected[match[1]] = [Number(match[2]), match[3]]
  assert.equal(Object.keys(expected).length, 21)
  assert.deepEqual(actual, expected)
})

test('missing input stops before a manifest is returned', () => {
  const missing = new Error('missing member')
  const requested = []
  assert.throws(() => buildRecordingManifest(path => { requested.push(path); throw missing }), error => error === missing)
  assert.deepEqual(requested, ['rddata/rdmn001.dat'])
})

test('equal-size corrupt input is rejected by its digest', () => {
  assert.throws(() => buildRecordingManifest(() => Buffer.alloc(286)), /Recording identity mismatch: rddata\/rdmn001.dat/)
})

test('wrong-size input is rejected rather than emitted', () => {
  assert.throws(() => buildRecordingManifest(() => Buffer.alloc(285)), /Recording identity mismatch/)
})

test('member readers and byte inputs are explicit', () => {
  assert.throws(() => buildRecordingManifest(null), TypeError)
  assert.throws(() => buildRecordingManifest(() => 'not bytes'), TypeError)
  assert.throws(() => inspectRecordingStream('not bytes', 'cp'), TypeError)
  assert.throws(() => inspectRecordingStream(Buffer.alloc(0), 'other'), TypeError)
})

test('signed sentinel ignores its remaining header bytes', () => {
  for (const suffix of [Buffer.alloc(4), Buffer.from([0, 0, 0, 255]), Buffer.alloc(4, 255)]) {
    const data = Buffer.concat([header(10), Buffer.alloc(4, 255), suffix])
    assert.deepEqual(inspectRecordingStream(data, 'cp'), { frames: [{ counter: 10, size: 0, type: 0, auxiliary: 0, payloadOffset: 8 }], trailer: null })
  }
})

test('opaque sentinel-looking payload, same-counter records and view offsets survive', () => {
  const raw = Buffer.concat([Buffer.alloc(3, 7), header(10, 8, 10, 4), Buffer.alloc(8, 255), header(10), header(-1), Buffer.alloc(2, 9)])
  const view = new Uint8Array(raw.buffer, raw.byteOffset + 3, raw.length - 5)
  assert.deepEqual(inspectRecordingStream(view, 'cp').frames, [
    { counter: 10, size: 8, type: 10, auxiliary: 4, payloadOffset: 8 },
    { counter: 10, size: 0, type: 0, auxiliary: 0, payloadOffset: 24 },
  ])
})

test('GP trailer is distinct from scheduled frames', () => {
  const data = Buffer.concat([header(130), header(-1), trailer(100, 130)])
  const result = inspectRecordingStream(data, 'gp')
  assert.equal(result.frames.length, 1)
  assert.deepEqual(result.trailer, { startCounter: 100, endCounter: 130 })
})

test('negative counter and signed negative size are rejected', () => {
  for (const data of [header(-2), header(10, -1)])
    assert.throws(() => inspectRecordingStream(Buffer.concat([data, header(-1)]), 'cp'), /Invalid stream counter or payload length/)
})

test('truncated framing, payload and missing sentinel fail closed', () => {
  for (const data of [Buffer.alloc(0), header(-1).subarray(0, 7), header(10), Buffer.concat([header(10, 8, 10), Buffer.alloc(7)])])
    assert.throws(() => inspectRecordingStream(data, 'cp'), /Missing complete stream sentinel|Invalid stream counter or payload length/)
})

test('decreasing counters are rejected', () => {
  assert.throws(() => inspectRecordingStream(Buffer.concat([header(10), header(9), header(-1)]), 'cp'), /Decreasing simulation counter/)
})

test('stream-specific payload shapes are strict without decoding', () => {
  for (const [kind, size, type] of [['cp', 18, 1], ['gp', 8, 10], ['cp', 0, 10], ['gp', 18, 2], ['cp', 7, 10]]) {
    const data = Buffer.concat([header(10, size, type), Buffer.alloc(size), header(-1)])
    assert.throws(() => inspectRecordingStream(data, kind), /Unsupported recording payload shape/)
  }
})

test('missing or extra trailer bytes are rejected', () => {
  for (const [kind, tail] of [['gp', 0], ['gp', 7], ['gp', 9], ['cp', 1]])
    assert.throws(() => inspectRecordingStream(Buffer.concat([header(-1), Buffer.alloc(tail)]), kind), /Invalid stream trailer/)
})

test('pair preserves unknown map identity and GP completion after early CP EOF', () => {
  const input = pair()
  const before = [input.gm, input.version, input.gp, input.cp].map(bytes => Buffer.from(bytes))
  const result = inspectRecordingPair(input)
  assert.equal(result.recordingId, 5)
  assert.equal(result.sourceMapId, null)
  assert.equal(result.sourceIdentityStatus, 'unresolved')
  assert.deepEqual(result.completion, { stream: 'gp', counter: 130 })
  assert.equal(result.cp.endCounter, 120)
  assert.equal(result.startCounter, 100)
  assert.deepEqual([input.gm, input.version, input.gp, input.cp], before)
})

test('empty streams and missing scheduled completion are rejected', () => {
  for (const kind of ['gp', 'cp']) {
    const input = pair()
    input[kind] = Buffer.concat([header(-1), kind === 'gp' ? trailer(100, 130) : Buffer.alloc(0)])
    assert.throws(() => inspectRecordingPair(input), /Missing scheduled stream completion record/)
  }
  const input = pair()
  input.cp = Buffer.concat([header(105, 8, 10), Buffer.alloc(8), header(-1)])
  assert.throws(() => inspectRecordingPair(input), /Missing scheduled stream completion record/)
})

test('GP trailer must match the snapshot origin and final command counter', () => {
  for (const tail of [trailer(99, 130), trailer(100, 129)]) {
    const input = pair()
    tail.copy(input.gp, input.gp.length - 8)
    assert.throws(() => inspectRecordingPair(input), /GP trailer disagrees/)
  }
})

test('stream records stay within the snapshot-to-GP interval', () => {
  for (const counter of [99, 131]) {
    const input = pair()
    input.cp = Buffer.concat([header(counter), header(-1)])
    assert.throws(() => inspectRecordingPair(input), /Stream record outside snapshot-to-GP interval/)
  }
})

test('snapshot, sidecar version and counter requirements remain narrow', () => {
  for (const field of ['gm', 'version']) {
    const input = pair()
    input[field] = input[field].subarray(1)
    assert.throws(() => inspectRecordingPair(input), /Unsupported recording snapshot or sidecar/)
  }
  const wrongVersion = pair()
  wrongVersion.version.writeUInt32LE(107)
  assert.throws(() => inspectRecordingPair(wrongVersion), /Unsupported recording snapshot or sidecar/)
  const wrongCounter = pair()
  wrongCounter.gm.writeInt32LE(-1, 16)
  assert.throws(() => inspectRecordingPair(wrongCounter), /Invalid snapshot simulation counter/)
  assert.throws(() => inspectRecordingPair({ ...pair(), recordingId: 1.5 }), /Invalid recording ID/)
})
