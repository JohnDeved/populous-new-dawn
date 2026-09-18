import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { bindGame } from './browser-game.mjs'

const url = process.env.POPULOUS_URL ?? 'http://localhost:3000'

async function waitForCount(read, expected, timeout = 10000) {
  const end = Date.now() + timeout
  while (read() < expected && Date.now() < end) await new Promise(resolve => setTimeout(resolve, 25))
  assert.ok(read() >= expected, `expected count ${expected}, got ${read()}`)
}

async function selectMission(page, mission) {
  const button = page.getByRole('button', { name: `Mission ${mission}`, exact: true })
  await button.waitFor()
  await button.focus()
  await page.keyboard.press('Enter')
}

const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
try {
  // Optional texture failure: repeated passive unit-health lookups must reuse the failed entry.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const page = await context.newPage()
    let optionalRequests = 0,
      optionalErrors = 0
    const pageErrors = []
    page.on('pageerror', error => pageErrors.push(error.stack ?? error.message))
    page.on('console', message => {
      if (message.type() === 'error' && message.text().includes('Texture load failed: unit-health')) optionalErrors++
    })
    await page.route('**/original/unit-health.png', async route => {
      optionalRequests++
      await route.abort('failed')
    })
    await page.goto(url, { waitUntil: 'networkidle' })
    await selectMission(page, 1)
    await page.locator('.loading-world').waitFor({ state: 'detached' })
    await bindGame(page)
    await waitForCount(() => optionalRequests, 1)
    await waitForCount(() => optionalErrors, 1)
    const unitId = await page.evaluate(() => globalThis.testScene.unitMeshes.keys().next().value)
    assert.equal(typeof unitId, 'number')
    for (let i = 0; i < 20; i++) {
      const removed = await page.evaluate(id => {
        const scene = globalThis.testScene,
          group = scene.unitMeshes.get(id)
        if (!group) return false
        scene.objects.remove(group)
        scene.releaseGroup(group)
        scene.unitMeshes.delete(id)
        return true
      }, unitId)
      assert.equal(removed, true)
      await page.waitForFunction(id => globalThis.testScene.unitMeshes.has(id), unitId)
    }
    await page.waitForTimeout(250)
    assert.equal(optionalRequests, 1, 'passive failed optional texture lookups must not issue another request')
    assert.equal(optionalErrors, 1, 'passive failed optional texture lookups must not repeat TextureLoader error logging')
    assert.deepEqual(pageErrors, [])
    await context.close()
  }

  // Required texture failure: retry must happen before atlas consumers capture the replacement.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const page = await context.newPage()
    let atlasRequests = 0,
      atlasErrors = 0,
      settleFirstAtlas
    const pageErrors = [],
      firstAtlasGate = new Promise(resolve => {
        settleFirstAtlas = resolve
      })
    page.on('pageerror', error => pageErrors.push(error.stack ?? error.message))
    page.on('console', message => {
      if (message.type() === 'error' && message.text().includes('Texture load failed: atlas')) atlasErrors++
    })
    await page.route('**/original/atlas.png', async route => {
      atlasRequests++
      if (atlasRequests === 1) {
        const action = await firstAtlasGate
        if (action === 'fail') await route.abort('failed')
        else await route.continue()
        return
      }
      await route.continue()
    })
    await page.goto(url, { waitUntil: 'networkidle' })
    await selectMission(page, 1)
    await waitForCount(() => atlasRequests, 1)

    // Capture the first scene while its atlas request is still in flight. This cursor owns the
    // texture object that will become the failed/disposed cache entry.
    await page.waitForFunction(() => {
      const main = document.querySelector('main')
      if (!main) return false
      let fiber = main[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
      for (; fiber; fiber = fiber.return)
        for (let hook = fiber.memoizedState; hook; hook = hook.next) {
          const scene = hook.memoizedState?.current
          if (scene?.cursor?.material?.map && scene?.terrainLoad) {
            globalThis.failedAtlasScene = scene
            globalThis.failedAtlasMap = scene.cursor.material.map
            return true
          }
        }
      return false
    })
    assert.equal(
      await page.evaluate(() => globalThis.failedAtlasScene.cursor.material.map === globalThis.failedAtlasMap),
      true
    )
    settleFirstAtlas('fail')
    await page.getByRole('heading', { name: 'The world could not awaken' }).waitFor()
    assert.equal(atlasRequests, 1)
    assert.equal(atlasErrors, 1)

    const retry = page.getByRole('button', { name: 'Try again' })
    await retry.focus()
    await page.keyboard.press('Enter')
    await page.locator('.loading-world').waitFor({ state: 'detached' })
    await bindGame(page)
    assert.equal(atlasRequests, 2, 'explicit required retry must issue one fresh atlas request')

    const identity = await page.evaluate(async () => {
      const scene = globalThis.testScene,
        failedMap = globalThis.failedAtlasMap,
        cursorMap = scene.cursor.material.map,
        { placeBuilding } = await import('/app/live-command.ts')
      scene.world.speed = 0
      scene.world.paused = false
      const placed = placeBuilding(scene.world, 'hut', { x: -2, z: 32 }),
        building = scene.world.buildings.at(-1)
      scene.updateBuildingsFrame()
      const plan = building ? scene.plans.get(building.id) : undefined
      return {
        placed,
        preparation: !!building?.preparation,
        cursorFresh: cursorMap !== failedMap,
        cursorMapUuid: cursorMap?.uuid ?? null,
        failedMapUuid: failedMap?.uuid ?? null,
        planExists: !!plan,
        planUsesCursorMaterial: plan?.material === scene.cursor.material,
        planUsesFreshAtlas:
          plan?.material?.map === cursorMap && plan.material.map !== failedMap,
        planMapUuid: plan?.material?.map?.uuid ?? null,
      }
    })
    assert.equal(identity.placed, true, JSON.stringify(identity))
    assert.equal(identity.preparation, true, JSON.stringify(identity))
    assert.equal(identity.cursorFresh, true, JSON.stringify(identity))
    assert.ok(identity.cursorMapUuid && identity.cursorMapUuid !== identity.failedMapUuid, JSON.stringify(identity))
    assert.equal(identity.planExists, true, JSON.stringify(identity))
    assert.equal(identity.planUsesCursorMaterial, true, JSON.stringify(identity))
    assert.equal(identity.planUsesFreshAtlas, true, JSON.stringify(identity))
    assert.equal(identity.planMapUuid, identity.cursorMapUuid, JSON.stringify(identity))

    await page.waitForTimeout(500)
    assert.equal(atlasRequests, 2, 'successful required atlas must remain shared for passive render lookups')
    assert.equal(atlasErrors, 1)
    assert.deepEqual(pageErrors, [])
    await context.close()
  }

  console.log('PASS: passive optional failure stays cached; required atlas retry occurs before consumers, and recovered cursor plus real placement plan share the fresh atlas identity')
} finally {
  await browser.close()
}
