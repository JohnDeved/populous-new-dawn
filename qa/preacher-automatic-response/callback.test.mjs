import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import * as observer from './observe.mjs'

// Supplied callback rows are contract diagnostics, never ordinary event evidence.
const pair = () => JSON.parse(readFileSync(new URL('./retained-continuation01-first32.json', import.meta.url)))
const fixture = () => {
  const { before, after } = pair(), callback = structuredClone(before)
  callback.phase = 'scanner-commit'; callback.turn = after.turn
  callback.person.flags3 &= ~0x800
  callback.scannerCommit = { bound: true, oldFlags3: before.person.flags3,
    writtenFlags3: callback.person.flags3, frames: ['combatScan', 'allocateLiveCombatResponse', 'startLiveCombatResponse', 'stepTurn'],
    consumed: { person: { ...callback.person, flags3: before.person.flags3, counter: callback.turn & 255 },
      order: structuredClone(callback.order), levelFlags2: callback.facts.levelFlags2, inTower: false } }
  return { before, callback, after }
}

test('scanner callback keeps truthful same-turn consumed inputs and enclosing whole-turn rows', () => {
  const { before, callback, after } = fixture()
  const tracker = observer.createResponseTracker({ prospective: true, scannerCallbacks: true })
  tracker.observe(before); tracker.observe(callback); tracker.observe(after)
  assert.equal(tracker.progress.status, 'responding', tracker.progress.reason)
  assert.equal(tracker.progress.firstResponse.before.phase, 'scanner-commit')
  assert.equal(tracker.progress.firstResponse.before.turn, after.turn)
  assert.deepEqual(tracker.progress.firstResponse.enclosingBefore, before)
  assert.deepEqual(tracker.rows, [before, callback, after])
})

test('callback qualification rejects missing/duplicate callback and changed consumed or native inputs', () => {
  for (const change of [v => { v.callback = null }, v => { v.duplicate = true },
    v => { v.callback.scannerCommit.bound = false }, v => { v.callback.scannerCommit.oldFlags3 = null },
    v => { v.callback.scannerCommit.consumed.person.speed++ },
    v => { v.callback.scannerCommit.consumed.order.a++ },
    v => { v.callback.facts.braves[0].workFlags = 1 }, v => { v.callback.facts.braves[0].identity++ },
    v => { v.callback.facts.braves[0].routeOwner++ }, v => { v.callback.facts.braves[0].x += 512 },
    v => { v.callback.queued[0].identity++ }, v => { v.callback.turn++ }]) {
    const f = fixture(); change(f)
    const tracker = observer.createResponseTracker({ prospective: true, scannerCallbacks: true })
    tracker.observe(f.before); if (f.callback) tracker.observe(f.callback)
    if (f.duplicate) tracker.observe(f.callback)
    tracker.observe(f.after)
    assert.equal(tracker.progress.status, 'failed'); assert.equal(tracker.progress.firstResponse, null)
  }
})

test('pending callback cadence uses the actual precommit flags rather than retained person counter', () => {
  const f = fixture(); f.before.turn = 4654; f.callback.turn = f.after.turn = 4655
  f.callback.scannerCommit.oldFlags3 |= 0x800
  f.callback.scannerCommit.consumed.person.flags3 |= 0x800
  f.callback.scannerCommit.consumed.person.counter = 4655 & 255
  assert.equal(observer.classifyScannerResponse(f.before, f.callback, f.after).kind, 'qualified')
  f.callback.scannerCommit.oldFlags3 &= ~0x800
  f.callback.scannerCommit.consumed.person.flags3 &= ~0x800
  assert.equal(observer.classifyScannerResponse(f.before, f.callback, f.after).kind, 'invalid')
})

test('flags3 watch forwards exact writes before reads, isolates observer errors and restores latest value', () => {
  assert.equal(typeof observer.installScannerCommitWatch, 'function')
  const person = { flags3: 0x800 }, descriptor = Object.getOwnPropertyDescriptor(person, 'flags3'), seen = []
  const watch = observer.installScannerCommitWatch(person, { identify: () => ({ bound: true }),
    observe: entry => { seen.push([entry.oldFlags3, entry.writtenFlags3, person.flags3]); throw Error('supplied observer error') } })
  person.flags3 = 7; assert.equal(person.flags3, 7)
  person.flags3 = 0x40000; assert.equal(person.flags3, 0x40000)
  assert.deepEqual(seen, [[0x800, 7, 7], [7, 0x40000, 0x40000]])
  const result = watch.finish(); assert.equal(result.restored, true); assert.equal(result.errors.length, 2)
  assert.deepEqual(Object.getOwnPropertyDescriptor(person, 'flags3'), { ...descriptor, value: 0x40000 })
  assert.equal(watch.finish().restored, true)
  person.flags3 = 42; assert.equal(person.flags3, 42)
})

