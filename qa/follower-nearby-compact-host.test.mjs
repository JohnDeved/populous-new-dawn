// Execute the compact adapter's actual host finalizer with supplied failures.
// Public Load/Scene/typed state composition is covered by the retained episode test.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { assertNearbyEvidence } from '../scripts/local-render/follower-nearby-contract.mjs'

for (const reportFailure of [false, true]) test(`compact host preserves action failure through all cleanup; report failure ${reportFailure}`, async () => {
  const source = ts.createSourceFile('compact.mjs',
    readFileSync(new URL('../scripts/local-render/mission1-nearby-compact-load.mjs', import.meta.url), 'utf8'),
    ts.ScriptTarget.Latest, true),
    scenario = source.statements.find(node => ts.isFunctionDeclaration(node) &&
      node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword)),
    finalizer = scenario.body.statements.find(ts.isTryStatement).finallyBlock,
    primary = Error('original compact action failure'), events = [], report = { status: 'failed', errors: [] },
    bad = label => { events.push(label); throw Error(label) },
    bindings = {
      assert, assertNearbyEvidence, report, receipt: { errors: [] }, failure: primary,
      expected: { phases: ['compact-global', 'compact-nearby', 'compact-keyboard-global'], nearby: false },
      witness: { evaluate: async () => bad('epoch export failed'), dispose: async () => bad('epoch dispose failed') },
      checkpoint: { evaluate: async () => bad('checkpoint close failed'), dispose: async () => bad('checkpoint dispose failed') },
      cdp: { send: async () => bad('metrics clear failed'), detach: async () => bad('CDP detach failed') },
      save: () => { events.push('terminal report'); if (reportFailure) throw Error('report writer failed') },
    },
    run = Function(...Object.keys(bindings), `return async () => {${finalizer.getText(source)};return failure}`)(...Object.values(bindings))
  assert.equal(await run(), primary)
  assert.deepEqual(events, ['epoch export failed', 'epoch dispose failed', 'checkpoint close failed',
    'checkpoint dispose failed', 'metrics clear failed', 'CDP detach failed', 'terminal report'])
  for (const label of events.slice(0, -1)) assert.ok(report.errors.some(error => error.includes(label)), label)
  assert.equal(report.status, 'failed')
  if (reportFailure) {
    assert.match(report.errors.at(-1), /report writer failed/)
    assert.deepEqual(bindings.receipt.errors, report.errors)
  }
})
