import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
import {createTribeCameras,withSimulationCamera} from '../app/tribe-camera.ts'
import {createCameraMotion,requestCameraFocus} from '../app/camera-motion.ts'
const source=fs.readFileSync(new URL('../app/scene-camera-runtime.ts',import.meta.url),'utf8')
const tree=ts.createSourceFile('camera.ts',source,ts.ScriptTarget.Latest,true)
const nodes=tree.statements.filter(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='cameraBookmark')
assert.equal(nodes.length,1)
const js=ts.transpileModule(nodes[0].getText(tree).replace(/^export /,''),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText
const cameraBookmark=new Function('withSimulationCamera','requestCameraFocus','sampleCamera',js+';return cameraBookmark')(withSimulationCamera,requestCameraFocus,()=>({x:12.4,y:65536.8,angle:2048.6}))
function fixture(onSound=()=>{}) {
 const calls=[],cameras=createTribeCameras()
 Object.assign(cameras.tribes[0],{x:100,y:200,angle:400})
 Object.assign(cameras.held[0],{x:2,y:-3,angle:1})
 const scene={disposed:false,world:{cameras,mode:'blast',manaWorld:{playerTribe:0}},cameraPosition:cameras.tribes[0],cameraMotion:createCameraMotion(),cameraBookmarks:{1:{x:1234,y:4567,angle:600}},tooltip:{draw:1},
 advanceInputTime(){calls.push('drain')},captureCamera(v){calls.push(['capture',v])},cancelOverview(){calls.push('cancel')},onSound(id){calls.push(['sound',id]);onSound(this,id)}}
 return {scene,calls,initialMotion:structuredClone(scene.cameraMotion),initialCamera:{...scene.cameraPosition},run:(slot=1,set=false)=>cameraBookmark(scene,slot,set)}
}
test('recall sound retirement cannot mutate focus, interaction mode or tooltip',()=>{
 const {scene,calls,initialMotion,initialCamera,run}=fixture(s=>{s.disposed=true});run()
 assert.deepEqual(scene.cameraMotion,initialMotion)
 assert.equal(scene.world.mode,'blast');assert.equal(scene.tooltip.draw,1)
 assert.deepEqual(scene.cameraPosition,initialCamera);assert.equal(scene.world.cameras.phase,'idle')
 assert.deepEqual(calls,['drain',['capture',true],'cancel',['sound',222]])
})
test('live recall keeps quantized destination and real focus planning',()=>{
 const {scene,calls,initialCamera,run}=fixture();run()
 assert.deepEqual(scene.cameraMotion.target,{x:1280,y:4352,angle:600})
 assert.ok(scene.cameraMotion.active)
 assert.equal(scene.world.mode,null);assert.equal(scene.tooltip.draw,0)
 assert.deepEqual(scene.cameraPosition,initialCamera);assert.equal(scene.world.cameras.phase,'idle')
 assert.deepEqual(calls,['drain',['capture',true],'cancel',['sound',222]])
})
test('missing bookmark does not capture, emit cue or schedule focus',()=>{
 const {scene,calls,initialMotion,run}=fixture();run(9)
 assert.deepEqual(calls,['drain']);assert.deepEqual(scene.cameraMotion,initialMotion)
})
test('set bookmark retains sampled rounding and terminal cue221',()=>{
 const {scene,calls,initialMotion,run}=fixture(s=>{s.disposed=true});run(2,true)
 assert.deepEqual(scene.cameraBookmarks[2],{x:12,y:1,angle:1})
 assert.deepEqual(calls,['drain',['sound',221]]);assert.deepEqual(scene.cameraMotion,initialMotion)
})
test('falsey thrown sound is propagated and real borrowed camera state is restored',()=>{
 const {scene,initialMotion,initialCamera,run}=fixture(()=>{throw false})
 assert.throws(run,e=>e===false)
 assert.deepEqual(scene.cameraMotion,initialMotion);assert.deepEqual(scene.cameraPosition,initialCamera)
 assert.equal(scene.world.cameras.phase,'idle');assert.equal(scene.world.mode,'blast')
})
