import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {stripTypeScriptTypes} from 'node:module'
import test from 'node:test'
import {createWorld} from '../app/model.ts'
import {cancelInteraction} from '../app/selection-runtime.ts'
import {dragCamera} from '../app/camera-input.ts'
import {browserPosition} from '../app/world-coordinates.ts'
// Exact handlers, real Mission 2, actual camera and selection logic, with supplied canvas/inspection boundary.
const src=readFileSync(new URL('../app/scene-input-runtime.ts',import.meta.url),'utf8')
const functions=Object.fromEntries(['pointerDown','pointerMove','pointerUp'].map(name=>{
 const match=src.match(new RegExp('export function '+name+'\\([^]*?^}', 'm'))
 assert.ok(match,name)
 const code=stripTypeScriptTypes(match[0].replace(/^export /,''))
 const imports={dragCamera,browserPosition,cancelInteraction,queueBuildingInspection:()=>{}}
 return [name,new Function(...Object.keys(imports),code+'\nreturn '+name)(...Object.values(imports))]
}))
function setup(mode) {
 const world=createWorld(2,'scalable')
 const brave=world.units.find(u=>u.team==='blue'&&u.hp>0)
 assert.ok(brave)
 world.selected=[brave.id];world.mode=mode;world.orderCursor=2;world.inputMask=0
 const scene={
  world,pointerGesture:null,
  renderer:{domElement:{setPointerCapture(id){assert.equal(id,1)}}},
  pointerButtons:2, down:{x:200,y:200,button:2}, dragLast:{x:200,y:200},
  globeMotion:{dragging:false}, cameraMotion:{active:0},dragActive:{value:false},
  cameraPosition:{x:0,y:0,angle:100},cameraVelocity:{turn:0,forward:0,side:0},
  captureCamera(){},updateView(){},tooltip:{draw:0},changes:0,onChange(){this.changes++},
 }
 functions.pointerDown(scene,{pointerId:1,button:2,buttons:2,clientX:200,clientY:200})
 const move=clientX=>functions.pointerMove(scene,{pointerId:1,button:-1,buttons:2,clientX,clientY:200})
 const release=clientX=>functions.pointerUp(scene,{pointerId:1,button:2,buttons:0,clientX,clientY:200})
 return {scene,brave,move,release}
}
for(const mode of [null,'hut']) test('camera round trip preserves '+(mode??'follower group'),()=>{
 const {scene,brave,move,release}=setup(mode)
 move(245)
 assert.equal(scene.cameraPosition.angle,145)
 assert.equal(scene.pointerGesture.moved,true)
 move(202)
 assert.equal(scene.cameraPosition.angle,102)
 release(202)
 assert.equal(scene.pointerGesture,null)
 assert.deepEqual([scene.world.selected,scene.world.mode,scene.world.orderCursor,scene.changes],[[brave.id],mode,2,0])
})
test('below-threshold right click still cancels the mode and then deselects normally',()=>{
 const {scene,brave,move,release}=setup('hut')
 move(203)
 assert.equal(scene.pointerGesture.moved,false)
 release(203)
 assert.deepEqual([scene.world.selected,scene.world.mode,scene.changes],[[brave.id],null,1])
 functions.pointerDown(scene,{pointerId:1,button:2,buttons:2,clientX:200,clientY:200})
 release(200)
 assert.deepEqual([scene.world.selected,scene.world.orderCursor,scene.changes],[[],0,2])
 assert.equal(brave.groups&1,1)
})
test('ordinary large net right drag continues to preserve selection',()=>{
 const {scene,brave,move,release}=setup(null)
 move(245)
 release(245)
 assert.deepEqual(scene.world.selected,[brave.id])
})
