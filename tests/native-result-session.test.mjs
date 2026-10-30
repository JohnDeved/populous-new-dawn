import assert from 'node:assert/strict'
import test from 'node:test'
import { createResultSession, createResultKeys, createResultClock, advanceResultClock, resultBlink, resultSpaceEligible } from '../app/result-session.ts'
import { resultLayout, resultTextWidth } from '../app/original-result-layout.ts'
import sourceCases from '../decomp/research/result-presentation/cases.json' with {type:'json'}
import { pageEffect } from './support/follower-nearby-page.mjs'

const terminal = (level = 1) => ({turn:20,status: 'won', paused: false, inputMask: 0, outcome: {level}, manaWorld: {loadFlags: 0}})

test('result stages own world identity, pause, failed exit retry, Back and obsolete callbacks', () => {
  const session = createResultSession(), first = terminal(), second = terminal(2)
  assert.equal(session.stage(first), 'terminal-overlay')
  assert.equal(session.openStatistics(first), true)
  assert.equal(first.paused, true)
  const token = session.beginExit(first)
  assert.ok(token)
  assert.equal(session.beginExit(first), null)
  assert.equal(session.finishExit(first, token, false), true)
  assert.equal(session.stage(first), 'statistics')
  const retry = session.beginExit(first)
  assert.equal(session.finishExit(first, token, true), false)
  assert.equal(session.finishExit(first, retry, true), true)
  assert.equal(session.stage(first), 'selector')
  assert.equal(session.back(first), true)
  assert.equal(session.stage(first), 'statistics')
  const obsolete = session.beginExit(first)
  assert.equal(session.stage(second), 'terminal-overlay')
  assert.equal(session.finishExit(first, obsolete, true), false)
  assert.equal(session.stage(second), 'terminal-overlay')
  const tutorial = terminal(79)
  assert.equal(session.bypassStatistics(tutorial), true)
  const tutorialExit = session.beginExit(tutorial)
  session.finishExit(tutorial, tutorialExit, true)
  tutorial.paused = true // selector dialog owns this temporary pause
  session.back(tutorial)
  assert.equal(tutorial.paused, false, 'Back restores tutorial overlay pause ownership')
})

test('fresh Space policy rejects held/repeated cross-stage presses and tracks blocked downs', () => {
  const keys = createResultKeys(), press = {key: ' ',code:'Space',repeat:false}
  assert.equal(keys.down(press), true)
  assert.equal(keys.down(press), false)
  keys.up(press)
  assert.equal(keys.down({...press,repeat:true}), false)
  keys.up(press)
  assert.equal(keys.down(press), true)
  keys.reset()
  assert.equal(keys.down(press), true)
})

test('result input clock is elapsed83ms, unsigned and independent of render rates', () => {
  const reference = createResultClock(); advanceResultClock(reference, 12)
  for (const hz of [30,60,120,144]) {
    const clock = createResultClock()
    for (let i=0;i<hz*12;i++) advanceResultClock(clock,1/hz)
    assert.equal(clock.inputCycles,reference.inputCycles)
    assert.deepEqual(resultBlink(clock.inputCycles),resultBlink(reference.inputCycles))
  }
  assert.deepEqual(resultBlink(0),{prompt:false,status:false})
  assert.deepEqual(resultBlink(6),{prompt:true,status:true})
  assert.deepEqual(resultBlink(8),{prompt:false,status:true})
  const clock=createResultClock(); clock.inputCycles=0xffffffff; advanceResultClock(clock,.083)
  assert.equal(clock.inputCycles,0)
})

test('native result geometry retains both fonts and documented small-screen fit correction', () => {
  const normal=resultLayout(640,480),low=resultLayout(512,384),short=resultLayout(320,200)
  assert.deepEqual([normal.font,normal.panelWidth,normal.panelHeight],[3,384,368])
  assert.deepEqual([low.font,low.panelWidth,low.panelHeight,low.promptY],[4,240,224,226])
  assert.deepEqual([short.font,short.panelWidth,short.panelHeight],[4,240,208])
  assert.equal(low.counterValueStartX,177)
  assert.equal(resultTextWidth('Press Space Bar',4),83)
  for(const [w,h,p] of [[640,480,1],[1440,1000,2],[320,200,1],[512,384,1],[300,180,2]]) {
    const l=resultLayout(w,h,p)
    assert.ok(l.panelWidth*l.scale<=w)
    assert.ok((l.promptY+l.glyphHeight)*l.scale<=h)
  }
})

