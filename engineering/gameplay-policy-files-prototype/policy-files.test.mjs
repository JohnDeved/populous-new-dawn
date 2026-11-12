import test from 'node:test'
import assert from 'node:assert/strict'
import { candidatePolicyFragment as check, limits } from './policy-files.mjs'
function fixture() {
  const candidate = 'a'.repeat(40), sha256 = 'b'.repeat(64)
  const file = { path: 'package.json', state: 'regular', sha256, bytes: 10 }
  const id = { device: '1', inode: '2', size: 10, links: 1, mode: 'regular', mtimeNs: '3', ctimeNs: '4' }
  return [{ candidate, paths: [file, { path: '.npmrc', state: 'absent', sha256: null, bytes: null }] },
    { candidate, files: [{ path: file.path, sha256, bytes: 10 }] },
    [{ ...file, rootAlias: false, parentAlias: false, before: { ...id }, opened: { ...id }, after: { ...id } },
      { path: '.npmrc', state: 'absent', sha256: null, bytes: null, rootAlias: false, parentAlias: false, before: null, opened: null, after: null }]]
}
test('supplied matching observation fragment, never execution admission', () => {
  const f = fixture(), original = structuredClone(f), result = check(...f)
  assert.equal(result.executionAuthorized, false); assert.equal(result.closure.length, 2)
  assert.deepEqual(f, original); assert.ok(Object.isFrozen(result.closure[0]))
})
for (const [name, change] of [
  ['new untracked npmrc', f => { f[2][1].state = 'regular' }],
  ['dangling hook symlink', f => { f[2][1].state = 'symlink' }],
  ['directory', f => { f[2][1].state = 'directory' }],
  ['unreadable not absent', f => { f[2][1].state = 'error' }],
  ['digest mismatch', f => { f[2][0].sha256 = 'c'.repeat(64) }],
  ['length mismatch', f => { f[2][0].bytes = 9 }],
  ['missing tracked binding', f => { f[1].files = [] }],
  ['candidate mismatch', f => { f[1].candidate = 'c'.repeat(40) }],
  ['extra manifest binding', f => { f[1].files.push({ path: 'unreviewed', sha256: 'b'.repeat(64), bytes: 1 }) }],
  ['duplicate profile', f => { f[0].paths.push({ ...f[0].paths[0] }) }],
  ['duplicate observation', f => { f[2][1] = { ...f[2][0] } }],
  ['unsafe path', f => { f[0].paths[0].path = '../package.json' }],
  ['root alias', f => { f[2][0].rootAlias = true }],
  ['parent alias', f => { f[2][1].parentAlias = true }],
  ['hardlink', f => { f[2][0].opened.links = 2 }],
  ['inode replacement', f => { f[2][0].after.inode = '20' }],
  ['changed before open', f => { f[2][0].opened.ctimeNs = '40' }],
  ['unsupported field', f => { f[2][0].trusted = true }],
  ['missing identity', f => { f[2][0].opened = null }],
  ['oversize file', f => { f[0].paths[0].bytes = limits.bytesPerFile + 1 }],
  ['oversize list', f => { f[0].paths = Array.from({ length: 33 }, () => ({ ...f[0].paths[0] })) }],
  ['sparse list', f => { delete f[2][0] }],
]) test(`rejects ${name}`, () => { const f = fixture(); change(f); assert.throws(() => check(...f)) })
test('aggregate cap rejected before observation consumption', () => {
  const f = fixture()
  f[0].paths = ['one', 'two', 'three'].map(path => ({ path, state: 'regular', sha256: 'b'.repeat(64), bytes: limits.bytesPerFile }))
  f[2].push(structuredClone(f[2][0]))
  assert.throws(() => check(...f), /aggregate byte cap/)
})
test('late absence change requires fresh rejection, not token reuse', () => {
  const f = fixture(); check(...f); f[2][1].state = 'regular'
  assert.throws(() => check(...f))
})
