import test from 'node:test'
import {readFileSync} from 'node:fs'
import hud from '../app/original-hud.json' with {type:'json'}
import assert from 'node:assert/strict'
import {healthBarPixels} from '../app/hud-health.ts'
import fixture from './fixtures/hud-health.json' with {type:'json'}
import manifest from '../decomp/exports.json' with {type:'json'}

test('shaman health fill follows native integer bounds and absent/overfull cases',()=>{
  assert.equal(fixture.executableSha256,manifest.executableSha256)
  assert.equal(fixture.cases.length,fixture.pixels.length)
  assert.deepEqual(fixture.cases.map(([maximum,health])=>healthBarPixels(health??0,maximum)),fixture.pixels)
})


test('HUD atlas metadata matches the PNG and contains every imported sprite',()=>{
  const png=readFileSync(new URL('../public/original/hud.png',import.meta.url))
  assert.deepEqual([hud.width,hud.height],[png.readUInt32BE(16),png.readUInt32BE(20)])
  for(const [id,r] of Object.entries(hud.rects))
    assert.ok(r.x>=0&&r.y>=0&&r.x+r.w<=hud.width&&r.y+r.h<=hud.height,id)
})

import portrait from './fixtures/hud-portrait.json' with {type:'json'}
import units from '../app/original-units.json' with {type:'json'}
import views from '../app/original-camera.json' with {type:'json'}
import {portraitBackground} from '../app/hud-portrait.ts'
import {spriteLayers} from '../app/sprite-layers.ts'
test('portrait backgrounds and shadow-free directional layers match native captures',()=>{
  assert.equal(portrait.executableSha256,manifest.executableSha256)
  for(const c of portrait.backgrounds)assert.equal(portraitBackground(c.shaman,c.counter,c.hover),c.color)
  for(const c of portrait.cases){
    const cycle=units.animations[c.signature][c.action][c.direction]
    assert.equal(cycle.frames[c.step],c.frame);assert.equal(cycle.flip,c.flip)
    assert.deepEqual(spriteLayers(units.frames[c.frame].layers,units.pieces,{flags:2|Number(c.flip)},views.views[0]),c.draws)
  }
})

import tooltip from './fixtures/tooltip-layout.json' with {type:'json'}
import {tooltipLayout} from '../app/tooltip-layout.ts'
test('tooltip bitmap placement and wrapping match the original desktop controller',()=>{
  assert.equal(tooltip.executableSha256,manifest.executableSha256)
  for(const c of tooltip.cases)
    assert.deepEqual(tooltipLayout(c.text,...c.screen),{width:c.width,height:c.height,draws:c.draws})
})

import mana from './fixtures/hud-mana.json' with {type:'json'}
import {manaMeter} from '../app/hud-mana.ts'
import {createWorld,tick,TURNS_PER_SECOND} from '../app/model.ts'
test('mana production stripes follow native rates, warning bands and controller modes',()=>{
  assert.equal(mana.executableSha256,manifest.executableSha256)
  for(const c of mana.cases)assert.deepEqual(manaMeter(c.tribe,c.world,c.override),c.colors)
})
test('live mana estimation uses the simulation clock and follows charging toggles',()=>{
  const w=createWorld()
  assert.equal(w.manaWorld.turnsPerSecond,TURNS_PER_SECOND)
  w.shots.blast=0
  tick(w,1)
  assert.ok(w.manaTribes[0].previousRate>0)
  assert.ok(w.manaTribes[0].estimatedRate>0)
  assert.equal(w.manaWorld.manaFlags&1,0)
  w.charging=false;tick(w,1)
  assert.equal(w.manaWorld.manaFlags&1,1)
  assert.deepEqual(manaMeter(w.manaTribes[0],w.manaWorld),Array(44).fill(139))
  w.charging=true;tick(w,1)
  assert.equal(w.manaWorld.manaFlags&1,0)
  assert.ok(manaMeter(w.manaTribes[0],w.manaWorld).some(c=>c!==139))
})

import populationFixture from './fixtures/hud-population.json' with {type:'json'}
import {followerNumber,followerIcon,populationMeter} from '../app/hud-population.ts'
import {population,populationLimit} from '../app/model.ts'
test('follower counts, icon placement and housing fill match native HUD controllers',()=>{
  assert.equal(populationFixture.executableSha256,manifest.executableSha256)
  for(const c of populationFixture.cases){
    const label=followerNumber(c.count,c.total,c.alternate);let x=label.x
    const draws=label.ids.map(id=>{const [font,index]=id.slice(4).split('-').map(Number),d=[font,index,x,label.y+153];x+=hud.rects[id].w;return d})
    assert.deepEqual(draws,c.draws)
    for(const [sprite,x,y] of c.icons)assert.deepEqual(followerIcon(sprite),{x,y:y-153})
  }
  for(const c of populationFixture.meters)assert.deepEqual(populationMeter(c.population,c.capacity,c.frame),{pixels:c.pixels,color:c.color})
})
test('population readouts exclude dead followers and reserve the shaman allowance',()=>{
  const w=createWorld(),blue=w.units.filter(u=>u.team==='blue'&&u.kind!=='shaman')
  assert.equal(population(w,'blue')-1,blue.length)
  const before=population(w,'blue');blue[0].hp=0
  assert.equal(population(w,'blue'),before-1)
  const shaman=w.units.find(u=>u.team==='blue'&&u.kind==='shaman');shaman.hp=0
  assert.equal(population(w,'blue'),before-1)
  const hut=w.buildings.find(b=>b.team==='blue'&&b.kind==='hut'&&b.progress===1)
  const capacity=populationLimit(w,'blue');hut.hp=0
  assert.equal(populationLimit(w,'blue'),capacity-[3,5,7][hut.level-1])
})
