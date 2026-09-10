import test from 'node:test'
import assert from 'node:assert/strict'
import fixture from './fixtures/training-panel.json' with {type:'json'}
import manifest from '../decomp/exports.json' with {type:'json'}
import {trainingPanel} from '../app/training-panel.ts'
import {chargeFills} from '../app/hud-charge.ts'

test('native training panels preserve slots, selection, palette, frames and turn-driven feedback',()=>{
  assert.equal(fixture.executableSha256,manifest.executableSha256)
  const charge=d=>d[0]==='fill'&&d[1]>=222&&d[1]<=239
  let corrected=0
  for(const c of fixture.cases){
    const actual=trainingPanel(c)
    if(JSON.stringify(actual)===JSON.stringify(c.expected))continue
    corrected++
    assert.ok(c.cost>=8192&&c.active&&(!c.warning||c.turn&4))
    assert.equal(actual.width,c.expected.width);assert.equal(actual.height,c.expected.height)
    assert.deepEqual(actual.events.filter(d=>!charge(d)),c.expected.events.filter(d=>!charge(d)))
    const fills=actual.events.filter(charge)
    assert.ok(fills.every(d=>d[2][2]>=3&&d[2][2]<=117))
    assert.deepEqual(fills.at(-1),['fill',222,[3,1,3+Math.min(114,Math.trunc(c.progress*114/c.cost)),4],255])
  }
  assert.equal(corrected,108)
})

test('wide charge arithmetic never runs backwards or exceeds its frame at maximum training mana',()=>{
  let previous=0
  for(let progress=0;progress<=65535;progress++){
    const fills=chargeFills(progress*4096,65535*4096,114)
    const value=fills.at(-1).width
    assert.ok(value>=previous&&value<=114)
    assert.ok(fills.every(f=>Number.isFinite(f.width)&&f.width>=0&&f.width<=114))
    previous=value
  }
  assert.equal(previous,114)
  assert.equal(chargeFills(0,0,24).at(-1).width,24)
})
