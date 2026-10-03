import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createWorld, tick, cast, command, select, nativePosition } from '../app/model.ts'
import { canOrder, unitAnimationSource } from '../app/selection-runtime.ts'
import { animateLiveObjects } from '../app/live-people.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { interruptFlyby } from '../app/flyby.ts'
import { levelStartTargetHeight } from '../app/level-start.ts'
import { reincarnationStoneRise } from '../app/reincarnation.ts'
import units from '../app/original-units.json' with { type: 'json' }
const advance = (w, turns) => { for (let i=0;i<turns;i++) { tick(w,1/12); animateLiveObjects(w); animateLiveObjects(w) } }
const hash = x => createHash('sha256').update(JSON.stringify(x)).digest('hex')
const digest = w => ({sites:w.levelStart,land:hash(Array.from(w.land.heights)),people:w.units.map(u=>[u.id,u.team,u.kind,u.x,u.z]),random:w.randomState,effects:w.effects.map(f=>[f.id,f.sprite?.sequence,f.height,f.animation]),sounds:w.sounds})

test('ordinary Mission1–3 startup uses native terrain, authored gates and real conversion', () => {
  for (const [level,counts,enabled] of [[1,[7,7],[0]],[2,[1,9],[0]],[3,[1,13],[0,2]]]) {
    const w=createWorld(level), before=hash(Array.from(w.land.heights)), wildIds=new Set(w.units.filter(u=>u.team==='wild').map(u=>u.id))
    assert.equal(w.units.filter(u=>u.team==='blue').length,counts[0])
    assert.ok(w.levelStart.every(s=>s.stoneTurns.every(t=>t===null)))
    const targets=w.levelStart.map(s=>levelStartTargetHeight(w.land,s.center))
    advance(w,14)
    for(const [i,s] of w.levelStart.entries()) if(enabled.includes(s.tribe)) {assert.equal(s.center.h,targets[i]);assert.equal(s.phase,2);assert.equal(s.wave.visits,0)}
    assert.equal(hash(Array.from(w.land.heights)),before,'terrain is not pre-flattened at load')
    advance(w,20)
    assert.notEqual(hash(Array.from(w.land.heights)),before)
    assert.equal(w.units.filter(u=>u.team==='blue').length,counts[1])
    assert.ok(w.units.filter(u=>u.team==='blue'&&u.kind==='brave').every(u=>!wildIds.has(u.id)),'conversion allocates real new braves')
    advance(w,36)
    for(const s of w.levelStart) {
      assert.equal(s.phase,4)
      assert.equal(s.stoneTurns.filter(t=>t!==null).length,enabled.includes(s.tribe)?8:0)
      for(const born of s.stoneTurns) if(born!==null) assert.equal(reincarnationStoneRise(w.turn-born),0)
    }
    assert.equal(w.sounds.filter(s=>s.cue===0x9e).length,enabled.length)
    assert.equal(w.sounds.filter(s=>s.cue===0x9f).length,enabled.length*4)
  }
})

test('native opening excludes Shaman selection, without inventing a casting restriction', () => {
  const w=createWorld(2), shaman=w.units.find(u=>u.team==='blue'&&u.kind==='shaman')
  assert.equal(canOrder(shaman),true,'native cast readiness does not reject flags4/128')
  select(w,'shaman');assert.deepEqual(w.selected,[])
  advance(w,2)
  assert.equal(unitAnimationSource(shaman).object,520)
  const frame=shaman.native.f2;animateLiveObjects(w)
  assert.equal(shaman.native.f2,(frame+1)%units.frameCounts[520])
  advance(w,52)
  assert.equal(shaman.native.flags4&128,0)
  w.inputMask=0;select(w,'shaman');assert.deepEqual(w.selected,[shaman.id])
})

test('checkpoint restore resumes every opening stage without replaying terrain/conversion', () => {
  for(const turn of [0,2,14,20,35,40,52,70]) {
    const original=createWorld(2);advance(original,turn)
    const restored=migrateCheckpoint(structuredClone(original))
    assert.deepEqual(digest(restored),digest(original))
    advance(original,75-turn);advance(restored,75-turn)
    assert.deepEqual(digest(restored),digest(original),`checkpoint at turn${turn}`)
    assert.equal(restored.levelStart.find(s=>s.tribe===0).stoneTurns.filter(t=>t!==null).length,8)
  }
  const old=createWorld(2);advance(old,75);delete old.levelStart;delete old.levelStartStoneSound
  const restored=migrateCheckpoint(old), land=hash(Array.from(restored.land.heights)), ids=restored.units.map(u=>u.id)
  advance(restored,3);assert.deepEqual(restored.levelStart,[]);assert.equal(hash(Array.from(restored.land.heights)),land);assert.deepEqual(restored.units.map(u=>u.id),ids)
})

