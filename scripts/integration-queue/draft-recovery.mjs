// Explicit owner-authorized convergence to draft. Never replays original intent,
// changes its history, calls a connector, or authorizes subsequent ready/merge.
import assert from 'node:assert/strict'
import { REPO, digest, GATES } from './policy.mjs'

export const DRAFT_CONNECTOR = 'github.convert_pull_request_to_draft'
const hash = value => /^[a-f0-9]{64}$/.test(value ?? '')
const equal = (a, b) => assert.equal(digest(a), digest(b))
const transition = event => ['converted_to_draft', 'ready_for_review'].includes(event.kind)

function validTimelineItem(event, observation) {
  if (event.kind === 'committed')
    return (
      event.at === null &&
      event.actorId === null &&
      /^[a-f0-9]{40}$/.test(event.commitSha ?? '') &&
      event.id === `commit:${event.commitSha}` &&
      event.ancestryHead === observation.tuple.head
    )
  return (
    typeof event.kind === 'string' &&
    Number.isFinite(event.at) &&
    event.at <= observation.observedAt
  )
}

export function validateRecoveryGrant(original, originalSha256, grant, now) {
  const record = original.records.at(-1)
  assert.equal(original.repo, REPO)
  assert.equal(original.version, 1)
  assert.equal(record.registrationDigest, digest(record.grant), 'Original registration corruption')
  assert.equal(original.journalPath, record.grant.journalPath)
  assert.equal(grant.version, 1)
  assert.equal(grant.repo, REPO)
  assert.equal(grant.authority, 'one-draft-convergence-only')
  assert.equal(grant.pr, original.pr)
  assert.equal(grant.owner, original.owner)
  assert.equal(grant.registrationDigest, record.registrationDigest)
  assert.equal(grant.originalJournalSha256, originalSha256)
  assert.equal(grant.originalIntentDigest, digest(record.pending))
  assert.equal(record.pending?.kind, 'draft', 'Only pending draft convergence is supported')
  assert.equal(record.spent.draft, true)
  assert.equal(record.spent.ready, false)
  equal(grant.tuple, record.grant.tuple)
  equal(grant.workflowHashes, record.grant.workflowHashes)
  assert(GATES.every(gate => hash(grant.workflowHashes?.[gate.workflow])))
  assert.equal(record.pending.head, grant.tuple.head)
  assert.equal(record.pending.base, grant.tuple.base)
  assert(Number.isSafeInteger(grant.actorId) && grant.actorId > 0)
  for (const key of [
    'denialReceiptSha256',
    'authorizationReceiptSha256',
    'terminationReceiptSha256',
  ])
    assert(hash(grant[key]), `Missing ${key}`)
  assert(Number.isFinite(grant.terminatedAt) && grant.terminatedAt >= record.pending.intendedAt)
  assert(Number.isFinite(grant.createdAt) && Number.isFinite(grant.expiresAt))
  assert(grant.terminatedAt <= grant.createdAt && grant.createdAt <= now && now < grant.expiresAt)
  assert(grant.expiresAt - grant.createdAt <= 600_000, 'Recovery grant exceeds ten minutes')
  assert.equal(grant.originalTransportOutcome, 'unknown')
  assert.equal(grant.readyAuthority, false)
  return record
}

function completeCollection(collection, key) {
  assert(collection && Array.isArray(collection.items) && Array.isArray(collection.pages))
  assert(collection.pages.length > 0 && collection.pages.length <= 10)
  let count = 0
  for (const [i, page] of collection.pages.entries()) {
    assert.equal(page.number, i + 1)
    assert(Number.isInteger(page.count) && page.count >= 0 && page.count <= 100)
    assert(hash(page.sha256))
    count += page.count
    if (i < collection.pages.length - 1) assert.equal(page.count, 100)
    else assert(page.count < 100, 'Pagination lacks a terminal short page')
  }
  assert.equal(count, collection.items.length)
  assert.equal(
    new Set(collection.items.map(item => item[key])).size,
    count,
    'Duplicate collection identities'
  )
  assert(collection.items.every(item => typeof item[key] === 'string' && item[key]))
}

