import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'

const source = readFileSync(new URL('../app/original-credits-layout.ts', import.meta.url), 'utf8')
const javascript = stripTypeScriptTypes(source)
const { wrapOriginalCreditsText: wrap, layoutOriginalCredits: layout } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`
)
const font = (width = 1, aHeight = 10) => ({ widths: Array(224).fill(width), aHeight })
const fonts = { heading: font(2, 20), name: font() }
const screen = { width: 10, height: 50 }
const name = text => ({ headingId: 0, text })
const plan = (records, origin = 0, overrides = {}) =>
  layout(records, {}, fonts, screen, origin, ...('maxWork' in overrides ? [overrides.maxWork] : []))

test('empty text yields one row and exhausted text retains final spaces', () => {
  assert.deepEqual(wrap('', 10, font()), [''])
  assert.deepEqual(wrap('A  ', 10, font()), ['A  '])
})

test('wrapping permits the final glyph to exceed the target width', () => {
  assert.deepEqual(wrap('AB', 1, font(10)), ['A', 'B'])
})

test('Western punctuation is kept at a break while one trailing break space is removed', () => {
  for (const punctuation of ['-', '.', ',', ':', ';']) {
    assert.deepEqual(wrap(`A${punctuation}BC`, 3, font()), [`A${punctuation}`, 'BC'])
  }
  assert.deepEqual(wrap('A  BC', 3, font()), ['A ', 'BC'])
})

test('non-null resume at the final NUL retains an extra empty row', () => {
  assert.deepEqual(wrap('A ', 1, font()), ['A', ''])
  assert.deepEqual(wrap('A  ', 2, font()), ['A', ''])
})

test('each line buffer holds at most 127 characters even for zero-width glyphs', () => {
  assert.deepEqual(wrap('A'.repeat(128), 32767, font(0)), ['A'.repeat(127), 'A'])
  assert.deepEqual(wrap(' '.repeat(140), 32767, font()), [' '.repeat(126), ''])
})

test('ordinary layout uses a 30-unit heading gap and each selected font A height', () => {
  const result = layout([{ headingId: 1071, text: 'AB' }], { 1071: 'Head' }, fonts, screen, 0)
  assert.deepEqual(result.submissions, [
    { recordIndex: 0, font: 'heading', text: 'Head', x: 1, y: 30 },
    { recordIndex: 0, font: 'name', text: 'AB', x: 4, y: 50 },
  ])
  assert.equal(result.origin, 0)
})

test('centering rounds negative odd differences down like signed arithmetic shift', () => {
  const result = layout([name('A')], {}, { heading: font(), name: font(10) }, { width: 1, height: 10 }, 0)
  assert.equal(result.submissions[0].x, -5)
})

test('a row at -20 is submitted but a row at -21 is skipped', () => {
  assert.deepEqual(plan([name('A')], -20).submissions.map(row => row.y), [-20])
  assert.deepEqual(plan([name('A')], -21).submissions, [])
})

test('skipped rows still advance by the current font height', () => {
  const result = plan([name('A'), name('B')], -21)
  assert.deepEqual(result.submissions.map(row => [row.recordIndex, row.y]), [[1, -11]])
})

test('the viewport-height stop is at record boundaries, not inside a wrapped record', () => {
  const result = layout([name('ABC'), name('D')], {}, fonts, { width: 1, height: 10 }, 0)
  assert.deepEqual(result.submissions.map(row => [row.text, row.y]), [['A', 0], ['B', 10], ['C', 20]])
  assert.equal(result.visitedRecords, 1)
  assert.equal(result.completedPasses, 0)
})

test('starting at or below the bottom produces no traversal or automatic reset', () => {
  for (const origin of [50, 51, 100]) {
    assert.deepEqual(plan([name('A')], origin), {
      submissions: [], origin, visitedRecords: 0, completedPasses: 0,
    })
  }
})

test('empty record lists leave the origin unchanged', () => {
  assert.deepEqual(plan([], -100), {
    submissions: [], origin: -100, visitedRecords: 0, completedPasses: 0,
  })
})

test('tail traversal repeats with screen-height plus 20 rather than ending Credits', () => {
  const result = plan([name('A')], -100)
  assert.deepEqual(result.submissions.map(row => row.y), [-20])
  assert.equal(result.completedPasses, 2)
  assert.equal(result.visitedRecords, 2)
})

test('a fully skipped pass resets the global origin even if a later pass submits text', () => {
  const result = plan([name('A')], -100)
  assert.equal(result.origin, 51)
  assert.equal(result.submissions.length, 1)
})

test('empty text calls count as submitted while null text records do not', () => {
  assert.equal(plan([name('')], -20).origin, -20)
  const result = plan([name(null)], -20)
  assert.equal(result.origin, 51)
  assert.deepEqual(result.submissions, [])
})

test('the extra wrapped empty row affects later record positions', () => {
  const result = layout([name('A '), name('B')], {}, fonts, { width: 1, height: 50 }, 0)
  assert.deepEqual(result.submissions.map(row => [row.text, row.y]), [['A', 0], ['', 10], ['B', 20]])
})

test('literal spaces, repeated headings and record order are not flattened or deduplicated', () => {
  const result = layout([
    { headingId: 1073, text: ' ' }, { headingId: 1073, text: 'A' }, name(null),
  ], { 1073: 'H' }, fonts, { width: 100, height: 200 }, 0)
  assert.deepEqual(result.submissions.map(row => [row.recordIndex, row.font, row.text, row.y]), [
    [0, 'heading', 'H', 30], [0, 'name', ' ', 50],
    [1, 'heading', 'H', 90], [1, 'name', 'A', 110],
  ])
})

test('modern guards reject unsupported characters, missing labels and invalid dimensions', () => {
  assert.throws(() => wrap('A\n', 10, font()), /Western character/)
  assert.throws(() => wrap('\u0100', 10, font()), /Western character/)
  assert.throws(() => wrap('A', 0, font()), /screen width/)
  assert.throws(() => wrap('A', 1.5, font()), /screen width/)
  assert.throws(() => plan([name('A')], NaN), /origin/)
  assert.throws(() => layout([name('A')], {}, fonts, { width: 10, height: 0 }, 0), /screen height/)
  assert.throws(() => layout([{ headingId: 1071, text: null }], {}, fonts, screen, 0), /Missing Credits heading/)
  assert.throws(() => layout([{ headingId: 1071, text: null }], { 1071: undefined }, fonts, screen, 0), /Invalid Credits text/)
})

test('font metric and work limits fail closed instead of returning partial layouts', () => {
  assert.throws(() => wrap('A', 10, { widths: [], aHeight: 10 }), /224 glyph widths/)
  assert.throws(() => wrap('A', 10, font(-1)), /glyph width/)
  assert.throws(() => wrap('A', 10, font(1, 0)), /A height/)
  assert.throws(() => wrap('AB', 1, font(), 1), /work limit exceeded/)
  assert.throws(() => plan([name(null)], -100, { maxWork: 1 }), /work limit exceeded/)
})

test('planning preserves all input records, labels and metric arrays', () => {
  const records = [{ headingId: 1071, text: 'AB' }, name(null)]
  const headings = { 1071: 'Head' }
  const before = JSON.stringify({ records, headings, fonts, screen })
  layout(records, headings, fonts, screen, 0)
  assert.equal(JSON.stringify({ records, headings, fonts, screen }), before)
})
