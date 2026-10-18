import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import * as THREE from 'three'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
await loadSceneFixture()
const { ScenePicking } = await import('../app/scene-picking.ts')
const { RenderView } = await import('../app/render-view.ts')
const projection = await import('../app/projection.ts')
const faces = await import('../app/model-faces.ts')
const order = await import('../app/painter-order.ts')
const picking = await import('../app/world-picking.ts')
const resources = await import('../app/model-resources.ts')
const frozen = readFileSync(new URL('./fixtures/model-pick-parent.ts.txt', import.meta.url), 'utf8')
// This method is byte-identical in frozen fixture and actual parent main 5aa54cbe.
const method = frozen.slice(frozen.indexOf('  model(mesh:'), frozen.indexOf('  personBounds('))
let observingConstruction = false, constructionRear = 0
const bindings = { ScenePicking, THREE, ...projection, ...faces, ...order, ...picking, ...resources,
  modelTriangleVisible(...args) {
    const front = order.modelTriangleVisible(...args)
    if (observingConstruction && !front) constructionRear++
    return front
  },
}
const Baseline = new Function(...Object.keys(bindings), 'return ' + stripTypeScriptTypes('(class extends ScenePicking {' + method + '})'))(...Object.values(bindings))

function fixture(t, Type, id = 5, stage = 4) {
  const view = new RenderView(), group = new THREE.Group(), resource = resources.nativeModelResource(id, id === 15 ? 6 : 2)
  const geometry = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(faces.modelStage(resource.data, stage).p, 3))
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial())
  group.userData.building = 7; group.add(mesh)
  Object.assign(mesh.userData, { nativeModel: id, nativeResource: resource, stage, nativeSize: resource.data.scale })
  view.update(800, 600, { x: 0, z: 0 }, 0, 0, false)
  t.after(() => { view.dispose(); geometry.dispose(); mesh.material.dispose() })
  return { view, group, mesh, picker: new Type({ view }) }
}

test('local scratch retains exact ordered commands across shipped faces, winding, bounds and cache transitions', t => {
  let emitted = 0, zeroOutput = 0, constructionEmitted = 0
  for (const id of [5, 15, 79]) for (const stage of [0, 2, 4]) {
    const a = fixture(t, ScenePicking, id, stage), b = fixture(t, Baseline, id, stage)
    for (const heading of [0, 511, 1024]) for (const outside of [false, true]) {
      for (const f of [a,b]) {
        Object.assign(f.group.userData, { nativeHeading: heading, nativeTilt: 128, nativeRoll: -64 })
        f.view.update(800, 600, { x: outside ? 1000 : 0, z: outside ? 1000 : 0 }, heading / 512, 0, false)
        f.mesh.geometry.attributes.position.needsUpdate = true
      }
      const key = `${heading}:${outside}`, actual = a.picker.model(a.mesh,key)
      observingConstruction = stage !== 4
      let expected
      try { expected = b.picker.model(b.mesh,key) } finally { observingConstruction = false }
      if (stage !== 4) constructionEmitted += actual.filter(c => c.kind === 'model').length
      assert.deepEqual(actual,expected); emitted += actual.filter(c => c.kind === 'model').length
      if (actual.length === 1) zeroOutput++
      assert.strictEqual(a.picker.model(a.mesh,key),actual)
      const retained = structuredClone(actual)
      a.picker.model(a.mesh,key+'next')
      assert.deepEqual(actual,retained,'later builds cannot mutate published points or commands')
    }
  }
  assert.ok(emitted > 0); assert.ok(zeroOutput > 0, 'off-bound builds still project and produce only bounds')
  assert.ok(constructionEmitted > 0, 'construction commands emitted')
  assert.ok(constructionRear > 0, 'frozen baseline exercises construction rear-face reversal')
})

test('custom reads, nested model calls and thrown position hooks keep baseline order and recovery', t => {
  function run(Type, throws) {
    const f = fixture(t,Type), nested = fixture(t,Type,15,2), reads=[]
    const position=f.mesh.geometry.attributes.position, original=position.getX
    let entered=false
    const size=f.mesh.userData.nativeSize
    Object.defineProperty(f.mesh.userData,'nativeSize',{get(){reads.push(['size']);return size}})
    position.getX=function(i) {
      reads.push(['x',i])
      if (!entered) { entered=true; reads.push(['nested',f.picker.model(nested.mesh,'nested').length]); if(throws)throw Error('position hook') }
      return original.call(this,i)
    }
    const data=f.mesh.userData.nativeResource.data
    f.mesh.userData.nativeResource={...f.mesh.userData.nativeResource,data:new Proxy(data,{get(target,key){reads.push(['data',String(key)]);return target[key]}})}
    let error=null, commands
    try { commands=f.picker.model(f.mesh,'outer') } catch(e) { error=e.message }
    position.getX=original
    const recovered=f.picker.model(f.mesh,'recovery')
    return {reads,error,commands,recovered}
  }
  for(const throws of [false,true])assert.deepEqual(run(ScenePicking,throws),run(Baseline,throws))
})
