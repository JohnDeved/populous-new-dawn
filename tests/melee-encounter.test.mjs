import assert from 'node:assert/strict'
import test from 'node:test'
import fixtures from './fixtures/melee-encounter.json' with { type: 'json' }
import sprites from '../app/original-units.json' with { type: 'json' }
import { stepMeleeEncounter } from '../app/melee-encounter.ts'
import { createMotionRoutes } from '../app/person-routes.ts'
import { setPersonAnimation } from '../app/animation.ts'
import { terrainPointHeight } from '../app/native-terrain.ts'
import { createWorld, addUnit, command } from '../app/model.ts'
import { advanceGame } from '../app/game-clock.ts'

test('outdoor and building encounter calls match captured original fields, timing, RNG and sound', () => {
  const land={heights:fixtures.heights,flags:Uint32Array.from({length:16384},(_,i)=>i&1)}
  for(const {input,expected} of fixtures.cases){
    const c=structuredClone(input),w={...c,routes:createMotionRoutes()},sounds=[]
    const outcome=stepMeleeEncounter(w,...c.people,{
      animation:(p,object)=>setPersonAnimation(p,object,{playerTribe:0,gameFlags:c.gameFlags,sessionSubstate:null,tribes:Array.from({length:4},()=>({flags:0,playerType:0})),objects:new Map()},sprites),
      height:(x,y)=>terrainPointHeight(land,{x,y}),sound:(p,cue)=>sounds.push([p.id,cue]),
      building:{destination:(p,to)=>{p.goalX=to.x;p.goalY=to.y},move:(p,to)=>Object.assign(p,to,{h:terrainPointHeight(land,to)}),occupied:p=>c.occupied.includes((p.y>>9)*128+(p.x>>9))},
    })
    if(outcome!=='waiting')for(const p of c.people)p.workFlags=0
    assert.deepEqual({people:c.people,randomState:w.randomState,musicActivity:w.musicActivity,sounds,outcome},expected)
  }
})

function encounter(attacker='warrior',defender='warrior',flags=0){
  const w=createWorld();w.units=[];w.buildings=[];w.shrines=[];w.terrain.fill(3);w.terrainVersion++
  w.manaWorld.gameFlags=flags
  const a=addUnit(w,'blue',attacker,{x:0,z:0}),b=addUnit(w,'red',defender,{x:1,z:0})
  w.selected=[a.id];command(w,b)
  return {w,a,b}
}

test('all playable encounter pairs show the opening strike, physical stagger and defender-centered fight',()=>{
  for(const attacker of ['brave','warrior','shaman'])for(const defender of ['brave','warrior','shaman']){
    const {w,a,b}=encounter(attacker,defender),clock={animationTime:0,animationFrame:0},poses=new Set()
    const hp=[a.hp,b.hp];let completed=false,encounterId
    for(let i=0;i<120;i++){
      advanceGame(w,clock,1/12)
      if(w.fights[0])assert.equal(w.musicActivity,2,'positioning and the opening encounter already count as battle music')
      if(w.fights[0]?.encounter)encounterId=w.fights[0].id
      poses.add(a.fight?.motion?.substate===6?'opening':'approach')
      if(b.fight?.motion?.substate===7){poses.add('stagger');if(Math.hypot(b.x-1,b.z)>.01)poses.add('moved')}
      assert.deepEqual([a.hp,b.hp],hp,'the encounter does not itself deal melee damage')
      if(w.fights[0]&&!w.fights[0].encounter){
        assert.equal(w.fights[0].members[0],b.id)
        assert.notEqual(w.fights[0].id,encounterId)
        assert.ok(w.fights[0].angle>=0&&w.fights[0].angle<360)
        assert.equal(a.fight.motion.state,25);assert.equal(b.fight.motion.state,25)
        assert.equal(a.fight.motion.workFlags,w.fights[0].id)
        completed=true;break
      }
    }
    assert.ok(completed,`${attacker}/${defender} must finish`)
    assert.ok(poses.has('opening'));assert.ok(poses.has('stagger'));assert.ok(poses.has('moved'))
    assert.ok(w.sounds.some(e=>e.cue===13))
  }
})

test('encounters and their animations stay deterministic across render schedules',()=>{
  const run=frames=>{
    const {w,a,b}=encounter(),clock={animationTime:0,animationFrame:0}
    for(const dt of frames)advanceGame(w,clock,dt)
    return {a,b,fights:w.fights,randomState:w.randomState,sounds:w.sounds,musicActivity:w.musicActivity,turn:w.turn}
  }
  const baseline=run(Array(120).fill(1/60))
  for(const fps of [5,30,120,144,240])assert.deepEqual(run(Array(fps*2).fill(1/fps)),baseline)
  assert.deepEqual(run(Array.from({length:20},()=>[.01,.09]).flat()),baseline)
})

test('the native skip-intro flag and player cancellation do not leave stuck encounters',()=>{
  const skipped=encounter('warrior','warrior',64),clock={animationTime:0,animationFrame:0}
  advanceGame(skipped.w,clock,1/12)
  assert.equal(skipped.w.fights[0].encounter,undefined)
  assert.equal(skipped.a.fight.action,'approach')
  const {w,a,b}=encounter();advanceGame(w,clock,1/12)
  const motions=[a.fight.motion,b.fight.motion]
  w.selected=[a.id];command(w,{x:-16,z:-8});advanceGame(w,clock,1/12)
  assert.equal(w.fights.length,0);assert.equal(a.fight,null);assert.equal(b.fight,null)
  assert.deepEqual(motions.map(p=>p.workFlags),[0,0])
  assert.ok(a.path.length)
})


test('simulation owns quiet, attack and battle music activity across pause and cancellation', () => {
  const {w,b}=encounter(),clock={animationTime:0,animationFrame:0}
  b.x=16
  advanceGame(w,clock,1/12)
  assert.equal(w.musicActivity,1,'a distant attack raises activity before a fight exists')
  w.paused=true
  advanceGame(w,clock,1)
  assert.equal(w.musicActivity,1,'pause retains the last simulated activity')
  w.paused=false
  w.units=[]
  w.fights=[]
  advanceGame(w,clock,1/12)
  assert.equal(w.musicActivity,0,'the next quiet turn clears previous activity')
})
