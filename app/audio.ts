import native from './original-sound.json' with { type: 'json' }
// First-mission cues; load these before enabling playback so combat doesn't wait on a fetch.
export const AUDIO_CUES = [
  0x53, 0x6, 0x13, 0x2c, 0x34, 0xb, 0xd, 0xe, 0x18, 0x19, 0x24, 0x25, 0x27, 0x2b, 0x32, 0x37, 0x43,
  0x58, 0x66, 0x70, 0x76, 0x77, 0x80, 0x8c, 0x8d, 0x96, 0x9f, 0xa1, 0xa2, 0xb2, 0xab, 0x29, 0xe3,
]
export function audioRandom(state: number) {
  const n = (Math.imul(state, 0x24a1) + 0x24df) >>> 0
  return ((n >>> 13) | (n << 19)) >>> 0
}
export function cueVariant(cue: number, state: number) {
  const row = native.cues[cue]
  if (!row?.samples.length) return null
  state = audioRandom(state)
  const sample = row.samples[state % row.samples.length]
  let pitch = 100
  if (row.pitchVariation) {
    state = audioRandom(state)
    pitch += (state % (row.pitchVariation * 2)) - row.pitchVariation
  }
  return { state, key: `${row.bank}-${sample}`, pitch: pitch / 100, volume: row.volume / 127 }
}
// 0x48b100: quadratic distance attenuation in native 1/256 map units.
export function soundAttenuation(distanceSquared: number) {
  return Math.max(0, Math.floor((0x9000000 - distanceSquared) / 0x900)) / 65536
}

export class Soundscape {
  context: AudioContext | null = null
  master: GainNode | null = null
  buffers = new Map<string, AudioBuffer>()
  loading: Promise<void> | null = null
  active = new Set<AudioBufferSourceNode>()
  enabled = false
  disposed = false
  randomState = 1 // Independent of simulation RNG; native initialization is still to be matched.
  volume = 0.35
  async enable() {
    if (this.disposed) return
    if (!this.context) {
      this.context = new AudioContext()
      this.master = this.context.createGain()
      this.master.gain.value = 0
      this.master.connect(this.context.destination)
    }
    const ctx = this.context
    await ctx.resume()
    if (!this.loading) {
      const samples = new Set(
        AUDIO_CUES.flatMap(c => native.cues[c].samples.map(s => `${native.cues[c].bank}-${s}`))
      )
      this.loading = Promise.all(
        [...samples].map(async key => {
          if (this.buffers.has(key)) return
          const response = await fetch(`/original/audio/${key}.wav`)
          if (!response.ok) throw new Error(`Sound sample failed: ${key}`)
          const buffer = await ctx.decodeAudioData(await response.arrayBuffer())
          if (!this.disposed) this.buffers.set(key, buffer)
        })
      )
        .then(() => {})
        .catch(e => {
          this.loading = null
          throw e
        })
    }
    await this.loading
    if (this.disposed) return
    this.enabled = true
    this.master!.gain.setValueAtTime(this.volume, ctx.currentTime)
    this.cue(0x66)
  }
  stopAll() {
    for (const source of this.active) source.stop()
    this.active.clear()
  }
  reset() {
    this.stopAll()
    this.randomState = 1
  }
  mute() {
    this.enabled = false
    this.stopAll()
    if (this.master && this.context) this.master.gain.setValueAtTime(0, this.context.currentTime)
  }
  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value))
    if (this.enabled && this.master && this.context)
      this.master.gain.setValueAtTime(this.volume, this.context.currentTime)
  }
  cue(cue: number, attenuation = 1, pan = 0, finished?: () => void) {
    if (!this.enabled || !this.context || !this.master || attenuation <= 0) return finished?.()
    const variant = cueVariant(cue, this.randomState)
    if (!variant) return finished?.()
    this.randomState = variant.state
    const buffer = this.buffers.get(variant.key)
    if (!buffer) return finished?.()
    // ponytail: browser voice cap; the original priority/stealing scheduler is not ported yet.
    if (this.active.size >= 64) this.active.values().next().value?.stop()
    const ctx = this.context,
      source = ctx.createBufferSource(),
      gain = ctx.createGain(),
      panner = ctx.createStereoPanner()
    source.buffer = buffer
    source.playbackRate.value = variant.pitch
    gain.gain.value = Math.floor(Math.min(1, attenuation) * variant.volume * 127) / 127
    panner.pan.value = Math.max(-1, Math.min(1, pan))
    source.connect(gain)
    gain.connect(panner)
    panner.connect(this.master)
    this.active.add(source)
    source.addEventListener(
      'ended',
      () => {
        this.active.delete(source)
        source.disconnect()
        gain.disconnect()
        panner.disconnect()
        finished?.()
      },
      { once: true }
    )
    source.start()
    return () => source.stop()
  }
  dispose() {
    this.disposed = true
    this.mute()
    this.buffers.clear()
    void this.context?.close()
  }
}
