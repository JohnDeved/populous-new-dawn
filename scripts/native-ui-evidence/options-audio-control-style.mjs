import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'
import { candidateModule, ordinaryMission, saveMissionInputTrace } from './ordinary-mission.mjs'
import { openAudioOptions, closeAudioOptions, audioOptionsControl, observeOptionsAudio } from '../browser-options-audio.mjs'

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
export async function prepareSoundPopup(page, popupInput, { signal, deadlineAt, trace }) {
  let owner, failed = false
  trace.status = 'running'
  try {
    signal.throwIfAborted()
    assert.ok(Number.isFinite(deadlineAt) && deadlineAt > Date.now(), 'Popup setup requires the live episode deadline')
    owner = await page.evaluateHandle(() => ({ world: window.testStore.getWorld(), scene: window.testSceneRef.current }))
    trace.beforeOwnership = await page.evaluate(soundOwnership)
    trace.retainedBefore = await page.evaluate(popupInput.campaignPopupSnapshot)
    assert.equal(trace.beforeOwnership.currentWorld, true)
    assert.equal(trace.beforeOwnership.world.paused, false)
    assert.equal(trace.beforeOwnership.world.inputMask, 0)
    assert.ok(trace.retainedBefore.length > 0, 'Mission 1 must supply a real retained campaign popup')
    assert.ok(trace.retainedBefore.every(p => typeof p.serial === 'string' && /^\d+$/.test(p.serial) && typeof p.open === 'boolean'))
    assert.equal(new Set(trace.retainedBefore.map(p => p.serial)).size, trace.retainedBefore.length)
    const target = trace.retainedBefore.find(p => p.open) ?? trace.retainedBefore[0]
    trace.serial = target.serial; trace.requestedOpen = true
    signal.throwIfAborted()
    const timeout = Math.min(2500, deadlineAt - Date.now())
    assert.ok(Number.isFinite(timeout) && timeout > 0, 'Popup setup requires the remaining episode deadline')
    trace.publicInput = {}
    await popupInput.setCampaignPopupOpen(page, target.serial, true, { timeout, trace: trace.publicInput })
    signal.throwIfAborted()
    trace.retainedAfter = await page.evaluate(popupInput.campaignPopupSnapshot)
    trace.afterOwnership = await page.evaluate(soundOwnership)
    trace.sameOwner = await page.evaluate(before => window.testStore.getWorld() === before.world &&
      window.testSceneRef.current === before.scene && before.scene.world === before.world, owner)
    assert.equal(trace.sameOwner, true, 'Public popup setup must retain the actual scene and World objects')
    assert.equal(trace.afterOwnership.currentWorld, true)
    assert.deepEqual(trace.afterOwnership.world, trace.beforeOwnership.world, 'Popup setup must not change gameplay ownership')
    assert.deepEqual(trace.afterOwnership.scene, trace.beforeOwnership.scene, 'Popup setup must not change scene input ownership')
    assert.deepEqual(trace.retainedAfter, trace.retainedBefore.map(p => p.serial === target.serial ? { ...p, open: true } : p),
      'Public setup must reopen the same retained notification without replacing or acknowledging any entry')
    assert.ok(trace.afterOwnership.popups.includes(target.serial), 'The retained popup must actually be open')
    trace.status = 'passed'
  } catch (error) { failed = true; trace.status = 'failed'; trace.error = String(error); throw error }
  finally {
    try { await owner?.dispose() }
    catch (error) {
      trace.ownerDisposeError = String(error)
      if (!failed) { trace.status = 'failed'; trace.error = String(error); throw error }
    }
  }
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
export async function tabToAudioControl(page, control, { signal, deadlineAt, trace }) {
  trace.status = 'running'; trace.observations = []
  try {
    for (let tabs = 0; tabs <= 16; tabs++) {
      signal.throwIfAborted()
      assert.ok(Number.isFinite(deadlineAt) && deadlineAt > Date.now(), 'Audio keyboard recovery retains its deadline')
      const sample = await control.evaluate(node => ({ focused: node === document.activeElement,
        focusVisible: node.matches(':focus-visible'), disabled: node.disabled,
        active: { tag: document.activeElement?.tagName ?? null, label: document.activeElement?.getAttribute('aria-label') ?? null },
        modal: !!node.closest('dialog[open]')?.matches(':modal') }))
      trace.observations.push(sample)
      if (sample.focused && sample.focusVisible && !sample.disabled && sample.modal) {
        trace.status = 'passed'; trace.tabs = tabs; return
      }
      if (tabs === 16) break
      await page.keyboard.press('Tab')
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
export default async function ({ browser, url, root, output, receipt, signal, deadlineAt }) {
  const report = { status: 'running', samples: [], checks: [], inputBudgets: [], popupPreparations: [], browserOwners: [] }
  receipt.missionInputBudgets = report.inputBudgets
  const save = () => writeFileSync(resolve(output, 'options-audio.json'), JSON.stringify(report, null, 2) + '\n')
  const remaining = () => {
    signal.throwIfAborted()
    const timeout = Math.min(30000, deadlineAt - Date.now())
    assert.ok(Number.isFinite(timeout) && timeout > 0, 'Audio observations retain the live episode deadline')
    return timeout
  }
  let episodeError
  try {
    for (const fallback of [false, true]) {
      signal.throwIfAborted()
      const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: fallback ? 2 : 1 })
      let blockedArt = 0, contextFailed = false, entry, worldSnapshot
      try {
        // The surviving Options row uses the actual in-game label bank. Block
        // that bank for readable fallback, not a removed footer frame asset.
        if (fallback) await context.route('**/original/pause-font.png', route => { blockedArt++; return route.abort('failed') })
        const page = await context.newPage()
        await page.goto(url, { waitUntil: 'domcontentloaded' })
        const trace = { fallback }; report.inputBudgets.push(trace)
        let inputError
        try { await ordinaryMission(page, root, { signal, deadlineAt, trace }) }
        catch (error) { inputError = error; throw error }
        finally { saveMissionInputTrace(save, inputError) }
        const popupTrace = { fallback }; report.popupPreparations.push(popupTrace)
        let popupError
        try {
          const popupInput = await candidateModule(root, 'scripts/browser-world-input.mjs')
          await prepareSoundPopup(page, popupInput, { signal, deadlineAt, trace: popupTrace })
        } catch (error) { popupError = error; throw error }
        finally { saveMissionInputTrace(save, popupError) }
        const owners = async (phase, menu) => {
          const observed = await page.evaluate(browserControlOwners)
          report.browserOwners.push({ fallback, phase, observed }); save()
          assertBrowserControlOwners(observed, menu)
        }
        await owners('gameplay-before-menu', false)
        entry = await openAudioOptions(page, { timeout: remaining() })
        assert.equal(entry.wasPaused, false)
        await owners('options-modal', true)
        const control = audioOptionsControl(page)
        await page.waitForFunction(fallback => {
          const control = document.querySelector('[data-original-options][data-skin="ingame"] [data-option-key="audio"]')
          return !!control && (control.querySelectorAll('[aria-hidden="true"] i').length > 0) === !fallback
        }, fallback, { timeout: remaining() })
        assert.equal(await control.getAttribute('aria-label'), '♫ Enable sound')
        const capture = async (name, text, highlighted = false) => {
          signal.throwIfAborted()
          const sample = await control.evaluate(node => {
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
          })
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
          await page.screenshot({ path: resolve(output, file) })
        }
        await page.mouse.move(0, 0); await capture('off', 'Enable sound')
        await control.hover(); await capture('hover', 'Enable sound', true)
        await page.mouse.move(0, 0)
        await control.focus(); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab')
        await capture('focus', 'Enable sound', true)
        let before = await page.evaluate(soundOwnership)
        report.checks.push({ fallback, phase: 'baseline', ownership: before }); save()
        assert.equal(before.currentWorld, true); assert.equal(before.world.paused, true)
        assert.ok(before.popups.length > 0, 'Menu must retain the real open campaign popup without acknowledging it')
        assertSoundOwnership(before, before)
        worldSnapshot = await page.evaluateHandle(() => JSON.stringify(window.testStore.getWorld()))
        const preserved = async (phase, options = {}) => {
          const after = await page.evaluate(soundOwnership)
          // Retain the original evaluated snapshot before any assertion throws.
          report.checks.push({ fallback, phase, ownership: after }); save()
          assertSoundOwnership(before, after, options)
          try { await assertAudioWorldUnchanged(page, worldSnapshot, options.audioFailure) }
          catch (error) { report.worldMismatch = { phase, actual: error.actual, expected: error.expected }; save(); throw error }
          return after
        }
        await page.evaluate(holdAudioResume)
        await page.keyboard.press('Enter')
        await page.waitForFunction(soundControlPending, true, { timeout: remaining() })
        await capture('pending', 'Enable sound')
        await preserved('pending', { disabledBlur: true })
        for (const key of ['Enter', 'Space']) {
          await page.keyboard.down(key); await page.keyboard.down(key); await page.keyboard.down(key); await page.keyboard.up(key)
          assert.equal(await page.evaluate(() => window.soundResumeAttempts), 1, 'Pending keyboard and held repeats cannot duplicate activation')
          await preserved(`pending-${key}`, { disabledBlur: true })
        }
        const target = await control.evaluate(pendingSoundPointerTarget)
        assertPendingSoundPointerTarget(target)
        report.checks.push({ fallback, pendingPointerTarget: target }); save()
        await page.mouse.click(target.x, target.y)
        assert.equal(await page.evaluate(() => window.soundResumeAttempts), 1, 'Native disabled pointer activation cannot duplicate enable')
        await preserved('pending-pointer', { disabledBlur: true })
        await page.keyboard.down('Space')
        await page.evaluate(() => window.rejectSoundResume())
        await page.waitForFunction(soundControlPending, false, { timeout: remaining() })
        await page.keyboard.down('Space'); await page.keyboard.up('Space')
        assert.equal(await page.evaluate(() => window.soundResumeAttempts), 1, 'Space held across native disabled settlement cannot activate on release')
        assert.equal(await control.getAttribute('aria-label'), '♫ Enable sound')
        await page.getByRole('status', { name: 'Audio could not start. Try Enable sound again.', exact: true }).waitFor({ timeout: remaining() })
        before = await preserved('rejected-held-release', { disabledBlur: true, audioFailure: true })
        await worldSnapshot.dispose(); worldSnapshot = await page.evaluateHandle(() => JSON.stringify(window.testStore.getWorld()))
        await page.evaluate(() => window.restoreSoundResume())
        const retryKeyboard = { fallback, phase: 'retry-keyboard-reachability' }; report.checks.push(retryKeyboard)
        try { await tabToAudioControl(page, control, { signal, deadlineAt, trace: retryKeyboard }) } finally { save() }
        await page.keyboard.press('Enter')
        await page.getByRole('button', { name: '♪ Sound on', exact: true }).waitFor({ timeout: remaining() })
        const ready = await page.waitForFunction(observeOptionsAudio, { enabled: true, paused: true, context: 'suspended' }, { timeout: remaining() })
        await ready.dispose()
        await preserved('real-resume-recovered-under-menu-pause', { disabledBlur: true })
        report.checks.push({ recoveredAudioContext: await page.evaluate(() => ({ state: window.observedSoundContext.state,
          currentTime: window.observedSoundContext.currentTime, sampleRate: window.observedSoundContext.sampleRate })) }); save()
        await worldSnapshot.dispose(); worldSnapshot = null
        await closeAudioOptions(page, entry); entry = null
        await owners('enabled-gameplay-no-footer', false)
        const playback = await page.waitForFunction(observeOptionsAudio, { enabled: true, paused: false, context: 'running', mediaPaused: false, backgroundScheduled: true }, { timeout: remaining() })
        await playback.dispose()
        report.checks.push({ phase: 'real-playback-after-Continue', audio: await page.evaluate(observeOptionsAudio) }); save()
        entry = await openAudioOptions(page, { timeout: remaining() })
        assert.equal(entry.wasPaused, false)
        await owners('reentered-options-modal', true)
        before = await page.evaluate(soundOwnership)
        worldSnapshot = await page.evaluateHandle(() => JSON.stringify(window.testStore.getWorld()))
        assert.equal(before.world.paused, true)
        await page.setViewportSize({ width: 640, height: 480 })
        await page.waitForFunction(() => innerWidth === 640 && innerHeight === 480 &&
          Number(getComputedStyle(document.querySelector('[data-original-options]')).getPropertyValue('--frontend-scale')) === 1,
        null, { timeout: remaining() })
        // Resize may legitimately reproject the camera. Bind a fresh, paused
        // baseline only after asserting the same full World survived the resize.
        const compact = await page.evaluate(soundOwnership)
        await assertAudioWorldUnchanged(page, worldSnapshot)
        before = compact
        await page.mouse.move(0, 0); await capture('on-compact', 'Sound on')
        const muteKeyboard = { fallback, phase: 'mute-keyboard-reachability' }; report.checks.push(muteKeyboard)
        try { await tabToAudioControl(page, control, { signal, deadlineAt, trace: muteKeyboard }) } finally { save() }
        await page.keyboard.press('Space')
        assert.equal(await control.getAttribute('aria-label'), '♫ Enable sound')
        await preserved('native-Space-mute')
        const muted = await page.waitForFunction(observeOptionsAudio, { enabled: false, paused: true, context: 'suspended', mediaPaused: true, backgroundScheduled: false }, { timeout: remaining() })
        await muted.dispose()
        await worldSnapshot.dispose(); worldSnapshot = null
        await closeAudioOptions(page, entry); entry = null
        await owners('gameplay-after-menu', false)
        assert.equal(await page.evaluate(() => window.testStore.getWorld().paused), false)
        assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('.campaign-messages details[open]')].map(node => node.dataset.messageSerial)), before.popups)
        if (fallback) assert.ok(blockedArt > 0)
        report.checks.push(`${fallback ? 'fallback/DPR2' : 'native/DPR1'}: real Options off/on, hover/focus, native pending pointer/keyboard/repeat guards, modal/full-world/popup preservation, held-release rejection/retry, suspended enabled context, native Space mute, compact geometry, fullscreen menu-only ownership`)
      } catch (error) { contextFailed = true; throw error }
      finally {
        // A failed browser operation is not followed by guessed UI recovery.
        // Release only the read-only handle; the owned context closes below.
        let cleanupFailure
        for (const [name, handle] of [['audio-options', entry?.owner], ['paused-world', worldSnapshot]]) {
          try { await handle?.dispose() }
          catch (error) {
            (report.cleanupErrors ??= []).push({ owner: name, error: String(error) })
            cleanupFailure ??= error
          }
        }
        await closeSoundContext(context, report, fallback, contextFailed || !!cleanupFailure)
        if (!contextFailed && cleanupFailure) throw cleanupFailure
      }
    }
    report.status = 'passed'; report.limits = ['Trusted browser activation and real AudioContext retry under menu pause, not acoustic measurement', 'Options browser adaptation and menu-only fullscreen, not an original native sound-toggle or fullscreen claim']
    return report
  } catch (error) { episodeError = error; report.status = 'failed'; report.error = String(error); throw error }
  finally { saveMissionInputTrace(save, episodeError) }
}
