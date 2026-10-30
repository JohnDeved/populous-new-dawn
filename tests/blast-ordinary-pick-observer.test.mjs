import assert from 'node:assert/strict'
import test from 'node:test'
import { observeBlastPick } from '../qa/blast-ordinary/pick-observer.mjs'

// Small fake method graph only. No Three, game World, browser or model execution.
function fixture() {
  const log = [], rect = { left: 200, top: 0, width: 20, height: 20 }
  const person = { id: 19 }, layer = { id: 20, uuid: 'layer', type: 'Sprite' }
  const terrain = { id: 21, uuid: 'land', type: 'Mesh', userData: { painterGround: true } }
  const personSource = { slot: 0, alpha: false, bucket: 1851, cell: 24969, phase: 0, object: 1, face: -8, order: 1 }
  const terrainSource = { slot: 1, alpha: false, bucket: 1800, cell: 24970, phase: 2, object: 0, face: 7, order: 2 }
  const bounds = { x: 0, y: 0, width: 21, height: 32 }
  const selected = { object: terrain, triangle: 7, instance: 0, depth: .2 }
  const group = { visible: true, position: { x: 1, y: 2, z: 3 }, matrixWorld: { elements: [1, 0, 0, 1] },
    userData: { frame: 1535, spriteBucket: 1852, pickable: true, layers: [layer] } }
  const painter = {
    texture: { image: { data: [.7, .6] } },
    source(...args) { log.push({ name: 'source', receiver: this, args }); return personSource },
    command(...args) { log.push({ name: 'command', receiver: this, args }); return terrainSource },
  }
  const view = { painter, center: { x: 2, y: 3 }, rawCenter: { x: 2, y: 3 }, projection: { width: 20, height: 20, matrix: [1, 2] },
    resolvePickCandidates(...args) { log.push({ name: 'terrain', receiver: this, args }); return selected } }
  const picking = { lastKey: '', lastKind: null, lastId: null,
    personBounds(...args) { log.push({ name: 'bounds', receiver: this, args }); return bounds },
    pick(event) {
      log.push({ name: 'pick', receiver: this, args: [event] })
      this.personBounds(19); painter.source(layer)
      const chosen = view.resolvePickCandidates([selected]); painter.command(chosen.object, chosen.triangle, chosen.instance)
      this.lastKey = `${event.clientX},${event.clientY}`
      return null
    },
  }
  const gl = { drawingBufferWidth: 2, drawingBufferHeight: 2, RGBA: 1, UNSIGNED_BYTE: 2,
    isContextLost() { return false },
    readPixels(...args) { log.push({ name: 'readPixels' }); args.at(-1).fill(255) } }
  const canvas = { isConnected: true, getBoundingClientRect: () => rect, toDataURL: () => 'data:image/png;base64,eA==' }
  const renderer = { domElement: canvas, info: { render: { frame: 0 } }, getContext: () => gl,
    render(...args) { log.push({ name: 'render', receiver: this, args }); this.info.render.frame++; return 'render-result' } }
  const scene = { world: { turn: 476, units: [person] }, view, picking, renderer,
    container: { getBoundingClientRect: () => rect }, unitMeshes: new Map([[19, group]]),
    cameraPosition: { x: 1, y: 2, angle: 3 }, viewPoint: { x: 1, z: 2 }, cameraBearing: 3, scene: {}, camera: {}, frame: 9 }
  return { scene, log, bounds, personSource, terrainSource, group, layer, selected }
}

