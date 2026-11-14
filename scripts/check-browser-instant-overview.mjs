// Start the dev server, then: POPULOUS_URL=http://localhost:3000 node scripts/check-browser-instant-overview.mjs [captureDir]
// Real keyboard input. Shift+Return and Ctrl+Return (native action 0xc5, 0041d4b0) enter
// and leave World View at once. Plain Return (0x15) keeps the animated transition. See
// decomp/research/instant-overview.md.
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import sharp from 'sharp'
import { openGame } from './browser-game.mjs'

const captures = process.argv[2] ?? 'work/instant-overview'
mkdirSync(captures, { recursive: true })
const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  const viewport = page.locator('.world-viewport canvas.battlefield')
  await viewport.focus()
  const state = () => page.evaluate(() => {
    const s = window.testScene
    return { stage: s.overviewStage, overview: s.overviewActive, drawMode: s.world.drawMode,
      preset: s.viewPreset, transition: s.viewTransition?.remaining ?? 0, angle: s.cameraPosition.angle,
      bearing: s.cameraBearing, morph: { active: s.globeMorph.active, value: s.globeMorph.value },
      globe: s.globe.visible, ground: s.ground.visible, center: s.view.center,
      openMessages: document.querySelectorAll('.campaign-messages details[open]').length }
  })
  // Deterministic stepping: stop the RAF loop and drive the shipped camera clock plus one
  // real render per step (the same harness as check-browser-globe-transition.mjs).
  const frame = (n = 1) => page.evaluate(n => {
    const s = window.testScene
    for (let i = 0; i < n; i++) s.updateCameraMotion(1 / 24)
    s.animate(s.previous); cancelAnimationFrame(s.frame)
  }, n)
  const shot = async name => {
    const path = `${captures}/${name}.png`
    await page.screenshot({ path })
    const { data, info } = await sharp(path).extract({ left: 0, top: 0, width: 1100, height: 760 })
      .raw().toBuffer({ resolveWithObject: true })
    let dark = 0
    for (let i = 0; i < data.length; i += info.channels)
      if (data[i] + data[i + 1] + data[i + 2] < 60) dark++
    return { path, darkFraction: dark / (info.width * info.height), data }
  }
  const difference = (a, b) => {
    let sum = 0
    for (let i = 0; i < a.data.length; i++) sum += Math.abs(a.data[i] - b.data[i])
    return sum / a.data.length
  }
  const report = { steps: [] }
  const step = (name, value) => { report.steps.push({ name, ...value }); return value }

  // Mission 1 opens with campaign messages. While one is open, any Enter press (Shift
  // included) only closes it, like native 004a9d90 → process_cmd 0xb0 (#1045).
  const opened = (await state()).openMessages
  assert.ok(opened > 0, 'Mission 1 opens with a campaign message to close')
  {
    await page.keyboard.press('Shift+Enter')
    const s = step('shift-enter-closes-messages', { openedBefore: opened, ...(await state()) })
    assert.equal(s.openMessages, 0, 'Shift+Return closes the open campaign messages')
    assert.equal(s.overview, false, 'the closing press does not reach World View')
    assert.equal(s.stage, null)
  }

  await page.evaluate(() => {
    const s = window.testScene
    cancelAnimationFrame(s.frame); s.world.speed = 0; s.world.paused = true
    s.focus({ x: 2, z: 30 }); s.cameraBearing = 333 * Math.PI / 1024
    s.cameraTime = 0; s.updateView()
  })
  await viewport.focus()
  await frame()
  const original = step('ground', await state())
  assert.equal(original.overview, false)
  assert.equal(original.angle, 333)
  const ground = await shot('0-ground')

  // Shift+Return: completed World View in the same press, with no transition frames.
  await page.keyboard.press('Shift+Enter')
  let s = step('shift-enter', await state())
  assert.equal(s.overview, true, 'Shift+Return enters World View at once')
  assert.equal(s.stage, null)
  assert.equal(s.transition, 0)
  assert.equal(s.drawMode, 2)
  assert.equal(s.preset, 4)
  assert.equal(s.angle, 0)
  assert.equal(s.bearing, 0)
  assert.deepEqual(s.morph, { active: false, value: 0 })
  await frame()
  s = await state()
  assert.equal(s.globe, true)
  assert.equal(s.ground, false)
  const globe = await shot('1-shift-enter-world-view')
  step('shift-enter-render', { darkFraction: globe.darkFraction })
  assert.ok(globe.darkFraction > ground.darkFraction + 0.2,
    `World View shows the space backdrop (${globe.darkFraction} vs ${ground.darkFraction})`)

  // A held chord toggles once (leave), its repeats do not re-enter; a fresh press re-enters.
  await page.keyboard.down('Shift')
  for (let i = 0; i < 4; i++) await page.keyboard.down('Enter')
  await page.keyboard.up('Enter')
  await page.keyboard.up('Shift')
  s = step('held-shift-enter', await state())
  assert.equal(s.overview, false, 'a held Shift+Return toggles only once')
  assert.equal(s.stage, null)
  await page.keyboard.press('Shift+Enter')
  assert.equal((await state()).overview, true)

  // Shift+Ctrl and Alt match no native overview record.
  await page.keyboard.press('Shift+Control+Enter')
  await page.keyboard.press('Alt+Enter')
  assert.equal((await state()).overview, true)

  // Ctrl+Return: back to the saved ground view in the same press.
  await page.keyboard.press('Control+Enter')
  s = step('ctrl-enter', await state())
  assert.equal(s.overview, false, 'Ctrl+Return leaves World View at once')
  assert.equal(s.stage, null)
  assert.equal(s.transition, 0)
  assert.equal(s.drawMode, 0)
  assert.equal(s.preset, original.preset)
  assert.equal(s.angle, 333)
  assert.equal(s.bearing, original.bearing)
  assert.deepEqual(s.morph, { active: false, value: 256 })
  assert.deepEqual(s.center, original.center)
  await frame()
  s = await state()
  assert.equal(s.ground, true)
  assert.equal(s.globe, false)
  const back = await shot('2-ctrl-enter-ground')
  const restored = difference(back, ground)
  step('ctrl-enter-render', { darkFraction: back.darkFraction, meanDifferenceFromGround: restored })
  assert.ok(restored < 4, `the restored ground view matches the starting view (${restored})`)

  // Plain Return keeps the animated entry; the instant chord is ignored during it.
  await page.keyboard.press('Enter')
  s = step('enter-animated', await state())
  assert.equal(s.stage, 'enter')
  assert.equal(s.overview, false)
  assert.ok(s.transition > 0, 'plain Return starts the ground transition')
  await frame(6)
  await page.keyboard.press('Shift+Enter')
  s = step('shift-enter-during-entry', await state())
  assert.equal(s.stage, 'enter', 'Shift+Return is ignored while the transition runs (0089ce36)')
  assert.equal(s.overview, false)
  await shot('3-enter-transition')
  for (let i = 0; i < 60 && ((await state()).stage !== null); i++) await frame()
  s = step('enter-complete', await state())
  // The real animated path ends in the same state the instant chord produced.
  const instantEntry = report.steps.find(step => step.name === 'shift-enter')
  for (const key of ['overview', 'stage', 'drawMode', 'preset', 'angle', 'bearing', 'transition', 'morph'])
    assert.deepEqual(s[key], instantEntry[key], `animated entry end state: ${key}`)

  // An animated entry composes with an instant exit to the same saved view.
  await page.keyboard.press('Shift+Enter')
  s = step('shift-enter-after-animated-entry', await state())
  assert.equal(s.overview, false)
  assert.equal(s.stage, null)
  assert.equal(s.preset, original.preset)
  assert.equal(s.angle, 333)

  // The real animated exit ends in the same state as the instant exit (Ctrl+Return).
  await page.keyboard.press('Shift+Enter')
  assert.equal((await state()).overview, true)
  await page.keyboard.press('Enter')
  assert.equal((await state()).stage, 'exit')
  for (let i = 0; i < 80 && ((await state()).stage !== null); i++) await frame()
  s = step('enter-exit-complete', await state())
  const instantExit = report.steps.find(step => step.name === 'ctrl-enter')
  for (const key of ['overview', 'stage', 'drawMode', 'preset', 'angle', 'bearing', 'transition', 'morph', 'center'])
    assert.deepEqual(s[key], instantExit[key], `animated exit end state: ${key}`)

  // The instant chord is ignored during an ordinary zoom transition (0089ce34).
  await page.keyboard.press('Equal')
  assert.ok((await state()).transition > 0, 'the zoom key starts a ground transition')
  await page.keyboard.press('Shift+Enter')
  s = step('shift-enter-during-zoom', await state())
  assert.equal(s.overview, false, 'Shift+Return is ignored during a ground zoom')
  assert.ok(s.transition > 0)

  assert.deepEqual(errors, [])
  report.status = 'passed'
  writeFileSync(`${captures}/receipt.json`, JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
} finally {
  await browser.close()
}
