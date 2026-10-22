import test from 'node:test'
import assert from 'node:assert/strict'
import { assertFullscreenClearance } from '../scripts/local-render/fullscreen-clearance.mjs'

const fixture = () => ({ viewport:{width:320,height:240}, owner:true, count:1, hit:true,
  button:{x:12,y:12,width:17,height:14}, focus:{x:9,y:9,right:32,bottom:29},
  occupied:[{label:'scrolled footer and diagnostics column',x:44,y:-200,right:285,bottom:600}] })

test('rendered clearance accepts the reserved gutter across the entire scroll range', () => {
  assert.doesNotThrow(() => assertFullscreenClearance(fixture()))
})
test('rendered clearance rejects overlap, including focus ring alone', () => {
  for (const x of [12,30]) {
    const sample = fixture(); sample.occupied[0].x=x
    assert.throws(() => assertFullscreenClearance(sample), /must clear/)
  }
})
test('rendered clearance rejects clipping, interception, duplicate portals and wrong ownership', () => {
  for (const change of [s=>s.focus.x=-1,s=>s.hit=false,s=>s.count=2,s=>s.owner=false,s=>s.button.width=90]) {
    const sample = fixture(); change(sample)
    assert.throws(() => assertFullscreenClearance(sample))
  }
})
