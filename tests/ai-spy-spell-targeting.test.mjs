import assert from 'node:assert/strict';
import test from 'node:test';
import rules from '../app/original-rules.json' with { type:'json' };
import { withCampaignTribe } from '../app/campaign-runtime.ts';
import { stepComputerSpells } from '../app/computer-runtime.ts';
import { combatPerson } from '../app/live-combat.ts';
import { createLivePerson, registerLivePerson } from '../app/live-people.ts';
import { appendLiveOrders, stepLiveOrderQueue } from '../app/live-movement.ts';
import { spiralCell } from '../app/native-math.ts';
import { nativeCellPoint } from '../app/world-coordinates.ts';
import { createWorld } from '../app/world-initialization.ts';
import { invisibilityFollowers } from '../app/spell-effects-runtime.ts';
import { addUnit } from '../app/world-state.ts';
import { tick } from '../app/world-turn.ts';
import { TURNS_PER_SECOND } from '../app/world-rules.ts';
function run(kind) {
  const tribe = kind === 'unmasked-tribe0' ? 0 : 1;
  const team = tribe === 0 ? 'blue' : 'red';
  const other = tribe === 0 ? 'red' : 'blue';
  const w=createWorld(1);
  const u=w.units.find(unit => unit.team===team && unit.kind==='shaman');
  assert.ok(u);
  w.units=[u];
  u.native ??= createLivePerson(w,u);
  registerLivePerson(w,u.native);
  u.casting = null;
  const caster=combatPerson(u);
  const origin=((caster.x >>> 8)&254)|(caster.y&0xfe00);
  const cell=spiralCell(origin,1,0);
  const spy=addUnit(w,other,'spy',nativeCellPoint(cell));
  spy.native ??= createLivePerson(w,spy);
  registerLivePerson(w,spy.native);
  assert.equal(spy.native.disguise, (tribe===0?1:0)<<6);
  if (kind==='invisible') {
    assert.deepEqual(invisibilityFollowers(w,spy,other).map(u=>u.id),[spy.id]);
    assert.ok(spy.invisibility);
  }
  if (kind==='pending' || kind==='finished') {
    assert.equal(appendLiveOrders(w,[spy],{model:16,flags:0,references:0,object:0,a:tribe,b:0},true).accepted,true);
    stepLiveOrderQueue(w,spy,spy.native,{});
    assert.equal(spy.native.disguise,(tribe<<6)|63);
    if (kind==='finished') {
      // Run the genuine per-object countdown while pausing tribe AI and leaving native order processing intact.
      w.land.landFlags |= 0x800000;
      const pos = [spy.x,spy.z,u.x,u.z,u.native.x,u.native.y];
      for (let i=0;i<63;i++) tick(w,1/TURNS_PER_SECOND);
      assert.equal(spy.native.disguise,tribe<<6);
      // Hold both positions constant at the later spell-dispatch boundary.
      [spy.x,spy.z,u.x,u.z,u.native.x,u.native.y] = pos;
      Object.assign(spy.native,{state:10,commandStatus:0});
    }
  }
  Object.assign(u.native,{ state:1, flags2:0,flags4:0});
  u.casting = null;
  w.turn=16;
  if (tribe===0) w.campaignAIs[0]=structuredClone(w.campaignAIs[1]);
  const ai=w.campaignAIs[tribe];
  ai.flags=0; ai.states=0; ai.attributes[32]=0;
  for (const e of ai.spellEntries) e.model=0;
  const model=5;
  ai.spellEntries[0]={model,mana:0,range:0,people:1,mode:0};
  w.manaTribes[tribe].mana=rules.spellCharging[model].cost;
  w.manaWorld.spells[tribe].stocks[model]=0;
  w.manaWorld.spells[tribe].available|=1<<model;
  Object.assign(w.castingTribes[tribe],{aiCooldown:0,cooldown:0});
  const before=w.spellCasts[tribe][model];
  withCampaignTribe(w,tribe,()=>stepComputerSpells(w,tribe));
  const casts=w.spellCasts[tribe][model]-before;
  assert.equal(w.spellScans[tribe].cursor,80);
  return {disguise:spy.native.disguise,casts,projectiles:w.projectiles.map(p=>[p.spell,p.caster]),caster:u.id};
}
function assertOutcome(kind, disguise, casts) {
  const observed=run(kind);
  assert.equal(observed.disguise,disguise);
  assert.deepEqual([observed.casts,observed.projectiles],[casts,casts ? [['swarm',observed.caster]] : []]);
}
test('a finalized enemy spy disguise excludes the spy from AI general Swarm targeting', () => assertOutcome('finished',64,0));
test('a pending disguise still exposes the spy under its real tribe', () => assertOutcome('pending',127,1));
test('an ordinary enemy spy is not treated as one of tribe zero', () => assertOutcome('unmasked-tribe0',64,1));
test('a normally visible enemy spy remains eligible', () => assertOutcome('clear',0,1));
test('the separate invisibility bit still excludes an undisguised enemy spy', () => assertOutcome('invisible',0,0));
