// Node-only carry-admission contract. The simulated future receipt is not a
// browser observation or a grant to reuse a profile; it never writes game state.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  readTempleContinuation,
  templeContinuationPrevious,
} from './temple-manual-continuation.mjs'

test('continuation admits only the exact failed03 lease and original committed Save2695', () => {
  const root = process.cwd()
  const prior = JSON.parse(
    readFileSync(resolve(root, templeContinuationPrevious.output, 'receipt.json'))
  )
  const manifest = JSON.parse(readFileSync(resolve(prior.profile.path, 'populous-profile.json')))
  assert.equal(manifest.lastRun.runId, prior.profile.runId)
  assert.equal(manifest.lastRun.receiptSha256, templeContinuationPrevious.receiptSha256)
  assert.deepEqual(manifest.lastRun.checkpointAtEnd, prior.profile.checkpointAtEnd)
  const simulated = {
    profile: {
      mode: 'reused',
      id: manifest.id,
      origin: manifest.binding.origin,
      previousRun: manifest.lastRun,
      inputs: { application: manifest.binding.application },
      correspondence: { decision: 'ACCEPT' },
      checkpointAtStart: manifest.lastRun.checkpointAtEnd,
    },
  }
  const carried = readTempleContinuation(root, simulated)
  assert.equal(carried.prefix.status, 'passed')
  assert.equal(carried.prefix.checkpoint.digest.checkpoint.turn, 2695)
  assert.equal(carried.prefix.terminal.stats.trained, 0)
  for (const mutate of [
    p => (p.id = 'different-profile'),
    p => (p.origin = 'http://127.0.0.1:1'),
    p => (p.inputs.application = 'changed-application'),
    p => (p.previousRun.checker = 'changed-checker'),
    p => (p.previousRun.runId = 'different-run'),
    p => (p.correspondence.decision = 'PENDING'),
    p => p.checkpointAtStart.turn++,
    p => (p.checkpointAtStart.checkpointSha256 = 'wrong-digest'),
  ]) {
    const changed = structuredClone(simulated)
    mutate(changed.profile)
    assert.throws(() => readTempleContinuation(root, changed))
  }
})
