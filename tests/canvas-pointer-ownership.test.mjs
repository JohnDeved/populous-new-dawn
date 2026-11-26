import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { createWorld, selectArea, nativePosition } from '../app/model.ts'
import { browserPosition } from '../app/world-coordinates.ts'
import { nativeAngle,positionDistance } from '../app/native-math.ts'
import { dragMoved,dragEndpoint,dragCommand,dragCorners,unwrapDragCorners } from '../app/drag-selection.ts'
import { dragCamera } from '../app/camera-input.ts'
import { cancelInteraction } from '../app/selection-runtime.ts'

// Exact handler bodies, genuine Mission 1, native geometry and selection.
// Canvas capture, terrain pick and tooltip presentation are supplied sites.
const runtime = readFileSync(new URL('../app/scene-input-runtime.ts',import.meta.url),'utf8')
const importShim = {
  selectArea,nativePosition,browserPosition,nativeAngle,positionDistance,dragMoved,dragEndpoint,
  dragCommand,dragCorners,unwrapDragCorners,dragCamera,cancelInteraction,
  queueBuildingInspection(scene,event,phase){scene.inspection.push([event.pointerId,phase])},
  cancelTooltipInspection(scene){scene.cancelled++},
  cancelPointerGesture(...args){return handlers.cancelPointerGesture(...args)},
}
const handlers = Object.fromEntries(['pointerDown','pointerUp','pointerMove','updateDrag','cancelPointerGesture'].map(name=>{
  const code = runtime.match(new RegExp('export function '+name+'\\([^]*?^}', 'm'))?.[0]
  assert.ok(code,name)
  return [name,new Function(...Object.keys(importShim),stripTypeScriptTypes(code.replace(/^export /,''))+'\nreturn '+name)(...Object.values(importShim))]
}))
function fresh() {
  const world=createWorld(1,'scalable')
  const brave=world.units.find(u=>u.team==='blue'&&u.hp>0)
  const p=nativePosition(world,brave)
  const start=browserPosition({x:(p.x-1024)&65535,y:(p.y-1024)&65535})
  const end=browserPosition({x:(p.x+1024)&65535,y:(p.y+1024)&65535})
  world.selected=[]; world.mode=null; world.inputMask=0
  const canvas={captures:[],setPointerCapture(id){this.captures.push(id)}}
  const scene={world,renderer:{domElement:canvas},dragActive:{value:false},selectionOverlay:{visible:false,update(){}},
    globeMotion:{dragging:false},view:{angle:0},inspection:[],changes:0,cancelled:0,onChange(){this.changes++},
    pickUnit(){},pick(event){return event.clientX>100?end:start},updateDrag(event){return handlers.updateDrag(this,event)}}
  const event=(pointerId,button,buttons,x=100)=>({pointerId,pointerType:pointerId===1?'mouse':'pen',button,buttons,clientX:x,clientY:100})
  return {scene,canvas,brave,event}
}
function held() {
  const s = fresh()
  handlers.pointerDown(s.scene,s.event(1,0,1))
  s.scene.updateDrag(s.event(1,-1,1,150))
  assert.equal(s.scene.selectionOverlay.visible,true)
  return s
}
test('another physical pointer cannot take over an existing left selection or hide its live box',()=>{
  const {scene,canvas,brave,event}=held()
  const drag=scene.drag
  handlers.pointerDown(scene,event(2,0,1,230))
  handlers.pointerUp(scene,event(2,0,0,230))
  assert.deepEqual(canvas.captures,[1])
  assert.equal(scene.pointerGesture.pointerId,1)
  assert.equal(scene.drag,drag)
  assert.equal(scene.selectionOverlay.visible,true)
  assert.deepEqual(scene.inspection,[])
  handlers.pointerUp(scene,event(1,0,0,150))
  assert.ok(scene.world.selected.includes(brave.id))
  assert.deepEqual([scene.pointerGesture,scene.drag,scene.selectionOverlay.visible],[null,null,false])
  assert.deepEqual(scene.inspection,[[1,'up']])
})
test('foreign motion changes neither owner cursor, button state nor held drag',()=>{
  const {scene,event}=held(),drag=scene.drag
  handlers.pointerMove(scene,event(1,-1,1,150))
  handlers.pointerMove(scene,event(2,-1,0,400))
  assert.deepEqual(scene.pointerScreen,{clientX:150,clientY:100})
  assert.equal(scene.pointerButtons,1)
  assert.equal(scene.drag,drag)
})
test('same mouse chord retains ownership and different terminal button cancels cleanly',()=>{
  const {scene,event}=held()
  handlers.pointerMove(scene,event(1,2,3,135))
  assert.equal(scene.pointerButtons,3)
  assert.equal(scene.pointerGesture.pointerId,1)
  handlers.pointerUp(scene,event(1,2,0,135))
  assert.deepEqual([scene.pointerGesture,scene.drag,scene.selectionOverlay.visible,scene.cancelled],[null,null,false,1])
  assert.deepEqual(scene.world.selected,[])
  assert.deepEqual(scene.inspection,[])
})
test('after release, another physical pointer captures and commits normally',()=>{
  const {scene,canvas,event}=held()
  handlers.pointerUp(scene,event(1,0,0,150))
  handlers.pointerDown(scene,event(2,0,1,100))
  assert.deepEqual(canvas.captures,[1,2])
  assert.equal(scene.pointerGesture.pointerId,2)
  scene.updateDrag(event(2,-1,1,150))
  handlers.pointerUp(scene,event(2,0,0,150))
  assert.equal(scene.changes,2)
  assert.equal(scene.pointerGesture,null)
  assert.equal(scene.selectionOverlay.visible,false)
})
