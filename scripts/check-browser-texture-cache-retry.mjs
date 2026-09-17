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

  // Required texture failure: a new scene/preload attempt explicitly retries the failed entry.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const page = await context.newPage()
    let atlasRequests = 0,
      atlasErrors = 0
    const pageErrors = []
    page.on('pageerror', error => pageErrors.push(error.stack ?? error.message))
    page.on('console', message => {
      if (message.type() === 'error' && message.text().includes('Texture load failed: atlas')) atlasErrors++
    })
    await page.route('**/original/atlas.png', async route => {
      atlasRequests++
      if (atlasRequests === 1) await route.abort('failed')
      else await route.continue()
    })
    await page.goto(url, { waitUntil: 'networkidle' })
    await selectMission(page, 1)
    await page.getByRole('heading', { name: 'The world could not awaken' }).waitFor()
    assert.equal(atlasRequests, 1)
    assert.equal(atlasErrors, 1)

    await page.getByRole('button', { name: 'Try again' }).click()
    await page.locator('.loading-world').waitFor({ state: 'detached' })
    await bindGame(page)
    assert.equal(atlasRequests, 2, 'explicit required retry must issue one fresh atlas request')
    await page.waitForTimeout(500)
    assert.equal(atlasRequests, 2, 'successful required atlas must remain shared for passive render lookups')
    assert.equal(atlasErrors, 1)
    assert.deepEqual(pageErrors, [])
    await context.close()
  }

  console.log('PASS: passive optional unit-health failure stays cached across repeated lookups, while a new required preload attempt explicitly retries the failed atlas once')
} finally {
  await browser.close()
}
