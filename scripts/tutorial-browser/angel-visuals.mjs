import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { migrateCheckpoint } from '../../app/game-store.ts'
import { CHECKPOINT_VERSION } from '../../app/checkpoint-format.ts'
import { bindGame } from '../browser-game.mjs'
import { armSnapshotPauseLatch } from '../browser-performance/snapshot-setup.mjs'
import { checkpointCodec } from './checkpoint-codec.mjs'
import { m2LoadReady } from './m2-pointer-f8.mjs'
import { withAngelVisualContext } from './angel-visuals-budget.mjs'
import { createAngelVisualFixture, angelCheckpointState } from './angel-visuals-fixture.mjs'
import { installAngelVisualObserver } from './angel-visuals-observer.mjs'
import { retainedAngelCrop, retainedAngelContext, validateAngelObservation } from './angel-visuals-evidence.mjs'

const root = resolve(import.meta.dirname, '../..'), sha = value => createHash('sha256').update(value).digest('hex')
export const ANGEL_VISUAL_INPUTS = Object.freeze([
  'app/angel.ts', 'app/angel-presentation.ts', 'app/original-angel.json', 'app/scene-angel.ts',
  'app/scene-assets.ts', 'app/scene-effects.ts', 'app/scene-picking.ts', 'app/render-view.ts',
  'app/game-clock.ts', 'app/game-store.ts', 'app/checkpoint-format.ts', 'app/world-turn.ts',
  'scripts/tutorial-browser/angel-visuals.mjs', 'scripts/tutorial-browser/angel-visuals-budget.mjs',
  'scripts/tutorial-browser/angel-visuals-fixture.mjs', 'scripts/tutorial-browser/angel-visuals-observer.mjs',
  'scripts/tutorial-browser/angel-visuals-evidence.mjs', 'scripts/tutorial-browser/checkpoint-codec.mjs',
  'scripts/browser-performance/snapshot-setup.mjs', 'scripts/browser-game.mjs',
  'scripts/tutorial-browser/m2-pointer-f8.mjs', 'tests/level-start-fixture.mjs',
])
// Fresh-context storage boundary, used once for supplied setup and then read-only
// for the actual public Save. Canonical graph preserves Maps and typed arrays.
export async function angelCheckpointStorage(transferText = null) {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('populous-new-dawn', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('checkpoints')
    request.onerror = () => reject(request.error); request.onsuccess = () => resolve(request.result)
  })
  try {
    if (transferText !== null) await new Promise((resolve, reject) => {
      const tx = db.transaction('checkpoints', 'readwrite')
      tx.objectStore('checkpoints').put(window.angelCodec(JSON.parse(transferText), true), 'latest')
      tx.oncomplete = resolve; tx.onerror = tx.onabort = () => reject(tx.error)
    })
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('checkpoints', 'readonly'), request = tx.objectStore('checkpoints').get('latest')
      let value
      request.onsuccess = () => { value = request.result }
      tx.oncomplete = () => resolve(JSON.stringify(window.angelCodec(value)))
      tx.onerror = tx.onabort = () => reject(tx.error)
    })
  } finally { db.close() }
}
export default async function spellAngel({ browser, url, output, source, expectedRevision, deadlineAt }) {
  const report = { schema: 'populous-new-dawn/angel-visuals', schemaVersion: 1, status: 'running',
    expectedRevision, sourceCommit: source.commit, source: {}, actions: [], errors: [],
    limitations: [
      'Supplied current-v4 isolated fixture, not earned stock, pointer casting, authored campaign progression or F9 acquisition.',
      'Existing three-phase gameplay adapter only; native approach/split, restart/latch producers, camera pitch/bank and native visibility timing remain unresolved.',
      'Source-backed meshes, UV owner tiles, displayed morphs and ordinary cleanup; not an original-game framebuffer or pixel-perfect composition comparison.',
      'Finite supplied lifetime80 replaces ordinary2500 only in setup. Public Save and Load use the actual committed current-format record.',
      'Same-render canvas copies and read-only geometry/picker diagnostics perturb rendering. No hardware performance, smoothness or Cloudflare/RSC hosting claim.',
      'Observed death samples may skip intermediate scales. Exhaustive scale/controller identity remains separate CPU evidence; crops require independent visual review.',
    ] }
  const save = () => writeFileSync(resolve(output, 'angel-visuals.json'), JSON.stringify(report, null, 2) + '\n')
  await withAngelVisualContext({ browser, deadlineAt, report, save, operation: async (context, check) => {
    assert.match(expectedRevision, /^[a-f0-9]{40}$/); assert.equal(expectedRevision, source.commit)
    for (const name of ANGEL_VISUAL_INPUTS) {
      const digest = sha(readFileSync(resolve(root, name)))
      assert.equal(source.files[name], digest, `Angel source input ${name} must match exact checkout`)
      report.source[name] = digest
    }
    const fixture = createAngelVisualFixture(source); report.fixture = fixture.receipt
    for (const [name, value] of [['angel-supplied-checkpoint.json', fixture.transfer], ['angel-supplied-expected.json', fixture.expected], ['angel-fixture-source.json', fixture.receipt]])
      writeFileSync(resolve(output, name), JSON.stringify(value), { flag: 'wx' })
    check()
    const page = await context.newPage(); page.setDefaultTimeout(8000)
    const runtimeError = error => { if (report.errors.length < 20) report.errors.push(String(error).slice(0, 2000)) }
    page.on('pageerror', runtimeError); page.on('crash', () => runtimeError('Page crashed'))
    page.on('console', message => { if (message.type() === 'error') runtimeError(message.text()) })
    const action = async (name, perform) => {
      check(); report.actions.push({ name, startedAt: new Date().toISOString() }); save()
      const result = await perform(); check()
      report.actions.at(-1).finishedAt = new Date().toISOString(); save(); return result
    }
    const button = name => action(name, () => page.getByRole('button', { name, exact: true }).click())
    await page.addInitScript({ content: `window.angelCodec = ${checkpointCodec.toString()}; window.angelStateOf = ${angelCheckpointState.toString()};` })
    await action('Open fresh isolated context', () => page.goto(url, { waitUntil: 'domcontentloaded' }))
    assert.equal(await page.evaluate(angelCheckpointStorage, JSON.stringify(fixture.transfer)), JSON.stringify(fixture.transfer))
    report.setupCommittedReadback = true
    await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForFunction(m2LoadReady)
    await page.evaluate(latchSource => {
      const main = document.querySelector('main')
      let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))], store
      for (; fiber && !store; fiber = fiber.return)
        for (let hook = fiber.memoizedState; hook; hook = hook.next)
          if (hook.memoizedState?.getWorld && hook.memoizedState?.subscribe) { store = hook.memoizedState; break }
      if (!store) throw Error('Store unavailable before supplied Load')
      // Setup-only latch, released before Save. Public saved-record Load below
      // receives no latch, pause injection, simulated tick or renderer replacement.
      window.__angelSetupLatch = Function(`return (${latchSource})`)()(store, window.angelCodec)
    }, armSnapshotPauseLatch.toString())
    await button('Load Game')
    await action('Bind supplied loaded Scene', async () => {
      try { await bindGame(page) }
      catch (error) {
        report.startupFailure = await page.evaluate(() => ({
          body: document.body.innerText.slice(0, 4000),
          loading: document.querySelector('.loading-world')?.textContent,
          latch: (() => { const r = window.__angelSetupLatch?.read(); return r && { loaded: r.loaded, failure: r.failure, forcedUnpauses: r.forcedUnpauses } })(),
        }))
        await page.screenshot({ path: resolve(output, 'angel-startup-failure.png'), timeout: 2000 }).catch(() => {})
        save(); throw error
      }
    })
    const latch = await page.evaluate(() => {
      const read = window.__angelSetupLatch.read(); window.__angelSetupLatch.release(); delete window.__angelSetupLatch
      return read
    })
    assert.equal(latch.failure, undefined); assert.equal(latch.loaded, true)
    assert.deepEqual(JSON.parse(latch.boundary), fixture.expected)
    report.setupLoadBoundaryMatched = true; report.setupForcedUnpauses = latch.forcedUnpauses
    const readState = () => page.evaluate(() => window.angelStateOf(window.testStore.getWorld()))
    report.pausedBefore = await readState()
    assert.deepEqual(report.pausedBefore, fixture.receipt.state)
    await page.evaluate(installAngelVisualObserver, { ...fixture.receipt, segment: 'paused' })
    const retain = async segment => {
      const observation = await page.evaluate(() => window.__pndAngelObservation.retain())
      report[segment] = observation
      for (const crop of observation.crops) {
        if (crop.error || !crop.png) continue
        const { bytes, sha256 } = retainedAngelCrop(crop)
        writeFileSync(resolve(output, crop.filename), bytes, { flag: 'wx' }); crop.sha256 = sha256; delete crop.png
      }
      for (const frame of observation.contextFrames) {
        if (frame.error || !frame.png) continue
        const { bytes, sha256 } = retainedAngelContext(frame)
        writeFileSync(resolve(output, frame.filename), bytes, { flag: 'wx' }); frame.sha256 = sha256; delete frame.png
      }
      save(); validateAngelObservation(observation, fixture.receipt, segment); check()
    }
    await page.waitForFunction(() => window.__pndAngelObservation.result.done)
    await retain('paused')
    report.pausedAfter = await readState(); assert.deepEqual(report.pausedAfter, report.pausedBefore)
    await page.screenshot({ path: resolve(output, 'angel-paused-context.png') }); check()
    await button('Game settings'); await button('Save Game'); await button('Save checkpoint')
    const menu = page.getByRole('dialog', { name: 'Game menu', exact: true })
    await menu.getByRole('status').filter({ hasText: 'Checkpoint saved in this browser.' }).waitFor()
    const committedText = await page.evaluate(angelCheckpointStorage), committedTransfer = JSON.parse(committedText)
    const committed = checkpointCodec(committedTransfer, true)
    assert.equal(committed.version, CHECKPOINT_VERSION)
    assert.deepEqual(angelCheckpointState(committed.world), report.pausedBefore)
    assert.deepEqual(await readState(), report.pausedBefore)
    writeFileSync(resolve(output, 'angel-public-save.json'), committedText, { flag: 'wx' })
    report.publicSave = { version: committed.version, sha256: sha(committedText), state: angelCheckpointState(committed.world) }
    await page.evaluate(() => {
      const store = window.testStore, before = store.getWorld()
      window.__angelPublicLoadBoundary = null
      const unsubscribe = store.subscribe(() => {
        const world = store.getWorld()
        if (world === before) return
        window.__angelPublicLoadBoundary = JSON.stringify(window.angelCodec(world)); unsubscribe()
      })
    })
    await page.evaluate(installAngelVisualObserver, { ...fixture.receipt, segment: 'running', waitForReplacement: true })
    await button('Back'); await button('Load Game'); await button('Load checkpoint')
    await page.waitForFunction(() => !!window.__angelPublicLoadBoundary)
    const restoredText = await page.evaluate(() => window.__angelPublicLoadBoundary)
    const expected = checkpointCodec(migrateCheckpoint(structuredClone(committed.world)))
    assert.deepEqual(JSON.parse(restoredText), expected, 'Entire committed world survives actual public Load migration boundary')
    report.publicLoad = { fullBoundaryMatched: true, sha256: sha(restoredText), state: angelCheckpointState(checkpointCodec(JSON.parse(restoredText), true)) }
    writeFileSync(resolve(output, 'angel-public-load-boundary.json'), restoredText, { flag: 'wx' })
    await menu.waitFor({ state: 'hidden' }); await bindGame(page)
    await page.waitForFunction(() => window.__pndAngelObservation.result.done, null, { timeout: 16000 })
    await retain('running')
    assert.deepEqual(report.errors, [])
    report.presentation = { kind: 'supplied-current-v4-rendered-sequence', testedCommit: source.commit,
      contextual: ['angel-paused-context.png', 'angel-loop-context.png', 'angel-death-context.png'],
      animationSequence: report.running.contextFrames.map(frame => ({ filename: frame.filename, stamp: frame.stamp, turn: frame.turn, pose: frame.pose })),
      caption: 'Supplied isolated current-v4 fixture, not earned acquisition or original framebuffer parity. Actual tested commit ' + source.commit }
    report.visualReview = 'required: actual retained same-render crops, not automatic original-framebuffer acceptance'
  } })
  return report
}
