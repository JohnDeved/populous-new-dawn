import assert from 'node:assert/strict'
import test from 'node:test'
import { identity, validateLifecycle } from '../scripts/material-lifecycle-evidence/contract.mjs'
import { installMaterialObserver } from '../scripts/material-lifecycle-evidence/observer.mjs'

function validReport() {
  const shared = { cursor: 1, atlas: 2 }
  const resources = [
    { id: 1, kind: 'material', disposals: 0 }, { id: 2, kind: 'texture', disposals: 0 },
  ]
  const add = (id, kind) => resources.push({ id, kind, disposals: 0 })
  const retire = (...ids) => ids.forEach(id => resources.find(item => item.id === id).disposals++)
  const phases = {}
  let sequence = 0
  const phase = (name, buildingId, geometry, material, retired = false, disposed = false) => {
    phases[name] = { label: 'fixture', buildingId, geometry, materials: [material],
      inPlans: !retired, detached: retired, preparedIdentity: true, shared: { ...shared },
      sequence: ++sequence, disposed, canvasConnected: !disposed, resources: structuredClone(resources) }
  }
  add(3, 'geometry'); add(4, 'material')
  phase('preparedRemoval', 101, 3, 4)
  retire(3, 4)
  phase('removed', 101, 3, 4, true)
  phase('removedAgain', 101, 3, 4, true)
  add(5, 'geometry'); add(6, 'material')
  phase('preparedTransition', 102, 5, 6)
  retire(5, 6)
  add(7, 'geometry'); add(8, 'material')
  phase('transitioned', 102, 5, 6, true)
  phase('replacementStable', 102, 5, 6, true)
  add(9, 'geometry'); add(10, 'material')
  phase('preparedSurvivor', 103, 9, 10)
  retire(1, 7, 8, 9, 10)
  phase('disposed', 103, 9, 10, false, true)
  phase('disposedAgain', 103, 9, 10, false, true)
  const replacement = { buildingId: 102, attached: true, geometries: [7], materials: [8] }
  return { identity, shared, phases, replacement, replacementAgain: structuredClone(replacement), errors: [],
    cleanup: { closed: true, retainedResourceReferences: 0, registrationCount: 0 },
    pixels: [['plan', 101], ['plan', 102], ['building', 102]].map(([kind, buildingId]) =>
      ({ kind, buildingId, width: 1440, height: 1000, differentPixels: 10, contextLost: false })),
    screenshots: ['prepared-removal.png', 'prepared-transition.png', 'replacement.png'] }
}

test('accepts complete scalar lifecycle evidence', () => {
  assert.equal(validateLifecycle(validReport()).status, 'passed')
  const recycled = validReport()
  for (const name of ['preparedRemoval', 'removed', 'removedAgain'])
    recycled.phases[name].buildingId = 102
  recycled.pixels[0].buildingId = 102
  assert.equal(validateLifecycle(recycled).status, 'passed', 'Retired building IDs may be recycled')
})

test('rejects adversarial lifecycle evidence without relying on a terminal pass label', () => {
  const cases = [
    ['wrong head', r => { r.identity.expectedHead = '0'.repeat(40) }],
    ['missing stage', r => { delete r.phases.removedAgain }],
    ['stage reordered', r => { const p = r.phases.removed; delete r.phases.removed; r.phases.removed = p }],
    ['replayed stage', r => { r.phases.removedAgain.sequence = r.phases.removed.sequence }],
    ['missing retirement', r => { r.phases.removed.resources.find(x => x.id === 4).disposals = 0 }],
    ['double retirement', r => { r.phases.removedAgain.resources.find(x => x.id === 4).disposals = 2 }],
    ['borrowed cursor retired', r => { r.phases.removed.resources[0].disposals = 1 }],
    ['atlas retired', r => { r.phases.disposedAgain.resources[1].disposals = 1 }],
    ['cursor never retired', r => { r.phases.disposed.resources[0].disposals = 0 }],
    ['cursor twice retired', r => { r.phases.disposedAgain.resources[0].disposals = 2 }],
    ['still attached', r => { r.phases.removed.detached = false }],
    ['still in plan map', r => { r.phases.transitioned.inPlans = true }],
    ['unprepared clone', r => { r.phases.preparedRemoval.preparedIdentity = false }],
    ['different retired material', r => { r.phases.removed.materials = [6] }],
    ['duplicate material', r => { r.phases.preparedRemoval.materials = [4, 4] }],
    ['shared plan material', r => { r.phases.preparedRemoval.materials = [1] }],
    ['different atlas', r => { r.phases.replacementStable.shared.atlas = 77 }],
    ['invalid resource kind', r => { r.phases.removed.resources[2].kind = 'material' }],
    ['missing resource', r => { r.phases.removed.resources.pop() }],
    ['duplicate resource row', r => { r.phases.removed.resources.push(r.phases.removed.resources[0]) }],
    ['fractional disposal count', r => { r.phases.removed.resources[3].disposals = 0.5 }],
    ['replacement already disposed', r => { r.phases.transitioned.resources.find(x => x.id === 8).disposals = 1 }],
    ['replacement never disposed', r => { r.phases.disposed.resources.find(x => x.id === 8).disposals = 0 }],
    ['replacement duplicate dispose', r => { r.phases.disposedAgain.resources.find(x => x.id === 8).disposals = 2 }],
    ['replacement borrowed retired plan', r => { r.replacement.materials = [6] }],
    ['replacement changed', r => { r.replacementAgain.materials = [12] }],
    ['two live buildings share ID', r => { r.phases.preparedSurvivor.buildingId = 102 }],
    ['remaining plan never disposed', r => { r.phases.disposed.resources.find(x => x.id === 10).disposals = 0 }],
    ['canvas retained', r => { r.phases.disposed.canvasConnected = true }],
    ['scene not disposed', r => { r.phases.disposed.disposed = false }],
    ['no rendered pixels', r => { r.pixels[0].differentPixels = 0 }],
    ['lost context', r => { r.pixels[2].contextLost = true }],
    ['wrong rendered target', r => { r.pixels[1].buildingId = 101 }],
    ['invalid pixel bound', r => { r.pixels[0].differentPixels = 2000001 }],
    ['missing screenshot', r => { r.screenshots.pop() }],
    ['observer not closed', r => { r.cleanup.closed = false }],
    ['retained observer reference', r => { r.cleanup.retainedResourceReferences = 1 }],
    ['browser error', r => { r.errors.push('WebGL failure') }],
  ]
  for (const [name, mutate] of cases) {
    const report = structuredClone(validReport())
    mutate(report)
    assert.throws(() => validateLifecycle(report), undefined, name)
  }
  assert.equal(cases.length, 38)
})