function validateObservation(observation, grant, intendedAt, now) {
  assert.equal(observation.repo, REPO)
  assert.equal(observation.pr, grant.pr)
  equal(observation.tuple, grant.tuple)
  assert.equal(observation.complete, true)
  assert.equal(observation.consistent, true)
  assert.equal(observation.state, 'open')
  assert.equal(observation.mergeable, true)
  assert.equal(typeof observation.draft, 'boolean')
  assert(Number.isFinite(observation.startedAt) && Number.isFinite(observation.observedAt))
  assert(
    grant.terminatedAt <= observation.startedAt && observation.startedAt <= observation.observedAt
  )
  assert(observation.observedAt <= now && now - observation.observedAt <= 60_000)
  completeCollection(observation.timeline, 'id')
  completeCollection(observation.runs, 'id')
  for (const run of observation.runs.items) {
    assert.equal(run.head, grant.tuple.head)
    assert.equal(run.status, 'completed', 'Active attempt blocks recovery')
  }
  const events = observation.timeline.items
  assert(events.every(event => validTimelineItem(event, observation)))
  const after = events.filter(
    event => event.kind !== 'committed' && event.at >= Math.floor(intendedAt / 1000) * 1000
  )
  assert(
    after.every(event => event.actorId === grant.actorId),
    'Intervening or unknown actor blocks recovery'
  )
  const changes = after.filter(transition)
  if (observation.draft) {
    assert.equal(changes.length, 1, 'Observed draft needs exactly one attributable transition')
    assert.equal(changes[0].kind, 'converted_to_draft')
  } else assert.equal(changes.length, 0, 'Conflicting transition history blocks draft convergence')
  if (!observation.draft) {
    const admission = observation.admission
    assert.equal(admission?.complete, true)
    assert.equal(admission.consistent, true)
    equal(admission.tuple, grant.tuple)
    assert.equal(admission.draft, false)
    assert.equal(admission.activeAttempts, false)
    assert.equal(admission.otherValidation, 'clear')
    assert.equal(admission.full?.state, 'missing', 'Do not repeat already admitted or failed Full')
    assert(
      admission.observedAt <= observation.observedAt &&
        observation.observedAt - admission.observedAt <= 60_000
    )
  }
  return changes
}

export function prepareDraftRecovery(original, originalSha256, saved, grant, observations, now) {
  const record = validateRecoveryGrant(original, originalSha256, grant, now)
  assert.equal(observations.length, 2)
  const [a, b] = observations
  // The first observation may be older than the freshness bound at preparation,
  // but must itself have been fresh and end before the second begins.
  validateObservation(a, grant, record.pending.intendedAt, a.observedAt)
  const changes = validateObservation(b, grant, record.pending.intendedAt, now)
  assert(
    b.startedAt - a.observedAt >= 60_000,
    'Two separate observations need a sixty-second quiet interval'
  )
  equal(a.timeline, b.timeline)
  equal(a.runs, b.runs)
  assert.equal(a.draft, b.draft)
  const ledger = structuredClone(saved ?? { version: 1, repo: REPO, pr: grant.pr, records: [] })
  assert.equal(ledger.version, 1)
  assert.equal(ledger.repo, REPO)
  assert.equal(ledger.pr, grant.pr)
  assert(
    !ledger.records.some(item => item.originalIntentDigest === grant.originalIntentDigest),
    'Recovery allowance already consumed'
  )
  const recovery = {
    grant: structuredClone(grant),
    grantDigest: digest(grant),
    originalIntentDigest: grant.originalIntentDigest,
    originalTransportOutcome: 'unknown',
    readyAuthority: false,
    spent: !b.draft,
    phase: b.draft ? 'observed' : 'prepared',
    receipts: [
      {
        stage: 'prepared',
        at: now,
        observations: observations.map(digest),
        timeline: digest(b.timeline),
        runs: digest(b.runs),
      },
    ],
  }
  if (b.draft)
    recovery.receipts.push({
      stage: 'observed',
      at: now,
      basis: 'attributable-draft-state-and-history',
      eventId: changes[0].id,
      timeline: digest(b.timeline),
      runs: digest(b.runs),
      originalTransportOutcome: 'unknown',
      readyAuthority: false,
    })
  ledger.records.push(recovery)
  // Caller MUST durably persist ledger before exposing descriptor. A descriptor
  // is a new single authorized convergence operation, never proof of dispatch.
  const descriptor = b.draft
    ? null
    : {
        recoveryDigest: recovery.grantDigest,
        tool: DRAFT_CONNECTOR,
        arguments: { repository_full_name: REPO, pr_number: grant.pr },
        expectedTuple: structuredClone(grant.tuple),
        expiresAt: grant.expiresAt,
        originalTransportOutcome: 'unknown',
        readyAuthority: false,
      }
  return { ledger, descriptor }
}

