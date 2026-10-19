import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()
const base = '2048a88a17983a4de619a649426b7f9554a7d319'
assert.equal(git('rev-parse', 'HEAD^'), base)
const allowed = ['.github/workflows/vector-causal-profile.yml', 'scripts/browser-performance/causal-profiler.mjs', 'scripts/browser-performance/causal-run.mjs', 'scripts/browser-performance/causal-scope.mjs', 'scripts/browser-performance/causal-stage.mjs', 'scripts/browser-performance/snapshot-capture.mjs', 'tests/causal-diagnostic.test.mjs']
assert.deepEqual(git('diff', '--name-only', base, 'HEAD').split('\n').sort(), allowed.sort())
for (const path of ['package.json', 'package-lock.json', 'scripts/browser-performance/build.mjs', 'scripts/browser-performance/run.mjs', 'scripts/browser-performance/snapshot-protocol.mjs', 'scripts/tutorial-browser/browser-config.mjs'])
  assert.equal(readFileSync(path, 'utf8'), execFileSync('git', ['show', `${base}:${path}`], { encoding: 'utf8' }))
console.log('Diagnostic-only scope and trusted builder, protocol, launch, and dependencies verified')
