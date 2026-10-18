// Candidate-only functional admission. Never creates a comparative report or
// invokes the write-capable reporter. Browser timing values are raw diagnostics.
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import capture from './snapshot-capture.mjs'
import { createSnapshotFixture, validateSnapshotFixture } from './snapshot-setup.mjs'
import { plan, shards } from './snapshot-protocol.mjs'

export default async function snapshotSmoke({ browser, url, output, source, expectedRevision,
  createFixture = createSnapshotFixture, captureScenario = capture }) {
  const receipt = { version: 1, role: 'candidate-functional-smoke-not-trusted-comparison',
    sourceCommit: source.commit, expectedRevision, status: 'incomplete', sessions: [],
    comparativeClassification: 'not-run', limits: [
      'One candidate source only; no paired baseline or performance signal.',
      'Two sequential fresh contexts, not independent comparative browser sessions.',
      'Raw CPU values are retained for attribution validation only, not speed claims.',
    ] }
  const save = () => writeFileSync(resolve(output, 'candidate-snapshot-smoke.json'), JSON.stringify(receipt, null, 2) + '\n')
  save()
  try {
    const fixture = await createFixture({ source })
    fixture.receipt = { ...fixture.receipt, executionRole: receipt.role,
      setup: 'TEST SETUP: candidate production-controller authored turn-70 snapshot; functional smoke only, not trusted comparative evidence or a browser-recorded save' }
    const { transferText, expectedText } = validateSnapshotFixture(fixture)
    for (const [name, text] of [['snapshot-transfer.json', transferText], ['snapshot-expected.json', expectedText],
      ['snapshot-source.json', JSON.stringify(fixture.receipt, null, 2)]])
      writeFileSync(resolve(output, name), text, { flag: 'wx' })
    receipt.snapshotSha256 = fixture.receipt.snapshotSha256; save()
    for (const shard of Object.keys(shards)) {
      const folder = `snapshot-${shard}`, directory = resolve(output, folder); mkdirSync(directory)
      const session = { shard, status: 'incomplete', recording: `${folder}/snapshot-frames.json`, errors: [] }
      receipt.sessions.push(session); save()
      let context
      try {
        context = await browser.newContext({ viewport: plan.viewport, deviceScaleFactor: plan.deviceScaleFactor })
        const page = await context.newPage(); page.setDefaultTimeout(15000)
        const error = value => { if (session.errors.length < 20) session.errors.push(String(value).slice(0, 2000)) }
        page.on('pageerror', error); page.on('crash', () => error('Page crashed'))
        page.on('console', message => { if (message.type() === 'error') error(message.text()) })
        const result = await captureScenario({ page, url, output: directory, fixture, expectedRevision, shard })
        assert.equal(result.status, 'passed'); assert.deepEqual(result.phases.map(p => p.name), shards[shard])
        assert.ok(result.phases.every(p => p.status === 'passed')); assert.deepEqual(session.errors, [])
        session.phases = result.phases.map(p => p.name); session.status = 'passed'
      } catch (error) { session.failure = String(error).slice(0, 2000) }
      finally { try { await context?.close() } catch (error) { session.cleanupFailure = String(error); session.status = 'incomplete' }; save() }
    }
    assert.ok(receipt.sessions.every(s => s.status === 'passed'), 'Candidate snapshot functional smoke incomplete; inspect raw evidence')
    receipt.status = 'passed'; return receipt
  } catch (error) { receipt.failure = String(error); throw error }
  finally { save() }
}
