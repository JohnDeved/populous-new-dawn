import test from 'node:test'
import assert from 'node:assert/strict'
import {vehiclePanel,vehiclePanelGeometry,selectVehicleOccupants,vehiclePanelInput} from '../app/vehicle-panel.ts'
import {vehicleUnloadReady,unloadVehiclePeople} from '../app/vehicle-unload.ts'
import {paintPanel} from '../app/training-panel.ts'

test('vehicle panel uses native kind9 geometry, disabled raw art and selection overlays',()=>{
 for(const [model,width,capacity] of [[1,120,5],[2,120,5],[3,72,2],[4,72,2]]){
  const g=vehiclePanelGeometry(model),empty=vehiclePanel(model,[],false)
  assert.deepEqual([g.width,g.height,g.capacity],[width,62,capacity])
  assert.equal(empty.events.filter(e=>e[0]==='sprite'&&e[1]===75&&e[5]).length,capacity)
  assert.deepEqual(empty.events.find(e=>e[0]==='sprite'&&e[1]===60).slice(4),[-1,true])
  const full=vehiclePanel(model,[{model:2,selected:true,own:true}],true,-2)
  assert.ok(full.events.some(e=>e[0]==='sprite'&&e[1]===61&&!e[5]))
  assert.equal(full.events.filter(e=>e[0]==='sprite'&&e[1]===53).length,1)
 }
})
test('raw disabled vehicle sprite alpha is85 while tail remains170 and normal art opaque',()=>{
 const seen=[],context={globalAlpha:1,imageSmoothingEnabled:true,drawImage(){seen.push(this.globalAlpha)}},canvas={getContext:()=>context}
 paintPanel(canvas,{}, {width:120,height:62,events:[['sprite',60,0,0,-1,true],['sprite',60,0,0,-1,false],['sprite',52,0,0,-1,false]]})
 assert.deepEqual(seen,[85/255,1,170/255]);assert.equal(context.globalAlpha,1)
})
test('vehicle selection keeps work on single, expands deselection, and Shift selects blocked mates',()=>{
 const people=[0,1,2].map(i=>({id:i+1,flags3:128,flags4:i===2?128:0,selectionFlags:0}))
 selectVehicleOccupants(people,1,false);assert.deepEqual(people.map(p=>p.selectionFlags),[128,0,0]);assert.equal(people[0].flags3,0x10000080)
 selectVehicleOccupants(people,1,false);assert.deepEqual(people.map(p=>p.selectionFlags),[0,0,0])
 selectVehicleOccupants(people,1,true);assert.deepEqual(people.map(p=>p.selectionFlags),[128,128,128]);assert.equal(people[0].flags3,0)
})
test('passenger right-click has inspection semantics, while unload right-click is inert',()=>{
 assert.equal(vehiclePanelInput({id:1},false,true,false),'focus')
 assert.equal(vehiclePanelInput({id:1},false,false,false),'select')
 assert.equal(vehiclePanelInput(undefined,true,true,true),undefined)
 assert.equal(vehiclePanelInput(undefined,true,false,false),undefined)
 assert.equal(vehiclePanelInput(undefined,true,false,true),'unload')
})
test('unload readiness refresh clears cached success at speed12 or failed terrain',()=>{
 const v={speed:11,navigationFlags:3}
 assert.equal(vehicleUnloadReady(v,true,true),true);assert.equal(v.navigationFlags,0x100003)
 v.speed=12;assert.equal(vehicleUnloadReady(v,true,true),false);assert.equal(v.navigationFlags,3)
 v.speed=-1;assert.equal(vehicleUnloadReady(v,true,false),false)
})
test('stale unload failure repeatedly clears only current driver orders, without teleporting anyone',()=>{
 const p={id:1,savedVehicle:9},v={model:1,passengerCount:2,passengers:[1,2]},calls=[]
 const count=unloadVehiclePeople({randomState:1},v,new Map([[1,p],[2,{id:2,savedVehicle:9}]]),{exit:()=>({point:{x:0,y:0},found:false}),clearOrders:p=>calls.push(p.id),launched:()=>assert.fail('no launch')})
 assert.equal(count,0);assert.deepEqual(calls,[1,1,1,1,1]);assert.deepEqual(v.passengers,[1,2]);assert.equal(p.savedVehicle,0)
})

test('hover adds a native fill, never a false selected marker; pressed overlays palette130',()=>{
 const people=[{model:2,selected:false,own:true}],hovered=vehiclePanel(1,people,true,0),pressed=vehiclePanel(1,people,true,0,true)
 assert.equal(hovered.events.some(e=>e[0]==='sprite'&&e[1]===53),false)
 assert.ok(hovered.events.some(e=>e[0]==='fill'&&e[3]===255&&JSON.stringify(e[2])===JSON.stringify([4,2,20,26])))
 assert.ok(pressed.events.some(e=>e[0]==='sprite'&&e[1]===75&&e[4]===130))
 assert.equal(vehiclePanel(1,[{...people[0],own:false}],true,0,true).events.some(e=>e[0]==='sprite'&&e[4]===130),false)
})
