import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, linkSync, rmSync, truncateSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import vm from 'node:vm'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { collectIsolatedDependencyPair, verifyIsolatedDependencyPairUnchanged } from '../scripts/browser-performance/isolated-dependency-evidence.mjs'

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'pnd-isolated-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const make = side => {
    const path = join(root, side); mkdirSync(join(path, 'node_modules', 'tool'), { recursive: true })
    const inputs = {}
    for (const name of ['package.json', 'package-lock.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'patches/tool.patch']) {
      mkdirSync(join(path, 'patches'), { recursive: true })
      const value = `${side}:${name}`; writeFileSync(join(path, name), value)
      inputs[name] = createHash('sha256').update(value).digest('hex')
    }
    writeFileSync(join(path, 'node_modules/tool/index.js'), side)
    return { root: path, revision: (side === 'base' ? 'a' : 'b').repeat(40), inputs, consumed: ['tool/index.js'] }
  }
  return [make('base'), make('head')]
}
test('separate graph manifests bind their own patch and consumed module bytes', t => {
  const [a,b] = fixture(t), result = collectIsolatedDependencyPair(a,b)
  assert.notEqual(result.base.manifestSha256, result.head.manifestSha256)
  assert.equal(result.base.consumed.length, 1)
  assert.match(result.scope, /not frozen-install/)
})
test('stale reviewed patch fails closed', t => {
  const [a,b] = fixture(t); writeFileSync(join(b.root, 'patches/tool.patch'), 'changed')
  assert.throws(() => collectIsolatedDependencyPair(a,b), /Stale source input/)
})
test('missing graph input fails closed', t => {
  const [a,b] = fixture(t); delete b.inputs['pnpm-workspace.yaml']
  assert.throws(() => collectIsolatedDependencyPair(a,b), /Missing reviewed graph input/)
})
test('external dependency symlink fails closed', t => {
  const [a,b] = fixture(t); symlinkSync(join(a.root, 'node_modules/tool'), join(b.root, 'node_modules/alias'))
  assert.throws(() => collectIsolatedDependencyPair(a,b), /escaped private install/)
})
test('cross-side hardlinked bytes fail even when names differ', t => {
  const [a,b] = fixture(t); linkSync(join(a.root, 'node_modules/tool/index.js'), join(b.root, 'node_modules/shared.js'))
  assert.throws(() => collectIsolatedDependencyPair(a,b), /share writable file identities/)
})
test('same install cannot be both sides', t => {
  const [a] = fixture(t); assert.throws(() => collectIsolatedDependencyPair(a,a), /roots overlap/)
})
test('missing consumed module cannot be attested', t => {
  const [a,b] = fixture(t); b.consumed = ['missing.js']
  assert.throws(() => collectIsolatedDependencyPair(a,b), /ENOENT/)
})
test('internal aliases resolve to inventoried bytes', t => {
  const [a,b] = fixture(t); symlinkSync('tool', join(b.root, 'node_modules/alias')); b.consumed = ['alias/index.js']
  const result = collectIsolatedDependencyPair(a,b); assert.equal(result.head.consumed[0][1], 'tool/index.js')
})

test('post-admission mutation is rejected rather than borrowing prior manifest', t => {
  const [a,b] = fixture(t), admitted = collectIsolatedDependencyPair(a,b)
  writeFileSync(join(b.root, 'node_modules/tool/index.js'), 'mutated')
  assert.throws(() => verifyIsolatedDependencyPairUnchanged(a,b,admitted), /Dependency evidence changed/)
})

test('graph file size is rejected before payload read', t => {
  const [a,b] = fixture(t); truncateSync(join(b.root, 'patches/tool.patch'), 8 * 1024 ** 2 + 1)
  assert.throws(() => collectIsolatedDependencyPair(a,b), /Graph input file bound/)
})
test('aggregate graph size is rejected before hashing any payload', t => {
  const [a,b] = fixture(t)
  for (const name of ['package.json', 'package-lock.json', 'pnpm-lock.yaml']) truncateSync(join(b.root, name), 6 * 1024 ** 2)
  assert.throws(() => collectIsolatedDependencyPair(a,b), /Graph input aggregate bound/)
})
test('graph declaration count is bounded', t => {
  const [a,b] = fixture(t)
  for (let i=0;i<60;i++) { const path = `patches/p${i}`; writeFileSync(join(b.root,path),''); b.inputs[path]='0'.repeat(64) }
  assert.throws(() => collectIsolatedDependencyPair(a,b), /Graph input count bound/)
})
test('overlong graph and consumer paths are rejected', t => {
  const [a,b] = fixture(t); b.inputs['x'.repeat(513)]='0'.repeat(64)
  assert.throws(() => collectIsolatedDependencyPair(a,b), /Graph input path bound/)
  delete b.inputs['x'.repeat(513)]; b.consumed=['x'.repeat(513)]
  assert.throws(() => collectIsolatedDependencyPair(a,b))
})

// Execute the exact production hash body with controlled filesystem boundaries.
// These are supplied-I/O negatives, not a concurrent real-filesystem guarantee.
function hashFixture(overrides = {}) {
  const text = readFileSync(new URL('../scripts/browser-performance/isolated-dependency-evidence.mjs', import.meta.url), 'utf8')
  const body = text.slice(text.indexOf('function hashBoundedFile('), text.indexOf('\nconst digest ='))
  let closes = 0, reads = 0
  const context = { assert, Buffer, createHash, openSync: () => 17,
    closeSync: fd => { assert.equal(fd,17); closes++ },
    readSync: (...args) => { reads++; return overrides.read(...args) } }
  const hash = vm.runInNewContext(`${body}; hashBoundedFile`, context)
  return { hash, closed: () => closes, reads: () => reads }
}
test('streamed hash rejects dynamic growth and closes descriptor exactly once', () => {
  let calls = 0
  const f = hashFixture({ read: (_fd,buffer) => { buffer[0]=65; return ++calls <= 2 ? 1 : 0 } })
  assert.throws(() => f.hash('/supplied',1,8), /grew beyond admitted size/)
  assert.equal(f.reads(),2); assert.equal(f.closed(),1)
})
test('streamed hash read error closes descriptor and propagates original error', () => {
  const error = new Error('supplied EIO'), f = hashFixture({ read: () => { throw error } })
  assert.throws(() => f.hash('/supplied',1,8), value => value === error)
  assert.equal(f.closed(),1)
})
test('streamed hash shortening closes descriptor before failing', () => {
  const f = hashFixture({ read: () => 0 })
  assert.throws(() => f.hash('/supplied',1,8), /size changed during inventory/)
  assert.equal(f.closed(),1)
})

test('directory read failure closes admitted directory without materializing listing', t => {
  const [a] = fixture(t), error = new Error('supplied directory EIO')
  const text = readFileSync(new URL('../scripts/browser-performance/isolated-dependency-evidence.mjs', import.meta.url), 'utf8')
  assert.doesNotMatch(text, /readdirSync/)
  let closes = 0, reads = 0
  const body = text.replace(/^import .*$/gm, '').replace(/^export /gm, '')
  const collect = vm.runInNewContext(`${body}; collectIsolatedDependencyEvidence`, {
    ...fs, ...path, assert, Buffer, createHash,
    opendirSync: directory => {
      const stream = fs.opendirSync(directory)
      return { readSync: () => { reads++; throw error }, closeSync: () => { closes++; stream.closeSync() } }
    },
  })
  assert.throws(() => collect(a), value => value === error)
  assert.equal(reads,1); assert.equal(closes,1)
})
