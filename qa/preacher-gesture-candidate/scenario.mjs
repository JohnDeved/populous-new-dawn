import assert from 'node:assert/strict'
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { acquirePreacher } from './acquire.mjs'
import { pauseNaturalGesture } from './pause-input.mjs'
import { compareBodyPixels } from './pixels.mjs'
import { requireSavedGesture, requireSameGestureCheckpoint } from './checkpoint.mjs'
import { installReplacementObservation, replacementIdentity } from './load-boundary.mjs'
import { installNativeGuardObserver } from '../preacher-gesture-baseline/inherited/observer.mjs'
import { acceptedInputBoundary } from '../preacher-gesture-baseline/inherited/input-boundary.mjs'
import { bindGame } from '../../scripts/browser-game.mjs'
import { waitForCheckpointReadback } from '../../scripts/checkpoint-readback.mjs'
import { checkpointObservation } from '../../scripts/local-render/checkpoint-observer.mjs'

const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const phase = p => [p.object, p.draw, p.f1, p.f2, p.counter, p.timer, p.stamp]
export default async function preacherCandidate(context) {
  const { page, output, signal, receipt } = context
  const started = performance.now(), stages = [], failures = [], captures = [], events = []
  let acquisition, progress, saved, loaded, supersession, activeStage, originalRestored, loadedRestored
  const save = status => writeFileSync(resolve(output, 'candidate.json'), JSON.stringify({ status,
    source: receipt.source, started, elapsedMs: performance.now() - started, stages, activeStage,
    failures, progress, captures, events, saved, loaded, supersession, originalRestored, loadedRestored }, null, 2) + '\n')
  const begin = (name, capMs) => { activeStage = { name, startedAt: new Date().toISOString(), started: performance.now(), capMs }; save('running') }
  const check = () => {
    signal.throwIfAborted(); assert.deepEqual(receipt.errors, [])
    if (activeStage) assert.ok(performance.now() - activeStage.started < activeStage.capMs, activeStage.name + ' ceiling')
  }
  const end = details => { check(); stages.push({ ...activeStage, elapsedMs: performance.now() - activeStage.started,
    finishedAt: new Date().toISOString(), outcome: 'passed', ...details }); activeStage = null; save('running') }
  const drain = async epoch => {
    const batch = await page.evaluate(epoch => epoch === 'original' ? window.preacherCandidate.drain() : window.preacherLoaded.drain(), epoch)
    for (const row of batch.rows) appendFileSync(resolve(output, `${epoch}-phases.jsonl`), JSON.stringify(row) + '\n')
    assert.deepEqual(batch.errors, [])
    if (epoch === 'original') { progress = batch.progress; events.push(...batch.events); assert.notEqual(progress.status, 'failed', progress.reason) }
    save('running'); return batch.rows
  }
  const capture = async (id, trace) => {
    const result = await page.evaluate(async id => {
      const { capturePausedGesture } = await import('/qa/preacher-gesture-candidate/pixels.mjs')
      return capturePausedGesture(id)
    }, id)
    const before = Buffer.from(result.rgba.before, 'base64'), hidden = Buffer.from(result.rgba.hidden, 'base64')
    assert.equal(compareBodyPixels(before, hidden, result.rgba.width), result.changedPixels)
    assert.ok(result.changedPixels > 0); assert.equal(result.restored, true)
    const name = `source${result.render.source}-turn${result.render.turn}`
    for (const [label, bytes] of [['body', before], ['hidden-body', hidden]])
      writeFileSync(resolve(output, `${name}-${label}.rgba`), bytes)
    result.rgba = { ...result.rgba, before: { path: `${name}-body.rgba`, sha256: sha(before), bytes: before.length },
      hidden: { path: `${name}-hidden-body.rgba`, sha256: sha(hidden), bytes: hidden.length } }
    result.screenshots = []
    for (const [label, clip] of [['full', null], ['actor', result.render.crop]]) {
      const path = resolve(output, `${name}-${label}.png`)
      await page.screenshot({ path, ...(clip ? { clip } : {}), timeout: 5000 })
      const row = await acquisition.read(), p = row.units.find(u => u.id === id).native
      assert.equal(row.paused, true); assert.equal(row.turn, result.render.turn)
      assert.deepEqual(phase(p), result.frozen.slice(1, 8))
      result.screenshots.push({ path: `${name}-${label}.png`, sha256: sha(readFileSync(path)), turn: row.turn, phase: phase(p) })
    }
    captures.push({ trace, ...result }); save('running')
  }
  try {
    begin('ordinary-acquisition-to-fresh-entry', 360000)
    acquisition = await acquirePreacher(context)
    const id = acquisition.preacherId
    await page.evaluate(async id => {
      const { installCandidateObservation } = await import('/qa/preacher-gesture-candidate/observe.mjs')
      return installCandidateObservation(id)
    }, id)
    const move = await acquisition.dispatch.clickOrder(acquisition.safe)
    assert.equal(move.inputAfter.units.find(u => u.id === id).order.model, 3)
    while (!progress?.entryTurn) { check(); await drain('original'); if (!progress.entryTurn) await page.waitForTimeout(100) }
    acquisition.finishAcquisition(progress); end({ turn: progress.entryTurn, id, move })
    const browserNow = await page.evaluate(() => performance.now())
    begin('original-world-900-visits-and-both-gesture-families', 120000 - (browserNow - progress.startMs))
    const witnessDeadline = activeStage.started + activeStage.capMs
    for (let captured = 0; captured < 2; captured++) {
      check()
      await page.evaluate(() => window.preacherCandidate.tracker.permitOrdinaryPause(true))
      const remainingSources = [176, 184].filter(source => !captures.some(c => c.render.source === source))
      const trace = await pauseNaturalGesture({ page, id, sources: remainingSources,
        remainingMs: () => witnessDeadline - performance.now() })
      await drain('original'); await capture(id, trace); check()
      if (!saved) {
        const saveStarted = performance.now()
        const beforeSave = await page.evaluate(async id => {
          const { gestureProjection } = await import('/qa/preacher-gesture-candidate/checkpoint.mjs')
          return gestureProjection({ version: 1, world: window.testStore.getWorld() }, id)
        }, id)
        requireSavedGesture(beforeSave)
        await page.getByRole('button', { name: 'Game settings', exact: true }).click()
        await page.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
        let committed
        assert.equal(await waitForCheckpointReadback(async () => {
          check(); assert.ok(performance.now() - saveStarted < 15000, 'Active-gesture Save/readback ceiling')
          committed = await page.evaluate(async id => {
            const { readStoredGesture } = await import('/qa/preacher-gesture-candidate/checkpoint.mjs')
            return readStoredGesture(id)
          }, id)
          if (!committed || committed.gesture.turn !== beforeSave.turn) return false
          requireSameGestureCheckpoint(beforeSave, committed.gesture); return true
        }), true)
        saved = { ...committed, beforeSave, savedAt: new Date().toISOString(), elapsedMs: performance.now() - saveStarted }
        await page.getByRole('button', { name: /^Continue Game/ }).click()
      } else await page.getByRole('button', { name: 'Resume game', exact: true }).click()
      assert.equal((await acquisition.read()).paused, false)
      await page.evaluate(() => window.preacherCandidate.tracker.permitOrdinaryPause(false))
      check()
    }
    while (progress.status !== 'passed') { check(); await drain('original'); if (progress.status !== 'passed') await page.waitForTimeout(150) }
    originalRestored = await page.evaluate(() => window.preacherCandidate.finish())
    assert.deepEqual(originalRestored, { errors: [], restored: true })
    assert.ok(saved); assert.equal(captures.length, 2)
    end({ originalProgress: progress, savedTurn: saved.gesture.turn, note: 'No Load or world rollback occurred in this window; all Pause/Save wall time is included.' })

    begin('fresh-page-committed-Load-and-auto-resumed-epoch', 90000)
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.getByRole('dialog', { name: 'Start game', exact: true }).waitFor({ timeout: 30000 })
    await page.evaluate(installReplacementObservation)
    await page.getByRole('button', { name: 'Load Game', exact: true }).click()
    const boundary = await page.evaluate(async id => {
      const { readLoadGesture } = await import('/qa/preacher-gesture-candidate/checkpoint.mjs')
      return readLoadGesture(id)
    }, id)
    requireSameGestureCheckpoint(saved.gesture, boundary.gesture)
    for (const key of ['level', 'turn', 'time', 'actorsSha256', 'terrainSha256', 'stockSha256'])
      assert.deepEqual(boundary.digest[key], saved.digest[key], `Exact Load boundary ${key}`)
    await bindGame(page)
    const identity = await page.evaluate(replacementIdentity)
    assert.ok(identity.sameStore && identity.newWorld && identity.newScene && identity.currentCorrespondence)
    assert.equal(identity.error, null)
    await page.evaluate(installNativeGuardObserver)
    await page.evaluate(async id => {
      window.nativeGuardProbes = await import('/qa/preacher-gesture-baseline/inherited/browser-probes.mjs')
      const { installLoadedObservation } = await import('/qa/preacher-gesture-candidate/observe.mjs')
      installLoadedObservation(id)
    }, id)
    const firstBound = await acquisition.read(); assert.equal(firstBound.paused, false)
    await page.waitForFunction(turn => window.testStore.getWorld().turn > turn, saved.gesture.turn, { polling: 'raf', timeout: 10000 })
    const resumed = await acquisition.read(), storedAfter = await page.evaluate(checkpointObservation)
    assert.deepEqual(storedAfter, saved.digest)
    loaded = { boundary, identity, firstBound, resumed, storedAfter,
      note: 'Synchronous replacement clone retains the exact active saved phase/RNG before ordinary Load auto-resumes. firstBound/resumed are later observations; unobserved intervening visits are not reconstructed.' }
    await drain('loaded'); end({ boundaryTurn: boundary.gesture.turn, firstBoundTurn: firstBound.turn, resumedTurn: resumed.turn })

    begin('loaded-epoch-active-gesture-movement-supersession', 40000)
    await acquisition.select('preacher'); assert.deepEqual((await acquisition.read()).selected, [id])
    const trace = await pauseNaturalGesture({ page, id, sources: [176, 184], maxFrame: 2, remainingMs: () =>
      Math.min(20000, activeStage.started + activeStage.capMs - performance.now()) })
    const hit = await acquisition.ground({ x: 41, z: 90 }); assert.ok(hit, 'Declared supersession target is not legal visible ground')
    const before = await acquisition.read(); assert.equal(before.paused, true)
    await page.getByRole('button', { name: 'Resume game', exact: true }).focus()
    await page.evaluate(() => {
      const original = window.nativeGuardReadInput
      window.restorePreacherInput = () => { window.nativeGuardReadInput = original }
      window.nativeGuardReadInput = () => {
        const value = original(), w = window.testStore.getWorld()
        return { ...value, gestureOwners: value.units.map(u => {
          const p = w.units.find(p => p.id === u.id)?.native
          return { id: u.id, object: p?.object, draw: p?.draw, f1: p?.f1, f2: p?.f2, statusFlags: p?.statusFlags }
        }) }
      }
    })
    await page.evaluate(hit => {
      const s = window.testSceneRef.current, { observeEntityPointer } = window.nativeGuardProbes
      window.campaignEntityPointer = observeEntityPointer(s, document, null, window.nativeGuardReadInput)
    }, hit)
    await page.keyboard.press('Enter')
    await page.mouse.click(hit.x, hit.y)
    const delivery = await page.evaluate(() => {
      const result = window.campaignEntityPointer.finish(); delete window.campaignEntityPointer
      window.restorePreacherInput(); delete window.restorePreacherInput; return result
    })
    const after = await acquisition.read(), accepted = acceptedInputBoundary(before, after, hit, delivery)
    const actualBefore = delivery.events[1].state.input.gestureOwners.find(u => u.id === id)
    assert.ok([176, 184].includes(actualBefore.object) && actualBefore.statusFlags & 1,
      'The actual movement handler must supersede a still-active gesture')
    const moveDeadline = Math.min(activeStage.started + activeStage.capMs, performance.now() + 10000)
    let movement
    while (!movement) {
      check()
      for (const row of await drain('loaded')) {
        const u = row.units.find(u => u.id === id), p = u?.native
        if (row.turn > accepted.inputAfter.turn && row.sameLoadedOwner && u?.order?.model === 3 &&
          p?.commandStatus === 3 && ![176, 184].includes(p.object) &&
          Math.hypot(u.x - before.units.find(u => u.id === id).x, u.z - before.units.find(u => u.id === id).z) > 1 / 256)
          movement = row
      }
      assert.ok(performance.now() < moveDeadline, 'Ordinary adopted movement was not observed')
      if (!movement) await page.waitForTimeout(100)
    }
    supersession = { trace, hit, actualBefore, accepted, movement }
    loadedRestored = await page.evaluate(() => window.preacherLoaded.finish())
    assert.deepEqual(loadedRestored, { errors: [], restored: true })
    end({ inputTurn: accepted.inputAfter.turn, observedMovementTurn: movement.turn })
    save('passed'); return { progress, saved, loaded, supersession, captures,
      limits: 'Finite ordinary gesture/Save/Load/movement proof; audio scope is loader/request source evidence only, not audible output or native mixer equivalence.' }
  } catch (error) { failures.push(String(error?.stack ?? error)); save('failed'); throw error }
  finally {
    const cleanup = await page.evaluate(({ originalFinished, loadedFinished }) => {
      window.restorePreacherInput?.()
      const pointer = window.campaignEntityPointer?.finish(); delete window.campaignEntityPointer
      const pause = window.preacherPauseInput?.finish()
      const originalTail = window.preacherCandidate?.drain(), loadedTail = window.preacherLoaded?.drain()
      const original = !originalFinished && window.preacherCandidate?.finish()
      const loaded = !loadedFinished && window.preacherLoaded?.finish()
      window.campaignReplacement?.dispose?.()
      return { pointer, pause, original, loaded, originalTail, loadedTail }
    }, { originalFinished: !!originalRestored, loadedFinished: !!loadedRestored }).catch(error => ({ error: String(error) }))
    for (const [epoch, tail] of [['original', cleanup.originalTail], ['loaded', cleanup.loadedTail]])
      for (const row of tail?.rows ?? []) appendFileSync(resolve(output, `${epoch}-phases.jsonl`), JSON.stringify(row) + '\n')
    writeFileSync(resolve(output, 'observer-cleanup.json'), JSON.stringify(cleanup, null, 2) + '\n')
  }
}
