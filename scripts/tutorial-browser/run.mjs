import { preview } from 'vite'
import { chromium } from '@playwright/test'
import { spawn, execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { resolve, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { readFileSync, writeFileSync, readdirSync, lstatSync, statSync, existsSync, mkdirSync, symlinkSync, accessSync, constants } from 'node:fs'
import assert from 'node:assert/strict'
import { parseGameplayResourceArguments, gameplayOwnershipSelection } from './gameplay-resource-profile.mjs'
import { browserConfiguration } from './browser-config.mjs'
import { browserScenarios, browserCapMs, snapshotSmokeBudget, composedGameplayResourceSplitBudget, composedGameplayResourceBudgetPolicy } from './scenario-policy.mjs'
import { recoveryReceipt, recoveryReceiptLog } from './recovery-receipt.mjs'
import { profileCasesReceipt, profileCasesReceiptLog } from './profile-recovery-receipt.mjs'
import { mission10CrewReceipt, mission10CrewReceiptLog } from './mission10-crew-receipt.mjs'
import { runProfileEpisode } from './profile-episodes.mjs'
import { createGameplayAdmission, guardGameplayBrowser, cleanupGameplayResources } from './gameplay-admission.mjs'
import { createCompactAdmission } from './compact-admission.mjs'
import { guardBrowserAdmission } from '../browser-admission-guard.mjs'
import { buildRevision } from './build-provenance.mjs'
import { arch, cpus, platform, release } from 'node:os'
const root = resolve(dirname(import.meta.filename), '../..')
const fixture = resolve(dirname(import.meta.filename), 'fixture')
const scenario = resolve(root, 'scripts/local-render/tutorial-recommendation.mjs')
const selectorScenario = resolve(root, 'scripts/tutorial-browser/selector-inspection.mjs')
const sceneryScenario = resolve(root, 'scripts/tutorial-browser/scenery-placement.mjs')
const spellProjectionScenario = resolve(root, 'scripts/tutorial-browser/spell-projection.mjs')
const hypnotiseScenario = resolve(root, 'scripts/tutorial-browser/spell-hypnotise.mjs')
const spellTestScenario = resolve(root, 'scripts/tutorial-browser/spell-test-menu.mjs')
const spellConversionScenario = resolve(root, 'scripts/tutorial-browser/spell-conversion.mjs')
const buildingIdentityScenario = resolve(root, 'scripts/tutorial-browser/building-panel-identity.mjs')
const pauseRecoveryScenario = resolve(root, 'scripts/local-render/original-pause-checkpoint-recovery.mjs')
const frontendEscapeScenario = resolve(root, 'scripts/local-render/frontend-held-escape.mjs')
const recoveryScenario = resolve(root, 'scripts/local-render/campaign-profile-recovery.mjs')
const tornadoScenario = resolve(root, 'scripts/check-browser-tornado-appearance.mjs')
const mission10ProfileScenario = resolve(root, 'scripts/tutorial-browser/mission10-profile.mjs')
const spySourceScenario = resolve(root, 'scripts/tutorial-browser/spy-source.mjs')
const selectedScenario = process.env.POPULOUS_BROWSER_SCENARIO || 'tutorial'
assert.ok(browserScenarios.includes(selectedScenario), 'Unknown browser scenario')
const resourceArguments = parseGameplayResourceArguments(process.argv.slice(2), selectedScenario)
const out = resolve(resourceArguments.output || resolve(root, 'outputs/tutorial-browser'))
const snapshotScenario = resolve(root, 'scripts/browser-performance/snapshot-smoke.mjs')
const gameplayScenario = resolve(root, 'scripts/tutorial-browser/gameplay-frames.mjs')
const meleeScenario = resolve(root, 'scripts/tutorial-browser/melee-attack.mjs')
const followerCorpseScenario = resolve(root, 'scripts/tutorial-browser/follower-corpse.mjs')
const m2Scenario = resolve(root, 'scripts/tutorial-browser/m2-pointer-f8.mjs')
const port = 5198
if (existsSync(out)) throw Error('Output must be fresh')
mkdirSync(out, { recursive: true })
const dist = resolve(out, 'dist')
const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex')
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
const commit = git('rev-parse', 'HEAD')
if (process.env.GITHUB_SHA) assert.equal(commit, process.env.GITHUB_SHA, 'Exact proposed merge required')
const files = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean)
const source = { commit, files: Object.fromEntries(files.map(name => [name, hash(resolve(root, name))])),
  limits: ['Actual production Home component, store and scene through plain Vite hosting; excludes Vinext/Cloudflare/RSC hosting.'] }
// The official Chrome channel has the hosted Ubuntu AppArmor profile.
// Never fall back to an unsandboxed downloaded browser.
const browserConfig = browserConfiguration(process.env.POPULOUS_BROWSER)
const { browserPath } = browserConfig
assert.ok(existsSync(browserPath), 'Supported preinstalled official Chrome channel is required')
accessSync(browserPath, constants.X_OK)
const browserBinaryVersion = execFileSync(browserPath, ['--version'], { encoding: 'utf8' }).trim()
const dependencies = resolve(root, 'node_modules')
function metadata(path, prefix = '') {
  const result = {}
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const file = resolve(path, entry.name), key = prefix + entry.name
    if (entry.isDirectory()) Object.assign(result, metadata(file, key + '/'))
    else if (entry.isFile()) { const stat = statSync(file); result[key] = [stat.size, stat.mtimeMs] }
  }
  return result
}
function verifySource() { for (const [name, expected] of Object.entries(source.files)) assert.equal(hash(resolve(root, name)), expected, name) }
function outputManifest(path, prefix = '') {
  const result = {}
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const file = resolve(path, entry.name), key = prefix + entry.name
    if (entry.isSymbolicLink()) continue // Public assets are separately source-bound.
    if (entry.isDirectory()) Object.assign(result, outputManifest(file, key + '/'))
    else if (entry.isFile()) result[key] = hash(file)
  }
  return result
}
const receipt = { snapshotScenarioSha256: hash(snapshotScenario), buildRevision: buildRevision(root), gameplayScenarioSha256: hash(gameplayScenario), gameplayResourceObserverSha256: hash(resolve(root, 'scripts/tutorial-browser/gameplay-resource-observer.mjs')), scenarioPolicySha256: hash(resolve(root, 'scripts/tutorial-browser/scenario-policy.mjs')), meleeScenarioSha256: hash(meleeScenario), followerCorpseScenarioSha256: hash(followerCorpseScenario),
  host: { platform: platform(), arch: arch(), release: release(), logicalCpus: cpus().length,
    cpuModels: [...new Set(cpus().map(cpu => cpu.model))] },
  github: { head: process.env.PR_HEAD_SHA ?? null, base: process.env.PR_BASE_SHA ?? null,
    merge: process.env.GITHUB_SHA ?? null, runId: process.env.GITHUB_RUN_ID ?? null,
    runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null, runnerImage: process.env.ImageOS ?? null,
    runnerImageVersion: process.env.ImageVersion ?? null },
  frontendEscapeScenarioSha256: hash(frontendEscapeScenario),
  recoveryScenarioSha256: hash(recoveryScenario), selectedScenario, pauseRecoveryScenarioSha256: hash(pauseRecoveryScenario), m2ScenarioSha256: hash(m2Scenario),
  compactMessageScenarioSha256: hash(resolve(root, 'scripts/tutorial-browser/compact-message-layout.mjs')),
  checkpointCodecSha256: hash(resolve(root, 'scripts/tutorial-browser/checkpoint-codec.mjs')),
  checkpointGeneratorSha256: hash(resolve(root, 'scripts/tutorial-browser/m2-checkpoint.mjs')), status: 'running', startedAt: new Date().toISOString(), source, command: process.argv,
  runnerSha256: hash(import.meta.filename), builderSha256: hash(resolve(dirname(import.meta.filename), 'build-home.mjs')),
  browserConfigSha256: hash(resolve(dirname(import.meta.filename), 'browser-config.mjs')),
  scenarioSha256: hash(scenario), fixtureSha256: hash(resolve(fixture, 'main.tsx')),
  selectorScenarioSha256: hash(selectorScenario), sceneryScenarioSha256: hash(sceneryScenario),
  spellProjectionScenarioSha256: hash(spellProjectionScenario), spellProjectionCoverageSha256: hash(resolve(root, 'scripts/tutorial-browser/spell-projection-coverage.mjs')),
  spellTestScenarioSha256: hash(spellTestScenario),
  spellConversionScenarioSha256: hash(spellConversionScenario),
  hypnotiseSources: Object.fromEntries(['spell-hypnotise', 'hypnotise-fixture', 'hypnotise-observer', 'hypnotise-budget', 'hypnotise-checkpoint'].map(name => [name, hash(resolve(root, `scripts/tutorial-browser/${name}.mjs`))])),
  buildingIdentityScenarioSha256: hash(buildingIdentityScenario), buildingIdentityFixtureSha256: hash(resolve(root, 'scripts/tutorial-browser/building-panel-fixture.mjs')),
  fixtureHtmlSha256: hash(resolve(fixture, 'index.html')),
  buildPackageVersions: Object.fromEntries(['vite', '@vitejs/plugin-react', '@tailwindcss/postcss', '@playwright/test', 'playwright-core'].map(name => [name, JSON.parse(readFileSync(resolve(dependencies, name, 'package.json'))).version])),
  browserPath, browserPathSource: browserConfig.browserPathSource, launch: browserConfig.launch,
  browserChannel: browserConfig.launch.channel ?? null, browserBinaryVersion, browserSha256: hash(browserPath), node: process.version,
  environment: { TMPDIR: process.env.TMPDIR, XDG_CACHE_HOME: process.env.XDG_CACHE_HOME },
  limits: [...source.limits, 'Production Vite bundle of actual Home; excludes Vinext/Cloudflare/RSC hosting. No causal claim about prior development-server crashes.'], errors: [], warnings: [] }
