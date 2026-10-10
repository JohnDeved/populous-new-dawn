// Screenshot-only baseline. No nearby observer, injected state or campaign route.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { waitForShamanReadiness } from '../browser-game.mjs'

export default async function ({ page, openMission, output, receipt, signal }) {
  await openMission(1)
  const readiness = await waitForShamanReadiness(page, { timeout: 30000 })
  signal.throwIfAborted()
  await page.getByTitle('followers', { exact: true }).click()
  await page.getByRole('button', { name: 'Pause game', exact: true }).click()
  await page.screenshot({ path: resolve(output, 'before-global-followers.png'), timeout: 5000 })
  const observed = await page.evaluate(() => {
    const scene = window.testSceneRef.current, world = scene.world
    return { level: world.outcome.level, turn: world.turn, paused: world.paused,
      current: scene.isCurrent() && world === window.testStore.getWorld(),
      camera: { ...scene.cameraPosition }, viewport: [innerWidth, innerHeight], dpr: devicePixelRatio,
      classes: [...document.querySelectorAll('.tribe-classes button')].map(button => ({
        label: button.getAttribute('aria-label'), disabled: button.disabled,
        count: button.querySelector('.follower-number')?.getAttribute('aria-label') ?? null,
      })),
      originalButton: document.querySelector('.globe-button')?.getAttribute('aria-label'),
    }
  })
  const report = { source: receipt.source, readiness, observed,
    screenshot: 'before-global-followers.png',
    limits: 'Exact original application M1 global Followers surface at normal DPR. Screenshot baseline only; no nearby behavior, matching-turn or native-raster claim.' }
  writeFileSync(resolve(output, 'baseline.json'), `${JSON.stringify(report, null, 2)}\n`)
  assert.equal(observed.level, 1)
  assert.equal(observed.current, true)
  assert.equal(observed.paused, true)
  assert.equal(observed.originalButton, 'Planet overview')
  assert.equal(observed.classes.length, 6)
  assert.deepEqual(receipt.errors, [])
  return report
}
