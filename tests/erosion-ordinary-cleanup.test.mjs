// Invoke the actual scenario function but fail before page/World/input work.
// Fixture methods do not create a browser, profile, file or model.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
const source = readFileSync(new URL('../qa/erosion-ordinary/scenario.mjs', import.meta.url), 'utf8')
const marker = 'export default async function ordinaryErosion'
assert.ok(source.includes(marker))
const body = source.slice(source.indexOf(marker)).replace('export default ', '')
const root = '/synthetic', sourceReceipt = {}
const launch = { plan: { output: '/synthetic/out', origin: 'http://127.0.0.1:1', profilePath: '/synthetic/profile' }, source: sourceReceipt }
for (const primary of [undefined, null, false, 0, '', new Error('synthetic primary')]) {
  test(`scenario cleanup preserves the original thrown ${String(primary)} value`, async () => {
    const cleanup = new Error('synthetic archive cleanup failure')
    let observations = 0, cleanups = 0
    const bindings = { assert, resolve, ownRoot: root, launch, mkdirSync() {}, writeFileSync() { cleanups++; throw cleanup },
      sha256() {}, evidenceBytes: JSON.stringify, observeLoadedModules: async () => { observations++; throw primary }, limits: { wallMs: 900000 } }
    const scenario = new Function(...Object.keys(bindings), `return (${body})`)(...Object.values(bindings))
    const receipt = { source: sourceReceipt, profile: { mode: 'created', path: launch.plan.profilePath, previousRun: null, checkpointAtStart: null, runId: 'synthetic' } }
    let threw = false, actual
    try { await scenario({ page: { setDefaultTimeout() {} }, root, output: launch.plan.output, url: launch.plan.origin,
      signal: { throwIfAborted() {} }, receipt }) }
    catch (error) { threw = true; actual = error }
    assert.equal(threw, true); assert.ok(Object.is(actual, primary))
    assert.equal(observations, 1); assert.equal(cleanups, 1)
    assert.deepEqual(receipt.erosionCleanupFailures, [String(cleanup)])
  })
}

import { pollWithPreservation } from '../qa/erosion-ordinary/stop.mjs'
import { browserModules } from '../qa/erosion-ordinary/source-policy.mjs'
import { errors } from '@playwright/test'

