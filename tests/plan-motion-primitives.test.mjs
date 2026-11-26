import assert from 'node:assert/strict'
import test from 'node:test'
import { buildingPlanInsidePoint, buildingPlanOutsidePoint } from '../app/building-shapes.ts'
import { releaseSelectedPeople, stepFightRecovery } from '../app/person-state.ts'

test('004ba130 inside geometry strips both packed low coordinate bits before quarter-cell offsets',()=> {
  assert.deepEqual(buildingPlanInsidePoint({cell:0x0305,shape:1,planKind:0}),{x:1792,y:1344})
  assert.deepEqual(buildingPlanInsidePoint({cell:0xffff,shape:1,planKind:10}),{x:256,y:320})
})
test('004b9fc0 kind-ten plan exits skip occupied and blocked cells before first valid rotation',()=> {
  const seen=[],w={walkMask:new Uint8Array(8192).fill(255),cell(p) {
    seen.push(p)
    return {building:seen.length===1?7:0,category:0,flags:seen.length===2?4:0}
  }}
  const plan={cell:0x0305,shape:1,planKind:10}
  const points=[{x:1792,y:896},{x:1408,y:1280},{x:1792,y:1728}]
  assert.deepEqual(buildingPlanOutsidePoint(plan,w),points[2])
  assert.deepEqual(seen,points)
  w.cell=p=>({building:1,category:0,flags:0})
  assert.deepEqual(buildingPlanOutsidePoint(plan,w),{x:1024,y:512})
  assert.deepEqual(buildingPlanOutsidePoint({...plan,planKind:0},w),points[0])
})
test('00418ce0 matching reserved follower still resets motion before the state-change gate',()=> {
  const make=state=>({state, flags2:0x100000,motionTimer:22,motionMode:5})
  const yes=make(14),no=make(10)
  releaseSelectedPeople({},[yes,no],14,{setAnimation:assert.fail})
  assert.deepEqual(yes,{state:14,flags2:0x101000,motionTimer:0,motionMode:0})
  assert.deepEqual(no,make(10))
})
test('004df220 recovery halves a valid mounted speed and returns to default only on expiration',()=> {
  const f=()=>({state:36,substate:1,target:91,model:2,vehicle:5,speed:33,flags4:0x2000000,flags2:0})
  const registry=new Map([[91,{x:5,y:9,class:1,flags2:0}]])
  const out=[],effects={setAnimation:(_,id)=>out.push(['animation',id]),duration:()=>2,fight:id=>out.push(['fight',id])}
  const p=f(),step=()=>stepFightRecovery(p,0,registry,effects)
  assert.equal(step(),0)
  assert.deepEqual([p.speed,p.timer,p.substate],[16,2,2])
  assert.deepEqual(out.map(x=>x[0]),['animation','fight'])
  assert.deepEqual(out[1],['fight',91])
  assert.equal(step(),0); assert.equal(p.timer,1)
  assert.equal(step(),10); assert.equal(p.timer,0)
  assert.equal(out.length,2)
  const q={...f(),vehicle:0}
  stepFightRecovery(q,0,registry,effects)
  assert.equal(q.speed,0)
})
