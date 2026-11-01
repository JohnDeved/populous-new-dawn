import './native-ui-receipt.test.mjs'
import './native-ui-pause-acceptance.test.mjs'
import test from 'node:test'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, symlinkSync, rmSync, accessSync, constants } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, dirname } from 'node:path'
import vm from 'node:vm'
import yaml from 'js-yaml'
import { manualIdentity, separateRoots, sourceManifest, verifyManifest, homeBuildOptions,
  candidateDependency, candidateDependencyExport, infrastructureInput } from '../scripts/native-ui-evidence/identity.mjs'
import { assertAudioGroup, assertAudioResult } from '../scripts/native-ui-evidence/audio-acceptance.mjs'
import { episodes, limits, acceptEpisode, acceptSeries, boundedEpisode } from '../scripts/native-ui-evidence/policy.mjs'
import { artifactInventory, ownBrowser, pageActionTimeout } from '../scripts/native-ui-evidence/browser-owner.mjs'
import { supervise } from '../scripts/native-ui-evidence/supervise.mjs'
import { observeOptionsStorage, assertOptionsCopyClearance } from '../scripts/native-ui-evidence/options-copy-clearance.mjs'
import { failPreferenceWrites, optionsViewportReady } from '../scripts/native-ui-evidence/options-storage-notice-style.mjs'
import { createAudioOptionsBudget } from '../scripts/browser-options-audio.mjs'
import { holdAudioResume, soundControlPending, soundOwnership, assertSoundOwnership,
  pendingSoundPointerTarget, assertPendingSoundPointerTarget, prepareSoundPopup, closeSoundContext, finalizeSoundContext, saveSoundTrace, assertPreparedSoundPopup, assertAudioWorldUnchanged, tabToAudioControl, assertBrowserControlOwners } from '../scripts/native-ui-evidence/options-audio-control-style.mjs'
import runCombinedAudioStyle, { runNativeAudioStyle, runFallbackAudioStyle } from '../scripts/native-ui-evidence/options-audio-control-style.mjs'
import { ordinaryMission, assertMissionInputBudget, saveMissionInputTrace } from '../scripts/native-ui-evidence/ordinary-mission.mjs'
import { runNativeUiEvidence } from '../scripts/native-ui-evidence/adapter.mjs'
import { directoryManifest, publicLinks, verifyBuiltOutput, afterScopes } from '../scripts/native-ui-evidence/files.mjs'
import { initializeEpisodeLedger, recordUnstartedFailure } from '../scripts/native-ui-evidence/ledger.mjs'

const read = name => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8')
const goodEnv = () => ({ GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_REPOSITORY: 'JohnDeved/populous-new-dawn',
  GITHUB_REF: 'refs/heads/main', GITHUB_WORKFLOW_REF: 'JohnDeved/populous-new-dawn/.github/workflows/native-ui-evidence.yml@refs/heads/main',
  GITHUB_SHA: 'a'.repeat(40), GITHUB_WORKFLOW_SHA: 'a'.repeat(40), PND_UI_CANDIDATE_SHA: 'b'.repeat(40) })
function fixture(t) {
  const root = mkdtempSync(resolve(tmpdir(), 'pnd-ui-evidence-unit-'))
  t.after(() => rmSync(root, { recursive: true, force: true })) // Only this test's freshly created fixture.
  return root
}
function put(root, name, content = '') { const path = resolve(root, name); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, content); return path }

test('manual identity keeps exact candidate, workflow and real event SHAs distinct', () => {
  const env = goodEnv(), identity = manualIdentity(env)
  assert.equal(identity.candidateSha, 'b'.repeat(40)); assert.equal(identity.workflowSha, 'a'.repeat(40))
  assert.equal(identity.eventSha, env.GITHUB_SHA); assert.equal(env.GITHUB_SHA, 'a'.repeat(40))
})
test('source override rejects PR, feature ref, another workflow/repository, malformed SHA and event mismatch', () => {
  for (const [key, value] of [['GITHUB_EVENT_NAME', 'pull_request'], ['GITHUB_EVENT_NAME', 'pull_request_target'],
    ['GITHUB_REF', 'refs/heads/feature'], ['GITHUB_REPOSITORY', 'someone/fork'], ['GITHUB_WORKFLOW_REF', 'other'],
    ['GITHUB_WORKFLOW_SHA', 'c'.repeat(40)], ['PND_UI_CANDIDATE_SHA', 'main'], ['PND_UI_CANDIDATE_SHA', 'A'.repeat(40)]]) {
    assert.throws(() => manualIdentity({ ...goodEnv(), [key]: value }), undefined, key)
  }
  assert.throws(() => manualIdentity({}))
})
test('canonical source roots reject same, nested and symlink alias roots', t => {
  const root = fixture(t), candidate = resolve(root, 'candidate'), infrastructure = resolve(root, 'infrastructure')
  mkdirSync(candidate); mkdirSync(infrastructure); mkdirSync(resolve(candidate, 'nested'))
  assert.deepEqual(separateRoots(candidate, infrastructure), { candidateRoot: candidate, infrastructureRoot: infrastructure })
  assert.throws(() => separateRoots(candidate, candidate))
  assert.throws(() => separateRoots(candidate, resolve(candidate, 'nested')))
  symlinkSync(candidate, resolve(root, 'alias'))
  assert.throws(() => separateRoots(resolve(root, 'alias'), infrastructure))
  assert.throws(() => separateRoots('relative', infrastructure))
})
test('source manifests bind Git bytes/modes and reject post-check mutation', t => {
  const root = fixture(t)
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  git('init', '-q'); put(root, 'app/page.tsx', 'export default 1\n'); put(root, 'public/a.png', 'image')
  git('add', '.'); git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'fixture')
  const head = git('rev-parse', 'HEAD'), manifest = sourceManifest(root, head)
  assert.deepEqual(Object.keys(manifest.files), ['app/page.tsx', 'public/a.png'])
  assert.equal(manifest.files['public/a.png'].mode, '100644'); verifyManifest(root, manifest)
  assert.throws(() => sourceManifest(root, 'b'.repeat(40)))
  put(root, 'app/page.tsx', 'export default 2\n'); assert.throws(() => verifyManifest(root, manifest))
})
test('builder selects candidate Home, CSS, Tailwind root, revision and output, never infrastructure app', t => {
  const root = fixture(t), candidate = resolve(root, 'candidate'), infrastructure = resolve(root, 'infrastructure')
  put(candidate, 'scripts/tutorial-browser/fixture/main.tsx', "import Home from '../../../app/page'\nimport '../../../app/globals.css'\n")
  put(candidate, 'app/page.tsx', 'candidate'); put(candidate, 'app/globals.css', 'candidate-css')
  put(infrastructure, 'app/page.tsx', 'wrong app'); put(infrastructure, 'app/globals.css', 'wrong css')
  const options = homeBuildOptions(candidate, resolve(root, 'dist'), 'b'.repeat(40), {
    react: () => 'react', tailwindcss: options => ({ tailwind: options }),
  })
  assert.equal(options.root, resolve(candidate, 'scripts/tutorial-browser/fixture'))
  assert.equal(options.define.__PND_BUILD_REVISION__, JSON.stringify('b'.repeat(40)))
  assert.deepEqual(options.css.postcss.plugins, [{ tailwind: { base: candidate } }])
  assert.equal(options.publicDir, false); assert.equal(options.configFile, false); assert.equal(options.build.copyPublicDir, false)
  assert.equal(options.build.outDir, resolve(root, 'dist'))
  put(candidate, 'scripts/tutorial-browser/fixture/main.tsx', "import Home from '/wrong/app/page'\n")
  assert.throws(() => homeBuildOptions(candidate, '/output', 'b'.repeat(40), {}))
})
test('dependency resolution uses only the candidate installation and rejects escaped package links', t => {
  const root = fixture(t), candidate = resolve(root, 'candidate')
  put(candidate, 'package.json', '{"type":"module"}')
  put(candidate, 'node_modules/demo/package.json', '{"name":"demo","main":"index.js"}')
  const entry = put(candidate, 'node_modules/demo/index.js', 'module.exports = 1')
  assert.equal(candidateDependency(candidate, 'demo'), new URL(`file://${entry}`).href)
  put(root, 'outside/package.json', '{"name":"escape","main":"index.js"}'); put(root, 'outside/index.js', 'module.exports = 2')
  symlinkSync(resolve(root, 'outside'), resolve(candidate, 'node_modules/escape'))
  assert.throws(() => candidateDependency(candidate, 'escape'), /escaped/)
})
test('candidate dependency exports accept actual CJS default and ESM named namespaces without changing roots', async t => {
  const root = fixture(t), candidate = resolve(root, 'candidate')
  put(candidate, 'package.json', '{"type":"module"}')
  put(candidate, 'node_modules/common/package.json', '{"name":"common","main":"index.cjs"}')
  // Computed keys reproduce Playwright: Node cannot synthesize a chromium named export.
  put(candidate, 'node_modules/common/index.cjs', "module.exports = Object.fromEntries([['chromium', { launch() {} }]])")
  const commonNamespace = await import(candidateDependency(candidate, 'common'))
  assert.equal(commonNamespace.chromium, undefined)
  assert.equal(await candidateDependencyExport(candidate, 'common', 'chromium'), commonNamespace.default.chromium)
  put(candidate, 'node_modules/esm-fixture/package.json', '{"name":"esm-fixture","type":"module","main":"index.js"}')
  put(candidate, 'node_modules/esm-fixture/index.js', 'export const chromium = { launch() {} }; export default { chromium }')
  const moduleNamespace = await import(candidateDependency(candidate, 'esm-fixture'))
  assert.equal(await candidateDependencyExport(candidate, 'esm-fixture', 'chromium'), moduleNamespace.chromium)
})
test('candidate dependency exports reject missing, invalid, ambiguous and escaped namespaces', async t => {
  const root = fixture(t), candidate = resolve(root, 'candidate')
  put(candidate, 'package.json', '{"type":"module"}')
  for (const [name, code, error] of [
    ['missing', 'export default {}', /Missing/],
    ['null', 'export const chromium = null', /Invalid/],
    ['primitive', 'export default { chromium: 7 }', /Invalid/],
    ['ambiguous', 'export const chromium = {}; export default { chromium: {} }', /Ambiguous/],
  ]) {
    put(candidate, `node_modules/${name}/package.json`, JSON.stringify({ name, type: 'module', main: 'index.js' }))
    put(candidate, `node_modules/${name}/index.js`, code)
    await assert.rejects(candidateDependencyExport(candidate, name, 'chromium'), error)
  }
  put(root, 'outside/package.json', '{"name":"escape","main":"index.js"}')
  put(root, 'outside/index.js', 'module.exports = { chromium: { launch() {} } }')
  symlinkSync(resolve(root, 'outside'), resolve(candidate, 'node_modules/escape'))
  await assert.rejects(candidateDependencyExport(candidate, 'escape', 'chromium'), /escaped/)
})
test('installed candidate Playwright import exposes chromium without launching any browser', async () => {
  const chromium = await candidateDependencyExport(resolve(import.meta.dirname, '..'), '@playwright/test', 'chromium')
  assert.equal(typeof chromium.launch, 'function')
  assert.equal(chromium.name(), 'chromium')
  const worker = read('scripts/native-ui-evidence/browser-worker.mjs')
  assert.match(worker, /candidateDependencyExport\(candidateRoot, '@playwright\/test', 'chromium'\)/)
  assert.match(worker, /typeof chromium\?\.launch, 'function'/)
})
test('trusted manifest includes adapter, new episodes, Chrome policy and exact workflow', () => {
  for (const path of ['scripts/native-ui-evidence/adapter.mjs', 'scripts/native-ui-evidence/options-storage-notice-style.mjs',
    'scripts/native-ui-evidence/options-audio-control-style.mjs', 'scripts/browser-options-audio.mjs', 'scripts/tutorial-browser/browser-config.mjs', '.github/workflows/native-ui-evidence.yml']) assert.equal(infrastructureInput(path), true)
  assert.equal(infrastructureInput('app/page.tsx'), false)
})
test('all nine supplements are mandatory with fixed ownership and unchanged 720-second new budget', () => {
  assert.deepEqual(episodes.map(e => e.id), ['startup-logo', 'selector-recovery', 'options-storage', 'checkpoint-notice', 'options-audio-native', 'options-audio-fallback', 'loading-recovery', 'pause-checkpoint-native', 'pause-checkpoint-fallback'])
  assert.equal(episodes.filter(e => e.owner === 'candidate').length, 6)
  assert.deepEqual(episodes.filter(e => e.owner === 'infrastructure').map(e => e.id), ['options-storage', 'options-audio-native', 'options-audio-fallback'])
  assert.deepEqual(episodes.map(e => e.capMs), [120000, 120000, 90000, 90000, 90000, 90000, 90000, 90000, 90000])
  assert.deepEqual(limits, { buildMs: 120000, browserMs: 720000, jobMinutes: 20, maxContexts: 2, maxPages: 2,
    screenshots: 100, artifactBytes: 268435456, logBytes: 8388608, heapMiB: 768, cleanupMs: 5000 })
})
test('dependency-import and Chrome-prelaunch failures retain nine explicit unexecuted records', async t => {
  for (const stage of ['candidate-dependency-import', 'chrome-provenance']) {
    const root = fixture(t), candidate = resolve(root, 'candidate')
    put(candidate, 'package.json', '{"type":"module"}')
    initializeEpisodeLedger(root)
    const initial = JSON.parse(readFileSync(resolve(root, 'episodes.json'), 'utf8'))
    assert.equal(initial.status, 'not-run'); assert.equal(initial.cleanupVerified, false)
    let failure
    try {
      if (stage === 'candidate-dependency-import') await candidateDependencyExport(candidate, 'missing-browser-package', 'chromium')
      else accessSync(resolve(root, 'missing-chrome'), constants.X_OK)
    } catch (error) { failure = error; recordUnstartedFailure(root, stage, error) }
    assert.ok(failure)
    const report = JSON.parse(readFileSync(resolve(root, 'episodes.json'), 'utf8'))
    assert.equal(report.status, 'failed'); assert.equal(report.failureStage, stage)
    assert.equal(report.failure, String(failure)); assert.equal(report.cleanupVerified, false)
    assert.deepEqual(report.episodes.map(record => record.id), episodes.map(episode => episode.id))
    assert.ok(report.episodes.every(record => record.status === 'not-run' && !record.cleanupVerified && !record.timedOut))
    assert.throws(() => acceptSeries(report.episodes))
    recordUnstartedFailure(root, 'browser-worker', Error('aggregate failure'))
    assert.deepEqual(JSON.parse(readFileSync(resolve(root, 'episodes.json'), 'utf8')), report)
  }
})
test('parent persists initial ledger before build and worker failures cannot replace actual episode outcomes', t => {
  const runner = read('scripts/native-ui-evidence/run.mjs'), worker = read('scripts/native-ui-evidence/browser-worker.mjs')
  assert.ok(runner.indexOf('initializeEpisodeLedger(output)') < runner.indexOf('candidateSource = sourceManifest'))
  assert.match(runner, /recordUnstartedFailure\(output, stage, error\)/)
  assert.ok(worker.indexOf('try {') < worker.indexOf('await candidateDependencyExport'))
  assert.match(worker, /stage = 'chrome-launch'/)
  assert.match(worker, /recordUnstartedFailure\(output, stage, error\)/)
  const root = fixture(t)
  initializeEpisodeLedger(root)
  const file = resolve(root, 'episodes.json'), report = JSON.parse(readFileSync(file, 'utf8'))
  report.status = 'failed'; report.episodes[0].status = 'failed'; report.episodes[0].error = 'original UI assertion'
  writeFileSync(file, JSON.stringify(report))
  const before = readFileSync(file)
  recordUnstartedFailure(root, 'browser-worker', Error('aggregate failure'))
  assert.deepEqual(readFileSync(file), before)
})
test('baseline, skipped, missing, failed, cancelled and late-success episodes cannot pass aggregate', () => {
  for (const bad of [null, undefined, { baseline: true }, { skipped: true }, { status: 'failed' }, { status: 'skipped' }, { status: 'cancelled' }]) assert.throws(() => acceptEpisode(bad))
  const good = episodes.map(e => ({ id: e.id, status: 'passed', timedOut: false, cleanupVerified: true, result: { checks: ['real assertions'] } }))
  for (const record of good) {
    const mode = episodes.find(e => e.id === record.id).pauseMode
    if (mode) record.result = pauseResult(mode)
    const audioMode = episodes.find(e => e.id === record.id).audioMode
    if (audioMode) record.result = audioResult(audioMode)
  }
  acceptSeries(good)
  for (const bad of [good.slice(1), [...good].reverse(), good.map((r, i) => i ? r : { ...r, timedOut: true }),
    good.map((r, i) => i ? r : { ...r, cleanupVerified: false })]) assert.throws(() => acceptSeries(bad))
})
test('bounded episode settles cleanup before its caller can advance', async () => {
  const events = []
  const result = await boundedEpisode(async () => { events.push('run'); return { status: 'passed' } }, {
    capMs: 1000, close: async () => events.push('closed'), signal: new AbortController().signal,
  })
  assert.equal(result.status, 'passed'); assert.deepEqual(events, ['run', 'closed'])
})
test('timeout stays failed even if cleanup releases a late successful operation', async () => {
  let fire, finish, observedAbort = false
  const result = boundedEpisode(signal => new Promise(resolve => {
    finish = resolve; signal.addEventListener('abort', () => { observedAbort = true })
  }), { capMs: 1, signal: new AbortController().signal, setTimer: callback => { fire = callback; return 1 },
    clearTimer() {}, close: async () => finish({ status: 'passed' }) })
  await Promise.resolve(); fire()
  await assert.rejects(result, /deadline/); assert.equal(observedAbort, true)
})
test('upstream abort and failed cleanup are never accepted as episode success', async () => {
  const abort = new AbortController(); abort.abort(new Error('parent stopped'))
  await assert.rejects(boundedEpisode(async () => ({ status: 'passed' }), { capMs: 1000, close: async () => {}, signal: abort.signal }), /parent stopped/)
  await assert.rejects(boundedEpisode(async () => ({ status: 'passed' }), { capMs: 1000, close: async () => { throw Error('cleanup failed') } }), /cleanup failed/)
})
test('monotonic deadline rejects synchronous late success even before timer delivery', async () => {
  let clock = 0
  await assert.rejects(boundedEpisode(async () => { clock = 2; return { status: 'passed' } }, {
    capMs: 1, now: () => clock, setTimer: () => 1, clearTimer() {}, close: async () => {},
  }), /deadline/)
})
test('primary assertion remains primary when cleanup also fails', async () => {
  const primary = Error('original assertion')
  await assert.rejects(boundedEpisode(async () => { throw primary }, { capMs: 1000,
    close: async () => { throw Error('close also failed') } }), error => {
    assert.equal(error, primary); assert.equal(error.cleanupError, 'Error: close also failed'); return true
  })
})

