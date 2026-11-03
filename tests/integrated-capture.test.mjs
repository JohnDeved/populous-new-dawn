import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import path from 'node:path'
import { captureDiagnosticEnvironment, observeCaptureProtocolChild, captureBegin, captureEnd } from '../scripts/tutorial-browser/capture-protocol-window.mjs'
const source=readFileSync(new URL('../scripts/performance-queue.mjs',import.meta.url),'utf8')
const start=source.indexOf('export async function superviseBrowserCheck('),end=source.indexOf('\nfunction kick(dir)',start)
assert.ok(start>=0&&end>start)
const supervisorBody=source.slice(start,end).replace(/^export /,'')
const entry=readFileSync(new URL('../scripts/tutorial-browser/integrated-capture-protocol.mjs',import.meta.url),'utf8')
const entryStart=entry.indexOf('export async function runIntegratedCaptureProtocol(');assert.ok(entryStart>=0)
const entryBody=entry.slice(entryStart).replace(/^export /,'')
function fixture({code=0,malformed=false,missingEnd=false,cleanupFail=false,interruptPreflight=false}={}) {
 const rows=[],log=[],proc=new EventEmitter();Object.assign(proc,{platform:'linux',cwd:()=>'/source',env:{}})
 let child,qualified=0,interrupted=false
 const spawn=(_command,_args,options)=>{
  log.push(['spawn',options]);child=Object.assign(new EventEmitter(),{pid:101,exitCode:null,signalCode:null,stdout:new PassThrough(),stderr:new PassThrough()})
  rows.push({pid:101,ppid:1,pgid:101,identity:'owned'},{pid:200,ppid:101,pgid:200,identity:'detached'})
  return child
 }
 const childOutcome=()=>new Promise(resolve=>setImmediate(()=>{
  child.stdout.write('DO_NOT_RETAIN_STDOUT');child.stderr.write(captureBegin+'\n')
  child.stderr.write(malformed?'pw:protocol SEND ► broken\n':'pw:protocol SEND ► {"id":1,"method":"Page.captureScreenshot","params":{"data":"DO_NOT_RETAIN_PNG"},"sessionId":"S"}\n')
  if(!missingEnd)child.stderr.write('pw:protocol ◀ RECV {"id":1,"result":{"data":"DO_NOT_RETAIN_RESULT"},"sessionId":"S"}\n'+captureEnd+'\n')
  resolve({code,signal:null})
 }))
 const stopGroup=async group=>{
  log.push(['stop',group.pid]);if(cleanupFail)throw Error('DO_NOT_RETAIN_ERROR')
  for(let i=rows.length-1;i>=0;i--)if(rows[i].pgid===group.pid)rows.splice(i,1)
  if(!rows.length)child.emit('close',code,null)
 }
 const supervisor=new Function('assert','process','argv','packageScriptCommand','processTable','signalOwnedGroup','stopGroup','sleep','portFree','fs','path','spawn','childOutcome','fetch','write','setTimeout','clearTimeout',
  supervisorBody+';return superviseBrowserCheck')(assert,proc,()=>{},()=>assert.fail('external server'),()=>rows.map(x=>({...x})),()=>{},stopGroup,
  ()=>new Promise(resolve=>setImmediate(resolve)),async()=>{if(interruptPreflight&&!interrupted){interrupted=true;proc.emit('SIGTERM')}return true},{openSync:()=>assert.fail('raw log'),closeSync:()=>{}},path,spawn,childOutcome,
  ()=>assert.fail('external readiness'),(_p,r)=>log.push(['cleanupReceipt',r]),fn=>setImmediate(fn),clearImmediate)
 const qualify=()=>{qualified++;return {qualified:true}}
 const run=new Function('isAbsolute','superviseBrowserCheck','captureDiagnosticEnvironment','observeCaptureProtocolChild','qualifyCaptureInputs','process',entryBody+';return runIntegratedCaptureProtocol')(
  path.isAbsolute,supervisor,captureDiagnosticEnvironment,observeCaptureProtocolChild,qualify,proc)
 const options={enabled:true,cwd:'/source',runner:'/source/scripts/tutorial-browser/run.mjs',node:'/node',trustedNodeSha256:'a'.repeat(64),env:{PND_QUEUE_JOB_ID:'job',PND_QUEUE_OUTPUT:'/out',PND_QUEUE_CLEANUP:'/cleanup',POPULOUS_URL:'http://127.0.0.1:5198',PND_QUEUE_PORTS:'5198',DEBUG_FILE:'/raw',DEBUG:'*'}}
 return {run,options,log,rows,proc,get qualified(){return qualified}}
}
test('disabled integrated entry invokes no qualifier or supervisor',async()=>{
 const f=fixture();assert.deepEqual(await f.run({}),{enabled:false,started:false});assert.equal(f.qualified,0);assert.deepEqual(f.log,[])
})
test('actual extracted entry+supervisor and actual observer redact streams with one internally hosted child',async()=>{
 const f=fixture(),r=await f.run(f.options)
 assert.equal(f.qualified,1);assert.equal(r.runnerSucceeded,true);assert.equal(r.usableObservation,true)
 assert.equal(f.log.filter(x=>x[0]==='spawn').length,1);assert.equal(f.log[0][1].env.DEBUG_FILE,undefined)
 assert.deepEqual(f.log[0][1].stdio,['ignore','pipe','pipe']);assert.equal(r.observation.collection.events.length,2)
 assert.doesNotMatch(JSON.stringify(r),/DO_NOT_RETAIN|\/raw/);assert.equal(f.rows.length,0);assert.equal(f.proc.listenerCount('SIGTERM'),0)
})
test('failed Tutorial retains bounded observer metadata but cannot become runner success',async()=>{
 const f=fixture({code:1}),r=await f.run(f.options)
 assert.equal(r.runnerSucceeded,false);assert.equal(r.supervisorFailed,true);assert.equal(r.observation.code,1)
 assert.equal(r.usableObservation,true,'complete non-lossy diagnostic may remain useful on failed checker')
 assert.doesNotMatch(JSON.stringify(r),/DO_NOT_RETAIN/)
})
test('markers alone cannot approve malformed or incomplete capture evidence',async()=>{
 for(const opts of [{malformed:true},{missingEnd:true}]){
  const f=fixture(opts),r=await f.run(f.options);assert.equal(r.runnerSucceeded,true);assert.equal(r.usableObservation,false)
 }
})
test('cleanup failure suppresses success and no raw error payload is returned',async()=>{
 const f=fixture({cleanupFail:true}),r=await f.run(f.options)
 assert.equal(r.runnerSucceeded,false);assert.equal(r.supervisorFailed,true);assert.equal(r.observation,null)
 assert.doesNotMatch(JSON.stringify(r),/DO_NOT_RETAIN/);assert.equal(f.log.some(x=>x[0]==='cleanupReceipt'),false)
})
test('wrong internally hosted URL or inherited preload refuses before qualification/spawn',async()=>{
 for(const env of [{POPULOUS_URL:'http://127.0.0.1:5000'},{NODE_OPTIONS:'--require /untrusted'}]){
 const f=fixture();await assert.rejects(f.run({...f.options,env:{...f.options.env,...env}}));assert.equal(f.qualified,0);assert.deepEqual(f.log,[])
 }
})
test('cancellation at async port boundary cannot launch internally hosted checker',async()=>{
 const f=fixture({interruptPreflight:true}),r=await f.run(f.options)
 assert.equal(r.runnerSucceeded,false);assert.equal(r.supervisorFailed,true);assert.equal(r.observation,null)
 assert.equal(f.log.some(x=>x[0]==='spawn'),false);assert.equal(f.proc.listenerCount('SIGTERM'),0)
})
