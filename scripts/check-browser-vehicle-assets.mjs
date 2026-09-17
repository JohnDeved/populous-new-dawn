// Focused original-vehicle acceptance. Run only through the shared queue with
// --output-dir; capture inputs are original Mission22 actors and a labelled
// completed-hut fixture exercising the normal Mission13 production handler.
import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { createHash } from 'node:crypto'
import { chromium } from '@playwright/test'
import { bindGame } from './browser-game.mjs'
import { modelMatrix, modelPoint, projectPoint } from '../app/projection.ts'
import { modelShade } from '../app/model-lighting.ts'
import { modelTriangleVisible, polygonBucket } from '../app/painter-order.ts'
import models from '../app/original-models.json' with { type: 'json' }

assert.ok(process.env.PND_QUEUE_JOB_ID && process.env.PND_QUEUE_DEADLINE, 'Use the canonical shared queue')
assert.ok(process.argv.includes('--output-dir'))
const out = resolve(process.argv[process.argv.indexOf('--output-dir') + 1])
const url = process.env.POPULOUS_URL ?? 'http://127.0.0.1:4318'
assert.equal(new URL(url).port, '4318')
mkdirSync(out, { recursive: false })
const report = { startedAt: new Date().toISOString(), jobId: process.env.PND_QUEUE_JOB_ID, stages: [], frames: [], errors: [], limits: ['Direction/tribe/death edge cases are controlled inputs to original actors and shipped consumers.', 'Passenger sprites remain hidden while aboard, as in the unchanged unit renderer; boarding/exit state is tested.', 'Actual RAF/CPU observations and geometry counts are not a144fps or paired nonregression claim.'] }
const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
const stopAt = Math.min(Date.now() + 240_000, Date.parse(process.env.PND_QUEUE_DEADLINE) - 30_000)
const timer = setTimeout(() => { report.expired = true; void browser.close() }, Math.max(1, stopAt - Date.now()))
const save = () => writeFileSync(join(out, 'evidence.json'), JSON.stringify(report, null, 2) + '\n')
process.on('SIGTERM', () => void browser.close())
process.on('SIGINT', () => void browser.close())
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  page.setDefaultTimeout(20_000)
  page.on('pageerror', error => report.errors.push(error.stack ?? error.message))
  async function openMission(number) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    const button = page.getByRole('button', { name: `Mission ${number}`, exact: true })
    await button.waitFor({ state: 'attached' })
    await button.click()
    await bindGame(page)
    const skip = page.getByRole('button', { name: /Skip introduction/ })
    if (await skip.isVisible()) { await skip.click(); await bindGame(page) }
    await page.waitForFunction(() => window.testScene.terrainTextures && window.testScene.ground)
    await page.evaluate(async () => {
      const { browserPosition } = await import('/app/world-coordinates.ts')
      window.testScene = window.testSceneRef.current
      const s = window.testScene
      s.world.paused = true; s.world.speed = 0; cancelAnimationFrame(s.frame)
      window.renderVehicleFrame = vehicle => {
        s.viewTransition = null; s.viewPreset = 0; s.overviewActive = false; s.overviewStage = null
        s.viewZoom = 0; s.cameraBearing = 0
        s.focus(browserPosition(vehicle))
        s.updateView(); s.animate(s.previous); cancelAnimationFrame(s.frame)
      }
    })
  }
  await openMission(22)
  report.browser = browser.version()
  report.environment = await page.evaluate(() => {
    const s = window.testScene, gl = s.renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info')
    return { renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), viewport: [innerWidth, innerHeight], framebuffer: [gl.drawingBufferWidth, gl.drawingBufferHeight], dpr: devicePixelRatio, visible: !document.hidden, focused: document.hasFocus(), userAgent: navigator.userAgent }
  })
  const response = await page.request.get(url + '/original/atlas.png')
  report.atlasSHA = createHash('sha256').update(await response.body()).digest('hex')
  assert.equal(report.atlasSHA, createHash('sha256').update(readFileSync(new URL('../public/original/atlas.png', import.meta.url))).digest('hex'))
  const originals = await page.evaluate(() => window.testScene.world.vehicles.filter(v => v.active).map(v => ({ id: v.id, model: v.model, team: v.team, heading: v.heading })))
  assert.ok(originals.some(v => v.model === 1) && originals.some(v => v.model === 3))
  report.originalActors = originals
  report.picking = []
  for (const actor of originals) {
    const id = actor.id, expectedMesh = actor.model < 3 ? 143 : 144
    await page.evaluate(id => {
      const s = window.testScene, v = s.world.vehicles.find(v => v.id === id)
      window.renderVehicleFrame(v)
    }, id)
    await page.waitForFunction(id => window.testScene.vehicleMeshes.get(id)?.children[0]?.material.map?.image?.complete, id)
    await page.screenshot({ path: join(out, `original-${expectedMesh}.png`) })
    for (let direction = 0; direction < 8; direction++) {
      const started = Date.now()
      const frame = await page.evaluate(({ id, direction }) => {
        const s = window.testScene, vehicle = s.world.vehicles.find(v => v.id === id)
        vehicle.heading = direction * Math.PI / 4
        window.renderVehicleFrame(vehicle)
        const root = s.vehicleMeshes.get(id), mesh = root.children.find(m => m.userData.nativeModel !== undefined)
        if (!mesh || !root.visible) throw Error('Original vehicle mesh missing or invisible')
        const d = mesh.userData, origin = mesh.getWorldPosition(mesh.position.clone())
        const attribute = name => Array.from(mesh.geometry.getAttribute(name).array)
        return { preset: s.viewPreset, bearing: s.cameraBearing, actor: { id, model: vehicle.model, team: vehicle.team }, projection: s.view.projection, center: s.view.center,
          models: [{ id: d.nativeModel, picking: s.picking.model(mesh, `vehicle-${id}-${direction}`).map(c => c.kind === 'bounds' ? { kind: c.kind, bounds: c.bounds, bucket: c.bucket } : { kind: c.kind, points: c.points, bucket: c.bucket }),
            scale: d.nativeScale, size: d.nativeSize ?? d.nativeScale, heading: mesh.parent.userData.nativeHeading ?? 0,
            tilt: mesh.parent.userData.nativeTilt ?? 0, roll: mesh.parent.userData.nativeRoll ?? 0,
            position: [Math.round((origin.x + 8) * 256) & 65535, Math.round((-origin.z - 8) * 256) & 65535, Math.round(origin.y * 128)],
            relative: s.view.relative(origin, (origin.y * 128) / 45), vertices: attribute('position'), shades: attribute('faceShade'), biases: attribute('painterBias'),
            submitted: Array.from({ length: mesh.geometry.getAttribute('position').count / 3 }, (_, i) => s.view.painter.depth(mesh, i, 0) <= 1) }],
          renderInfo: { ...s.renderer.info.render } }
      }, { id, direction })
      assert.equal(frame.models[0].id, expectedMesh)
      const model = frame.models[0], basis = modelMatrix(model.heading, model.tilt, model.roll), points = []
      for (let i = 0; i < model.vertices.length; i += 3) {
        const raw = model.vertices.slice(i, i + 3).map((n, axis) => Math.round(n * model.scale * 3 * (axis === 2 ? -1 : 1)))
        points.push(projectPoint(modelPoint(raw, model.size, basis, model.relative), frame.projection))
      }
      model.triangles = []
      for (let i = 0; i < points.length; i += 3) {
        const p = points.slice(i, i + 3), visible = modelTriangleVisible(p, frame.projection.width, frame.projection.height)
        assert.equal(model.submitted[i / 3], visible, `Vehicle ${id} direction ${direction} triangle ${i / 3}`)
        if (visible) model.triangles.push({ screen: p.flatMap(v => [v.screenX, v.screenY]), shade: modelShade(model.shades[i], p[0].z), bucket: polygonBucket(p.map(v => v.z), model.biases[i]) })
      }
      assert.ok(model.triangles.length > 0)
      for (const key of ['vertices', 'shades', 'biases', 'submitted']) delete model[key]
      frame.captureWallMs = Date.now() - started
      report.frames.push(frame)
    }
    const hit = await page.evaluate(id => {
      const s = window.testScene, vehicle = s.world.vehicles.find(v => v.id === id)
      vehicle.heading = 0; window.renderVehicleFrame(vehicle)
      const root = s.vehicleMeshes.get(id), mesh = root.children[0], rect = s.renderer.domElement.getBoundingClientRect()
      const commands = s.picking.model(mesh, 'actual-vehicle-pick-' + id)
      for (const c of commands) {
        if (c.kind !== 'model') continue
        const x = c.points.reduce((n, p) => n + p.x, 0) / 3, y = c.points.reduce((n, p) => n + p.y, 0) / 3
        if (x < 2 || y < 2 || x > rect.width - 2 || y > rect.height - 2) continue
        const point = { clientX: rect.left + x, clientY: rect.top + y }
        if (s.picking.pick(point) === id) return point
      }
      throw Error('No actual pickable original vehicle triangle')
    }, id)
    await page.mouse.move(hit.clientX, hit.clientY)
    await page.evaluate(() => { const s = window.testScene; s.animate(s.previous); cancelAnimationFrame(s.frame) })
    assert.equal(await page.evaluate(() => window.testScene.hoveredObject), id)
    report.picking.push({ id, ...hit, actualHoveredId: id })
    const teams = await page.evaluate(id => {
      const s = window.testScene, vehicle = s.world.vehicles.find(v => v.id === id), old = vehicle.team, rows = []
      for (const team of ['blue', 'red', 'yellow', 'green']) {
        vehicle.team = team; window.renderVehicleFrame(vehicle)
        const mesh = s.vehicleMeshes.get(id).children[0]
        rows.push({ team, mesh: mesh.userData.nativeModel, geometry: mesh.geometry.uuid, material: mesh.material.uuid })
      }
      vehicle.team = old; window.renderVehicleFrame(vehicle)
      return rows
    }, id)
    assert.ok(teams.every(row => row.mesh === expectedMesh && row.geometry === teams[0].geometry && row.material === teams[0].material))
    report.stages.push({ actor: id, originalMesh: expectedMesh, eightDirections: true, genuineHoverPick: true, tribeIdentity: teams })
  }
  writeFileSync(join(out, 'native-model-input.json'), JSON.stringify(report.frames) + '\n')
  save()
  // Actual checkpoint-store path and a new page reload, not a serialized helper only.
  assert.equal(await page.evaluate(() => window.testStore.saveCheckpoint()), true)
  const restored = await context.newPage()
  restored.setDefaultTimeout(20_000)
  await restored.goto(url, { waitUntil: 'domcontentloaded' })
  await restored.getByRole('button', { name: 'Load Game', exact: true }).click()
  await bindGame(restored)
  const loaded = await restored.evaluate(() => window.testScene.world.vehicles.map(v => ({ id: v.id, model: v.model, team: v.team })))
  assert.deepEqual(loaded.filter(v => originals.some(o => o.id === v.id)), originals.map(({ id, model, team }) => ({ id, model, team })))
  await restored.close()
  await page.bringToFront()
  report.stages.push({ checkpointNewPageRestoration: true })
  // Bounded actual RAF observation in the normal scene, separate from captures.
  report.frameCosts = await page.evaluate(async () => {
    const s = window.testScene, original = s.animate, rows = []
    return await new Promise(resolve => {
      const stop = setTimeout(() => finish(), 4000)
      let finished = false
      function finish() { if (finished) return; finished = true; cancelAnimationFrame(s.frame); s.animate = original; clearTimeout(stop); resolve(rows) }
      s.animate = stamp => { const start = performance.now(); original(stamp); rows.push({ stamp, fullFrameMs: performance.now() - start, triangles: s.renderer.info.render.triangles, calls: s.renderer.info.render.calls }); if (rows.length >= 40) finish() }
      s.previous = performance.now(); s.frame = requestAnimationFrame(s.animate)
    })
  })
  await openMission(13)
  report.productionAndLifecycle = await page.evaluate(async () => {
    const s = window.testScene, w = s.world
    const { addBuilding, tick } = await import('/app/model.ts')
    const { stepLiveVehicles, leaveLiveVehicle, boardLiveVehicle } = await import('/app/live-vehicles.ts')
    const hut = addBuilding(w, 'blue', 'balloonHut', { x: 0, z: 0 }, true)
    const brave = w.units.find(u => u.team === 'blue' && u.kind === 'brave')
    brave.inside = hut.id; brave.work = hut.id; hut.timer = 999
    w.paused = false; tick(w, 1 / 12); w.paused = true
    const vehicle = w.vehicles.find(v => v.model === 3)
    if (!vehicle || vehicle.passengers[0] !== brave.id) throw Error('Normal hut production failed')
    window.renderVehicleFrame(vehicle)
    const mesh = s.vehicleMeshes.get(vehicle.id), id = vehicle.id
    if (mesh.children[0].userData.nativeModel !== 144) throw Error('Produced balloon missing original model')
    if (s.unitMeshes.get(brave.id)?.visible !== false) throw Error('Existing aboard passenger visibility changed')
    leaveLiveVehicle(w, vehicle, brave.native, { x: vehicle.x, y: vehicle.y })
    window.renderVehicleFrame(vehicle)
    if (brave.native.vehicle !== 0 || vehicle.passengerCount !== 0) throw Error('Normal exit failed')
    const passengerVisibleAfterExit = s.unitMeshes.get(brave.id)?.visible
    if (!boardLiveVehicle(w, brave.native, vehicle)) throw Error('Normal reboarding failed')
    vehicle.life = 1; stepLiveVehicles(w); window.renderVehicleFrame(vehicle)
    const phase = { active: vehicle.active, state: vehicle.destructionState, mesh: s.vehicleMeshes.get(id)?.children[0]?.userData.nativeModel, passengerVehicle: brave.native.vehicle, passengerHp: brave.hp }
    if (phase.active || phase.state !== 6 || phase.mesh !== 144 || phase.passengerVehicle || phase.passengerHp <= 0) throw Error('Original balloon destruction/exit behavior changed')
    let turns = 0
    while (vehicle.destructionState && turns++ < 200) stepLiveVehicles(w)
    window.renderVehicleFrame(vehicle)
    if (vehicle.destructionState || s.vehicleMeshes.has(id)) throw Error('Completed destroyed vehicle mesh retained')
    return { fixture: 'completed hut/timer and lethal life edge; normal production/exit/destruction handlers', producedId: id, passenger: brave.id, passengerVisibleAfterExit, phase, retired: true, turns }
  })
  assert.equal(report.productionAndLifecycle.passengerVisibleAfterExit, true)
  assert.deepEqual(report.errors, [])
  assert.equal(report.expired, undefined)
  report.status = 'PASS_ORIGINAL_VEHICLE_LIVE_ACCEPTANCE_PENDING_NATIVE_ORACLE'
} catch (error) {
  report.status = 'FAILED_VEHICLE_ACCEPTANCE'
  report.error = error.stack ?? String(error)
  process.exitCode = 1
} finally {
  clearTimeout(timer)
  await browser.close()
  report.finishedAt = new Date().toISOString(); report.browserClosed = true; save()
  console.log(JSON.stringify({ status: report.status, stages: report.stages, error: report.error, environment: report.environment, nativeFrames: report.frames.length, output: out, browserClosed: true }, null, 2))
}