class Page extends EventEmitter {
  routes = new Map()
  closed = false
  setDefaultTimeout() {} setDefaultNavigationTimeout() {}
  async route(pattern, handler) { this.routes.set(pattern, handler) }
  async unroute(pattern) { this.routes.delete(pattern) }
  async screenshot({ path }) { writeFileSync(path, 'PNG'); return Buffer.from('PNG') }
  async evaluate() { return { viewport: { width: 640, height: 480 }, dpr: 1, userAgent: 'fixture', renderers: [] } }
  async close() { this.closed = true; this.emit('close') }
}
class Context extends Page {
  children = []
  pages() { return this.children.filter(page => !page.closed) }
  async newPage() { const page = new Page(); this.children.push(page); this.emit('page', page); return page }
  async close() { this.children = []; this.emit('close') }
}
const report = () => ({ errors: [], warnings: [], expectedErrors: [], injectedRequests: [], observations: [] })
const fakeBrowser = () => ({ async newContext() { return new Context() }, async close() {} })
test('owner enforces two contexts, blocks late resource creation and cleans serial episodes', async t => {
  const owner = ownBrowser(fakeBrowser(), fixture(t), report())
  await assert.rejects(owner.browser.newContext(), /not admitting/)
  owner.beginEpisode(); await owner.browser.newContext(); await owner.browser.newContext()
  await assert.rejects(owner.browser.newContext(), /Context budget/)
  await owner.closeContexts(); await assert.rejects(owner.browser.newContext(), /not admitting/)
  owner.beginEpisode(); await owner.browser.newContext(); await owner.close()
  assert.throws(() => owner.beginEpisode())
})
test('owner enforces two pages even across different contexts', async t => {
  const owner = ownBrowser(fakeBrowser(), fixture(t), report()); owner.beginEpisode()
  const a = await owner.browser.newContext(), b = await owner.browser.newContext()
  await a.newPage(); await b.newPage(); await assert.rejects(b.newPage(), /Page budget/)
  await owner.close()
})
test('concurrent contexts reserve capacity before awaiting creation', async t => {
  const resolves = [], raw = { newContext: () => new Promise(resolve => resolves.push(resolve)), async close() {} }
  const owner = ownBrowser(raw, fixture(t), report()); owner.beginEpisode()
  const a = owner.browser.newContext(), b = owner.browser.newContext()
  await assert.rejects(owner.browser.newContext(), /Context budget/)
  assert.equal(resolves.length, 2)
  resolves[0](new Context()); resolves[1](new Context()); await Promise.all([a, b]); await owner.close()
})
test('late pending context is closed and cannot reenter a later episode', async t => {
  let finish
  const raw = { newContext: () => new Promise(resolve => { finish = resolve }), async close() {} }
  const owner = ownBrowser(raw, fixture(t), report()); owner.beginEpisode()
  const pending = owner.browser.newContext(), rejected = assert.rejects(pending, /Late context/)
  await Promise.resolve()
  const closing = owner.closeContexts(), context = new Context(); let closes = 0
  context.close = async () => { closes++; context.emit('close') }
  finish(context); await closing; await rejected; assert.equal(closes, 1)
  owner.beginEpisode(); await owner.close()
})
test('pending page creation reserves capacity and late pages are closed before cleanup settles', async t => {
  const context = new Context(), finish = []
  context.newPage = () => new Promise(resolve => finish.push(() => {
    const page = new Page(); context.children.push(page); context.emit('page', page); resolve(page)
  }))
  const raw = { async newContext() { return context }, async close() {} }
  const owner = ownBrowser(raw, fixture(t), report()); owner.beginEpisode()
  const owned = await owner.browser.newContext(), a = owned.newPage(), b = owned.newPage()
  const rejected = Promise.all([assert.rejects(a, /Late page/), assert.rejects(b, /Late page/)])
  await assert.rejects(owned.newPage(), /Page budget/)
  const closing = owner.closeContexts()
  finish.forEach(resolve => resolve()); await rejected; await closing
  assert.equal(context.pages().length, 0); await owner.close()
})
test('all nine explicit not-run records survive abort before the first episode', async t => {
  const output = fixture(t), abort = new AbortController(); abort.abort(Error('stop before first'))
  await assert.rejects(runNativeUiEvidence({ browser: fakeBrowser(), output, signal: abort.signal }), /stop before first/)
  const receipt = JSON.parse(readFileSync(resolve(output, 'episodes.json')))
  assert.deepEqual(receipt.episodes.map(record => record.id), episodes.map(episode => episode.id))
  assert.ok(receipt.episodes.every(record => record.status === 'not-run')); assert.equal(receipt.status, 'failed')
})
test('attempt failure remains primary with later episodes not-run and cleanup separately retained', async t => {
  const output = fixture(t), browser = { async newContext() { throw Error('primary creation failed') }, async close() { throw Error('final cleanup failed') } }
  await assert.rejects(runNativeUiEvidence({ browser, output, signal: new AbortController().signal }), error => {
    assert.match(String(error), /primary creation failed/); assert.match(error.cleanupError, /final cleanup failed/); return true
  })
  const receipt = JSON.parse(readFileSync(resolve(output, 'episodes.json')))
  assert.equal(receipt.episodes[0].status, 'failed'); assert.match(receipt.episodes[0].error, /primary creation failed/)
  assert.ok(receipt.episodes.slice(1).every(record => record.status === 'not-run'))
  assert.match(receipt.cleanupError, /final cleanup failed/)
})
test('expected resource errors require a concrete injected URL and cannot exempt repeated or runtime errors', async t => {
  const evidence = report(), owner = ownBrowser(fakeBrowser(), fixture(t), evidence); owner.beginEpisode()
  const context = await owner.browser.newContext(), page = await context.newPage()
  await page.route('resource', route => route.abort('failed'))
  await page.routes.get('resource')({ request: () => ({ url: () => 'http://host/expected.png' }), abort: async () => {} })
  const error = url => ({ type: () => 'error', text: () => 'Failed to load resource: net::ERR_FAILED', location: () => ({ url }) })
  page.emit('console', error('http://host/unrelated.png')); page.emit('console', error('http://host/expected.png'))
  page.emit('console', error('http://host/expected.png')); page.emit('pageerror', Error('real runtime failure'))
  assert.equal(evidence.expectedErrors.length, 1); assert.equal(evidence.errors.length, 3)
  assert.equal(evidence.expectedErrors[0].injection.url, 'http://host/expected.png')
  await owner.close()
})
test('screenshots stay in evidence root and fail closed after cleanup or count exhaustion', async t => {
  const root = fixture(t), owner = ownBrowser(fakeBrowser(), root, report()); owner.beginEpisode()
  const page = await (await owner.browser.newContext()).newPage()
  await assert.rejects(page.screenshot({ path: resolve(root, '../escape.png') }), /remain/)
  await page.screenshot({ path: resolve(root, 'one.png') })
  assert.equal(artifactInventory(root).screenshots, 1)
  await owner.closeContexts(); await assert.rejects(page.screenshot({ path: resolve(root, 'late.png') }), /cleanup/)
  for (let i = 0; i < 100; i++) put(root, `${i}.png`)
  assert.throws(() => artifactInventory(root), /Screenshot budget/)
  await owner.close()
})
test('artifact inventory rejects source or dependency links', t => {
  const root = fixture(t); symlinkSync('/unused', resolve(root, 'source'))
  assert.throws(() => artifactInventory(root), /must not link/)
})
test('supervised command records actual exit and preserves raw bounded output', async t => {
  const root = fixture(t), log = resolve(root, 'run.log')
  const result = await supervise(['-e', 'console.log("actual child"); process.exitCode=3'], { cwd: root, log, capMs: 2000 })
  assert.equal(result.exitCode, 3); assert.equal(result.status, 'failed'); assert.match(readFileSync(log, 'utf8'), /actual child/)
})
test('supervised timeout cannot report success from a late child', async t => {
  const root = fixture(t)
  const result = await supervise(['-e', 'setTimeout(()=>process.exit(0),5000)'], { cwd: root, log: resolve(root, 'timeout.log'), capMs: 100 })
  assert.equal(result.status, 'failed'); assert.match(result.failure, /deadline/)
})
test('preference fixture fails each key independently while the other write and reads still work', () => {
  const sandbox = { window: {}, DOMException, Storage: class { data = new Map(); setItem(key, value) { this.data.set(key, value) } getItem(key) { return this.data.get(key) } } }
  vm.runInNewContext(`(${failPreferenceWrites.toString()})()`, sandbox)
  const storage = new sandbox.Storage(); storage.setItem('unrelated', 'unchanged'); assert.equal(storage.getItem('unrelated'), 'unchanged')
  for (const key of ['populous-audio-preferences', 'populous-game-preferences']) {
    sandbox.window.blockedPreferenceKey = key
    assert.throws(() => storage.setItem(key, 'x'), /Controlled/)
    const other = key === 'populous-audio-preferences' ? 'populous-game-preferences' : 'populous-audio-preferences'
    storage.setItem(other, 'allowed'); assert.equal(storage.getItem(other), 'allowed')
  }
  assert.deepEqual([...sandbox.window.preferenceWriteFailures].sort(), ['populous-audio-preferences', 'populous-game-preferences'])
})
test('audio fixture holds/rejects only resume and restores the real implementation for recovery', async () => {
  let originalCalls = 0
  const sandbox = { window: {}, DOMException, AudioContext: class { async resume() { originalCalls++; return 'real' } } }
  vm.runInNewContext(`(${holdAudioResume.toString()})()`, sandbox)
  const context = new sandbox.AudioContext(), pending = context.resume()
  assert.equal(sandbox.window.observedSoundContext, context)
  assert.equal(sandbox.window.soundResumeAttempts, 1); assert.equal(originalCalls, 0)
  sandbox.window.rejectSoundResume(); await assert.rejects(pending, /Controlled/)
  sandbox.window.restoreSoundResume(); assert.equal(await context.resume(), 'real'); assert.equal(originalCalls, 1)
})
test('sound pending wait accepts native or ARIA disable without accepting missing controls or mismatched busy states', () => {
  for (const disabled of [false, true]) for (const ariaDisabled of [null, 'false', 'true']) for (const pending of [false, true]) {
    const node = { disabled, getAttribute: name => name === 'aria-disabled' ? ariaDisabled : String(pending) }
    const sandbox = { document: { querySelector: () => node }, pending }
    const actual = vm.runInNewContext(`(${soundControlPending.toString()})(pending)`, sandbox)
    assert.equal(actual, (disabled || ariaDisabled === 'true') === pending)
    node.getAttribute = name => name === 'aria-disabled' ? ariaDisabled : String(!pending)
    assert.equal(vm.runInNewContext(`(${soundControlPending.toString()})(pending)`, sandbox), false)
  }
  for (const pending of [false, true]) assert.equal(vm.runInNewContext(`(${soundControlPending.toString()})(pending)`, {
    document: { querySelector: () => null }, pending,
  }), false)
})
function audioOwnershipFixture() {
  const f = { world: { paused: true, inputMask: 0, status: 'playing', time: 12, randomState: 37, units: [{ id: 1, x: 4 }] },
    control: { tagName: 'BUTTON', getAttribute: () => '♫ Enable sound' },
    body: { tagName: 'BODY', getAttribute: () => null }, popups: [{ dataset: { messageSerial: '17' } }] }
  f.scene = { world: f.world, focusPauseOwned: false, overviewActive: false, overviewStage: null, keys: new Set(),
    gameClock: { animationFrame: 7, animationTime: .3 }, camera: { position: { toArray: () => [1, 2, 3] } } }
  f.modal = { tagName: 'DIALOG', getAttribute: () => 'Game menu', open: true, dataset: { panel: 'options' },
    matches: () => true, querySelector: () => f.control, querySelectorAll: () => [f.control] }
  f.dialogs = [f.modal]
  f.document = { activeElement: f.control, body: f.body, querySelector: () => f.modal,
    querySelectorAll: selector => selector === 'dialog[open]' ? f.dialogs : f.popups }
  f.window = { testStore: { getWorld: () => f.world }, testSceneRef: { current: f.scene } }
  f.snapshot = () => JSON.parse(JSON.stringify(vm.runInNewContext(`(${soundOwnership.toString()})()`, f)))
  return f
}
test('Options audio preserves actual modal, focus, pause, clock, camera and popup ownership', () => {
  const f = audioOwnershipFixture(), before = f.snapshot(); assertSoundOwnership(before, before)
  for (const mutate of [
    f => f.document.activeElement = f.body, f => f.world.paused = false, f => f.world.inputMask = 1,
    f => f.scene.world = {}, f => f.scene.overviewActive = true, f => f.scene.focusPauseOwned = true,
    f => f.scene.keys.add(' '), f => f.popups[0].dataset.messageSerial = '18', f => f.popups = [],
    f => f.dialogs = [], f => f.dialogs.push(f.modal), f => f.modal.open = false,
    f => f.modal.matches = () => false, f => f.modal.dataset.panel = 'root', f => f.modal.querySelectorAll = () => [],
    f => f.scene.gameClock.animationFrame++, f => f.scene.gameClock.animationTime++,
    f => f.scene.camera.position.toArray = () => [4, 2, 3],
  ]) {
    const bad = audioOwnershipFixture(); mutate(bad)
    assert.throws(() => assertSoundOwnership(before, bad.snapshot()))
  }
  for (const nativeBlurOwner of ['body', 'modal']) {
    f.document.activeElement = f[nativeBlurOwner]
    const observed = f.snapshot()
    assert.equal(observed.focused, false)
    assert.doesNotThrow(() => assertSoundOwnership(before, observed, { disabledBlur: true }))
    assert.throws(() => assertSoundOwnership(before, observed))
  }
  f.document.activeElement = { tagName: 'BUTTON', getAttribute: () => 'Unrelated control' }
  assert.throws(() => assertSoundOwnership(before, f.snapshot(), { disabledBlur: true }))
  f.document.activeElement = f.body; f.modal.matches = () => false
  assert.throws(() => assertSoundOwnership(before, f.snapshot(), { disabledBlur: true }), /Options modal/)
})
test('failed audio ownership preserves the exact evaluated phase snapshot before throwing', async t => {
  const root = fixture(t), file = resolve(root, 'options-audio.json')
  const source = read('scripts/native-ui-evidence/options-audio-control-style.mjs')
  const match = source.match(/const preserved = (async \(phase, options = \{\}\) => \{[\s\S]+?\n        \})/)
  assert.ok(match, 'Execute the shipped observation callback, not a reconstructed recorder')
  for (const failure of ['focus', 'world', 'popup', 'modal']) {
    const f = audioOwnershipFixture(), before = f.snapshot()
    if (failure === 'focus') f.document.activeElement = f.body
    else if (failure === 'world') f.world.paused = false
    else if (failure === 'popup') f.popups = []
    else f.modal.matches = () => false
    const observed = f.snapshot(), report = { checks: [] }
    let reads = 0, saves = 0
    const preserved = vm.runInNewContext(`(${match[1]})`, {
      page: { evaluate: async callback => { assert.equal(callback, soundOwnership); reads++; return observed } },
      soundOwnership, assertSoundOwnership, before, fallback: true, report,
      step: createAudioOptionsBudget({ timeout: 5000 }).step,
      save: () => { saves++; writeFileSync(file, JSON.stringify(report)) },
    })
    await assert.rejects(preserved(`pending-${failure}`), /Audio focus|pause or gameplay ownership|campaign popup|Options modal/)
    assert.equal(reads, 1); assert.equal(saves, 1)
    assert.equal(report.checks[0].ownership, observed)
    assert.deepEqual(JSON.parse(readFileSync(file, 'utf8')), {
      checks: [{ fallback: true, phase: `pending-${failure}`, ownership: observed }],
    })
    if (failure === 'focus') assert.deepEqual(observed.activeElement, { tag: 'BODY', label: null })
  }
})
test('audio oracle compares complete serialized World and permits only the exact failure notice', async () => {
  const baseline = audioOwnershipFixture().world, snapshot = JSON.stringify(baseline)
  let world = structuredClone(baseline), transferred
  const page = { evaluate: async (fn, arg) => {
    transferred = vm.runInNewContext(`(${fn.toString()})(arg)`, { arg, window: { testStore: { getWorld: () => world } } })
    return transferred
  } }
  await assertAudioWorldUnchanged(page, snapshot)
  assert.equal(transferred, true, 'Passing full-world comparisons do not transfer large snapshots')
  for (const mutate of [w => w.randomState++, w => w.units[0].x++, w => w.time++, w => w.unknown = true]) {
    world = structuredClone(baseline); mutate(world)
    await assert.rejects(assertAudioWorldUnchanged(page, snapshot), error => {
      assert.equal(error.actual, JSON.stringify(world)); assert.equal(error.expected, snapshot); return true
    })
  }
  world = { ...structuredClone(baseline), message: 'Audio could not start. Retry in Menu > Options > Game > Browser controls and help.', messageUntil: baseline.time + 9 }
  await assert.rejects(assertAudioWorldUnchanged(page, snapshot))
  await assertAudioWorldUnchanged(page, snapshot, true)
  world.randomState++; await assert.rejects(assertAudioWorldUnchanged(page, snapshot, true))
  world.randomState--; world.messageUntil++; await assert.rejects(assertAudioWorldUnchanged(page, snapshot, true))
  world.messageUntil--; world.message = 'Different message'; await assert.rejects(assertAudioWorldUnchanged(page, snapshot, true))
})
test('retry keyboard recovery retains body observations and uses bounded real Tabs without focus repair', async () => {
  let tabs = 0, samples = 0
  const sample = { focused: false, focusVisible: false, disabled: false, active: { tag: 'BODY', label: null }, modal: true }
  const page = { keyboard: { press: async key => { assert.equal(key, 'Tab'); tabs++ } } }
  const control = { evaluate: async () => { samples++; return tabs >= 2 ? { ...sample, focused: true, focusVisible: true } : structuredClone(sample) } }
  const options = () => ({ signal: new AbortController().signal, deadlineAt: Date.now() + 5000, trace: {} })
  const success = options(); await tabToAudioControl(page, control, success)
  assert.equal(tabs, 2); assert.equal(samples, 3); assert.equal(success.trace.status, 'passed')
  assert.deepEqual(success.trace.observations[0], sample)
  for (const bad of [{ ...sample, focused: true }, { ...sample, focused: true, focusVisible: true, disabled: true },
    { ...sample, focused: true, focusVisible: true, modal: false }]) {
    tabs = 0; samples = 0; const failed = options()
    await assert.rejects(tabToAudioControl(page, { evaluate: async () => { samples++; return bad } }, failed), /16 real Tabs/)
    assert.equal(tabs, 16); assert.equal(samples, 17); assert.equal(failed.trace.status, 'failed')
  }
  for (const deadlineAt of [0, NaN, Infinity]) {
    tabs = 0; samples = 0
    await assert.rejects(tabToAudioControl(page, control, { ...options(), deadlineAt }), /deadline/)
    assert.equal(tabs, 0); assert.equal(samples, 0)
  }
  const abort = new Error('stop keyboard recovery')
  await assert.rejects(tabToAudioControl(page, control, { ...options(), signal: AbortSignal.abort(abort) }), error => error === abort)
})

