import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, symlinkSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, dirname } from 'node:path'
import vm from 'node:vm'
import yaml from 'js-yaml'
import { manualIdentity, separateRoots, sourceManifest, verifyManifest, homeBuildOptions,
  candidateDependency, candidateDependencyExport, infrastructureInput } from '../scripts/native-ui-evidence/identity.mjs'
import { episodes, limits, acceptEpisode, acceptSeries, boundedEpisode } from '../scripts/native-ui-evidence/policy.mjs'
import { artifactInventory, ownBrowser } from '../scripts/native-ui-evidence/browser-owner.mjs'
import { supervise } from '../scripts/native-ui-evidence/supervise.mjs'
import { failPreferenceWrites } from '../scripts/native-ui-evidence/options-storage-notice-style.mjs'
import { holdAudioResume } from '../scripts/native-ui-evidence/hud-sound-control-style.mjs'
import { runNativeUiEvidence } from '../scripts/native-ui-evidence/adapter.mjs'
import { directoryManifest, publicLinks, verifyBuiltOutput, afterScopes } from '../scripts/native-ui-evidence/files.mjs'

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
  put(candidate, 'node_modules/module/package.json', '{"name":"module","type":"module","main":"index.js"}')
  put(candidate, 'node_modules/module/index.js', 'export const chromium = { launch() {} }; export default { chromium }')
  const moduleNamespace = await import(candidateDependency(candidate, 'module'))
  assert.equal(await candidateDependencyExport(candidate, 'module', 'chromium'), moduleNamespace.chromium)
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
    'scripts/native-ui-evidence/hud-sound-control-style.mjs', 'scripts/tutorial-browser/browser-config.mjs', '.github/workflows/native-ui-evidence.yml']) assert.equal(infrastructureInput(path), true)
  assert.equal(infrastructureInput('app/page.tsx'), false)
})
test('all seven supplements are mandatory with fixed ownership and unchanged 720-second new budget', () => {
  assert.deepEqual(episodes.map(e => e.id), ['startup-logo', 'selector-recovery', 'options-storage', 'checkpoint-notice', 'hud-sound', 'loading-recovery', 'pause-checkpoint'])
  assert.equal(episodes.filter(e => e.owner === 'candidate').length, 5)
  assert.deepEqual(episodes.filter(e => e.owner === 'infrastructure').map(e => e.id), ['options-storage', 'hud-sound'])
  assert.deepEqual(episodes.map(e => e.capMs), [120000, 120000, 90000, 90000, 90000, 90000, 90000])
  assert.deepEqual(limits, { buildMs: 120000, browserMs: 720000, jobMinutes: 20, maxContexts: 2, maxPages: 2,
    screenshots: 100, artifactBytes: 268435456, logBytes: 8388608, heapMiB: 768, cleanupMs: 5000 })
})
test('baseline, skipped, missing, failed, cancelled and late-success episodes cannot pass aggregate', () => {
  for (const bad of [null, undefined, { baseline: true }, { skipped: true }, { status: 'failed' }, { status: 'skipped' }, { status: 'cancelled' }]) assert.throws(() => acceptEpisode(bad))
  const good = episodes.map(e => ({ id: e.id, status: 'passed', timedOut: false, cleanupVerified: true, result: { checks: ['real assertions'] } }))
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
test('all seven explicit not-run records survive abort before the first episode', async t => {
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
test('workflow is isolated read-only manual evidence with two credential-free pinned checkouts and bounded artifacts', () => {
  const workflow = yaml.load(read('.github/workflows/native-ui-evidence.yml'))
  assert.deepEqual(Object.keys(workflow.on), ['workflow_dispatch']); assert.deepEqual(workflow.permissions, { contents: 'read' })
  assert.deepEqual(Object.keys(workflow.jobs), ['evidence'])
  const job = workflow.jobs.evidence
  assert.equal(job['runs-on'], 'ubuntu-24.04'); assert.equal(job['timeout-minutes'], 20)
  const checkouts = job.steps.filter(step => step.uses?.startsWith('actions/checkout@'))
  assert.equal(checkouts.length, 2); assert.ok(checkouts.every(step => step.with['persist-credentials'] === false))
  assert.equal(checkouts[0].with.ref, '${{ github.workflow_sha }}'); assert.equal(checkouts[1].with.ref, '${{ inputs.candidate_sha }}')
  assert.equal(checkouts[1].with.repository, 'JohnDeved/populous-new-dawn')
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
  const hud = read('scripts/native-ui-evidence/hud-sound-control-style.mjs')
  assert.match(hud, /observedSoundContext\?\.state === 'running'/)
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
