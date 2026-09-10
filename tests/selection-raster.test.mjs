import test from 'node:test'
import assert from 'node:assert/strict'
import {selectionMesh} from '../app/selection-mesh.ts'
import {selectionFillUV} from '../app/drag-border.ts'
import fill from './fixtures/selection-fill.json' with {type:'json'}
import {selectionDraws} from '../app/selection-raster.ts'
import mesh from './fixtures/selection-mesh.json' with {type:'json'}
import raster from './fixtures/selection-raster.json' with {type:'json'}

test('selection terrain mesh matches the executable with documented seven-point fan repairs',()=>{
 for(const c of mesh.cases){
  const actual=selectionMesh(c.corners,c.camera,c.quadrant).map(t=>t.map(p=>({...p,x:p.x&65535,y:p.y&65535})))
  const expected=[...c.expected]
  for(const repair of c.repairs)expected.splice(repair.index,0,repair.triangle)
  assert.deepEqual(actual,expected)
 }
})
test('selection fill/edges/corners retain native visibility, depth, UV and shared-corner ownership',()=>{
 for(const c of fill.cases)assert.deepEqual(c.points.map((p,i)=>[...p,...selectionFillUV[i]]),c.expected)
 for(const c of raster.cases){
  const points=structuredClone(c.points)
  const actual=selectionDraws(c.triangles.map(t=>t.map(i=>points[i])),c.width,c.height,c.borders).map(d=>({...d,points:d.points.map(p=>[p.x,p.y])}))
  assert.deepEqual(actual,c.expected)
 }
})
