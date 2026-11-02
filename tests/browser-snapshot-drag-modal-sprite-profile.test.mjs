import assert from 'node:assert/strict'
import test from 'node:test'
import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {createHash} from 'node:crypto'
import {dragSourceProfiles,inspectDragSource} from '../scripts/browser-performance/snapshot-drag-contract.mjs'
const root=resolve(import.meta.dirname,'..'),read=p=>readFileSync(resolve(root,p),'utf8')
const parentId='owned-numeric-terrain-chronological-camera-disposed-cpu-render-cpu-leases-loose-log-post-drain-retirement-tooltip-retirement-bookmark-retirement-hud-focus-boundary-modal-input-freeze-v1'
const id=parentId.replace('-v1','-modal-sprite-sync-v1'),hash=s=>createHash('sha256').update(s).digest('hex')
const delta=`      if (this.disposed) return
      // The input drain can advance native person animation before the next RAF.
      // Freeze sprites at that drained state, not the previous rendered frame.
      this.updateUnitsFrame()
      if (this.disposed) return
`
test('sprite route adds only exact reviewed whole-Scene override',()=>{
 const previous=dragSourceProfiles.find(p=>p.id===parentId),next=dragSourceProfiles.find(p=>p.id===id)
 assert.ok(next);assert.equal(dragSourceProfiles.at(-1),next);assert.equal(previous.slices.length,23)
 assert.equal(hash(read('app/scene.ts')),'38003b8e7e944366bcf8f788159f7a1f0cb81cc4a6a2606612f60efadb56f5da')
 assert.deepEqual(next.slices,previous.slices.map(s=>s.id==='scene-camera-wiring'?{...s,sha256:hash(read('app/scene.ts'))}:s))
 assert.equal(previous.slices.find(s=>s.id==='scene-camera-wiring').sha256,'d0d9cf70775701b04d336ef7e419859cf16659c2590f73aaa9c0c53ff314039b')
})
test('actual composed Scene uniquely admits current sprite profile',()=>{
 const result=inspectDragSource(root);assert.equal(result.status,'admitted');assert.equal(result.profile,id)
 assert.equal(result.profiles.filter(p=>p.status==='admitted').length,1)
})
test('exact modal-only historical source remains separately admitted',()=>{
 const scene=read('app/scene.ts');assert.equal(scene.split(delta).length,2)
 const previous=scene.replace(delta,'');assert.equal(hash(previous),'d0d9cf70775701b04d336ef7e419859cf16659c2590f73aaa9c0c53ff314039b')
 assert.equal(inspectDragSource(root,p=>p==='app/scene.ts'?previous:read(p)).profile,parentId)
})
test('partial sprite publication, missing liveness guard and unreviewed camera remain rejected',()=>{
 const scene=read('app/scene.ts');assert.equal(scene.split(delta).length,2)
 for(const changed of [delta.replace('      this.updateUnitsFrame()\n',''),delta.replace('      if (this.disposed) return\n',''),delta.slice(0,-'      if (this.disposed) return\n'.length)])
  assert.equal(inspectDragSource(root,p=>p==='app/scene.ts'?scene.replace(delta,changed):read(p)).status,'unsupported-source-contract')
 assert.equal(inspectDragSource(root,p=>p==='app/scene-camera-runtime.ts'?read(p)+'\n// changed\n':read(p)).status,'unsupported-source-contract')
})
