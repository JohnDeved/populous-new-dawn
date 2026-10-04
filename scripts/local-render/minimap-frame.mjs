// Actual shipped frame pixels and lifecycle; existing map regression assertions run unchanged.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { bindGame } from '../browser-game.mjs'

const digest = data => createHash('sha256').update(data).digest('hex')

async function capture(page, output, name) {
  await page.waitForFunction(() => {
    const frame = document.querySelector('canvas.map-frame')
    if (!frame) return false
    const bounds = frame.getBoundingClientRect()
    return frame.width === Math.round(bounds.width) && frame.height === Math.round(bounds.height) && frame.getContext('2d').getImageData(0, 0, 1, 1).data[3] > 0
  })
  await page.evaluate(() => { const scene = window.testScene; scene.animate(scene.previous); cancelAnimationFrame(scene.frame) })
  const result = await page.evaluate(async () => {
    const frame = document.querySelector('canvas.map-frame'), rect = frame.getBoundingClientRect()
    const data = frame.getContext('2d').getImageData(0, 0, frame.width, frame.height).data
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', data))].map(v => v.toString(16).padStart(2, '0')).join('')
    const gl = window.testScene.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
    return { width: frame.width, height: frame.height, viewportWidth: innerWidth, viewportHeight: innerHeight,
      displayedWidth: rect.width, displayedHeight: rect.height, dpr: devicePixelRatio, rgbaHash: hash,
      terrainPng: window.testScene.mini.toDataURL(),
      pointerEvents: getComputedStyle(frame).pointerEvents,
      renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) }
  })
  const terrainFile = `${name}-terrain.png`
  writeFileSync(resolve(output, terrainFile), Buffer.from(result.terrainPng.split(',')[1], 'base64'))
  delete result.terrainPng
  result.terrainFile = terrainFile
  assert.equal(result.pointerEvents, 'none')
  await page.locator('.map-frame').screenshot({ path: resolve(output, `${name}-frame.png`) })
  await page.screenshot({ path: resolve(output, `${name}-screen.png`) })
  return { name, ...result }
}

async function existingRegression(root, output, url) {
  const source = readFileSync(resolve(root, 'scripts/check-browser-minimap.mjs'), 'utf8')
  // Only adapt launch and capture destinations to the reviewed cloud harness.
  // Every original assertion, viewport, heading and click remains byte-for-byte.
  let adapter = source
    .replace("from './browser-game.mjs'", `from '${pathToFileURL(resolve(root, 'scripts/browser-game.mjs'))}'`)
    .replace("from '../app/minimap.ts'", `from '${pathToFileURL(resolve(root, 'app/minimap.ts'))}'`)
    .replace('await chromium.launch({ headless: true })', 'await chromium.launch(launchOptions(process.env.POPULOUS_BROWSER))')
    .replaceAll('/private/tmp/populous-minimap-', `${output}/existing-minimap-`)
  adapter = `import { launchOptions } from '${pathToFileURL(resolve(root, 'scripts/local-render/harness.mjs'))}'\n${adapter}`
  writeFileSync(resolve(output, 'existing-minimap-adapter.mjs'), adapter)
  const result = await new Promise((done, reject) => {
    const child = spawn(process.execPath, ['--input-type=module', '-'], { cwd: root, env: { ...process.env, POPULOUS_URL: url }, stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = '', stderr = ''
    child.stdout.on('data', part => { stdout += part })
    child.stderr.on('data', part => { stderr += part })
    child.on('error', reject)
    child.on('exit', code => done({ code, stdout, stderr }))
    child.stdin.end(adapter)
  })
  writeFileSync(resolve(output, 'existing-minimap-check.json'), JSON.stringify({ sourceSha256: digest(source), adapterSha256: digest(adapter), ...result }, null, 2))
  assert.equal(result.code, 0, result.stderr)
  return result.stdout.trim()
}

export default async function minimapFrameScenario({ browser, page, context, root, output, url, openMission, receipt }) {
  await openMission(1)
  await page.evaluate(() => {
    const scene = window.testScene
    scene.world.speed = 0
    cancelAnimationFrame(scene.frame)
  })
  const frames = []
  for (const [width, height] of [[512, 480], [513, 480], [640, 480], [1280, 720], [1440, 1000], [3840, 2160]]) {
    await page.setViewportSize({ width, height })
    const proceed = page.getByRole('button', { name: 'Continue anyway', exact: false })
    if (await proceed.isVisible()) await proceed.click()
    frames.push(await capture(page, output, `viewport-${width}`))
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.getByRole('button', { name: 'Game settings', exact: true }).click()
  const menu = page.locator('dialog.game-dialog')
  await menu.waitFor({ state: 'visible' })
  await menu.getByRole('combobox', { name: 'HUD size', exact: true }).selectOption('1')
  frames.push(await capture(page, output, 'preference-1'))
  await menu.getByRole('combobox', { name: 'HUD size', exact: true }).selectOption('2')
  frames.push(await capture(page, output, 'preference-2'))
  await menu.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
  await page.waitForFunction(() => !document.querySelector('dialog.game-dialog button')?.disabled && [...document.querySelectorAll('dialog.game-dialog button')].some(b => b.textContent.trim() === 'Load checkpoint' && !b.disabled))
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.getByRole('dialog', { name: 'Start game', exact: true }).getByRole('button', { name: 'Load Game', exact: true }).click()
  await bindGame(page)
  await page.evaluate(() => { window.testScene = window.testSceneRef.current; window.testScene.world.speed = 0; cancelAnimationFrame(window.testScene.frame) })
  frames.push(await capture(page, output, 'checkpoint-loaded'))
  await page.getByRole('button', { name: 'Game settings', exact: true }).click()
  await menu.getByRole('button', { name: 'Restart world', exact: true }).click()
  await bindGame(page)
  await page.evaluate(() => document.querySelector('.skip-introduction')?.click())
  await page.evaluate(() => { window.testScene = window.testSceneRef.current; window.testScene.world.speed = 0; cancelAnimationFrame(window.testScene.frame) })
  frames.push(await capture(page, output, 'restarted'))
  writeFileSync(resolve(output, 'frame-pixels.json'), JSON.stringify(frames, null, 2))
  const highDpi = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 })
  const highPage = await highDpi.newPage()
  await highPage.goto(url, { waitUntil: 'domcontentloaded' })
  await highPage.getByRole('dialog', { name: 'Start game', exact: true }).waitFor({ state: 'visible' })
  await highPage.getByRole('button', { name: 'All missions', exact: true }).click()
  await highPage.getByRole('button', { name: 'Mission 1', exact: true }).focus()
  await highPage.keyboard.press('Enter')
  await bindGame(highPage)
  await highPage.evaluate(() => { window.testScene = window.testSceneRef.current; window.testScene.world.speed = 0; cancelAnimationFrame(window.testScene.frame) })
  frames.push(await capture(highPage, output, 'dpr-2'))
  await highDpi.close()
  writeFileSync(resolve(output, 'frame-pixels.json'), JSON.stringify(frames, null, 2))
  assert.deepEqual(receipt.errors, [])
  const existing = await existingRegression(root, output, url)
  await context.close()
  return { frames, existing, scope: 'Frame raster and lifecycle only; no hardware performance claim.' }
}
