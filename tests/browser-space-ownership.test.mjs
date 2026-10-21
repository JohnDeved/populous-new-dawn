import assert from 'node:assert/strict'
import test from 'node:test'
import { popupRejectedSpace, pressObservedSpace } from '../scripts/browser-space-ownership.mjs'

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
