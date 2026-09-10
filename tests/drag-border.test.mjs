import test from 'node:test'
import assert from 'node:assert/strict'
import {dragBorderQuad,dragBorderUV,dragBorderCrossings} from '../app/drag-border.ts'
import fixture from './fixtures/drag-border.json' with {type:'json'}

test('drag borders match original screen extrusion, texture coordinates and terrain crossings',()=>{
 for(const c of fixture.cases){
  const q=dragBorderQuad(c.a,c.b,c.direction,c.corner)
  assert.deepEqual([0,1,2,0,2,3].map(i=>[q[i].x,q[i].y,...dragBorderUV[i]]),c.expected.flat())
 }
 for(const c of fixture.crossings)assert.deepEqual(dragBorderCrossings(c.a,c.b).map(p=>({...p,x:p.x&65535,y:p.y&65535})),c.expected)
})
