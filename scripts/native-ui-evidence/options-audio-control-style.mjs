import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'
import { candidateModule, ordinaryMission } from './ordinary-mission.mjs'
import { openAudioOptions, closeAudioOptions, audioOptionsControl, observeOptionsAudio, createAudioOptionsBudget, waitForAudioObservation } from '../browser-options-audio.mjs'

// Hold/reject the real AudioContext.resume boundary only. Recovery calls the
// original method from another trusted click; no enabled/component state is set.
export function holdAudioResume() {
  const resume = AudioContext.prototype.resume
  window.soundResumeAttempts = 0
  AudioContext.prototype.resume = function () {
    window.observedSoundContext = this
    window.soundResumeAttempts++
    return new Promise((resolve, reject) => { window.rejectSoundResume = () => reject(new DOMException('Controlled audio rejection', 'NotAllowedError')) })
  }
  window.restoreSoundResume = () => { AudioContext.prototype.resume = resume }
}
// Native disabled and focus-preserving ARIA disabled both communicate pending.
// A missing control or mismatched busy state must never satisfy either wait.
export function soundControlPending(pending) {
  const node = document.querySelector('dialog[data-original-pause-menu][open] [data-original-options][data-skin="ingame"] [data-option-key="audio"]')
  return !!node && (node.disabled || node.getAttribute('aria-disabled') === 'true') === pending &&
    node.getAttribute('aria-busy') === String(pending)
}
export function soundOwnership() {
  const world = window.testStore.getWorld(), scene = window.testSceneRef.current, active = document.activeElement
  const modal = document.querySelector('dialog[data-original-pause-menu][open]')
  const control = modal?.querySelector('[data-original-options][data-skin="ingame"] [data-option-key="audio"]')
  return {
    focused: !!control && active === control,
    bodyFocused: active === document.body, modalFocused: !!modal && active === modal,
    activeElement: { tag: active?.tagName ?? null, label: active?.getAttribute('aria-label') ?? null },
    modal: { count: document.querySelectorAll('dialog[open]').length, open: !!modal?.open,
      topLayer: !!modal?.matches(':modal'), panel: modal?.dataset.panel ?? null,
      controlCount: modal?.querySelectorAll('[data-original-options][data-skin="ingame"] [data-option-key="audio"]').length ?? 0 },
    currentWorld: scene.world === world,
    world: { paused: world.paused, inputMask: world.inputMask, status: world.status },
    scene: { focusPauseOwned: scene.focusPauseOwned, overviewActive: scene.overviewActive,
      overviewStage: scene.overviewStage, keys: [...scene.keys].sort() },
    simulation: { frame: scene.gameClock?.animationFrame ?? null,
      time: scene.gameClock?.animationTime ?? null, camera: scene.camera?.position.toArray() ?? null },
    popups: [...document.querySelectorAll('.campaign-messages details[open]')].map(node => node.dataset.messageSerial),
  }
}
export function assertSoundOwnership(before, after, { disabledBlur = false } = {}) {
  assert.ok(after.focused || (disabledBlur && (after.bodyFocused || after.modalFocused)),
    'Audio focus must stay on its control or the native disabled-button blur owner')
  assert.equal(after.currentWorld, true, 'Observation must belong to the current scene/world')
  assert.deepEqual(after.modal, { count: 1, open: true, topLayer: true, panel: 'options', controlCount: 1 },
    'The same actual Options modal must own input even when a disabled button blurs')
  assert.deepEqual(after.modal, before.modal)
  assert.equal(before.world.paused, true, 'Opening Options legitimately pauses before the audio baseline')
  assert.deepEqual(after.world, before.world, 'Sound activation cannot change pause or gameplay ownership')
  assert.deepEqual(after.scene, before.scene, 'Sound activation cannot change overview, focus pause or held gameplay keys')
  assert.deepEqual(after.popups, before.popups, 'Sound activation cannot acknowledge or replace the open campaign popup')
  assert.deepEqual(after.simulation, before.simulation, 'The paused animation clock and camera must remain unchanged')
}
// Compare the complete serialized World in the page, returning large strings
// only on mismatch. The retained snapshot is immutable, not a live World ref.
export async function assertAudioWorldUnchanged(page, snapshot, audioFailure = false) {
  const result = await page.evaluate(({ expected, audioFailure }) => {
    if (audioFailure) {
      const world = JSON.parse(expected)
      world.message = 'Audio could not start. Retry in Menu > Options > Game > Browser controls and help.'
      world.messageUntil = world.time + 9
      expected = JSON.stringify(world)
    }
    const actual = JSON.stringify(window.testStore.getWorld())
    return actual === expected ? true : { actual, expected }
  }, { expected: snapshot, audioFailure })
  if (result !== true) assert.equal(result.actual, result.expected, 'The complete paused World changed beyond the exact audio failure notice')
}

