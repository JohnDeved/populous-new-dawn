// Portable synthetic coverage for scripts/animation-cadence-audit.mjs (#214).
// No native executable, browser or game data is needed for these cases.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  classify,
  curatedRows,
  descriptorRule,
  effectSequenceRows,
  legacyUnitRows,
  markdown,
  nativeFps,
  personSourceDraw,
  sourceGate,
  summarize,
} from '../scripts/animation-cadence-audit.mjs'

const rates = { presentation: 24, logical: 12 }
const descriptors = []
descriptors[13] = { mode: 2, step: 0, hold: 0 }
descriptors[18] = { mode: 2, step: 1, hold: 0 }
descriptors[44] = { mode: 1, step: 4, hold: 16 }
// Person map: 2 states x 9 models. State 0 model 6 -> object 1 (source 48 draw 18),
// model 2 -> object 0 (source 48 draw 13).
const personAnimationObjects = Array(18).fill(-1)
personAnimationObjects[2] = 0
personAnimationObjects[6] = 1
const rules = {
  animationDescriptors: descriptors,
  animationObjects: [
    [48, 13],
    [48, 18],
    [56, 13],
  ],
  personAnimationObjects,
}
const cycle = (source, n) => [{ source, frames: [...Array(n).keys()], flip: false }]

test('descriptor rules: mode 2 holds step extra visits, mode 1 advances step/4', () => {
  assert.deepEqual(descriptorRule({ mode: 2, step: 1 }), { framesPerVisit: 0.5, loop: null })
  assert.deepEqual(descriptorRule({ mode: 1, step: 4, hold: 9 }), { framesPerVisit: 1, loop: 9 })
  assert.equal(descriptorRule(undefined), null)
  assert.equal(nativeFps(descriptorRule({ mode: 2, step: 1 }), true, rates), 6)
  assert.equal(nativeFps(descriptorRule({ mode: 1, step: 4 }), false, rates), 24)
})

test('classification separates matched, too-fast, too-slow and unknown', () => {
  assert.equal(classify(12, 12).status, 'matched')
  assert.deepEqual(classify(12, 6), { status: 'mismatched', ratio: 2, direction: 'too-fast' })
  assert.deepEqual(classify(12, 24), { status: 'mismatched', ratio: 0.5, direction: 'too-slow' })
  assert.equal(classify(null, 6).status, 'unknown')
  assert.equal(classify(12, null).status, 'unknown')
})

test('person source draw prefers the model column, then any object', () => {
  assert.deepEqual(personSourceDraw(rules, 6, 48), { draw: 18, via: 'person map state 0' })
  assert.deepEqual(personSourceDraw(rules, 2, 48), { draw: 13, via: 'person map state 0' })
  assert.equal(personSourceDraw(rules, 6, 56).draw, 13)
  assert.match(personSourceDraw(rules, 6, 56).via, /not in model column/)
  assert.equal(personSourceDraw(rules, 6, 99), null)
})

test('legacy unit rows flag a step-1 kind against a fixed fallback rate', () => {
  const units = {
    animations: {
      'blue-firewarrior': { walk: cycle(48, 4), carryIdle: cycle(48, 1) },
      'blue-brave': { walk: cycle(48, 4), pray: cycle(99, 3), idleGesture: cycle(48, 12) },
    },
  }
  const rows = legacyUnitRows({ rules, units, rates, legacyFps: () => 12 })
  const byId = Object.fromEntries(rows.map(r => [r.id, r]))
  assert.equal(byId['legacy-unit/blue-firewarrior/walk'].status, 'mismatched')
  assert.equal(byId['legacy-unit/blue-firewarrior/walk'].ratio, 2)
  assert.equal(byId['legacy-unit/blue-firewarrior/walk'].direction, 'too-fast')
  assert.equal(byId['legacy-unit/blue-firewarrior/carryIdle'].status, 'not-applicable')
  assert.equal(byId['legacy-unit/blue-brave/walk'].status, 'matched')
  assert.equal(byId['legacy-unit/blue-brave/pray'].status, 'unknown')
  assert.equal(byId['legacy-unit/blue-brave/idleGesture'].status, 'not-applicable')
  // A descriptor-aware fallback rate resolves the mismatch.
  const fixed = legacyUnitRows({ rules, units, rates, legacyFps: kind => (kind === 'firewarrior' ? 6 : 12) })
  assert.equal(fixed.find(r => r.id === 'legacy-unit/blue-firewarrior/walk').status, 'matched')
})

test('static gate evidence selects logical or presentation visits', () => {
  const setters = {
    drawsByObject: { 1304: [44], 1288: [44], 77: [44] },
    records: [
      { kind: 'constant', object: 1304, draw: 44, function: '00513830', gateWrites: ['005138a2'] },
      { kind: 'constant', object: 1288, draw: 44, function: '00509c10', gateWrites: [] },
      { kind: 'constant', object: 77, draw: 44 },
    ],
  }
  assert.equal(sourceGate(setters, 1304).gate, 'logical')
  assert.equal(sourceGate(setters, 1288).gate, 'presentation')
  assert.equal(sourceGate(setters, 77).gate, null)
  assert.equal(sourceGate(setters, 5).gate, null)
  const effects = { animations: { splash: Array(16).fill({ source: 1304 }), sparkle: Array(16).fill({ source: 1288 }), single: [{ source: 1 }] } }
  const families = [
    { sequence: 'splash', id: 'native', browserPerVisit: 1, browserVisits: 'logical', browserRule: 'native updater' },
    { sequence: 'sparkle', id: 'age', browserFps: 12, browserRule: 'age x 12', anchors: [{ file: 'a.ts', pattern: 'age \\* 12' }] },
  ]
  const rows = effectSequenceRows({ rules, effects, setters, rates, families, readSource: () => 'f.age * 12' })
  assert.equal(rows.length, 2)
  assert.equal(rows[0].status, 'matched')
  assert.equal(rows[0].native.fps, 12)
  assert.equal(rows[1].status, 'mismatched')
  assert.equal(rows[1].direction, 'too-slow')
  assert.equal(rows[1].anchors[0].line, 1)
  assert.equal(rows[1].stale, false)
})

test('curated rows report stale anchors and explicit unknowns', () => {
  const rows = curatedRows({
    rates,
    readSource: file => (file === 'ok.ts' ? 'line\nconst frame = animationFrame >> 1' : ''),
    families: [
      { id: 'a', group: 'scenery', family: 'A', browserPerVisit: 0.5, browserVisits: 'presentation', nativePerVisit: 1, nativeVisits: 'logical', anchors: [{ file: 'ok.ts', pattern: 'animationFrame >> 1' }] },
      { id: 'b', group: 'ui', family: 'B', browserFps: 12, status: 'unknown', nativeRule: 'not traced', anchors: [{ file: 'gone.ts', pattern: 'x' }] },
    ],
  })
  assert.equal(rows[0].status, 'matched')
  assert.equal(rows[0].anchors[0].line, 2)
  assert.equal(rows[1].status, 'unknown')
  assert.equal(rows[1].stale, true)
  const table = markdown({ rates: { 1: rates, 2: { presentation: 24, logical: 24 } }, rows })
  assert.match(table, /\| unknown STALE \| ui \| B \|/)
  assert.match(table, /Summary \(all rows\): mismatched 0, unknown 1, matched 1/)
  assert.deepEqual(summarize(rows), { mismatched: 0, unknown: 1, matched: 1, 'not-applicable': 0 })
})
