// Actual RenderView/Painter and Three resources. Renderer submission is observed,
// not rasterized: browser pixels and GPU performance remain separate validation.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { RenderView } from '../app/render-view.ts'
import { ownBodyLayer, releaseBodyLayer } from '../app/body-layer-submission.ts'

function fixture() {
 const view=new RenderView(),scene=new THREE.Scene(),camera=new THREE.Camera(),groups=new Map(),layers=[]
 view.update(800,600,{x:0,z:0},0,0,false)
 for(const [id,x] of [[1,0],[2,100]]) {
  const group=new THREE.Group(),layer=new THREE.Sprite(new THREE.SpriteMaterial({transparent:false,alphaTest:.5,depthWrite:true,toneMapped:false}))
  ownBodyLayer(layer);layer.position.x=x;layer.userData.atlasTransform=new THREE.Vector4(1,1,0,0)
  group.userData={unit:id,layers:[layer]};group.add(layer);scene.add(group);groups.set(id,group);layers.push(layer)
 }
 const renderer={capabilities:{logarithmicDepthBuffer:false,reversedDepthBuffer:false},setTransparentSort(){},render(){scene.updateMatrixWorld();scene.onBeforeRender(renderer,scene,camera);renderer.inspect?.();scene.onAfterRender(renderer,scene,camera)}}
 const render=()=>{view.prepare(scene);renderer.afterPrepare?.();view.painter.render(renderer,scene,camera,groups)}
 return {view,scene,camera,groups,layers,renderer,render,close(){view.dispose();layers.forEach(l=>l.material.dispose())}}
}
test('owned far-clipped body layer is omitted only during submission; commands and depth remain',()=>{
 const f=fixture();try{
 f.renderer.inspect=()=>{assert.equal(f.layers[0].material.visible,true);assert.equal(f.layers[1].material.visible,false);assert.equal(f.layers[1].visible,true);assert.equal(f.view.painter.depth(f.layers[1],0,0),3)}
 f.render();assert.ok(f.layers.every(l=>l.material.visible));assert.ok(f.view.painter.command(f.layers[0],0));assert.equal(f.view.painter.command(f.layers[1],0),undefined)
 const shader={vertexShader:THREE.ShaderLib.sprite.vertexShader,fragmentShader:THREE.ShaderLib.sprite.fragmentShader,uniforms:{}}
 f.layers[1].material.onBeforeCompile(shader,f.renderer)
 assert.match(shader.vertexShader,/projected.z=texelFetch\(nativePainter/);assert.match(shader.vertexShader,/gl_Position=nativePosition\(vec3\(0\.\)\); gl_Position.xy\+=/)
 assert.equal(2*2-1,3);assert.ok(3>1,'native projected w=1 clips all vertices')
 }finally{f.close()}
})
test('nested and thrown renderer restores original material visibility and original error',()=>{
 const f=fixture(),error=new Error('draw');try{
 f.renderer.inspect=()=>{
  assert.equal(f.layers[1].material.visible,false)
  f.view.painter.render({render(){assert.ok(f.layers.every(l=>l.material.visible));f.view.painter.suppressBodyLayers(f.renderer);assert.ok(f.layers.every(l=>l.material.visible))}},f.scene,f.camera,f.groups)
  throw error
 }
 assert.throws(f.render,e=>e===error);assert.ok(f.layers.every(l=>l.material.visible))
 f.renderer.inspect=()=>assert.equal(f.layers[1].material.visible,false);f.render()
 }finally{f.close()}
})
for(const kind of ['overview','log-depth','reversed-depth','unknown-capabilities','released','clone','shared','custom-compile','custom-after','custom-material-hook','blended','hidden-material','custom-program-key','custom-sprite-uniform','custom-draw','shared-ignored','local-mode-override','local-depth-override'])test(`${kind} retains ordinary material submission`,()=>{
 const f=fixture();try{
 const hidden=f.layers[1]
 if(kind==='overview') f.view.update(800,600,{x:0,z:0},0,0,true)
 if(kind==='log-depth') f.renderer.capabilities.logarithmicDepthBuffer=true
 if(kind==='reversed-depth') f.renderer.capabilities.reversedDepthBuffer=true
 if(kind==='unknown-capabilities') delete f.renderer.capabilities
 if(kind==='released') releaseBodyLayer(hidden)
 if(kind==='clone'){const clone=hidden.clone();hidden.parent.add(clone);f.groups.get(2).userData.layers=[clone];hidden.visible=false;f.layers[1]=clone}
 if(kind==='shared'){const other=new THREE.Sprite(hidden.material);f.scene.add(other)}
 if(kind==='custom-compile') hidden.material.onBeforeCompile=()=>{}
 if(kind==='custom-after') hidden.onAfterRender=()=>{}
 if(kind==='custom-material-hook') hidden.material.onBeforeRender=()=>{}
 if(kind==='blended') hidden.material.transparent=true
 if(kind==='hidden-material') hidden.material.visible=false
 if(kind==='custom-program-key') f.renderer.afterPrepare=()=>{hidden.material.customProgramCacheKey=()=> 'custom'}
 if(kind==='custom-sprite-uniform') f.renderer.afterPrepare=()=>{hidden.material.userData.nativeUniforms.nativePainterSprite.value=0}
 if(kind==='local-mode-override') f.renderer.afterPrepare=()=>{hidden.material.userData.nativeUniforms.nativeMode={value:0}}
 if(kind==='local-depth-override') f.renderer.afterPrepare=()=>{hidden.material.userData.nativeUniforms.nativePainter={value:null}}
 if(kind==='custom-draw') f.renderer.afterPrepare=()=>{hidden.onBeforeRender=()=>{}}
 if(kind==='shared-ignored'){const other=new THREE.Sprite(hidden.material);other.userData.nativeIgnore=true;f.scene.add(other)}
 f.renderer.inspect=()=>assert.equal(f.layers[1].material.visible,kind!=='hidden-material')
 f.render()
 }finally{f.close()}
})

test('next visible draw republishes all consumed native uniforms after an omitted draw',()=>{
 const optimized=fixture(),ordinary=fixture()
 const sample=local=>Object.fromEntries(Object.entries(local).map(([key,{value}])=>[key,value?.toArray?value.toArray():ArrayBuffer.isView(value)?Array.from(value):value]))
 try{
  for(const f of[optimized,ordinary]){
   if(f===ordinary)releaseBodyLayer(f.layers[1])
   f.renderer.inspect=()=>{for(const layer of f.layers)if(layer.visible&&layer.material.visible)layer.onBeforeRender(f.renderer,f.scene,f.camera,layer.geometry,layer.material,null)}
   f.render()
  }
  assert.notDeepEqual(sample(optimized.layers[1].material.userData.nativeUniforms),sample(ordinary.layers[1].material.userData.nativeUniforms),'unused draw-local state intentionally remains deferred')
  for(const f of[optimized,ordinary]){
   const layer=f.layers[1];layer.position.set(0,2,0);layer.userData.nativeSize=7;layer.parent.userData.nativeHeading=123;layer.userData.atlasTransform.set(.2,.3,.4,.5)
   f.render();assert.equal(layer.material.visible,true)
  }
  assert.deepEqual(sample(optimized.layers[1].material.userData.nativeUniforms),sample(ordinary.layers[1].material.userData.nativeUniforms))
 }finally{optimized.close();ordinary.close()}
})

for (const kind of ['override-material', 'shared-points', 'shared-ignored-points', 'points-material-hook', 'points-draw-hook']) test(`${kind} preserves generic submission without preparing Points`, () => {
 const f=fixture();let extra
 try {
  const hidden=f.layers[1]
  if(kind==='override-material')f.scene.overrideMaterial=new THREE.ShaderMaterial({vertexShader:'void main(){gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:'void main(){gl_FragColor=vec4(1.);}'})
  else {
   extra=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute([0,0,0],3)),kind.startsWith('shared')?hidden.material:new THREE.PointsMaterial())
   if(kind==='shared-ignored-points')extra.userData.nativeIgnore=true
   if(kind==='points-material-hook')extra.material.onBeforeRender=()=>{}
   if(kind==='points-draw-hook')extra.onBeforeRender=()=>{}
   f.scene.add(extra)
  }
  const material=extra?.material,draw=extra?.onBeforeRender,culled=extra?.frustumCulled
  f.renderer.inspect=()=>{
   assert.equal(hidden.visible,true);assert.equal(hidden.material.visible,true)
   assert.equal(f.view.painter.depth(hidden,0,0),3)
   assert.equal(f.view.painter.command(hidden,0),undefined)
   if(extra){assert.strictEqual(extra.material,material);assert.strictEqual(extra.onBeforeRender,draw);assert.equal(extra.frustumCulled,culled);assert.equal(extra.material.visible,true)}
  }
  f.render();assert.equal(hidden.material.visible,true)
 }finally{extra?.geometry.dispose();if(extra&&extra.material!==f.layers[1].material)extra.material.dispose();f.scene.overrideMaterial?.dispose();f.close()}
})