test('keyboard retry blocks late observation success and the next real Tab after abort or expiry', async () => {
  for (const kind of ['abort', 'deadline']) for (const boundary of ['focused', 'body', 'press']) {
    const controller = new AbortController(), reason = new Error(`late ${kind}`), trace = {}
    let now = 1000, tabs = 0, observations = 0
    const stop = () => { if (kind === 'abort') controller.abort(reason); else now = 11000 }
    const page = { keyboard: { press: async key => { assert.equal(key, 'Tab'); tabs++; stop() } } }
    const control = { evaluate: async () => {
      observations++
      if (boundary !== 'press') stop()
      return { focused: boundary === 'focused', focusVisible: true, disabled: false, modal: true,
        active: { tag: boundary === 'focused' ? 'BUTTON' : 'BODY', label: null } }
    } }
    await assert.rejects(tabToAudioControl(page, control, { signal: controller.signal, deadlineAt: 11000, now: () => now, trace }),
      error => kind === 'abort' ? error === reason : /deadline/.test(String(error)))
    assert.equal(tabs, boundary === 'press' ? 1 : 0); assert.equal(observations, 1)
    assert.equal(trace.status, 'failed'); assert.equal(trace.observations.length, 1)
  }
})
test('Menu entry retains the entire ordered prepared popup snapshot, not merely an open replacement', () => {
  const before = [{ serial: '12', open: false }, { serial: '15', open: true }, { serial: '19', open: true }]
  assertPreparedSoundPopup(before, structuredClone(before), ['15', '19'])
  for (const changed of [before.slice(1), [...before].reverse(), [...before, { serial: '23', open: true }],
    before.map(p => p.serial === '15' ? { ...p, serial: '20' } : p), before.map(p => ({ ...p, open: true }))])
    assert.throws(() => assertPreparedSoundPopup(before, changed, changed.filter(p => p.open).map(p => p.serial)))
  for (const open of [['19'], ['19', '15'], ['15', '20'], []])
    assert.throws(() => assertPreparedSoundPopup(before, structuredClone(before), open))
})
test('native actual context finalization never masks or passes falsy primary/handle/context failures', async () => {
  for (const reason of [null, undefined, false, 0, '']) {
    const report = {}, calls = []
    const handles = [['first', { dispose: async () => { calls.push('first'); throw reason } }],
      ['second', { dispose: async () => { calls.push('second'); throw new Error('second disposal') } }]]
    const context = { close: async () => { calls.push('context'); throw new Error('context close') } }
    await assert.rejects(finalizeSoundContext(context, report, false, false, handles), error => error === reason)
    assert.deepEqual(calls, ['first', 'second', 'context']); assert.equal(report.cleanupErrors.length, 3)
    assert.equal(report.cleanupErrors[0].error, String(reason))
    await assert.rejects((async () => {
      try { throw reason } finally { await finalizeSoundContext(context, {}, true, true, handles) }
    })(), error => error === reason)
    await assert.rejects(finalizeSoundContext({ close: async () => { throw reason } }, {}, false, false, []), error => error === reason)
  }
  const source = read('scripts/native-ui-evidence/options-audio-control-style.mjs')
  assert.match(source, /await finalizeSoundContext\(context, report, fallback, contextFailed, \[\['audio-options', entry\?\.owner\], \['paused-world', worldSnapshot\]\]\)/)
})

