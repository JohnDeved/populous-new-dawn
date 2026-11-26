import assert from 'node:assert/strict'
import test from 'node:test'
import { firewarriorTerrainClear } from '../app/firewarrior-clearance.ts'
import { launchFirewarriorPoint } from '../app/firewarrior-point.ts'
import { engagementRange } from '../app/melee-engagement.ts'
import { cleanFightRoster } from '../app/melee-groups.ts'
import { fightWaitingPosition } from '../app/melee-placement.ts'

const plane=h=>({heights:new Int16Array(16384).fill(h),flags:new Uint32Array(16384)})
test('0051f990 sight line admits equal stored-height tolerance but rejects one unit above',()=>{
 const from={x:0,y:0,h:30}, to={x:768,y:0,h:50}
 assert.equal(firewarriorTerrainClear(plane(180),from,to),true)
 assert.equal(firewarriorTerrainClear(plane(181),from,to),false)
})
test('0051fbf0 explicit point branch emits two shots and tracks the second',()=>{
 const w={land:plane(0)},source={id:17},p={x:0,y:0,h:0,heading:0,supportHeight:0,tribe:2,flags3:0}
 const fx=[],sounds=[],dest={x:256,y:512,h:630}
 const hooks={effect:(_w,kind,pos)=>{const f={id:12+fx.length,kind,...pos};fx.push(f);return f},
              sound:(_w,cue,f)=>sounds.push([cue,f.id])}
 assert.equal(launchFirewarriorPoint(w,source,p,dest,hooks),13)
 assert.deepEqual(fx.map(x=>[x.kind,x.firewarriorShot.target,x.firewarriorShot.destination]),[
  ['firewarriorShot',0,dest],['firewarriorShot',0,dest]])
 assert.deepEqual(sounds,[[0xa1,12],[0xa1,13]])
 assert.equal(p.disguise,25)
})
test('0051ff60 dispatched Firewarrior range uses altitude scaling, odd rounding and tower bonus',()=>{
 const actor={model:6,state:10,commandStatus:3,h:896}
 assert.equal(engagementRange(actor,{model:11,flags:0},false),7)
 assert.equal(engagementRange(actor,{model:11,flags:0},true),11)
 assert.equal(engagementRange({...actor,h:-128},{model:11,flags:0},false),3)
 assert.equal(engagementRange({...actor,h:4000},{model:11,flags:0},true),11)
})
test('00519a70 invalid roster slot clears stale owner and saturation before one surviving tribe wins',()=>{
 const p={id:1,class:1,flags2:0,life:10,workFlags:8,state:14,tribe:1,x:0,y:0}
 const q={...p,id:2,workFlags:9,tribe:2}
 const g={id:8,members:[0,2,0,1,0,0],flags4:0x100000,reactionTimer:2,x:0,y:0}
 assert.deepEqual(cleanFightRoster(g,new Map([[1,p],[2,q]])),{active:false,people:[1,0,0,0,0,0]})
 assert.deepEqual([g.members,g.flags4,g.reactionTimer,g.count,g.winner,q.workFlags],[[0,0,0,1,0,0],0,1,1,1,0])
})
test('0051f750 waiting ring checks exact occupancy on the first pass, not the randomized fallback',()=>{
 const collision={cell:()=>({flags:0,category:0,building:0}),walkMask:new Uint8Array(8192).fill(255)}
 const p={id:3,x:1000,y:0,model:2,flags2:0,flags4:0}
 const center={x:0,y:0}
 let seen=0
 const w={collision,randomState:23,occupied:(_to,id)=>{assert.equal(id,3);seen++;return true}}
 const p2=fightWaitingPosition(w,p,center)
 assert.equal(seen,32)
 assert.notDeepEqual(p2,center)
 assert.notEqual(w.randomState,23)
 w.randomState=23;w.occupied=()=>false
 assert.notDeepEqual(fightWaitingPosition(w,p,center),center)
 assert.equal(w.randomState,23)
})
