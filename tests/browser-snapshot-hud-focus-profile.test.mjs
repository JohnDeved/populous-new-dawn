import test from 'node:test'
import assert from 'node:assert/strict'
import {readPreviousOverviewCamera as readFileSync} from './helpers/overview-gate-camera-source.mjs'
import {resolve} from 'node:path'
import {createHash} from 'node:crypto'
import {dragSourceProfiles,inspectDragSource} from '../scripts/browser-performance/snapshot-drag-contract.mjs'
import {currentHudSceneHash,previousHudSceneHash,hudFocusBoundaries,previousHudFocusScene,hudFocusScene} from './helpers/hud-focus-scene-source.mjs'
const root=resolve(import.meta.dirname,'..'),path='app/scene.ts'
const source=hudFocusScene(readFileSync(resolve(root,path),'utf8')),prior=previousHudFocusScene(source)
const oldId='owned-numeric-terrain-chronological-camera-disposed-cpu-render-cpu-leases-loose-log-post-drain-retirement-tooltip-retirement-bookmark-retirement-v1'
const id=oldId.slice(0,-3)+'-hud-focus-boundary-v1'
const inspect=text=>inspectDragSource(root,p=>p===path?text:readFileSync(resolve(root,p),'utf8'))
const hash=text=>createHash('sha256').update(text).digest('hex')
function unique(text,expected){const report=inspect(text);assert.equal(report.profile,expected);assert.equal(report.profiles.filter(p=>p.status==='admitted').length,1)}
function reject(text){const report=inspect(text);assert.equal(report.status,'unsupported-source-contract');assert.equal(report.profile,null)}
test('complete direct HUD boundary scene uniquely admits its exact source',()=>{assert.equal(hash(source),currentHudSceneHash);unique(source,id)})
test('exact reconstructed old scene keeps prior profile independently admitted',()=>{assert.equal(hash(prior),previousHudSceneHash);unique(prior,oldId)})
test('new profile only changes whole-scene wiring identity and stays frozen',()=>{
 const before=dragSourceProfiles.find(p=>p.id===oldId),after=dragSourceProfiles.find(p=>p.id===id)
 assert.ok(before&&after);assert.equal(dragSourceProfiles.length,18)
 assert.deepEqual(after.slices,before.slices.map(s=>s.id==='scene-camera-wiring'?{...s,sha256:currentHudSceneHash}:s))
 assert.ok(Object.isFrozen(after)&&Object.isFrozen(after.slices)&&after.slices.every(Object.isFrozen))
})
for(const [index,[current,previous]] of hudFocusBoundaries.entries()){
 test(`partial boundary ${index} cannot inherit admission`,()=>reject(source.replace(current,previous)))
 test(`boundary ${index} inverted retirement guard rejects`,()=>reject(source.replace(current,current.replace('if (this.disposed)','if (!this.disposed)'))))
 test(`boundary ${index} missing depth cleanup rejects`,()=>reject(source.replace(current,current.replace('      this.inputDepth--\n',''))))
 test(`boundary ${index} missing final publication rejects`,()=>reject(source.replace(current,current.replace('      this.publishCameraInput()\n',''))))
}
