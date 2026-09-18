// Authored Mission10 static Totem acceptance. No injected actors, work or rewards.
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'
import { bindGame, openGame } from './browser-game.mjs'

assert.ok(
  process.env.PND_QUEUE_JOB_ID && process.env.PND_QUEUE_OUTPUT,
  'Use the shared supervised queue'
)
const output = join(process.env.PND_QUEUE_OUTPUT, 'static149')
mkdirSync(output, { recursive: false })
const report = {
  jobId: process.env.PND_QUEUE_JOB_ID,
  mission: 10,
  status: 'RUNNING',
  stages: [],
  progress: [],
  errors: [],
  limits: [
    'Static base149 only; no native cadence or performance claim.',
    'Real mission/selection/pointer/checkpoint UI; ordinary tick acceleration with test-owned RAF.',
    'No actor, work, reward, source heading, terrain, controller or clock implementation edits.',
  ],
}
const save = () =>
  writeFileSync(join(output, 'evidence.json'), JSON.stringify(report, null, 2) + '\n')
let browser, page
const deadline = setTimeout(
  () => void browser?.close(),
  Math.max(1, Date.parse(process.env.PND_QUEUE_DEADLINE) - Date.now() - 20000)
)
process.once('SIGTERM', () => void browser?.close())

async function hold() {
  await page.evaluate(() => {
    if (!window.__static149Raf) {
      const nativeRaf = window.requestAnimationFrame.bind(window)
      window.__static149Raf = { held: true }
      window.requestAnimationFrame = callback =>
        window.__static149Raf.held ? 0 : nativeRaf(callback)
    }
    const scene = window.testScene
    cancelAnimationFrame(scene.frame)
    scene.frame = 0
    scene.previous = null
  })
}
async function render() {
  await page.evaluate(() => {
    const scene = window.testScene,
      now = performance.now()
    scene.previous = now
    scene.animate(now) // zero elapsed time: render without advancing either game clock
    cancelAnimationFrame(scene.frame)
    scene.frame = 0
    scene.previous = null
  })
}
async function inspect(name, heading) {
  await page.evaluate(name => {
    const scene = window.testScene,
      head = scene.world.shrines.find(head => head.name === name)
    if (!head) throw new Error('Missing authored head: ' + name)
    scene.focus(head)
  }, name)
  await render()
  const evidence = await page.evaluate(async name => {
    const scene = window.testScene,
      head = scene.world.shrines.find(head => head.name === name),
      root = scene.shrineMeshes.get(head.id).g,
      mesh = root.children[0],
      { nativeModels } = await import('/app/scene-assets.ts'),
      { modelStage, modelDepthBias, modelTextureModes } = await import('/app/model-faces.ts'),
      stage = modelStage(nativeModels[149], 4),
      attr = key => Array.from(mesh.geometry.getAttribute(key).array),
      exact = (actual, expected) =>
        JSON.stringify(actual) === JSON.stringify(Array.from(new Float32Array(expected))),
      renderer = scene.renderer,
      gl = renderer.getContext(),
      ext = gl.getExtension('WEBGL_debug_renderer_info'),
      length = gl.drawingBufferWidth * gl.drawingBufferHeight * 4,
      before = new Uint8Array(length),
      after = new Uint8Array(length)
    renderer.render(scene.scene, scene.camera)
    gl.readPixels(
      0,
      0,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      before
    )
    const visible = root.visible
    root.visible = false
    renderer.render(scene.scene, scene.camera)
    gl.readPixels(
      0,
      0,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      after
    )
    root.visible = visible
    renderer.render(scene.scene, scene.camera)
    let pixels = 0
    for (let i = 0; i < length; i += 4)
      if (
        before[i] !== after[i] ||
        before[i + 1] !== after[i + 1] ||
        before[i + 2] !== after[i + 2]
      )
        pixels++
    const rect = scene.container.getBoundingClientRect()
    let pick = null
    for (const polygon of scene.picking.model(mesh, 'static149-' + head.id)) {
      if (polygon.kind !== 'model') continue
      const clientX = rect.left + polygon.points.reduce((sum, point) => sum + point.x, 0) / 3,
        clientY = rect.top + polygon.points.reduce((sum, point) => sum + point.y, 0) / 3
      if (document.elementFromPoint(clientX, clientY) !== renderer.domElement) continue
      if (scene.picking.pick({ clientX, clientY }) === head.id) {
        pick = { x: clientX, y: clientY }
        break
      }
    }
    return {
      name,
      id: head.id,
      controllerModel: head.model,
      nativeModel: mesh.userData.nativeModel,
      heading: root.userData.nativeHeading,
      rotationY: root.rotation.y,
      visible,
      pixels,
      pick,
      scale: mesh.userData.nativeScale,
      vertices: mesh.geometry.getAttribute('position').count,
      geometry: mesh.geometry.uuid,
      positionVersion: mesh.geometry.getAttribute('position').version,
      exactPositions: exact(attr('position'), stage.p),
      exactUV: exact(attr('uv'), stage.uv),
      exactBias: exact(attr('painterBias'), modelDepthBias(nativeModels[149], 4)),
      exactModes: exact(attr('textureMode'), modelTextureModes(nativeModels[149], 4)),
      atlas: {
        width: mesh.material.map.image.width,
        height: mesh.material.map.image.height,
        src: mesh.material.map.image.src,
      },
      state: structuredClone(head),
      turn: scene.world.turn,
      renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
    }
  }, name)
  assert.equal(evidence.nativeModel, 149)
  assert.equal(evidence.controllerModel, 45)
  assert.equal(evidence.heading, heading)
  assert.ok(Math.abs(evidence.rotationY + (heading * Math.PI) / 1024) < 1e-9)
  assert.equal(evidence.scale, 160)
  assert.equal(evidence.vertices, 258)
  for (const key of ['exactPositions', 'exactUV', 'exactBias', 'exactModes', 'visible'])
    assert.equal(evidence[key], true, key)
  assert.deepEqual([evidence.atlas.width, evidence.atlas.height], [256, 1024])
  assert.ok(evidence.atlas.src.endsWith('/original/atlas.png'))
  assert.ok(evidence.pixels > 20, 'Static149 must produce real GPU pixels')
  assert.ok(evidence.pick, 'Authored model149 must expose a real canvas hit')
  await page.mouse.move(evidence.pick.x, evidence.pick.y)
  await render()
  assert.equal(await page.evaluate(() => window.testScene.hoveredObject), evidence.id)
  await page.screenshot({
    path: join(output, name === 'Totem Pole' ? 'root149.png' : 'linked149.png'),
  })
  report.stages.push(evidence)
  save()
  return evidence
}