test('existing calls preserve exact receivers, argument objects and results; no picker is added', () => {
  const f = fixture(), { scene, log } = f, original = scene.picking.pick
  const observer = observeBlastPick(scene, { targetId: 19 })
  assert.equal(observer.beginSearch(), false); assert.equal(log.length, 0)
  assert.equal(scene.renderer.render(scene.scene, scene.camera), 'render-result')
  assert.equal(observer.beginSearch(), true)
  const event = { clientX: 210, clientY: 10 }
  assert.equal(scene.picking.pick(event), null)
  assert.deepEqual(log.map(row => row.name), ['render', 'readPixels', 'pick', 'bounds', 'source', 'terrain', 'command'])
  assert.equal(log[2].receiver, scene.picking); assert.equal(log[2].args[0], event)
  assert.equal(log[3].receiver, scene.picking); assert.equal(log[4].receiver, scene.view.painter)
  assert.equal(log[4].args[0], f.layer); assert.equal(log[5].receiver, scene.view)
  assert.equal(log[5].args[0][0], f.selected)
  const report = observer.seal()
  assert.equal(report.frameMatched, true); assert.equal(report.cleanupVerified, true)
  assert.equal(report.calls[0].terrain.object.id, 21)
  assert.deepEqual(report.calls[0].personSource, f.personSource)
  assert.deepEqual(report.calls[0].terrainSource, f.terrainSource)
  assert.equal(report.calls[0].personDepth, .7 * 2 - 1)
  assert.equal(report.frame.pixels, 4); assert.equal(scene.picking.pick, original)
  observer.dispose(); assert.equal(observer.read().errors.length, 0)
})

test('snapshots are detached and only the latest bounded prospective natural image is retained', () => {
  const { scene, bounds, personSource } = fixture(), observer = observeBlastPick(scene, { targetId: 19 })
  scene.renderer.render({}, scene.camera)
  assert.equal(observer.status().hasFrame, false)
  scene.renderer.render(scene.scene, scene.camera)
  scene.renderer.render(scene.scene, scene.camera)
  assert.equal(observer.status().frameCount, 2)
  observer.beginSearch(); scene.picking.pick({ clientX: 210, clientY: 10 })
  const report = observer.seal()
  bounds.x = 900; personSource.bucket = 900; report.calls[0].bounds.x = -1; report.frame.context.camera.x = -1
  assert.equal(observer.read().calls[0].bounds.x, 0)
  assert.equal(observer.read().calls[0].personSource.bucket, 1851)
  assert.equal(observer.read().frame.context.renderFrame, 3)
  assert.equal(observer.read().frame.context.camera.x, 1)
  assert.equal('complete' in report, false)
})

test('camera, rendered pose, actual renderer frame or turn drift reject admission without repicking', () => {
  for (const mutate of [s => { s.cameraPosition.x++ }, s => { s.unitMeshes.get(19).position.x++ },
    s => { s.renderer.info.render.frame++ }, s => { s.world.turn++ }, s => { s.view.projection.width++ }]) {
    const { scene, log } = fixture(), observer = observeBlastPick(scene, { targetId: 19 })
    scene.renderer.render(scene.scene, scene.camera); mutate(scene)
    assert.throws(() => observer.beginSearch(), /no longer matches/)
    assert.equal(log.filter(row => row.name === 'pick').length, 0)
    observer.dispose(); assert.equal(observer.read().cleanupVerified, true)
  }
})

test('frame/call bounds fail diagnostics while original callbacks still run once', () => {
  const { scene, log } = fixture(), observer = observeBlastPick(scene, { targetId: 19, frameLimit: 1 })
  scene.renderer.render(scene.scene, scene.camera); scene.renderer.render(scene.scene, scene.camera)
  assert.equal(log.filter(row => row.name === 'render').length, 2)
  assert.equal(log.filter(row => row.name === 'readPixels').length, 1)
  assert.throws(() => observer.beginSearch(), /cannot rearm/); observer.dispose()
  const f = fixture(), bounded = observeBlastPick(f.scene, { targetId: 19, callLimit: 1 })
  f.scene.renderer.render(f.scene.scene, f.scene.camera); bounded.beginSearch()
  f.scene.picking.pick({ clientX: 210, clientY: 10 }); f.scene.picking.pick({ clientX: 211, clientY: 10 })
  const result = bounded.seal()
  assert.equal(f.log.filter(row => row.name === 'pick').length, 2)
  assert.equal(result.calls.length, 1); assert.match(result.errors.join(), /call limit/)
})

