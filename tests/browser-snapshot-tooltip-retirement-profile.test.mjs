import {previousHudFocusScene} from './helpers/hud-focus-scene-source.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { dragSourceProfiles, inspectDragSource } from '../scripts/browser-performance/snapshot-drag-contract.mjs'
const root = resolve(import.meta.dirname, '..')
const path = 'app/scene-tooltip-runtime.ts'
const source = readFileSync(resolve(root,path),'utf8')
const markers = ['    scene.updateTooltipController(now)\n', '      scene.onSound(0x6a)\n']
const guards = ['    if (scene.disposed) return\n','      if (scene.disposed) return\n']
const parent = markers.reduce((s,m,i)=>{assert.equal(s.split(m+guards[i]).length,2);return s.replace(m+guards[i],m)},source)
const hash = s => createHash('sha256').update(s).digest('hex')
// These controls qualify the earlier tooltip profile against its exact camera owner.
const cameraPath = 'app/scene-camera-runtime.ts'
const priorCamera = readFileSync(resolve(root,cameraPath),'utf8')
  .replace('    scene.onSound(222)\n    if (scene.disposed) return\n', '    scene.onSound(222)\n')
assert.equal(hash(priorCamera),'fd25b51f7adad35cc41584423d75bda5c9fbf71823c5515beaf02e8a2e223c08')
const inspect = text => inspectDragSource(root,p=>p===path?text:p===cameraPath?priorCamera:(p === 'app/scene.ts' ? previousHudFocusScene(readFileSync(resolve(root,p),'utf8')) : readFileSync(resolve(root,p),'utf8')))
function unique(text,id) {const r=inspect(text); assert.equal(r.profile,id); assert.equal(r.profiles.filter(p=>p.status==='admitted').length,1)}
test('complete tooltip fix uniquely admits combined candidate',()=>{assert.equal(hash(source),'18b666b052772604505c6c130ad8b8d198b5bff3db6c6d862a77dce69e7e84bc');unique(source,'owned-numeric-terrain-chronological-camera-disposed-cpu-render-cpu-leases-loose-log-post-drain-retirement-tooltip-retirement-v1')})
test('removing precisely both guards reconstructs admitted camera-only parent',()=>{assert.equal(hash(parent),'ad67e80f8232e4440bd2da53dad3979aa16834b18e282e1bf2d901b2df1d5cfb');unique(parent,'owned-numeric-terrain-chronological-camera-disposed-cpu-render-cpu-leases-loose-log-post-drain-retirement-v1')})
test('combined profile changes only full tooltip owner identity',()=>{
 const before=dragSourceProfiles.find(p=>p.id==='owned-numeric-terrain-chronological-camera-disposed-cpu-render-cpu-leases-loose-log-post-drain-retirement-v1'), after=dragSourceProfiles.find(p=>p.id==='owned-numeric-terrain-chronological-camera-disposed-cpu-render-cpu-leases-loose-log-post-drain-retirement-tooltip-retirement-v1')
 assert.ok(after);assert.deepEqual(after.slices,before.slices.map(s=>s.id==='tooltip-frame-owner'?{...s,sha256:'18b666b052772604505c6c130ad8b8d198b5bff3db6c6d862a77dce69e7e84bc'}:s))
 assert.ok(Object.isFrozen(after)&&Object.isFrozen(after.slices)&&after.slices.every(Object.isFrozen))
})
for(let i=0;i<2;i++) for(const mode of ['missing','inverted']) test(`tooltip guard ${i} ${mode} rejects`,()=>{
 const text=source.replace(markers[i]+guards[i],markers[i]+(mode==='missing'?'':guards[i].replace('scene.disposed','!scene.disposed')))
 const r=inspect(text);assert.equal(r.status,'unsupported-source-contract');assert.equal(r.profile,null)
})
