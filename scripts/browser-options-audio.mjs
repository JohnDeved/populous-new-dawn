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

// Native episodes supply their existing signal/deadline. Standalone callers get
// one finite aggregate budget, not a fresh full timeout for each menu click.
export function createAudioOptionsBudget({ timeout = 30000, signal, deadlineAt, now = Date.now, cleanupErrors = [] } = {}) {
  assert.ok(Number.isFinite(timeout) && timeout > 0, 'Audio Options requires a bounded timeout')
  assert.equal(typeof now, 'function')
  assert.ok(Array.isArray(cleanupErrors), 'Audio Options cleanup evidence must be caller-readable')
  const deadline = deadlineAt === undefined ? now() + timeout : deadlineAt
  assert.ok(Number.isFinite(deadline), 'Audio Options requires a finite deadline')
  const check = () => {
    signal?.throwIfAborted()
    const remaining = Math.min(timeout, deadline - now())
    assert.ok(Number.isFinite(remaining) && remaining > 0, 'Audio Options deadline expired')
    return remaining
  }
  const step = async action => {
    const result = await action(check())
    check()
    return result
  }
  return { check, step, cleanupErrors }
}
async function disposeOwner(owner, failed, primaryError, budget, phase = 'audio-options-owner') {
  try { await owner?.dispose() }
  catch (error) {
    budget.cleanupErrors.push({ phase, error: String(error), primaryFailure: failed })
    if (!failed) throw error
    // Preserve the original rejection even when it is null/false/undefined.
    try { primaryError.audioOptionsOwnerDisposeError = String(error) } catch {}
  }
}
export async function waitForAudioObservation(budget, action) {
  let handle, failed = false, error
  try {
    // Register the handle before the post-await guard can reject, so cleanup
    // remains independent of a newly aborted or expired input budget.
    await budget.step(async timeout => { handle = await action(timeout) })
  } catch (failure) { failed = true; error = failure; throw failure }
  finally { await disposeOwner(handle, failed, error, budget, 'audio-options-observation') }
  budget.check()
}

export async function openAudioOptions(page, options) {
  const budget = createAudioOptionsBudget(options)
  let owner, failed = false, error
  try {
    assert.equal(await budget.step(() => page.locator('dialog[open]').count()), 0,
      'Enter audio Options from gameplay, not another modal')
    await budget.step(async () => { owner = await page.evaluateHandle(() => ({ world: window.testStore.getWorld(), scene: window.testSceneRef.current })) })
    const wasPaused = await budget.step(() => page.evaluate(({ world, scene }) => {
      if (scene.world !== world) throw new Error('Audio Options needs the current scene/world')
      return world.paused
    }, owner))
    assert.equal(typeof wasPaused, 'boolean')
    const button = name => page.getByRole('button', { name, exact: true })
    for (const name of ['Menu', 'Options', 'Browser compatibility and help'])
      await budget.step(timeout => button(name).click({ timeout }))
    const control = audioOptionsControl(page)
    await budget.step(timeout => control.waitFor({ state: 'visible', timeout }))
    await waitForAudioObservation(budget, timeout => page.waitForFunction(() => {
      const modal = document.querySelector('dialog[data-original-pause-menu][open]')
      return window.testStore.getWorld().paused && modal?.matches(':modal') &&
        document.querySelectorAll('dialog[open]').length === 1
    }, null, { timeout }))
    budget.check()
    return { owner, wasPaused, budget }
  } catch (failure) { failed = true; error = failure; throw failure }
  finally { if (failed) await disposeOwner(owner, true, error, budget) }
}

export async function closeAudioOptions(page, entry) {
  const { budget } = entry
  let failed = false, error
  try {
    const button = name => page.getByRole('button', { name, exact: true })
    for (const name of ['Back to Options', 'Back', 'Continue Game'])
      await budget.step(timeout => button(name).click({ timeout }))
    await budget.step(timeout => page.locator('dialog[data-original-pause-menu][open]').waitFor({ state: 'hidden', timeout }))
    await waitForAudioObservation(budget, timeout => page.waitForFunction(wasPaused => window.testStore.getWorld().paused === wasPaused,
      entry.wasPaused, { timeout }))
    assert.equal(await budget.step(() => page.evaluate(({ world, scene }) => window.testStore.getWorld() === world &&
      window.testSceneRef.current === scene && scene.world === world, entry.owner)), true,
    'Audio Options must retain the actual scene and World objects')
  } catch (failure) { failed = true; error = failure; throw failure }
  finally { await disposeOwner(entry.owner, failed, error, budget) }
  // Cleanup is allowed after abort, but cannot turn a late settlement into success.
  budget.check()
}

export async function setSoundThroughOptions(page, enabled, options) {
  assert.equal(typeof enabled, 'boolean')
  const entry = await openAudioOptions(page, options)
  const { budget } = entry, control = audioOptionsControl(page)
  let failed = false, error, closing = false
  try {
    assert.equal(await budget.step(() => control.getAttribute('aria-label')), enabled ? '♫ Enable sound' : '♪ Sound on',
      'The requested real transition must start in the opposite state, not silently skip coverage')
    await budget.step(timeout => control.click({ timeout }))
    await waitForAudioObservation(budget, timeout => page.waitForFunction(enabled => {
      const node = document.querySelector('dialog[data-original-pause-menu][open] [data-option-key="audio"]')
      return !!node && !node.disabled && node.getAttribute('aria-busy') === 'false' &&
        node.getAttribute('aria-label') === (enabled ? '♪ Sound on' : '♫ Enable sound')
    }, enabled, { timeout }))
    await waitForAudioObservation(budget, timeout => page.waitForFunction(observeOptionsAudio, { enabled, paused: true, context: 'suspended' }, { timeout }))
    const actual = await budget.step(() => page.evaluate(observeOptionsAudio))
    assert.equal(actual.enabled, enabled)
    assert.equal(actual.paused, true, 'Options, not a gameplay footer, owns the legitimate audio pause')
    assert.equal(actual.context, 'suspended')
    closing = true
    await closeAudioOptions(page, entry)
    budget.check()
    const running = enabled && !entry.wasPaused
    await waitForAudioObservation(budget, timeout => page.waitForFunction(observeOptionsAudio, { enabled, paused: entry.wasPaused,
      context: running ? 'running' : 'suspended', mediaPaused: !running, backgroundScheduled: running }, { timeout }))
  } catch (failure) { failed = true; error = failure; throw failure }
  finally { if (!closing) await disposeOwner(entry.owner, failed, error, budget) }
  budget.check()
  return { wasPaused: entry.wasPaused, enabled }
}
