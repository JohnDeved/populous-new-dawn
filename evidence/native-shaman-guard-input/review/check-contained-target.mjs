import assert from 'node:assert/strict'
import {addUnit,addBuilding,command,guardShaman,tick} from '../../../app/model.ts'
import {createStartedWorld,retainFixtureUnits} from '../../../tests/level-start-fixture.mjs'
import {setSelection} from '../../../app/selection-runtime.ts'
import {currentPersonOrder} from '../../../app/person-orders.ts'
const w=createStartedWorld(1);retainFixtureUnits(w,()=>false);w.buildings=[];w.trees=[];w.shrines=[];w.terrain.fill(3);w.terrainVersion++;w.manaWorld.gameFlags=32;
const shaman=addUnit(w,'blue','shaman',{x:0,z:8}),u=addUnit(w,'blue','firewarrior',{x:2,z:8});
for(let i=0;i<40;i++)tick(w,1/12);
const tower=addBuilding(w,'blue','tower',{x:8,z:8},true);
setSelection(w,[u.id]);guardShaman(w);tick(w,1/12);assert.equal(currentPersonOrder(w.buildingOrders,u.native)?.model,30);
setSelection(w,[shaman.id]);const accepted=command(w,tower);const transitions=[];
for(let i=0;i<1200;i++){
 const before=currentPersonOrder(w.buildingOrders,u.native)?.model;
 tick(w,1/12);
 const after=currentPersonOrder(w.buildingOrders,u.native)?.model;
 if(shaman.inside!==null||before!==after)transitions.push({i,shamanInside:shaman.inside,towerId:tower.id,shamanState:(shaman.native??shaman.entry?.person)?.state,shamanVehicle:(shaman.native??shaman.entry?.person)?.vehicle,shamanHp:shaman.hp,before,after,guardState:u.native?.state,guardCount:w.manaTribes[0].shamanGuards});
 if(shaman.inside!==null&&after!==30)break;
}
console.log(JSON.stringify({accepted,shamanInside:shaman.inside,guardOrder:currentPersonOrder(w.buildingOrders,u.native)?.model,transitions},null,2));
assert.equal(shaman.inside,tower.id,'real public building order reaches occupied Tower');
assert.equal(currentPersonOrder(w.buildingOrders,u.native)?.model,30,'a live non-vehicle target entering a building should retain Guard30');
