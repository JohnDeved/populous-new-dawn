import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'
import { bindGame, showAllMissions } from './browser-game.mjs'
import { vehiclePoint } from './check-browser-vehicle-panel.mjs'
import { modelMatrix, modelPoint, projectPoint } from '../app/projection.ts'
import { modelShade } from '../app/model-lighting.ts'
import { modelTriangleVisible, polygonBucket } from '../app/painter-order.ts'
import hud from '../app/original-hud.json' with { type: 'json' }
import art from '../app/original-follower-tasks.json' with { type: 'json' }

const columns = ['Followers', 'Braves', 'Warriors', 'Firewarriors', 'Preachers', 'Spies']
const models = [0, 2, 3, 6, 4, 5]
// Native F00T digit mapping and centered advance, independently of the UI helper.
const numberGlyphs = (count, nearby = false) => (count ? String(count).padStart(count < 100 ? 2 : 3, '0') : '').split('').map(c => `f00t${(count < 100 ? 4 : 6) + Number(nearby)}-${c.charCodeAt(0) - 32}`)
const rowName = kind => kind === 1 ? 'Boats occupied by' : 'Balloons occupied by'
const cell = (page, kind, column) => page.getByRole('button', { name: `${rowName(kind)} ${columns[column]}`, exact: true })
const transportButtons = page => page.locator('.follower-tasks button[aria-label*="occupied by"]')
const selected = page => page.evaluate(() => [...window.testSceneRef.current.world.selected])
const freeze = page => page.evaluate(() => {
  const s = window.testSceneRef.current
  s.world.speed = 0; cancelAnimationFrame(s.frame); window.testScene = s
})
const render = (page, settle = false) => page.evaluate(settle => {
  const s = window.testSceneRef.current
  if (settle) for (let i = 0; s.cameraMotion.active && i < 64; i++) s.updateCameraMotion(1 / 24)
  s.onChange(); s.animate(s.previous); cancelAnimationFrame(s.frame)
}, settle)
const rows = page => transportButtons(page).evaluateAll(buttons => buttons.map(b => ({
  label: b.getAttribute('aria-label'), disabled: b.disabled,
  count: Number(b.querySelector('.follower-number').getAttribute('aria-label')),
})))
const counts = async (page, kind) => (await rows(page)).filter(r => r.label.startsWith(rowName(kind))).map(r => r.count)
const clear = async page => { await page.keyboard.press('Escape'); assert.deepEqual(await selected(page), []) }
const unchangedState = page => page.evaluate(() => {
  const w = window.testSceneRef.current.world
  return { units: JSON.stringify(w.units), vehicles: JSON.stringify(w.vehicles), orders: JSON.stringify(w.buildingOrders), selected: [...w.selected], rng: w.randomState }
})
const focusState = page => page.evaluate(() => {
  const s = window.testSceneRef.current
  return { transport: [...s.hudTransportFocus], task: [...s.hudTaskFocus], population: [...s.hudFocus] }
})

// Independent group assertions: counts are craft counts, and a class chooses a
// whole eligible crew. Do not call the production selection helper as the oracle.
export function assertSelectedCrews(selection, craft, expectedCount, model = 0) {
  const ids = new Set(selection), chosen = craft.filter(v => v.crew.some(p => ids.has(p.id)))
  assert.equal(ids.size, selection.length, 'selection has no duplicate passengers')
  assert.equal(chosen.length, expectedCount, 'modifier counts craft, not passengers')
  assert.equal(chosen.flatMap(v => v.crew).length, selection.length, 'no unrelated passenger selected')
  for (const v of chosen) {
    assert.ok(!model || v.crew.some(p => p.model === model), 'chosen craft contains the filtered class')
    assert.ok(v.crew.every(p => ids.has(p.id)), 'a class-filtered click selects the entire crew')
  }
  return chosen.map(v => v.id)
}

// Playwright rounds element clips outward in CSS pixels. Preserve actual HUD
// scale/origin on the device grid; never stretch a15x34 reference to that box.
export function transportPixelGrid(target, dock, dpr, scroll = { x: 0, y: 0 }) {
  const x = Math.floor(target.x + scroll.x), y = Math.floor(target.y + scroll.y)
  const right = Math.ceil(target.x + scroll.x + target.width)
  const bottom = Math.ceil(target.y + scroll.y + target.height)
  const scale = dock.width / 100 * dpr
  assert.ok(Math.abs(dock.height / 277 * dpr - scale) < 0.0001, 'uniform native dock scale')
  return { dpr, physicalScale: scale, cssClip: { x, y, width: right - x, height: bottom - y },
    width: (right - x) * dpr, height: (bottom - y) * dpr,
    origin: { x: (dock.x + scroll.x - x) * dpr, y: (dock.y + scroll.y - y) * dpr },
    padding: { left: (target.x + scroll.x - x) * dpr, top: (target.y + scroll.y - y) * dpr,
      right: (right - target.x - scroll.x - target.width) * dpr,
      bottom: (bottom - target.y - scroll.y - target.height) * dpr } }
}

export function assertTransportLayout(layout, viewport) {
  assert.equal(layout.rectangles.length, 12)
  assert.ok(layout.dock.y + layout.dock.height <= layout.footer.y, 'native dock clears modern footer')
  for (const [i, r] of layout.rectangles.entries()) {
    assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.width <= viewport.width && r.y + r.height <= viewport.height, JSON.stringify({ viewport, r }))
    assert.ok(Math.abs(r.width / r.height - 15 / 34) < 0.001)
    assert.equal(r.left, `${(i % 6) * 16}px`); assert.equal(r.top, `${i < 6 ? 190 : 231}px`)
    assert.ok(r.y + r.height <= layout.footer.y, 'last-row frame and digits clear footer')
    assert.ok(r.hits.every(hit => hit.owned), `transport center/digit hit: ${JSON.stringify(r)}`)
  }
}

async function transportLayout(page) {
  // The checker owns frozen RAF; let ResizeObserver finish before normal render.
  await page.waitForFunction(() => {
    const s = window.testSceneRef.current, r = s.container.getBoundingClientRect(), dpr = s.renderer.getPixelRatio(), canvas = s.renderer.domElement
    return canvas.width === Math.floor(r.width * dpr) && canvas.height === Math.floor(r.height * dpr)
  })
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  await render(page)
  return page.evaluate(() => {
    const box = node => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height } }
    const dock = box(document.querySelector('.followers-dock')), footer = box(document.querySelector('.top-actions'))
    const rectangles = [...document.querySelectorAll('.follower-tasks button[aria-label*="occupied by"]')].map(b => {
      const r = box(b)
      const hits = [17, 30.5].map(y => {
        const point = { x: r.x + r.width / 2, y: r.y + r.height * y / 34 }, top = document.elementFromPoint(point.x, point.y)
        return { ...point, owned: top === b || b.contains(top), hit: top?.closest('button')?.getAttribute('aria-label') ?? top?.tagName }
      })
      return { ...r, left: b.style.left, top: b.style.top, hits }
    })
    return { dock, footer, rectangles, devicePixelRatio }
  })
}

