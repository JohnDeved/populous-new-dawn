import assert from 'node:assert/strict'
import test from 'node:test'
import { attackCombatBuilding } from '../app/combat-building.ts'
import { runBuildingAttack } from './building-attack-case.mjs'
import fixture from './fixtures/building-attack.json' with { type: 'json' }

test('building attack phases, entrances, damage and shake match native execution', () => {
  for (const { input, expected } of fixture.cases)
    assert.deepEqual(runBuildingAttack(structuredClone(input)), expected, input.mode)
})

test('an entirely occupied world cancels special positioning instead of hanging', () => {
  const c = structuredClone(fixture.cases.find(c => c.input.mode === 'sequence').input)
  Object.assign(c.p, { animationMode: 52, assignment: 16, flags2: 0 })
  Object.assign(c.b, { class: 2, tribe: (c.p.tribe + 1) % 4 })
  let probes = 0
  assert.equal(
    attackCombatBuilding(c.w, c.p, c.b, {
      buildingAt: () => {
        probes++
        return 2
      },
      destination: () => assert.fail('No destination exists'),
    }),
    'restart'
  )
  assert.ok(probes > 0 && probes <= 65536)
})

import {createWorld,addBuilding,addUnit,command,tick} from '../app/model.ts'
import {advanceGame} from '../app/game-clock.ts'
import {currentPersonOrder} from '../app/person-orders.ts'

function battlefield(occupied=false,kind='warrior'){
  const w=createWorld();w.manaWorld.gameFlags=32;w.units=[];w.buildings=[];w.shrines=[];w.trees=[]
  w.terrain.fill(3);w.terrainVersion++
  const b=addBuilding(w,'red','hut',{x:0,z:0}),u=addUnit(w,'blue',kind,{x:0,z:8})
  w.selected=[u.id];command(w,b)
  let defender
  if(occupied){defender=addUnit(w,'red','brave',b);defender.inside=b.id;defender.work=b.id}
  return {w,b,u,defender,clock:{animationTime:0,animationFrame:0}}
}

test('live building assault enters, strikes, shakes and destroys via native damage accumulation',()=>{
  for(const kind of ['brave','warrior','shaman']){
    const {w,b,u,clock}=battlefield(false,kind),phases=new Set(),poses=new Set()
    let firstHit=false,shake=false
    for(let i=0;i<2400&&b.hp>0;i++){
      advanceGame(w,clock,1/12)
      if(u.native){phases.add(u.native.animationMode);poses.add(u.native.object)}
      if(b.damageState?.damage>0&&!firstHit){assert.equal(u.native.animationMode,46);firstHit=true}
      shake ||= !!b.damageState?.tilt
    }
    assert.ok(b.hp<=0,`${kind} destroys the hut`)
    assert.ok(firstHit&&shake);assert.ok([30,31,23,46].every(p=>phases.has(p)));assert.ok(poses.size>=2)
    assert.ok(w.sounds.some(s=>s.cue===1));assert.ok(w.effects.some(f=>f.debris)||w.sounds.some(s=>s.cue===0x34))
    advanceGame(w,clock,1/12)
    assert.equal(w.buildingOrders.active,0,'destroyed target releases its command reference')
    assert.ok([17,19].includes(u.native.state), 'the released attacker returns to native rest')
    assert.equal(currentPersonOrder(w.buildingOrders,u.native),undefined)
  }
})

test('occupied building ejects a defender and the same native command resumes after winning',()=>{
  const {w,b,u,defender,clock}=battlefield(true),phases=new Set()
  advanceGame(w,clock,1/12)
  const id=u.native.commands[0],record=w.buildingOrders.records[id]
  assert.equal(record.references,1);assert.equal(record.model,19)
  let ejected=false,fought=false,resumed=false
  for(let i=0;i<700&&!resumed;i++){
    advanceGame(w,clock,1/12)
    phases.add(u.native?.animationMode)
    if(w.fights.some(f=>f.encounterBuilding===b.id)){
      ejected=true;assert.equal(defender.inside,null)
      assert.equal(u.fight.motion.commands[0],id)
      assert.equal(currentPersonOrder(w.buildingOrders,u.fight.motion),record)
    }
    fought ||= !!u.fight && u.fight.action!=='encounter'
    resumed=fought && !u.fight && b.damageState.damage>0
  }
  assert.ok(phases.has(37));assert.ok(ejected&&fought&&resumed)
  assert.equal(record.references,1);assert.equal(w.buildingOrders.active,1)
  w.selected=[u.id];command(w,{x:10,z:8})
  assert.equal(record.references,0);assert.equal(w.buildingOrders.active,0);assert.equal(u.native,null)
  assert.ok(u.path.length,'new player orders interrupt the attack')
})

test('building attack mechanics and poses are independent of rendering cadence',()=>{
  const run=schedule=>{
    const {w,clock}=battlefield(true)
    let elapsed=0,frame=0
    while(elapsed<24-1e-9){const dt=Math.min(24-elapsed,schedule[frame++%schedule.length]);advanceGame(w,clock,dt);elapsed+=dt}
    return {...w,pendingTime:0}
  }
  const baseline=run([1/60])
  for(const schedule of [[1/5],[1/30],[1/120],[1/144],[1/240],[.003,.7,.02,.16]])assert.deepEqual(run(schedule),baseline)
})

test('death and target removal release building-attack pool references',()=>{
  for(const remove of ['attacker','building']){
    const {w,u,b}=battlefield()
    tick(w,1/12);assert.equal(w.buildingOrders.active,1)
    if(remove==='attacker')u.hp=0;else b.hp=0
    tick(w,2/12)
    assert.equal(w.buildingOrders.active,0)
  }
})


import shakeCases from './fixtures/building-shake.json' with {type:'json'}
import {stepBuildingShake,advanceCollapse} from '../app/building-damage.ts'
test('native defence gate and shaking retain counter cadence, signed lifetime and collapse RNG',()=>{
  for(const {input,expected} of shakeCases){
    const w={randomState:input.seed},b={damage:input.damage,...input.shake}
    stepBuildingShake(b,input.counter);advanceCollapse(w,b)
    const {damage,...shake}=b
    assert.deepEqual({randomState:w.randomState,damage,shake},expected)
  }
})

test('cancelling or killing an attacker during its defender encounter releases the retained order',()=>{
  for(const cancel of [true,false]){
    const {w,u,clock}=battlefield(true)
    for(let i=0;i<150&&!u.fight;i++)advanceGame(w,clock,1/12)
    assert.ok(u.fight)
    const record=currentPersonOrder(w.buildingOrders,u.fight.motion)
    assert.equal(record.references,1)
    if(cancel){w.selected=[u.id];command(w,{x:10,z:8})}else u.hp=0
    advanceGame(w,clock,2/12)
    assert.equal(record.references,0);assert.equal(w.buildingOrders.active,0)
  }
})
