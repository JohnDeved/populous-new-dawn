// Exact-source controls. Requires the complete reviewed owner source closure.
// Source reads only: no Scene/RenderView import, browser or runtime validation.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { inspectDragSource, dragSourceProfiles } from '../scripts/browser-performance/snapshot-drag-contract.mjs'
const root = resolve(import.meta.dirname, '..')
const id = 'owned-numeric-terrain-chronological-camera-disposed-cpu-render-cpu-leases-loose-log-post-drain-retirement-tooltip-retirement-bookmark-retirement-hud-focus-boundary-modal-input-freeze-modal-sprite-sync-v1'
const parentId = 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-disposed-cpu-render-cpu-leases-loose-log-v1'
const originalId = 'owned-numeric-terrain-chronological-camera-v1'
const profile = dragSourceProfiles.find(p => p.id === id)
const read = path => readFileSync(resolve(root, path), 'utf8')
const inspect = override => inspectDragSource(root, path => override?.(path) ?? read(path))
function unsupported(report) {
  assert.equal(report.status, 'unsupported-source-contract')
  assert.equal(report.profile, null)
  assert.equal(report.profiles.filter(p => p.status === 'admitted').length, 0)
}

test('combined camera route selects exactly once only on the fully assembled source tree', () => {
  const report = inspect()
  assert.equal(report.status, 'admitted')
  assert.equal(report.profile, id)
  assert.equal(report.profiles.filter(p => p.status === 'admitted').length, 1)
  assert.equal(profile.slices.length, 23)
  assert.equal(new Set(profile.slices.map(s => s.id)).size, 23)
  assert.equal(new Set(dragSourceProfiles.map(p => p.id)).size, dragSourceProfiles.length)
})

test('combined route retains CPU/loose-log owners and original camera keeps epoch ancestry', () => {
  const parent = dragSourceProfiles.find(p => p.id === parentId)
  const original = dragSourceProfiles.find(p => p.id === originalId)
  const epoch = dragSourceProfiles.find(p => p.id === 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-v1')
  const changed = new Set(['input-move', 'frame-order', 'camera-producers'])
  for (const slice of parent.slices) if (!changed.has(slice.id))
    assert.deepEqual(profile.slices.find(s => s.id === slice.id), slice)
  for (const slice of epoch.slices) if (!changed.has(slice.id))
    assert.deepEqual(original.slices.find(s => s.id === slice.id), slice)
  assert.ok(profile.slices.some(s => s.id === 'pick-operation-leases'))
  assert.ok(profile.slices.some(s => s.id === 'resource-queue-owner'))
  assert.equal(original.slices.some(s => s.id === 'pick-operation-leases'), false)
  assert.equal(original.slices.some(s => s.id === 'resource-queue-owner'), false)
})

test('every combined owner rejects changed source and repeated slice boundaries', async t => {
  for (const slice of profile.slices) {
    await t.test(`${slice.id}: changed bytes`, () => {
      const source = read(slice.path)
      const start = slice.start === null ? 0 : source.indexOf(slice.start)
      assert.ok(start >= 0, 'slice start marker must exist before computing offset')
      const offset = slice.start === null ? 0 : start + slice.start.length
      unsupported(inspect(path => path === slice.path
        ? source.slice(0, offset) + '\n/* supplied source mutation */\n' + source.slice(offset) : undefined))
    })
    if (slice.start !== null) for (const boundary of [slice.start, slice.end])
      await t.test(`${slice.id}: repeated ${boundary === slice.start ? 'start' : 'end'}`, () => {
        unsupported(inspect(path => path === slice.path ? read(path) + '\n' + boundary : undefined))
      })
  }
})

test('every combined file rejects missing, unreadable, empty, non-string and oversized data', async t => {
  for (const path of new Set(profile.slices.map(s => s.path))) {
    for (const code of ['ENOENT', 'EACCES']) await t.test(`${path}: ${code}`, () => {
      unsupported(inspect(name => { if (name === path) throw Object.assign(Error(code), { code }) }))
    })
    for (const [name, value] of [['empty', ''], ['non-string', 42], ['oversized', 'x'.repeat(1024 * 1024 + 1)]])
      await t.test(`${path}: ${name}`, () => unsupported(inspect(p => p === path ? value : undefined)))
  }
})

test('real historical camera/clock byte mixtures do not inherit current admission', async t => {
  const fixtures = JSON.parse(read('tests/fixtures/snapshot-drag-camera-source-mixes.json'))
  for (const [name, fixture] of Object.entries(fixtures)) await t.test(name, () => {
    assert.equal(createHash('sha256').update(fixture.source).digest('hex'), fixture.sha256)
    assert.notEqual(fixture.source, read(fixture.path))
    unsupported(inspect(path => path === fixture.path ? fixture.source : undefined))
  })
})
