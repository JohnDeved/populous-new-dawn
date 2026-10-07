// Source text and existing-file hashes only; never import the port/app/native probe.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname, relative, extname } from 'node:path'
import { stripTypeScriptTypes } from 'node:module'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
const root = process.cwd(), folder = resolve(root, 'decomp/research/raid-state33-release/pair')
const queue = [resolve(folder, 'port.mjs')], seen = new Set(), external = new Set(), files = {}
const sha = data => createHash('sha256').update(data).digest('hex')
const add = path => { files[relative(root, path)] = sha(readFileSync(path)) }
while (queue.length) {
  const path = queue.pop()
  if (seen.has(path)) continue
  seen.add(path); add(path)
  if (!['.ts', '.mjs', '.js'].includes(extname(path))) continue
  let source = readFileSync(path, 'utf8')
  if (extname(path) === '.ts') source = stripTypeScriptTypes(source, { mode: 'strip' })
  for (const [, specifier] of source.matchAll(/(?:from\s*|import\s*\(\s*|import\s*)['"]([^'"]+)['"]/g)) {
    if (specifier.startsWith('.')) {
      const target = resolve(dirname(path), specifier)
      assert.ok(existsSync(target), target); queue.push(target)
    } else external.add(specifier)
  }
}
assert.deepEqual([...external].sort(), ['node:assert/strict', 'node:crypto', 'node:fs', 'node:inspector', 'node:v8'])
for (const name of readdirSync(folder)) if (name !== 'launch-manifest.json') add(resolve(folder, name))
for (const name of ['tests/mission2-raid.test.mjs', 'scripts/decomp.py',
  'decomp/research/raid-state33-release/captured-3227/snapshot.bin',
  'decomp/research/raid-state33-release/captured-3227/manifest.json',
  'scripts/check-native-person-state.py', 'scripts/check-native-animation.py',
  'scripts/check-native-building-attack.py', 'scripts/check-native-route-recovery.py',
  'scripts/check-native-object-cells.py', 'decomp/generated/004ed8a0.c',
  'decomp/generated/004f2440.c', 'decomp/generated/004f2460.c']) add(resolve(root, name))
const previous = JSON.parse(readFileSync('decomp/research/raid-phase6-settlement/launch-manifest.json'))
const python = previous.toolFiles[0].path, node = process.execPath
const paths = [node, python, ...previous.toolFiles.map(t => t.path)]
const tools = [...new Set(paths)].map(path => ({ path, sha256: sha(readFileSync(path)) }))
const executable = '/workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/game/d3dpoptb.exe'
const fixture = JSON.parse(readFileSync(resolve(folder, 'fixture.json')))
const inputs = [executable, ...fixture.sourceData.map(row => resolve(dirname(executable), row.path))]
const manifest = { kind: 'Unexecuted finite native/port pair launch contract',
  runtimeHead: '48a84610254d3ad5cddb600c266ed9a151233b79', runtimeAppTree: '562dd076f45cfc2bed6c3da0e6279d06b5b47af9',
  sourceHead: 'Explicit reviewed commit in later launch arguments; checked before/after',
  python, node, executable, toolIdentity: previous.toolIdentity,
  output: 'work/orchestration/state33-release-pair-20261007-01',
  limits: { termSeconds: 12, killGraceSeconds: 3, sampleSeconds: 0.02,
    aggregateRssBytes: 1073741824, outputBytes: 8388608, cpuCount: 1,
    retry: false, nativeInvocations: 1, portInvocations: 1,
    nativeInstructions: 100000, nativeMicroseconds: 1000000, portSeconds: 5 },
  portCommand: [node, '--permission', '--allow-inspector', '--allow-fs-read=' + root, resolve(folder, 'port.mjs')],
  environment: { PND_STATE33_PAIR: 'approved-one-pair', PND_STATE33_PAIR_CPU: 'single parent-granted CPU' },
  inspector: 'In-process Session.connect and Profiler coverage only; no open/inspect flag, socket, server, endpoint or policy change',
  external: [...external].sort(), tools,
  externalInputs: inputs.map(path => ({ path, sha256: sha(readFileSync(path)) })),
  files: Object.entries(files).sort().map(([path, sha256]) => ({ path, sha256 })) }
const bytes = JSON.stringify(manifest, null, 2) + '\n'
writeFileSync(resolve(folder, 'launch-manifest.json'), bytes)
console.log(JSON.stringify({ sourceFiles: manifest.files.length, externalInputs: inputs.length,
  manifestSha256: sha(bytes), nativeCalls: 0, appExecution: false }))
