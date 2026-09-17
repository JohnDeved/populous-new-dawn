import assert from 'node:assert/strict'
import test from 'node:test'
import {createHash} from 'node:crypto'
import orders from './fixtures/combat-orders.json' with {type:'json'}
import preparation from './fixtures/combat-order-preparation.json' with {type:'json'}
import {currentPersonOrder,prepareCellOrder} from '../app/person-orders.ts'
import scanners from './fixtures/combat-scanners.json' with {type:'json'}
import {startCombatResponse} from '../app/combat-orders.ts'
import {automaticCombatScanner,canAutoEngage,engagementRange} from '../app/melee-engagement.ts'
import {automaticMeleeTarget} from '../app/live-combat.ts'
import {buildingCounterattack,cancelLiveBuildingAttack,startLiveCombatResponse} from '../app/live-building-combat.ts'
import {createLivePerson,syncLivePersonCells} from '../app/live-people.ts'
import {startLiveOrders} from '../app/live-movement.ts'
import {createWorld,addUnit,command,nativePosition,tick,unitAnimationSource} from '../app/model.ts'

const unsupported = () => {throw Error('Unexpected world consumer')}
test('original automatic commands preserve normal queues, share one reference-counted record and handle allocation exhaustion', () => {
  for (const capture of orders) {
    const c=structuredClone(capture.input), objects=new Map(c.objects.map(p=>[p.id,p])), cells=new Map(c.cells)
    const land={flags:new Uint32Array(16384),owners:new Uint8Array(16384),categories:new Uint8Array(16384)}
    for(const [i,v] of c.categories)land.categories[i]=v
    const buildings=new Map(c.land.map(([i,v])=>{land.flags[i]=v.flags;land.owners[i]=v.owner;return [i,{...objects.get(v.building),planKind:0,activity:0}]}))
    const fields=['model','flags','references','object','a','b']
    const pool={cursor:c.cursor,active:c.active,records:c.records.map(row=>Object.fromEntries(fields.map((f,i)=>[f,row[i]])))}
    const world={...c,objects,land,buildingAt:i=>buildings.get(i),cellObjects:i=>(cells.get(i)??[]).map(id=>objects.get(id))}, p=objects.get(1)
    const result=startCombatResponse(world,pool,p,()=>world.cellObjects((p.y>>9)*128+(p.x>>9)),{prepare:unsupported,stopWork:unsupported,releaseSpell:unsupported,deleteObject:unsupported,releaseFight:unsupported})
    const bytes=Buffer.alloc(8000)
    pool.records.forEach((o,i)=>{
      bytes.writeUInt8(o.model,i*10);bytes.writeUInt8(o.flags,i*10+1)
      fields.slice(2).forEach((f,j)=>bytes.writeUInt16LE(o[f],i*10+2+j*2))
    })
    assert.deepEqual({result,people:c.objects.map(({reactionTimer,reactionDuration,...p})=>p),cursor:pool.cursor,active:pool.active,pool:createHash('sha256').update(bytes).digest('hex')},capture.expected)
  }
})

test('native scan dispatch preserves pending bits, suppression, specialist selection and consumer call counts', () => {
  for(const {input:c,expected} of scanners) {
    let ritualCalls=0,scanRitualCalls=0,readyCalls=0
    const eligible=canAutoEngage(c.p,c.order,()=>{ritualCalls++;return c.ritual}), range=engagementRange(c.p,c.order,c.tower), p={...c.p}
    const scanner=automaticCombatScanner(p,c.order,c.levelFlags2,()=>{scanRitualCalls++;return c.ritual},c.tower,()=>{readyCalls++;return c.ready})
    assert.deepEqual({eligible,ritualCalls,range,scanner,flags3:p.flags3,scanRitualCalls,readyCalls},expected)
  }
})

