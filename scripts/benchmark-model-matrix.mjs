import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import os from 'node:os'

const [root, baseline, mode, cohort, arm] = process.argv.slice(2)
const source = pathToFileURL(root + '/app/projection.ts').href
const hash = value => createHash('sha256').update(value).digest('hex')
const protocol = {
  warmup: 16, samples: 64, pairs: 2,
  cohorts: ['opening', 'crowd256', 'effects128', 'moving-pose', 'custom-setter'],
  order: [['base', 'head'], ['head', 'base']],
  scope: 'Node CPU unit-update + renderSceneFrame; real Painter and draw hooks, CPU-only renderer boundary. No WebGL/GPU/browser/FPS claim.',
}
if (mode !== 'child') {
  const results = []
  for (const cohort of protocol.cohorts)
    for (let pair = 0; pair < protocol.pairs; pair++) {
      const rows = []
      for (const arm of protocol.order[pair]) {
        const child = spawnSync(process.execPath, [import.meta.filename, root, baseline, 'child', cohort, arm], { encoding: 'utf8', maxBuffer: 20e6 })
        if (child.stderr) process.stderr.write(child.stderr)
        assert.equal(child.status, 0, child.stdout + child.stderr)
        const row = JSON.parse(child.stdout.trim())
        rows.push(row)
        process.stdout.write(JSON.stringify({ event: 'arm', pair, ...row }) + '\n')
      }
      assert.equal(rows[0].digest, rows[1].digest, `${cohort}: terminal World/Painter/uniform parity`)
      assert.deepEqual(rows[0].work, rows[1].work)
      results.push({ pair, cohort, rows })
    }
  console.log(JSON.stringify({ event: 'complete', protocol, runtime: process.version, platform: process.platform, arch: process.arch,
    cpu: os.cpus()[0]?.model, parentSha256: hash(readFileSync(baseline)), headSha256: hash(readFileSync(new URL(source))),
    scriptSha256: hash(readFileSync(import.meta.filename)), results }))
} else {
  const THREE = await import(pathToFileURL(root + '/node_modules/three/build/three.module.js'))
  const baseURL = pathToFileURL(baseline).href
  let projectionResolutions = 0
  const redirect = registerHooks({ resolve(specifier, context, next) {
    const resolved = next(specifier, context.parentURL === baseURL ? { ...context, parentURL: source } : context)
    if (resolved.url !== source) return resolved
    projectionResolutions++
    return arm === 'base' ? { ...resolved, url: baseURL } : resolved
  } })
  const { RenderView } = await import(pathToFileURL(root + '/app/render-view.ts'))
  const { loadSceneFixture } = await import(pathToFileURL(root + '/tests/support/bloodlust-scene.mjs'))
  const { makeSelectionScene } = await import(pathToFileURL(root + '/tests/support/selection-scene.mjs'))
  const api = await loadSceneFixture()
  const { addUnit } = await import(pathToFileURL(root + '/app/world-state.ts'))
  const world = api.createWorld(2)
  if (cohort !== 'opening' && cohort !== 'effects128') {
    world.units = []
    for (let i = 0; i < 256; i++)
      addUnit(world, 'blue', 'brave', { x: -12 + i % 16, z: -12 + Math.floor(i / 16) })
    world.selected = []
  }
  const f = await makeSelectionScene(world)
  const scene = new THREE.Scene(), view = new RenderView(), camera = new THREE.Camera()
  Object.assign(f.scene, { scene, view, camera, worshipPresentation: { rememberBodies() {} } })
  scene.add(f.scene.objects)
  view.update(800, 600, { x: 0, z: 0 }, 0, 0, false)
  if (cohort === 'effects128') {
    for (let i = 0; i < 128; i++) {
      const group = f.scene.makeFx({ id: 50000 + i, kind: 'trail', x: i % 16, z: Math.floor(i / 16),
        height: 0, age: 0, duration: 1, swarm: {} })
      f.scene.objects.add(group)
    }
  }
  let drawMs = 0, calls = 0
  const renderer = {
    setTransparentSort() {},
    render(scene, camera) {
      scene.updateMatrixWorld(true)
      scene.onBeforeRender(this, scene, camera)
      const start = performance.now()
      scene.traverseVisible(object => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.Sprite || object instanceof THREE.Line)) return
        const dispatch = material => {
          if (!material?.visible) return
          object.onBeforeRender(this, scene, camera, object.geometry, material, null)
          calls++
        }
        if (Array.isArray(object.material)) {
          for (const group of object.geometry.groups) if (group.count) dispatch(object.material[group.materialIndex])
        } else dispatch(object.material)
      })
      drawMs = performance.now() - start
      scene.onAfterRender(this, scene, camera)
    },
  }
  f.scene.renderer = renderer
  const samples = [], work = [], custom = new WeakSet()
  try {
    if (cohort === 'custom-setter') {
      f.render()
      view.prepare(scene)
      scene.traverse(object => {
        const target = object.material?.userData.nativeUniforms?.nativeObjectBasis.value
        if (!target || custom.has(target)) return
        custom.add(target)
        target.set = function (source) { Int32Array.prototype.set.call(this, source) }
      })
    }
    for (let frame = 0; frame < protocol.warmup + protocol.samples; frame++) {
      calls = 0
      const start = performance.now()
      f.scene.gameClock.animationFrame = frame
      f.render()
      if (cohort === 'moving-pose') {
        let index = 0
        for (const group of f.scene.unitMeshes.values())
          Object.assign(group.userData, { nativeHeading: (frame * 37 + index++ * 53) & 2047, nativeTilt: 64, nativeRoll: 32 })
      }
      api.renderSceneFrame(f.scene, null, undefined)
      const cycleMs = performance.now() - start
      samples.push({ cycleMs, drawMs })
      work.push({ calls, commands: view.painter.commandsBySlot.length })
    }
    const objects = []
    scene.traverse(object => objects.push(object))
    const ids = new Map(objects.map((object, index) => [object.id, index]))
    const state = objects.map(object => ({
      type: object.type, visible: object.visible, position: object.position.toArray(), scale: object.scale.toArray(),
      basis: object.material?.userData.nativeUniforms?.nativeObjectBasis.value ? [...object.material.userData.nativeUniforms.nativeObjectBasis.value] : null,
      range: view.painter.ranges.get(object), groups: object.geometry?.groups,
      pose: [object.userData.nativeHeading, object.userData.nativeTilt, object.userData.nativeRoll],
    }))
    const commands = view.painter.commandsBySlot.map(command => command ? { ...command, object: ids.get(command.object) ?? command.object } : null)
    const digest = hash(JSON.stringify({ world, state, commands, depths: [...view.painter.texture.image.data] }))
    assert.ok(projectionResolutions > 0, 'the selected projection module was resolved')
    console.log(JSON.stringify({ cohort, arm, projectionResolutions, units: world.units.length, objects: objects.length, samples, work, digest }))
  } finally {
    f.close()
    view.dispose()
    redirect.deregister()
  }
}
