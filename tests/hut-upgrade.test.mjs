import test from 'node:test'
import assert from 'node:assert/strict'
import fixtures from './fixtures/hut-upgrade.json' with { type: 'json' }
import manifest from '../decomp/exports.json' with { type: 'json' }
import { stepHutUpgrade, looseWoodInCell } from '../app/hut-upgrade.ts'
import { createWorld, tick, buildingObject } from '../app/model.ts'

test('hut maturity and cell timber match captured original calls', () => {
  assert.equal(fixtures.executableSha256, manifest.executableSha256)
  fixtures.cases.forEach((c, i) => {
    const b = {...c}; let queries = 0
    const action = stepHutUpgrade(b, c.occupants, () => { queries++; return c.missing })
    assert.deepEqual({upgrade:b.upgrade,woodUnavailable:b.woodUnavailable,action,queries},fixtures.expected[i])
  })
  fixtures.woodCases.forEach((c,i) => assert.equal(looseWoodInCell(c.point,c.items),fixtures.woodExpected[i]))
})

test('residents fetch and stage timber before their hut upgrades', () => {
  const w=createWorld(), b=w.buildings.find(b=>b.team==='blue'&&b.kind==='hut')
  const residents=w.units.filter(u=>u.team==='blue'&&u.kind==='brave').slice(0,3)
  for(const u of residents){u.inside=b.id;u.work=b.id;u.path=[]}
  b.counter=127;b.upgrade=1776;b.timer=-20000
  const original=buildingObject(b), history=new Set();let began=false,finished=false,sawCargo=false
  for(let turn=0;turn<1200;turn++){
    tick(w,1/12)
    const piles=w.trees.filter(t=>t.model===11),wood=piles.reduce((n,t)=>n+t.logs,0)
    history.add(wood);sawCargo ||= residents.some(u=>u.cargo)
    if(!began && b.level===2){
      began=true
      assert.equal(wood,3,'all upgrade timber must already be at the entrance')
      assert.equal(b.progress,1/3);assert.equal(b.logs,1)
      assert.equal(buildingObject(b),original+1)
    }
    if(!began){assert.equal(b.progress,1);assert.equal(b.logs,3)}
    if(b.level===2 && b.progress===1){finished=true;break}
  }
  assert.ok(sawCargo);assert.ok(history.has(1)&&history.has(2)&&history.has(3),'haulers must not recycle their own entrance stock')
  assert.ok(began&&finished,'native thresholds must connect to a complete playable upgrade')
  assert.equal(b.logs,3);assert.ok(w.sounds.some(s=>s.cue===11))
})
