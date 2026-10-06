import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
const ts = (await import(process.cwd() + '/node_modules/typescript/lib/typescript.js')).default
const name = 'app/computer-runtime.ts'
const before = execFileSync('git', ['show', 'cdec00a4:' + name], { encoding: 'utf8' })
const after = readFileSync(name, 'utf8')
function tokens(text) {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, text)
  const rows = []
  for (let kind = scanner.scan(); kind !== ts.SyntaxKind.EndOfFileToken; kind = scanner.scan())
    rows.push([kind, scanner.getTokenText()])
  return rows
}
const a = tokens(before), b = tokens(after)
assert.deepEqual(b, a)
console.log(JSON.stringify({ status: 'passed', tokens: a.length, tokenSha256: createHash('sha256').update(JSON.stringify(a)).digest('hex'), scope: 'TypeScript lexical tokens unchanged; only formatter line joining' }))
