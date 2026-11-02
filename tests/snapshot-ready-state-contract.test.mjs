import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {checkpointCodec} from '../scripts/tutorial-browser/checkpoint-codec.mjs'
import {snapshotFinalCamera} from '../scripts/browser-performance/snapshot-camera-setup.mjs'
const source=readFileSync(new URL('./browser-snapshot-setup.test.mjs',import.meta.url),'utf8')
const setup=readFileSync(new URL('../scripts/browser-performance/snapshot-setup.mjs',import.meta.url),'utf8')
const start=source.indexOf('function readyState(f) {'),target=source.indexOf("test('stable-pose admission"),end=source.indexOf("\ntest('load exception",target)
assert.ok(start>=0&&target>start&&end>target)
const readyState=Function(source.slice(start,target)+'; return readyState')()
const admission=Function('assert','snapshotFinalCamera',setup.slice(setup.indexOf('export function assertSnapshotAdmission('),setup.indexOf('\nexport async function loadSnapshot(')).replace('export ','')+';return assertSnapshotAdmission')(assert,snapshotFinalCamera)
function fixture(){return {expected:checkpointCodec({cameras:{tribes:[{x:39936,y:23808,angle:256,h:59,initialized:true}]},manaWorld:{playerTribe:0}}),receipt:{focus:{x:-107,z:-101},admittedSimulationSha256:'simulation',selected:[]}}}
test('actual stable-pose fixture faithfully includes persisted owner height and initialization',()=>{
 const f=fixture(),state=readyState(f)
 assert.deepEqual(state.camera.position,{x:40192,y:23808,angle:0,h:59,initialized:true})
 admission(state,f)
})
test('actual maintained positive and every rejection control pass with supplied canonical fixture',async()=>{
 let callback
 Function('test','assert','getFixture','readyState','assertSnapshotAdmission',source.slice(target,end))((_name,fn)=>{assert.equal(callback,undefined);callback=fn},assert,async()=>fixture(),readyState,admission)
 assert.equal(typeof callback,'function');await callback()
})
