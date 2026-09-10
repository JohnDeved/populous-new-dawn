import native from './original-sound.json' with { type: 'json' }
import { Music } from './music.ts'
import {
  ambientLayers,
  ambientWeights,
  ambientGain,
  ambientAccent,
  type SoundEnvironment,
} from './ambient-sound.ts'
// First-mission cues; load these before enabling playback so combat doesn't wait on a fetch.
export const AUDIO_CUES = [
  0x26, 0x53, 0x6, 0x13, 0x2c, 0x34, 0xb, 0xd, 0xe, 0x18, 0x19, 0x24, 0x25, 0x27, 0x2b, 0x32, 0x37,
  0x43, 0x51, 0x58, 0x66, 0x70, 0x76, 0x77, 0x80, 0x8c, 0x8d, 0x96, 0x9f, 0xa1, 0xa2, 0xb2, 0xab,
  0x29, 0xe3, 0x28, 1, 2, 10, 20, 28, 29, 30, 31, 32, 33, 80, 84,
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
  musicVolume = 0.65
  music: Music | null = null
  paused = false
  generation = 0
  backgroundTimer: ReturnType<typeof setInterval> | null = null
  nextAccent = 0
  ambientVoices = new Map<number, { gain: GainNode; stop: () => void }>()
  environment: SoundEnvironment = {
    total: 1,
    low: 1,
    water: 0,
    high: 0,
    trees: true,
    overview: false,
    activity: 0,
  }

  async setPaused(paused: boolean) {
    this.paused = paused
    if (!this.enabled || !this.context || this.disposed) return
    if (paused) {
      if (this.backgroundTimer) clearInterval(this.backgroundTimer)
      this.backgroundTimer = null
      this.music?.element.pause()
      await this.context.suspend()
    } else {
      await this.context.resume()
      if (this.enabled && !this.paused && !this.disposed) {
        await this.music?.element.play()
        if (this.enabled && !this.paused && !this.disposed && !this.backgroundTimer)
          this.backgroundTimer = setInterval(() => this.updateBackground(), 50)
      }
    }
  }
  setMusicVolume(value: number) {
    this.musicVolume = Math.max(0, Math.min(1, value))
    if (this.music && this.context)
      this.music.gain.gain.setValueAtTime(this.musicVolume, this.context.currentTime)
  }
  updateBackground() {
    if (!this.enabled || this.paused || !this.context || this.context.state !== 'running') return
    if (this.music) {
      this.music.section.activity = this.environment.activity
      this.music.schedule()
    }
    const now = this.context.currentTime
    // Keep playing samples alive as the view changes, including layers which
    // leave the top three. Native 0x48a900 updates these voices until they end.
    for (const { cue, weight } of ambientWeights(this.environment))
      // 0x4895c0 returns before driver submission for the globe layer (33).
      if (cue !== 33)
        this.ambientVoices
          .get(cue)
          ?.gain.gain.setValueAtTime(ambientGain(weight, native.cues[cue].volume), now)
    for (const { cue, weight } of ambientLayers(this.environment)) {
      if (this.ambientVoices.has(cue)) continue
      const variant = cueVariant(cue, this.randomState)
      if (!variant) continue
      this.randomState = variant.state
      let voice: ReturnType<Soundscape['playSample']>
      voice = this.playSample(variant, 1, 0, () => {
        // An ended callback from before reset/mute must not remove its successor.
        if (this.ambientVoices.get(cue) === voice) this.ambientVoices.delete(cue)
      })
      if (voice) {
        voice.gain.gain.setValueAtTime(ambientGain(weight, native.cues[cue].volume), now)
        this.ambientVoices.set(cue, voice)
      }
    }
    // A delayed timer schedules from now; no storm of stale ambience after a stall.
    if (this.nextAccent < now - 0.25) this.nextAccent = now
    while (this.nextAccent <= now) {
      ambientAccent(this, this.environment, cue => {
        const variant = cueVariant(cue, this.randomState)
        if (!variant) return
        this.randomState = audioRandom(variant.state)
        variant.volume = (this.randomState % native.cues[cue].volume) / 127
        let pan = 0
        if (cue !== 84) {
          this.randomState = audioRandom(this.randomState)
          pan = (this.randomState & 127) / 63.5 - 1
        }
        this.playSample(variant, 1, pan)
      })
      this.nextAccent += 1 / 24
    }
  }
  async enable() {
    if (this.disposed) return false
    const { generation } = this
    if (!this.context) {
      this.context = new AudioContext()
      this.master = this.context.createGain()
      this.master.gain.value = 0
      this.master.connect(this.context.destination)
    }
    const ctx = this.context
    if (!this.music) this.music = new Music(ctx, this.master!, this)
    const { music } = this
    this.setMusicVolume(this.musicVolume)
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
    try {
      await Promise.all([this.loading, music.loading])
    } catch (error) {
      music.dispose()
      if (this.music === music) this.music = null
      throw error
    }
    if (this.disposed || generation !== this.generation) return false
    this.enabled = true
    this.master!.gain.setValueAtTime(this.volume, ctx.currentTime)
    await this.setPaused(this.paused)
    this.cue(0x66)
    return true
  }
  stopAll() {
    for (const source of this.active) source.stop()
    this.active.clear()
    this.ambientVoices.clear()
  }
  reset() {
    this.stopAll()
    this.randomState = 1
    this.music?.reset()
    this.nextAccent = 0
  }
  mute() {
    this.generation++
    this.enabled = false
    this.music?.element.pause()
    if (this.context && this.context.state !== 'closed') void this.context.suspend()
    if (this.backgroundTimer) clearInterval(this.backgroundTimer)
    this.backgroundTimer = null
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
    return this.playSample(variant, attenuation, pan, finished)?.stop
  }
  private playSample(
    variant: NonNullable<ReturnType<typeof cueVariant>>,
    attenuation: number,
    pan: number,
    finished?: () => void
  ) {
    const buffer = this.buffers.get(variant.key)
    if (!buffer || !this.context || !this.master) {
      finished?.()
      return
    }
    // ponytail: browser voice cap; the original priority/stealing scheduler is not ported yet.
    if (this.active.size >= 64) {
      const oldest = this.active.values().next().value!
      oldest.stop()
      // 'ended' is asynchronous: release the slot now, including same-frame bursts.
      this.active.delete(oldest)
    }
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
    return { stop: () => source.stop(), gain }
  }
  dispose() {
    this.disposed = true
    this.mute()
    this.music?.dispose()
    this.music = null
    this.buffers.clear()
    void this.context?.close()
  }
}
