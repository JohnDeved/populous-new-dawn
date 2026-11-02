import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { dragSourceProfiles, inspectDragSource } from '../scripts/browser-performance/snapshot-drag-contract.mjs'
const root = resolve(import.meta.dirname, '..')
const read = path => readFileSync(resolve(root, path), 'utf8')
const hash = source => createHash('sha256').update(source).digest('hex')
const id = 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-disposed-cpu-render-cpu-leases-loose-log-index-prefix-v1'
const previousId = 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-disposed-cpu-render-cpu-leases-loose-log-v1'
const source = read('app/render-view.ts')
const originalImport = "import { terrainIndicesBelowCount } from './terrain-index-prefix.ts'\n"
const currentCall = 'terrainIndicesBelowCount(index!.array.subarray(0, count) as Uint32Array, position)'
const previousCall = 'index!.array.subarray(0, count).every((id: number) => id < position.count)'
function previousSource() {
  assert.equal(hash(source), 'fcecf7399a2ddc62737944a84bbd6e2bd3d95a81ccb14e071d24629152cc5eac')
  assert.equal(source.split(originalImport).length, 2)
  assert.equal(source.split(currentCall).length, 2)
  const result = source.replace(originalImport, '').replace(currentCall, previousCall)
  assert.equal(hash(result), '4988a6e4da0aa303b22b7014bfc03319ba1a61012d2436a2c7c696e23275e461')
  return result
}
test('index-prefix admission preserves all nine historical profiles and the unchanged evaluator', () => {
  assert.equal(dragSourceProfiles.length, 10)
  assert.equal(hash(JSON.stringify(dragSourceProfiles.slice(0, 9))), '82475e1af1f3f44c1bf7487ddee1071b912e565bee93c1dd31dce703245d5706')
  for (const profile of dragSourceProfiles) {
    assert.ok(Object.isFrozen(profile)); assert.ok(Object.isFrozen(profile.slices))
    for (const slice of profile.slices) assert.ok(Object.isFrozen(slice))
  }
  const current = dragSourceProfiles.at(-1), previous = dragSourceProfiles.at(-2)
  assert.equal(current.id, id); assert.equal(previous.id, previousId)
  assert.equal(current.slices.length, 21)
  for (const [i, slice] of previous.slices.entries()) {
    assert.deepEqual({ ...current.slices[i], sha256: slice.sha256 }, slice)
    assert.equal(current.slices[i].sha256 !== slice.sha256, slice.id === 'query-inputs')
  }
  // An additive profile does not alter the evaluator implementation.
  const contract = read('scripts/browser-performance/snapshot-drag-contract.mjs')
  assert.equal(hash(contract.slice(contract.indexOf('const hash = value =>'))), 'e1034f40ffae279783aa5af2b8df097891314682cd11d65d9c2078f5a750d062')
})
test('current prefix source is uniquely admitted while exact predecessor retains historical admission', () => {
  const current = inspectDragSource(root)
  assert.equal(current.profile, id); assert.equal(current.status, 'admitted')
  assert.equal(current.profiles.filter(p => p.status === 'admitted').length, 1)
  const prior = previousSource()
  const historical = inspectDragSource(root, path => path === 'app/render-view.ts' ? prior : read(path))
  assert.equal(historical.profile, previousId)
  assert.equal(historical.profiles.filter(p => p.status === 'admitted').length, 1)
  // Earlier profiles intentionally never bound unused imports/helpers. Preserve
  // that scope: old query + unused new helper is historical, never the new route.
  assert.equal(inspectDragSource(root, path => path === 'app/render-view.ts'
    ? source.replace(currentCall, previousCall) : read(path)).profile, previousId)
})
test('prefix admission rejects changed, missing, unreadable and oversized helper bytes', () => {
  for (const replacement of [() => '', () => `${read('app/terrain-index-prefix.ts')}\n`,
    () => undefined, () => ' '.repeat(1024 * 1024 + 1),
    () => { throw Object.assign(Error('missing'), { code: 'ENOENT' }) },
    () => { throw Object.assign(Error('denied'), { code: 'EACCES' }) }]) {
    const result = inspectDragSource(root, path => path === 'app/terrain-index-prefix.ts' ? replacement() : read(path))
    assert.equal(result.status, 'unsupported-source-contract'); assert.equal(result.profile, null)
  }
})
test('prefix admission binds actual import and query together, not comments or swapped callees', () => {
  for (const changed of [source.replace(originalImport, ''),
    source.replace(originalImport, `/* ${originalImport.trim()} */\n`),
    source.replace(originalImport, originalImport.replace("'./terrain-index-prefix.ts'", "'./other.ts'")),
    source.replace(originalImport, originalImport + originalImport),
    source.replace(currentCall, currentCall.replace(', position)', ', otherPosition)')),
    source.replace(currentCall, currentCall.replace('terrainIndicesBelowCount(', 'otherPrefix('))]) {
    const result = inspectDragSource(root, path => path === 'app/render-view.ts' ? changed : read(path))
    assert.equal(result.status, 'unsupported-source-contract'); assert.equal(result.profile, null)
  }
})