test('original thrown object propagates unchanged; telemetry failure cannot replace it', () => {
  const { scene } = fixture(), failure = new Error('original failure')
  scene.picking.pick = function () { throw failure }
  const observer = observeBlastPick(scene, { targetId: 19 })
  scene.renderer.render(scene.scene, scene.camera); observer.beginSearch()
  assert.throws(() => scene.picking.pick({ clientX: 210, clientY: 10 }), error => error === failure)
  assert.equal(observer.seal().calls[0].thrown, 'original failure')
  observer.dispose()
})

test('inherited descriptors restore exactly, foreign replacement is preserved, and unsupported attachment is atomic', () => {
  const { scene } = fixture(), original = scene.picking.pick, descriptor = Object.getOwnPropertyDescriptor(scene.renderer, 'render')
  delete scene.picking.pick; Object.setPrototypeOf(scene.picking, { pick: original })
  const observer = observeBlastPick(scene, { targetId: 19 }); observer.dispose()
  assert.equal(Object.hasOwn(scene.picking, 'pick'), false)
  assert.deepEqual(Object.getOwnPropertyDescriptor(scene.renderer, 'render'), descriptor)
  const other = observeBlastPick(scene, { targetId: 19 }), foreign = () => null
  scene.picking.pick = foreign; other.dispose()
  assert.equal(scene.picking.pick, foreign); assert.equal(other.read().cleanupVerified, false)
  assert.match(other.read().errors.join(), /replacement preserved/)
  const f = fixture(), before = f.scene.picking.pick
  Object.defineProperty(f.scene.renderer, 'render', { value: f.scene.renderer.render, writable: false, configurable: false })
  assert.throws(() => observeBlastPick(f.scene, { targetId: 19 }), /Unsupported/)
  assert.equal(f.scene.picking.pick, before)
})


test('non-scalar original return identities and render exceptions are never substituted', () => {
  const { scene, personSource } = fixture(), returned = { existing: true }, failure = new Error('render failure')
  scene.picking.pick = function () { return returned }
  const observer = observeBlastPick(scene, { targetId: 19 })
  assert.equal(scene.view.painter.source({}), personSource)
  scene.renderer.render(scene.scene, scene.camera); observer.beginSearch()
  assert.equal(scene.picking.pick({ clientX: 210, clientY: 10 }), returned)
  observer.seal(); observer.dispose()
  scene.renderer.render = function () { throw failure }
  const other = observeBlastPick(scene, { targetId: 19 })
  assert.throws(() => scene.renderer.render(scene.scene, scene.camera), error => error === failure)
  assert.equal(other.status().hasFrame, false); other.dispose()
})


test('a changed wrapper descriptor is foreign ownership even when its function value is unchanged', () => {
  const { scene } = fixture(), observer = observeBlastPick(scene, { targetId: 19 })
  Object.defineProperty(scene.picking, 'pick', { enumerable: false })
  const changed = Object.getOwnPropertyDescriptor(scene.picking, 'pick')
  observer.dispose()
  assert.deepEqual(Object.getOwnPropertyDescriptor(scene.picking, 'pick'), changed)
  assert.equal(observer.read().cleanupVerified, false)
})

