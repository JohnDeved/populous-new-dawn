import assert from 'node:assert/strict'

// One 25s operation budget, also bounded by the caller's existing abort/close timer.
// Evaluate, resize and dispose RPCs do not gain an independent hard deadline.
export async function settlePauseStyleViewport(page, modal, viewport, signal) {
  const deadline = Date.now() + 25000
  const remaining = () => {
    signal.throwIfAborted()
    const ms = deadline - Date.now()
    assert.ok(ms > 0, 'Pause style resize budget expired')
    return ms
  }
  remaining()
  const owner = await modal.evaluateHandle(dialog => ({
    dialog, frame: dialog.firstElementChild, panel: dialog.dataset.panel,
    world: window.testStore.getWorld(), scene: window.testSceneRef.current,
  }))
  let failed = false
  try {
    remaining()
    await page.setViewportSize(viewport)
    const settled = ({ owner, viewport }) => {
      const { dialog, frame, world, panel, scene } = owner
      if (!dialog.isConnected || !dialog.open ||
          document.querySelector('dialog[data-original-pause-menu]') !== dialog ||
          !frame?.isConnected || dialog.firstElementChild !== frame ||
          dialog.dataset.panel !== panel || window.testStore.getWorld() !== world ||
          window.testSceneRef.current !== scene || scene.world !== world || !world.paused)
        throw new Error('Pause style resize owner changed')
      const scale = Math.min(viewport.width / 640, viewport.height / 480)
      return innerWidth === viewport.width && innerHeight === viewport.height &&
        Number(getComputedStyle(dialog).getPropertyValue('--frontend-scale')) === scale &&
        new DOMMatrixReadOnly(getComputedStyle(frame).transform).a === scale
    }
    const ready = await page.waitForFunction(settled, { owner, viewport }, { timeout: remaining() })
    await ready.dispose()
    const details = modal.locator('[aria-label="Checkpoint details"]')
    await details.focus({ timeout: remaining() })
    remaining()
    await page.keyboard.press('Home')
    const top = await page.waitForFunction(() =>
      document.querySelector('[aria-label="Checkpoint details"]').scrollTop === 0,
    null, { timeout: remaining() })
    await top.dispose()
    remaining()
    assert.equal(await page.evaluate(settled, { owner, viewport }), true, 'Pause style viewport changed before measurement')
    remaining()
    return details
  } catch (error) {
    failed = true
    throw error
  } finally {
    try { await owner.dispose() } catch (error) { if (!failed) throw error }
  }
}
