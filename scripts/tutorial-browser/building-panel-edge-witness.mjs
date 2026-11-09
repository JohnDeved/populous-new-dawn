import assert from 'node:assert/strict'

export const buildingEdgeCases = Object.freeze([
  { name: 'top', x: 0, y: 0.98 },
  { name: 'left', x: -0.98, y: 0 },
  { name: 'right', x: 0.98, y: 0 },
])

// Serialized into the browser. Observe the actual adapter and computed DOM bounds.
export function readBuildingEdgeWitness() {
  const h = window.buildingIdentity, panel = h.scene.buildingPanels.get(h.building.id)
  const rect = node => {
    const r = node.getBoundingClientRect()
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }
  }
  if (!panel || panel.hidden || !panel.isConnected) throw Error('Actual building panel is not visible')
  return {
    panel: rect(panel), renderer: rect(h.scene.renderer.domElement), container: rect(h.scene.container),
    scale: Number.parseFloat(getComputedStyle(panel).getPropertyValue('--hud-scale')),
    canvas: { width: panel.firstElementChild.width, height: panel.firstElementChild.height },
    frame: h.scene.renderer.info.render.frame, buildingId: h.building.id,
    samePanel: panel === h.panel, personId: Number(panel.children[1].dataset.person),
    expectedPersonId: h.unit.id, inside: h.unit.inside,
    visible: h.scene.visible(h.building), focused: panel.contains(document.activeElement),
    projection: h.scene.screen(h.building), selected: [...h.world.selected],
  }
}

export function assertBuildingEdgeWitness(witness, edge) {
  assert.ok(buildingEdgeCases.some(row => row.name === edge), 'Known edge')
  assert.equal(witness.visible, true)
  assert.equal(witness.focused, true)
  assert.equal(witness.samePanel, true)
  assert.equal(witness.personId, witness.expectedPersonId)
  assert.equal(witness.inside, witness.buildingId)
  assert.ok(Number.isInteger(witness.personId) && witness.personId > 0)
  assert.ok(Number.isInteger(witness.buildingId) && witness.buildingId >= 0)
  assert.ok(Math.abs(witness.scale - 1.44) < 1e-9, 'Actual fractional public HUD scale')
  assert.ok(witness.renderer.left > 0, 'Actual renderer offset from native dock')
  for (const r of [witness.panel, witness.renderer])
    for (const value of Object.values(r)) assert.ok(Number.isFinite(value))
  for (const r of [witness.panel, witness.renderer, witness.canvas]) {
    assert.ok(Number.isFinite(r.width) && r.width > 0)
    assert.ok(Number.isFinite(r.height) && r.height > 0)
  }
  // No outward tolerance: a negative raster gap is the regression under test.
  assert.ok(witness.panel.left >= witness.renderer.left, 'Panel escapes renderer left edge')
  assert.ok(witness.panel.top >= witness.renderer.top, 'Panel escapes renderer top edge')
  assert.ok(witness.panel.right <= witness.renderer.right, 'Panel escapes renderer right edge')
  assert.ok(witness.panel.bottom <= witness.renderer.bottom, 'Panel escapes renderer bottom edge')
  const gap = edge === 'top' ? witness.panel.top - witness.renderer.top
    : edge === 'left' ? witness.panel.left - witness.renderer.left
    : witness.renderer.right - witness.panel.right
  assert.ok(gap < 1.1, 'Must exercise the clamped boundary, not a central panel')
}

// Bounded supplied camera boundary, not ordinary navigation. Only production focus
// changes camera state; never replace screen(), paint, CSS, DOM bounds or visibility.
export function focusBuildingAtEdge({ x, y }) {
  const { scene, building } = window.buildingIdentity
  const origin = { ...scene.viewPoint }, maxSteps = 12
  let point = { ...origin }
  const sample = p => { scene.focus(p); return scene.screen(building) }
  try {
    for (let step = 0; step < maxSteps; step++) {
      const q = sample(point), error = { x: x - q.x, y: y - q.y }
      if (Math.abs(error.x) < 0.003 && Math.abs(error.y) < 0.003) {
        if (!scene.visible(building)) throw Error('Target building is outside actual visibility')
        return { steps: step + 1, origin, target: { x, y }, actual: { x: q.x, y: q.y }, focus: point,
          frame: scene.renderer.info.render.frame }
      }
      const a = sample({ x: point.x + 1, z: point.z }), b = sample({ x: point.x, z: point.z + 1 })
      const ax = a.x - q.x, ay = a.y - q.y, bx = b.x - q.x, by = b.y - q.y
      const determinant = ax * by - ay * bx
      if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-8)
        throw Error('Degenerate camera projection boundary')
      const dx = (error.x * by - error.y * bx) / determinant
      const dz = (ax * error.y - ay * error.x) / determinant
      if (!Number.isFinite(dx) || !Number.isFinite(dz) || Math.abs(dx) > 64 || Math.abs(dz) > 64)
        throw Error('Camera boundary step exceeds finite limit')
      point = { x: point.x + dx, z: point.z + dz }
    }
    throw Error('Camera boundary did not converge in 12 steps')
  } catch (error) {
    scene.focus(origin)
    throw error
  }
}