export function dispatchDraftRecovery(saved, grantDigest, observation, original, now) {
  const ledger = structuredClone(saved),
    recovery = ledger.records.at(-1)
  assert.equal(recovery.grantDigest, grantDigest)
  assert.equal(recovery.phase, 'prepared')
  assert.equal(recovery.spent, true)
  assert(now < recovery.grant.expiresAt)
  const record = original.records.at(-1)
  assert.equal(digest(record.pending), recovery.originalIntentDigest)
  validateObservation(observation, recovery.grant, record.pending.intendedAt, now)
  assert.equal(
    observation.draft,
    false,
    'Already-draft state must be reconciled, not submitted again'
  )
  const prepared = recovery.receipts[0]
  assert.equal(digest(observation.timeline), prepared.timeline)
  assert.equal(digest(observation.runs), prepared.runs)
  recovery.phase = 'dispatch-intended'
  const descriptor = recoveryDescriptor(recovery)
  recovery.receipts.push({
    stage: 'dispatch-intended',
    at: now,
    observation: digest(observation),
    recoveryDigest: grantDigest,
    descriptorDigest: digest(descriptor),
    localInvocationId: descriptor.localInvocationId,
  })
  return ledger // Persist before the explicit connector boundary. Never repeat this transition.
}

export function recoveryDescriptor(recovery, ready = false) {
  const tool = ready ? READY_CONNECTOR : DRAFT_CONNECTOR
  return {
    tool,
    arguments: { repository_full_name: REPO, pr_number: recovery.grant.pr },
    recoveryDigest: recovery.grantDigest,
    localInvocationId: digest({ recovery: recovery.grantDigest, tool }),
    expiresAt: ready ? recovery.normalReady.authorization.expiresAt : recovery.grant.expiresAt,
  }
}

function checkedReceipt(recovery, receipt, now, ready = false) {
  const descriptor = recoveryDescriptor(recovery, ready)
  assert.equal(receipt.descriptorDigest, digest(descriptor))
  assert.equal(receipt.localInvocationId, descriptor.localInvocationId)
  assert(receipt.toolCallId === null || typeof receipt.toolCallId === 'string')
  assert(hash(receipt.rawReceiptSha256))
  const intent = ready
    ? recovery.normalReady.receipts[0]
    : recovery.receipts.find(item => item.stage === 'dispatch-intended')
  assert(Number.isFinite(receipt.startedAt) && Number.isFinite(receipt.finishedAt))
  assert(
    intent.at <= receipt.startedAt &&
      receipt.startedAt <= receipt.finishedAt &&
      receipt.finishedAt <= now
  )
  assert(
    receipt.startedAt < descriptor.expiresAt,
    'Connector invocation started after authorization expiry'
  )
  return {
    tool: receipt.tool,
    arguments: structuredClone(receipt.arguments),
    recoveryDigest: receipt.recoveryDigest,
    localInvocationId: receipt.localInvocationId,
    descriptorDigest: receipt.descriptorDigest,
    toolCallId: receipt.toolCallId,
    rawReceiptSha256: receipt.rawReceiptSha256,
    startedAt: receipt.startedAt,
    finishedAt: receipt.finishedAt,
    outcome: receipt.outcome,
  }
}

export function recordDraftRecoveryReceipt(saved, grantDigest, receipt, now) {
  const ledger = structuredClone(saved),
    recovery = ledger.records.at(-1)
  assert.equal(recovery.grantDigest, grantDigest)
  assert.equal(recovery.phase, 'dispatch-intended')
  assert.equal(receipt.tool, DRAFT_CONNECTOR)
  equal(receipt.arguments, { repository_full_name: REPO, pr_number: ledger.pr })
  assert.equal(receipt.recoveryDigest, grantDigest)
  const recorded = checkedReceipt(recovery, receipt, now)
  assert(['returned', 'denied', 'unknown'].includes(receipt.outcome))
  recovery.phase = 'awaiting-observation'
  recovery.receipts.push({ ...recorded, stage: 'connector-receipt', at: now })
  return ledger // Returned transport output is not accepted as proof of remote state.
}

