import assert from 'node:assert/strict'
import {readFileSync}from'node:fs'
import {createHash}from'node:crypto'
import {deserialize}from'node:v8'
import {gunzipSync}from'node:zlib'
import { createHistoricalFixtureHarness } from './historical-checkpoint.ts'
const sha=v=>createHash('sha256').update(v).digest('hex')
export function loadHistoricalStaged(){
 const metadata=readFileSync(new URL('../fixtures/mission22-historical-staged/input-provenance.json',import.meta.url));assert.equal(sha(metadata),'6ce53e81e6c92de805a93aea480b365ee2b6fcf32e5b55aad72ebb8018562e3f')
 const provenance=JSON.parse(metadata);assert.equal(provenance.head,'9f7a4758aaabd11b0b57e89d150265c313d9a13a');assert.deepEqual(provenance.validatedBranchTurns,{staged:4266,idle:4853,departure:3866,successor:3966})
 assert.equal(sha(readFileSync(new URL('../../scripts/capture-historical-mission22-staged.mjs',import.meta.url))),provenance.producerSha256)
 const compressed=readFileSync(new URL('../fixtures/mission22-historical-staged/world-3566.v8.gz',import.meta.url));assert.equal(sha(compressed),'f83f0f0acbf6c4fac23e4a960f1416f5d4a613ae3551566eb373b41863f1802b')
 const serialized=gunzipSync(compressed);assert.equal(sha(serialized),'89b601dfacfb846cca5827367e03782efffc4e8eba9cdac5b70b7085306754a7')
 const historical=deserialize(serialized),store=createHistoricalFixtureHarness();store.startMission(22)
 for(const key of Object.keys(store.getWorld()))if(!Object.hasOwn(historical,key))delete store.getWorld()[key]
 Object.assign(store.getWorld(),historical);assert.deepEqual(store.getWorld(),historical)
 // Raw historical archive restoration deliberately precedes the research-only reconstruction boundary.
 const world=store.getWorld(),shaman=world.units.find(u=>u.id===89),balloon=world.vehicles.find(v=>v.id===1)
 assert.equal(world.turn,3566);assert.equal(shaman.native.counter,238);assert.equal(shaman.native.vehicle,balloon.id);assert.deepEqual(balloon.passengers,[shaman.id]);assert.equal(world.objectCells.objects.get(shaman.id),shaman.native)
 return{store,world,shaman,balloon,createContinuationStore:createHistoricalFixtureHarness}
}
