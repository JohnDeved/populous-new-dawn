// Host-only source validation. This module never imports gameplay modules.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname, relative, extname } from 'node:path'
import { stripTypeScriptTypes } from 'node:module'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { output, originalSha256, transformedSha256, transformedSource } from './observe.mjs'
const root = process.cwd(), folder = resolve(root, 'decomp/research/staging-selector-trace')
const hash = data => createHash('sha256').update(data).digest('hex')
const original = readFileSync('tests/mission2-raid.test.mjs', 'utf8')
const prefix = readFileSync(resolve(folder, 'maintained-prefix.txt'), 'utf8')
assert.equal(original.split(prefix).length, 2)
const scenario = readFileSync(resolve(folder, 'scenario.mjs'), 'utf8')
assert.equal(scenario.split(prefix.replace('  const w = createWorld(2)\n', '  const w = createWorld(2)\n  initialized(w)\n')).length, 2)
stripTypeScriptTypes(transformedSource, { mode: 'strip' })
const queue = [resolve(folder, 'runner.mjs')], seen = new Set(), external = new Set(), files = {}
while (queue.length) {
  const path = queue.pop()
  if (seen.has(path)) continue
  seen.add(path)
  const raw = readFileSync(path)
  files[relative(root, path)] = hash(raw)
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
assert.ok([...external].every(name => name.startsWith('node:')))
writeFileSync(`${output}/instrumented-runtime.ts`, transformedSource, { flag: 'wx' })
writeFileSync(`${output}/import-closure.json`, JSON.stringify({
  kind: 'Static import closure; no app imports executed',
  files: Object.fromEntries(Object.entries(files).sort()), external: [...external].sort(),
}, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ appExecution: false, nativeCalls: 0, localFiles: seen.size,
  originalSha256, transformedSha256, prefixSha256: hash(prefix), prefixMatchesMaintainedTest: true }))
