import { preview } from 'vite'
import { chromium } from '@playwright/test'
import { spawn, execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { resolve, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { readFileSync, writeFileSync, readdirSync, lstatSync, statSync, existsSync, mkdirSync, symlinkSync, accessSync, constants } from 'node:fs'
import assert from 'node:assert/strict'
import { browserConfiguration } from './browser-config.mjs'
const root = resolve(dirname(import.meta.filename), '../..')
const fixture = resolve(dirname(import.meta.filename), 'fixture')
const out = resolve(process.argv[2] || resolve(root, 'outputs/tutorial-browser'))
const scenario = resolve(root, 'scripts/local-render/tutorial-recommendation.mjs')
const selectorScenario = resolve(root, 'scripts/tutorial-browser/selector-inspection.mjs')
const sceneryScenario = resolve(root, 'scripts/tutorial-browser/scenery-placement.mjs')
const selectedScenario = process.env.POPULOUS_BROWSER_SCENARIO || 'tutorial'
assert.ok(['tutorial', 'm2-pointer-f8'].includes(selectedScenario), 'Unknown browser scenario')
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
const receipt = { selectedScenario, m2ScenarioSha256: hash(m2Scenario),
  checkpointCodecSha256: hash(resolve(root, 'scripts/tutorial-browser/checkpoint-codec.mjs')),
  checkpointGeneratorSha256: hash(resolve(root, 'scripts/tutorial-browser/m2-checkpoint.mjs')), status: 'running', startedAt: new Date().toISOString(), source, command: process.argv,
  runnerSha256: hash(import.meta.filename), builderSha256: hash(resolve(dirname(import.meta.filename), 'build-home.mjs')),
  browserConfigSha256: hash(resolve(dirname(import.meta.filename), 'browser-config.mjs')),
  scenarioSha256: hash(scenario), fixtureSha256: hash(resolve(fixture, 'main.tsx')),
  selectorScenarioSha256: hash(selectorScenario), sceneryScenarioSha256: hash(sceneryScenario),
  fixtureHtmlSha256: hash(resolve(fixture, 'index.html')),
  buildPackageVersions: Object.fromEntries(['vite', '@vitejs/plugin-react', '@tailwindcss/postcss', '@playwright/test', 'playwright-core'].map(name => [name, JSON.parse(readFileSync(resolve(dependencies, name, 'package.json'))).version])),
  browserPath, browserPathSource: browserConfig.browserPathSource, launch: browserConfig.launch,
  browserChannel: browserConfig.launch.channel ?? null, browserBinaryVersion, browserSha256: hash(browserPath), node: process.version,
  environment: { TMPDIR: process.env.TMPDIR, XDG_CACHE_HOME: process.env.XDG_CACHE_HOME },
  limits: [...source.limits, 'Production Vite bundle of actual Home; excludes Vinext/Cloudflare/RSC hosting. No causal claim about prior development-server crashes.'], errors: [], warnings: [] }
const save = () => writeFileSync(resolve(out, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n')
let browser, context, page, server, timer, m2Fixture
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
  if (selectedScenario === 'm2-pointer-f8') {
    const { createM2Checkpoint } = await import('./m2-checkpoint.mjs')
    m2Fixture = await createM2Checkpoint(out, source)
    receipt.m2Fixture = m2Fixture.receipt
    verifySource(); save()
  }
  server = await preview({ configFile: false, root: fixture, build: { outDir: dist }, preview: { host: '127.0.0.1', port, strictPort: true } })
  browser = await chromium.launch(browserConfig.launch)
  receipt.browserVersion = browser.version(); save()
  timer = setTimeout(() => { receipt.browserTimedOut = true; void browser.close() }, 180000)
  context = await browser.newContext({ viewport: { width: 640, height: 480 }, deviceScaleFactor: 1 })
  page = await context.newPage(); page.setDefaultTimeout(25000)
  page.on('pageerror', e => receipt.errors.push(String(e)))
  page.on('console', m => { if (m.type() === 'error') receipt.errors.push(m.text()); if (m.type() === 'warning') receipt.warnings.push(m.text()) })
  page.on('crash', () => { receipt.errors.push('Page crashed'); save() })
  const url = `http://127.0.0.1:${port}`
  if (selectedScenario === 'm2-pointer-f8') {
    receipt.m2PointerF8 = await (await import(pathToFileURL(m2Scenario).href)).default({ browser, url, output: out, fixture: m2Fixture })
  } else {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  receipt.result = await (await import(pathToFileURL(scenario).href)).default({ page, context, browser, url, root, output: out, receipt })
  receipt.selectorInspection = await (await import(pathToFileURL(selectorScenario).href)).default({ browser, url, output: out })
  receipt.sceneryPlacement = await (await import(pathToFileURL(sceneryScenario).href)).default({ browser, url, output: out })
  }
  assert.equal(receipt.browserTimedOut, undefined)
  assert.deepEqual(receipt.errors, [], 'Unexpected primary-page runtime/console errors')
  receipt.status = 'passed'
} catch (error) {
  receipt.status = 'failed'; receipt.failure = String(error); receipt.stack = error.stack; process.exitCode = 1
  try { receipt.failureState = await page.evaluate(() => ({ active: document.activeElement?.outerHTML?.slice(0, 500), body: document.body.innerText.slice(0, 2500) })); await page.screenshot({ path: resolve(out, 'failure.png'), timeout: 10000 }) } catch (e) { receipt.diagnosticError = String(e) }
} finally {
  clearTimeout(timer)
  try { await context?.close(); await browser?.close(); await server?.close(); receipt.cleanupVerified = true } catch (e) { receipt.cleanupError = String(e); receipt.status = 'failed'; process.exitCode = 1 }
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
  receipt.endedAt = new Date().toISOString(); save(); console.log(JSON.stringify({ status: receipt.status, failure: receipt.failure, cleanupVerified: receipt.cleanupVerified, output: out }))
}
