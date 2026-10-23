import assert from 'node:assert/strict'
import { campaignPopupSnapshot, prepareWorldInput } from './browser-world-input.mjs'

function portraitWorld() {
  return window.testStore?.getWorld() ?? window.testSceneRef?.current?.world ?? window.testScene?.world
}

function portraitSelectionState(expectedWorld) {
  const world = window.testStore?.getWorld() ?? window.testSceneRef?.current?.world ?? window.testScene?.world
  const scene = window.testSceneRef?.current ?? window.testScene
  return {
    sameWorld: world === expectedWorld,
    sameSceneWorld: scene?.world === world,
    status: world?.status,
    level: world?.outcome?.level,
    paused: world?.paused,
    inputMask: world?.inputMask,
    mode: world?.mode,
    selected: world ? [...world.selected] : [],
    menu: !!document.querySelector('dialog[open], [data-spell-test-menu], [data-world-selector], [data-debug-mission-picker], .loading-world'),
    modal: !!scene?.modalSuspended,
    fullscreen: !!document.fullscreenElement || !!document.querySelector('[data-fullscreen-control] button[aria-disabled="true"]'),
    popup: !!document.querySelector('.campaign-messages details[open]'),
  }
}

// Original portrait selection is additive. Scenarios requiring a new cohort must
// cancel targeting, then selection, through ordinary input. Never send an empty
// Escape: Page owns that input as Menu. This helper never pauses or clears data.
export async function clearPortraitSelection(page, { timeout = 2500, signal } = {}) {
  assert.ok(Number.isFinite(timeout) && timeout > 0, 'Invalid portrait input timeout')
  const deadline = performance.now() + timeout
  let expired = false, timer, rejectStop
  const stopped = new Promise((_, reject) => { rejectStop = reject })
  const abort = () => {
    expired = true
    rejectStop(signal.reason ?? new Error('Portrait selection cancellation aborted'))
  }
  const remaining = () => {
    signal?.throwIfAborted()
    const value = deadline - performance.now()
    assert.ok(!expired && value > 0, 'Portrait selection cancellation timed out')
    return value
  }
  const run = async () => {
    remaining()
    const expectedWorld = await page.evaluateHandle(portraitWorld)
    try {
      const read = async () => {
        remaining()
        return page.evaluate(portraitSelectionState, expectedWorld)
      }
      const before = await read(), steps = []
      const guard = state => {
        assert.equal(state.sameWorld, true, 'World replaced during portrait selection setup')
        assert.equal(state.sameSceneWorld, true, 'Scene and Store must own the same World')
        // app/mission-data.ts binds the tutorial to 79; Page routes its Escape to Menu.
        assert.notEqual(state.level, 79, 'Tutorial Escape opens Menu; portrait cohort cancellation is unsupported')
        assert.equal(state.status, 'playing', 'Portrait selection requires a playing world')
        assert.equal(state.paused, before.paused, 'Pause ownership changed during portrait selection setup')
        assert.equal(state.inputMask, 0, 'Portrait cancellation cannot skip an introduction')
        assert.equal(state.modal, false, 'A modal owns input before portrait setup')
        assert.equal(state.fullscreen, false, 'Fullscreen owns Escape before portrait setup')
        assert.equal(state.menu, false, 'Close the menu through its owning flow before portrait setup')
        assert.equal(state.popup, false, 'Open campaign popup owns input; portrait setup does not dismiss messages')
      }
      guard(before)
      // Reuse the public focus/deadline owner, but fail before it can close a real
      // notification. Its repeated snapshot also catches a popup opened by focus.
      const inputPage = {
        evaluate: async fn => {
          assert.equal(fn, campaignPopupSnapshot)
          guard(await read())
          const snapshot = await page.evaluate(fn)
          remaining()
          assert.ok(snapshot.every(message => !message.open),
            'Open campaign popup owns input; portrait setup does not dismiss messages')
          return snapshot
        },
        locator: selector => {
          assert.equal(selector, '.world-viewport')
          return { focus: async options => {
            guard(await read())
            remaining()
            await page.locator(selector).focus(options)
            remaining()
            guard(await read())
          } }
        },
      }
      let state = before
      for (let count = 0; count < 2 && (state.mode || state.selected.length); count++) {
        await prepareWorldInput(inputPage, { timeout: remaining(), keyboardFocus: true, signal })
        const ready = await read()
        guard(ready)
        assert.deepEqual([ready.mode, ready.selected], [state.mode, state.selected],
          'Selection changed before public portrait cancellation')
        remaining()
        await page.keyboard.press('Escape')
        const after = await read()
        guard(after)
        assert.equal(after.mode, null, 'Public Escape must cancel targeting first')
        assert.deepEqual(after.selected, ready.mode ? ready.selected : [],
          ready.mode ? 'Target cancellation must preserve the group' : 'Public Escape must clear the group')
        steps.push({ action: ready.mode ? 'cancel-targeting' : 'clear-selection', before: ready, after })
        state = after
      }
      assert.equal(state.mode, null)
      assert.deepEqual(state.selected, [])
      return { before, after: state, steps }
    } finally {
      await expectedWorld.dispose()
    }
  }
  try {
    remaining()
    signal?.addEventListener('abort', abort, { once: true })
    timer = setTimeout(() => {
      expired = true
      rejectStop(new Error('Portrait selection cancellation timed out'))
    }, remaining())
    return await Promise.race([run(), stopped])
  } finally {
    // A late read/focus resolution must never authorize another public input.
    expired = true
    clearTimeout(timer)
    signal?.removeEventListener('abort', abort)
  }
}
