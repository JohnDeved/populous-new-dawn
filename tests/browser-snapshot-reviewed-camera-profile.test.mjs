import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { dragSourceProfiles, inspectDragSource } from '../scripts/browser-performance/snapshot-drag-contract.mjs'
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const cameraId = 'owned-numeric-terrain-chronological-camera-disposed-cpu-render-cpu-leases-loose-log-post-drain-retirement-tooltip-retirement-bookmark-retirement-hud-focus-boundary-modal-input-freeze-modal-sprite-sync-overview-gate-publication-v1'
const modalId = 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-disposed-cpu-render-cpu-leases-loose-log-modal-render-demand-v1'
test('all nine historical trusted-main profiles remain exact', () => {
  assert.equal(dragSourceProfiles.length, 11)
  assert.equal(hash(dragSourceProfiles.slice(0, 9)), '82475e1af1f3f44c1bf7487ddee1071b912e565bee93c1dd31dce703245d5706')
})
test('the exact reviewed complete camera profile remains at its historical position and frozen', () => {
  const camera = dragSourceProfiles.find(profile => profile.id === cameraId)
  assert.ok(camera)
  assert.strictEqual(camera, dragSourceProfiles[9])
  assert.equal(hash(camera), 'f6c4e97ed81f6ac6fb92cb25c5dd7e5cf0ded8ef73efe6a41e55fb0b72e71e96')
  assert.equal(camera.slices.length, 23)
  assert.ok(Object.isFrozen(dragSourceProfiles))
  for (const profile of dragSourceProfiles) {
    assert.ok(Object.isFrozen(profile)); assert.ok(Object.isFrozen(profile.slices))
    for (const slice of profile.slices) assert.ok(Object.isFrozen(slice))
  }
})
test('missing, unreadable and oversized source cannot admit the new owner', () => {
  for (const read of [() => { throw Object.assign(Error('missing'), {code:'ENOENT'}) }, () => { throw Error('unreadable') }, () => 'x'.repeat(1024*1024+1)]) {
    const result = inspectDragSource('.', read)
    assert.equal(result.status, 'unsupported-source-contract'); assert.equal(result.profile, null)
  }
})

test('protected-owner trigger inventory retains exact maintained union and command', async () => {
  const { readFileSync } = await import('node:fs')
  const checks = JSON.parse(readFileSync(new URL('../engineering/checks.json', import.meta.url), 'utf8'))
  const check = checks.checks.find(item => item.id === 'snapshot-drag-portable')
  assert.ok(check)
  assert.equal(check.automation, 'safe')
  assert.deepEqual([check.executable, ...check.args], ['node', '--test', 'tests/browser-snapshot-drag.test.mjs'])
  const owners = [...new Set(dragSourceProfiles.flatMap(profile => profile.slices.map(slice => slice.path)))]
  const paths = [...owners, 'scripts/browser-performance/snapshot-drag-contract.mjs',
    'scripts/browser-performance/snapshot-drag-observer.mjs', 'tests/browser-snapshot-drag.test.mjs']
  assert.deepEqual([...check.triggerPaths].sort(), [...paths].sort())
  for (const path of paths) assert.ok(check.inputs.some(input => path === input || path.startsWith(`${input}/`)))
})

test('the exact reviewed modal profile is the sole additive successor', () => {
  const modal = dragSourceProfiles.find(profile => profile.id === modalId)
  assert.ok(modal)
  assert.strictEqual(modal, dragSourceProfiles[10])
  assert.equal(modal.slices.length, 22)
  assert.equal(hash(modal), '194a4e3460fa33f3d2ad523da7ebf180a4dde3b3cbd0d02a4a10fc7d14ad9082')
})
