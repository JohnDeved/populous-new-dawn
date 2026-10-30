import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Called with the real running-world pause root open and a usable checkpoint.
// Observe only: all cancel events must come from Chrome's native keyboard action.
export async function checkPauseHeldEscape(page, output) {
  const modal = page.getByRole('dialog', { name: 'Game menu', exact: true })
  const button = name => page.getByRole('button', { name, exact: true })
  const records = []
  const snapshot = () => page.evaluate(() => {
    const scene = window.testSceneRef.current, world = window.testStore.getWorld()
    return {
      invariant: { paused: world.paused, turn: world.turn, time: world.time,
        pendingTime: world.pendingTime, randomState: world.randomState,
        animation: scene.gameClock.animationFrame, animationTime: scene.gameClock.animationTime },
      presentation: { worshipClock: world.worshipAcquisition.clock, cosmeticRandom: world.cosmeticRandom,
        sounds: world.sounds, camera: scene.cameraPosition },
      rawWorld: JSON.stringify(world),
    }
  })
  for (const label of ['Load Game', 'Save Game', 'Options', 'Restart Level', 'Quit Level', 'Quit Game']) {
    await button(label).click()
    await page.evaluate(() => {
      window.heldEscapeWorld = window.testStore.getWorld()
      window.heldEscapeEvents = []
      const dialog = document.querySelector('dialog[data-original-pause-menu]')
      const cancel = event => window.heldEscapeEvents.push({ type: 'cancel', trusted: event.isTrusted })
      const key = event => {
        if (event.key === 'Escape') window.heldEscapeEvents.push({
          type: event.type, trusted: event.isTrusted, repeat: event.repeat,
          prevented: event.defaultPrevented,
        })
      }
      dialog.addEventListener('cancel', cancel)
      document.addEventListener('keydown', key)
      document.addEventListener('keyup', key)
      window.removeHeldEscapeObservers = () => {
        dialog.removeEventListener('cancel', cancel)
        document.removeEventListener('keydown', key)
        document.removeEventListener('keyup', key)
      }
    })
    const before = await snapshot()
    let after = null
    try {
      await page.keyboard.down('Escape')
      await page.waitForFunction(() => document.querySelector('dialog[data-original-pause-menu]')?.dataset.panel === 'root')
      for (let repeat = 0; repeat < 3; repeat++) await page.keyboard.down('Escape')
      assert.equal(await modal.isVisible(), true)
      assert.equal(await modal.getAttribute('data-panel'), 'root')
      after = await snapshot()
      assert.equal(before.invariant.paused, true)
      assert.deepEqual(after.invariant, before.invariant, 'held Escape must preserve pause and logical clocks')
      assert.equal(await page.evaluate(() => window.testStore.getWorld() === window.heldEscapeWorld), true)
      const events = await page.evaluate(() => window.heldEscapeEvents)
      assert.deepEqual(events.filter(event => event.type === 'keydown'), [false, true, true, true].map(repeat => ({
        type: 'keydown', trusted: true, repeat, prevented: repeat,
      })))
      assert.deepEqual(events.filter(event => event.type === 'cancel'), [{ type: 'cancel', trusted: true }])
      await page.keyboard.up('Escape')
      await page.keyboard.press('Escape')
      await modal.waitFor({ state: 'hidden' })
      assert.equal(await page.evaluate(() => window.testStore.getWorld().paused), false)
      const completed = await page.evaluate(() => window.heldEscapeEvents)
      assert.equal(completed.filter(event => event.type === 'cancel' && event.trusted).length, 2)
      records.push({ label, events: completed, retainedWorld: true, simulationFrozenWhileHeld: true,
        before: { invariant: before.invariant, presentation: before.presentation },
        after: { invariant: after.invariant, presentation: after.presentation }, freshPressResumes: true })
    } catch (error) {
      writeFileSync(resolve(output, 'held-escape-failure.json'), JSON.stringify({
        label, before, after: after ?? await snapshot(), completed: records,
        events: await page.evaluate(() => window.heldEscapeEvents), error: String(error),
      }, null, 2))
      throw error
    } finally {
      await page.keyboard.up('Escape')
      await page.evaluate(() => window.removeHeldEscapeObservers())
    }
    await button('Menu').click()
    await modal.waitFor()
  }
  return records
}