function smokeFixture({ bind = async () => {}, polling = pollWithPreservation, stop = () => null } = {}) {
  const plan = { ...launch.plan, purpose: 'startup-smoke', bounds: { scenarioWallMs: 120000 } }
  const smokeLaunch = { ...launch, plan, server: {}, planSha256: 'synthetic-hash' }
  const state = { level: 3, turn: 10, speed: 1, paused: false, status: 'playing', contextLost: false,
    actor: { id: 46, team: 'blue', kind: 'shaman', hp: 100, fighting: false },
    shrine: { id: 101, kind: 'erosionEffect', uses: 0 }, lifecycle: null, complete: false }
  const saved = new Map(), calls = [], receipt = { source: sourceReceipt, errors: [], profile: {
    mode: 'created', path: plan.profilePath, previousRun: null, checkpointAtStart: null, runId: 'synthetic' } }
  const page = { setDefaultTimeout() {},
    getByRole: (_, options) => ({ isVisible: async () => false, focus: async () => calls.push(['focus', options.name]) }),
    keyboard: { press: async key => calls.push(['key', key]) },
    evaluate: async (fn, value) => {
      assert.doesNotMatch(fn.toString(), /observeOrdinaryErosion\(/, 'smoke must not call the observer constructor')
      if (Array.isArray(value)) { assert.deepEqual(value, browserModules); calls.push(['modules']); return }
      return structuredClone(state)
    },
    screenshot: async options => calls.push(['screenshot', options.path]),
  }
  const bindings = { assert, errors, resolve, ownRoot: root, launch: smokeLaunch, mkdirSync() {},
    writeFileSync: (path, bytes) => saved.set(path, JSON.parse(bytes)), sha256: () => 'synthetic-hash', evidenceBytes: JSON.stringify,
    observeLoadedModules: async () => ({ read: async () => { calls.push(['source-read']); return { modules: {}, observations: [] } }, dispose: async () => calls.push(['dispose']) }),
    limits: { wallMs: 900000, startupMs: 120000 }, readQueuedPreservingStop: stop, pollWithPreservation: polling,
    showAllMissions: async () => calls.push(['show-all']), bindGame: async () => { calls.push(['bind']); await bind() },
    readShamanReadiness: async () => ({ ready: true }), browserModules, serverIdentity: () => ({}), readFileSync: () => 'synthetic plan' }
  const scenario = new Function(...Object.keys(bindings), `return (${body})`)(...Object.values(bindings))
  return { saved, calls, receipt, run: () => scenario({ page, root, output: plan.output, url: plan.origin, signal: { throwIfAborted() {} }, receipt }) }
}

test('startup-smoke uses the ordinary prefix and cleanup without capture or worship', async () => {
  const { saved, calls, receipt, run } = smokeFixture(), result = await run()
  assert.deepEqual(Object.keys(result), ['erosionStartupSmoke'])
  assert.equal(result.erosionStartupSmoke.originalActorId, 46)
  assert.deepEqual(calls, [['show-all'], ['focus', 'Mission 3'], ['key', 'Enter'], ['bind'], ['modules'], ['source-read'],
    ['screenshot', '/synthetic/out/startup-ready.png'], ['dispose']])
  assert.equal([...saved.keys()].some(path => path.endsWith('/capture.json')), false)
  const actions = saved.get('/synthetic/out/actions.json').actions
  assert.deepEqual([...new Set(actions.map(action => action.kind))], ['show-all-missions', 'mission-start'])
  assert.equal(receipt.erosionCleanupFailures, undefined)
})


const immediatePoll = (check, options) => pollWithPreservation(check, { ...options, sleep: async () => {} })
test('startup binding retries only real TimeoutError and retains diagnostics without repeating physical inputs', async () => {
  let attempts = 0
  const f = smokeFixture({ polling: immediatePoll, bind: async () => { if (attempts++ < 2) throw new errors.TimeoutError('scene still loading') } })
  assert.ok((await f.run()).erosionStartupSmoke)
  assert.equal(attempts, 3)
  const archive = f.saved.get('/synthetic/out/actions.json')
  assert.equal(archive.startupBindingTimeouts.length, 2)
  assert.ok(archive.startupBindingTimeouts.every(row => row.message.includes('scene still loading')))
  assert.equal(f.calls.filter(row => row[0] === 'key').length, 1)
})

test('startup binding propagates non-timeout and lookalike errors immediately with exact identity', async () => {
  for (const error of [new Error('different failure'), Object.assign(new Error('lookalike'), { name: 'TimeoutError' })]) {
    const f = smokeFixture({ polling: immediatePoll, bind: async () => { throw error } })
    await assert.rejects(f.run(), actual => actual === error)
    assert.equal(f.calls.filter(row => row[0] === 'bind').length, 1)
  }
})

test('a binding success after the startup deadline is rejected before readiness or later work', async () => {
  let time = 0
  const f = smokeFixture({ bind: async () => { time = 120001 }, polling: (check, options) => pollWithPreservation(check, { ...options, now: () => time, sleep: async () => {} }) })
  await assert.rejects(f.run(), /Timed out waiting for Mission3 scene binding/)
  assert.equal(f.calls.some(row => row[0] === 'modules'), false)
})

test('a preserving stop arriving during a successful bind rejects before later work', async () => {
  let stopped = false
  const f = smokeFixture({ bind: async () => { stopped = true }, polling: immediatePoll, stop: () => stopped ? {
    valid: true, bytes: Buffer.from(JSON.stringify([{ action: 'stop-preserve-latest', runId: 'synthetic' }])), sha256: 'synthetic-stop',
  } : null })
  await assert.rejects(f.run(), /Requested current-run preserving stop/)
  assert.equal(f.calls.some(row => row[0] === 'modules'), false)
  assert.equal(f.calls.filter(row => row[0] === 'key').length, 1)
})