test('flags3 watch rejects unknown descriptors, preserves unrelated writes and refuses foreign replacement', () => {
  assert.equal(typeof observer.installScannerCommitWatch, 'function')
  for (const descriptor of [{ value: 0, configurable: false, writable: true },
    { value: 0, configurable: true, writable: false }, { get: () => 0, configurable: true }]) {
    const p = {}; Object.defineProperty(p, 'flags3', descriptor)
    assert.throws(() => observer.installScannerCommitWatch(p, { identify: () => null, observe() {} }))
    assert.deepEqual(Object.getOwnPropertyDescriptor(p, 'flags3'), descriptor.get ?
      { get: descriptor.get, set: undefined, enumerable: false, configurable: true } : { enumerable: false, ...descriptor })
  }
  const p = { flags3: 1 }, watch = observer.installScannerCommitWatch(p, { identify: () => null, observe() { assert.fail() } })
  p.flags3 = 23; assert.equal(p.flags3, 23)
  Object.defineProperty(p, 'flags3', { value: 99, writable: true, configurable: true, enumerable: true })
  const done = watch.finish(); assert.equal(done.restored, false); assert.ok(done.errors.length); assert.equal(p.flags3, 99)
})

test('checkpoint expectation keeps original unless a complete readback and independent digest verify a Save', async () => {
  const scenario = await import('./scenario.mjs')
  assert.equal(typeof scenario.verifyCommittedSave, 'function')
  const original = { turn: 3234, checkpointSha256: 'original' }, expected = structuredClone(original)
  assert.deepEqual(expected, original, 'No Save keeps the initial expectation')
  const before = { turn: 4800, actor: { id: 3162 } }, digest = {
    version: 1, level: 3, turn: 4800, time: 400, checkpointSha256: 'saved', actorsSha256: 'actors', terrainSha256: 'terrain', stockSha256: 'stock' }
  const saved = scenario.verifyCommittedSave(before, { response: before, digest }, { checkpoint: digest })
  assert.deepEqual(saved, digest, 'Latest verified Save survives any later screenshot/UI failure')
  for (const invalid of [null, { response: { turn: 4799 }, digest }, { response: before, digest: { ...digest, checkpointSha256: 'wrong' } }])
    assert.throws(() => scenario.verifyCommittedSave(before, invalid, { checkpoint: digest }))
  assert.throws(() => scenario.verifyCommittedSave(before, { response: before, digest }, null))
  assert.deepEqual(original, expected, 'Unverified Save cannot replace original expectation')
})

function suppliedModules() {
  const bodies = {
    'app/live-combat.ts': 'function combatScan() {\n  p.flags3 = scan.flags3;\n}\nfunction allocateLiveCombatResponse() {\n  const scanner = combatScan(w, p, order, false, firewarriorReady);\n}',
    'app/live-building-combat.ts': 'function startLiveCombatResponse() {\n const id = allocateLiveCombatResponse(\n w, u, source, peers, effects\n );\n}',
    'app/world-turn.ts': 'function stepTurn() {\n if (!target) {\n cancelLiveBuildingAttack(w, u);\n u.target = null;\n if (startLiveCombatResponse(w, u)) {}\n }\n}',
  }
  return Object.fromEntries(Object.entries(bodies).map(([path, servedBody], i) => [path, {
    servedBody, url: 'http://127.0.0.1:4408/' + path, scriptId: String(i + 1),
    sourceSha256: observer.scannerModulePins[path], servedSha256: 'supplied-contract-body',
  }]))
}

