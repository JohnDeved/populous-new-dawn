import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import ts from 'typescript'
const path = 'app/hut-smoke-runtime.ts', before = readFileSync(path, 'utf8')
const result = spawnSync(process.execPath, ['node_modules/oxfmt/bin/oxfmt', '--stdin-filepath', path], { input: before, encoding: 'utf8' })
assert.equal(result.status, 0, result.stderr)
const after = result.stdout
assert.ok(after.includes('export function restoreSecondaryEffects'))
const tokens = source => {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, source), rows = []
  for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) rows.push([token, scanner.getTokenText()])
  return rows
}
const parse = source => ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true).parseDiagnostics
assert.equal(parse(before).length, 0); assert.equal(parse(after).length, 0)
assert.deepEqual(tokens(before), tokens(after))
writeFileSync('work/orchestration/hut-smoke-state-exit/final-quality-03/formatted-hut-smoke-runtime.ts', after)
const sha = value => createHash('sha256').update(value).digest('hex')
console.log(JSON.stringify({ beforeSha256: sha(before), afterSha256: sha(after), tokenCount: tokens(before).length, tokenSha256: sha(JSON.stringify(tokens(before))), tokensIdentical: true, parseErrors: 0, appUnchanged: readFileSync(path, 'utf8') === before }, null, 2))
