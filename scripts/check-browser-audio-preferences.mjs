// Ordinary UI volume persistence and real Soundscape gain acceptance.
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium, expect } from '@playwright/test'
import { bindGame } from './browser-game.mjs'
import { AUDIO_PREFERENCES_KEY, DEFAULT_AUDIO_PREFERENCES } from '../app/audio-preferences.ts'

assert.ok(process.env.PND_QUEUE_JOB_ID && process.env.PND_QUEUE_OUTPUT, 'Use the supervised queue')
const output = join(process.env.PND_QUEUE_OUTPUT, 'audio-preferences')
mkdirSync(output)
const report = {
  job: process.env.PND_QUEUE_JOB_ID,
  status: 'RUNNING',
  stage: 'startup',
  checks: [],
  errors: [],
  limits: [
    'Browser-local options only; no original save/options or native audio-mixer parity claim.',
    'Real menu/range/enable/restart/checkpoint inputs; audio refs are observed, never replaced.',
    'Malformed/blocked browser storage are explicit negative inputs; no game actors or rewards injected.',
  ],
}
const save = () =>
  writeFileSync(join(output, 'evidence.json'), JSON.stringify(report, null, 2) + '\n')
let browser, page
const deadline = setTimeout(
  () => void browser?.close(),
  Math.max(1, Date.parse(process.env.PND_QUEUE_DEADLINE) - Date.now() - 15000)
)
process.once('SIGTERM', () => void browser?.close())

async function audioState(page) {
  return page.evaluate(() => {
    const main = document.querySelector('main')
    let fiber = main?.[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
    for (; fiber; fiber = fiber.return)
      for (let hook = fiber.memoizedState; hook; hook = hook.next) {
        const value = hook.memoizedState?.current
        if (value?.buffers instanceof Map && typeof value.setMusicVolume === 'function')
          return {
            volume: value.volume,
            musicVolume: value.musicVolume,
            enabled: value.enabled,
            context: value.context?.state ?? null,
            masterGain: value.master?.gain.value ?? null,
            musicGain: value.music?.gain.gain.value ?? null,
            musicPaused: value.music?.element.paused ?? null,
            buffers: value.buffers.size,
            randomState: value.randomState,
          }
      }
    throw new Error('The live UI Soundscape was not found')
  })
}
async function ready(page) {
  await bindGame(page)
  await page.waitForFunction(
    () => window.testScene.world.flyby.flags & 1 || !window.testScene.world.inputMask
  )
  const skip = page.locator('.skip-introduction')
  if (await skip.isVisible()) await skip.click()
  await page.waitForFunction(() => !window.testStore.getWorld().inputMask)
}
async function start(page, button = 'Mission 1') {
  await page.goto(process.env.POPULOUS_URL, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: button, exact: true }).click()
  await ready(page)
}
async function settings(page) {
  await page.getByRole('button', { name: 'Game settings', exact: true }).click()
  await page.getByRole('heading', { name: 'Game settings', exact: true }).waitFor()
  await page.waitForFunction(() => window.testStore.getWorld().paused)
}
async function volume(page, label, value) {
  const slider = page.getByRole('slider', { name: label, exact: true })
  await slider.focus()
  await slider.press('Home')
  for (let step = 0; step < Math.round(value / 0.05); step++) await slider.press('ArrowRight')
  assert.ok(Math.abs(Number(await slider.inputValue()) - value) < 1e-8, label)
}
async function assertValues(page, master, music, label) {
  assert.ok(
    Math.abs(
      Number(await page.getByRole('slider', { name: 'Master volume', exact: true }).inputValue()) -
        master
    ) < 1e-8
  )
  assert.ok(
    Math.abs(
      Number(await page.getByRole('slider', { name: 'Music volume', exact: true }).inputValue()) -
        music
    ) < 1e-8
  )
  const actual = await audioState(page)
  assert.ok(Math.abs(actual.volume - master) < 1e-8)
  assert.ok(Math.abs(actual.musicVolume - music) < 1e-8)
  if (actual.enabled) {
    assert.ok(Math.abs(actual.masterGain - master) < 1e-6)
    assert.ok(Math.abs(actual.musicGain - music) < 1e-6)
  }
  report.checks.push({ label, actual })
  save()
  return actual
}
async function gameplay(page) {
  return page.evaluate(() => {
    const w = window.testStore.getWorld()
    return {
      turn: w.turn,
      time: w.time,
      randomState: w.randomState,
      selected: [...w.selected],
      units: w.units.map(({ id, x, z, hp, team, kind }) => ({ id, x, z, hp, team, kind })),
      shots: { ...w.shots },
      gifts: structuredClone(w.gifts),
      stats: { ...w.stats },
      mission: w.outcome.level,
      completed: window.testStore.getCompletedMissions(),
    }
  })
}
async function newPage(context) {
  const page = await context.newPage()
  page.setDefaultTimeout(45000)
  page.on('pageerror', error => report.errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') report.errors.push(message.text())
  })
  return page
}

