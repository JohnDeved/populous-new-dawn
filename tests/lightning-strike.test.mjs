import assert from 'node:assert/strict'
import test from 'node:test'
import fixture from './fixtures/lightning-strike.json' with { type: 'json' }
import manifest from '../decomp/exports.json' with { type: 'json' }
import rules from '../app/original-rules.json' with { type: 'json' }
import { strikeLightning } from '../app/lightning.ts'
import { stepElectrocution } from '../app/person-state.ts'
import { createBlastWave } from '../app/blast-wave.ts'
import { createWorld, addUnit, cast, tick, findPath, unitAnimationSource, canOrder, select, command, guardShaman } from '../app/model.ts'
import { createLivePerson } from '../app/live-people.ts'

test('original Lightning target gates, inclusive cap, attacker and electrocution phases', () => {
  assert.equal(fixture.executableSha256, manifest.executableSha256)
  for (const {input,expected} of fixture.strikes) {
    const c = structuredClone(input), events = []
    if (c.allocation & 2) strikeLightning(c.people, c.tribe, p => events.push(['initialize',c.people.indexOf(p)+1,p.state]))
    assert.deepEqual({people:c.people,events},expected)
  }
  for (const {input,expected} of fixture.phases) {
    const person = {...input}, events = []
    if (stepElectrocution(person,(_,o)=>events.push(['animation',o]))) events.push(['initialize',1,3])
    assert.deepEqual({person,events},expected)
  }
  assert.deepEqual({...createBlastWave({x:256,y:256,h:128},1),scatter:true},fixture.wave)
})

function readyStrike() {
  const w = createWorld()
  w.manaWorld.gameFlags = 32
  w.units=[];w.buildings=[];w.trees=[];w.shrines=[]
  w.terrain.fill(3);w.terrainVersion++
  const caster=addUnit(w,'blue','shaman',{x:-4,z:0})
  addUnit(w,'red','shaman',{x:30,z:30})
  findPath(w,caster,{x:0,z:0})
  w.shots.lightning=1
  assert.ok(cast(w,'lightning',{x:6,z:0}))
  for(let i=0;w.projectiles.length&&i<120;i++)tick(w,1/12)
  const bolt=w.effects.find(e=>e.lightning)
  assert.equal(bolt.lightning.turn,-1)
  return {w,bolt}
}

test('live Lightning retains victims, displays native shock sprites, scatters survivors and cleans up', () => {
  const {w,bolt}=readyStrike()
  const victim=addUnit(w,'red','brave',{x:7,z:-1})
  const allyVictim=addUnit(w,'blue','brave',{x:7,z:-1})
  const survivor=addUnit(w,'blue','brave',{x:9,z:-1})
  const protectedUnit=addUnit(w,'red','warrior',{x:7.2,z:-1})
  protectedUnit.native=createLivePerson(w,protectedUnit)
  protectedUnit.native.flags3|=0x20000
  const health=protectedUnit.hp
  assert.ok(victim.hp>0,'arrival precedes the native strike dispatch')
  tick(w,1/12)
  assert.equal(victim.hp,0)
  assert.ok(w.units.includes(victim))
  assert.equal(victim.native.state,44)
  assert.equal(victim.native.damageAttacker,0)
  assert.equal(victim.native.substate,1)
  assert.equal(canOrder(allyVictim),false)
  select(w,'all');assert.ok(!w.selected.includes(allyVictim.id))
  w.selected=[allyVictim.id];command(w,{x:3,z:0});guardShaman(w)
  assert.equal(allyVictim.work,null);assert.equal(allyVictim.guard,false);assert.deepEqual(allyVictim.path,[])
  assert.equal(protectedUnit.hp,health)
  assert.equal(w.effects.some(e=>e.wave),false)
  tick(w,1/12)
  assert.equal(victim.native.substate,2)
  assert.equal(unitAnimationSource(victim).object,rules.animationObjects[rules.personAnimationObjects[27*9+3]][0])
  assert.equal(bolt.lightning.turn,1)
  const wave=w.effects.find(e=>e.wave)
  assert.ok(wave.wave.scatter)
  assert.equal(wave.wave.remaining,3,'a newly allocated wave starts next turn')
  assert.equal(survivor.flight,undefined)
  for(let i=0;i<3;i++)tick(w,1/12)
  assert.ok(survivor.flight,'nearby survivors receive the shared native impulse')
  assert.equal(protectedUnit.hp,health)
  for(let i=0;i<140&&w.units.includes(victim);i++)tick(w,1/12)
  assert.ok(!w.units.includes(victim),'electrocuted people are eventually removed after flight')
  assert.equal(victim.native?.state===44,false)
})

test('Lightning outcomes and turn-by-turn poses are independent of rendering cadence', () => {
  const run = schedule => {
    const {w}=readyStrike()
    addUnit(w,'red','brave',{x:7,z:-1})
    addUnit(w,'blue','brave',{x:9,z:-1})
    const history=[]
    const afterTurn=()=>history.push({turn:w.turn,random:w.randomState,units:w.units.map(u=>({id:u.id,x:u.x,z:u.z,hp:u.hp,state:u.native?.state,phase:u.native?.substate,flight:u.flight&&{x:u.flight.x,y:u.flight.y,h:u.flight.h}})),waves:w.effects.filter(e=>e.wave).map(e=>({...e.wave}))})
    let elapsed=0,i=0
    while(elapsed<8-1e-9){const dt=Math.min(schedule[i++%schedule.length],8-elapsed);tick(w,dt,{afterTurn});elapsed+=dt}
    return history
  }
  const reference=run([1/60])
  for(const fps of [5,30,120,144,240])assert.deepEqual(run([1/fps]),reference,`${fps} Hz`)
  assert.deepEqual(run([.008,.009,.13,.004,.034]),reference,'irregular frames')
})
