import test from 'node:test'
import assert from 'node:assert/strict'
import fixture from './fixtures/spell-button.json' with {type:'json'}
import manifest from '../decomp/exports.json' with {type:'json'}
import {spellButton,spellOrder} from '../app/spell-button.ts'

test('spell button artwork, positions and charging fills match native draws',()=>{
  assert.equal(fixture.executableSha256,manifest.executableSha256)
  assert.deepEqual(spellOrder,fixture.order)
  fixture.cases.forEach((c,i)=>{
    const v=spellButton(c),draws=[['border',v.border,[0,0,31,43]],...v.sprites.map(s=>['sprite',s.id,s.x,s.y])]
    if(v.fills.length)draws.push(['border',1014,[2,34,28,39]],...v.fills.map(f=>['fill',f.palette,[3,35,3+f.width,38]]))
    assert.deepEqual(draws,fixture.expected[i])
  })
})
