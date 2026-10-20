import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { createAngelVisualFixture } from '../scripts/tutorial-browser/angel-visuals-fixture.mjs'
import { checkpointCodec } from '../scripts/tutorial-browser/checkpoint-codec.mjs'
import { installAngelVisualObserver } from '../scripts/tutorial-browser/angel-visuals-observer.mjs'
import { expectedAngelUV, retainedAngelCrop, validateAngelObservation } from '../scripts/tutorial-browser/angel-visuals-evidence.mjs'
import { advanceGame } from '../app/game-clock.ts'
import { angelPosePositions } from '../app/angel-presentation.ts'
const source={commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()}
function eventObject(uuid) {
  const listeners=new Set()
  return {uuid, listeners, addEventListener(_name,fn){listeners.add(fn)},removeEventListener(_name,fn){listeners.delete(fn)},dispose(){for(const fn of listeners)fn()}}
}
// Synthetic DOM/GPU seam tests observer ownership/order only, not rendered proof.
function fixture(segment) {
  const f=createAngelVisualFixture(source), world=checkpointCodec(f.expected,true), clock={animationTime:0,animationFrame:0}
  let activeWorld=segment==='running'?{}:world, nextId=0, reads=0, encodes=0, draws=0
  const callbacks=new Map(), copies=[], originals=new Map(), canvas={width:1440,height:1000,isConnected:true,
    getBoundingClientRect:()=>({left:0,top:0,width:1440,height:1000})}
  const texture={...eventObject('atlas'),image:{src:'http://127.0.0.1/original/atlas.png'}}
  const scene={world,previous:1,renderer:{domElement:canvas,info:{render:{frame:1}}},gameClock:clock,fxMeshes:new Map(),decorations:{children:[]},
    view:{painter:{source:()=>({})}},picking:{model:()=>[{kind:'bounds',bounds:{x:30,y:30,width:40,height:40}}]}}
  scene.decorations.children.push({userData:{point:{id:f.receipt.neighbourId}},children:[{isMesh:true,userData:{nativeModel:0},material:{map:texture}}]})
  for(const [owner,id]of f.receipt.ids.entries()) {
    const group={children:[],userData:{nativeTilt:0,nativeRoll:0},position:{y:0},parent:{},visible:true}
    for(const base of [62,69]) {
      const expected=expectedAngelUV(base,owner), attrs={position:{array:new Float32Array(1413)},uv:{array:new Float32Array(expected.uv)}}
      group.children.push({isMesh:true,parent:group,visible:false,userData:{nativeModel:base,nativeSize:160,nativeResource:{bank:2,data:{tiles:expected.tiles}}},
        geometry:{...eventObject(`${id}-${base}`),getAttribute:name=>attrs[name]},
        material:{...eventObject(`${id}-${base}`),map:texture,color:{toArray:()=>[1,1,1]},userData:{nativeUniforms:{nativeObjectScale:{value:160}}}}})
    }
    scene.fxMeshes.set(id,group)
  }
  const install=(name,value)=>{originals.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value})}
  install('window',{testStore:{getWorld:()=>activeWorld},testSceneRef:{current:scene}})
  install('requestAnimationFrame',fn=>{const id=++nextId;callbacks.set(id,fn);return id})
  install('cancelAnimationFrame',id=>callbacks.delete(id))
  install('document',{visibilityState:'visible',querySelector:()=>null,querySelectorAll:()=>[],elementFromPoint:()=>canvas,
    createElement:()=>{const copy={width:0,height:0,getContext:()=>({drawImage:()=>{draws++},getImageData:()=>{reads++;return{data:new Uint8ClampedArray(Array.from({length:80},(_,i)=>i))}}}),
      toDataURL:()=>{encodes++;const bytes=Buffer.alloc(100);Buffer.from('89504e470d0a1a0a','hex').copy(bytes);bytes.writeUInt32BE(copy.width,16);bytes.writeUInt32BE(copy.height,20);return`data:image/png;base64,${bytes.toString('base64')}`}}
      copies.push(copy);return copy}})
  const render=()=>{
    scene.renderer.info.render.frame++;scene.previous=scene.renderer.info.render.frame
    for(const id of f.receipt.ids){
      const effect=world.effects.find(e=>e.id===id),group=scene.fxMeshes.get(id)
      if(!effect){if(group){for(const mesh of group.children){mesh.geometry.dispose();mesh.material.dispose()}group.parent=null;scene.fxMeshes.delete(id)}continue}
      const pose=effect.angel.presentation.displayed;group.position.y=Math.round(effect.height*45)/128
      for(const mesh of group.children){mesh.visible=mesh.userData.nativeModel===pose.base;mesh.userData.nativeSize=pose.scale
        mesh.material.userData.nativeUniforms.nativeObjectScale.value=pose.scale
        if(mesh.visible)mesh.geometry.getAttribute('position').array.set(angelPosePositions(pose))}
    }
  }
  return {f,world,scene,clock,texture,copies,counts:()=>({reads,encodes,draws}),start(){
    installAngelVisualObserver({...f.receipt,segment,waitForReplacement:segment==='running'});activeWorld=world;world.paused=segment==='paused';render()},
    visit(timestamp=scene.previous){const queue=[...callbacks.values()];callbacks.clear();for(const fn of queue)fn(timestamp)},render,
    restore(){for(const[name,value]of originals){if(value)Object.defineProperty(globalThis,name,value);else delete globalThis[name]}}}
}
test('paused observer reads actual arrays and snapshots same callback; encoding waits for retain and copies are released',()=>{
  const f=fixture('paused')
  try{
    const before=structuredClone(f.world);f.start();f.visit()
    const observer=window.__pndAngelObservation
    assert.equal(observer.result.error,null);assert.equal(observer.result.done,true)
    assert.deepEqual(f.counts(),{reads:0,encodes:0,draws:4});assert.deepEqual(f.world,before)
    const r=observer.retain()
    for(const crop of r.crops){crop.sha256=retainedAngelCrop(crop).sha256;delete crop.png}
    assert.equal(validateAngelObservation(r,f.f.receipt,'paused'),true)
    assert.deepEqual(f.counts(),{reads:4,encodes:4,draws:4});assert.ok(f.copies.every(c=>c.width===0&&c.height===0))
    observer.retain();assert.equal(f.counts().encodes,4);assert.equal(f.texture.listeners.size,0)
  }finally{f.restore()}
})
test('ordinary expiry observer sees disposed instances and preserves shared texture listeners until terminal frame',()=>{
  const f=fixture('running')
  try{
    f.start();f.visit()
    for(let frame=0;frame<188&&!window.__pndAngelObservation.result.done;frame++){
      advanceGame(f.world,f.clock,1/24);f.render();f.visit()
    }
    const r=window.__pndAngelObservation.result
    assert.equal(r.error,null);assert.equal(r.terminal.reason,'ordinary-expiry');assert.equal(r.worldReplaced,true)
    assert.deepEqual(r.cleanup.disposed,{geometry:8,material:8,texture:0});assert.equal(r.cleanup.allOwnedDetached,true)
    assert.equal(r.cleanup.groupsRemoved,true);assert.equal(r.crops.filter(c=>c.cleared).length,4)
    assert.ok(r.crops.length<=20);assert.equal(f.counts().encodes,0)
    window.__pndAngelObservation.retain();assert.equal(f.texture.listeners.size,0)
  }finally{f.restore()}
})
test('first crop slot fails immediately on occlusion; it cannot be replaced with a later convenient frame',()=>{
  const f=fixture('paused')
  try{f.start();document.elementFromPoint=()=>({tagName:'DIALOG'});f.visit()
    const r=window.__pndAngelObservation.result;assert.equal(r.done,true);assert.match(r.error,/obscured/);assert.equal(r.crops.length,0)
    document.elementFromPoint=()=>f.scene.renderer.domElement;f.visit();assert.equal(r.crops.length,0)
  }finally{f.restore()}
})

test('observer before Scene RAF defers without copying stale canvas pixels', async()=>{
  const f=fixture('paused')
  try {
    f.start(); f.visit(f.scene.previous+1)
    assert.equal(window.__pndAngelObservation.result.orderingDeferrals,1)
    assert.equal(window.__pndAngelObservation.result.samples.length,0)
    assert.equal(f.counts().draws,0)
    await new Promise(resolve=>setTimeout(resolve,5))
    f.render(); f.visit()
    const r=window.__pndAngelObservation.result
    assert.equal(r.done,true); assert.equal(r.error,null)
    assert.ok(r.samples.every(s=>s.rafTimestamp===s.sceneTimestamp))
  } finally { f.restore() }
})