export function browserControlOwners() {
  const modal = document.querySelector('dialog[data-original-pause-menu][open]')
  const hosts = [...document.querySelectorAll('[data-fullscreen-control]')]
  return { footerCount: document.querySelectorAll('.top-actions,[data-sound-control]').length,
    loadingCount: document.querySelectorAll('.loading-world').length,
    modalCount: document.querySelectorAll('dialog[open]').length, fullscreenCount: hosts.length,
    fullscreenInMenu: !!modal && hosts.length === 1 && hosts[0].parentElement === modal,
    nativeModal: !!modal?.matches(':modal') }
}
export function assertBrowserControlOwners(sample, menu) {
  assert.equal(sample.footerCount, 0, 'The removed gameplay footer must not return')
  assert.equal(sample.loadingCount, 0, 'Observe the actual battlefield, not a replacement loading screen')
  assert.equal(sample.modalCount, menu ? 1 : 0)
  assert.equal(sample.fullscreenCount, menu ? 1 : 0, 'Fullscreen is present in its menu and absent from gameplay')
  assert.equal(sample.fullscreenInMenu, menu)
  assert.equal(sample.nativeModal, menu)
}
// Startup may legitimately collapse an authored popup to deliver world input.
// Restore that retained owner through its public summary, never ACK or inject it.
export async function prepareSoundPopup(page, popupInput, { signal, deadlineAt, trace, now = Date.now }) {
  let owner, failed = false, check
  trace.status = 'running'
  try {
    assert.ok(Number.isFinite(deadlineAt), 'Popup setup requires the live episode deadline')
    const budget = createAudioOptionsBudget({ signal, deadlineAt, now, cleanupErrors: trace.cleanupErrors ??= [] })
    check = budget.check
    const { step } = budget
    await step(async () => { owner = await page.evaluateHandle(() => ({ world: window.testStore.getWorld(), scene: window.testSceneRef.current })) })
    trace.beforeOwnership = await step(() => page.evaluate(soundOwnership))
    trace.retainedBefore = await step(() => page.evaluate(popupInput.campaignPopupSnapshot))
    assert.equal(trace.beforeOwnership.currentWorld, true)
    assert.equal(trace.beforeOwnership.world.paused, false)
    assert.equal(trace.beforeOwnership.world.inputMask, 0)
    assert.ok(trace.retainedBefore.length > 0, 'Mission 1 must supply a real retained campaign popup')
    assert.ok(trace.retainedBefore.every(p => typeof p.serial === 'string' && /^\d+$/.test(p.serial) && typeof p.open === 'boolean'))
    assert.equal(new Set(trace.retainedBefore.map(p => p.serial)).size, trace.retainedBefore.length)
    const target = trace.retainedBefore.find(p => p.open) ?? trace.retainedBefore[0]
    trace.serial = target.serial; trace.requestedOpen = true
    // Hosted fallback/DPR2 exhausted 2.5 s before the final read settled at
    // 2671.4 ms. Give this four-phase setup 4 s total, retaining every owner
    // verification and the episode deadline, not a fresh budget per phase.
    const timeout = Math.min(4000, check())
    trace.publicInput = { timeoutMs: timeout }
    await step(() => popupInput.setCampaignPopupOpen(page, target.serial, true, { timeout, trace: trace.publicInput }))
    trace.retainedAfter = await step(() => page.evaluate(popupInput.campaignPopupSnapshot))
    trace.afterOwnership = await step(() => page.evaluate(soundOwnership))
    trace.sameOwner = await step(() => page.evaluate(before => window.testStore.getWorld() === before.world &&
      window.testSceneRef.current === before.scene && before.scene.world === before.world, owner))
    assert.equal(trace.sameOwner, true, 'Public popup setup must retain the actual scene and World objects')
    assert.equal(trace.afterOwnership.currentWorld, true)
    assert.deepEqual(trace.afterOwnership.world, trace.beforeOwnership.world, 'Popup setup must not change gameplay ownership')
    assert.deepEqual(trace.afterOwnership.scene, trace.beforeOwnership.scene, 'Popup setup must not change scene input ownership')
    assert.deepEqual(trace.retainedAfter, trace.retainedBefore.map(p => p.serial === target.serial ? { ...p, open: true } : p),
      'Public setup must reopen the same retained notification without replacing or acknowledging any entry')
    assert.ok(trace.afterOwnership.popups.includes(target.serial), 'The retained popup must actually be open')
    check()
  } catch (error) { failed = true; trace.status = 'failed'; trace.error = String(error); throw error }
  finally {
    try { await owner?.dispose() }
    catch (error) {
      trace.ownerDisposeError = String(error)
      if (!failed) { trace.status = 'failed'; trace.error = String(error); throw error }
    }
  }
  try { check(); trace.status = 'passed' }
  catch (error) { trace.status = 'failed'; trace.error = String(error); throw error }
}
export function pendingSoundPointerTarget(node) {
  const box = node.getBoundingClientRect(), x = box.x + box.width / 2, y = box.y + box.height / 2
  const hit = document.elementFromPoint(x, y)
  return { x, y, width: box.width, height: box.height, viewportWidth: innerWidth, viewportHeight: innerHeight,
    owned: hit === node || node.contains(hit) }
}
export function assertPendingSoundPointerTarget(target) {
  for (const key of ['x', 'y', 'width', 'height', 'viewportWidth', 'viewportHeight']) assert.ok(Number.isFinite(target[key]), `Non-finite sound pointer ${key}`)
  assert.ok(target.width > 0 && target.height > 0, 'Pending sound control must have a positive hitbox')
  assert.ok(target.x >= 0 && target.y >= 0 && target.x < target.viewportWidth && target.y < target.viewportHeight, 'Pending sound click center must be inside the viewport')
  assert.equal(target.owned, true, 'Pending pointer click must actually hit the sound control or its artwork')
}
// Native disabled controls may blur to body. Re-find the actual retry row by
// bounded real Tab input; do not repair focus with focus(), evaluate-click or DOM writes.
export async function tabToAudioControl(page, control, { signal, deadlineAt, trace, now = Date.now }) {
  trace.status = 'running'; trace.observations = []
  try {
    assert.ok(Number.isFinite(deadlineAt), 'Keyboard recovery requires the live episode deadline')
    const { step, check } = createAudioOptionsBudget({ signal, deadlineAt, now })
    for (let tabs = 0; tabs <= 16; tabs++) {
      let sample
      await step(async () => {
        sample = await control.evaluate(node => ({ focused: node === document.activeElement,
          focusVisible: node.matches(':focus-visible'), disabled: node.disabled,
          active: { tag: document.activeElement?.tagName ?? null, label: document.activeElement?.getAttribute('aria-label') ?? null },
          modal: !!node.closest('dialog[open]')?.matches(':modal') }))
        trace.observations.push(sample)
      })
      if (sample.focused && sample.focusVisible && !sample.disabled && sample.modal) {
        check(); trace.status = 'passed'; trace.tabs = tabs; return
      }
      if (tabs === 16) break
      await step(() => page.keyboard.press('Tab'))
    }
    throw new Error('Actual Options audio row was not keyboard-reachable within 16 real Tabs')
  } catch (error) { trace.status = 'failed'; trace.error = String(error); throw error }
}
export async function closeSoundContext(context, report, fallback, primaryFailure) {
  try { await context.close() }
  catch (error) {
    (report.cleanupErrors ??= []).push({ fallback, error: String(error) })
    if (!primaryFailure) throw error
  }
}
// The default episode uses this finalization path directly. Primary and cleanup
// failures use explicit flags because JavaScript rejections may be falsy values.
export async function finalizeSoundContext(context, report, fallback, primaryFailure, handles) {
  let cleanupFailed = false, cleanupFailure
  for (const [name, handle] of handles) {
    try { await handle?.dispose() }
    catch (error) {
      (report.cleanupErrors ??= []).push({ owner: name, error: String(error) })
      if (!cleanupFailed) { cleanupFailed = true; cleanupFailure = error }
    }
  }
  await closeSoundContext(context, report, fallback, primaryFailure || cleanupFailed)
  if (!primaryFailure && cleanupFailed) throw cleanupFailure
}
export function assertPreparedSoundPopup(retainedAfter, afterMenu, openSerials) {
  assert.deepEqual(afterMenu, retainedAfter, 'Menu entry must retain every prepared campaign popup in order')
  assert.deepEqual(openSerials, retainedAfter.filter(popup => popup.open).map(popup => popup.serial),
    'The Options baseline must contain exactly the prepared open popup serials')
}
// Local to this episode: a failed evidence write must not replace a falsy
// primary rejection. The outer receipt retains the separate write-error array.
export function saveSoundTrace(save, failed, primaryError, report) {
  try { save() }
  catch (error) {
    (report.traceWriteErrors ??= []).push({ error: String(error), primaryFailure: failed })
    if (!failed) throw error
    try { primaryError.traceWriteError = String(error) } catch {}
  }
}
async function runAudioStyle({ browser, url, root, output, receipt, signal, deadlineAt }, modes) {
  const report = { executionContract: { version: 'audio-style-split-v1', mode: modes.length === 1 ? modes[0] : 'combined', primary: false },
    completedModes: [], status: 'running', samples: [], checks: [], inputBudgets: [], popupPreparations: [], browserOwners: [], traceWriteErrors: [] }
  receipt.missionInputBudgets = report.inputBudgets
  receipt.optionsAudioTraceWriteErrors = report.traceWriteErrors
  const save = () => writeFileSync(resolve(output, 'options-audio.json'), JSON.stringify(report, null, 2) + '\n')
  let episodeError, episodeFailed = false
  try {
    assert.ok(Number.isFinite(deadlineAt), 'Audio observations require the live episode deadline')
    const budget = createAudioOptionsBudget({ signal, deadlineAt, cleanupErrors: report.optionsNavigationCleanup = [] })
    const { check: remaining, step } = budget
    for (const mode of modes) {
      const fallback = mode === 'fallback'
      remaining()
      const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: fallback ? 2 : 1 })
      let blockedArt = 0, contextFailed = false, entry, worldSnapshot
      try {
        remaining()
        // The surviving Options row uses the actual in-game label bank. Block
        // that bank for readable fallback, not a removed footer frame asset.
        if (fallback) await step(() => context.route('**/original/pause-font.png', route => { blockedArt++; return route.abort('failed') }))
        const page = await step(() => context.newPage())
        await step(() => page.goto(url, { waitUntil: 'domcontentloaded' }))
        const trace = { fallback }; report.inputBudgets.push(trace)
        let inputError, inputFailed = false
        try { await step(() => ordinaryMission(page, root, { signal, deadlineAt, trace })) }
        catch (error) { inputFailed = true; inputError = error; throw error }
        finally { saveSoundTrace(save, inputFailed, inputError, report) }
        const popupTrace = { fallback }; report.popupPreparations.push(popupTrace)
        let popupError, popupInput, popupFailed = false
        try {
          popupInput = await step(() => candidateModule(root, 'scripts/browser-world-input.mjs'))
          await prepareSoundPopup(page, popupInput, { signal, deadlineAt, trace: popupTrace })
        } catch (error) { popupFailed = true; popupError = error; throw error }
        finally { saveSoundTrace(save, popupFailed, popupError, report) }
        const owners = async (phase, menu) => {
          const observed = await step(() => page.evaluate(browserControlOwners))
          report.browserOwners.push({ fallback, phase, observed }); save()
          assertBrowserControlOwners(observed, menu)
        }
        await owners('gameplay-before-menu', false)
        entry = await openAudioOptions(page, { timeout: remaining(), signal, deadlineAt, cleanupErrors: report.optionsNavigationCleanup })
        assert.equal(entry.wasPaused, false)
        await owners('options-modal', true)
        const control = audioOptionsControl(page)
        await waitForAudioObservation(budget, () => page.waitForFunction(fallback => {
          const control = document.querySelector('[data-original-options][data-skin="ingame"] [data-option-key="audio"]')
          return !!control && (control.querySelectorAll('[aria-hidden="true"] i').length > 0) === !fallback
        }, fallback, { timeout: remaining() }))
        assert.equal(await step(() => control.getAttribute('aria-label')), '♫ Enable sound')
        const capture = async (name, text, highlighted = false) => {
          signal.throwIfAborted()
          const sample = await step(() => control.evaluate(node => {
            const r = node.getBoundingClientRect(), style = getComputedStyle(node)
            const glyphs = [...node.querySelectorAll('[aria-hidden="true"] i')]
            const textNode = node.querySelector('[aria-hidden="true"]')
            return { width: r.width, height: r.height, layoutHeight: node.offsetHeight,
              scale: Number(getComputedStyle(node).getPropertyValue('--frontend-scale')),
              x: r.x, y: r.y, right: r.right, bottom: r.bottom, dpr: devicePixelRatio,
              label: node.getAttribute('aria-label'), busy: node.getAttribute('aria-busy'), disabled: node.disabled,
              ariaDisabled: node.getAttribute('aria-disabled'), effectiveDisabled: node.disabled || node.getAttribute('aria-disabled') === 'true',
              text: node.textContent, opacity: Number(style.opacity), radius: style.borderRadius, background: style.backgroundColor,
              glyphs: glyphs.map(glyph => ({ width: glyph.offsetWidth, height: glyph.offsetHeight, image: getComputedStyle(glyph).backgroundImage })),
              glyphOpacity: textNode ? Number(getComputedStyle(textNode).opacity) : null,
              focus: node === document.activeElement, focusVisible: node.matches(':focus-visible'), outline: style.outlineWidth,
              viewport: { width: innerWidth, height: innerHeight } }
          }))
          assert.equal(sample.layoutHeight, 26); assert.ok(Math.abs(sample.height - 26 * sample.scale) < .01)
          assert.equal(sample.opacity, name === 'pending' ? .5 : 1)
          if (name === 'pending') { assert.equal(sample.effectiveDisabled, true); assert.equal(sample.busy, 'true') }
          assert.equal(sample.radius, '0px'); assert.equal(sample.background, 'rgba(0, 0, 0, 0)')
          assert.ok(sample.x >= 0 && sample.y >= 0 && sample.right <= sample.viewport.width && sample.bottom <= sample.viewport.height)
          if (fallback) { assert.equal(sample.text, text); assert.equal(sample.glyphs.length, 0) }
          else {
            assert.equal(sample.glyphs.length, text.length)
            assert.ok(sample.glyphs.every(glyph => glyph.width > 0 && glyph.height > 0 && glyph.image.includes('/original/pause-font.png')))
            // Native disabled focus may remain or blur. Both existing label states
            // retain their exact atlas opacity; the whole disabled row must be .5.
            const expected = name === 'pending' ? [1, 2 / 3] : [highlighted ? 1 : 2 / 3]
            assert.ok(expected.some(opacity => Math.abs(sample.glyphOpacity - opacity) < .000001))
          }
          if (name === 'focus') { assert.equal(sample.focus, true); assert.equal(sample.focusVisible, true); assert.ok(parseFloat(sample.outline) > 0) }
          const file = `${fallback ? 'fallback-dpr2' : 'glyphs-dpr1'}-${name}.png`
          report.samples.push({ name, file, ...sample }); save()
          await step(() => page.screenshot({ path: resolve(output, file) }))
        }
        await step(() => page.mouse.move(0, 0)); await capture('off', 'Enable sound')
        await step(() => control.hover()); await capture('hover', 'Enable sound', true)
        await step(() => page.mouse.move(0, 0))
        await step(() => control.focus()); await step(() => page.keyboard.press('Shift+Tab')); await step(() => page.keyboard.press('Tab'))
        await capture('focus', 'Enable sound', true)
        let before = await step(() => page.evaluate(soundOwnership))
        report.checks.push({ fallback, phase: 'baseline', ownership: before }); save()
        assert.equal(before.currentWorld, true); assert.equal(before.world.paused, true)
        popupTrace.afterMenu = await step(() => page.evaluate(popupInput.campaignPopupSnapshot)); save()
        assertPreparedSoundPopup(popupTrace.retainedAfter, popupTrace.afterMenu, before.popups)
        assertSoundOwnership(before, before)
        await step(async () => { worldSnapshot = await page.evaluateHandle(() => JSON.stringify(window.testStore.getWorld())) })
        const preserved = async (phase, options = {}) => {
          // One atomic summary read; complete World equality is a separate read below.
          const after = await step(() => page.evaluate(soundOwnership))
          // Retain the original evaluated snapshot before any assertion throws.
          report.checks.push({ fallback, phase, ownership: after }); save()
          assertSoundOwnership(before, after, options)
          try { await step(() => assertAudioWorldUnchanged(page, worldSnapshot, options.audioFailure)) }
          catch (error) { report.worldMismatch = { phase, actual: error?.actual, expected: error?.expected }; saveSoundTrace(save, true, error, report); throw error }
          return after
        }
        await step(() => page.evaluate(holdAudioResume))
        await step(() => page.keyboard.press('Enter'))
        await waitForAudioObservation(budget, () => page.waitForFunction(soundControlPending, true, { timeout: remaining() }))
        await capture('pending', 'Enable sound')
        await preserved('pending', { disabledBlur: true })
        for (const key of ['Enter', 'Space']) {
          await step(() => page.keyboard.down(key)); await step(() => page.keyboard.down(key)); await step(() => page.keyboard.down(key)); await step(() => page.keyboard.up(key))
          assert.equal(await step(() => page.evaluate(() => window.soundResumeAttempts)), 1, 'Pending keyboard and held repeats cannot duplicate activation')
          await preserved(`pending-${key}`, { disabledBlur: true })
        }
        const target = await step(() => control.evaluate(pendingSoundPointerTarget))
        assertPendingSoundPointerTarget(target)
        report.checks.push({ fallback, pendingPointerTarget: target }); save()
        await step(() => page.mouse.click(target.x, target.y))
        assert.equal(await step(() => page.evaluate(() => window.soundResumeAttempts)), 1, 'Native disabled pointer activation cannot duplicate enable')
        await preserved('pending-pointer', { disabledBlur: true })
        await step(() => page.keyboard.down('Space'))
        await step(() => page.evaluate(() => window.rejectSoundResume()))
        await waitForAudioObservation(budget, () => page.waitForFunction(soundControlPending, false, { timeout: remaining() }))
        await step(() => page.keyboard.down('Space')); await step(() => page.keyboard.up('Space'))
        assert.equal(await step(() => page.evaluate(() => window.soundResumeAttempts)), 1, 'Space held across native disabled settlement cannot activate on release')
        assert.equal(await step(() => control.getAttribute('aria-label')), '♫ Enable sound')
        await step(() => page.getByRole('status', { name: 'Audio could not start. Try Enable sound again.', exact: true }).waitFor({ timeout: remaining() }))
        before = await preserved('rejected-held-release', { disabledBlur: true, audioFailure: true })
        await worldSnapshot.dispose(); remaining(); await step(async () => { worldSnapshot = await page.evaluateHandle(() => JSON.stringify(window.testStore.getWorld())) })
        await step(() => page.evaluate(() => window.restoreSoundResume()))
        const retryKeyboard = { fallback, phase: 'retry-keyboard-reachability' }; report.checks.push(retryKeyboard)
        let retryError, retryFailed = false
        try { await tabToAudioControl(page, control, { signal, deadlineAt, trace: retryKeyboard }) }
        catch (error) { retryFailed = true; retryError = error; throw error }
        finally { saveSoundTrace(save, retryFailed, retryError, report) }
        await step(() => page.keyboard.press('Enter'))
        await step(() => page.getByRole('button', { name: '♪ Sound on', exact: true }).waitFor({ timeout: remaining() }))
        await waitForAudioObservation(budget, () => page.waitForFunction(observeOptionsAudio, { enabled: true, paused: true, context: 'suspended' }, { timeout: remaining() }))
        await preserved('real-resume-recovered-under-menu-pause', { disabledBlur: true })
        report.checks.push({ fallback, recoveredAudioContext: await step(() => page.evaluate(() => ({ state: window.observedSoundContext.state,
          currentTime: window.observedSoundContext.currentTime, sampleRate: window.observedSoundContext.sampleRate }))) }); save()
        await worldSnapshot.dispose(); worldSnapshot = null; remaining()
        await closeAudioOptions(page, entry); entry = null
        await owners('enabled-gameplay-no-footer', false)
        await waitForAudioObservation(budget, () => page.waitForFunction(observeOptionsAudio, { enabled: true, paused: false, context: 'running', mediaPaused: false, backgroundScheduled: true }, { timeout: remaining() }))
        report.checks.push({ fallback, phase: 'real-playback-after-Continue', audio: await step(() => page.evaluate(observeOptionsAudio)) }); save()
        popupTrace.retainedBeforeReentry = await step(() => page.evaluate(popupInput.campaignPopupSnapshot)); save()
        entry = await openAudioOptions(page, { timeout: remaining(), signal, deadlineAt, cleanupErrors: report.optionsNavigationCleanup })
        assert.equal(entry.wasPaused, false)
        await owners('reentered-options-modal', true)
        before = await step(() => page.evaluate(soundOwnership))
        popupTrace.afterReentry = await step(() => page.evaluate(popupInput.campaignPopupSnapshot)); save()
        assertPreparedSoundPopup(popupTrace.retainedBeforeReentry, popupTrace.afterReentry, before.popups)
        await step(async () => { worldSnapshot = await page.evaluateHandle(() => JSON.stringify(window.testStore.getWorld())) })
        assert.equal(before.world.paused, true)
        await step(() => page.setViewportSize({ width: 640, height: 480 }))
        await waitForAudioObservation(budget, () => page.waitForFunction(() => innerWidth === 640 && innerHeight === 480 &&
          Number(getComputedStyle(document.querySelector('[data-original-options]')).getPropertyValue('--frontend-scale')) === 1,
        null, { timeout: remaining() }))
        // Resize may legitimately reproject the camera. Bind a fresh, paused
        // baseline only after asserting the same full World survived the resize.
        const compact = await step(() => page.evaluate(soundOwnership))
        await step(() => assertAudioWorldUnchanged(page, worldSnapshot))
        before = compact
        await step(() => page.mouse.move(0, 0)); await capture('on-compact', 'Sound on')
        const muteKeyboard = { fallback, phase: 'mute-keyboard-reachability' }; report.checks.push(muteKeyboard)
        let muteError, muteFailed = false
        try { await tabToAudioControl(page, control, { signal, deadlineAt, trace: muteKeyboard }) }
        catch (error) { muteFailed = true; muteError = error; throw error }
        finally { saveSoundTrace(save, muteFailed, muteError, report) }
        await step(() => page.keyboard.press('Space'))
        assert.equal(await step(() => control.getAttribute('aria-label')), '♫ Enable sound')
        await preserved('native-Space-mute')
        await waitForAudioObservation(budget, () => page.waitForFunction(observeOptionsAudio, { enabled: false, paused: true, context: 'suspended', mediaPaused: true, backgroundScheduled: false }, { timeout: remaining() }))
        await worldSnapshot.dispose(); worldSnapshot = null; remaining()
        await closeAudioOptions(page, entry); entry = null
        await owners('gameplay-after-menu', false)
        assert.equal(await step(() => page.evaluate(() => window.testStore.getWorld().paused)), false)
        assert.deepEqual(await step(() => page.evaluate(() => [...document.querySelectorAll('.campaign-messages details[open]')].map(node => node.dataset.messageSerial))), before.popups)
        if (fallback) assert.ok(blockedArt > 0)
        report.checks.push(`${fallback ? 'fallback/DPR2' : 'native/DPR1'}: real Options off/on, hover/focus, native pending pointer/keyboard/repeat guards, modal/full-world/popup preservation, held-release rejection/retry, suspended enabled context, native Space mute, compact geometry, fullscreen menu-only ownership`)
      } catch (error) { contextFailed = true; throw error }
      finally {
        // A failed browser operation is not followed by guessed UI recovery.
        // Release only the read-only handle; the owned context closes below.
        await finalizeSoundContext(context, report, fallback, contextFailed, [['audio-options', entry?.owner], ['paused-world', worldSnapshot]])
      }
      report.completedModes.push(mode) // Only after the flow's owned context and handles close.
    }
    remaining()
    report.status = 'passed'; report.limits = ['Trusted browser activation and real AudioContext retry under menu pause, not acoustic measurement', 'Options browser adaptation and menu-only fullscreen, not an original native sound-toggle or fullscreen claim']
    return report
  } catch (error) { episodeFailed = true; episodeError = error; report.status = 'failed'; report.error = String(error); throw error }
  finally { saveSoundTrace(save, episodeFailed, episodeError, report) }
}

// Fixed independent entries retain the same body, assertions and one live deadline.
export const runNativeAudioStyle = args => runAudioStyle(args, ['native'])
export const runFallbackAudioStyle = args => runAudioStyle(args, ['fallback'])
// Keep the existing standalone combined entry; it is never split-series acceptance.
export default function (args) { return runAudioStyle(args, ['native', 'fallback']) }
