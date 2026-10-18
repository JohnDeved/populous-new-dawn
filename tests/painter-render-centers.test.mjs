import assert from 'node:assert/strict'
import test from 'node:test'
import { registerHooks } from 'node:module'
import { pathToFileURL } from 'node:url'
import { readFileSync } from 'node:fs'
import * as THREE from 'three'
import { Painter } from '../app/painter.ts'
import { RenderView } from '../app/render-view.ts'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

let ReferencePainter = Painter
if (process.env.PND_PAINTER_BASELINE) {
  const url=pathToFileURL(process.env.PND_PAINTER_BASELINE).href
  const hook=registerHooks({resolve(specifier,context,next){
    if(context.parentURL===url && specifier.startsWith('.'))return next(new URL(specifier,new URL('../app/painter.ts',import.meta.url)).href,context)
    if(context.parentURL===url && specifier==='three')return {url:import.meta.resolve('three'),shortCircuit:true}
    return next(specifier,context)
  }})
  try {ReferencePainter=(await import(url)).Painter} finally {hook.deregister()}
}
const renderer={setTransparentSort(){}}
const snapshot = painter => ({commands:painter.commandsBySlot.map(c=>c?{...c}:null),depths:Array.from(painter.texture.image.data)})

async function fixture() {
  const api=await loadSceneFixture(),world=api.createWorld(2),view=new RenderView()
  const {rebuildTerrain,updateWater,landIndex}=await import('../app/scene-terrain-runtime.ts')
  const terrain=new THREE.InstancedMesh(new THREE.BufferGeometry(),new THREE.MeshBasicMaterial(),9)
  Object.assign(terrain.userData,{painterGround:true,terrainGrid:true,nativeRelative:true})
  const owner={world,terrain,view,decorations:new THREE.Group(),updateView(){},waves:new Uint8Array(readFileSync(new URL('../public/original/waves.bin',import.meta.url)))}
  owner.landIndex=(x,z)=>landIndex(owner,x,z)
  rebuildTerrain(owner)
  const scene=new THREE.Scene();scene.add(terrain)
  view.update(640,480,{x:0,z:0},0,0,false)
  view.prepare(scene);view.updateTerrainVisibility(terrain);scene.updateMatrixWorld(true)
  const oracle=new ReferencePainter(view)
  // Default test execution still checks the preserved public snapshot path.
  if(ReferencePainter===Painter)oracle.triangleCenters=function(p){return Painter.prototype.triangleCenters.call(this,p)}
  function frame(){view.painter.update(scene,renderer);oracle.update(scene,renderer);assert.deepEqual(snapshot(view.painter),snapshot(oracle))}
  function close(){view.dispose();oracle.texture.dispose();terrain.geometry.dispose();terrain.material.dispose()}
  return {view,world,terrain,owner,scene,oracle,frame,close,water:updateWater,rebuild:rebuildTerrain}
}

test('render center storage reuses one backing buffer across real water while public snapshots remain owned',async()=>{
 const f=await fixture()
 try {
  f.frame() // first texture growth deliberately disables scratch for this pass
  f.frame()
  const painter=f.view.painter,position=f.terrain.geometry.attributes.position
  const first=painter.renderCenters.entries.get(f.terrain.geometry).positions
  assert.equal(first.array.byteLength,786432)
  const external=painter.triangleCenters(position),saved=external.array.slice()
  let changed=false
  for(const turn of [23,256,511]){
   f.world.turn=turn;f.water(f.owner)
   const Float64=globalThis.Float64Array
   let allocations=0
   globalThis.Float64Array=class extends Float64 {
    constructor(...args){super(...args);if(args[0]===position.count)allocations++}
   }
   try {
    painter.update(f.scene,renderer);assert.equal(allocations,0,'warm render allocates no new center backing array')
    f.oracle.update(f.scene,renderer);assert.equal(allocations,1,'baseline allocates one center array per water refresh')
    assert.deepEqual(snapshot(painter),snapshot(f.oracle))
   } finally {globalThis.Float64Array=Float64}
   const next=painter.renderCenters.entries.get(f.terrain.geometry).positions
   assert.equal(next,first);assert.equal(next.array,first.array)
   changed ||= next.array.some((value,i)=>value!==saved[i])
   assert.deepEqual(external.array,saved)
  }
  assert.ok(changed)
  const replacement=position.clone();f.terrain.geometry.setAttribute('position',replacement);f.frame()
  assert.notEqual(painter.renderCenters.entries.get(f.terrain.geometry).positions,first)
  const stable=painter.renderCenters.entries.get(f.terrain.geometry).positions
  f.view.update(640,480,{x:0,z:0},Math.PI/2,0,false)
  f.view.updateTerrainVisibility(f.terrain);f.frame()
  assert.equal(painter.renderCenters.entries.get(f.terrain.geometry).positions,stable)
  f.view.update(640,480,{x:127,z:127},Math.PI/2,0,false)
  f.view.updateTerrainVisibility(f.terrain);f.frame()
  assert.equal(painter.renderCenters.entries.has(f.terrain.geometry),false,'texture growth clears scratch for its current pass')
  f.frame()
  assert.notEqual(painter.renderCenters.entries.get(f.terrain.geometry).positions,stable)
  const beforeDispose=painter.renderCenters.entries.get(f.terrain.geometry).positions
  f.terrain.geometry.dispose();assert.equal(painter.renderCenters.entries.has(f.terrain.geometry),false)
  f.frame();assert.notEqual(painter.renderCenters.entries.get(f.terrain.geometry).positions,beforeDispose)
  const oldGeometry=f.terrain.geometry
  const rebuildBuffer=painter.renderCenters.entries.get(oldGeometry).positions
  f.rebuild(f.owner);f.view.prepare(f.scene);f.view.updateTerrainVisibility(f.terrain);f.frame()
  assert.equal(f.terrain.geometry,oldGeometry)
  assert.equal(painter.renderCenters.entries.get(f.terrain.geometry).positions,rebuildBuffer)
  oldGeometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0],3))
  f.rebuild(f.owner);f.view.prepare(f.scene);f.view.updateTerrainVisibility(f.terrain);f.frame()
  assert.notEqual(f.terrain.geometry,oldGeometry)
  assert.notEqual(painter.renderCenters.entries.get(f.terrain.geometry).positions,rebuildBuffer)
  painter.texture.dispose();assert.equal(painter.renderCenters.entries.has(f.terrain.geometry),false)
 }finally{f.close()}
})

