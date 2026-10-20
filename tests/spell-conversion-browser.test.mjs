import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { conversionLimitMs, conversionObservationMs, validateConversionObservation,
  installConversionObserver } from '../scripts/tutorial-browser/spell-conversion.mjs'
import { browserCapMs } from '../scripts/tutorial-browser/scenario-policy.mjs'
import atlas from '../app/original-effects.json' with { type: 'json' }

function observation() {
  const sample = (turn, frame, x, targetX) => {
    const entry = atlas.animations.startConversion[frame - 1240]
    return { turn, stamp: turn, id: 9, targetId: 10, remaining: 165 - turn,
      x, z: -91, targetX, targetZ: -91, object: 1240, draw: 45, f1: (frame - 1240) * 4,
      flags: 0x104, palette: 0, frame, sequence: 'startConversion', visible: true,
      submitted: true, opacity: 1, texture: 'http://localhost/original/effects.png',
      size: [100, 100, 1], center: [0.5, 0], uv: [100 / atlas.width, 100 / atlas.height,
        entry.index % 8 * 256 / atlas.width, 1 - (Math.floor(entry.index / 8) * 256 + 100) / atlas.height] }
  }
  const first = sample(157, 1240, -45, -44.75), second = sample(158, 1242, -44.75, -44.75)
  first.cropFile = 'spell-conversion-frame-0.png'
  second.cropFile = 'spell-conversion-frame-1.png'
  return { error: null, bornTurn: 157,
    birth: { id: 9, targetId: 10, casts: 1, stock: 0, team: 'yellow', kind: 'brave',
      remaining: 8, linkedCount: 1, birthSubstitute: false, cue5: true, x: -45, z: -91 },
    terminal: { reason: 'logical-expiry', turn: 165, present: false, meshPresent: false, remaining: 0 },
    samples: [first, second, { ...second, turn: 161, object: 0x650, visible: false }],
    crops: [first, second].map(s => ({ filename: s.cropFile, frame: s.frame, turn: s.turn, stamp: s.stamp, colors: 10 })) }
}

test('bounded conversion validator rejects wrong art, stale crops, missed motion and late expiry', () => {
  validateConversionObservation(observation(), atlas)
  for (const corrupt of [
    o => { o.samples[0].object = 1441 },
    o => { o.samples[0].uv[2] = 0 },
    o => { o.crops[0].stamp++ },
    o => { o.samples[1].x = -45 },
    o => { o.terminal.turn++ },
    o => { o.samples[0].submitted = false },
    o => { o.samples[0].texture = '/original/unit-layers.png' },
    o => { o.birth.birthSubstitute = true },
    o => { o.birth.linkedCount = 2 },
    o => { o.crops[0].colors = 1 },
    o => { o.samples[2].visible = true },
  ]) {
    const wrong = observation(); corrupt(wrong)
    assert.throws(() => validateConversionObservation(wrong, atlas))
  }
})

test('conversion observation and existing F9/global deadlines stay finite and independent', () => {
  assert.equal(conversionLimitMs, 75000)
  assert.equal(conversionObservationMs, 30000)
  assert.equal(browserCapMs('frontend-held-escape'), 180000)
  const f9 = readFileSync(new URL('../scripts/tutorial-browser/spell-test-menu.mjs', import.meta.url), 'utf8')
  assert.match(f9, /55000/)
  const source = installConversionObserver.toString()
  assert.match(source, /keys\.size < 8/)
  assert.match(source, /world\.turn > result\.bornTurn \+ 8/)
  assert.doesNotMatch(source, /\.render\(|\.animate\(|\btick\(|\.focus\(/)
  assert.doesNotMatch(source, /world\.(?:paused|speed|units|effects|shots)\s*=/)
})
