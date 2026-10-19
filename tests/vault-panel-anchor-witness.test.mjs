import assert from 'node:assert/strict'
import test from 'node:test'
import { readVaultPanelAnchor } from '../scripts/local-render/vault-panel-anchor.mjs'
import { assertVaultPanelAnchor, assertVaultPanelAnchorBracket } from '../scripts/local-render/vault-prayer-contract.mjs'

function fixture(t) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'getComputedStyle')
  Object.defineProperty(globalThis, 'getComputedStyle', { configurable: true,
    value: () => ({ getPropertyValue: () => '2' }) })
  t.after(() => original ? Object.defineProperty(globalThis, 'getComputedStyle', original) : delete globalThis.getComputedStyle)
  const box = value => ({ getBoundingClientRect: () => ({ ...value }) })
  const element = { ...box({ left: 788, top: 342, width: 64, height: 124 }),
    isConnected: true, hidden: false, style: { left: '820px', top: '466px' } }
  const head = { id: 92, kind: 'vault', mode: 4, model: 154, x: -37, z: -133, angle: 0 }
  const world = { turn: 745, outcome: { level: 3 }, shrines: [head],
    land: { heights: new Int16Array(16384).fill(64), flags: new Uint32Array(16384),
      dirty: new Uint8Array(16384), queued: [], textureUpdates: [] } }
  const projection = { matrix: [16384, 0, 0, 0, 16384, 0, 0, 0, 16384],
    curvature: 0, depth: 4096, perspective: 12, scale: 4096,
    width: 1240, height: 1000, centerX: 620, centerY: 500,
    fractionX: 4, fractionY: 4, pixelScaleX: 1 / 16, pixelScaleY: 1 / 16 }
  const update = () => assert.fail('Stage observation must not render or advance clocks')
  const scene = { world, view: { center: { x: 58112, y: 32000 }, rawCenter: { x: -7424, y: 32000 },
    angle: 0, overview: false, projection, update },
  container: box({ left: 0, top: 0, width: 1440, height: 1000 }),
  renderer: { domElement: box({ left: 200, top: 0, width: 1240, height: 1000 }) },
  gameClock: { animationFrame: 1490 },
  objectPanels: { frame: 1490, panels: new Map([[92, { element, canvas: { width: 32, height: 62 } }]]), update },
  screen: () => assert.fail('The reference must not call the live Scene projection consumer') }
  return { scene, world, head, element, projection, read: () => readVaultPanelAnchor(scene, 92) }
}

test('stage observation samples explicit M3 socket0, current terrain and actual DOM without writes', t => {
  const f = fixture(t), worldBefore = structuredClone(f.world), projectionBefore = structuredClone(f.projection)
  const owners = [f.scene.view.update, f.scene.objectPanels.update, f.scene.screen]
  const sample = f.read()
  assertVaultPanelAnchor(sample)
  assert.equal(sample.ground, 64)
  assert.deepEqual(sample.expected.socket0.raw, { x: 820, y: 466 })
  assert.deepEqual(sample.expected.legacy.raw, { x: 820, y: 431.75 })
  assert.deepEqual(sample.expected.reward.raw, { x: 820, y: 429 })
  assert.deepEqual(sample.dom.tail, { x: 820, y: 466 })
  assert.equal(sample.expected.socket0.projected.y, 544)
  assert.deepEqual(f.world, worldBefore)
  assert.deepEqual(f.projection, projectionBefore)
  assert.deepEqual([f.scene.view.update, f.scene.objectPanels.update, f.scene.screen], owners)
  sample.camera.projection.matrix[0] = 0
  assert.deepEqual(f.projection, projectionBefore, 'Receipt must not retain the live matrix')
  f.world.land.heights.fill(96)
  assert.equal(f.read().expected.socket0.projected.y, 576, 'Read the current terrain, not a saved ground height')
})

test('wrong DOM height, clamped or indistinguishable alternatives, and screenshot drift fail', t => {
  const f = fixture(t), good = f.read()
  for (const mutate of [
    s => { s.dom.inline.y = s.expected.legacy.raw.y },
    s => { s.dom.tail.y = s.expected.reward.raw.y },
    s => { s.expected.legacy.clamped.y += 2 },
    s => { s.expected.reward.raw = { ...s.expected.socket0.raw }; s.expected.reward.clamped = { ...s.expected.socket0.raw } },
    s => { s.dom.tail.x = NaN },
    s => { s.dom.connected = false },
  ]) {
    const bad = structuredClone(good); mutate(bad)
    assert.throws(() => assertVaultPanelAnchor(bad))
  }
  const later = structuredClone(good)
  later.turn++; later.animationFrame++
  assertVaultPanelAnchorBracket(good, later)
  later.camera.angle++
  assert.throws(() => assertVaultPanelAnchorBracket(good, later), /drifted/)
  f.projection.centerY = 100
  assert.throws(() => assertVaultPanelAnchor(f.read()), /DOM/)
})

test('the reference rejects unsupported authored inputs and preserves absent-panel stages', t => {
  const f = fixture(t)
  for (const [key, value] of [['x', -35], ['z', -131], ['angle', Math.PI / 2], ['model', 0], ['kind', 'head'], ['mode', 0]]) {
    const saved = f.head[key]; f.head[key] = value
    assert.throws(f.read, /Authored M3/)
    f.head[key] = saved
  }
  f.world.outcome.level = 1
  assert.throws(f.read, /Authored M3/)
  f.world.outcome.level = 3
  f.scene.objectPanels.panels.clear()
  const sample = f.read()
  assert.equal(sample.dom, null)
  assert.equal(sample.width, 0)
  assert.equal(sample.height, 0)
  assert.throws(() => assertVaultPanelAnchor(sample))
})
