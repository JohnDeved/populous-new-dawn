import assert from 'node:assert/strict'
import {readFileSync}from'node:fs'
import {createHash}from'node:crypto'
import {deserialize}from'node:v8'
import {gunzipSync}from'node:zlib'
import { createHistoricalFixtureHarness,normalizeHistoricalFixture } from './historical-checkpoint.ts'
const sha=v=>createHash('sha256').update(v).digest('hex')
export async function loadHistoricalMission22Occupant(){
 const metadata=readFileSync(new URL('../fixtures/mission22-historical-occupant/provenance.json',import.meta.url));assert.equal(sha(metadata),'0eafb50b7a246eff34a30e7b0e30ff56015ea3e810b58066828e013587944356')
 const provenance=JSON.parse(metadata);assert.equal(provenance.head,'9f7a4758aaabd11b0b57e89d150265c313d9a13a');assert.equal(provenance.validatedOriginalLifecycleThrough,6721)
 assert.equal(sha(readFileSync(new URL('../../scripts/capture-historical-mission22-occupant.mjs',import.meta.url))),provenance.producerSha256)
 const compressed=readFileSync(new URL('../fixtures/mission22-historical-occupant/world-6246.v8.gz',import.meta.url));assert.equal(sha(compressed),'67635fd5492902847c7f4a5fd6c330407c9688effe15adfde1bafb29227d8b64')
 const serialized=gunzipSync(compressed);assert.equal(sha(serialized),'8e7b37a61bc615e39e05db36eedd7d35784f835ae0e5eaccd110eb8d593ea447')
 const historical=deserialize(serialized),store=createHistoricalFixtureHarness();store.startMission(22);Object.keys(store.getWorld()).filter(key => !(key in historical)).forEach(key => delete store.getWorld()[key]);Object.assign(store.getWorld(),historical);assert.deepEqual(store.getWorld(),historical)
 await store.saveCheckpoint();const expected=normalizeHistoricalFixture(structuredClone(store.getWorld()));assert.ok(store.loadCheckpoint());const w=store.getWorld();assert.deepEqual(w,expected)
 assert.equal(w.turn,6246);assert.equal(w.nextId,825)
 const target=w.units.find(u=>u.id===96),tower=w.buildings.find(b=>b.id===90),effect=w.effects.find(e=>e.id===823)
 assert.equal(target.inside,tower.id);assert.equal(effect.turnsRemaining,12);assert.equal(effect.kind,'hypnotise')
 return{store,w,target,tower,effect}
}
