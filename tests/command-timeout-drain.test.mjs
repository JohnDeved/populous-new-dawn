import assert from 'node:assert/strict'
import fs from 'node:fs'
import { EventEmitter } from 'node:events'
import test from 'node:test'
const file = process.env.COMMAND_LOG_SOURCE || new URL('../scripts/orchestration/command-log.mjs', import.meta.url)
const source = fs.readFileSync(file, 'utf8')
const start = source.indexOf('export async function captureOwnedCommand(')
const end = source.indexOf('\n// The receipt writer owns/pins', start)
assert(start >= 0 && end > start)
const body = source.slice(start, end).replace('export async function', 'async function')
function fixture({ exitCode = null, killResult = true, killThrows = false } = {}) {
  const timers = new Map(); let next = 0, settled = false, result, failure, kills = 0, unrefs = 0, subscribed = true
  const child = new EventEmitter()
  Object.assign(child, { pid: 123, exitCode, signalCode: null,
    kill() { kills++; if (killThrows) throw Error('signal failed'); return killResult },
    unref() { unrefs++ } })
  for (const name of ['stdin','stdout','stderr']) {
    child[name] = new EventEmitter(); child[name].destroyed = false
    child[name].destroy = () => { child[name].destroyed = true }
  }
  const budget = { error: null, subscribe() { return () => { subscribed = false } } }
  const capture = new Function('spawn','assert','setTimeout','clearTimeout','FAILED_DRAIN_MS','names', body + '\nreturn captureOwnedCommand')(
    () => child, assert, (fn, ms) => { const id = ++next; timers.set(id, {fn,ms}); return id }, id => timers.delete(id), 2000, ['stdout','stderr'])
  const promise = capture(['fixture'], { cwd: '.', env: {}, timeoutMs: 25, rawLogBudget: budget, writeChunk() {} })
  promise.then(value => { settled = true; result = value }, error => { settled = true; failure = error })
  async function flush() { await Promise.resolve(); await Promise.resolve(); await Promise.resolve() }
  async function fire(ms) { const entry = [...timers].find(([, t]) => t.ms === ms); if (entry) { timers.delete(entry[0]); entry[1].fn() }; await flush(); return !!entry }
  return { child, timers, fire, flush, get settled() { return settled }, get result() { return result }, get failure() { return failure }, get kills() { return kills }, get unrefs() { return unrefs }, get subscribed() { return subscribed } }
}
test('deadline bounds retained pipes after direct child already exited successfully', async () => {
  const f = fixture({exitCode: 0}); await f.fire(25); await f.fire(2000)
  assert.equal(f.settled, true); assert.equal(f.result.timedOut, true)
  assert.equal(f.result.drainIncomplete, true); assert(f.result.captureError)
  assert.equal(f.result.ownedChildExited, true); assert.equal(f.kills, 0)
  assert.equal(f.unrefs, 1); assert.equal(f.subscribed, false)
  for (const n of ['stdin','stdout','stderr']) assert.equal(f.child[n].destroyed, true)
})
test('deadline cannot become success when retained pipes close with exit zero later', async () => {
  const f = fixture({exitCode: 0}); await f.fire(25); f.child.emit('close', 0); await f.flush()
  assert.equal(f.settled, true); assert.equal(f.result.timedOut, true); assert.equal(f.result.exitCode, 0)
  assert.equal(f.result.captureError, undefined); assert.equal(f.timers.size, 0)
})
test('false signal result gets bounded failure without claiming owned child exit', async () => {
  const f = fixture({killResult: false}); await f.fire(25); await f.fire(2000)
  assert.equal(f.settled, true); assert.equal(f.result.timedOut, true)
  assert.equal(f.result.ownedChildExited, false); assert(f.result.captureError); assert.equal(f.kills, 1)
})
test('ordinary signaled timeout still waits for close and preserves complete raw transport', async () => {
  const f = fixture(); await f.fire(25); assert.equal(f.settled, false)
  f.child.signalCode='SIGKILL'; f.child.emit('close', null); await f.flush()
  assert.equal(f.result.timedOut, true); assert.equal(f.result.captureError, undefined)
  assert.equal(f.result.drainIncomplete, undefined); assert.equal(f.kills, 1); assert.equal(f.timers.size, 0)
})
test('ordinary zero and nonzero exits remain unchanged before deadline', async () => {
  for (const code of [0,7]) { const f=fixture(); f.child.exitCode=code; f.child.emit('close',code); await f.flush()
    assert.equal(f.result.exitCode,code); assert.equal(f.result.timedOut,false); assert.equal(f.kills,0); assert.equal(f.timers.size,0) }
})
test('signal exception retains its failure and still settles bounded drain', async () => {
  const f=fixture({killThrows:true}); await f.fire(25); await f.fire(2000)
  assert.equal(f.settled,true); assert.match(f.result.captureError.message,/signal failed/)
  assert.equal(f.result.ownedChildExited,false); assert.equal(f.result.timedOut,true); assert.equal(f.kills,1)
})
test('existing stream-error drain remains non-timeout and preserves original failure', async () => {
  const f=fixture(), error=Error('pipe failed'); f.child.stdout.emit('error',error); await f.fire(2000)
  assert.equal(f.result.captureError,error); assert.equal(f.result.timedOut,false)
  assert.equal(f.result.drainIncomplete,true); assert.equal(f.kills,1); assert.equal(f.timers.size,0)
})
test('post-deadline nonzero exit remains timed out and cancels pending drain', async () => {
  const f=fixture(); await f.fire(25); f.child.exitCode=7; f.child.emit('close',7); await f.flush()
  assert.equal(f.result.exitCode,7); assert.equal(f.result.timedOut,true)
  assert.equal(f.result.captureError,undefined); assert.equal(f.timers.size,0)
})
