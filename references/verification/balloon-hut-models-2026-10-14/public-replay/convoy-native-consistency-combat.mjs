// Supplemental qualification assertion. Does not mutate the world.
// Existing bounded motion/boarding diagnostic stays in convoy-continuity.mjs.
import assert from 'node:assert/strict';
import {vehicleSeat} from '../../app/vehicle-seats.ts';
import {browserPosition,wrappedDistance} from '../../app/world-coordinates.ts';
export function assertNativeSeatConsistency(w,ids){
 for(const id of ids){
  const u=w.units.find(u=>u.id===id);assert.ok(u&&u.hp>0,`Live transported person ${id}`);
  const attached=w.vehicles.find(v=>v.active&&v.passengers.includes(id));
  const p=attached?u.native:(u.flight??u.fight?.motion??u.native);
  if(!p){assert.ok(!u.flight,`Active flight requires an owner for ${id}`);assert.ok(!attached,`Attached person requires native owner for ${id}`);continue;}
  if(attached){assert.equal(p,u.native);assert.equal(p.vehicle,attached.id);}
  assert.equal(wrappedDistance(u,browserPosition(p)),0,`Native/browser position agreement for ${id} at ${w.turn}`);
  assert.equal(w.objectCells.objects.get(id),p,`Registered native owner for ${id}`);
  if(p.flags2&0x20000){
   const index=((p.y&65535)>>9)*128+((p.x&65535)>>9),seen=new Set();let current=w.objectCells.heads[index],found=false;
   while(current){assert.ok(!seen.has(current),'No cell-list cycle');seen.add(current);if(current===id){found=true;break;}const next=w.objectCells.objects.get(current);assert.ok(next,'Registered cell-list member');current=next.cellNext;}
   assert.ok(found,`Native owner linked at actual coordinate cell for ${id}`);
  }
  if(p.vehicle){const v=w.vehicles.find(v=>v.id===p.vehicle);assert.ok(v?.active&&v.passengers.includes(id),'Live owning vehicle slot');const seat=vehicleSeat(v,v.passengers.indexOf(id));assert.deepEqual({x:p.x&65535,y:p.y&65535,h:p.h},{x:seat.x&65535,y:seat.y&65535,h:seat.h},'Native passenger matches actual current seat XYZ');}
 }
}
