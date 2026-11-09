import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildingEdgeCases, assertBuildingEdgeWitness, focusBuildingAtEdge } from '../scripts/tutorial-browser/building-panel-edge-witness.mjs'

const witness = () => ({ visible: true, focused: true, scale: 1.44,
  samePanel: true, personId: 2000, expectedPersonId: 2000, inside: 1023, buildingId: 1023,
  canvas: { width: 48, height: 62 },
  renderer: { left: 144, top: 0, right: 960, bottom: 720, width: 816, height: 720 },
  panel: { left: 144.4, top: 0.7, right: 213.52, bottom: 89.98, width: 69.12, height: 89.28 } })

test('real edge witness requires strict containment and actual clamping', () => {
  const good = witness(); assertBuildingEdgeWitness(good, 'top'); assertBuildingEdgeWitness(good, 'left')
  const right = witness(); right.panel.left = 890.4; right.panel.right = 959.52
  assertBuildingEdgeWitness(right, 'right')
  for (const [side, value] of [['left', 143.999], ['top', -0.001], ['right', 960.001], ['bottom', 720.001]]) {
    const bad = witness(); bad.panel[side] = value
    assert.throws(() => assertBuildingEdgeWitness(bad, 'top'), /escapes/)
  }
  const central = witness(); central.panel.top = 200
  assert.throws(() => assertBuildingEdgeWitness(central, 'top'), /clamped boundary/)
})

test('wrong scale, missing visibility, focus, renderer offset and nonfinite geometry fail', () => {
  for (const mutate of [w => { w.visible = false }, w => { w.focused = false }, w => { w.scale = 1.5 },
    w => { w.renderer.left = 0 }, w => { w.panel.top = NaN }, w => { w.panel.width = 0 },
    w => { w.canvas.height = 0 }, w => { w.samePanel = false }, w => { w.inside = null },
    w => { w.personId = 2001 }]) {
    const bad = witness(); mutate(bad); assert.throws(() => assertBuildingEdgeWitness(bad, 'top'))
  }
  assert.throws(() => assertBuildingEdgeWitness(witness(), 'bottom'), /Known edge/)
})

function fakeScene(screen = p => ({ x: p.x / 8, y: p.z / 8 })) {
  const calls = [], scene = { viewPoint: { x: 0, z: 0 }, renderer: { info: { render: { frame: 9 } } },
    focus(p) { calls.push({ ...p }); this.viewPoint = { ...p } },
    screen() { return screen(this.viewPoint) }, visible: () => true }
  return { scene, calls }
}

test('bounded camera search uses production focus samples and reaches all declared targets', () => {
  const previous = globalThis.window
  try {
    for (const edge of buildingEdgeCases) {
      const { scene, calls } = fakeScene()
      globalThis.window = { buildingIdentity: { scene, building: {} } }
      const result = focusBuildingAtEdge(edge)
      assert.equal(result.steps, 2); assert.equal(result.frame, 9); assert.ok(calls.length <= 4)
      assert.ok(Math.abs(result.actual.x - edge.x) < 0.003)
      assert.ok(Math.abs(result.actual.y - edge.y) < 0.003)
    }
  } finally { globalThis.window = previous }
})

test('degenerate, invisible and excessive camera steps fail closed and restore origin', () => {
  const previous = globalThis.window
  try {
    for (const mode of ['degenerate', 'invisible', 'excessive']) {
      const { scene, calls } = fakeScene(mode === 'degenerate' ? () => ({ x: 0, y: 0 })
        : mode === 'excessive' ? p => ({ x: p.x / 10000, y: p.z / 10000 }) : undefined)
      if (mode === 'invisible') scene.visible = () => false
      globalThis.window = { buildingIdentity: { scene, building: {} } }
      assert.throws(() => focusBuildingAtEdge({ x: 0.98, y: 0.98 }))
      assert.deepEqual(calls.at(-1), { x: 0, z: 0 })
    }
  } finally { globalThis.window = previous }
})

test('scenario captures edge before asserting and never rewrites production geometry', () => {
  const source = readFileSync(new URL('../scripts/tutorial-browser/building-panel-edges.mjs', import.meta.url), 'utf8')
  assert.ok(source.indexOf('await capture(edge.name)') < source.indexOf('assertBuildingEdgeWitness(witness, edge.name)'))
  assert.match(source, /buildingPanelEdgesLimitMs = 90000/)
  assert.match(source, /setViewportSize\(\{ width: 960, height: 720 \}\)/)
  assert.doesNotMatch(source, /style\.(?:left|top)|setProperty|localStorage\.setItem|\.renderBuildingPanels\(|\.screen\s*=/)
  assert.match(source, /assertCompletion\(report.completed\)/)
})
