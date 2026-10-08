// Short ownership tail for the exact genuine Save from failed ordinary01.
// It preserves that failed run and earns only remaining Load/Restart evidence.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { bindGame } from '../browser-game.mjs'
import { installMission1VaultCheckpointState, readMission1VaultCheckpoint } from './mission1-vault-checkpoint.mjs'

export const continuationSource = {
  output: 'work/orchestration/m1-building-screen-b1e60f4-01',
  reportSha256: 'be6126e9f035016d39262ea4d7a02c6f93a775f84801a073c13c43532cd712b6',
  receiptSha256: '425a83c54d56018a80964b60dfb029fba284e1b940861c372086ff519770ebec',
  profileId: '85495efd-7528-4a5a-a040-04fec758ec8b',
  priorRunId: '55027759-6755-4655-972b-e891b7ae2b4e',
  sourceFingerprint: '5980091c384e59473b1fbedd3392a398ce4e9ce5b8ed7c79655dda72bc0e12f6',
  application: '3a9e326e8389249c66ec0010cc288d4d6652e27b45478ad638ad6876a39e23f0',
  checkpointSha256: '82d1bdbc83e29ca77e210513ff737bb16342a464dc8b6e477c896f997fa2b3ca',
  predecessor: {
    output: 'work/orchestration/m1-building-continuation-5b691bc-02',
    reportSha256: '3a758d0a60d4f019c846eb0e322f29e2b661daee45cf42f47e45fcbb9aa70166',
    receiptSha256: '45f7d71842b4dbd045b029b6381aee7e7c7c111ba08db274340d736789906e35',
    runId: '81d22f47-2974-4cc5-8d06-2975616fe9ca',
    sourceFingerprint: '897cfd4dbd7c48b71a464ae9da63677fd7fda48519d308ce2c5f3ad141078bd4',
    previousReceiptSha256: '50ffac1c7ce0071c92ff96208ea4e796d4df1da882261726f97ce2e0c0af70da',
  },
}

// JSON lost only this known source-created +Infinity sentinel. Project that
// exact gift field for the historical tie; live Load comparisons stay lossless.
export function assertMission1SerializedCheckpoint(actual, serialized) {
  assert.equal(actual.buildingGifts.length, 1); assert.equal(serialized.buildingGifts.length, 1)
  const tag = { mission: 1, head: 1, reward: 2, slot: 0, rewardClass: 2, model: 7, completedTurn: 1250, serial: 3541 }
  for (const gift of [actual.buildingGifts[0], serialized.buildingGifts[0]]) {
    assert.equal(gift.id, 3541); assert.equal(gift.kind, 'gift'); assert.equal(gift.reward, 'camp')
    assert.deepEqual(gift.buildingAcquisition, tag)
  }
  assert.equal(actual.buildingGifts[0].duration, Infinity)
  assert.equal(serialized.buildingGifts[0].duration, null)
  const projected = structuredClone(actual)
  projected.buildingGifts[0].duration = null
  assert.deepEqual(projected, serialized)
  return { giftId: 3541, field: 'buildingGifts[0].duration', actual: '+Infinity', recorded: null }
}

export function assertMission1BuildingRestart(restart, screen, giftId) {
  assert.equal(restart.error, null); assert.equal(restart.loadError, null); assert.equal(restart.trusted, true)
  assert.equal(restart.before.acquisition.controllers.building?.active, true, 'Trusted Restart click missed active ownership')
  assert.equal(restart.before.camp, false); assert.equal(restart.before.buildingGifts[0]?.id, giftId)
  assert.equal(screen.restored, true); assert.deepEqual(screen.errors, [])
  assert.equal(restart.after.turn, 0); assert.equal(restart.after.camp, false); assert.equal(restart.after.active, true)
  for (const name of ['building', 'companion', 'pulse']) assert.equal(restart.after.acquisition.controllers[name], null)
  assert.deepEqual(restart.after.acquisition.requests, []); assert.deepEqual(restart.after.buildingGifts, [])
}

