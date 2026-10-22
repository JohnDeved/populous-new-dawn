import assert from 'node:assert/strict'

// Browser audio lives in the real in-game Options panel. Entering it legitimately
// pauses gameplay; leaving it restores the menu's own saved pause state. Never
// set World/audio state or click a hidden/stale gameplay footer as preparation.
export const audioOptionsControl = page => page.locator(
  'dialog[data-original-pause-menu][open] [data-original-options][data-skin="ingame"] .audio-settings button[data-option-key="audio"]'
)

export function observeOptionsAudio(expected = null) {
  const main = document.querySelector('main')
  let fiber = main?.[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
  for (; fiber; fiber = fiber.return)
    for (let hook = fiber.memoizedState; hook; hook = hook.next) {
      const audio = hook.memoizedState?.current
      if (audio?.buffers instanceof Map && typeof audio.setMusicVolume === 'function') {
        const actual = {
          enabled: audio.enabled, paused: audio.paused, context: audio.context?.state ?? null,
          mediaPaused: audio.music?.element.paused ?? null, backgroundScheduled: audio.backgroundTimer !== null,
        }
        return expected ? Object.entries(expected).every(([key, value]) => actual[key] === value) : actual
      }
    }
  throw new Error('Actual React-owned Soundscape not found')
}

async function disposeOwner(owner, primaryError) {
  try { await owner.dispose() }
  catch (error) {
    if (!primaryError) throw error
    try { primaryError.audioOptionsOwnerDisposeError = String(error) } catch {}
  }
}

export async function openAudioOptions(page, { timeout = 30000 } = {}) {
  assert.ok(Number.isFinite(timeout) && timeout > 0, 'Audio Options requires a bounded timeout')
  assert.equal(await page.locator('dialog[open]').count(), 0, 'Enter audio Options from gameplay, not another modal')
  const owner = await page.evaluateHandle(() => ({ world: window.testStore.getWorld(), scene: window.testSceneRef.current }))
  let error
  try {
    const wasPaused = await page.evaluate(({ world, scene }) => {
      if (scene.world !== world) throw new Error('Audio Options needs the current scene/world')
      return world.paused
    }, owner)
    assert.equal(typeof wasPaused, 'boolean')
    const button = name => page.getByRole('button', { name, exact: true })
    await button('Menu').click({ timeout })
    await button('Options').click({ timeout })
    await button('Browser compatibility and help').click({ timeout })
    const control = audioOptionsControl(page)
    await control.waitFor({ state: 'visible', timeout })
    const paused = await page.waitForFunction(() => {
      const modal = document.querySelector('dialog[data-original-pause-menu][open]')
      return window.testStore.getWorld().paused && modal?.matches(':modal') &&
        document.querySelectorAll('dialog[open]').length === 1
    }, null, { timeout })
    await paused.dispose()
    return { owner, wasPaused, timeout }
  } catch (failure) { error = failure; throw failure }
  finally { if (error) await disposeOwner(owner, error) }
}

export async function closeAudioOptions(page, entry) {
  let error
  try {
    const button = name => page.getByRole('button', { name, exact: true })
    for (const name of ['Back to Options', 'Back', 'Continue Game']) await button(name).click({ timeout: entry.timeout })
    await page.locator('dialog[data-original-pause-menu][open]').waitFor({ state: 'hidden', timeout: entry.timeout })
    const restored = await page.waitForFunction(wasPaused => window.testStore.getWorld().paused === wasPaused,
      entry.wasPaused, { timeout: entry.timeout })
    await restored.dispose()
    assert.equal(await page.evaluate(({ world, scene }) => window.testStore.getWorld() === world &&
      window.testSceneRef.current === scene && scene.world === world, entry.owner), true,
    'Audio Options must retain the actual scene and World objects')
  } catch (failure) { error = failure; throw failure }
  finally { await disposeOwner(entry.owner, error) }
}

export async function setSoundThroughOptions(page, enabled, options) {
  assert.equal(typeof enabled, 'boolean')
  const entry = await openAudioOptions(page, options)
  const control = audioOptionsControl(page)
  let error, closing = false
  try {
    assert.equal(await control.getAttribute('aria-label'), enabled ? '♫ Enable sound' : '♪ Sound on',
      'The requested real transition must start in the opposite state, not silently skip coverage')
    await control.click({ timeout: entry.timeout })
    const settled = await page.waitForFunction(enabled => {
      const node = document.querySelector('dialog[data-original-pause-menu][open] [data-option-key="audio"]')
      return !!node && !node.disabled && node.getAttribute('aria-busy') === 'false' &&
        node.getAttribute('aria-label') === (enabled ? '♪ Sound on' : '♫ Enable sound')
    }, enabled, { timeout: entry.timeout })
    await settled.dispose()
    const suspended = await page.waitForFunction(observeOptionsAudio, { enabled, paused: true, context: 'suspended' }, { timeout: entry.timeout })
    await suspended.dispose()
    const actual = await page.evaluate(observeOptionsAudio)
    assert.equal(actual.enabled, enabled)
    assert.equal(actual.paused, true, 'Options, not a gameplay footer, owns the legitimate audio pause')
    assert.equal(actual.context, 'suspended')
    closing = true
    await closeAudioOptions(page, entry)
    const running = enabled && !entry.wasPaused
    const restored = await page.waitForFunction(observeOptionsAudio, { enabled, paused: entry.wasPaused,
      context: running ? 'running' : 'suspended', mediaPaused: !running, backgroundScheduled: running }, { timeout: entry.timeout })
    await restored.dispose()
    return { wasPaused: entry.wasPaused, enabled }
  } catch (failure) { error = failure; throw failure }
  finally { if (!closing) await disposeOwner(entry.owner, error) }
}