// Source-art consistency, not old Windows rasterization or hardware evidence.
async function sourcePixels(page, output, kind, column, pressed = false, suffix = '') {
  await page.evaluate(() => document.activeElement?.blur())
  const button = cell(page, kind, column), name = `transport-${kind}-${column}-${pressed ? 'pressed' : 'normal'}${suffix}`
  if (pressed) await button.hover(); else await page.mouse.move(900, 400)
  const geometry = await button.evaluate(b => {
    const box = node => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height } }
    return { target: box(b), dock: box(document.querySelector('.followers-dock')), dpr: devicePixelRatio, scroll: { x: scrollX, y: scrollY } }
  })
  const grid = transportPixelGrid(geometry.target, geometry.dock, geometry.dpr, geometry.scroll)
  const bytes = await button.screenshot({ path: resolve(output, `${name}.png`) })
  const states = await transportButtons(page).evaluateAll(buttons => buttons.map(b => ({
    disabled: b.disabled, count: Number(b.querySelector('.follower-number').getAttribute('aria-label')),
    x: parseInt(b.style.left, 10), y: parseInt(b.style.top, 10),
    glyphs: [...b.querySelectorAll('.follower-number .hud-sprite')].map(n => n.style.backgroundPosition),
    glyphX: parseInt(b.querySelector('.follower-number').style.left, 10),
  })))
  const state = states.find(s => s.x === column * 16 && s.y === (kind === 1 ? 190 : 231))
  const expectedGlyphs = numberGlyphs(state.count, suffix === '-nearby')
  assert.deepEqual(state.glyphs, expectedGlyphs.map(id => `-${hud.rects[id].x}px -${hud.rects[id].y}px`))
  assert.equal(state.glyphX, Math.trunc((15 - expectedGlyphs.reduce((sum, id) => sum + hud.rects[id].w, 0)) / 2), 'native centered digit geometry')
  const result = await page.evaluate(async ({ bytes, kind, column, pressed, states, grid, hud, art }) => {
    const load = async input => createImageBitmap(input instanceof Blob ? input : await (await fetch(input)).blob())
    const [actual, panel, normal, down, atlas, font] = await Promise.all([
      load(new Blob([new Uint8Array(bytes)], { type: 'image/png' })), load('/original/follower-task-panel.png'),
      load('/original/follower-task-normal.png'), load('/original/follower-task-pressed.png'), load('/original/follower-tasks.png'), load('/original/hud.png'),
    ])
    const reference = document.createElement('canvas'); reference.width = 100; reference.height = 277
    const c = reference.getContext('2d'); c.imageSmoothingEnabled = false; c.drawImage(panel, 0, 0)
    for (const state of states) {
      const k = state.y === 190 ? 1 : 3, col = state.x / 16
      const active = pressed && !state.disabled && kind === k && column === col
      c.globalAlpha = state.disabled ? 85 / 255 : 1; c.drawImage(active ? down : normal, state.x, state.y); c.globalAlpha = 1
      const icon = art.rects[col ? (k === 1 ? 655 : 1088) : (k === 1 ? 653 : 647) + Number(active)]
      c.drawImage(atlas, icon.x, icon.y, icon.w, icon.h, state.x + 7 - Math.trunc(icon.w / 2), state.y + 17 - Math.trunc((icon.h + 8) / 2), icon.w, icon.h)
      let x = state.x + state.glyphX
      for (const position of state.glyphs) {
        const [gx, gy] = position.match(/-?\d+/g).map(Number).map(Math.abs)
        const glyph = Object.entries(hud.rects).find(([id, r]) => id.startsWith('f00t') && r.x === gx && r.y === gy)?.[1]
        if (!glyph) throw Error(`Unknown glyph ${position}`)
        c.drawImage(font, glyph.x, glyph.y, glyph.w, glyph.h, x, state.y + 24, glyph.w, glyph.h); x += glyph.w
      }
    }
    const canvas = document.createElement('canvas'); canvas.width = actual.width; canvas.height = actual.height
    const out = canvas.getContext('2d'); out.imageSmoothingEnabled = false; out.drawImage(actual, 0, 0)
    const got = out.getImageData(0, 0, canvas.width, canvas.height).data
    out.clearRect(0, 0, canvas.width, canvas.height)
    out.drawImage(reference, grid.origin.x, grid.origin.y, 100 * grid.physicalScale, 277 * grid.physicalScale)
    const want = out.getImageData(0, 0, canvas.width, canvas.height).data, expected = canvas.toDataURL('image/png')
    let mismatches = 0, maxError = 0
    for (let i = 0; i < got.length; i++) { const e = Math.abs(got[i] - want[i]); if (e > 1) mismatches++; maxError = Math.max(e, maxError) }
    for (const image of [actual, panel, normal, down, atlas, font]) image.close()
    return { width: canvas.width, height: canvas.height, mismatches, maxError, expected }
  }, { bytes: [...bytes], kind, column, pressed, states, grid, hud, art })
  writeFileSync(resolve(output, `${name}-expected.png`), Buffer.from(result.expected.split(',')[1], 'base64'))
  delete result.expected
  writeFileSync(resolve(output, `${name}-geometry.json`), JSON.stringify({ geometry, grid, states, result }, null, 2) + '\n')
  assert.equal(result.width, grid.width); assert.equal(result.height, grid.height)
  assert.equal(result.mismatches, 0, `${name}: ${JSON.stringify(result)}`)
  return { name, ...result, grid }
}

// The maintained live-model capture contract, restricted to the actual craft
// already focused/rendered by this scenario. It does not launch another browser,
// move the camera, mutate the world, write fixtures or synthesize geometry.
async function captureVehicleFrame(page, id, kind) {
  const frame = await page.evaluate(({ id, kind }) => {
    const s = window.testSceneRef.current, group = s.vehicleMeshes.get(id), mesh = group?.children[0], d = mesh?.userData
    if (!mesh || d.nativeModel !== (kind === 1 ? 143 : 144) || d.stage !== 4) throw Error('Missing actual original vehicle mesh')
    const origin = mesh.getWorldPosition(mesh.position.clone())
    if (!s.view.visible(origin)) throw Error('Vehicle capture is outside the current view')
    const attribute = name => Array.from(mesh.geometry.getAttribute(name).array)
    return { preset: s.viewPreset, bearing: s.cameraBearing,
      projection: s.view.projection, center: s.view.center, vehicleId: id, models: [{
        id: d.nativeModel, scale: d.nativeScale, size: d.nativeSize ?? d.nativeScale,
        heading: group.userData.nativeHeading ?? 0, tilt: group.userData.nativeTilt ?? 0, roll: group.userData.nativeRoll ?? 0,
        position: [Math.round((origin.x + 8) * 256) & 65535, Math.round((-origin.z - 8) * 256) & 65535, Math.round(origin.y * 128)],
        relative: s.view.relative(origin, (origin.y * 128) / 45),
        picking: s.picking.model(mesh, `transport-${id}`).map(c => c.kind === 'bounds'
          ? { kind: c.kind, bounds: c.bounds, bucket: c.bucket } : { kind: c.kind, points: c.points, bucket: c.bucket }),
        vertices: attribute('position'), shades: attribute('faceShade'), biases: attribute('painterBias'),
        submitted: Array.from({ length: mesh.geometry.getAttribute('position').count / 3 }, (_, i) => s.view.painter.depth(mesh, i, 0) <= 1),
      }] }
  }, { id, kind })
  for (const model of frame.models) {
    const rotation = modelMatrix(model.heading, model.tilt, model.roll), points = []
    for (let i = 0; i < model.vertices.length; i += 3) {
      const raw = model.vertices.slice(i, i + 3).map((n, axis) => Math.round(n * model.scale * 3 * (axis === 2 ? -1 : 1)))
      points.push(projectPoint(modelPoint(raw, model.size, rotation, model.relative), frame.projection))
    }
    model.triangles = []
    for (let i = 0; i < points.length; i += 3) {
      const p = points.slice(i, i + 3), visible = modelTriangleVisible(p, frame.projection.width, frame.projection.height)
      assert.equal(model.submitted[i / 3], visible, `actual vehicle${id} painter triangle${i / 3}`)
      if (visible) model.triangles.push({ screen: p.flatMap(v => [v.screenX, v.screenY]),
        shade: modelShade(model.shades[i], p[0].z), bucket: polygonBucket(p.map(v => v.z), model.biases[i]) })
    }
    assert.ok(model.triangles.length > 0)
    delete model.vertices; delete model.shades; delete model.biases; delete model.submitted
  }
  return frame
}

