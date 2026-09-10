import assert from 'node:assert/strict'
import test from 'node:test'
import {createWorld,addUnit,command,tick,unitAnimationSource} from '../app/model.ts'
import {advanceGame} from '../app/game-clock.ts'
import {createRestingSlots} from '../app/resting-slots.ts'
import {idleSlotPosition} from '../app/person-idle.ts'
import {stepLiveResting} from '../app/live-resting.ts'
import {objectsInCell} from '../app/object-cells.ts'

function group(count) {
  const w=createWorld()
  w.units=[];w.buildings=[];w.trees=[];w.shrines=[];w.manaWorld.gameFlags=32
  w.terrain.fill(3);w.terrainVersion++
  for(let i=0;i<count;i++)addUnit(w,'blue','brave',{x:0,z:8})
  w.selected=w.units.map(u=>u.id);command(w,{x:10,z:8})
  return w
}
function rings(w) {
  const cells=new Map(),positions=new Set(),slots=createRestingSlots()
  for(const u of w.units) {
    const p=u.native
    assert.equal(p.state,19);assert.ok(p.assignment&1)
    const to=idleSlotPosition(slots,p.formationCell,p.anchorFlags)
    assert.deepEqual({x:p.x,y:p.y},to,'settled followers occupy the original ring geometry')
    positions.add(`${p.x},${p.y}`)
    const row=cells.get(p.formationCell)??[];row.push(p);cells.set(p.formationCell,row)
    assert.equal(unitAnimationSource(u),p)
  }
  assert.equal(positions.size,w.units.length)
  for(const [cell,row] of cells) {
    assert.ok(row.length<=6)
    assert.ok(row.every(p=>p.anchorFlags>>4===row.length))
    assert.deepEqual(row.map(p=>p.anchorFlags&15).sort(),Array.from({length:row.length},(_,i)=>i+1))
    assert.equal([...objectsInCell(w.objectCells,cell)].length,row.length)
  }
  return cells
}

test('ordinary groups settle into native rings, compact on departure and retain status through new orders',()=>{
  for(const count of [1,2,3,4,5,6,12]) {
    const w=group(count)
    for(let i=0;i<200;i++)tick(w,1/12)
    rings(w)
    const before=JSON.stringify(w.units);w.paused=true;tick(w,2);assert.equal(JSON.stringify(w.units),before);w.paused=false
    const u=w.units[0],person=u.native,cell=person.formationCell
    person.flags3|=0x20000
    w.selected=[u.id];command(w,{x:24,z:8})
    assert.equal(u.native,person,'ordinary routing preserves protection and person identity')
    assert.ok(person.flags3&0x20000);assert.equal(person.assignment&1,0)
    assert.equal(unitAnimationSource(u),null,'the walking adapter owns its poses')
    for(let i=0;i<200;i++)tick(w,1/12)
    rings(w)
    if(count>1)assert.ok(w.units.some(other=>other.id!==u.id&&other.native.formationCell===cell))
    u.hp=0;tick(w,1/12)
    for(let i=0;i<100;i++)tick(w,1/12)
    rings(w)
    assert.ok(!w.objectCells.objects.has(u.id))
  }
})

test('group resting positions, facing, gestures and footprints agree at 5–240 Hz and irregular frames',()=>{
  const run=schedule=>{
    const w=group(12),history=[],clock={animationTime:0,animationFrame:0,afterTurn:()=>history.push(w.units.map(u=>[u.x,u.z,u.heading,u.native?.state,u.native?.substate,u.native?.anchorFlags]))}
    let elapsed=0,i=0
    while(elapsed<20-1e-9){const dt=Math.min(schedule[i++%schedule.length],20-elapsed);advanceGame(w,clock,dt);elapsed+=dt}
    rings(w)
    assert.equal(history.length,240)
    return {history,random:w.randomState,units:w.units,footprints:w.footprints.cursor}
  }
  const expected=run([1/60])
  for(const fps of [5,30,120,144,240])assert.deepEqual(run([1/fps]),expected,`${fps} Hz`)
  assert.deepEqual(run([.008,.009,.13,.004,.034]),expected,'irregular frames')
})


test('exhausted resting search waits and retries its original anchor through state 10',()=>{
  const w=group(1);for(let i=0;i<200;i++)tick(w,1/12)
  const u=w.units[0],p=u.native
  p.substate=0;p.anchorFlags=0
  for(let i=0;i<16;i++)w.indexedSearch[i*12]=1
  stepLiveResting(w,u);assert.equal(p.state,1);assert.ok(p.timer>=50&&p.timer<100)
  for(let i=0;i<16;i++)w.indexedSearch[i*12]=0
  p.timer=1;p.anchorX=(p.anchorX+512)&65535
  const anchor={x:p.anchorX,y:p.anchorY}
  stepLiveResting(w,u);assert.equal(p.state,10)
  stepLiveResting(w,u);assert.ok([17,19].includes(p.state))
  assert.deepEqual({x:p.anchorX,y:p.anchorY},anchor)
})