test('fullscreen remains menu-owned and both invented gameplay footer controls stay absent', () => {
  for (const menu of [false, true]) {
    const sample = { footerCount: 0, loadingCount: 0, modalCount: +menu, fullscreenCount: +menu, fullscreenInMenu: menu, nativeModal: menu }
    assertBrowserControlOwners(sample, menu)
    for (const key of Object.keys(sample)) {
      const bad = { ...sample, [key]: typeof sample[key] === 'boolean' ? !sample[key] : sample[key] + 1 }
      assert.throws(() => assertBrowserControlOwners(bad, menu))
    }
  }
})
test('pending sound pointer requires a finite positive visible center owned by the actual control', () => {
  const glyph = {}, control = { getBoundingClientRect: () => ({ x: 10, y: 20, width: 61, height: 14 }), contains: node => node === glyph }
  const sandbox = { node: control, innerWidth: 640, innerHeight: 480,
    document: { elementFromPoint: (x, y) => { assert.equal(x, 40.5); assert.equal(y, 27); return glyph } } }
  const target = JSON.parse(JSON.stringify(vm.runInNewContext(`(${pendingSoundPointerTarget.toString()})(node)`, sandbox)))
  assertPendingSoundPointerTarget(target)
  for (const [key, value] of [['x', NaN], ['y', Infinity], ['width', 0], ['height', -1], ['x', -1], ['y', 480], ['x', 640], ['owned', false]])
    assert.throws(() => assertPendingSoundPointerTarget({ ...target, [key]: value }))
  sandbox.document.elementFromPoint = () => ({})
  assert.throws(() => assertPendingSoundPointerTarget(vm.runInNewContext(`(${pendingSoundPointerTarget.toString()})(node)`, sandbox)), /actually hit/)
})
test('workflow is isolated read-only manual evidence with default two and opt-in third credential-free pinned checkouts and bounded artifacts', () => {
  const workflow = yaml.load(read('.github/workflows/native-ui-evidence.yml'))
  assert.deepEqual(Object.keys(workflow.on), ['workflow_dispatch']); assert.deepEqual(workflow.permissions, { contents: 'read' })
  assert.deepEqual(Object.keys(workflow.jobs), ['evidence'])
  const job = workflow.jobs.evidence
  assert.equal(job['runs-on'], 'ubuntu-24.04')
  assert.equal(job['timeout-minutes'], "${{ inputs.evidence_kind == 'material-lifecycle' && 30 || 20 }}")
  assert.deepEqual(workflow.on.workflow_dispatch.inputs.evidence_kind, {
    description: 'Existing UI episodes or reviewed exact PR722 material lifecycle',
    required: true, default: 'native-ui', type: 'choice', options: ['native-ui', 'material-lifecycle'],
  })
  const checkouts = job.steps.filter(step => step.uses?.startsWith('actions/checkout@'))
  assert.equal(checkouts.length, 3); assert.ok(checkouts.every(step => step.with['persist-credentials'] === false))
  const helper = checkouts[1]
  assert.equal(helper.if, "${{ inputs.evidence_kind == 'material-lifecycle' }}")
  assert.equal(helper.with.ref, 'a2e1cd1b2dbda79a75a79573ff6ff504ce46845d')
  assert.equal(helper.with.repository, 'JohnDeved/populous-new-dawn')
  assert.equal(helper.with.path, 'material-helper-source')
  assert.deepEqual(checkouts.filter(step => !step.if), [checkouts[0], checkouts[2]])
  assert.equal(checkouts[0].with.ref, '${{ github.workflow_sha }}'); assert.equal(checkouts[2].with.ref, '${{ inputs.candidate_sha }}')
  assert.equal(checkouts[2].with.repository, 'JohnDeved/populous-new-dawn')
  const sparse = checkouts[0].with['sparse-checkout'].trim().split(/\r?\n/).map(line => line.trim())
  for (const path of ['/scripts/native-ui-evidence/', '/scripts/browser-options-audio.mjs',
    '/scripts/orchestration/dependency-profile.mjs', '/scripts/tutorial-browser/browser-config.mjs',
    '/.github/workflows/native-ui-evidence.yml']) assert.ok(sparse.includes(path), `Missing trusted import: ${path}`)
  assert.equal(checkouts[0].with['sparse-checkout-cone-mode'], false)
  assert.ok(job.steps.findIndex(step => /manualIdentity/.test(step.run ?? '')) < job.steps.findIndex(step => step.id === 'candidate'))
  const upload = job.steps.find(step => step.uses?.startsWith('actions/upload-artifact@'))
  assert.equal(upload.with['retention-days'], 7); assert.match(upload.with.path, /\*\*\/\*\.png/)
  assert.doesNotMatch(upload.with.path, /node_modules|dist|profile/)
  assert.doesNotMatch(read('.github/workflows/native-ui-evidence.yml'), /secrets:|secrets\.|continue-on-error|pull_request_target|\bdeploy\b/)
  for (const step of job.steps.filter(step => step.uses)) assert.match(step.uses, /@[a-f0-9]{40}$/)
})
test('normal PR source equality and existing main-only Ready triggers remain outside manual mode', () => {
  const source = read('scripts/tutorial-browser/run.mjs')
  assert.match(source, /if \(process\.env\.GITHUB_SHA\) assert\.equal\(commit, process\.env\.GITHUB_SHA, 'Exact proposed merge required'\)/)
  for (const path of ['tutorial-browser.yml', 'ready-pr-check.yml']) {
    const workflow = yaml.load(read(`.github/workflows/${path}`))
    assert.deepEqual(Object.keys(workflow.on), ['pull_request'])
    assert.deepEqual(workflow.on.pull_request.branches, ['main']); assert.deepEqual(workflow.on.pull_request.types, ['ready_for_review'])
  }
})
test('candidate public assets, source manifests and fixed official sandbox configuration stay explicit', () => {
  const worker = read('scripts/native-ui-evidence/browser-worker.mjs'), runner = read('scripts/native-ui-evidence/run.mjs')
  assert.match(worker, /browserConfiguration\(\)/); assert.doesNotMatch(worker, /POPULOUS_BROWSER|no-sandbox/)
  assert.match(worker, /resolve\(candidateRoot, 'public', entry\)/)
  assert.match(worker, /root: resolve\(candidateRoot, 'scripts\/tutorial-browser\/fixture'\)/)
  assert.match(runner, /sourceManifest\(candidateRoot, identity\.candidateSha\)/)
  assert.match(runner, /sourceManifest\(infrastructureRoot, identity\.workflowSha, infrastructureInput\)/)
  assert.match(runner, /verifyManifest\(candidateRoot, candidateSource\)/)
  assert.match(runner, /directoryManifest\(resolve\(candidateRoot, 'node_modules'\)\), dependencies/)
  assert.match(read('scripts/native-ui-evidence/adapter.mjs'), /await owner\.close\(\)/)
})
test('Chrome provenance is saved before launch and screenshot observations include actual renderer', () => {
  const worker = read('scripts/native-ui-evidence/browser-worker.mjs')
  assert.ok(worker.indexOf('saveBrowser()') < worker.indexOf('await chromium.launch'))
  assert.match(worker, /sha256: sha256\(config\.browserPath\)/)
  assert.match(worker, /browser-provenance\.json/)
  const owner = read('scripts/native-ui-evidence/browser-owner.mjs')
  assert.match(owner, /UNMASKED_RENDERER_WEBGL/); assert.match(owner, /report\.observations\.push/)
  const hud = read('scripts/native-ui-evidence/options-audio-control-style.mjs')
  assert.match(hud, /real-playback-after-Continue/)
  assert.match(hud, /context: 'running', mediaPaused: false, backgroundScheduled: true/)
  assert.match(hud, /currentTime: window\.observedSoundContext\.currentTime/)
})
test('closed build/public manifest rejects added, removed, modified, wrong-type and wrong-target output', t => {
  const root = fixture(t), candidate = resolve(root, 'candidate'), dist = resolve(root, 'dist')
  put(candidate, 'public/art/pixel.png', 'image'); put(dist, 'assets/home.js', 'bundle')
  const built = directoryManifest(dist), links = publicLinks(candidate, built)
  symlinkSync(links.art.link, resolve(dist, 'art')); verifyBuiltOutput(dist, built, links)
  put(dist, 'extra.js', 'unexpected'); assert.throws(() => verifyBuiltOutput(dist, built, links)); rmSync(resolve(dist, 'extra.js'))
  mkdirSync(resolve(dist, 'empty-extra')); assert.throws(() => verifyBuiltOutput(dist, built, links)); rmSync(resolve(dist, 'empty-extra'), { recursive: true })
  put(dist, 'assets/home.js', 'changed'); assert.throws(() => verifyBuiltOutput(dist, built, links)); put(dist, 'assets/home.js', 'bundle')
  rmSync(resolve(dist, 'assets/home.js')); assert.throws(() => verifyBuiltOutput(dist, built, links)); put(dist, 'assets/home.js', 'bundle')
  rmSync(resolve(dist, 'art')); symlinkSync('/wrong/public', resolve(dist, 'art')); assert.throws(() => verifyBuiltOutput(dist, built, links))
  rmSync(resolve(dist, 'art')); mkdirSync(resolve(dist, 'art')); assert.throws(() => verifyBuiltOutput(dist, built, links))
})
test('after receipts distinguish not-captured, not-verified and identical per scope', () => {
  const result = afterScopes({ missing: { captured: false, verify() { throw Error('must not execute') } },
    changed: { captured: true, verify() { throw Error('changed input') } }, same: { captured: true, verify() {} } })
  assert.deepEqual(result.states, { missing: 'not-captured', changed: 'not-verified', same: 'identical' })
  assert.deepEqual(result.failures, [{ scope: 'changed', error: 'Error: changed input' }])
})


function optionsLayoutFixture() {
  const state = { scale: '1', optionsCount: 1, noticeCount: 1, skin: 'frontend', owner: 'frontend' }
  const element = () => ({ getClientRects: () => [{ width: 640, height: 480 }], style: { visibility: 'visible', display: 'block' } })
  const notice = element(), dialog = { ...element(), open: true,
    matches: selector => selector === { frontend: '[data-original-main-menu]', ingame: '[data-original-pause-menu]' }[state.owner] }
  const options = { ...element(), get dataset() { return { skin: state.skin } },
    closest: selector => { assert.equal(selector, 'dialog[data-original-main-menu], dialog[data-original-pause-menu]'); return state.dialog },
    querySelectorAll: selector => { assert.equal(selector, '[role="status"]'); return Array(state.noticeCount).fill(notice) } }
  state.dialog = dialog
  const sandbox = { window: { innerWidth: 640, innerHeight: 480 },
    document: { querySelectorAll: selector => { assert.equal(selector, '[data-original-options]'); return Array(state.optionsCount).fill(options) } },
    getComputedStyle: node => ({ ...node.style, getPropertyValue: name => { assert.equal(name, '--frontend-scale'); return state.scale } }) }
  const ready = (size = { width: 640, height: 480, skin: 'frontend' }) => vm.runInNewContext(`(${optionsViewportReady.toString()})(${JSON.stringify(size)})`, sandbox)
  return { state, notice, options, dialog, sandbox, ready }
}

