import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'
import { candidateModule, ordinaryMission } from './ordinary-mission.mjs'

// Only the two preference writes are failed. Reads, checkpoints, campaign state
// and unrelated storage remain real; no component/world state is injected.
export function failPreferenceWrites() {
  const set = Storage.prototype.setItem
  window.preferenceWriteFailures = []
  Storage.prototype.setItem = function (key, value) {
    if (['populous-game-preferences', 'populous-audio-preferences'].includes(key)) {
      window.preferenceWriteFailures.push(key)
      throw new DOMException('Controlled preference write failure', 'SecurityError')
    }
    return set.call(this, key, value)
  }
}
export default async function ({ browser, url, root, output, signal }) {
  const report = { status: 'running', samples: [], checks: [] }
  const save = () => writeFileSync(resolve(output, 'options-storage.json'), JSON.stringify(report, null, 2) + '\n')
  const { waitForStartupMenu } = await candidateModule(root, 'scripts/browser-new-game.mjs')
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
        if (skin === 'ingame') { await ordinaryMission(page, root, signal); await button('Menu').click() }
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
        const capture = async category => {
          for (const [width, height] of fallback ? [[320, 240], [640, 480]] : [[640, 480], [1280, 720]]) {
            signal.throwIfAborted(); await page.setViewportSize({ width, height })
            const sample = await notice.evaluate(node => {
              const bounds = element => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom } }
              const options = node.closest('[data-original-options]')
              return { copy: node.getAttribute('aria-label'), glyphs: node.querySelectorAll('i').length,
                lines: [...node.querySelectorAll(':scope > [aria-hidden]')].map(line => ({ box: bounds(line), pitch: line.offsetHeight,
                  text: line.textContent, glyphs: line.querySelectorAll('i').length })),
                navigation: bounds(options.querySelector('nav')), background: getComputedStyle(node).backgroundColor,
                images: [...new Set([...node.querySelectorAll('i')].map(glyph => getComputedStyle(glyph).backgroundImage))] }
            })
            assert.equal(sample.background, 'rgba(0, 0, 0, 0)')
            assert.equal(sample.glyphs > 0, !fallback)
            assert.ok(sample.lines.length > 0)
            for (const line of sample.lines) {
              assert.equal(line.pitch, 30)
              assert.ok(line.box.y >= 0 && line.box.bottom <= sample.navigation.y, 'Notice stays above category navigation')
              assert.ok(line.box.x >= -1 && line.box.right <= width + 1, 'Notice remains within viewport')
              if (fallback) assert.ok(line.text.trim().length)
            }
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
        await notice.waitFor(); await capture('sound')
        await button('Graphics').click(); assert.equal(await notice.count(), 0, 'Storage notices do not leak into unrelated categories')
        await button('Game').click(); assert.equal(await notice.getAttribute('aria-label'), gameCopy)
        assert.deepEqual(await page.evaluate(() => ['populous-game-preferences', 'populous-audio-preferences'].map(key => localStorage.getItem(key))), before)
        assert.deepEqual(await page.evaluate(() => [...new Set(window.preferenceWriteFailures)].sort()), ['populous-audio-preferences', 'populous-game-preferences'])
        if (fallback) assert.ok(blockedFonts > 0, 'Fallback needs an observed failed font request')
        await page.keyboard.press('Escape')
        assert.equal(await button('Options').evaluate(node => node === document.activeElement), true)
        if (skin === 'ingame') {
          assert.equal(await page.evaluate(() => JSON.stringify(window.testStore.getWorld())), frozen, 'Options must retain frozen world and pause ownership')
          await button('Continue Game').click()
          assert.equal(await page.locator('[data-original-pause-menu]').count(), 0)
        }
        report.checks.push(`${skin}/${fallback ? 'fallback' : 'native glyphs'}: independent Game/Sound errors, unchanged stored values, layout and focus`)
      } finally { await context.close() }
    }
    report.status = 'passed'
    report.limits = ['Browser preference failure presentation, not native failure-dialog or acoustic equivalence', 'Ordinary Mission 1 entry; no injected world/checkpoint/React state']
    return report
  } catch (error) { report.status = 'failed'; report.error = String(error); throw error }
  finally { save() }
}
