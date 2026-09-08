// Start npm run dev, then node scripts/check-browser-navigation.mjs.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(() => {
    const s = window.testScene
    cancelAnimationFrame(s.frame)
    s.world.speed = 0
  })
  const reset = async () => {
    await page.mouse.move(800, 500)
    await page.evaluate(() => {
      const s = window.testScene
      s.keys.clear()
      s.cameraTime = 0
      s.cameraBearing = 0
      s.focus({ x: 2, z: 30 })
    })
  }
  const step = () =>
    page.evaluate(() => {
      const s = window.testScene
      s.updateCameraMotion(1 / 24)
      const { x, y, angle } = s.cameraPosition
      return { x, y, angle }
    })
  const start = { x: 2560, y: 55808, angle: 0 }
  // Original movement-byte outcomes at 24 Hz and heading zero.
  for (const [keys, expected] of [
    [['ArrowLeft'], { ...start, angle: 2022 }],
    [['ArrowRight'], { ...start, angle: 26 }],
    [['Control', 'ArrowLeft'], { ...start, x: 2240 }],
    [['Control', 'ArrowRight'], { ...start, x: 2880 }],
    [['Shift', 'ArrowUp'], { ...start, y: 57088 }],
    [['Shift', 'Control', 'ArrowRight'], { ...start, x: 3840 }],
    [['Shift', 'ArrowRight'], { ...start, angle: 26 }],
    [['Delete'], { ...start, x: 2240 }],
    [['PageDown'], { ...start, x: 2880 }],
    [['Control', 'Delete'], { ...start, angle: 2022 }],
    [['Numpad8'], { ...start, y: 56128 }],
    [['Numpad2'], { ...start, y: 55488 }],
    [['Control', 'Numpad4'], { ...start, x: 2240 }],
    [['Control', 'Numpad7'], { ...start, angle: 2022 }],
  ]) {
    await reset()
    for (const key of keys) await page.keyboard.down(key)
    assert.deepEqual(await step(), expected, keys.join('+'))
    for (const key of [...keys].reverse()) await page.keyboard.up(key)
    assert.deepEqual(await step(), expected, 'Release stops movement')
    assert.equal(
      await page.evaluate(() => window.testScene.world.mode),
      null,
      'Keypad navigation does not select a spell'
    )
  }
  // Modifiers also change the meaning of an already-held arrow.
  await reset()
  await page.keyboard.down('ArrowRight')
  await step()
  await page.keyboard.down('Control')
  let moved = await step()
  assert.equal(moved.angle, 26)
  assert.notEqual(moved.x, start.x)
  await page.keyboard.up('Control')
  assert.equal((await step()).angle, 52)
  await page.keyboard.up('ArrowRight')
  for (const [x, y, expected] of [
    [0, 500, { ...start, x: 2240 }], // Outer sidebar edge, not canvas edge.
    [1439, 500, { ...start, x: 2880 }],
    [800, 0, { ...start, y: 56128 }],
    [800, 999, { ...start, y: 55488 }],
    [0, 0, { ...start, x: 2240, y: 56128 }],
    [1, 500, start],
    [200, 500, start], // The sidebar/canvas seam must not scroll.
  ]) {
    await reset()
    await page.mouse.move(x, y)
    await page.waitForFunction(
      ([x, y]) =>
        window.testScene.navigationPointer?.x === x && window.testScene.navigationPointer?.y === y,
      [x, y]
    )
    assert.deepEqual(await step(), expected, `Screen edge ${x},${y}`)
  }
  await reset()
  await page.mouse.move(0, 500)
  await page.keyboard.down('Control')
  await page.keyboard.down('ArrowLeft')
  assert.deepEqual(
    await step(),
    { ...start, x: 1280 },
    'Duplicate left request uses native fast pan'
  )
  await page.keyboard.up('ArrowLeft')
  await page.keyboard.up('Control')
  await reset()
  await page.mouse.move(0, 500)
  await page.evaluate(() => {
    window.testScene.world.inputMask = 4
  })
  assert.deepEqual(await step(), start)
  await page.evaluate(() => {
    window.testScene.world.inputMask = 0
    window.testScene.world.paused = true
  })
  assert.deepEqual(
    await step(),
    { ...start, x: 2240 },
    'Edges remain active while simulation is paused'
  )
  await reset()
  await page.mouse.move(0, 500)
  await page.mouse.move(-10, 500)
  await page.waitForFunction(() => window.testScene.navigationPointer === null)
  assert.deepEqual(await step(), start, 'Leaving the browser stops edge scrolling')
  // Holding a rotation drag at the edge must not introduce sideways movement.
  await reset()
  await page.mouse.down({ button: 'right' })
  await page.mouse.move(0, 500)
  const dragged = await page.evaluate(() => ({ ...window.testScene.cameraPosition }))
  assert.deepEqual(await step(), dragged)
  await page.mouse.up({ button: 'right' })
  await reset()
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.mouse.move(0, 500)
  assert.deepEqual(await step(), start, 'Modal dialog blocks edge scrolling')
  await page.getByRole('button', { name: 'Close menu', exact: true }).click()
  await reset()
  await page.mouse.move(0, 500)
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  assert.deepEqual(await step(), start, 'Window blur clears edge state')
  await page.evaluate(() => {
    const s = window.testScene
    s.world.paused = false
    s.onChange()
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
  })
  await page.screenshot({ path: '/private/tmp/populous-navigation.png' })
  assert.deepEqual(errors, [])
  console.log(
    'PASS: original arrows/Ctrl/Shift, fixed keypad aliases, held modifier changes, outer screen edges/corners, duplicate fast pan, modal/input/drag/leave/blur gates and paused camera movement'
  )
} finally {
  await browser.close()
}
