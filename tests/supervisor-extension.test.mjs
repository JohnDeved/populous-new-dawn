import { createHash } from 'node:crypto'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { EventEmitter } from 'node:events'
import path from 'node:path'
const file='../scripts/performance-queue.mjs'
const source=readFileSync(new URL(file,import.meta.url),'utf8')
const start=source.indexOf('export async function superviseBrowserCheck('),end=source.indexOf('\nfunction kick(dir)',start)
assert.ok(start>=0&&end>start)
const body=source.slice(start,end).replace(/^export /,'')
function fixture({cleanupFail=false,observerFail=false,observerPending=false,occupied=false,exitCode=0,interruptPreflight=false}={}){
 const log=[],rows=[],proc=new EventEmitter();Object.assign(proc,{platform:'linux',cwd:()=>'/owned',env:{}})
 let pid=100,release,interrupted=false
 const observed=new Promise(r=>release=r)
 const spawn=(command,args,options)=>{
  const child={pid:++pid,exitCode:null,signalCode:null,kind:command==='server'?'server':'checker'}
  log.push(['spawn',child.kind,options]);rows.push({pid:child.pid,ppid:1,pgid:child.pid,identity:'i'+child.pid})
  if(child.kind==='checker')rows.push({pid:200,ppid:child.pid,pgid:200,identity:'detached'})
  return child
 }
 const childOutcome=child=>child.kind==='server'?new Promise(()=>{}):Promise.resolve({code:exitCode,signal:null})
 const processTable=()=>rows.map(x=>({...x}))
 const stopGroup=async group=>{
  log.push(['stop',group.pid]);if(cleanupFail)throw Error('supplied cleanup failure')
  for(let i=rows.length-1;i>=0;i--)if(rows[i].pgid===group.pid)rows.splice(i,1)
  if(!rows.length&&!observerPending)release({redacted:true})
 }
 const fn=new Function('assert','process','argv','packageScriptCommand','processTable','signalOwnedGroup','stopGroup','sleep','portFree','fs','path','spawn','childOutcome','fetch','write','setTimeout','clearTimeout',
  body+';return superviseBrowserCheck')(assert,proc,()=>{},()=>['server'],processTable,()=>{},stopGroup,
  async ms=>{log.push(['sleep',ms]);if(ms===1000)return;return new Promise(resolve=>setImmediate(resolve))},
  async()=>{if(interruptPreflight&&!interrupted){interrupted=true;proc.emit('SIGTERM')}return !occupied},{openSync:()=>{log.push(['server-log']);return 9},closeSync:()=>{}},path,spawn,childOutcome,
  async()=>({ok:true}),(_p,r)=>log.push(['receipt',r]),
  (fn,ms)=>{log.push(['settlementTimer',ms]);return setImmediate(fn)},id=>{log.push(['clearTimer']);clearImmediate(id)})
 const env={PND_QUEUE_JOB_ID:'job',PND_QUEUE_OUTPUT:'/owned/out',PND_QUEUE_CLEANUP:'/owned/cleanup',POPULOUS_URL:'http://127.0.0.1:5198',PND_QUEUE_PORTS:'5198'}
 const observer=child=>{log.push(['observe',child.pid]);if(observerFail)throw Error('supplied attach failure');return observed}
 return {fn,log,rows,proc,options:{checkerCommand:['checker'],cwd:'/owned',env},observer}
}
test('default managed mode retains external server, inherited stdio and cleanup receipt',async()=>{
 const f=fixture();assert.equal(await f.fn(f.options),undefined)
 assert.deepEqual(f.log.filter(x=>x[0]==='spawn').map(x=>[x[1],x[2].stdio]),[['server',['ignore',9,9]],['checker','inherit']])
 assert.equal(f.log.filter(x=>x[0]==='receipt').length,1);assert.equal(f.proc.listenerCount('SIGTERM'),0);assert.equal(f.proc.listenerCount('SIGINT'),0)
})
test('checker-owned server starts one child with exclusive pipes and no raw server log',async()=>{
 const f=fixture(),r=await f.fn({...f.options,serverMode:'checker',observeChecker:f.observer})
 assert.deepEqual(f.log.filter(x=>x[0]==='spawn').map(x=>[x[1],x[2].stdio]),[['checker',['ignore','pipe','pipe']]])
 assert.equal(f.log.some(x=>x[0]==='server-log'),false);assert.deepEqual(r,{observation:{redacted:true},resourcesReleased:true})
 assert.ok(f.log.findIndex(x=>x[0]==='observe')<f.log.findIndex(x=>x[0]==='stop'))
 assert.ok(f.log.some(x=>x[0]==='stop'&&x[1]===200),'supplied detached group tracked')
})
test('SIGTERM during awaited port preflight prevents any checker launch',async()=>{
 const f=fixture({interruptPreflight:true});await assert.rejects(f.fn({...f.options,serverMode:'checker',observeChecker:f.observer}),/termination requested/)
 assert.equal(f.log.some(x=>x[0]==='spawn'),false);assert.equal(f.proc.listenerCount('SIGTERM'),0)
})
test('conflicting server/stdio/observer options refuse before spawn',async()=>{
 for(const patch of [{serverCommand:['server']},{checkerStdio:'ignore'},{observeChecker:undefined}]){
 const f=fixture();await assert.rejects(f.fn({...f.options,serverMode:'checker',observeChecker:f.observer,...patch}));assert.equal(f.log.some(x=>x[0]==='spawn'),false)
 }
})
test('observer attachment failure still cleans recorded checker and detached groups',async()=>{
 const f=fixture({observerFail:true});await assert.rejects(f.fn({...f.options,serverMode:'checker',observeChecker:f.observer}),error=>{
 assert.match(error.message,/observer could not attach/);assert.doesNotMatch(error.stack+String(error.cause),/supplied attach failure/);return true
 })
 assert.equal(f.rows.length,0);assert.equal(f.proc.listenerCount('SIGTERM'),0)
})
test('checker failure and cleanup failure never become a passing observation',async()=>{
 for(const patch of [{exitCode:1},{cleanupFail:true}]){
 const f=fixture(patch);await assert.rejects(f.fn({...f.options,serverMode:'checker',observeChecker:f.observer}))
 if(patch.cleanupFail)assert.equal(f.log.some(x=>x[0]==='receipt'),false)
 }
})
test('pending observer is bounded only after cleanup, never prevents descendant shutdown',async()=>{
 const f=fixture({observerPending:true});await assert.rejects(f.fn({...f.options,serverMode:'checker',observeChecker:f.observer}),/observation/)
 assert.equal(f.rows.length,0);assert.ok(f.log.findIndex(x=>x[0]==='stop')<f.log.findIndex(x=>x[0]==='settlementTimer'&&x[1]===1000))
 assert.equal(f.log.filter(x=>x[0]==='clearTimer').length,1)
})
test('occupied declared port refuses internally hosted child without overriding it',async()=>{
 const f=fixture({occupied:true});await assert.rejects(f.fn({...f.options,serverMode:'checker',observeChecker:f.observer}));assert.equal(f.log.some(x=>x[0]==='spawn'),false)
})
test('all preexisting process identity/group signalling helpers remain byte-identical',()=>{
 const hashes=JSON.parse(readFileSync(new URL('./fixtures/capture/supervisor-baseline-hashes.json',import.meta.url),'utf8'))
 const pieces=[source.slice(0,start),source.slice(source.indexOf('  const ownedProcesses = new Map()'),source.indexOf('  let failure = null',source.indexOf('  const ownedProcesses = new Map()'))),source.slice(source.indexOf('\nfunction kick(dir)'))]
 assert.deepEqual(pieces.map(s=>createHash('sha256').update(s).digest('hex')),hashes)
})
