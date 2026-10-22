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

test('explicit texture retries use fresh bounded URLs while normal first loads remain unchanged',async()=>{
 const {SelectorRenderer}=await import('../app/world-selector-renderer.ts?fresh-retry-urls')
 const f=fixture()
 try{
  const first=new SelectorRenderer(f.canvas),initial=first.load()
  const original=f.images.map(image=>image.src)
  assert.ok(original.every(url=>/^\/original\/world-selector\/globes\/(sun|ring|mission-\d+)\.png$/.test(url)))
  first.dispose();await initial
  const tokens=[]
  for(let attempt=0;attempt<2;attempt++){
   const start=f.images.length,renderer=new SelectorRenderer(f.canvas),pending=renderer.load(true)
   const images=f.images.slice(start)
   assert.deepEqual(images.map(image=>image.src.split('?')[0]),original)
   const queries=new Set(images.map(image=>image.src.split('?')[1]))
   assert.equal(queries.size,1)
   const token=[...queries][0]
   assert.match(token,/^retry=[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
   tokens.push(token)
   // A queued old-generation callback cannot upload a texture after disposal.
   const late=images[0].onload,uploads=f.calls.filter(call=>call[0]==='texImage2D').length
   renderer.dispose();late();await pending
   assert.equal(f.calls.filter(call=>call[0]==='texImage2D').length,uploads)
  }
  assert.notEqual(tokens[0],tokens[1],'fresh renderer instances cannot reuse a corrupt retry URL')
 }finally{f.cleanup()}
})

test('fresh retry URLs do not bypass malformed texture rejection',async()=>{
 const {SelectorRenderer}=await import('../app/world-selector-renderer.ts?malformed-retry')
 const f=fixture()
 try{
  const renderer=new SelectorRenderer(f.canvas),pending=renderer.load(true)
  f.images[0].naturalWidth=f.images[0].naturalHeight=1
  f.images[0].onload()
  await assert.rejects(pending,/Invalid scene texture dimensions/)
  renderer.dispose()
  assert.ok(f.images.slice(1).every(image=>image.onload===null&&image.src===''))
 }finally{f.cleanup()}
})

test('remounts inherit the latest recovery namespace and late disposed loads cannot roll it back',async()=>{
 const {SelectorRenderer}=await import('../app/world-selector-renderer.ts?recovery-remount')
 const f=fixture()
 try{
  const original=new SelectorRenderer(f.canvas),initial=original.load()
  const originalUrls=f.images.map(image=>image.src)
  original.dispose();await initial
  const first=new SelectorRenderer(f.canvas),firstStart=f.images.length,firstLoad=first.load(true)
  const firstUrls=f.images.slice(firstStart).map(image=>image.src),late=f.images[firstStart].onload
  const newer=new SelectorRenderer(f.canvas),newStart=f.images.length,newLoad=newer.load(true)
  const newUrls=f.images.slice(newStart).map(image=>image.src)
  assert.notEqual(firstUrls[0],newUrls[0])
  first.dispose();late();await firstLoad
  newer.dispose();await newLoad
  const remount=new SelectorRenderer(f.canvas),mountStart=f.images.length,mountLoad=remount.load()
  const mountedUrls=f.images.slice(mountStart).map(image=>image.src)
  assert.deepEqual(mountedUrls,newUrls)
  assert.notDeepEqual(mountedUrls,originalUrls)
  assert.deepEqual(mountedUrls.map(url=>url.split('?')[0]),originalUrls)
  remount.dispose();await mountLoad
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