test('Options resize readiness rejects stale larger/smaller scale and noncurrent viewport', () => {
  const { state, sandbox, ready } = optionsLayoutFixture()
  assert.equal(ready(), true)
  state.scale = '1.5'; assert.equal(ready(), false, 'Stale larger scale after shrinking is not ready')
  state.scale = '0.5'; assert.equal(ready(), false, 'Stale smaller scale after growing is not ready')
  state.scale = '1'; sandbox.window.innerWidth = 1280; assert.equal(ready(), false, 'Requested size is not current viewport')
  sandbox.window.innerWidth = 640; sandbox.window.innerHeight = 720; assert.equal(ready(), false)
})

test('Options resize readiness rejects missing, invalid, hidden, duplicate and wrong-owner state', () => {
  const { state, options, notice, dialog, ready } = optionsLayoutFixture()
  for (const invalid of ['', ' ', 'NaN', 'Infinity', '-1', '0', '1px', '0x1', '1e999']) {
    state.scale = invalid; assert.equal(ready(), false, `Invalid inherited scale: ${invalid}`)
  }
  state.scale = '1'
  for (const key of ['optionsCount', 'noticeCount']) {
    for (const count of [0, 2]) { state[key] = count; assert.equal(ready(), false, `${key}=${count}`) }
    state[key] = 1
  }
  dialog.open = false; assert.equal(ready(), false); dialog.open = true
  state.dialog = null; assert.equal(ready(), false); state.dialog = dialog
  state.owner = 'ingame'; assert.equal(ready(), false, 'Wrong original dialog cannot confer readiness'); state.owner = 'frontend'
  state.skin = state.owner = 'ingame'; assert.equal(ready(), false, 'A self-consistent wrong-skin dialog is not the requested owner')
  state.skin = state.owner = 'frontend'
  state.skin = 'other'; assert.equal(ready(), false); state.skin = 'frontend'
  assert.equal(ready({ width: 640, height: 480 }), false, 'Expected skin must be explicit')
  for (const node of [dialog, options, notice]) {
    node.style.visibility = 'hidden'; assert.equal(ready(), false); node.style.visibility = 'visible'
    node.style.display = 'none'; assert.equal(ready(), false); node.style.display = 'block'
    const rects = node.getClientRects; node.getClientRects = () => []; assert.equal(ready(), false)
    for (const bad of [0, -1, NaN, Infinity]) for (const axis of ['width', 'height']) {
      node.getClientRects = () => [{ width: 640, height: 480, [axis]: bad }]; assert.equal(ready(), false)
    }
    node.getClientRects = rects
  }
})

test('Options resize readiness follows both menus frontendScale for compact, desktop and fractional viewports', () => {
  assert.match(read('app/frontend-composition.ts'), /frontendScale = \(width: number, height: number\) => Math\.min\(width \/ 640, height \/ 480\)/)
  for (const path of ['app/original-main-menu.tsx', 'app/original-pause-menu.tsx']) {
    const menu = read(path)
    assert.match(menu, /frontendScale\(window\.innerWidth, window\.innerHeight\)/)
    assert.match(menu, /style=\{\{ '--frontend-scale': scale \}/)
  }
  const { state, sandbox, ready } = optionsLayoutFixture()
  for (const skin of ['frontend', 'ingame']) for (const [width, height] of [[320, 240], [640, 480], [1280, 720], [853, 479]]) {
    state.skin = state.owner = skin; state.scale = String(Math.min(width / 640, height / 480))
    sandbox.window.innerWidth = width; sandbox.window.innerHeight = height
    assert.equal(ready({ width, height, skin }), true)
    for (const invalid of [{ width: 0, height }, { width, height: -1 }, { width: null, height }, { width: '640', height }]) {
      assert.equal(ready({ ...invalid, skin }), false)
    }
  }
})

test('Options capture waits for rendered resize and persists original failed geometry before assertions', async t => {
  const source = read('scripts/native-ui-evidence/options-storage-notice-style.mjs')
  const match = source.match(/const capture = (async category => \{[\s\S]+?\n        \})\n        await capture/)
  assert.ok(match, 'Retain the shipped capture callback, not a reconstructed helper')
  const file = resolve(fixture(t), 'options-storage.json'), report = { samples: [], measurements: [] }
  const sample = { copy: 'Storage unavailable', glyphs: 1,
    lines: [{ box: { x: -20, y: 338, right: 583, bottom: 366 }, pitch: 30, text: '', glyphs: 1 }],
    navigation: { x: 99, y: 420, right: 241, bottom: 446 }, background: 'rgba(0, 0, 0, 0)',
    images: ['url(/original/frontend/feft33we.png)'], layout: { viewport: { width: 640, height: 480 }, frontendScale: '1' } }
  const order = []
  const capture = vm.runInNewContext(`(${match[1]})`, { signal: new AbortController().signal,
    page: { setViewportSize: async size => { assert.equal(size.width, 640); assert.equal(size.height, 480); order.push('resize') },
      waitForFunction: async (predicate, size, options) => {
        assert.equal(predicate, optionsViewportReady); assert.equal(size.width, 640); assert.equal(size.height, 480)
        assert.equal(size.skin, 'frontend'); assert.equal(options.timeout, 5000); order.push('ready'); return { dispose: async () => order.push('dispose') }
      }, screenshot: async () => assert.fail('Failed assertion must not become a successful capture') },
    optionsViewportReady, observeOptionsStorage, assertOptionsCopyClearance, notice: { evaluate: async () => { order.push('original-read'); return sample } },
    skin: 'frontend', fallback: false, report, assert,
    save: () => { order.push('save'); writeFileSync(file, JSON.stringify(report)) } })
  await assert.rejects(capture('sound'), /Notice remains within viewport/)
  assert.deepEqual(order, ['resize', 'ready', 'dispose', 'original-read', 'save'])
  const persisted = JSON.parse(readFileSync(file))
  assert.equal(persisted.samples.length, 0)
  assert.deepEqual(persisted.measurements, [{ skin: 'frontend', category: 'sound', fallback: false, width: 640, height: 480, ...sample }])
})


test('episode supplies one absolute deadline from its original start and the same cancellation signal', async () => {
  let clock = 0, received
  const result = await boundedEpisode(async (signal, deadlineAt) => {
    received = { signal, deadlineAt }; clock = 89
    return { status: 'passed' }
  }, { capMs: 90, now: () => clock, wallNow: () => 1000,
    setTimer: () => 1, clearTimer() {}, close: async () => {} })
  assert.equal(result.status, 'passed'); assert.equal(received.deadlineAt, 1090)
  assert.equal(received.signal.aborted, false)
})

function missionFixture(t, helper = `Object.assign(trace, { contract: recoveryRetryInputContract,
  actionCapMs: Math.min(setupTimeout, deadlineAt - Date.now()), responseCapMs: 2500,
  responseStartedMs: 3000, responseDeadlineMs: 5500, elapsedMs: 3100, wallElapsedMs: 3100,
  responseSpentMs: 100, retryPreparationMs: 0, retryLimit: 1, retryCount: 0, retryPreparations: [],
  attempts: [{ before: { action: 'ready', paused: false, inputMask: 0, flybyFlags: 16 }, outcome: 'natural-completion' }],
  responseWindows: [{ startedMs: 3000, finishedMs: 3100, deadlineMs: 5500 }] })`) {
  const root = fixture(t), calls = []
  put(root, 'scripts/browser-new-game.mjs', 'export async function openCampaignFromMainMenu(page) { page.calls.push("campaign") }')
  put(root, 'scripts/browser-game.mjs', 'export async function bindGame(page) { page.calls.push("bind") }')
  put(root, 'scripts/local-render/original-pause-checkpoint-recovery.mjs', `
    export const recoveryRetryInputContract = 'public-setup-cumulative-response-v2'
    export function pauseStartupReady() {}
    export async function skipPauseIntroduction(page, { setupTimeout, deadlineAt, signal, trace, popupRetryPreparation }) {
      page.input = { setupTimeout, deadlineAt, signal, trace, popupRetryPreparation }; page.calls.push('skip')
      ${helper}
    }`)
  const page = { calls, startup: 'skip',
    getByRole: (_role, { name }) => ({ isVisible: async () => false, click: async () => calls.push(name) }),
    waitForFunction: async () => ({ jsonValue: async () => page.startup, dispose: async () => {} }),
    evaluate: async () => 1,
  }
  return { root, page, calls, trace: {}, signal: new AbortController().signal, deadlineAt: Date.now() + 90000 }
}

test('ordinary mission explicitly passes existing page allowance, live deadline, signal and retained trace', async t => {
  const f = missionFixture(t)
  await ordinaryMission(f.page, f.root, f)
  assert.equal(pageActionTimeout, 25000)
  assert.equal(f.page.input.setupTimeout, pageActionTimeout)
  assert.equal(f.page.input.popupRetryPreparation, true)
  assert.equal(f.page.input.deadlineAt, f.deadlineAt)
  assert.equal(f.page.input.signal, f.signal); assert.equal(f.page.input.trace, f.trace)
  assert.equal(f.trace.status, 'passed'); assert.equal(f.trace.startupAction, 'skip')
  assert.deepEqual(f.calls, ['campaign', 'Start Mission 1', 'bind', 'skip'])
})

test('ordinary mission rejects an old candidate before UI entry, and rejects ignored options after return', async t => {
  const old = missionFixture(t)
  put(old.root, 'scripts/local-render/original-pause-checkpoint-recovery.mjs',
    'export function pauseStartupReady() {}\nexport async function skipPauseIntroduction(page) { page.calls.push("old-skip") }')
  await assert.rejects(ordinaryMission(old.page, old.root, old), /explicitly support/)
  assert.deepEqual(old.calls, []); assert.equal(old.trace.status, 'failed')
  const ignored = missionFixture(t, '/* Incorrect helper silently ignored the supplied budget. */')
  await assert.rejects(ordinaryMission(ignored.page, ignored.root, ignored), /public-setup-cumulative-response-v2/)
  assert.equal(ignored.trace.status, 'failed'); assert.equal(ignored.calls.filter(call => call === 'skip').length, 1)
})

test('ordinary mission preserves original failures and never repeats ambiguous input', async t => {
  const f = missionFixture(t, `trace.phase = 'observed-space-dispatch'; trace.attempts = [{ outcome: 'unknown' }]; throw page.failure`)
  f.page.failure = Error('Space delivery outcome unknown')
  await assert.rejects(ordinaryMission(f.page, f.root, f), error => error === f.page.failure)
  assert.equal(f.trace.phase, 'observed-space-dispatch'); assert.equal(f.trace.attempts[0].outcome, 'unknown')
  assert.equal(f.trace.status, 'failed'); assert.match(f.trace.error, /unknown/)
  assert.equal(f.calls.filter(call => call === 'skip').length, 1)
})

test('ordinary mission does not dispatch on natural completion, expired deadline or prior cancellation', async t => {
  const natural = missionFixture(t); natural.page.startup = 'ready'
  await ordinaryMission(natural.page, natural.root, natural)
  assert.equal(natural.page.input, undefined); assert.equal(natural.trace.status, 'passed')
  for (const deadlineAt of [undefined, NaN, Infinity, Date.now() - 1]) {
    const f = missionFixture(t); f.deadlineAt = deadlineAt
    await assert.rejects(ordinaryMission(f.page, f.root, f), /live episode deadline/)
    assert.deepEqual(f.calls, [])
  }
  const cancelled = missionFixture(t), controller = new AbortController()
  controller.abort(Error('episode stopped')); cancelled.signal = controller.signal
  await assert.rejects(ordinaryMission(cancelled.page, cancelled.root, cancelled), /episode stopped/)
  assert.deepEqual(cancelled.calls, [])
})

test('caller acceptance rejects shared, missing, nonfinite, inflated and overrun response evidence', () => {
  const good = { contract: 'public-setup-cumulative-response-v2', actionCapMs: 25000, responseCapMs: 2500,
    responseStartedMs: 3000, responseDeadlineMs: 5500, elapsedMs: 3100, wallElapsedMs: 3100,
  responseSpentMs: 100, retryPreparationMs: 0, retryLimit: 1, retryCount: 0, retryPreparations: [],
  attempts: [{ before: { action: 'ready', paused: false, inputMask: 0, flybyFlags: 16 }, outcome: 'natural-completion' }],
  responseWindows: [{ startedMs: 3000, finishedMs: 3100, deadlineMs: 5500 }] }
  assertMissionInputBudget(good)
  for (const [key, value] of [['contract', 'shared-input-v1'], ['responseCapMs', 2501], ['actionCapMs', 25001],
    ['actionCapMs', NaN], ['actionCapMs', '25000'], ['responseStartedMs', -1], ['responseStartedMs', NaN], ['responseDeadlineMs', 5501],
    ['responseDeadlineMs', 3000], ['responseDeadlineMs', Infinity], ['elapsedMs', 5501], ['elapsedMs', NaN], ['responseSpentMs', 2501], ['responseSpentMs', 99], ['wallElapsedMs', 3101],
    ['retryPreparationMs', 1], ['retryCount', 2], ['retryLimit', 2]])
    assert.throws(() => assertMissionInputBudget({ ...good, [key]: value }), undefined, key)
  assert.throws(() => assertMissionInputBudget({}))
})

test('adapter retains mutated episode receipts and the supplied deadline when an episode throws', async t => {
  const output = fixture(t), candidateRoot = fixture(t)
  put(candidateRoot, 'scripts/local-render/startup-logo.mjs', `export default async function ({ receipt, deadlineAt, signal }) {
    receipt.inputBudgets = [{ contract: 'public-setup-then-response-v1', phase: 'observed-space-dispatch' }]
    receipt.observedDeadline = deadlineAt; receipt.aborted = signal.aborted
    throw Object.assign(Error('original failed input'), { traceWriteError: 'separate trace write failure' })
  }`)
  const context = new Context(), original = context.newPage.bind(context)
  context.newPage = async () => {
    const page = await original()
    page.goto = async () => {}; page.getByRole = () => ({ waitFor: async () => {} })
    return page
  }
  const browser = { newContext: async () => context, close: async () => {} }
  await assert.rejects(runNativeUiEvidence({ browser, candidateRoot, output, signal: new AbortController().signal }), /original failed input/)
  const result = JSON.parse(readFileSync(resolve(output, 'episodes.json')))
  const first = result.episodes[0]
  assert.equal(first.receipt.inputBudgets[0].phase, 'observed-space-dispatch')
  assert.equal(first.traceWriteError, 'separate trace write failure')
  assert.equal(first.receipt.observedDeadline, first.deadlineAt); assert.equal(first.receipt.aborted, false)
  assert.equal(first.status, 'failed'); assert.ok(result.episodes.slice(1).every(record => record.status === 'not-run'))
})

test('both mission-entry episodes preserve per-entry traces on throw without replacing their deadline', () => {
  for (const name of ['options-storage-notice-style', 'options-audio-control-style']) {
    const source = read(`scripts/native-ui-evidence/${name}.mjs`)
    assert.match(source, /receipt\.missionInputBudgets = report\.inputBudgets/)
    if (name === 'options-audio-control-style') {
      assert.match(source, /finally \{ saveSoundTrace\(save, inputFailed, inputError, report\) \}/)
      assert.match(source, /finally \{ saveSoundTrace\(save, episodeFailed, episodeError, report\) \}/)
    } else {
      assert.match(source, /finally \{ saveMissionInputTrace\(save, inputError\) \}/)
      assert.match(source, /finally \{ saveMissionInputTrace\(save, episodeError\) \}/)
    }
    assert.doesNotMatch(source, /deadlineAt:\s*Date\.now/)
  }
})


test('both actual mission-entry persistence paths retain input error identity and reject write-only failure', async () => {
  for (const name of ['options-storage-notice-style', 'options-audio-control-style']) {
    const source = read(`scripts/native-ui-evidence/${name}.mjs`)
    const match = source.match(/let inputError[^\n]*\s+try \{[^\n]*ordinaryMission[^\n]*\}\s+catch \(error\) \{[^\n]+\}\s+finally \{ (?:saveMissionInputTrace|saveSoundTrace)\(save, [^\n]+\) \}/)
    assert.ok(match)
    for (const inputFails of [false, true]) for (const writeFails of [false, true]) {
      const inputError = Error('original Space uncertainty'), writeError = Error('trace write failed')
      let inputs = 0, writes = 0
      const run = vm.runInNewContext(`(async () => { ${match[0]} })`, {
        page: {}, root: '', signal: {}, deadlineAt: 90000, trace: {}, saveMissionInputTrace, saveSoundTrace, report: {},
        step: createAudioOptionsBudget({ timeout: 5000 }).step,
        ordinaryMission: async () => { inputs++; if (inputFails) throw inputError },
        save: () => { writes++; if (writeFails) throw writeError },
      })
      if (inputFails || writeFails) await assert.rejects(run(), error => error === (inputFails ? inputError : writeError))
      else await run()
      assert.equal(inputs, 1); assert.equal(writes, 1)
      assert.equal(inputError.traceWriteError, inputFails && writeFails ? String(writeError) : undefined)
    }
  }
})


test('actual audio trace-save paths preserve falsy primary failures and retain the failing write separately', async () => {
  const source = read('scripts/native-ui-evidence/options-audio-control-style.mjs')
  const input = source.match(/let inputError[^\n]*\s+try \{[^\n]*ordinaryMission[^\n]*\}\s+catch \(error\) \{[^\n]+\}\s+finally \{ saveSoundTrace\(save, [^\n]+\) \}/)
  const popup = source.match(/let popupError[^\n]*[\s\S]+?finally \{ saveSoundTrace\(save, popupFailed, popupError, report\) \}/)
  const terminal = source.match(/\} catch \(error\) \{ episodeFailed = true;[^\n]+\}\s+finally \{ saveSoundTrace\(save, episodeFailed, episodeError, report\) \}/)
  assert.ok(input); assert.ok(popup); assert.ok(terminal)
  assert.match(source, /receipt\.optionsAudioTraceWriteErrors = report\.traceWriteErrors/)
  for (const reason of [null, undefined, false, 0, '']) for (const kind of ['input', 'popup', 'terminal']) {
    const report = { traceWriteErrors: [] }, cleanup = new Error('trace write failed')
    let writes = 0, inputs = 0
    const actual = kind === 'input' ? input[0] : kind === 'popup' ? popup[0] :
      `let episodeError, episodeFailed = false; try { await fail() ${terminal[0]}`
    const fail = async () => { inputs++; throw reason }
    const run = vm.runInNewContext(`(async () => { ${actual} })`, {
      page: {}, root: '', signal: {}, deadlineAt: 90000, trace: {}, popupTrace: {}, report, saveSoundTrace,
      step: createAudioOptionsBudget({ timeout: 5000 }).step,
      ordinaryMission: fail, candidateModule: async () => ({}), prepareSoundPopup: fail, fail,
      save: () => { writes++; throw cleanup },
    })
    await assert.rejects(run(), error => error === reason)
    assert.equal(inputs, 1); assert.equal(writes, 1)
    assert.deepEqual(report.traceWriteErrors, [{ error: String(cleanup), primaryFailure: true }])
  }
  for (const reason of [null, undefined, false, 0, '']) {
    const report = {}
    let threw = false, observed
    try { saveSoundTrace(() => { throw reason }, false, undefined, report) }
    catch (error) { threw = true; observed = error }
    assert.equal(threw, true); assert.equal(observed, reason)
    assert.deepEqual(report.traceWriteErrors, [{ error: String(reason), primaryFailure: false }])
  }
})

