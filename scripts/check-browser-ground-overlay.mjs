// Start npm run dev, then node scripts/check-browser-ground-overlay.mjs.
import { chromium } from '@playwright/test'
import assert from 'node:assert/strict'
import {
  buildingPlanCells,
  buildingFootprintCells,
  buildingPosition,
} from '../app/building-shapes.ts'
import { openGame } from './browser-game.mjs'
import { browserPosition } from '../app/model.ts'
const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  page.setDefaultTimeout(15000)
  await page.waitForFunction(
    () => !window.testScene.world.inputMask && window.testScene.terrainTextures
  )
  await page.evaluate(() => {
    const s = window.testScene
    s.world.speed = 0
    s.focus({ x: 2, z: 34 })
    s.onChange()
  })
  await page.waitForFunction(() => !window.testScene.cameraMotion.active)
  await page.getByRole('button', { name: 'buildings B', exact: true }).click()
  await page.getByRole('button', { name: 'Hut, 3 wood', exact: true }).click()
  async function move(p) {
    const q = await page.evaluate(p => {
      const s = window.testScene,
        q = s.screen(p, Math.max(0, s.y(p))),
        r = s.container.getBoundingClientRect()
      return { x: r.left + ((q.x + 1) * r.width) / 2, y: r.top + ((1 - q.y) * r.height) / 2 }
    }, p)
    await page.mouse.move(q.x, q.y)
    await page
      .waitForFunction(p => {
        const s = window.testScene,
          q = s.pointer
        return s.cursor.visible && q && Math.hypot(q.x - p.x, q.z - p.z) < 0.2
      }, p)
      .catch(async error => {
        console.error(
          'Placement pointer mismatch',
          await page.evaluate(
            ({ p, q }) => ({
              target: p,
              mouse: q,
              point: window.testScene.pointer,
              bearing: window.testScene.cameraBearing,
              cursor: window.testScene.cursor.userData,
              mode: window.testScene.world.mode,
              motion: window.testScene.cameraMotion,
            }),
            { p, q }
          )
        )
        await page.screenshot({ path: '/private/tmp/populous-placement-pointer-failure.png' })
        throw error
      })
    return q
  }
  const stone = await move({ x: 4.3, z: 32.3 })
  await page.waitForFunction(() => window.testScene.cursor.userData.invalid)
  const originalCount = await page.evaluate(() => window.testScene.world.buildings.length)
  await page.mouse.click(stone.x, stone.y)
  assert.equal(await page.evaluate(() => window.testScene.world.buildings.length), originalCount)
  await move({ x: -1.7, z: 32.3 })
  const valid = await page.evaluate(() => {
    const s = window.testScene,
      m = s.cursor,
      r = s.renderer,
      gl = r.getContext(),
      w = gl.drawingBufferWidth,
      h = gl.drawingBufferHeight,
      a = new Uint8Array(w * h * 4),
      b = new Uint8Array(a.length)
    r.render(s.scene, s.camera)
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, a)
    m.visible = false
    r.render(s.scene, s.camera)
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, b)
    m.visible = true
    let pixels = 0
    for (let i = 0; i < a.length; i += 4)
      if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) pixels++
    m.geometry.setDrawRange(0, m.geometry.getAttribute('position').count - 6)
    r.render(s.scene, s.camera)
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, b)
    m.geometry.setDrawRange(0, Infinity)
    let arrowPixels = 0
    for (let i = 0; i < a.length; i += 4)
      if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) arrowPixels++
    const position = m.geometry.getAttribute('position')
    let grounded = true
    for (let i = 0; i < position.count; i++) {
      const x = Math.round((position.getX(i) + 8) * 256) & 65535,
        y = Math.round((-position.getZ(i) - 8) * 256) & 65535,
        j = (y >>> 9) * 128 + (x >>> 9)
      if (position.getY(i) * 128 !== s.world.land.heights[j]) grounded = false
    }
    return {
      pixels,
      arrowPixels,
      cells: m.userData.cells,
      invalid: m.userData.invalid,
      grounded,
      vertices: position.count,
      texture: m.material.map.image.src,
      uv: Array.from(m.geometry.getAttribute('uv').array),
      key: s.placementState,
    }
  })
  assert.equal(valid.invalid, false)
  assert.equal(valid.grounded, true)
  assert.ok(valid.pixels > 500, JSON.stringify(valid))
  assert.match(valid.texture, /original\/atlas.png$/)
  assert.ok(
    valid.arrowPixels > 10,
    `Entrance arrow contributed only ${valid.arrowPixels} GPU pixels`
  )
  const pose = { object: 107, angle: 0, anchorX: 1536, anchorY: 54784 }
  const expected = buildingPlanCells(pose)
  assert.deepEqual(valid.cells, [...expected.cells, expected.entrance])
  assert.equal(valid.vertices, valid.cells.length * 6)
  assert.ok(valid.uv.every(v => v >= 0 && v <= 1))
  await page.screenshot({ path: '/private/tmp/populous-ground-placement.png' })
  // Space rotates the entrance, keeps simulation unpaused, and wraps after four turns.
  await page.locator('.world-viewport canvas[tabindex]').focus()
  for (let turn = 1; turn <= 4; turn++) {
    await page.keyboard.press('Space')
    const direction = turn & 3,
      plan = buildingPlanCells({ ...pose, angle: direction * 512 })
    await page.waitForFunction(
      ({ direction, entrance }) => {
        const s = window.testScene
        return (
          s.world.buildingDirections.hut === direction && s.cursor.userData.entrance === entrance
        )
      },
      { direction, entrance: plan.entrance }
    )
    assert.equal(await page.evaluate(() => window.testScene.world.paused), false)
  }
  await page.keyboard.press('Space') // Place facing the second direction below.
  await page.waitForFunction(() => window.testScene.world.buildingDirections.hut === 1)
  await page.screenshot({ path: '/private/tmp/populous-ground-placement-rotated.png' })
  // Crossing a terrain cell changes the footprint; turning the camera repicks a stationary pointer.
  await move({ x: 6.3, z: 32.3 })
  assert.notEqual(await page.evaluate(() => window.testScene.placementState), valid.key)
  const beforeTurn = await page.evaluate(() => ({
    bearing: window.testScene.cameraBearing,
    point: { ...window.testScene.pointer },
  }))
  await page.locator('.world-viewport canvas[tabindex]').focus()
  await page.keyboard.down('q')
  await page.waitForTimeout(250)
  await page.keyboard.up('q')
  assert.ok(
    await page.evaluate(old => {
      const s = window.testScene,
        p = s.pointer
      return (
        s.cameraBearing !== old.bearing &&
        p &&
        Math.hypot(p.x - old.point.x, p.z - old.point.z) > 0.1
      )
    }, beforeTurn)
  )
  // Invalid terrain uses native red tint and rejects a real click without placing a building.
  const bad = await move({ x: -4, z: 42 })
  await page.waitForFunction(() => window.testScene.cursor.userData.invalid)
  assert.ok(
    await page.evaluate(() => {
      const c = window.testScene.cursor.geometry.getAttribute('color')
      return c.getX(0) > c.getY(0) * 10
    })
  )
  const count = await page.evaluate(() => window.testScene.world.buildings.length)
  await page.mouse.click(bad.x, bad.y)
  assert.equal(await page.evaluate(() => window.testScene.world.buildings.length), count)
  await page.screenshot({ path: '/private/tmp/populous-ground-invalid.png' })
  await page.mouse.move(100, 500)
  await page.waitForFunction(() => !window.testScene.cursor.visible)
  await page.evaluate(() => window.testScene.focus({ x: 2, z: 34 }))
  await page.waitForFunction(() => !window.testScene.cameraMotion.active)
  await page.getByRole('button', { name: 'Hut, 3 wood', exact: true }).click()
  const good = await move({ x: -1.7, z: 32.3 })
  await page.mouse.click(good.x, good.y)
  await page.waitForFunction(n => window.testScene.world.buildings.length === n + 1, count)
  await page.waitForFunction(
    () => !window.testScene.cursor.visible && window.testScene.world.mode === null
  )
  const placed = await page.evaluate(() => {
    const b = window.testScene.world.buildings.at(-1)
    return { x: b.x, z: b.z, angle: b.angle }
  })
  assert.deepEqual(placed, {
    ...browserPosition(buildingPosition({ ...pose, angle: 512 })),
    angle: Math.PI / 2,
  })
  await page.waitForFunction(() => {
    const s = window.testScene,
      b = s.world.buildings.at(-1)
    return s.plans.has(b.id) && !s.buildingMeshes.has(b.id)
  })
  await page.screenshot({ path: '/private/tmp/populous-ground-placed-rotated.png' })
  // Cancellation also clears a live preview.
  await page.getByRole('button', { name: 'Hut, 3 wood', exact: true }).click()
  await move({ x: -1.7, z: 32.3 })
  await page.locator('.world-viewport canvas[tabindex]').focus()
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => !window.testScene.cursor.visible)
  // A later terrain edit must invalidate the placed plan and retire its artwork.
  const cell = buildingFootprintCells({ ...pose, angle: 512 })[0]
  const vertex = browserPosition({ x: (cell & 127) * 512, y: (cell >> 7) * 512 })
  const planId = await page.evaluate(() => window.testScene.world.buildings.at(-1).id)
  await page.evaluate(
    ({ vertex, planId }) => {
      const w = window.testScene.world
      if (!w.buildings.find(b => b.id === planId)?.preparation)
        throw new Error('Expected unbuilt plan')
      w.terrain[(vertex.z + 48) * 97 + vertex.x + 48] += 10
      w.terrainVersion++
      w.speed = 1
    },
    { vertex, planId }
  )
  await page.waitForFunction(id => {
    const s = window.testScene
    return (
      !s.world.buildings.some(b => b.id === id) && !s.plans.has(id) && !s.buildingMeshes.has(id)
    )
  }, planId)
  assert.ok(
    await page.evaluate(id => window.testScene.world.units.every(u => u.work !== id), planId)
  )
  assert.deepEqual(errors, [])
  console.log(
    `PASS: original placement tiles and entrance (${valid.cells.length} cells, ${valid.pixels} GPU pixels; ${valid.arrowPixels} arrow pixels), grounding, four Space rotations without pausing, camera turn, invalid rejection, snapped/oriented placement, cancellation, protected stones and terrain invalidation with plan-artwork removal; no browser errors`
  )
} finally {
  await browser.close()
}
