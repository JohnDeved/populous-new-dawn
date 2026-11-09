import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import {
  createAngelPresentation, requestAngelModel, requestAngelStrikePresentation,
  stepAngelPresentation, animateAngelPresentations, angelRawPoints, angelPoseRawPoints, validAngelPresentation,
} from '../app/angel-presentation.ts'
import { nativeModelResource } from '../app/model-resources.ts'
import initial from '../app/original-angel-presentation.json' with { type: 'json' }
import strike from '../app/original-angel-strike.json' with { type: 'json' }

// Independent raw bank-2 OBJS/PNTS reader, not the production importer.
const original62FrameHashes = [
  "e0d85163fb3f0ae4d5ff1476bc1256715d863c97002759863280798592da3daa",
  "fa209d30bad8640d913d671c85ed5d84053e5457456db38db63811608b6de522",
  "43afe4b37d5f9607905e9b5710083e822544307a3d8d464ed56e468fc9556ca4",
  "4cdd4980872d5bb5b6ed47fa2ba025b15541df674ccb3980467107b930bc0ddc",
  "9a01727e00285b70b5962b19889702a7fd9a24c008a2159bebdb2b54974c462e",
  "e77eb1701397f66bf67ba66ff48b4f815858dd6891b95107a8112e54da2527df",
  "faffd217a7d74989a9f692630339bcf4f24e1201469a645c9b1a5ab704b0206a",
  "5a53b02e66854b2b1db61c0cc69ea36f604ba7ae0968b7b339c820da3b9a8c37",
  "6dd851f58e59b00b19cbe85a5e34ef33ed36088418e94bc6dd360d750047fac0",
  "db10aa09799066818e9876083ba5bb253a41b02ef593a142d8e5de58f630d9e7",
  "8611ec29a06a562c76dabad7441b15d8c658afc42c027abd5752ab036fb2e130",
  "0849e4e2a5668e6954c3db448f2c6ed45ef5f2a57e3d9d87872f9bb37d799337"
]
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')

test('strike resource owns original UV/tile/bias data, not model69 materials', () => {
  assert.equal(strike.base, 62)
  assert.equal(strike.morphIndex, 4)
  assert.equal(strike.frames, 12)
  for (const bank of [2, 6]) assert.deepEqual(nativeModelResource(62, bank).data, strike.baseGeometry)
  assert.deepEqual(strike.baseGeometry.faces, initial.baseGeometry.faces)
  assert.deepEqual(strike.basePointIndices, initial.basePointIndices)
  for (const key of ['p', 'uv', 'tiles', 'normals', 'biases'])
    assert.notDeepEqual(strike.baseGeometry[key], initial.baseGeometry[key], key)
  for (let frame = 0; frame < 12; frame++)
    assert.equal(hash(angelRawPoints(frame, 62)), original62FrameHashes[frame])
})

test('004de440 request sequence reaches62 only after five transition requests', () => {
  const state = createAngelPresentation()
  stepAngelPresentation(state)
  const trace = []
  for (let visit = 0; visit < 6; visit++) {
    requestAngelModel(state, 62)
    trace.push([state.object, state.transitionCounter, state.targetKey])
    stepAngelPresentation(state)
    stepAngelPresentation(state)
  }
  assert.deepEqual(trace, [[69,1,76],[69,2,77],[69,3,77],[69,4,78],[69,5,78],[62,5,78]])
  assert.equal(state.morph, 4)
  assert.equal(state.displayedPose.object, 62)
  assert.equal(state.renderFlags & 0x1000, 0)
  const reverse = []
  for (let visit = 0; visit < 6; visit++) {
    requestAngelModel(state, 69)
    reverse.push([state.object, state.transitionCounter, state.targetKey])
    stepAngelPresentation(state)
    stepAngelPresentation(state)
  }
  assert.deepEqual(reverse, [[62,4,78],[62,3,77],[62,2,77],[62,1,76],[62,0,76],[69,0,76]])
  assert.equal(state.morph, 5)
})

test('requesting current object cannot cancel a pending opposite transition', () => {
  const state = createAngelPresentation()
  requestAngelModel(state, 62)
  assert.equal(state.sourceKey, 69) // Native zero-source fallback before first display.
  requestAngelModel(state, 69)
  assert.equal(state.pendingObject, 62)
  assert.equal(state.transitionCounter, 2)
  for (let i = 0; i < 4; i++) requestAngelModel(state, 69)
  assert.equal(state.object, 62)
  requestAngelModel(state, 69)
  assert.equal(state.pendingObject, 69)
  assert.equal(state.transitionCounter, 4)
})

