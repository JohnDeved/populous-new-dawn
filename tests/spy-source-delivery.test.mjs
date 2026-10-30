import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { qualifySpyHelper, SPY_HELPER } from '../scripts/tutorial-browser/spy-source-delivery.mjs'

function zeroImports(source) {
  const file = ts.createSourceFile('qualified.mjs', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
  assert.deepEqual(file.parseDiagnostics, [], 'Qualified helper must parse without recovery')
  const visit = node => {
    assert.ok(!ts.isImportDeclaration(node) && !ts.isImportEqualsDeclaration(node) &&
      !(ts.isExportDeclaration(node) && node.moduleSpecifier) &&
      !(ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword),
    'Qualified helper must have zero import closure')
    ts.forEachChild(node, visit)
  }
  visit(file)
}
const bytes = readFileSync(new URL('../scripts/controlled-scene-frames.mjs', import.meta.url))

test('qualified helper bytes and zero-import AST are the same immutable module', () => {
  assert.deepEqual(qualifySpyHelper(bytes), { ...SPY_HELPER, imports: [] })
  zeroImports(bytes.toString('utf8'))
})
test('changed bytes require explicit closure requalification, never automatic hashes', () => {
  assert.throws(() => qualifySpyHelper(Buffer.concat([bytes, Buffer.from('\n')])))
  const changed = Buffer.from(bytes); changed[20] ^= 1
  assert.throws(() => qualifySpyHelper(changed))
  assert.throws(() => qualifySpyHelper(bytes.toString('utf8')))
})
test('closure guard rejects static, re-export and nested computed dynamic dependencies', () => {
  for (const source of ["import x from './x.mjs'", "import './x.mjs'",
    "export { x } from './x.mjs'", "export * from './x.mjs'",
    "async function x(){ return import('./x.mjs') }", "function x(p){ return import(p) }",
    "import x = require('./x')", 'export const = ;']) assert.throws(() => zeroImports(source))
  zeroImports("const prose = 'import(x)'; // import x from x\nexport const x = 1")
})
test('production-preview preflight precedes capture ownership and keeps exact native import', () => {
  const source = readFileSync(new URL('../scripts/tutorial-browser/spy-source.mjs', import.meta.url), 'utf8')
  assert.ok(source.indexOf('await delivery.preflight()') < source.indexOf('page.evaluate(installSpyCapture'))
  assert.ok(source.indexOf('await delivery.preflight()') > source.lastIndexOf('await page.reload('))
  assert.match(source, /await import\('\/scripts\/controlled-scene-frames.mjs'\)/)
  assert.match(source, /delivery.verifyCacheReuse\(\)[\s\S]*?await delivery.close\(\)/)
  assert.match(source, /finally \{\s*await delivery\?\.close\(\)/)
})
