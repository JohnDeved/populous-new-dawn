import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { registerHooks, stripTypeScriptTypes } from 'node:module'
import { readFileSync } from 'node:fs'
const url = new URL('../app/scene-picking.ts', import.meta.url).href
registerHooks({ load(id, context, next) {
  if (id === url) return { format: 'module', shortCircuit: true,
    source: stripTypeScriptTypes(readFileSync(new URL(id), 'utf8'), { mode: 'transform' }) }
  return next(id, context)
} })
const { ScenePicking } = await import('../app/scene-picking.ts')

function fixture(t) {
  const tree = { id: 81, model: 11, logs: 1 }, group = new THREE.Group()
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial())
  t.after(() => sprite.material.dispose())
  sprite.scale.set(17, 11, 1); sprite.center.set(.5, 0)
  group.add(sprite); group.userData = { point: tree, sprite, sequence: 'log' }
  const decorations = new THREE.Group(); decorations.add(group)
  const rect = { left: 200, top: 10, width: 800, height: 600 }
  const sources = new Map([[sprite, { bucket: 10, cell: 3, phase: 0, object: -81, face: 0 }]])
  const scene = { world: { trees: [tree] }, frame: 1, overviewActive: false,
    decorations, objects: new THREE.Group(), unitMeshes: new Map(), camera: new THREE.Camera(),
    renderer: { domElement: { getBoundingClientRect: () => rect } },
    view: { center: { x: 0, y: 0 }, rawCenter: { x: 0, y: 0 },
      projection: { width: 800, height: 600 },
      screen: position => ({ x: position.x / 400, y: position.y / 300 }),
      painter: { source: object => sources.get(object), command: () => null },
      pickSubmissionKey: () => '', pickCandidates: () => [], resolvePickCandidates: () => null } }
  const picking = new ScenePicking(scene)
  const pick = (x = 400, y = 295) => { scene.frame++; return picking.pick({ clientX: rect.left + x, clientY: rect.top + y }) }
  return { scene, tree, group, sprite, sources, rect, picking, pick }
}

test('actual visible submitted live log is a resource, never a person', t => {
  const f = fixture(t)
  assert.equal(f.pick(), 81)
  assert.equal(f.picking.lastKind, 'resource')
  assert.equal(f.picking.pickPerson({clientX:600,clientY:305}), null)
})

for (const [x,y] of [[392,289],[409,289],[392,300],[409,300],[400,289],[400,300]])
  test(`inclusive odd-width log header edge ${x},${y} includes transparent corners`, t => {
    assert.equal(fixture(t).pick(x,y),81)
  })
for (const [x,y] of [[391,295],[410,295],[400,288],[400,301]])
  test(`one pixel outside log header ${x},${y} rejects`, t => assert.equal(fixture(t).pick(x,y),null))

for (const kind of ['invalid id','fractional id','NaN logs','missing logs','depleted','removed','wrong identity','not log','hidden ancestor','hidden sprite','hidden material','no submission','wrong sprite child','overview'])
  test(`resource rejects ${kind}`, t => {
    const f=fixture(t)
    if(kind==='invalid id')f.tree.id=0
    if(kind==='fractional id')f.tree.id=1.5
    if(kind==='NaN logs')f.tree.logs=NaN
    if(kind==='missing logs')delete f.tree.logs
    if(kind==='depleted')f.tree.logs=0
    if(kind==='removed')f.scene.world.trees=[]
    if(kind==='wrong identity')f.scene.world.trees=[{...f.tree}]
    if(kind==='not log')f.tree.model=1
    if(kind==='hidden ancestor')f.scene.decorations.visible=false
    if(kind==='hidden sprite')f.sprite.visible=false
    if(kind==='hidden material')f.sprite.material.visible=false
    if(kind==='no submission')f.sources.clear()
    if(kind==='wrong sprite child')f.group.remove(f.sprite)
    if(kind==='overview')f.scene.overviewActive=true
    assert.equal(f.pick(),null)
  })

test('actual world transform/fractional anchor, resize and next-frame eligibility are live',t=>{
  const f=fixture(t);f.group.position.set(30.75,20.25,0)
  assert.equal(f.pick(430,275),81);assert.equal(f.pick(400,295),null)
  f.rect.width=1600;f.rect.height=1200
  assert.equal(f.pick(861,555),81)
  f.tree.logs=0;assert.equal(f.pick(861,555),null)
})

for(const groundBucket of [9,11])test(`shared painter terrain bucket ${groundBucket} resolves against log`,t=>{
  const f=fixture(t)
  f.scene.view.resolvePickCandidates=()=>({object:{},triangle:0,instance:0})
  f.scene.view.painter.command=()=>({bucket:groundBucket,cell:3,phase:2,object:0,face:0})
  assert.equal(f.pick(),groundBucket===9?null:81)
})

for (const kind of ['person','model']) for (const bucket of [9,11])
  test(`shared ${kind} bucket ${bucket} competes with resource without relabeling`,t=>{
    const f=fixture(t), group=new THREE.Group()
    const source={bucket,cell:3,phase:0,object:1,face:0}
    if(kind==='person'){
      const layer=new THREE.Sprite();group.add(layer);group.userData.layers=[layer]
      f.scene.unitMeshes.set(7,group);f.sources.set(layer,source)
      f.picking.personBounds=()=>({x:390,y:285,width:30,height:30})
    }else{
      const mesh=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.MeshBasicMaterial())
      t.after(()=>{mesh.geometry.dispose();mesh.material.dispose()})
      mesh.userData.nativeModel=0;group.userData.building=7;group.add(mesh)
      f.scene.objects.add(group);f.sources.set(mesh,source)
      f.picking.model=()=>[
        {kind:'model',id:7,bucket,face:0,points:[{x:390,y:285},{x:425,y:285},{x:390,y:320}]},
        {kind:'bounds',id:7,bucket,face:1,bounds:{x:390,y:285,width:30,height:30}}]
    }
    assert.equal(f.pick(),bucket===9?7:81)
    assert.equal(f.picking.lastKind,bucket===9?kind:'resource')
    assert.equal(f.picking.pickPerson({clientX:600,clientY:305}),bucket===9&&kind==='person'?7:null)
  })


test('displayed worldScale and fractional viewport sizes truncate without scaledSprites expansion',t=>{
  const f=fixture(t)
  f.group.scale.set(1.5,1.5,1)
  f.scene.view.config={scaledSprites:true}
  // Displayed 25.5 by16.5 header becomes integer25 by16, centered at400,300.
  assert.equal(f.pick(388,284),81);assert.equal(f.pick(413,300),81)
  assert.equal(f.pick(414,295),null);assert.equal(f.pick(400,283),null)
  f.rect.width=1000;f.rect.height=750
  // Displayed31.875 by20.625 truncates31 by20; anchor500,375.
  assert.equal(f.pick(485,355),81);assert.equal(f.pick(516,375),81)
  assert.equal(f.pick(517,365),null);assert.equal(f.pick(500,354),null)
})