test('restart gets one fresh sequence; repeated flyby skip does not replay it', () => {
  const baseline=createWorld(3), interrupted=createWorld(3)
  const camera={x:0,y:0,angle:0,zoom:0}
  for(let turn=0;turn<75;turn++) {
    if([1,12,15,35,50,60].includes(turn)) {interruptFlyby(interrupted.flyby,camera);interruptFlyby(interrupted.flyby,camera)}
    advance(baseline,1);advance(interrupted,1)
  }
  assert.deepEqual(digest(interrupted),digest(baseline))
  const restarted=createWorld(3);advance(restarted,75)
  assert.deepEqual(digest(restarted),digest(baseline))
})

test('only carrier-created stones are obstacles, while legacy sites keep their reservations', async () => {
  const {levelStartStoneExists}=await import('../app/reincarnation.ts')
  const w=createWorld(1), blue=w.levelStart.find(s=>s.tribe===0)
  assert.equal(levelStartStoneExists(w.levelStart,0,7),false)
  assert.equal(levelStartStoneExists(w.levelStart,1,7),false)
  advance(w,38)
  assert.equal(levelStartStoneExists(w.levelStart,0,7),true)
  assert.equal(levelStartStoneExists(w.levelStart,0,0),false)
  assert.equal(levelStartStoneExists([],0,0),true)
  assert.equal(levelStartStoneExists(undefined,0,0),true)
  assert.equal(blue.stoneTurns[7],37)
})

test('opening wave, conversion and stone cues preload their existing original samples', async () => {
  const {AUDIO_CUES}=await import('../app/audio.ts')
  const {existsSync,readFileSync}=await import('node:fs')
  const data=JSON.parse(readFileSync(new URL('../app/original-sound.json',import.meta.url)))
  for(const cue of [5,158,159]) {
    assert.ok(AUDIO_CUES.includes(cue))
    for(const sample of data.cues[cue].samples)
      assert.ok(existsSync(new URL(`../public/original/audio/${data.cues[cue].bank}-${sample}.wav`,import.meta.url)))
  }
})

test('permitted opening casts enter native state22 and resume command18 without a stuck controller', async () => {
  const {currentPersonOrder}=await import('../app/person-orders.ts')
  for(const at of [0,15,40]) {
    const w=createWorld(2), shaman=w.units.find(u=>u.team==='blue'&&u.kind==='shaman')
    advance(w,at)
    const order=currentPersonOrder(w.buildingOrders,shaman.native)
    assert.equal(order.model,18)
    assert.equal(cast(w,'blast',{x:shaman.x-10,z:shaman.z}),true)
    assert.equal(shaman.native.state,22)
    assert.equal(currentPersonOrder(w.buildingOrders,shaman.native),order)
    const saved=migrateCheckpoint(structuredClone(w))
    advance(w,10)
    assert.equal(shaman.native.state,10)
    assert.equal(shaman.native.commandStatus,18)
    assert.ok(shaman.native.flags4&128,'reinitialized opening restores selection exclusion')
    advance(w,85);advance(saved,95)
    assert.deepEqual(digest(saved),digest(w),'checkpoint during the cast resumes the same state')
    assert.equal(shaman.casting,null)
    assert.equal(w.levelStart.find(s=>s.tribe===0).phase,4)
    assert.equal(w.levelStart.find(s=>s.tribe===0).stoneTurns.filter(t=>t!==null).length,8)
    assert.equal(w.sounds.filter(s=>s.cue===5).length,8,'already converted Wildmen never convert twice')
    assert.equal(w.stats.cast,1)
  }
})

test('fresh-load camera follows native cell-edge/center snapping and angle retention', async () => {
  const {levelStartCamera}=await import('../app/level-start.ts')
  assert.deepEqual(levelStartCamera({x:4352,y:55040,h:128},64),{x:4096,y:55040,angle:256})
  assert.deepEqual(levelStartCamera({x:65535,y:65535,h:0},0),{x:65024,y:65280,angle:256})
  assert.deepEqual(levelStartCamera({x:0,y:0,h:0},32,777),{x:0,y:256,angle:777})
})

test('the command18 completion turn owns exactly one native person visit', () => {
  for(const level of [1,2,3]) {
    const w=createWorld(level), people=w.levelStart.map(site=>({site,unit:w.units.find(u=>u.id===site.shaman),initial:site.counter}))
    for(let turn=1;turn<=56;turn++) {
      tick(w,1/12)
      for(const {site,unit,initial} of people)
        assert.equal(unit.native.counter,(initial+turn)&255,`level${level}/tribe${site.tribe}/turn${turn}`)
    }
  }
})

test('permitted state22 interruption and completion retain one counter increment per turn', () => {
  for(const at of [0,15,40]) {
    const w=createWorld(2),site=w.levelStart.find(s=>s.tribe===0),u=w.units.find(u=>u.id===site.shaman),initial=site.counter
    for(let turn=0;turn<at;turn++)tick(w,1/12)
    assert.ok(cast(w,'blast',{x:u.x-10,z:u.z}))
    for(let turn=at+1;turn<=at+100;turn++) {
      tick(w,1/12)
      assert.equal(u.native.counter,(initial+turn)&255,`cast${at}/turn${turn}/state${u.native.state}`)
      if(site.phase===4)break
    }
    assert.equal(site.phase,4)
  }
})

