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
  const options = parseOptions([
    '--game-root',
    '/tmp/game',
    '--port',
    '4199',
    '--output',
    '/tmp/proof',
    '--browser',
    '/tmp/shell',
    '--mission',
    '3',
    '--timeout',
    '90000',
  ])
  assert.equal(options.gameRoot, '/tmp/game')
  assert.equal(options.port, 4199)
  assert.equal(options.output, '/tmp/proof')
  assert.equal(options.browserPath, '/tmp/shell')
  assert.equal(options.mission, 3)
  assert.equal(options.timeout, 90000)
})
test('CLI rejects unknown flags, missing values and unbounded inputs', () => {
  for (const args of [
    ['--no-sandbox', 'true'],
    ['--port'],
    ['--port', '80'],
    ['--port', 'NaN'],
    ['--mission', '0'],
    ['--timeout', '-1'],
  ])
    assert.throws(() => parseOptions(args))
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
    git('init')
    git('config', 'user.name', 'Test Fixture')
    git('config', 'user.email', 'fixture@example.invalid')
    writeFileSync(join(root, 'tracked.txt'), 'original')
    git('add', '.')
    git('commit', '-m', 'fixture')
    writeFileSync(join(root, 'tracked.txt'), 'first dirty bytes')
    const first = sourceReceipt(root)
    writeFileSync(join(root, 'tracked.txt'), 'second dirty bytes')
    const second = sourceReceipt(root)
    assert.equal(first.status, second.status)
    assert.notEqual(first.fingerprint, second.fingerprint)
    writeFileSync(join(root, 'untracked.txt'), 'first untracked bytes')
    const third = sourceReceipt(root)
    writeFileSync(join(root, 'untracked.txt'), 'second untracked bytes')
    const fourth = sourceReceipt(root)
    assert.equal(third.status, fourth.status)
    assert.notEqual(third.fingerprint, fourth.fingerprint)
    assert.equal(sourceReceipt(root).fingerprint, fourth.fingerprint)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

// Exercise the exact production function with runtime-only fakes. No browser,
// network, process, or screenshot is real in these cancellation regression tests.
async function lateScenarioResult(trigger) {
  let persisted,
    scenarioStarted = false,
    screenshotCalls = 0,
    browserClosed = false
  let releaseScreenshot
  const lateCompletion = new Promise(resolve => {
    releaseScreenshot = resolve
  })
  const fakeProcess = new EventEmitter()
  fakeProcess.env = {}
  fakeProcess.argv = []
  fakeProcess.cwd = () => '/fixture'
  fakeProcess.kill = () => {
    server.exitCode = 0
    server.emit('exit', 0)
  }
  const stream = new EventEmitter()
  stream.pipe = () => {}
  const server = new EventEmitter()
  server.pid = 100
  server.exitCode = null
  server.stdout = stream
  server.stderr = new EventEmitter()
  server.stderr.pipe = () => {}
  const page = {
    on() {},
    setDefaultTimeout() {},
    async goto() {},
    getByRole: () => ({ async waitFor() {} }),
    async screenshot() {
      screenshotCalls++
      await lateCompletion
    },
  }
  const context = {
    on() {},
    async newPage() {
      return page
    },
    pages: () => [page],
  }
  const browser = {
    version: () => 'test-only',
    isConnected: () => !browserClosed,
    async newContext() {
      return context
    },
    contexts: () => [context],
    async close() {
      browserClosed = true
    },
  }
  let source = readFileSync(new URL('../scripts/local-render/harness.mjs', import.meta.url), 'utf8')
  source = source
    .slice(0, source.indexOf('\nif (process.argv[1]'))
    .replace(/^import[\s\S]*?from '[^']+'\n/gm, '')
    .replace(/^export \{ sourceReceipt \}$/gm, '')
    .replaceAll('export ', '')
    .replaceAll(
      'import.meta.url',
      JSON.stringify('file:///fixture/scripts/local-render/harness.mjs')
    )
    .replace(
      "const { bindGame } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)",
      'const bindGame = async () => {}'
    )
  const sandbox = {
    sourceReceipt: () => ({ fingerprint: 'fixed-clean-identity' }),
    console,
    resolve,
    dirname,
    fileURLToPath,
    pathToFileURL,
    createHash,
    AbortController,
    AbortSignal,
    structuredClone,
    process: fakeProcess,
    setTimeout: (fn, ms) => setTimeout(fn, ms === 250 ? 1 : ms),
    clearTimeout,
    mkdirSync() {},
    existsSync: () => true,
    writeFileSync: (_, text) => {
      persisted = JSON.parse(text)
    },
    createWriteStream: () => ({ end() {} }),
    execFileSync: (_, args) => (args.includes('rev-parse') ? 'fixed-clean-identity\n' : ''),
    createRequire: () => () => ({
      chromium: {
        async launch() {
          return browser
        },
      },
    }),
    spawn: () => {
      setTimeout(() => stream.emit('data', 'Local: http://127.0.0.1:4188'), 0)
      return server
    },
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
  await assert.rejects(
    sandbox.run(
      {
        gameRoot: '/fixture',
        output: '/proof',
        browserPath: '/official-shell',
        port: 4188,
        timeout: 100,
      },
      scenario
    ),
    trigger === 'timeout' ? /exceeded 100ms/ : /Interrupted/
  )
  assert.equal(scenarioStarted, true)
  assert.equal(screenshotCalls, 1)
  assert.equal(browserClosed, true)
  assert.equal(persisted.status, 'failed')
  assert.equal(Object.hasOwn(persisted, 'result'), false)
  assert.match(persisted.failure, trigger === 'timeout' ? /exceeded 100ms/ : /Interrupted/)
}
test('active scenario completing during timeout diagnostics cannot turn failure into pass', () =>
  lateScenarioResult('timeout'))
test('active scenario completing during interrupt diagnostics cannot turn failure into pass', () =>
  lateScenarioResult('interrupt'))

const blockedFetchPorts = [
  1719, 1720, 1723, 2049, 3659, 4045, 4190, 5060, 5061, 6000, 6566, 6665, 6666, 6667, 6668, 6669,
  6679, 6697, 10080,
]
test('CLI rejects every Fetch-blocked nonprivileged port and preserves allowed defaults', () => {
  for (const port of blockedFetchPorts)
    assert.throws(() => parseOptions(['--port', String(port)]), /blocked by Fetch/)
  assert.equal(parseOptions([]).port, 4188)
  for (const port of [1024, 4188, 4189, 4191, 65535])
    assert.equal(parseOptions(['--port', String(port)]).port, port)
})

async function startupFixture({
  port = 4188,
  timeout = 120000,
  responses = [],
  listening = true,
  pending = false,
  interrupt = false,
  exit = false,
  profile = false,
} = {}) {
  const calls = {
      mkdir: 0,
      profile: 0,
      spawn: 0,
      fetch: 0,
      launch: 0,
      close: 0,
      finish: 0,
      killed: [],
    },
    timers = []
  let persisted,
    now = 0
  const process = new EventEmitter()
  process.env = {}
  process.argv = []
  process.cwd = () => '/fixture'
  const server = new EventEmitter(),
    stdout = new EventEmitter(),
    stderr = new EventEmitter()
  stderr.pipe = () => {}
  stdout.pipe = stderr.pipe
  Object.assign(server, { pid: 100, exitCode: null, stdout, stderr })
  process.kill = (pid, signal) => {
    calls.killed.push([pid, signal])
    server.exitCode = 0
    server.emit('exit', 0)
  }
  const page = {
    on() {},
    setDefaultTimeout() {},
    async goto() {},
    getByRole: () => ({ async waitFor() {} }),
    isClosed: () => false,
  }
  const context = {
    on() {},
    pages: () => [page],
    route: async () => {},
    routeWebSocket: async () => {},
    browser: () => browser,
    async close() {
      calls.close++
    },
  }
  const browser = {
    version: () => 'supplied fixture',
    isConnected: () => !calls.close,
    newContext: async () => context,
    contexts: () => [context],
    async close() {
      calls.close++
    },
  }
  const launch = async () => {
    calls.launch++
    return browser
  }
  const scenario = async () => ({ reached: true })
  let source = readFileSync(new URL('../scripts/local-render/harness.mjs', import.meta.url), 'utf8')
  source = source
    .slice(0, source.indexOf('\nif (process.argv[1]'))
    .replace(/^import[\s\S]*?from '[^']+'\n/gm, '')
    .replace(/^export \{ sourceReceipt \}$/gm, '')
    .replaceAll('export ', '')
    .replaceAll(
      'import.meta.url',
      JSON.stringify('file:///fixture/scripts/local-render/harness.mjs')
    )
    .replace(
      "const { bindGame } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)",
      'const bindGame = async () => {}'
    )
    .replace(
      'await import(pathToFileURL(resolve(options.scenario)).href)',
      '({ default: suppliedScenario })'
    )
  const require = name =>
    name === '@playwright/test'
      ? {
          chromium: {
            launch,
            launchPersistentContext: async () => {
              calls.launch++
              return context
            },
          },
        }
      : { version: 'supplied fixture' }
  require.resolve = () => '/fixture/package.json'
  const sandbox = {
    resolve,
    dirname,
    fileURLToPath,
    pathToFileURL,
    AbortController,
    AbortSignal,
    structuredClone,
    console,
    process,
    Date: class extends Date {
      static now() {
        return now
      }
    },
    setTimeout(fn, ms) {
      timers.push(ms)
      return setTimeout(
        () => {
          if (ms > 250 && ms <= 60000) now += ms
          fn()
        },
        ms === 250 ? 1 : ms <= 60000 ? 20 : 100
      )
    },
    clearTimeout,
    sourceReceipt: () => ({ fingerprint: 'fixed' }),
    mkdirSync() {
      calls.mkdir++
    },
    existsSync: path => !path.endsWith('receipt.json') && !path.endsWith('server.log'),
    createWriteStream: () => ({ end() {} }),
    writeFileSync: (_, text) => {
      persisted = JSON.parse(text)
    },
    readFileSync: () => 'fixture bytes',
    sha256: () => 'fixed',
    validateProfilePaths() {},
    profileInputReceipt: () => ({}),
    persistentLaunchOptions: options => options,
    acquireProfile() {
      calls.profile++
      return {
        dataDir: '/fixture/profile/browser',
        profile: { mode: 'created' },
        finish(receipt) {
          calls.finish++
          assert.equal(receipt.profile.cleanupVerified, true)
        },
      }
    },
    readCommittedCheckpoint: async () => null,
    createRequire: () => require,
    suppliedScenario: scenario,
    spawn() {
      calls.spawn++
      queueMicrotask(() => {
        if (listening) stdout.emit('data', `http://127.0.0.1:${port}`)
        if (exit) server.exitCode = 2
        if (interrupt) process.emit('SIGTERM')
      })
      return server
    },
    async fetch(_, { signal }) {
      calls.fetch++
      if (pending)
        return new Promise((_, reject) =>
          signal.addEventListener('abort', () => reject(signal.reason), { once: true })
        )
      const next = responses.shift() ?? { ok: true, status: 204 }
      if (next instanceof Error) throw next
      return next
    },
  }
  vm.runInNewContext(source + '\nglobalThis.run = runLocalBrowser', sandbox)
  let failure
  try {
    await sandbox.run(
      {
        gameRoot: '/fixture',
        output: '/proof',
        browserPath: '/official-shell',
        port,
        timeout,
        ...(profile ? { profile: '/fixture/profile', scenario: '/fixture/scenario.mjs' } : {}),
      },
      scenario
    )
  } catch (error) {
    failure = error
  }
  return { calls, timers, persisted, failure, process }
}
test('direct API rejects blocked ports before output/profile/server or fetch acquisition', async () => {
  const result = await startupFixture({ port: 4190, profile: true })
  assert.match(String(result.failure), /blocked by Fetch/)
  assert.equal(
    result.calls.mkdir +
      result.calls.profile +
      result.calls.spawn +
      result.calls.fetch +
      result.calls.launch,
    0
  )
  assert.equal(result.persisted, undefined)
})
test('readiness keeps first/last retry facts and accepts a real successful response only', async () => {
  const result = await startupFixture({
    responses: [
      new TypeError('fetch failed', { cause: new Error('connection refused') }),
      { ok: false, status: 503 },
      { ok: true, status: 204 },
    ],
  })
  assert.equal(result.failure, undefined)
  assert.equal(result.calls.launch, 1)
  const evidence = result.persisted.readiness
  assert.equal(evidence.attempts, 3)
  assert.equal(evidence.first.error.cause, 'connection refused')
  assert.equal(evidence.last.status, 204)
  assert.equal(evidence.ready, true)
})
test('deterministic nested bad-port failure stops after one fetch and closes only owned server/profile', async () => {
  const result = await startupFixture({
    profile: true,
    responses: [new TypeError('fetch failed', { cause: new Error('bad port') })],
  })
  assert.match(String(result.failure), /bad port/)
  assert.equal(result.calls.fetch, 1)
  assert.equal(result.calls.launch, 0)
  assert.equal(result.calls.finish, 1)
  assert.equal(result.persisted.readiness.first.error.cause, 'bad port')
  assert.equal(result.persisted.readiness.attempts, 1)
  assert.ok(result.calls.killed.every(([pid]) => pid === -100))
  assert.equal(result.process.listenerCount('SIGINT') + result.process.listenerCount('SIGTERM'), 0)
})
test('server readiness ceiling bounds pending fetch and retains elapsed failure facts', async () => {
  const result = await startupFixture({ pending: true })
  assert.match(String(result.failure), /readiness exceeded 60000ms/)
  assert.equal(result.calls.fetch, 1)
  assert.equal(result.calls.launch, 0)
  assert.equal(result.persisted.readiness.timeoutMs, 60000)
  assert.equal(result.persisted.readiness.elapsedMs, 60000)
  assert.equal(result.persisted.readiness.ready, false)
  assert.match(result.persisted.readiness.abortReason, /readiness exceeded 60000ms/)
  assert.ok(result.persisted.readiness.first.pending || result.persisted.readiness.first.error)
})
test('startup ceiling never exceeds overall timeout and also bounds a server that never announces listening', async () => {
  const result = await startupFixture({ timeout: 1000, listening: false })
  assert.match(String(result.failure), /readiness exceeded 1000ms|Run exceeded 1000ms/)
  assert.equal(result.persisted.readiness.timeoutMs, 1000)
  assert.equal(result.persisted.readiness.attempts, 0)
  assert.equal(result.calls.fetch + result.calls.launch, 0)
})
test('startup child exit and interruption use existing terminal cleanup without browser launch', async () => {
  for (const options of [{ exit: true }, { interrupt: true, pending: true }]) {
    const result = await startupFixture(options)
    assert.match(String(result.failure), options.exit ? /Local server exited 2/ : /Interrupted/)
    assert.equal(result.calls.launch, 0)
    assert.equal(result.persisted.status, 'failed')
    assert.ok(result.calls.killed.every(([pid]) => pid === -100))
    assert.equal(
      result.process.listenerCount('SIGINT') + result.process.listenerCount('SIGTERM'),
      0
    )
  }
})

test('readiness diagnostics keep bounded first/last facts without an unbounded retry history', async () => {
  const failure = new Error('x'.repeat(2048), { cause: new Error('y'.repeat(2048)) })
  const result = await startupFixture({
    responses: [
      failure,
      { ok: false, status: 503 },
      { ok: false, status: 502 },
      { ok: true, status: 204 },
    ],
  })
  assert.equal(result.failure, undefined)
  const evidence = result.persisted.readiness
  assert.equal(evidence.attempts, 4)
  assert.equal(evidence.first.error.message.length, 512)
  assert.equal(evidence.first.error.cause.length, 512)
  assert.equal(evidence.last.status, 204)
  assert.ok(!Object.values(evidence).some(Array.isArray))
})