async function vehicleAppearance(page, id, apparent) {
  const result = await page.evaluate(async ({ id, apparent }) => {
    const s = window.testSceneRef.current, v = s.world.vehicles.find(v => v.id === id), group = s.vehicleMeshes.get(id)
    const { originalVehicleUV } = await import('/app/vehicle-appearance.ts'), { teamForTribe } = await import('/app/world-types.ts')
    const expectedTeam = teamForTribe(apparent), actual = group.children[0].geometry.getAttribute('uv').array, expected = originalVehicleUV(v.model, expectedTeam)
    return { id, realTeam: v.team, apparent: v.apparentTribe, expectedTeam, cacheTeam: group.userData.vehicleTeam,
      vertices: actual.length / 2, mismatches: actual.length === expected.length ? actual.reduce((n, value, i) => n + Number(value !== expected[i]), 0) : -1 }
  }, { id, apparent })
  assert.equal(result.cacheTeam, result.expectedTeam); assert.equal(result.mismatches, 0)
  return result
}

async function checkpoint(page, expected) {
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
  await page.waitForFunction(async expected => {
    const db = await new Promise((resolve, reject) => { const r = indexedDB.open('populous-new-dawn', 1); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error) })
    const saved = await new Promise((resolve, reject) => { const r = db.transaction('checkpoints', 'readonly').objectStore('checkpoints').get('latest'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error) })
    db.close()
    return saved?.world && JSON.stringify(saved.world.vehicles) === expected.vehicles && JSON.stringify(saved.world.selected) === JSON.stringify(expected.selected)
  }, expected)
  await page.getByRole('button', { name: 'Close menu', exact: true }).click()
  await clear(page)
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByRole('button', { name: 'Load checkpoint', exact: true }).click()
  await bindGame(page)
  await page.waitForFunction(() => window.testSceneRef.current?.world === window.testStore.getWorld())
  await freeze(page)
  await page.getByTitle('followers', { exact: true }).click()
}

