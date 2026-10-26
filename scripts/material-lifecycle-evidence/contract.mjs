import assert from 'node:assert/strict'

export const identity = Object.freeze({
  kind: 'material-lifecycle-rendered-replacement-v1',
  status: 'new-reconstruction-not-historical-source',
  expectedHead: '977bf3026e429f7edd6187c16427913357224f7d',
  expectedTree: 'c17cce4f10b9f4407d22c9266254e6cbb524a8f3',
})

export function validateLifecycle(report) {
  assert.deepEqual(report.identity, identity)
  assert.deepEqual(report.errors, [])
  assert.deepEqual(report.cleanup, { closed: true, retainedResourceReferences: 0, registrationCount: 0 })
  const names = ['preparedRemoval', 'removed', 'removedAgain', 'preparedTransition',
    'transitioned', 'replacementStable', 'preparedSurvivor', 'disposed', 'disposedAgain']
  assert.deepEqual(Object.keys(report.phases), names)
  const p = report.phases, rows = Object.values(p)
  let previousSequence = 0
  for (const row of rows) {
    assert.ok(Number.isSafeInteger(row.sequence) && row.sequence > previousSequence)
    previousSequence = row.sequence
    assert.equal(row.preparedIdentity, true)
    assert.deepEqual(row.shared, report.shared)
    assert.ok(Number.isSafeInteger(row.buildingId) && row.buildingId > 0)
    assert.ok(row.materials.length > 0)
    assert.equal(new Set(row.materials).size, row.materials.length)
    assert.ok(row.resources.length <= 256)
    assert.equal(new Set(row.resources.map(value => value.id)).size, row.resources.length)
    for (const resource of row.resources) {
      assert.ok(Number.isSafeInteger(resource.id) && resource.id > 0)
      assert.ok(['material', 'geometry', 'texture'].includes(resource.kind))
      assert.ok(Number.isSafeInteger(resource.disposals) && resource.disposals >= 0)
    }
    assert.notEqual(report.shared.cursor, report.shared.atlas)
    for (const id of row.materials) assert.notEqual(id, report.shared.cursor)
  }
  const count = (row, id, kind, expected) => {
    const resource = row.resources.find(item => item.id === id)
    assert.ok(resource, `Missing resource ${id}`)
    assert.equal(resource.kind, kind)
    assert.equal(resource.disposals, expected)
  }
  const plan = (row, source, retired) => {
    assert.equal(row.buildingId, source.buildingId)
    assert.equal(row.geometry, source.geometry)
    assert.deepEqual(row.materials, source.materials)
    assert.equal(row.inPlans, !retired)
    assert.equal(row.detached, retired)
    count(row, source.geometry, 'geometry', Number(retired))
    source.materials.forEach(id => count(row, id, 'material', Number(retired)))
  }
  plan(p.preparedRemoval, p.preparedRemoval, false)
  plan(p.removed, p.preparedRemoval, true)
  plan(p.removedAgain, p.preparedRemoval, true)
  plan(p.preparedTransition, p.preparedTransition, false)
  plan(p.transitioned, p.preparedTransition, true)
  plan(p.replacementStable, p.preparedTransition, true)
  plan(p.preparedSurvivor, p.preparedSurvivor, false)
  // Terminal rows must describe the same survivor; scene teardown is not
  // the earlier plan-removal inPlans/detached contract.
  for (const row of [p.disposed, p.disposedAgain]) {
    assert.equal(row.buildingId, p.preparedSurvivor.buildingId)
    assert.equal(row.geometry, p.preparedSurvivor.geometry)
    assert.deepEqual(row.materials, p.preparedSurvivor.materials)
  }
  // The ten-bit building allocator can recycle a removed ID. Resource identity,
  // not a historical numeric building handle, separates the retired instances.
  assert.notEqual(p.preparedTransition.buildingId, p.preparedSurvivor.buildingId)
  const owned = [p.preparedRemoval, p.preparedTransition, p.preparedSurvivor]
    .flatMap(row => [row.geometry, ...row.materials])
  assert.equal(new Set(owned).size, owned.length, 'Plans must own distinct resources')
  const r = report.replacement
  assert.equal(r.buildingId, p.preparedTransition.buildingId)
  assert.equal(r.attached, true)
  for (const [key, kind] of [['materials', 'material'], ['geometries', 'geometry']]) {
    assert.ok(r[key].length > 0)
    assert.equal(new Set(r[key]).size, r[key].length)
    for (const id of r[key]) {
      assert.ok(!owned.includes(id) && id !== report.shared.cursor && id !== report.shared.atlas)
      count(p.transitioned, id, kind, 0)
      count(p.replacementStable, id, kind, 0)
      count(p.preparedSurvivor, id, kind, 0)
      count(p.disposed, id, kind, 1)
      count(p.disposedAgain, id, kind, 1)
    }
  }
  assert.deepEqual(report.replacementAgain, r, 'Replacement identity must survive repeat frames')
  for (const [name, row] of Object.entries(p)) {
    const disposed = ['disposed', 'disposedAgain'].includes(name)
    assert.equal(row.disposed, disposed)
    assert.equal(row.canvasConnected, !disposed)
    count(row, report.shared.cursor, 'material', Number(disposed))
    count(row, report.shared.atlas, 'texture', 0)
    if (disposed) for (const source of [p.preparedRemoval, p.preparedTransition, p.preparedSurvivor]) {
      count(row, source.geometry, 'geometry', 1)
      source.materials.forEach(id => count(row, id, 'material', 1))
    }
  }
  assert.deepEqual(report.pixels.map(row => row.kind), ['plan', 'plan', 'building'])
  assert.deepEqual(report.pixels.map(row => row.buildingId),
    [p.preparedRemoval.buildingId, p.preparedTransition.buildingId, r.buildingId])
  for (const pixel of report.pixels) {
    assert.equal(pixel.contextLost, false)
    assert.ok(Number.isSafeInteger(pixel.width) && Number.isSafeInteger(pixel.height))
    assert.ok(pixel.width > 0 && pixel.height > 0 && pixel.width * pixel.height <= 2000000)
    assert.ok(Number.isSafeInteger(pixel.differentPixels) && pixel.differentPixels > 0 &&
      pixel.differentPixels <= pixel.width * pixel.height)
  }
  assert.deepEqual(report.screenshots, ['prepared-removal.png', 'prepared-transition.png', 'replacement.png'])
  return { status: 'passed', claim: 'Rendered material lifecycle correctness only; no memory or performance claim' }
}