async function checkpoint(before, heading) {
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
  await page.waitForFunction(() => window.testStore.hasCheckpoint())
  await page.getByRole('button', { name: 'Load checkpoint', exact: true }).click()
  await bindGame(page)
  await hold()
  const resume = page.getByRole('button', { name: 'Continue Game', exact: false })
  if (await resume.isVisible()) await resume.click()
  await render()
  const restored = await inspect(before.name, heading)
  assert.deepEqual(restored.state, before.state)
  assert.equal(restored.turn, before.turn)
  report.checkpointPreserved = true
}

try {
  browser = await chromium.launch({ headless: true })
  const opened = await openGame(browser, 10)
  page = opened.page
  report.errors = opened.errors
  page.setDefaultTimeout(45000)
  await hold()
  const root = await inspect('Totem Pole', 0)
  for (let frame = 0; frame < 4; frame++) await render()
  const stable = await page.evaluate(id => {
    const scene = window.testScene,
      head = scene.world.shrines.find(head => head.id === id),
      mesh = scene.shrineMeshes.get(id).g.children[0]
    return {
      state: structuredClone(head),
      turn: scene.world.turn,
      geometry: mesh.geometry.uuid,
      positionVersion: mesh.geometry.getAttribute('position').version,
    }
  }, root.id)
  assert.deepEqual(stable, {
    state: root.state,
    turn: root.turn,
    geometry: root.geometry,
    positionVersion: root.positionVersion,
  })
  report.staticGeometryAndStateStable = true

  if (process.argv.includes('--static-only')) {
    await checkpoint(root, 0)
    assert.deepEqual(report.errors, [])
    report.limits.push(
      'Base/checkpoint acceptance only; linked reveal and ordinary worship route are not passed by this mode.'
    )
    report.status = 'PASS_STATIC_149_AUTHORED_BASE_CHECKPOINT'
  } else {
    await page
      .getByRole('button', { name: 'Select brave', exact: true })
      .click({ modifiers: ['Control'] })
    const selected = await page.evaluate(() => [...window.testScene.world.selected])
    assert.ok(selected.length >= 2, 'Two authored followers must be selected through the HUD')
    // HUD selection may recenter the camera; rebuild the real pick after it.
    const target = await inspect('Totem Pole', 0)
    await page.mouse.click(target.pick.x, target.pick.y)
    const orders = await page.evaluate(
      ids =>
        ids.map(id => {
          const unit = window.testScene.world.units.find(unit => unit.id === id)
          return { id, work: unit.work, command: unit.native?.commandStatus, x: unit.x, z: unit.z }
        }),
      selected
    )
    report.orders = orders
    save()
    // Normal dispatch sets work immediately; native command27 is a later movement transition.
    assert.ok(orders.filter(order => order.work === root.id).length >= 2, JSON.stringify(orders))
    let completed = false
    for (let batch = 0; batch < 64 && !completed; batch++) {
      const progress = await page.evaluate(async id => {
        const scene = window.testScene,
          world = scene.world,
          { tick } = await import('/app/model.ts'),
          head = world.shrines.find(head => head.id === id)
        for (let visit = 0; visit < 64 && !head.uses && world.status === 'playing'; visit++)
          tick(world, 1 / 12)
        scene.onChange()
        return {
          turn: world.turn,
          work: head.work,
          followers: head.followers,
          uses: head.uses,
          remaining: head.remaining,
          forced: head.forced,
          active: head.active,
          status: world.status,
          linked: world.shrines.some(head => head.name === 'Erosion Totem Pole'),
          units: world.units
            .filter(unit => world.selected.includes(unit.id))
            .map(unit => ({
              id: unit.id,
              x: unit.x,
              z: unit.z,
              hp: unit.hp,
              state: unit.native?.state,
              command: unit.native?.commandStatus,
            })),
        }
      }, root.id)
      report.progress.push(progress)
      save()
      assert.equal(progress.forced, false)
      assert.equal(progress.status, 'playing')
      completed = progress.uses === 1 && progress.linked
    }
    assert.ok(
      completed,
      'Authored normal follower route/prayer must reveal the linked Totem within 4096 turns'
    )
    await render()
    const skip = page.locator('.skip-introduction')
    if (await skip.isVisible()) await skip.click()
    await render()
    const linked = await inspect('Erosion Totem Pole', 1024)
    assert.equal(linked.state.work, 0)
    assert.equal(linked.state.uses, 0)
    report.normalWorshipRevealedLinked149 = true

    await checkpoint(linked, 1024)
    assert.deepEqual(report.errors, [])
    report.status = 'PASS_STATIC_149_AUTHORED_MISSION10'
  }
} catch (error) {
  report.status = 'FAILED_STATIC_149_AUTHORED_MISSION10'
  report.error = error.stack ?? String(error)
  if (page && !page.isClosed())
    await page.screenshot({ path: join(output, 'failure.png') }).catch(() => {})
  process.exitCode = 1
} finally {
  clearTimeout(deadline)
  await browser?.close()
  report.browserClosed = true
  save()
  console.log(
    JSON.stringify(
      {
        status: report.status,
        error: report.error,
        stages: report.stages.length,
        progress: report.progress.at(-1),
        output,
      },
      null,
      2
    )
  )
}