test('replacement player orders cancel startup before its counter write', () => {
  for(const delay of [0,2,7]) {
    const w=createWorld(2),u=w.units.find(u=>u.team==='blue'&&u.kind==='shaman')
    assert.ok(cast(w,'blast',{x:u.x-10,z:u.z}))
    for(let i=0;i<delay;i++)tick(w,1/12)
    select(w,'shaman');assert.ok(command(w,{x:u.x+6,z:u.z}))
    const before=u.native.counter,saved=migrateCheckpoint(structuredClone(w))
    tick(w,1/12);tick(saved,1/12)
    assert.equal(u.native.counter,(before+1)&255,`replacement after${delay} cast visits`)
    assert.equal(w.levelStart.find(s=>s.tribe===0).phase,4)
    assert.deepEqual(digest(saved),digest(w))
  }
})

test('only the linked neutral startup conversion flash follows its replacement Brave', async () => {
  const {terrainPointHeight}=await import('../app/native-terrain.ts')
  const w=createWorld(2)
  for(let i=0;i<30&&!w.effects.some(f=>f.sprite?.sequence==='startConversion');i++)tick(w,1/12)
  const linked=w.effects.find(f=>f.startConversionLink!==undefined)
  assert.ok(linked,'native004d7fd0 retains its replacement handle on the neutral flash')
  const brave=w.units.find(u=>u.id===linked.startConversionLink),born={x:linked.x,z:linked.z}
  const owner=w.effects.find(f=>f.sprite?.sequence==='startConversion'&&f!==linked&&f.x===born.x&&f.z===born.z)
  assert.ok(owner);assert.equal(owner.startConversionLink,undefined)
  w.selected=[brave.id];assert.ok(command(w,{x:brave.x+5,z:brave.z}))
  for(let visit=1;visit<=8;visit++) {
    const point=nativePosition(w,brave),expected={...browserPoint(point),h:terrainPointHeight(w.land,point)}
    tick(w,1/12)
    if(visit<8){assert.equal(linked.turnsRemaining,8-visit);assert.deepEqual({x:linked.x,z:linked.z},browserPoint(point));assert.equal(linked.height,expected.h/45);assert.deepEqual({x:owner.x,z:owner.z},born)}
    else{assert.equal(w.effects.includes(linked),false);assert.equal(w.effects.includes(owner),false)}
    if(visit===3){const saved=migrateCheckpoint(structuredClone(w));assert.equal(saved.effects.find(f=>f.id===linked.id).startConversionLink,brave.id);for(let i=0;i<5;i++)tick(saved,1/12);const live=structuredClone(w);for(let i=0;i<5;i++)tick(live,1/12);assert.deepEqual(digest(saved),digest(live))}
  }
  assert.ok(brave.native.flags4&0x40000,'effect expiry does not invent a Brave flag clear')
})
function browserPoint(p){return{x:((p.x-2048)<<16>>16)/256,z:-((p.y+2048)<<16>>16)/256}}

test('a missing converted Brave does not retarget its flash or shorten the native expiry', async () => {
  const {retainFixtureUnits}=await import('./level-start-fixture.mjs')
  const {addUnit}=await import('../app/model.ts')
  const w=createWorld(2)
  for(let i=0;i<30&&!w.effects.some(f=>f.startConversionLink!==undefined);i++)tick(w,1/12)
  const fx=w.effects.find(f=>f.startConversionLink!==undefined),link=fx.startConversionLink
  const point={x:fx.x,z:fx.z,height:fx.height}
  retainFixtureUnits(w,u=>u.id!==link)
  const replacement=addUnit(w,'blue','brave',{x:point.x+4,z:point.z})
  assert.notEqual(replacement.id,link)
  const saved=migrateCheckpoint(structuredClone(w))
  for(let visit=1;visit<=8;visit++){
    tick(w,1/12);tick(saved,1/12)
    if(visit<8){assert.ok(w.effects.includes(fx));assert.equal(fx.turnsRemaining,8-visit);assert.deepEqual({x:fx.x,z:fx.z,height:fx.height},point)}
    else assert.equal(w.effects.includes(fx),false)
  }
  assert.deepEqual(digest(saved),digest(w))
})

test('an invalidated command18 is consumed by the ordinary queue without completing the site', async () => {
  const {currentPersonOrder}=await import('../app/person-orders.ts')
  const w=createWorld(2),u=w.units.find(u=>u.team==='blue'&&u.kind==='shaman')
  advance(w,20)
  const site=w.levelStart.find(s=>s.tribe===0),before=u.native.counter
  currentPersonOrder(w.buildingOrders,u.native).flags|=1
  tick(w,1/12)
  assert.equal(site.phase,4)
  assert.equal(u.native.counter,(before+1)&255)
  assert.equal(currentPersonOrder(w.buildingOrders,u.native),undefined)
  assert.equal(w.castingTribes[0].flags&2,0,'cancellation is not successful site completion')
  assert.ok(site.wave,'an allocated wave retains its independent lifetime')
})
