import { spawnSync, execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'

const root = process.cwd(), baseline = resolve('../bridge-quality-baseline-e931')
const output = resolve('work/orchestration/authored-bridge-initialization')
const paths = ['app/world-turn.ts', 'tests/authored-bridges.test.mjs']
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
assert.equal(git(baseline, 'rev-parse', 'HEAD'), 'e931f8903d2f1a91b14fdc1fdb011b72f4cf4718')
assert.equal(git(root, 'rev-parse', 'HEAD'), '56611410b260fa4a7abc38d83ad3aec6678841f3')
assert.equal(git(root, 'status', '--porcelain'), '')
assert.equal(git(baseline, 'status', '--porcelain'), '')
assert.equal(existsSync(resolve(baseline, 'node_modules')), false)
const run = (tool, name, cwd) => {
  const files = tool === 'eslint' ? paths : paths.slice(0, 1)
  const config = resolve(root, tool === 'eslint' ? 'eslint.config.mjs' : '.oxlintrc.json')
  const args = ['--config', config, '--format=json', ...files]
  const result = spawnSync(resolve(root, 'node_modules/.bin', tool), args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
  assert.ok(result.status === 0 || result.status === 1, `${tool} execution failed: ${result.stderr}`)
  writeFileSync(resolve(output, `${tool}-${name}-5661141.json`), result.stdout)
  writeFileSync(resolve(output, `${tool}-${name}-5661141.stderr.log`), result.stderr)
  const raw = JSON.parse(result.stdout)
  const diagnostics = tool === 'eslint'
    ? raw.flatMap(file => file.messages.map(message => ({ filename: file.filePath.slice(cwd.length + 1), severity: message.severity, code: message.ruleId, message: message.message })))
    : raw.diagnostics.map(({ filename, severity, code, message }) => ({ filename, severity, code, message }))
  const counts = {}
  for (const item of diagnostics) {
    const key = [item.filename, item.severity, item.code, item.message].join('|')
    counts[key] = (counts[key] ?? 0) + 1
  }
  return { head: git(cwd, 'rev-parse', 'HEAD'), status: result.status, command: [tool, ...args],
    filesSha256: Object.fromEntries(files.map(file => [file, sha256(readFileSync(resolve(cwd, file)))])),
    diagnostics: diagnostics.length, counts }
}
const comparisons = {}
for (const tool of ['eslint', 'oxlint']) {
  const before = run(tool, 'baseline', baseline), after = run(tool, 'candidate', root)
  const added = Object.entries(after.counts).filter(([key, count]) => count > (before.counts[key] ?? 0))
  comparisons[tool] = { baseline: before, candidate: after, added }
}
const legacyFormat = ['app/render-view.ts', 'app/viewport-bounds.ts']
for (const path of legacyFormat) assert.equal(sha256(readFileSync(resolve(root, path))), sha256(readFileSync(resolve(baseline, path))))
const report = { comparisons, unchangedLegacyFormatFiles: legacyFormat,
  method: 'Same installed tools and unchanged configuration, baseline at accepted main with no dependency tree. Compare touched-file diagnostics by filename/severity/code/message while ignoring positional shifts.',
  limits: 'Individual failed lint commands remain failed. Zero added diagnostics is scoped evidence, not repository-wide lint success.' }
writeFileSync(resolve(output, 'quality-delta-5661141.json'), JSON.stringify(report, null, 2) + '\n')
assert.deepEqual(comparisons.eslint.added, [])
assert.deepEqual(comparisons.oxlint.added, [])
assert.equal(git(root, 'status', '--porcelain'), '')
assert.equal(git(baseline, 'status', '--porcelain'), '')
console.log(JSON.stringify(Object.fromEntries(Object.entries(comparisons).map(([tool, value]) => [tool, {
  baselineExit: value.baseline.status, candidateExit: value.candidate.status,
  baselineDiagnostics: value.baseline.diagnostics, candidateDiagnostics: value.candidate.diagnostics, added: value.added.length
}]))))