function soundPopupFixture() {
  const f = { trace: {}, calls: [], disposed: 0, retained: [{ serial: '0', open: false }],
    ownership: { currentWorld: true, world: { paused: false, inputMask: 0, status: 'playing' },
      scene: { focusPauseOwned: false, overviewActive: false, overviewStage: 0, keys: [] } } }
  f.world = {}; f.scene = { world: f.world }
  const snapshot = () => {}
  const window = { testStore: { getWorld: () => f.world }, testSceneRef: { get current() { return f.scene } } }
  f.page = {
    evaluateHandle: async fn => {
      const value = vm.runInNewContext(`(${fn.toString()})()`, { window })
      return { value, dispose: async () => { f.disposed++; if (f.disposeError) throw f.disposeError } }
    },
    evaluate: async (fn, arg) => {
      if (fn === snapshot) return structuredClone(f.retained)
      if (fn === soundOwnership) return { ...structuredClone(f.ownership), popups: f.retained.filter(p => p.open).map(p => p.serial) }
      return vm.runInNewContext(`(${fn.toString()})(owner)`, { window, owner: arg.value })
    },
  }
  f.popupInput = { campaignPopupSnapshot: snapshot, setCampaignPopupOpen: async (page, serial, open, options) => {
    assert.equal(page, f.page); f.calls.push({ serial, open, timeout: options.timeout })
    if (f.actionError) throw f.actionError
    f.retained.find(p => p.serial === serial).open = open
    options.trace.observedOpen = open
    f.mutate?.()
  } }
  f.options = { signal: new AbortController().signal, deadlineAt: Date.now() + 10000, trace: f.trace }
  f.run = () => prepareSoundPopup(f.page, f.popupInput, f.options)
  return f
}
test('sound setup publicly reopens the observed retained popup without replacing its owners', async () => {
  const f = soundPopupFixture(); await f.run()
  assert.deepEqual(f.calls, [{ serial: '0', open: true, timeout: 4000 }])
  assert.equal(f.trace.publicInput.timeoutMs, 4000)
  assert.equal(f.trace.status, 'passed'); assert.equal(f.trace.sameOwner, true)
  assert.deepEqual(f.trace.retainedBefore, [{ serial: '0', open: false }])
  assert.deepEqual(f.trace.retainedAfter, [{ serial: '0', open: true }]); assert.equal(f.disposed, 1)
})
test('sound setup selects an existing open owner instead of inventing or changing another one', async () => {
  const f = soundPopupFixture(); f.retained.push({ serial: '7', open: true }); await f.run()
  assert.equal(f.calls[0].serial, '7'); assert.deepEqual(f.trace.retainedAfter, f.trace.retainedBefore)
})
test('sound setup refuses absent, malformed or duplicate retained owners before any public action', async () => {
  for (const retained of [[], [{ serial: 'bad', open: false }], [{ serial: 0, open: false }],
    [{ serial: '0', open: 'false' }], [{ serial: '0', open: false }, { serial: '0', open: true }]]) {
    const f = soundPopupFixture(); f.retained = retained; await assert.rejects(f.run())
    assert.equal(f.calls.length, 0); assert.equal(f.trace.status, 'failed'); assert.equal(f.disposed, 1)
    assert.deepEqual(f.trace.retainedBefore, retained)
  }
})
test('sound setup rejects replaced objects, changed gameplay/input or acknowledged notification state', async () => {
  for (const mutate of [f => { f.world = {} }, f => { f.scene = { world: f.world } },
    f => { f.ownership.world.paused = true }, f => { f.ownership.world.inputMask = 64 },
    f => { f.ownership.scene.keys = ['Space'] }, f => { f.retained = [] },
    f => { f.retained[0].open = false }, f => { f.retained.push({ serial: '1', open: true }) }]) {
    const f = soundPopupFixture(); f.mutate = () => mutate(f); await assert.rejects(f.run())
    assert.equal(f.calls.length, 1); assert.equal(f.trace.status, 'failed'); assert.equal(f.disposed, 1)
    assert.ok(f.trace.afterOwnership); assert.ok(f.trace.retainedAfter)
  }
})
test('sound popup setup clips its public action to the unchanged remaining deadline and honors cancellation', async () => {
  const f = soundPopupFixture(); let now = 1000
  f.options = { ...f.options, now: () => now, deadlineAt: 2500 }
  const evaluate = f.page.evaluate
  f.page.evaluate = async (...args) => { const result = await evaluate(...args); now += 100; return result }
  await f.run()
  assert.equal(f.calls[0].timeout, 1300, 'Setup observations consume the original outer deadline')
  assert.equal(f.trace.publicInput.timeoutMs, 1300)
  for (const deadlineAt of [0, NaN, Infinity]) {
    const g = soundPopupFixture(); g.options.deadlineAt = deadlineAt; await assert.rejects(g.run(), /deadline/)
    assert.equal(g.calls.length, 0); assert.equal(g.disposed, 0)
  }
  const g = soundPopupFixture(), abort = new Error('aborted setup'); g.options.signal = AbortSignal.abort(abort)
  await assert.rejects(g.run(), error => error === abort); assert.equal(g.calls.length, 0)
})
test('sound popup setup budgets the observed hosted sequence without extending the episode deadline', async () => {
  const f = soundPopupFixture(); let now = 1000
  f.options = { ...f.options, now: () => now, deadlineAt: 11000 }
  const action = f.popupInput.setCampaignPopupOpen
  f.popupInput.setCampaignPopupOpen = async (page, serial, open, options) => {
    await action(page, serial, open, options)
    // Exact hosted fallback sequence (run 39938798020), rounded up to ms.
    // The candidate helper owns its end-to-end timeout; this fixture checks
    // that the caller supplies enough budget for all four completed phases.
    for (const elapsed of [196, 2155, 2487, 2672]) {
      now = 1000 + elapsed
      assert.ok(elapsed < options.timeout, 'The final retained-owner read must fit the same setup budget')
    }
  }
  await f.run()
  assert.equal(f.calls.length, 1); assert.equal(f.trace.status, 'passed'); assert.equal(f.disposed, 1)
  assert.equal(f.options.deadlineAt, 11000)
})
test('sound popup setup preserves an accepted-input timeout without retry or later owner certification', async () => {
  for (const remaining of [4000, 1000]) {
    const f = soundPopupFixture(), failure = new Error('World input preparation timed out during final owner verification')
    let now = 1000
    f.options = { ...f.options, now: () => now, deadlineAt: 1000 + remaining }
    const action = f.popupInput.setCampaignPopupOpen
    f.popupInput.setCampaignPopupOpen = async (page, serial, open, options) => {
      await action(page, serial, open, options)
      assert.equal(options.timeout, remaining)
      now += options.timeout
      throw failure
    }
    await assert.rejects(f.run(), error => error === failure)
    assert.equal(f.retained[0].open, true, 'Accepted input cannot be replayed or undone after a verification timeout')
    assert.equal(f.calls.length, 1); assert.equal(f.disposed, 1); assert.equal(f.trace.status, 'failed')
    assert.equal(f.trace.retainedAfter, undefined); assert.equal(f.trace.sameOwner, undefined)
  }
})
test('sound popup setup rejects cancellation or outer expiry after accepted input without replay', async () => {
  for (const kind of ['abort', 'deadline']) {
    const f = soundPopupFixture(), controller = new AbortController(), reason = new Error('cancelled popup setup')
    let now = 1000
    f.options = { ...f.options, signal: controller.signal, now: () => now, deadlineAt: 11000 }
    const action = f.popupInput.setCampaignPopupOpen
    f.popupInput.setCampaignPopupOpen = async (...args) => {
      await action(...args)
      if (kind === 'abort') controller.abort(reason)
      else now = f.options.deadlineAt
    }
    await assert.rejects(f.run(), error => kind === 'abort' ? error === reason : /deadline/.test(String(error)))
    assert.equal(f.retained[0].open, true); assert.equal(f.calls.length, 1); assert.equal(f.disposed, 1)
    assert.equal(f.trace.status, 'failed'); assert.equal(f.trace.retainedAfter, undefined)
  }
})
test('sound popup setup preserves the primary public-input error if handle disposal also fails', async () => {
  const f = soundPopupFixture(), primary = new Error('public input failed'); f.actionError = primary; f.disposeError = new Error('dispose failed')
  await assert.rejects(f.run(), error => error === primary)
  assert.equal(f.trace.status, 'failed'); assert.equal(f.trace.error, String(primary)); assert.equal(f.trace.ownerDisposeError, 'Error: dispose failed')
  assert.equal(f.calls.length, 1); assert.equal(f.disposed, 1)
  const g = soundPopupFixture(); g.disposeError = new Error('dispose alone failed')
  await assert.rejects(g.run(), error => error === g.disposeError); assert.equal(g.trace.status, 'failed')
})

