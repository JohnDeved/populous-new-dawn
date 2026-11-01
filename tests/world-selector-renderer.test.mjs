import assert from 'node:assert/strict'
import test from 'node:test'
import {SelectorRenderer} from '../app/world-selector-renderer.ts'
import {SelectorMotion} from '../app/world-selector-motion.ts'
function fixture(failure){
 const calls=[],images=[],allocations=[];let handle=0
 const constants=new Map()
 const gl=new Proxy({}, {get(_,name){
  if(String(name)===String(name).toUpperCase()){
   if(!constants.has(name))constants.set(name,constants.size+1)
   return constants.get(name)
  }
  return (...args)=>{
   calls.push([name,...args.map(arg=>ArrayBuffer.isView(arg)?arg.slice():arg)])
   if(typeof failure==='function')failure(name,args)
   if(name===failure)return null
   if(name==='getShaderParameter'&&failure==='compile')return false
   if(name==='getProgramParameter'&&failure==='link')return false
   if(String(name).startsWith('create')){const value={id:++handle};allocations.push([name,value]);return value}
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
 return {gl,canvas,calls,images,allocations,cleanup}
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

test('wide scene reveals lateral space with native uniform scale across resize and DPR changes',()=>{
 const f=fixture()
 try{
  const renderer=new SelectorRenderer(f.canvas)
  for(const [width,height,dpr] of [[640,480,1],[1440,1080,1],[1920,1080,1],[3440,1440,1],[1920,1080,2],[3840,2160,2],[853,480,1.25],[640,480,1]]){
   f.canvas.getBoundingClientRect=()=>({width,height})
   globalThis.window.devicePixelRatio=dpr
   renderer.resize()
   const backingScale=Math.min(dpr,4096/Math.max(width,height))
   const logicalScale=Math.min(width/640,height/480)
   assert.equal(f.canvas.width,Math.round(width*backingScale))
   assert.equal(f.canvas.height,Math.round(height*backingScale))
   assert.ok(f.canvas.width<=4096&&f.canvas.height<=4096)
   const [, ,scaleX,scaleY]=f.calls.findLast(c=>c[0]==='uniform2f')
   assert.equal(scaleX,640*logicalScale/width)
   assert.equal(scaleY,480*logicalScale/height)
   assert.equal(f.calls.findLast(c=>c[0]==='uniform1f')[2],logicalScale*backingScale)
   // Shader mapping of a native 20-pixel radius stays circular in CSS pixels.
   const radiusX=20/320*scaleX*width/2
   const radiusY=20/240*scaleY*height/2
   assert.ok(Math.abs(radiusX-radiusY)<1e-10)
   // Original left/right edges are interior on widescreen: no 4:3 clip wall.
   assert.equal(scaleX<1,width/height>4/3)
   assert.ok(Math.abs((width-640*logicalScale)/2+320*logicalScale-width/2)<1e-10)
  }
  const shader=f.calls.find(c=>c[0]==='shaderSource'&&c[2].includes('gl_Position'))[2]
  assert.match(shader,/position.x \/ 320.0 - 1.0\) \* frameScale.x \* w/)
  assert.match(shader,/1.0 - position.y \/ 240.0\) \* frameScale.y \* w/)
  renderer.dispose()
 }finally{f.cleanup()}
})


test('already queued image callbacks cannot regain GPU ownership after disposal',async()=>{
 const f=fixture()
 try{
  const renderer=new SelectorRenderer(f.canvas),pending=renderer.load()
  const callbacks=f.images.map(image=>({loaded:image.onload,failed:image.onerror}))
  renderer.dispose()
  await pending
  const callsAfterDisposal=f.calls.length
  for(const callback of callbacks){callback.loaded();callback.failed()}
  await Promise.resolve()
  assert.equal(f.calls.length,callsAfterDisposal,'queued callbacks do not issue GPU operations')
  assert.ok(f.images.every(image=>image.onload===null&&image.onerror===null&&image.src===''))
  renderer.dispose()
  assert.equal(f.calls.length,callsAfterDisposal,'disposal remains idempotent after late callbacks')
 }finally{f.cleanup()}
})

test('asynchronous upload failure preserves rejection and releases its allocated texture',async()=>{
 let uploads=0
 const f=fixture(name=>{if(name==='texImage2D'&&++uploads===2)throw Error('supplied image upload failure')})
 try{
  const renderer=new SelectorRenderer(f.canvas),pending=renderer.load()
  const failure=assert.rejects(pending,/supplied image upload failure/)
  f.images[0].onload()
  await failure
  assert.equal(f.calls.filter(call=>call[0]==='createTexture').length,2,'white plus failed image texture allocated')
  renderer.dispose()
  const allocated=f.allocations.filter(([name])=>name==='createTexture').map(([,value])=>value)
  const deletedTextures=f.calls.filter(call=>call[0]==='deleteTexture').map(call=>call[1])
  assert.equal(allocated.length,2)
  assert.equal(deletedTextures.length,2)
  assert.equal(new Set(deletedTextures).size,2)
  for(const texture of allocated)assert.equal(deletedTextures.filter(value=>value===texture).length,1)
  assert.equal(f.calls.filter(call=>call[0]==='deleteProgram').length,1)
  assert.ok(f.images.slice(1).every(image=>image.onload===null&&image.onerror===null&&image.src===''))
  const deleted=f.calls.filter(call=>String(call[0]).startsWith('delete')).length
  renderer.dispose()
  assert.equal(f.calls.filter(call=>String(call[0]).startsWith('delete')).length,deleted)
 }finally{f.cleanup()}
})
