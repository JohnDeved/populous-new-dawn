import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync}from'node:fs'
import {createHash}from'node:crypto'
import {deserialize}from'node:v8'
import {gunzipSync}from'node:zlib'
import { createHistoricalFixtureHarness,normalizeHistoricalFixture } from './helpers/historical-checkpoint.ts'
import {tick}from'../app/model.ts'
const sha=v=>createHash('sha256').update(v).digest('hex')
test('historical pre-newborn3916 idle encounter retains3917 lethal cleanup through research clone continuation',async()=>{
 const metadata=readFileSync(new URL('./fixtures/mission22-historical-staged/predeath-provenance.json',import.meta.url));assert.equal(sha(metadata),'3762e8921155e38b230b68da3108bdcf43b759d49f425417b92cda394a3dea82')
 const p=JSON.parse(metadata);assert.equal(p.head,'9f7a4758aaabd11b0b57e89d150265c313d9a13a');assert.deepEqual(p.validatedBranchTurns,{staged:4266,idle:4853,departure:3866,successor:3966})
 assert.equal(sha(readFileSync(new URL('../scripts/capture-historical-mission22-staged-death.mjs',import.meta.url))),p.producerSha256)
 const compressed=readFileSync(new URL('./fixtures/mission22-historical-staged/world-3916.v8.gz',import.meta.url));assert.equal(sha(compressed),'683a6c362c480f0003547f4f80bfef0b61bc68d89c97db873d85da881f1fd5e5')
 const serialized=gunzipSync(compressed);assert.equal(sha(serialized),'5efd8d3f8c80d596220dee9960ba46b328c7f0633b67d0737f80266f08ca2a8a')
 const historical=deserialize(serialized),store=createHistoricalFixtureHarness();store.startMission(22)
 for(const key of Object.keys(store.getWorld()))if(!Object.hasOwn(historical,key))delete store.getWorld()[key]
 Object.assign(store.getWorld(),historical);assert.deepEqual(store.getWorld(),historical)
 await store.saveCheckpoint();const expected=normalizeHistoricalFixture(structuredClone(historical));assert.ok(store.loadCheckpoint());const world=store.getWorld();assert.deepEqual(world,expected)
 const unit=world.units.find(u=>u.id===p.shamanId),owner=unit.fight.motion,craft=world.vehicles.find(v=>v.id===p.balloonId),order=world.buildingOrders.records[p.orderId]
 assert.equal(world.turn,3916);assert.equal(unit.hp,p.hp);assert.equal(owner.life,p.life);assert.equal(unit.fight.opponent,p.fightOpponent);assert.equal(world.objectCells.objects.get(unit.id),owner);assert.equal(order.model,28)
 await store.saveCheckpoint();assert.ok(store.loadCheckpoint());const replay=store.getWorld();assert.deepEqual(replay,world)
 let death=0
 while(world.turn<4853){tick(world,1/12);tick(replay,1/12);assert.deepEqual(replay,world);if(unit.hp<=0&&!death)death=world.turn}
 assert.equal(death,3917);assert.equal(owner.life,227);assert.equal(unit.hp,0);assert.equal(world.units.includes(unit),false);assert.equal(world.objectCells.objects.has(unit.id),false);assert.equal(order.references,0);assert.equal(craft.passengerCount,0);assert.deepEqual(craft.passengers,[])
})
