import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { bindGame } from './browser-game.mjs'

// Run through scripts/local-render/harness.mjs --scenario <this file>.
// Openings use shipped controls. Added followers below are explicit UI-state
// fixtures, not claims of natural training or campaign-victory acceptance.
export default async function followerClasses({ page, openMission, output, url, receipt }) {
  const button = kind => page.getByRole('button', { name: `Select ${kind}`, exact: true })
  const roster = () => page.locator('.tribe-classes button').evaluateAll(buttons =>
    buttons.map(button => ({
      label: button.getAttribute('aria-label'),
      disabled: button.disabled,
      icons: button.querySelectorAll('.follower-icon .hud-sprite').length,
      count: button.querySelector('.follower-number')?.getAttribute('aria-label') ?? null,
    }))
  )
  const selected = () => page.evaluate(() => window.testStore.getWorld().selected)
  const clear = async () => {
    await page.keyboard.press('Escape')
    assert.deepEqual(await selected(), [])
  }
  const snapshots = []
  for (const mission of [1, 3]) {
    if (mission !== 1) {
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      await page.getByRole('dialog', { name: 'Start game', exact: true }).waitFor({ state: 'visible' })
    }
    await openMission(mission)
    await page.evaluate(() => { window.testStore.change(world => { world.speed = 0 }) })
    const opening = await roster()
    assert.deepEqual(opening.map(control => control.label), [
      'Select follower', 'Select brave', 'Select warrior', 'Select firewarrior', 'Select preacher', 'Select spy',
    ])
    assert.ok(opening[1].count > 0)
    for (const control of opening.slice(2)) {
      assert.equal(control.disabled, true, `${control.label} disabled in Mission ${mission}`)
      assert.equal(control.icons, 0, 'native empty frame has no live icon art')
      assert.equal(control.count, null, 'native empty frame has no live count art')
    }
    await page.screenshot({ path: resolve(output, `mission-${mission}-opening.png`) })
    snapshots.push({ mission, opening })
  }

  // Disabled native controls must not cancel a spell mode, including right-click
  // and the macOS Ctrl-pointer fallback that are separate from onClick.
  await page.evaluate(() => window.testStore.change(world => { world.mode = 'blast' }))
  await button('preacher').dispatchEvent('pointerdown', { button: 0, ctrlKey: true })
  await button('preacher').dispatchEvent('pointerup', { button: 0, ctrlKey: true })
  await button('preacher').dispatchEvent('contextmenu', { button: 2 })
  assert.equal(await page.evaluate(() => window.testStore.getWorld().mode), 'blast')

  const fixture = await page.evaluate(async () => {
    const store = window.testStore, world = store.getWorld(), model = await import('/app/model.ts')
    const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
    const ids = []
    world.mode = null
    for (let i = 0; i < 3; i++) ids.push(model.addUnit(world, 'blue', 'preacher', { x: shaman.x + i, z: shaman.z }).id)
    const firewarrior = model.addUnit(world, 'blue', 'firewarrior', { x: shaman.x + 3, z: shaman.z }).id
    world.selected = []
    store.update()
    return { preachers: ids, firewarrior }
  })
  await page.waitForFunction(() => !document.querySelector('[aria-label="Select preacher"]').disabled)
  assert.equal((await roster())[4].count, '3')
  for (const [kind, sprite] of [['firewarrior', 670], ['preacher', 672]]) {
    const art = await button(kind).locator('.follower-icon .hud-sprite').first().evaluate(async (element, sprite) => {
      const { default: hud } = await import('/app/original-hud.json')
      const rectangle = hud.rects[sprite]
      return { actual: element.style.backgroundPosition, expected: `-${rectangle.x}px -${rectangle.y}px` }
    }, sprite)
    assert.equal(art.actual, art.expected, `${kind} owns native HFX ${sprite}`)
  }
  await button('preacher').click()
  assert.equal((await selected()).length, 1)
  await button('preacher').click()
  assert.equal((await selected()).length, 2, 'repeat adds the next real follower')
  await clear()
  await button('preacher').click({ modifiers: ['Control'] })
  assert.deepEqual(new Set(await selected()), new Set(fixture.preachers))
  await clear()
  await button('preacher').click({ modifiers: ['Shift'] })
  assert.deepEqual(new Set(await selected()), new Set(fixture.preachers))
  await button('preacher').click({ button: 'right' })
  assert.ok(fixture.preachers.includes(await page.evaluate(() => window.testScene.hudFocus[4])))
  await clear()
  await button('firewarrior').focus()
  await page.keyboard.press('Enter')
  assert.deepEqual(await selected(), [fixture.firewarrior], 'keyboard uses the correct class model')

  for (const [width, height] of [[1440, 1000], [1920, 1080]]) {
    await page.setViewportSize({ width, height })
    const boxes = await page.locator('.tribe-classes button').evaluateAll(buttons => buttons.map(button => {
      const { x, y, width, height } = button.getBoundingClientRect()
      return { x, y, width, height }
    }))
    for (let i = 0; i < boxes.length; i++) {
      assert.ok(boxes[i].width > 0 && boxes[i].height > 0)
      if (i) assert.ok(boxes[i].x >= boxes[i - 1].x + boxes[i - 1].width)
    }
    await page.screenshot({ path: resolve(output, `mission-3-roster-${width}.png`) })
  }
  await page.setViewportSize({ width: 1440, height: 1000 })

  // Retain housed people in the live total; death empties the same visible frame.
  await page.evaluate(({ preachers }) => window.testStore.change(world => {
    world.units.find(unit => unit.id === preachers[0]).inside = world.buildings[0].id
  }), fixture)
  assert.equal((await roster())[4].count, '3')
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
  await page.waitForFunction(() => window.testStore.hasCheckpoint())
  await page.evaluate(({ preachers }) => window.testStore.change(world => {
    for (const unit of world.units) if (preachers.includes(unit.id)) unit.hp = 0
  }), fixture)
  assert.equal((await roster())[4].disabled, true)
  assert.equal((await roster())[4].icons, 0)
  await page.getByRole('button', { name: 'Load checkpoint', exact: true }).click()
  await bindGame(page)
  await page.waitForFunction(() => window.testSceneRef.current?.world === window.testStore.getWorld())
  assert.equal((await roster())[4].count, '3')
  assert.equal((await roster())[4].disabled, false)
  await page.screenshot({ path: resolve(output, 'mission-3-restored.png') })
  const renderer = await page.evaluate(() => {
    const gl = window.testSceneRef.current.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
    return { version: gl.getParameter(gl.VERSION), renderer: gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER) }
  })
  assert.deepEqual(receipt.errors, [])
  return { snapshots, fixture, restored: await roster(), renderer, limitations: 'Headless/software-rendered UI regression; controlled follower fixtures do not certify natural training.' }
}
