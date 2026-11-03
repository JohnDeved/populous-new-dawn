import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { Readable } from 'node:stream'
import { captureSnapshotQueryWitnessCore, queryWitnessOffsets } from '../scripts/browser-performance/snapshot-query-witness-core.mjs'

function supplied(overrides = {}) {
  const calls = [], retained = new Map(); let sequence = 0, expected
  const leaves = {
    prepare: async () => { calls.push('prepare'); return { supplied: true } },
    observe: async () => ({ supplied: true }),
    installGeometry: async () => ({ supplied: true }),
    installObserver: async () => { calls.push('install') },
    boundary: async () => ({ witness: [1], fingerprintSha256: 'g' }),
    arm: async value => { expected = value; sequence++; calls.push(['arm', value.x, value.y]) },
    move: async (x, y) => { assert.deepEqual([x, y], [expected.x, expected.y]); calls.push(['move', x, y]) },
    waitFour: async () => { calls.push('wait4') },
    finishFour: async () => ({ event: { sequence }, frames: [1, 2, 3, 4] }),
    cleanup: async () => { calls.push('cleanup'); return { confirmed: true, observer: { error: null } } },
    exportRaw: async () => { calls.push('export'); return '{"supplied":true}' },
    summarize: async () => ({ supplied: true }), ...overrides,
  }
  const options = { expectedRevision: 'a'.repeat(40), check() {}, retain(name, text) {
    assert.equal(retained.has(name), false); retained.set(name, text); return { name, bytes: Buffer.byteLength(text) }
  } }
  return { leaves, options, calls, retained, run: () => captureSnapshotQueryWitnessCore(options, leaves) }
}
test('one fixed sequence, six events and four callbacks each remain non-admitting', async () => {
  const f = supplied(); const result = await f.run()
  assert.equal(result.status, 'observed-unqualified'); assert.equal(result.comparisonEligible, false)
  assert.equal(result.interpretationEligible, false); assert.equal(result.blocks.length, 6)
  assert.deepEqual(f.calls.filter(x => Array.isArray(x) && x[0] === 'move'), queryWitnessOffsets.map(([x,y]) => ['move', 900+x, 400+y]))
  assert.equal(f.calls.filter(x => x === 'wait4').length, 6)
  assert.ok(f.calls.indexOf('cleanup') < f.calls.indexOf('export'))
  assert.deepEqual([...f.retained.keys()], ['arm-query-frames.json', 'arm-query-witness.json'])
})
test('falsey primary survives secondary cleanup failure and is retained', async () => {
  const f = supplied({ move: async () => { throw null }, cleanup: async () => { throw Error('cleanup') } })
  await assert.rejects(f.run(), error => error === null)
  const p = JSON.parse(f.retained.get('arm-query-witness.json'))
  assert.equal(p.failure, 'null'); assert.equal(p.status, 'failed'); assert.equal(p.observerCleanupConfirmed, false)
  assert.match(p.cleanupFailure, /cleanup/); assert.equal(f.retained.has('arm-query-frames.json'), false)
})
test('preflight failure owns cleanup without issuing an input', async () => {
  const f = supplied(); f.options.expectedRevision = 'bad'
  await assert.rejects(f.run()); assert.deepEqual(f.calls, ['cleanup'])
})
test('missing exact sequence stops without retrying or exporting', async () => {
  const f = supplied({ finishFour: async () => ({ event: { sequence: 99 }, frames: [] }) })
  await assert.rejects(f.run()); assert.equal(f.calls.filter(x => Array.isArray(x) && x[0] === 'move').length, 1)
  assert.equal(f.calls.includes('export'), false)
})
test('raw evidence is retained before unchanged validator rejects zero query work', async () => {
  const failure = Error('First query missing'), f = supplied({ summarize: async () => { throw failure } })
  await assert.rejects(f.run(), error => error === failure)
  assert.equal(f.retained.has('arm-query-frames.json'), true)
  assert.equal(JSON.parse(f.retained.get('arm-query-witness.json')).status, 'failed')
})
test('owner deadline after awaited move prevents late subsequent work', async () => {
  let expired = false
  const f = supplied({ move: async () => { expired = true } }); f.options.check = () => { if (expired) throw Error('deadline') }
  await assert.rejects(f.run(), /deadline/)
  assert.equal(f.calls.includes('wait4'), false); assert.equal(f.calls.includes('cleanup'), true); assert.equal(f.retained.size, 0)
})
test('falsey primary is preserved if final retention also fails', async () => {
  const f = supplied({ prepare: async () => { throw false } }); f.options.retain = () => { throw Error('write') }
  await assert.rejects(f.run(), error => error === false)
})
const source = readFileSync(new URL('../scripts/browser-performance/snapshot-query-witness.mjs', import.meta.url), 'utf8')
const start = source.indexOf('export async function readBoundedQueryDownload('), end = source.indexOf('\n// Caller', start)
assert.ok(start >= 0 && end > start)
const readDownload = new Function('assert', source.slice(start,end).replaceAll('export ', '') + '; return readBoundedQueryDownload')(assert)
test('actual download reader caps bytes, rejects malformed UTF8 and closes stream', async () => {
  for (const [chunks, cap, failure] of [[[Buffer.from('{}')],2,false],[[Buffer.from('too big')],2,true],[[Buffer.from([0xff])],2,true]]) {
    const stream = Readable.from(chunks), download = { suggestedFilename: () => 'populous-frames-test.json', createReadStream: async () => stream }
    if (failure) await assert.rejects(readDownload(download,cap)); else assert.equal(await readDownload(download,cap), '{}')
    assert.equal(stream.destroyed, true)
  }
})
test('adapter delegates actual raw/geometry validation and has no state injection', () => {
  assert.match(source, /summarizeSnapshotPhase\(raw, packet, expectedRevision, packet.readers\)/)
  assert.match(source, /validateReaderEvidence\(readers\)/)
  assert.match(source, /assertSnapshotAdmission\(state, fixture\)/)
  assert.doesNotMatch(source, /world\.[\w.]+\s*=|\.tick\(|\.render\(|saveAs\(/)
})
const stopStart = source.indexOf('export function stopQueryObserver('), stopEnd = source.indexOf('\nexport async function readBoundedQueryDownload', stopStart)
assert.ok(stopStart >= 0 && stopEnd > stopStart)
const stopFor = window => new Function('window', source.slice(stopStart,stopEnd).replace('export ', '') + '; return stopQueryObserver')(window)
test('actual cleanup removes only owned resources and does not call a foreign observer', () => {
  let stops = 0
  const own = { token: 't', session: {}, geometry: {}, observer: { stop: () => { stops++; return { error: null } } } }
  const foreign = {}, window = { __pndSnapshotQueryWitnessOwner: own, __pndSnapshotReaderSession: own.session, __pndSnapshotGeometry: own.geometry, __pndSnapshotObserver: foreign }
  assert.deepEqual(stopFor(window)('t'), { confirmed: false, observer: null })
  assert.equal(stops, 0); assert.equal(window.__pndSnapshotObserver, foreign)
  assert.equal(Object.hasOwn(window,'__pndSnapshotGeometry'), false)
})
test('actual cleanup calls owned observer once and retains its failure evidence', () => {
  let stops = 0
  const own = { token: 't', session: {}, geometry: {} }, window = {}
  own.observer = { stop: () => { stops++; delete window.__pndSnapshotObserver; return { error: 'supplied chronology failure' } } }
  Object.assign(window, { __pndSnapshotQueryWitnessOwner: own, __pndSnapshotReaderSession: own.session, __pndSnapshotGeometry: own.geometry, __pndSnapshotObserver: own.observer })
  assert.deepEqual(stopFor(window)('t'), { confirmed: true, observer: { error: 'supplied chronology failure' } })
  assert.equal(stops, 1); assert.deepEqual(window,{})
  assert.equal(stopFor(window)('t').confirmed, false); assert.equal(stops, 1)
})
test('slow synchronous final retention cannot return success beyond owner deadline', async () => {
  let expired = false
  const f = supplied(), retain = f.options.retain
  f.options.check = () => { if (expired) throw Error('final deadline') }
  f.options.retain = (name,text) => { const result = retain(name,text); if (name === 'arm-query-witness.json') expired = true; return result }
  await assert.rejects(f.run(), /final deadline/)
})
test('asynchronous raw and final retention failures are awaited', async () => {
  for (const name of ['arm-query-frames.json','arm-query-witness.json']) {
    const f = supplied(), retain = f.options.retain
    // Thenable rejection exposes omission without creating an unhandled Promise.
    f.options.retain = (file,text) => file === name ? { then(resolve,reject) { reject(false) } } : retain(file,text)
    await assert.rejects(f.run(), error => error === false)
  }
})
test('actual cleanup attempts all owned global removals after falsey stop failure', () => {
  const own = { token: 't', session: {}, geometry: {}, observer: { stop() { throw null } } }
  const window = { __pndSnapshotQueryWitnessOwner: own, __pndSnapshotReaderSession: own.session, __pndSnapshotGeometry: own.geometry, __pndSnapshotObserver: own.observer }
  assert.throws(() => stopFor(window)('t'), error => error === null)
  for (const name of ['__pndSnapshotQueryWitnessOwner','__pndSnapshotReaderSession','__pndSnapshotGeometry']) assert.equal(Object.hasOwn(window,name),false)
  assert.equal(window.__pndSnapshotObserver,own.observer, 'failed observer stop remains uncertain for browser owner')
})
test('actual four-callback waiter disposes its Playwright handle exactly once', async () => {
  const start = source.indexOf('export async function waitForQueryFour('), end = source.indexOf('\n// Caller',start)
  assert.ok(start >= 0 && end > start)
  const wait = new Function(source.slice(start,end).replace('export ','')+';return waitForQueryFour')()
  let calls = 0, disposed = 0
  const page = { async waitForFunction(fn, token) { calls++; assert.equal(token,'token'); return { async dispose() { disposed++ } } } }
  await wait(page,'token'); assert.equal(calls,1); assert.equal(disposed,1)
  assert.match(source, /await recording\.dispose\(\); check\(\)/)
})
