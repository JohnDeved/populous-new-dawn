import assert from 'node:assert/strict'
import test from 'node:test'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
await loadSceneFixture()
const { ObjectPanels } = await import('../app/object-panels.ts')
const { createGameStore } = await import('../app/game-store.ts')
const { addUnit, browserPosition } = await import('../app/model.ts')
const { createLivePerson } = await import('../app/live-people.ts')
const { boardLiveVehicle } = await import('../app/live-vehicles.ts')

// Actual event registration, store presentation binding, boarding and selection.
// Supplied DOM, boarded people and focus-open recorder: not browser/acquisition proof.
function setup(t) {
 const previous=Object.getOwnPropertyDescriptor(globalThis,'document')
 const element=()=>({children:[],dataset:{},classList:{add(){}},setAttribute(){},insertBefore(child){this.children.push(child)},addEventListener(type,fn){this[type]=fn}})
 Object.defineProperty(globalThis,'document',{configurable:true,value:{createElement:element}})
 t.after(()=>previous?Object.defineProperty(globalThis,'document',previous):delete globalThis.document)
 const store=createGameStore();store.startMission(22)
 const world=store.getWorld(),vehicle=world.vehicles.find(v=>v.model===1&&v.active)
 assert.ok(vehicle)
 world.units=[];world.pathfinding.people.clear();world.inputMask=0
 const unit=addUnit(world,'blue','brave',browserPosition(vehicle))
 unit.native=createLivePerson(world,unit);unit.native.state=10
 world.pathfinding.people.set(unit.id,unit.native);boardLiveVehicle(world,unit.native,vehicle)
 assert.equal(unit.native.vehicle,vehicle.id)
 world.selected=[]
 const binding=store.bindPresentation(world),events=[]
 const scene={world,isCurrent:()=>!scene.disposed&&binding.isCurrent(),disposed:false,overviewActive:false,unitMeshes:new Map(),gameClock:{animationFrame:0},container:{insertBefore(){}},onSound:n=>events.push(['sound',n]),onChange:()=>events.push(['change'])}
 const panels=new ObjectPanels(scene);scene.objectPanels=panels
 panels.open(vehicle.id,true)
 const button=panels.panels.get(vehicle.id).element.children[1]
 button.dataset.person=String(unit.id);button.dataset.unload='false'
 panels.open=(id,immediate)=>events.push(['open',id,immediate])
 return {store,world,vehicle,unit,scene,events,click:()=>button.click({detail:1,shiftKey:false}),focus:()=>button.contextmenu({preventDefault(){},shiftKey:false})}
}
test('current vehicle passenger click retains actual selection and feedback',t=>{
 const f=setup(t);f.click();assert.deepEqual(f.world.selected,[f.unit.id]);assert.ok(f.unit.native.flags3&0x10000000);assert.deepEqual(f.events,[['sound',0x6a],['change']])
})
test('current vehicle passenger right-click retains inspection',t=>{
 const f=setup(t);f.focus();assert.deepEqual(f.events,[['open',f.unit.id,true]]);assert.deepEqual(f.world.selected,[])
})
for(const action of ['click','focus'])for(const mode of ['disposed','store replacement','same-ID replacement','removed vehicle','inactive vehicle','overview','input mask'])test(`stale vehicle ${action} after ${mode} has no selection or feedback`,t=>{
 const f=setup(t)
 if(mode==='disposed')f.scene.disposed=true
 if(mode==='store replacement')f.store.startMission(2)
 if(mode==='same-ID replacement')f.world.vehicles=f.world.vehicles.map(v=>v===f.vehicle?{...v}:v)
 if(mode==='removed vehicle')f.world.vehicles=f.world.vehicles.filter(v=>v!==f.vehicle)
 if(mode==='inactive vehicle')f.vehicle.active=false
 if(mode==='overview')f.scene.overviewActive=true
 if(mode==='input mask')f.world.inputMask=1
 const flags=f.unit.native.flags3
 f[action]()
 assert.deepEqual(f.world.selected,[]);assert.equal(f.unit.native.flags3,flags);assert.deepEqual(f.events,[])
})
