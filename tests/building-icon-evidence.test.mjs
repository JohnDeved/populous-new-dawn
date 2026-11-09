import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
// Actual module with only the two public browser setup leaves supplied; no browser,
// React, model, original binary, Playwright or renderer is loaded by this suite.
const source=readFileSync(new URL('../scripts/tutorial-browser/building-icon-evidence.mjs',import.meta.url),'utf8')
const dependency="import { bindGame, showAllMissions } from '../browser-game.mjs'"
assert.equal(source.split(dependency).length,2)
const module=await import('data:text/javascript;base64,'+Buffer.from(source.replace(dependency,"const bindGame=()=>{throw Error('browser setup forbidden')},showAllMissions=bindGame")).toString('base64'))
const {acceptBuildingIconPanel,buildingIconKinds,buildingIconLabels,buildingIconPolicy,default:run}=module
const atlas=JSON.parse(readFileSync(new URL('../app/original-building-icons.json',import.meta.url),'utf8'))
function panel(mission=16) {
  const available=Object.fromEntries(buildingIconKinds.map((k,i)=>[k,mission===16||i===0]))
  return {mission,paused:true,scale:2,mode:null,visible:true,rect:{x:0,y:0,width:300,height:1000},available,
    cards:buildingIconKinds.map((kind,i)=>{const a=atlas.icons[kind],r={x:(i%2)*100,y:Math.floor(i/2)*100,width:90,height:90}
      return {kind,label:buildingIconLabels[i],disabled:!available[kind],pressed:false,visible:true,rect:r,clips:[],iconCount:1,unoccluded:true,
        icon:{width:a.w,height:a.h,x:-a.x,y:-a.y,image:'url("http://localhost/original/building-icons.png")',repeat:'no-repeat',rendering:'pixelated',rect:{x:r.x+1,y:r.y+1,width:a.w,height:a.h}}}})}
}
test('all eight source-bound normal icons and natural availability accepted, not visual equivalence',()=>{
  assert.deepEqual(acceptBuildingIconPanel(panel(),atlas,16,2),{status:'passed',visualReviewPending:true})
  acceptBuildingIconPanel(panel(1),atlas,1,2)
})
for(const [name,mutate] of [
  ['missing control',p=>p.cards.pop()],['wrong label/model order',p=>p.cards[1].label='Hut, 3 wood'],
  ['wrong icon crop',p=>p.cards[3].icon.x=-37],['wrong atlas',p=>p.cards[3].icon.image='url("http://localhost/original/hud.png")'],
  ['clipped icon',p=>p.cards[2].icon.rect.x=1000],['ancestor clipping',p=>p.cards[0].clips.push({x:0,y:0,width:2,height:2})],
  ['overlapping controls',p=>p.cards[1].rect={...p.cards[0].rect}],['occluded control',p=>p.cards[0].unoccluded=false],
  ['invented availability',p=>p.cards[1].disabled=true],['unpaused world',p=>p.paused=false],['wrong effective scale',p=>p.scale=1.5],
])test(`reject ${name}`,()=>{const p=panel();mutate(p);assert.throws(()=>acceptBuildingIconPanel(p,atlas,16,2))})
function harness(options={}) {
  const output=mkdtempSync(join(tmpdir(),'icon-evidence-')),receipt={},calls=[]
  const browser={async close(){calls.push('browser')}}
  return {output,receipt,calls,browser,options:{browser,output,url:'http://localhost',root:output,source:{commit:'a'.repeat(40)},expectedRevision:'a'.repeat(40),receipt,inputs:()=>({}),...options},dispose(){rmSync(output,{recursive:true,force:true})}}
}
const complete=async({receipt,ownContext,releaseContext})=>{
  const c={async close(){}};ownContext(c);await releaseContext(c)
  receipt.captures=Array(8).fill({});receipt.delivery=Array(4).fill({});receipt.interactions=Array(8).fill({});receipt.tabReturn={mode:null}
}
test('owned supplied successful route closes context then browser and writes bounded receipt',async()=>{const h=harness({perform:complete});try{await run(h.options);assert.equal(h.receipt.status,'passed');assert.equal(h.receipt.cleanupConfirmed,true);assert.equal(h.receipt.operationSettled,true);assert.deepEqual(h.calls,['browser']);assert.ok(existsSync(join(h.output,'building-icon-evidence.json')))}finally{h.dispose()}})
test('preflight rejection still closes transferred browser once',async()=>{const h=harness({expectedRevision:'invalid'});try{await assert.rejects(run(h.options));assert.deepEqual(h.calls,['browser']);assert.equal(h.receipt.status,'failed')}finally{h.dispose()}})
test('falsey primary is not masked by browser cleanup rejection',async()=>{const h=harness({perform:async()=>{throw null},browser:{async close(){throw false}}});try{let caught=false;try{await run(h.options)}catch(error){caught=true;assert.equal(error,null)}assert.equal(caught,true);assert.equal(h.receipt.cleanupConfirmed,false);assert.equal(h.receipt.failure,'null')}finally{h.dispose()}})
test('original operation deadline remains enforced with delayed timer scheduling',async()=>{let now=0;const h=harness({now:()=>now,perform:async({check})=>{now=178000;check()}});try{await assert.rejects(run(h.options),/deadline/);assert.equal(h.receipt.status,'failed')}finally{h.dispose()}})
test('whole owner cleanup reaching deadline cannot report pass',async()=>{let now=0;const h=harness({now:()=>now,perform:complete,browser:{async close(){now=180000}}});try{await assert.rejects(run(h.options));assert.equal(h.receipt.cleanupConfirmed,false)}finally{h.dispose()}})
test('third context and excessive screenshot bytes are refused before acceptance',async()=>{for(const perform of [async({ownContext})=>{for(let i=0;i<3;i++)ownContext({async close(){}})},async({write})=>write('building-icon-test.png',Buffer.alloc(buildingIconPolicy.screenshotBytes+1))]){const h=harness({perform});try{await assert.rejects(run(h.options));assert.equal(h.receipt.status,'failed')}finally{h.dispose()}}})
test('actual bounded Tab entry retains intervening public controls before first building',async()=>{
  const actions=[],visits=['spells 1–3','followers','Nearby followers','Menu','Hut, 3 wood'].map((label,i)=>({label,tag:'BUTTON',cardIndex:i===4?0:-1}))
  const pending=structuredClone(visits)
  const page={getByRole:()=>({focus:async()=>actions.push('focus-buildings')}),keyboard:{press:async key=>actions.push(key)},evaluate:async()=>pending.shift()}
  assert.deepEqual(await module.tabToFirstBuilding(page,fn=>fn()),visits)
  assert.deepEqual(actions,['focus-buildings',...Array(5).fill('Tab')])
  await assert.rejects(module.tabToFirstBuilding({...page,evaluate:async()=>({label:'Guard Tower, 5 wood',cardIndex:1})},fn=>fn()),/first reach Hut/)
  let count=0
  await assert.rejects(module.tabToFirstBuilding({...page,evaluate:async()=>{count++;return {label:'Other',cardIndex:-1}}},fn=>fn()),/within64/)
  assert.equal(count,64)
})
test('post-receipt clock boundary fails shared receipt rather than returning passed',async()=>{
  let now=0;const h=harness({now:()=>now,perform:complete,writeReceipt:()=>{now=180000}})
  try{await assert.rejects(run(h.options),/receipt exceeded/);assert.equal(h.receipt.status,'failed');assert.equal(h.receipt.receiptPostWriteDeadlineFailed,true)}finally{h.dispose()}
})
test('unprintable primary/cleanup errors cannot skip browser cleanup or mask primary',async()=>{
  const primary={toString(){throw Error('unprintable')}},cleanup={toString(){throw false}},closed=[]
  const h=harness({perform:async({ownContext})=>{ownContext({async close(){closed.push('context');throw cleanup}});throw primary},browser:{async close(){closed.push('browser')}}})
  try{let caught=false;try{await run(h.options)}catch(e){caught=true;assert.equal(e,primary)}assert.equal(caught,true);assert.deepEqual(closed,['context','browser']);assert.equal(h.receipt.failure,'[unprintable error]');assert.equal(h.receipt.cleanupConfirmed,false)}finally{h.dispose()}
})
