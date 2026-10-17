import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ordinaryTempleScenes from './ordinary-temple-scenes.mjs'

const sha = bytes => createHash('sha256').update(bytes).digest('hex')

export function requireTempleContinuation(prior, current, input) {
  const { receipt, report, prefix } = prior
  assert.equal(receipt.status, 'failed')
  assert.equal(report.status, 'failed')
  assert.match(report.failure, /native-mesh-true-false-native-model-light/)
  assert.deepEqual(receipt.errors, [])
  assert.deepEqual(report.cleanupErrors, [])
  assert.deepEqual(report.responseErrors, [])
  assert.equal(receipt.profile.cleanupVerified, true)
  assert.equal(receipt.profile.continuationVerified, true)
  assert.equal(prefix.status, 'passed')
  assert.deepEqual(prefix.cleanupErrors, [])
  assert.equal(current.profile.mode, 'reused')
  assert.equal(current.profile.id, receipt.profile.id)
  assert.equal(current.profile.origin, receipt.profile.origin)
  assert.equal(current.profile.inputs.application, receipt.profile.inputs.application)
  assert.equal(current.profile.correspondence?.decision, 'ACCEPT')
  assert.equal(current.source.commit, receipt.source.commit)
  assert.equal(current.source.commit, input.productSource)
  assert.equal(current.source.trackedDiffSha256, receipt.source.trackedDiffSha256)
  assert.deepEqual(current.runtime, receipt.runtime)
  for (const [field, value] of Object.entries({
    runId: receipt.profile.runId,
    sourceFingerprint: receipt.source.fingerprint,
    checker: receipt.profile.inputs.checker,
    receiptSha256: input.receiptSha256,
  }))
    assert.equal(current.profile.previousRun[field], value)
  assert.deepEqual(current.profile.checkpointAtStart, receipt.profile.checkpointAtEnd)
  assert.deepEqual(current.profile.checkpointAtStart, prefix.checkpoint.digest.checkpoint)
  assert.deepEqual(report.prefix.saved, prefix.checkpoint.digest.checkpoint)
  assert.equal(prefix.plan.id, report.prefix.id)
  assert.equal(report.prefix.sha256, input.prefixSha256)
  assert.equal(report.epochs.length, 1)
  const epoch = report.epochs[0]
  assert.equal(epoch.label, 'm3-construction')
  assert.deepEqual(epoch.ids, [prefix.plan.id])
  assert.equal(epoch.construction, true)
  assert.deepEqual(epoch.evidence.errors, [])
  assert.equal(epoch.evidence.closed, true)
  assert.equal(report.transitions.length, 0)
  return epoch
}

export function readTempleContinuation(root, current, input) {
  assert.match(input.output, /^work\/orchestration\/[a-z0-9-]+$/)
  for (const field of ['receiptSha256', 'reportSha256', 'prefixSha256'])
    assert.match(input[field], /^[a-f0-9]{64}$/)
  const read = (name, expected) => {
    const bytes = readFileSync(resolve(root, input.output, name))
    assert.equal(sha(bytes), expected, `Prior ${name} bytes changed`)
    return JSON.parse(bytes)
  }
  const prior = {
    receipt: read('receipt.json', input.receiptSha256),
    report: read('ordinary-temple-scenes.json', input.reportSha256),
    prefix: read('mission3-temple-checkpoint.json', input.prefixSha256),
  }
  const epoch = requireTempleContinuation(prior, current, input)
  for (const frame of epoch.evidence.frames) {
    assert.match(frame.png.file, /^[a-z0-9-]+\.png$/)
    assert.equal(sha(readFileSync(resolve(root, input.output, frame.png.file))), frame.png.sha256)
  }
  return {
    prefix: prior.prefix,
    prefixPath: `${input.output}/mission3-temple-checkpoint.json`,
    prefixSha256: input.prefixSha256,
    epoch,
    carried: {
      input,
      epoch,
      priorSource: prior.receipt.source,
      status: 'revalidated-retained-pixels',
      limits:
        'Prior episode remains failed. Corrected source-bound validation of retained ordinary construction pixels only; lifecycle below is newly executed. Incidental off-camera tribes are not unobstructed visual evidence.',
    },
  }
}

export default async function ordinaryTempleContinuation(context) {
  assert.equal(process.env.POPULOUS_TEMPLE_ROUTE, 'construction')
  const path = process.env.POPULOUS_TEMPLE_CONTINUATION
  assert.match(path ?? '', /^work\/orchestration\/[a-z0-9-]+\.json$/)
  const input = JSON.parse(readFileSync(resolve(context.root, path)))
  return ordinaryTempleScenes(context, readTempleContinuation(context.root, context.receipt, input))
}
