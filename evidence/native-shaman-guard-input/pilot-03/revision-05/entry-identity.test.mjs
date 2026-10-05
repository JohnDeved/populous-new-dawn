// Source data and mocked UI only; no World constructor, turns, browser or server.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { missionTenSourceFacts, resolveAuthoredHut, observeInitialBraves, enterMissionTen } from './entry-identity.mjs'
const construction=JSON.parse(readFileSync(new URL('./mission10-construction.json',import.meta.url)))
const levelText=readFileSync(new URL('../../../app/level-ten.ts',import.meta.url),'utf8')
const level=JSON.parse(levelText.slice(levelText.indexOf('export default ')+15).trim().replace(/;$/,''))
const rules=JSON.parse(readFileSync(new URL('../../../app/original-rules.json',import.meta.url)))
const facts=missionTenSourceFacts(level,rules,construction)
const buildings=construction.constructed.firewarriorHuts.map(b=>({...b,kind:'firewarriorHut',team:'blue',tribe:0}))

test('authored149 resolves by native identity, independently of live ID and displayed center',()=>{
  assert.deepEqual(facts.hut,{authoredIndex:149,kind:'firewarriorHut',model:8,tribe:0,object:99,angle:0,anchorX:7168,anchorY:0})
  const bound=resolveAuthoredHut(buildings,facts.hut)
  assert.equal(bound.anchor.x,7168);assert.notEqual(bound.id,149);assert.notEqual(bound.x,20)
  const relabelled=buildings.map(b=>({...b,id:b.id+400}))
  assert.equal(resolveAuthoredHut(relabelled,facts.hut).id,bound.id+400)
  assert.throws(()=>resolveAuthoredHut([...buildings,{...bound,id:700}],facts.hut),/Exactly one/)
  for(const key of ['object','angle','anchorX','anchorY']) {
    const invalid=buildings.map(b=>({...b,pose:{...b.pose,[key]:b.pose[key]+1}}))
    assert.throws(()=>resolveAuthoredHut(invalid,facts.hut),/Exactly one/)
  }
  assert.throws(()=>resolveAuthoredHut(buildings.map(b=>({...b,tribe:1})),facts.hut),/Exactly one/)
  assert.throws(()=>resolveAuthoredHut(buildings.map(b=>({...b,model:7})),facts.hut),/Exactly one/)
})

test('original Brave roster survives natural births without an exact live-count assertion',()=>{
  assert.deepEqual(facts.originalBraves.map(p=>p.id),[119,120,121,122,123])
  const original=facts.originalBraves.map(p=>({id:p.id,team:'blue',kind:'brave',hp:100,inside:13,work:13}))
  const additional={id:800,team:'blue',kind:'brave',hp:100,inside:null,work:null}
  const observed=observeInitialBraves([...original,additional],facts)
  assert.equal(observed.original.length,5);assert.deepEqual(observed.additional,[additional])
  assert.throws(()=>observeInitialBraves(original.slice(1),facts),/Original live Brave/)
})

async function entryFixture({visible=false,mask=0,flags=16,remaining=60000}={}) {
  const actions=[],stages=[],world={turn:5,time:0.2,inputMask:mask,flyby:{flags,events:[]}}
  globalThis.window={testStore:{getWorld:()=>world},testSceneRef:{current:{world}}}
  const page={
    setDefaultTimeout:ms=>actions.push(['timeout',ms]),
    getByRole:(role,options)=>{assert.equal(role,'button');assert.equal(options.name,'Mission 10');return {focus:async()=>actions.push(['focus'])}},
    keyboard:{press:async key=>actions.push(['key',key])},
    evaluate:async callback=>callback(),
    waitForFunction:async(callback,arg,options)=>{assert.ok(options.timeout>0&&options.timeout<=60000);assert.ok(callback());actions.push(['ready-wait'])},
    locator:selector=>{assert.equal(selector,'.skip-introduction');return {isVisible:async()=>visible,click:async()=>{actions.push(['skip-click']);world.inputMask=0;world.flyby.flags=16}}},
  }
  try {
    const result=await enterMissionTen({page,showAllMissions:async()=>actions.push(['all-missions']),bindGame:async()=>actions.push(['bound']),
      waitForShamanReadiness:async()=>({after:{ready:true,turn:world.turn}}),markStage:(name,details)=>stages.push({name,details}),entryRemaining:()=>remaining,check:()=>{}})
    return {actions,stages,result}
  }finally{delete globalThis.window}
}

test('ready Mission10 with no introduction never waits for a nonexistent Skip',async()=>{
  const {actions,stages,result}=await entryFixture()
  assert.equal(actions.some(([name])=>name==='skip-click'),false)
  assert.equal(actions.filter(([name])=>name==='ready-wait').length,2)
  assert.equal(stages.find(s=>s.name==='optional-introduction-observed').details.visible,false)
  assert.equal(result.after.ready,true)
})

test('visible introduction uses the actual public Skip and preserves the 60s deadline',async()=>{
  const visible=await entryFixture({visible:true,mask:1,flags:1})
  assert.equal(visible.actions.filter(([name])=>name==='skip-click').length,1)
  await assert.rejects(entryFixture({remaining:0}),/Entry\/readiness real-clock bound/)
})