function field() {
  const w=createWorld();w.units=[];w.buildings=[];w.fights=[];w.terrain.fill(3);w.terrainVersion++;tick(w,1/6);w.turn=4
  w.land.categories.fill(0);w.land.flags.fill(0);w.land.buildingIds.fill(0);w.land.owners.fill(0)
  return w
}
test('live campaign scan suppression consumes pending alerts without changing person counters or sprites', () => {
  const w=field(), u=addUnit(w,'blue','warrior',{x:1,z:-1}), enemy=addUnit(w,'red','brave',{x:1.5,z:-1})
  u.native=createLivePerson(w,u);u.native.counter=99;u.native.flags3|=0x800
  w.levelFlags2|=0x2000000
  assert.equal(automaticMeleeTarget(w,u),undefined)
  assert.equal(u.native.flags3&0x800,0);assert.equal(u.native.counter,99)
  w.levelFlags2=0;assert.equal(automaticMeleeTarget(w,u),enemy)
  w.turn=5;u.native.flags3|=0x800;w.levelFlags2=0x2000000
  assert.equal(automaticMeleeTarget(w,u),undefined);assert.equal(u.native.flags3&0x800,0)
})

test('dead building attackers release queued shaman-guard duty', () => {
  const w=field(),u=addUnit(w,'red','warrior',{x:0,z:0}),p=createLivePerson(w,u)
  u.native=p
  Object.assign(w.buildingOrders.records[1],{model:19,flags:0,references:1,object:0,a:0,b:0})
  Object.assign(w.buildingOrders.records[2],{model:30,flags:0,references:1,object:0,a:0,b:0})
  p.commands[0]=1;p.commands[1]=2
  w.buildingOrders.active=2
  w.manaTribes[p.tribe].shamanGuards=1
  cancelLiveBuildingAttack(w,u)
  assert.equal(w.manaTribes[p.tribe].shamanGuards,0)
  assert.deepEqual(p.commands,[0,0,0,0,0,0,0,0])
  assert.equal(w.buildingOrders.active,0)
})

test('fight motion initializes its retained sermon without a native owner', () => {
  const w=field(),u=addUnit(w,'blue','preacher',{x:0,z:0}),p=createLivePerson(w,u)
  Object.assign(w.buildingOrders.records[1],{model:17,flags:0,references:1,object:0,a:p.x,b:p.y})
  p.commands[0]=1;p.state=10
  u.native=null;u.fight={group:77,action:'approach',motion:p}
  startLiveOrders(w,p,w)
  assert.equal(p.commandStatus,17)
  assert.equal(currentPersonOrder(w.buildingOrders,p)?.model,17)
})

test('coastal response targets come from the corrected native cell, including its newly exposed edge', () => {
  const w=field(), u=addUnit(w,'blue','warrior',{x:1,z:-1})
  addUnit(w,'red','shaman',{x:1.5,z:-1})
  const inland=addUnit(w,'red','shaman',{x:1,z:1})
  u.path=[{x:10,z:-1}]
  w.land.categories[(63744>>9)*128+(2304>>9)]=2
  assert.equal(automaticMeleeTarget(w,u),inland)
  assert.equal(u.native,null)
})

test('tower counterattacks ignore hostile people in water', () => {
  const w=createWorld(2),tower=w.buildings.find(b=>b.team==='green'&&b.kind==='tower')
  for(let i=0;i<200&&!w.units.some(u=>u.inside===tower.id);i++)tick(w,1/12)
  const defender=addUnit(w,'green','warrior',{x:tower.x+2,z:tower.z}),
    hostile=addUnit(w,'blue','shaman',{x:tower.x+1,z:tower.z})
  defender.native=createLivePerson(w,defender);defender.native.state=17
  hostile.native=createLivePerson(w,hostile);hostile.native.state=17;syncLivePersonCells(w)
  const p=nativePosition(w,hostile),cell=((p.y&65535)>>9)*128+((p.x&65535)>>9)
  w.land.categories[cell]=1;buildingCounterattack(w,'green')
  assert.equal(currentPersonOrder(w.buildingOrders,defender.native),undefined)
  w.land.categories[cell]=3;buildingCounterattack(w,'green')
  assert.equal(currentPersonOrder(w.buildingOrders,defender.native)?.model,19)
})


