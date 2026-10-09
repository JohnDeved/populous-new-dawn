import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, createWriteStream, existsSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import {
  acquireProfile,
  persistentLaunchOptions,
  profileInputReceipt,
  sha256,
  validateProfilePaths,
  sourceReceipt,
} from './owned-profile.mjs'
import { readCommittedCheckpoint } from './checkpoint-observer.mjs'
export { sourceReceipt }
const here = dirname(fileURLToPath(import.meta.url))
export function launchOptions(browserPath) {
  if (!browserPath)
    throw Error('Set --browser or POPULOUS_BROWSER to an installed official Chrome Headless Shell')
  return {
    executablePath: resolve(browserPath),
    headless: true,
    chromiumSandbox: true,
    ignoreDefaultArgs: true,
    args: ['--remote-debugging-pipe'],
    timeout: 30000,
  }
}
// Fetch Standard bad-port table, restricted to this harness's nonprivileged range.
// https://fetch.spec.whatwg.org/#port-blocking (2026-10-09)
function validatePort(port) {
  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error('Port must be an integer from 1024 to 65535')
  if (
    [
      1719, 1720, 1723, 2049, 3659, 4045, 4190, 5060, 5061, 6000, 6566, 6665, 6666, 6667, 6668,
      6669, 6679, 6697, 10080,
    ].includes(port)
  )
    throw new Error(`Port ${port} is blocked by Fetch; choose an allowed local port`)
}
export function parseOptions(args) {
  const options = {
    gameRoot: process.cwd(),
    port: 4188,
    output: 'work/orchestration/local-render',
    mission: 1,
    timeout: 120000,
    browserPath: process.env.POPULOUS_BROWSER,
  }
  const keys = {
    '--game-root': 'gameRoot',
    '--port': 'port',
    '--output': 'output',
    '--browser': 'browserPath',
    '--mission': 'mission',
    '--timeout': 'timeout',
    '--scenario': 'scenario',
    '--profile': 'profile',
    '--profile-correspondence': 'profileCorrespondence',
  }
  for (let i = 0; i < args.length; i += 2) {
    const key = keys[args[i]],
      value = args[i + 1]
    if (!key || !value || value.startsWith('--'))
      throw Error(`Unknown or missing option: ${args[i]}`)
    options[key] = ['port', 'mission', 'timeout'].includes(key) ? Number(value) : value
  }
  validatePort(options.port)
  if (!Number.isInteger(options.mission) || options.mission < 1 || options.mission > 25)
    throw Error('Mission must be 1–25')
  if (!Number.isFinite(options.timeout) || options.timeout < 1000)
    throw Error('Timeout must be at least 1000ms')
  if (options.profileCorrespondence && !options.profile)
    throw Error('Profile correspondence requires --profile')
  return options
}
function profileRuntimeReceipt(root, browserPath, require) {
  return {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    browserPath,
    browserSha256: sha256(readFileSync(browserPath)),
    playwright: require('@playwright/test/package.json').version,
    playwrightCoreSha256: sha256(
      readFileSync(
        resolve(dirname(require.resolve('playwright-core/package.json')), 'lib/coreBundle.js')
      )
    ),
    installedLockSha256: sha256(readFileSync(resolve(root, 'node_modules/.package-lock.json'))),
    harness: Object.fromEntries(
      ['harness.mjs', 'owned-profile.mjs', 'checkpoint-observer.mjs', 'vite.config.mjs'].map(
        name => [name, sha256(readFileSync(resolve(here, name)))]
      )
    ),
  }
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
async function stopServer(server) {
  if (!server?.pid) return
  // Only this invocation's detached process group. Never kill by port or name.
  try {
    process.kill(-server.pid, 'SIGTERM')
  } catch (error) {
    if (error.code !== 'ESRCH') throw error
  }
  if (server.exitCode === null)
    await Promise.race([new Promise(resolve => server.once('exit', resolve)), delay(3000)])
  try {
    process.kill(-server.pid, 'SIGKILL')
  } catch (error) {
    if (error.code !== 'ESRCH') throw error
  }
}
export async function runLocalBrowser(options, scenario) {
  validatePort(options.port)
  const root = resolve(options.gameRoot),
    output = resolve(options.output)
  if (options.profile) {
    validateProfilePaths(root, options.profile, output)
    if (existsSync(resolve(output, 'receipt.json')) || existsSync(resolve(output, 'server.log')))
      throw Error('Persistent runs require a fresh evidence output directory')
  }
  mkdirSync(output, { recursive: true })
  const receipt = {
    startedAt: new Date().toISOString(),
    source: sourceReceipt(root),
    launch: launchOptions(options.browserPath),
    softwarePerformanceOnly: true,
    errors: [],
    warnings: [],
    status: 'running',
  }
  if (!existsSync(receipt.launch.executablePath))
    throw Error(`Browser binary does not exist: ${receipt.launch.executablePath}`)
  const require = createRequire(resolve(root, 'package.json'))
  const { chromium } = require('@playwright/test')
  let browser,
    context,
    page,
    server,
    timer,
    startupTimer,
    readinessStarted,
    launchPromise,
    outcome,
    finalReceipt,
    lease
  let launchAttempted = false,
    cleanupVerified = false,
    checkpointIdentityVerified = false
  const log = createWriteStream(resolve(output, 'server.log'))
  const abort = new AbortController()
  const onSignal = () => abort.abort(Error('Interrupted'))
  process.once('SIGINT', onSignal)
  process.once('SIGTERM', onSignal)
  const url = `http://127.0.0.1:${options.port}`
  const observeCheckpoint = async label => {
    if (!lease) throw Error('Checkpoint provenance requires an owned profile')
    abort.signal.throwIfAborted()
    if (typeof label !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9 -]{0,79}$/.test(label))
      throw Error('Checkpoint label must be short plain text')
    const checkpoint = await readCommittedCheckpoint(page)
    abort.signal.throwIfAborted()
    if (receipt.profile.checkpoints.length >= 256) throw Error('Checkpoint receipt limit reached')
    const observed = {
      label,
      observedAt: new Date().toISOString(),
      profileId: lease.profile.id,
      runId: lease.profile.runId,
      sourceFingerprint: receipt.source.fingerprint,
      checkpoint,
    }
    receipt.profile.checkpoints.push(observed)
    return structuredClone(observed)
  }
  const work = async () => {
    if (options.profile) {
      if (!options.scenario)
        throw Error('Persistent runs must name their scenario source with --scenario')
      const inputs = profileInputReceipt(root, options.scenario)
      if ((await import(pathToFileURL(resolve(options.scenario)).href)).default !== scenario)
        throw Error('Persistent scenario must be the named module’s default export')
      receipt.runtime = profileRuntimeReceipt(root, receipt.launch.executablePath, require)
      receipt.scenario = {
        path: resolve(options.scenario),
        sha256: sha256(readFileSync(resolve(options.scenario))),
      }
      lease = acquireProfile({
        path: options.profile,
        root,
        origin: url,
        source: receipt.source,
        inputs,
        runtime: receipt.runtime,
        output,
        correspondence: options.profileCorrespondence,
      })
      receipt.profile = lease.profile
      receipt.launch = persistentLaunchOptions(receipt.launch, lease.dataDir)
    }
    readinessStarted = Date.now()
    receipt.readiness = {
      timeoutMs: Math.min(60000, options.timeout),
      attempts: 0,
      first: null,
      last: null,
      elapsedMs: 0,
      listening: false,
      ready: false,
    }
    const readiness = receipt.readiness
    startupTimer = setTimeout(
      () =>
        abort.abort(
          Error(
            `Local server readiness exceeded ${readiness.timeoutMs}ms; see readiness facts and server.log`
          )
        ),
      readiness.timeoutMs
    )
    server = spawn(
      resolve(root, 'node_modules/.bin/vite'),
      [
        '--config',
        resolve(here, 'vite.config.mjs'),
        '--host',
        '127.0.0.1',
        '--port',
        String(options.port),
        '--strictPort',
      ],
      {
        cwd: root,
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          POPULOUS_GAME_ROOT: root,
          CLOUDFLARE_CF_FETCH_ENABLED: 'false',
          WRANGLER_SEND_METRICS: 'false',
          WRANGLER_WRITE_LOGS: 'false',
          WRANGLER_LOG_PATH: resolve(output, 'wrangler.log'),
          MINIFLARE_REGISTRY_PATH: resolve(output, 'registry'),
        },
      }
    )
    server.stdout.pipe(log)
    server.stderr.pipe(log)
    let listening = false
    server.stdout.on('data', chunk => {
      if (chunk.toString().includes(`127.0.0.1:${options.port}`)) {
        listening = true
        readiness.listening = true
      }
    })
    let spawnError
    server.once('error', error => {
      spawnError = error
    })
    try {
      for (;;) {
        abort.signal.throwIfAborted()
        if (spawnError) throw spawnError
        if (server.exitCode !== null)
          throw new Error(`Local server exited ${server.exitCode}; see server.log`)
        if (listening) {
          readiness.attempts++
          const fact = { elapsedMs: Date.now() - readinessStarted, pending: true }
          readiness.first ??= fact
          readiness.last = fact
          try {
            const response = await fetch(url, {
              signal: AbortSignal.any([abort.signal, AbortSignal.timeout(1500)]),
            })
            fact.status = response.status
            fact.ok = response.ok
            fact.pending = false
          } catch (error) {
            fact.pending = false
            fact.error = {
              name: String(error?.name ?? '').slice(0, 80),
              message: String(error?.message ?? error).slice(0, 512),
              cause: String(error?.cause?.message ?? error?.cause ?? '').slice(0, 512),
            }
            // Undici wraps deterministic port rejection in TypeError('fetch failed').
            for (let cause = error, depth = 0; cause && depth < 4; cause = cause.cause, depth++)
              if (/\bbad port\b/i.test(String(cause.message)) || cause.code === 'ERR_UNSAFE_PORT')
                throw new Error(
                  `Local server readiness rejected a bad port: ${fact.error.message}; ${fact.error.cause}`,
                  { cause: error }
                )
          } finally {
            fact.elapsedMs = Date.now() - readinessStarted
          }
          abort.signal.throwIfAborted()
          if (spawnError) throw spawnError
          if (server.exitCode !== null)
            throw new Error(`Local server exited ${server.exitCode}; see server.log`)
          if (fact.ok) {
            readiness.ready = true
            break
          }
        }
        await delay(250)
      }
    } finally {
      clearTimeout(startupTimer)
      readiness.elapsedMs = Date.now() - readinessStarted
    }
    abort.signal.throwIfAborted()
    launchAttempted = true
    launchPromise = lease
      ? chromium.launchPersistentContext(lease.dataDir, receipt.launch)
      : chromium.launch(receipt.launch)
    const launched = await launchPromise
    if (lease) {
      context = launched
      browser = context.browser()
    } else {
      browser = launched
      context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
    }
    abort.signal.throwIfAborted()
    receipt.browserVersion = browser.version()
    if (lease) {
      // Persistent state belongs solely to this game's loopback origin.
      await context.route('**/*', route =>
        new URL(route.request().url()).origin === url
          ? route.continue()
          : route.abort('blockedbyclient')
      )
      await context.routeWebSocket('**/*', route => {
        if (new URL(route.url()).origin === url.replace('http:', 'ws:')) route.connectToServer()
        else route.close()
      })
    }
    const watchPage = page => {
      page.on('pageerror', error => receipt.errors.push(String(error)))
      page.on('console', message => {
        if (message.type() === 'error') receipt.errors.push(message.text())
        if (message.type() === 'warning') receipt.warnings.push(message.text())
      })
    }
    context.on('page', watchPage)
    for (const existing of context.pages()) watchPage(existing)
    page = context.pages()[0] ?? (await context.newPage())
    page.setDefaultTimeout(45000)
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await page
      .getByRole('dialog', { name: 'Start game', exact: true })
      .waitFor({ state: 'visible' })
    if (lease) {
      receipt.profile.checkpointAtStart = await readCommittedCheckpoint(page)
      const previous = receipt.profile.previousRun
      if (
        previous &&
        JSON.stringify(receipt.profile.checkpointAtStart) !==
          JSON.stringify(previous.checkpointAtEnd)
      )
        throw Error(
          'Stored checkpoint differs from the previous terminal receipt; continuation is unverified'
        )
      if (!previous && receipt.profile.checkpointAtStart !== null)
        throw Error('New task profile unexpectedly contains a checkpoint')
      checkpointIdentityVerified = true
    }
    const { bindGame } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)
    const openMission = async mission => {
      const button = page.getByRole('button', { name: `Mission ${mission}`, exact: true })
      const allMissions = page.getByRole('button', { name: 'All missions', exact: true })
      if (!(await button.isVisible()) && (await allMissions.isVisible())) await allMissions.click()
      await button.focus()
      await page.keyboard.press('Enter')
      await bindGame(page)
      const skip = page.locator('.skip-introduction')
      await skip.waitFor({ state: 'visible', timeout: 45000 }).catch(() => {})
      if (await skip.isVisible()) await skip.click()
      await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
      await page.evaluate(() => {
        window.testScene = window.testSceneRef.current
      })
    }
    return scenario({
      browser,
      context,
      page,
      url,
      root,
      output,
      openMission,
      receipt,
      observeCheckpoint,
      signal: abort.signal,
    })
  }
  try {
    const result = await Promise.race([
      work(),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => abort.abort(Error(`Run exceeded ${options.timeout}ms`)),
          options.timeout
        )
        abort.signal.addEventListener('abort', () => reject(abort.signal.reason), { once: true })
      }),
    ])
    // Work never owns the terminal outcome. Late scenario completion after an
    // abort cannot overwrite failure while screenshots or cleanup are pending.
    outcome = { status: 'passed', result }
  } catch (error) {
    outcome = { status: 'failed', failure: error.stack ?? String(error) }
    if (browser)
      for (const [index, page] of browser
        .contexts()
        .flatMap(c => c.pages())
        .entries()) {
        await page
          .screenshot({ path: resolve(output, `failure-${index}.png`), timeout: 5000 })
          .catch(() => {})
      }
  } finally {
    clearTimeout(timer)
    clearTimeout(startupTimer)
    if (receipt.readiness && !receipt.readiness.ready) {
      receipt.readiness.elapsedMs = Date.now() - readinessStarted
      if (abort.signal.aborted)
        receipt.readiness.abortReason = String(
          abort.signal.reason?.message ?? abort.signal.reason
        ).slice(0, 512)
    }
    abort.abort()
    if (launchPromise) {
      const launched = await launchPromise.catch(() => null)
      if (lease && launched) {
        context = launched
        browser = context.browser()
      } else if (launched) browser = launched
    }
    if (lease && page && !page.isClosed()) {
      try {
        let timeout
        try {
          receipt.profile.checkpointAtEnd = await Promise.race([
            readCommittedCheckpoint(page),
            new Promise((_, reject) => {
              timeout = setTimeout(() => reject(Error('Terminal checkpoint read timed out')), 5000)
            }),
          ])
        } finally {
          clearTimeout(timeout)
        }
      } catch (error) {
        receipt.profile.checkpointReadFailure = String(error)
      }
    }
    if (lease && !launchAttempted)
      receipt.profile.checkpointAtEnd = receipt.profile.previousRun?.checkpointAtEnd ?? null
    try {
      if (browser) {
        let timeout
        try {
          await Promise.race([
            lease ? context.close() : browser.close(),
            new Promise((_, reject) => {
              timeout = setTimeout(() => reject(Error('Owned browser close timed out')), 10000)
            }),
          ])
        } finally {
          clearTimeout(timeout)
        }
        cleanupVerified = !browser.isConnected()
        if (!cleanupVerified)
          outcome = {
            status: 'failed',
            failure: 'Error: Owned browser remains connected after close',
            previousFailure: outcome.failure,
          }
      } else cleanupVerified = !launchAttempted
    } catch (error) {
      outcome = { status: 'failed', failure: String(error), previousFailure: outcome.failure }
    }
    try {
      await stopServer(server)
    } catch (error) {
      outcome = { status: 'failed', failure: String(error), previousFailure: outcome.failure }
    }
    log.end()
    process.removeListener('SIGINT', onSignal)
    process.removeListener('SIGTERM', onSignal)
    const sourceAfter = sourceReceipt(root)
    if (receipt.source.fingerprint !== sourceAfter.fingerprint)
      outcome = {
        status: 'failed',
        failure: 'Source bytes changed during execution',
        previousFailure: outcome.failure,
      }
    if (lease) {
      receipt.profile.cleanupVerified = cleanupVerified
      receipt.profile.continuationVerified =
        (!launchAttempted || checkpointIdentityVerified) &&
        receipt.source.fingerprint === sourceAfter.fingerprint
      try {
        receipt.runtimeAfter = profileRuntimeReceipt(root, receipt.launch.executablePath, require)
        receipt.scenarioAfter = {
          path: receipt.scenario.path,
          sha256: sha256(readFileSync(receipt.scenario.path)),
        }
        if (
          JSON.stringify(receipt.runtimeAfter) !== JSON.stringify(receipt.runtime) ||
          receipt.scenarioAfter.sha256 !== receipt.scenario.sha256
        ) {
          receipt.profile.continuationVerified = false
          outcome = {
            status: 'failed',
            failure: 'Error: Runtime/scenario bytes changed during execution',
            previousFailure: outcome.failure,
          }
        }
      } catch (error) {
        receipt.profile.continuationVerified = false
        outcome = { status: 'failed', failure: String(error), previousFailure: outcome.failure }
      }
      if (
        !cleanupVerified ||
        !receipt.profile.continuationVerified ||
        !Object.hasOwn(receipt.profile, 'checkpointAtEnd')
      )
        outcome = {
          status: 'failed',
          failure: 'Profile cleanup/checkpoint provenance is unverified; lock retained',
          previousFailure: outcome.failure,
        }
    }
    // Detach nested arrays/results from scenario-owned references before writing.
    finalReceipt = structuredClone({
      ...receipt,
      ...outcome,
      finishedAt: new Date().toISOString(),
      sourceAfter,
    })
    if (finalReceipt.status !== 'passed') delete finalReceipt.result
    writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(finalReceipt, null, 2) + '\n')
    if (
      lease &&
      cleanupVerified &&
      finalReceipt.profile.continuationVerified &&
      Object.hasOwn(finalReceipt.profile, 'checkpointAtEnd')
    ) {
      try {
        lease.finish(finalReceipt, cleanupVerified)
      } catch (error) {
        finalReceipt.status = 'failed'
        finalReceipt.failure = String(error)
        delete finalReceipt.result
        writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(finalReceipt, null, 2) + '\n')
      }
    }
  }
  if (finalReceipt.status !== 'passed') throw Error(finalReceipt.failure)
  return finalReceipt
}
export async function smoke({ page, openMission, output }, mission = 1) {
  await openMission(mission)
  const result = await page.evaluate(() => {
    const scene = window.testScene,
      gl = scene.renderer.getContext(),
      debug = gl.getExtension('WEBGL_debug_renderer_info')
    return {
      level: scene.world.outcome.level,
      turn: scene.world.turn,
      status: scene.world.status,
      webglVersion: gl.getParameter(gl.VERSION),
      renderer: debug
        ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
        : gl.getParameter(gl.RENDERER),
      canvas: [gl.drawingBufferWidth, gl.drawingBufferHeight],
    }
  })
  if (!result.webglVersion.startsWith('WebGL 2.0')) throw Error('Actual game did not create WebGL2')
  await page.screenshot({ path: resolve(output, 'mission.png') })
  return result
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = parseOptions(process.argv.slice(2))
    if (options.profile) profileInputReceipt(resolve(options.gameRoot), options.scenario)
    const scenario = options.scenario
      ? (await import(pathToFileURL(resolve(options.scenario)).href)).default
      : args => smoke(args, options.mission)
    const receipt = await runLocalBrowser(options, scenario)
    console.log(
      JSON.stringify({ status: receipt.status, source: receipt.source, result: receipt.result })
    )
  } catch (error) {
    console.error(error)
    process.exitCode = 1
  }
}
