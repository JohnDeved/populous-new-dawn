import assert from 'node:assert/strict'
import test from 'node:test'
import {createWorld,addUnit,tick} from '../app/model.ts'
import {migrateCheckpoint} from '../app/game-store.ts'
import {nativeCellPoint} from '../app/world-coordinates.ts'
import {missionData} from '../app/mission-data.ts'

function fixture() {
  const w=createWorld(7),home=w.units.find(u=>u.team==='yellow'&&u.kind==='shaman')
  // Supplied trained army, incursion and mana. Not natural training/economy proof.
  for(let i=0;i<8;i++) {
    addUnit(w,'yellow','warrior',home)
    addUnit(w,'yellow','preacher',home)
  }
  const point=nativeCellPoint(missionData(7).level.markers[4])
  const ids=[]
  for(let i=0;i<6;i++) {
    addUnit(w,'blue','brave',point)
    ids.push(w.units.at(-1).id)
  }
  w.turn=922
  w.manaTribes[2].mana=1000000
  return {w,ids,shaman:home.id}
}
const raids=w=>w.ai.tasks.filter(t=>(t.flags&1)&&t.type===20)
const lightning=w=>w.projectiles.filter(p=>p.spell==='lightning')

test('M7 marker4 raid casts paid Lightning through ordinary ticks, impacts and replays',()=>{
  const {w,ids,shaman}=fixture()
  while(w.turn<1199) tick(w,1/12)
  assert.equal(w.spellCasts[2][3],0)
  assert.equal(raids(w)[0].phase,6)
  assert.deepEqual(raids(w)[0].spells,[3,0,0])
  const unfunded=migrateCheckpoint(structuredClone(w))
  unfunded.manaTribes[2].mana=0
  const mana=w.manaTribes[2].mana
  tick(w,1/12)
  tick(unfunded,1/12)
  assert.equal(w.turn,1200)
  assert.equal(w.spellCasts[2][3],1)
  assert.deepEqual(raids(w)[0].spells,[0,0,0])
  assert.equal(lightning(w).length,1)
  assert.equal(lightning(w)[0].caster,shaman)
  assert.equal(lightning(w)[0].phase,'windup')
  assert.ok(w.manaTribes[2].mana<mana-79000)
  assert.equal(unfunded.spellCasts[2][3],0)
  assert.deepEqual(raids(unfunded)[0].spells,[3,0,0])
  const replay=migrateCheckpoint(structuredClone(w))
  let flying=false,effect=false
  for(let i=0;i<24;i++) {
    tick(w,1/12);tick(replay,1/12);tick(unfunded,1/12)
    assert.deepEqual(replay,w)
    flying ||= lightning(w).some(p=>p.phase==='flying')
    effect ||= w.effects.some(e=>e.kind==='lightning'&&e.lightning?.tribe===2)
    if(w.turn===1210) {
      assert.ok(ids.every(id=>w.units.find(u=>u.id===id)?.hp===0))
      assert.ok(ids.every(id=>unfunded.units.find(u=>u.id===id)?.hp===50))
    }
  }
  assert.ok(flying)
  assert.ok(effect)
  assert.equal(w.spellCasts[2][3],1)
  assert.equal(unfunded.spellCasts[2][3],0)
})
