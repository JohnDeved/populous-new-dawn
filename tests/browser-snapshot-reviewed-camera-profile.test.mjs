import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { dragSourceProfiles, inspectDragSource } from '../scripts/browser-performance/snapshot-drag-contract.mjs'
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
test('all nine historical trusted-main profiles remain exact', () => {
  assert.equal(dragSourceProfiles.length, 18)
  assert.equal(hash(dragSourceProfiles.slice(0, 9)), '82475e1af1f3f44c1bf7487ddee1071b912e565bee93c1dd31dce703245d5706')
})
test('only the exact reviewed complete camera profile is added and frozen', () => {
  assert.equal(hash(dragSourceProfiles.at(-1)), 'f6c4e97ed81f6ac6fb92cb25c5dd7e5cf0ded8ef73efe6a41e55fb0b72e71e96')
  assert.equal(dragSourceProfiles.at(-1).slices.length, 23)
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
  assert.deepEqual([check.executable, ...check.args], ['node', '--test', 'tests/browser-snapshot-drag.test.mjs', 'tests/browser-snapshot-drag-camera-profile.test.mjs'])
  const owners = [...new Set(dragSourceProfiles.flatMap(profile => profile.slices.map(slice => slice.path)))]
  const paths = [...owners, 'scripts/browser-performance/snapshot-drag-contract.mjs',
    'scripts/browser-performance/snapshot-drag-observer.mjs', 'tests/browser-snapshot-drag.test.mjs',
    'tests/browser-snapshot-drag-camera-profile.test.mjs', 'tests/fixtures/snapshot-drag-camera-source-mixes.json',
    'tests/fixtures/snapshot-drag-pre-camera-owners.json']
  assert.deepEqual([...check.triggerPaths].sort(), [...paths].sort())
  for (const path of paths) assert.ok(check.inputs.some(input => path === input || path.startsWith(`${input}/`)))
})
