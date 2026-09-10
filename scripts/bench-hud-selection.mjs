// Complete 200-person HUD queries: input CPU only, not rendering or hardware FPS.
import assert from 'node:assert/strict'
import {cpus} from 'node:os'
import {createWorld,addUnit,nativePosition,selectFollowers,hudPeople} from '../app/model.ts'
import {createLivePerson} from '../app/live-people.ts'
import {focusHudPerson} from '../app/hud-selection.ts'
const w=createWorld();w.units=[];w.buildings=[];w.selected=[]
for(let i=0;i<200;i++){
 const u=addUnit(w,'blue',i===199?'shaman':i%5?'brave':'warrior',{x:(i%20)*.5,z:8+Math.floor(i/20)*.5})
 u.native=createLivePerson(w,u)
}
const point=nativePosition(w,{x:0,z:8}),iterations=1000,rounds=9,medianMicroseconds={}
for(const mode of ['single','five','all','focus']){
 const invoke=()=>{
  w.selected=[];w.sounds.length=0
  if(mode==='focus')return focusHudPerson(hudPeople(w),0,point,0)
  selectFollowers(w,0,point,mode)
 }
 const result=invoke()
 if(mode==='focus')assert.ok(result>0)
 else assert.equal(w.selected.length,{single:1,five:5,all:199}[mode])
 for(let i=0;i<iterations;i++)invoke()
 const samples=[]
 for(let round=0;round<rounds;round++){
  const start=performance.now()
  for(let i=0;i<iterations;i++)invoke()
  samples.push((performance.now()-start)*1000/iterations)
 }
 medianMicroseconds[mode]=samples.sort((a,b)=>a-b)[4]
}
console.log(JSON.stringify({node:process.version,cpu:cpus()[0].model,people:200,iterations,rounds,medianMicroseconds}))