test('rejects terminal lifecycle rows attributed to another prepared identity', () => {
  let checked = 0
  const mutations = [
    ['building ID', (r, phase) => { r.phases[phase].buildingId = 999 }],
    ['geometry', (r, phase) => { r.phases[phase].geometry = r.phases.preparedRemoval.geometry }],
    ['materials', (r, phase) => { r.phases[phase].materials = [...r.phases.preparedTransition.materials] }],
  ]
  for (const phase of ['disposed', 'disposedAgain']) {
    for (const [name, mutate] of mutations) {
      const report = structuredClone(validReport())
      mutate(report, phase)
      assert.throws(() => validateLifecycle(report), undefined, `${phase}: different ${name}`)
      checked++
    }
  }
  assert.equal(checked, 6)
})

// Minimal event fixture exercises the actual injected observer, not a second
// implementation. It provides no Three, browser, GC or GPU acceptance.
function resource() {
  const listeners = new Set()
  return { userData: { nativeUniforms: {} }, addEventListener: (_name, fn) => listeners.add(fn),
    removeEventListener: (_name, fn) => listeners.delete(fn),
    dispose: () => [...listeners].forEach(fn => fn()), listenerCount: () => listeners.size }
}

test('observer tracks duplicate registrations once and removes every event listener', () => {
  const previous = globalThis.testSceneRef
  const atlas = resource(), cursor = resource(), material = resource(), geometry = resource()
  cursor.map = atlas; material.map = atlas
  const ground = {}, mesh = { geometry, material, parent: ground }
  const scene = { cursor: { material: cursor }, ground, plans: new Map([[101, mesh]]),
    disposed: false, renderer: { domElement: { isConnected: true } } }
  globalThis.testSceneRef = { current: scene }
  try {
    installMaterialObserver({ owner: 'test-owner' })
    const observer = globalThis.materialRetirementObserver
    const first = observer.recordPlan('plan', 101)
    assert.equal(first.resources.length, 4)
    assert.equal(observer.snapshot('plan').resources.length, 4)
    assert.equal(material.listenerCount(), 1)
    geometry.dispose(); material.dispose(); mesh.parent = null; scene.plans.clear()
    const retired = observer.snapshot('plan')
    assert.equal(retired.resources.find(row => row.id === first.materials[0]).disposals, 1)
    assert.equal(retired.detached, true)
    assert.equal(retired.inPlans, false)
    assert.deepEqual(observer.close(), { closed: true, retainedResourceReferences: 0, registrationCount: 0 })
    for (const value of [atlas, cursor, material, geometry]) assert.equal(value.listenerCount(), 0)
    assert.equal(globalThis.materialRetirementObserver, undefined)
  } finally {
    if (globalThis.materialRetirementObserver) globalThis.materialRetirementObserver.close()
    globalThis.testSceneRef = previous
  }
})

test('observer rejects unprepared material, bounds overflow and lost ownership', () => {
  const previous = globalThis.testSceneRef, atlas = resource(), cursor = resource(), ground = {}
  cursor.map = atlas
  const scene = { cursor: { material: cursor }, ground, plans: new Map(),
    renderer: { domElement: { isConnected: true } }, disposed: false }
  globalThis.testSceneRef = { current: scene }
  try {
    installMaterialObserver({ owner: 'test-bounds', maxResources: 8 })
    const observer = globalThis.materialRetirementObserver
    scene.plans.set(1, { geometry: resource(), material: cursor, parent: ground })
    assert.throws(() => observer.recordPlan('unprepared', 1), /not prepared/)
    for (let id = 2; id <= 4; id++) {
      const material = resource(); material.map = atlas
      scene.plans.set(id, { geometry: resource(), material, parent: ground })
      observer.recordPlan(String(id), id)
    }
    const material = resource(); material.map = atlas
    scene.plans.set(5, { geometry: resource(), material, parent: ground })
    assert.throws(() => observer.recordPlan('overflow', 5), /resource limit/)
    globalThis.testSceneRef.current = {}
    assert.throws(() => observer.snapshot('2'), /scene changed/)
    globalThis.testSceneRef.current = scene
    observer.close()
  } finally {
    if (globalThis.materialRetirementObserver) globalThis.materialRetirementObserver.close()
    globalThis.testSceneRef = previous
  }
})
