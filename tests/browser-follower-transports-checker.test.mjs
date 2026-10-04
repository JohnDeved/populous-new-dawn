import test from 'node:test'
import assert from 'node:assert/strict'
import { assertSelectedCrews } from '../scripts/check-browser-follower-transports.mjs'

const fleet = Array.from({ length: 6 }, (_, i) => ({
  id: 100 + i, crew: [{ id: i * 2 + 1, model: 2 }, { id: i * 2 + 2, model: i % 2 ? 3 : 2 }],
}))
test('rendered transport checker independently counts whole mixed-class craft', () => {
  assert.deepEqual(assertSelectedCrews([3, 4], fleet, 1, 3), [101])
  assert.equal(assertSelectedCrews(fleet.slice(0, 5).flatMap(v => v.crew.map(p => p.id)), fleet, 5, 2).length, 5)
  assert.equal(assertSelectedCrews(fleet.flatMap(v => v.crew.map(p => p.id)), fleet, 6).length, 6)
})
test('rendered transport checker rejects partial, unrelated, duplicate and wrong-class groups', () => {
  for (const [selection, count, model] of [[[1], 1, 2], [[1, 2, 99], 1, 2], [[1, 1], 1, 2], [[1, 2], 1, 3], [[1, 2], 5, 2]])
    assert.throws(() => assertSelectedCrews(selection, fleet, count, model))
})

test('transport pixel oracle retains real device scale and outward clip padding', async () => {
  const { transportPixelGrid } = await import('../scripts/check-browser-follower-transports.mjs')
  const dock = { x: 0, y: 306, width: 150, height: 415.5 }
  const boat = transportPixelGrid({ x: 0, y: 591, width: 22.5, height: 51 }, dock, 2)
  assert.equal(boat.physicalScale, 3)
  assert.deepEqual([boat.width, boat.height], [46, 102])
  assert.deepEqual(boat.origin, { x: 0, y: -570 })
  assert.deepEqual(boat.padding, { left: 0, top: 0, right: 1, bottom: 0 })
  const balloon = transportPixelGrid({ x: 24, y: 652.5, width: 22.5, height: 51 }, dock, 2)
  assert.deepEqual([balloon.width, balloon.height], [46, 104])
  assert.deepEqual(balloon.origin, { x: -48, y: -692 })
  assert.deepEqual(balloon.padding, { left: 0, top: 1, right: 1, bottom: 1 })
  assert.notEqual(balloon.width / 15, balloon.physicalScale, 'crop width must never stretch native pixels')
})

test('transport oracle preserves fractional scales and detects the old footer/hit failure', async () => {
  const { transportPixelGrid, assertTransportLayout } = await import('../scripts/check-browser-follower-transports.mjs')
  const scale = 1.44, dock = { x: 0, y: 204 * scale, width: 100 * scale, height: 277 * scale }
  const target = { x: 16 * scale, y: 435 * scale, width: 15 * scale, height: 34 * scale }
  assert.ok(Math.abs(transportPixelGrid(target, dock, 2).physicalScale - 2.88) < 1e-10)
  const rectangles = Array.from({ length: 12 }, (_, i) => ({ x: i % 6 * 16 * scale,
    y: (i < 6 ? 394 : 435) * scale, width: 15 * scale, height: 34 * scale,
    left: `${i % 6 * 16}px`, top: `${i < 6 ? 190 : 231}px`, hits: [{ owned: true }, { owned: true }] }))
  const good = { dock, rectangles, footer: { y: 720 - 17 * scale } }
  assert.doesNotThrow(() => assertTransportLayout(good, { width: 1280, height: 720 }))
  assert.throws(() => assertTransportLayout({ ...good, footer: { y: 463 * scale } }, { width: 1280, height: 720 }), /footer/)
  const covered = structuredClone(good); covered.rectangles[7].hits[1].owned = false
  assert.throws(() => assertTransportLayout(covered, { width: 1280, height: 720 }), /hit/)
})
