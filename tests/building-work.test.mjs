import test from 'node:test'
import assert from 'node:assert/strict'
import fixture from './fixtures/building-work.json' with {type:'json'}
import manifest from '../decomp/exports.json' with {type:'json'}
import rules from '../app/original-rules.json' with {type:'json'}
import {stepBuildingWork} from '../app/building-work.ts'
import {createMotionRoutes,setDirectPersonDestination} from '../app/person-routes.ts'
import {createWorld,placeBuilding,tick,command,unitAnimation,unitAnimationSource} from '../app/model.ts'
import {animateLiveObjects} from '../app/live-people.ts'
import {AUDIO_CUES} from '../app/audio.ts'

test('building activity matches native geometry, clocks, speed, facing and animation requests',()=>{
  assert.equal(fixture.executableSha256,manifest.executableSha256)
  fixture.cases.forEach((c,i)=>{
    const p={...c.person,motionGroup:0,motionIndex:0},task={...c.task},rng={randomState:c.seed},events=[]
    stepBuildingWork(rng,p,task,c.site,{
      destination:(to,direct)=>{events.push(['destination',to,direct]);if(direct)setDirectPersonDestination(createMotionRoutes(),p,to);else{p.goalX=to.x;p.goalY=to.y}},
      animation:(_,id)=>events.push(['animation',id]),rest:()=>events.push(['rest']),sound:(cue,flags)=>events.push(['sound',cue,flags]),
    })
    delete p.motionGroup;delete p.motionIndex
    assert.deepEqual({person:p,task,randomState:rng.randomState,events},fixture.expected[i])
  })
})

test('live builders reach work poses, animate, pause, cancel and finish without stale sprites',()=>{
  assert.ok(AUDIO_CUES.includes(20),'building-work audio must be available when sound is enabled')
  const w=createWorld();w.manaWorld.gameFlags=32
  w.selected=w.units.filter(u=>u.kind==='brave'&&u.team==='blue').map(u=>u.id)
  assert.ok(placeBuilding(w,'hut',{x:4,z:32}))
  const b=w.buildings.at(-1),phases=new Set();let worker
  for(let turn=0;turn<1000&&!worker;turn++){
    tick(w,1/12);animateLiveObjects(w);animateLiveObjects(w)
    for(const u of w.units.filter(u=>u.work===b.id&&u.builder?.task===2)){
      phases.add(u.builder.phase)
      if(u.builder.phase===4&&u.builder.person?.speed===0&&u.builder.person.timer>2)worker=u
    }
  }
  assert.ok(worker,'an assigned non-hauler must reach the original work loop')
  assert.ok(phases.has(23)&&phases.has(4),'workers wander before each work pause')
  const p=worker.builder.person
  assert.equal(unitAnimationSource(worker),p);assert.equal(unitAnimation(w,worker),'work')
  assert.equal(p.object,rules.animationObjects[rules.personAnimationObjects[6*9+2]][0])
  assert.equal(worker.path.length,0);assert.ok(w.sounds.some(s=>s.cue===20))
  const frames=new Set([p.f2]);for(let n=0;n<8;n++){animateLiveObjects(w);frames.add(p.f2)}
  assert.ok(frames.size>1,'the work sprite consumes the shared original presentation clock')
  w.paused=true;const before=JSON.stringify(worker.builder);tick(w,1);animateLiveObjects(w)
  assert.equal(JSON.stringify(worker.builder),before);w.paused=false
  w.selected=[worker.id];command(w,{x:-5,z:29})
  assert.equal(worker.builder,undefined);assert.equal(unitAnimationSource(worker),null)
  for(let n=0;n<2000&&b.progress<1;n++)tick(w,1/12)
  assert.equal(b.progress,1)
  assert.ok(w.units.every(u=>!u.builder),'completion and cancellation release every activity source')
})
