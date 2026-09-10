import test from 'node:test'
import assert from 'node:assert/strict'
import fixture from './fixtures/person-panel.json' with { type: 'json' }
import exports from '../decomp/exports.json' with { type: 'json' }
import { personOrderIcons, personPanel, stepPersonPanel } from '../app/person-panel.ts'

test('person panels preserve native command traversal, health and original draw submissions', () => {
  assert.equal(fixture.executableSha256, exports.executableSha256)
  for (const c of fixture.icons) {
    const icons = personOrderIcons({ records: c.orders }, c.person, new Map([[3, c.target]]))
    assert.deepEqual(icons.map(({model, sprite}) => ({model, sprite})), c.expected)
  }
  for (const c of fixture.panels) assert.deepEqual(personPanel(c.health, c.maximum, c.icons), c.expected)
})

test('person-panel lifetime matches native refresh and remains independent of render rate', () => {
  for (const c of fixture.lifetimes) {
    const state = {...c.initial}
    assert.deepEqual(c.holds.map(held => {
      const alive = stepPersonPanel(state, held)
      return { phase: state.phase, remaining: state.remaining, alive }
    }), c.expected)
  }
  for (const fps of [5, 30, 60, 120, 144, 240]) {
    const panel = { phase: -1, remaining: 0, hold: 20 }
    let frames = 0, death = 0
    for (let render = 1; render <= fps * 3 && !death; render++)
      while (frames < Math.floor(render / fps * 24 + 1e-9)) {
        frames++
        if (!stepPersonPanel(panel, false)) { death = frames; break }
      }
    assert.equal(death, 27)
  }
})

import focusFixture from './fixtures/order-focus.json' with { type: 'json' }
import { personOrderFocus } from '../app/person-panel.ts'

test('order focus matches native targets and follows the displayed queue record', () => {
  assert.equal(focusFixture.executableSha256, exports.executableSha256)
  for (const c of focusFixture.cases) assert.deepEqual(personOrderFocus(c.order, c.object), c.expected)
  const records = Array.from({length: 9}, (_, id) => ({model:3,flags:0,references:1,object:0,a:id*1000,b:id*1000+300}))
  const person = { immediateCommand: 0, commands: [1,2,3,4,5,6,7,8], commandCursor: focusFixture.physicalSlotMismatch.cursor }
  const before = JSON.stringify({records,person})
  const icons = personOrderIcons({records}, person, new Map())
  assert.equal(icons[0].id, focusFixture.physicalSlotMismatch.displayedOrder)
  assert.deepEqual(personOrderFocus(records[icons[0].id]), { x:4000, y:4300, target:0 })
  assert.notEqual(icons[0].id, focusFixture.physicalSlotMismatch.nativeFocusedOrder)
  assert.equal(JSON.stringify({records,person}), before)
  // Object-only orders safely ignore removed browser objects; packed cells survive.
  assert.equal(personOrderFocus({...records[1],model:14}), null)
  assert.deepEqual(personOrderFocus({...records[1],model:11,a:65535}), {x:65280,y:65280,target:0})
})

import markerFixture from './fixtures/order-marker.json' with { type: 'json' }
import { createWorld, effect, browserPosition } from '../app/model.ts'
import { animateLiveObjects } from '../app/live-people.ts'
import { advanceGame } from '../app/game-clock.ts'
import effectAtlas from '../app/original-effects.json' with { type: 'json' }

test('destination marker preserves native attachment, frames and lifetime at every render rate', () => {
  assert.equal(markerFixture.executableSha256, exports.executableSha256)
  const make = () => {
    const w = createWorld()
    w.units=[];w.buildings=[];w.shrines=[];w.trees=[];w.effects=[];w.speed=1
    w.land.heights.fill(markerFixture.ground);w.land.flags.fill(0);w.land.landFlags=0
    const counter=w.effectCounter, random=w.randomState
    const f=effect(w,'orderMarker',browserPosition(markerFixture.point))
    assert.equal(w.effectCounter,counter)
    assert.equal(w.randomState,random)
    assert.equal(Math.round(f.height*45),markerFixture.height)
    assert.equal(f.turnsRemaining,markerFixture.turns)
    return {w,f}
  }
  const {w,f}=make()
  for (const expected of markerFixture.frames) {
    assert.deepEqual(Object.fromEntries(Object.keys(expected).map(k=>[k,f.animation[k]])),expected)
    animateLiveObjects(w)
  }
  assert.deepEqual(effectAtlas.animations.hit.map(f=>f.source),[1294,1295,1296,1297,1298,1299])
  for (const schedule of [...[5,30,60,120,144,240].map(hz=>[1/hz]),[.007,.013,.28,.2]]) {
    const {w,f}=make(),visits=[],clock={animationTime:0,animationFrame:0,afterTurn:()=>visits.push(w.effects.includes(f))}
    w.paused=true;advanceGame(w,clock,30)
    assert.equal(f.age,0);assert.equal(f.animation.f1,0)
    w.paused=false
    for(let elapsed=0,i=0;elapsed<.5-1e-9;i++) {
      const dt=Math.min(.5-elapsed,schedule[i%schedule.length]);advanceGame(w,clock,dt);elapsed+=dt
    }
    assert.deepEqual(visits.slice(0,4),[true,true,true,false])
    assert.equal(w.effects.includes(f),false)
  }
})
