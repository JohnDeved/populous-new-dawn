// Dormant one-arm diagnostic. Never admits a comparative benchmark.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
export const armWitnessLimits = Object.freeze({ operationMs: 60000, cleanupMs: 2000, totalMs: 62000, fileBytes: 8 * 1024 * 1024, totalBytes: 16 * 1024 * 1024 })
const hash = text => createHash('sha256').update(text).digest('hex')
const describe = error => { try { return String(error).slice(0, 2000) } catch { return '<unprintable failure>' } }
export async function captureSnapshotArmWitness(options, leaves) {
  const { browser, url, source, expectedRevision, expectedGeneratorSha256, expectedCodecSha256, expectedCheckpointVersion } = options
  const { checkpointVersion, createFixture, validateFixture, loadSnapshot, observe, writeExclusive,
    now = () => performance.now(), schedule = setTimeout, cancel = clearTimeout } = leaves
  const sourceCommit = source?.commit
  let receipt = { version: 1, role: 'single-arm-public-load-witness-not-comparison',
    comparisonEligible: false, interpretationEligible: false, status: 'incomplete', limits: armWitnessLimits }
  let started, lastClock, timer, timedOut = false, finalized = false, bytes = 0, failed = false, failure
  const recordFailure = error => { receipt.status = 'failed'; if (!failed) { failed = true; failure = error; receipt.failure = describe(error) } }
  const readClock = () => {
    const value = now()
    assert.ok(Number.isFinite(value) && (lastClock === undefined || value >= lastClock), 'Invalid/non-monotonic witness clock')
    lastClock = value; return value
  }
  receipt.runtimeErrors = []; receipt.droppedRuntimeErrors = 0
  const runtimeError = value => {
    if (finalized) return
    if (receipt.runtimeErrors.length < 20) receipt.runtimeErrors.push(String(value).slice(0, 1600))
    else receipt.droppedRuntimeErrors++
  }
  const assertRuntime = () => assert.equal(receipt.runtimeErrors.length + receipt.droppedRuntimeErrors, 0, 'Witness browser runtime errors')
  let closing, operationStarted = false, operationSettled = false
  const close = () => closing ??= Promise.resolve().then(() => browser.close())
  const check = () => {
    if (finalized || timedOut) throw Error('Snapshot arm witness deadline exceeded')
    if (readClock() - started >= armWitnessLimits.operationMs) { timedOut = true; throw Error('Snapshot arm witness deadline exceeded') }
  }
  const retain = (name, text) => {
    check(); assert.equal(typeof text, 'string')
    const size = Buffer.byteLength(text)
    assert.ok(size <= armWitnessLimits.fileBytes && bytes + size <= armWitnessLimits.totalBytes - 131072, 'Witness byte quota exceeded')
    writeExclusive(name, text); bytes += size
    return { name, bytes: size, sha256: hash(text) }
  }
  try {
    if (options.receipt !== undefined) {
      assert.equal(Object.getPrototypeOf(options.receipt), Object.prototype, 'Outer receipt must be an ordinary object')
      assert.ok(Object.values(Object.getOwnPropertyDescriptors(options.receipt)).every(d => 'value' in d && d.writable), 'Outer receipt fields must be writable data')
      Object.assign(options.receipt, receipt); receipt = options.receipt
    }
    started = readClock()
    assert.ok([3, 5].includes(expectedCheckpointVersion)); assert.equal(checkpointVersion, expectedCheckpointVersion)
    receipt.checkpointVersion = checkpointVersion
    assert.match(sourceCommit ?? '', /^[a-f0-9]{40}$/); assert.equal(expectedRevision, sourceCommit)
    for (const pin of [expectedGeneratorSha256, expectedCodecSha256]) assert.match(pin ?? '', /^[a-f0-9]{64}$/)
    assert.equal(browser.contexts().length, 0, 'Witness requires an exclusively owned empty browser')
    const operation = async () => {
      check()
      const fixture = await createFixture({ source: { commit: sourceCommit } }); check()
      assert.equal(fixture.receipt.sourceCommit, sourceCommit)
      assert.equal(fixture.receipt.generatorSha256, expectedGeneratorSha256)
      assert.equal(fixture.receipt.codecSha256, expectedCodecSha256)
      const { transferText, expectedText } = validateFixture(fixture)
      receipt.fixture = { transfer: retain('arm-snapshot-transfer.json', transferText), expected: retain('arm-snapshot-expected.json', expectedText),
        source: retain('arm-snapshot-source.json', JSON.stringify(fixture.receipt)) }
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 }); check()
      const page = await context.newPage(); check(); page.setDefaultTimeout(15000)
      page.on('pageerror', runtimeError)
      page.on('crash', () => runtimeError('Page crashed'))
      page.on('console', message => { if (message.type() === 'error') runtimeError(message.text()) })
      const load = await loadSnapshot({ page, url, fixture, expectedRevision }); check(); assertRuntime()
      assert.equal(load.status, 'ready', 'Strict public Load did not complete')
      receipt.load = retain('arm-public-load.json', JSON.stringify(load))
      // Each observer serializes its entire graph synchronously. No equality is
      // inferred from two readings; both originals are retained, including drift.
      const first = await observe(page); check(); assertRuntime()
      receipt.first = retain('arm-endpoint-first.json', first)
      const second = await observe(page); check(); assertRuntime()
      receipt.second = retain('arm-endpoint-second.json', second)
      receipt.sourceCommit = sourceCommit; receipt.expectedRevision = expectedRevision
      receipt.endpointBytesEqual = first === second
    }
    const deadline = new Promise((resolve, reject) => {
      timer = schedule(() => { timedOut = true; void close().catch(() => {}); reject(Error('Snapshot arm witness deadline exceeded')) }, armWitnessLimits.operationMs)
    })
    operationStarted = true
    const work = Promise.resolve().then(operation).finally(() => { operationSettled = true })
    await Promise.race([work, deadline]); check()
  } catch (error) { recordFailure(error) }
  finally {
    cancel(timer)
    let cleanupTimer, cleanupStarted
    try { cleanupStarted = readClock() } catch (error) { receipt.clockFailure = describe(error); recordFailure(error) }
    try {
      // Cleanup's independent timer does not rely on the diagnostic clock.
      await Promise.race([close(), new Promise((resolve, reject) => { cleanupTimer = schedule(() => reject(Error('Witness browser cleanup deadline exceeded')), armWitnessLimits.cleanupMs) })])
      if (cleanupStarted !== undefined)
        assert.ok(readClock() - cleanupStarted < armWitnessLimits.cleanupMs, 'Witness browser cleanup deadline exceeded')
      receipt.browserDisconnected = browser.isConnected() === false
      receipt.operationSettled = !operationStarted || operationSettled
      receipt.cleanupVerified = receipt.browserDisconnected && receipt.operationSettled
      assert.equal(receipt.cleanupVerified, true, 'Witness browser or operation cleanup unconfirmed')
      assertRuntime()
    } catch (error) {
      receipt.cleanupVerified = false; receipt.cleanupFailure = describe(error); recordFailure(error)
    } finally { cancel(cleanupTimer); finalized = true }
    receipt.timedOut = timedOut
    try { const ended = readClock(); receipt.elapsedMs = started === undefined ? null : ended - started }
    catch (error) { receipt.elapsedMs = null; receipt.clockFailure = describe(error); recordFailure(error) }
    receipt.operationSettled ??= !operationStarted || operationSettled
    if (receipt.elapsedMs !== null && receipt.elapsedMs >= armWitnessLimits.totalMs) recordFailure(Error('Witness whole-owner deadline exceeded'))
    receipt.retainedBytes = bytes; receipt.status = failed ? 'failed' : 'observed-unqualified'
    const text = JSON.stringify(receipt)
    try {
      assert.ok(Buffer.byteLength(text) <= 65536 && bytes + Buffer.byteLength(text) <= armWitnessLimits.totalBytes)
      writeExclusive('arm-witness.json', text)
      const afterWrite = readClock()
      if (started !== undefined && afterWrite - started >= armWitnessLimits.totalMs) throw Error('Witness whole-owner deadline exceeded during final retention')
    } catch (error) {
      recordFailure(error)
      // Never rewrite an existing path. This small exclusive failure tombstone
      // overrides any earlier observation receipt for whole-owner finalization.
      try {
        const marker = JSON.stringify({ version: 1, status: 'failed', comparisonEligible: false, interpretationEligible: false, sourceCommit, failure: describe(failure) })
        assert.ok(Buffer.byteLength(marker) <= 65536 && bytes + Buffer.byteLength(text) + Buffer.byteLength(marker) <= armWitnessLimits.totalBytes)
        writeExclusive('arm-witness-finalization-failure.json', marker)
      } catch {}
    }
  }
  if (failed) throw failure
  return receipt
}
