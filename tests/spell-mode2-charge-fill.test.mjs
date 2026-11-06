import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spellButton } from '../app/spell-button.ts'
import { chargeFills } from '../app/hud-charge.ts'
import rules from '../app/original-rules.json' with { type:'json' }

const special=rules.spellCharging.map((r,model)=>({r,model})).filter(({r})=>r.mode===2)
const input=model=>({model,permanent:true,charging:true,hovered:false,selected:false,stock:0,gifts:0,progress:499999})
test('explicit native mode-2 permission renders existing layered progress without altering art',()=>{
  assert.deepEqual(special.map(x=>x.model),[18,20,21])
  for(const {r,model} of special) {
    const base=input(model),ordinary=spellButton(base),allowed=spellButton({...base,mode2ChargingAllowed:true})
    assert.deepEqual(allowed.fills,chargeFills(base.progress,r.cost,24))
    assert.ok(allowed.fills.length>0)
    assert.deepEqual({...allowed,fills:[]},ordinary)
    assert.deepEqual(base,input(model))
  }
})
test('missing or false permission preserves ordinary mode-2 no-fill semantics',()=>{
  for(const {model} of special)for(const permission of [undefined,false,null,0,1,'true']) {
    const view=spellButton({...input(model),mode2ChargingAllowed:permission})
    assert.deepEqual(view.fills,[])
  }
})
test('permission does not override hover, charging or permanent gates; ordinary models unchanged',()=>{
  for(const {model} of special)for(const change of [{hovered:true},{charging:false},{permanent:false}])
    assert.deepEqual(spellButton({...input(model),mode2ChargingAllowed:true,...change}).fills,[])
  for(const [model,r] of rules.spellCharging.entries())if(model&&r.mode&&r.mode!==2)
    assert.deepEqual(spellButton({...input(model),mode2ChargingAllowed:true}),spellButton(input(model)))
})
test('live page passes only game-state0x100 while retaining independent charging gates',()=>{
  const source=readFileSync(new URL('../app/page.tsx',import.meta.url),'utf8')
  assert.equal(source.split('mode2ChargingAllowed: !!(world.manaWorld.gameFlags & 256),').length,2)
  assert.match(source,/canCharge = permanent && spellHudCanCharge\(world, s\)/)
  assert.match(source,/charging:\s*canCharge &&\s*!\(world\.manaWorld\.spells\[player\]\.disabled & \(1 << \(s\.model - 1\)\)\)/)
  const evaluate=Function('world','return !!(world.manaWorld.gameFlags & 256)')
  for(const flags of [0,32,128,255,256,288,512,768])assert.equal(evaluate({manaWorld:{gameFlags:flags}}),!!(flags&256))
})
