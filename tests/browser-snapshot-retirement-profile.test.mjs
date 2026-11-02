import {previousHudFocusScene} from './helpers/hud-focus-scene-source.mjs'
// Exact source admission only: no application module is imported or executed.
import assert from 'node:assert/strict'
import test from 'node:test'
import {readPreviousOverviewCamera as readFileSync} from './helpers/overview-gate-camera-source.mjs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { dragSourceProfiles, inspectDragSource } from '../scripts/browser-performance/snapshot-drag-contract.mjs'

const root = resolve(import.meta.dirname, '..')
const parentId = 'owned-numeric-terrain-chronological-camera-disposed-cpu-render-cpu-leases-loose-log-v1'
const id = 'owned-numeric-terrain-chronological-camera-disposed-cpu-render-cpu-leases-loose-log-post-drain-retirement-v1'
const path = 'app/scene-camera-runtime.ts'
// Reconstruct the exact earlier camera-only candidate for these historical controls.
const source = readFileSync(resolve(root, path), 'utf8')
  .replace('    scene.onSound(222)\n    if (scene.disposed) return\n', '    scene.onSound(222)\n')
const hash = text => createHash('sha256').update(text).digest('hex')
// These controls specifically qualify the prior camera-only profile. Reconstruct
// its exact tooltip owner instead of mislabelling combined source as that profile.
const tooltipPath = 'app/scene-tooltip-runtime.ts'
const priorTooltip = readFileSync(resolve(root, tooltipPath), 'utf8')
  .replace('    scene.updateTooltipController(now)\n    if (scene.disposed) return\n',
    '    scene.updateTooltipController(now)\n')
  .replace('      scene.onSound(0x6a)\n      if (scene.disposed) return\n',
    '      scene.onSound(0x6a)\n')
assert.equal(hash(priorTooltip), 'ad67e80f8232e4440bd2da53dad3979aa16834b18e282e1bf2d901b2df1d5cfb')
const inspect = camera => inspectDragSource(root, file => file === path ? camera :
  file === tooltipPath ? priorTooltip : (file === 'app/scene.ts' ? previousHudFocusScene(readFileSync(resolve(root, file), 'utf8')) : readFileSync(resolve(root, file), 'utf8')))
const guard = '  if (scene.disposed) return\n'
const entries = ['skipIntroduction', 'focus', 'cameraBookmark', 'overview', 'zoom']
const guardOffset = name => {
  const start = source.indexOf(`export function ${name}(`)
  assert.ok(start >= 0)
  const offset = source.indexOf(guard, start)
  const drain = source.slice(start, offset)
  assert.match(drain, /scene\.advanceInputTime(?:\?\.)?\(\)\n$/)
  return offset
}
const unique = (report, expected) => {
  assert.equal(report.status, 'admitted')
  assert.equal(report.profile, expected)
  assert.equal(report.profiles.filter(profile => profile.status === 'admitted').length, 1)
}
const unsupported = report => {
  assert.equal(report.status, 'unsupported-source-contract')
  assert.equal(report.profile, null)
  assert.equal(report.profiles.filter(profile => profile.status === 'admitted').length, 0)
}

test('reviewed post-drain source selects exactly its new profile', () => {
  assert.equal(hash(source), 'fd25b51f7adad35cc41584423d75bda5c9fbf71823c5515beaf02e8a2e223c08')
  unique(inspect(source), id)
})

test('all five reviewed removals reconstruct the unchanged uniquely admitted parent', () => {
  let parent = source
  for (const offset of entries.map(guardOffset).sort((a, b) => b - a))
    parent = parent.slice(0, offset) + parent.slice(offset + guard.length)
  assert.equal(hash(parent), 'c7669e423b1adb993dfb4049dbd532a852037d0d389648943c8a669abafa86df')
  unique(inspect(parent), parentId)
})

test('new profile changes only the complete camera producer identity', () => {
  const parent = dragSourceProfiles.find(profile => profile.id === parentId)
  const candidate = dragSourceProfiles.find(profile => profile.id === id)
  assert.ok(candidate, 'explicit candidate profile must exist')
  assert.equal(candidate.slices.length, parent.slices.length)
  assert.equal(parent.slices.find(slice => slice.id === 'camera-producers').sha256,
    'c7669e423b1adb993dfb4049dbd532a852037d0d389648943c8a669abafa86df')
  assert.deepEqual(candidate.slices, parent.slices.map(slice => slice.id === 'camera-producers'
    ? { ...slice, sha256: 'fd25b51f7adad35cc41584423d75bda5c9fbf71823c5515beaf02e8a2e223c08' }
    : slice))
  assert.ok(Object.isFrozen(candidate) && Object.isFrozen(candidate.slices))
  assert.ok(candidate.slices.every(Object.isFrozen))
})

for (const name of entries) {
  test(`partial retirement fix missing ${name} guard fails closed`, () => {
    const offset = guardOffset(name)
    unsupported(inspect(source.slice(0, offset) + source.slice(offset + guard.length)))
  })
  test(`changed ${name} retirement predicate fails closed`, () => {
    const offset = guardOffset(name)
    unsupported(inspect(source.slice(0, offset) + guard.replace('scene.disposed', '!scene.disposed') + source.slice(offset + guard.length)))
  })
}
