import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { registerHooks, stripTypeScriptTypes } from 'node:module'
import { readFileSync } from 'node:fs'
const frozenUrl = new URL('../app/__model_pick_baseline.ts', import.meta.url).href
const sourceUrl = new URL('../app/scene-picking.ts', import.meta.url).href
registerHooks({ resolve(specifier, context, next) { if (specifier === frozenUrl) return { url: frozenUrl, shortCircuit: true }; return next(specifier, context) }, load(url, context, next) {
  if (url === frozenUrl) return { format: 'module', shortCircuit: true, source: stripTypeScriptTypes(readFileSync(new URL('./fixtures/model-pick-parent.ts.txt', import.meta.url), 'utf8'), { mode: 'transform' }) }
  if (url === sourceUrl) return { format: 'module', shortCircuit: true, source: stripTypeScriptTypes(readFileSync(new URL(url), 'utf8'), { mode: 'transform' }) }
  return next(url, context)
} })
const { ScenePicking } = await import('../app/scene-picking.ts')
const { ScenePicking: BaselinePicking } = await import(frozenUrl)
import { RenderView } from '../app/render-view.ts'
import { FramePerformance } from '../app/frame-performance.ts'
import { createPointerFrameMetrics, resetPointerFrameMetrics } from '../app/pointer-frame-metrics.ts'
import { validModelPickWork } from '../app/model-pick-work.ts'

function fixture(t, Picking = ScenePicking) {
  const view = new RenderView(), root = new THREE.Group(), mesh = new THREE.Mesh()
  t.after(() => { mesh.geometry.dispose(); mesh.material.dispose() })
  mesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3))
  mesh.userData = { nativeModel: 0, stage: 4, nativeResource: { bank: 0, data: { tiles: [], faces: [], p: [], biases: [], scale: 1 } } }
  root.userData.building = 7; root.add(mesh)
  view.painter.source = () => ({ bucket: 10, cell: 0, phase: 0, object: 0, face: 0 })
  view.pickSubmissionKey = () => ''; view.pickCandidates = () => []; view.resolvePickCandidates = () => null
  const scene = { view, objects: root, decorations: new THREE.Group(), unitMeshes: new Map(),
    renderer: { domElement: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) } }, frame: 1 }
  return { scene, mesh, picking: new Picking(scene) }
}

test('actual default model cache builds count only new published records, not cache hits', t => {
  const { scene, mesh, picking } = fixture(t), metrics = createPointerFrameMetrics(true), event = { clientX: 20, clientY: 20 }
  assert.equal(picking.pick(event, metrics), null)
  assert.deepEqual(metrics.modelWork, [1, 0, 0])
  scene.frame++; picking.pick(event, metrics)
  assert.deepEqual(metrics.modelWork, [1, 0, 0])
  mesh.geometry.attributes.position.needsUpdate = true
  scene.frame++; picking.pick(event, metrics)
  assert.deepEqual(metrics.modelWork, [2, 0, 0])
  const same = metrics.modelWork; resetPointerFrameMetrics(metrics)
  assert.strictEqual(metrics.modelWork, same); assert.deepEqual(same, [0, 0, 0])
})

test('actual face scan counts accepted/rejected tests without changing dispatch, order or winner', t => {
  const { scene, picking } = fixture(t), metrics = createPointerFrameMetrics(true)
  const commands = [
    { kind: 'model', id: 7, bucket: 10, face: 0, points: [{x:0,y:0},{x:40,y:0},{x:0,y:40}] },
    { kind: 'model', id: 7, bucket: 10, face: 1, points: [{x:70,y:70},{x:90,y:70},{x:70,y:90}] },
    { kind: 'bounds', id: 7, bucket: 10, face: 2, bounds: { x: 0, y: 0, width: 100, height: 100 } },
  ]
  picking.model = function () { assert.equal(arguments.length, 2); return commands }
  const event = { clientX: 10, clientY: 10 }
  const off = picking.pick(event)
  scene.frame++
  assert.equal(picking.pick(event, metrics), off); assert.equal(off, 7)
  assert.deepEqual(metrics.modelWork, [0, 2, 1])
  const baseline = fixture(t, BaselinePicking).picking
  baseline.model = () => commands
  assert.equal(baseline.pick(event), off, 'winner matches frozen actual parent picker')
  picking.pick(event, metrics); assert.deepEqual(metrics.modelWork, [0, 2, 1])
  scene.frame++; picking.pick({ clientX: 200, clientY: 200 }, metrics)
  assert.deepEqual(metrics.modelWork, [0, 2, 1], 'whole bounds rejection does not visit faces')
})

test('optional compact counts validate, snapshot, wrap and retain old absence', () => {
  for (const value of [Array(3), null, [], [1,2], [1,2,3], [-1,2,1], [1.5,2,1], [Infinity,2,1]]) assert.equal(validModelPickWork(value), false)
  const ring = new FramePerformance(), metrics = createPointerFrameMetrics(true)
  for (let i = 1; i <= 1202; i++) { metrics.modelWork = [i,i,i-1]; ring.sample(10,0,0,0,0,0,i*10,'live',metrics) }
  metrics.modelWork.fill(0)
  assert.deepEqual(ring.recentFrames()[0].pointerBreakdown.modelWork, [3,3,2])
  ring.sample(10,0,0,0,0,0,12030,'live',createPointerFrameMetrics())
  assert.equal(ring.recentFrames().at(-1).pointerBreakdown.modelWork, undefined)
  metrics.modelWork = [0,0,1]; ring.sample(10,0,0,0,0,0,12040,'live',metrics)
  assert.equal(ring.recentFrames().at(-1).timestampMs, 12030)
})


test('disabled picks add no diagnostic clocks or model cache inspection', t => {
  const { picking } = fixture(t)
  picking.model = () => [{ kind: 'bounds', id: 7, bucket: 1, face: 0, bounds: { x: 0, y: 0, width: 1, height: 1 } }]
  picking.models = { get() { throw Error('unexpected diagnostic cache inspection') } }
  const original = Object.getOwnPropertyDescriptor(performance, 'now')
  Object.defineProperty(performance, 'now', { configurable: true, value() { throw Error('unexpected clock') } })
  t.after(() => { if (original) Object.defineProperty(performance, 'now', original); else delete performance.now })
  assert.equal(picking.pick({ clientX: 50, clientY: 50 }), null)
})
