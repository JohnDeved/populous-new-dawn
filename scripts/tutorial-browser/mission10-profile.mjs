import { dependencyReceipt } from '../orchestration/dependency-profile.mjs'
// Dedicated M10 matrix episode. One fixed deadline spans both owned processes.
import assert from 'node:assert/strict'
import { randomUUID, createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { acquireProfile, sourceReceipt, profileInputReceipt, persistentLaunchOptions } from '../local-render/owned-profile.mjs'
import { readCommittedCheckpoint } from '../local-render/checkpoint-observer.mjs'
import scenario from '../local-render/mission10-boat-checkpoint.mjs'
import { bindGame, prepareCampaignFixture, launchCampaignMission } from '../browser-game.mjs'
import { waitForStartupMenu } from '../browser-new-game.mjs'
import { pauseStartupReady, skipPauseIntroduction } from '../local-render/original-pause-checkpoint-recovery.mjs'
import { createMission10Input, mission10BoatPoint } from './mission10-input.mjs'
import { retainMission10Artifacts, mission10RetainedName } from './mission10-artifacts.mjs'

const digest = bytes => createHash('sha256').update(bytes).digest('hex')
const json = value => JSON.stringify(value, null, 2) + '\n'

// Install abort handling before launch, and await cleanup even when abort lands
// while launch is unresolved. This function never launches a replacement browser.
export async function withMission10Context({ chromium, dataDir, launch, signal, cleanup }, runScenario) {
  signal.throwIfAborted()
  let context, browser, closing
  const close = async () => {
    if (!context) return
    closing ??= context.close()
    let timeout
    try {
      await Promise.race([closing, new Promise((_, reject) => {
        timeout = setTimeout(() => reject(Error('Owned browser close timed out')), 10000)
      })])
    } finally { clearTimeout(timeout) }
    assert.equal(browser.isConnected(), false, 'Owned Chrome must terminate before profile reuse')
    cleanup.verified = true
  }
  const onAbort = () => { void close().catch(error => { cleanup.error = String(error) }) }
  signal.addEventListener('abort', onAbort, { once: true })
  try {
    context = await chromium.launchPersistentContext(dataDir, persistentLaunchOptions(launch, dataDir))
    browser = context.browser()
    signal.throwIfAborted()
    return await runScenario(context, browser)
  } finally {
    signal.removeEventListener('abort', onAbort)
    await close()
  }
}

export default async function runMission10Profile({ chromium, launch, url, root, output, receipt, signal, verifySource, deadlineAt }) {
  signal.throwIfAborted()
  assert.ok(Number.isFinite(deadlineAt) && Date.now() < deadlineAt, 'Retained browser deadline exhausted')
  const source = sourceReceipt(root)
  assert.equal(source.commit, receipt.source.commit)
  assert.equal(source.status, '', 'Persistent companion requires exact clean reviewed Git source')
  const inputs = profileInputReceipt(root, resolve(root, 'scripts/local-render/mission10-boat-checkpoint.mjs'))
  const runtime = { node: process.version, browserVersion: receipt.browserVersion,
    browserSha256: receipt.browserSha256, launch,
    packages: receipt.buildPackageVersions, ...dependencyReceipt(root) }
  const runtimeSha256 = digest(JSON.stringify(runtime))
  const path = resolve(root, 'work/local-render-profiles', `m10-hosted-${randomUUID()}`)
  assert.equal(existsSync(path), false, 'Only a brand-new task profile may be admitted')
  const report = { status: 'running', sourceCommit: source.commit, sourceFingerprint: source.fingerprint,
    runtimeSha256, deadlineAt, profilePath: path, phases: [],
    campaignFixture: { mission: 10, completed: [], kind: 'declared-native-availability' },
    limits: 'Declared Mission 10 availability fixture with public native launch, boarding, crew selection and same-shore unload. No checkpoint or gameplay seeding. Not earned campaign unlock, sea crossing, completion, native parity or hardware performance.' }
  const saveReport = () => writeFileSync(resolve(output, 'mission10-profile.json'), json(report))
  saveReport()
  try {
    for (const [index, mode] of ['created', 'reused'].entries()) {
      signal.throwIfAborted(); verifySource()
      assert.deepEqual(sourceReceipt(root), source, 'Source identity changed between browser processes')
      const phaseOutput = resolve(output, `mission10-${mode}`); mkdirSync(phaseOutput)
      const lease = acquireProfile({ path, root, origin: url, source, inputs, runtime, output: phaseOutput })
      assert.equal(lease.profile.mode, mode)
      const phase = { status: 'running', source, runtime, runtimeSha256, profile: lease.profile,
        errors: [], warnings: [], startedAt: new Date().toISOString() }
      const cleanup = { verified: false }
      const savePhase = () => writeFileSync(resolve(phaseOutput, 'receipt.json'), json(phase))
      const finishPhase = () => {
        phase.cleanupVerified = cleanup.verified; phase.profile.cleanupVerified = cleanup.verified
        phase.profile.continuationVerified = false
        try {
          verifySource(); assert.deepEqual(sourceReceipt(root), source)
          assert.deepEqual(profileInputReceipt(root), inputs)
          for (const [key, value] of Object.entries(dependencyReceipt(root))) assert.deepEqual(value, runtime[key])
          phase.sourceAfter = 'identical'
          phase.profile.continuationVerified = phase.status === 'passed' && cleanup.verified && Object.hasOwn(phase.profile, 'checkpointAtEnd')
        } catch (error) { phase.status = 'failed'; phase.failure = String(error); throw error } finally {
          phase.endedAt = new Date().toISOString(); savePhase()
          // Failed, interrupted or uncertain provenance retains the ownership lock.
          if (phase.profile.continuationVerified) lease.finish(phase, cleanup.verified)
          report.phases[index] = { mode, status: phase.status, cleanupVerified: phase.cleanupVerified,
            receipt: mission10RetainedName(mode, 'receipt.json'), sourceReceipt: `mission10-${mode}/receipt.json`, receiptSha256: digest(readFileSync(resolve(phaseOutput, 'receipt.json'))) }
          saveReport()
        }
      }
      report.phases.push({ mode, status: 'running' }); saveReport(); savePhase()
      try {
        phase.result = await withMission10Context({ chromium, dataDir: lease.dataDir, launch, signal, cleanup }, async (context, browser) => {
          assert.equal(browser.version(), receipt.browserVersion, 'Persistent Chrome runtime changed')
          await context.route('**/*', route => new URL(route.request().url()).origin === url ? route.continue() : route.abort('blockedbyclient'))
          await context.routeWebSocket('**/*', route => route.close())
          const watch = page => {
            page.on('pageerror', error => phase.errors.push(String(error)))
            page.on('console', message => { if (message.type() === 'error') phase.errors.push(message.text()); if (message.type() === 'warning') phase.warnings.push(message.text()) })
            page.on('crash', () => phase.errors.push('Mission 10 page crashed'))
          }
          context.on('page', watch); context.pages().forEach(watch)
          const page = context.pages()[0] ?? await context.newPage(); page.setDefaultTimeout(15000)
          await page.goto(url, { waitUntil: 'domcontentloaded' })
          await waitForStartupMenu(page)
          phase.profile.checkpointAtStart = await readCommittedCheckpoint(page)
          assert.deepEqual(phase.profile.checkpointAtStart, phase.profile.previousRun?.checkpointAtEnd ?? null,
            'The new process must observe exactly the previous committed checkpoint')
          const observeCheckpoint = async label => {
            signal.throwIfAborted()
            const row = { label, profileId: lease.profile.id, runId: lease.profile.runId,
              sourceFingerprint: source.fingerprint, checkpoint: await readCommittedCheckpoint(page) }
            phase.profile.checkpoints.push(row); savePhase(); return row
          }
          const openMission = async mission => {
            assert.equal(mission, 10)
            assert.equal(mode, 'created', 'Only the new owned profile may receive launch prerequisites')
            signal.throwIfAborted()
            await prepareCampaignFixture(page, 10)
            signal.throwIfAborted()
            await launchCampaignMission(page, 10)
            await bindGame(page)
            const ready = await page.waitForFunction(pauseStartupReady)
            const action = await ready.jsonValue(); await ready.dispose()
            if (action === 'skip') await skipPauseIntroduction(page)
            await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
          }
          const result = await scenario({ page, openMission, output: phaseOutput, receipt: phase,
            observeCheckpoint, signal, deadlineAt, createInput: createMission10Input, findBoatPoint: mission10BoatPoint })
          phase.profile.checkpointAtEnd = await readCommittedCheckpoint(page)
          assert.equal(result.status, 'passed'); assert.deepEqual(phase.errors, [])
          assert.equal(phase.profile.checkpointAtEnd?.checkpointSha256,
            index === 0 ? result.saved.checkpoint.checkpointSha256 : result.saved.checkpointSha256)
          signal.throwIfAborted()
          return result
        })
        phase.status = 'passed'
      } catch (error) { phase.status = 'failed'; phase.failure = String(error); throw error }
      finally { finishPhase() }
    }
    report.status = 'passed'; saveReport(); return report
  } catch (error) { report.status = 'failed'; report.failure = String(error); saveReport(); throw error }
  finally { retainMission10Artifacts(output, report) }
}
