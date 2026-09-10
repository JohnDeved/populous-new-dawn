import assert from 'node:assert/strict'
import test from 'node:test'
import { Music, nextDrum } from '../app/music.ts'
import { ambientLayers, ambientAccent } from '../app/ambient-sound.ts'
import fixture from './fixtures/background-audio.json' with { type: 'json' }

test('music sections and ordinary ambient decisions match captured original execution', () => {
  for (const { input, expected } of fixture.music) {
    const { s, count } = structuredClone(input)
    assert.deepEqual({ sample: nextDrum(s, count), s }, expected)
  }
  for (const { input, expected } of fixture.ambient) {
    const w = { randomState: input.randomState },
      accents = []
    ambientAccent(w, input.s, cue => accents.push(cue))
    assert.deepEqual(
      { layers: ambientLayers(input.s), accents, randomState: w.randomState },
      expected
    )
  }
})

test('percussion uses audio timestamps at low/high/irregular frame rates and skips stale starts', () => {
  const run = intervals => {
    const starts = []
    const context = {
      currentTime: 0,
      createBufferSource: () => ({
        connect() {},
        addEventListener() {},
        start(time) {
          starts.push([time, this.buffer.id])
        },
      }),
    }
    const music = Object.assign(Object.create(Music.prototype), {
      context,
      gain: {},
      bank: 0,
      clips: [null, { id: 2 }, { id: 3 }, { id: 4 }],
      nextTime: 0,
      sources: new Set(),
      section: { activity: 2, variation: 0, release: false, battle: false },
    })
    for (let i = 0; context.currentTime < 60; i++) {
      music.schedule()
      context.currentTime += intervals[i % intervals.length]
    }
    return { starts, context, music }
  }
  const reference = run([1 / 30]).starts
  for (const intervals of [[1 / 60], [1 / 120], [1 / 144], [1 / 240], [0.008, 0.025, 0.09]])
    assert.deepEqual(run(intervals).starts, reference)
  const late = run([1 / 60]),
    count = late.starts.length
  late.context.currentTime = 100
  late.music.schedule()
  assert.equal(late.starts.length, count + 1)
  assert.equal(late.starts.at(-1)[0], 100.05)
})
