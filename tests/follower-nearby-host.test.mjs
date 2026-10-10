// Execute the actual ordinary adapter's host finally block. Browser handles and
// failures are supplied; this proves cleanup/report control flow, not gameplay.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { assertNearbyEvidence } from '../scripts/local-render/follower-nearby-contract.mjs'

test('actual host finally retains the primary failure and attempts every cleanup and report', async () => {
  const source = ts.createSourceFile('mission1-nearby-followers.mjs',
    readFileSync(new URL('../scripts/local-render/mission1-nearby-followers.mjs', import.meta.url), 'utf8'),
    ts.ScriptTarget.Latest, true),
    scenario = source.statements.find(node => ts.isFunctionDeclaration(node) &&
      node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword)),
    finalizer = scenario.body.statements.find(ts.isTryStatement).finallyBlock,
    primary = Error('original action failure'), events = [], report = { status: 'failed', errors: [] },
    bad = label => { events.push(label); throw Error(label) },
    clean = { errors: [], cleanup: { listener: true, subscription: true } },
    bindings = {
      assert, assertNearbyEvidence, report, failure: primary, heldPrimary: true,
      screenshot: async () => bad('screenshot failed'),
      page: { mouse: { up: async () => bad('release failed') } },
      witnesses: [
        { evaluate: async () => bad('first export failed'), dispose: async () => bad('first dispose failed') },
        { evaluate: async () => { events.push('second export'); return { records: [] } },
          dispose: async () => { events.push('second dispose') } },
      ],
      checkpoint: {
        evaluate: async callback => callback({ close() {
          events.push('checkpoint close')
          return { result: { save: clean, load: clean }, errors: [] }
        } }),
        dispose: async () => bad('checkpoint dispose failed'),
      },
      cdp: { send: async () => bad('metrics clear failed'), detach: async () => bad('CDP detach failed') },
      save: () => { events.push('terminal report'); assert.equal(report.status, 'failed') },
    },
    run = Function(...Object.keys(bindings), `return async () => ${finalizer.getText(source)}`)(...Object.values(bindings))
  await assert.doesNotReject(run())
  assert.equal(bindings.failure, primary)
  assert.deepEqual(events, [
    'screenshot failed', 'release failed', 'first export failed', 'first dispose failed',
    'second export', 'second dispose', 'checkpoint close', 'checkpoint dispose failed',
    'metrics clear failed', 'CDP detach failed', 'terminal report',
  ])
  assert.equal(report.epochs.length, 1, 'One failed export cannot prevent the next bounded export')
  for (const name of ['screenshot failed', 'release failed', 'first export failed',
    'first dispose failed', 'checkpoint dispose failed', 'metrics clear failed', 'CDP detach failed'])
    assert.ok(report.errors.some(error => error.includes(name)), name)
})
