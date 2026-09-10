import assert from 'node:assert/strict'
import test from 'node:test'
import fixture from './fixtures/fight-cleanup.json' with { type: 'json' }
import { cleanFightRoster, fightCenter, releaseFightRoster } from '../app/melee-groups.ts'
import { stateAfterFight } from '../app/person-state.ts'
import { createWorld, addUnit, command, nativePosition } from '../app/model.ts'
import { advanceGame } from '../app/game-clock.ts'

test('original cleanup, center, terminal release/counters and recovery match native captures', () => {
  for (const {input,expected} of fixture.cases) {
    const c = structuredClone(input)
    assert.deepEqual({result:cleanFightRoster(c.group,new Map(c.people.map(p=>[p.id,p]))),...c},expected)
  }
  for (const {input:c,expected} of fixture.centers)
    assert.deepEqual(fightCenter(c.group,c.people,new Map(c.objects.map(p=>[p.id,p]))),expected)
  for (const {input,expected} of fixture.terminals) {
    const c=structuredClone(input), objects=new Map(c.people.map(p=>[p.id,p]))
    assert.equal(cleanFightRoster(c.group,objects).active,false)
    releaseFightRoster(c.group,objects)
    if(c.group.winner!==255)c.wins[c.group.winner]=(c.wins[c.group.winner]+1)|0
    assert.deepEqual({...c,released:[c.group.id]},expected)
  }
  for (const {input,expected} of fixture.recoveries) assert.equal(stateAfterFight(...input),expected)
})

function battle() {
  const w=createWorld(), clock={animationTime:0,animationFrame:0}
  w.units=[];w.buildings=[];w.shrines=[];w.fights=[]
  w.terrain.fill(3);w.terrainVersion++;w.manaWorld.gameFlags|=64
  const red=addUnit(w,'red','warrior',{x:0,z:0}), blue=addUnit(w,'blue','warrior',{x:1,z:0})
  w.selected=[blue.id];command(w,red);advanceGame(w,clock,1/12)
  assert.equal(w.fights.length,1)
  return {w,clock,red,blue}
}
function place(w,u,x,z) {
  u.x=(((x+128)%256)+256)%256-128;u.z=z
  Object.assign(u.fight.motion,nativePosition(w,u))
}

test('last opponent death ends the fight, credits its winner once and returns a survivor to commands', () => {
  const {w,clock,red,blue}=battle(), p=blue.fight.motion
  red.hp=0;advanceGame(w,clock,1/12)
  assert.equal(w.fights.length,0);assert.equal(blue.fight,null)
  assert.equal(p.state,10);assert.equal(p.previousState,25);assert.equal(p.workFlags,0)
  assert.deepEqual(w.stats.battlesWon,[1,0,0,0])
  const from={x:blue.x,z:blue.z}
  w.selected=[blue.id];command(w,{x:from.x+4,z:from.z+4})
  for(let i=0;i<24;i++)advanceGame(w,clock,1/12)
  assert.ok(Math.hypot(blue.x-from.x,blue.z-from.z)>1)
  assert.deepEqual(w.stats.battlesWon,[1,0,0,0])
})

test('live separation uses the squared eight-unit boundary', () => {
  for(const [dx,dz,retained] of [[8,0,true],[8+1/256,0,false],[8,1/256,false]]) {
    const {w,clock,red,blue}=battle(), b=w.fights[0]
    place(w,red,b.x,b.z);place(w,blue,b.x+dx,b.z+dz)
    advanceGame(w,clock,1/12)
    assert.equal(w.fights.length,retained?1:0,JSON.stringify({dx,dz}))
    if(!retained) {
      assert.equal(blue.fight,null);assert.equal(red.fight,null)
      assert.deepEqual(w.stats.battlesWon,[0,1,0,0])
    }
  }
})

test('a native interruption detaches its slot and protected survivors defer state recovery', () => {
  const {w,clock,red,blue}=battle(), p=blue.fight.motion
  p.flags2|=0x100000
  red.fight.motion.state=10
  advanceGame(w,clock,1/12)
  assert.equal(w.fights.length,0);assert.equal(red.fight,null)
  assert.equal(p.state,25);assert.ok(blue.fight)
  p.flags2&=~0x100000
  advanceGame(w,clock,1/12)
  assert.equal(p.state,10);assert.equal(blue.fight,null)
})

test('fight completion, recovery and RNG agree at 5–240 Hz and irregular frame schedules', () => {
  const run = frames => {
    const {w,clock,red,blue}=battle()
    red.hp=0
    for(const dt of frames)advanceGame(w,clock,dt)
    return {units:w.units,fights:w.fights,stats:w.stats,randomState:w.randomState,sounds:w.sounds,turn:w.turn}
  }
  const baseline=run(Array(120).fill(1/60))
  for(const fps of [5,30,120,144,240])assert.deepEqual(run(Array(fps*2).fill(1/fps)),baseline)
  assert.deepEqual(run(Array.from({length:20},()=>[.01,.09]).flat()),baseline)
})
