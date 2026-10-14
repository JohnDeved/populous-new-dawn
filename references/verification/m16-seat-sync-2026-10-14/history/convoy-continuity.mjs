import assert from 'node:assert/strict';
import { browserPosition } from '../../app/model.ts';
export const wrappedDistance=(a,b)=>Math.hypot(...['x','z'].map(k=>{const d=Math.abs(a[k]-b[k]);return Math.min(d,256-d)}));
export function physicalSnapshot(w,ids,boatId=62){return{boatId,boat:w.vehicles.find(v=>v.id===boatId)?browserPosition(w.vehicles.find(v=>v.id===boatId)):null,people:ids.map(id=>{const u=w.units.find(u=>u.id===id);return u?{id,x:u.x,z:u.z,vehicle:u.native?.vehicle,flight:!!u.flight}:null})};}
export function verifyPhysicalStep(w,prior,{strictGround=false}={}){
 const boat=w.vehicles.find(v=>v.id===prior.boatId);if(prior.boat&&boat)assert.ok(wrappedDistance(prior.boat,browserPosition(boat))<1,'Craft displacement bound');
 for(const p of prior.people){assert.ok(p,'Original party member must exist');const u=w.units.find(u=>u.id===p.id);assert.ok(u&&u.hp>0,'Original party must stay alive during crossing');const moved=wrappedDistance(p,u),boarding=!p.vehicle&&u.native?.vehicle;
  if(boarding){assert.equal(u.native.vehicle,boat.id);assert.ok(boat.passengers.includes(u.id));assert.ok(wrappedDistance(u,browserPosition(boat))<2);assert.ok(moved<5,'Local settled-seat attachment diagnostic (existing adapter, not exact native boarding parity)');}
  else if(p.vehicle||u.native?.vehicle||p.flight||u.flight||strictGround)assert.ok(moved<2,`Physical continuity for${u.id}: ${moved} at${w.turn}`);
  if(p.vehicle&&!u.native?.vehicle){assert.equal(u.flight,u.native,'Route departure must publish flight owner');assert.ok(wrappedDistance(u,browserPosition(boat))<2,'Departure must begin at craft');}
  if(u.native?.vehicle){assert.ok(boat.passengers.includes(u.id));assert.equal(w.objectCells.objects.get(u.id),u.native);}
 }
}
