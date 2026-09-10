import assert from 'node:assert/strict'
import test from 'node:test'
import fixture from './fixtures/blast-impact.json' with {type:'json'}
import manifest from '../decomp/exports.json' with {type:'json'}
import {createWorld,addUnit,cast,browserPosition,tick} from '../app/model.ts'
import {advanceGame} from '../app/game-clock.ts'
import {ProjectileMotion} from '../app/projectile-motion.ts'
import {UnitMotion} from '../app/unit-motion.ts'

function setup() {
  const w=createWorld()
  w.manaWorld.gameFlags=32;w.units=[];w.buildings=[];w.trees=[];w.shrines=[]
  w.terrain.fill(3);w.terrainVersion++
  addUnit(w,'blue','shaman',{x:-8,z:0})
  assert.ok(cast(w,'blast',{x:0,z:0}))
  const shot=w.projectiles[0],p=shot.target
  const enemy=addUnit(w,'red','brave',{x:p.x+3,z:p.z}),ally=addUnit(w,'blue','brave',{x:p.x-3,z:p.z})
  enemy.hp=ally.hp=1000
  const motion=new ProjectileMotion(),people=new UnitMotion(),clock={animationTime:0,animationFrame:0,
    beforeTurn:()=>{motion.beforeTurn(w);people.beforeTurn(w)},
    afterTurn:()=>{motion.afterTurn(w);people.afterTurn(w)}}
  return {w,shot,enemy,ally,motion,people,clock}
}
const alive=(w,f)=>w.effects.includes(f)&&f.age<f.duration
const current=f=>({x:f.x,y:Math.round(f.height*45)/128,z:f.z})

test('Blast head reaches impact and native first/last wave visits launch enemies/allies',()=>{
  assert.equal(fixture.executableSha256,manifest.executableSha256)
  const {w,shot,enemy,ally}=setup()
  for(let i=0;shot.phase!=='arrived'&&i<30;i++)tick(w,1/12)
  assert.equal(shot.phase,'arrived')
  const head=shot.visuals[0]
  assert.deepEqual({x:head.x,z:head.z},browserPosition(shot.destination))
  assert.equal(Math.round(head.height*45),shot.destination.h)
  assert.ok(shot.visuals.slice(1).every(f=>!alive(w,f)))
  const timeline=[]
  let enemyLaunched=false,allyLaunched=false
  for(let i=0;i<6;i++){
    enemyLaunched ||= !!enemy.flight;allyLaunched ||= !!ally.flight
    timeline.push({head:alive(w,head),enemy:enemyLaunched,ally:allyLaunched})
    if(i===1)assert.equal(w.effects.find(f=>f.wave).wave.scatter,true)
    tick(w,1/12)
  }
  assert.deepEqual(timeline,fixture.timeline)
})

test('Blast and follower presentation share elapsed time at low/high/irregular refresh rates',()=>{
  const schedules=[...[5,30,60,120,144,240].map(hz=>[1/hz]),[.003,.017,.7,.08]]
  const results=schedules.map(schedule=>{
    const {w,shot,enemy,ally,motion,people,clock}=setup()
    let time=0,frame=0
    const samples=[]
    for(const sample of [.01,.51,.62,.71,.79,.9,1.01,1.3,1.6,2.5]){
      while(sample-time>1e-10){const dt=Math.min(sample-time,schedule[frame++%schedule.length]);advanceGame(w,clock,dt);time+=dt}
      const head=shot.visuals[0]
      samples.push({head:head&&alive(w,head)?motion.position(w,head,current(head)):null,enemy:people.position(w,enemy),ally:people.position(w,ally)})
    }
    return {samples,world:{...w,pendingTime:0}}
  })
  for(const r of results){
    assert.deepEqual(r.world,results[0].world)
    r.samples.forEach((s,i)=>{
      for(const key of ['head','enemy','ally']){
        const a=s[key],b=results[0].samples[i][key]
        if(!a||!b)assert.equal(a,b)
        else for(const axis of ['x','y','z'])assert.ok(Math.abs(a[axis]-b[axis])<1e-8)
      }
    })
  }
  const {w,shot,motion,clock}=setup(),positions=new Set()
  for(let i=0;i<180;i++){
    advanceGame(w,clock,1/240)
    const head=shot.visuals[0]
    if(head&&alive(w,head))positions.add(JSON.stringify(motion.position(w,head,current(head))))
  }
  assert.ok(positions.size>15,'high refresh renders additional movement positions')
})

test('projectile snapshots preserve pause, wrap and explicit placement without touching unrelated effects',()=>{
  const {w,shot,motion,clock}=setup()
  advanceGame(w,clock,6/12)
  const head=shot.visuals[0]
  const start=current(head)
  assert.deepEqual(motion.position(w,head,current(head)),start,'new head starts at its source')
  advanceGame(w,clock,1/12+1/24)
  const p=motion.position(w,head,current(head))
  assert.notDeepEqual(p,current(head));assert.notDeepEqual(p,start)
  w.paused=true;advanceGame(w,clock,100)
  assert.deepEqual(motion.position(w,head,current(head)),p)
  head.x+=10
  assert.deepEqual(motion.position(w,head,current(head)),current(head))
  const other={...head}
  assert.deepEqual(motion.position(w,other,current(other)),current(other))
  head.x=127.9;motion.beforeTurn(w);head.x=-127.9;motion.afterTurn(w);w.pendingTime=1/24
  assert.equal(motion.position(w,head,current(head)).x,-128)
})
