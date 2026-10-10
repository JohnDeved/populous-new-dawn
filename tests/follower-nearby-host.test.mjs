// Execute the actual ordinary adapter's host finally block. Browser handles and
// failures are supplied; this proves cleanup/report control flow, not gameplay.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { assertNearbyEvidence } from '../scripts/local-render/follower-nearby-contract.mjs'

for (const reportFailure of [false, true]) test(`actual host finally retains the primary failure and attempts every cleanup; report failure ${reportFailure}`, async () => {
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
      assert, assertNearbyEvidence, report, receipt: { errors: [] }, failure: primary, heldPrimary: true,
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
      save: () => {
        events.push('terminal report'); assert.equal(report.status, 'failed')
        if (reportFailure) throw Error('report writer failed')
      },
    },
    run = Function(...Object.keys(bindings), `return async () => {${finalizer.getText(source)};return failure}`)(...Object.values(bindings))
  assert.equal(await run(), primary)
  assert.deepEqual(events, [
    'screenshot failed', 'release failed', 'first export failed', 'first dispose failed',
    'second export', 'second dispose', 'checkpoint close', 'checkpoint dispose failed',
    'metrics clear failed', 'CDP detach failed', 'terminal report',
  ])
  assert.equal(report.epochs.length, 1, 'One failed export cannot prevent the next bounded export')
  for (const name of ['screenshot failed', 'release failed', 'first export failed',
    'first dispose failed', 'checkpoint dispose failed', 'metrics clear failed', 'CDP detach failed'])
    assert.ok(report.errors.some(error => error.includes(name)), name)
  if (reportFailure) {
    assert.match(report.errors.at(-1), /report writer failed/)
    assert.deepEqual(bindings.receipt.errors, report.errors)
  }
})

for (const mode of ['snapshot', 'read failure', 'overflow', 'write failure'])
  test(`actual failed inspect keeps one bounded diagnostic, screenshot and original error: ${mode}`, async () => {
    const source = ts.createSourceFile('mission1-nearby-followers.mjs',
      readFileSync(new URL('../scripts/local-render/mission1-nearby-followers.mjs', import.meta.url), 'utf8'),
      ts.ScriptTarget.Latest, true),
      scenario = source.statements.find(node => ts.isFunctionDeclaration(node) &&
        node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword)),
      inspect = scenario.body.statements.filter(ts.isVariableStatement)
        .flatMap(node => [...node.declarationList.declarations]).find(node => node.name.getText(source) === 'inspect'),
      primary = Error('original DOM mismatch'), events = [], report = { errors: [], stages: [] },
      diagnostic = { state: { nearby: false }, surface: { sprite: { position: '0px -535px' } } },
      bindings = {
        admit: () => {}, report,
        wait: async () => { events.push('poll'); throw primary },
        witness: { evaluate: async (callback, pressed) => callback({ inspect(value) {
          events.push('diagnostic'); assert.equal(value, true)
          if (mode === 'read failure') throw Error('actual diagnostic read failed')
          return mode === 'overflow' ? { value: 'x'.repeat(262145) } : diagnostic
        } }, pressed) },
        screenshot: async () => { events.push('screenshot') },
        save: () => {
          events.push('save')
          assert.equal(report.failedInspection.label, 'global-pressed')
          if (mode === 'write failure') throw Error('diagnostic write failed')
        },
      },
      run = Function(...Object.keys(bindings), `return (${inspect.initializer.getText(source)})`)(...Object.values(bindings))
    await assert.rejects(run('global-pressed', true), error => error === primary)
    assert.deepEqual(events, ['poll', 'diagnostic', 'screenshot', 'save'])
    assert.deepEqual(report.stages, [])
    if (['snapshot', 'write failure'].includes(mode)) assert.deepEqual(report.failedInspection.diagnostic, diagnostic)
    else assert.match(report.failedInspection.readFailure, mode === 'overflow' ? /256 KiB/ : /read failed/)
    if (mode === 'write failure') assert.match(report.errors[0], /diagnostic write failed/)
  })
