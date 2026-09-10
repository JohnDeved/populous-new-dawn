import assert from 'node:assert/strict'
import test from 'node:test'
import {createHash} from 'node:crypto'
import orders from './fixtures/combat-orders.json' with {type:'json'}
import preparation from './fixtures/combat-order-preparation.json' with {type:'json'}
import {prepareCombatOrder} from '../app/person-orders.ts'
import scanners from './fixtures/combat-scanners.json' with {type:'json'}
import {startCombatResponse} from '../app/combat-orders.ts'
import {automaticCombatScanner,canAutoEngage,engagementRange} from '../app/melee-engagement.ts'
import {automaticMeleeTarget} from '../app/live-combat.ts'
import {createLivePerson} from '../app/live-people.ts'
import {createWorld,addUnit,tick} from '../app/model.ts'

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

test('coastal response targets come from the corrected native cell, including its newly exposed edge', () => {
  const w=field(), u=addUnit(w,'blue','warrior',{x:1,z:-1})
  addUnit(w,'red','shaman',{x:1.5,z:-1})
  const inland=addUnit(w,'red','shaman',{x:1,z:1})
  u.path=[{x:10,z:-1}]
  w.land.categories[(63744>>9)*128+(2304>>9)]=2
  assert.equal(automaticMeleeTarget(w,u),inland)
  assert.equal(u.native,null)
})


test('coastal combat order preparation matches full native calls and retains flags on identical commands', () => {
  for (const c of preparation) {
    const categories = new Uint8Array(16384), a=c.area.a, order={...c.before}
    categories[((a>>>9)&127)*128+((a&254)>>1)]=c.category
    prepareCombatOrder(order,c.area,c.flags,categories)
    assert.deepEqual(order,c.expected)
  }
})
