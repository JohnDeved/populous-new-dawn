// Strict validation over actual existing-listener snapshots, never inferred history.
import assert from 'node:assert/strict'
import { acceptedOrderEvidence } from './accepted-input.mjs'
const ownerFields=['model','flags','references','object','a','b']
function requireCommandOwner(unit) {
  const expected=unit.commandOwnerSlots.find(Boolean)??null,p=unit.commandOwner
  assert.equal(unit.commandOwnerIdentity,expected,'Command owner follows the accepted campaign priority')
  if(!p){assert.equal(expected,null);assert.equal(unit.order,null);return}
  assert.equal(p.identity,expected);assert.equal(p.id,unit.id,'Command belongs to the actual selected person')
  const id=p.immediateCommand||p.commands[p.commandCursor]||0
  assert.equal(p.activeId,id,'This is the actual current-cursor queue slot, not adoption')
  const record=id?p.orders.find(o=>o.id===id)?.record:null
  assert.deepEqual(unit.order,record?{id,...Object.fromEntries(ownerFields.map(key=>[key,record[key]]))}:null,'Recipient order comes from that owner and current cursor, never a later slot')
}
export function acceptedInputBoundary(before,after,hit,delivery) {
  assert.equal(delivery?.restored,true);assert.deepEqual(delivery.errors,[])
  assert.deepEqual(delivery.events.map(e=>e.type),['pointerdown','pointerup'])
  for(const event of delivery.events){
    assert.equal(event.trusted,true);assert.equal(event.button,0)
    assert.equal(event.x,hit.x);assert.equal(event.y,hit.y)
    assert.equal(event.canvasOwned,true);assert.equal(event.canvasTarget,true)
    assert.ok(!event.picks.some(p=>p.threw),'A real picker exception cannot earn acceptance')
    for(const sample of [event.state,event.after]){
      for(const key of ['currentSceneMatches','currentWorldMatches','armedWorldMatches','armedCanvasMatches'])assert.equal(sample?.[key],true)
      const input=sample.input;assert.equal(input?.scope,'synchronous-existing-pointer-handler')
      for(const key of ['epoch','sceneIdentity','worldIdentity']){assert.equal(input[key],before[key]);assert.equal(input[key],after[key])}
      assert.equal(input.status,'playing');assert.equal(input.paused,false);assert.equal(input.speed,1);assert.equal(input.inputMask,0);assert.equal(input.mode,null)
      for(const unit of input.units)requireCommandOwner(unit)
    }
  }
  const event=delivery.events[1],inputBefore=event.state.input,inputAfter=event.after.input
  assert.deepEqual(inputBefore.selected,before.selected)
  assert.equal(inputBefore.turn,inputAfter.turn,'One synchronous handler boundary cannot contain simulated turns')
  assert.equal(inputAfter.lastOrderTurn,inputBefore.turn,'Fresh dispatch belongs to the actual handler turn')
  const acceptance=acceptedOrderEvidence(inputBefore,inputAfter,hit)
  if(!hit.id){
    const marker=acceptance.marker
    assert.ok(!inputBefore.effects.some(e=>e.id===marker.id),'Marker is genuinely new versus pre-handler effects')
    assert.equal(marker.secondaryOwner?.kind,'orderMarker');assert.equal(marker.secondaryOwner?.effect,marker.id)
    assert.ok(Number.isInteger(marker.secondaryOwner?.serial)&&marker.secondaryOwner.serial>0,'The real effect has its real secondary owner')
    for(const id of acceptance.recipientIds)assert.equal(inputAfter.units.find(u=>u.id===id).order.model,3,'This bounded driver requests model3')
  }
  return {acceptance,inputBefore,inputAfter,meaning:'Observed input/attached current-cursor record; not native adoption or completed movement'}
}
export function requireOrdinaryMoveContinuation(assigned,current,id) {
  const before=assigned.units.find(u=>u.id===id),u=current.units.find(u=>u.id===id),p=u?.native
  assert.equal(before?.order?.model,3,'Actual handler assigned model3 before any later completion')
  assert.equal(u?.identity,before.identity);assert.equal(u?.nativeIdentity,before.nativeIdentity)
  assert.ok(u.hp>0);assert.equal(u.team,'blue');assert.equal(u.kind,'firewarrior')
  assert.equal(p?.class,1);assert.equal(p?.model,6);assert.ok([10,17,19].includes(p.state))
  assert.equal(p.vehicle,0);assert.equal(p.flags2&(1|0x80000|0x100000|0x800000),0);assert.equal(p.flags4&0x800,0)
  assert.equal(p.guardInputPending,null);assert.equal(p.workFlags??0,0)
  for(const key of ['ghost','flight','fight','casting','lift','entry','builder','harvest','delivery','vault','attackReservation','otherRegisteredRoute'])assert.equal(u.busy[key],false)
  assert.equal(u.fighting,false);for(const key of ['inside','work','target'])assert.equal(u[key],null);assert.equal(u.busy.tree,null)
  if(u.path.length)assert.equal(u.busy.registeredRouteIsNative,true)
  assert.ok([0,3].includes(p.commandStatus))
  const ids=[p.immediateCommand,...p.commands].filter(Boolean)
  for(const command of ids)assert.equal(p.orders.find(o=>o.id===command)?.record?.model,3)
  if(p.state===10)assert.ok(ids.length,'Do not accept unsupported empty state10')
  return {observedState:p.state,queuedModels:ids.map(()=>3),meaning:ids.length?'model3 remains queued/current; adoption requires its own evidence':'same ordinary idle owner with empty queue; no completed-Move inference'}
}
