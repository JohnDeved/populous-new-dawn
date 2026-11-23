// Passive canonical declaration closure, not a YAML parser or frozen-install proof.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
const GRAPH = ['package.json', 'package-lock.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml']
const sha = b => createHash('sha256').update(b).digest('hex')
function declarations(text) {
  assert.ok(!text.includes('\r') && !text.includes('\t'), 'Unsupported whitespace')
  assert.ok(!/^.*(?:^|:\s+|^\s+)[&*!]|^\s*<<\s*:|^.*\\[uUxX][0-9a-fA-F]/m.test(text), 'Unsupported YAML escape/alias/tag/merge')
  assert.ok(!text.includes('\\') && !/^\s*[?:](?:\s|$)/m.test(text), 'Unsupported YAML explicit key or escaped multiline form')
  const lines = text.split('\n'), result = new Map()
  let active = false, found = false
  for (const line of lines) {
    if (line.includes('patchedDependencies')) {
      assert.equal(line, 'patchedDependencies:', 'Unsupported patch declaration form')
      assert.ok(!found, 'Duplicate patch declaration'); found = active = true; continue
    }
    if (!active || !line.trim()) continue
    if (!line.startsWith(' ')) { active = false; continue }
    const match = /^  ((?:@[a-z0-9_.-]+\/)?[a-z0-9_.-]+@[0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.-]+)?): ([A-Za-z0-9_@./-]+)$/.exec(line)
    assert.ok(match, 'Unsupported patch declaration entry')
    assert.ok(!result.has(match[1]), 'Duplicate patch selector')
    assert.ok(result.size < 60, 'Patch declaration count bound')
    result.set(match[1], match[2])
  }
  assert.ok(!found || result.size > 0, 'Empty patch declaration unsupported')
  return result
}
export function reviewedPatchClosure(manifest, supplied) {
  assert.equal(manifest?.schema, 'reviewed-source-inputs-v1')
  assert.match(manifest.revision, /^[a-f0-9]{40}$/)
  const names = Object.keys(supplied), expected = Object.keys(manifest.inputs)
  assert.ok(names.length >= 4 && names.length <= 64 && expected.length <= 64, 'Input count bound')
  assert.deepEqual(names.sort(), expected.sort(), 'Supplied/reviewed input closure mismatch')
  let total = 0
  for (const name of names) {
    assert.ok(name.length <= 512 && /^(?!\/)[A-Za-z0-9_@.+/-]+$/.test(name) &&
      !name.split('/').some(p => !p || p === '.' || p === '..'), 'Unsafe input path')
    assert.ok(Buffer.isBuffer(supplied[name]), 'Input bytes required')
    total += supplied[name].length
    assert.ok(supplied[name].length <= 8 * 1024 ** 2 && total <= 16 * 1024 ** 2, 'Input byte bound')
    assert.match(manifest.inputs[name], /^[a-f0-9]{64}$/)
    assert.equal(sha(supplied[name]), manifest.inputs[name], 'Stale reviewed input bytes')
  }
  for (const name of GRAPH) assert.ok(names.includes(name), 'Missing graph input')
  // Decode every JSON string token so escaped or shadowed duplicate owners
  // cannot hide an alternative patch declaration from the parsed object.
  for (const name of ['package.json', 'package-lock.json']) {
    const text = supplied[name].toString('utf8')
    JSON.parse(text)
    for (const token of text.matchAll(/"(?:[^"\\]|\\.)*"/g))
      assert.notEqual(JSON.parse(token[0]), 'patchedDependencies', 'Alternative patch owner unsupported')
  }
  const workspace = declarations(supplied['pnpm-workspace.yaml'].toString('utf8'))
  const lock = declarations(supplied['pnpm-lock.yaml'].toString('utf8'))
  assert.deepEqual([...workspace.keys()].sort(), [...lock.keys()].sort(), 'Workspace/lock selector mismatch')
  const paths = new Set(), patches = []
  for (const [selector, path] of workspace) {
    assert.ok(/^patches\/[A-Za-z0-9_@.+/-]+\.patch$/.test(path) &&
      !path.split('/').some(p => !p || p === '.' || p === '..'), 'Unsafe patch path')
    assert.ok(!paths.has(path), 'Duplicate patch path'); paths.add(path)
    assert.ok(names.includes(path), 'Omitted declared patch')
    const semanticHash = lock.get(selector)
    assert.match(semanticHash, /^[a-f0-9]{64}$/, 'Unsupported pnpm hash representation')
    patches.push({ selector, path, reviewedByteSha256: manifest.inputs[path], pnpmSemanticHash: semanticHash })
  }
  assert.deepEqual(names.filter(n => !GRAPH.includes(n)).sort(), [...paths].sort(), 'Extra reviewed input')
  return { schema: 'reviewed-patch-closure-v1', revision: manifest.revision, patches,
    scope: 'Canonical declaration and reviewed-byte closure only; semantic hash is opaque, not recomputed or equated to byte SHA256' }
}
