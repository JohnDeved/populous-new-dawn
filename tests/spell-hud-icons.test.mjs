import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import hud from '../app/original-hud.json' with {type:'json'}
import rules from '../app/original-rules.json' with {type:'json'}
import {spellButton} from '../app/spell-button.ts'
import {createWorld} from '../app/world-initialization.ts'
import {campaignSpellModels} from '../app/mission-data.ts'

const ids=[408,409,410,411,412,413]
const iconOf=view=>view.sprites.find(s=>ids.includes(s.id))

test('all six original Shield/Bloodlust descriptor frames have real atlas rectangles',()=>{
  assert.deepEqual(rules.spellCharging[19].icons,[408,409,410])
  assert.deepEqual(rules.spellCharging[20].icons,[411,412,413])
  for(const id of ids){
    const r=hud.rects[id]
    assert.ok(r,`Missing original HFX${id}`)
    assert.equal(r.w,28);assert.equal(r.h,25)
    assert.ok(r.x>=0&&r.y>=0&&r.x+r.w<=hud.width&&r.y+r.h<=hud.height)
  }
  for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
    const a=hud.rects[ids[i]],b=hud.rects[ids[j]]
    assert.ok(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y)
  }
})

test('ready, inactive, hover and selected states use the original descriptors, not Unicode or guessed frames',()=>{
  for(const model of [19,20]){
    const base={model,permanent:true,charging:false,hovered:false,selected:false,stock:0,gifts:0,progress:0}
    const [ready,inactive,hover]=rules.spellCharging[model].icons
    assert.equal(iconOf(spellButton(base)).id,inactive)
    assert.equal(iconOf(spellButton({...base,charging:true})).id,ready)
    assert.equal(iconOf(spellButton({...base,stock:1,gifts:1})).id,ready)
    assert.equal(iconOf(spellButton({...base,hovered:true})).id,hover)
    const selected=spellButton({...base,selected:true})
    assert.equal(iconOf(selected).id,inactive)
    assert.equal(selected.frame,'button-selected')
    assert.equal(spellButton({...base,permanent:false,selected:true}).frame,'button-gift-selected')
    for(const state of [base,{...base,hovered:true},{...base,charging:true},{...base,selected:true}]){
      const r=iconOf(spellButton(state))
      assert.equal(r.x,1);assert.equal(r.y,9)
    }
  }
})

test('authored Mission16 already exposes both sprites without forced availability or stock',()=>{
  const w=createWorld(16),before=structuredClone(w),roster=campaignSpellModels(16)
  for(const [id,model]of [['shield',19],['bloodlust',20]]){
    assert.ok(roster.has(model))
    assert.ok(w.manaWorld.spells[0].available&(1<<model))
    assert.equal(w.shots[id],0)
    const view=spellButton({model,permanent:true,charging:!(w.manaWorld.spells[0].disabled&(1<<(model-1))),
      hovered:false,selected:false,stock:w.shots[id],gifts:w.giftCounts[id],progress:w.manaTribes[0].spellProgress[model]})
    assert.equal(iconOf(view).id,rules.spellCharging[model].icons[0])
  }
  assert.deepEqual(w,before)
})

test('all shipped spell descriptor icons remain available after the append',()=>{
  for(const model of [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21])
    for(const id of rules.spellCharging[model].icons)assert.ok(hud.rects[id],`${model}:${id}`)
})

test('HudSprite no longer substitutes a text glyph and still rejects unknown resources',()=>{
  const source=readFileSync(new URL('../app/hud.tsx',import.meta.url),'utf8')
  assert.equal(source.includes('◌'),false);assert.equal(source.includes('✷'),false)
  assert.equal(source.includes('id >= 408 && id <= 413'),false)
  assert.ok(source.includes('if (!r) throw Error(`HUD sprite ${id} is unavailable`)'))
})
