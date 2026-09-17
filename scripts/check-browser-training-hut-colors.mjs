// Original Mission17 training-hut appearance, original geometry, lifecycle and
// input/checkpoint regression. The five completed defect actors are not injected.
// Construction/damage poses are explicitly controlled inputs to shipped rendering.
import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve, join } from 'node:path'
import { chromium } from '@playwright/test'
import { bindGame } from './browser-game.mjs'
import models from '../app/original-models.json' with { type: 'json' }
import { modelStage, modelTextureModes, modelDepthBias } from '../app/model-faces.ts'
import { modelMatrix, modelPoint, projectPoint } from '../app/projection.ts'
import { modelShade } from '../app/model-lighting.ts'
import { polygonBucket } from '../app/painter-order.ts'

assert.ok(process.env.PND_QUEUE_JOB_ID && process.env.PND_QUEUE_DEADLINE, 'Use the canonical shared queue')
const index = process.argv.indexOf('--output-dir')
assert.ok(index >= 0 && process.argv[index + 1])
const out = resolve(process.argv[index + 1]), url = process.env.POPULOUS_URL
assert.ok(url)
mkdirSync(out, { recursive: false })
const report = { jobId: process.env.PND_QUEUE_JOB_ID, startedAt: new Date().toISOString(), actors: [], stages: [], frames: [], errors: [], limits: ['Original complete Mission17 actors are used directly; construction/damage states and camera directions are labelled renderer fixtures.', 'This checks original asset selection and shipped rendering/input/checkpoint, not final native-driver pixels or performance target certification.'] }
const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
const timer = setTimeout(() => void browser.close(), Math.max(1, Math.min(240000, Date.parse(process.env.PND_QUEUE_DEADLINE) - Date.now() - 25000)))
process.on('SIGTERM', () => void browser.close())
const save = () => writeFileSync(join(out, 'evidence.json'), JSON.stringify(report, null, 2) + '\n')
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  page.setDefaultTimeout(25000)
  page.on('pageerror', error => report.errors.push(error.stack ?? error.message))
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.getByRole('button', { name: 'Mission 17', exact: true }).click()
  await bindGame(page)
  await page.keyboard.press('Escape')
  await page.evaluate(() => {
    const s = window.testScene
    s.world.paused = true; s.world.speed = 0; cancelAnimationFrame(s.frame)
    window.drawTrainingActor = (b, bearing = 0) => {
      s.focus(b); s.startGroundView(2, bearing)
      for (let i = 0; i < 40; i++) s.updateCameraMotion(1 / 24)
      s.animate(s.previous); cancelAnimationFrame(s.frame)
    }
  })
  report.environment = await page.evaluate(() => {
    const s = window.testScene, gl = s.renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info')
    return { renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), viewport: [innerWidth, innerHeight], framebuffer: [gl.drawingBufferWidth, gl.drawingBufferHeight], dpr: devicePixelRatio, visible: !document.hidden, focused: document.hasFocus(), browser: navigator.userAgent }
  })
  const response = await page.request.get(new URL('/original/atlas.png', url).href)
  report.atlasSHA = createHash('sha256').update(await response.body()).digest('hex')
  assert.equal(report.atlasSHA, createHash('sha256').update(readFileSync(new URL('../public/original/atlas.png', import.meta.url))).digest('hex'))
  const originals = await page.evaluate(async () => {
    const { buildingObject, buildingModel } = await import('/app/building-shapes.ts')
    return window.testScene.world.buildings.filter(b => buildingModel(b) >= 5 && buildingModel(b) <= 8)
      .map(b => ({ id: b.id, kind: b.kind, team: b.team, object: buildingObject(b), type: buildingModel(b), progress: b.progress, x: b.x, z: b.z }))
  })
  for (const model of [98, 100, 101, 102, 105]) assert.ok(originals.some(b => b.object === model), `Authored Mission17 model ${model}`)
  for (const actor of originals) {
    const capture = await page.evaluate(id => {
      const s = window.testScene, b = s.world.buildings.find(b => b.id === id)
      window.drawTrainingActor(b)
      const root = s.buildingMeshes.get(id), mesh = root.children.find(m => m.userData.nativeModel !== undefined)
      const attr = name => Array.from(mesh.geometry.getAttribute(name).array)
      return { id, model: mesh.userData.nativeModel, stage: mesh.userData.stage, materialColor: mesh.material.color.getHex(), points: attr('position'), uv: attr('uv'), modes: attr('textureMode'), bias: attr('painterBias'), geometryUUID: mesh.geometry.uuid, materialUUID: mesh.material.uuid, visible: root.visible, render: { ...s.renderer.info.render } }
    }, actor.id)
    assert.equal(capture.model, actor.object, `Original ${actor.team} ${actor.kind} must not fall back to Blue`)
    assert.equal(capture.stage, 4)
    assert.equal(capture.materialColor, 0xffffff, 'Use original texture pixels, not a generic material tint')
    const expected = modelStage(models[actor.object], 4)
    assert.deepEqual(capture.points, [...new Float32Array(expected.p)])
    assert.deepEqual(capture.uv, [...new Float32Array(expected.uv)])
    assert.deepEqual(capture.modes, modelTextureModes(models[actor.object], 4))
    assert.deepEqual(capture.bias, modelDepthBias(models[actor.object], 4))
    const file = `mission17-${actor.kind}-${actor.team}-${actor.object}.png`
    await page.screenshot({ path: join(out, file) })
    report.actors.push({ ...actor, actualModel: capture.model, triangles: capture.points.length / 9, geometryUUID: capture.geometryUUID, materialUUID: capture.materialUUID, screenshot: file, render: capture.render })
  }
  save()
  for (const actor of originals.filter(b => [98, 100, 101, 102, 105].includes(b.object))) {
    // Native comparison captures four real camera bearings for each affected actor.
    for (let direction = 0; direction < 4; direction++) {
      const frame = await page.evaluate(({ id, direction }) => {
        const s = window.testScene, b = s.world.buildings.find(b => b.id === id)
        window.drawTrainingActor(b, direction * Math.PI / 2)
        const mesh = s.buildingMeshes.get(id).children.find(m => m.userData.nativeModel !== undefined), d = mesh.userData
        const origin = mesh.getWorldPosition(mesh.position.clone()), attr = name => Array.from(mesh.geometry.getAttribute(name).array)
        return { actor: { id, kind: b.kind, team: b.team }, preset: s.viewPreset, bearing: s.cameraBearing, center: s.view.center, projection: s.view.projection,
          models: [{ id: d.nativeModel, scale: d.nativeScale, size: d.nativeSize ?? d.nativeScale, heading: mesh.parent.userData.nativeHeading ?? 0, tilt: mesh.parent.userData.nativeTilt ?? 0, roll: mesh.parent.userData.nativeRoll ?? 0,
            picking: s.picking.model(mesh, `training-${id}-${direction}`).map(c => c.kind === 'bounds' ? { kind: c.kind, bounds: c.bounds, bucket: c.bucket } : { kind: c.kind, points: c.points, bucket: c.bucket }),
            position: [Math.round((origin.x + 8) * 256) & 65535, Math.round((-origin.z - 8) * 256) & 65535, Math.round(origin.y * 128)], relative: s.view.relative(origin, (origin.y * 128) / 45),
            vertices: attr('position'), shades: attr('faceShade'), biases: attr('painterBias'), submitted: Array.from({ length: mesh.geometry.getAttribute('position').count / 3 }, (_, i) => s.view.painter.depth(mesh, i, 0) <= 1) }] }
      }, { id: actor.id, direction })
      const model = frame.models[0], rotation = modelMatrix(model.heading, model.tilt, model.roll), points = []
      for (let i = 0; i < model.vertices.length; i += 3) {
        const raw = model.vertices.slice(i, i + 3).map((n, axis) => Math.round(n * model.scale * 3 * (axis === 2 ? -1 : 1)))
        points.push(projectPoint(modelPoint(raw, model.size, rotation, model.relative), frame.projection))
      }
      model.triangles = []
      for (let i = 0; i < points.length; i += 3) if (model.submitted[i / 3]) {
        const p = points.slice(i, i + 3)
        model.triangles.push({ screen: p.flatMap(v => [v.screenX, v.screenY]), shade: modelShade(model.shades[i], p[0].z), bucket: polygonBucket(p.map(v => v.z), model.biases[i]) })
      }
      assert.ok(model.triangles.length > 0)
      for (const key of ['vertices', 'shades', 'biases', 'submitted']) delete model[key]
      report.frames.push(frame)
    }
    // Exercise each existing stage with original caps, without changing the
    // admission/simulation implementation or claiming a new construction rule.
    for (let stage = 0; stage <= 4; stage++) {
      const capture = await page.evaluate(({ id, stage }) => {
        const s = window.testScene, b = s.world.buildings.find(b => b.id === id)
        const oldDamage = b.damageState
        b.damageState = { ...(oldDamage ?? {}), stage, tilt: stage === 2 ? 48 : 0, roll: 0 }
        window.drawTrainingActor(b)
        const mesh = s.buildingMeshes.get(id).children[0], attr = name => Array.from(mesh.geometry.getAttribute(name).array)
        const result = { model: mesh.userData.nativeModel, stage: mesh.userData.stage, points: attr('position'), uv: attr('uv'), modes: attr('textureMode'), bias: attr('painterBias') }
        b.damageState = oldDamage; window.drawTrainingActor(b)
        return result
      }, { id: actor.id, stage })
      const expected = modelStage(models[actor.object], stage)
      assert.equal(capture.model, actor.object)
      assert.equal(capture.stage, stage)
      assert.deepEqual(capture.points, [...new Float32Array(expected.p)])
      assert.deepEqual(capture.uv, [...new Float32Array(expected.uv)])
      assert.deepEqual(capture.modes, modelTextureModes(models[actor.object], stage))
      assert.deepEqual(capture.bias, modelDepthBias(models[actor.object], stage))
      report.stages.push({ id: actor.id, originalModel: actor.object, stage, triangles: capture.points.length / 9, fixture: 'Existing renderer stage/damage input; no training or construction mechanics replaced' })
    }
    const hit = await page.evaluate(id => {
      const s = window.testScene, b = s.world.buildings.find(b => b.id === id)
      window.drawTrainingActor(b)
      const mesh = s.buildingMeshes.get(id).children[0], rect = s.renderer.domElement.getBoundingClientRect()
      for (const c of s.picking.model(mesh, 'training-actual-hover-' + id)) {
        if (c.kind !== 'model') continue
        const x = c.points.reduce((n, p) => n + p.x, 0) / 3, y = c.points.reduce((n, p) => n + p.y, 0) / 3
        if (x < 2 || y < 2 || x > rect.width - 2 || y > rect.height - 2) continue
        const event = { clientX: rect.left + x, clientY: rect.top + y }
        if (s.picking.pick(event) === id) return event
      }
      throw Error('No pickable triangle for actual training hut ' + id)
    }, actor.id)
    await page.mouse.move(hit.clientX, hit.clientY)
    await page.evaluate(() => { const s = window.testScene; s.animate(s.previous); cancelAnimationFrame(s.frame) })
    assert.equal(await page.evaluate(() => window.testScene.hoveredObject), actor.id)
    report.stages.push({ id: actor.id, actualHover: true, point: hit })
  }
  writeFileSync(join(out, 'native-model-input.json'), JSON.stringify(report.frames) + '\n')
  // Repeat unchanged draw frames: the new original assets must not introduce
  // per-frame model/material rebuilds beyond the existing stage signature.
  report.steady = await page.evaluate(() => {
    const s = window.testScene, ids = Array.from(s.buildingMeshes.keys())
    const snapshot = () => ids.map(id => { const m = s.buildingMeshes.get(id)?.children[0]; return [id, m?.geometry?.uuid, m?.material?.uuid] })
    const before = snapshot(), elapsed = []
    for (let i = 0; i < 12; i++) { const t = performance.now(); s.animate(s.previous); cancelAnimationFrame(s.frame); elapsed.push(performance.now() - t) }
    return { before, after: snapshot(), elapsed, scope: 'Repeated paused render calls, not a RAF/FPS benchmark' }
  })
  assert.deepEqual(report.steady.after, report.steady.before)
  assert.equal(await page.evaluate(() => window.testStore.saveCheckpoint()), true)
  const reload = await context.newPage()
  reload.setDefaultTimeout(25000)
  await reload.goto(url, { waitUntil: 'domcontentloaded' })
  await reload.getByRole('button', { name: 'Load Game', exact: true }).waitFor({ state: 'attached' })
  await reload.bringToFront()
  for (let tabs = 0; tabs < 64 && await reload.evaluate(() => document.activeElement?.getAttribute('aria-label')) !== 'Load Game'; tabs++) await reload.keyboard.press('Tab')
  assert.equal(await reload.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Load Game')
  await reload.keyboard.press('Enter')
  await bindGame(reload)
  const restored = await reload.evaluate(async ids => {
    const { buildingObject } = await import('/app/building-shapes.ts')
    const s = window.testScene
    s.world.paused = true; s.animate(s.previous); cancelAnimationFrame(s.frame)
    return ids.map(id => { const b = s.world.buildings.find(b => b.id === id), mesh = s.buildingMeshes.get(id).children[0]; return { id, kind: b.kind, team: b.team, object: buildingObject(b), progress: b.progress, x: b.x, z: b.z, mesh: mesh.userData.nativeModel } })
  }, originals.map(b => b.id))
  assert.deepEqual(restored, originals.map(({ type, ...b }) => ({ ...b, mesh: b.object })))
  report.checkpointNewPage = true
  await reload.close()
  assert.deepEqual(report.errors, [])
  report.status = 'PASS_ORIGINAL_TRAINING_HUT_APPEARANCE_INPUT_AND_CHECKPOINT'
} catch (error) {
  report.status = 'FAILED_TRAINING_HUT_CHECK'; report.error = error.stack ?? String(error); process.exitCode = 1
} finally {
  clearTimeout(timer)
  await browser.close()
  report.finishedAt = new Date().toISOString(); report.browserClosed = true; save()
  console.log(JSON.stringify({ status: report.status, actors: report.actors.length, stageCases: report.stages.length, nativeViews: report.frames.length, error: report.error, browserClosed: true, output: out }, null, 2))
}