test('coastal area/dismantling order preparation matches full native calls and retains flags on identical commands', () => {
  for (const c of preparation) {
    const categories = new Uint8Array(16384), a=c.model===10?c.area.b:c.area.a, order={...c.before}
    categories[((a>>>9)&127)*128+((a&254)>>1)]=c.category
    prepareCellOrder(order,c.area,c.flags,categories,c.model)
    assert.deepEqual(order,c.expected)
  }
})

test('live same-cell followers share one automatic command 21 and resume their queued destination', () => {
  const w=field(), units=[addUnit(w,'blue','warrior',{x:0,z:0}),addUnit(w,'blue','warrior',{x:.25,z:0})]
  w.selected=units.map(u=>u.id)
  command(w,{x:8,z:0})
  const people=units.map(u=>u.native), queued=people.map(p=>p.commands[p.commandCursor])
  const enemy=addUnit(w,'red','shaman',{x:1.75,z:0})
  assert.equal(startLiveCombatResponse(w,units[0]),true)
  const automatic=people[0].immediateCommand
  assert.ok(automatic)
  assert.equal(people[1].immediateCommand,automatic)
  assert.equal(w.buildingOrders.records[automatic].model,21)
  assert.equal(w.buildingOrders.records[automatic].references,2)
  assert.deepEqual(people.map(p=>p.commands[p.commandCursor]),queued)
  tick(w,1/12)
  assert.ok(people.every(p=>p.commandStatus===21))
  assert.ok(units.every(u=>unitAnimationSource(u)===u.native))
  enemy.hp=0
  for(let i=0;i<600&&w.buildingOrders.active;i++)tick(w,1/12)
  assert.equal(w.buildingOrders.active,0)
  assert.ok(units.every((u,i)=>u.native===people[i]&&u.x>6))
  assert.ok(units.every(u=>unitAnimationSource(u)===u.native))
})

