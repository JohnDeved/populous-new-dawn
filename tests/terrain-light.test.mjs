import assert from 'node:assert/strict'
import test from 'node:test'
import {createHash} from 'node:crypto'
import fixture from './fixtures/terrain-light.json' with {type:'json'}
import manifest from '../decomp/exports.json' with {type:'json'}
import {createNativeTerrain} from '../app/native-terrain.ts'
import {addTerrainLight,updateTerrainLights} from '../app/terrain-light.ts'
import {createWorld,effect,tick,HOME} from '../app/model.ts'

test('local lights match complete native allocation, movement and cleanup captures',()=>{
  assert.equal(fixture.executableSha256,manifest.executableSha256)
  const land=createNativeTerrain(fixture.land.heights),lights=Array(50).fill(null),owners=new Map()
  land.flags.set(fixture.land.flags);land.buildingIds.set(fixture.land.buildingIds)
  let view=fixture.view,seed=fixture.seed,enabled=true
  for(const [index,a] of fixture.actions.entries()){
    let refresh=true
    if(a.kind==='add'){
      owners.set(a.source.owner,a.source.position)
      refresh=addTerrainLight(lights,a.source);assert.equal(refresh,a.accepted)
    }else if(a.kind==='remove')owners.delete(a.owner)
    else{
      view=a.view;seed=a.seed;enabled=a.enabled;land.landFlags=a.paused?2:0
      for(const [id,p] of a.positions)owners.set(id,p)
    }
    if(refresh)updateTerrainLights(land,lights,id=>owners.get(id),view,seed,enabled)
    assert.deepEqual(lights.map(l=>l&&({...l,contributions:[...l.contributions]})),a.expected.lights,`light records ${index}`)
    assert.equal(createHash('sha256').update(new Uint8Array(land.buildingIds.buffer)).digest('hex'),a.expected.cellsSha256,`terrain ${index}`)
    assert.equal(lights.filter(Boolean).length,a.expected.count)
  }
})

test('Blast owns immediate terrain light until its ninth turn, preserving occupancy and pause',()=>{
  const w=createWorld(),before=w.land.buildingIds.slice(),seed=w.randomState
  const flash=effect(w,'blast',HOME)
  assert.equal(w.lights.filter(Boolean).length,1)
  assert.equal(w.lights.find(Boolean).owner,flash.id)
  assert.ok(w.land.buildingIds.some(n=>n>>>10))
  assert.equal(w.randomState,seed)
  for(let i=0;i<before.length;i++)assert.equal(w.land.buildingIds[i]&1023,before[i]&1023)
  w.paused=true;const lit=w.land.buildingIds.slice();tick(w,1)
  assert.deepEqual(w.land.buildingIds,lit)
  w.paused=false
  for(let i=0;i<9;i++)tick(w,1/12)
  assert.ok(!w.effects.includes(flash));assert.ok(w.lights.every(l=>l===null))
  assert.deepEqual(w.land.buildingIds,before)
})
