import assert from 'node:assert/strict'
import test from 'node:test'
import vm from 'node:vm'
import { assertWorshipAudio, installWorshipAudioProbe } from '../scripts/tutorial-browser/worship-acquisition-audio.mjs'

// Supplied Web Audio/DOM boundaries test the probe and checker, not browser playback.
async function probe({ missing = false, reject = false } = {}) {
  let click, removed = false
  class Soundscape {
    active = new Set()
    buffers = new Map()
    context = { state: 'running' }
    backgroundTimer = 1
    music = {}
    async enable() {
      if (reject) throw new Error('decode failure')
      if (!missing) this.buffers.set('sound-169', { duration: 1, length: 22050, numberOfChannels: 1, sampleRate: 22050 })
      return true
    }
    cue(cue) { assert.equal(cue, 0x71); if (this.buffers.has('sound-169')) this.active.add({ buffer: this.buffers.get('sound-169') }) }
    dispose() { this.active.clear(); this.buffers.clear(); this.backgroundTimer = null; this.music = null; this.context.state = 'closed' }
  }
  const button = { dataset: {}, addEventListener: (_, handler) => { click = handler }, remove: () => { removed = true } }
  const window = { __pndWorshipPanelFixture: { Soundscape } }
  vm.runInNewContext(`(${installWorshipAudioProbe.toString()})()`, {
    window, document: { createElement: () => button, body: { append() {} } },
  })
  await click({ isTrusted: true })
  assert.equal(removed, true)
  const state = window.__pndWorshipAudioProbe
  return { ...state.result, contextClosed: state.sound.context.state === 'closed' }
}

test('audio probe observes sample-specific source and cleanup', async () => {
  assertWorshipAudio(await probe())
})
test('missing sample fails even when enable succeeds', async () => {
  const result = await probe({ missing: true })
  assert.equal(result.matchingSources, 0)
  assert.throws(() => assertWorshipAudio(result))
})
test('decode rejection is preserved and disposed', async () => {
  const result = await probe({ reject: true })
  assert.match(result.error, /decode failure/)
  assert.equal(result.released, true)
  assert.equal(result.contextClosed, true)
  assert.throws(() => assertWorshipAudio(result))
})
test('checker rejects untrusted input, absent source, suspended context and incomplete cleanup', async () => {
  const good = await probe()
  for (const [field, value] of Object.entries({ trusted: false, enabled: false, contextRunning: false, matchingSources: 0, released: false, contextClosed: false }))
    assert.throws(() => assertWorshipAudio({ ...good, [field]: value }), field)
})
