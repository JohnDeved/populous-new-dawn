// Synthetic observation rows only. These tests import no runtime model or clock.
import test from 'node:test'
import assert from 'node:assert/strict'
import { pinIdentityEpoch, requireIdentityEpoch, rebindIdentityEpoch, hasCurrentGuard,
  requireAdoptedGuard, requireLoadedIdentityBinding } from './guard-assertions.mjs'

const record = { model:30, flags:0, references:1, object:0, a:9, b:0 }
function row() {
  const native={identity:3,id:7,class:1,model:6,state:10,commandStatus:30,guardInputPending:null,target:9,
    commands:[1,0],commandCursor:0,immediateCommand:0,activeId:1,orders:[{id:1,record:{...record}}]}
  const shaman={identity:5,id:9,class:1,model:7,state:19,commandStatus:0,guardInputPending:null,target:0,
    commands:[0,0],commandCursor:0,immediateCommand:0,activeId:0,orders:[]}
  const actor=(p,identity,kind)=>({id:p.id,identity,nativeIdentity:p.identity,sourceIdentity:p.identity,native:p,
    team:'blue',kind,guard:false,owners:[{aliases:['native'],...structuredClone(p)}]})
  return {epoch:0,sceneIdentity:1,worldIdentity:2,level:10,turn:100,tribeMana:{shamanGuards:1},
    units:[actor(native,4,'firewarrior'),actor(shaman,6,'shaman')]}
}
function changeNative(state,id,patch) {
  const u=state.units.find(u=>u.id===id);Object.assign(u.native,structuredClone(patch))
  Object.assign(u.owners[0],structuredClone(patch))
}
const verified={sameStore:true,newWorld:true,newScene:true,currentCorrespondence:true,error:null}
function nextRow(old) {
  const s=structuredClone(old);s.epoch++;s.sceneIdentity+=20;s.worldIdentity+=20;s.turn+=1
  for(const u of s.units){u.identity+=20;u.nativeIdentity+=20;u.sourceIdentity+=20;changeNative(s,u.id,{identity:u.nativeIdentity})}
  return s
}
function saved(state) {
  return {level:state.level,turn:state.turn,people:state.units.map(u=>({id:u.id,team:u.team,kind:u.kind,
    owners:u.owners.map(p=>({...structuredClone(p),orders:p.orders.map(({id,record})=>({id,...record}))}))}))}
}

test('pins both actual Unit and native owner identities for the full epoch',()=>{
  const initial=row(), pin=pinIdentityEpoch(initial,[7,9]);requireIdentityEpoch(structuredClone(initial),pin)
  const unitSwap=structuredClone(initial);unitSwap.units[0].identity=99
  assert.throws(()=>requireIdentityEpoch(unitSwap,pin),/Unit object replaced/)
  const ownerSwap=structuredClone(initial);ownerSwap.units[0].nativeIdentity=88;ownerSwap.units[0].sourceIdentity=88;changeNative(ownerSwap,7,{identity:88})
  assert.throws(()=>requireIdentityEpoch(ownerSwap,pin),/Native owner replaced/)
  const shamanSwap=structuredClone(initial);shamanSwap.units[1].identity=77
  assert.throws(()=>requireIdentityEpoch(shamanSwap,pin),/Unit object replaced/)
})

test('every sampled row rejects replacement even when surrounding reads look unchanged',()=>{
  const initial=row(),pin=pinIdentityEpoch(initial,[7,9]),middle=structuredClone(initial)
  middle.units[0].identity=99
  assert.throws(()=>[initial,middle,initial].forEach(s=>requireIdentityEpoch(s,pin)),/Unit object replaced/)
  const renderSwap=structuredClone(initial);renderSwap.units[0].sourceIdentity=99
  assert.throws(()=>requireIdentityEpoch(renderSwap,pin),/pinned owner/)
  const pending=structuredClone(initial);changeNative(pending,7,{commandStatus:0,guardInputPending:true});pending.units[0].sourceIdentity=99
  assert.throws(()=>requireIdentityEpoch(pending,pin),/pinned owner/)
})