test('public popup setup stops after late owner/summary settlement and cannot pass after late cleanup', async () => {
  for (const kind of ['abort', 'deadline']) for (const boundary of ['owner', 'summary', 'cleanup']) {
    const f = soundPopupFixture(), controller = new AbortController(), reason = new Error(`late popup ${kind}`)
    let now = 1000
    const stop = () => { if (kind === 'abort') controller.abort(reason); else now = 11000 }
    f.options = { ...f.options, signal: controller.signal, deadlineAt: 11000, now: () => now }
    const handle = f.page.evaluateHandle, evaluate = f.page.evaluate
    f.page.evaluateHandle = async fn => {
      const owner = await handle(fn), dispose = owner.dispose
      owner.dispose = async () => { await dispose(); if (boundary === 'cleanup') stop() }
      if (boundary === 'owner') stop()
      return owner
    }
    f.page.evaluate = async (fn, arg) => {
      const result = await evaluate(fn, arg)
      if (boundary === 'summary') stop()
      return result
    }
    await assert.rejects(f.run(), error => kind === 'abort' ? error === reason : /deadline/.test(String(error)))
    assert.equal(f.calls.length, boundary === 'cleanup' ? 1 : 0)
    assert.equal(f.disposed, 1); assert.equal(f.trace.status, 'failed')
  }
})

test('Options audio uses the public preparation and records the exact baseline before its strict assertions', () => {
  const source = read('scripts/native-ui-evidence/options-audio-control-style.mjs')
  assert.match(source, /candidateModule\(root, 'scripts\/browser-world-input\.mjs'\)/)
  assert.match(source, /await prepareSoundPopup\(page, popupInput, \{ signal, deadlineAt, trace: popupTrace \}\)/)
  assert.match(source, /finally \{ saveSoundTrace\(save, popupFailed, popupError, report\) \}/)
  assert.match(source, /let before = await step\(\(\) => page\.evaluate\(soundOwnership\)\)\s+report\.checks\.push\(\{ fallback, phase: 'baseline', ownership: before \}\); save\(\)\s+assert\.equal\(before\.currentWorld, true\)/)
  assert.match(source, /popupTrace\.afterMenu = await step\(\(\) => page\.evaluate\(popupInput\.campaignPopupSnapshot\)\); save\(\)\s+assertPreparedSoundPopup\(popupTrace\.retainedAfter, popupTrace\.afterMenu, before\.popups\)/)
})
test('Sound context cleanup preserves a primary failure and rejects cleanup-only failure', async () => {
  const primary = new Error('baseline failed'), cleanup = new Error('context close failed'), report = {}
  const context = { close: async () => { throw cleanup } }
  await assert.rejects((async () => { try { throw primary } finally { await closeSoundContext(context, report, true, true) } })(), error => error === primary)
  assert.deepEqual(report.cleanupErrors, [{ fallback: true, error: String(cleanup) }])
  await assert.rejects(closeSoundContext(context, {}, false, false), error => error === cleanup)
  const success = {}; await closeSoundContext({ close: async () => {} }, success, false, false); assert.deepEqual(success, {})
})


test('cumulative-response acceptance reconciles the exact authorized preparation interval', () => {
  const state = { paused: false, inputMask: 64, flybyFlags: 17 }
  const record = { trusted: true, repeat: false, prevented: true, sameWorld: true,
    owners: ['0'], before: { ...state }, after: { ...state } }
  const retry = { outcome: 'popup-owned-unchanged-retry', before: { action: 'skip', ...state }, after: { action: 'skip', ...state },
    afterSource: 'atomic-post-dispatch-witness', ownership: [structuredClone(record)],
    atomicAfter: { observationId: 'actual-witness', witnessId: 'actual-witness', witnessPresent: true, records: [record], state: { ...state } },
    delivery: { keyDeliveryFailed: false, pending: false, phase: 'finalize-space-witness', phaseError: null,
      completed: [
        { phase: 'install-space-witness', status: 'fulfilled', startedMs: 0, finishedMs: 10 },
        { phase: 'public-space-key', status: 'fulfilled', startedMs: 10, finishedMs: 20 },
        { phase: 'finalize-space-witness', status: 'fulfilled', startedMs: 20, finishedMs: 30 },
      ] } }
  const good = { contract: 'public-setup-cumulative-response-v2', actionCapMs: 25000, responseCapMs: 2500,
    responseStartedMs: 500, responseDeadlineMs: 4700, elapsedMs: 3000, wallElapsedMs: 3000,
    responseSpentMs: 800, retryPreparationMs: 1700, retryLimit: 1, retryCount: 1,
    attempts: [retry, { outcome: 'completed' }],
    retryPreparations: [{ afterAttempt: 1, status: 'passed', startedMs: 900, finishedMs: 2600, elapsedMs: 1700, actionDeadlineMs: 25000 }],
    responseWindows: [{ startedMs: 500, finishedMs: 900, deadlineMs: 3000 }, { startedMs: 2600, finishedMs: 3000, deadlineMs: 4700 }] }
  assertMissionInputBudget(good)
  for (const mutate of [g => { g.responseWindows[1].deadlineMs = g.responseDeadlineMs = 5100 },
    g => { g.retryPreparations[0].status = 'running' }, g => { g.attempts[0].outcome = 'unknown' },
    g => { g.retryPreparations[0].startedMs = 800 }, g => { g.retryPreparations[0].afterAttempt = 2 },
    g => { g.retryPreparations[0].elapsedMs = 1800 }, g => { g.responseWindows[1].startedMs = 2700 },
    g => { g.retryPreparations[0].actionDeadlineMs = 26000 }]) {
    const broken = structuredClone(good); mutate(broken); assert.throws(() => assertMissionInputBudget(broken))
  }
  // A passing outcome label never substitutes for the actual settled evidence.
  const replaceRecords = (g, change) => {
    change(g.attempts[0].atomicAfter.records)
    g.attempts[0].ownership = structuredClone(g.attempts[0].atomicAfter.records)
  }
  for (const [label, mutate] of [
    ['label only', g => { g.attempts[0] = { outcome: 'popup-owned-unchanged-retry' } }],
    ['missing attempts', g => { delete g.attempts }],
    ['missing final attempt', g => { g.attempts.pop() }],
    ['extra attempt', g => { g.attempts.push({ outcome: 'completed' }) }],
    ['unknown final outcome', g => { g.attempts[1].outcome = 'unknown' }],
    ['delivery error', g => { g.attempts[0].deliveryError = 'key or observer failed' }],
    ['key failure', g => { g.attempts[0].delivery.keyDeliveryFailed = true }],
    ['pending finalizer', g => { g.attempts[0].delivery.pending = true }],
    ['unfinalized phase', g => { g.attempts[0].delivery.phase = 'public-space-key' }],
    ['finalizer error', g => { g.attempts[0].delivery.phaseError = 'context closed' }],
    ['missing settled record', g => { g.attempts[0].delivery.completed.pop() }],
    ['rejected RPC', g => { g.attempts[0].delivery.completed[2].status = 'rejected' }],
    ['invalid RPC time', g => { g.attempts[0].delivery.completed[2].finishedMs = NaN }],
    ['out-of-order RPC', g => { g.attempts[0].delivery.completed[2].startedMs = 5 }],
    ['missing atomic state', g => { delete g.attempts[0].atomicAfter }],
    ['missing witness', g => { g.attempts[0].atomicAfter.witnessPresent = false }],
    ['missing witness ID', g => { delete g.attempts[0].atomicAfter.witnessId }],
    ['stale observation', g => { g.attempts[0].atomicAfter.observationId = 'previous-witness' }],
    ['empty identity', g => { g.attempts[0].atomicAfter.observationId = g.attempts[0].atomicAfter.witnessId = '' }],
    ['non-atomic after source', g => { g.attempts[0].afterSource = 'fresh-native-read' }],
    ['different ownership payload', g => { g.attempts[0].ownership[0].owners = ['other'] }],
    ['missing record', g => replaceRecords(g, records => { records.length = 0 })],
    ['multiple records', g => replaceRecords(g, records => { records.push(structuredClone(records[0])) })],
    ['untrusted input', g => replaceRecords(g, records => { records[0].trusted = false })],
    ['repeated input', g => replaceRecords(g, records => { records[0].repeat = true })],
    ['unprevented input', g => replaceRecords(g, records => { records[0].prevented = false })],
    ['changed World identity', g => replaceRecords(g, records => { records[0].sameWorld = false })],
    ['no popup owner', g => replaceRecords(g, records => { records[0].owners = [] })],
    ['malformed popup owner', g => replaceRecords(g, records => { records[0].owners = [null] })],
    ['changed atomic state', g => { g.attempts[0].atomicAfter.state.inputMask = 0 }],
    ['changed attempt state', g => { g.attempts[0].after.flybyFlags = 16 }],
    ['changed dispatch state', g => replaceRecords(g, records => { records[0].before.paused = true })],
    ['changed dispatch after', g => replaceRecords(g, records => { records[0].after.inputMask = 0 })],
    ['malformed native state', g => { g.attempts[0].atomicAfter.state.flybyFlags = '17' }],
    ['noninterruptible state', g => { g.attempts[0].before.action = 'ready' }],
  ]) {
    const broken = structuredClone(good); mutate(broken)
    assert.throws(() => assertMissionInputBudget(broken), undefined, label)
  }
  const natural = structuredClone(good)
  natural.attempts[1] = { outcome: 'natural-completion', before: { action: 'ready', paused: false, inputMask: 0, flybyFlags: 16 } }
  assertMissionInputBudget(natural)
  natural.attempts[1].delivery = {}
  assert.throws(() => assertMissionInputBudget(natural), /Natural completion/)
})

