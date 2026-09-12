// Start npm run dev, then node scripts/check-browser-reincarnation.mjs.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { reincarnationStones } from '../app/reincarnation.ts'
import { browserPosition } from '../app/model.ts'
import { effectPixels } from './browser-game.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(process.env.POPULOUS_URL ?? 'http://localhost:3000', { waitUntil: 'networkidle' })
  await page.waitForSelector('.world-viewport canvas')
  await page.evaluate(() => {
    const main = document.querySelector('main')
    let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
    for (; fiber; fiber = fiber.return) {
      for (let hook = fiber.memoizedState; hook; hook = hook.next) {
        if (hook.memoizedState?.current?.unitMeshes) window.testScene = hook.memoizedState.current
      }
    }
  })
  await page.waitForFunction(() => window.testScene.world.flyby.flags & 1)
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => !window.testScene.world.inputMask)
  await page.evaluate(() => {
    const scene = window.testScene
    scene.world.speed = 0
    scene.focus({ x: 9, z: 33 })
  })

  async function checkStones() {
    const state = await page.evaluate(() => {
      const scene = window.testScene
      return {
        centers: scene.world.units.filter(unit => unit.kind === 'shaman').map(unit => ({
          x: Math.round((unit.x + 8) * 256), y: Math.round((-unit.z - 8) * 256),
        })),
        land: { heights: Array.from(scene.world.land.heights), flags: Array.from(scene.world.land.flags) },
        stones: scene.decorations.children.filter(group => group.name === 'reincarnation-stone').map(group => ({
          position: group.position.toArray(), heading: group.userData.nativeHeading,
          model: group.children[0].userData.nativeModel,
        })),
      }
    })
    assert.equal(state.centers.length, 2)
    assert.equal(state.stones.length, 16)
    const expected = state.centers.flatMap(center => reincarnationStones(state.land, center))
    for (let i = 0; i < expected.length; i++) {
      const stone = expected[i]
      const point = browserPosition(stone)
      assert.deepEqual(state.stones[i], {
        position: [point.x, stone.h / 128, point.z], heading: stone.heading, model: 30,
      })
    }
    return state.stones
  }

  const initial = await checkStones()
  await page.screenshot({ path: '/private/tmp/populous-reincarnation-front.png' })
  await page.locator('.world-viewport canvas.battlefield').focus()
  const bearing = await page.evaluate(() => window.testScene.cameraBearing)
  await page.keyboard.down('q')
  await page.waitForFunction(bearing => window.testScene.cameraBearing !== bearing, bearing)
  await page.keyboard.up('q')
  assert.notEqual(await page.evaluate(() => window.testScene.cameraBearing), bearing)
  assert.deepEqual(await checkStones(), initial)
  await page.screenshot({ path: '/private/tmp/populous-reincarnation-rotated.png' })

  // A terrain edit must re-ground the stone with the native stored-diagonal height.
  await page.evaluate(() => {
    const scene = window.testScene
    const stone = scene.decorations.children.find(group => group.name === 'reincarnation-stone')
    const x = Math.round((stone.position.x + 8) * 256) & 65535
    const y = Math.round((-stone.position.z - 8) * 256) & 65535
    const cell = (y >> 9) * 128 + (x >> 9)
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      const index = ((((cell >> 7) + dy) & 127) << 7) | (((cell & 127) + dx) & 127)
      scene.world.land.heights[index] += 128
    }
    scene.world.landVersion++
    scene.world.terrainVersion = scene.world.landVersion
    scene.rebuildTerrain()
  })
  const edited = await checkStones()
  assert.equal(edited[0].position[1], initial[0].position[1] + 1)

  await page.evaluate(() => {
    const scene = window.testScene
    window.reincarnationShaman = scene.world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
    window.reincarnationDeath = { x: window.reincarnationShaman.x, z: window.reincarnationShaman.z }
    window.reincarnationShaman.hp = 0
    scene.world.speed = 0.25
  })
  await page.waitForFunction(() => {
    const scene = window.testScene
    const effect = scene.world.effects.find(f => f.reincarnation?.team === 'blue')
    const mesh = effect && scene.fxMeshes.get(effect.id)
    if (!effect || effect.reincarnation.phase !== 0 || mesh?.userData.frame !== 680) return false
    scene.world.speed = 0
    return true
  })
  assert.deepEqual(await page.evaluate(() => {
    const scene = window.testScene
    const effect = scene.world.effects.find(f => f.reincarnation?.team === 'blue')
    const mesh = scene.fxMeshes.get(effect.id)
    return { point: { x: effect.x, z: effect.z }, frame: mesh.userData.frame, layers: mesh.userData.layers.length }
  }), { point: await page.evaluate(() => window.reincarnationDeath), frame: 680, layers: 2 })
  await page.evaluate(() => { window.testScene.world.speed = 8 })
  await page.waitForFunction(() => {
    const scene = window.testScene
    const effect = scene.world.effects.find(f => f.reincarnation?.team === 'blue')
    const mesh = effect && scene.fxMeshes.get(effect.id)
    if (!effect || effect.reincarnation.phase !== 1 || mesh?.userData.frame !== 352) return false
    scene.world.speed = 0
    return true
  })
  await page.evaluate(() => { window.testScene.world.speed = 8 })
  await page.waitForFunction(() => {
    const scene = window.testScene
    const effect = scene.world.effects.find(f => f.reincarnation?.team === 'blue')
    const mesh = effect && scene.fxMeshes.get(effect.id)
    if (!effect || effect.reincarnation.phase !== 3 || mesh?.userData.frame !== 360) return false
    scene.world.speed = 0
    return true
  })
  assert.ok(await page.evaluate(() => {
    const effect = window.testScene.world.effects.find(f => f.reincarnation?.team === 'blue')
    return effect.height * 45 > effect.reincarnation.ground
  }))
  await page.screenshot({ path: '/private/tmp/populous-reincarnation-rise.png' })
  await page.evaluate(() => { window.testScene.world.speed = 32 })
  await page.waitForFunction(() => {
    const scene = window.testScene
    const shaman = scene.world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
    if (!shaman || shaman.id === window.reincarnationShaman.id || scene.world.effects.some(f => f.reincarnation)) return false
    scene.world.speed = 0
    return true
  })

  const corpse = await page.evaluate(async () => {
    const scene = window.testScene, world = scene.world, { tick } = await import('/app/model.ts')
    cancelAnimationFrame(scene.frame)
    world.speed = 0
    world.paused = false
    const brave = world.units.find(unit => unit.team === 'blue' && unit.kind === 'brave')
    scene.focus(brave)
    brave.hp = 0
    tick(world, 1 / 12)
    world.paused = true
    scene.onChange()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    const effect = world.effects.find(f => f.corpse), mesh = scene.fxMeshes.get(effect.id)
    window.corpseEffect = effect
    return {
      id: effect.id, frame: mesh.userData.frame, draw: mesh.userData.draw,
      flags: mesh.userData.drawFlags, layers: mesh.userData.layers.length,
      visible: mesh.visible, remaining: effect.corpse.remaining, phase: effect.corpse.phase,
      height: Math.round(effect.height * 45 - effect.corpse.ground) || 0,
    }
  })
  assert.deepEqual(corpse, {
    id: corpse.id, frame: 304, draw: 14, flags: 0, layers: 2,
    visible: true, remaining: 468, phase: 0, height: 0,
  })
  assert.ok(await effectPixels(page, [corpse.id]) > 10, 'ordinary corpse must contribute live GPU pixels')
  await page.screenshot({ path: '/private/tmp/populous-corpse.png' })
  const corpseTimeline = await page.evaluate(async () => {
    const scene = window.testScene, world = scene.world, { tick } = await import('/app/model.ts'), rows = []
    let visits = 0
    for (const target of [4, 5, 133, 136, 167, 168, 467, 468]) {
      world.paused = false
      while (visits < target) { tick(world, 1 / 12); visits++ }
      world.paused = true
      scene.animate(scene.previous)
      cancelAnimationFrame(scene.frame)
      const effect = world.effects.find(f => f.id === window.corpseEffect.id), mesh = scene.fxMeshes.get(window.corpseEffect.id)
      rows.push(effect ? [target, effect.corpse.phase, effect.corpse.remaining,
        Math.round(effect.height * 45 - effect.corpse.ground) || 0, mesh.userData.frame,
        mesh.userData.drawFlags, mesh.visible] : [target, null])
    }
    return rows
  })
  assert.deepEqual(corpseTimeline, [
    [4, 0, 464, 0, 304, 0, true], [5, 1, 463, 0, 312, 0, true],
    [133, 2, 335, 0, 320, 0, true], [136, 3, 332, 40, 320, 6, true],
    [167, 3, 301, 1280, 320, 6, true], [168, 4, 300, 1280, 320, 6, false],
    [467, 4, 1, 1280, 320, 6, false], [468, null],
  ])
  assert.deepEqual(errors, [])
  console.log('PASS: 16 stones, shaman reincarnation and ordinary corpse frames/rise/hide/cleanup; no browser errors')
} finally {
  await browser.close()
}
