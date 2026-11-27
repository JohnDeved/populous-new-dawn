import assert from 'node:assert/strict'
import { linkSync, mkdirSync, mkdtempSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { observeCheckoutAllocation } from '../scripts/browser-performance/checkout-allocation.mjs'

function fixture(t) {
  const workspace = mkdtempSync(join(tmpdir(), 'checkout-allocation-'))
  t.after(() => rmSync(workspace, { recursive: true }))
  const packName = `pack-${'a'.repeat(40)}.pack`
  for (const arm of ['harness', 'candidate']) {
    mkdirSync(join(workspace, arm, 'public/original/sub'), { recursive: true })
    mkdirSync(join(workspace, arm, '.git/objects/pack'), { recursive: true })
    writeFileSync(join(workspace, arm, '.git/objects/pack', packName), 'identical bytes')
  }
  const asset = join(workspace, 'harness/public/original/sub/asset.dat')
  writeFileSync(asset, 'one physical inode')
  linkSync(asset, join(workspace, 'candidate/public/original/asset.dat'))
  return { workspace, asset, packName }
}

test('measures the actual harness/candidate paths; shared assets and distinct equal-byte packs differ', t => {
  const { workspace, asset, packName } = fixture(t)
  const result = observeCheckoutAllocation(workspace)
  const allocated = path => statSync(path, { bigint: true }).blocks * 512n
  const assetBytes = allocated(asset)
  const packBytes = ['harness', 'candidate'].reduce((n, arm) =>
    n + allocated(join(workspace, arm, '.git/objects/pack', packName)), 0n)
  assert.equal(result.status, 'observed')
  assert.equal(result.perArm.base.assets.logicalPathBytes, String('one physical inode'.length))
  assert.deepEqual(result.perAreaUnion.assets, { uniqueInodes: 1, inodeAllocatedBytes: String(assetBytes), sharedInodes: 1 })
  assert.deepEqual(result.perAreaUnion.packs, { uniqueInodes: 2, inodeAllocatedBytes: String(packBytes), sharedInodes: 0 })
  assert.deepEqual(result.allObservedFileUnion, { uniqueInodes: 3, inodeAllocatedBytes: String(assetBytes + packBytes) })
})

test('entry exhaustion or invalid limits return unavailable without any partial totals', t => {
  const { workspace } = fixture(t)
  assert.deepEqual(observeCheckoutAllocation(workspace, { maxEntries: 13 }), { status: 'unavailable', reason: 'entry-budget' })
  assert.deepEqual(observeCheckoutAllocation(workspace, { maxEntries: 5000 }), { status: 'unavailable', reason: 'invalid-budget' })
})

test('rejects symlink assets without following them or accounting for other paths', t => {
  const { workspace, asset } = fixture(t)
  symlinkSync(asset, join(workspace, 'candidate/public/original/linked.dat'))
  assert.deepEqual(observeCheckoutAllocation(workspace), { status: 'unavailable', reason: 'unexpected-entry' })
})

test('a symlinked second checkout cannot substitute for a distinct physical arm', t => {
  const workspace = mkdtempSync(join(tmpdir(), 'checkout-allocation-'))
  t.after(() => rmSync(workspace, { recursive: true }))
  mkdirSync(join(workspace, 'harness/public/original'), { recursive: true })
  mkdirSync(join(workspace, 'harness/.git/objects/pack'), { recursive: true })
  writeFileSync(join(workspace, 'harness/public/original/asset.dat'), 'asset')
  writeFileSync(join(workspace, 'harness/.git/objects/pack', `pack-${'a'.repeat(40)}.pack`), 'pack')
  symlinkSync(join(workspace, 'harness'), join(workspace, 'candidate'), 'dir')
  assert.deepEqual(observeCheckoutAllocation(workspace), { status: 'unavailable', reason: 'unexpected-directory' })
})
