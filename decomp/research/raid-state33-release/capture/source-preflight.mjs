// Hash and inspect source text only. Never import the scenario or any app module.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname, relative, extname } from 'node:path'
import { stripTypeScriptTypes } from 'node:module'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'

const root = process.cwd(), folder = resolve(root, 'work/orchestration/state33-release-capture-source')
const queue = [resolve(folder, 'main.mjs')], seen = new Set(), external = new Set(), files = {}
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
while (queue.length) {
  const path = queue.pop()
  if (seen.has(path)) continue
  seen.add(path)
  const raw = readFileSync(path)
  files[relative(root, path)] = sha(raw)
  if (!['.ts', '.mjs', '.js'].includes(extname(path))) continue
  let source = raw.toString()
  if (extname(path) === '.ts') source = stripTypeScriptTypes(source, { mode: 'strip' })
  for (const [, specifier] of source.matchAll(/(?:from\s*|import\s*\(\s*|import\s*)['"]([^'"]+)['"]/g)) {
    if (specifier.startsWith('.')) {
      const target = resolve(dirname(path), specifier)
      assert.ok(existsSync(target), target)
      queue.push(target)
    } else external.add(specifier)
  }
}
assert.deepEqual([...external].sort(), ['node:assert/strict', 'node:crypto', 'node:fs', 'node:path', 'node:v8'])
for (const path of ['tests/mission2-raid.test.mjs',
  'decomp/research/raid-state33-release/observed-3227.json',
  'decomp/research/raid-state33-release/capture/prepare.py',
  'decomp/research/raid-state33-release/capture/source-preflight.mjs',
  'decomp/research/raid-state33-release/capture/guardian.py',
  'work/orchestration/state33-release-capture-source/scenario-source.txt',
  'work/orchestration/state33-release-capture-source/transform.json']) files[path] = sha(readFileSync(path))
const python = '/workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/venv/bin/python'
const manifest = { kind: 'Source-only passive capture preflight; no simulation/native execution',
  runtimeHead: '48a84610254d3ad5cddb600c266ed9a151233b79',
  runtimeAppTree: '562dd076f45cfc2bed6c3da0e6279d06b5b47af9',
  sourceHead: 'Supplied explicitly in the later reviewed launch command; checked by guardian',
  case: 'Mission 2 naturally earns Matak kills and launches the organized raid',
  tickCalls: 3227, output: 'work/orchestration/state33-release-capture-20261007-01',
  limits: { termSeconds: 120, killGraceSeconds: 10, sampleSeconds: 0.05,
    aggregateRssBytes: 1073741824, outputBytes: 8388608, snapshotBytes: 7340032,
    cpuCount: 1, retry: false, nativeCalls: 0, packageAccess: false },
  tools: [{ path: process.execPath, sha256: sha(readFileSync(process.execPath)), version: process.version },
    { path: python, sha256: sha(readFileSync(python)) }],
  external: [...external].sort(),
  files: Object.entries(files).sort().map(([path, sha256]) => ({ path, sha256 })) }
const bytes = JSON.stringify(manifest, null, 2) + '\n'
writeFileSync(resolve(folder, 'launch-manifest.json'), bytes)
console.log(JSON.stringify({ sourceFiles: manifest.files.length, manifestSha256: sha(bytes),
  nativeCalls: 0, appExecution: false, packageAccess: false }))
