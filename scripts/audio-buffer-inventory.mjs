// Read-only snapshot for an existing owned audio workload. The caller must bind
// this observer and expected keys to its exact source and existing deadline.
// No browser launch, AudioContext creation, decoding or PCM reads occur here.
export function inventoryDecodedCueBuffers(audio, expectedKeys, BufferType = globalThis.AudioBuffer) {
  const fail = message => { throw new Error(`Audio buffer inventory: ${message}`) }
  const limit = 512
  const validKey = key => typeof key === 'string' && /^[a-z][a-z0-9-]{0,63}$/.test(key)
  if (!Array.isArray(expectedKeys) || expectedKeys.length === 0 || expectedKeys.length > limit ||
      expectedKeys.some(key => !validKey(key)) || new Set(expectedKeys).size !== expectedKeys.length)
    fail('invalid expected key set')
  if (!audio?.enabled || !audio.context || !(audio.buffers instanceof Map) || audio.buffers.size > limit)
    fail('unavailable owner or excessive buffer count')
  if (typeof BufferType !== 'function') fail('AudioBuffer type unavailable')
  const contextRate = audio.context.sampleRate
  if (!Number.isFinite(contextRate) || contextRate <= 0) fail('invalid context sample rate')
  if (!['running', 'suspended', 'closed', 'interrupted'].includes(audio.context.state)) fail('invalid context state')
  const expected = new Set(expectedKeys), observed = new Set(), retainedBuffers = new Set(), rows = []
  let payloadBytes = 0
  for (const [key, buffer] of audio.buffers) {
    if (!validKey(key) || !(buffer instanceof BufferType)) fail('invalid key or buffer type')
    const { length, numberOfChannels: channels, sampleRate, duration } = buffer
    if (!Number.isSafeInteger(length) || length <= 0 || !Number.isSafeInteger(channels) || channels <= 0 ||
        channels > 32 || !Number.isFinite(sampleRate) || sampleRate <= 0 ||
        !Number.isFinite(duration) || duration <= 0 || Math.abs(duration - length / sampleRate) > 1 / sampleRate)
      fail(`invalid metadata for ${key}`)
    const bytes = length * channels * 4
    if (!Number.isSafeInteger(bytes) || (!retainedBuffers.has(buffer) && !Number.isSafeInteger(payloadBytes + bytes))) fail('unsafe payload sum')
    if (!retainedBuffers.has(buffer)) payloadBytes += bytes
    retainedBuffers.add(buffer)
    observed.add(key)
    rows.push({ key, expected: expected.has(key), length, channels, sampleRate, duration, payloadBytes: bytes })
  }
  rows.sort((a, b) => a.key.localeCompare(b.key))
  const report = {
    scope: 'retained-decoded-cue-payload-only',
    expectedCount: expected.size, observedCount: observed.size,
    missing: expectedKeys.filter(key => !observed.has(key)).sort(),
    unexpected: rows.filter(row => !row.expected).map(row => row.key),
    contextSampleRate: contextRate, contextState: audio.context.state,
    paused: audio.paused === true, uniqueBufferCount: retainedBuffers.size,
    payloadAccounting: 'unique-buffer-identity; per-key rows may alias', payloadBytes, rows,
  }
  // All keys are bounded ASCII and fields are numeric/scalar, so UTF-8 bytes
  // equal string length. Never silently truncate an over-budget observation.
  if (JSON.stringify(report).length > 128 * 1024) fail('serialized observation exceeds budget')
  return report
}
