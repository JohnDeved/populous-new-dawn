// Pure retained shapes and synthetic UI/probe objects only. No game model/clock.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createOrderDispatch, movePointSets } from './ground-and-dispatch.mjs'
const probeSource=readFileSync(new URL('./browser-probes.mjs',import.meta.url),'utf8')
const pureSource=probeSource.slice(probeSource.indexOf('export function findEntityInput'),probeSource.indexOf('export function inspectEntityPoint'))
const { findEntityInput }=await import('data:text/javascript;base64,'+Buffer.from(pureSource).toString('base64'))

function fixture(mode='model8',{failDispatch=false}={}) {
  const logs=[],mapped=[],world={turn:100,lastOrderTurn:99,paused:false,status:'playing',inputMask:0,mode:null,selected:[176],effects:[],
    pointerAck:{until:1,target:0},units:[{id:176,work:null,target:null,order:null}]}
  const untouched=structuredClone(world),canvas={},calls={ground:0,object:0,context:0,click:0},pointCalls=[]
  let currentPoint,centerCount=0
  const scene={world,renderer:{domElement:canvas},container:{getBoundingClientRect:()=>({x:0,y:0,width:1000,height:1000})},
    cameraPosition:{x:123,y:456},cameraBearing:0,cameraMotion:{active:false},
    screen:point=>{currentPoint=point;centerCount=0;pointCalls.push({...point});return {x:0,y:0}},
    pick:()=>{calls.ground++;centerCount++;return mode==='no-ground'||mode==='missing-center'&&centerCount===26?null:{x:currentPoint.x+(mode==='far-ground'?2:0),z:currentPoint.z}},
    picking:{lastKey:'unchanged',lastId:null,lastKind:null,pick:()=>{calls.object++;return mode==='object'?77:null}}}
  const context=source=>{
    const detached=structuredClone(source);detached.probeMutation=true;calls.context++
    const model=mode==='model8'||mode==='second'&&currentPoint.x===29?8:3
    return ()=>({model,enabled:mode!=='disabled',buildingId:model===8?98:null})
  }
  globalThis.window={testSceneRef:{current:scene},nativeGuardProbes:{findEntityInput,createMoveContextProbe:context,observeEntityPointer:()=>({finish:()=>({})})}}
  globalThis.document={elementFromPoint:()=>mode==='not-canvas'?{}:canvas}
  const page={evaluate:async(callback,arg)=>callback(arg),mouse:{move:async()=>{},click:async()=>{
    calls.click++;world.turn=101;world.lastOrderTurn=101;world.pointerAck={until:2,target:0}
    world.units[0].order={model:3,a:Math.round((currentPoint.x+8)*256),b:Math.round((-currentPoint.z-8)*256)}
    world.effects=[{id:9,kind:'orderMarker',x:currentPoint.x,z:currentPoint.z}]
  }}}
  const dispatch=createOrderDispatch({page,read:async()=>{if(failDispatch)throw Error('dispatch acceptance stop');return structuredClone(world)},
    log:e=>logs.push(e),pollUI:async()=>{throw Error('unexpected wait')},health:()=>{},signal:new AbortController().signal,
    ordinary:{map:async point=>mapped.push({...point}),prepareEntityClick:()=>{throw Error('unexpected entity')},finishEntityClick:async()=>{delete window.campaignEntityPointer}}})
  return {dispatch,logs,mapped,calls,world,untouched,pointCalls,cleanup:()=>{delete globalThis.window;delete globalThis.document}}
}

for(const [mode,reason] of [['not-canvas','not-canvas-owned'],['no-ground','no-ground-pick'],['object','competing-object'],['far-ground','outside-target-radius']]) {
  test(`records actual ${reason} counts/picks without extra diagnostics-only picker calls`,async()=>{
    const f=fixture(mode)
    try {
      await assert.rejects(f.dispatch.move('firewarrior'),/three same-view/)
      const probes=f.logs.filter(e=>e.action==='ordinary-ground-target')
      assert.equal(f.mapped.length,1);assert.equal(probes.length,3);assert.equal(f.calls.click,0)
      assert.deepEqual(f.pointCalls,movePointSets.firewarrior)
      for(const {diagnostics:d}of probes){
        assert.equal(d.candidateSequence.length,20)
        assert.deepEqual(d.candidateSequence.slice(0,4),Array(4).fill({x:500,y:500}))
        assert.equal(d.counts.inspect,17);assert.equal(d.reasons[reason],17)
        assert.equal(d.examples[reason].length,3);assert.equal(d.visitedPixels.length,17)
        assert.equal(d.uniqueVisitedPixels,17);assert.equal(d.repeatedInspectCoordinates,0)
        assert.equal(d.counts.groundPick,mode==='not-canvas'?0:17)
        assert.equal(d.counts.objectPick,['not-canvas','no-ground'].includes(mode)?0:17)
      }
      assert.equal(f.calls.ground,probes.reduce((sum,p)=>sum+p.diagnostics.counts.groundPick,0))
      assert.equal(f.calls.object,probes.reduce((sum,p)=>sum+p.diagnostics.counts.objectPick,0))
      assert.deepEqual(f.world,f.untouched)
    } finally {f.cleanup()}
  })
}

