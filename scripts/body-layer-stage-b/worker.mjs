import { timedCallback } from './timed-page.mjs'
import { compareTerminal, summarize } from './terminal-proof.mjs'
import {
  storeObservation,
  enforceBudget,
} from '../../scripts/body-layer-stage-a/observation-store.mjs'
import assert from 'node:assert/strict'
import { readFileSync, mkdirSync, realpathSync } from 'node:fs'
import { resolve, join, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'
import { packObservation, unpackObservation } from '../../scripts/body-layer-stage-a/transport.mjs'
import { preview } from 'vite'
import { chromium } from '@playwright/test'
import { protocol as p } from './protocol.mjs'
import { loadSetup } from '../../scripts/body-layer-stage-a/setup-adapter.mjs'
import { space, save, sha, fileSha } from '../../scripts/body-layer-stage-a/io.mjs'
import {
  preparePage,
  assetsReady,
  bootstrapAndPixels,
  capturePage,
  picksAfterPixels,
} from '../../scripts/body-layer-stage-a/page.mjs'
const [base, source, dist, fixtureFile, out, cohort, side, browserPath, referenceRoot] =
  process.argv.slice(2)
assert.ok(p.order.some(([c, s]) => c === cohort && s === side))
mkdirSync(out, { recursive: true })
const revision = p[side],
  report = {
    mode: p.mode,
    cohort,
    side,
    revision,
    status: 'incomplete',
    steps: [],
    controls: [],
    errors: [],
    served: [],
    observationDiagnostics: [],
    startedAt: new Date().toISOString(),
  }
const receipt = join(out, 'report.json'),
  persist = () => save(receipt, report)
let browser, server, timer, context
const workerStarted = performance.now()
let stopping = false
const stop = signal => {
  if (stopping) return
  stopping = true
  report.status = 'incomplete'
  report.interruption = signal
  process.exitCode = 1
  persist()
  void browser?.close().catch(() => {})
  setTimeout(() => process.exit(1), 4000).unref()
}
process.on('SIGTERM', () => stop('SIGTERM'))
process.on('SIGINT', () => stop('SIGINT'))
timer = setTimeout(() => stop('whole-worker-90s-deadline'), p.childMs)
const pendingResponses = new Set()
const { loadSnapshot, binding: setupBinding } = await loadSetup(base)
report.setupBinding = setupBinding
const { checkpointCodec } = await import(
  pathToFileURL(join(base, 'scripts/tutorial-browser/checkpoint-codec.mjs'))
)
const { browserConfiguration } = await import(
  pathToFileURL(join(base, 'scripts/tutorial-browser/browser-config.mjs'))
)
async function observe(page, label, operation, arg) {
  const row = { label, status: 'started', startedAt: new Date().toISOString() }
  report.observationDiagnostics.push(row)
  persist()
  const started = performance.now()
  const envelope = await page.evaluate(
    async ({ source, arg }) => {
      const observation = (0, eval)(`(${source})`)(arg)
      const observationPhases = { ...window.__bodyPhases }
      return {
        payload: await window.__bodyPack(observation, window.__bodyCodec),
        observationPhases,
      }
    },
    { source: operation.toString(), arg }
  )
  row.roundTripMs = performance.now() - started
  const decodeStarted = performance.now()
  const observation = unpackObservation(envelope.payload, checkpointCodec)
  row.decodeMs = performance.now() - decodeStarted
  row.phases = envelope.observationPhases
  row.packing = envelope.payload.phases
  row.rawBytes = envelope.payload.rawBytes
  row.compressedBytes = envelope.payload.compressedBytes
  row.status = 'decoded'
  row.endedAt = new Date().toISOString()
  persist()
  return observation
}
function store(label, result, picks) {
  space(out)
  report.evidenceAccounting = enforceBudget(dirname(out), p.maximumEvidenceBytes)
  const pixel = Buffer.from(result.pixels, 'base64')
  assert.equal(pixel.length, result.width * result.height * 4)
  delete result.pixels
  const pixelFile = `${label}.rgba.gz`,
    stateFile = `${label}.state.json.gz`
  const state = Buffer.from(JSON.stringify({ state: result.state, picks }))
  delete result.state
  storeObservation(dirname(out), `${cohort}-${side}/${pixelFile}`, gzipSync(pixel, { level: 6 }))
  storeObservation(dirname(out), `${cohort}-${side}/${stateFile}`, gzipSync(state, { level: 6 }))
  report.evidenceAccounting = enforceBudget(dirname(out), p.maximumEvidenceBytes)
  return { ...result, pixelFile, pixelSha256: sha(pixel), stateFile, stateSha256: sha(state) }
}
try {
  assert.ok(referenceRoot, 'Admitted current Stage A references required')
  const admitted = JSON.parse(readFileSync(join(referenceRoot, 'qualified-admission.json')))
  assert.equal(admitted.status, 'qualified-offline-proof')
  assert.equal(admitted.hostedWorkflowPassed, false)
  assert.equal(admitted.finalDriverDriftCheck, 'not-executed')
  report.referenceQualification = admitted
  assert.equal(admitted.protocol.baseline, p.baseline)
  assert.equal(admitted.protocol.candidate, p.candidate)
  persist()
  space(out)
  const config = browserConfiguration(realpathSync(browserPath))
  report.browserBinary = {
    path: realpathSync(browserPath),
    sha256: fileSha(realpathSync(browserPath)),
    launch: config.launch,
  }
  server = await preview({
    configFile: false,
    envFile: false,
    root: source,
    build: { outDir: dist },
    preview: { host: '127.0.0.1', port: 5199, strictPort: true },
  })
  const profile = join(out, 'profile')
  mkdirSync(profile)
  browser = await chromium.launch({
    ...config.launch,
    timeout: p.launchMs,
    env: {
      ...process.env,
      HOME: profile,
      XDG_CONFIG_HOME: join(profile, 'config'),
      XDG_CACHE_HOME: join(profile, 'cache'),
    },
  })
  report.browserVersion = browser.version()
  context = await browser.newContext({ viewport: p.viewport, deviceScaleFactor: 1 })
  const page = await context.newPage()
  page.setDefaultTimeout(p.actionMs)
  page.setDefaultNavigationTimeout(p.actionMs)
  await page.route('**/*', route => {
    const u = new URL(route.request().url())
    if (u.origin !== 'http://127.0.0.1:5199' && !['data:', 'blob:'].includes(u.protocol)) {
      report.errors.push(`Denied network ${u.origin}`)
      void route.abort()
      return
    }
    void route.continue()
  })
  page.on('pageerror', e => {
    report.errors.push(String(e))
    persist()
  })
  page.on('console', m => {
    if (m.type() === 'error') {
      report.errors.push(m.text())
      persist()
    }
  })
  page.on('response', response => {
    const task = (async () => {
      const u = new URL(response.url())
      if (u.origin === 'http://127.0.0.1:5199' && response.status() === 200) {
        const body = await response.body()
        report.served.push({ path: u.pathname, bytes: body.length, sha256: sha(body) })
      }
    })().catch(e => {
      report.errors.push(`Response binding: ${e}`)
    })
    pendingResponses.add(task)
    void task.finally(() => pendingResponses.delete(task))
  })
  const fixture = JSON.parse(readFileSync(fixtureFile, 'utf8'))
  report.setup = await loadSnapshot({
    page,
    url: 'http://127.0.0.1:5199',
    fixture,
    expectedRevision: revision,
  })
  persist()
  await page.waitForFunction(assetsReady, null, { timeout: p.actionMs })
  await page.evaluate(
    ({ capture, pack }) => {
      window.__bodyCapture = (0, eval)(`(${capture})`)
      window.__bodyPack = (0, eval)(`(${pack})`)
    },
    { capture: capturePage.toString(), pack: packObservation.toString() }
  )
  report.environment = await page.evaluate(preparePage, {
    viewport: p.viewport,
    admittedCanvas: report.setup.admitted.viewport.canvas,
    initialNow: p.initialNow,
    codecSource: checkpointCodec.toString(),
  })
  persist()
  const referenceDir = join(referenceRoot, `${cohort}-${side}`)
  const expectedSteps = JSON.parse(readFileSync(join(referenceRoot, 'step-identities.json')))[
    `${cohort}-${side}`
  ]
  assert.equal(expectedSteps.length, 28)
  const reference = JSON.parse(readFileSync(join(referenceDir, 'report.json')))
  const bootstrap = await observe(page, 'bootstrap', bootstrapAndPixels)
  const initialState = Buffer.from(JSON.stringify(bootstrap.initialState))
  delete bootstrap.initialState
  storeObservation(
    dirname(out),
    `${cohort}-${side}/initial-state.json.gz`,
    gzipSync(initialState, { level: 6 })
  )
  report.initialStateSha256 = sha(initialState)
  report.bootstrap = store('bootstrap', bootstrap, await page.evaluate(picksAfterPixels))
  persist()
  const r = report.environment.rect,
    point = { x: Math.floor(r.left + r.width / 2), y: Math.floor(r.top + r.height / 2) }
  await page.mouse.move(point.x, point.y)
  if (cohort === 'camera') await page.mouse.down({ button: 'right' })
  for (let i = 0; i < p.callbacks; i++) {
    if (stopping) throw Error('Worker interrupted')
    if (cohort === 'camera') await page.mouse.move(point.x + p.pointerOffsets[i], point.y)
    report.attempt = {
      index: i,
      now: p.initialNow + (i + 1) * p.deltaMs,
      status: 'awaiting-browser',
      elapsedMs: null,
    }
    const row = await page.evaluate(timedCallback, {
      index: i,
      now: report.attempt.now,
      cohort,
      expectedAngle: cohort === 'camera' ? p.pointerOffsets[i] : null,
      expected: expectedSteps[i],
      terminal: i === 27,
    })
    const envelope = row.terminal
    delete row.terminal
    report.steps.push(row)
    report.attempt = null
    assert.equal(row.status, 'completed', row.error?.message)
    if (i === 27) {
      const terminal = unpackObservation(envelope, checkpointCodec)
      const picks = await page.evaluate(picksAfterPixels)
      report.terminalProof = compareTerminal(
        report,
        { ...terminal, picks },
        reference,
        file => readFileSync(join(referenceDir, file)),
        checkpointCodec
      )
      report.terminal = store('terminal', terminal, picks)
    }
  }
  report.summary = summarize(report.steps)
  if (cohort === 'camera') await page.mouse.up({ button: 'right' })
  await Promise.all([...pendingResponses])
  assert.deepEqual(report.errors, [])
  assert.equal(report.timeout, undefined)
  assert.equal(report.steps.length, 28)
  assert.equal(report.controls.length, 0)
  assert.equal(stopping,false,'Interrupted worker cannot pass')
  report.status = 'passed'
} catch (error) {
  report.failure = { message: String(error), stack: error.stack, accounting: error.accounting }
  process.exitCode = 1
} finally {
  clearTimeout(timer)
  report.memory = {
    nodeRssBytes: process.memoryUsage().rss,
    browserRssBytes: null,
    browserRssStatus: 'not measured',
  }
  report.workerBeforeCleanupElapsedMs = performance.now() - workerStarted
  persist() // completed rows survive even if cleanup hangs
  try {
    await context?.close()
    await browser?.close()
    await server?.close()
  } catch (error) {
    report.status = 'failed'
    report.cleanupFailure = String(error)
    process.exitCode = 1
  }
  await Promise.allSettled([...pendingResponses])
  try {
    report.evidenceAccounting = enforceBudget(dirname(out), p.maximumEvidenceBytes)
  } catch (error) {
    report.status = 'failed'
    report.budgetFailure = { message: String(error), accounting: error.accounting }
    process.exitCode = 1
  }
  report.endedAt = new Date().toISOString()
  persist()
}
