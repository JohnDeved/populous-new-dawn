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
    window.soundResumeAttempts++
    return new Promise((resolve, reject) => { window.rejectSoundResume = () => reject(new DOMException('Controlled audio rejection', 'NotAllowedError')) })
  }
  window.restoreSoundResume = () => { AudioContext.prototype.resume = resume }
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
        await page.evaluate(holdAudioResume)
        await page.keyboard.press('Enter')
        await page.waitForFunction(() => document.querySelector('[data-sound-control]')?.disabled)
        await capture('pending', 'Wait')
        await page.keyboard.press('Enter'); await page.keyboard.press('Space')
        assert.equal(await page.evaluate(() => window.soundResumeAttempts), 1, 'Disabled pending control cannot duplicate activation')
        await page.evaluate(() => window.rejectSoundResume())
        await page.waitForFunction(() => !document.querySelector('[data-sound-control]')?.disabled)
        assert.equal(await control.getAttribute('data-sound-enabled'), 'false')
        await page.evaluate(() => window.restoreSoundResume())
        await control.click()
        await page.waitForFunction(() => document.querySelector('[data-sound-control]')?.dataset.soundEnabled === 'true')
        assert.equal(await control.getAttribute('aria-label'), 'Mute sound')
        await page.setViewportSize({ width: 640, height: 480 })
        await capture('on-compact', 'Sound On', 'hud-button-hover.png')
        await control.click()
        assert.equal(await control.getAttribute('data-sound-enabled'), 'false')
        assert.equal(await control.getAttribute('aria-label'), 'Enable sound')
        if (fallback) assert.ok(blockedArt > 0)
        report.checks.push(`${fallback ? 'fallback/DPR2' : 'native/DPR1'}: off/on, hover/focus, pending duplicate guard, rejection recovery, compact geometry`)
      } finally { await context.close() }
    }
    report.status = 'passed'; report.limits = ['Trusted browser activation and real AudioContext recovery, not acoustic measurement', 'Browser compatibility footer, not an original native sound-toggle claim']
    return report
  } catch (error) { report.status = 'failed'; report.error = String(error); throw error }
  finally { save() }
}
