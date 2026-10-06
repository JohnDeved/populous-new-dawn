import assert from 'node:assert/strict'
import { appendFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { acquirePreacher } from '../preacher-gesture-candidate/acquire.mjs'

export function requireCutoffCleanup(cleanup) {
  assert.ok(cleanup && !cleanup.error, cleanup?.error ?? 'No cleanup receipt')
  assert.deepEqual(cleanup.tail?.errors ?? [], [])
  if (cleanup.restoration) {
    assert.deepEqual(cleanup.restoration.errors, [])
    assert.equal(cleanup.restoration.restored, true)
  }
  if (cleanup.pointer) {
    assert.deepEqual(cleanup.pointer.errors, [])
    assert.equal(cleanup.pointer.restored, true)
  }
}
export default async function cutoffScenario(context) {
  const { page, output, signal, receipt } = context, started = performance.now()
  const failures = [], captures = [], events = []
  let acquisition, progress, cleanup, primaryFailure, status = 'acquiring'
  const save = () => writeFileSync(resolve(output, 'cutoff.json'), JSON.stringify({ status,
    source: receipt.source, startedAt: new Date(performance.timeOrigin + started).toISOString(),
    elapsedMs: performance.now() - started, progress, failures, events, captures,
    limits: 'One ordinary command17 cutoff. Model-state result independent of pixels; absent main render remains render-not-observed.' }, null, 2) + '\n')
  const check = () => {
    signal.throwIfAborted(); assert.deepEqual(receipt.errors, [])
    if (!progress?.entryTurn) assert.ok(performance.now() - started < 360000, '360-second acquisition/fresh-entry bound')
  }
  const retain = batch => {
    if (!batch) return
    for (const row of batch.rows) appendFileSync(resolve(output, 'phases.jsonl'), JSON.stringify(row) + '\n')
    events.push(...batch.events); progress = batch.progress
  }
  const drain = async () => {
    check(); const batch = await page.evaluate(() => window.preacherCutoff.drain())
    retain(batch); save(); assert.deepEqual(batch.errors, []); assert.notEqual(progress.status, 'failed', progress.reason)
    check()
  }
  const retainCaptures = batch => {
    for (const { base64, ...capture } of batch ?? []) {
      if (base64) {
        const bytes = Buffer.from(base64, 'base64'), name = `${capture.kind}-turn${capture.turn}-source${capture.source}.rgba`
        assert.equal(bytes.length, capture.pixels.byteLength)
        writeFileSync(resolve(output, name), bytes)
        capture.pixels = { ...capture.pixels, path: name, sha256: createHash('sha256').update(bytes).digest('hex') }
      }
      captures.push(capture)
    }
  }
  try {
    save(); acquisition = await acquirePreacher(context)
    const id = acquisition.preacherId
    await page.evaluate(async id => {
      const { installCutoffObservation } = await import('/qa/preacher-cutoff-passive/observe.mjs')
      return installCutoffObservation(id)
    }, id)
    const move = await acquisition.dispatch.clickOrder(acquisition.safe)
    assert.equal(move.inputAfter.units.find(u => u.id === id).order.model, 3)
    while (!progress?.entryTurn) { await drain(); if (!progress.entryTurn) await page.waitForTimeout(100) }
    acquisition.finishAcquisition(progress); status = 'observing'; save()
    const browserNow = await page.evaluate(() => performance.now())
    const deadline = performance.now() + 120000 - (browserNow - progress.startMs)
    while (progress.status !== 'passed') {
      check(); assert.ok(performance.now() < deadline, '120-second original observation bound')
      await drain()
      if (progress.status !== 'passed') await page.waitForTimeout(150)
    }
    status = 'model-state-passed'; save()
  } catch (error) {
    primaryFailure = error; failures.push(String(error?.stack ?? error)); status = 'failed'; save()
  } finally {
    try {
      cleanup = await page.evaluate(() => {
        const observer = window.preacherCutoff
        const result = { restoration: observer?.finish(), tail: observer?.drain(), captures: observer?.captures() }
        if (window.campaignEntityPointer) {
          result.pointer = window.campaignEntityPointer.finish(); delete window.campaignEntityPointer
        }
        return result
      })
      retain(cleanup.tail); retainCaptures(cleanup.captures); delete cleanup.captures
      writeFileSync(resolve(output, 'observer-cleanup.json'), JSON.stringify(cleanup, null, 2) + '\n')
      requireCutoffCleanup(cleanup)
      if (!primaryFailure) { assert.equal(progress?.status, 'passed'); assert.ok(cleanup.restoration) }
    } catch (error) {
      cleanup = { ...cleanup, error: String(error?.stack ?? error) }
      writeFileSync(resolve(output, 'observer-cleanup.json'), JSON.stringify(cleanup, null, 2) + '\n')
      failures.push(String(error?.stack ?? error)); status = 'failed'
      primaryFailure = primaryFailure ? new AggregateError([primaryFailure, error], 'Cutoff failed and cleanup failed') : error
    }
    save()
  }
  if (primaryFailure) throw primaryFailure
  return { status, progress, captures: captures.map(c => ({ kind: c.kind, turn: c.turn, source: c.source, outcome: c.outcome, pixels: c.pixels })),
    restored: cleanup.restoration, scope: 'Ordinary command17 cutoff/stop/next-entry state; visible-impact claims remain conditional on actual render crops.' }
}