test('ordinary read cannot silently rebind after a changed epoch/world/scene',()=>{
  const initial=row(),pin=pinIdentityEpoch(initial,[7,9]),next=nextRow(initial)
  assert.throws(()=>requireIdentityEpoch(next,pin),/without verified UI Load/)
  assert.throws(()=>rebindIdentityEpoch(pin,next,null))
  assert.throws(()=>rebindIdentityEpoch(pin,next,{...verified,currentCorrespondence:false}))
  const rebound=rebindIdentityEpoch(pin,next,verified);requireIdentityEpoch(next,rebound)
  assert.notDeepEqual(rebound,pin)
  const unchanged=structuredClone(next);unchanged.units[0].identity=initial.units[0].identity
  assert.throws(()=>rebindIdentityEpoch(pin,unchanged,verified),/cloned the Unit/)
})

test('only the CURRENT active order can satisfy native Guard',()=>{
  const state=row();assert.equal(hasCurrentGuard(state,7,9),true)
  changeNative(state,7,{commands:[2,1],activeId:2,orders:[{id:2,record:{...record,model:3}},{id:1,record:{...record}}]})
  assert.equal(hasCurrentGuard(state,7,9),false)
  assert.throws(()=>requireAdoptedGuard(state,7,9),/CURRENT active/)
  changeNative(state,7,{immediateCommand:1,activeId:1});assert.equal(hasCurrentGuard(state,7,9),true)
})

test('pending initial G may carry target0; adoption must configure the actual target',()=>{
  const state=row();changeNative(state,7,{target:0,commandStatus:0,guardInputPending:true})
  assert.equal(hasCurrentGuard(state,7,9),true)
  assert.throws(()=>requireAdoptedGuard(state,7,9))
  const pin=pinIdentityEpoch(state,[7,9]);requireIdentityEpoch(state,pin)
  assert.equal(state.units[0].native.target,0,'Observation must not manufacture adoption')
  changeNative(state,7,{commandStatus:30,guardInputPending:null})
  assert.throws(()=>requireAdoptedGuard(state,7,9),/actual native target/)
  changeNative(state,7,{target:9});requireAdoptedGuard(state,7,9)
})

test('Load binding validates captured aliases, saved target and exact Guard queue before pinning',()=>{
  const initial=row();changeNative(initial,7,{guardInputPending:true,commandStatus:0})
  const checkpoint=saved(initial),next=nextRow(initial)
  // Actual auto-resume may adopt and change phase/status before the first async read.
  changeNative(next,7,{guardInputPending:null,commandStatus:30,f1:4})
  requireLoadedIdentityBinding(next,checkpoint,7,9)
  const wrongTarget=structuredClone(next);changeNative(wrongTarget,7,{target:0})
  assert.throws(()=>requireLoadedIdentityBinding(wrongTarget,checkpoint,7,9),/native target/)
  const wrongQueue=structuredClone(next);changeNative(wrongQueue,7,{commands:[2,0]})
  assert.throws(()=>requireLoadedIdentityBinding(wrongQueue,checkpoint,7,9))
  const wrongAlias=structuredClone(next);wrongAlias.units[0].owners[0].aliases.push('entry.person')
  assert.throws(()=>requireLoadedIdentityBinding(wrongAlias,checkpoint,7,9))
  const cancelled=row();changeNative(cancelled,7,{guardInputPending:true,commandStatus:0,commands:[0,0],activeId:0,orders:[]})
  const cancelCheckpoint=saved(cancelled),cancelNext=nextRow(cancelled)
  changeNative(cancelNext,7,{guardInputPending:null,state:17})
  requireLoadedIdentityBinding(cancelNext,cancelCheckpoint,7,9)
  assert.equal(cancelNext.units[0].native.target,9)
})