test('native override source/timer/render bits and display latch stay distinct', () => {
  const state = createAngelPresentation()
  stepAngelPresentation(state)
  const previous = structuredClone(state.displayedPose)
  requestAngelModel(state, 62)
  assert.deepEqual(state.displayedPose, previous) // A logical request does not render.
  assert.equal(state.sourceKey, 70)
  stepAngelPresentation(state)
  assert.deepEqual(state.displayedPose, {object:69,from:70,to:76,numerator:0,denominator:2})
  stepAngelPresentation(state)
  assert.equal(state.displayedPose.numerator, 1)
  assert.equal(state.renderFlags & 0x400, 0x400)
  requestAngelModel(state, 62)
  assert.equal(state.morphTimer, 0)
  assert.equal(state.renderFlags & 0x400, 0x400) // set_unit_anim does not clear it.
  stepAngelPresentation(state)
  assert.equal(state.displayedPose.numerator, 2)
  assert.deepEqual(angelPoseRawPoints(state.displayedPose), strike.keypoints[77])
})

test('only proved striking requests62; seeking does not guess mode3 from a target', () => {
  const angel = {phase:'seeking',target:99,heading:0,timer:0,lifetime:2000}
  for (let i=0; i<20; i++) requestAngelStrikePresentation(angel)
  assert.equal(angel.presentation.object,69)
  assert.equal(angel.presentation.transitionCounter,0)
  angel.phase='striking';angel.timer=28
  requestAngelStrikePresentation(angel)
  assert.equal(angel.presentation.pendingObject,62)
  assert.equal(angel.presentation.transitionCounter,1)
  assert.deepEqual({phase:angel.phase,timer:angel.timer,target:angel.target,lifetime:angel.lifetime},
    {phase:'striking',timer:28,target:99,lifetime:2000})
})

test('partial request/pose checkpoint and pause retain exact continuation', () => {
  const angel={phase:'striking',target:99,heading:0,timer:24,lifetime:1800},
    world={paused:false,land:{landFlags:0},effects:[{angel}]}
  for(let i=0;i<2;i++){requestAngelStrikePresentation(angel);animateAngelPresentations(world)}
  const saved=JSON.parse(JSON.stringify(world)), before=structuredClone(world)
  world.paused=true;animateAngelPresentations(world);world.paused=false
  assert.deepEqual(world,before)
  world.land.landFlags=2;animateAngelPresentations(world);world.land.landFlags=0
  assert.deepEqual(world,before)
  for(let i=0;i<15;i++){
    if(i===7){world.effects[0].angel.phase='seeking';saved.effects[0].angel.phase='seeking'}
    requestAngelStrikePresentation(world.effects[0].angel)
    requestAngelStrikePresentation(saved.effects[0].angel)
    animateAngelPresentations(world);animateAngelPresentations(saved)
    assert.deepEqual(world,saved)
  }
})

test('live logical visitor requests presentation after gameplay step without advancing display', () => {
  const turn=readFileSync(new URL('../app/world-turn.ts',import.meta.url),'utf8'),
    renderer=readFileSync(new URL('../app/scene-effects.ts',import.meta.url),'utf8')
  assert.ok(turn.indexOf('requestAngelStrikePresentation(fx.angel)') > turn.indexOf('const event = stepAngel(w, fx)'))
  assert.ok(turn.includes('if (!event.expired) requestAngelStrikePresentation(fx.angel)'))
  assert.ok(renderer.includes('f.angel.presentation?.displayedPose ?? INITIAL_ANGEL_POSE'))
  assert.ok(renderer.includes('scene.releaseGroup(mesh)'))
  assert.ok(!renderer.includes('requestAngelModel('))
})


test('old or malformed presentation is rejected, not silently upgraded', () => {
  const state=createAngelPresentation()
  assert.equal(validAngelPresentation(state),true)
  for(const field of ['transitionCounter','pendingObject','displayedPose','sourceKey']){
    const old=structuredClone(state);delete old[field]
    assert.equal(validAngelPresentation(old),false,field)
  }
  for(const value of [null,{},7,{...state,object:99},{...state,transitionCounter:-1},
    {...state,displayedPose:{...state.displayedPose,from:999}}])
    assert.equal(validAngelPresentation(value),false)
  for(let i=0;i<12;i++){
    requestAngelModel(state,i<7?62:69);stepAngelPresentation(state)
    assert.equal(validAngelPresentation(state),true)
  }
})


test('incomplete override rejects invalid timers before a renderer can consume them', () => {
  const state = createAngelPresentation()
  requestAngelModel(state, 62)
  for (const morphTimer of [-4, -1, 8, 32768, -32769])
    assert.equal(validAngelPresentation({...state, morphTimer}), false, String(morphTimer))
  for (const morphTimer of [0, 4, 7]) {
    const valid = {...state, morphTimer}
    assert.equal(validAngelPresentation(valid), true)
    stepAngelPresentation(valid)
    assert.doesNotThrow(() => angelPoseRawPoints(valid.displayedPose))
  }
  const completed = {...state, renderFlags: state.renderFlags | 0x400, morphTimer: -32768}
  assert.equal(validAngelPresentation(completed), true, 'Completed native timer may wrap')
  stepAngelPresentation(completed)
  assert.equal(completed.displayedPose.numerator, 2)
  assert.doesNotThrow(() => angelPoseRawPoints(completed.displayedPose))
})
