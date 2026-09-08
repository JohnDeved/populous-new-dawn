// Start npm run dev, then node scripts/check-browser-scenery-fire.mjs.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame, effectPixels } from './browser-game.mjs'
import { fireUV } from '../app/scenery-fire.ts'

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.getByRole('button', { name: 'Enable sound', exact: true }).click()
  await page.getByRole('button', { name: 'Mute sound', exact: true }).waitFor()
  await page.evaluate(() => {
    const scene = window.testScene
    window.burnTree = scene.world.trees.find(t => t.id === 21)
    scene.world.shots.lightning = 1
    scene.world.speed = 0
    scene.focus(window.burnTree)
    scene.onChange()
  })
  const shadows = await page.evaluate(() => {
    const s = window.testScene, saved = new Uint8Array(s.world.land.shadows)
    const cells = [...s.world.sceneryShadows.values()].map(p => (p.anchorY >> 9) * 128 + (p.anchorX >> 9))
    const gl = s.renderer.getContext()
    const pixels = () => {
      s.renderer.render(s.scene, s.camera)
      const data = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
      gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, data)
      return data
    }
    window.treeShadowBaseline = enabled => {
      s.world.land.shadows.set(saved)
      if (enabled) for (const i of cells) if (!(s.world.land.flags[i] & 0x200)) s.world.land.shadows[i] &= 240
      s.updateTerrainTexture()
    }
    window.treeShadowBaseline(true)
    const before = pixels()
    window.treeShadowBaseline(false)
    const after = pixels()
    let changed = 0
    for (let i = 0; i < before.length; i += 4)
      if (before[i] !== after[i] || before[i + 1] !== after[i + 1] || before[i + 2] !== after[i + 2]) changed++
    const p = s.world.sceneryShadows.get(window.burnTree.id)
    window.burnTreeCell = (p.anchorY >> 9) * 128 + (p.anchorX >> 9)
    return { changed, shaded: cells.filter(i => saved[i] & 15).length, target: saved[window.burnTreeCell] & 15 }
  })
  assert.ok(shadows.changed > 100, `Scenery shade affected only ${shadows.changed} pixels`)
  assert.ok(shadows.shaded > 0)
  assert.equal(shadows.target, 6)
  await page.evaluate(() => window.treeShadowBaseline(true))
  await page.screenshot({ path: '/private/tmp/populous-scenery-shadows-before.png' })
  await page.evaluate(() => window.treeShadowBaseline(false))
  await page.screenshot({ path: '/private/tmp/populous-scenery-shadows-after.png' })
  await page.evaluate(() => { window.testScene.world.speed = 0.25 })
  await page.keyboard.press('3')
  const target = await page.evaluate(() => {
    const scene = window.testScene, point = scene.screen(window.burnTree)
    const rect = scene.container.getBoundingClientRect()
    return { x: rect.left + (point.x + 1) * rect.width / 2, y: rect.top + (1 - point.y) * rect.height / 2 }
  })
  await page.mouse.click(target.x, target.y)
  await page.waitForFunction(() => {
    const scene = window.testScene
    const fire = scene.world.effects.find(f => f.fire?.smokeOnExpiry && f.fire.scale >= 300)
    if (!fire || !scene.fxMeshes.has(fire.id)) return false
    scene.world.speed = 0
    window.burnFire = fire
    return true
  }).catch(async error => {
    console.error(await page.evaluate(() => ({ mode: window.testScene.world.mode,
      effects: window.testScene.world.effects.map(f => f.kind), tree: window.burnTree,
      shaman: window.testScene.world.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
      shots: window.testScene.world.shots, inputMask: window.testScene.world.inputMask })))
    await page.screenshot({path:'/private/tmp/populous-fire-timeout-v111.png'})
    throw error
  })
  const first = await page.evaluate(() => {
    const scene = window.testScene, fx = window.burnFire, tree = window.burnTree
    const mesh = scene.fxMeshes.get(fx.id).children[0]
    const treeMesh = scene.decorations.children.find(g => g.userData.point === tree).children[0]
    return { id: fx.id, frame: fx.fire.frame, scale: fx.fire.scale, meshScale: mesh.userData.nativeSize,
      uv: Array.from(mesh.geometry.attributes.uv.array), model: mesh.userData.nativeModel,
      wood: tree.burn.wood, treeScale: tree.burn.scale, treeMeshScale: treeMesh.userData.nativeSize,
      position: scene.fxMeshes.get(fx.id).position.toArray(), h: fx.fire.h,
      sound: scene.world.sounds.some(s => s.cue === 6 && s.owner === fx.id) }
  })
  assert.equal(first.model, 5)
  assert.equal(first.meshScale, first.scale)
  assert.deepEqual(first.uv, Array.from(new Float32Array(fireUV(first.frame))))
  assert.equal(first.position[1] * 128, first.h)
  assert.ok(first.wood < 400)
  assert.equal(first.treeScale, first.treeMeshScale)
  assert.ok(first.sound)
  const pixels = await effectPixels(page, [first.id])
  assert.ok(pixels > 100, `Fire contributed only ${pixels} pixels`)
  await page.screenshot({ path: '/private/tmp/populous-scenery-fire.png' })
  await page.evaluate(() => { window.testScene.world.speed = 0.25 })
  await page.waitForFunction(frame => window.burnFire.fire.frame !== frame, first.frame)
  await page.evaluate(() => { window.testScene.world.speed = 0 })
  const bearing = await page.evaluate(() => window.testScene.cameraBearing)
  await page.keyboard.down('q')
  await page.waitForFunction(bearing => window.testScene.cameraBearing !== bearing, bearing)
  await page.keyboard.up('q')
  assert.notEqual(await page.evaluate(() => window.testScene.cameraBearing), bearing)
  assert.ok(await effectPixels(page, [first.id]) > 100)
  await page.screenshot({ path: '/private/tmp/populous-scenery-fire-rotated.png' })
  await page.evaluate(() => { window.testScene.world.speed = 1 })
  await page.waitForFunction(() => {
    const scene = window.testScene
    if (!scene.world.effects.some(f => f.smoke)) return false
    scene.world.speed = 0
    return true
  })
  await page.evaluate(() => { window.testScene.world.speed = 1 })
  await page.waitForFunction(() => {
    const scene = window.testScene
    return !scene.world.effects.includes(window.burnFire) && !scene.fxMeshes.has(window.burnFire.id)
      && window.burnTree.logs === 0 && !scene.decorations.children.some(g => g.userData.point === window.burnTree)
  }).catch(async error => {
    console.error(await page.evaluate(() => ({turn:window.testScene.world.turn,speed:window.testScene.world.speed,
      tree:window.burnTree,fire:window.burnFire,
      effect:window.testScene.world.effects.includes(window.burnFire),mesh:window.testScene.fxMeshes.has(window.burnFire.id),
      treeMesh:window.testScene.decorations.children.some(g=>g.userData.point===window.burnTree)})))
    throw error
  })
  assert.equal(await page.evaluate(() => window.testScene.world.land.shadows[window.burnTreeCell] & 15), 0)
  assert.deepEqual(errors, [])
  console.log(`PASS: scenery ground shade (${shadows.changed} GPU pixels); real Lightning ignites tree, original fire model/animated UVs (${pixels} GPU pixels), native grounding/scale, tree shrink, shade clears on removal, camera rotation, sound request, smoke and cleanup; no browser errors`)
} finally {
  await browser.close()
}
