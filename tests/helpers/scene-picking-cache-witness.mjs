import assert from 'node:assert/strict'
import * as THREE from 'three'
import {RenderView} from '../../app/render-view.ts'
import {ScenePicking} from '../../app/scene-picking.ts'

// Intentional injected overlap. This fixture validates the cache invariant only;
// it is explicitly not evidence that Mission23 naturally produces this crossing.
const naturalGameplay=false
const view=new RenderView(),geometry=new THREE.BufferGeometry()
geometry.setAttribute('position',new THREE.Float32BufferAttribute([
  0,0,0, 1,0,0, 0,0,1,
  0,0,0, 1,0,0, 0,0,1,
],3))
const terrain=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial()),sprite=new THREE.Sprite()
terrain.userData.terrainGrid=true
const command=(slot,face,bucket)=>({slot,alpha:false,bucket,cell:0,object:0,face,phase:2,order:slot})
// Triangle 0's current command sorts behind the person and clears the visible pick;
// triangle 1 sorts in front, letting the person remain selected.
view.painter.ranges.set(terrain,[0,2])
view.painter.commandsBySlot[0]=command(0,0,40)
view.painter.commandsBySlot[1]=command(1,1,60)
view.painter.ranges.set(sprite,[2,1])
view.painter.commandsBySlot[2]={...command(2,0,50),phase:0}
const pixels=view.painter.texture.image.data
const template=[
  {point:{x:0,z:0},object:terrain,depth:0,triangle:0,instance:0},
  {point:{x:0,z:0},object:terrain,depth:0,triangle:1,instance:0},
]
let queries=0
view.pickCandidates=()=>{queries++;return template.map(candidate=>({...candidate,point:{...candidate.point}}))}
const group={visible:true,userData:{layers:[sprite]}},scene={
  view,
  renderer:{domElement:{getBoundingClientRect:()=>({left:0,top:0,width:100,height:100})}},
  unitMeshes:new Map([[7,group]]),
  objects:new THREE.Group(),decorations:new THREE.Group(),terrain,camera:new THREE.Camera(),frame:1,
}
const picking=new ScenePicking(scene)
picking.personBounds=()=>({x:0,y:0,width:100,height:100})
const event={clientX:25,clientY:25},key='25,25'
const identity=hit=>hit&&[hit.object.id,hit.triangle,hit.instance]
const current=()=>{
  const cached=picking.groundHits.get(key)
  assert.ok(cached,'ScenePicking caches the injected terrain candidates')
  const winner=view.resolvePickCandidates(cached),fresh=view.pick(new THREE.Vector2(-.5,.5),[terrain],scene.camera,true)
  assert.deepEqual(identity(winner),identity(fresh),'cached winner matches a fresh current-painter query')
  return {cached,winner,command:view.painter.command(winner.object,winner.triangle,winner.instance)}
}

pixels[0]=.25;pixels[1]=.75;pixels[2]=.5
const initialPick=picking.pick(event),initialQueries=queries,initial=current(),afterInitialFresh=queries
assert.equal(initialPick,null,'triangle 0 terrain command clears the person pick')
assert.deepEqual(identity(initial.winner),[terrain.id,0,0])
assert.equal(initial.command.bucket,40)
assert.equal(initialQueries,1)
assert.equal(afterInitialFresh,2)

pixels[0]=.75;pixels[1]=.25
scene.frame++;picking.lastKey=''
const changedPick=picking.pick(event)
assert.equal(queries,afterInitialFresh,'ScenePicking reuses cached geometry after painter-order change')
assert.strictEqual(picking.groundHits.get(key),initial.cached,'same cached candidate array is retained')
const changed=current(),afterChangedFresh=queries
assert.equal(changedPick,7,'ScenePicking consumes triangle 1 current command and exposes the person pick')
assert.deepEqual(identity(changed.winner),[terrain.id,1,0])
assert.equal(changed.command.bucket,60)
assert.equal(afterChangedFresh,afterInitialFresh+1)

pixels[0]=.25;pixels[1]=.75
scene.frame++;picking.lastKey=''
const restoredPick=picking.pick(event)
assert.equal(queries,afterChangedFresh,'ScenePicking still reuses cached geometry after painter restore')
assert.strictEqual(picking.groundHits.get(key),initial.cached,'restoration keeps the original cached candidate array')
const restored=current()
assert.equal(restoredPick,null,'restored triangle 0 command clears the person pick again')
assert.deepEqual(identity(restored.winner),[terrain.id,0,0])
assert.equal(restored.command.bucket,40)

console.log(JSON.stringify({
  fixture:'injected-painter-order-overlap',naturalGameplay,
  identities:[identity(initial.winner),identity(changed.winner),identity(restored.winner)],
  visiblePicks:[initialPick,changedPick,restoredPick],candidateArrayReused:true,cachedEqualsFresh:true,
}))
