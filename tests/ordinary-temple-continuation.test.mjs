import assert from 'node:assert/strict'
import test from 'node:test'
import { requireTempleContinuation } from '../scripts/local-render/ordinary-temple-continuation.mjs'

const fixture = () => {
  const checkpoint = { version: 1, level: 3, turn: 2877, checkpointSha256: '7'.repeat(64) },
    source = {
      commit: '1'.repeat(40),
      fingerprint: '2'.repeat(64),
      trackedDiffSha256: '3'.repeat(64),
    },
    input = {
      receiptSha256: '4'.repeat(64),
      prefixSha256: '5'.repeat(64),
      productSource: source.commit,
    },
    receipt = {
      status: 'failed',
      errors: [],
      source,
      runtime: { harness: 'unchanged' },
      profile: {
        id: 'owned-profile',
        runId: 'prior-run',
        origin: 'http://127.0.0.1:4414',
        inputs: { application: 'application', checker: 'prior-checker' },
        cleanupVerified: true,
        continuationVerified: true,
        checkpointAtEnd: checkpoint,
      },
    },
    prefix = {
      status: 'passed',
      cleanupErrors: [],
      plan: { id: 1021 },
      checkpoint: { digest: { checkpoint } },
    },
    epoch = {
      label: 'm3-construction',
      ids: [1021],
      construction: true,
      evidence: { errors: [], closed: true, frames: [] },
    },
    report = {
      status: 'failed',
      failure: 'native-mesh-true-false-native-model-light mismatch',
      cleanupErrors: [],
      responseErrors: [],
      prefix: { id: 1021, saved: checkpoint, sha256: input.prefixSha256 },
      epochs: [epoch],
      transitions: [],
    },
    current = {
      source,
      runtime: receipt.runtime,
      profile: {
        mode: 'reused',
        id: 'owned-profile',
        origin: receipt.profile.origin,
        inputs: { application: 'application', checker: 'new-checker' },
        correspondence: { decision: 'ACCEPT' },
        previousRun: {
          runId: 'prior-run',
          sourceFingerprint: source.fingerprint,
          checker: 'prior-checker',
          receiptSha256: input.receiptSha256,
        },
        checkpointAtStart: checkpoint,
      },
    }
  return structuredClone({ prior: { receipt, prefix, report }, current, input })
}

test('continuation admits only exact clean owned predecessor and genuine unchanged saved construction', () => {
  const f = fixture()
  assert.deepEqual(requireTempleContinuation(f.prior, f.current, f.input), f.prior.report.epochs[0])
  assert.equal(f.prior.receipt.status, 'failed', 'Admission never rewrites prior failure')
})

test('changed source/runtime, unknown cleanup, unreviewed checker, changed Save or unearned construction fail closed', () => {
  for (const change of [
    f => {
      f.prior.receipt.profile.cleanupVerified = false
    },
    f => {
      f.prior.receipt.profile.continuationVerified = false
    },
    f => {
      f.prior.receipt.status = 'passed'
    },
    f => {
      f.prior.report.failure = 'some unrelated failure'
    },
    f => {
      f.current.source = { ...f.current.source, commit: '9'.repeat(40) }
    },
    f => {
      f.current.runtime = { harness: 'changed' }
    },
    f => {
      f.current.profile.id = 'other-profile'
    },
    f => {
      f.current.profile.origin = 'http://127.0.0.1:9999'
    },
    f => {
      f.current.profile.inputs.application = 'changed'
    },
    f => {
      f.current.profile.correspondence.decision = 'REJECT'
    },
    f => {
      f.current.profile.previousRun.receiptSha256 = '0'.repeat(64)
    },
    f => {
      f.current.profile.previousRun.checker = 'not-the-prior-checker'
    },
    f => {
      f.current.profile.checkpointAtStart = { checkpointSha256: 'changed' }
    },
    f => {
      f.prior.prefix.status = 'failed'
    },
    f => {
      f.prior.prefix.plan.id = 9
    },
    f => {
      f.prior.report.epochs[0].evidence.errors.push('lost callback')
    },
    f => {
      f.prior.report.transitions.push({ kind: 'load' })
    },
  ]) {
    const f = fixture()
    change(f)
    assert.throws(() => requireTempleContinuation(f.prior, f.current, f.input))
  }
})
