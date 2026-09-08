// Start npm run dev, then node scripts/check-browser-reincarnation.mjs.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { reincarnationStones } from '../app/reincarnation.ts'
import { browserPosition } from '../app/model.ts'

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
  await page.locator('.world-viewport canvas').focus()
  const bearing = await page.evaluate(() => window.testScene.cameraBearing)
  await page.keyboard.down('q')
  await page.waitForTimeout(400)
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
  })
  await page.waitForFunction(() => window.testScene.terrainVersion === window.testScene.world.landVersion)
  const edited = await checkStones()
  assert.equal(edited[0].position[1], initial[0].position[1] + 1)
  assert.deepEqual(errors, [])
  console.log('PASS: 16 original stone meshes, native positions/headings/heights, camera rotation, terrain edit grounding; no browser errors')
} finally {
  await browser.close()
}
