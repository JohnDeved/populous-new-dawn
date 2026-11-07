import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { Soundscape, cueVariant } from '../app/audio.ts'
import { SPELL_CAST_CUES, SPELL_CAST_VOICES } from '../app/spell-audio-cues.ts'
import native from '../app/original-sound.json' with { type: 'json' }

const effectCues = [0x15, 0xa3, 0xa9, 0xad, 0xaf, 0xb0]

function fixture(t) {
  const state = { requests: [], starts: [], failedKey: null }
  const node = () => ({ connect() {}, disconnect() {} })
  const gain = () => ({ ...node(), gain: { value: 0, setValueAtTime() {} } })
  const sound = new Soundscape()
  sound.context = {
    state: 'suspended', currentTime: 0,
    createGain: gain,
    createStereoPanner() { return { ...node(), pan: { value: 0 } } },
    createBufferSource() {
      let ended
      return {
        ...node(), playbackRate: { value: 1 },
        addEventListener(_event, callback) { ended = callback },
        start() { state.starts.push({ key: this.buffer.key, pitch: this.playbackRate.value }) },
        stop() { ended?.() },
      }
    },
    decodeAudioData: async key => ({ key }),
    async resume() { this.state = 'running' },
    async suspend() { this.state = 'suspended' },
    async close() { this.state = 'closed' },
  }
  sound.master = gain()
  const music = () => ({
    loading: Promise.resolve(), gain: gain(),
    element: { play: async () => {}, pause() {} },
    dispose() {},
  })
  sound.music = music()
  t.mock.method(globalThis, 'fetch', async (url, { signal }) => {
    const key = url.match(/\/([^/]+)\.wav$/)[1]
    state.requests.push({ key, signal })
    return { ok: key !== state.failedKey, arrayBuffer: async () => key }
  })
  t.mock.method(globalThis, 'setInterval', () => ({}))
  t.mock.method(globalThis, 'clearInterval', () => {})
  t.after(() => sound.dispose())
  return { sound, state, music }
}

function assertEveryVariant(sound, state, cue) {
  const row = native.cues[cue]
  const pending = new Set(row.samples.map(sample => `${row.bank}-${sample}`))
  for (const key of pending) assert.ok(sound.buffers.has(key), `cue ${cue}: ${key} is preloaded`)
  // Select every actual native sample via the unchanged cue RNG, rather than
  // injecting a variant directly into private playback.
  for (let seed = 0; pending.size && seed < 10000; seed++) {
    const expected = cueVariant(cue, seed)
    if (!pending.has(expected.key)) continue
    sound.randomState = seed
    const before = state.starts.length
    let finished = 0
    const stop = sound.cue(cue, 1, 0, () => finished++)
    assert.equal(typeof stop, 'function', `cue ${cue} creates a playable source`)
    assert.equal(state.starts.length, before + 1)
    assert.deepEqual(state.starts.at(-1), { key: expected.key, pitch: expected.pitch })
    assert.equal(sound.randomState, expected.state, 'playback preserves cue RNG progression')
    assert.equal(finished, 0, 'a loaded cue is not silently retired')
    stop()
    assert.equal(finished, 1)
    pending.delete(expected.key)
  }
  assert.equal(pending.size, 0, `all variants of cue ${cue} were exercised`)
}

test('the shared table preserves the live cast mappings and feeds the ordinary emitter', () => {
  const spells = ['blast', 'convertWild', 'hypnotise', 'ghostArmy', 'lightning', 'bridge',
    'flatten', 'erosion', 'swamp', 'firestorm', 'earthquake', 'angel', 'volcano', 'tornado',
    'shield', 'invisibility', 'armageddon', 'bloodlust', 'teleport', 'swarm']
  assert.deepEqual(Object.keys(SPELL_CAST_VOICES.blue), spells)
  assert.deepEqual(Object.keys(SPELL_CAST_VOICES.other), spells)
  assert.deepEqual(Object.values(SPELL_CAST_VOICES.blue),
    [118, 133, 123, 125, 119, 128, 131, 126, 127, 124, 130, 129, 132, 120, 135, 122, 134, 136, 137, 121])
  assert.deepEqual(Object.values(SPELL_CAST_VOICES.other),
    [140, 155, 145, 147, 141, 150, 153, 148, 149, 146, 152, 151, 154, 142, 157, 144, 156, 158, 159, 143])
  assert.deepEqual(new Set(SPELL_CAST_CUES),
    new Set(Object.values(SPELL_CAST_VOICES).flatMap(Object.values)))
  const source = readFileSync(new URL('../app/spell-casting.ts', import.meta.url), 'utf8')
  assert.match(source, /import \{ SPELL_CAST_VOICES \} from '\.\/spell-audio-cues\.ts'/)
  assert.match(source, /sound\(w, SPELL_CAST_VOICES\[u\.team === 'blue' \? 'blue' : 'other'\]\[spell\], u\)/)
  assert.match(source, /castVoice\(w, u, spell\)/)
})

test('enable loads and plays every mapped spell-cast voice variant', async t => {
  const { sound, state } = fixture(t)
  assert.equal(await sound.enable(), true)
  for (const cue of SPELL_CAST_CUES) assertEveryVariant(sound, state, cue)
  const keys = state.requests.map(request => request.key)
  assert.equal(new Set(keys).size, keys.length, 'shared samples are loaded only once')
})

test('enable loads and plays the emitted Earthquake, Tornado, Erosion and Volcano effects', async t => {
  const { sound, state } = fixture(t)
  assert.equal(await sound.enable(), true)
  for (const cue of effectCues) assertEveryVariant(sound, state, cue)
})

test('intentionally empty native Shield voice rows stay silent without consuming RNG', async t => {
  const { sound, state } = fixture(t)
  assert.equal(await sound.enable(), true)
  for (const cue of [SPELL_CAST_VOICES.blue.shield, SPELL_CAST_VOICES.other.shield]) {
    assert.deepEqual(native.cues[cue].samples, [])
    const before = state.starts.length, randomState = sound.randomState
    let finished = 0
    assert.equal(sound.cue(cue, 1, 0, () => { finished++ }), undefined)
    assert.equal(finished, 1)
    assert.equal(state.starts.length, before)
    assert.equal(sound.randomState, randomState)
  }
})

test('a newly covered sample failure remains visible and a later explicit retry recovers', async t => {
  const { sound, state, music } = fixture(t)
  state.failedKey = 'sound-226'
  await assert.rejects(sound.enable(), /Sound sample failed: sound-226/)
  assert.equal(sound.enabled, false)
  assert.equal(sound.loading, null)
  assert.equal(sound.music, null)
  state.failedKey = null
  sound.music = music()
  assert.equal(await sound.enable(), true)
  assertEveryVariant(sound, state, SPELL_CAST_VOICES.blue.convertWild)
})
