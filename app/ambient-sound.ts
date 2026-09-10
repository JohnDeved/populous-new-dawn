import { random } from './native-math.ts'

export interface SoundEnvironment {
  total: number
  low: number
  water: number
  high: number
  trees: boolean
  overview: boolean
  activity: number
}

// 0x489a30 + 0x489770, ordinary landscape: rank the five environmental layers.
// Counts are view-dependent; the browser supplies a bounded camera neighborhood.
export function ambientWeights(s: SoundEnvironment) {
  let weights = [0, 0, 0, 0, 0]
  if (s.overview) weights[3] = 255
  else if (s.total)
    weights = [
      Math.trunc((s.low * 256) / s.total),
      2 * Math.min(s.low, s.water),
      Math.trunc((s.high * 256) / s.total),
      0,
      Math.trunc((s.water * 256) / s.total),
    ]
  return weights.map((weight, i) => ({ cue: [29, 30, 31, 33, 32][i], weight }))
}

// 0x4895c0: native byte volume, including truncation before master volume.
export function ambientGain(weight: number, volume: number) {
  return (Math.floor((weight * volume) / 256) & 255) / 127
}

export function ambientLayers(s: SoundEnvironment) {
  const layers = ambientWeights(s)
  // Five entries only. Native exchanges also reorder ties, which changes cue RNG.
  for (let i = 0; i < layers.length; i++)
    for (let j = i + 1; j < layers.length; j++)
      if (layers[j].weight > layers[i].weight) [layers[i], layers[j]] = [layers[j], layers[i]]
  return layers.slice(0, 3).filter(layer => layer.weight > 0)
}

// Original ordinary-world bird/tree probabilities, evaluated at a fixed 24 Hz
// presentation cadence, never once per browser frame.
export function ambientAccent(
  rng: { randomState: number },
  s: SoundEnvironment,
  play: (cue: number) => void
) {
  if (s.overview) {
    if ((random(rng) & 127) === 0) play(84)
    return
  }
  if (s.water === s.total && (random(rng) & 255) === 0) play(80)
  if ((random(rng) & 127) === 0 && s.trees) play(28)
}
