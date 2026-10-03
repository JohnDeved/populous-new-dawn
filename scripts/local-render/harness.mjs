import { spawn, execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync, createWriteStream, existsSync, readFileSync, lstatSync, readlinkSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
const here = dirname(fileURLToPath(import.meta.url))
export function launchOptions(browserPath) {
  if (!browserPath) throw Error('Set --browser or POPULOUS_BROWSER to an installed official Chrome Headless Shell')
  return { executablePath: resolve(browserPath), headless: true, chromiumSandbox: true,
    ignoreDefaultArgs: true, args: ['--remote-debugging-pipe'], timeout: 30000 }
}
export function parseOptions(args) {
  const options = { gameRoot: process.cwd(), port: 4188, output: 'work/orchestration/local-render', mission: 1, timeout: 120000, browserPath: process.env.POPULOUS_BROWSER }
  const keys = { '--game-root': 'gameRoot', '--port': 'port', '--output': 'output', '--browser': 'browserPath', '--mission': 'mission', '--timeout': 'timeout', '--scenario': 'scenario' }
  for (let i = 0; i < args.length; i += 2) {
    const key = keys[args[i]], value = args[i + 1]
    if (!key || !value || value.startsWith('--')) throw Error(`Unknown or missing option: ${args[i]}`)
    options[key] = ['port', 'mission', 'timeout'].includes(key) ? Number(value) : value
  }
  if (!Number.isInteger(options.port) || options.port < 1024 || options.port > 65535) throw Error('Port must be an integer from 1024 to 65535')
  if (!Number.isInteger(options.mission) || options.mission < 1 || options.mission > 25) throw Error('Mission must be 1–25')
  if (!Number.isFinite(options.timeout) || options.timeout < 1000) throw Error('Timeout must be at least 1000ms')
  return options
}
export function sourceReceipt(root) {
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  const digest = value => createHash('sha256').update(value).digest('hex')
  const untracked = git('ls-files', '--others', '--exclude-standard', '-z').split('\0').filter(Boolean).sort().map(path => {
    const absolute = resolve(root, path), stat = lstatSync(absolute)
    if (!stat.isFile() && !stat.isSymbolicLink()) throw Error(`Cannot fingerprint non-file source: ${path}`)
    return { path, mode: stat.mode, sha256: digest(stat.isSymbolicLink() ? readlinkSync(absolute) : readFileSync(absolute)) }
  })
  const source = { root, commit: git('rev-parse', 'HEAD').trim(), tree: git('rev-parse', 'HEAD^{tree}').trim(), status: git('status', '--porcelain').trim(), trackedDiffSha256: digest(git('diff', '--binary', 'HEAD', '--')), untracked }
  return { ...source, fingerprint: digest(JSON.stringify(source)) }
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
async function stopServer(server) {
  if (!server?.pid) return
  // Only this invocation's detached process group. Never kill by port or name.
  try { process.kill(-server.pid, 'SIGTERM') } catch (error) { if (error.code !== 'ESRCH') throw error }
  if (server.exitCode === null) await Promise.race([new Promise(resolve => server.once('exit', resolve)), delay(3000)])
  try { process.kill(-server.pid, 'SIGKILL') } catch (error) { if (error.code !== 'ESRCH') throw error }
}
export async function runLocalBrowser(options, scenario) {
  const root = resolve(options.gameRoot), output = resolve(options.output)
  mkdirSync(output, { recursive: true })
  const receipt = { startedAt: new Date().toISOString(), source: sourceReceipt(root), launch: launchOptions(options.browserPath), softwarePerformanceOnly: true, errors: [], warnings: [], status: 'running' }
  if (!existsSync(receipt.launch.executablePath)) throw Error(`Browser binary does not exist: ${receipt.launch.executablePath}`)
  const require = createRequire(resolve(root, 'package.json'))
  const { chromium } = require('@playwright/test')
  let browser, server, timer, launchPromise, outcome, finalReceipt
  const log = createWriteStream(resolve(output, 'server.log'))
  const abort = new AbortController()
  const onSignal = () => abort.abort(Error('Interrupted'))
  process.once('SIGINT', onSignal); process.once('SIGTERM', onSignal)
  const url = `http://127.0.0.1:${options.port}`
  const work = async () => {
    server = spawn(resolve(root, 'node_modules/.bin/vite'), ['--config', resolve(here, 'vite.config.mjs'), '--host', '127.0.0.1', '--port', String(options.port), '--strictPort'], {
      cwd: root, detached: true, stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, POPULOUS_GAME_ROOT: root, CLOUDFLARE_CF_FETCH_ENABLED: 'false', WRANGLER_SEND_METRICS: 'false', WRANGLER_WRITE_LOGS: 'false', WRANGLER_LOG_PATH: resolve(output, 'wrangler.log'), MINIFLARE_REGISTRY_PATH: resolve(output, 'registry') },
    })
    server.stdout.pipe(log); server.stderr.pipe(log)
    let listening = false
    server.stdout.on('data', chunk => { if (chunk.toString().includes(`127.0.0.1:${options.port}`)) listening = true })
    let spawnError
    server.once('error', error => { spawnError = error })
    for (;;) {
      abort.signal.throwIfAborted()
      if (spawnError) throw spawnError
      if (server.exitCode !== null) throw Error(`Local server exited ${server.exitCode}; see server.log`)
      if (listening) try { const response = await fetch(url, { signal: AbortSignal.timeout(1500) }); if (response.ok) break } catch {}
      await delay(250)
    }
    abort.signal.throwIfAborted()
    launchPromise = chromium.launch(receipt.launch)
    browser = await launchPromise
    abort.signal.throwIfAborted()
    receipt.browserVersion = browser.version()
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
    context.on('page', page => {
      page.on('pageerror', error => receipt.errors.push(String(error)))
      page.on('console', message => { if (message.type() === 'error') receipt.errors.push(message.text()); if (message.type() === 'warning') receipt.warnings.push(message.text()) })
    })
    const page = await context.newPage()
    page.setDefaultTimeout(45000)
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await page.getByRole('dialog', { name: 'Start game', exact: true }).waitFor({ state: 'visible' })
    const { bindGame } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)
    const openMission = async mission => {
      const button = page.getByRole('button', { name: `Mission ${mission}`, exact: true })
      const allMissions = page.getByRole('button', { name: 'All missions', exact: true })
      if (!(await button.isVisible()) && await allMissions.isVisible()) await allMissions.click()
      await button.focus()
      await page.keyboard.press('Enter')
      await bindGame(page)
      const skip = page.locator('.skip-introduction')
      await skip.waitFor({ state: 'visible', timeout: 45000 }).catch(() => {})
      if (await skip.isVisible()) await skip.click()
      await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
      await page.evaluate(() => { window.testScene = window.testSceneRef.current })
    }
    return scenario({ browser, context, page, url, root, output, openMission, receipt, signal: abort.signal })
  }
  try {
    const result = await Promise.race([work(), new Promise((_, reject) => {
      timer = setTimeout(() => abort.abort(Error(`Run exceeded ${options.timeout}ms`)), options.timeout)
      abort.signal.addEventListener('abort', () => reject(abort.signal.reason), { once: true })
    })])
    // Work never owns the terminal outcome. Late scenario completion after an
    // abort cannot overwrite failure while screenshots or cleanup are pending.
    outcome = { status: 'passed', result }
  } catch (error) {
    outcome = { status: 'failed', failure: error.stack ?? String(error) }
    if (browser) for (const [index, page] of browser.contexts().flatMap(c => c.pages()).entries()) {
      await page.screenshot({ path: resolve(output, `failure-${index}.png`), timeout: 5000 }).catch(() => {})
    }
  } finally {
    clearTimeout(timer); abort.abort()
    if (launchPromise) browser = await launchPromise.catch(() => null)
    if (browser) await browser.close().catch(() => {})
    await stopServer(server)
    log.end()
    process.removeListener('SIGINT', onSignal); process.removeListener('SIGTERM', onSignal)
    const sourceAfter = sourceReceipt(root)
    if (receipt.source.fingerprint !== sourceAfter.fingerprint) outcome = { status: 'failed', failure: 'Source bytes changed during execution', previousFailure: outcome.failure }
    // Detach nested arrays/results from scenario-owned references before writing.
    finalReceipt = structuredClone({ ...receipt, ...outcome, finishedAt: new Date().toISOString(), sourceAfter })
    if (finalReceipt.status !== 'passed') delete finalReceipt.result
    writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(finalReceipt, null, 2) + '\n')
  }
  if (finalReceipt.status !== 'passed') throw Error(finalReceipt.failure)
  return finalReceipt
}
export async function smoke({ page, openMission, output }, mission = 1) {
  await openMission(mission)
  const result = await page.evaluate(() => {
    const scene = window.testScene, gl = scene.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
    return { level: scene.world.outcome.level, turn: scene.world.turn, status: scene.world.status, webglVersion: gl.getParameter(gl.VERSION), renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), canvas: [gl.drawingBufferWidth, gl.drawingBufferHeight] }
  })
  if (!result.webglVersion.startsWith('WebGL 2.0')) throw Error('Actual game did not create WebGL2')
  await page.screenshot({ path: resolve(output, 'mission.png') })
  return result
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = parseOptions(process.argv.slice(2))
    const scenario = options.scenario ? (await import(pathToFileURL(resolve(options.scenario)).href)).default : args => smoke(args, options.mission)
    const receipt = await runLocalBrowser(options, scenario)
    console.log(JSON.stringify({ status: receipt.status, source: receipt.source, result: receipt.result }))
  } catch (error) { console.error(error); process.exitCode = 1 }
}
