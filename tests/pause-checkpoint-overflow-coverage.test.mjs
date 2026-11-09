import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(new URL('../scripts/local-render/original-pause-checkpoint-style.mjs', import.meta.url), 'utf8')
// Actual final validator only; synthetic records do not claim browser layout proof.
const coverage = source.slice(source.indexOf('export function assertStyleCoverage(')).replace('export ', '')
const verify = (ordinary, stress) => new Function('assert', 'ordinary', 'stress', `${coverage}; assertStyleCoverage(ordinary, stress)`)(assert, ordinary, stress)
const fixture = () => {
  const ordinary = [false, true].flatMap(fallback => ['save', 'load'].flatMap(panel =>
    [[640, 480], [1920, 1080], [800, 450]].map(([width, height]) => ({
      evidenceScope: 'ordinary-shipped-copy', fallback, panel, viewport: { width, height }, body: { overflow: false },
    }))))
  const stress = [false, true].map(fallback => {
    const state = { overflow: true, horizontalOverflow: false, scrollTop: 0, clientHeight: 270,
      scrollHeight: 600, focused: true, panel: 'save', saveDisabled: true, saveTop: 399, saveBelowBody: true, saveWithinViewport: true, glyphCount: fallback ? 0 : 600,
      lastLineVisible: true, backReachable: true }
    return { evidenceScope: 'component-scroll-stress', syntheticCopy: true, fallback,
      blockedFontRequests: fallback ? 1 : 0, backReturned: true,
      start: { ...state }, end: { ...state, scrollTop: 330 }, home: { ...state } }
  })
  return { ordinary, stress }
}
test('accepts twelve ordinary fitting cases only alongside both fully observed stress cases', () => {
  const { ordinary, stress } = fixture(); verify(ordinary, stress)
})
test('rejects missing, duplicated or relabeled ordinary coverage and missing stress coverage', () => {
  for (const mutate of [f => f.ordinary.pop(), f => { f.ordinary[1] = f.ordinary[0] },
    f => { f.ordinary[0].evidenceScope = 'component-scroll-stress' }, f => f.stress.pop(),
    f => { f.stress[1].fallback = false }, f => { f.stress[0].syntheticCopy = false }]) {
    const f = fixture(); mutate(f); assert.throws(() => verify(f.ordinary, f.stress))
  }
})
test('each stress variant must overflow, reach End, return Home, retain focus and show the last line', () => {
  for (const index of [0, 1]) for (const mutate of [
    r => { r.start.overflow = false }, r => { r.end.overflow = false }, r => { r.home.overflow = false },
    r => { r.end.scrollTop = 0 }, r => { r.end.scrollTop -= 2 },
    r => { r.start.scrollTop = 1 }, r => { r.home.scrollTop = 1 },
    r => { r.start.focused = false }, r => { r.end.focused = false }, r => { r.home.focused = false },
    r => { r.end.lastLineVisible = false }, r => { r.end.backReachable = false }, r => { r.backReturned = false },
    r => { r.end.panel = 'root' }, r => { r.start.saveTop = 398 }, r => { r.end.saveWithinViewport = false },
    r => { r.home.saveDisabled = false }, r => { r.end.saveBelowBody = false }, r => { r.start.horizontalOverflow = true },
    r => { r.evidenceScope = 'ordinary-shipped-copy' },
    r => { r.start.glyphCount = r.fallback ? 1 : 0 },
  ]) {
    const f = fixture(); mutate(f.stress[index])
    assert.throws(() => verify(f.ordinary, f.stress), String(mutate))
  }
  const f = fixture(); f.stress[1].blockedFontRequests = 0
  assert.throws(() => verify(f.ordinary, f.stress))
})
test('stress evidence is appended only after End, Home, focus and Back checks; coverage precedes success', () => {
  const start = source.indexOf('// Ordinary gameplay proof is complete')
  const end = source.indexOf("await page.keyboard.press('End')", start)
  const home = source.indexOf("await page.keyboard.press('Home')", end)
  const recorded = source.indexOf('stressRecords.push(', home)
  assert.ok(start > 0 && end > start && home > end && recorded > home)
  assert.ok(source.indexOf('assert.equal(end.lastLineVisible, true)', end) < recorded)
  assert.ok(source.indexOf("assert.equal(await modal.getAttribute('data-panel'), 'root')", home) < recorded)
  assert.ok(source.indexOf('assertStyleCoverage(records, stressRecords)') > recorded)
  assert.ok(source.indexOf('return { ordinaryRecords: records, stressRecords, screenshots') > source.indexOf('assertStyleCoverage(records, stressRecords)'))
})