test('an on-foot Firewarrior owns one automatic response per cooldown and yields to player movement', () => {
  const w=field(), source=addUnit(w,'blue','firewarrior',{x:0,z:0}), near=addUnit(w,'red','preacher',{x:5,z:0}), target=addUnit(w,'red','firewarrior',{x:6,z:0})
  near.hp=target.hp=200
  const person=createLivePerson(w,source)
  source.native=person;person.state=17;person.flags3|=0x800
  assert.equal(startLiveCombatResponse(w,source),true)
  assert.equal(w.buildingOrders.records[person.immediateCommand].model,21)
  tick(w,1/12)
  assert.equal(w.effects.filter(effect=>effect.firewarriorShot).length,2)
  assert.ok(w.effects.filter(effect=>effect.firewarriorShot).every(effect=>effect.firewarriorShot.target===target.id))
  assert.ok(person.immediateCommand)
  assert.equal(person.animationMode,44)
  assert.equal(source.cooldown,25/12)

  const close=field(), closeShooter=addUnit(close,'blue','firewarrior',{x:0,z:0}), reserved=addUnit(close,'red','brave',{x:1,z:0})
  addUnit(close,'red','firewarrior',{x:4,z:0})
  reserved.attackReservation={flags4:0x200000,reactionTimer:0,reactionDuration:0}
  closeShooter.native=createLivePerson(close,closeShooter);closeShooter.native.state=17;closeShooter.native.flags3|=0x800
  assert.equal(startLiveCombatResponse(close,closeShooter),true);tick(close,1/12)
  const closeShots=close.effects.filter(effect=>effect.firewarriorShot)
  assert.equal(closeShots.length,2)
  assert.ok(closeShots.every(effect=>effect.firewarriorShot.target===reserved.id))

  for(let i=0;i<12&&person.immediateCommand;i++)tick(w,1/12)
  assert.equal(person.immediateCommand,0)
  assert.equal(source.target,null)

  let previous=source.cooldown,repeated=false
  for(let i=0;i<80&&!repeated;i++){
    tick(w,1/12)
    repeated=source.cooldown>previous
    previous=source.cooldown
  }
  assert.equal(repeated,true)
  assert.ok(person.immediateCommand)
  w.selected=[source.id]
  command(w,{x:8,z:0})
  assert.equal(source.target,null)
  assert.equal(source.native?.immediateCommand??0,0)
  assert.equal(currentPersonOrder(w.buildingOrders,source.native)?.model,3)

  const lost=field(), shooter=addUnit(lost,'blue','firewarrior',{x:0,z:0}), victim=addUnit(lost,'red','shaman',{x:2,z:0})
  shooter.native=createLivePerson(lost,shooter);shooter.native.state=17;shooter.native.flags3|=0x800
  assert.equal(startLiveCombatResponse(lost,shooter),true);tick(lost,1/12)
  victim.hp=0;tick(lost,1/12)
  assert.equal(shooter.target,null)
  assert.equal(shooter.native?.immediateCommand??0,0)
  assert.ok(lost.effects.some(effect=>effect.firewarriorShot),'launched shots finish after target loss')

  const dead=field(), attacker=addUnit(dead,'blue','firewarrior',{x:0,z:0}), defender=addUnit(dead,'red','shaman',{x:2,z:0})
  attacker.native=createLivePerson(dead,attacker);attacker.native.state=17;attacker.native.flags3|=0x800
  assert.equal(startLiveCombatResponse(dead,attacker),true)
  tick(dead,1/12)
  assert.ok(dead.effects.some(effect=>effect.firewarriorShot))
  attacker.hp=0
  for(let i=0;i<20&&dead.effects.some(effect=>effect.firewarriorShot);i++)tick(dead,1/12)
  assert.equal(dead.buildingOrders.active,0)
  assert.notEqual(defender.damageAttacker,0,'a dead source cannot retain projectile credit')
})

test('automatic combat restarts a retained direct tree harvest instead of harvesting during battle', () => {
  const w=field(),u=addUnit(w,'blue','brave',{x:0,z:0}),tree={id:w.nextId++,x:1,z:0,model:1,logs:4}
  w.trees.push(tree);w.selected=[u.id];command(w,tree)
  for(let i=0;i<200&&!u.harvest;i++)tick(w,1/12)
  assert.equal(u.harvest?.remaining,19)
  const enemy=addUnit(w,'red','shaman',{x:u.x+2.5,z:u.z})
  addUnit(w,'red','brave',{x:20,z:20})
  w.turn=(w.turn+3)&~3
  assert.equal(startLiveCombatResponse(w,u),true)
  const p=u.native,automatic=p.immediateCommand
  assert.ok(automatic);assert.equal(u.tree,tree.id);assert.equal(u.harvest,undefined)
  for(let i=0;i<4;i++)tick(w,1/12)
  assert.equal(u.harvest,undefined);assert.equal(u.cargo,0);assert.equal(tree.logs,4)
  enemy.hp=0
  for(let i=0;i<600&&(!u.harvest||p.immediateCommand);i++)tick(w,1/12)
  assert.equal(p.immediateCommand,0);assert.equal(u.tree,tree.id);assert.equal(u.harvest?.remaining,19)
  for(let i=0;i<40&&!u.cargo;i++)tick(w,1/12)
  assert.equal(u.cargo,1);assert.equal(tree.logs,3)
})

