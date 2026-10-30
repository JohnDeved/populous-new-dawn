import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { installMaterialObserver } from './observer.mjs'
import { identity, validateLifecycle } from './contract.mjs'

// Scenario only: use the shipped local-render harness. This module does not
// launch a browser/server, build, install, dispatch CI or modify production files.
// All three plans and their phase boundaries are explicitly controlled fixtures.
// Public campaign startup, actual GameScene RAF rendering, RenderView preparation
// and real disposal implementations run unchanged. This is not construction-play
// acceptance, natural follower simulation, a heap test or a performance benchmark.
export default async function materialRetirement({ page, openMission, output, root, receipt, signal }) {
  const owner = randomUUID(), expected = JSON.parse(readFileSync(new URL('./source-inputs.json', import.meta.url)))
  const sourceInputs = () => Object.fromEntries(Object.keys(expected).map(path => [path,
    createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex')]))
  assert.deepEqual(sourceInputs(), expected, 'Source/runtime inputs differ from reviewed candidate')
  const report = { identity, fixture: 'M1 controlled addBuilding and phase boundaries; real RAF/render/dispose',
    source: receipt.source, sourceInputs: expected, phases: {}, pixels: [], screenshots: [], errors: [] }
  const save = () => writeFileSync(resolve(output, 'material-lifecycle.json'), JSON.stringify(report, null, 2) + '\n')
  const check = () => { signal?.throwIfAborted() }
  const call = (method, args = []) => {
    // Abort stops work, never the attempt to release our observation listeners.
    if (method !== 'close') check()
    return page.evaluate(({ owner, method, args }) => {
      const observer = globalThis.materialRetirementObserver
      if (observer?.owner !== owner) throw Error('Material observer ownership changed')
      return observer[method](...args)
    }, { owner, method, args })
  }
  const frames = async () => {
    check()
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    check()
  }
  const capture = async (kind, buildingId, name) => {
    report.pixels.push(await call('pixels', [kind, buildingId]))
    await page.screenshot({ path: resolve(output, name), timeout: 5000 })
    report.screenshots.push(name)
    save()
  }
  const add = async (label, point) => {
    check()
    const buildingId = await page.evaluate(async point => {
      const { addBuilding } = await import('/app/model.ts')
      const scene = globalThis.testSceneRef.current
      if (scene.disposed || scene.world.speed !== 0) throw Error('Stable active fixture required')
      return addBuilding(scene.world, 'blue', 'hut', point, false, { plan: true }).id
    }, point)
    await frames()
    await page.waitForFunction(buildingId => {
      const scene = globalThis.testSceneRef.current, plan = scene.plans.get(buildingId)
      return plan && plan.material !== scene.cursor.material && !!plan.material.userData.nativeUniforms
    }, buildingId, { timeout: 10000 })
    return { buildingId, snapshot: await call('recordPlan', [label, buildingId]) }
  }
  let installed = false, failed = null
  save()
  try {
    await openMission(1)
    await page.evaluate(() => {
      const scene = globalThis.testSceneRef.current
      scene.world.speed = 0
      scene.world.mode = null
      scene.focus({ x: -2, z: 32 })
      scene.onChange()
    })
    await page.waitForFunction(() => !globalThis.testSceneRef.current.cameraMotion.active, null, { timeout: 10000 })
    await page.waitForFunction(() => {
      const image = globalThis.testSceneRef.current.cursor.material.map?.image
      return !!image && (typeof image.complete !== 'boolean' || (image.complete && image.naturalWidth > 0))
    }, null, { timeout: 10000 })
    await frames()
    report.browserVersion = receipt.browserVersion
    report.rendering = await page.evaluate(() => {
      const gl = globalThis.testSceneRef.current.renderer.getContext()
      const debug = gl.getExtension('WEBGL_debug_renderer_info')
      return { webglVersion: gl.getParameter(gl.VERSION),
        renderer: gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
        vendor: gl.getParameter(debug ? debug.UNMASKED_VENDOR_WEBGL : gl.VENDOR),
        width: gl.drawingBufferWidth, height: gl.drawingBufferHeight,
        contextLost: gl.isContextLost() }
    })
    assert.ok(typeof report.browserVersion === 'string' && report.browserVersion.length > 0)
    assert.ok(report.rendering.webglVersion.startsWith('WebGL 2.0'))
    assert.ok(typeof report.rendering.renderer === 'string' && report.rendering.renderer.length > 0)
    assert.equal(report.rendering.contextLost, false)
    report.shared = await page.evaluate(installMaterialObserver, { owner })
    installed = true
    const removal = await add('removal', { x: -1.7, z: 32.3 })
    report.phases.preparedRemoval = removal.snapshot
    await capture('plan', removal.buildingId, 'prepared-removal.png')
    await page.evaluate(buildingId => {
      const world = globalThis.testSceneRef.current.world
      world.buildings = world.buildings.filter(building => building.id !== buildingId)
    }, removal.buildingId)
    await frames()
    report.phases.removed = await call('snapshot', ['removal'])
    await frames()
    report.phases.removedAgain = await call('snapshot', ['removal'])
    save()
    const transition = await add('transition', { x: -1.7, z: 32.3 })
    report.phases.preparedTransition = transition.snapshot
    await capture('plan', transition.buildingId, 'prepared-transition.png')
    await page.evaluate(buildingId => {
      const building = globalThis.testSceneRef.current.world.buildings.find(item => item.id === buildingId)
      if (!building?.preparation) throw Error('Controlled preparation missing')
      delete building.preparation
      building.progress = 1
      building.logs = 3
    }, transition.buildingId)
    await frames()
    report.replacement = await call('replacement', [transition.buildingId])
    report.phases.transitioned = await call('snapshot', ['transition'])
    await capture('building', transition.buildingId, 'replacement.png')
    await frames()
    report.replacementAgain = await call('replacement', [transition.buildingId])
    report.phases.replacementStable = await call('snapshot', ['transition'])
    // This third plan stays owned by the scene until teardown. It is not used
    // to claim placement validity or separate rendered pixels at this point.
    const survivor = await add('survivor', { x: 30.3, z: 32.3 })
    report.phases.preparedSurvivor = survivor.snapshot
    await page.evaluate(() => globalThis.testSceneRef.current.dispose())
    report.phases.disposed = await call('snapshot', ['survivor'])
    await page.evaluate(() => globalThis.testSceneRef.current.dispose())
    report.phases.disposedAgain = await call('snapshot', ['survivor'])
  } catch (error) {
    failed = error
    report.failure = String(error?.stack ?? error)
  } finally {
    if (installed) {
      try { report.cleanup = await call('close') }
      catch (error) { report.errors.push(`Observer cleanup: ${String(error)}`); failed ??= error }
    }
    try { assert.deepEqual(sourceInputs(), expected, 'Source inputs changed during scenario') }
    catch (error) { report.errors.push(String(error)); failed ??= error }
    report.errors.push(...receipt.errors)
    save()
  }
  if (failed) throw failed
  report.validation = validateLifecycle(report)
  save()
  return { ...report.validation, identity, evidence: 'material-lifecycle.json', screenshots: report.screenshots }
}
