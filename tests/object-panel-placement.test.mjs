import assert from 'node:assert/strict'
import test from 'node:test'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

await loadSceneFixture()
const { ObjectPanels } = await import('../app/object-panels.ts')
const { createGameStore } = await import('../app/game-store.ts')
const { hudScale } = await import('../app/hud-layout.ts')

// Actual open/update/layout/paint/placement routing; only DOM, atlas submissions
// and projection are supplied. Browser CSS rounding remains a rendered check.
function fixture(t, kind, viewport, inset = { x: 0, y: 0 }) {
  let scale = hudScale(viewport.width, viewport.height, 'auto'), point = { x: 0, y: 0 }
  const draws = [], projections = [], context = { drawImage: (...args) => draws.push(args), fillRect() {} }
  const element = tag => ({ tag, children: [], style: {}, dataset: {}, attributes: {},
    classList: { add() {} }, setAttribute(name, value) { this.attributes[name] = value },
    insertBefore(child) { this.children.push(child) }, addEventListener() {},
    querySelectorAll(name) { return this.children.filter(child => child.tag === name) },
    matches() { return false }, contains() { return false }, remove() {},
    getContext() { return context } })
  for (const [name, value] of Object.entries({ document: { createElement: element, activeElement: null },
    getComputedStyle: () => ({ getPropertyValue: name => name === '--hud-scale' ? String(scale) : '' }) })) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, name)
    Object.defineProperty(globalThis, name, { configurable: true, value })
    t.after(() => previous ? Object.defineProperty(globalThis, name, previous) : delete globalThis[name])
  }
  const store = createGameStore()
  if (kind !== 'worship') store.startMission(22)
  const world = store.getWorld(), target = kind === 'worship'
    ? world.shrines.find(head => head.kind === 'bridge')
    : world.vehicles.find(vehicle => vehicle.model === (kind === 'boat' ? 1 : 3))
  assert.ok(target)
  world.inputMask = 0
  const container = { left: 100 * scale, top: 0, width: viewport.width - 100 * scale, height: viewport.height }
  const renderer = { left: container.left + inset.x, top: inset.y,
    width: container.width - Math.abs(inset.x) - 0.25, height: container.height - Math.abs(inset.y) - 0.25 }
  const scene = { world, isCurrent: () => true, overviewActive: false,
    pointerButtons: 2, pointerScreen: null, unitMeshes: new Map(),
    gameClock: { animationFrame: 0 }, visible: () => true,
    container: { insertBefore() {}, getBoundingClientRect: () => container },
    renderer: { domElement: { getBoundingClientRect: () => renderer } },
    screen(anchor, height) { projections.push({ anchor, height }); return point } }
  const panels = new ObjectPanels(scene); scene.objectPanels = panels
  panels.open(target.id, true)
  const panel = panels.panels.get(target.id), atlas = { complete: true, naturalWidth: 1 }
  const update = next => { point = next; panels.update(atlas) }
  return { world, target, panels, panel, draws, projections, container, renderer, scene, update,
    get scale() { return scale }, set scale(value) { scale = value } }
}
function extent(f) {
  const { canvas, element } = f.panel, x = Number.parseFloat(element.style.left), y = Number.parseFloat(element.style.top)
  return { left: f.container.left + x - canvas.width * f.scale / 2,
    right: f.container.left + x + canvas.width * f.scale / 2,
    top: f.container.top + y - canvas.height * f.scale, bottom: f.container.top + y }
}
function contained(f) {
  const r = extent(f), viewport = f.renderer
  assert.ok(r.left >= viewport.left && r.right <= viewport.left + viewport.width &&
    r.top >= viewport.top && r.bottom <= viewport.top + viewport.height, JSON.stringify({ r, viewport }))
}
for (const kind of ['worship', 'boat', 'balloon']) {
  for (const viewport of [{ width: 1280, height: 720 }, { width: 1920, height: 1080 }, { width: 3440, height: 1440 }]) {
    test(`${kind} actual update contains both offscreen boundaries at ${viewport.width}x${viewport.height}`, t => {
      const f = fixture(t, kind, viewport, { x: 0.375, y: 0.125 })
      const before = { turn: f.world.turn, randomState: f.world.randomState, frame: f.scene.gameClock.animationFrame }
      f.update({ x: -4, y: 3 })
      assert.equal(f.panel.kind, kind === 'worship' ? 'head' : 'vehicle')
      assert.equal(f.panel.element.hidden, false)
      assert.ok(f.draws.length > 0, 'Actual layout paints the panel before positioning')
      assert.ok(f.projections[0].height > 0, 'Native object offset reaches projection')
      contained(f)
      assert.ok(Number.isInteger(Number.parseFloat(f.panel.element.style.left)))
      assert.ok(Number.isInteger(Number.parseFloat(f.panel.element.style.top)))
      const key = f.panel.key, drawCount = f.draws.length, size = [f.panel.canvas.width, f.panel.canvas.height]
      f.update({ x: 4, y: -3 })
      contained(f)
      assert.ok(Number.isInteger(Number.parseFloat(f.panel.element.style.left)))
      assert.ok(Number.isInteger(Number.parseFloat(f.panel.element.style.top)))
      assert.equal(f.panel.key, key)
      assert.equal(f.draws.length, drawCount, 'Placement updates outside the paint cache')
      assert.deepEqual([f.panel.canvas.width, f.panel.canvas.height], size)
      assert.deepEqual({ turn: f.world.turn, randomState: f.world.randomState, frame: f.scene.gameClock.animationFrame }, before)
    })
  }
  test(`${kind} preserves fractional interior anchor and repositions cached artwork after scale/renderer change`, t => {
    const f = fixture(t, kind, { width: 1280, height: 720 }, { x: -0.375, y: 0.125 })
    const point = { x: 0.123, y: -0.456 }
    f.update(point)
    const expected = { left: `${f.renderer.left - f.container.left + (point.x + 1) * f.renderer.width / 2}px`,
      top: `${f.renderer.top - f.container.top + (1 - point.y) * f.renderer.height / 2}px` }
    assert.deepEqual({ left: f.panel.element.style.left, top: f.panel.element.style.top }, expected)
    assert.equal(Number.isInteger(Number.parseFloat(expected.left)), false)
    const painted = f.draws.length, size = [f.panel.canvas.width, f.panel.canvas.height]
    f.scale = 1.25; f.renderer.width = 500.5; f.renderer.height = 300.25
    f.update({ x: -3, y: 3 })
    contained(f)
    assert.equal(f.draws.length, painted)
    assert.deepEqual([f.panel.canvas.width, f.panel.canvas.height], size)
  })
}
test('Balloon source dimensions at scale1.44 use top90 instead of the fractional89.28 boundary', t => {
  const f = fixture(t, 'balloon', { width: 1280, height: 720 })
  f.update({ x: 0, y: 3 })
  assert.deepEqual([f.panel.canvas.width, f.panel.canvas.height, f.scale], [72, 62, 1.44])
  assert.equal(f.panel.element.style.top, '90px')
  assert.equal(f.panel.element.attributes['aria-label'], 'Balloon: 0 passengers')
  contained(f)
})