test('live automatic combat consumes a pending worship scan without replacing command 27', () => {
  const w=field(), u=addUnit(w,'blue','warrior',{x:0,z:0})
  addUnit(w,'red','shaman',{x:1.5,z:0})
  const p=createLivePerson(w,u), order=w.buildingOrders.records[1]
  u.native=p
  Object.assign(order,{model:27,flags:0,references:1,object:0,a:0,b:0})
  w.buildingOrders.active=1
  p.commands[0]=1;p.commandStatus=27;p.state=10;p.substate=0;p.flags3|=0x800
  assert.equal(startLiveCombatResponse(w,u),false)
  assert.equal(p.flags3&0x800,0)
  assert.equal(p.commandStatus,27)
  assert.equal(p.commands[0],1)
  assert.equal(p.immediateCommand,0)
  assert.equal(order.references,1)
})

test('live automatic allocation failure preserves its source and queued order', () => {
  const w=field(), u=addUnit(w,'blue','warrior',{x:0,z:0})
  w.selected=[u.id];command(w,{x:8,z:0})
  const p=u.native, queued=p.commands[p.commandCursor]
  p.group=77
  addUnit(w,'red','shaman',{x:1.5,z:0})
  for(const order of w.buildingOrders.records.slice(1))order.references ||= 1
  w.buildingOrders.active=799
  assert.equal(startLiveCombatResponse(w,u),false)
  assert.equal(p.group,77)
  assert.equal(p.immediateCommand,0)
  assert.equal(p.commands[p.commandCursor],queued)
})

test('live automatic sharing leaves a nonmatching same-cell peer untouched', () => {
  const w=field(), u=addUnit(w,'blue','warrior',{x:0,z:0}), peer=addUnit(w,'blue','brave',{x:.5,z:0})
  u.native=createLivePerson(w,u);peer.native=createLivePerson(w,peer);peer.native.group=77
  addUnit(w,'red','shaman',{x:1.5,z:0})
  assert.equal(startLiveCombatResponse(w,u),true)
  assert.equal(peer.native.group,77)
  assert.equal(peer.native.immediateCommand,0)
})

test('live preacher response retains its sermon queue and resumes conversion', () => {
  const w=createWorld();w.units=[];w.selected=[]
  const preacher=addUnit(w,'blue','preacher',{x:2,z:0})
  for(let i=0;i<200&&!preacher.native;i++)tick(w,1/12)
  assert.equal(currentPersonOrder(w.buildingOrders,preacher.native)?.model,17)
  const p=preacher.native, queued=p.commands[p.commandCursor]
  const enemy=addUnit(w,'red','preacher',{x:3,z:0})
  p.flags3|=0x800
  tick(w,1/12)
  assert.equal(currentPersonOrder(w.buildingOrders,p)?.model,21)
  assert.equal(p.commands[p.commandCursor],queued)
  enemy.hp=0
  for(let i=0;i<300&&p.immediateCommand;i++)tick(w,1/12)
  assert.equal(p.immediateCommand,0)
  assert.equal(currentPersonOrder(w.buildingOrders,p)?.model,17)
  w.levelFlags2|=0x2000000
  const victim=addUnit(w,'red','brave',{x:3,z:0})
  for(let i=0;i<700&&victim.native?.state!==23;i++)tick(w,1/12)
  assert.equal(victim.native?.state,23)
})

test('preacher response allocation failure consumes the scan without changing its queue', () => {
  const w=field(), u=addUnit(w,'blue','preacher',{x:0,z:0}), p=createLivePerson(w,u)
  u.native=p
  const queued=w.buildingOrders.records[1]
  Object.assign(queued,{model:17,references:1,a:p.x,b:p.y})
  p.commands[0]=1;p.commandStatus=17;p.state=10;p.flags3|=0x800
  w.buildingOrders.active=799
  for(const order of w.buildingOrders.records.slice(2))order.references=1
  addUnit(w,'red','preacher',{x:1,z:0})
  assert.equal(startLiveCombatResponse(w,u),false)
  assert.equal(p.flags3&0x800,0)
  assert.equal(p.commands[0],1)
  assert.equal(p.immediateCommand,0)
  assert.equal(queued.references,1)
})
