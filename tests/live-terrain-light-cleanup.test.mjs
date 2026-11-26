import test from 'node:test'
import assert from 'node:assert/strict'
import { createWorld } from '../app/model.ts'
import { effect, refreshTerrainLights } from '../app/world-effects.ts'

const cell = (x,y) => ((y & 127) << 7) | (x & 127)
const base = i => 2048 + ((i % 1022) + 1)
function flatWorld() {
  const w = createWorld(1,'scalable')
  w.effects.length = 0
  w.lights.fill(null)
  w.land.heights.fill(100)
  w.land.buildingIds.forEach((_,i,a)=> { a[i] = base(i) })
  w.land.landFlags &= ~2
  w.lightView = {x:0,y:0}
  return w
}
const at = (x,y) => ({x:x*2-8,z:-y*2-8})
const add = (w,x,y) => effect(w,'blast',at(x,y),true)
const words = w => Array.from(w.land.buildingIds)
const assertOccupancy = w =>
  assert.ok(w.land.buildingIds.every((v,i)=> (v & 1023)===(base(i) & 1023)))
const assertOutside = (w, c) =>
  assert.equal(w.land.buildingIds[c],base(c))
const isLit = (w,c)=>w.land.buildingIds[c]>base(c)

test('00401140 retiring one live blast owner clears its wrapped contribution and preserves a surviving owner',()=>{
  const w=flatWorld()
  const a=add(w,0,0), b=add(w,1,0)
  assert.ok(isLit(w,cell(126,0)),'west seam is explicitly lit before the removal')
  assert.ok(isLit(w,cell(0,127)),'other axis also wraps')
  const old=w.lights.find(l=>l?.owner===a.id), prior=w.lightRevision
  const survivor=w.lights.find(l=>l?.owner===b.id)
  const expected = Array.from(w.land.buildingIds, (_,i)=>base(i))
  const savedSurvivor = [...survivor.contributions]
  for (let j=0;j<49;j++) expected[cell(1-3+j%7,-3+Math.floor(j/7))] += savedSurvivor[j]*1024
  assert.equal(old.contributions.length,49)
  assert.ok(old.contributions.some(v=>v>0))
  // Freeze other accumulation while allowing missing-owner cleanup; keep the complete BEFORE control.
  w.land.landFlags |= 2
  w.effects.splice(w.effects.indexOf(a),1)
  refreshTerrainLights(w)
  assert.equal(w.lightRevision,prior+1)
  assert.ok(old.contributions.every(v=>v===0))
  assert.equal(w.lights.some(l=>l?.owner===a.id),false)
  assert.equal(w.lights.some(l=>l?.owner===b.id),true)
  assert.deepEqual([...survivor.contributions],savedSurvivor)
  assert.deepEqual(words(w),expected)
  assertOccupancy(w)
  refreshTerrainLights(w)
  assert.equal(w.lightRevision,prior+1)
})

test('00401230 live refresh clears all saved old footprints before either moved blast writes',()=>{
  const w=flatWorld(), control=flatWorld()
  const a=add(w,0,0), b=add(w,1,0)
  assert.ok(isLit(w,cell(0,0)))
  assert.ok(isLit(w,cell(127,0)))
  Object.assign(a,at(12,2))
  Object.assign(b,at(13,2))
  add(control,12,2)
  add(control,13,2)
  const rng=w.randomState, prior=w.lightRevision
  w.lightView = {x:256,y:0}
  refreshTerrainLights(w)
  assert.equal(w.lightRevision,prior+1)
  assert.equal(w.randomState,rng)
  assertOutside(w,cell(0,0))
  assertOutside(w,cell(127,0))
  assert.ok(isLit(w,cell(12,2)) && isLit(w,cell(13,2)))
  assert.deepEqual(words(w),words(control))
  assertOccupancy(w)
  refreshTerrainLights(w)
  assert.deepEqual(words(w),words(control))
})
