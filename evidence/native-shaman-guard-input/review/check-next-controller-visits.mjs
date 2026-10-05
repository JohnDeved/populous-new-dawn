import assert from 'node:assert/strict'
import {addUnit,addBuilding,createWorld,command,guardShaman,tick} from '../../../app/model.ts'
import {createStartedWorld,retainFixtureUnits} from '../../../tests/level-start-fixture.mjs'
import {setSelection} from '../../../app/selection-runtime.ts'
import {currentPersonOrder} from '../../../app/person-orders.ts'
function setup(kind){const w=createStartedWorld(1);retainFixtureUnits(w,()=>false);w.buildings=[];w.trees=[];w.shrines=[];w.terrain.fill(3);w.terrainVersion++;w.manaWorld.gameFlags=32;addUnit(w,'blue','shaman',{x:0,z:8});const u=addUnit(w,'blue','firewarrior',{x:2,z:8});for(let i=0;i<40;i++)tick(w,1/12);setSelection(w,[u.id]);let to={x:24,z:8};if(kind==='attack')to=addBuilding(w,'red','hut',{x:12,z:8},true);if(kind==='entry')to=addBuilding(w,'blue','tower',{x:12,z:8},true);if(kind==='worship'){to=structuredClone(createWorld(1).shrines.find(s=>s.kind==='lightning'));to.id=w.nextId++;w.shrines.push(to);}return{w,u,to};}
function view(w,u){const p=u.native??u.entry?.person??u.builder?.person;return{turn:w.turn,random:w.randomState,state:p?.state,status:p?.commandStatus,target:p?.target,speed:p?.speed,source:p?.object,draw:p?.draw,f1:p?.f1,f2:p?.f2,guards:w.manaTribes[0].shamanGuards,guardChanged:w.manaTribes[0].shamanGuardChanged,marker:p?.guardInputPending,order:p&&currentPersonOrder(w.buildingOrders,p)?.model};}
const rows=[];
for(const kind of ['move','attack','worship','entry']){
 const {w,u,to}=setup(kind),original=u.native;
 const control=structuredClone(w),cu=control.units.find(a=>a.id===u.id);
 guardShaman(w);const pending=view(w,u);
 assert.equal(command(w,to),true);assert.equal(command(control,to),true);
 const comparable=v=>{const {guardChanged,...rest}=v;return rest};
 assert.deepEqual(comparable(view(w,u)),comparable(view(control,cu)),'immediate replacement timing apart from legitimate guard cleanup');
 const snapshots=[{stage:'after-input',actual:view(w,u),control:view(control,cu)}];
 for(let turn=1;turn<=3;turn++){
  tick(w,1/12);tick(control,1/12);
  const owner=u.native??u.entry?.person??u.builder?.person;
  assert.equal(owner,original,'same native record through replacement ownership');
  assert.equal(owner.guardInputPending,undefined);
  assert.equal(w.manaTribes[0].shamanGuards,0);
  assert.equal(currentPersonOrder(w.buildingOrders,owner)?.model,{move:3,attack:19,worship:27,entry:8}[kind]);
  assert.equal(owner.commandStatus,{move:3,attack:19,worship:27,entry:8}[kind]);
  if(kind==='entry'&&turn===1)assert.ok(owner.flags2&16,'fresh entry skips preparation');
  else assert.equal(owner.flags2&16,0,'actual preparation consumes bit16 for replacement');
  snapshots.push({stage:`logical-visit-${turn}`,actual:{...view(w,u),bit16:!!(owner.flags2&16)},control:view(control,cu)});
 }
 rows.push({kind,pending,snapshots});
}
console.log(JSON.stringify(rows,null,2));