test('custom center helper and nested updates use snapshot path',async()=>{
 const f=await fixture()
 try{
  f.frame();f.frame()
  const painter=f.view.painter,original=painter.triangleCenters
  let calls=0
  painter.triangleCenters=function(p){calls++;return original.call(this,p)}
  f.frame();assert.ok(calls>0)
  assert.equal(painter.renderCenters.entries.has(f.terrain.geometry),false)
  painter.triangleCenters=original
  f.frame()
  const buffer=painter.renderCenters.entries.get(f.terrain.geometry).positions
  const visible=f.view.visible
  const outerPosition=f.terrain.geometry.attributes.position
  const nestedPosition=new THREE.BufferAttribute(outerPosition.array.slice(),3)
  let nested=false
  f.view.visible=function(...args){
   if(!nested){
    nested=true;f.terrain.geometry.setAttribute('position',nestedPosition)
    try{painter.update(f.scene,renderer);assert.equal(painter.renderCenters.entries.get(f.terrain.geometry).positions,buffer)}
    finally{f.terrain.geometry.setAttribute('position',outerPosition)}
   }
   return visible.apply(this,args)
  }
  f.frame();assert.ok(nested)
  assert.equal(painter.renderCenters.entries.get(f.terrain.geometry).positions,buffer)
  assert.equal(painter.updateDepth,0)
 }finally{f.close()}
})


test('count/layout changes, canonical method replacement and failed fills invalidate safely',async()=>{
 const f=await fixture()
 try{
  f.frame();f.frame()
  const painter=f.view.painter,geometry=f.terrain.geometry,position=geometry.attributes.position
  const old=painter.renderCenters.entries.get(geometry).positions
  const getX=THREE.BufferAttribute.prototype.getX
  THREE.BufferAttribute.prototype.getX=function(i){return getX.call(this,i)}
  try{position.needsUpdate=true;f.frame();assert.equal(painter.renderCenters.entries.has(geometry),false)}
  finally{THREE.BufferAttribute.prototype.getX=getX}
  f.frame()
  const small=new THREE.Float32BufferAttribute([0,0,0,1,0,0,0,0,1],3)
  const compact=painter.renderCenters.get(geometry,small)
  assert.notEqual(compact,old);assert.equal(compact.array.length,3)
  const replacement=small.array.slice();small.array=replacement
  assert.notEqual(painter.renderCenters.get(geometry,small),compact)
  small.setY(0,8);small.needsUpdate=true
  const from=THREE.Vector3.prototype.fromBufferAttribute
  THREE.Vector3.prototype.fromBufferAttribute=function(){throw new Error('fill failure')}
  try{assert.throws(()=>painter.renderCenters.get(geometry,small),/fill failure/)}
  finally{THREE.Vector3.prototype.fromBufferAttribute=from}
  assert.ok(Number.isNaN(painter.renderCenters.entries.get(geometry).version))
  assert.deepEqual(painter.renderCenters.get(geometry,small).array,painter.triangleCenters(small).array)
 }finally{f.close()}
})


test('outer canonical-to-custom attribute replacement releases only its private buffer',async()=>{
 const f=await fixture()
 try{
  f.frame();f.frame()
  const painter=f.view.painter,geometry=f.terrain.geometry,canonical=geometry.attributes.position
  const buffer=painter.renderCenters.entries.get(geometry).positions
  const custom=new THREE.BufferAttribute(canonical.array.slice(),3)
  geometry.setAttribute('position',custom)
  f.frame()
  assert.equal(painter.renderCenters.entries.has(geometry),false)
  geometry.setAttribute('position',canonical);f.frame()
  assert.notEqual(painter.renderCenters.entries.get(geometry).positions,buffer)
 }finally{f.close()}
})
