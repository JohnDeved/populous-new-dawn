import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { readFileSync } from 'node:fs'
import { assertCaptureInventory, assertCaptureBrowser, captureLimits, singleCaptureBrowser,
  recordedBrowser, captureContract } from '../scripts/melee-capture-evidence/policy.mjs'
import { assertCaptureResult } from '../scripts/melee-capture-evidence/adapter.mjs'

const inventory = names => {
  const files = names.map(path => ({ path, bytes: 1 }))
  return { files, bytes: files.length, screenshots: files.filter(file => file.path.endsWith('.png')).length }
}
const artifacts = ['melee-attack.json', 'melee-capture-diagnostic.json', 'melee-attack-context.png',
  ...Array.from({ length: 4 }, (_, index) => `melee-attack-frame-${index}.png`),
  ...Array.from({ length: 4 }, (_, index) => `diagnostic-melee-B-frame-${index}.png`)]
const provenance = () => ({ browserPath: '/opt/google/chrome/chrome', browserPathSource: 'hosted-default',
  launch: { channel: 'chrome', headless: true, chromiumSandbox: true, ignoreDefaultArgs: true,
    args: ['--headless', '--remote-debugging-pipe'], timeout: 30000 },
  sha256: recordedBrowser.sha256, version: recordedBrowser.version,
  traceVersions: { '@playwright/test': '1.63.0', 'playwright-core': '1.63.0' }, status: 'not-launched' })
const result = () => ({ contract: captureContract, status: 'passed', canonical: { status: 'passed' },
  diagnostic: { status: 'complete-comparison-only', cleanupConfirmed: true }, contextClosed: true, artifacts })

test('complete nine-image inventory and both separate acceptance channels', () => {
  assert.equal(assertCaptureInventory(inventory(artifacts)).screenshots, 9)
  assertCaptureResult(result())
})
for (const name of ['melee-attack-frame-4.png', '../escape.json', 'subdir/melee-attack.json', 'unknown.json'])
  test(`reject unlisted artifact ${name}`, () => assert.throws(() => assertCaptureInventory(inventory([name]))))
test('reject duplicate and simultaneous context/failure images', () => {
  assert.throws(() => assertCaptureInventory(inventory(['melee-attack.json', 'melee-attack.json'])), /Duplicate/)
  assert.throws(() => assertCaptureInventory(inventory(['melee-attack-context.png', 'melee-attack-failure.png'])), /mutually exclusive/)
})
test('partial failure inventory can be preserved without claiming complete comparison', () => {
  assertCaptureInventory(inventory(['melee-attack.json', 'melee-attack-failure.png']))
  const partial = result(); partial.artifacts = ['melee-attack.json', 'melee-attack-failure.png']
  assert.throws(() => assertCaptureResult(partial), /Complete comparison/)
})
for (const [name, alter] of [
  ['wrong total', x => { x.bytes++ }],
  ['wrong image count', x => { x.screenshots++ }],
  ['negative size', x => { x.files[0].bytes = -1 }],
  ['sidecar overflow', x => { x.files[1].bytes = captureLimits.sidecarBytes + 1; x.bytes = x.files.reduce((n, f) => n + f.bytes, 0) }],
  ['total overflow', x => { x.files[0].bytes = captureLimits.artifactBytes + 1; x.bytes = x.files.reduce((n, f) => n + f.bytes, 0) }],
]) test(`reject inventory ${name}`, () => { const x = inventory(artifacts); alter(x); assert.throws(() => assertCaptureInventory(x)) })
for (const [name, alter] of [
  ['canonical failure', x => { x.canonical.status = 'failed' }],
  ['comparison failure', x => { x.diagnostic.status = 'failed' }],
  ['incomplete comparison', x => { x.diagnostic.status = 'incomplete' }],
  ['unconfirmed copy cleanup', x => { x.diagnostic.cleanupConfirmed = false }],
  ['unclosed context', x => { x.contextClosed = false }],
  ['wrong contract', x => { x.contract = 'other' }],
  ['missing A image', x => { x.artifacts = x.artifacts.filter(name => name !== 'melee-attack-frame-0.png') }],
  ['B substituted for A', x => { x.artifacts = x.artifacts.map(name => name === 'melee-attack-frame-0.png' ? 'diagnostic-melee-B-frame-0.png' : name) }],
]) test(`reject result ${name}`, () => { const x = result(); alter(x); assert.throws(() => assertCaptureResult(x)) })
test('exact reviewed browser tuple before and after launch', () => {
  const x = provenance(); assertCaptureBrowser(x)
  x.status = 'launched'; x.playwrightVersion = recordedBrowser.protocolVersion; assertCaptureBrowser(x)
})
for (const [name, alter] of [
  ['binary', x => { x.sha256 = '0'.repeat(64) }],
  ['version', x => { x.version = 'Google Chrome 157.0.0.0' }],
  ['Playwright', x => { x.traceVersions['playwright-core'] = '1.64.0' }],
  ['path', x => { x.browserPath = '/tmp/chrome' }],
  ['sandbox', x => { x.launch.chromiumSandbox = false }],
  ['render flags', x => { x.launch.args.push('--enable-unsafe-swiftshader') }],
  ['protocol version', x => { x.status = 'launched'; x.playwrightVersion = 'other' }],
]) test(`reject browser drift ${name}`, () => { const x = provenance(); alter(x); assert.throws(() => assertCaptureBrowser(x)) })

