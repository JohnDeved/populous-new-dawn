import assert from 'node:assert/strict'
import test from 'node:test'
import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {createHash} from 'node:crypto'
import * as historical from './helpers/hud-focus-scene-source.mjs'
import {inspectDragSource} from '../scripts/browser-performance/snapshot-drag-contract.mjs'
const root=resolve(import.meta.dirname,'..'),source=readFileSync(resolve(root,'app/scene.ts'),'utf8')
const hash=s=>createHash('sha256').update(s).digest('hex')
test('exact current Scene reconstructs both pinned historical HUD owners',()=>{
 const hud=historical.hudFocusScene(source)
 assert.equal(hash(hud),'f9d0e31cc7baf0de2061bcbb513834cff6173827f558b389825c42791449c24a')
 assert.equal(hash(historical.previousHudFocusScene(source)),'2593a57bc040d85f65fde882e29ff2e2e582cf1ccfdd0dfe191d2344bb28ba85')
 assert.equal(historical.hudFocusScene(hud),hud)
})
test('partial modal guards, missing sprite publication and arbitrary drift never normalize',()=>{
 assert.equal(typeof historical.hudFocusScene,'function')
 for(const changed of [source+'\n',source.replace('if (this.disposed || this.modalSuspended) return','if (this.disposed) return'),source.replace('      this.updateUnitsFrame()\n',''),source.replace('Freeze sprites','Change sprites')])assert.throws(()=>historical.hudFocusScene(changed))
})
test('source reconstruction never changes actual current-route admission',()=>{
 const before=source
 historical.hudFocusScene(source)
 assert.equal(source,before)
 const admitted=inspectDragSource(root)
 assert.equal(admitted.status,'admitted')
 assert.equal(admitted.profile,'owned-numeric-terrain-chronological-camera-disposed-cpu-render-cpu-leases-loose-log-post-drain-retirement-tooltip-retirement-bookmark-retirement-hud-focus-boundary-modal-input-freeze-modal-sprite-sync-v1')
 assert.equal(admitted.profiles.filter(p=>p.status==='admitted').length,1)
})
