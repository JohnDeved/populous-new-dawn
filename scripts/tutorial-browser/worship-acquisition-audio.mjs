import assert from 'node:assert/strict'

// Supplied cue invocation tests actual Web Audio loading and playback, not natural worship.
export function installWorshipAudioProbe() {
  const button = document.createElement('button')
  button.dataset.worshipAudioProbe = 'true'
  button.textContent = 'Test worship acquisition audio'
  document.body.append(button)
  button.addEventListener('click', async event => {
    // Do not leave the test control in panel screenshots while loading continues.
    button.remove()
    const sound = new window.__pndWorshipPanelFixture.Soundscape()
    const result = { trusted: event.isTrusted }
    window.__pndWorshipAudioProbe = { sound, result }
    try {
      result.enabled = await sound.enable()
      result.contextRunning = sound.context?.state === 'running'
      const buffer = sound.buffers.get('sound-169')
      result.buffer = buffer ? {
        duration: buffer.duration, length: buffer.length,
        channels: buffer.numberOfChannels, sampleRate: buffer.sampleRate,
      } : null
      const before = new Set(sound.active)
      sound.cue(0x71)
      result.matchingSources = [...sound.active].filter(source => !before.has(source) && source.buffer === buffer && buffer).length
    } catch (error) {
      result.error = String(error)
    } finally {
      sound.dispose()
      result.released = sound.active.size === 0 && sound.buffers.size === 0 && sound.backgroundTimer === null && sound.music === null
      button.remove()
      result.done = true
    }
  }, { once: true })
}

export function assertWorshipAudio(result) {
  assert.equal(result.error, undefined, 'Real Soundscape enable must succeed')
  assert.equal(result.trusted, true)
  assert.equal(result.enabled, true)
  assert.equal(result.contextRunning, true)
  assert.ok(result.buffer?.duration > 0 && result.buffer?.length > 0 && result.buffer?.sampleRate > 0)
  assert.equal(result.buffer.channels, 1)
  assert.equal(result.matchingSources, 1, 'Cue 0x71 must start the actual decoded sound-169 buffer')
  assert.equal(result.released, true)
  assert.equal(result.contextClosed, true)
}

// Read-only bounded scalar snapshot; no method calls on audio owners.
export function snapshotWorshipAudio() {
  const probe = window.__pndWorshipAudioProbe
  if (!probe) return { present: false }
  const { sound, result } = probe
  return {
    present: true, done: result.done === true, trusted: result.trusted,
    enabled: sound.enabled, contextState: sound.context?.state ?? null,
    decodedSamples: sound.buffers.size, acquisitionDecoded: sound.buffers.has('sound-169'),
    activeSources: sound.active.size, musicReadyState: sound.music?.element?.readyState ?? null,
    musicPaused: sound.music?.element?.paused ?? null,
    musicErrorCode: sound.music?.element?.error?.code ?? null,
    disposed: sound.disposed, error: result.error?.slice(0, 512) ?? null,
  }
}
