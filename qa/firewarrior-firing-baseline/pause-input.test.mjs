// Host-only acceptance guards; these records are not gameplay/visual evidence.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { requirePauseInput } from './pause-input.mjs'

const fixture=()=>{
  const state={sourceId:178,state:10,substate:11,commandStatus:21,animationMode:44,workTarget:65,
    object:48,draw:14,f1:0,f2:3,counter:40,timer:6,order:{model:21,flags:34},
    projectiles:[{id:200,source:178,target:65,impact:false},{id:201,source:178,target:65,impact:true}]}
  const event={trusted:true,button:0,x:700,y:40,targetMatches:true,pointOwned:true,sceneWorldSame:true,
    nativeOwnerSame:true,sourceIsNative:true,...state}
  return {detected:{...state,now:10,turn:20},trace:{point:{x:700,y:40},events:[
    {...event,type:'pointerdown',paused:false,now:5,turn:19},
    {...event,type:'pointerup',paused:false,now:11,turn:20},
    {...event,type:'click',paused:true,now:12,turn:20}]}}
}
test('baseline idle artwork is permitted only with actual firing ownership and trusted Pause',()=>{
  const {trace,detected}=fixture();assert.ok(requirePauseInput(trace,detected,65))
})
for(const [name,change]of [
  ['expired phase',f=>{f.trace.events[1].animationMode=40}],
  ['manual attack',f=>{f.detected.order={model:19,flags:34}}],
  ['foreign target',f=>{f.trace.events[1].workTarget=66}],
  ['foreign projectile',f=>{f.detected.projectiles=[{source:178,target:66,impact:false},{source:178,target:66,impact:true}]}],
  ['changed owner',f=>{f.trace.events[1].nativeOwnerSame=false}],
  ['synthetic input',f=>{f.trace.events[1].trusted=false}],
  ['phase changed in click',f=>{f.trace.events[2].f2=4}],
])test(`reject ${name}`,()=>{
  const f=fixture();change(f);assert.throws(()=>requirePauseInput(f.trace,f.detected,65))
})
