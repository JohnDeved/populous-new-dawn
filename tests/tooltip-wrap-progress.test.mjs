import test from 'node:test'
import assert from 'node:assert/strict'
import { tooltipLayout } from '../app/tooltip-layout.ts'
import fixture from './fixtures/tooltip-layout.json' with { type: 'json' }

test('native desktop tooltip fixtures remain exact', () => {
  assert.ok(fixture.cases.length > 0)
  for (const c of fixture.cases)
    assert.deepEqual(tooltipLayout(c.text, ...c.screen), { width: c.width, height: c.height, draws: c.draws })
})

test('nonempty tooltips terminate and retain glyph order at zero and sub-eight-pixel widths', () => {
  for (const width of [0, 1, 2, 3, 4, 5, 6, 7]) {
    for (const height of [480, 601]) for (const text of ['A', 'ABC', 'A'.repeat(128), 'A-B.,C', 'A B']) {
      const layout = tooltipLayout(text, width, height)
      assert.deepEqual(layout.draws.map(draw => draw[1]).filter(code => code !== 0), [...text].filter(char => char !== ' ').map(char => char.charCodeAt(0) - 32))
      assert.ok(Number.isFinite(layout.width) && Number.isFinite(layout.height))
      assert.ok(layout.height > 0)
      assert.ok(layout.draws.every(draw => draw.every(Number.isFinite)))
    }
  }
})

test('empty narrow tooltips retain a bounded empty layout', () => {
  for (const width of [0, 1, 7, 8]) {
    const layout = tooltipLayout('', width, 480)
    assert.deepEqual(layout.draws, [])
    assert.ok(Number.isFinite(layout.width) && Number.isFinite(layout.height))
  }
})
