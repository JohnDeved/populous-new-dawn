import test from 'node:test'
import assert from 'node:assert/strict'
import fixture from './fixtures/timber.json' with { type: 'json' }
import manifest from '../decomp/exports.json' with { type: 'json' }
import rules from '../app/original-rules.json' with { type: 'json' }
import models from '../app/original-models.json' with { type: 'json' }
import { startTimberHarvest, stepTimberHarvest, timberTransfer, timberScale } from '../app/timber.ts'
import { clearLivePath } from '../app/live-pathfinding.ts'
import { createWorld, tick, unitAnimation, command, distance } from '../app/model.ts'

test('harvest clocks, transfer, scale and animation match original executable captures', () => {
  assert.equal(fixture.executableSha256,manifest.executableSha256)
  fixture.cases.forEach((c,i)=>{
    const e=fixture.expected[i],work=c.entering?startTimberHarvest(c.person,c.model):{remaining:c.remaining}
    assert.equal(stepTimberHarvest(work),e.done);assert.equal(work.remaining,e.remaining)
    if(c.entering)assert.equal(e.animation,rules.personAnimationObjects[6*9+c.person])
    const amount=e.done?timberTransfer(c.wood,c.cargo,rules.personWood[c.person],rules.personWood[c.person]):0
    assert.equal(c.cargo+amount,e.cargo);assert.equal(c.wood-amount,e.wood)
    if(amount&&e.alive)assert.equal(timberScale(e.wood,rules.sceneryWood[c.model],models[rules.sceneryObjects[c.model]].scale),e.scale)
  })
})

test('live builders harvest trees in twenty turns and pick up logs in three',()=>{
  for(const model of [1,11]){
    const w=createWorld(),b=w.buildings.find(b=>b.team==='blue'&&b.kind==='hut'),u=w.units.find(u=>u.team==='blue'&&u.kind==='brave'),tree=w.trees.filter(t=>t.model===1).sort((a,c)=>distance(a,b)-distance(c,b))[0]
    clearLivePath(w,u);b.progress=0;b.logs=0;tree.model=model;tree.logs=model===11?1:4
    Object.assign(u,{x:tree.x,z:tree.z,work:b.id,tree:tree.id,inside:null,path:[],cargo:0})
    const duration=model===11?3:20,heading=u.heading
    for(let n=1;n<=duration;n++){
      tick(w,1/12)
      if(n<duration){assert.equal(u.cargo,0);assert.equal(unitAnimation(w,u),'work');assert.equal(u.heading,heading,'harvesting keeps the approach heading');assert.equal(u.harvest.remaining,duration-n)}
    }
    assert.equal(u.cargo,1);assert.equal(tree.logs,model===11?0:3);assert.equal(u.harvest,undefined)
    assert.equal(unitAnimation(w,u),'carry')
    assert.equal(w.sounds.filter(s=>s.cue===1).length,1)
    assert.equal(w.sounds.filter(s=>s.cue===10).length,model===11?2:0)
    u.harvest={remaining:10};w.selected=[u.id];command(w,{x:u.x+2,z:u.z})
    assert.equal(u.harvest,undefined,'new orders cancel the old harvesting phase')
  }
})

import deliveryFixture from './fixtures/timber-delivery.json' with {type:'json'}
import {stepTimberDelivery} from '../app/timber.ts'
import {buildingStage,entrance} from '../app/model.ts'
import {changeBuildingWork} from '../app/building-damage.ts'
test('delivery waits, timber and construction stages match complete native calls',()=>{
  assert.equal(deliveryFixture.executableSha256,manifest.executableSha256)
  deliveryFixture.cases.forEach((c,i)=>{
    const e=deliveryFixture.expected[i],wait={remaining:c.entering?8:c.timer},done=stepTimberDelivery(wait)
    assert.equal(wait.remaining,e.timer);assert.equal(done,e.result===2)
    const amount=done?timberTransfer(c.cargo,c.work,rules.buildingLife[c.model],c.cargo):0
    const plan={remaining:c.work,attacker:3},b={model:c.model,stage:c.stage,state:1,flags2:0,attacker:3},events=[]
    changeBuildingWork(plan,amount,b,null,{move:()=>events.push('move'),release:()=>events.push('release'),init:()=>events.push('init')})
    assert.equal(c.cargo-amount,e.cargo);assert.equal(plan.remaining,e.work)
    assert.equal(b.stage,e.stage);assert.equal(b.state,e.state);assert.deepEqual(events,e.events)
    if(c.entering)assert.deepEqual(e.animations,[rules.personAnimationObjects[(c.cargo?4:0)*9+2]])
  })
})
test('live construction advances on each delivery, pauses and cancels cleanly',()=>{
  const w=createWorld(),b=w.buildings.find(b=>b.team==='blue'&&b.kind==='hut'),u=w.units.find(u=>u.team==='blue'&&u.kind==='brave')
  b.progress=0;b.logs=0
  const extra=w.units.find(p=>p.team==='blue'&&p.kind==='brave'&&p!==u)
  const arrive=()=>{clearLivePath(w,u);Object.assign(u,{...entrance(w,b),inside:null,work:b.id,tree:null,cargo:1})}
  for(let log=1;log<=3;log++){
    arrive()
    if(log===3){clearLivePath(w,extra);Object.assign(extra,{...entrance(w,b),inside:null,work:b.id,tree:null,cargo:1})}
    for(let turn=1;turn<=7;turn++){
      tick(w,1/12);assert.equal(b.progress,(log-1)/3)
      assert.equal(u.cargo,1);assert.equal(u.delivery.remaining,8-turn);assert.equal(unitAnimation(w,u),'carryIdle')
    }
    w.paused=true;tick(w,1);assert.equal(u.delivery.remaining,1);w.paused=false
    tick(w,1/12);assert.equal(b.progress,log/3);assert.equal(b.logs,log);assert.equal(u.cargo,0)
    assert.equal(buildingStage(b),[1,2,4][log-1])
  }
  assert.equal(w.stats.built,1);assert.equal(u.work,b.id)
  for(let turn=0;turn<600&&(u.builder||extra.builder);turn++)tick(w,1/12)
  assert.equal(u.work,null)
  assert.equal(extra.cargo,1,'completion preserves another worker’s surplus timber')
  assert.equal(extra.work,null)
  b.progress=0;b.logs=0;arrive();tick(w,1/12);w.selected=[u.id]
  command(w,{x:u.x+2,z:u.z});assert.equal(u.delivery,undefined)
  for(let turn=0;turn<16;turn++)tick(w,1/12)
  assert.equal(b.progress,0,'an abandoned plan must not advance without a delivery')
})
