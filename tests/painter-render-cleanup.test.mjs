import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { Painter } from '../app/painter.ts'

function fixture(){
 const painter=new Painter({}),mesh=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.MeshBasicMaterial()),scene=new THREE.Scene(),camera=new THREE.Camera()
 const material=mesh.material,groups=mesh.geometry.groups
 function prepare(){painter.transparentMeshes.push({mesh,material:mesh.material,groups:mesh.geometry.groups});mesh.material=[material];mesh.geometry.groups=[{start:0,count:3,materialIndex:0}]}
 return {painter,mesh,scene,camera,material,groups,prepare,close(){painter.texture.dispose();mesh.geometry.dispose();material.dispose()}}
}
test('render lease cleans a thrown render without invoking scene callbacks again',()=>{
 const f=fixture(),error=new Error('render failure');let after=0
 f.scene.onAfterRender=()=>{after++;f.painter.afterRender()}
 try{
  assert.throws(()=>f.painter.render({render(){f.prepare();throw error}},f.scene,f.camera),e=>e===error)
  assert.strictEqual(f.mesh.material,f.material);assert.strictEqual(f.mesh.geometry.groups,f.groups)
  assert.equal(after,0);assert.equal(f.painter.transparentMeshes.length,0)
 }finally{f.close()}
})
test('normal callback cleanup and finally cleanup are idempotent',()=>{
 const f=fixture();let callbacks=0,groupWrites=0;const original=f.mesh.geometry.groups
 Object.defineProperty(f.mesh.geometry,'groups',{configurable:true,get(){return this._groups??original},set(value){groupWrites++;this._groups=value}})
 f.scene.onAfterRender=()=>{callbacks++;f.painter.afterRender()}
 try{
  f.painter.render({render(){f.prepare();f.scene.onAfterRender()}},f.scene,f.camera)
  assert.equal(callbacks,1);assert.equal(groupWrites,2,'one preparation write, one restoration write')
  assert.strictEqual(f.mesh.geometry.groups,f.groups);assert.strictEqual(f.mesh.material,f.material)
 }finally{f.close()}
})
test('nested normal and throwing renders restore only their own lease',()=>{
 const f=fixture();let callbacks=0
 f.scene.onAfterRender=()=>{callbacks++;f.painter.afterRender()}
 try{
  f.painter.render({render(){
   f.prepare();const outerGroups=f.mesh.geometry.groups,outerMaterial=f.mesh.material
   for(const throws of [false,true]){
    const inner={render(){f.prepare();if(throws)throw new Error('inner');f.scene.onAfterRender()}}
    if(throws)assert.throws(()=>f.painter.render(inner,f.scene,f.camera),/inner/)
    else f.painter.render(inner,f.scene,f.camera)
    assert.strictEqual(f.mesh.geometry.groups,outerGroups);assert.strictEqual(f.mesh.material,outerMaterial)
    assert.equal(f.painter.transparentMeshes.length,1)
   }
   f.scene.onAfterRender()
  }},f.scene,f.camera)
  assert.equal(callbacks,2);assert.equal(f.painter.transparentMeshes.length,0)
  assert.strictEqual(f.mesh.geometry.groups,f.groups);assert.strictEqual(f.mesh.material,f.material)
 }finally{f.close()}
})

// Execute the shipped call-site bodies with boundary stubs, matching the existing
// frame-performance test technique. User callbacks are not replaced by cleanup.
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import vm from 'node:vm'
for(const mode of ['live','modal'])test(`${mode} shipped render call restores on throw`,()=>{
 const f=fixture(),error=new Error(`${mode} renderer failure`);let remembered=0,scheduled=0
 const renderer={getPixelRatio:()=>1,render(){f.prepare();throw error}}
 try{
  if(mode==='live'){
   const source=readFileSync(new URL('../app/scene-entities.ts',import.meta.url),'utf8')
   const body=source.slice(source.indexOf('export function renderSceneFrame(')).replace('export function','function')
   const render=vm.runInNewContext(stripTypeScriptTypes(`${body};renderSceneFrame`),{updateModelLighting(){}})
   const owner={scene:f.scene,camera:f.camera,renderer,world:{land:{flags:new Uint32Array()},objectCells:{}},view:{painter:f.painter,prepare(){}},worshipPresentation:{rememberBodies(){remembered++}}}
   assert.throws(()=>render(owner,null,undefined),e=>e===error)
  }else{
   const source=readFileSync(new URL('../app/scene.ts',import.meta.url),'utf8')
   const body=source.slice(source.indexOf('  animate = (now:'),source.indexOf('  private updateTerrainFrame()'))
   const owner=vm.runInNewContext(stripTypeScriptTypes(`new (class {${body}})()`),{sceneTextureRevision:()=>0,document:{hidden:true},devicePixelRatio:1,requestAnimationFrame(){scheduled++}})
   Object.assign(owner,{isCurrent:()=>true,renderer,view:{painter:f.painter},scene:f.scene,camera:f.camera,modalSuspended:true})
   assert.throws(()=>owner.animate(10),e=>e===error)
  }
  assert.strictEqual(f.mesh.geometry.groups,f.groups);assert.strictEqual(f.mesh.material,f.material)
  assert.equal(f.painter.transparentMeshes.length,0);assert.equal(remembered,0);assert.equal(scheduled,0)
 }finally{f.close()}
})
