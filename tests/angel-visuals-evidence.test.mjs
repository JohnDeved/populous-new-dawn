import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { createAngelVisualFixture } from '../scripts/tutorial-browser/angel-visuals-fixture.mjs'
import { checkpointCodec } from '../scripts/tutorial-browser/checkpoint-codec.mjs'
import { angelPosePositions } from '../app/angel-presentation.ts'
import { advanceGame } from '../app/game-clock.ts'
import { angelAttributeChecksum, expectedAngelUV, validateAngelObservation, retainedAngelCrop } from '../scripts/tutorial-browser/angel-visuals-evidence.mjs'
import { installAngelVisualObserver } from '../scripts/tutorial-browser/angel-visuals-observer.mjs'
const source = { commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() }
function observation(segment) {
  const f = createAngelVisualFixture(source), w = checkpointCodec(f.expected, true)
  const r = { segment, error: null, done: true, sceneWorldMatched: true, worldReplaced: segment === 'running',
    retention: { done: true }, visits: 100, samples: [], crops: [], contextFrames: [], resources: [], terminal: { reason: segment === 'paused' ? 'paused-transition' : 'ordinary-expiry' },
    cleanup: { effectsRemoved: true, groupsRemoved: true, allOwnedDetached: true, disposed: { geometry: 8, material: 8, texture: 0 }, neighbourSubmitted: true, neighbourAtlasUnchanged: true } }
  for (const [owner,id] of f.receipt.ids.entries()) for (const base of [62,69])
    r.resources.push({ id, owner, base, bank: 2, geometry: `${id}:${base}`, material: `${id}:${base}`, neighbourSharesAtlas: true, materialColor: [1,1,1], atlasUrl: 'http://127.0.0.1/original/atlas.png', ...expectedAngelUV(base,owner) })
  const append = () => {
    for (const [owner,id] of f.receipt.ids.entries()) {
      const e=w.effects.find(e=>e.id===id); if(!e) continue
      const pose=e.angel.presentation.displayed, positions=angelPosePositions(pose)
      r.samples.push({ rafTimestamp:r.samples.length+1,sceneTimestamp:r.samples.length+1,id,owner,base:pose.base,pose:structuredClone(pose),presentation:structuredClone(e.angel.presentation),
        turn:w.turn,stamp:r.samples.length+1,phase:e.angel.phase,timer:e.angel.timer,paused:segment==='paused',
        height:e.height,groupY:Math.round(e.height*45)/128,nativeTilt:0,nativeRoll:0,visible:true,submitted:true,
        scale:pose.scale,shaderScale:pose.scale,positionCount:positions.length,positionChecksum:angelAttributeChecksum(positions),...(r.samples.length < 4 ? {positions:[...positions]} : {}),bounds:{x:20,y:20,width:40,height:40} })
    }
  }
  append()
  if(segment==='running') {
    w.paused=false; const clock={animationTime:0,animationFrame:0}
    for(let i=0;i<188;i++){advanceGame(w,clock,1/24);append()}
  }
  for(const [owner,id] of f.receipt.ids.entries()) {
    const labels=segment==='paused'?['paused-transition']:['transition','base-62','base-69',...(owner===0?['death-large','death-small']:[])]
    const labelOf=s=>segment==='paused'?'paused-transition':s.pose.to>=76?'transition':s.phase==='dying'?s.scale>80?'death-large':'death-small':`base-${s.base}`
    for(const label of labels){
      const sample=r.samples.find(s=>s.id===id&&labelOf(s)===label), filename=`angel-${segment}-${r.crops.length}.png`
      sample.cropFile=filename; sample.positions=[...angelPosePositions(sample.pose)]
      r.crops.push({filename,label,id,stamp:sample.stamp,turn:sample.turn,pose:sample.pose,bounds:sample.bounds,
        canvasOwned:true,overlays:[],clip:{width:56,height:56},opaqueColors:10,sha256:'a'.repeat(64),pixelChecksum:'body'})
    }
    if(segment==='running')r.crops.push({filename:`angel-${segment}-${r.crops.length}.png`,label:'cleared-footprint',id,cleared:true,canvasOwned:true,
      overlays:[],clip:{width:56,height:56},opaqueColors:5,sha256:'b'.repeat(64),pixelChecksum:'clear'})
  }
  if(segment==='running')for(const label of ['loop','death']) {
    const sample=r.samples.find(s=>s.owner===0&&(label==='loop'?s.base===62&&s.pose.to<76:s.phase==='dying'&&s.scale<=80))
    r.contextFrames.push({filename:`angel-${label}-context.png`,label,id:sample.id,stamp:sample.stamp,turn:sample.turn,pose:sample.pose,fullCanvas:true,
      clip:{x:0,y:0,width:1440,height:1000},opaqueColors:16,sha256:'a'.repeat(64),pixelChecksum:'context'})
  }
  return {r,fixture:f.receipt}
}
test('evidence independently reconstructs source geometry and owner UV tiles, never accepts metadata alone', () => {
  for(const segment of ['paused','running']) {
    const {r,fixture}=observation(segment)
    assert.equal(validateAngelObservation(r,fixture,segment),true)
    for(const mutate of [
      r=>{r.samples[0].positionChecksum='00000000'},r=>{r.samples[0].positions[0]+=1},
      r=>{r.resources[0].materialColor=[1,0,0]},r=>{r.resources[0].atlasUrl='wrong.png'},r=>{r.resources[0].uv[0]+=.125},r=>{r.resources[0].tiles[0]++},r=>{r.resources[0].neighbourSharesAtlas=false},
      r=>{r.samples[0].shaderScale=159},r=>{r.samples[0].groupY+=1},r=>{r.samples[0].submitted=false},
      r=>{r.samples[0].nativeTilt=1},r=>{r.resources[1].geometry=r.resources[0].geometry},
      r=>{r.crops[0].stamp++},r=>{r.crops[0].pose.frame++},r=>{r.crops[0].opaqueColors=1},
      r=>{r.crops[0].canvasOwned=false},r=>{r.crops[0].overlays.push({})},r=>{r.crops[0].sha256=''},
      r=>{r.retention.done=false},r=>{r.error='bad'},r=>{r.samples=[]},r=>{r.resources.pop()},
    ]) {const bad=structuredClone(r);mutate(bad);assert.throws(()=>validateAngelObservation(bad,fixture,segment))}
  }
})
test('running observation must retain both bases, death, actual world replacement and complete atlas-safe disposal', () => {
  const {r,fixture}=observation('running')
  for(const mutate of [r=>{r.worldReplaced=false},r=>{r.cleanup.groupsRemoved=false},r=>{r.cleanup.allOwnedDetached=false},
    r=>{r.cleanup.disposed.texture=1},r=>{r.cleanup.disposed.geometry=7},r=>{r.cleanup.neighbourSubmitted=false},
    r=>{r.cleanup.neighbourAtlasUnchanged=false},r=>{r.crops.find(c=>c.cleared).pixelChecksum='body'},
    r=>{r.samples=r.samples.filter(s=>s.pose.base!==62)},r=>{r.samples=r.samples.filter(s=>s.phase!=='dying')},
    r=>{r.crops=r.crops.filter(c=>!c.cleared)}]){
    const bad=structuredClone(r);mutate(bad);assert.throws(()=>validateAngelObservation(bad,fixture,'running'))
  }
})
test('PNG retention rejects malformed signature and dimensions rather than trusting screenshot filenames', () => {
  const bytes=Buffer.alloc(100);Buffer.from('89504e470d0a1a0a','hex').copy(bytes);bytes.writeUInt32BE(40,16);bytes.writeUInt32BE(30,20)
  const crop={png:`data:image/png;base64,${bytes.toString('base64')}`,clip:{width:40,height:30}}
  assert.equal(retainedAngelCrop(crop).bytes.length,100)
  assert.throws(()=>retainedAngelCrop({...crop,clip:{width:41,height:30}}))
  assert.throws(()=>retainedAngelCrop({...crop,png:'data:image/png;base64,AA=='}))
})
test('observer source is self-contained and does not tick/render/replace callbacks or encode PNG inside its RAF visit', () => {
  const source=installAngelVisualObserver.toString()
  assert.doesNotThrow(()=>Function(`return (${source})`)())
  for(const forbidden of [/\.render\(/,/advanceGame\(/,/\.tick\(/,/\.onBeforeRender\s*=/,/world\.[a-zA-Z]+\s*=/,/\.toDataURL\([^)]*\)[\s\S]*const retain/])
    assert.doesNotMatch(source,forbidden)
  assert.match(source,/context\.drawImage\(canvas/)
  assert.match(source,/const retain =/)
  const visit=source.slice(source.indexOf('const visit ='))
  assert.doesNotMatch(visit,/toDataURL|getImageData/)
  assert.match(visit,/scene\.picking\.model/)
})
test('every required owner/base/death crop must identify its first eligible sample', () => {
  const {r,fixture}=observation('running')
  for (const crop of r.crops.filter(c=>!c.cleared)) {
    const missing=structuredClone(r)
    missing.crops=missing.crops.filter(c=>c.filename!==crop.filename)
    assert.throws(()=>validateAngelObservation(missing,fixture,'running'),crop.label)
    const substituted=structuredClone(r), target=substituted.crops.find(c=>c.filename===crop.filename)
    target.id=fixture.ids[(fixture.ids.indexOf(crop.id)+1)%4]
    assert.throws(()=>validateAngelObservation(substituted,fixture,'running'))
    const later=structuredClone(r), first=later.samples.find(s=>s.cropFile===crop.filename)
    delete first.cropFile
    const replacement={...structuredClone(first),stamp:first.stamp+0.5,cropFile:crop.filename}
    later.samples.push(replacement)
    later.crops.find(c=>c.filename===crop.filename).stamp=replacement.stamp
    assert.throws(()=>validateAngelObservation(later,fixture,'running'))
  }
})
