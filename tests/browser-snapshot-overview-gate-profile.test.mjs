import assert from 'node:assert/strict'
import test from 'node:test'
import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {createHash} from 'node:crypto'
import {dragSourceProfiles,inspectDragSource} from '../scripts/browser-performance/snapshot-drag-contract.mjs'
import {previousOverviewCameraSource,currentOverviewCameraHash,previousOverviewCameraHash} from './helpers/overview-gate-camera-source.mjs'
const root=resolve(import.meta.dirname,'..'),path='app/scene-camera-runtime.ts',read=p=>readFileSync(resolve(root,p),'utf8'),hash=s=>createHash('sha256').update(s).digest('hex')
const parentId='owned-numeric-terrain-chronological-camera-disposed-cpu-render-cpu-leases-loose-log-post-drain-retirement-tooltip-retirement-bookmark-retirement-hud-focus-boundary-modal-input-freeze-modal-sprite-sync-v1'
const id=parentId.replace('-v1','-overview-gate-publication-v1')
test('all seventeen historical source profiles stay structurally identical and frozen',()=>{
 assert.equal(dragSourceProfiles.length,18)
 assert.equal(hash(JSON.stringify(dragSourceProfiles.slice(0,17))),'4e796a26c20830a6dca29fdbc6c06acfb6306ca6600416f19147d3f7d5825d5e')
 assert.ok(dragSourceProfiles.every(p=>Object.isFrozen(p)&&Object.isFrozen(p.slices)&&p.slices.every(Object.isFrozen)))
})
test('eighteenth exact route changes only reviewed whole camera owner',()=>{
 const parent=dragSourceProfiles.find(p=>p.id===parentId),next=dragSourceProfiles.at(-1)
 assert.equal(next.id,id);assert.equal(hash(read(path)),currentOverviewCameraHash)
 assert.deepEqual(next.slices,parent.slices.map(s=>s.id==='camera-producers'?{...s,sha256:currentOverviewCameraHash}:s))
})
test('actual current tree uniquely admits overview publication route without normalization',()=>{
 const r=inspectDragSource(root);assert.equal(r.profile,id);assert.equal(r.profiles.filter(p=>p.status==='admitted').length,1)
})
test('exact reconstructed previous camera remains separately and uniquely admitted',()=>{
 const old=previousOverviewCameraSource(read(path));assert.equal(hash(old),previousOverviewCameraHash)
 const r=inspectDragSource(root,p=>p===path?old:read(p));assert.equal(r.profile,parentId);assert.equal(r.profiles.filter(p=>p.status==='admitted').length,1)
})
for(const stage of ['enter','exit'])test(`partial ${stage} publication or unreviewed button value rejects live and historical readers`,()=>{
 const source=read(path),marker=`  scene.overviewStage = '${stage}'\n  scene.world.cameras.input.buttons = 0\n`
 assert.equal(source.split(marker).length,2)
 for(const changed of [marker.replace('  scene.world.cameras.input.buttons = 0\n',''),marker.replace('buttons = 0','buttons = 1')]){
  const bad=source.replace(marker,changed);assert.equal(inspectDragSource(root,p=>p===path?bad:read(p)).status,'unsupported-source-contract');assert.throws(()=>previousOverviewCameraSource(bad))
 }
})
test('unreviewed camera and mixed older Scene with new camera reject',()=>{
 assert.equal(inspectDragSource(root,p=>p===path?read(p)+'\n// unreviewed\n':read(p)).status,'unsupported-source-contract')
 const scene=read('app/scene.ts'),delta='      if (this.disposed) return\n      // The input drain can advance native person animation before the next RAF.\n      // Freeze sprites at that drained state, not the previous rendered frame.\n      this.updateUnitsFrame()\n      if (this.disposed) return\n';assert.equal(scene.split(delta).length,2)
 assert.equal(inspectDragSource(root,p=>p==='app/scene.ts'?scene.replace(delta,''):read(p)).status,'unsupported-source-contract')
})
