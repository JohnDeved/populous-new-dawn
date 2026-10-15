import assert from 'node:assert/strict'
import test from 'node:test'
import {SelectorRenderer} from '../app/world-selector-renderer.ts'
import {SelectorMotion} from '../app/world-selector-motion.ts'
function fixture(failure){
 const calls=[],images=[];let handle=0
 const constants=new Map()
 const gl=new Proxy({}, {get(_,name){
  if(String(name)===String(name).toUpperCase()){
   if(!constants.has(name))constants.set(name,constants.size+1)
   return constants.get(name)
  }
  return (...args)=>{
   calls.push([name,...args.map(arg=>ArrayBuffer.isView(arg)?arg.slice():arg)])
   if(name===failure)return null
   if(name==='getShaderParameter'&&failure==='compile')return false
   if(name==='getProgramParameter'&&failure==='link')return false
   if(String(name).startsWith('create'))return {id:++handle}
   if(name==='getShaderParameter'||name==='getProgramParameter')return true
   if(name==='getAttribLocation')return 0
   if(name==='getUniformLocation')return {id:++handle}
  }
 }})
 const canvas={width:0,height:0,getContext:()=>gl,getBoundingClientRect:()=>({width:640,height:480})}
 const previousImage=globalThis.Image,previousWindow=globalThis.window
 globalThis.Image=class{constructor(){images.push(this)} naturalWidth=128;naturalHeight=128;onload=null;onerror=null;src=''}
 globalThis.window={devicePixelRatio:2}
 const cleanup=()=>{globalThis.Image=previousImage;globalThis.window=previousWindow}
 return {gl,canvas,calls,images,cleanup}
}
test('partial GPU allocations are deleted and do not leak on constructor failure',()=>{
 const f=fixture('createBuffer')
 try{
  assert.throws(()=>new SelectorRenderer(f.canvas),/allocation failed/)
  assert.equal(f.calls.filter(c=>c[0]==='deleteProgram').length,1)
  assert.equal(f.calls.filter(c=>c[0]==='deleteVertexArray').length,1)
 }finally{f.cleanup()}
})
test('canceling pending image loads settles the batch and releases GPU ownership once',async()=>{
 const f=fixture()
 try{
  const renderer=new SelectorRenderer(f.canvas),pending=renderer.load()
  assert.equal(f.images.length,26)
  renderer.dispose();renderer.dispose();await pending
  assert.ok(f.images.every(image=>image.onload===null&&image.onerror===null&&image.src===''))
  assert.equal(f.calls.filter(c=>c[0]==='deleteProgram').length,1)
  assert.equal(f.calls.filter(c=>c[0]==='deleteTexture').length,1)
 }finally{f.cleanup()}
})
test('source texture dimensions, GL depth/blend state and one bounded stream survive live scene draws',async()=>{
 const f=fixture()
 try{
  const renderer=new SelectorRenderer(f.canvas),pending=renderer.load()
  for(const image of f.images){if(image.src.endsWith('/ring.png'))image.naturalWidth=image.naturalHeight=64;image.onload()}
  await pending
  const motion=new SelectorMotion(),state=motion.advance(1,24)
  renderer.render(state.positions,state.camera,state.elapsed,24)
  assert.equal(f.canvas.width,1280);assert.equal(f.canvas.height,960)
  assert.equal(f.calls.filter(c=>c[0]==='bufferData').length,1)
  assert.ok(f.calls.some(c=>c[0]==='depthMask'&&c[1]===true))
  assert.ok(f.calls.some(c=>c[0]==='depthFunc'&&c[1]===f.gl.LEQUAL))
  assert.ok(f.calls.some(c=>c[0]==='blendFunc'&&c[1]===f.gl.SRC_ALPHA&&c[2]===f.gl.ONE_MINUS_SRC_ALPHA))
  assert.ok(f.calls.filter(c=>c[0]==='drawArrays').length>22)
  assert.ok(f.calls.filter(c=>c[0]==='drawArrays'&&c[1]===f.gl.POINTS).every(c=>c[3]<=128))
  assert.ok(f.calls.filter(c=>c[0]==='bufferSubData').every(c=>c[3].every(Number.isFinite)))
  renderer.dispose()
  assert.equal(f.calls.filter(c=>c[0]==='deleteTexture').length,27)
 }finally{f.cleanup()}
})
test('malformed asynchronously loaded art rejects safely while remaining canceled promises settle',async()=>{
 const f=fixture()
 try{
  const renderer=new SelectorRenderer(f.canvas),pending=renderer.load()
  f.images[0].naturalWidth=1;f.images[0].onload()
  await assert.rejects(pending,/Invalid scene texture dimensions/)
  renderer.dispose()
 }finally{f.cleanup()}
})

test('shader compilation/linking and texture allocation failures release all owned GPU handles',()=>{
 for(const failure of ['compile','link','createTexture']){
  const f=fixture(failure)
  try{
   assert.throws(()=>new SelectorRenderer(f.canvas))
   assert.equal(f.calls.filter(c=>c[0]==='deleteProgram').length,1)
   assert.equal(f.calls.filter(c=>c[0]==='deleteBuffer').length,1)
   assert.equal(f.calls.filter(c=>c[0]==='deleteVertexArray').length,1)
   assert.ok(f.calls.filter(c=>c[0]==='deleteShader').length>=1)
  }finally{f.cleanup()}
 }
})