// Synthetic adapter execution checks the trusted dispatch and persisted ledger,
// not the rendered candidate assertions. Both actual split wrapper paths run.
function audioResult(mode) {
  const fallback = mode === 'fallback', retained = [{ serial: '0', open: true }]
  return { status: 'passed', executionContract: { version: 'audio-style-split-v1', mode, primary: false }, completedModes: [mode],
    samples: ['off', 'hover', 'focus', 'pending', 'on-compact'].map(name => ({ name, dpr: fallback ? 2 : 1,
      file: `${fallback ? 'fallback-dpr2' : 'glyphs-dpr1'}-${name}.png` })),
    inputBudgets: [{ fallback, status: 'passed' }],
    popupPreparations: [{ fallback, status: 'passed', sameOwner: true, retainedAfter: retained, afterMenu: retained,
      retainedBeforeReentry: retained, afterReentry: retained }],
    checks: ['baseline', 'pending', 'pending-Enter', 'pending-Space', 'pending-pointer', 'rejected-held-release',
      'retry-keyboard-reachability', 'real-resume-recovered-under-menu-pause', 'real-playback-after-Continue',
      'mute-keyboard-reachability', 'native-Space-mute'].map(phase => ({ fallback, phase, status: 'passed' }))
      .concat([{ fallback, pendingPointerTarget: {} }, { fallback, recoveredAudioContext: {} }]),
    browserOwners: ['gameplay-before-menu', 'options-modal', 'enabled-gameplay-no-footer', 'reentered-options-modal',
      'gameplay-after-menu'].map(phase => ({ fallback, phase })), traceWriteErrors: [], optionsNavigationCleanup: [] }
}
test('audio acceptance rejects missing, duplicate, swapped, legacy and unclean modes', () => {
  const fixture = () => ['native', 'fallback'].map(mode => ({ id: `options-audio-${mode}`, status: 'passed',
    timedOut: false, cleanupVerified: true, result: audioResult(mode) }))
  assertAudioGroup(fixture())
  for (const mutate of [r => r.pop(), r => r.push(r[0]), r => { r[1].id = r[0].id },
    r => { r[0].id = 'options-audio' }, r => { r[0].status = 'not-run' }, r => { r[1].timedOut = true },
    r => { r[1].cleanupVerified = false }, r => { [r[0].result, r[1].result] = [r[1].result, r[0].result] },
    r => { delete r[0].result.executionContract }, r => { r[0].result.executionContract.mode = 'combined' },
    r => { r[0].result.executionContract.primary = true }, r => { r[0].result.completedModes = ['native', 'fallback'] }]) {
    const records = fixture(); mutate(records); assert.throws(() => assertAudioGroup(records))
  }
})
test('each audio mode requires complete distinct samples, input, reentry, playback, mute and cleanup evidence', () => {
  for (const mode of ['native', 'fallback']) for (const mutate of [
    r => r.samples.pop(), r => { r.samples[1] = r.samples[0] }, r => { r.samples[0].dpr = 9 },
    r => { r.samples[0].file = 'other.png' }, r => r.inputBudgets.pop(), r => r.inputBudgets.push(r.inputBudgets[0]),
    r => { r.inputBudgets[0].status = 'failed' }, r => { r.popupPreparations[0].fallback = mode === 'native' },
    r => { delete r.popupPreparations[0].afterReentry }, r => { r.popupPreparations[0].sameOwner = false },
    r => r.checks.splice(0, 1), r => { r.checks[1] = r.checks[0] }, r => { r.checks[0].fallback = mode === 'native' },
    r => { r.checks.find(c => c.phase === 'mute-keyboard-reachability').status = 'failed' },
    r => { r.checks = r.checks.filter(c => !c.pendingPointerTarget) }, r => { r.checks = r.checks.filter(c => !c.recoveredAudioContext) },
    r => r.browserOwners.pop(), r => { r.browserOwners[1] = r.browserOwners[0] },
    r => { r.completedModes = [] }, r => { r.cleanupErrors = ['close failed'] }, r => r.traceWriteErrors.push('write failed'),
  ]) {
    const result = audioResult(mode); mutate(result); assert.throws(() => assertAudioResult(mode, result))
  }
})
function pauseResult(mode) {
  const records = [], fullscreen = [], fallback = mode === 'fallback'
  for (const [width, height] of [[320, 240], [640, 480], [800, 450], [1920, 1080]]) {
    const size = `${width}x${height}`
    fullscreen.push({ fallback, label: `root-${size}` })
    for (const category of ['Game', 'Sound', 'Graphics']) fullscreen.push({ fallback, label: `options-${category}-${size}` })
    for (const panel of ['save', 'load']) {
      records.push({ fallback, panel, viewport: { width, height } })
      if (width !== 320) fullscreen.push({ fallback, label: `${panel}-${size}` })
    }
  }
  return { executionContract: { version: 'pause-style-split-v1', mode, primary: false }, records, fullscreen }
}
async function pauseAdapterFixture(t, corrupt, audioCorrupt) {
  const output = fixture(t), candidateRoot = resolve(output, 'candidate'), infrastructureRoot = resolve(output, 'trusted')
  for (const episode of episodes) {
    const root = episode.owner === 'candidate' ? candidateRoot : infrastructureRoot
    if (episode.audioMode) put(root, episode.path, read(episode.path))
    else if (!episode.pauseMode) put(root, episode.path, `export ${episode.exportName ? 'async function '+episode.exportName : 'default async function'} () { return { status: 'passed' } }`)
    else put(root, episode.path, `export { run${episode.pauseMode === 'native' ? 'Native' : 'Fallback'}PauseStyle as default } from './original-pause-checkpoint-style.mjs'`)
  }
  put(candidateRoot, 'scripts/browser-new-game.mjs', 'export async function waitForStartupMenu() {}')
  put(candidateRoot, 'scripts/local-render/original-pause-checkpoint-style.mjs', `
    import assert from 'node:assert/strict'; import { writeFileSync } from 'node:fs'; import { resolve } from 'node:path';
    const result = ${pauseResult.toString()};
    async function run(args, mode) {
      assert.equal(args.page, undefined); assert.equal(args.context, undefined);
      const context = await args.browser.newContext(); await context.newPage(); await context.close();
      writeFileSync(resolve(args.output, 'executed.json'), JSON.stringify({ mode, primary: false }));
      const value = result(mode); if (${JSON.stringify(corrupt)} === mode) value.fullscreen.pop(); return value;
    }
    export const runNativePauseStyle = args => run(args, 'native');
    export const runFallbackPauseStyle = args => run(args, 'fallback');
    export default function () { throw Error('Legacy combined default must not execute'); }
  `)
  put(infrastructureRoot, 'scripts/native-ui-evidence/options-audio-control-style.mjs', `
    import assert from 'node:assert/strict'; import { writeFileSync } from 'node:fs'; import { resolve } from 'node:path';
    const result = ${audioResult.toString()};
    async function run(args, mode) {
      assert.equal(args.page, undefined); assert.equal(args.context, undefined);
      args.signal.throwIfAborted(); assert.ok(args.deadlineAt > Date.now());
      args.receipt.observedDeadline = args.deadlineAt;
      const context = await args.browser.newContext({ audioMode: mode }); await context.newPage();
      writeFileSync(resolve(args.output, 'executed.json'), JSON.stringify({ mode, primary: false, deadlineAt: args.deadlineAt }));
      await context.close();
      const value = result(mode), corrupt = ${JSON.stringify(audioCorrupt)};
      if (corrupt === 'incomplete-' + mode) value.samples.pop();
      if (corrupt === 'wrong-' + mode) value.executionContract.mode = mode === 'native' ? 'fallback' : 'native';
      return value;
    }
    export const runNativeAudioStyle = args => run(args, 'native');
    export const runFallbackAudioStyle = args => run(args, 'fallback');
    export default function () { throw Error('Legacy combined audio default must not execute'); }
  `)
  const browser = { async newContext(options) {
    const context = new Context(), create = context.newPage.bind(context)
    if (audioCorrupt === 'cleanup-' + options?.audioMode) {
      const close = context.close.bind(context)
      context.close = async () => { await close(); throw Error('audio context cleanup failed') }
    }
    context.newPage = async () => { const page = await create(); page.goto = async () => {}; page.getByRole = () => ({ waitFor: async () => {} }); return page }
    return context
  }, async close() {} }
  return { output, candidateRoot, infrastructureRoot, browser, url: 'http://fixture', signal: new AbortController().signal }
}
test('adapter executes BOTH primary:false wrappers and persists exact split contracts and coverage', async t => {
  const args = await pauseAdapterFixture(t)
  const result = await runNativeUiEvidence(args)
  assert.equal(result.status, 'passed')
  const ledger = JSON.parse(readFileSync(resolve(args.output, 'episodes.json')))
  for (const mode of ['native', 'fallback']) {
    const record = ledger.episodes.find(e => e.id === `pause-checkpoint-${mode}`)
    assert.deepEqual(record.executionContract, { version: 'pause-style-split-v1', mode, primary: false })
    assert.deepEqual(JSON.parse(readFileSync(resolve(args.output, record.id, 'executed.json'))), { mode, primary: false })
    assert.equal(record.result.records.length, 8); assert.equal(record.result.fullscreen.length, 22)
  }
})
test('adapter never marks incomplete split coverage passed and never skips a failed native variant', async t => {
  for (const mode of ['native', 'fallback']) {
    const args = await pauseAdapterFixture(t, mode)
    await assert.rejects(runNativeUiEvidence(args), /fullscreen focus/)
    const ledger = JSON.parse(readFileSync(resolve(args.output, 'episodes.json')))
    assert.equal(ledger.status, 'failed')
    assert.equal(ledger.episodes.find(e => e.id === `pause-checkpoint-${mode}`).status, 'failed')
    if (mode === 'native') assert.equal(ledger.episodes.at(-1).status, 'not-run')
  }
})

test('adapter executes both fixed audio wrappers with separate original deadlines and exact persisted coverage', async t => {
  const args = await pauseAdapterFixture(t)
  await runNativeUiEvidence(args)
  const ledger = JSON.parse(readFileSync(resolve(args.output, 'episodes.json')))
  for (const mode of ['native', 'fallback']) {
    const record = ledger.episodes.find(e => e.id === `options-audio-${mode}`)
    assert.deepEqual(record.executionContract, { version: 'audio-style-split-v1', mode, primary: false })
    assert.equal(record.capMs, 90000)
    assert.equal(record.receipt.observedDeadline, record.deadlineAt)
    assert.deepEqual(JSON.parse(readFileSync(resolve(args.output, record.id, 'executed.json'))),
      { mode, primary: false, deadlineAt: record.deadlineAt })
    assert.equal(record.status, 'passed'); assert.equal(record.cleanupVerified, true)
    assertAudioResult(mode, record.result)
  }
  const audio = episodes.filter(e => e.audioMode)
  assert.equal(audio.reduce((total, e) => total + e.capMs, 0), 180000)
  assert.equal(limits.browserMs, 720000)
})
test('incomplete, wrong-mode and cleanup-failed audio flows stay failed and prevent subsequent dispatch', async t => {
  for (const mode of ['native', 'fallback']) for (const failure of ['incomplete', 'wrong', 'cleanup']) {
    const args = await pauseAdapterFixture(t, undefined, `${failure}-${mode}`)
    await assert.rejects(runNativeUiEvidence(args))
    const ledger = JSON.parse(readFileSync(resolve(args.output, 'episodes.json')))
    const index = ledger.episodes.findIndex(e => e.id === `options-audio-${mode}`)
    assert.equal(ledger.status, 'failed'); assert.equal(ledger.episodes[index].status, 'failed')
    assert.equal(ledger.episodes[index].cleanupVerified, false)
    assert.ok(ledger.episodes.slice(index + 1).every(e => e.status === 'not-run' && !e.cleanupVerified))
    if (failure === 'cleanup') assert.match(ledger.episodes[index].error, /audio context cleanup failed/)
  }
})
test('actual fixed audio entries preserve abort/deadline rejection, close admitted contexts, and retain combined standalone identity', async t => {
  for (const [mode, run] of [['native', runNativeAudioStyle], ['fallback', runFallbackAudioStyle], ['combined', runCombinedAudioStyle]]) {
    for (const boundary of ['expired', 'aborted', 'admitted']) {
      const output = fixture(t), abort = new AbortController(), reason = Error('audio stopped')
      let contexts = 0, closed = 0
      if (boundary === 'aborted') abort.abort(reason)
      const args = { output, receipt: {}, signal: abort.signal, deadlineAt: boundary === 'expired' ? Date.now() - 1 : Date.now() + 90000,
        // No caller-provided mode can relabel the fixed export.
        mode: 'wrong', browser: { async newContext() {
          contexts++; abort.abort(reason)
          return { async close() { closed++ }, async newPage() { assert.fail('No work after abort') } }
        } } }
      await assert.rejects(run(args), error => boundary === 'expired' ? /deadline/.test(String(error)) : error === reason)
      const trace = JSON.parse(readFileSync(resolve(output, 'options-audio.json')))
      assert.deepEqual(trace.executionContract, { version: 'audio-style-split-v1', mode, primary: false })
      assert.equal(trace.status, 'failed'); assert.deepEqual(trace.completedModes, [])
      assert.equal(contexts, boundary === 'admitted' ? 1 : 0); assert.equal(closed, contexts)
    }
  }
})

// The candidate-only assertions must remain present and mandatory, not silently
// disappear from acceptance when they are separated from default-branch units.
test('candidate-wide audio probe assertion is preserved verbatim outside main helper units', () => {
  const contract = read('scripts/native-ui-evidence/candidate-audio-probes-contract.mjs')
  const marker = "test('active audio probes use Options and retain their original pending, failure and transport scenarios', () => {"
  assert.equal(contract.indexOf(marker), contract.lastIndexOf(marker))
  assert.ok(contract.includes(marker))
  assert.equal(createHash('sha256').update(contract.slice(contract.indexOf(marker))).digest('hex'), 'ea925636012c968fb00bc915021d6b7c49bb46eb79c0e40c3643a8229668d7cd')
  assert.doesNotMatch(read('tests/browser-options-audio.test.mjs'), /active audio probes use Options/)
})
test('exact candidate source contract runs with candidate cwd before build and must pass', () => {
  const runner = read('scripts/native-ui-evidence/run.mjs')
  const start = runner.indexOf("stage = 'candidate-audio-source-contract'")
  const build = runner.indexOf("stage = 'candidate-build'")
  assert.ok(start > runner.indexOf('candidateSource = sourceManifest') && build > start)
  const gate = runner.slice(start, build)
  assert.match(gate, /report\.candidateAudioSourceContract = await supervise/)
  assert.match(gate, /'--test', '--test-concurrency=1', resolve\(import\.meta\.dirname, 'candidate-audio-probes-contract\.mjs'\)/)
  assert.match(gate, /cwd: candidateRoot/)
  assert.match(gate, /capMs: 30000/)
  assert.match(gate, /artifactInventory\(output\)/)
  assert.match(gate, /assert\.equal\(report\.candidateAudioSourceContract\.status, 'passed'/)
})

