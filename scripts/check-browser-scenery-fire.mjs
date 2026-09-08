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
    scene.world.speed = 0.25
    scene.focus(window.burnTree)
    scene.onChange()
  })
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
  await page.waitForTimeout(250)
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
  })
  assert.deepEqual(errors, [])
  console.log(`PASS: real Lightning ignites tree, original fire model/animated UVs (${pixels} GPU pixels), native grounding/scale, tree shrink, camera rotation, sound request, smoke and cleanup; no browser errors`)
} finally {
  await browser.close()
}