test('post-admission context drift does not certify a consumed call against the retained image', () => {
  const mutations = [
    ['camera', s => { s.cameraPosition.x++ }],
    ['pose', s => { s.unitMeshes.get(19).position.x++ }],
    ['renderer frame', s => { s.renderer.info.render.frame++ }],
    ['scene frame', s => { s.frame++ }],
    ['turn', s => { s.world.turn++ }],
    ['projection', s => { s.view.projection.width++ }],
    ['world identity', s => { s.world = { ...s.world } }],
    ['target identity', s => { s.world.units = [{ ...s.world.units[0] }] }],
    ['group identity', s => { s.unitMeshes.set(19, { ...s.unitMeshes.get(19) }) }],
    ['canvas attachment', s => { s.renderer.domElement.isConnected = false }],
  ]
  for (const [name, mutate] of mutations) {
    const { scene, log } = fixture(), observer = observeBlastPick(scene, { targetId: 19 })
    scene.renderer.render(scene.scene, scene.camera); observer.beginSearch()
    mutate(scene)
    const event = { clientX: 210, clientY: 10 }
    assert.equal(scene.picking.pick(event), null, name)
    const report = observer.seal()
    assert.equal(report.frameMatched, false, name)
    assert.equal(report.calls[0].frameMatched, false, name)
    assert.equal(report.calls[0].frameSequence, report.frame.sequence, name)
    assert.equal(report.searchFrameMatched, true, name + ': admission remained unchanged')
    assert.equal(report.cleanupVerified, true, name)
    assert.deepEqual(report.errors, [], name)
    assert.equal(log.filter(row => row.name === 'pick').length, 1, name)
    assert.equal(log.filter(row => row.name === 'render').length, 1, name)
    assert.equal(log.filter(row => row.name === 'readPixels').length, 1, name)
    observer.dispose()
  }
})

test('replacement of the retained natural image invalidates earlier calls without retaining extra images', () => {
  const { scene, log } = fixture(), observer = observeBlastPick(scene, { targetId: 19 })
  scene.renderer.render(scene.scene, scene.camera); observer.beginSearch()
  scene.picking.pick({ clientX: 210, clientY: 10 })
  const first = observer.read()
  assert.equal(first.frameMatched, true)
  // A separately rendered image is not interchangeable, even if renderer frame
  // numbering is externally reset and every captured context value is identical.
  scene.renderer.info.render.frame--
  scene.renderer.render(scene.scene, scene.camera)
  scene.picking.pick({ clientX: 211, clientY: 10 })
  const report = observer.seal()
  assert.equal(report.frameMatched, false)
  assert.equal(report.searchFrameMatched, true)
  assert.deepEqual(report.calls.map(row => row.frameMatched), [false, true])
  assert.deepEqual(report.calls.map(row => row.frameSequence), [1, 2])
  assert.equal(report.frame.sequence, 2)
  assert.deepEqual(report.calls[0].context, report.frame.context)
  assert.equal(first.frame.sequence, 1)
  assert.equal(first.calls[0].frameMatched, true)
  assert.equal(report.calls.some(row => 'frame' in row || 'png' in row), false)
  assert.equal(report.cleanupVerified, true)
  assert.deepEqual(report.errors, [])
  assert.equal(log.filter(row => row.name === 'pick').length, 2)
  assert.equal(log.filter(row => row.name === 'render').length, 2)
  assert.equal(log.filter(row => row.name === 'readPixels').length, 2)
  observer.dispose()
})

test('per-call frame bindings are detached, bounded metadata and do not certify an empty call set', () => {
  const { scene, log } = fixture(), observer = observeBlastPick(scene, { targetId: 19 })
  scene.renderer.render(scene.scene, scene.camera); observer.beginSearch()
  assert.equal(observer.read().frameMatched, false)
  for (const x of [210, 211]) scene.picking.pick({ clientX: x, clientY: 10 })
  const report = observer.seal()
  assert.equal(report.version, 2)
  assert.equal(report.frameMatched, true)
  assert.equal(report.searchFrameMatched, true)
  assert.deepEqual(report.calls.map(row => [row.frameSequence, row.frameMatched]), [[1, true], [1, true]])
  assert.equal(report.calls[0].context.sceneFrame, 9)
  report.frame.sequence = 99; report.calls[0].frameSequence = 99; report.calls[0].frameMatched = false
  assert.equal(observer.read().frame.sequence, 1)
  assert.deepEqual(observer.read().calls.map(row => [row.frameSequence, row.frameMatched]), [[1, true], [1, true]])
  assert.equal(log.filter(row => row.name === 'pick').length, 2)
  assert.equal(log.filter(row => row.name === 'render').length, 1)
  assert.equal(log.filter(row => row.name === 'readPixels').length, 1)
  observer.dispose()
})
