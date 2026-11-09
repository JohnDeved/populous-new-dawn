import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'

// Execute the actual sound-event consumer and signed-short helper without loading
// the Scene, game assets or WebAudio. These are supplied scene/sound boundaries,
// not an audible browser, native-execution or full-mixer comparison.
const audio = readFileSync(new URL('../app/audio.ts', import.meta.url), 'utf8')
const math = readFileSync(new URL('../app/native-math.ts', import.meta.url), 'utf8')
function between(source, start, end) {
  assert.equal(source.split(start).length, 2)
  const at = source.indexOf(start)
  const until = source.indexOf(end, at)
  assert.ok(until > at)
  return source.slice(at, until)
}
const functions = [
  between(math, 'export const short =', '\ninterface Point'),
  between(audio, 'export function soundAttenuation(', '\nexport function soundEnvironment('),
  between(audio, 'export function playWorldSounds(', '\nexport class Soundscape'),
]
  .join('\n')
  .replace(/^export /gm, '')
const { playWorldSounds } = new Function(
  stripTypeScriptTypes(functions) + ';return { playWorldSounds }'
)()

function sample(event, viewpoint = { x: 0, z: 0 }) {
  const calls = []
  const scene = {
    world: { sounds: [{ serial: 1, cue: 7, ...event }], effects: [], buildings: [], units: [] },
    soundSerial: 0,
    viewPoint: viewpoint,
    ownedSounds: new Map(),
    screen: () => ({ x: 0.375 }),
    onSound: (...args) => {
      calls.push(args)
    },
  }
  playWorldSounds(scene)
  assert.equal(calls.length, 1)
  playWorldSounds(scene)
  assert.equal(calls.length, 1, 'consumed events are not replayed')
  return calls[0]
}

for (const axis of ['x', 'z']) {
  for (const sign of [-1, 1]) {
    test(`${axis} seam ${sign}: nearby positional sound retains the equivalent interior gain`, () => {
      const edge = sample({ x: 0, z: 0, [axis]: sign * 127 }, { x: 0, z: 0, [axis]: -sign * 127 })
      const inside = sample({ x: 0, z: 0, [axis]: sign * 2 })
      assert.ok(inside[1] > 0)
      assert.deepEqual(edge, inside)
    })
  }
}

test('simultaneous seams use the same two-axis distance as an interior sound', () => {
  assert.deepEqual(sample({ x: 127, z: -127 }, { x: -127, z: 127 }), sample({ x: 2, z: -2 }))
})

test('ordinary interior distance and projected pan remain unchanged', () => {
  const result = sample({ x: 3, z: 4 })
  assert.equal(result[1], Math.floor((0x9000000 - 25 * 256 * 256) / 0x900) / 65536)
  assert.equal(result[2], 0.375)
})

test('distant toroidal sounds remain silent', () => {
  assert.equal(sample({ x: 64, z: 0 })[1], 0)
  assert.equal(sample({ x: 128, z: 128 })[1], 0)
})

test('global notification cues retain full gain and centered pan across a seam', () => {
  for (const cue of [0x6b, 0xe3, 0xe4, 0xa2, 225, 226])
    assert.deepEqual(sample({ cue, x: 127, z: 127 }, { x: -127, z: -127 }), [cue, 1, 0])
})
