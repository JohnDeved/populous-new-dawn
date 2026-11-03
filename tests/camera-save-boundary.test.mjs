import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { checkpointObservation } from '../scripts/local-render/checkpoint-observer.mjs'
const source = readFileSync(new URL('../scripts/local-render/campaign-profile-recovery.mjs', import.meta.url), 'utf8')
const boundary = source.slice(source.indexOf('        entry.publicLoad = await loadThroughUi', source.indexOf("if (!entry.fixture)")), source.indexOf('        entry.afterLoad =', source.indexOf("if (!entry.fixture)")))
const check = new Function('assert', 'saved', 'entry', boundary.slice(boundary.indexOf('\n') + 1))
const world = () => ({turn: 217, time: 18, outcome: {level: 1}, units: [], terrain: new Uint8Array([1]), cameras: {version: 1, tribes: [{x: 197, z: 9, h: 12, initialized: true}], held: [{x: 3}], keys: new Set(['w']), time: .017, navigationTime: .003, elapsed: .5, input: {time: .497, cursor: 8, buttons: 1, pointer: {x: 2, y: 3, buttons: 0}}}})
async function observe(w) { globalThis.cameraSaveTest = {version: 5, world: w}; try {return await checkpointObservation({observationName: 'cameraSaveTest'})} finally {delete globalThis.cameraSaveTest} }
test('complete saved camera survives independent snapshot observation without mutation', async () => {
 const w = world(), before = structuredClone(w), a = await observe(w), b = await observe(structuredClone(w))
 assert.match(a.cameraContinuationSha256, /^[a-f0-9]{64}$/); assert.equal(a.cameraContinuationSha256,b.cameraContinuationSha256); assert.deepEqual(w,before); check(assert,a,{publicLoad:{loaded:b}})
})
for (const [name, mutate] of [['held pose',w=>w.cameras.held[0].x++],['chronology',w=>w.cameras.navigationTime+=.001],['key Set',w=>w.cameras.keys.add('a')],['pointer',w=>w.cameras.input.pointer.x++],['cursor',w=>w.cameras.input.cursor++],['additional owner field',w=>w.cameras.extraOwner=7]]) test(`real observation and scenario reject changed ${name}`, async () => {
 const a = await observe(world()), w = world();mutate(w);const b = await observe(w);assert.notEqual(a.cameraContinuationSha256,b.cameraContinuationSha256);assert.throws(()=>check(assert,a,{publicLoad:{loaded:b}}),/complete camera continuation/)
})
test('camera internal shared-buffer topology is not flattened',async()=>{
 const a=world(), buffer=new ArrayBuffer(4);a.cameras.views=[new Uint8Array(buffer),new Uint8Array(buffer)];const b=structuredClone(a);b.cameras.views[1]=new Uint8Array(new ArrayBuffer(4));assert.notEqual((await observe(a)).cameraContinuationSha256,(await observe(b)).cameraContinuationSha256)
})
test('missing camera cannot pass ordinary Save/Load evidence by matching absence',async()=>{
 const w=world();delete w.cameras;const a=await observe(w);assert.equal(a.cameraContinuationSha256,null);assert.throws(()=>check(assert,a,{publicLoad:{loaded:a}}))
})
test('existing public actions and narrow assertions remain in scenario',()=>{
 for(const s of ["await page.reload({ waitUntil: 'domcontentloaded' })","['level', 'turn', 'time', 'actorsSha256', 'terrainSha256', 'stockSha256']","assert.deepEqual(entry.afterLoad, entry.beforeReload)","assert.deepEqual(await page.evaluate(() => window.recoveryStorageWrites), [])"])assert.ok(source.includes(s))
 assert.ok(source.includes('world: structuredClone(world)'))
})
