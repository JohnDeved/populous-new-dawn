import test from 'node:test'
import assert from 'node:assert/strict'
import { createOrdinaryPointerCaptureBuffer as create } from '../scripts/browser-performance/ordinary-pointer-capture-buffer.mjs'
const offsets = [[3,0],[3,3],[0,3],[-3,0],[0,-3],[0,0]]
const send = (b, n=0, serial=0, raf=100, at=106) => {
 const [x,y]=offsets[n%6]; return b.input(1,900+x,400+y,0,true,0,at,serial,raf)
}
test('fixed 54 event path captures exact first callback with earlier RAF stamp',()=>{
 const b=create(0,100,105)
 assert.equal(b.arm(),true); assert.equal(send(b),true)
 assert.equal(b.frame(1,104,110),true)
 assert.equal(b.export().completed,1)
 const c=create(0,100,105);let raf=100,time=105
 for(let n=0;n<54;n++){
  assert.equal(c.arm(),true);assert.equal(send(c,n,n,raf,time+1),true)
  raf++;time+=10;assert.equal(c.frame(n+1,raf,time),true)
 }
 assert.equal(c.finish(),true);const r=c.export()
 assert.equal(r.status,'captured-unqualified');assert.equal(r.comparisonEligible,false)
 assert.equal(r.inputCount,54);assert.equal(r.frameCount,54)
 for(let n=0;n<54;n++)assert.equal(r.frames[n*4+3],n+1)
})
test('idle and armed-before-event callbacks are retained without selected attribution',()=>{
 const b=create(0,100,105);assert.equal(b.frame(1,101,106),true);b.arm()
 assert.equal(b.frame(2,102,107),true);assert.equal(send(b,0,2,102,108),true)
 assert.equal(b.frame(3,103,109),true)
 assert.deepEqual([...b.export().frames],[1,101,106,0,2,102,107,0,3,103,109,1])
})
test('unexpected input while disarmed is retained and terminal',()=>{
 const b=create(0,100,105);assert.equal(send(b),false)
 const r=b.export();assert.equal(r.terminal,'unexpected-input');assert.equal(r.inputCount,1)
 assert.equal(b.arm(),false);assert.equal(b.frame(1,101,110),false)
 assert.deepEqual(b.export(),r)
})
test('duplicate pending input, other kinds, untrusted and coalesced extras fail closed',()=>{
 const b=create(0,100,105);b.arm();send(b);assert.equal(send(b),false);assert.equal(b.export().inputCount,2)
 for(const args of [[2,0,true,0],[1,1,true,0],[1,0,false,0],[1,0,true,1],[1,0,true,-1]]){
  const c=create(0,100,105);c.arm();const [kind,buttons,trusted,extra]=args
  assert.equal(c.input(kind,903,400,buttons,trusted,extra,106,0,100),false)
  assert.equal(c.export().terminal,'unadmitted-input')
 }
})
test('anchor and trajectory mismatch fail without selecting a later callback',()=>{
 for(const [x,anchor,stamp] of [[904,0,100],[903,1,100],[903,0,101]]){
  const b=create(0,100,105);b.arm();assert.equal(b.input(1,x,400,0,true,0,106,anchor,stamp),false)
  assert.equal(b.frame(1,101,110),false);assert.equal(b.export().completed,0)
 }
 const b=create(0,100,105);b.arm();send(b);assert.equal(b.frame(2,101,110),false)
 assert.equal(b.export().terminal,'callback-serial');assert.equal(b.export().frameCount,1)
})
test('missing, duplicate, invalid and ring-bound callbacks retain terminal record',()=>{
 for(const args of [[0,101,110],[1,100,110],[1,101,104],[1,101,NaN],[1,101,90106]]){
  const b=create(0,100,105);assert.equal(b.frame(...args),false);assert.equal(b.export().frameCount,1)
 }
 const b=create(1145,100,105)
 for(let n=1146;n<1200;n++)assert.equal(b.frame(n,n,2000+n),true)
 assert.equal(b.frame(1200,1200,4000),false);assert.equal(b.export().terminal,'callback-serial')
 assert.throws(()=>create(1146,100,105))
})
test('input timestamps cannot precede observed completion or exceed fixed elapsed bound',()=>{
 for(const at of [104,NaN,Infinity,90106]){
  const b=create(0,100,105);b.arm();assert.equal(send(b,0,0,100,at),false)
  assert.equal(b.export().terminal,'input-time')
 }
 const b=create(0,100,105);b.arm();send(b,0,0,100,120)
 assert.equal(b.frame(1,101,119),false);assert.equal(b.export().terminal,'first-callback')
})
test('export is detached and terminal abort preserves pending evidence',()=>{
 const b=create(0,100,105);b.arm();send(b);b.abort();const r=b.export()
 assert.equal(r.pending,true);assert.equal(r.armed,true);assert.equal(r.terminal,'adapter-abort')
 r.inputs[0]=999;assert.equal(b.export().inputs[0],1)
 assert.equal(b.finish(),false)
 const c=create(0,100,105);assert.equal(c.finish(),false);assert.equal(c.export().terminal,'incomplete')
})
test('malformed scalar retention never converts string/null to valid numeric evidence',()=>{
 const b=create(0,100,105);b.arm();b.input('1',null,400,0,true,0,106,0,100)
 assert.ok(Number.isNaN(b.export().inputs[0]));assert.ok(Number.isNaN(b.export().inputs[1]))
 for(const args of [[-1,100,105],[0,NaN,105],[0,100,99]])assert.throws(()=>create(...args))
})
test('double arm is terminal without fabricating input records',()=>{
 const b=create(0,100,105);b.arm();assert.equal(b.arm(),false)
 assert.equal(b.export().terminal,'invalid-arm');assert.equal(b.export().inputCount,0)
})
test('55th input after full sequence is retained as disarmed contamination',()=>{
 const b=create(0,100,105);let raf=100,time=105
 for(let n=0;n<54;n++){b.arm();assert.equal(send(b,n,n,raf,time+1),true);raf++;time+=10;assert.equal(b.frame(n+1,raf,time),true)}
 assert.equal(send(b,54,54,raf,time+1),false)
 assert.equal(b.export().inputCount,55);assert.equal(b.export().inputs.length,550)
 assert.equal(b.export().terminal,'unexpected-input');assert.equal(b.finish(),false)
})
test('1200th callback is retained as offending row without buffer overflow',()=>{
 const b=create(0,100,105)
 for(let n=1;n<1200;n++)assert.equal(b.frame(n,100+n,105+n),true)
 assert.equal(b.frame(1200,1300,1305),false)
 const r=b.export();assert.equal(r.frameCount,1200);assert.equal(r.frames.length,4800)
 assert.equal(r.frames[4796],1200);assert.equal(r.terminal,'callback-serial')
 r.frames[0]=999;assert.equal(b.export().frames[0],1)
})
test('finished capture is immutable to later method calls',()=>{
 const b=create(0,100,105);let raf=100,time=105
 for(let n=0;n<54;n++){b.arm();send(b,n,n,raf,time+1);raf++;time+=10;b.frame(n+1,raf,time)}
 assert.equal(b.finish(),true);const r=b.export()
 assert.equal(b.arm(),false);assert.equal(send(b),false);assert.equal(b.frame(55,155,655),false)
 b.abort();assert.equal(b.finish(),false);assert.deepEqual(b.export(),r)
})
