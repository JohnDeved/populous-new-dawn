import assert from 'node:assert/strict'
import { startDiagnostic, retainBundles, enforceOutputLimit, closeOwned, createBudget, removeOwned } from './causal-profiler.mjs'
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, symlinkSync, lstatSync, mkdtempSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { cpus, arch, platform, release, tmpdir } from 'node:os'
import { preview } from 'vite'
import { chromium } from '@playwright/test'
import capture from './snapshot-capture.mjs'
import { readerDependencyManifest, readerBundleManifest, readerBuildProvenance, readerSourceEvidence } from './reader-build.mjs'
import { inspectDragSource } from './snapshot-drag-contract.mjs'
import { browserConfiguration } from '../tutorial-browser/browser-config.mjs'
import { repository, shards, plan, sha256, protocolHash } from './snapshot-protocol.mjs'

const root = resolve(import.meta.dirname, '../..'), base = resolve(root, '../base'), head = resolve(root, '../candidate')
const shard = 'world'
assert.ok(Object.hasOwn(shards, shard), 'Unknown benchmark shard')
const identity = { repository, prNumber: Number(process.env.PR_NUMBER), baseSha: process.env.PR_BASE_SHA,
  headSha: process.env.PR_HEAD_SHA, harnessSha: process.env.PR_BASE_SHA,
  runId: Number(process.env.GITHUB_RUN_ID), runAttempt: Number(process.env.GITHUB_RUN_ATTEMPT) }
const out = resolve(root, 'outputs/causal-profile')
assert.ok(!existsSync(out), 'Output must be fresh'); mkdirSync(out, { recursive: true })
const budget = createBudget(out)
// Outside retained evidence, but inside the trusted install's dependency ancestry.
const scratch = mkdtempSync(resolve(root, '.causal-build-'))
const report = { diagnosticOnly: true, timingComparable: false, version: 2, identity, protocolSha256: protocolHash(), runtimeSha256: null, snapshotSha256: null, shard, status: 'incomplete', runs: [] }
const save = () => { budget.write(resolve(out, 'report.json'), JSON.stringify(report) + '\n', true) }
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
const fingerprint = source => sha256(execFileSync('git', ['ls-files', '-z'], { cwd: source }).toString().split('\0').filter(Boolean)
  .map(name => `${name}\0${sha256(readFileSync(resolve(source, name)))}`).join('\n'))
const environment = { node: process.version, arch: arch(), platform: platform(), release: release(),
  runnerImage: process.env.ImageOS ?? null, runnerVersion: process.env.ImageVersion ?? null,
  lockSha256: sha256(readFileSync(resolve(root, 'package-lock.json'))),
  playwrightSha256: sha256(readFileSync(resolve(root, 'node_modules/playwright-core/browsers.json'))) }
const receipt = { identity, diagnosticSha: git(root, 'rev-parse', 'HEAD'), diagnosticOnly: true, timingComparable: false, protocol: { plan, phases: ['native-hover', 'ordinary-hover'], order: ['base', 'head'] }, environment,
  host: { cpuModels: [...new Set(cpus().map(cpu => cpu.model))], logicalCpus: cpus().length },
  startedAt: new Date().toISOString(), builds: [], sessions: [] }
