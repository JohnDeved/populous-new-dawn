import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'
import { ordinaryMission } from './ordinary-mission.mjs'

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
  const node = document.querySelector('[data-sound-control]')
  return !!node && (node.disabled || node.getAttribute('aria-disabled') === 'true') === pending &&
    node.getAttribute('aria-busy') === String(pending)
}
export function soundOwnership() {
  const world = window.testStore.getWorld(), scene = window.testSceneRef.current, active = document.activeElement
  return {
    focused: active === document.querySelector('[data-sound-control]'),
    activeElement: { tag: active?.tagName ?? null, label: active?.getAttribute('aria-label') ?? null },
    currentWorld: scene.world === world,
    world: { paused: world.paused, inputMask: world.inputMask, status: world.status },
    scene: { focusPauseOwned: scene.focusPauseOwned, overviewActive: scene.overviewActive,
      overviewStage: scene.overviewStage, keys: [...scene.keys].sort() },
    popups: [...document.querySelectorAll('.campaign-messages details[open]')].map(node => node.dataset.messageSerial),
  }
}
export function assertSoundOwnership(before, after) {
  assert.equal(after.focused, true, 'Sound control must retain focus through pending and settlement')
  assert.equal(after.currentWorld, true, 'Observation must belong to the current scene/world')
  assert.deepEqual(after.world, before.world, 'Sound activation cannot change pause or gameplay ownership')
  assert.deepEqual(after.scene, before.scene, 'Sound activation cannot change overview, focus pause or held gameplay keys')
  assert.deepEqual(after.popups, before.popups, 'Sound activation cannot acknowledge or replace the open campaign popup')
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
export default async function ({ browser, url, root, output, signal }) {
  const report = { status: 'running', samples: [], checks: [] }
  const save = () => writeFileSync(resolve(output, 'hud-sound.json'), JSON.stringify(report, null, 2) + '\n')
  try {
    for (const fallback of [false, true]) {
      signal.throwIfAborted()
      const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: fallback ? 2 : 1 })
      let blockedArt = 0
      try {
        // The frame is specific to this browser control, avoiding damage to HUD
        // labels needed for the ordinary mission entry itself.
        if (fallback) await context.route('**/original/hud-button.png', route => { blockedArt++; return route.abort('failed') })
        const page = await context.newPage()
        await page.goto(url, { waitUntil: 'domcontentloaded' }); await ordinaryMission(page, root, signal)
        const control = page.locator('[data-sound-control]')
        await control.waitFor()
        await page.waitForFunction(fallback => document.querySelector('[data-sound-control]')?.dataset.artReady === String(!fallback), fallback)
        assert.equal(await control.getAttribute('data-sound-enabled'), 'false')
        const capture = async (name, text, frame) => {
          signal.throwIfAborted()
          const sample = await control.evaluate(node => {
            const r = node.getBoundingClientRect(), style = getComputedStyle(node)
            return { width: r.width, height: r.height, layoutHeight: node.offsetHeight,
              hudScale: Number(getComputedStyle(node.closest('.game-shell')).getPropertyValue('--hud-scale')),
              x: r.x, y: r.y, right: r.right, bottom: r.bottom,
              dpr: devicePixelRatio, label: node.getAttribute('aria-label'), busy: node.getAttribute('aria-busy'), disabled: node.disabled,
              ariaDisabled: node.getAttribute('aria-disabled'), effectiveDisabled: node.disabled || node.getAttribute('aria-disabled') === 'true',
              fallback: node.dataset.artReady === 'false', text: node.textContent,
              frame: style.getPropertyValue('--sound-frame'), radius: style.borderRadius,
              glyphs: [...node.querySelectorAll('span:last-child i')].map(glyph => ({ width: glyph.offsetWidth, height: glyph.offsetHeight, image: getComputedStyle(glyph).backgroundImage })),
              tiles: node.querySelectorAll('span:first-child i').length,
              focus: node === document.activeElement, outline: style.outlineWidth,
              viewport: { width: innerWidth, height: innerHeight } }
          })
          assert.equal(sample.layoutHeight, 14); assert.ok(Math.abs(sample.height - 14 * sample.hudScale) < .01); assert.equal(sample.radius, '0px')
          assert.ok(sample.x >= 0 && sample.y >= 0 && sample.right <= sample.viewport.width && sample.bottom <= sample.viewport.height)
          if (fallback) { assert.equal(sample.text, text); assert.equal(sample.glyphs.length, 0) }
          else {
            assert.equal(sample.glyphs.length, text.length)
            assert.ok(sample.glyphs.every(glyph => glyph.image.includes('/original/hud.png')))
            assert.ok(sample.tiles >= 8); if (frame) assert.ok(sample.frame.includes(frame))
          }
          const file = `${fallback ? 'fallback-dpr2' : 'glyphs-dpr1'}-${name}.png`
          await page.screenshot({ path: resolve(output, file) }); report.samples.push({ name, file, ...sample }); save()
        }
        await page.mouse.move(0, 0); await capture('off', 'Sound Off', 'hud-button.png')
        await control.hover(); await capture('hover', 'Sound Off', 'hud-button-selected.png')
        await page.mouse.move(0, 0)
        // Keyboard navigation must create genuine focus-visible styling.
        await control.focus(); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab')
        assert.equal(await control.evaluate(node => node === document.activeElement), true)
        await capture('focus', 'Sound Off', 'hud-button-selected.png')
        const before = await page.evaluate(soundOwnership)
        assert.equal(before.currentWorld, true); assert.equal(before.world.paused, false)
        assert.ok(before.popups.length > 0, 'Ordinary Mission 1 must supply the live campaign popup for ownership coverage')
        const preserved = async phase => {
          const after = await page.evaluate(soundOwnership)
          // Keep the observed failure state; assertions must not erase the evidence.
          report.checks.push({ fallback, phase, ownership: after }); save()
          assertSoundOwnership(before, after)
        }
        await page.evaluate(holdAudioResume)
        await page.keyboard.press('Enter')
        await page.waitForFunction(soundControlPending, true)
        await capture('pending', 'Wait')
        await preserved('pending')
        for (const key of ['Enter', 'Space']) {
          await page.keyboard.down(key); await page.keyboard.down(key); await page.keyboard.down(key); await page.keyboard.up(key)
          assert.equal(await page.evaluate(() => window.soundResumeAttempts), 1, 'Pending keyboard and held repeats cannot duplicate activation')
          await preserved(`pending-${key}`)
        }
        // Locator.click deliberately waits for ARIA-enabled; a real pointer click
        // at the visible pending control tests its explicit guard instead.
        const target = await control.evaluate(pendingSoundPointerTarget)
        assertPendingSoundPointerTarget(target)
        report.checks.push({ fallback, pendingPointerTarget: target }); save()
        await page.mouse.click(target.x, target.y)
        assert.equal(await page.evaluate(() => window.soundResumeAttempts), 1, 'Pending pointer click cannot duplicate activation')
        await preserved('pending-pointer')
        await page.keyboard.down('Space')
        await page.evaluate(() => window.rejectSoundResume())
        await page.waitForFunction(soundControlPending, false)
        await page.keyboard.down('Space'); await page.keyboard.up('Space')
        assert.equal(await page.evaluate(() => window.soundResumeAttempts), 1, 'A Space held across settlement cannot activate on release')
        assert.equal(await control.getAttribute('data-sound-enabled'), 'false')
        await preserved('rejected-held-release')
        await page.evaluate(() => window.restoreSoundResume())
        await control.click()
        await page.waitForFunction(() => document.querySelector('[data-sound-control]')?.dataset.soundEnabled === 'true')
        await page.waitForFunction(() => window.observedSoundContext?.state === 'running')
        await preserved('real-resume-recovered')
        report.checks.push({ recoveredAudioContext: await page.evaluate(() => ({ state: window.observedSoundContext.state,
          currentTime: window.observedSoundContext.currentTime, sampleRate: window.observedSoundContext.sampleRate })) })
        assert.equal(await control.getAttribute('aria-label'), 'Mute sound')
        await page.setViewportSize({ width: 640, height: 480 })
        await capture('on-compact', 'Sound On', 'hud-button-hover.png')
        await page.keyboard.press('Space')
        assert.equal(await control.getAttribute('data-sound-enabled'), 'false')
        assert.equal(await control.getAttribute('aria-label'), 'Enable sound')
        await preserved('native-Space-mute')
        if (fallback) assert.ok(blockedArt > 0)
        report.checks.push(`${fallback ? 'fallback/DPR2' : 'native/DPR1'}: off/on, hover/focus, pending pointer/keyboard/repeat guards, focus/world/popup preservation, held-release rejection recovery, native Space mute, compact geometry`)
      } finally { await context.close() }
    }
    report.status = 'passed'; report.limits = ['Trusted browser activation and real AudioContext recovery, not acoustic measurement', 'Browser compatibility footer, not an original native sound-toggle claim']
    return report
  } catch (error) { report.status = 'failed'; report.error = String(error); throw error }
  finally { save() }
}
