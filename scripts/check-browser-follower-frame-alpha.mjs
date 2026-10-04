import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'
import { bindGame } from './browser-game.mjs'

// Run with scripts/local-render/harness.mjs --scenario <this file>.
// Exact native ghost alpha: 85/255. Background substitutions and injected live
// followers are explicit presentation fixtures, not campaign training evidence.
export default async function followerFrameAlpha({ browser, page, url, output, openMission, receipt }) {
  await openMission(1)
  await page.evaluate(() => window.testStore.change(world => { world.speed = 0 }))
  const failures = [], captures = []
  const backgrounds = [{ name: 'black', rgb: [0, 0, 0] }, { name: 'sand', rgb: [219, 184, 133] }]
  const control = (page, kind) => page.getByRole('button', { name: `Select ${kind}`, exact: true })
  const setScale = async (page, scale) => {
    // Change size through the shipped settings control, then return to play.
    await page.getByRole('button', { name: 'Menu', exact: true }).click()
    await page.getByRole('combobox', { name: 'HUD size', exact: true }).selectOption(String(scale))
    await page.getByRole('button', { name: 'Close menu', exact: true }).click()
  }
  const inspect = async (page, kind, name, background, frame = 'follower', enabled = false) => {
    await page.locator('.native-hud').evaluate((element, rgb) => {
      element.style.backgroundImage = 'none'
      element.style.backgroundColor = `rgb(${rgb.join(',')})`
    }, background.rgb)
    const button = control(page, kind)
    const path = resolve(output, `${name}-${background.name}.png`)
    const png = await button.screenshot({ path, animations: 'disabled' })
    const result = await page.evaluate(async ({ bytes, background, frame, enabled, kind }) => {
      const decode = async blob => {
        const image = await createImageBitmap(blob), canvas = document.createElement('canvas')
        canvas.width = image.width; canvas.height = image.height
        const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0); image.close()
        return { width: canvas.width, height: canvas.height, data: ctx.getImageData(0, 0, canvas.width, canvas.height).data }
      }
      const actual = await decode(new Blob([new Uint8Array(bytes)], { type: 'image/png' }))
      const source = await decode(await (await fetch(`/original/hud-${frame}.png`)).blob())
      const sx = actual.width / 15, sy = actual.height / 36
      if (!Number.isInteger(sx) || sx !== sy) throw Error(`Nonuniform crop ${actual.width}x${actual.height}`)
      let checked = 0, mismatches = 0, maximumError = 0
      for (let y = 0; y < actual.height; y++) for (let x = 0; x < actual.width; x++) {
        const logicalY = Math.floor(y / sy)
        // Enabled controls include live icon/count artwork. Their unchanged top
        // border verifies full strength; disabled frames compare every pixel.
        if (enabled && logicalY >= 4) continue
        const at = (y * actual.width + x) * 4
        const native = (logicalY * 15 + Math.floor(x / sx)) * 4
        const alpha = source.data[native + 3] / 255 * (enabled ? 1 : 85 / 255)
        for (let c = 0; c < 3; c++) {
          const expected = Math.round(source.data[native + c] * alpha + background[c] * (1 - alpha))
          const error = Math.abs(actual.data[at + c] - expected)
          maximumError = Math.max(error, maximumError)
          if (error > 1) mismatches++
          checked++
        }
      }
      const element = document.querySelector(`[aria-label="Select ${kind}"]`)
      return { width: actual.width, height: actual.height, checked, mismatches, maximumError,
        opacity: getComputedStyle(element).opacity, disabled: element.disabled,
        icons: element.querySelectorAll('.follower-icon').length, counts: element.querySelectorAll('.follower-number').length }
    }, { bytes: [...png], background: background.rgb, frame, enabled, kind })
    captures.push({ name, background: background.name, frame, path, ...result })
    if (result.mismatches) failures.push(`${name}/${background.name}: ${result.mismatches} channel mismatches, max ${result.maximumError}`)
    assert.equal(result.disabled, !enabled)
    assert.equal(result.icons, Number(enabled))
    assert.equal(result.counts, Number(enabled))
    return result
  }

  for (const scale of [1, 2]) {
    await setScale(page, scale)
    await page.mouse.move(1000, 700)
    for (const background of backgrounds) await inspect(page, 'warrior', `mission1-empty-${scale}x`, background)
    // A physical hover over a disabled control must keep the normal empty art.
    await control(page, 'warrior').hover()
    for (const background of backgrounds) await inspect(page, 'warrior', `mission1-disabled-hover-${scale}x`, background)
    await page.mouse.move(1000, 700)
    for (const background of backgrounds) await inspect(page, 'brave', `mission1-enabled-${scale}x`, background, 'follower', true)
    await control(page, 'brave').hover()
    for (const background of backgrounds) await inspect(page, 'brave', `mission1-hover-${scale}x`, background, 'follower-hover', true)
    await control(page, 'brave').click()
    await page.mouse.move(1000, 700)
    for (const background of backgrounds) await inspect(page, 'brave', `mission1-selected-${scale}x`, background, 'follower-selected', true)
    await page.keyboard.press('Escape')
  }
  await page.screenshot({ path: resolve(output, 'mission1-full.png') })

  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await openMission(3)
  await page.evaluate(() => window.testStore.change(world => { world.speed = 0 }))
  const ids = await page.evaluate(async () => {
    const store = window.testStore, world = store.getWorld(), { addUnit } = await import('/app/model.ts')
    const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
    const ids = [0, 1, 2].map(i => addUnit(world, 'blue', 'preacher', { x: shaman.x + i, z: shaman.z }).id)
    store.update(); return ids
  })
  await control(page, 'preacher').click({ modifiers: ['Control'] })
  assert.deepEqual(new Set(await page.evaluate(() => window.testStore.getWorld().selected)), new Set(ids))
  await page.keyboard.press('Escape')
  await page.mouse.move(1000, 700)
  for (const background of backgrounds) await inspect(page, 'preacher', 'mission3-positive', background, 'follower', true)
  await page.evaluate(ids => window.testStore.change(world => {
    for (const unit of world.units) if (ids.includes(unit.id)) unit.hp = 0
    world.mode = 'blast'
  }), ids)
  const before = await page.evaluate(() => ({ selected: window.testStore.getWorld().selected, mode: window.testStore.getWorld().mode, focus: [...window.testSceneRef.current.hudFocus] }))
  for (const [event, data] of [['pointerdown', { button: 0, ctrlKey: true }], ['pointerup', { button: 0, ctrlKey: true }], ['contextmenu', { button: 2 }]]) await control(page, 'preacher').dispatchEvent(event, data)
  const after = await page.evaluate(() => ({ selected: window.testStore.getWorld().selected, mode: window.testStore.getWorld().mode, focus: [...window.testSceneRef.current.hudFocus] }))
  assert.deepEqual(after, before, 'disabled Ctrl/right-click preserves spell mode, selection, and focus')
  await page.mouse.move(1000, 700)
  for (const background of backgrounds) await inspect(page, 'preacher', 'mission3-returned-zero', background)
  await page.screenshot({ path: resolve(output, 'mission3-returned-zero-full.png') })

  const wide = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 })
  try {
    const widePage = await wide.newPage()
    widePage.on('pageerror', error => receipt.errors.push(String(error)))
    await widePage.goto(url, { waitUntil: 'domcontentloaded' })
    await widePage.getByRole('button', { name: 'Mission 1', exact: true }).click()
    await bindGame(widePage)
    await widePage.evaluate(() => document.querySelector('.skip-introduction')?.click())
    await widePage.waitForFunction(() => !window.testStore.getWorld().inputMask)
    await widePage.evaluate(() => window.testStore.change(world => { world.speed = 0 }))
    await setScale(widePage, 2)
    await widePage.mouse.move(1000, 700)
    for (const background of backgrounds) await inspect(widePage, 'warrior', 'wide-2x-dpr2', background)
    await widePage.screenshot({ path: resolve(output, 'wide-full.png') })
  } finally { await wide.close() }
  const renderer = await page.evaluate(() => {
    const gl = window.testSceneRef.current.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
    return { version: gl.getParameter(gl.VERSION), renderer: gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER) }
  })
  writeFileSync(resolve(output, 'pixels.json'), JSON.stringify({ captures, renderer, failures }, null, 2) + '\n')
  // Capture all backgrounds/states before failing so the before evidence is useful.
  assert.deepEqual(receipt.errors, [])
  assert.deepEqual(failures, [], failures.join('\n'))
  return { captures, renderer, nativeAlpha: 85, disabledInteractions: { before, after },
    limitations: 'Headless/software-rendered presentation regression. Flat backgrounds and added preachers are test fixtures; no natural-training or hardware-performance claim.' }
}