const accounting = () => ({ contextsRequested: 0, pagesRequested: 0, pagesObserved: 0, errors: [] })
const options = { viewport: { width: 960, height: 720 }, deviceScaleFactor: 1 }
function browserFixture() {
  const context = new EventEmitter()
  context.newPage = async () => { const page = { close: async () => {} }; context.emit('page', page); return page }
  return { context, browser: { newContext: async () => context } }
}
test('one requested and observed context/page with no browser fallback API', async () => {
  const f = browserFixture(), a = accounting(), b = singleCaptureBrowser(f.browser, a)
  const c = await b.newContext(options); await c.newPage()
  assert.deepEqual(a, { contextsRequested: 1, pagesRequested: 1, pagesObserved: 1, errors: [] })
  await assert.rejects(() => b.newContext(options), /one diagnostic context/)
  await assert.rejects(() => c.newPage(), /one diagnostic page/)
  assert.throws(() => b.newPage, /Unadmitted/)
})
test('failed context creation consumes the sole attempt', async () => {
  let calls = 0
  const b = singleCaptureBrowser({ newContext: async () => { calls++; throw Error('creation failed') } }, accounting())
  await assert.rejects(() => b.newContext(options), /creation failed/)
  await assert.rejects(() => b.newContext(options), /one diagnostic context/)
  assert.equal(calls, 1)
})
test('unexpected additional page is closed and remains fatal accounting', async () => {
  const f = browserFixture(), a = accounting(), b = singleCaptureBrowser(f.browser, a)
  const c = await b.newContext(options); await c.newPage()
  let closed = 0; c.emit('page', { close: async () => { closed++ } })
  await Promise.resolve()
  assert.equal(closed, 1); assert.equal(a.pagesObserved, 2)
  assert.deepEqual(a.errors, ['Unadmitted additional diagnostic page'])
})
test('wrong viewport consumes the context admission without a browser call', async () => {
  let calls = 0; const b = singleCaptureBrowser({ newContext: async () => { calls++ } }, accounting())
  await assert.rejects(() => b.newContext({ viewport: { width: 1280, height: 960 } }))
  await assert.rejects(() => b.newContext(options)); assert.equal(calls, 0)
})
test('closed workflow mode has separate runner and bounded upload', () => {
  const workflow = readFileSync(new URL('../.github/workflows/native-ui-evidence.yml', import.meta.url), 'utf8')
  assert.match(workflow, / {10}- melee-capture-diagnostic\n/)
  assert.match(workflow, /\/scripts\/melee-capture-evidence\//)
  assert.match(workflow, /scripts\/melee-capture-evidence\/run\.mjs/)
  assert.match(workflow, /steps\.capture-bounds\.outcome == 'success'/)
  assert.match(workflow, /node-version: '24\.19\.0'/)
  assert.match(workflow, /contents: read/)
  assert.equal((workflow.match(/id: capture-bounds/g) ?? []).length, 1)
})
