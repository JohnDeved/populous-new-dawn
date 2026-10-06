// Host-side acceptance deadlines only. No game, page, renderer or clock mutation.
import assert from 'node:assert/strict'
export function createEventDeadlines({now=()=>performance.now(),globalCheck,log}) {
  let active=null
  const current=()=>active?{...active,elapsedMs:now()-active.startedAt}:null
  const check=()=>{
    globalCheck()
    if(active)assert.ok(now()-active.startedAt<=active.limitMs,`${active.name} event deadline exceeded`)
  }
  return {
    check,current,
    begin(name,limitMs){
      assert.equal(active,null,'Complete the preceding event stage before starting another')
      assert.ok(typeof name==='string'&&name&&Number.isFinite(limitMs)&&limitMs>0)
      globalCheck();active={name,limitMs,startedAt:now()}
      log({action:'event-stage-start',...active})
    },
    finish(){
      assert.ok(active,'No event stage is active');check()
      const result=current();log({action:'event-stage-complete',...result});active=null;return result
    },
  }
}
