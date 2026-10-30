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

// Match the whole maintained import boundary. Lifecycle tests must neither
// execute a real dynamic browser import nor silently accept a changed binding.
function bindBrowserGameHelpers(source) {
  const statement = "const { bindGame, showAllMissions, prepareCampaignFixture, launchCampaignMission } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)"
  assert.equal(source.split(statement).length, 2, 'one exact browser-game import boundary')
  return source.replace(statement,
    "const bindGame = async () => { throw Error('Unexpected mission setup in lifecycle fixture') }, showAllMissions = bindGame, prepareCampaignFixture = bindGame, launchCampaignMission = bindGame")
}

// Exercise the exact production function with runtime-only fakes. No browser,
// network, process, or screenshot is real in these cancellation regression tests.
async function lateScenarioResult(trigger) {
  let persisted,
    scenarioStarted = false,
    scenarioCompleted = false,
    screenshotCalls = 0,
    browserClosed = false
  const timers = new Set()
  let beginScreenshot
  const screenshotStarted = new Promise(resolve => {
    beginScreenshot = resolve
  })
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
      beginScreenshot()
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
  source = bindBrowserGameHelpers(source.slice(0, source.indexOf('\nif (process.argv[1]')))
    .replace(/^import[\s\S]*?from '[^']+'\n/gm, '')
    .replace(/^export \{ sourceReceipt \}$/gm, '')
    .replaceAll('export ', '')
    .replaceAll(
      'import.meta.url',
      JSON.stringify('file:///fixture/scripts/local-render/harness.mjs')
    )

  const sandbox = {
    // This VM supplies fixture filesystem bytes; dependency metadata is an explicit boundary stub.
    dependencyReceipt: () => ({ installedLockSha256: createHash('sha256').update('fixture bytes').digest('hex') }),
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
    setTimeout(fn, ms) {
      const timer = { fn, ms }
      timers.add(timer)
      // Readiness polling advances without racing the fixture's deadline.
      if (ms === 250)
        queueMicrotask(() => {
          if (timers.delete(timer)) fn()
        })
      return timer
    },
    clearTimeout: timer => timers.delete(timer),
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
      queueMicrotask(() => stream.emit('data', 'Local: http://127.0.0.1:4188'))
      return server
    },
    fetch: async () => ({ ok: true }),
  }
  vm.runInNewContext(source + '\nglobalThis.run = runLocalBrowser', sandbox)
  const scenario = async ({ signal }) => {
    scenarioStarted = true
    const aborted = new Promise(resolve =>
      signal.addEventListener('abort', resolve, { once: true })
    )
    if (trigger === 'interrupt') fakeProcess.emit('SIGINT')
    else {
      // Readiness has finished and cleared its timer; only the run deadline remains.
      const deadlines = [...timers].filter(timer => timer.ms === 100)
      assert.equal(deadlines.length, 1)
      timers.delete(deadlines[0])
      deadlines[0].fn()
    }
    await aborted
    await screenshotStarted
    scenarioCompleted = true
    return { completedAfterAbort: true }
  }
  const run = sandbox.run(
    {
      gameRoot: '/fixture',
      output: '/proof',
      browserPath: '/official-shell',
      port: 4188,
      timeout: 100,
    },
    scenario
  )
  const rejected = assert.rejects(
    run,
    trigger === 'timeout' ? /exceeded 100ms/ : /Interrupted/
  )
  await Promise.race([
    screenshotStarted,
    run.then(
      () => assert.fail('Harness passed before failure diagnostics'),
      () => assert.fail('Harness rejected before failure diagnostics')
    ),
  ])
  // Drain the scenario's promise chain while the diagnostic screenshot is pending.
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(scenarioCompleted, true)
  assert.equal(persisted, undefined)
  assert.equal(browserClosed, false)
  releaseScreenshot()
  await rejected
  assert.equal(scenarioStarted, true)
  assert.equal(screenshotCalls, 1)
  assert.equal(browserClosed, true)
  assert.equal(persisted.status, 'failed')
  assert.equal(Object.hasOwn(persisted, 'result'), false)
  assert.match(persisted.failure, trigger === 'timeout' ? /exceeded 100ms/ : /Interrupted/)
  assert.equal(timers.size, 0)
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
  pendingFetches = 0,
  interrupt = false,
  exit = false,
  signal,
  signalDuringFetch,
  profile = false,
  beforeTimer = () => {},
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
    timers = [],
    scheduled = new Set()
  let persisted,
    now = 0
  const schedule = (fn, ms) => {
    timers.push(ms)
    const timer = { fn, ms, due: now + ms }
    scheduled.add(timer)
    return timer
  }
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
  source = bindBrowserGameHelpers(source.slice(0, source.indexOf('\nif (process.argv[1]')))
    .replace(/^import[\s\S]*?from '[^']+'\n/gm, '')
    .replace(/^export \{ sourceReceipt \}$/gm, '')
    .replaceAll('export ', '')
    .replaceAll(
      'import.meta.url',
      JSON.stringify('file:///fixture/scripts/local-render/harness.mjs')
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
    // This VM supplies fixture filesystem bytes; dependency metadata is an explicit boundary stub.
    dependencyReceipt: () => ({ installedLockSha256: createHash('sha256').update('fixture bytes').digest('hex') }),
    resolve,
    dirname,
    fileURLToPath,
    pathToFileURL,
    AbortController,
    AbortSignal: {
      any: signals => AbortSignal.any(signals),
      timeout(ms) {
        const controller = new AbortController()
        schedule(() => controller.abort(new DOMException('Fetch timed out', 'TimeoutError')), ms)
        return controller.signal
      },
    },
    structuredClone,
    console,
    process,
    Date: class extends Date {
      static now() {
        return now
      }
    },
    setTimeout: schedule,
    clearTimeout: timer => scheduled.delete(timer),
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
        if (signal) server.signalCode = signal
        if (interrupt) process.emit('SIGTERM')
      })
      return server
    },
    async fetch(_, { signal }) {
      calls.fetch++
      if (signalDuringFetch) server.signalCode = signalDuringFetch
      if (pending || calls.fetch <= pendingFetches)
        return new Promise((_, reject) =>
          signal.addEventListener('abort', () => reject(signal.reason), { once: true })
        )
      const next = responses.shift() ?? { ok: true, status: 204 }
      if (next instanceof Error) throw next
      return next
    },
  }
  vm.runInNewContext(source + '\nglobalThis.run = runLocalBrowser', sandbox)
  let failure,
    settled = false
  const run = sandbox
    .run(
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
    .catch(error => {
      failure = error
    })
    .finally(() => {
      settled = true
    })
  // Drain promise continuations between virtual timers, as the host event loop
  // does. Host scheduling delays must not consume the simulated readiness budget.
  // Advancing the earliest deadline also covers per-fetch and overall timeouts.
  for (let turns = 0; !settled; turns++) {
    await new Promise(resolve => setImmediate(resolve))
    if (settled) break
    assert.ok(turns < 10000, 'Startup fixture exceeded its bounded virtual timer budget')
    const next = [...scheduled].sort((a, b) => a.due - b.due)[0]
    assert.ok(next, 'Startup fixture stalled without a scheduled timer')
    await beforeTimer(next.ms)
    scheduled.delete(next)
    now = next.due
    next.fn()
  }
  await run
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
  // First fetch at 250ms; subsequent attempts every 1500ms timeout + 250ms retry.
  assert.equal(result.calls.fetch, 35)
  assert.equal(result.calls.launch, 0)
  assert.equal(result.persisted.readiness.first.error.name, 'TimeoutError')
  assert.equal(result.persisted.readiness.timeoutMs, 60000)
  assert.equal(result.persisted.readiness.elapsedMs, 60000)
  assert.equal(result.persisted.readiness.ready, false)
  assert.match(result.persisted.readiness.abortReason, /readiness exceeded 60000ms/)
  assert.ok(result.persisted.readiness.last.pending || result.persisted.readiness.last.error)
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

test('readiness retry ordering is independent of host event-loop delay', async () => {
  let delayed = false
  const result = await startupFixture({
    responses: [
      new TypeError('fetch failed'),
      { ok: false, status: 503 },
      { ok: false, status: 502 },
      { ok: true, status: 204 },
    ],
    async beforeTimer(ms) {
      if (ms === 250 && !delayed) {
        delayed = true
        // Exceeds the old fixture's 20ms wall-clock deadline, without spending
        // virtual server time or launching an actual browser/server.
        await new Promise(resolve => setTimeout(resolve, 30))
      }
    },
  })
  assert.equal(delayed, true)
  assert.equal(result.failure, undefined)
  assert.equal(result.calls.fetch, 4)
  assert.equal(result.calls.launch, 1)
  assert.equal(result.persisted.readiness.elapsedMs, 1000)
  assert.equal(result.persisted.readiness.ready, true)
})

test('readiness retries an expired fetch and accepts success within the unchanged ceiling', async () => {
  const result = await startupFixture({ pendingFetches: 1 })
  assert.equal(result.failure, undefined)
  assert.equal(result.calls.fetch, 2)
  assert.equal(result.calls.launch, 1)
  assert.equal(result.persisted.readiness.first.error.name, 'TimeoutError')
  assert.equal(result.persisted.readiness.first.elapsedMs, 1750)
  assert.equal(result.persisted.readiness.last.status, 204)
  assert.equal(result.persisted.readiness.elapsedMs, 2000)
  assert.equal(result.persisted.readiness.timeoutMs, 60000)
  assert.equal(result.persisted.readiness.ready, true)
})

test('startup child signal exits before or during readiness never launch the browser', async () => {
  for (const options of [
    { signal: 'SIGKILL', listening: false },
    { signal: 'SIGKILL', listening: true },
    { signalDuringFetch: 'SIGKILL' },
  ]) {
    const result = await startupFixture(options)
    assert.match(String(result.failure), /Local server exited SIGKILL/)
    assert.equal(result.calls.launch, 0)
    assert.equal(result.calls.fetch, options.signalDuringFetch ? 1 : 0)
    assert.equal(result.persisted.status, 'failed')
    assert.equal(result.persisted.readiness.ready, false)
    if (options.signalDuringFetch) assert.equal(result.persisted.readiness.last.status, 204)
    assert.ok(result.calls.killed.every(([pid]) => pid === -100))
  }
})
