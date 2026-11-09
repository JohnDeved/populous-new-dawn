import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const source=readFileSync(new URL('../scripts/tutorial-browser/query-art-evidence.mjs',import.meta.url),'utf8')
const dependency="import { bindGame, showAllMissions } from '../browser-game.mjs'"
assert.equal(source.split(dependency).length,2)
// No app, model, React, Playwright or browser module imports in this focused suite.
const module=await import('data:text/javascript;base64,'+Buffer.from(source.replace(dependency,"const bindGame=()=>{throw Error('public setup leaf forbidden')},showAllMissions=bindGame")).toString('base64'))
const {acceptQueryArt,queryArtNames,queryArtPolicy,default:run}=module
function row(state='normal',scale=1) {
  const failed=state.startsWith('failed'),focused=state==='focus'||state==='failed-focus',selected=state==='held'?2:state==='hover'||state==='focus'?1:0
  return {count:1,label:'Menu',title:'Help and game menu',paused:true,scale,visible:true,unoccluded:true,width:13,height:12,rect:{x:63,y:1,width:13*scale,height:12*scale},viewport:{x:0,y:0,width:1440,height:1000},clips:[],art:failed?'failed':'source-bound',focusVisible:focused,active:focused,hover:state==='hover'||state==='held',held:state==='held',fallback:failed?'?':null,outlineStyle:'auto',outlineWidth:1,
    frames:failed?[]:[1005,996,1014].map((base,i)=>({visible:i===selected,tiles:[0,4,1,6,8,7,2,5,3].map(n=>({url:`/original/query-control/hfx-${base+n}.png`,repeat:'repeat',complete:true}))})),
    glyph:failed?null:{url:'/original/query-control/hfx-105.png',complete:true,width:4,height:6,left:4,top:3}}
}
for(const state of ['normal','hover','held','focus','failed','failed-focus'])test(`actual acceptance admits ${state}, not independent pixel equivalence`,()=>{assert.deepEqual(acceptQueryArt(row(state),state,1),{status:'passed',visualReviewPending:true})})
for(const [name,mutate,state='normal'] of [
  ['duplicate Menu',r=>r.count=2],['wrong name',r=>r.label='Help'],['changed callback title',r=>r.title='Encyclopaedia'],
  ['unpaused',r=>r.paused=false],['wrong scale',r=>r.scale=1.5],['invisible',r=>r.visible=false],['occlusion',r=>r.unoccluded=false],
  ['clipping',r=>r.clips.push({x:0,y:0,width:1,height:1})],['wrong button geometry',r=>r.width=12],
  ['wrong native frame',r=>r.frames[0].tiles[0].url='/original/query-control/hfx-996.png'],
  ['unloaded hidden frame',r=>r.frames[2].tiles[0].complete=false],['stretched frame',r=>r.frames[0].tiles[0].repeat='no-repeat'],
  ['wrong state visibility',r=>r.frames[1].visible=true],['missing glyph',r=>r.glyph=null],['wrong glyph offset',r=>r.glyph.left=5],
  ['false keyboard focus',r=>r.active=false,'focus'],['missing focus-visible',r=>r.focusVisible=false,'focus'],
  ['fallback claimed native',r=>r.art='source-bound','failed'],['missing fallback',r=>r.fallback='','failed'],['hidden fallback outline',r=>r.outlineStyle='none','failed-focus'],
  ['held not physically active',r=>r.held=false,'held'],['pointer still hover',r=>r.hover=true],
])test(`failure-first refusal: ${name}`,()=>{const r=row(state);mutate(r);assert.throws(()=>acceptQueryArt(r,state,1))})
test('supported scale1.5 and2 are real observations, not viewport inference',()=>{for(const scale of [1.5,2])acceptQueryArt(row('normal',scale),'normal',scale)})
function harness(options={}) {
  const output=mkdtempSync(join(tmpdir(),'query-evidence-')),receipt={},calls=[]
  const browser={async close(){calls.push('browser')}}
  return {output,receipt,calls,options:{browser,output,url:'http://localhost',root:output,source:{commit:'a'.repeat(40)},expectedRevision:'a'.repeat(40),receipt,inputs:()=>({}),...options},dispose(){rmSync(output,{recursive:true,force:true})}}
}
const complete=async({receipt,ownContext,releaseContext})=>{
  const c={async close(){}};ownContext(c);await releaseContext(c)
  receipt.captures=queryArtNames.map(name=>({name}));receipt.delivery=Array(28).fill({});receipt.interactions=Array(4).fill({});receipt.tabVisits=Array(2).fill([])
}
test('actual owner closes supplied context/browser and serializes bounded result',async()=>{const h=harness({perform:complete});try{await run(h.options);assert.equal(h.receipt.status,'passed');assert.equal(h.receipt.cleanupConfirmed,true);assert.equal(h.receipt.operationSettled,true);assert.deepEqual(h.calls,['browser']);assert.ok(existsSync(join(h.output,'query-art-evidence.json')))}finally{h.dispose()}})
for(const options of [{expectedRevision:'invalid'},{source:{commit:'b'.repeat(40)}},{inputs:()=>{throw Error('source pin mismatch')}}])test('preflight rejection closes transferred browser before any case',async()=>{let entered=false;const h=harness({...options,perform:async()=>{entered=true}});try{await assert.rejects(run(h.options));assert.equal(entered,false);assert.deepEqual(h.calls,['browser']);assert.equal(h.receipt.status,'failed')}finally{h.dispose()}})
test('falsey primary and cleanup failures retained without duplicate close',async()=>{const h=harness({perform:async()=>{throw null},browser:{async close(){throw false}}});try{let caught=false;try{await run(h.options)}catch(e){caught=true;assert.equal(e,null)}assert.equal(caught,true);assert.equal(h.receipt.failure,'null');assert.equal(h.receipt.cleanupConfirmed,false)}finally{h.dispose()}})
test('bounded route rejects malformed counts, extra contexts and output caps',async()=>{for(const perform of [async({receipt})=>{receipt.captures=[]},async({ownContext})=>{for(let i=0;i<3;i++)ownContext({async close(){}})},async({write})=>write(queryArtNames[0],Buffer.alloc(queryArtPolicy.screenshotBytes+1)),async({write})=>write('unexpected.png',Buffer.alloc(1))]){const h=harness({perform});try{await assert.rejects(run(h.options));assert.equal(h.receipt.status,'failed')}finally{h.dispose()}}})
test('operation, cleanup and receipt writing all remain within original shared deadline',async()=>{
  for(const phase of ['operation','cleanup','receipt']){let now=0;const h=harness({now:()=>now,perform:phase==='operation'?async({check})=>{now=178000;check()}:complete,...(phase==='cleanup'?{browser:{async close(){now=180000}}}:{}),...(phase==='receipt'?{writeReceipt:()=>{now=180000}}:{})});try{await assert.rejects(run(h.options));assert.equal(h.receipt.status,'failed')}finally{h.dispose()}}
})
test('unprintable primary preserves cleanup ownership',async()=>{const primary={toString(){throw false}},closed=[];const h=harness({perform:async({ownContext})=>{ownContext({async close(){closed.push('context')}});throw primary},browser:{async close(){closed.push('browser')}}});try{let caught=false;try{await run(h.options)}catch(e){caught=true;assert.equal(e,primary)}assert.equal(caught,true);assert.deepEqual(closed,['context','browser']);assert.equal(h.receipt.failure,'[unprintable error]')}finally{h.dispose()}})
test('public Tab traversal uses actual keyboard events and retains visits without force-focus',async()=>{
  const visits=[{label:'Other',query:false,visible:true},{label:'Menu',query:true,visible:true}],pending=structuredClone(visits),actions=[]
  const page={keyboard:{press:async k=>actions.push(k)},evaluate:async()=>pending.shift()}
  assert.deepEqual(await module.tabToQuery(page,fn=>fn()),visits);assert.deepEqual(actions,['Tab','Tab'])
  let count=0;await assert.rejects(module.tabToQuery({...page,evaluate:async()=>{count++;return {query:false}}},fn=>fn()),/within64/);assert.equal(count,64)
  await assert.rejects(module.tabToQuery({...page,evaluate:async()=>({label:'Menu',query:true,visible:false})},fn=>fn()))
})
test('actual held capture releases pointer when post-down deadline or capture fails',async()=>{
  for(const kind of ['deadline','capture','down']){const calls=[],primary=null,page={mouse:{async down(){calls.push('down');if(kind==='down')throw primary},async up(){calls.push('up')}}};let caught=false
    try{await module.captureHeldQuery(page,async fn=>{await fn();if(kind==='deadline')throw primary},async()=>{calls.push('capture');throw primary})}catch(e){caught=true;assert.equal(e,primary)}
    assert.equal(caught,true);assert.deepEqual(calls,kind==='capture'?['down','capture','up']:['down','up'])
  }
})
test('actual held release preserves falsey primary over cleanup rejection',async()=>{let caught=false;try{await module.captureHeldQuery({mouse:{down:async()=>{},up:async()=>{throw Error('release')}}},fn=>fn(),async()=>{throw false})}catch(e){caught=true;assert.equal(e,false)}assert.equal(caught,true)})
test('rendered width must agree with actual HUD scale',()=>{const r=row();r.rect.width=26;assert.throws(()=>acceptQueryArt(r,'normal',1),/scale mismatch/)})
