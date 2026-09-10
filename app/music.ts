import data from './original-music.json' with { type: 'json' }
import { random } from './native-math.ts'

// 0x48c230: quiet, activity, and battle sections, including the two-bar release.
export function nextDrum(
  s: { activity: number; variation: number; release: boolean; battle: boolean },
  count: number
) {
  if (s.release) {
    s.release = false
    return 1
  }
  if (s.activity === 0) {
    s.variation = 0
    if (!s.battle) return 1
    s.battle = false
    s.release = true
    return 2
  }
  if (s.activity === 1) {
    s.variation = 0
    return 2
  }
  s.variation = (s.variation + 1) & 255
  const sample = s.variation === 4 && count === 4 ? 4 : 3
  if (s.variation === 4) s.variation = 0
  s.battle = true
  return sample
}

export class Music {
  element = new Audio()
  gain: GainNode
  media: MediaElementAudioSourceNode
  clips: (AudioBuffer | null)[] = []
  sources = new Set<AudioBufferSourceNode>()
  section = { activity: 0, variation: 0, release: false, battle: false }
  nextTime = 0
  bank: number
  drone: number
  context: AudioContext
  disposed = false
  loading: Promise<void>
  constructor(context: AudioContext, destination: AudioNode, rng: { randomState: number }) {
    this.context = context
    this.drone = (random(rng) & 3) + 2
    this.bank = random(rng) % 10
    this.gain = context.createGain()
    this.gain.gain.value = 0.65
    this.gain.connect(destination)
    this.element.src = `/original/audio/${data.drones[this.drone - 1].file}`
    this.element.preload = 'metadata'
    this.element.loop = true
    this.media = context.createMediaElementSource(this.element)
    this.media.connect(this.gain)
    // Stream the long drone. Only the chosen bank's short percussion clips decode.
    this.loading = Promise.all(
      data.drums[this.bank].map(async clip => {
        if (!clip.file) return null
        const response = await fetch(`/original/audio/${clip.file}`)
        if (!response.ok) throw new Error(`Music sample failed: ${clip.file}`)
        return context.decodeAudioData(await response.arrayBuffer())
      })
    ).then(clips => {
      if (!this.disposed) this.clips = clips
    })
  }
  schedule() {
    const now = this.context.currentTime
    if (!this.clips.length) return
    if (this.nextTime < now) this.nextTime = now + 0.05
    while (this.nextTime < now + 0.2) {
      const id = nextDrum(this.section, this.clips.length),
        clip = this.clips[id - 1]
      if (clip) {
        const source = this.context.createBufferSource()
        source.buffer = clip
        source.connect(this.gain)
        this.sources.add(source)
        source.addEventListener(
          'ended',
          () => {
            source.disconnect()
            this.sources.delete(source)
          },
          { once: true }
        )
        source.start(this.nextTime)
      }
      const sample = data.drums[this.bank][id - 1]
      this.nextTime += sample.frames / sample.rate
    }
  }
  reset() {
    this.element.currentTime = 0
    for (const source of this.sources) source.stop()
    this.sources.clear()
    this.section = { activity: 0, variation: 0, release: false, battle: false }
    this.nextTime = 0
  }
  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.reset()
    this.element.pause()
    this.element.removeAttribute('src')
    this.element.load()
    this.media.disconnect()
    this.gain.disconnect()
    this.clips = []
  }
}