export function observeDraftRecovery(saved, grantDigest, observation, original, now) {
  const ledger = structuredClone(saved),
    recovery = ledger.records.at(-1)
  assert.equal(recovery.grantDigest, grantDigest)
  assert(['prepared', 'dispatch-intended', 'awaiting-observation'].includes(recovery.phase))
  const record = original.records.at(-1)
  assert.equal(digest(record.pending), recovery.originalIntentDigest)
  const changes = validateObservation(observation, recovery.grant, record.pending.intendedAt, now)
  assert.equal(observation.draft, true, 'Desired draft convergence not observed; no replay')
  recovery.phase = 'observed'
  recovery.receipts.push({
    stage: 'observed',
    at: now,
    observation: digest(observation),
    eventId: changes[0].id,
    basis: 'attributable-draft-state-and-history',
    timeline: digest(observation.timeline),
    runs: digest(observation.runs),
    originalTransportOutcome: 'unknown',
    readyAuthority: false,
  })
  return ledger
}

// This consumes the original never-spent ready allowance, not a new recovery
// ready allowance. The owner must separately acknowledge delayed-draft liveness
// risk. No recovery action ever clears the original UNKNOWN transport outcome.
export function prepareOriginalReady(saved, authorization, observation, original, now) {
  const ledger = structuredClone(saved),
    recovery = ledger.records.at(-1),
    record = original.records.at(-1)
  assert.equal(recovery.phase, 'observed')
  assert.equal(record.spent.ready, false)
  assert(!recovery.normalReady, 'Original ready allowance already consumed')
  assert.equal(authorization.authority, 'original-ready-once-after-draft-convergence')
  assert.equal(authorization.owner, original.owner)
  assert.equal(authorization.registrationDigest, record.registrationDigest)
  assert.equal(authorization.recoveryDigest, recovery.grantDigest)
  assert.equal(authorization.recoveryEvidenceDigest, digest(recovery.receipts))
  assert.equal(authorization.acceptDelayedDraftLivenessRisk, true)
  assert.equal(authorization.onUnexpectedRedraft, 'permanent-stop-no-retry')
  assert(Number.isFinite(authorization.createdAt) && Number.isFinite(authorization.expiresAt))
  assert(
    authorization.createdAt <= now &&
      now < authorization.expiresAt &&
      authorization.expiresAt - authorization.createdAt <= 600_000
  )
  equal(authorization.tuple, recovery.grant.tuple)
  validateObservation(observation, recovery.grant, record.pending.intendedAt, now)
  assert.equal(observation.draft, true)
  const admission = observation.admission
  assert.equal(admission?.complete, true)
  assert.equal(admission.consistent, true)
  equal(admission.tuple, recovery.grant.tuple)
  assert.equal(admission.draft, true)
  assert.equal(admission.activeAttempts, false)
  assert.equal(admission.otherValidation, 'clear')
  assert.equal(admission.full?.state, 'missing')
  assert(admission.observedAt <= now && now - admission.observedAt <= 60_000)
  assert.equal(
    digest(observation.timeline),
    recovery.receipts.at(-1).timeline,
    'Timeline changed during normal-ready quiet interval'
  )
  assert.equal(
    digest(observation.runs),
    recovery.receipts.at(-1).runs,
    'Runs changed during normal-ready quiet interval'
  )
  assert(
    observation.startedAt - recovery.receipts.at(-1).at >= 60_000,
    'Normal ready still requires a quiet interval after observed draft'
  )
  recovery.normalReady = {
    budgetSource: `${record.registrationDigest}:ready`,
    spent: true,
    authorization: structuredClone(authorization),
    phase: 'dispatch-intended',
    receipts: [{ stage: 'dispatch-intended', at: now, observation: digest(observation) }],
  }
  const descriptor = recoveryDescriptor(recovery, true)
  Object.assign(recovery.normalReady.receipts[0], {
    descriptorDigest: digest(descriptor),
    localInvocationId: descriptor.localInvocationId,
  })
  return ledger // Durable write required before exposing one mark-ready connector call.
}

