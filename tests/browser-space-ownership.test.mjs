import assert from 'node:assert/strict'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import { beginSpaceOwnership, endSpaceOwnership, endSpaceOwnershipSnapshot, popupRejectedSpace, pressObservedSpace } from '../scripts/browser-space-ownership.mjs'

test('retry admission requires one trusted nonrepeated popup-owned unchanged dispatch', () => {
  const record={trusted:true,repeat:false,prevented:true,owners:['7'],sameWorld:true,
    before:{paused:false,inputMask:64,flybyFlags:21},after:{paused:false,inputMask:64,flybyFlags:21}}
  assert.equal(popupRejectedSpace([record]),true)
  for(const corrupt of [r=>{r.trusted=false},r=>{r.repeat=true},r=>{r.prevented=false},
    r=>{r.owners=[]},r=>{r.sameWorld=false},r=>{r.before=null},r=>{r.after.paused=true},
    r=>{r.after.inputMask=0},r=>{r.after.flybyFlags|=64}]) {
    const r=structuredClone(record);corrupt(r);assert.equal(!!popupRejectedSpace([r]),false)
  }
  assert.equal(popupRejectedSpace([]),false)
  assert.equal(popupRejectedSpace([record,record]),false)
})

test('Space witness timeout keeps the one original budget and attempts cleanup without another key', async t => {
  t.mock.timers.enable({apis:['setTimeout']})
  let now=0, calls=0, cleanups=0, entered
  t.mock.method(performance,'now',()=>now)
  const starting=new Promise(resolve=>{entered=resolve})
  const page={evaluate:async fn=>{if(fn.name==='endSpaceOwnership'){cleanups++;return []}},
    keyboard:{press:async()=>{calls++;entered();return new Promise(()=>{})}}}
  const rejected=assert.rejects(pressObservedSpace(page,{timeout:500}),/timed out/)
  await starting;now=500;t.mock.timers.tick(500);await rejected
  assert.equal(calls,1);assert.equal(cleanups,1)
})

test('invalid witness budget cannot install a listener or send input', async () => {
  for(const timeout of [0,-1,NaN,Infinity])
    await assert.rejects(pressObservedSpace({evaluate:()=>assert.fail('no observer'),keyboard:{press:()=>assert.fail('no input')}},{timeout}),RangeError)
})

// A modeled trusted event cannot replace browser coverage. In particular, this
// fixture deliberately exposes the capture callback before the later native
// handler so a premature microtask snapshot cannot certify popup rejection.
function ownershipFixture(t) {
  const listeners = new Set(), world = { paused: false, inputMask: 64, flyby: { flags: 21 } },
    window = { testStore: { getWorld: () => world },
      addEventListener(_type, listener) { listeners.add(listener) },
      removeEventListener(_type, listener) { listeners.delete(listener) } },
    context = { window, document: { querySelectorAll: () => [{ getAttribute: () => '7' }] },
      setTimeout, clearTimeout, queueMicrotask },
    evaluate = (fn, arg) => runInNewContext(`(${fn.toString()})(arg)`, { ...context, arg }),
    id = '__owned_test'
  evaluate(beginSpaceOwnership, { id, timeout: 500 })
  t.after(() => evaluate(endSpaceOwnership, id))
  return { window, world, listeners, evaluate, id }
}

test('ownership final effect is read after keyboard dispatch, not an earlier capture microtask', async t => {
  const f = ownershipFixture(t), event = { code: 'Space', isTrusted: true, repeat: false, defaultPrevented: false }
  for (const listener of f.listeners) listener(event)
  await Promise.resolve() // Native listeners can run after this checkpoint.
  event.defaultPrevented = true
  const records = f.evaluate(endSpaceOwnership, f.id)
  assert.equal(popupRejectedSpace(records), true)
  assert.equal(f.listeners.size, 0)
  assert.equal(Object.hasOwn(f.window, f.id), false)
})

test('ownership expiry removes both its passive listener and telemetry closure', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const f = ownershipFixture(t)
  assert.equal(f.listeners.size, 1)
  t.mock.timers.tick(500)
  assert.equal(f.listeners.size, 0)
  assert.equal(Object.hasOwn(f.window, f.id), false)
  assert.equal(f.evaluate(endSpaceOwnership, f.id).length, 0)
})


test('atomic finalizer reads native effect after dispatch and releases the same private observer', t => {
  const f = ownershipFixture(t), event = { code: 'Space', isTrusted: true, repeat: false, defaultPrevented: false }
  for (const listener of f.listeners) listener(event)
  event.defaultPrevented = true
  f.world.inputMask = 0; f.world.flyby.flags = 16
  const result = f.evaluate(endSpaceOwnershipSnapshot, f.id)
  assert.equal(result.observationId, f.id); assert.equal(result.witnessPresent, true)
  assert.equal(result.state.inputMask, 0); assert.equal(result.state.flybyFlags, 16)
  assert.equal(result.records[0].after.inputMask, 0)
  assert.equal(popupRejectedSpace(result.records), false, 'An accepted native transition cannot retry')
  assert.equal(f.listeners.size, 0); assert.equal(Object.hasOwn(f.window, f.id), false)
  const stale = f.evaluate(endSpaceOwnershipSnapshot, f.id)
  assert.equal(stale.witnessPresent, false, 'A missing/expired observer cannot certify fresh delivery')
})