export async function runMission1BuildingRestart({ page, button, report, persistScreen, save }) {
  let failed = false, failure
  const cleanupError = error => {
    report.restartCleanupErrors ??= []; report.restartCleanupErrors.push(String(error?.stack ?? error))
    if (!failed) { failed = true; failure = error }
  }
  try { await button('Restart world').click(); await button('Pause game').click() }
  catch (error) { failed = true; failure = error }
  finally {
    try {
      report.restart = await page.evaluate(() => window.restoreM1BuildingRestart?.())
      const screen = report.restart?.screen
      if (screen) {
        report.beforeRestart = screen; delete report.restart.screen
        persistScreen('beforeRestart', screen)
      }
    } catch (error) { cleanupError(error) }
    try { save() } catch (error) { cleanupError(error) }
  }
  if (failed) throw failure
}

export function finishMission1BuildingContinuation(report, save, failed, failure) {
  try { save() }
  catch (error) {
    report.reportSaveFailure = String(error?.stack ?? error)
    if (!failed) { failed = true; failure = error; report.status = 'failed' }
  }
  if (failed) throw failure
  return report
}

export function readMission1FinalHud() {
  const scene = window.testSceneRef?.current, world = scene?.world,
    tab = document.querySelector('[aria-label="buildings B"]'),
    card = document.querySelector('[aria-label="Warrior Training Hut, 8 wood"]')
  return { worldMatches: !!world && world === window.testStore?.getWorld(), sceneStarted: scene?.started ?? false,
    canvasConnected: scene?.renderer?.domElement?.isConnected ?? false, loading: !!document.querySelector('.loading-world'),
    inputMask: world?.inputMask ?? null, turn: world?.turn ?? null, paused: world?.paused ?? null,
    camp: world?.unlockedCamp ?? null, mode: world?.mode ?? null, buildingsSelected: tab?.getAttribute('aria-pressed') === 'true',
    selectedTabs: [...document.querySelectorAll('.dock-tabs [aria-pressed="true"]')].map(button => button.getAttribute('aria-label')),
    cardPresent: !!card, cardDisabled: card?.disabled ?? null }
}

export async function selectMission1CompletedCamp({ page, button, report, save }) {
  const evidence = report.finalHud = { before: await page.evaluate(readMission1FinalHud), after: null, selected: null, cleanupErrors: [] }
  let failed = false, failure
  const retainError = error => { evidence.cleanupErrors.push(String(error?.stack ?? error)); if (!failed) { failed = true; failure = error } }
  try { await button('buildings B').click() }
  catch (error) { failed = true; failure = error }
  finally {
    try { evidence.after = await page.evaluate(readMission1FinalHud) } catch (error) { retainError(error) }
    try { save() } catch (error) { retainError(error) }
  }
  if (failed) throw failure
  const after = evidence.after
  assert.ok(after.worldMatches && after.sceneStarted && after.canvasConnected && !after.loading, 'Final HUD Scene/readiness mismatch')
  assert.equal(after.inputMask, 0, 'Final HUD is still input-masked')
  assert.equal(after.camp, true); assert.equal(after.buildingsSelected, true, 'Public Buildings click did not select its tab')
  assert.equal(after.cardPresent, true); assert.equal(after.cardDisabled, false)
  await button('Warrior Training Hut, 8 wood').click()
  evidence.selected = await page.evaluate(readMission1FinalHud); save()
  assert.equal(evidence.selected.mode, 'camp')
}

