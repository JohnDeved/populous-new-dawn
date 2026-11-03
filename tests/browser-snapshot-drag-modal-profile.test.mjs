import assert from 'node:assert/strict'
import test from 'node:test'
import {readPreviousOverviewCamera as readFileSync} from './helpers/overview-gate-camera-source.mjs'
import {resolve} from 'node:path'
import {createHash} from 'node:crypto'
import {dragSourceProfiles,inspectDragSource} from '../scripts/browser-performance/snapshot-drag-contract.mjs'
const root=resolve(import.meta.dirname,'..')
// Historical modal-only route: inverse exactly the subsequently reviewed sprite
// publication, with both whole-source hashes fixed. Live admission is tested
// independently by browser-snapshot-drag-modal-sprite-profile.test.mjs.
const spriteDelta = `      if (this.disposed) return
      // The input drain can advance native person animation before the next RAF.
      // Freeze sprites at that drained state, not the previous rendered frame.
      this.updateUnitsFrame()
      if (this.disposed) return
`
function read(path) {
  const source = readFileSync(resolve(root, path), 'utf8')
  if (path !== 'app/scene.ts') return source
  assert.equal(hash(source), '38003b8e7e944366bcf8f788159f7a1f0cb81cc4a6a2606612f60efadb56f5da')
  assert.equal(source.split(spriteDelta).length, 2)
  const prior = source.replace(spriteDelta, '')
  assert.equal(hash(prior), 'd0d9cf70775701b04d336ef7e419859cf16659c2590f73aaa9c0c53ff314039b')
  return prior
}
const parentId='owned-numeric-terrain-chronological-camera-disposed-cpu-render-cpu-leases-loose-log-post-drain-retirement-tooltip-retirement-bookmark-retirement-hud-focus-boundary-v1'
const id=parentId.replace('-v1','-modal-input-freeze-v1')
const hash=s=>createHash('sha256').update(s).digest('hex')
const guard='if (this.disposed || this.modalSuspended) return'
function removeGuard(source,index){
 let offset=-1
 for(let n=0;n<=index;n++)offset=source.indexOf(guard,offset+1)
 assert.ok(offset>=0)
 return source.slice(0,offset)+'if (this.disposed) return'+source.slice(offset+guard.length)
}
test('modal route appends exactly one whole-Scene override to retained HUD route',()=>{
 const previous=dragSourceProfiles.find(p=>p.id===parentId),next=dragSourceProfiles.find(p=>p.id===id)
 assert.ok(previous);assert.ok(next);assert.equal(dragSourceProfiles.findIndex(p=>p===next),15)
 assert.equal(previous.slices.length,23);assert.equal(next.slices.length,23)
 assert.deepEqual(next.slices,next.slices.map((s,i)=>s.id==='scene-camera-wiring'?{...previous.slices[i],sha256:hash(read('app/scene.ts'))}:previous.slices[i]))
 assert.equal(previous.slices.find(s=>s.id==='scene-camera-wiring').sha256,'f9d0e31cc7baf0de2061bcbb513834cff6173827f558b389825c42791449c24a')
})
test('exact historical modal-only source uniquely admits retained modal route',()=>{
 const result=inspectDragSource(root,read);assert.equal(result.status,'admitted');assert.equal(result.profile,id)
 assert.equal(result.profiles.filter(p=>p.status==='admitted').length,1)
})
test('each partial guard removal fails closed and exact parent remains admitted separately',()=>{
 const scene=read('app/scene.ts');assert.equal(scene.split(guard).length-1,3)
 for(let i=0;i<3;i++)assert.equal(inspectDragSource(root,p=>p==='app/scene.ts'?removeGuard(scene,i):read(p)).status,'unsupported-source-contract')
 const previous=scene.split(guard).join('if (this.disposed) return')
 assert.equal(hash(previous),'f9d0e31cc7baf0de2061bcbb513834cff6173827f558b389825c42791449c24a')
 assert.equal(inspectDragSource(root,p=>p==='app/scene.ts'?previous:read(p)).profile,parentId)
})
test('unreviewed Scene and mixed camera bytes remain rejected',()=>{
 for(const path of ['app/scene.ts','app/scene-camera-runtime.ts'])assert.equal(inspectDragSource(root,p=>p===path?read(p)+'\n// unreviewed\n':read(p)).status,'unsupported-source-contract')
})