test('retains exact model/disabled/vanished-center decisions and stops after three probes',async()=>{
  for(const [mode,decision]of [['model8','context-model-not-3'],['disabled','context-disabled'],['missing-center','center-ground-disappeared']]) {
    const f=fixture(mode)
    try{
      await assert.rejects(f.dispatch.move('shaman'),/three same-view/)
      const probes=f.logs.filter(e=>e.action==='ordinary-ground-target')
      assert.equal(f.mapped.length,1);assert.deepEqual(f.pointCalls,movePointSets.shaman)
      for(const {diagnostics:d}of probes){assert.equal(d.decision,decision);assert.equal(d.counts.inspect,25);assert.equal(d.counts.groundPick,26);assert.equal(d.counts.objectPick,25)}
      assert.equal(f.calls.context,mode==='missing-center'?0:3);assert.equal(f.calls.click,0);assert.deepEqual(f.world,f.untouched)
    }finally{f.cleanup()}
  }
})

test('maps once, accepts the first valid same-view point, and retains the actual earned Move',async()=>{
  const f=fixture('second')
  try{
    const result=await f.dispatch.move('firewarrior')
    assert.equal(f.mapped.length,1);assert.deepEqual(f.mapped[0],movePointSets.firewarrior[0])
    assert.deepEqual(f.pointCalls,movePointSets.firewarrior.slice(0,2));assert.equal(f.calls.click,1)
    assert.deepEqual(result.acceptance.recipientIds,[176])
    const earned=f.logs.find(e=>e.action==='ordinary-ground-move-accepted')
    assert.equal(earned.index,1);assert.deepEqual(earned.actualPoint,movePointSets.firewarrior[1])
  }finally{f.cleanup()}
})

test('a dispatch failure never falls through to another point or relaxes acceptance',async()=>{
  const f=fixture('valid',{failDispatch:true})
  try{
    await assert.rejects(f.dispatch.move('firewarrior'),/dispatch acceptance stop/)
    assert.equal(f.mapped.length,1);assert.equal(f.pointCalls.length,1);assert.equal(f.calls.click,0)
    assert.equal(f.logs.some(e=>e.action==='ordinary-ground-move-accepted'),false)
    assert.deepEqual(f.world,f.untouched)
  }finally{f.cleanup()}
})

test('both exact prospective point sets are clear of every retained native footprint',()=>{
  const retained=JSON.parse(readFileSync(new URL('./retained-ground-inputs.json',import.meta.url)))
  const data=JSON.parse(readFileSync(new URL('../../../app/original-shapes.json',import.meta.url)))
  // Read-only correspondence to building-shapes.ts:shape/shapeCells mask1.
  const cells=pose=>{
    const shape=data.shapes[data.objects[pose.object][Math.trunc((pose.angle<<16>>16)/512)]],result=[]
    const cx=(pose.anchorX>>>8)&254,cy=(pose.anchorY>>>8)&254
    for(let y=0;y<shape.height;y++)for(let x=0;x<shape.width;x++)if(data.cells[shape.offset+y*shape.width+x]&1){
      const px=(cx-shape.x+x*2)&255,py=(cy-shape.y+y*2)&255;result.push((py>>1)*128+(px>>1))
    }
    return result
  }
  const cell=point=>((Math.round((-point.z-8)*256)&65535)>>9)*128+((Math.round((point.x+8)*256)&65535)>>9)
  const occupying=point=>retained.buildings.filter(b=>cells(b.pose).includes(cell(point)))
  assert.deepEqual(movePointSets.firewarrior,[{x:29,z:-11},{x:31,z:-11},{x:33,z:-9}])
  assert.deepEqual(movePointSets.shaman,[{x:25,z:-1},{x:27,z:-1},{x:29,z:-1}])
  for(const point of [...movePointSets.firewarrior,...movePointSets.shaman])assert.deepEqual(occupying(point),[],JSON.stringify(point))
  assert.ok(occupying({x:25,z:-9}).some(b=>b.model===8&&b.pose.anchorX===7168&&b.pose.anchorY===0))
})
