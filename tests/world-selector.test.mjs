import assert from 'node:assert/strict'
import test from 'node:test'
import {selectorWorlds,selectorWorldPosition,openingMissionAvailable,openingRecommendedMission} from '../app/world-selector-data.ts'

test('native selector body hierarchy retains all 25 worlds and first-three moons', () => {
  assert.equal(selectorWorlds.length,25)
  assert.deepEqual(selectorWorlds.map(w=>w.mission).sort((a,b)=>a-b),Array.from({length:25},(_,i)=>i+1))
  for (const [mission,radius] of [[1,150],[2,110],[3,70]]) {
    const body=selectorWorlds.find(w=>w.mission===mission)
    assert.equal(body.parent,20)
    assert.equal(body.orbitRadius,radius)
    assert.equal(body.startAngle,90)
    const position=selectorWorldPosition(body.index)
    assert.ok(Math.abs(position.x)<1e-9)
    assert.equal(position.z,-1400+radius)
  }
  assert.throws(()=>selectorWorldPosition(25),RangeError)
})

test('opening campaign availability reflects completion without hiding replay access', () => {
  assert.deepEqual([1,2,3].map(n=>openingMissionAvailable(n,[])),[true,false,false])
  assert.deepEqual([1,2,3].map(n=>openingMissionAvailable(n,[1])),[true,true,false])
  assert.deepEqual([1,2,3].map(n=>openingMissionAvailable(n,[1,2])),[true,true,true])
  assert.equal(openingMissionAvailable(3,[3]),true)
  assert.equal(openingMissionAvailable(4,[1,2,3]),false)
  assert.equal(openingRecommendedMission([]),1)
  assert.equal(openingRecommendedMission([1]),2)
  assert.equal(openingRecommendedMission([1,2]),3)
  assert.equal(openingRecommendedMission([1,2,3]),3)
})
