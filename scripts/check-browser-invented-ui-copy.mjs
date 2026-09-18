import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const url = process.env.POPULOUS_URL ?? 'http://localhost:4335'
const source = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8')

const removed = [
  'POPULOUS · THE FIRST DAWN',
  'Choose your world',
  'A world is awakening',
  'The world could not awaken',
  'THE FIRST STEP TO GODHOOD',
  'THE CIRCLE IS BROKEN',
  'A world united.',
  'Even gods can fall.',
  'Your people will remember this dawn.',
  'Your tribe has fallen, but every beginning is another chance.',
  'Begin again',
  'The world can wait.',
  'Return to the world',
]
for (const text of removed)
  assert.equal(source.includes(text), false, `invented page copy remains: ${text}`)

for (const text of [
  'Populous: The Beginning',
  'Select Level',
  'Loading...',
  'Loading failed',
  'Level Complete',
  'Level Failed',
  'Level Won',
  'Level Lost',
  'You have failed to conquer this world.',
  'Restart Level',
  'Game settings',
  'Continue Game',
  'The battlefield did not finish loading. Retry the same request when you are ready.',
  'Technical details',
  'Try again',
  'Save checkpoint',
  'Load checkpoint',
])
  assert.ok(source.includes(text), `expected preserved/replacement page copy: ${text}`)

async function startMission(page, mission) {
  const button = page.getByRole('button', { name: `Mission ${mission}`, exact: true })
  await button.waitFor()
  await button.focus()
  await page.keyboard.press('Enter')
}

const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
try {
  // Startup chooser: use original localized title/selection label without changing the
  // browser's existing mission/checkpoint compatibility instructions or accessible controls.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.stack ?? error.message))
    page.on('console', message => {
      if (message.type() === 'error' && !message.text().includes('Failed to load resource'))
        errors.push(message.text())
    })
    await page.goto(url, { waitUntil: 'networkidle' })
    const start = page.getByRole('dialog', { name: 'Start game' })
    await start.waitFor()
    await start.getByText('Populous: The Beginning', { exact: true }).waitFor()
    await start.getByRole('heading', { name: 'Select Level', exact: true }).waitFor()
    await start.getByText(/^Choose a mission/).waitFor()
    await start.getByRole('button', { name: 'Tutorial', exact: true }).waitFor()
    await start.getByRole('button', { name: 'Mission 1', exact: true }).waitFor()
    assert.deepEqual(errors, [])
    await context.close()
  }

  // Modern load failure remains explicit and recoverable; only its poetic heading changed.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.stack ?? error.message))
    page.on('console', message => {
      if (
        message.type() === 'error' &&
        !message.text().includes('Failed to load resource') &&
        !message.text().includes('Texture load failed')
      )
        errors.push(message.text())
    })
    await page.route('**/original/landscape.bin', route => route.abort('failed'))
    await page.goto(url, { waitUntil: 'networkidle' })
    await startMission(page, 1)
    await page.getByRole('heading', { name: 'Loading failed', exact: true }).waitFor()
    await page
      .getByText('The battlefield did not finish loading. Retry the same request when you are ready.', {
        exact: true,
      })
      .waitFor()
    await page.getByText('Technical details', { exact: true }).waitFor()
    await page.getByRole('button', { name: 'Try again', exact: true }).waitFor()
    assert.deepEqual(errors, [])
    await context.close()
  }

  // In-game compatibility controls and result actions stay functional while decorative prose
  // is replaced by evidenced original result/menu labels.
  {
    const { page, errors } = await openGame(browser, 1)
    await page.getByRole('button', { name: 'Game settings', exact: true }).click()
    const settings = page.getByRole('dialog')
    await settings.getByText('Populous: The Beginning', { exact: true }).waitFor()
    await settings.getByRole('heading', { name: 'Game settings', exact: true }).waitFor()
    await settings.getByRole('button', { name: /Continue Game/ }).waitFor()
    await settings.getByRole('button', { name: 'Save checkpoint', exact: true }).waitFor()
    await settings.getByRole('button', { name: 'Load checkpoint', exact: true }).waitFor()
    await settings.getByRole('button', { name: 'Restart world', exact: true }).waitFor()
    await settings.getByRole('button', { name: /Continue Game/ }).click()

    await page.evaluate(() => {
      cancelAnimationFrame(globalThis.testScene.frame)
      globalThis.testScene.frame = 0
      const world = globalThis.testStore.getWorld()
      world.status = 'won'
      world.outcome.cameraPlaying = false
      globalThis.testStore.update()
    })
    const result = page.locator('.end-screen')
    await result.getByText('Level Complete', { exact: true }).waitFor()
    await result.getByRole('heading', { name: 'Level Won', exact: true }).waitFor()
    await result.getByText(/^The .* are defeated\.$/).waitFor()
    await result.getByRole('button', { name: /Continue to Mission 2/ }).waitFor()
    assert.equal(await result.getByText(/remember this dawn/i).count(), 0)

    await page.evaluate(() => {
      const world = globalThis.testStore.getWorld()
      world.status = 'lost'
      world.outcome.cameraPlaying = false
      globalThis.testStore.update()
    })
    await result.getByText('Level Failed', { exact: true }).waitFor()
    await result.getByRole('heading', { name: 'Level Lost', exact: true }).waitFor()
    await result.getByText('You have failed to conquer this world.', { exact: true }).waitFor()
    await result.getByRole('button', { name: /Restart Level/ }).waitFor()

    assert.deepEqual(errors, [])
    await page.context().close()
  }

  console.log(
    'PASS: startup/settings/loading-error/result copy removes invented flavor while original labels and necessary modern controls/retry facts remain visible'
  )
} finally {
  await browser.close()
}
