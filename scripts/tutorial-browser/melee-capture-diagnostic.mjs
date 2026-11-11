import assert from 'node:assert/strict'
import { closeSync, fstatSync, ftruncateSync, openSync, readFileSync, readdirSync, statSync, writeSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import meleeAttack from './melee-attack.mjs'
import { captureBudget } from './capture-diagnostic-budget.mjs'
import { inspectCapturePng } from './capture-diagnostic-png.mjs'

export const captureDiagnosticContract = 'same-frame-ab-v1'
const names = ['melee-attack.json', 'melee-capture-diagnostic.json',
  ...Array.from({ length: 4 }, (_, i) => `melee-attack-frame-${i}.png`),
  ...Array.from({ length: 4 }, (_, i) => `diagnostic-melee-B-frame-${i}.png`),
  'melee-attack-context.png', 'melee-attack-failure.png']
const hash = data => createHash('sha256').update(data).digest('hex')

export default async function runMeleeCaptureDiagnostic({ browser, url, output, expectedRevision,
  routeStartMs, outerDeadlineMs, signal }) {
  const budget = captureBudget(routeStartMs, outerDeadlineMs, signal)
  assert.match(expectedRevision, /^[a-f0-9]{40}$/)
  const files = new Map(), created = new Set(), inventoryBefore = new Set(readdirSync(output))
  assert.ok(names.every(name => !inventoryBefore.has(name)), 'Diagnostic output names already occupied')
  let context = null, contextPending = null, contextClosed = false, closing = null, watchdog, screenshotClaimed = false
  let failure = null, report = null
  const result = { contract: captureDiagnosticContract, status: 'failed', canonical: { status: 'failed' },
    diagnostic: { status: 'incomplete', cleanupConfirmed: false }, contextClosed: false, artifacts: [] }
  const totals = (proposedName = null, proposedSize = 0) => {
    let overall = 0, sidecar = 0, pngs = 0
    for (const name of readdirSync(output)) {
      const size = name === proposedName ? proposedSize : statSync(resolve(output, name)).size
      overall += size
      if (name === 'melee-capture-diagnostic.json' || /^diagnostic-melee-B-frame-/.test(name)) sidecar += size
      if (name.endsWith('.png')) pngs++
      assert.ok(inventoryBefore.has(name) || names.includes(name), 'Unexpected diagnostic output')
    }
    if (proposedName && !readdirSync(output).includes(proposedName)) {
      overall += proposedSize
      if (proposedName === 'melee-capture-diagnostic.json' || /^diagnostic-melee-B-frame-/.test(proposedName)) sidecar += proposedSize
      if (proposedName.endsWith('.png')) pngs++
    }
    assert.ok(overall <= 64 * 1024 * 1024 && sidecar <= 8 * 1024 * 1024 && pngs <= 9)
  }
  const saveJson = (name, value, failureOnly = false) => {
    if (!failureOnly) budget.check()
    else assert.notEqual(value.caseOutcome?.status, 'passed')
    assert.ok(['melee-attack.json', 'melee-capture-diagnostic.json'].includes(name))
    const bytes = Buffer.from(JSON.stringify(value, null, 2) + '\n')
    assert.ok(bytes.length <= 8 * 1024 * 1024, 'Diagnostic JSON limit exceeded')
    totals(name, bytes.length)
    // Own the inode once; subsequent bounded report updates do not truncate an
    // unowned or substituted path. Never create duplicate data-URL JSON copies.
    if (!files.has(name)) { files.set(name, openSync(resolve(output, name), 'wx')); created.add(name) }
    const fd = files.get(name)
    assert.ok(fstatSync(fd).isFile())
    ftruncateSync(fd, 0)
    let offset = 0
    while (offset < bytes.length) {
      const written = writeSync(fd, bytes, offset, bytes.length - offset, offset)
      assert.ok(written > 0, 'JSON write made no progress')
      offset += written
      if (!failureOnly) budget.check()
    }
    totals()
    if (!failureOnly) budget.check()
  }
  const writePng = (name, dataUrl, expected) => {
    budget.check()
    assert.ok(names.includes(name) && /frame-[0-3]\.png$/.test(name))
    assert.match(dataUrl, /^data:image\/png;base64,[A-Za-z0-9+/]*={0,2}$/)
    const encoded = dataUrl.slice('data:image/png;base64,'.length)
    assert.ok(encoded.length <= 1398104)
    const bytes = Buffer.from(encoded, 'base64')
    assert.equal(bytes.toString('base64'), encoded)
    assert.equal(hash(bytes), expected.pngSha256)
    const decoded = inspectCapturePng(bytes, expected)
    assert.equal(decoded.opaqueColors, expected.opaqueColors)
    totals(name, bytes.length)
    writeFileSync(resolve(output, name), bytes, { flag: 'wx' }); created.add(name); totals()
    return { sha256: hash(bytes), decoded }
  }
  const screenshot = async (page, label) => {
    budget.check()
    if (screenshotClaimed) return null
    screenshotClaimed = true // Failed/partial context image never permits a tenth PNG.
    const name = `melee-attack-${label}.png`
    assert.ok(names.includes(name))
    const timeout = Math.min(10000, Math.floor(budget.check()))
    assert.ok(timeout > 0, 'No whole millisecond left for screenshot')
    const bytes = await page.screenshot({ timeout })
    budget.check()
    assert.ok(bytes.length <= 8 * 1024 * 1024)
    totals(name, bytes.length)
    writeFileSync(resolve(output, name), bytes, { flag: 'wx' }); created.add(name); totals()
    return { filename: name, sha256: hash(bytes) }
  }
  const close = () => {
    if (!context) return Promise.resolve()
    if (!closing) closing = context.close().then(() => { contextClosed = true })
    return closing
  }
  const terminate = () => { budget.fail('Diagnostic aborted or original deadline exhausted'); void close().catch(() => {}) }
  budget.check() // Reject an already-aborted case before registering an owned listener.
  signal?.addEventListener('abort', terminate, { once: true })
  watchdog = setTimeout(terminate, Math.max(0, budget.check()))
  try {
    budget.check()
    contextPending = browser.newContext({ viewport: { width: 960, height: 720 }, deviceScaleFactor: 1 })
    context = await contextPending
    budget.check()
    const page = await context.newPage()
    budget.check()
    report = await meleeAttack({ browser, url, output, expectedRevision,
      captureDiagnostic: { mode: captureDiagnosticContract, context, page, budget, saveJson, writePng, screenshot } })
    budget.check()
    result.canonical.status = report.canonicalStatus === 'passed' ? 'passed' : 'failed'
    result.diagnostic = { status: report.captureDiagnostic?.retention?.status ?? 'incomplete',
      cleanupConfirmed: report.captureDiagnostic?.cleanup?.confirmed === true }
  } catch (error) {
    failure = String(error)
    if (created.has('melee-attack.json')) {
      try {
        report = JSON.parse(readFileSync(resolve(output, 'melee-attack.json')))
        result.canonical.status = report.canonicalStatus === 'passed' ? 'passed' : 'failed'
      } catch { /* A malformed report cannot establish canonical acceptance. */ }
    }
    if (created.has('melee-capture-diagnostic.json')) {
      try {
        const diagnostic = JSON.parse(readFileSync(resolve(output, 'melee-capture-diagnostic.json')))
        result.diagnostic = { status: diagnostic.retention?.status ?? 'incomplete', cleanupConfirmed: diagnostic.cleanup?.confirmed === true }
      } catch { /* Preserve incomplete status; never substitute a success. */ }
    }
  }
  finally {
    // A late newContext result is still owned and closed. The watchdog remains
    // active until cleanup settles. The outer worker owns forced termination.
    try { if (!context && contextPending) context = await contextPending; await close() }
    catch (error) { failure ??= `Context closure failed: ${error}` }
    try { budget.check() } catch (error) { failure ??= String(error) }
    result.contextClosed = contextClosed
    result.artifacts = [...created].sort()
    result.status = !failure && result.canonical.status === 'passed' &&
      result.diagnostic.status === 'complete-comparison-only' && result.diagnostic.cleanupConfirmed && contextClosed ? 'passed' : 'failed'
    try { totals() } catch (error) { failure ??= String(error); result.status = 'failed' }
    try {
      const sidecar = created.has('melee-capture-diagnostic.json') ?
        JSON.parse(readFileSync(resolve(output, 'melee-capture-diagnostic.json'))) :
        { schema: 'capture-probe-preparation-v1', pairs: [], retention: null, cleanup: { confirmed: false } }
      if (!created.has('melee-attack.json')) saveJson('melee-attack.json', {
        status: 'failed', failure, expectedRevision, observation: null, acceptance: null }, true)
      result.artifacts = [...new Set([...created, 'melee-capture-diagnostic.json'])].sort()
      // A persisted sidecar can never certify its own subsequent persistence,
      // reads or descriptor cleanup. Only the guarded host return may pass.
      sidecar.caseOutcome = { ...result, status: failure || result.status !== 'passed' ? 'failed' : 'retained-awaiting-host-return',
        hostReturnRequired: true, failure, historicalFailureSuperseded: false }
      saveJson('melee-capture-diagnostic.json', sidecar, !!failure)
      if (!failure) budget.check()
    } catch (error) { failure ??= String(error); result.status = 'failed' }
    for (const fd of files.values()) {
      try { closeSync(fd) } catch (error) { failure ??= `Descriptor cleanup failed: ${error}`; result.status = 'failed' }
      try { budget.check() } catch (error) { failure ??= String(error); result.status = 'failed' }
    }
    try {
      assert.ok(readFileSync(resolve(output, 'melee-capture-diagnostic.json')).length)
      totals(); budget.check()
    } catch (error) { failure ??= String(error); result.status = 'failed' }
    finally { clearTimeout(watchdog); signal?.removeEventListener('abort', terminate) }
    try { budget.check() } catch (error) { failure ??= String(error); result.status = 'failed' }
  }
  assert.equal(result.status, 'passed', `Melee capture diagnostic failed: ${failure ?? 'canonical/comparison/cleanup failure'}`)
  // No blocking work after the final authoritative budget check.
  return result
}
