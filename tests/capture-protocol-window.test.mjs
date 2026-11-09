import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { captureBegin, captureEnd, captureDiagnosticEnvironment, withCaptureProtocolWindow, observeCaptureProtocolChild } from '../scripts/tutorial-browser/capture-protocol-window.mjs'
const secret='SECRET_PNG_AND_ERROR'
const send=id=>`pw:protocol SEND ► {"id":${id},"method":"Page.captureScreenshot","params":{"data":"${secret}"},"sessionId":"S"}\n`
const reply=id=>`pw:protocol ◀ RECV {"id":${id},"result":{"data":"${secret}"},"sessionId":"S"}\n`
const child=()=>Object.assign(new EventEmitter(),{stdout:new PassThrough(),stderr:new PassThrough()})
test('disabled environment and observer are true no-ops',()=>{
  const env={DEBUG_FILE:'existing',DEBUG:'existing'};assert.equal(captureDiagnosticEnvironment(env),env)
  assert.equal(observeCaptureProtocolChild({}),null)
  const token={};assert.equal(withCaptureProtocolWindow(false,()=>assert.fail('marker'),()=>token),token)
})
test('opt-in removes DEBUG_FILE and formatting overrides without mutating parent environment',()=>{
  const env={DEBUG_FILE:'/secret',debug_file:'/other',DEBUG:'*',DEBUG_HIDE_DATE:'1',MAX_LOG_LENGTH:'999999',PATH:'/bin'}
  const out=captureDiagnosticEnvironment(env,true)
  assert.deepEqual(out,{PATH:'/bin',DEBUG:'pw:protocol',DEBUG_COLORS:'0',MAX_LOG_LENGTH:'1024',PND_CAPTURE_PROTOCOL_WINDOW:'1'})
  assert.equal(env.DEBUG_FILE,'/secret')
})
test('previous whole-tutorial traffic cannot exhaust episode event capacity and payloads never retained',async()=>{
  const c=child(),pending=observeCaptureProtocolChild(c,{enabled:true})
  for(let id=1;id<200;id++)c.stderr.write(send(id)+reply(id))
  c.stdout.write(secret);c.stderr.write(captureBegin+'\n')
  const text=send(200)+reply(200)
  for(const byte of Buffer.from(text))c.stderr.write(Buffer.from([byte]))
  c.stderr.write(captureEnd+'\n'+send(201));c.emit('close',0,null)
  const r=await pending;assert.equal(r.collection.events.length,2);assert.equal(r.collection.dropped,0);assert.equal(r.windowComplete,true)
  assert.equal(r.protocolOutsideWindow,399);assert.doesNotMatch(JSON.stringify(r),/SECRET|params|PNG_AND_ERROR/)
  assert.equal(c.stdout.listenerCount('data'),0);assert.equal(c.stderr.listenerCount('data'),0);assert.equal(c.listenerCount('close'),0);assert.equal(c.listenerCount('error'),0)
})
test('missing end and process failure remain incomplete/censored without raw error leaks',async()=>{
  const c=child(),p=observeCaptureProtocolChild(c,{enabled:true});c.stderr.write(captureBegin+'\n'+send(1));c.emit('error',Error(secret));c.emit('close',1,'SIGTERM')
  const r=await p;assert.equal(r.windowComplete,false);assert.equal(r.spawnError,true);assert.equal(r.code,1);assert.equal(r.collection.unfinished,1);assert.doesNotMatch(JSON.stringify(r),/SECRET/)
})
test('duplicate window markers invalidate observation rather than combine episodes',async()=>{
  const c=child(),p=observeCaptureProtocolChild(c,{enabled:true});c.stderr.write(captureBegin+'\n'+send(1)+captureBegin+'\n'+reply(1)+captureEnd+'\n');c.emit('close',0,null)
  const r=await p;assert.equal(r.windowComplete,false);assert.equal(r.markerErrors,2);assert.equal(r.collection.unfinished,1)
})
test('already consumed or missing pipes rejected before attaching any listener',()=>{
  const c=child();c.stderr.on('data',()=>{});assert.throws(()=>observeCaptureProtocolChild(c,{enabled:true}),/exclusive/);assert.equal(c.stdout.listenerCount('data'),0)
  assert.throws(()=>observeCaptureProtocolChild({},{enabled:true}),/exclusive/)
})
test('overlong input and unfinished UTF8 do not leak or grow retained state',async()=>{
  const c=child(),p=observeCaptureProtocolChild(c,{enabled:true});c.stderr.write('x'.repeat(2047)+'😀\n');c.stderr.write(Buffer.from([0xf0,0x9f]));c.emit('close',0,null)
  const r=await p;assert.equal(r.overlongLines,1);assert.equal(r.windowComplete,false);assert.ok(JSON.stringify(r).length<4096)
})
test('window markers preserve action result and synchronous/asynchronous falsey failures',async()=>{
  const marks=[];const w=x=>marks.push(x)
  assert.equal(await withCaptureProtocolWindow(true,w,()=>42),42)
  for(const async of [false,true]){
    let rejected=false;try{await withCaptureProtocolWindow(true,w,()=>{if(async)return Promise.reject(null);throw null})}catch(e){rejected=true;assert.equal(e,null)}assert.equal(rejected,true)
  }
  assert.deepEqual(marks,Array.from({length:3},()=>[captureBegin+'\n',captureEnd+'\n']).flat())
})
test('failed diagnostic marker sink does not replace gameplay outcome',async()=>{
  const bad=()=>{throw Error(secret)};let ran=0
  assert.equal(await withCaptureProtocolWindow(true,bad,()=>{ran++;return 42}),42);assert.equal(ran,1)
  let rejected=false;try{await withCaptureProtocolWindow(true,bad,()=>Promise.reject(null))}catch(e){rejected=true;assert.equal(e,null)}assert.equal(rejected,true)
})
