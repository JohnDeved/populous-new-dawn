import test from 'node:test'
import assert from 'node:assert/strict'
import approachFixture from './fixtures/building-approach.json' with {type:'json'}
import departureFixture from './fixtures/building-departure.json' with {type:'json'}
import fixtureWork from './fixtures/building-work.json' with {type:'json'}
import manifest from '../decomp/exports.json' with {type:'json'}
import rules from '../app/original-rules.json' with {type:'json'}
import constants from '../app/original-constants.json' with {type:'json'}
import {stepBuildingWork,stepBuildingDeparture,stepBuildingApproach} from '../app/building-work.ts'
import {createMotionRoutes,setDirectPersonDestination} from '../app/person-routes.ts'
import {createWorld,placeBuilding,tick,command,unitAnimation,unitAnimationSource} from '../app/model.ts'
import {animateLiveObjects} from '../app/live-people.ts'
import {AUDIO_CUES} from '../app/audio.ts'

test('building activity matches native geometry, clocks, speed, facing and animation requests',()=>{
  assert.equal(fixtureWork.executableSha256,manifest.executableSha256);assert.equal(departureFixture.executableSha256,manifest.executableSha256)
  for(const fixture of [fixtureWork,departureFixture,approachFixture])fixture.cases.forEach((c,i)=>{
    assert.equal(fixture.executableSha256,manifest.executableSha256)
    const p={...c.person,motionGroup:0,motionIndex:0},task={...c.task},rng={randomState:c.seed},events=[]
    const initial=task.task
    if(initial===1&&task.restart)p.flags4=(p.flags4&0xfffefff8)>>>0
    ;(initial===1?stepBuildingApproach:initial===9?stepBuildingDeparture:stepBuildingWork)(rng,p,task,c.site,{
      destination:(to,direct)=>{events.push(['destination',to,direct]);if(direct)setDirectPersonDestination(createMotionRoutes(),p,to);else{p.goalX=to.x;p.goalY=to.y}},
      outsideBuilding:to=>c.site.anchorBlocked?c.site.outside:to,
      allocateLog:()=>{const ok=events.filter(e=>e[0]==='allocateLog'&&e[1]).length<c.allocationLimit;events.push(['allocateLog',ok]);return ok},
      releaseMotion:()=>events.push(['releaseMotion']),
      animation:(_,id)=>events.push(['animation',id]),rest:()=>events.push(['rest']),sound:(cue,flags)=>events.push(['sound',cue,flags]),
    })
    delete p.motionGroup;delete p.motionIndex
    assert.deepEqual({person:p,task,randomState:rng.randomState,events,...(initial===1?{signal:c.site.signal|(task.task===2?1:0)}:{})},fixture.expected[i])
  })
})