// Run ONLY through scripts/local-render/harness.mjs, which owns the sandboxed
// browser, port, process cleanup, source fingerprint, raw errors and screenshots.
export default async function followerTransports({ browser, page, url, openMission, output, receipt }) {
  await openMission(22); await freeze(page); await clear(page)
  await page.getByTitle('followers', { exact: true }).click()
  const opening = await page.evaluate(() => {
    const s = window.testSceneRef.current, w = s.world, gl = s.renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info')
    return { vehicles: w.vehicles.map(v => ({ id: v.id, model: v.model, team: v.team })),
      authoredPeople: w.units.map(u => ({ id: u.id, team: u.team, kind: u.kind })), status: w.status,
      renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), turn: w.turn, devicePixelRatio }
  })
  assert.equal(await transportButtons(page).count(), 0, 'unclaimed authored vehicles do not expose player rows')
  await page.locator('.native-hud').screenshot({ path: resolve(output, 'transport-authored-opening.png') })
  // Observation mode runs against an actual main checkout with this checker only.
  // Never inject candidate runtime sources into the baseline.
  const baseline = process.env.POPULOUS_FOLLOWER_TRANSPORT_BASELINE === '1'
  if (baseline) assert.equal(await page.locator('.follower-tasks button').count(), 24)
  const result = { baseline, opening, boarding: [], controls: [], focus: [], pixels: [], layouts: [],
    scope: 'Authored Mission22 opening and vehicle mesh clicks; actual rendered Followers controls and native vehicle panels. Staged added crews, extra craft, driver/owner/class/nearby and Balloon state30 fixtures are explicit supporting state, not natural acquisition.',
    limits: 'Cloud headless/software renderer only. No hardware performance or native-runtime screenshot claim. Balloon disguise commandPosition is not exercised; the proved Boat disguise command is used. Authored people and mission outcome are retained.' }

  // Preserve the authored population, including the Shaman and her routes. Add
  // only a small test crew beside each actual craft; issue boarding by mesh click.
  const craft = [], capturedModels = []
  for (const kind of [1, 3]) {
    const id = opening.vehicles.find(v => v.model === kind)?.id
    assert.ok(id, `authored model ${kind} exists`)
    const crew = await page.evaluate(async id => {
      const s = window.testSceneRef.current, w = s.world, { addUnit, browserPosition } = await import('/app/model.ts'), v = w.vehicles.find(v => v.id === id)
      const p = browserPosition(v), units = ['brave', 'warrior'].map((kind, i) => addUnit(w, 'blue', kind, { x: p.x + i * 0.2, z: p.z }))
      w.selected = units.map(u => u.id); s.onChange()
      return units.map((u, i) => ({ id: u.id, model: i ? 3 : 2 }))
    }, id)
    const p = await vehiclePoint(page, id); await page.mouse.click(p.x, p.y)
    const boarding = await page.evaluate(async ({ id, crew }) => {
      const s = window.testSceneRef.current, w = s.world, { tick } = await import('/app/model.ts'), v = w.vehicles.find(v => v.id === id)
      let turns = 0; for (; turns < 120 && v.passengerCount < crew.length; turns++) tick(w, 1 / 12)
      s.onChange(); s.animate(s.previous); cancelAnimationFrame(s.frame)
      return { id, turns, passengers: [...v.passengers], count: v.passengerCount, team: v.team,
        people: crew.map(p => { const u = w.units.find(u => u.id === p.id); return { id: p.id, alive: u.hp > 0, vehicle: u.native?.vehicle } }) }
    }, { id, crew })
    assert.equal(boarding.count, 2, JSON.stringify(boarding)); assert.equal(boarding.team, 'blue')
    assert.ok(boarding.people.every(p => p.alive && p.vehicle === id), JSON.stringify(boarding))
    // Preserve the actual boarding result before the explicit supporting hold.
    // This capture protocol is identical in baseline and candidate runs.
    writeFileSync(resolve(output, `transport-authored-${kind}-boarding-before-support-hold.json`), JSON.stringify(boarding, null, 2) + '\n')
    await page.screenshot({ path: resolve(output, `transport-authored-${kind}-boarding-before-support-hold.png`) })
    boarding.supportingHold = await page.evaluate(async ({ id, crew }) => {
      const s = window.testSceneRef.current, w = s.world,
        { cancelLiveOrder } = await import('/app/live-movement.ts'),
        { changeLivePersonState } = await import('/app/live-people.ts')
      // Boarding can publish an active command22 route. Hold this added crew
      // before later craft ticks; this is fixture staging, not a gameplay repair.
      const held = crew.map(({ id }) => {
        const u = w.units.find(u => u.id === id)
        cancelLiveOrder(w, u); changeLivePersonState(w, u, 30)
        return { id, state: u.native.state, speed: u.native.speed, assignment: u.native.assignment, vehicle: u.native.vehicle }
      })
      s.onChange(); return { craft: id, held }
    }, { id, crew })
    assert.ok(boarding.supportingHold.held.every(p => p.state === 30 && p.speed === 0 && p.assignment & 1 && p.vehicle === id), JSON.stringify(boarding.supportingHold))
    craft.push({ id, kind, crew }); result.boarding.push(boarding)
    await clear(page)
    if (baseline) {
      assert.equal(await page.locator('.follower-tasks button').count(), 24)
      assert.equal(await transportButtons(page).count(), 0, 'unmodified main has no transport controls even after boarding')
      const point = await vehiclePoint(page, id); await page.mouse.click(point.x, point.y, { button: 'right' }); await render(page, true)
      const panel = page.getByRole('group', { name: `${kind === 1 ? 'Boat' : 'Balloon'}: 2 passengers`, exact: true })
      await panel.getByRole('button', { name: 'Toggle passenger 1; Shift selects the group', exact: true }).click({ modifiers: ['Shift'] })
      await page.mouse.move(900, 400); await render(page)
      await page.screenshot({ path: resolve(output, `transport-authored-${kind}-occupied.png`) })
      await page.evaluate(() => window.testSceneRef.current.objectPanels.dispose()); await clear(page)
      continue
    }
    assert.deepEqual(await counts(page, kind), [1, 1, 1, 0, 0, 0])
    assert.equal(await transportButtons(page).count(), kind === 1 ? 6 : 12)
    await cell(page, kind, 1).click(); assertSelectedCrews(await selected(page), craft.filter(v => v.kind === kind), 1, 2)
    await cell(page, kind, 1).click({ button: 'right' }); await render(page, true)
    const panel = page.getByRole('group', { name: `${kind === 1 ? 'Boat' : 'Balloon'}: 2 passengers`, exact: true })
    await panel.waitFor({ state: 'visible' })
    assert.equal(await panel.getByRole('button', { name: 'Unload all passengers', exact: true }).isEnabled(), true)
    await page.mouse.move(900, 400); await render(page)
    await page.screenshot({ path: resolve(output, `transport-authored-${kind}-occupied.png`) })
    capturedModels.push(await captureVehicleFrame(page, id, kind))
    writeFileSync(resolve(output, 'live-vehicle-models.json'), JSON.stringify(capturedModels, null, 2) + '\n')
    result.controls.push({ kind, appearance: await vehicleAppearance(page, id, 0) })
    await page.evaluate(() => window.testSceneRef.current.objectPanels.dispose())
    await clear(page)
  }
  if (baseline) {
    assert.deepEqual(receipt.errors, [])
    result.scope = 'Actual unmodified-main Mission22 baseline: authored vehicles board staged crews through mesh clicks, existing vehicle panels work, but Followers has only its previous 24 task cells and no transport row.'
    writeFileSync(resolve(output, 'follower-transports-baseline.json'), JSON.stringify(result, null, 2) + '\n')
    return result
  }
  assert.deepEqual((await rows(page)).map(r => r.label), [1, 3].flatMap(k => columns.map(c => `${rowName(k)} ${c}`)))
  assert.equal(await page.locator('.follower-tasks button').count(), 36)
  assert.equal(await page.locator('.tribe-classes button').count(), 6)
  for (const kind of [1, 3]) for (let column = 0; column < 6; column++) result.pixels.push(await sourcePixels(page, output, kind, column))
  for (const kind of [1, 3]) result.pixels.push(await sourcePixels(page, output, kind, 0, true))

  // Six craft per row distinguish Ctrl's five craft from Shift's all. Extra
  // craft/crews are supporting fixtures. Real attachment and settled seat APIs
  // are used; state30 fixtures hold Balloons without unported disguise routing.
  const extra = await page.evaluate(async originals => {
    const s = window.testSceneRef.current, w = s.world,
      { addUnit, browserPosition } = await import('/app/model.ts'),
      { createLivePerson, changeLivePersonState } = await import('/app/live-people.ts'),
      { boardLiveVehicle } = await import('/app/live-vehicles.ts')
    const records = [], pairs = [['brave', 2], ['firewarrior', 6], ['preacher', 4], ['spy', 5], ['warrior', 3]]
    for (const original of originals) {
      const template = w.vehicles.find(v => v.id === original.id)
      for (let i = 0; i < pairs.length; i++) {
        const v = { ...structuredClone(template), id: w.nextId++, x: (template.x + (i + 1) * 1024) & 65535,
          passengers: [], passengerCount: 0, speed: -1, navigationFlags: 0, reservation: 0, team: 'blue', apparentTribe: 0 }
        v.turnAngle = v.x; v.turnY = v.y; w.vehicles.push(v)
        // Command16 is established for a driver Spy. Non-driver command
        // scheduling remains a separate, unproved boundary.
        const seats = original.kind === 1 && pairs[i][0] === 'spy'
          ? [pairs[i], ['brave', 2]] : [['brave', 2], pairs[i]]
        const crew = seats.map(([kind, model]) => {
          const u = addUnit(w, 'blue', kind, browserPosition(v)); u.native = createLivePerson(w, u); w.pathfinding.people.set(u.id, u.native)
          if (!boardLiveVehicle(w, u.native, v)) throw Error('Supporting crew attachment failed')
          changeLivePersonState(w, u, 30)
          if (u.native.state !== 30 || u.native.speed !== 0 || !(u.native.assignment & 1)) throw Error('Extra-craft crew did not enter the supported aboard hold')
          return { id: u.id, model }
        })
        records.push({ id: v.id, kind: original.kind, crew })
      }
    }
    s.onChange(); return records
  }, craft)
  craft.push(...extra)
  for (const kind of [1, 3]) assert.deepEqual(await counts(page, kind), [6, 6, 2, 1, 1, 1])
  await page.mouse.move(900, 400); await render(page)
  await page.locator('.native-hud').screenshot({ path: resolve(output, 'transport-six-craft-per-row.png') })
  for (const kind of [1, 3]) {
    const fleet = craft.filter(v => v.kind === kind)
    for (let column = 0; column < 6; column++) {
      await clear(page); await cell(page, kind, column).click()
      result.controls.push({ kind, column, mode: 'single', chosen: assertSelectedCrews(await selected(page), fleet, 1, models[column]) })
    }
    await clear(page); await cell(page, kind, 1).click(); await cell(page, kind, 1).click()
    assertSelectedCrews(await selected(page), fleet, 2, 2)
    await clear(page); await cell(page, kind, 1).click({ modifiers: ['Control'] })
    result.controls.push({ kind, mode: 'five', chosen: assertSelectedCrews(await selected(page), fleet, 5, 2) })
    await clear(page); await cell(page, kind, 1).click({ modifiers: ['Shift', 'Control'] })
    result.controls.push({ kind, mode: 'shift-wins', chosen: assertSelectedCrews(await selected(page), fleet, 6, 2) })
    await clear(page); await cell(page, kind, 2).click({ modifiers: ['Shift'] })
    assertSelectedCrews(await selected(page), fleet, 2, 3)
    await clear(page)
    // Native search first prefers an idle driver, even over a much nearer crew.
    const far = fleet.at(-1)
    await vehiclePoint(page, fleet[0].id)
    await page.evaluate(({ fleet, idle }) => {
      const s = window.testSceneRef.current, w = s.world
      for (const v of fleet) w.units.find(u => u.id === v.crew[0].id).native.commandStatus = v.id === idle ? 0 : 3
      s.onChange()
    }, { fleet, idle: far.id })
    await cell(page, kind, 1).click()
    assert.deepEqual((await selected(page)).toSorted(), far.crew.map(p => p.id).toSorted(), 'idle driver outranks nearer busy driver')
    await clear(page)
    await page.evaluate(fleet => { const s = window.testSceneRef.current; for (const v of fleet) s.world.units.find(u => u.id === v.crew[0].id).native.commandStatus = 0; s.onChange() }, fleet)
  }

  // Independent kind/class focus and original task/population memories; right
  // focus must open a genuine vehicle panel without changing simulation bytes.
  await clear(page)
  await page.evaluate(() => { const s = window.testSceneRef.current; s.hudTransportFocus.fill(0); s.world.mode = 'blast' })
  // The actual panel readiness owner caches bit0x100000 in navigationFlags.
  // Stabilize every craft through that owner before asserting all bytes; never
  // mask the cache out of the subsequent nonmutation snapshot.
  result.panelReadiness = await page.evaluate(async () => {
    const w = window.testSceneRef.current.world, { canUnloadVehicle } = await import('/app/vehicle-panel-runtime.ts')
    return w.vehicles.map(v => ({ id: v.id, ready: canUnloadVehicle(w, v), navigationFlags: v.navigationFlags }))
  })
  const beforeFocus = await unchangedState(page)
  await cell(page, 1, 1).click({ button: 'right' }); await render(page, true)
  assert.equal(await page.evaluate(() => window.testSceneRef.current.world.mode), null)
  const first = await focusState(page), firstBoat = first.transport[2]
  assert.ok(craft.some(v => v.id === firstBoat && v.kind === 1))
  assert.equal(await page.evaluate(id => window.testSceneRef.current.objectPanels.panels.has(id), firstBoat), true)
  await cell(page, 1, 1).click({ button: 'right' }); await render(page, true)
  const next = await focusState(page), reverse = craft.filter(v => v.kind === 1).map(v => v.id).toReversed()
  assert.equal(next.transport[2], reverse[(reverse.indexOf(firstBoat) + 1) % reverse.length])
  assert.deepEqual(await unchangedState(page), beforeFocus)
  await cell(page, 1, 2).click({ button: 'right' }); await cell(page, 3, 1).click({ button: 'right' })
  const separate = await focusState(page)
  assert.equal(separate.transport[2], next.transport[2]); assert.ok(separate.transport[3]); assert.ok(separate.transport[10])
  await cell(page, 1, 1).click({ modifiers: ['Shift'] })
  await page.getByRole('button', { name: 'Currently selected Braves', exact: true }).click({ button: 'right' })
  await page.getByRole('button', { name: 'Select brave', exact: true }).click({ button: 'right' })
  const allFocus = await focusState(page)
  assert.deepEqual(allFocus.transport, separate.transport); assert.ok(allFocus.task[13]); assert.ok(allFocus.population[2])
  for (const tab of ['spells', 'buildings', 'followers', 'spells', 'followers']) await page.getByTitle(tab, { exact: true }).click()
  assert.deepEqual(await focusState(page), allFocus); assert.equal(await transportButtons(page).count(), 12)
  result.focus.push({ first, next, separate, allFocus })
  await clear(page); await page.evaluate(() => window.testSceneRef.current.objectPanels.dispose())

  // Supporting gate-state fixtures exercise the rendered primary/right entry
  // points. Only inputMask and a transition stage block focus; overviewActive,
  // gameFlags32, drag and pointerButtons block selection but still allow focus.
  result.gates = []
  for (const kind of [1, 3]) for (const [gate, focusAllowed] of [
    ['inputMask', false], ['overviewStage', false], ['overviewActive', true],
    ['gameFlags32', true], ['drag', true], ['pointerButtons', true],
  ]) {
    await clear(page)
    await page.evaluate(({ gate, kind }) => {
      const s = window.testSceneRef.current, w = s.world
      window.transportGateOriginal = { inputMask: w.inputMask, gameFlags: w.manaWorld.gameFlags,
        overviewStage: s.overviewStage, overviewActive: s.overviewActive, drag: s.drag,
        pointerButtons: s.pointerButtons, focus: [...s.hudTransportFocus], mode: w.mode,
        camera: { ...s.cameraPosition }, cameraBearing: s.cameraBearing, viewPreset: s.viewPreset,
        viewTransition: s.viewTransition, overviewReturn: { ...s.overviewReturn }, globeMorph: { ...s.globeMorph } }
      s.hudTransportFocus[(kind === 1 ? 0 : 8) + 2] = 0
      if (gate === 'inputMask') w.inputMask = 1
      else if (gate === 'overviewStage') s.overviewStage = 'enter'
      else if (gate === 'overviewActive') s.overviewActive = true
      else if (gate === 'gameFlags32') w.manaWorld.gameFlags |= 32
      else if (gate === 'drag') s.drag = { start: { x: 0, y: 0 }, end: { x: 1, y: 1 }, active: true }
      else s.pointerButtons = 1
      s.onChange()
    }, { gate, kind })
    const before = await unchangedState(page)
    await cell(page, kind, 1).click()
    assert.deepEqual(await selected(page), [], `${gate} blocks primary selection`)
    await cell(page, kind, 1).click({ button: 'right' })
    const focused = (await focusState(page)).transport[(kind === 1 ? 0 : 8) + 2]
    assert.equal(!!focused, focusAllowed, `${gate} native right-focus allowance`)
    if (focusAllowed) assert.equal(await page.evaluate(id => window.testSceneRef.current.objectPanels.panels.has(id), focused), true)
    assert.deepEqual(await unchangedState(page), before, `${gate} preserves passengers, craft, orders, selection and RNG`)
    await page.evaluate(async () => {
      const s = window.testSceneRef.current, w = s.world, previous = window.transportGateOriginal,
        { browserPosition } = await import('/app/model.ts')
      w.inputMask = previous.inputMask; w.manaWorld.gameFlags = previous.gameFlags
      s.overviewStage = previous.overviewStage; s.overviewActive = previous.overviewActive
      s.drag = previous.drag; s.pointerButtons = previous.pointerButtons
      s.hudTransportFocus.splice(0, s.hudTransportFocus.length, ...previous.focus)
      s.cameraBearing = previous.cameraBearing; s.viewPreset = previous.viewPreset
      s.viewTransition = previous.viewTransition; s.overviewReturn = previous.overviewReturn
      Object.assign(s.globeMorph, previous.globeMorph)
      s.focus(browserPosition(previous.camera)); w.mode = previous.mode
      s.objectPanels.dispose(); s.onChange(); delete window.transportGateOriginal
    })
    result.gates.push({ kind, gate, focusAllowed, focused })
  }
  // A Followers-tab mode fixture keeps spell/construction targeting active up
  // to the actual row click, rather than letting tab navigation cancel it first.
  result.modeCancellation = []
  for (const kind of [1, 3]) for (const mode of ['blast', 'hut']) {
    await clear(page)
    const before = await page.evaluate(mode => {
      const s = window.testSceneRef.current, w = s.world; w.mode = mode; s.onChange()
      return { orders: JSON.stringify(w.buildingOrders), rng: w.randomState }
    }, mode)
    await cell(page, kind, 1).click()
    assertSelectedCrews(await selected(page), craft.filter(v => v.kind === kind), 1, 2)
    assert.deepEqual(await page.evaluate(() => {
      const w = window.testSceneRef.current.world
      return { mode: w.mode, orders: JSON.stringify(w.buildingOrders), rng: w.randomState }
    }), { mode: null, ...before })
    result.modeCancellation.push({ kind, mode })
  }
  await clear(page)

  // Interrupted presses cannot leak Ctrl selection through a changed tab or a
  // cancelled pointer sequence. Keyboard activation remains a real click path.
  for (const kind of [1, 3]) {
    await page.keyboard.down('Control'); await cell(page, kind, 1).hover(); await page.mouse.down()
    await page.getByTitle('spells', { exact: true }).evaluate(button => button.click())
    await page.mouse.up(); await page.keyboard.up('Control'); assert.deepEqual(await selected(page), [])
    await page.getByTitle('followers', { exact: true }).click()
    await page.keyboard.down('Control'); await cell(page, kind, 1).hover(); await page.mouse.down()
    await cell(page, kind, 1).dispatchEvent('pointercancel')
    await page.mouse.up(); await page.keyboard.up('Control'); assert.deepEqual(await selected(page), [])
    await cell(page, kind, 1).focus(); await page.keyboard.press('Enter')
    assertSelectedCrews(await selected(page), craft.filter(v => v.kind === kind), 1, 2); await clear(page)
  }

  // Native model2/4 variants are searchable but invalidate remembered model1/3
  // focus. Repeated right-click reacquires, rather than cycling these variants.
  result.variants = []
  for (const kind of [1, 3]) {
    const fleet = craft.filter(v => v.kind === kind)
    await page.evaluate(({ fleet, kind }) => { const s = window.testSceneRef.current; for (const v of fleet) s.world.vehicles.find(x => x.id === v.id).model = kind + 1; s.hudTransportFocus.fill(0); s.onChange() }, { fleet, kind })
    const ids = []
    for (let i = 0; i < 4; i++) { await cell(page, kind, 1).click({ button: 'right' }); ids.push((await focusState(page)).transport[(kind === 1 ? 0 : 8) + 2]) }
    assert.ok(ids[0]); assert.ok(ids.every(id => id === ids[0]), 'native variant focus reacquires the same nearest craft')
    await page.evaluate(({ fleet, kind }) => { const s = window.testSceneRef.current; for (const v of fleet) s.world.vehicles.find(x => x.id === v.id).model = kind; s.objectPanels.dispose(); s.onChange() }, { fleet, kind })
    result.variants.push({ kind, ids })
  }

  // Boat command16 is a real shipped control. Its apparent owner changes at
  // command completion while real-owner counts remain. Do not send this command
  // to the Balloon: its earlier commandPosition boundary remains unported.
  const spyBoat = craft.find(v => v.kind === 1 && v.crew.some(p => p.model === 5)), spy = spyBoat.crew.find(p => p.model === 5)
  await clear(page); await cell(page, 1, 5).click()
  assert.deepEqual((await selected(page)).toSorted(), spyBoat.crew.map(p => p.id).toSorted())
  assert.equal(await page.evaluate(id => window.testSceneRef.current.world.vehicles.find(v => v.id === id).passengers[0], spyBoat.id), spy.id, 'supporting Boat Spy is the actual driver')
  const disguise = page.getByRole('button', { name: /^Disguise selected spies as / }).first()
  const disguiseLabel = await disguise.getAttribute('aria-label'); await disguise.click()
  const owner = await page.evaluate(async ({ id, spy }) => {
    const s = window.testSceneRef.current, w = s.world, { tick } = await import('/app/model.ts')
    tick(w, 1 / 12); s.onChange()
    const v = w.vehicles.find(v => v.id === id), p = w.units.find(u => u.id === spy).native
    return { real: v.team, apparent: v.apparentTribe, state: p.state, disguise: p.disguise, passengers: [...v.passengers] }
  }, { id: spyBoat.id, spy: spy.id })
  assert.equal(owner.real, 'blue'); assert.notEqual(owner.apparent, 0); assert.equal(owner.state, 30); assert.equal(owner.disguise & 63, 63)
  await render(page)
  const disguisedAppearance = await vehicleAppearance(page, spyBoat.id, owner.apparent)
  assert.deepEqual(await counts(page, 1), [6, 6, 2, 1, 1, 1])
  await clear(page); await cell(page, 1, 5).click(); assert.deepEqual(await selected(page), [], 'counted disguised craft is not selectable by apparent owner')
  await cell(page, 1, 5).click({ button: 'right' }); assert.equal((await focusState(page)).transport[5], 0)
  await cell(page, 1, 1).click({ modifiers: ['Shift'] })
  assertSelectedCrews(await selected(page), craft.filter(v => v.kind === 1 && v.id !== spyBoat.id), 5)
  const savedRows = await rows(page), saved = await unchangedState(page)
  await checkpoint(page, saved)
  assert.deepEqual(await rows(page), savedRows); assert.deepEqual(await selected(page), saved.selected)
  assert.equal(await page.evaluate(() => JSON.stringify(window.testSceneRef.current.world.vehicles)), saved.vehicles)
  assert.ok((await focusState(page)).transport.every(v => v === 0), 'world replacement resets scene-local transport memory')
  const afterCountdown = await page.evaluate(async ({ id, spy, craft }) => {
    const s = window.testSceneRef.current, w = s.world, { tick } = await import('/app/model.ts')
    for (let i = 0; i < 63; i++) tick(w, 1 / 12)
    s.onChange(); s.animate(s.previous); cancelAnimationFrame(s.frame)
    const v = w.vehicles.find(v => v.id === id), p = w.units.find(u => u.id === spy).native
    return { real: v.team, apparent: v.apparentTribe, state: p.state, disguise: p.disguise, vehicle: p.vehicle,
      held: craft.flatMap(v => v.crew.map(({ id }) => { const p = w.units.find(u => u.id === id).native; return { id, state: p.state, speed: p.speed, vehicle: p.vehicle, expectedVehicle: v.id } })) }
  }, { id: spyBoat.id, spy: spy.id, craft })
  assert.equal(afterCountdown.apparent, owner.apparent); assert.equal(afterCountdown.disguise & 63, 0); assert.equal(afterCountdown.state, 30); assert.equal(afterCountdown.vehicle, spyBoat.id)
  assert.equal(afterCountdown.held.length, craft.flatMap(v => v.crew).length)
  assert.ok(afterCountdown.held.every(p => p.state === 30 && p.speed === 0 && p.vehicle === p.expectedVehicle), JSON.stringify(afterCountdown.held))
  result.ownership = { disguiseLabel, owner, afterCountdown, checkpointRows: savedRows, disguisedAppearance,
    restoredAppearance: await vehicleAppearance(page, spyBoat.id, owner.apparent) }
  await clear(page)

  // Supporting inverse-owner fixture: a real enemy craft still accepts row
  // selection when its apparent owner is Blue, while dropping from counts.
  await page.evaluate(id => { const s = window.testSceneRef.current, v = s.world.vehicles.find(v => v.id === id); v.team = 'red'; v.apparentTribe = 0; s.onChange() }, spyBoat.id)
  assert.deepEqual(await counts(page, 1), [5, 5, 2, 1, 1, 0])
  await render(page)
  result.ownership.inverseAppearance = await vehicleAppearance(page, spyBoat.id, 0)
  assert.equal(result.ownership.inverseAppearance.realTeam, 'red')
  await cell(page, 1, 5).click(); assert.deepEqual((await selected(page)).toSorted(), spyBoat.crew.map(p => p.id).toSorted())
  await clear(page)
  await page.evaluate(id => { const s = window.testSceneRef.current; s.world.vehicles.find(v => v.id === id).team = 'blue'; s.onChange() }, spyBoat.id)

  // Class disappearance is independent of row presence. Existing class with no
  // passenger retains enabled cells; temporarily setting only added Preachers'
  // hp to zero removes that class without touching the authored population.
  const preachers = craft.flatMap(v => v.crew.filter(p => p.model === 4).map(p => p.id))
  const hp = await page.evaluate(ids => { const s = window.testSceneRef.current, hp = ids.map(id => s.world.units.find(u => u.id === id).hp); ids.forEach(id => { s.world.units.find(u => u.id === id).hp = 0 }); s.onChange(); return hp }, preachers)
  for (const kind of [1, 3]) { assert.equal(await cell(page, kind, 4).isDisabled(), true); assert.equal((await counts(page, kind))[4], 0); assert.equal(await cell(page, kind, 0).isEnabled(), true) }
  await page.evaluate(({ ids, hp }) => { const s = window.testSceneRef.current; ids.forEach((id, i) => { s.world.units.find(u => u.id === id).hp = hp[i] }); s.onChange() }, { ids: preachers, hp })
  for (const kind of [1, 3]) assert.equal(await cell(page, kind, 4).isEnabled(), true)

  // Presence is real-owner and lifetime driven, including owned empty wrecks.
  // All changes below are restored before simulation resumes.
  result.presence = []
  for (const kind of [1, 3]) {
    const presence = await page.evaluate(kind => {
      const s = window.testSceneRef.current, w = s.world, fleet = w.vehicles.filter(v => v.model === kind)
      const old = fleet.map(v => ({ id: v.id, team: v.team })); fleet.forEach(v => { v.team = 'red' })
      s.onChange(); return { old, kind }
    }, kind)
    assert.equal(await cell(page, kind, 0).count(), 0, 'apparent ownership cannot keep a real-enemy row visible')
    const empty = await page.evaluate(kind => {
      const s = window.testSceneRef.current, w = s.world, template = w.vehicles.find(v => v.model === kind)
      const v = { ...structuredClone(template), id: w.nextId++, team: 'blue', apparentTribe: 2, passengers: [], passengerCount: 0 }
      w.vehicles.push(v); s.onChange(); return v.id
    }, kind)
    assert.deepEqual(await counts(page, kind), [0, 0, 0, 0, 0, 0]); assert.equal(await cell(page, kind, 0).isEnabled(), true); assert.equal(await cell(page, kind, 4).isEnabled(), true)
    await page.evaluate(id => { const s = window.testSceneRef.current, v = s.world.vehicles.find(v => v.id === id); v.active = false; v.destructionState = 5; s.onChange() }, empty)
    assert.equal(await cell(page, kind, 0).count(), 1, 'visible empty wreck keeps row presence')
    await page.evaluate(id => { const s = window.testSceneRef.current; s.world.vehicles.find(v => v.id === id).destructionState = 0; s.onChange() }, empty)
    assert.equal(await cell(page, kind, 0).count(), 0, 'disposed last craft removes row')
    await page.evaluate(({ old, empty }) => { const s = window.testSceneRef.current; s.world.vehicles = s.world.vehicles.filter(v => v.id !== empty); for (const v of old) s.world.vehicles.find(x => x.id === v.id).team = v.team; s.onChange() }, { ...presence, empty })
    result.presence.push({ kind, empty, restored: await counts(page, kind) })
  }

  // Raw-camera strict radius is based on the craft, not its physical passenger
  // seat. Camera-only updates must not mutate units, orders or random state.
  const spyBalloon = craft.find(v => v.kind === 3 && v.crew.some(p => p.model === 5))
  const nearby = await page.evaluate(async id => {
    const s = window.testSceneRef.current, w = s.world, { browserPosition } = await import('/app/model.ts'), { syncLiveVehiclePassengers } = await import('/app/live-vehicles.ts'), v = w.vehicles.find(v => v.id === id)
    const previous = { x: v.x, y: v.y, flags: w.castingTribes[0].flags, camera: { ...s.cameraPosition } }, center = { x: 1234, y: 5678 }
    v.x = center.x + 6144; v.y = center.y; syncLiveVehiclePassengers(w, v)
    w.castingTribes[0].flags |= 128; s.focus(browserPosition(center)); s.onChange()
    return { id, previous, center }
  }, spyBalloon.id)
  await page.waitForFunction(() => document.querySelector('[aria-label="Balloons occupied by Spies"] .follower-number')?.getAttribute('aria-label') === '0')
  assert.equal(await cell(page, 3, 5).isEnabled(), true)
  const cameraBefore = await unchangedState(page)
  await page.evaluate(async center => { const s = window.testSceneRef.current, { browserPosition } = await import('/app/model.ts'); s.focus(browserPosition({ x: center.x + 1, y: center.y })); s.onChange() }, nearby.center)
  await page.waitForFunction(() => document.querySelector('[aria-label="Balloons occupied by Spies"] .follower-number')?.getAttribute('aria-label') === '1')
  for (const column of [0, 5]) {
    const count = (await counts(page, 3))[column]
    assert.deepEqual(await cell(page, 3, column).locator('.follower-number .hud-sprite').evaluateAll(nodes => nodes.map(n => n.style.backgroundPosition)), numberGlyphs(count, true).map(id => `-${hud.rects[id].x}px -${hud.rects[id].y}px`))
    result.pixels.push(await sourcePixels(page, output, 3, column, false, '-nearby'))
  }
  await page.keyboard.down('ArrowUp')
  const moving = await page.evaluate(id => {
    const s = window.testSceneRef.current, v = s.world.vehicles.find(v => v.id === id)
    for (let i = 0; i < 8; i++) s.updateCameraMotion(1 / 24)
    s.onChange(); const dx = ((s.cameraPosition.x - v.x) << 16) >> 16, dy = ((s.cameraPosition.y - v.y) << 16) >> 16
    return { camera: { ...s.cameraPosition }, count: Number(dx * dx + dy * dy < 0x2400000) }
  }, spyBalloon.id)
  await page.keyboard.up('ArrowUp')
  assert.notDeepEqual([moving.camera.x, moving.camera.y], [nearby.center.x + 1, nearby.center.y])
  await page.waitForFunction(count => Number(document.querySelector('[aria-label="Balloons occupied by Spies"] .follower-number')?.getAttribute('aria-label')) === count, moving.count)
  assert.deepEqual(await unchangedState(page), cameraBefore)
  await page.evaluate(async ({ id, previous }) => {
    const s = window.testSceneRef.current, { browserPosition } = await import('/app/model.ts'), { syncLiveVehiclePassengers } = await import('/app/live-vehicles.ts'), v = s.world.vehicles.find(v => v.id === id)
    v.x = previous.x; v.y = previous.y; syncLiveVehiclePassengers(s.world, v); s.world.castingTribes[0].flags = previous.flags; s.focus(browserPosition(previous.camera)); s.onChange()
  }, nearby)
  result.nearby = { ...nearby, moving }

  // Actual vehicle-panel unload updates occupied/class counters immediately.
  // Empty owned craft remain visible; passenger ejection itself is covered by
  // the accepted panel checker, rather than duplicated here.
  for (const kind of [1, 3]) {
    const v = craft.find(v => v.kind === kind), before = await counts(page, kind)
    await clear(page); await vehiclePoint(page, v.id)
    await page.evaluate(({ kind, id }) => { window.testSceneRef.current.hudTransportFocus[(kind === 1 ? 0 : 8) + 2] = id }, { kind, id: 0 })
    await cell(page, kind, 1).click({ button: 'right' }); await render(page, true)
    const target = (await focusState(page)).transport[(kind === 1 ? 0 : 8) + 2]
    assert.equal(target, v.id, 'authored craft nearest its own camera')
    const panel = page.getByRole('group', { name: `${kind === 1 ? 'Boat' : 'Balloon'}: 2 passengers`, exact: true })
    await panel.getByRole('button', { name: 'Unload all passengers', exact: true }).click(); await render(page)
    assert.equal(await page.evaluate(id => window.testSceneRef.current.world.vehicles.find(v => v.id === id).passengerCount, v.id), 0)
    assert.deepEqual(await counts(page, kind), before.map((n, column) => n - Number([0, 1, 2].includes(column))))
    await page.screenshot({ path: resolve(output, `transport-${kind}-unloaded.png`) })
    await page.evaluate(() => window.testSceneRef.current.objectPanels.dispose())
  }

  for (const viewport of [{ width: 1280, height: 720 }, { width: 1920, height: 1080 }, { width: 3440, height: 1440 }]) {
    await page.setViewportSize(viewport)
    for (const size of ['auto', '1', '2', '4']) {
      await page.getByRole('button', { name: 'Menu', exact: true }).click()
      await page.getByRole('combobox', { name: 'HUD size', exact: true }).selectOption(size)
      await page.getByRole('button', { name: 'Close menu', exact: true }).click()
      const layout = await transportLayout(page)
      assertTransportLayout(layout, viewport)
      result.layouts.push({ viewport, size, ...layout })
    }
  }
  // A separate browser context exercises actual DPR2 backing pixels, not just
  // CSS/HUD scaling. Its Blue crews are explicitly staged on authored craft.
  const dprContext = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 })
  try {
    const dp = await dprContext.newPage()
    dp.setDefaultTimeout(45000)
    dp.on('pageerror', error => receipt.errors.push(String(error)))
    dp.on('console', message => { if (message.type() === 'error') receipt.errors.push(message.text()) })
    await dp.goto(url, { waitUntil: 'domcontentloaded' }); await showAllMissions(dp)
    await dp.getByRole('button', { name: 'Mission 22', exact: true }).focus(); await dp.keyboard.press('Enter'); await bindGame(dp)
    await dp.waitForFunction(() => window.testSceneRef.current.world.flyby.flags & 1 || !window.testSceneRef.current.world.inputMask)
    const skip = dp.locator('.skip-introduction'); if (await skip.isVisible()) await skip.click()
    await dp.waitForFunction(() => !window.testSceneRef.current.world.inputMask); await freeze(dp); await clear(dp)
    const dprCraft = await dp.evaluate(async () => {
      const s = window.testSceneRef.current, w = s.world, { addUnit, browserPosition } = await import('/app/model.ts'),
        { createLivePerson, changeLivePersonState } = await import('/app/live-people.ts'), { boardLiveVehicle } = await import('/app/live-vehicles.ts')
      const records = []
      for (const kind of [1, 3]) {
        const v = w.vehicles.find(v => v.model === kind)
        const crew = [['brave', 2], ['warrior', 3]].map(([kind, model]) => {
          const u = addUnit(w, 'blue', kind, browserPosition(v)); u.native = createLivePerson(w, u); w.pathfinding.people.set(u.id, u.native)
          if (!boardLiveVehicle(w, u.native, v)) throw Error('DPR2 supporting crew attachment failed')
          changeLivePersonState(w, u, 30)
          if (u.native.state !== 30 || u.native.speed !== 0) throw Error('DPR2 supporting crew did not hold aboard')
          return { id: u.id, model }
        })
        records.push({ id: v.id, kind, crew })
      }
      s.onChange(); return records
    })
    await dp.getByTitle('followers', { exact: true }).click(); await render(dp)
    assert.equal(await dp.evaluate(() => devicePixelRatio), 2)
    assert.equal(await transportButtons(dp).count(), 12)
    const layout = await transportLayout(dp)
    assertTransportLayout(layout, { width: 1280, height: 720 })
    for (const kind of [1, 3]) {
      assert.deepEqual(await counts(dp, kind), [1, 1, 1, 0, 0, 0])
      await cell(dp, kind, 1).click(); assertSelectedCrews(await selected(dp), dprCraft.filter(v => v.kind === kind), 1, 2)
      await cell(dp, kind, 1).click({ button: 'right' }); await render(dp, true)
      assert.equal(await dp.getByRole('group', { name: `${kind === 1 ? 'Boat' : 'Balloon'}: 2 passengers`, exact: true }).isVisible(), true)
      await dp.evaluate(() => window.testSceneRef.current.objectPanels.dispose()); await clear(dp)
      result.pixels.push(await sourcePixels(dp, output, kind, kind === 1 ? 0 : 1, false, '-dpr2'))
    }
    await dp.mouse.move(900, 400); await render(dp)
    await dp.locator('.native-hud').screenshot({ path: resolve(output, 'transport-dpr2-hud.png') })
    await dp.screenshot({ path: resolve(output, 'transport-dpr2-scene.png') })
    result.dpr2 = { viewport: dp.viewportSize(), devicePixelRatio: 2, ...layout, craft: dprCraft, supportingCrew: true }
  } finally { await dprContext.close() }

  const retained = await page.evaluate(ids => {
    const w = window.testSceneRef.current.world
    return { people: w.units.filter(u => ids.includes(u.id)).map(u => ({ id: u.id, team: u.team, kind: u.kind })), status: w.status }
  }, opening.authoredPeople.map(p => p.id))
  assert.deepEqual(retained.people, opening.authoredPeople, 'all authored people retained')
  assert.equal(retained.status, opening.status, 'checker did not force mission victory')
  assert.deepEqual(receipt.errors, [])
  result.retained = retained
  writeFileSync(resolve(output, 'follower-transports-results.json'), JSON.stringify(result, null, 2) + '\n')
  return result
}
