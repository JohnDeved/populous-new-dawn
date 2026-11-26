import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {stripTypeScriptTypes} from 'node:module'
import test from 'node:test'
import {createWorld,selectArea,nativePosition} from '../app/model.ts'
import {browserPosition} from '../app/world-coordinates.ts'
import {nativeAngle,positionDistance} from '../app/native-math.ts'
import {dragMoved,dragEndpoint,dragCommand,dragCorners,unwrapDragCorners} from '../app/drag-selection.ts'
// Exercise the exact ordinary handler bodies with a real Mission 1 world, without
// a browser or Three.js runtime. Terrain/canvas/overlay and inspection are supplied.
const src=readFileSync(new URL('../app/scene-input-runtime.ts',import.meta.url),'utf8')
const imports={nativePosition,nativeAngle,positionDistance,dragMoved,dragEndpoint,dragCorners,unwrapDragCorners,dragCommand,selectArea,queueBuildingInspection(scene,event,phase){scene.inspection.push([event.pointerId,phase])}}
const fn=Object.fromEntries(['pointerDown','pointerUp','updateDrag'].map(name=>{
 const snippet=src.match(new RegExp('export function '+name+'\\([^]*?^}', 'm'))?.[0]
 assert.ok(snippet,name)
 return [name,new Function(...Object.keys(imports),stripTypeScriptTypes(snippet.replace(/^export /,''))+'\nreturn '+name)(...Object.values(imports))]
}))
function setup(startDrag = true) {
 const world=createWorld(1,'scalable')
 const brave=world.units.find(u=>u.team==='blue'&&u.hp>0)
 const p=nativePosition(world,brave)
 const start=browserPosition({x:(p.x-1024)&65535,y:(p.y-1024)&65535})
 const end=browserPosition({x:(p.x+1024)&65535,y:(p.y+1024)&65535})
 world.selected=[];world.mode=null;world.inputMask=0
 const canvas={captures:[],setPointerCapture(id){this.captures.push(id)}}
 const scene={world,renderer:{domElement:canvas},dragActive:{value:false},selectionOverlay:{visible:false,updates:0,update(){this.updates++}},globeMotion:{dragging:false},view:{angle:0},inspection:[],changes:0,onChange(){this.changes++},pickUnit(){},pick(event){return event.clientX>100?end:start},updateDrag(event){return fn.updateDrag(this,event)}}
 const down={clientX:100,clientY:100,pointerId:3,button:0,buttons:1}
 const up={...down,clientX:150,buttons:0}
 if (!startDrag) return {scene,brave,up}
 fn.pointerDown(scene,down)
 scene.updateDrag(up)
 assert.deepEqual(canvas.captures,[3])
 assert.equal(scene.selectionOverlay.visible,true)
 assert.equal(scene.selectionOverlay.updates,1)
 return {scene,brave,up}
}
for (const blocker of ['input mask','overview transition']) test('releasing an active drag during '+blocker+' immediately clears its box without changing selection',()=>{
 const {scene,up}=setup()
 if (blocker==='input mask') scene.world.inputMask=1
 else scene.overviewStage='enter'
 const before=scene.world.selected.slice()
 fn.pointerUp(scene,up)
 assert.equal(scene.pointerGesture,null)
 assert.equal(scene.pointerButtons,0)
 assert.deepEqual(scene.inspection,[[3,'up']])
 assert.deepEqual(scene.world.selected,before)
 assert.equal(scene.changes,0)
 assert.equal(scene.selectionOverlay.updates,1)
 assert.deepEqual([scene.drag,scene.dragActive.value,scene.selectionOverlay.visible],[null,false,false])
})
test('unblocked release commits genuine Mission 1 area selection',()=>{
 const {scene,brave,up}=setup()
 fn.pointerUp(scene,up)
 assert.ok(scene.world.selected.includes(brave.id))
 assert.equal(scene.changes,1)
 assert.equal(scene.selectionOverlay.updates,2,'release terrain is sampled before committing')
})
test('unblocked release retires visible box without awaiting next frame',()=>{
 const {scene,up}=setup()
 fn.pointerUp(scene,up)
 assert.deepEqual([scene.drag,scene.dragActive.value,scene.selectionOverlay.visible],[null,false,false])
})
test('different pointer release does not retire active box',()=>{
 const {scene,up}=setup()
 const drag = scene.drag
 fn.pointerUp(scene,{...up,pointerId:7})
 assert.equal(scene.pointerGesture.pointerId,3)
 assert.equal(scene.drag,drag)
 assert.equal(scene.dragActive.value,true)
 assert.equal(scene.selectionOverlay.visible,true)
 assert.deepEqual(scene.inspection,[])
 assert.equal(scene.changes,0)
})

test('real Shift+Return overview entry during held box must not commit a stale ordinary ground selection', () => {
  const {scene, up}=setup()
  const source=readFileSync(new URL('../app/instant-overview.ts',import.meta.url),'utf8')
  const snippet=source.match(/export function instantOverview\([^]*?^}/m)?.[0]
  assert.ok(snippet)
  const enter=new Function(stripTypeScriptTypes(snippet.replace(/^export /,''))+'\nreturn instantOverview')()
  Object.assign(scene, {
    cameraPosition:{angle:256}, cameraBearing: Math.PI/4, viewPreset:0, globeMorph:{active:false},
    cameraMotion:{active:1}, view:{ ...scene.view, center:{x:8,y:2} },
    updateView(){}, captureCamera(){}
  })
  enter(scene)
  assert.equal(scene.overviewActive,true)
  assert.equal(scene.overviewStage,null)
  assert.equal(scene.world.drawMode,2)
  assert.equal(scene.drag.active,true,'the real overview entry did not cancel this owner')
  fn.pointerUp(scene,up)
  assert.deepEqual(scene.world.selected, [], 'steady World View must not commit the old ground selection')
  assert.equal(scene.pointerGesture,null)
  assert.deepEqual([scene.drag,scene.dragActive.value,scene.selectionOverlay.visible],[null,false,false])
  assert.equal(scene.selectionOverlay.updates,1)
  assert.equal(scene.changes,0)
})

test('new globe left press has no ground drag and follows ordinary release dispatch', () => {
  const {scene, up}=setup(false)
  assert.equal(scene.pointerGesture,undefined)
  assert.equal(scene.selectionOverlay.visible,false)
  scene.overviewActive=true
  scene.overviewStage=null
  scene.world.drawMode=2
  scene.picking={pickPerson(){return 0}}
  fn.pointerDown(scene,{...up,pointerId:11,buttons:1})
  assert.equal(scene.drag,null)
  fn.pointerUp(scene,{...up,pointerId:11})
  assert.equal(scene.pointerGesture,null)
  assert.deepEqual(scene.inspection,[[11,'up']])
  assert.equal(scene.changes,1,'ordinary overview action routing must remain available')
})