test('stack binding uses exact served assignment and all three caller locations', () => {
  const modules = suppliedModules(), bindings = observer.bindScannerCallsites(modules)
  const stack = 'Error\n at setter (http://127.0.0.1:4408/qa/observe.mjs:1:1)\n' + bindings.map(b =>
    ` at ${b.name} (${b.url}:${b.startLine}:${b.startColumn})`).join('\n')
  assert.equal(observer.identifyScannerCommit(stack, bindings).bound, true)
  assert.equal(observer.identifyScannerCommit('Error\n at unrelated (http://127.0.0.1:4408/app/x.ts:1:1)', bindings), null)
  for (const change of [text => text.replace('stepTurn', 'wrongCaller'), text => text.replace('/app/world-turn.ts:', '/app/fake.ts:'),
    text => text.replace(`:${bindings[0].startLine}:${bindings[0].startColumn})`, ':1:1)')])
    assert.throws(() => observer.identifyScannerCommit(change(stack), bindings))
  const ambiguous = suppliedModules(); ambiguous['app/live-combat.ts'].servedBody += '\np.flags3 = scan.flags3;'
  assert.throws(() => observer.bindScannerCallsites(ambiguous))
  const wrong = suppliedModules(); wrong['app/live-combat.ts'].sourceSha256 = 'other'
  assert.throws(() => observer.bindScannerCallsites(wrong))
})

test('reentrant callback errors forward both values and restore during an exceptional exit', () => {
  const person = { flags3: 1 }, watch = observer.installScannerCommitWatch(person, {
    identify: () => ({ bound: true }), observe() { person.flags3 = 9 },
  })
  try { person.flags3 = 2; throw Error('later scenario failure') }
  catch { assert.equal(person.flags3, 9) }
  finally {
    const result = watch.finish()
    assert.equal(result.restored, true); assert.match(result.errors.join(), /Reentrant/)
    assert.equal(Object.getOwnPropertyDescriptor(person, 'flags3').value, 9)
  }
})

test('whole-turn cell crossing stays nonqualifying while a supplied consumed callback has its own strict interval', () => {
  const f = JSON.parse(readFileSync(new URL('./retained-candidate01-first32.json', import.meta.url)))
  assert.equal(observer.classifyProspectiveResponse(f.before, f.after).kind, 'nonqualifying-cell-transition')
  const callback = structuredClone(f.before)
  callback.phase = 'scanner-commit'; callback.turn = f.after.turn
  callback.facts.braves = structuredClone(f.after.facts.braves)
  callback.scannerCommit = { bound: true, oldFlags3: callback.person.flags3,
    writtenFlags3: callback.person.flags3 & ~0x800,
    consumed: { person: { ...callback.person, counter: callback.turn & 255 },
      order: structuredClone(callback.order), levelFlags2: callback.facts.levelFlags2, inTower: false } }
  callback.person.flags3 = callback.scannerCommit.writtenFlags3
  assert.equal(observer.classifyScannerResponse(f.before, callback, f.after).kind, 'qualified')
  const t = observer.createResponseTracker({ prospective: true, scannerCallbacks: true })
  t.observe(f.before); t.observe(callback); t.observe(f.after)
  assert.equal(t.progress.qualifiedEpisode, 1)
  assert.deepEqual(t.progress.firstResponse.enclosingBefore, f.before)
  assert.equal(t.progress.firstResponse.before.phase, 'scanner-commit')
  const absent = structuredClone(callback); absent.facts.braves = []
  assert.notEqual(observer.classifyScannerResponse(f.before, absent, f.after).kind, 'qualified')
})

test('Save cannot begin with an installed, missing or failed scanner restoration', async () => {
  const { requireScannerRestoration } = await import('./scenario.mjs')
  for (const result of [null, { restored: false, errors: [] }, { restored: true, errors: [], notInstalled: true },
    { restored: true, errors: [], callbacks: 0 }, { restored: true, errors: ['failed'], callbacks: 1 }])
    assert.throws(() => requireScannerRestoration(result))
  assert.doesNotThrow(() => requireScannerRestoration({ restored: true, errors: [], callbacks: 1 }))
})

test('only the outer observer owns the guard across two nested application writes', () => {
  const person = { flags3: 1 }; let calls = 0
  const watch = observer.installScannerCommitWatch(person, {
    identify: () => ({ bound: true }), observe() {
      if (++calls === 1) { person.flags3 = 9; person.flags3 = 10 }
    },
  })
  person.flags3 = 2
  assert.equal(person.flags3, 10); assert.equal(calls, 1)
  const done = watch.finish()
  assert.equal(done.restored, true); assert.equal(done.callbacks, 1); assert.equal(done.writes, 3)
  assert.equal(done.errors.length, 2); assert.equal(person.flags3, 10)
})
