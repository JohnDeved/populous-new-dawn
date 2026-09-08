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
