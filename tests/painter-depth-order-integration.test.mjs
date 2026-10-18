import assert from 'node:assert/strict'
import test from 'node:test'
import { registerHooks } from 'node:module'
import { pathToFileURL } from 'node:url'
import * as THREE from 'three'
import { Painter } from '../app/painter.ts'
import { RenderView } from '../app/render-view.ts'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
let ReferencePainter=Painter
if(process.env.PND_PAINTER_BASELINE){
 const url=pathToFileURL(process.env.PND_PAINTER_BASELINE).href
 const hook=registerHooks({resolve(specifier,context,next){
  if(context.parentURL===url&&specifier.startsWith('.'))return next(new URL(specifier,new URL('../app/painter.ts',import.meta.url)).href,context)
  if(context.parentURL===url&&specifier==='three')return {url:import.meta.resolve('three'),shortCircuit:true}
  return next(specifier,context)
 }})
 try{ReferencePainter=(await import(url)).Painter}finally{hook.deregister()}
}

test('actual Painter retains exact global transparent interleaving, depths and groups',async()=>{
 await loadSceneFixture()
 const view=new RenderView(),scene=new THREE.Scene(),objects=[],oracle=new ReferencePainter(view)
 if(ReferencePainter===Painter)oracle.depthOrder.sort=commands=>commands.sort((a,b)=>b.bucket-a.bucket||b.order-a.order)
 view.update(640,480,{x:0,z:0},0,0,false)
 view.visible=()=>true
 const add=(object)=>{
  const group=new THREE.Group();group.userData.point={id:objects.length+1};group.add(object);scene.add(group)
  view.materials.set(object.material,{});objects.push(object);return object
 }
 const mesh=(count,alpha)=>{
  const geometry=new THREE.BufferGeometry(),values=new Float32Array(count*9)
  for(let i=0;i<count;i++)values.set([0,0,0,1,0,0,0,1,0],i*9)
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(values,3))
  return add(new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({transparent:alpha})))
 }
 const first=mesh(2500,true),second=mesh(2500,true)
 for(const [n,object] of [first,second].entries())object.userData.selectionCommands=Array.from({length:2500},(_,i)=>({bucket:(i*31+n)%3585,order:i}))
 mesh(12,true);mesh(4,false);add(new THREE.Sprite(new THREE.SpriteMaterial({transparent:true})))
 scene.updateMatrixWorld(true)
 const snapshot=painter=>{
  let sort
  painter.update(scene,{setTransparentSort(value){sort=value}})
  const items=objects.flatMap(object=>object.geometry.groups.map((group,i)=>({object,group,groupOrder:0,renderOrder:0,z:0,id:object.id*10000+i})))
  // Explicit sprite render item must interleave with mesh triangle groups.
  items.push({object:objects.at(-1),group:null,groupOrder:0,renderOrder:0,z:0,id:99999999})
  const output={commands:painter.commandsBySlot.map(c=>c&&{...c}),depths:Array.from(painter.texture.image.data),
   groups:objects.map(object=>object.geometry.groups.map(group=>({...group}))),
   indices:objects.map(object=>object.geometry.index?Array.from(object.geometry.index.array):null),
   transparentOrder:items.sort(sort).map(item=>[item.object.id,item.group?.start??null])}
  painter.afterRender();return output
 }
 try{
  for(const angle of [0,Math.PI/2,Math.PI]){
   view.update(640,480,{x:0,z:0},angle,0,false)
   assert.deepEqual(snapshot(view.painter),snapshot(oracle))
   assert.ok(view.painter.depthOrder.counts)
   assert.ok(view.painter.depthOrder.scratch.every(x=>x===undefined))
  }
  first.userData.selectionCommands[0].bucket=4000
  assert.deepEqual(snapshot(view.painter),snapshot(oracle))
  view.painter.texture.dispose();assert.equal(view.painter.depthOrder.counts,undefined)
 }finally{
  view.painter.afterRender();oracle.afterRender();view.dispose();oracle.texture.dispose()
  objects.forEach(object=>{object.geometry.dispose();object.material.dispose()})
 }
})
