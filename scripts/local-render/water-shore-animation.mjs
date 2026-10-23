import { skipIntroductionWithSpace } from '../browser-introduction.mjs'
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame, prepareCampaignFixture, launchCampaignMission } from '../browser-game.mjs'

// Ordinary mission, settings, pause, speed, Save/Load and Restart controls.
// Scene reads only; no world/time/camera mutation or forced rendering.
export default async function waterShoreAnimation({ browser, page: initialPage, context: initialContext, url, output, signal, receipt }) {
  let page = initialPage
  const report = { method: 'Ordinary UI and natural rendered coastal time sequences. M1 is native initial availability; M2/M3 use separate empty contexts with declared availability, not earned prior campaign history.', phases: [], limits: 'Headless software renderer; source-backed scheduling correction, not original executable raster equivalence or hardware performance.' }
  const read = () => page.evaluate(() => {
    const s = window.testSceneRef.current, w = s.world, p = s.terrain.geometry.getAttribute('position'), light = s.terrain.geometry.getAttribute('light')
    const hash = array => { let h = 2166136261; for (const x of new Uint8Array(array.buffer, array.byteOffset, array.byteLength)) h = Math.imul(h ^ x, 16777619); return h >>> 0 }
    return { at: performance.now(), mission: w.outcome.level, turn: w.turn, speed: w.speed, paused: w.paused, camera: s.camera.position.toArray(), nativeCamera: { ...s.cameraPosition }, rawCenter: { ...s.view.rawCenter }, bearing: s.cameraBearing, scroll: s.terrain.material.uniforms.scroll?.value ?? null, positions: hash(p.array), light: hash(light.array), water: hash(s.waterMap.image.data), landscape: s.environment.landscape, waves: hash(s.waves) }
  })
  const sequence = async name => {
    const phase = { name, frames: [] }; report.phases.push(phase)
    for (let frame = 0; frame < 4; frame++) {
      signal.throwIfAborted()
      if (frame) await page.waitForTimeout(850)
      const state = await read(), file = `${name}-${frame}.png`
      await page.screenshot({ path: resolve(output, file) })
      phase.frames.push({ ...state, file })
    }
    const first = phase.frames[0], last = phase.frames.at(-1)
    assert.equal(first.water, last.water, 'acquired water texture stays fixed')
    assert.equal(first.waves, last.waves)
    if (first.paused) {
      assert.equal(first.turn, last.turn, 'pause stops wave clock')
      assert.equal(first.positions, last.positions, 'pause holds wave heights')
      assert.equal(first.light, last.light, 'pause holds wave lighting')
    } else {
      assert.ok(last.turn > first.turn, 'normal game clock progresses')
      assert.notEqual(first.positions, last.positions, 'normal wave heights animate')
      assert.notEqual(first.light, last.light, 'normal wave lighting animates')
    }
    writeFileSync(resolve(output, 'water-sequence.json'), JSON.stringify(report, null, 2))
  }
  const settings = async () => {
    await page.getByRole('button', { name: 'Menu', exact: true }).click()
    return page.locator('dialog[data-original-pause-menu]')
  }
  const continueGame = async menu => menu.getByRole('button', { name: 'Continue Game', exact: false }).click()
  for (const mission of [1, 2, 3]) {
    const context = mission === 1 ? initialContext : await browser.newContext({ viewport: { width: 1440, height: 1000 } })
    page = mission === 1 ? initialPage : await context.newPage()
    if (mission !== 1) {
      page.on('pageerror', error => receipt.errors.push(String(error)))
      page.on('console', message => { if (message.type() === 'error') receipt.errors.push(message.text()) })
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      await prepareCampaignFixture(page, mission)
    }
    try {
      await launchCampaignMission(page, mission)
      await bindGame(page)
      await skipIntroductionWithSpace(page, { timeout: 45000 })
      await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
      await page.waitForFunction(() => window.testSceneRef.current.waves && window.testSceneRef.current.terrainTextures)
      // Pan through the visible opening coastline with shipped keyboard input.
      await page.keyboard.down('s'); await page.waitForTimeout(350); await page.keyboard.up('s')
      await sequence(`m${mission}-speed1`)
      await page.locator('.world-viewport').press('Space')
      await sequence(`m${mission}-paused`)
      await page.locator('.world-viewport').press('Space')
      const menu = await settings()
      await menu.getByRole('button', { name: 'Options', exact: true }).click()
      await menu.getByRole('button', { name: 'Browser compatibility and help', exact: true }).click()
      await menu.getByRole('button', { name: '1× game speed', exact: true }).click()
      await menu.getByRole('button', { name: 'Back to Options', exact: true }).click()
      await menu.getByRole('button', { name: 'Back', exact: true }).click()
      await continueGame(menu)
      await sequence(`m${mission}-speed2`)
      const saveMenu = await settings()
      await saveMenu.getByRole('button', { name: 'Save Game', exact: true }).click()
      await saveMenu.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
      await page.waitForFunction(() => window.testStore.hasCheckpoint())
      await saveMenu.getByRole('button', { name: 'Back', exact: true }).click()
      await saveMenu.getByRole('button', { name: 'Load Game', exact: true }).click()
      await saveMenu.getByRole('button', { name: 'Load checkpoint', exact: true }).click()
      await bindGame(page)
      await sequence(`m${mission}-loaded`)
      const restartMenu = await settings()
      await restartMenu.getByRole('button', { name: 'Restart Level', exact: true }).click()
      await restartMenu.getByRole('button', { name: 'Yes', exact: true }).click()
      await bindGame(page)
      await skipIntroductionWithSpace(page, { timeout: 15000 })
      await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
      await sequence(`m${mission}-restarted`)
    } finally { if (mission !== 1) await context.close() }
  }
  return report
}
