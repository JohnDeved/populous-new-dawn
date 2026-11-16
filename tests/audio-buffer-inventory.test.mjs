import test from 'node:test'
import assert from 'node:assert/strict'
import { inventoryDecodedCueBuffers as inventory } from '../scripts/audio-buffer-inventory.mjs'

class BufferFixture {
  constructor(length = 48000, channels = 2, sampleRate = 48000) {
    Object.assign(this, { length, numberOfChannels: channels, sampleRate, duration: length / sampleRate })
  }
  getChannelData() { assert.fail('PCM must not be read') }
}
const fixture = () => ({ enabled: true, paused: true, context: { sampleRate: 48000, state: 'suspended' },
  buffers: new Map([['sound-1', new BufferFixture()], ['sound-2', new BufferFixture(24000, 1)]]) })

test('read-only inventory reports decoded metadata, gaps and bounded surplus without PCM', () => {
  const audio = fixture(), before = structuredClone(audio), buffers = [...audio.buffers.values()]
  const report = inventory(audio, ['sound-1', 'sound-3'], BufferFixture)
  assert.equal(report.payloadBytes, 48000 * 2 * 4 + 24000 * 4)
  assert.deepEqual(report.missing, ['sound-3'])
  assert.deepEqual(report.unexpected, ['sound-2'])
  assert.equal(report.contextState, 'suspended')
  assert.equal(report.paused, true)
  assert.deepEqual(structuredClone(audio), before)
  assert.deepEqual([...audio.buffers.values()], buffers)
  audio.buffers.get('sound-1').length = 1
  assert.equal(report.rows[0].length, 48000, 'receipt retains scalars, not buffer references')
})

test('exact expected set is complete while an empty decoded map remains visibly missing', () => {
  const audio = fixture()
  assert.deepEqual(inventory(audio, ['sound-2', 'sound-1'], BufferFixture).missing, [])
  audio.buffers.clear()
  const report = inventory(audio, ['sound-1'], BufferFixture)
  assert.deepEqual(report.missing, ['sound-1'])
  assert.equal(report.payloadBytes, 0)
})

for (const keys of [[], ['sound-1', 'sound-1'], ['x'.repeat(65)], ['https://private'], Array.from({ length: 513 }, (_, i) => `sound-${i}`)])
  test(`invalid expected key set rejects: ${keys.length} entries / first ${String(keys[0]).slice(0, 12)}`, () => {
    assert.throws(() => inventory(fixture(), keys, BufferFixture), /invalid expected key set/)
  })

for (const [name, mutate] of Object.entries({
  disabled: a => { a.enabled = false },
  missingContext: a => { a.context = null },
  rate: a => { a.context.sampleRate = NaN },
  state: a => { a.context.state = 'invented' },
  count: a => { a.buffers = new Map(Array.from({ length: 513 }, (_, i) => [`sound-${i}`, new BufferFixture()])) },
  wrongType: a => a.buffers.set('sound-1', {}),
  badKey: a => a.buffers.set('private/url', new BufferFixture()),
  length: a => { a.buffers.get('sound-1').length = 1.5 },
  channels: a => { a.buffers.get('sound-1').numberOfChannels = 0 },
  duration: a => { a.buffers.get('sound-1').duration = 4 },
  nonfinite: a => { a.buffers.get('sound-1').sampleRate = Infinity },
  overflow: a => { const b = a.buffers.get('sound-1'); b.length = Number.MAX_SAFE_INTEGER; b.duration = b.length / b.sampleRate },
})) test(`invalid owner or metadata rejects: ${name}`, () => {
  const audio = fixture(); mutate(audio)
  assert.throws(() => inventory(audio, ['sound-1'], BufferFixture), /Audio buffer inventory:/)
})


test('alias keys retain per-key rows without double-counting the same decoded buffer', () => {
  const audio = fixture(), buffer = audio.buffers.get('sound-1')
  audio.buffers.set('sound-2', buffer)
  const report = inventory(audio, ['sound-1', 'sound-2'], BufferFixture)
  assert.equal(report.observedCount, 2)
  assert.equal(report.uniqueBufferCount, 1)
  assert.equal(report.rows.length, 2)
  assert.equal(report.payloadBytes, buffer.length * buffer.numberOfChannels * 4)
})

test('over-budget scalar metadata rejects rather than truncating its report', () => {
  const audio = fixture()
  const keys = Array.from({ length: 512 }, (_, i) => `sound-${String(i).padStart(58, '0')}`)
  // Extreme but finite supplied metadata exercises serialization admission,
  // not a claim that a browser can allocate or decode these buffers.
  audio.buffers = new Map(keys.map(key => [key, new BufferFixture(1234567890123, 1, 1.2345678901234567e-200)]))
  assert.throws(() => inventory(audio, ['sound-missing'], BufferFixture), /serialized observation exceeds budget/)
})
