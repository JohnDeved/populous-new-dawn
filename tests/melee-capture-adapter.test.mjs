import test from 'node:test'
import fs from 'node:fs'
import { syncBuiltinESMExports } from 'node:module'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { runMeleeCaptureEvidence } from '../scripts/melee-capture-evidence/adapter.mjs'

// Actual infrastructure adapter/owner, supplied candidate and browser objects.
// These receipts are control fixtures, never rendered/PNG/source acceptance.
function fixture(mode) {
  const root = mkdtempSync(resolve(tmpdir(), 'capture-adapter-')), candidateRoot = resolve(root, 'candidate')
  const output = resolve(root, 'output'); mkdirSync(output); mkdirSync(candidateRoot)
  execFileSync('git', ['init', '-q', candidateRoot])
  execFileSync('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
    'commit', '--allow-empty', '-qm', 'isolated control'], { cwd: candidateRoot })
  mkdirSync(resolve(candidateRoot, 'scripts/tutorial-browser'), { recursive: true })
  writeFileSync(resolve(candidateRoot, 'scripts/tutorial-browser/melee-capture-diagnostic.mjs'), `
    import { writeFileSync } from 'node:fs'; import { resolve } from 'node:path';
    export const captureDiagnosticContract = ${JSON.stringify(mode === 'wrong-contract' ? 'wrong' : 'same-frame-ab-v1')};
    export default async ({browser, output, signal}) => {
      const context = await browser.newContext({viewport:{width:960,height:720},deviceScaleFactor:1});
      const page = await context.newPage();
      if (${JSON.stringify(mode)} === 'extra-context') await browser.newContext({viewport:{width:960,height:720},deviceScaleFactor:1});
      if (${JSON.stringify(mode)} === 'swallowed-context') { try { await browser.newContext({viewport:{width:960,height:720},deviceScaleFactor:1}) } catch {} }
      if (${JSON.stringify(mode)} === 'swallowed-page') { try { await context.newPage() } catch {} }
      if (${JSON.stringify(mode)} === 'swallowed-api') { try { browser.newPage } catch {} }
      if (${JSON.stringify(mode)} === 'runtime-error') page.emit('pageerror', Error('supplied runtime failure'));
      if (${JSON.stringify(mode)} === 'abort') { await new Promise(resolve => signal.addEventListener('abort', resolve, {once:true})); signal.throwIfAborted(); }
      const artifacts=['melee-attack.json','melee-capture-diagnostic.json','melee-attack-context.png',
        ...Array.from({length:4},(_,i)=>'melee-attack-frame-'+i+'.png'),
        ...Array.from({length:4},(_,i)=>'diagnostic-melee-B-frame-'+i+'.png')];
      if (${JSON.stringify(mode)} !== 'no-screenshot') {
        if (${JSON.stringify(mode)} === 'swallowed-invalid-screenshot') { try { await page.screenshot({timeout:1000,path:resolve(output,'bad.png')}) } catch {} }
        const screenshot = await page.screenshot({timeout:1000});
        if (${JSON.stringify(mode)} === 'swallowed-duplicate-screenshot') { try { await page.screenshot({timeout:1000}) } catch {} }
        writeFileSync(resolve(output,'melee-attack-context.png'),screenshot,{flag:'wx'});
      }
      for(const name of artifacts) if(name !== 'melee-attack-context.png' || ${JSON.stringify(mode)} === 'no-screenshot') writeFileSync(resolve(output,name),'supplied fixture',{flag:'wx'});
      await context.close();
      return {contract:'same-frame-ab-v1',status:'passed',canonical:{status:${JSON.stringify(mode === 'canonical-failed' ? 'failed' : 'passed')}},
        diagnostic:{status:'complete-comparison-only',cleanupConfirmed:true},contextClosed:true,artifacts};
    }
  `)
  let contexts = 0, closed = 0
  const browser = { close: async () => {}, newContext: async () => {
    contexts++
    const context = new EventEmitter(), pages = []
    context.route = async () => {}; context.unroute = async () => {}; context.pages = () => pages
    let isClosed = false
    context.close = async () => {
      if (!isClosed) { isClosed = true; closed++; pages.length = 0; context.emit('close') }
    }
    context.newPage = async () => {
      const page = new EventEmitter()
      page.setDefaultTimeout = () => {}; page.setDefaultNavigationTimeout = () => {}
      page.route = async () => {}; page.unroute = async () => {}; page.screenshot = async () => Buffer.from('89504e470d0a1a0a00000000', 'hex')
      page.isClosed = () => isClosed
      page.evaluate = async () => ({viewport:{width:960,height:720},dpr:1,userAgent:'supplied fixture',renderers:[]})
      page.close = async () => {}; pages.push(page); context.emit('page', page); browser.onPage?.(); return page
    }
    return context
  } }
  return { root, candidateRoot, output, browser, counts: () => ({ contexts, closed }),
    report: () => JSON.parse(readFileSync(resolve(output, 'melee-capture-series.json'), 'utf8')),
    remove: () => rmSync(root, { recursive: true, force: true }) }
}
async function run(mode, alteration = () => {}) {
  const f = fixture(mode), controller = new AbortController(), routeStartMs = performance.now()
  const args = { ...f, url: 'http://unused.invalid', signal: controller.signal,
    routeStartMs, outerDeadlineMs: routeStartMs + 5000 }
  alteration(args, controller)
  try { return { f, value: await runMeleeCaptureEvidence(args), error: null } }
  catch (error) { return { f, error } }
}
test('actual adapter accepts only full supplied result and retains owned cleanup', async () => {
  const { f, value, error } = await run('pass')
  try {
    assert.equal(error, null); assert.equal(value.status, 'passed'); assert.equal(value.cleanupVerified, true)
    assert.deepEqual(f.counts(), { contexts: 1, closed: 1 })
    assert.equal(f.report().originalFailureSuperseded, false)
    assert.equal(f.report().status, 'retained-awaiting-host-return'); assert.equal(f.report().hostReturnRequired, true)
    assert.equal(value.bufferScreenshot.attempted, 1); assert.equal(value.bufferScreenshot.succeeded, 1)
  } finally { f.remove() }
})
for (const mode of ['wrong-contract', 'extra-context', 'runtime-error', 'canonical-failed', 'swallowed-context', 'swallowed-page', 'swallowed-api', 'no-screenshot', 'swallowed-invalid-screenshot', 'swallowed-duplicate-screenshot'])
  test(`actual adapter retains failed ${mode} and closes owned context`, async () => {
    const { f, error } = await run(mode)
    try {
      assert.ok(error); assert.equal(f.report().status, 'failed'); assert.equal(f.report().cleanupVerified, true)
      assert.deepEqual(f.counts(), mode === 'wrong-contract' ? { contexts: 0, closed: 0 } : { contexts: 1, closed: 1 })
      if (mode === 'swallowed-context') assert.equal(f.report().accounting.contextsRequested, 2)
      if (mode === 'swallowed-page') assert.equal(f.report().accounting.pagesRequested, 2)
    } finally { f.remove() }
  })
