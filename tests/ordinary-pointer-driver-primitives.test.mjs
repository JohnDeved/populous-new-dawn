import test from 'node:test'
import assert from 'node:assert/strict'
import { assertOrdinaryPointerCallbackAck as ack, ordinaryPointerWallWatchdog as watch } from '../scripts/browser-performance/ordinary-pointer-driver-primitives.mjs'
const expected = {epoch:'a'.repeat(64),sequence:1,anchorSerial:8,anchorTimestampMs:100}
const actual = {...expected,serial:9}
const scheduler = () => {
  let fire, ms, cleared=0, time=0
  return {now(){return time},advance(value){time=value},setTimeout(fn,delay){fire=fn;ms=delay;return 7},clearTimeout(id){assert.equal(id,7);cleared++},
    expire(){time=90000;fire()},early(){fire()},get ms(){return ms},get cleared(){return cleared}}
}
test('acknowledgment requires exact epoch, sequence, anchor and anchor+1',()=>{
  assert.deepEqual(ack(expected,actual),{attributed:true,comparisonEligible:false})
  for(const delta of [{epoch:'b'.repeat(64)},{sequence:2},{anchorSerial:9},{anchorTimestampMs:101},{serial:10},{serial:8}])
    assert.throws(()=>ack(expected,{...actual,...delta}))
})
test('malformed expected identity does not admit a self-consistent malformed reply',()=>{
  for(const delta of [{epoch:''},{sequence:0},{sequence:55},{anchorSerial:-1},{anchorSerial:1199},{anchorTimestampMs:NaN}])
    assert.throws(()=>ack({...expected,...delta},{...actual,...delta}))
})
test('normal completion clears timer but never claims cleanup or comparison eligibility',async()=>{
  const s=scheduler();const r=await watch(()=>42,s)
  assert.equal(r.status,'completed');assert.equal(r.value,42);assert.equal(s.ms,90000)
  assert.equal(s.cleared,1);assert.equal(r.cleanupConfirmed,false);assert.equal(r.comparisonEligible,false)
  s.expire();assert.equal(r.status,'completed')
})
test('all falsey sync and async primary failures retain identity',async()=>{
  for(const value of [undefined,null,false,0,''])for(const async of [false,true]){
    const r=await watch(()=>{if(async)return Promise.reject(value);throw value},scheduler())
    assert.equal(r.status,'failed');assert.equal(r.error,value)
  }
})
test('out-of-page timeout settles while supplied page operation never completes',async()=>{
  const s=scheduler();let signal
  const p=watch(x=>{signal=x;return new Promise(()=>{})},s)
  await Promise.resolve();s.expire();const r=await p
  assert.equal(r.status,'timed-out');assert.equal(signal.aborted,true);assert.equal(signal.reason,r.error)
  assert.equal(r.cancellationRequested,true);assert.equal(r.cleanupConfirmed,false)
})
test('late rejection cannot overwrite timeout or become an unhandled transport rejection',async()=>{
  const s=scheduler();let reject
  const p=watch(()=>new Promise((_,r)=>reject=r),s)
  await Promise.resolve();s.expire();const result=await p
  reject(null);await Promise.resolve();await Promise.resolve()
  assert.equal(result.status,'timed-out')
})
test('timeout already claimed before operation starts does not dispatch it',async()=>{
  const s=scheduler();let calls=0;const p=watch(()=>calls++,s);s.expire()
  assert.equal((await p).status,'timed-out');assert.equal(calls,0)
})
test('timer cleanup failure cannot mask falsey primary failure',async()=>{
  const s=scheduler();s.clearTimeout=()=>{throw 'cleanup'}
  const r=await watch(()=>{throw null},s)
  assert.equal(r.status,'failed');assert.equal(r.error,null)
  assert.equal(r.timerCleanupFailed,true);assert.equal(r.timerCleanupError,'cleanup')
})
test('timer installation failure prevents dispatch',async()=>{
  let called=false
  await assert.rejects(watch(()=>{called=true},{now(){return 0},setTimeout(){throw new Error('timer')},clearTimeout(){}}),/timer/)
  assert.equal(called,false)
})

test('expired dispatch and delayed timer cannot report completion',async()=>{
 const a=scheduler();let called=false
 const p=watch(()=>{called=true},a);a.advance(90001)
 assert.equal((await p).status,'timed-out');assert.equal(called,false)
 for(const fail of [false,true]){
  const s=scheduler();const r=await watch(()=>{s.advance(90001);if(fail)throw null;return 42},s)
  assert.equal(r.status,'timed-out');assert.equal(r.lateOutcome.status,fail?'failed':'completed')
  if(fail)assert.equal(r.lateOutcome.error,null);else assert.equal(r.lateOutcome.value,42)
 }
})
test('early timer re-arms remaining budget without renewal',async()=>{
 const s=scheduler();const p=watch(()=>new Promise(()=>{}),s)
 await Promise.resolve();s.advance(10000);s.early();assert.equal(s.ms,80000)
 s.expire();assert.equal((await p).status,'timed-out')
})

test('invalid, backward and throwing clocks fail closed, retaining falsey primary',async()=>{
 for(const value of [NaN,Infinity,-1]){
  const s=scheduler();const r=await watch(()=>{s.advance(value);throw null},s)
  assert.equal(r.status,'failed');assert.equal(r.error,null);assert.equal(r.clockFailed,true)
 }
 const s=scheduler();const baseNow=s.now;let n=0
 s.now=()=>{if(++n===1)return 0;if(n===2)return 10;return 5}
 const r=await watch(()=>false,s);assert.equal(r.status,'failed');assert.equal(r.clockFailed,true)
 const z=scheduler();let reads=0;z.now=()=>{if(++reads>1)throw false;return 0}
 const q=await watch(()=>assert.fail('must not dispatch'),z)
 assert.equal(q.status,'failed');assert.equal(q.error,false)
})
