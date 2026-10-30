import { skipIntroductionWithSpace } from './browser-introduction.mjs'
import { openCampaignFromMainMenu } from './browser-new-game.mjs'
import { launchOptions } from './local-render/harness.mjs'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
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
  await openCampaignFromMainMenu(page)
  const button = page.getByRole('button', { name: `Start Mission ${mission}`, exact: true })
  await button.waitFor()
  await button.focus()
  await page.keyboard.press('Enter')
}

const output = process.env.POPULOUS_RETRY_OUTPUT
if (output) mkdirSync(output, { recursive: true })
const observations = []
const profile = mkdtempSync(resolve(tmpdir(), 'pnd-loading-retry-'))
let browser
const report = { status: 'running', observations }
try {
  const launch = launchOptions(process.env.POPULOUS_BROWSER)
  browser = await chromium.launch({ ...launch, args: [...launch.args, `--user-data-dir=${profile}`], headless: !process.argv.includes('--headed') })
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
      unitLayerRequests = 0
    const pageErrors = [], gates = []
    page.on('pageerror', error => pageErrors.push(error.stack ?? error.message))
    page.on('crash', () => pageErrors.push('Page crashed'))
    page.on('console', message => {
      if (message.type() === 'error' && message.text().includes('Texture load failed: atlas')) atlasErrors++
    })
    await page.route('**/original/unit-layers.png', async route => {
      unitLayerRequests++
      await route.continue()
    })
    await page.route('**/original/atlas.png', async route => {
      atlasRequests++
      const action = await new Promise(resolve => gates.push(resolve))
      if (action === 'fail') await route.abort('failed')
      else await route.continue()
    })
    await page.goto(url, { waitUntil: 'networkidle' })
    await selectMission(page, 1)

    for (let attempt = 1; attempt <= 3; attempt++) {
      await waitForCount(() => atlasRequests, attempt)
      await page.locator('[data-loading-phase="loading"]').waitFor()
      // Observe the committed Home scene while the real resource request is held.
      await page.waitForFunction(expected => {
        const main = document.querySelector('main')
        let fiber = main?.[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
        const refs = [], stores = []
        for (; fiber; fiber = fiber.return)
          for (let hook = fiber.memoizedState; hook; hook = hook.next) {
            if (hook.memoizedState?.current?.terrainLoad) refs.push(hook.memoizedState)
            if (hook.memoizedState?.getWorld) stores.push(hook.memoizedState)
          }
        const scenes = globalThis.retryScenes ??= []
        for (const store of stores) {
          const scene = refs.find(ref => ref.current?.world === store.getWorld())?.current
          if (!scene?.cursor?.material?.map || scenes.includes(scene)) continue
          scenes.push(scene)
          globalThis.retryWorlds ??= []
          globalThis.retryWorlds.push(store.getWorld())
          return scenes.length === expected
        }
        return scenes.length === expected
      }, attempt)
      const snapshot = () => page.evaluate(() => {
        const scenes = globalThis.retryScenes, scene = scenes.at(-1), world = scene.world
        return {
          phase: document.querySelector('.loading-world')?.dataset.loadingPhase,
          level: world.outcome.level, time: world.time, turn: world.turn,
          randomState: world.randomState, cosmeticRandomState: world.cosmeticRandom.randomState,
          started: scene.started, previous: scene.previous, frame: scene.frame,
          disposed: scene.disposed, aborted: scene.terrainLoad.signal.aborted,
          canvasConnected: scene.renderer.domElement.isConnected,
          sceneCount: new Set(scenes).size, worldCount: new Set(globalThis.retryWorlds).size,
          mapCount: new Set(scenes.map(s => s.cursor.material.map)).size,
          oldScenesDisposed: scenes.slice(0, -1).every(s => s.disposed && s.terrainLoad.signal.aborted && !s.renderer.domElement.isConnected),
        }
      })
      const before = await snapshot()
      assert.equal(before.phase, 'loading')
      assert.equal(before.level, 1)
      assert.equal(before.started, false)
      assert.equal(before.previous, null)
      assert.equal(before.frame, 0)
      assert.equal(before.disposed, false)
      assert.equal(before.aborted, false)
      assert.equal(before.canvasConnected, true)
      assert.equal(before.sceneCount, attempt)
      assert.equal(before.worldCount, attempt)
      assert.equal(before.mapCount, attempt)
      assert.equal(before.oldScenesDisposed, true)
      await page.waitForTimeout(1200)
      assert.deepEqual(await snapshot(), before, 'held loading must not advance simulation or replace its scene')
      assert.equal(atlasRequests, attempt, 'one request per explicit load')
      observations.push({ attempt, loading: before, heldMs: 1200 })
      if (output) await page.screenshot({ path: resolve(output, `loading-${attempt}.png`) })
      if (attempt === 3) await page.evaluate(() => { globalThis.retryReleasedAt = performance.now() })
      gates[attempt - 1](attempt < 3 ? 'fail' : 'continue')
      if (attempt === 3) break
      await page.getByRole('heading', { name: 'Loading failed', exact: true }).waitFor()
      await waitForCount(() => atlasErrors, attempt)
      const failed = await snapshot()
      assert.equal(failed.phase, 'failed')
      assert.equal(failed.disposed, true)
      assert.equal(failed.aborted, true)
      assert.equal(failed.canvasConnected, false)
      const retry = page.getByRole('button', { name: 'Try again', exact: true })
      assert.equal(await retry.evaluate(button => document.activeElement === button), true)
      observations.at(-1).failed = failed
      observations.at(-1).retryInput = attempt === 1 ? 'Enter' : 'pointer'
      if (output) await page.screenshot({ path: resolve(output, `failed-${attempt}.png`) })
      if (attempt === 1) await page.keyboard.press('Enter')
      else await retry.click()
    }
    await page.locator('.loading-world').waitFor({ state: 'detached' })
    await bindGame(page)
    assert.equal(atlasRequests, 3, 'two explicit retries issue exactly two fresh atlas requests')
    const activated = await page.evaluate(() => {
      const scene = globalThis.testScene, world = globalThis.testStore.getWorld()
      return { sceneIsThird: scene === globalThis.retryScenes[2], ownsWorld: scene.world === world,
        level: world.outcome.level, started: scene.started, disposed: scene.disposed,
        time: world.time, turn: world.turn, frame: scene.frame, speed: world.speed,
        elapsedSinceRelease: (performance.now() - globalThis.retryReleasedAt) / 1000 }
    })
    assert.equal(activated.sceneIsThird, true)
    assert.equal(activated.ownsWorld, true)
    assert.equal(activated.level, 1)
    assert.equal(activated.started, true)
    assert.equal(activated.disposed, false)
    observations.push({ activated })
    assert.ok(activated.time <= activated.elapsedSinceRelease * activated.speed,
      `game time exceeded the measured post-release interval: ${JSON.stringify(activated)}`)
    await skipIntroductionWithSpace(page)
    await page.waitForFunction(() => !globalThis.testStore.getWorld().inputMask)
    const playableTime = await page.evaluate(() => globalThis.testStore.getWorld().time)
    await page.waitForFunction(time => globalThis.testStore.getWorld().time > time, playableTime)
    observations.push({ playableTime, advancedTime: await page.evaluate(() => globalThis.testStore.getWorld().time) })
    if (output) await page.screenshot({ path: resolve(output, 'recovered.png') })

    const identity = await page.evaluate(async () => {
      const scene = globalThis.testScene,
        failedMap = globalThis.retryScenes[0].cursor.material.map,
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
    assert.equal(atlasRequests, 3, 'successful required atlas must remain shared for passive render lookups')
    assert.equal(atlasErrors, 2)
    assert.equal(unitLayerRequests, 1, 'successful required unit-layers texture must not be refetched')
    assert.deepEqual(pageErrors, [])
    observations.push({ atlasRequests, atlasErrors, unitLayerRequests, identity, pageErrors })
    await context.close()
  }

  report.status = 'passed'
  console.log('PASS: passive optional failure stays cached; two same-session Home retries commit loading before each failure and recover before consumers, and recovered cursor plus real placement plan share the fresh atlas identity')
} catch (error) {
  report.status = 'failed'
  report.error = String(error)
  throw error
} finally {
  report.browser = browser?.version()
  if (output) writeFileSync(resolve(output, 'observations.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report))
  await browser?.close()
  rmSync(profile, { recursive: true, force: true })
}