if (resourceArguments.profile) receipt.gameplayResourceProfile = resourceArguments.profile
if (resourceArguments.ownershipProbe) {
  receipt.gameplayOwnershipProbe = resourceArguments.ownershipProbe
  if (process.env.GITHUB_ACTIONS === 'true') {
    receipt.gameplayOwnershipSelection = gameplayOwnershipSelection(
      JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')),
      process.env.GITHUB_EVENT_NAME, process.env.PR_HEAD_SHA, selectedScenario)
    assert.ok(receipt.gameplayOwnershipSelection, 'Weak ownership probe requires exact-head Ready event label')
  }
}
const save = () => writeFileSync(resolve(out, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n')
const abort = new AbortController()
let browser, context, page, server, timer, m2Fixture, browserDeadlineAt, gameplayAdmission, gameplayBrowser, compactAdmission, compactBrowser, producerBudget, producerCleanup
const before = metadata(dependencies)
receipt.dependenciesBeforeSha256 = createHash('sha256').update(JSON.stringify(before)).digest('hex')
try {
  verifySource(); save()
  receipt.build = await new Promise((resolveBuild, reject) => {
    const child = spawn(process.execPath, [resolve(dirname(import.meta.filename), 'build-home.mjs'), fixture, dist], { env: process.env, stdio: ['ignore', 'pipe', 'pipe'] })
    const chunks = []; let timedOut = false, force
    child.stdout.on('data', b => chunks.push(b)); child.stderr.on('data', b => chunks.push(b))
    const timeout = setTimeout(() => { timedOut = true; child.kill('SIGTERM'); force = setTimeout(() => child.kill('SIGKILL'), 5000) }, 120000)
    child.on('error', error => { clearTimeout(timeout); clearTimeout(force); reject(error) })
    child.on('close', (code, signal) => {
      clearTimeout(timeout); clearTimeout(force)
      writeFileSync(resolve(out, 'build.log'), Buffer.concat(chunks))
      resolveBuild({ pid: child.pid, exitCode: code, signal, timedOut, capMs: 120000 })
    })
  })
  save(); assert.equal(receipt.build.exitCode, 0, 'Build must pass'); assert.equal(receipt.build.timedOut, false)
  receipt.outputManifest = outputManifest(dist)
  receipt.publicLinks = []
  for (const entry of readdirSync(resolve(root, 'public'))) {
    const target = resolve(dist, entry); assert.equal(existsSync(target), false, 'Public asset collision')
    symlinkSync(resolve(root, 'public', entry), target, lstatSync(resolve(root, 'public', entry)).isDirectory() ? 'dir' : 'file')
    receipt.publicLinks.push({ path: entry, source: resolve(root, 'public', entry) })
  }
  verifySource(); save()
  if (selectedScenario === 'tutorial' || selectedScenario === 'm2-pointer-f8' || selectedScenario === 'compact-message-layout') {
    const { createM2Checkpoint } = await import('./m2-checkpoint.mjs')
    m2Fixture = await createM2Checkpoint(out, source)
    receipt.m2Fixture = m2Fixture.receipt
    verifySource(); save()
  }
  server = await preview({ configFile: false, root: fixture, build: { outDir: dist }, preview: { host: '127.0.0.1', port, strictPort: true } })
  browser = await chromium.launch(browserConfig.launch)
  receipt.browserVersion = browser.version(); save()
  receipt.browserCapMs = browserCapMs(selectedScenario)
  const browserStartedMs = performance.now()
  browserDeadlineAt = Date.now() + receipt.browserCapMs
  producerBudget = { startedMs: browserStartedMs, deadlineMs: browserStartedMs + receipt.browserCapMs, deadlineUnixMs: browserDeadlineAt }
  if (['gameplay-frames', 'gameplay-resources'].includes(selectedScenario)) {
    receipt.gameplayResourceBudgetPolicy = composedGameplayResourceBudgetPolicy
    receipt.gameplayResourceSplitBudget = composedGameplayResourceSplitBudget
  }
  if (selectedScenario === 'snapshot-protocol') receipt.browserBudget = snapshotSmokeBudget
  else if (selectedScenario === 'gameplay-frames') {
    gameplayAdmission = createGameplayAdmission({ deadlineAt: browserDeadlineAt, expectedRevision: receipt.buildRevision,
      signal: abort.signal, onExpire: error => {
        if (error.code === 'GAMEPLAY_ADMISSION_TIMEOUT') receipt.browserTimedOut = true
        abort.abort(error); return browser.close()
      } })
    receipt.gameplayAdmission = gameplayAdmission.report
    gameplayBrowser = guardGameplayBrowser(browser, gameplayAdmission)
  } else if (selectedScenario === 'compact-message-layout') {
    compactAdmission = createCompactAdmission({ deadlineAt: browserDeadlineAt, signal: abort.signal, onUpdate: save, onExpire: error => {
      if (error.code === 'COMPACT_ADMISSION_TIMEOUT') receipt.browserTimedOut = true
      abort.abort(error); return browser.close()
    } })
    receipt.compactAdmission = compactAdmission.report
    compactBrowser = guardBrowserAdmission(browser, compactAdmission)
  } else
  timer = setTimeout(() => { receipt.browserTimedOut = true; abort.abort(new Error('Browser deadline exceeded')); void browser.close() }, receipt.browserCapMs)
  if (selectedScenario !== 'snapshot-protocol') {
  context = await (gameplayBrowser ?? compactBrowser ?? browser).newContext({ viewport: ['profile-recovery', 'mission10-profile'].includes(selectedScenario) ? { width: 1440, height: 1000 } : { width: 640, height: 480 }, deviceScaleFactor: 1 })
  page = await context.newPage(); page.setDefaultTimeout(25000)
  page.on('pageerror', e => receipt.errors.push(String(e)))
  page.on('console', m => { if (m.type() === 'error') receipt.errors.push(m.text()); if (m.type() === 'warning') receipt.warnings.push(m.text()) })
  page.on('crash', () => { receipt.errors.push('Page crashed'); save() })
  }
  const url = `http://127.0.0.1:${port}`
  if (selectedScenario === 'snapshot-protocol') {
    receipt.snapshotSmoke = await (await import(pathToFileURL(snapshotScenario).href)).default({ browser, url, output: out, source, expectedRevision: receipt.buildRevision, dist })
  } else if (selectedScenario === 'frontend-held-escape') {
    receipt.frontendHeldEscape = await (await import(pathToFileURL(frontendEscapeScenario).href)).default({ page, url, output: out })
    // Preserve the completed frontend episode, then use an independent context
    // for F9. Both retain their own bounds inside the unchanged shared 180s cap.
    await context.close(); context = undefined; page = undefined
    receipt.spellTestMenu = await (await import(pathToFileURL(spellTestScenario).href)).default({ browser, url, output: out })
    // Separate natural Mission3 context, after F9, within the unchanged global cap.
    receipt.spellConversion = await (await import(pathToFileURL(spellConversionScenario).href)).default({ browser, url, output: out })
  } else if (selectedScenario === 'gameplay-resources') {
    // Separate job owns the complete five-phase workload and mandatory restart.
    // No melee/corpse work is moved or removed from the original gameplay job.
    receipt.gameplayResources = await (await import(pathToFileURL(gameplayScenario).href)).default({ page, url, output: out, expectedRevision: receipt.buildRevision, resourceLifecycle: true, resourceProfile: resourceArguments.profile, ownershipProbe: resourceArguments.ownershipProbe })
    // This await has completed all three original workloads, their metrics,
    // alias/weak-state removal and original CDP detach. No snapshot is attempted.
    if (resourceArguments.ownershipProbe === 'weak-v1') {
      const { observeGameplayProducerPreflight, recordGameplayProducerCleanup } = await import('./gameplay-heap-observer.mjs')
      producerCleanup = recordGameplayProducerCleanup
      receipt.heapProducerPreflight = await observeGameplayProducerPreflight({
        browser, page, report: receipt.gameplayResources, budget: producerBudget,
        executableSha256: receipt.browserSha256, signal: abort.signal })
    }
  } else if (selectedScenario === 'gameplay-frames') {
    receipt.gameplayFrames = await (await import(pathToFileURL(gameplayScenario).href)).default({ page, url, output: out, expectedRevision: receipt.buildRevision })
    // Keep all original exports/assertions, then release their live world before
    // the independent ordinary-combat artwork episode. Frame180 includes close.
    await context.close(); context = undefined; page = undefined
    gameplayAdmission.finishEpisode('frames', receipt.gameplayFrames)
    gameplayAdmission.begin('melee')
    receipt.meleeAttack = await (await import(pathToFileURL(meleeScenario).href)).default({ browser: gameplayBrowser, url, output: out, expectedRevision: receipt.buildRevision, admission: gameplayAdmission })
    gameplayAdmission.finishEpisode('melee', receipt.meleeAttack)
    gameplayAdmission.begin('corpse')
    // Separate ordinary follower combat and actual checkpoint continuation. No
    // performance window or existing 75-second, first-observed-entry melee assertions change.
    receipt.followerCorpse = await (await import(pathToFileURL(followerCorpseScenario).href)).default({ browser: gameplayBrowser, url, output: out, expectedRevision: receipt.buildRevision, admission: gameplayAdmission })
    gameplayAdmission.finishEpisode('corpse', receipt.followerCorpse)
  } else if (['profile-recovery', 'mission10-profile'].includes(selectedScenario)) {
    // Independent jobs. Both persistent M10 phases finish before the separate
    // Spy witness is admitted; all three retain this same fixed 180s timer.
    Object.assign(receipt, await runProfileEpisode(selectedScenario, {
      signal: abort.signal, deadlineAt: browserDeadlineAt,
      runRecovery: async () => (await import(pathToFileURL(recoveryScenario).href)).default({ browser, context, page, url, root, output: out, receipt, signal: abort.signal, deadlineAt: browserDeadlineAt }),
      // Recovery assertions/receipts are unchanged; only then run a fresh-context
      // Tornado episode inside the existing outer deadline (never a new timer).
      closeRecoveryProbe: async () => { await context.close(); context = undefined; page = undefined },
      runTornado: async ({ signal, deadlineAt }) => {
        signal.throwIfAborted()
        return (await import(pathToFileURL(tornadoScenario).href)).runTornadoAppearance(browser, {
          url, artifactDir: out, budgetMs: Math.min(90000, deadlineAt - Date.now()),
          signal, deadlineAt,
        })
      },
      closeProbe: async () => { await context.close(); context = undefined; page = undefined; await browser.close() },
      runMission10: async ({ signal, deadlineAt }) => {
        receipt.mission10Profile = await (await import(pathToFileURL(mission10ProfileScenario).href)).default({ chromium, launch: browserConfig.launch, url, root, output: out, receipt, signal, verifySource, deadlineAt })
        save() // Retain both completed phases even if the later Spy witness fails.
        return receipt.mission10Profile
      },
      runSpySource: async ({ signal, deadlineAt }) => (await import(pathToFileURL(spySourceScenario).href)).default({ chromium, launch: browserConfig.launch, url, output: out, source, signal, deadlineAt }),
    }))
  } else if (selectedScenario === 'compact-message-layout') {
    await compactAdmission.wait((await import(pathToFileURL(m2Scenario).href)).runCompactDiagnosticEpisodes({
      browser: compactBrowser, url, output: out, fixture: m2Fixture, report: receipt, admission: compactAdmission,
    }))
    // All four compact cases and the independent picking episode remain required.
    await compactAdmission.close('initial-context', context); context = undefined; page = undefined
    receipt.hypnotise = await compactAdmission.wait((await import(pathToFileURL(hypnotiseScenario).href)).default({ browser: compactBrowser, url, output: out, deadlineAt: browserDeadlineAt }))
    compactAdmission.finishCompanion('hypnotise', receipt.hypnotise)
  } else if (selectedScenario === 'm2-pointer-f8') {
    receipt.m2PointerF8 = await (await import(pathToFileURL(m2Scenario).href)).default({ browser, url, output: out, fixture: m2Fixture, deadlineAt: browserDeadlineAt, signal: abort.signal })
  } else if (selectedScenario === 'pause-checkpoint-recovery') {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
    receipt.pauseCheckpointRecovery = await (await import(pathToFileURL(pauseRecoveryScenario).href)).default({ browser, page, url, root, output: out, receipt, signal: abort.signal, deadlineAt: browserDeadlineAt })
  } else {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  receipt.result = await (await import(pathToFileURL(scenario).href)).default({ page, context, browser, url, root, output: out, receipt })
  receipt.selectorInspection = await (await import(pathToFileURL(selectorScenario).href)).default({ browser, url, output: out })
  receipt.sceneryPlacement = await (await import(pathToFileURL(sceneryScenario).href)).default({ browser, url, output: out })
  receipt.m2PointerF8 = await (await import(pathToFileURL(m2Scenario).href)).default({ browser, url, output: out, fixture: m2Fixture, deadlineAt: browserDeadlineAt, signal: abort.signal })
  }
  if (selectedScenario === 'tutorial') receipt.spellProjection = await (await import(pathToFileURL(spellProjectionScenario).href)).default({ browser, url, output: out, root, dist })
  if (selectedScenario === 'tutorial') receipt.buildingPanelIdentity = await (await import(pathToFileURL(buildingIdentityScenario).href)).default({ browser, url, output: out })
  assert.equal(receipt.browserTimedOut, undefined)
  assert.deepEqual(receipt.errors, [], 'Unexpected primary-page runtime/console errors')
  receipt.status = 'passed'
} catch (error) {
  gameplayAdmission?.fail(error)
  compactAdmission?.fail(error)
  if (error.code === 'SNAPSHOT_EPISODE_TIMEOUT') receipt.browserTimedOut = true
  receipt.status = 'failed'; receipt.failure = String(error); receipt.stack = error.stack; process.exitCode = 1
  if (page) {
    try {
      const capture = async () => { receipt.failureState = await page.evaluate(() => ({ active: document.activeElement?.outerHTML?.slice(0, 500), body: document.body.innerText.slice(0, 2500) })); await page.screenshot({ path: resolve(out, 'failure.png'), timeout: 10000 }) }
      if (compactAdmission) await compactAdmission.wait(capture())
      else await capture()
    } catch (e) { receipt.diagnosticError = String(e) }
  } else if (selectedScenario === 'snapshot-protocol') receipt.failureEvidence = 'candidate-snapshot-smoke.json'
} finally {
  clearTimeout(timer)
  if (gameplayAdmission) {
    receipt.cleanupVerified = await cleanupGameplayResources(gameplayAdmission, { context, browser, server })
    if (!receipt.cleanupVerified) {
      receipt.cleanupError = gameplayAdmission.report.cleanupErrors.join('\n'); receipt.status = 'failed'; process.exitCode = 1
    }
  } else if (compactAdmission) {
    receipt.cleanupVerified = await compactAdmission.cleanup({ context, browser, server })
    if (!receipt.cleanupVerified) {
      receipt.cleanupError = compactAdmission.report.cleanupErrors.join('\n') || 'Compact cleanup did not finish within admission'
      receipt.status = 'failed'; process.exitCode = 1
    }
  } else {
    try { await context?.close(); await browser?.close(); await server?.close(); receipt.cleanupVerified = true } catch (e) { receipt.cleanupError = String(e); receipt.status = 'failed'; process.exitCode = 1 }
  }
  if (gameplayAdmission) {
    try { if (receipt.status === 'passed') gameplayAdmission.complete() }
    catch (error) { gameplayAdmission.fail(error); receipt.failure ??= String(error); receipt.status = 'failed'; process.exitCode = 1 }
    finally { gameplayAdmission.dispose() }
  }
  if (compactAdmission) {
    try { if (receipt.status === 'passed') compactAdmission.complete() }
    catch (error) { compactAdmission.fail(error); receipt.failure ??= String(error); receipt.status = 'failed'; process.exitCode = 1 }
    finally { compactAdmission.dispose() }
  }
  // The original timer is already cleared. Report actual remaining time, even
  // negative, without claiming an independently enforced cleanup deadline.
  if (receipt.heapProducerPreflight) producerCleanup(receipt.heapProducerPreflight, performance.now(), receipt.cleanupVerified)
  try { verifySource(); receipt.sourceAfter = 'identical'; if (receipt.outputManifest) assert.deepEqual(outputManifest(dist), receipt.outputManifest) } catch (e) { receipt.sourceAfter = String(e); receipt.status = 'failed'; process.exitCode = 1 }
  if (m2Fixture) {
    try {
      assert.equal(hash(resolve(out, 'm2-checkpoint-transfer.json')), m2Fixture.receipt.transferSha256)
      assert.equal(hash(resolve(out, 'm2-checkpoint.v8')), m2Fixture.receipt.checkpointSha256)
      receipt.m2FixtureUnchanged = true
    } catch (e) { receipt.m2FixtureError = String(e); receipt.status = 'failed'; process.exitCode = 1 }
  }
  const after = metadata(dependencies)
  receipt.dependencyChanges = Object.keys({ ...before, ...after }).filter(key => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
  receipt.dependenciesAfterSha256 = createHash('sha256').update(JSON.stringify(after)).digest('hex')
  if (receipt.dependencyChanges.length) { receipt.status = 'failed'; process.exitCode = 1 }
  receipt.endedAt = new Date().toISOString(); save()
  if (selectedScenario === 'pause-checkpoint-recovery' && receipt.status === 'passed') {
    try { console.log(recoveryReceiptLog(recoveryReceipt(receipt, out))) }
    catch (error) {
      receipt.evidenceError = String(error); receipt.failure ??= receipt.evidenceError
      receipt.status = 'failed'; process.exitCode = 1; save()
    }
  }
  if (selectedScenario === 'profile-recovery' && receipt.status === 'passed') {
    try { console.log(profileCasesReceiptLog(profileCasesReceipt(receipt, out))) }
    catch (error) {
      receipt.evidenceError = String(error); receipt.failure ??= receipt.evidenceError
      receipt.status = 'failed'; process.exitCode = 1; save()
    }
  }
  if (selectedScenario === 'mission10-profile' && receipt.status === 'passed') {
    try { console.log(mission10CrewReceiptLog(mission10CrewReceipt(receipt, out))) }
    catch (error) {
      receipt.evidenceError = String(error); receipt.failure ??= receipt.evidenceError
      receipt.status = 'failed'; process.exitCode = 1; save()
    }
  }
  console.log(JSON.stringify({ status: receipt.status, failure: receipt.failure, cleanupVerified: receipt.cleanupVerified, output: out }))
}