test('live builders reach work poses, animate, pause, cancel and finish without stale sprites',()=>{
  assert.ok(AUDIO_CUES.includes(20),'building-work audio must be available when sound is enabled')
  const w=createWorld();w.manaWorld.gameFlags=32
  w.selected=w.units.filter(u=>u.kind==='brave'&&u.team==='blue').map(u=>u.id)
  assert.ok(placeBuilding(w,'hut',{x:-2,z:32}))
  const b=w.buildings.at(-1),phases=new Set();let worker
  for(let turn=0;turn<1000&&!worker;turn++){
    tick(w,1/12);animateLiveObjects(w);animateLiveObjects(w)
    for(const u of w.units.filter(u=>u.work===b.id&&u.builder?.task===2)){
      phases.add(u.builder.phase)
      if(!b.preparation&&u.builder.phase===4&&u.builder.person?.speed===0&&u.builder.person.timer>2)worker=u
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
  assert.equal(worker.builder,undefined);assert.equal(unitAnimationSource(worker),worker.native);assert.equal(worker.native.commandStatus,3)
  for(let n=0;n<2000&&b.progress<1;n++)tick(w,1/12)
  assert.equal(b.progress,1)
  assert.ok(w.units.some(u=>u.builder),'the last delivery does not instantly remove the construction crew')
  for(let n=0;n<100&&!w.units.some(u=>u.builder?.task===9);n++)tick(w,1/12)
  const departing=w.units.find(u=>u.builder?.task===9);assert.ok(departing)
  w.paused=true;const departure=JSON.stringify(departing);tick(w,1);animateLiveObjects(w)
  assert.equal(JSON.stringify(departing),departure);w.paused=false
  w.selected=[departing.id];command(w,{x:-5,z:29})
  assert.equal(departing.builder,undefined);assert.equal(unitAnimationSource(departing),departing.native);assert.equal(departing.native.commandStatus,3)
  for(let n=0;n<600&&w.units.some(u=>u.builder);n++)tick(w,1/12)
  assert.ok(w.units.every(u=>!u.builder),'completion and cancellation release every activity source')
})

test('crews leave finished huts in all four orientations before the plan releases them',()=>{
  const seen=new Set()
  for(const count of [1,2,6])for(let direction=0;direction<4;direction++){
    const w=createWorld();w.manaWorld.gameFlags=32;w.buildingDirections.hut=direction
    const crew=w.units.filter(u=>u.kind==='brave'&&u.team==='blue').slice(0,count)
    w.selected=crew.map(u=>u.id);assert.ok(placeBuilding(w,'hut',{x:-2,z:32}))
    const b=w.buildings.at(-1)
    for(let n=0;n<2000&&b.progress<1;n++)tick(w,1/12)
    assert.equal(b.progress,1);assert.ok(crew.every(u=>u.work===b.id&&u.builder))
    const departingRoutes=new Map()
    for(let n=0;n<600&&crew.some(u=>u.builder);n++){
      for(const u of crew){const p=w.pathfinding.people.get(u.id);if(p)departingRoutes.set(u.id,p)}
      const before=crew.map(u=>({x:u.x,z:u.z,task:u.builder.task,phase:u.builder.phase}))
      for(const u of crew)if(u.builder.task===9)seen.add(u.builder.phase)
      tick(w,1/12)
      crew.forEach((u,i)=>{
        // A fetcher can finish its current route before the next plan decision.
        assert.ok(Math.hypot(u.x-before[i].x,u.z-before[i].z)<=(u.builder?.task===7?constants.BRAVE_SPEED:u.builder?.person?.speed??0)/256+2/256,'departure must move continuously, including release')
        assert.equal(u.inside,null,'construction ownership prevents automatic housing')
      })
      if(crew.every(u=>!u.builder)){
        assert.ok(before.every(u=>u.task===1||u.task===9&&u.phase===6),'only the original readiness gate releases the crew')
        assert.equal(b.counter&15,0,'staffed hut checks completion on its native phase')
      }
    }
    assert.ok(crew.every(u=>!u.builder&&u.work===null))
    assert.ok(b.builders.every(id=>id===0))
    for(const u of crew){
      const old=departingRoutes.get(u.id),next=w.pathfinding.people.get(u.id)
      assert.equal(old?.motionGroup??0,0,'departure releases its motion-route reference')
      if(next){assert.notEqual(next,old);assert.equal(next,u.native);assert.equal(next.state,17,'any replacement route belongs to the new idle approach')}
    }
  }
  for(const phase of [2,3,4,5,6,18,21])assert.ok(seen.has(phase),'live departure phase '+phase)
})

test('player construction orders approach natively and deposit carried logs before fetching',()=>{
  for(const cargo of [0,1])for(let direction=0;direction<4;direction++){
    const w=createWorld();w.manaWorld.gameFlags=32;w.buildingDirections.hut=direction
    const u=w.units.find(u=>u.kind==='brave'&&u.team==='blue');u.cargo=cargo;w.selected=[u.id]
    const oldTrees=new Set(w.trees.map(t=>t.id))
    assert.ok(placeBuilding(w,'hut',{x:-2,z:32}));const b=w.buildings.at(-1)
    assert.equal(u.builder.task,1)
    tick(w,1/12)
    assert.equal(u.builder.phase,15);assert.equal(u.builder.task,1)
    assert.equal(u.builder.person.anchorFlags,0)
    assert.equal(u.builder.person.anchorX&511,256);assert.equal(u.builder.person.anchorY&511,256)
    w.paused=true;const before=JSON.stringify(u);tick(w,1);animateLiveObjects(w)
    assert.equal(JSON.stringify(u),before);w.paused=false
    if(cargo&&direction===0){
      command(w,{x:u.x+2,z:u.z});assert.equal(u.builder,undefined);assert.equal(u.cargo,1)
      command(w,b);assert.equal(u.builder.task,1)
    }
    let arrival
    for(let n=0;n<300&&u.builder.task===1;n++){
      arrival={x:u.x,z:u.z};tick(w,1/12)
      if(u.builder.task===1)assert.equal(u.cargo,cargo,'approach retains carried wood until arrival')
    }
    assert.equal(u.builder.task,2);assert.equal(u.builder.restart,true)
    assert.equal(u.cargo,0);assert.equal(b.progress,0,'approach deposits timber without advancing construction')
    const dropped=w.trees.filter(t=>!oldTrees.has(t.id)&&t.model===11)
    assert.equal(dropped.length,cargo)
    if(cargo){assert.equal(dropped[0].logs,1);assert.equal(dropped[0].x,arrival.x);assert.equal(dropped[0].z,arrival.z);assert.ok(w.sounds.some(s=>s.cue===11))}
    for(let n=0;n<2000&&(b.progress<1||u.builder);n++)tick(w,1/12)
    assert.equal(b.progress,1);assert.equal(u.builder,undefined)
  }
})
