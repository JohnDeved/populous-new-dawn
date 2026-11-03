import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
const source=readFileSync(process.env.PND_MODAL_SCENE || new URL('../app/scene.ts',import.meta.url),'utf8')
const start=source.indexOf('  setModalSuspended(suspended: boolean) {'),end=source.indexOf('\n  uiTimer =',start)
assert.ok(start>=0&&end>start)
const method=source.slice(start,end).replace('setModalSuspended(suspended: boolean)','setModalSuspended(suspended)')
const setModal=new Function('cancelPointerGesture','return ({'+method+'}).setModalSuspended')(()=>{})
function fixture(stop) {
 const calls=[],state={f2:4,mesh:4}
 const scene={ disposed:false,modalSuspended:false,previous:10, keys:new Set(['x']),world:{cameras:{input:{buttons:1}}},
 advanceInputTime(){calls.push('drain');state.f2++;if(stop==='drain')this.disposed=true},
 updateTooltipFrame(){calls.push('tooltip');if(stop==='tooltip')this.disposed=true},
 updateUnitsFrame(){calls.push('units');state.mesh=state.f2;if(stop==='units')this.disposed=true;if(stop==='throw')throw null},
 neutralCursor:{reset(){calls.push('reset')}},cancelNearbyFollowers(){},cancelTooltipInspection(){},
 renderer:{domElement:{hasPointerCapture(){return false}}}}
 return {scene,calls,state}
}
test('actual suspension boundary refreshes drained native sprite once before frozen renders',()=>{
 const {scene,calls,state}=fixture()
 setModal.call(scene,true)
 assert.equal(scene.modalSuspended,true)
 assert.deepEqual(calls,['drain','tooltip','units','reset'])
 assert.equal(state.mesh,state.f2)
 // Supplied painter-only suspended frames must observe the synchronized mesh.
 for(let i=0;i<24;i++)assert.equal(state.mesh,5)
 setModal.call(scene,true)
 assert.equal(calls.filter(x=>x==='units').length,1)
 assert.equal(state.f2,5)
 setModal.call(scene,false)
 assert.equal(calls.filter(x=>x==='units').length,1)
 assert.equal(scene.modalSuspended,false)
 assert.equal(scene.previous,null)
 assert.equal(scene.world.cameras.input.buttons,0)
})
for(const boundary of ['drain','tooltip','units'])test('retirement at '+boundary+' stops further suspension work',()=>{
 const {scene,calls}=fixture(boundary)
 setModal.call(scene,true)
 assert.equal(scene.modalSuspended,false)
 const order=['drain','tooltip','units']
 assert.deepEqual(calls,order.slice(0,order.indexOf(boundary)+1))
})
test('falsey sprite update failure remains primary without publishing suspension',()=>{
 const {scene,calls}=fixture('throw')
 let failed=false, error
 try{setModal.call(scene,true)}catch(e){failed=true;error=e}
 assert.equal(failed,true);assert.equal(error,null)
 assert.equal(scene.modalSuspended,false)
 assert.deepEqual(calls,['drain','tooltip','units'])
})
test('disposed scene performs no clock or presentation work',()=>{
 const {scene,calls}=fixture();scene.disposed=true
 setModal.call(scene,true);assert.deepEqual(calls,[])
})
