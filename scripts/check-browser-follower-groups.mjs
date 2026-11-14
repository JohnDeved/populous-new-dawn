// Rendered numbered follower groups (#1005) through ordinary keyboard input.
// Run as a local-render harness scenario:
//   node scripts/local-render/harness.mjs --game-root . --port <free port> \
//     --scenario scripts/check-browser-follower-groups.mjs --output <ignored dir>
// Selection is made with shipped HUD controls; only reads use test references.
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'
import { bindGame, chooseSpell } from './browser-game.mjs'

const state = page => page.evaluate(() => {
  const scene = window.testSceneRef.current, world = scene.world
  return {
    selected: [...world.selected], mode: world.mode,
    groups: world.units.filter(u => u.groups).map(u => [u.id, u.groups]),
    motion: { active: scene.cameraMotion.active, target: { ...scene.cameraMotion.target } },
    camera: { ...scene.cameraPosition },
  }
})
// An open campaign message owns gameplay keys; collapse it through its public summary.
async function collapseMessages(page) {
  for (const summary of await page.locator('.campaign-messages details[open] > summary').all())
    await summary.click()
  assert.equal(await page.locator('.campaign-messages details[open]').count(), 0)
}
const idleBraves = page => page.getByRole('button', { name: 'Idle Braves', exact: true })

export default async function followerGroups({ page, output, openMission, receipt }) {
  await openMission(1)
  await page.evaluate(() => window.testStore.change(world => { world.speed = 0 }))
  await collapseMessages(page)
  await page.getByTitle('followers', { exact: true }).click()
  await page.mouse.move(900, 400)
  // Mission 1 starts with the Shaman selected; Escape clears it through the shipped path.
  await page.keyboard.press('Escape')
  assert.deepEqual((await state(page)).selected, [])

  await idleBraves(page).click()
  await idleBraves(page).click({ modifiers: ['Control'] })
  const braves = (await state(page)).selected
  assert.ok(braves.length >= 2, 'ordinary HUD controls select several braves')
  await page.keyboard.press('Shift+Digit1')
  let s = await state(page)
  assert.deepEqual(s.selected, braves, 'assignment keeps the selection')
  assert.deepEqual(s.groups.map(([id]) => id), braves)

  await page.keyboard.press('KeyH')
  const shaman = (await state(page)).selected
  assert.equal(shaman.length, 1)
  await page.keyboard.press('Shift+Digit2')
  await page.keyboard.press('Escape')
  assert.deepEqual((await state(page)).selected, [])

  await page.keyboard.press('Digit1')
  assert.deepEqual((await state(page)).selected, braves, '1 recalls group 1')
  await page.keyboard.press('Control+Digit2')
  assert.deepEqual(new Set((await state(page)).selected), new Set([...braves, ...shaman]), 'Ctrl adds group 2')
  await page.keyboard.press('Digit2')
  assert.deepEqual((await state(page)).selected, shaman, 'plain recall replaces')
  await page.keyboard.press('Digit3')
  assert.deepEqual((await state(page)).selected, shaman, 'an empty group changes nothing')
  await page.screenshot({ path: resolve(output, 'group-2-recalled.png') })

  // Number keys no longer arm spells; recalling leaves an armed spell for the group.
  assert.equal(await chooseSpell(page, 'Blast'), true)
  assert.equal((await state(page)).mode, 'blast')
  await page.keyboard.press('Digit1')
  s = await state(page)
  assert.equal(s.mode, null, 'recall never selects or casts a spell')
  assert.deepEqual(s.selected, braves)

  // Alt focuses the first roster member with the existing camera/panel owners.
  await page.keyboard.press('Digit2')
  const before = await state(page)
  const target = await page.evaluate(() =>
    window.testSceneRef.current.world.units.find(u => u.team === 'blue' && u.hp > 0 && u.groups & 2).id)
  assert.equal(target, braves[0], 'first roster member of group 1')
  await page.keyboard.press('Alt+Digit1')
  s = await state(page)
  assert.deepEqual(s.selected, braves, 'Alt recalls the group')
  assert.equal(s.motion.active, 1, 'Alt starts a camera journey')
  await page.waitForFunction(() => !window.testSceneRef.current.cameraMotion.active, null, { timeout: 30000 })
  const arrived = await page.evaluate(id => {
    const scene = window.testSceneRef.current
    return { camera: { ...scene.cameraPosition }, panel: scene.objectPanels.panels.has(id) }
  }, target)
  assert.equal(arrived.panel, true, 'the first member panel opens')
  assert.equal(arrived.camera.angle, before.camera.angle, 'heading is kept')
  assert.notDeepEqual([arrived.camera.x, arrived.camera.y], [before.camera.x, before.camera.y])
  await page.screenshot({ path: resolve(output, 'alt-1-focused.png') })

  // Current checkpoint save/load retains membership on the restored people.
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
  await page.waitForFunction(() => window.testStore.hasCheckpoint())
  await page.getByRole('button', { name: 'Load checkpoint', exact: true }).click()
  await bindGame(page)
  await page.waitForFunction(() => window.testSceneRef.current?.world === window.testStore.getWorld())
  await page.waitForFunction(() => !document.querySelector('dialog[open]'))
  await page.evaluate(() => window.testStore.change(world => { world.speed = 0; world.selected = [] }))
  await collapseMessages(page)
  await page.mouse.move(900, 400)
  await page.keyboard.press('Digit1')
  s = await state(page)
  assert.deepEqual(s.selected, braves, 'loaded checkpoint keeps group 1')

  // Updated in-game help.
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  const menu = page.getByRole('dialog', { name: 'Game menu', exact: true })
  await menu.getByRole('button', { name: 'Options', exact: true }).click()
  await menu.getByRole('button', { name: 'Browser compatibility and help', exact: true }).click()
  const help = page.getByText('Store selected followers as group 1–6', { exact: false })
  await help.scrollIntoViewIfNeeded()
  await page.screenshot({ path: resolve(output, 'help-controls.png') })

  const renderer = await page.evaluate(() => {
    const gl = window.testSceneRef.current.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
    return gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER)
  })
  assert.deepEqual(receipt.errors, [])
  const result = { braves, shaman, focus: { before: before.camera, arrived }, renderer,
    limitations: 'Headless rendering; Mission 1 opening roster; browser-reserved chords (Ctrl/Alt+digit on some platforms) are not exercised.' }
  writeFileSync(resolve(output, 'follower-groups.json'), JSON.stringify(result, null, 2) + '\n')
  return result
}
