import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'
import { observeOptionsStorage, assertOptionsCopyClearance } from './options-copy-clearance.mjs'
import { candidateModule, ordinaryMission, saveMissionInputTrace } from './ordinary-mission.mjs'

// Only the two preference writes are failed. Reads, checkpoints, campaign state
// and unrelated storage remain real; no component/world state is injected.
export function failPreferenceWrites() {
  const set = Storage.prototype.setItem
  window.blockedPreferenceKey = 'populous-game-preferences'
  window.preferenceWriteFailures = []
  Storage.prototype.setItem = function (key, value) {
    if (key === window.blockedPreferenceKey && ['populous-game-preferences', 'populous-audio-preferences'].includes(key)) {
      window.preferenceWriteFailures.push(key)
      throw new DOMException('Controlled preference write failure', 'SecurityError')
    }
    return set.call(this, key, value)
  }
}
// Both original menus publish frontendScale(window.innerWidth, window.innerHeight)
// on their dialog; Options inherits it. Viewport emulation can finish before
// the resize listener's React update, so a second RPC or sleep is not readiness.
export function optionsViewportReady({ width, height, skin }) {
  if (![width, height].every(value => Number.isFinite(value) && value > 0) ||
    window.innerWidth !== width || window.innerHeight !== height) return false
  const matches = document.querySelectorAll('[data-original-options]')
  if (matches.length !== 1) return false
  const options = matches[0], notices = options.querySelectorAll('[role="status"]')
  const dialog = options.closest('dialog[data-original-main-menu], dialog[data-original-pause-menu]')
  const selector = { frontend: '[data-original-main-menu]', ingame: '[data-original-pause-menu]' }[skin]
  if (!selector || options.dataset.skin !== skin || !dialog?.open || !dialog.matches(selector) || notices.length !== 1) return false
  for (const element of [dialog, options, notices[0]]) {
    const style = getComputedStyle(element)
    const rendered = [...element.getClientRects()].some(rect => Number.isFinite(rect.width) && Number.isFinite(rect.height) && rect.width > 0 && rect.height > 0)
    if (!rendered || style.visibility !== 'visible' || style.display === 'none') return false
  }
  const raw = getComputedStyle(options).getPropertyValue('--frontend-scale').trim()
  // Reject missing, malformed and non-finite CSS numbers rather than coercing
  // them into a ready state. Match the exact source scale, without tolerance.
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw)) return false
  const scale = Number(raw)
  return Number.isFinite(scale) && scale > 0 && scale === Math.min(width / 640, height / 480)
}
export default async function ({ browser, url, root, output, receipt, signal, deadlineAt }) {
  const report = { status: 'running', samples: [], measurements: [], checks: [], inputBudgets: [] }
  receipt.missionInputBudgets = report.inputBudgets
  const save = () => writeFileSync(resolve(output, 'options-storage.json'), JSON.stringify(report, null, 2) + '\n')
  const { waitForStartupMenu } = await candidateModule(root, 'scripts/browser-new-game.mjs')
  let episodeError
  try {
    for (const skin of ['frontend', 'ingame']) for (const fallback of [false, true]) {
      signal.throwIfAborted()
      const context = await browser.newContext({ viewport: { width: 640, height: 480 } })
      let blockedFonts = 0
      try {
        if (fallback) await context.route(skin === 'frontend' ? '**/original/frontend/fe*33we.png' : '**/original/pause-font.png', route => {
          blockedFonts++; return route.abort('failed')
        })
        const page = await context.newPage(), button = name => page.getByRole('button', { name, exact: true })
        await page.goto(url, { waitUntil: 'domcontentloaded' })
        if (skin === 'ingame') {
          const trace = { skin, fallback }; report.inputBudgets.push(trace)
          let inputError
          try { await ordinaryMission(page, root, { signal, deadlineAt, trace }) }
          catch (error) { inputError = error; throw error }
          finally { saveMissionInputTrace(save, inputError) }
          await button('Menu').click()
        }
        else await waitForStartupMenu(page)
        const frozen = skin === 'ingame' ? await page.evaluate(() => JSON.stringify(window.testStore.getWorld())) : null
        const before = await page.evaluate(() => ['populous-game-preferences', 'populous-audio-preferences'].map(key => localStorage.getItem(key)))
        await page.evaluate(failPreferenceWrites)
        await button('Options').click()
        const options = page.locator('[data-original-options]'), notice = options.getByRole('status')
        assert.equal(await options.getAttribute('data-skin'), skin)
        await options.locator('[data-option-key="rotation"]').click()
        await notice.waitFor()
        const gameCopy = await notice.getAttribute('aria-label')
        assert.match(gameCopy, /browser storage is unavailable/i)
        assert.equal(await page.evaluate(() => localStorage.getItem('populous-game-preferences')), before[0], 'Failed Game write preserves prior bytes')
        const capture = async category => {
          for (const [width, height] of fallback ? [[320, 240], [640, 480]] : [[640, 480], [1280, 720]]) {
            signal.throwIfAborted(); await page.setViewportSize({ width, height })
            const ready = await page.waitForFunction(optionsViewportReady, { width, height, skin }, { timeout: 5000 })
            await ready.dispose(); signal.throwIfAborted()
            const sample = await notice.evaluate(observeOptionsStorage)
            // Retain the exact original assertion input, even when geometry fails.
            // Any later screenshot is a later state, not this sample's instant.
            report.measurements.push({ skin, category, fallback, width, height, ...sample }); save()
            assert.equal(sample.background, 'rgba(0, 0, 0, 0)')
            assert.equal(sample.glyphs > 0, !fallback)
            assert.ok(sample.lines.length > 0)
            for (const line of sample.lines) {
              assert.equal(line.pitch, 30)
              assert.ok(line.box.y >= 0 && line.box.bottom <= sample.navigation.y, 'Notice stays above category navigation')
              assert.ok(line.box.x >= -1 && line.box.right <= width + 1, 'Notice remains within viewport')
              if (fallback) assert.ok(line.text.trim().length)
            }
            assertOptionsCopyClearance(sample, { skin, category, fallback })
            if (!fallback) assert.ok(sample.images.every(image => image.includes(skin === 'frontend' ? '/original/frontend/' : '/original/pause-font.png')))
            const name = `${skin}-${category}-${fallback ? 'fallback' : 'glyphs'}-${width}x${height}.png`
            await page.screenshot({ path: resolve(output, name) })
            report.samples.push({ skin, category, fallback, width, height, name, ...sample }); save()
          }
        }
        await capture('game')
        await button('Sound').click(); assert.equal(await notice.count(), 0, 'Game failure does not leak into Sound')
        const master = page.getByRole('slider', { name: 'Master volume', exact: true })
        await master.focus(); await page.keyboard.press('Home'); assert.equal(await master.inputValue(), '0')
        assert.equal(await notice.count(), 0, 'Game-only failure leaves Sound writes available')
        const savedAudio = await page.evaluate(() => localStorage.getItem('populous-audio-preferences'))
        assert.equal(JSON.parse(savedAudio).volume, 0)
        await page.evaluate(() => { window.blockedPreferenceKey = 'populous-audio-preferences' })
        await page.keyboard.press('End'); assert.equal(await master.inputValue(), '1')
        await notice.waitFor(); await capture('sound')
        assert.equal(await page.evaluate(() => localStorage.getItem('populous-audio-preferences')), savedAudio, 'Failed Sound write preserves prior bytes')
        await button('Graphics').click(); assert.equal(await notice.count(), 0, 'Storage notices do not leak into unrelated categories')
        await button('Game').click(); assert.equal(await notice.getAttribute('aria-label'), gameCopy)
        await options.locator('[data-option-key="rotation"]').click()
        assert.equal(await notice.count(), 0, 'Sound-only failure leaves Game writes available')
        assert.ok(await page.evaluate(() => localStorage.getItem('populous-game-preferences')))
        assert.deepEqual(await page.evaluate(() => [...new Set(window.preferenceWriteFailures)].sort()), ['populous-audio-preferences', 'populous-game-preferences'])
        if (fallback) assert.ok(blockedFonts > 0, 'Fallback needs an observed failed font request')
        await page.keyboard.press('Escape')
        assert.equal(await button('Options').evaluate(node => node === document.activeElement), true)
        if (skin === 'ingame') {
          assert.equal(await page.evaluate(() => JSON.stringify(window.testStore.getWorld())), frozen, 'Options must retain frozen world and pause ownership')
          await button('Continue Game').click()
          assert.equal(await page.locator('[data-original-pause-menu]').count(), 0)
        }
        report.checks.push(`${skin}/${fallback ? 'fallback' : 'native glyphs'}: independent Game/Sound errors, failed-key bytes preserved and other category writes succeed, layout and focus`)
      } finally { await context.close() }
    }
    report.status = 'passed'
    report.limits = ['Browser preference failure presentation, not native failure-dialog or acoustic equivalence', 'Ordinary Mission 1 entry; no injected world/checkpoint/React state']
    return report
  } catch (error) { episodeError = error; report.status = 'failed'; report.error = String(error); throw error }
  finally { saveMissionInputTrace(save, episodeError) }
}
