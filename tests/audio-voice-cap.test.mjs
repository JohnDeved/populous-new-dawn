import assert from 'node:assert/strict'
import test from 'node:test'
import { Soundscape } from '../app/audio.ts'

// Supplied WebAudio nodes defer ended delivery like the browser. This exercises
// the actual mixer method, not media loading, audibility or native priorities.
function fixture() {
  const sources = [], completed = []
  const node = () => ({ disconnects: 0, connect() {}, disconnect() { this.disconnects++ } })
  const sound = {
    buffers: new Map([['sample', {}]]), master: {}, active: new Set(),
    context: {
      createGain: () => ({ ...node(), gain: { value: 0 } }),
      createStereoPanner: () => ({ ...node(), pan: { value: 0 } }),
      createBufferSource() {
        const source = { ...node(), playbackRate: { value: 0 }, stops: 0,
          start() {}, stop() { this.stops++ },
          addEventListener(name, callback, options) {
            assert.equal(name, 'ended'); assert.equal(options.once, true)
            this.end = () => { this.end = () => {}; callback() }
          } }
        sources.push(source)
        return source
      },
    },
  }
  const play = () => {
    const id = sources.length
    Soundscape.prototype.playSample.call(sound,
      { key: 'sample', pitch: 1, volume: 1 }, 1, 0, () => completed.push(id))
  }
  return { sound, sources, completed, play }
}

test('same-frame bursts retire distinct oldest voices without exceeding 64 active slots', () => {
  const f = fixture()
  for (let i = 0; i < 80; i++) {
    f.play()
    assert.equal(f.sound.active.size, Math.min(i + 1, 64))
  }
  assert.deepEqual(f.sources.map(s => s.stops), [...Array(16).fill(1), ...Array(64).fill(0)])
  assert.deepEqual([...f.sound.active], f.sources.slice(16))
  assert.deepEqual(f.completed, [], 'stop does not synchronously deliver ended')
  for (const source of f.sources.slice(0, 16).reverse()) source.end()
  assert.deepEqual([...f.sound.active], f.sources.slice(16), 'late callbacks cannot retire surviving voices')
  assert.deepEqual(f.completed, Array.from({ length: 16 }, (_, i) => 15 - i))
  for (const source of f.sources.slice(16)) source.end()
  assert.equal(f.sound.active.size, 0)
  assert.equal(new Set(f.completed).size, 80)
  assert.ok(f.sources.every(s => s.disconnects === 1))
})

test('natural completion frees capacity before the next voice without stealing a survivor', () => {
  const f = fixture()
  for (let i = 0; i < 64; i++) f.play()
  f.sources[20].end()
  assert.equal(f.sound.active.size, 63)
  f.play()
  assert.equal(f.sound.active.size, 64)
  assert.ok(f.sources.every(s => s.stops === 0))
  f.play()
  assert.equal(f.sources[0].stops, 1)
  assert.equal(f.sound.active.size, 64)
  for (const source of f.sources) source.end()
  assert.equal(f.sound.active.size, 0)
  assert.equal(f.completed.length, 66)
})
