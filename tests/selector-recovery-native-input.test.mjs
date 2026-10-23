import test from 'node:test'
import assert from 'node:assert/strict'
import { assertNativeLockedMissionRejected } from '../scripts/check-browser-world-scene.mjs'

function fixture(change={}) {
  let clicked=false
  const calls=[]
  const locked={
    count:async()=>change.count??1,
    isDisabled:async()=>change.disabled??true,
    getAttribute:async()=>clicked && change.selectsLocked ? 'true' : 'false',
    evaluate:async()=>({x:20,y:30,width:12,height:14,viewportWidth:640,viewportHeight:480,hit:true,...change.target}),
  }
  const available={getAttribute:async()=>clicked && change.deselectsAvailable ? 'false' : 'true'}
  const page={
    mouse:{click:async(x,y)=>{calls.push([x,y]);clicked=true}},
    getByRole(role,{name}) {
      if(role==='button' && name instanceof RegExp) return name.test('Panel Mission 2') ? locked : available
      if(role==='button' && name==='Start Mission 1') return {isEnabled:async()=>!change.startDisabled}
      if(role==='dialog' && name==='Start game') return {isVisible:async()=>!change.closesSelector}
      if(role==='heading' && name==='Loading failed') return {count:async()=>change.loadingFailure?1:0}
      throw new Error(`Unexpected public control: ${role} ${name}`)
    },
    locator(selector) {assert.equal(selector,'.world-viewport canvas');return {count:async()=>change.launches?1:0}},
  }
  return {page,calls}
}

test('native locked-world recovery probe uses one verified real pointer input',async()=>{
  const f=fixture();await assertNativeLockedMissionRejected(f.page);assert.deepEqual(f.calls,[[20,30]])
})
for(const [name,change] of [
  ['ambiguous control',{count:2}],['unlocked control',{disabled:false}],
  ['covered control',{target:{hit:false}}],['empty box',{target:{width:0}}],
  ['nonfinite point',{target:{x:NaN}}],['offscreen point',{target:{x:640}}],
]) test(`native locked-world probe rejects ${name} before input`,async()=>{
  const f=fixture(change);await assert.rejects(assertNativeLockedMissionRejected(f.page));assert.deepEqual(f.calls,[])
})
for(const [name,change] of [
  ['locked selection',{selectsLocked:true}],['lost original selection',{deselectsAvailable:true}],
  ['closed selector',{closesSelector:true}],['gameplay launch',{launches:true}],
  ['loading failure',{loadingFailure:true}],['unavailable original mission',{startDisabled:true}],
]) test(`native locked-world probe rejects ${name} after input`,async()=>{
  const f=fixture(change);await assert.rejects(assertNativeLockedMissionRejected(f.page));assert.deepEqual(f.calls,[[20,30]])
})
