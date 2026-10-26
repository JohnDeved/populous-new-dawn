import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { RenderView } from '../app/render-view.ts'

// Real CPU Painter submissions; identical native triangles isolate source-order
// ties from legitimate model-geometry/depth changes. No GPU parity claim.
test('owned native mesh replacement preserves fallback tie order and model phase', () => {
  const view = new RenderView(), scene = new THREE.Scene(), meshes = []
  view.update(800, 600, {x:0,z:0}, 0, 0, false)
  function mesh() {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(
      [-1,0,0, 1,0,0, 0,1,0, -1,0,0, 0,1,0, 1,0,0], 3))
    const value = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial())
    Object.assign(value.userData, {nativeScale:1,nativeSize:256,stage:0})
    view.materials.set(value.material, {})
    meshes.push(value)
    return value
  }
  const group = new THREE.Group(), peerGroup = new THREE.Group(), original = mesh(), peer = mesh()
  group.add(original);peerGroup.add(peer);scene.add(group,peerGroup)
  function measure(value) {
    scene.updateMatrixWorld(true)
    view.painter.update(scene, {setTransparentSort(){}})
    const a = view.painter.command(value,0), b = view.painter.command(peer,0)
    assert.ok(a && b)
    assert.equal(a.bucket,b.bucket);assert.equal(a.cell,b.cell)
    assert.equal(a.phase,1);assert.equal(b.phase,1)
    const result = {object:a.object,peer:b.object,order:Math.sign(a.order-b.order),
      depth:Math.sign(view.painter.depth(value,0,0)-view.painter.depth(peer,0,0))}
    view.painter.afterRender()
    return result
  }
  try {
    const before=measure(original), replacement=mesh()
    original.removeFromParent();group.add(replacement)
    const unbound=measure(replacement)
    assert.notEqual(unbound.order,before.order,'Raw replacement allocation reproduces the tie inversion')
    assert.notEqual(unbound.depth,before.depth,'Actual Painter depth reverses at the same bucket/cell')
    replacement.userData.painterFallbackId=original.id
    const preserved=measure(replacement)
    assert.equal(preserved.object,before.object)
    assert.equal(preserved.order,before.order)
    assert.equal(preserved.depth,before.depth)
    assert.equal(replacement.userData.painterSequence,undefined,'Stable identity must not select sprite phase')
  } finally {
    view.dispose()
    for(const value of meshes){value.geometry.dispose();value.material.dispose()}
  }
})

test('actual Angel resource swaps carry original fallback identity through both models', async () => {
  const { loadSceneFixture } = await import('./support/bloodlust-scene.mjs')
  await loadSceneFixture()
  const { makeFx, animateFx } = await import('../app/scene-effects.ts'),
    { releaseGroup } = await import('../app/scene-assets.ts'),
    { compatibilityEnvironment } = await import('../app/world-environment.ts'),
    { createAngelPresentation, requestAngelModel, stepAngelPresentation } = await import('../app/angel-presentation.ts')
  const originalLoad=THREE.TextureLoader.prototype.load
  THREE.TextureLoader.prototype.load=function(){return new THREE.Texture()}
  let group
  try {
    const scene={environment:compatibilityEnvironment,releaseGroup,locate(group){group.position.set(0,0,0)}},
      state=createAngelPresentation(), effect={angel:{phase:'striking',heading:0,timer:28,presentation:state}}
    group=makeFx(scene,effect)
    const initial=group.children[0], id=initial.id
    animateFx(scene,group,effect)
    for(const target of [62,69,62,69]) {
      const previous=group.children[0]
      for(let i=0;i<6;i++){requestAngelModel(state,target);stepAngelPresentation(state);animateFx(scene,group,effect)}
      const mesh=group.children[0]
      assert.notEqual(mesh,previous)
      assert.equal(mesh.userData.nativeModel,target)
      assert.equal(mesh.userData.painterFallbackId,id)
      assert.equal(mesh.userData.painterSequence,undefined)
      assert.equal(group.children.length,1)
    }
  } finally {
    if(group)releaseGroup(group)
    THREE.TextureLoader.prototype.load=originalLoad
  }
})