export default async function mission1BuildingScreenContinuation({ page, root, output, signal, receipt }, { completionOnly = false } = {}) {
  const hash = bytes => createHash('sha256').update(bytes).digest('hex')
  const prior = (name, expected, directory = continuationSource.output) => {
    const bytes = readFileSync(resolve(root, directory, name))
    assert.equal(hash(bytes), expected, 'Prior failed evidence changed')
    return JSON.parse(bytes)
  }
  const previous = prior('receipt.json', continuationSource.receiptSha256)
  const original = prior('mission1-building-screen.json', continuationSource.reportSha256)
  const predecessor = prior('receipt.json', continuationSource.predecessor.receiptSha256, continuationSource.predecessor.output)
  const partial = prior('mission1-building-continuation.json', continuationSource.predecessor.reportSha256, continuationSource.predecessor.output)
  assert.equal(previous.status, 'failed'); assert.equal(original.status, 'failed')
  assert.equal(predecessor.status, 'failed'); assert.deepEqual(predecessor.profile.checkpointAtEnd, previous.profile.checkpointAtEnd)
  assert.equal(partial.status, 'failed'); assert.equal(predecessor.profile.previousRun.receiptSha256, continuationSource.predecessor.previousReceiptSha256)
  assert.equal(receipt.profile.mode, 'reused'); assert.equal(receipt.profile.id, continuationSource.profileId)
  assert.equal(receipt.profile.previousRun.runId, continuationSource.predecessor.runId)
  assert.equal(receipt.profile.previousRun.receiptSha256, continuationSource.predecessor.receiptSha256)
  assert.equal(receipt.profile.previousRun.sourceFingerprint, continuationSource.predecessor.sourceFingerprint)
  assert.equal(receipt.profile.inputs.application, continuationSource.application)
  assert.deepEqual(receipt.profile.checkpointAtStart, previous.profile.checkpointAtEnd)
  assert.equal(receipt.profile.checkpointAtStart.checkpointSha256, continuationSource.checkpointSha256)
  const serializedSaved = original.checkpoints.find(entry => entry.label === 'M1 active screen').saved
  let saved
  const birth = original.epochs.ordinary.birth, shamanId = original.epochs.ordinary.source.shamanId
  assertMission1BuildingRestart(partial.restart, partial.beforeRestart, birth.gift.id)
  for (const label of ['before', 'after']) {
    const sample = partial.beforeRestart.samples[label]
    assert.equal(sample.count, 16); assert.equal(sample.resourcesStable, true)
    assert.equal(sample.referenceGeometryUnchanged, true); assert.equal(sample.submittedMappingMatches, true)
  }
  const report = { status: 'running', source: receipt.source, prior: continuationSource, completionOnly, loads: [], frames: {},
    carriedPartial: 'Failed02 retains accepted resize samples and active-building interruption with shared-owner clearing. Companion/pulse were inactive at Restart; no active companion/pulse interruption is claimed.',
    limits: 'Only the genuine saved1300 ownership tail; ordinary01 remains FAILED. No repeated prefix, new acquisition, clock/RAF/state/storage mutation or hardware-performance claim.' }
  const save = () => writeFileSync(resolve(output, 'mission1-building-continuation.json'), JSON.stringify(report, null, 2) + '\n')
  const persistScreen = (label, evidence) => {
    if (!evidence) return
    for (const [stage, frame] of Object.entries(evidence.frames)) for (const key of ['overlayPng', 'buildingPng']) {
      const png = frame[key]
      if (!png) continue
      assert.match(png, /^data:image\/png;base64,[A-Za-z0-9+/=]+$/)
      const bytes = Buffer.from(png.slice('data:image/png;base64,'.length), 'base64')
      const name = `${label}-${stage}-${key === 'overlayPng' ? 'overlay' : 'building'}.png`
      writeFileSync(resolve(output, name), bytes, { flag: 'wx' })
      report.frames[name] = { sha256: hash(bytes), bytes: bytes.length }; delete frame[key]
    }
    report[label] = evidence; save()
  }
  const button = name => page.getByRole('button', { name, exact: true })
  // Pause is the next public input after Load; no host report/read/bind round trips.
  const load = async (startup, pauseImmediately) => {
    signal.throwIfAborted()
    if (!startup) await button('Game settings').click()
    await page.evaluate(async options => {
      const { prepareMission1BuildingLoad } = await import('/scripts/local-render/mission1-building-screen-load.mjs')
      await prepareMission1BuildingLoad(options)
    }, { shamanId, birth })
    const entry = { startup, startedAt: new Date().toISOString(), boundary: null }
    report.loads.push(entry)
    let failed = false, failure
    try {
      if (startup) await page.getByRole('dialog', { name: 'Start game', exact: true }).getByRole('button', { name: 'Load Game', exact: true }).click()
      else await button('Load checkpoint').click()
      if (pauseImmediately) await button('Pause game').click()
      // Wait only for the passive hook's own receipt, never for a live active age.
      await page.waitForFunction(() => window.m1BuildingLoad.evidence.restored, null, { timeout: 60000 })
    } catch (error) { failed = true; failure = error }
    finally {
      try { entry.boundary = await page.evaluate(() => window.m1BuildingLoad?.close()); entry.finishedAt = new Date().toISOString(); save() }
      catch (error) { entry.cleanupError = String(error?.stack ?? error); if (!failed) { failed = true; failure = error } }
    }
    if (failed) throw failure
    assert.equal(entry.boundary.error, null); assert.deepEqual(entry.boundary.loaded, saved)
    assert.deepEqual(entry.boundary.start.errors, []); assert.equal(entry.boundary.start.calls, 1)
    assert.equal(entry.boundary.start.result, true); assert.equal(entry.boundary.start.attached, true)
    assert.equal(entry.boundary.start.restored, true)
  }
  let failed = false, failure
  try {
    await page.evaluate(installMission1VaultCheckpointState)
    saved = report.committedReference = await page.evaluate(readMission1VaultCheckpoint)
    save()
    report.durationSentinel = assertMission1SerializedCheckpoint(saved, serializedSaved)
    save()
    if (completionOnly) await load(true, false)
    else {
      await load(true, true)
      await button('buildings B').click()
      for (const [label, width, height] of [['before', 1440, 1000], ['after', 1280, 960]]) {
        await page.evaluate(options => window.m1BuildingScreen.armDrawSample(options), { label, width, height })
        if (label === 'after') await page.setViewportSize({ width, height })
        await page.waitForFunction(label => {
          const state = window.m1BuildingScreen.status()
          if (state.errors.length) throw Error(state.errors.join('\n'))
          return state.samples[label] === 16
        }, label, { timeout: 30000, polling: 50 })
      }
      await button('Game settings').click()
      await page.evaluate(async () => {
        const { installMission1BuildingRestartWitness } = await import('/scripts/local-render/mission1-building-screen-load.mjs')
        installMission1BuildingRestartWitness()
      })
      await runMission1BuildingRestart({ page, button, report, persistScreen, save })
      const restart = report.restart
      assertMission1BuildingRestart(restart, report.beforeRestart, birth.gift.id)
      assert.deepEqual(await page.evaluate(readMission1VaultCheckpoint), saved, 'Restart altered the genuine committed checkpoint')
      await bindGame(page)
      await button('buildings B').click()
      assert.equal(await button('Warrior Training Hut, 8 wood').isDisabled(), true)
      await page.screenshot({ path: resolve(output, 'restarted-camp-locked.png') })
      await load(false, false)
    }
    await page.waitForFunction(() => {
      const state = window.m1BuildingScreen.status()
      if (state.errors.length) throw Error(state.errors.join('\n'))
      return state.terminal && state.grants === 1
    }, null, { timeout: 120000, polling: 50 })
    await button('Pause game').click()
    persistScreen('restored', await page.evaluate(() => window.m1BuildingScreen.close()))
    const evidence = report.restored, grant = evidence.stages.grant
    assert.equal(evidence.restored, true); assert.deepEqual(evidence.errors, [])
    assert.equal(evidence.handoffs, 0); assert.equal(evidence.grants, 1)
    assert.equal(grant.after.turn - birth.turn, 82); assert.equal(grant.before.gift.remaining, 1)
    assert.equal(grant.before.camp, false); assert.equal(grant.after.gift, undefined); assert.equal(grant.after.camp, true)
    assert.ok(evidence.frames.terminal)
    await selectMission1CompletedCamp({ page, button, report, save })
    await page.screenshot({ path: resolve(output, 'restored-camp-complete.png') })
    assert.deepEqual(receipt.errors, []); report.status = 'passed'
  } catch (error) { failed = true; failure = error; report.status = 'failed'; report.failure = String(error?.stack ?? error) }
  finally {
    try {
      const cleanup = await page.evaluate(() => {
        const result = { restart: null, load: null, screen: null, installation: window.m1BuildingScreenInstallation ?? null, errors: [] }
        for (const [key, fn] of [['restart', () => window.restoreM1BuildingRestart?.()], ['load', () => window.m1BuildingLoad?.close()], ['screen', () => window.m1BuildingScreen?.close()]])
          try { result[key] = fn() ?? null } catch (error) { result.errors.push(String(error?.stack ?? error)) }
        return result
      })
      if (cleanup.screen) { persistScreen('unfinished', cleanup.screen); delete cleanup.screen }
      report.cleanup = cleanup
      if (cleanup.errors.length) throw Error(cleanup.errors.join('\n'))
    } catch (error) { report.cleanupFailure = String(error?.stack ?? error); if (!failed) { failed = true; failure = error; report.status = 'failed' } }
  }
  return finishMission1BuildingContinuation(report, save, failed, failure)
}
