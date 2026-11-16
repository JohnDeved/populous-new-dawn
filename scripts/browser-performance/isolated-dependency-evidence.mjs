// Passive provenance only. Does not install, execute, or relax the common-install gate.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { lstatSync, opendirSync, openSync, readSync, closeSync, realpathSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'

function hashBoundedFile(path, expectedSize, limit) {
  const fd = openSync(path, 'r'), buffer = Buffer.alloc(64 * 1024), hash = createHash('sha256')
  let bytes = 0
  try {
    for (;;) {
      const n = readSync(fd, buffer, 0, buffer.length, null)
      if (!n) break
      bytes += n; assert.ok(bytes <= limit && bytes <= expectedSize, 'File grew beyond admitted size')
      hash.update(buffer.subarray(0, n))
    }
  } finally { closeSync(fd) }
  assert.equal(bytes, expectedSize, 'File size changed during inventory')
  return hash.digest('hex')
}

const digest = data => createHash('sha256').update(data).digest('hex')
const inside = (root, path) => path.startsWith(root + sep)
const safePath = path => typeof path === 'string' && path.length > 0 && path.length <= 512 &&
  !isAbsolute(path) && !path.split(/[\\/]/).some(part => !part || part === '.' || part === '..')

export function collectIsolatedDependencyEvidence(spec) {
  assert.match(spec.revision, /^[a-f0-9]{40}$/)
  assert.ok(typeof spec.root === 'string' && spec.root.length > 0 && spec.root.length <= 4096, 'Source path bound exceeded')
  const root = realpathSync(spec.root), modules = resolve(root, 'node_modules')
  assert.ok(lstatSync(modules).isDirectory() && !lstatSync(modules).isSymbolicLink(), 'Install root must be a private directory')
  assert.equal(realpathSync(modules), modules)
  assert.ok(spec.inputs && typeof spec.inputs === 'object')
  for (const required of ['package.json', 'package-lock.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'])
    assert.ok(Object.hasOwn(spec.inputs, required), `Missing reviewed graph input: ${required}`)
  const declarations = []
  let inputBytes = 0
  // Check every declared size before reading any graph payload.
  for (const path in spec.inputs) {
    if (!Object.hasOwn(spec.inputs, path)) continue
    assert.ok(declarations.length < 64, 'Graph input count bound exceeded')
    assert.ok(safePath(path), 'Graph input path bound or syntax rejected')
    const expected = spec.inputs[path]
    assert.match(expected, /^[a-f0-9]{64}$/)
    const absolute = resolve(root, path), stat = lstatSync(absolute)
    assert.ok(stat.isFile() && !stat.isSymbolicLink(), 'Graph inputs must be regular')
    assert.ok(inside(root, realpathSync(absolute)), 'Graph input escaped source')
    assert.ok(stat.size <= 8 * 1024 ** 2, 'Graph input file bound exceeded')
    inputBytes += stat.size
    assert.ok(inputBytes <= 16 * 1024 ** 2, 'Graph input aggregate bound exceeded')
    declarations.push({ path, absolute, expected, size: stat.size })
  }
  const inputs = declarations.sort((a, b) => a.path.localeCompare(b.path)).map(({ path, absolute, expected, size }) => {
    const actual = hashBoundedFile(absolute, size, 8 * 1024 ** 2); assert.equal(actual, expected, `Stale source input: ${path}`)
    return [path, actual]
  })
  const entries = [], files = new Map(), inodes = new Set()
  let bytes = 0
  function visit(directory) {
    const stream = opendirSync(directory)
    try {
    for (let entry; (entry = stream.readSync()) !== null;) {
      const name = entry.name
      assert.ok(entries.length < 100000, 'Dependency entry bound exceeded')
      const path = resolve(directory, name), key = relative(modules, path), stat = lstatSync(path)
      assert.ok(safePath(key), 'Dependency path bound or syntax rejected')
      if (stat.isSymbolicLink()) {
        const target = realpathSync(path)
        assert.ok(inside(modules, target), 'Dependency link escaped private install')
        entries.push([key, 'link', relative(modules, target)]); continue
      }
      if (stat.isDirectory()) { entries.push([key, 'directory']); visit(path); continue }
      assert.ok(stat.isFile(), 'Special dependency file unsupported')
      assert.ok(stat.size <= 16 * 1024 ** 2, 'Dependency file bound exceeded')
      bytes += stat.size; assert.ok(bytes <= 1024 ** 3, 'Dependency byte bound exceeded')
      const row = [key, 'file', stat.size, hashBoundedFile(path, stat.size, 16 * 1024 ** 2)]
      entries.push(row); files.set(path, row); inodes.add(`${stat.dev}:${stat.ino}`)
    }
    } finally { stream.closeSync() }
  }
  visit(modules)
  entries.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)
  assert.ok(Array.isArray(spec.consumed) && spec.consumed.length > 0 && spec.consumed.length <= 64)
  assert.equal(new Set(spec.consumed).size, spec.consumed.length)
  const consumed = spec.consumed.map(path => {
    assert.ok(safePath(path)); const physical = realpathSync(resolve(modules, path))
    assert.ok(inside(modules, physical), 'Consumed dependency escaped private install')
    const row = files.get(physical); assert.ok(row, 'Consumed dependency is not an inventoried regular file')
    return [path, row[0], row[3]]
  })
  return { schema: 'isolated-dependency-evidence-v1', revision: spec.revision, root, modules,
    inputs, entries, consumed, bytes, inodes: [...inodes].sort(),
    manifestSha256: digest(JSON.stringify({ inputs, entries, consumed })) }
}

export function collectIsolatedDependencyPair(base, head) {
  const a = collectIsolatedDependencyEvidence(base), b = collectIsolatedDependencyEvidence(head)
  assert.ok(a.root !== b.root && !inside(a.root, b.root) && !inside(b.root, a.root), 'Source roots overlap')
  const identities = new Set(a.inodes)
  assert.ok(b.inodes.every(id => !identities.has(id)), 'Installs share writable file identities')
  return { schema: 'isolated-dependency-pair-v1', base: a, head: b,
    scope: 'Read-only supplied-revision provenance; not frozen-install, build-resolution, runtime or gate acceptance' }
}

export function verifyIsolatedDependencyPairUnchanged(base, head, expected) {
  const actual = collectIsolatedDependencyPair(base, head)
  assert.deepEqual(actual, expected, 'Dependency evidence changed since admission')
  return actual
}
