import test from 'node:test'
import assert from 'node:assert/strict'
import fixture from './fixtures/visible-cells.json' with { type: 'json' }
import manifest from '../decomp/exports.json' with { type: 'json' }
import { meshCellVisible } from '../app/projection.ts'
test('visible cells match original traversal at boundaries and wrapped camera centers', () => {
  assert.equal(fixture.executableSha256, manifest.executableSha256)
  for (const c of fixture.cases) {
    const visible = new Set(c.visible),
      center = { x: c.center[0], y: c.center[1] }
    for (let i = 0; i < 16384; i++)
      for (const offset of [0, 1, 255, 511]) {
        const point = { x: (i & 127) * 512 + offset, y: (i >> 7) * 512 + offset }
        assert.equal(
          meshCellVisible(c.spans, point, center),
          visible.has(i),
          `${c.center}/${c.heading}/${i}/${offset}`
        )
        const x = (((i & 127) - (center.x >> 9) + 64) & 127) - 64 + (center.x >> 9)
        const y = (((i >> 7) - (center.y >> 9) + 64) & 127) - 64 + (center.y >> 9)
        assert.equal(
          meshCellVisible(c.spans, { x: x * 512 + offset, y: y * 512 + offset }, center, true),
          visible.has(i)
        )
      }
  }
})
