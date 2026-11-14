// Local owner for the bounded Spy discovery episode. Not a hosted workflow selection:
// the qualified Tutorial runner bytes stay unchanged. Reuses the same plain Vite
// test-host build, browser launch policy (sandbox retained) and source binding.
import assert from 'node:assert/strict'
import { spawn, execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, lstatSync, symlinkSync, writeFileSync, accessSync, constants } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { preview } from 'vite'
import { chromium } from '@playwright/test'
import { browserConfiguration } from '../tutorial-browser/browser-config.mjs'
import spyDiscoveryEpisode from "./scenario.mjs"

const browserCapMs = 180000, buildCapMs = 120000
const root = resolve(dirname(import.meta.filename), '../..')
const fixture = resolve(root, 'scripts/tutorial-browser/fixture')
const out = resolve(process.argv[2] ?? resolve(root, 'work/spy-discovery-browser'))
const port = Number(process.env.SPY_DISCOVERY_PORT ?? 4100 + Math.floor(Math.random() * 900))
assert.ok(Number.isInteger(port) && port > 1023 && port < 65536, 'Invalid port')
if (existsSync(out)) throw Error('Output must be fresh')
mkdirSync(out, { recursive: true })
const dist = resolve(out, 'dist')
const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex')
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
const files = git('ls-files', '-z').split('\0').filter(Boolean)
const source = Object.fromEntries(files.map(name => [name, hash(resolve(root, name))]))
const verifySource = () => { for (const [name, expected] of Object.entries(source)) assert.equal(hash(resolve(root, name)), expected, name) }
const browserConfig = browserConfiguration(process.env.POPULOUS_BROWSER)
assert.ok(existsSync(browserConfig.browserPath), 'Configured official browser is required')
accessSync(browserConfig.browserPath, constants.X_OK)
const receipt = {
  status: 'running', startedAt: new Date().toISOString(), commit: git('rev-parse', 'HEAD'), tree: git('rev-parse', 'HEAD^{tree}'),
  trackedDiff: git('status', '--short', '--untracked-files=no'), port, browserCapMs,
  sources: Object.fromEntries(["spy-discovery-evidence/run", "spy-discovery-evidence/scenario", "spy-discovery-evidence/deadline", "tutorial-browser/spy-discovery-fixture"].map(n => [n, hash(resolve(root, `scripts/${n}.mjs`))])),
  fixtureMainSha256: hash(resolve(fixture, 'main.tsx')), builderSha256: hash(resolve(root, 'scripts/tutorial-browser/build-home.mjs')),
  browserPath: browserConfig.browserPath, browserPathSource: browserConfig.browserPathSource, launch: browserConfig.launch,
  browserBinaryVersion: execFileSync(browserConfig.browserPath, ['--version'], { encoding: 'utf8' }).trim(),
  browserSha256: hash(browserConfig.browserPath), node: process.version, platform: `${process.platform}-${process.arch}`, errors: [],
}
const save = () => writeFileSync(resolve(out, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n')
let server, browser, timer
try {
  verifySource(); save()
  receipt.build = await new Promise((done, reject) => {
    const child = spawn(process.execPath, [resolve(root, 'scripts/tutorial-browser/build-home.mjs'), fixture, dist], { stdio: ['ignore', 'pipe', 'pipe'] })
    const chunks = []; let timedOut = false
    child.stdout.on('data', b => chunks.push(b)); child.stderr.on('data', b => chunks.push(b))
    const t = setTimeout(() => { timedOut = true; child.kill('SIGTERM') }, buildCapMs)
    child.on('error', e => { clearTimeout(t); reject(e) })
    child.on('close', (exitCode, signal) => { clearTimeout(t); writeFileSync(resolve(out, 'build.log'), Buffer.concat(chunks)); done({ exitCode, signal, timedOut }) })
  })
  save(); assert.equal(receipt.build.exitCode, 0, 'Build must pass')
  for (const entry of readdirSync(resolve(root, 'public'))) {
    const target = resolve(dist, entry); assert.equal(existsSync(target), false, 'Public asset collision')
    symlinkSync(resolve(root, 'public', entry), target, lstatSync(resolve(root, 'public', entry)).isDirectory() ? 'dir' : 'file')
  }
  server = await preview({ configFile: false, root: fixture, build: { outDir: dist }, preview: { host: '127.0.0.1', port, strictPort: true } })
  browser = await chromium.launch(browserConfig.launch)
  receipt.browserVersion = browser.version(); save()
  const deadlineAt = Date.now() + browserCapMs
  timer = setTimeout(() => { receipt.browserTimedOut = true; void browser.close() }, browserCapMs)
  receipt.episode = await spyDiscoveryEpisode({ browser, url: `http://127.0.0.1:${port}`, output: out, deadlineAt })
  assert.equal(receipt.browserTimedOut, undefined)
  receipt.status = 'passed'
} catch (error) {
  receipt.status = 'failed'; receipt.failure = String(error?.stack ?? error); process.exitCode = 1
} finally {
  clearTimeout(timer)
  const cleanupErrors = []
  for (const [owner, close] of [['browser', () => browser?.close()], ['server', () => server?.close()]]) {
    try { await close() } catch (error) { cleanupErrors.push({ owner, error: String(error) }) }
  }
  receipt.cleanupVerified = cleanupErrors.length === 0
  if (!receipt.cleanupVerified) { receipt.cleanupErrors = cleanupErrors; receipt.status = 'failed'; process.exitCode = 1 }
  try { verifySource(); receipt.sourceAfter = 'identical' } catch (e) { receipt.sourceAfter = String(e); receipt.status = 'failed'; process.exitCode = 1 }
  receipt.endedAt = new Date().toISOString(); save()
  console.log(JSON.stringify({ status: receipt.status, failure: receipt.failure, cleanupVerified: receipt.cleanupVerified, output: out }))
}
