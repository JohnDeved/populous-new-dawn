// Short ownership tail for the exact genuine Save from failed ordinary01.
// It preserves that failed run and earns only remaining Load/Restart evidence.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { bindGame } from '../browser-game.mjs'
import { readMission1VaultCheckpoint } from './mission1-vault-checkpoint.mjs'

export const continuationSource = {
  output: 'work/orchestration/m1-building-screen-b1e60f4-01',
  reportSha256: 'be6126e9f035016d39262ea4d7a02c6f93a775f84801a073c13c43532cd712b6',
  receiptSha256: '425a83c54d56018a80964b60dfb029fba284e1b940861c372086ff519770ebec',
  profileId: '85495efd-7528-4a5a-a040-04fec758ec8b',
  priorRunId: '55027759-6755-4655-972b-e891b7ae2b4e',
  sourceFingerprint: '5980091c384e59473b1fbedd3392a398ce4e9ce5b8ed7c79655dda72bc0e12f6',
  application: '3a9e326e8389249c66ec0010cc288d4d6652e27b45478ad638ad6876a39e23f0',
  checkpointSha256: '82d1bdbc83e29ca77e210513ff737bb16342a464dc8b6e477c896f997fa2b3ca',
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

export default async function mission1BuildingScreenContinuation({ page, root, output, signal, receipt }) {
  const hash = bytes => createHash('sha256').update(bytes).digest('hex')
  const prior = (name, expected) => {
    const bytes = readFileSync(resolve(root, continuationSource.output, name))
    assert.equal(hash(bytes), expected, 'Prior failed evidence changed')
    return JSON.parse(bytes)
  }
  const previous = prior('receipt.json', continuationSource.receiptSha256)
  const original = prior('mission1-building-screen.json', continuationSource.reportSha256)
  assert.equal(previous.status, 'failed'); assert.equal(original.status, 'failed')
  assert.equal(receipt.profile.mode, 'reused'); assert.equal(receipt.profile.id, continuationSource.profileId)
  assert.equal(receipt.profile.previousRun.runId, continuationSource.priorRunId)
  assert.equal(receipt.profile.previousRun.receiptSha256, continuationSource.receiptSha256)
  assert.equal(receipt.profile.previousRun.sourceFingerprint, continuationSource.sourceFingerprint)
  assert.equal(receipt.profile.inputs.application, continuationSource.application)
  assert.deepEqual(receipt.profile.checkpointAtStart, previous.profile.checkpointAtEnd)
  assert.equal(receipt.profile.checkpointAtStart.checkpointSha256, continuationSource.checkpointSha256)
  const saved = original.checkpoints.find(entry => entry.label === 'M1 active screen').saved
  const birth = original.epochs.ordinary.birth, shamanId = original.epochs.ordinary.source.shamanId
  const report = { status: 'running', source: receipt.source, prior: continuationSource, loads: [], frames: {},
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
    await load(true, true)
    await button('Game settings').click()
    await page.evaluate(async () => {
      const { installMission1BuildingRestartWitness } = await import('/scripts/local-render/mission1-building-screen-load.mjs')
      installMission1BuildingRestartWitness()
    })
    try { await button('Restart world').click(); await button('Pause game').click() }
    finally {
      report.restart = await page.evaluate(() => window.restoreM1BuildingRestart?.())
      const screen = report.restart?.screen
      if (screen) { delete report.restart.screen; persistScreen('beforeRestart', screen) }
      save()
    }
    const restart = report.restart
    assertMission1BuildingRestart(restart, report.beforeRestart, birth.gift.id)
    assert.deepEqual(await page.evaluate(readMission1VaultCheckpoint), saved, 'Restart altered the genuine committed checkpoint')
    await bindGame(page)
    await button('buildings B').click()
    assert.equal(await button('Warrior Training Hut, 8 wood').isDisabled(), true)
    await page.screenshot({ path: resolve(output, 'restarted-camp-locked.png') })
    await load(false, false)
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
    await button('buildings B').click(); await button('Warrior Training Hut, 8 wood').click()
    assert.equal(await page.evaluate(() => window.testSceneRef.current.world.mode), 'camp')
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
    save()
  }
  if (failed) throw failure
  return report
}
