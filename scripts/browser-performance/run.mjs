import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, symlinkSync, lstatSync, mkdtempSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { cpus, arch, platform, release, tmpdir } from 'node:os'
import { preview } from 'vite'
import { chromium } from '@playwright/test'
import capture from './snapshot-capture.mjs'
import { readerDependencyManifest, readerBundleManifest, readerBuildProvenance, readerSourceEvidence, readerDependencyPolicy, commonDependencyInputsEqual } from './reader-build.mjs'
import { inspectDragSource } from './snapshot-drag-contract.mjs'
import { createSnapshotFixture } from './snapshot-setup.mjs'
import { benchmarkBrowser } from './browser-runtime.mjs'
import { browserConfiguration } from '../tutorial-browser/browser-config.mjs'
import { repository, shards, order, plan, sha256, protocolHash, validateReport, appendSnapshotPhase } from './snapshot-protocol.mjs'

// The active legacy entrypoint stays on its original runner-image Chrome until
// the separately reviewed workflow explicitly selects the passive pinned entrypoint.
export async function runBenchmark({ pinned = false } = {}) {
  assert.equal(typeof pinned, 'boolean')
  const root = resolve(import.meta.dirname, '../..'), base = root, head = resolve(root, '../candidate')
  const shard = process.env.BENCHMARK_SHARD
  assert.ok(Object.hasOwn(shards, shard), 'Unknown benchmark shard')
  const identity = { repository, prNumber: Number(process.env.PR_NUMBER), baseSha: process.env.PR_BASE_SHA,
    headSha: process.env.PR_HEAD_SHA, harnessSha: process.env.PR_BASE_SHA,
    runId: Number(process.env.GITHUB_RUN_ID), runAttempt: Number(process.env.GITHUB_RUN_ATTEMPT) }
  const out = resolve(root, 'outputs/browser-performance', shard)
  assert.ok(!existsSync(out), 'Output must be fresh'); mkdirSync(out, { recursive: true })
  const report = { version: 2, identity, protocolSha256: protocolHash(), runtimeSha256: null, snapshotSha256: null, shard, status: 'incomplete', runs: [] }
  const save = () => { validateReport(report); writeFileSync(resolve(out, 'report.json'), JSON.stringify(report) + '\n') }
  const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
  const fingerprint = source => sha256(execFileSync('git', ['ls-files', '-z'], { cwd: source }).toString().split('\0').filter(Boolean)
    .map(name => `${name}\0${sha256(readFileSync(resolve(source, name)))}`).join('\n'))
  const dependencyPolicy = readerDependencyPolicy(root)
  const environment = { ...(dependencyPolicy ? { dependencyPolicy } : {}), node: process.version, arch: arch(), platform: platform(), release: release(),
    runnerImage: process.env.ImageOS ?? null, runnerVersion: process.env.ImageVersion ?? null,
    lockSha256: sha256(readFileSync(resolve(root, 'package-lock.json'))),
    playwrightSha256: sha256(readFileSync(resolve(root, 'node_modules/playwright-core/browsers.json'))) }
  const receipt = { identity, protocol: { plan, shards, order }, environment,
    host: { cpuModels: [...new Set(cpus().map(cpu => cpu.model))], logicalCpus: cpus().length },
    startedAt: new Date().toISOString(), builds: [], sessions: [] }
  const saveReceipt = () => writeFileSync(resolve(out, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n')
  let server, browser
  const sources = { base, head }, fingerprints = {}, dragSources = {}
  async function build(side) {
    const output = resolve(out, `build-${side}`); mkdirSync(output)
    const result = await new Promise((done, reject) => {
      const child = spawn(process.execPath, [resolve(import.meta.dirname, 'build.mjs'), sources[side], output, identity[`${side}Sha`]], { stdio: ['ignore', 'pipe', 'pipe'] })
      let bytes = 0, chunks = [], timedOut = false, force
      const record = data => { bytes += data.length; if (bytes <= 8 * 1024 * 1024) chunks.push(data) }
      child.stdout.on('data', record); child.stderr.on('data', record)
      const timer = setTimeout(() => { timedOut = true; child.kill('SIGTERM'); force = setTimeout(() => child.kill('SIGKILL'), 5000) }, 120000)
      child.on('error', reject)
      child.on('close', (code, signal) => { clearTimeout(timer); clearTimeout(force); writeFileSync(resolve(out, `build-${side}.log`), Buffer.concat(chunks)); done({ side, code, signal, timedOut, cappedLog: bytes > 8 * 1024 * 1024 }) })
    })
    receipt.builds.push(result); saveReceipt(); assert.equal(result.code, 0); assert.equal(result.timedOut, false)
    const dist = resolve(output, 'dist')
    for (const entry of readdirSync(resolve(sources[side], 'public'))) {
      const source = resolve(sources[side], 'public', entry), target = resolve(dist, entry)
      assert.ok(!existsSync(target), 'Public asset collision'); symlinkSync(source, target, lstatSync(source).isDirectory() ? 'dir' : 'file')
    }
    return dist
  }
  try {
    save()
    assert.equal(git(base, 'rev-parse', 'HEAD'), identity.baseSha)
    assert.equal(git(head, 'rev-parse', 'HEAD'), identity.headSha)
    for (const [side, source] of Object.entries(sources)) { assert.equal(git(source, 'status', '--porcelain', '--untracked-files=no'), ''); fingerprints[side] = fingerprint(source) }
    // Different dependency graphs cannot be represented by one common trusted install.
    if (!commonDependencyInputsEqual(base, head)) {
      report.status = 'incompatible-dependencies'; save(); throw Error('Dependency changes need a separately reviewed protocol')
    }
    for (const [side, source] of Object.entries(sources)) dragSources[side] = inspectDragSource(source)
    receipt.dragSources = dragSources; saveReceipt()
    assert.ok(!existsSync(resolve(head, 'node_modules')), 'Candidate install must be absent')
    symlinkSync(resolve(root, 'node_modules'), resolve(head, 'node_modules'), 'dir')
    const pinnedBrowser = pinned ? benchmarkBrowser(root) : null
    const config = pinned ? pinnedBrowser.config : browserConfiguration()
    if (pinnedBrowser) {
      const { provenance } = pinnedBrowser
      receipt.browser = provenance
      environment.browserVersion = provenance.browserVersion
      environment.browserSha256 = provenance.browserSha256
      environment.browserPinSha256 = provenance.pinSha256
      saveReceipt()
    } else {
      environment.browserVersion = execFileSync(config.browserPath, ['--version'], { encoding: 'utf8' }).trim()
      environment.browserSha256 = sha256(readFileSync(config.browserPath))
    }
    report.runtimeSha256 = sha256(JSON.stringify(environment))
    const fixtureOutput = resolve(out, 'session-fixture'); mkdirSync(fixtureOutput)
    const dependencies = readerDependencyManifest(root)
    const fixture = await createSnapshotFixture({ output: fixtureOutput, source: { commit: identity.baseSha } })
    report.snapshotSha256 = fixture.receipt.snapshotSha256; receipt.fixture = fixture.receipt
    const dist = { base: await build('base'), head: await build('head') }
    assert.equal(readerDependencyManifest(root).sha256, dependencies.sha256, 'Installed dependency mutation during builds')
    const bundles = Object.fromEntries(Object.entries(dist).map(([side, directory]) => [side, readerBundleManifest(directory)]))
    const readerSources = Object.fromEntries(Object.entries(sources).map(([side, source]) => [side, readerSourceEvidence(source, dragSources[side])]))
    const readerProvenance = Object.fromEntries(Object.keys(sources).map(side => [side, readerBuildProvenance(root, dependencies, bundles[side],
      ['scripts/browser-performance/build.mjs', 'scripts/browser-performance/reader-build.mjs', 'scripts/tutorial-browser/fixture/index.html'])]))
    writeFileSync(resolve(fixtureOutput, 'reader-build-provenance.json'), JSON.stringify({ dependencies, bundles, readerSources, readerProvenance }, null, 2) + '\n')
    for (const [index, side] of order.entries()) {
      assert.deepEqual(readerBundleManifest(dist[side]), bundles[side], 'Emitted arm bundle changed')
      const output = resolve(out, `session-${index}-${side}`); mkdirSync(output)
      const run = { index, side, revision: identity[`${side}Sha`], status: 'incomplete', environmentSha256: null, phases: [] }
      report.runs.push(run); save()
      const session = { index, side, errors: [], startedAt: new Date().toISOString() }; receipt.sessions.push(session); saveReceipt()
      let timer
      const profile = mkdtempSync(resolve(tmpdir(), `pnd-browser-performance-${index}-`))
      try {
        server = await preview({ configFile: false, envFile: false, root, build: { outDir: dist[side] }, preview: { host: '127.0.0.1', port: 5199, strictPort: true } })
        // ignoreDefaultArgs is retained from the reviewed sandboxed configuration.
        // Give Chrome a fresh HOME/config/cache as well as an incognito context, so
        // process-level profile/cache state cannot leak from a previous paired arm.
        pinnedBrowser?.verify()
        browser = await chromium.launch({ ...config.launch, env: { ...process.env,
          HOME: profile, XDG_CONFIG_HOME: resolve(profile, 'config'), XDG_CACHE_HOME: resolve(profile, 'cache') } })
        if (pinnedBrowser) {
          session.browserVersion = browser.version()
          pinnedBrowser.verifyLaunched(session.browserVersion)
        }
        timer = setTimeout(() => { session.timedOut = true; void browser?.close() }, 90000)
        const context = await browser.newContext({ viewport: plan.viewport, deviceScaleFactor: 1 })
        const page = await context.newPage(); page.setDefaultTimeout(15000)
        page.on('pageerror', error => session.errors.push(String(error).slice(0, 2000)))
        page.on('console', message => { if (message.type() === 'error' && session.errors.length < 20) session.errors.push(message.text().slice(0, 2000)) })
        await capture({ page, url: 'http://127.0.0.1:5199', output, expectedRevision: run.revision, fixture, shard, dragSource: dragSources[side], readerSource: readerSources[side], readerProvenance: readerProvenance[side], allowDragFailure: true, getErrorCount: () => session.errors.length })
        const recording = JSON.parse(readFileSync(resolve(output, 'snapshot-frames.json')))
        if (recording.readers) run.readers = recording.readers
        if (recording.status !== 'passed-with-incomplete-drag') { assert.equal(session.timedOut, undefined); assert.deepEqual(session.errors, []) }
        for (const name of shards[shard]) {
          const admission = appendSnapshotPhase(report, run, name, () => {
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
          })
          if (admission.status === 'incomplete-cohort') session.dragFailure = admission.failure
        }
        pinnedBrowser?.verify()
        run.status = 'complete'
      } catch (error) { session.failure = String(error).slice(0, 2000) }
      finally { clearTimeout(timer); await browser?.close(); browser = null; await server?.close(); server = null; rmSync(profile, { recursive: true, force: true }); session.endedAt = new Date().toISOString(); save(); saveReceipt() }
    }
    assert.equal(readerDependencyManifest(root).sha256, dependencies.sha256, 'Installed dependency mutation during capture')
    for (const side of Object.keys(sources)) assert.deepEqual(readerBundleManifest(dist[side]), bundles[side], 'Emitted arm bundle changed')
    pinnedBrowser?.verify()
    for (const [side, source] of Object.entries(sources)) assert.equal(fingerprint(source), fingerprints[side], 'Tracked source mutation')
    if (report.runs.every(run => run.status === 'complete')) report.status = 'complete'
  } catch (error) { receipt.failure = String(error).slice(0, 2000); process.exitCode = 1 }
  finally {
    await browser?.close(); await server?.close()
    receipt.endedAt = new Date().toISOString(); saveReceipt(); save()
    if (report.status !== 'complete') process.exitCode = 1
    console.log(JSON.stringify({ shard, status: report.status, output: out }))
  }
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) await runBenchmark()