const saveReceipt = () => budget.write(resolve(out, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n', true)
let server, browser
async function stopDiagnostic(diagnostic) {
  let timer
  try {
    await Promise.race([diagnostic.stop(), new Promise((_, reject) => {
      timer = setTimeout(() => reject(Error('Diagnostic cleanup exceeded 20 seconds')), 20000)
    })])
  } finally { clearTimeout(timer) }
}
const sources = { base, head }, fingerprints = {}, dragSources = {}
async function build(side) {
  const output = resolve(scratch, `build-${side}`); mkdirSync(output)
  const result = await new Promise((done, reject) => {
    const child = spawn(process.execPath, [resolve(import.meta.dirname, 'build.mjs'), sources[side], output, identity[`${side}Sha`]], { stdio: ['ignore', 'pipe', 'pipe'] })
    let bytes = 0, chunks = [], timedOut = false, force
    const record = data => { bytes += data.length; if (bytes <= 8 * 1024 * 1024) chunks.push(data) }
    child.stdout.on('data', record); child.stderr.on('data', record)
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGTERM'); force = setTimeout(() => child.kill('SIGKILL'), 5000) }, 120000)
    child.on('error', reject)
    child.on('close', (code, signal) => { clearTimeout(timer); clearTimeout(force); try { budget.write(resolve(out, `build-${side}.log`), Buffer.concat(chunks)); done({ side, code, signal, timedOut, cappedLog: bytes > 8 * 1024 * 1024 }) } catch (error) { reject(error) } })
  })
  receipt.builds.push(result); saveReceipt(); assert.equal(result.code, 0); assert.equal(result.timedOut, false)
  const dist = resolve(output, 'dist')
  for (const entry of readdirSync(resolve(sources[side], 'public'))) {
    const source = resolve(sources[side], 'public', entry), target = resolve(dist, entry)
    assert.ok(!existsSync(target), 'Public asset collision'); symlinkSync(source, target, lstatSync(source).isDirectory() ? 'dir' : 'file')
  }
  enforceOutputLimit(out)
  return dist
}
try {
  save()
  assert.equal(git(base, 'rev-parse', 'HEAD'), identity.baseSha)
  assert.equal(git(head, 'rev-parse', 'HEAD'), identity.headSha)
  for (const [side, source] of Object.entries(sources)) { assert.equal(git(source, 'status', '--porcelain', '--untracked-files=no'), ''); fingerprints[side] = fingerprint(source) }
  // Different dependency graphs cannot be represented by one common trusted install.
  if (!readFileSync(resolve(base, 'package-lock.json')).equals(readFileSync(resolve(head, 'package-lock.json'))) ||
      !readFileSync(resolve(base, 'package.json')).equals(readFileSync(resolve(head, 'package.json')))) {
    report.status = 'incompatible-dependencies'; save(); throw Error('Dependency changes need a separately reviewed protocol')
  }
  for (const [side, source] of Object.entries(sources)) dragSources[side] = inspectDragSource(source)
  receipt.dragSources = dragSources; saveReceipt()
  assert.ok(!existsSync(resolve(head, 'node_modules')), 'Candidate install must be absent')
  for (const source of [base, head]) {
    assert.ok(!existsSync(resolve(source, 'node_modules')))
    symlinkSync(resolve(root, 'node_modules'), resolve(source, 'node_modules'), 'dir')
  }
  const config = browserConfiguration()
  environment.browserVersion = execFileSync(config.browserPath, ['--version'], { encoding: 'utf8' }).trim()
  environment.browserSha256 = sha256(readFileSync(config.browserPath))
  assert.equal(environment.browserVersion, process.env.EXPECTED_CHROME_VERSION)
  assert.equal(environment.browserSha256, process.env.EXPECTED_CHROME_SHA256)
  report.runtimeSha256 = sha256(JSON.stringify(environment))
  const fixtureOutput = resolve(out, 'session-fixture'); mkdirSync(fixtureOutput)
  const dependencies = readerDependencyManifest(root)
  const { createSnapshotFixture } = await import(pathToFileURL(resolve(base, 'scripts/browser-performance/snapshot-setup.mjs')).href)
  const fixtureScratch = resolve(scratch, 'fixture'); mkdirSync(fixtureScratch)
  const fixture = await createSnapshotFixture({ output: fixtureScratch, source: { commit: identity.baseSha } })
  for (const name of readdirSync(fixtureScratch)) budget.copy(resolve(fixtureScratch, name), resolve(fixtureOutput, name))
  report.snapshotSha256 = fixture.receipt.snapshotSha256; receipt.fixture = fixture.receipt
  const dist = { base: await build('base'), head: await build('head') }
  assert.equal(readerDependencyManifest(root).sha256, dependencies.sha256, 'Installed dependency mutation during builds')
  retainBundles(out, dist, budget)
  const bundles = Object.fromEntries(Object.entries(dist).map(([side, directory]) => [side, readerBundleManifest(directory)]))
  const readerSources = Object.fromEntries(Object.entries(sources).map(([side, source]) => [side, readerSourceEvidence(source, dragSources[side])]))
  const readerProvenance = Object.fromEntries(Object.keys(sources).map(side => [side, readerBuildProvenance(root, dependencies, bundles[side],
    ['scripts/browser-performance/build.mjs', 'scripts/browser-performance/reader-build.mjs', 'scripts/tutorial-browser/fixture/index.html'])]))
  budget.write(resolve(fixtureOutput, 'reader-build-provenance.json'), JSON.stringify({ dependencies, bundles, readerSources, readerProvenance }, null, 2) + '\n')
  for (const [index, side] of ['base', 'head'].entries()) {
    assert.deepEqual(readerBundleManifest(dist[side]), bundles[side], 'Emitted arm bundle changed')
    const output = resolve(out, `session-${index}-${side}`); mkdirSync(output)
    const run = { index, side, revision: identity[`${side}Sha`], status: 'incomplete', environmentSha256: null, phases: [] }
    report.runs.push(run); save()
    const session = { index, side, errors: [], startedAt: new Date().toISOString() }; receipt.sessions.push(session); saveReceipt()
    let timer, diagnostic
    const profile = mkdtempSync(resolve(tmpdir(), `pnd-browser-performance-${index}-`))
    try {
      server = await preview({ configFile: false, envFile: false, root, build: { outDir: dist[side] }, preview: { host: '127.0.0.1', port: 5199, strictPort: true } })
      // ignoreDefaultArgs is retained from the reviewed sandboxed configuration.
      // Give Chrome a fresh HOME/config/cache as well as an incognito context, so
      // process-level profile/cache state cannot leak from a previous paired arm.
      browser = await chromium.launch({ ...config.launch, env: { ...process.env,
        HOME: profile, XDG_CONFIG_HOME: resolve(profile, 'config'), XDG_CACHE_HOME: resolve(profile, 'cache') } })
      const ownedBrowser = browser
      timer = setTimeout(() => {
        session.timedOut = true
        void closeOwned(ownedBrowser, session, 'timeoutCloseFailure')
      }, 90000)
      const context = await browser.newContext({ viewport: plan.viewport, deviceScaleFactor: 1 })
      const page = await context.newPage(); page.setDefaultTimeout(15000)
      page.on('pageerror', error => session.errors.push(String(error).slice(0, 2000)))
      page.on('console', message => { if (message.type() === 'error' && session.errors.length < 20) session.errors.push(message.text().slice(0, 2000)) })
      diagnostic = await startDiagnostic(page, output, session, saveReceipt, budget)
      await capture({ diagnostic, page, url: 'http://127.0.0.1:5199', output, expectedRevision: run.revision, fixture, shard, dragSource: dragSources[side], readerSource: readerSources[side], readerProvenance: readerProvenance[side], allowDragFailure: true, getErrorCount: () => session.errors.length })
      const recording = JSON.parse(readFileSync(resolve(output, 'snapshot-frames.json')))
      if (recording.readers) run.readers = recording.readers
      if (recording.status !== 'passed-with-incomplete-drag') { assert.equal(session.timedOut, undefined); assert.deepEqual(session.errors, []) }
      for (const name of ['native-hover', 'ordinary-hover']) {
        const summaryPhase = (() => {
          const phase = recording.phases.find(phase => phase.name === name)
          if (phase?.status === 'unsupported-source-contract') return { name, unsupported: 'source-contract' }
          assert.equal(phase?.status, 'passed')
          const rawBytes = readFileSync(resolve(output, phase.rawFile)), raw = JSON.parse(rawBytes)
          const summary = JSON.parse(readFileSync(resolve(output, phase.summaryFile)))
          assert.equal(sha256(rawBytes), summary.rawSha256)
          const environmentSha = sha256(JSON.stringify({ browser: browser.version(), host: receipt.host, environment: raw.environment }))
          if (run.environmentSha256 !== null) assert.equal(run.environmentSha256, environmentSha)
          run.environmentSha256 = environmentSha
          return summary.phase
        })()
        run.phases.push(summaryPhase)
      }
      run.status = 'complete'
    } catch (error) { session.failure = String(error).slice(0, 2000) }
    finally { clearTimeout(timer); if (diagnostic) { try { await stopDiagnostic(diagnostic) } catch (error) { session.profileFailure = String(error); run.status = 'incomplete' } } if (!await closeOwned(browser, session, 'browserCloseFailure')) run.status = 'incomplete'; browser = null; if (!await closeOwned(server, session, 'serverCloseFailure')) run.status = 'incomplete'; server = null; if (!removeOwned(profile, session, 'profileRemovalFailure')) run.status = 'incomplete'; session.endedAt = new Date().toISOString(); save(); saveReceipt(); enforceOutputLimit(out) }
  }
  assert.equal(readerDependencyManifest(root).sha256, dependencies.sha256, 'Installed dependency mutation during capture')
  for (const side of Object.keys(sources)) assert.deepEqual(readerBundleManifest(dist[side]), bundles[side], 'Emitted arm bundle changed')
  for (const [side, source] of Object.entries(sources)) assert.equal(fingerprint(source), fingerprints[side], 'Tracked source mutation')
  report.traceComparison = receipt.sessions.length === 2 && receipt.sessions.every(s => s.diagnostic?.traceStatus === 'complete') ? 'available-diagnostic-only' : 'unavailable-or-incomplete'
  if (report.runs.length === 2 && report.runs.every(run => run.status === 'complete')) report.status = 'complete'
} catch (error) { receipt.failure = String(error).slice(0, 2000); process.exitCode = 1 }
finally {
  await closeOwned(browser, receipt, 'finalBrowserCloseFailure'); await closeOwned(server, receipt, 'finalServerCloseFailure')
  if (!removeOwned(scratch, receipt, 'scratchRemovalFailure')) report.status = 'incomplete'
  receipt.endedAt = new Date().toISOString()
  for (const [key, action] of [['finalReportFailure', save], ['finalLimitFailure', () => enforceOutputLimit(out)]]) {
    try { action() } catch (error) { receipt[key] = String(error).slice(0, 2000); process.exitCode = 1 }
  }
  try { saveReceipt() } catch (error) { console.error('Final receipt write failed:', String(error)); process.exitCode = 1 }
  if (report.status !== 'complete') process.exitCode = 1
  console.log(JSON.stringify({ shard, status: report.status, output: out }))
}