export const READY_CONNECTOR = 'github.mark_pull_request_ready_for_review'
export function recordOriginalReadyReceipt(saved, receipt, now) {
  const ledger = structuredClone(saved),
    recovery = ledger.records.at(-1),
    ready = recovery.normalReady
  assert.notEqual(recovery.phase, 'stopped')
  assert.equal(ready?.phase, 'dispatch-intended')
  assert.equal(receipt.tool, READY_CONNECTOR)
  assert.equal(receipt.recoveryDigest, recovery.grantDigest)
  equal(receipt.arguments, { repository_full_name: REPO, pr_number: ledger.pr })
  const recorded = checkedReceipt(recovery, receipt, now, true)
  assert(['returned', 'denied', 'unknown'].includes(receipt.outcome))
  ready.receipts.push({ ...recorded, stage: 'connector-receipt', at: now })
  ready.phase = receipt.outcome === 'returned' ? 'awaiting-observation' : 'stopped'
  return ledger // Uncertain or denied ready is never replayable.
}

export function observeOriginalReady(saved, observation, original, now) {
  const ledger = structuredClone(saved),
    recovery = ledger.records.at(-1),
    ready = recovery.normalReady
  assert.notEqual(recovery.phase, 'stopped')
  assert(['awaiting-observation', 'awaiting-validation'].includes(ready?.phase))
  // Validate all common state/provenance requirements with the allowed expected
  // draft->ready history removed only after verifying it exactly below.
  const events = observation.timeline.items.filter(
    event =>
      event.kind !== 'committed' &&
      event.at >= Math.floor(original.records.at(-1).pending.intendedAt / 1000) * 1000
  )
  const changes = events.filter(transition)
  assert.deepEqual(
    changes.map(event => event.kind),
    ['converted_to_draft', 'ready_for_review']
  )
  assert(changes.every(event => event.actorId === recovery.grant.actorId))
  assert(changes[1].at >= Math.floor(ready.receipts[0].at / 1000) * 1000)
  assert.equal(observation.draft, false, 'Unexpected redraft permanently stops; no second ready')
  equal(observation.tuple, recovery.grant.tuple)
  assert.equal(observation.repo, REPO)
  assert.equal(observation.pr, original.pr)
  assert.equal(observation.complete, true)
  assert.equal(observation.consistent, true)
  assert.equal(observation.state, 'open')
  assert.equal(observation.mergeable, true)
  assert(observation.observedAt <= now && now - observation.observedAt <= 60_000)
  completeCollection(observation.timeline, 'id')
  completeCollection(observation.runs, 'id')
  assert(observation.timeline.items.every(event => validTimelineItem(event, observation)))
  assert(
    events.every(event => event.actorId === recovery.grant.actorId),
    'Intervening actor blocks continuation'
  )
  ready.phase = 'awaiting-validation'
  ready.receipts.push({
    stage: 'observed',
    at: now,
    observation: digest(observation),
    eventId: changes[1].id,
  })
  return ledger // NOT complete/merge-authorized. Fresh source-bound Full+Tutorial and server state still required.
}

export function validateOriginalReadyCompletion(saved, observation, original, validation, now) {
  const ledger = observeOriginalReady(saved, observation, original, now),
    recovery = ledger.records.at(-1)
  assert.equal(validation.complete, true)
  assert.equal(validation.consistent, true)
  equal(validation.tuple, recovery.grant.tuple)
  assert.equal(validation.draft, false)
  assert.equal(validation.activeAttempts, false)
  assert.equal(validation.otherValidation, 'clear')
  assert.equal(validation.full?.state, 'passed')
  assert.equal(validation.full.required, true)
  assert.equal(validation.full.sourceBound, true)
  equal(validation.full.tuple, recovery.grant.tuple)
  assert(validation.full.runId && validation.full.attempt && validation.full.checkId)
  assert(validation.observedAt <= now && now - validation.observedAt <= 60_000)
  recovery.normalReady.phase = 'validated'
  recovery.normalReady.receipts.push({
    stage: 'validated',
    at: now,
    validation: structuredClone(validation),
    originalTransportOutcome: 'unknown',
    mergeAuthority: false,
  })
  return ledger // Current CI evidence only, never merge authority or a future freshness waiver.
}
