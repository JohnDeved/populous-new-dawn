// Passive Git/source admission only; no install, fetch, checkout or config writes.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { lstatSync, openSync, readSync, closeSync, realpathSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import { resolve, sep } from 'node:path'

const MAX = 8 * 1024 ** 2
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
export function reviewedSourceInputs(rootArgument, revision, paths) {
  const deadline = performance.now() + 30000
  const remaining = () => {
    const ms = Math.floor(deadline - performance.now())
    assert.ok(ms > 0, 'Source admission deadline exceeded')
    return ms
  }
  assert.ok(typeof rootArgument === 'string' && rootArgument.length <= 4096)
  assert.match(revision, /^[a-f0-9]{40}$/)
  assert.ok(Array.isArray(paths) && paths.length >= 4 && paths.length <= 64)
  assert.equal(new Set(paths).size, paths.length)
  for (const name of ['package.json', 'package-lock.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'])
    assert.ok(paths.includes(name), `Missing graph input: ${name}`)
  for (const path of paths) assert.ok(typeof path === 'string' && path.length <= 512 &&
    /^(?!\/)[A-Za-z0-9_@.+/-]+$/.test(path) && !path.split('/').some(p => !p || p === '.' || p === '..'), 'Unsupported input path')
  const root = realpathSync(rootArgument)
  const git = (args, maxBuffer = 65536) => {
    const timeout = Math.min(10000, remaining())
    const result = execFileSync('git', ['-c', 'core.fsmonitor=false', '-c', 'protocol.allow=never', '-C', root, ...args], {
    maxBuffer, timeout, encoding: 'buffer',
    // Do not inherit ambient alternate Git directories, index or config injection.
    env: { PATH: process.env.PATH, HOME: process.env.HOME, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null',
      GIT_NO_LAZY_FETCH: '1', GIT_OPTIONAL_LOCKS: '0', GIT_NO_REPLACE_OBJECTS: '1', GIT_TERMINAL_PROMPT: '0' },
    })
    remaining()
    return result
  }
  assert.equal(realpathSync(git(['rev-parse', '--show-toplevel']).toString().trim()), root, 'Root must be checkout root')
  assert.equal(git(['rev-parse', 'HEAD']).toString().trim(), revision, 'Unexpected HEAD')
  assert.equal(git(['status', '--porcelain', '--untracked-files=no']).length, 0, 'Tracked source must be clean')
  let total = 0
  const objects = paths.map(path => {
    const raw = git(['ls-tree', '-z', revision, '--', path]).toString()
    const match = /^([0-9]+) blob ([a-f0-9]{40})\t([^\0]+)\0$/.exec(raw)
    assert.ok(match && match[3] === path && ['100644', '100755'].includes(match[1]), 'Input must be one regular committed blob')
    const size = Number(git(['cat-file', '-s', match[2]]).toString().trim())
    assert.ok(Number.isSafeInteger(size) && size >= 0 && size <= MAX, 'Committed input size bound')
    total += size; assert.ok(total <= 16 * 1024 ** 2, 'Committed aggregate bound')
    return { path, blob: match[2], size }
  })
  const inputs = {}
  for (const { path, blob, size } of objects) {
    const bytes = git(['cat-file', 'blob', blob], MAX + 1)
    assert.equal(bytes.length, size)
    remaining()
    const absolute = resolve(root, path), stat = lstatSync(absolute)
    assert.ok(stat.isFile() && !stat.isSymbolicLink() && realpathSync(absolute).startsWith(root + sep), 'Working input must be contained regular file')
    assert.equal(stat.size, size)
    const fd = openSync(absolute, 'r'), digest = createHash('sha256'), buffer = Buffer.alloc(65536)
    let count = 0
    try {
      for (;;) { remaining(); const n = readSync(fd, buffer, 0, buffer.length, null); remaining(); if (!n) break
        count += n; assert.ok(count <= size, 'Working input grew'); digest.update(buffer.subarray(0,n)) }
    } finally { closeSync(fd) }
    assert.equal(count, size); inputs[path] = hash(bytes)
    assert.equal(digest.digest('hex'), inputs[path], 'Working input differs from committed blob')
  }
  assert.equal(git(['rev-parse', 'HEAD']).toString().trim(), revision, 'HEAD changed during admission')
  assert.equal(git(['status', '--porcelain', '--untracked-files=no']).length, 0, 'Tracked source changed during admission')
  return { schema: 'reviewed-source-inputs-v1', root, revision, inputs,
    blobs: objects, scope: 'Exact local Git/source snapshot; reviewed input-list completeness remains a caller obligation' }
}
