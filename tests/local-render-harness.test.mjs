import test from 'node:test'
import assert from 'node:assert/strict'
import { launchOptions, parseOptions } from '../scripts/local-render/harness.mjs'
test('local launch preserves sandbox and removes all unsafe Playwright defaults', () => {
  const options = launchOptions('/tmp/official-headless-shell')
  assert.equal(options.chromiumSandbox, true)
  assert.equal(options.ignoreDefaultArgs, true)
  assert.deepEqual(options.args, ['--remote-debugging-pipe'])
  assert.ok(!JSON.stringify(options).includes('--no-sandbox'))
  assert.ok(!JSON.stringify(options).includes('--enable-unsafe-swiftshader'))
  assert.throws(() => launchOptions(''), /installed official/)
})
test('CLI accepts separate game root, owned output, browser and bounded settings', () => {
  const options = parseOptions(['--game-root', '/tmp/game', '--port', '4199', '--output', '/tmp/proof', '--browser', '/tmp/shell', '--mission', '3', '--timeout', '90000'])
  assert.equal(options.gameRoot, '/tmp/game'); assert.equal(options.port, 4199)
  assert.equal(options.output, '/tmp/proof'); assert.equal(options.browserPath, '/tmp/shell')
  assert.equal(options.mission, 3); assert.equal(options.timeout, 90000)
})
test('CLI rejects unknown flags, missing values and unbounded inputs', () => {
  for (const args of [['--no-sandbox', 'true'], ['--port'], ['--port', '80'], ['--port', 'NaN'], ['--mission', '0'], ['--timeout', '-1']]) assert.throws(() => parseOptions(args))
})

import { EventEmitter } from 'node:events'
import vm from 'node:vm'
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import { sourceReceipt } from '../scripts/local-render/harness.mjs'
import { sourceReceipt as profileSourceReceipt } from '../scripts/local-render/owned-profile.mjs'

test('harness preserves the exact side-effect-free source fingerprint export', () => {
  assert.equal(sourceReceipt, profileSourceReceipt)
})

test('source fingerprint catches dirty tracked and untracked byte drift with unchanged porcelain', () => {
  const root = mkdtempSync(join(tmpdir(), 'local-render-source-'))
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { stdio: 'pipe' })
  try {
    git('init'); git('config', 'user.name', 'Test Fixture'); git('config', 'user.email', 'fixture@example.invalid')
    writeFileSync(join(root, 'tracked.txt'), 'original'); git('add', '.'); git('commit', '-m', 'fixture')
    writeFileSync(join(root, 'tracked.txt'), 'first dirty bytes')
    const first = sourceReceipt(root)
    writeFileSync(join(root, 'tracked.txt'), 'second dirty bytes')
    const second = sourceReceipt(root)
    assert.equal(first.status, second.status); assert.notEqual(first.fingerprint, second.fingerprint)
    writeFileSync(join(root, 'untracked.txt'), 'first untracked bytes')
    const third = sourceReceipt(root)
    writeFileSync(join(root, 'untracked.txt'), 'second untracked bytes')
    const fourth = sourceReceipt(root)
    assert.equal(third.status, fourth.status); assert.notEqual(third.fingerprint, fourth.fingerprint)
    assert.equal(sourceReceipt(root).fingerprint, fourth.fingerprint)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

// Exercise the exact production function with runtime-only fakes. No browser,
// network, process, or screenshot is real in these cancellation regression tests.
async function lateScenarioResult(trigger) {
  let persisted, scenarioStarted = false, screenshotCalls = 0, browserClosed = false
  let releaseScreenshot
  const lateCompletion = new Promise(resolve => { releaseScreenshot = resolve })
  const fakeProcess = new EventEmitter()
  fakeProcess.env = {}; fakeProcess.argv = []; fakeProcess.cwd = () => '/fixture'
  fakeProcess.kill = () => { server.exitCode = 0; server.emit('exit', 0) }
  const stream = new EventEmitter(); stream.pipe = () => {}
  const server = new EventEmitter(); server.pid = 100; server.exitCode = null
  server.stdout = stream; server.stderr = new EventEmitter(); server.stderr.pipe = () => {}
  const page = { on() {}, setDefaultTimeout() {}, async goto() {}, getByRole: () => ({ async waitFor() {} }), async screenshot() { screenshotCalls++; await lateCompletion } }
  const context = { on() {}, async newPage() { return page }, pages: () => [page] }
  const browser = { version: () => 'test-only', isConnected: () => !browserClosed, async newContext() { return context }, contexts: () => [context], async close() { browserClosed = true } }
  let source = readFileSync(new URL('../scripts/local-render/harness.mjs', import.meta.url), 'utf8')
  source = source.slice(0, source.indexOf('\nif (process.argv[1]'))
    .replace(/^import .*$/gm, '').replace(/^export \{ sourceReceipt \}$/gm, '').replaceAll('export ', '')
    .replaceAll('import.meta.url', JSON.stringify('file:///fixture/scripts/local-render/harness.mjs'))
    .replace("const { bindGame } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)", 'const bindGame = async () => {}')
  const sandbox = {
    sourceReceipt: () => ({ fingerprint: 'fixed-clean-identity' }),
    console, resolve, dirname, fileURLToPath, pathToFileURL, createHash, AbortController, AbortSignal, structuredClone,
    process: fakeProcess, setTimeout: (fn, ms) => setTimeout(fn, ms === 250 ? 1 : ms), clearTimeout,
    mkdirSync() {}, existsSync: () => true,
    writeFileSync: (_, text) => { persisted = JSON.parse(text) },
    createWriteStream: () => ({ end() {} }),
    execFileSync: (_, args) => args.includes('rev-parse') ? 'fixed-clean-identity\n' : '',
    createRequire: () => () => ({ chromium: { async launch() { return browser } } }),
    spawn: () => { setTimeout(() => stream.emit('data', 'Local: http://127.0.0.1:4188'), 0); return server },
    fetch: async () => ({ ok: true }),
  }
  vm.runInNewContext(source + '\nglobalThis.run = runLocalBrowser', sandbox)
  const scenario = async ({ signal }) => {
    scenarioStarted = true
    if (trigger === 'interrupt') setTimeout(() => fakeProcess.emit('SIGINT'), 0)
    await new Promise(resolve => signal.addEventListener('abort', resolve, { once: true }))
    releaseScreenshot()
    return { completedAfterAbort: true }
  }
  await assert.rejects(sandbox.run({ gameRoot: '/fixture', output: '/proof', browserPath: '/official-shell', port: 4188, timeout: 100 }, scenario), trigger === 'timeout' ? /exceeded 100ms/ : /Interrupted/)
  assert.equal(scenarioStarted, true)
  assert.equal(screenshotCalls, 1)
  assert.equal(browserClosed, true)
  assert.equal(persisted.status, 'failed')
  assert.equal(Object.hasOwn(persisted, 'result'), false)
  assert.match(persisted.failure, trigger === 'timeout' ? /exceeded 100ms/ : /Interrupted/)
}
test('active scenario completing during timeout diagnostics cannot turn failure into pass', () => lateScenarioResult('timeout'))
test('active scenario completing during interrupt diagnostics cannot turn failure into pass', () => lateScenarioResult('interrupt'))