function inputFixture(options={}) {
  const window=new EventTarget(), world=terminal(options.level), session=createResultSession(), keys=createResultKeys()
  const scene={world,focusPauseOwned:false,resultClock:{simulationCycles:20},keys:new Set(),setModalSuspended(value){this.suspended=value}}
  let admissions=0, resets=0, selector=false
  const store={getWorld:()=>world,enterCampaignSelector:()=>{admissions++;return options.accepted!==false}}
  const popup={open:false}
  const cleanup=pageEffect('resultKeys.down(event)',{
    globalThis:window, window, world, store, ready:true, startup:'playing', menu:false, cheatsOpen:false, selectorOpen:false, debugPicker:false,
    resultSpaceEligible, engine:{current:scene}, resultKeys:keys, resultSession:session, messageDetails:{current:new Map([[1,popup]])},
    audio:{current:{reset(){resets++}}},setSelectorOpen(value){selector=value},update(){},
  })()
  function key(key=' ',extra={}) {
    const event=new Event('keydown',{cancelable:true})
    Object.assign(event,{key,code:key===' '?'Space':key,repeat:false,ctrlKey:false,metaKey:false,altKey:false,shiftKey:false,...extra})
    // EventTarget provides target=window; closest is the browser boundary here.
    window.closest=selector=>options.editor?'input':options.hudButton && selector.split(',').includes('button')?{tagName:'BUTTON'}:null
    window.dispatchEvent(event)
    return event.defaultPrevented
  }
  function up(){const event=new Event('keyup');Object.assign(event,{key:' ',code:'Space'});window.dispatchEvent(event)}
  return {window,world,scene,popup,session,key,up,cleanup,get admissions(){return admissions},get resets(){return resets},get selector(){return selector}}
}

test('actual Home result input performs two fresh Space stages, rejects Enter/repeat, and deduplicates exit',()=>{
  const f=inputFixture()
  try{
    assert.equal(f.key(),true);assert.equal(f.session.stage(f.world),'statistics');assert.equal(f.world.paused,true)
    f.key('Enter');assert.equal(f.admissions,0)
    f.key(' ',{repeat:true});assert.equal(f.admissions,0)
    f.up();f.key();assert.equal(f.admissions,1);assert.equal(f.resets,1);assert.equal(f.selector,true)
    f.up();f.key();assert.equal(f.admissions,1);assert.equal(f.resets,1)
  }finally{f.cleanup()}
})

test('actual Home preserves popup/mask/editor/modifier ownership and releases only focus pause',()=>{
  for(const owner of ['popup','mask','editor','modifier','focus']) {
    const f=inputFixture({editor:owner==='editor'})
    try{
      if(owner==='popup')f.popup.open=true
      if(owner==='mask')f.world.inputMask=4
      if(owner==='focus'){f.scene.focusPauseOwned=true;f.world.paused=true;f.world.inputMask=4}
      f.key(' ',owner==='modifier'?{ctrlKey:true}:{})
      assert.equal(f.session.stage(f.world),'terminal-overlay',owner)
      assert.equal(f.admissions,0)
      if(owner==='focus'){assert.equal(f.world.paused,false);assert.equal(f.scene.focusPauseOwned,false)}
      f.popup.open=false;f.world.inputMask=0
      f.key(' ',{repeat:true});assert.equal(f.session.stage(f.world),'terminal-overlay')
    }finally{f.cleanup()}
  }
})

test('actual Home tutorial bypasses statistics and rejected selector admission remains retryable',()=>{
  const tutorial=inputFixture({level:79}),failed=inputFixture({accepted:false})
  try{
    tutorial.key();assert.equal(tutorial.admissions,1);assert.equal(tutorial.world.paused,false)
    failed.key();failed.up();failed.key();assert.equal(failed.admissions,1)
    assert.equal(failed.session.stage(failed.world),'statistics');assert.equal(failed.resets,0)
    failed.up();failed.key();assert.equal(failed.admissions,2)
  }finally{tutorial.cleanup();failed.cleanup()}
})

test('gameplay focus-pause resume clears its owner before a later terminal Space',()=>{
  const f=inputFixture();f.world.status='playing';f.world.paused=true;f.scene.focusPauseOwned=true
  const cleanup=pageEffect("if (e.key.toLowerCase() === 'g')",{
    globalThis:f.window,window:f.window,world:f.world,store:{getWorld:()=>f.world,change(action){action(f.world)}},ready:true,
    menu:false,cheatsOpen:false,messageDetails:{current:new Map()},SPELLS:[],rotateBuildingPlan:()=>false,
    engine:{current:f.scene},audio:{current:null},update(){},openMenu(){},tutorialLevel:79,
  })()
  try {
    f.key();assert.equal(f.world.paused,false);assert.equal(f.scene.focusPauseOwned,false)
    cleanup();f.up();f.world.status='won';f.key()
    assert.equal(f.session.stage(f.world),'statistics')
  }finally{cleanup();f.cleanup()}
})

test('terminal Space from a native HUD button is captured instead of activating gameplay',()=>{
  const f=inputFixture({hudButton:true})
  try{assert.equal(f.key(),true);assert.equal(f.session.stage(f.world),'statistics');f.up();f.key();assert.equal(f.admissions,1)}
  finally{f.cleanup()}
})

test('runtime result geometry matches every retained source font/height branch before compatibility scaling',()=>{
  for(const {screen,expected} of sourceCases.layouts){
    const actual=resultLayout(...screen)
    for(const key of ['font','panelWidth','panelHeight','contentWidth','contentHeight','contentInset','headingY','playerY','statusY','timeY','labelX','valueColonX','lineHeight','groupGap','counterValueStartX','counterReserveWidth'])
      assert.deepEqual(actual[key],expected[key],`${screen}: ${key}`)
    assert.deepEqual(actual.rows.map(row=>row.y),expected.rowYs)
  }
  const wideShort=resultLayout(3840,200)
  assert.deepEqual([wideShort.font,wideShort.panelHeight,wideShort.lineHeight],[3,336,17])
})
