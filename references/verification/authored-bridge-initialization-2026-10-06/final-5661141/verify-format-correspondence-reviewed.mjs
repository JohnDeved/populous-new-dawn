import ts from 'typescript'
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'

const beforeHead = 'd9aa20570e4a3d6c1dcc308a6bb9aaab97606798'
const afterHead = '56611410b260fa4a7abc38d83ad3aec6678841f3'
const path = 'app/world-turn.ts'
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' })
assert.equal(git('rev-parse', 'HEAD').trim(), afterHead)
assert.equal(git('status', '--porcelain').trim(), '')
assert.equal(git('diff', '--name-only', beforeHead, afterHead).trim(), path)
const before = git('show', `${beforeHead}:${path}`), after = readFileSync(path, 'utf8')
const hash = value => createHash('sha256').update(value).digest('hex')
const tree = (source, kind) => {
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, kind)
  const visit = node => {
    const children = node.getChildren(file)
    return children.length ? [node.kind, children.map(visit)] : [node.kind, node.getText(file)]
  }
  return JSON.stringify(visit(file))
}
const sourceBefore = tree(before, ts.ScriptKind.TS), sourceAfter = tree(after, ts.ScriptKind.TS)
assert.equal(sourceBefore, sourceAfter)
const options = { compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext } }
const emittedBefore = ts.transpileModule(before, options).outputText
const emittedAfter = ts.transpileModule(after, options).outputText
const emittedTreeBefore = tree(emittedBefore, ts.ScriptKind.JS), emittedTreeAfter = tree(emittedAfter, ts.ScriptKind.JS)
assert.equal(emittedTreeBefore, emittedTreeAfter)
writeFileSync(new URL('format-correspondence-reviewed.json', import.meta.url), JSON.stringify({
  status: 'passed', sourceBefore: beforeHead, sourceAfter: afterHead,
  onlyChangedFile: path, beforeSha256: hash(before), afterSha256: hash(after),
  sourceSyntaxTreeSha256: hash(sourceAfter), emittedJavaScriptSyntaxTreeSha256: hash(emittedTreeAfter),
  emittedBytesIdentical: emittedBefore === emittedAfter, typescriptVersion: ts.version,
  claim: 'Only formatter whitespace changed. TypeScript and emitted-JavaScript syntax trees are exactly equal after removing positions/trivia. Prior executions remain labelled with their actual source head.',
  diagnostic: 'The earlier ad hoc scanner-or-emit assertion was inconclusive. This retained parsed-tree check separately reports exact emitted-byte equality; no runtime difference is inferred from the earlier diagnostic.'
}, null, 2) + '\n')
console.log('PASS: TypeScript and emitted JavaScript syntax trees are identical; only call formatting changed')
