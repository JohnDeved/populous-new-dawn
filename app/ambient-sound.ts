import { random, movePosition } from './native-math.ts'

// 0x48b2c0: the listener is 4096 native units behind the camera's map position.
export function soundListener(center: { x: number; y: number }, angle: number) {
  const listener = { ...center }
  movePosition(listener, angle, -4096)
  return listener
}

// 0x46ec80 counts tree models 1–6 in drawn cells only when this probe is positive.
// Distances 0–3 are deliberately excluded by the native low-two-bit mask.
export function treeAmbienceAudible(
  p: { x: number; y: number },
  listener: { x: number; y: number }
) {
  const x = ((p.x - listener.x) << 16) >> 16,
    y = ((p.y - listener.y) << 16) >> 16,
    squared = x * x + y * y
  return squared > 3 && squared <= 0x9000000
}

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
// Counts come from the renderer's submitted terrain triangles.
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