test('actual adapter abort settles candidate and closes its one context without retry', async () => {
  const { f, error } = await run('abort', (args, controller) => {
    args.browser.onPage = () => setImmediate(() => controller.abort(Error('supplied cancellation')))
  })
  try {
    assert.ok(error); assert.equal(f.report().status, 'failed'); assert.equal(f.report().cleanupVerified, true)
    assert.deepEqual(f.counts(), { contexts: 1, closed: 1 })
  } finally { f.remove() }
})
test('expired original budget rejects before any candidate context', async () => {
  const { f, error } = await run('pass', args => { args.routeStartMs -= 10000; args.outerDeadlineMs -= 10000 })
  try { assert.ok(error); assert.deepEqual(f.counts(), { contexts: 0, closed: 0 }) }
  finally { f.remove() }
})

for (const mode of ['late-write', 'abort-write', 'backward-write', 'late-inventory', 'failed-final-write'])
  test(`actual adapter ${mode} cannot leave an authoritative passed receipt or return success`, async t => {
    const f = fixture('pass'), controller = new AbortController(), originalWrite = fs.writeFileSync, originalReadDir = fs.readdirSync
    let now = 1000, provisionalSeen = false
    t.mock.method(performance, 'now', () => now)
    t.mock.method(fs, 'writeFileSync', (path, bytes, ...args) => {
      const series = String(path).endsWith('/melee-capture-series.json')
      if (series && provisionalSeen && mode === 'failed-final-write') throw Error('supplied failed persistence')
      const value = originalWrite(path, bytes, ...args)
      if (series && String(bytes).includes('retained-awaiting-host-return')) {
        provisionalSeen = true
        if (mode === 'late-write') now = 6000
        if (mode === 'abort-write') controller.abort(Error('supplied tail cancellation'))
        if (mode === 'backward-write') now = 999
        if (mode === 'failed-final-write') throw Error('supplied partial final write')
      }
      return value
    })
    t.mock.method(fs, 'readdirSync', (...args) => { const value = originalReadDir(...args); if (provisionalSeen && mode === 'late-inventory') now = 6000; return value })
    syncBuiltinESMExports()
    try {
      await assert.rejects(runMeleeCaptureEvidence({ ...f, url: 'http://unused.invalid', signal: controller.signal,
        routeStartMs: 1000, outerDeadlineMs: 5000 }))
      assert.equal(provisionalSeen, true)
      const retained = f.report()
      assert.notEqual(retained.status, 'passed'); assert.equal(retained.hostReturnRequired, true)
      assert.equal(retained.status, mode === 'failed-final-write' ? 'retained-awaiting-host-return' : 'failed')
      assert.deepEqual(f.counts(), { contexts: 1, closed: 1 })
    } finally { t.mock.restoreAll(); syncBuiltinESMExports(); f.remove() }
  })
