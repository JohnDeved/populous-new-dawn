import {previousHudFocusScene} from './helpers/hud-focus-scene-source.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import {readPreviousOverviewCamera as readFileSync} from './helpers/overview-gate-camera-source.mjs'
import {createHash} from 'node:crypto'
import {resolve} from 'node:path'
import {dragSourceProfiles,inspectDragSource} from '../scripts/browser-performance/snapshot-drag-contract.mjs'
const root=resolve(import.meta.dirname,'..'),path='app/scene-camera-runtime.ts'
const source=readFileSync(resolve(root,path),'utf8'),marker='    scene.onSound(222)\n',guard='    if (scene.disposed) return\n'
assert.equal(source.split(marker+guard).length,2)
const parent=source.replace(marker+guard,marker)
const hash=s=>createHash('sha256').update(s).digest('hex')
const inspect=text=>inspectDragSource(root,p=>p===path?text:(p === 'app/scene.ts' ? previousHudFocusScene(readFileSync(resolve(root,p),'utf8')) : readFileSync(resolve(root,p),'utf8')))
function unique(text,id){const r=inspect(text);assert.equal(r.profile,id);assert.equal(r.profiles.filter(p=>p.status==='admitted').length,1)}
function unsupported(text){const r=inspect(text);assert.equal(r.status,'unsupported-source-contract');assert.equal(r.profile,null)}
test('full bookmark fix uniquely admits combined exact source',()=>{assert.equal(hash(source),'88dc444b95035b03e4b2864759cef1049b07de85715d9f631ee076246930748b');unique(source,'owned-numeric-terrain-chronological-camera-disposed-cpu-render-cpu-leases-loose-log-post-drain-retirement-tooltip-retirement-bookmark-retirement-v1')})
test('removing only bookmark guard reconstructs uniquely admitted previous profile',()=>{assert.equal(hash(parent),'fd25b51f7adad35cc41584423d75bda5c9fbf71823c5515beaf02e8a2e223c08');unique(parent,'owned-numeric-terrain-chronological-camera-disposed-cpu-render-cpu-leases-loose-log-post-drain-retirement-tooltip-retirement-v1')})
test('new bookmark profile changes only complete camera producer identity',()=>{
 const before=dragSourceProfiles.find(p=>p.id==='owned-numeric-terrain-chronological-camera-disposed-cpu-render-cpu-leases-loose-log-post-drain-retirement-tooltip-retirement-v1'),after=dragSourceProfiles.find(p=>p.id==='owned-numeric-terrain-chronological-camera-disposed-cpu-render-cpu-leases-loose-log-post-drain-retirement-tooltip-retirement-bookmark-retirement-v1')
 assert.ok(after);assert.deepEqual(after.slices,before.slices.map(s=>s.id==='camera-producers'?{...s,sha256:'88dc444b95035b03e4b2864759cef1049b07de85715d9f631ee076246930748b'}:s))
 assert.ok(Object.isFrozen(after)&&Object.isFrozen(after.slices)&&after.slices.every(Object.isFrozen))
})
test('inverted bookmark predicate is not admitted',()=>unsupported(source.replace(marker+guard,marker+guard.replace('scene.disposed','!scene.disposed'))))
for(const name of ['skipIntroduction','focus','cameraBookmark','overview','zoom'])test(`new bookmark source missing prior ${name} drain guard rejects`,()=>{
 const start=source.indexOf(`export function ${name}(`),at=source.indexOf('  if (scene.disposed) return\n',start)
 assert.ok(start>=0&&at>start);assert.match(source.slice(start,at),/scene\.advanceInputTime(?:\?\.)?\(\)\n$/)
 unsupported(source.slice(0,at)+source.slice(at+'  if (scene.disposed) return\n'.length))
})
