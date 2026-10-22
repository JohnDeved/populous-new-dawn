import { withoutCampaignPopup } from './support/world-input-page.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import { pageEffect } from './support/follower-nearby-page.mjs'
import { skipPauseIntroduction as skipPause } from '../scripts/local-render/original-pause-checkpoint-recovery.mjs'
import { awaitSpySourceReadiness } from '../scripts/tutorial-browser/spy-source-readiness.mjs'

const skipPauseIntroduction = (page, options) => skipPause(withoutCampaignPopup(page), options)

function fixture({ paused, race, kind }) {
  const world={inputMask:64,flyby:{flags:17,frame:0,warmup:0},paused,mode:null,outcome:{level:1},turn:116}
  const calls=[],report={}
  let handler,reads=0
  const finish=()=>{world.inputMask=0;world.flyby.flags&=~1}
  const cleanup=pageEffect('engine.current?.skipIntroduction()',{
    ready:true,menu:false,cheatsOpen:false,world,engine:{current:{skipIntroduction(){calls.push('native-skip');finish()}}},
    messageDetails:{current:new Map()},
    SPELLS:[],rotateBuildingPlan:()=>false,audio:{current:null},update(){},
    store:{change(fn){calls.push('world-change');fn(world)}},
    globalThis:{addEventListener(_name,fn){handler=fn},removeEventListener(){}},
  })()
  const context={window:{testStore:{getWorld:()=>world},testSceneRef:{current:{world,renderer:{domElement:{isConnected:true}}}}},document:{querySelector:()=>null}}
  const run=(fn,arg)=>runInNewContext(`(${fn.toString()})(arg)`,{...context,arg})
  const page={
    evaluate:async(fn,arg)=>{
      reads++
      if(kind==='pause'&&race==='before')finish()
      return run(fn,arg)
    },
    waitForFunction:async(fn,arg,options)=>{
      assert.ok(options.timeout>0&&options.timeout<=8000,'unchanged Spy absolute cap')
      const value=run(fn,arg);assert.ok(value)
      return {jsonValue:async()=>value,dispose:async()=>{if(race==='before')finish()} }
    },
    keyboard:{press:async key=>{
      calls.push(key)
      if(race==='delivery')finish()
      handler({key:' ',code:'Space',repeat:false,ctrlKey:false,metaKey:false,altKey:false,target:{closest:()=>null},preventDefault(){}})
    }},
  }
  return {world,calls,report,cleanup,page,get reads(){return reads},
    invoke:()=>kind==='pause'?skipPauseIntroduction(page,{timeout:2500}):awaitSpySourceReadiness({page:withoutCampaignPopup(page),report,action:async(_name,fn)=>fn(),save(){},deadlineAt:Date.now()+45000})}
}

for(const kind of ['pause','spy'])for(const paused of [false,true]){
  test(`${kind} reobserves completion before delivery without changing pause (${paused})`,async()=>{
    const f=fixture({kind,paused,race:'before'})
    try{await f.invoke();assert.equal(f.world.paused,paused);assert.deepEqual(f.calls,[]);assert.ok(f.reads>=1)}finally{f.cleanup()}
  })
  test(`${kind} rejects actual Home pause toggle at last-moment delivery (${paused})`,async()=>{
    const f=fixture({kind,paused,race:'delivery'})
    try{
      await assert.rejects(f.invoke(),/Space changed pause state/)
      assert.equal(f.world.paused,!paused,'no speculative compensating key is delivered')
      assert.equal(f.world.inputMask,0)
      assert.deepEqual(f.calls,['Space','world-change'])
      if(kind==='spy'){assert.match(f.report.readiness.failure,/Space changed pause state/);assert.equal(f.report.readiness.after,undefined)}
    }finally{f.cleanup()}
  })
  test(`${kind} non-racing actual native skip preserves pause (${paused})`,async()=>{
    const f=fixture({kind,paused,race:'none'})
    try{await f.invoke();assert.equal(f.world.paused,paused);assert.deepEqual(f.calls,['Space','native-skip'])}finally{f.cleanup()}
  })
}

test('pause recovery observation stalls cannot dispatch late input or exceed its original cap',async()=>{
  let release,keys=0
  const pending=new Promise(resolve=>{release=resolve})
  await assert.rejects(skipPauseIntroduction({evaluate:()=>pending,keyboard:{press:async()=>{keys++}}},{timeout:15}),/timed out/)
  release({action:'skip',paused:false});await new Promise(resolve=>setImmediate(resolve))
  assert.equal(keys,0)
})
