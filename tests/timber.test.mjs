import test from 'node:test'
import assert from 'node:assert/strict'
import fixture from './fixtures/timber.json' with { type: 'json' }
import manifest from '../decomp/exports.json' with { type: 'json' }
import rules from '../app/original-rules.json' with { type: 'json' }
import models from '../app/original-models.json' with { type: 'json' }
import { startTimberHarvest, stepTimberHarvest, timberTransfer, timberScale } from '../app/timber.ts'

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

import deliveryFixture from './fixtures/timber-delivery.json' with {type:'json'}
import {stepTimberDelivery} from '../app/timber.ts'
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
