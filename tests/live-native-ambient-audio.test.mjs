import assert from 'node:assert/strict'
import test from 'node:test'
import native from '../app/original-sound.json' with { type: 'json' }
import { ambientLayers, ambientWeights, soundListener, treeAmbienceAudible } from '../app/ambient-sound.ts'
import { Soundscape, playWorldSounds, soundEnvironment } from '../app/audio.ts'

const environment = overrides => ({ total: 19, low: 5, water: 7, high: 7, trees: false,
  overview: false, activity: 0, ...overrides })
const mixer = source => {
  const sound = new Soundscape()
  sound.enabled = true; sound.context = { state: 'running', currentTime: 1 }
  sound.nextAccent = 10 // Drive admission/update only, not the accent timer in this fixture.
  sound.environment = source
  return sound
}
const gain = writes => ({ gain: { setValueAtTime(value, time) { writes.push([value, time]) } } })

test('004895c0 production ambient update writes integer-scaled native gain and skips existing globe output', () => {
  const sound = mixer(environment({})), land = [], globe = []
  sound.ambientVoices.set(29, { gain: gain(land), stop() {} })
  sound.ambientVoices.set(33, { gain: gain(globe), stop() {} })
  sound.playSample = () => undefined // No unrelated sample admission.
  // The quotient is not integral; observe byte truncation before /127 normalization.
  const rawVolume = native.cues[29].volume
  assert.notEqual((67 * rawVolume) % 256, 0)
  sound.updateBackground()
  assert.deepEqual(land, [[(67 * rawVolume >>> 8) / 127, 1]])
  assert.deepEqual(globe, [])
  sound.environment = environment({ overview: true }); sound.updateBackground()
  assert.deepEqual(land.at(-1), [0, 1])
  assert.deepEqual(globe, [], 'existing cue 33 does not receive the driver-style update')
})

test('00489a30 live environment handoff computes ordinary, empty and overview terrain-layer weights', () => {
  const painter = { terrainAmbience: { result: () => ({ total: 19, low: 5, water: 7, high: 7 }) } }
  const scene = { view: { painter }, overviewActive: false, world: { musicActivity: 6 } }
  const sample = soundEnvironment(scene)
  assert.equal(painter.pendingSoundEnvironment, sample)
  assert.deepEqual(ambientWeights(sample).map(value => [value.cue, value.weight]),
    [[29, 67], [30, 10], [31, 94], [33, 0], [32, 94]])
  const empty = environment({ total: 0, low: 0, high: 0, water: 0 })
  assert.deepEqual(ambientWeights(empty).map(value => value.weight), [0, 0, 0, 0, 0])
  scene.overviewActive = true
  assert.deepEqual(ambientWeights(soundEnvironment(scene)).map(value => value.weight), [0, 0, 0, 255, 0])
})

test('00489770 production background admits the ranked top three, retaining loaded voices', () => {
  const sound = mixer(environment({})), samples = []
  sound.playSample = variant => {
    samples.push(variant.key)
    return { gain: gain([]), stop() {} }
  }
  assert.deepEqual(ambientLayers(sound.environment).map(x => x.cue), [31, 32, 29])
  sound.updateBackground()
  assert.deepEqual([...sound.ambientVoices.keys()], [31, 32, 29])
  assert.equal(samples.length, 3)
  sound.updateBackground()
  assert.equal(samples.length, 3, 'existing eligible cues are not resubmitted')
  sound.environment = environment({ total: 1, low: 0, water: 1, high: 0 })
  sound.updateBackground()
  assert.equal(samples.length, 3)
  assert.deepEqual([...sound.ambientVoices.keys()], [31, 32, 29])
})

test('0048b100 production world audio consumes the quantized squared-distance volume including signed wrap and cutoff', () => {
  const submitted = []
  // Positional cue shared by all these records. Screen pan is intentionally a Web
  // witness, not the browser implementation of the native stereo calculation.
  const ds = [0, 47.99609375, 48, 48.00390625, 255.99609375]
  const scene = { soundSerial: 0, world: { sounds: ds.map((x, i) => ({ serial: i + 1, cue: 5, x, z: 0 })) },
    ownedSounds: new Map(), viewPoint: { x: 0, z: 0 }, screen: () => ({ x: -.25 }),
    onSound(cue, volume, pan) { submitted.push([cue, volume, pan]) } }
  playWorldSounds(scene)
  assert.deepEqual(submitted, [1, 10 / 65536, 0, 0, 65535 / 65536].map(v => [5, v, -.25]))
  assert.equal(scene.soundSerial, 5)
})

test('0048b2c0 listener route places the signed native offset behind cardinal views and wraps tree ranges', () => {
  const center = Object.freeze({ x: 2, y: 3 })
  const yaw0 = soundListener(center, 0), yaw90 = soundListener(center, 512)
  assert.deepEqual(yaw0, { x: 2, y: 61443 })
  assert.deepEqual(yaw90, { x: 61442, y: 3 })
  const yaw180 = soundListener({ x: 65535, y: 65535 }, 1024)
  assert.deepEqual(yaw180, { x: 65535, y: 4095 })
  // Range threshold from 0048b2c0; positive-only low-bit gate belongs to its
  // drawn-tree consumer 0046ec80, not to the native range-return routine.
  const probe = { x: 65535, y: 100 }
  assert.equal(treeAmbienceAudible({ x: 12287, y: 100 }, probe), true)
  assert.equal(treeAmbienceAudible({ x: 12288, y: 100 }, probe), false)
  assert.equal(treeAmbienceAudible({ x: 0, y: 100 }, probe), false)
  assert.equal(treeAmbienceAudible({ x: 1, y: 100 }, probe), true)
})
