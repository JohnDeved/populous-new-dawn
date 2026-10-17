// Safety experiment, not a production optimization or performance benchmark.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createWorld } from '../app/world-initialization.ts'
import { syncLandscapeObjects as original } from './support/scenery-retained-pose-original.ts'
import { syncLandscapeObjects as candidate } from './support/scenery-retained-pose-candidate.ts'

function world() {
  const w = createWorld(1)
  w.buildings = []; w.buildingFootprints.clear(); w.sceneryShadows.clear()
  w.trees = [{ id: 90001, model: 3, logs: 10, x: -8, z: -8 }, { id: 90002, model: 3, logs: 10, x: 0, z: -8 }]
  original(w)
  return w
}
const values = w => [...w.sceneryShadows].map(([id,p]) => [id,{...p}])
test('oracle is exact accepted baseline apart from relative imports', () => {
  const source = readFileSync(new URL('./support/scenery-retained-pose-original.ts', import.meta.url), 'utf8').split('\n').slice(1).join('\n').replaceAll("from '../../app/", "from './")
  assert.equal(createHash('sha256').update(source).digest('hex'), '62e13be40575ac7239e5611837bbab4ee15fe654626dc612cd43e97c0244bc2e')
})
test('ordinary unchanged/moved/depleted/duplicate-ID/bank/terrain cases can pass despite identity unsafety', () => {
  const a=world(), b=structuredClone(a)
  for (const edit of [
    () => {},
    w => {w.trees[0].x += 2},
    w => {w.trees[1].logs = 0},
    w => {w.trees.push({...w.trees[0], x: 8})},
    w => {w.outcome.level = 3},
    w => {w.terrain[40 * 97 + 40] += 1; w.terrainVersion++},
  ]) {
    edit(a);edit(b);original(a);candidate(b)
    assert.deepEqual(values(a),values(b));assert.deepEqual(a.land,b.land)
    assert.deepEqual(a.buildingFootprints,b.buildingFootprints)
  }
})
function mutateRetained(sync) {
  const w=world(), old=w.sceneryShadows.get(90001)
  let fired=false
  Object.defineProperty(w.trees[1],'x',{enumerable:true,get(){
    if(!fired){fired=true;old.anchorX+=512}
    return 0
  }})
  sync(w)
  return {pose:{...w.sceneryShadows.get(90001)}, retained:w.sceneryShadows.get(90001)===old, land:w.land}
}
test('REJECT: later coordinate access mutates a publicly retained pose after its snapshot was built', () => {
  const a=mutateRetained(original),b=mutateRetained(candidate)
  assert.equal(a.pose.anchorX,0)
  assert.equal(b.pose.anchorX,512)
  assert.equal(a.retained,false)
  assert.equal(b.retained,true)
  assert.notDeepEqual(a.pose,b.pose,'retained-reference reuse suppresses necessary replacement/repair')
})
function nestedSync(sync) {
  const w=world(), before=w.sceneryShadows.get(90001)
  let fired=false
  Object.defineProperty(w.trees[1],'x',{enumerable:true,get(){
    if(!fired){fired=true;w.trees[0].x+=2;sync(w)}
    return 0
  }})
  sync(w)
  return {pose:{...w.sceneryShadows.get(90001)}, resurrected:w.sceneryShadows.get(90001)===before}
}
test('REJECT: reentrant sync resurrects an earlier retained object instead of the baseline fresh snapshot', () => {
  const a=nestedSync(original),b=nestedSync(candidate)
  assert.deepEqual(a.pose,b.pose)
  assert.equal(a.resurrected,false)
  assert.equal(b.resurrected,true)
})

test('ordinary duplicate last-write and removal-before-addition map operations stay ordered', () => {
  function run(sync) {
    const w=world(), operations=[]
    class TrackedMap extends Map {
      delete(id){operations.push(['remove',id]);return super.delete(id)}
      set(id,pose){operations.push(['add',id,{...pose}]);return super.set(id,pose)}
    }
    const tracked=new TrackedMap()
    for(const [id,pose]of w.sceneryShadows)Map.prototype.set.call(tracked,id,pose)
    w.sceneryShadows=tracked
    w.trees[0].x=4;w.trees[1].logs=0
    w.trees.push({...w.trees[0],x:8},{...w.trees[0],id:90003,x:12})
    sync(w)
    return {operations,poses:values(w),land:w.land}
  }
  const a=run(original),b=run(candidate)
  assert.deepEqual(a,b)
  assert.deepEqual(a.operations.map(([kind,id])=>[kind,id]),[['remove',90001],['remove',90002],['add',90001],['add',90003]])
  assert.equal(a.poses[0][1].anchorX,4096,'last duplicate tree, not first, owns the temporary snapshot')
})
test('ordinary stale-terrain notification recipients remain dirty in the candidate experiment', () => {
  function run(sync) {
    const w=world()
    w.units.push({id:97000,hp:10,inside:null,x:-8,z:-8,native:{flags2:0},flight:{flags2:0},builder:{person:{flags2:0}}})
    w.effects.push({id:97001,x:-8,z:-8,fire:{groundDirty:false},smoke:{flags2:0}})
    w.terrain[40*97+40]+=3;w.terrainVersion++
    sync(w)
    return {unit:w.units.at(-1),effect:w.effects.at(-1),land:w.land,landVersion:w.landVersion,terrainVersion:w.terrainVersion}
  }
  const a=run(original),b=run(candidate)
  assert.deepEqual(a,b)
  assert.ok(a.unit.native.flags2&4);assert.ok(a.unit.flight.flags2&4);assert.ok(a.unit.builder.person.flags2&4)
  assert.equal(a.effect.fire.groundDirty,true);assert.ok(a.effect.smoke.flags2&4)
  assert.equal(a.landVersion,a.terrainVersion)
})