try {
  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  page = await newPage(context)
  await start(page)
  await settings(page)
  const defaults = await assertValues(
    page,
    DEFAULT_AUDIO_PREFERENCES.volume,
    DEFAULT_AUDIO_PREFERENCES.musicVolume,
    'first-visit-defaults'
  )
  assert.equal(defaults.enabled, false)
  assert.equal(defaults.context, null)
  assert.equal(await page.evaluate(key => localStorage.getItem(key), AUDIO_PREFERENCES_KEY), null)
  await page.evaluate(() => localStorage.setItem('audio-preference-test-sentinel', 'preserve'))
  const before = await gameplay(page)
  report.stage = 'real-range-inputs'
  await volume(page, 'Master volume', 0.2)
  await volume(page, 'Music volume', 0.4)
  await assertValues(page, 0.2, 0.4, 'ordinary-sliders')
  assert.deepEqual(
    await gameplay(page),
    before,
    'Volume controls changed gameplay or simulation RNG'
  )
  assert.deepEqual(
    await page.evaluate(key => JSON.parse(localStorage.getItem(key)), AUDIO_PREFERENCES_KEY),
    { version: 1, volume: 0.2, musicVolume: 0.4 }
  )

  report.stage = 'real-audio-enable-gains'
  await page.locator('.audio-settings button').click()
  await expect(page.locator('.audio-settings button')).toHaveText('♪ Sound on', { timeout: 90000 })
  const enabled = await assertValues(page, 0.2, 0.4, 'real-audio-gains')
  assert.equal(enabled.enabled, true)
  assert.ok(enabled.buffers > 30)
  assert.equal(enabled.context, 'suspended', 'Settings dialog preserves audio pause')
  await page.getByRole('button', { name: 'Close menu', exact: true }).click()
  await expect.poll(async () => (await audioState(page)).context).toBe('running')
  await settings(page)
  await volume(page, 'Master volume', 0)
  await volume(page, 'Music volume', 0.75)
  await assertValues(page, 0, 0.75, 'zero-master-retained')
  await page.screenshot({ path: join(output, 'saved-volume-controls.png') })

  report.stage = 'checkpoint-and-restart'
  await page.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
  await page.waitForFunction(() => window.testStore.hasCheckpoint())
  await page.getByRole('button', { name: 'Restart world', exact: true }).click()
  await ready(page)
  await settings(page)
  await assertValues(page, 0, 0.75, 'ordinary-restart')
  await page.getByRole('button', { name: 'Load checkpoint', exact: true }).click()
  await ready(page)
  await settings(page)
  await assertValues(page, 0, 0.75, 'ordinary-checkpoint-load')

  report.stage = 'fresh-page-and-mission'
  await page.close()
  page = await newPage(context)
  await start(page, 'Load Game')
  await settings(page)
  const restored = await assertValues(page, 0, 0.75, 'fresh-page-load-game')
  assert.equal(restored.enabled, false)
  assert.equal(restored.context, null, 'Reload must not autoplay or create an AudioContext')
  assert.equal(
    await page.evaluate(() => localStorage.getItem('audio-preference-test-sentinel')),
    'preserve'
  )
  await page.close()
  page = await newPage(context)
  await start(page, 'Mission 2')
  await settings(page)
  await assertValues(page, 0, 0.75, 'different-mission')
  await context.close()

  report.stage = 'malformed-record'
  const corrupt = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await corrupt.addInitScript(key => localStorage.setItem(key, '{broken'), AUDIO_PREFERENCES_KEY)
  page = await newPage(corrupt)
  await start(page)
  await settings(page)
  await assertValues(page, 0.35, 0.65, 'malformed-fallback')
  assert.equal(
    await page.evaluate(key => localStorage.getItem(key), AUDIO_PREFERENCES_KEY),
    '{broken',
    'Startup must not rewrite corrupt preferences'
  )
  await volume(page, 'Master volume', 0.1)
  assert.deepEqual(
    await page.evaluate(key => JSON.parse(localStorage.getItem(key)), AUDIO_PREFERENCES_KEY),
    { version: 1, volume: 0.1, musicVolume: 0.65 }
  )
  await corrupt.close()

  report.stage = 'unavailable-storage'
  const blocked = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await blocked.addInitScript(key => {
    const get = Storage.prototype.getItem,
      set = Storage.prototype.setItem
    Storage.prototype.getItem = function (name) {
      if (name === key) throw new DOMException('Storage denied for test', 'SecurityError')
      return get.call(this, name)
    }
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException('Storage quota for test', 'QuotaExceededError')
      return set.call(this, name, value)
    }
  }, AUDIO_PREFERENCES_KEY)
  page = await newPage(blocked)
  await start(page)
  await settings(page)
  const blockedBefore = await gameplay(page)
  await volume(page, 'Master volume', 0.3)
  await volume(page, 'Music volume', 0.15)
  await assertValues(page, 0.3, 0.15, 'blocked-storage-session-control')
  await expect(
    page.getByRole('status').filter({ hasText: 'Volume changes apply for this session' })
  ).toBeVisible()
  assert.deepEqual(await gameplay(page), blockedBefore)
  await page.screenshot({ path: join(output, 'session-only-warning.png') })
  await blocked.close()
  assert.deepEqual(report.errors, [])
  report.status = 'PASS_AUDIO_PREFERENCES_UI'
} catch (error) {
  report.status = 'FAILED_AUDIO_PREFERENCES_UI'
  report.error = error.stack ?? String(error)
  if (page && !page.isClosed())
    await page.screenshot({ path: join(output, 'failure.png') }).catch(() => {})
  process.exitCode = 1
} finally {
  clearTimeout(deadline)
  await browser?.close()
  report.browserClosed = true
  save()
  console.log(
    JSON.stringify(
      {
        status: report.status,
        stage: report.stage,
        error: report.error,
        checks: report.checks.length,
        output,
      },
      null,
      2
    )
  )
}
