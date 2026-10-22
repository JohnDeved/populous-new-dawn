import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { waitForStartupMenu } from '../browser-new-game.mjs'

// Storage-boundary fixtures only, in fresh ephemeral contexts. No world, tick,
// checkpoint continuation or component state is injected. The incompatible
// sentinel is deliberately not a playable save and must remain byte-for-byte.
function failedThenDelayedRead() {
  const open = IDBFactory.prototype.open
  const transact = IDBDatabase.prototype.transaction
  window.noticeLookupAttempts = 0
  IDBDatabase.prototype.transaction = function (...args) {
    const transaction = transact.apply(this, args)
    if (this.name === 'populous-new-dawn' && transaction.mode === 'readonly') {
      transaction.addEventListener('complete', () => { window.noticeReadCompleted = true })
    }
    return transaction
  }
  IDBFactory.prototype.open = function (...args) {
    if (args[0] !== 'populous-new-dawn') return open.apply(this, args)
    const attempt = ++window.noticeLookupAttempts
    if (attempt === 1) throw new DOMException('Controlled lookup failure', 'UnknownError')
    const request = open.apply(this, args)
    if (attempt === 2) request.addEventListener('success', event => {
      event.stopImmediatePropagation()
      window.finishNoticeLookup = () => request.dispatchEvent(new Event('success'))
    }, { once: true })
    return request
  }
}

export default async function ({ browser, url, output, signal }) {
  const captures = [], geometry = [], errors = []
  const expectedLines = {
    failed: ['Lookup failed; save unchanged.'],
    fallback: ['Lookup failed; save unchanged.'],
    pending: ['Checking browser storage...'],
    incompatible: ['Incompatible with this build.', 'Stored save unchanged.'],
    unavailable: ['Browser storage is unavailable.', 'Play and save this session only.'],
  }
  const main = page => page.getByRole('dialog', { name: 'Main menu', exact: true })
  const retry = page => main(page).getByRole('button', { name: 'Retry checkpoint lookup', exact: true })
  const region = page => main(page).getByRole('region', { name: 'Browser checkpoint recovery', exact: true })
  async function checkFullscreen(page) {
    const sample = await main(page).evaluate(menu => {
      const rect = node => {
        const box = node.getBoundingClientRect()
        return { x: box.x, y: box.y, right: box.right, bottom: box.bottom }
      }
      const host = menu.querySelector('[data-fullscreen-control]')
      const button = host?.querySelector('button')
      if (!button) return null
      const style = getComputedStyle(button), box = rect(button)
      const ring = style.outlineStyle === 'none' ? 0 : parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset)
      return { box, focus: { x:box.x-ring, y:box.y-ring, right:box.right+ring, bottom:box.bottom+ring },
        directOwner: host.parentElement === menu,
        count: document.querySelectorAll('[data-fullscreen-control]').length,
        hit: document.elementFromPoint((box.x+box.right)/2, (box.y+box.bottom)/2)?.closest('button') === button,
        focused: document.activeElement === button, focusVisible: button.matches(':focus-visible'),
        occupied: [...menu.querySelectorAll('h1 > span, nav button, [data-checkpoint-notice-line] > span, [aria-label="Retry checkpoint lookup"], [data-frontend-badge], [data-frontend-badge-vector]')].map(rect) }
    })
    assert.ok(sample, 'Fullscreen remains available inside the main-menu modal')
    assert.equal(sample.directOwner, true)
    assert.equal(sample.count, 1, 'Panel transitions never duplicate the fullscreen portal')
    assert.equal(sample.hit, true, 'Fullscreen receives a physical pointer hit')
    assert.equal(sample.box.right-sample.box.x, 17)
    assert.equal(sample.box.bottom-sample.box.y, 14)
    const { width, height } = page.viewportSize(), box = sample.focus
    assert.ok(box.x >= 0 && box.y >= 0 && box.right <= width && box.bottom <= height, 'Fullscreen focus ring is unclipped')
    for (const target of sample.occupied) {
      assert.equal(box.x < target.right && box.right > target.x && box.y < target.bottom && box.bottom > target.y, false,
        'Fullscreen and its focus ring must clear the logo, menu, notices, Retry and badges')
    }
    return sample
  }
  async function capture(page, state, { fallback = false } = {}) {
    await page.waitForFunction(firstLine => document.querySelector('[data-checkpoint-notice-line]')
      ?.getAttribute('data-checkpoint-notice-line') === firstLine, expectedLines[state][0])
    for (const [width, height] of [[320, 240], [640, 480], [1280, 720]]) {
      signal.throwIfAborted()
      await page.setViewportSize({ width, height })
      await page.waitForFunction(({ width, height }) => {
        const menu = document.querySelector('[data-original-main-menu]')
        return menu && Math.abs(Number(menu.style.getPropertyValue('--frontend-scale')) -
          Math.min(width / 640, height / 480)) < 0.00001
      }, { width, height })
      await region(page).waitFor()
      const sample = await region(page).evaluate(element => {
        const rect = node => {
          const box = node.getBoundingClientRect()
          return { x: box.x, y: box.y, right: box.right, bottom: box.bottom }
        }
        const menu = element.closest('dialog')
        return {
          lines: [...element.querySelectorAll('[data-checkpoint-notice-line]')].map(node => ({
            text: node.getAttribute('data-checkpoint-notice-line'), rect: rect(node.firstElementChild),
            glyphs: node.querySelectorAll('i').length,
          })),
          retry: element.querySelector('button') ? rect(element.querySelector('button')) : null,
          quit: rect(menu.querySelector('nav button[aria-label="Quit"]')),
          badges: [...menu.querySelectorAll('[data-frontend-badge]')].map(rect),
          background: getComputedStyle(element).backgroundColor,
          scene: !!document.querySelector('.world-viewport canvas'),
        }
      })
      const overlap = (a, b) => a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y
      assert.equal(sample.background, 'rgba(0, 0, 0, 0)')
      assert.equal(sample.scene, false, 'checkpoint recovery never enters gameplay')
      assert.deepEqual(sample.lines.map(line => line.text), expectedLines[state])
      assert.equal(!!sample.retry, ['failed', 'fallback', 'pending'].includes(state))
      const boxes = [...sample.lines.map(line => line.rect), ...(sample.retry ? [sample.retry] : [])]
      assert.equal(boxes.length, 2, 'one notice plus Retry, or two complete notice lines')
      for (const box of boxes) {
        assert.ok(box.x >= 0 && box.y >= sample.quit.bottom && box.right <= width && box.bottom <= height)
        for (const badge of sample.badges) assert.equal(overlap(box, badge), false, 'original badges remain clear')
      }
      assert.equal(overlap(boxes[0], boxes[1]), false, 'Retry and notices never overlap')
      assert.ok(sample.lines.every(line => fallback ? line.glyphs === 0 : line.glyphs > 0))
      const fullscreen = await checkFullscreen(page)
      const name = `${state}-${width}x${height}.png`
      await page.screenshot({ path: resolve(output, name) })
      captures.push(name)
      geometry.push({ state, width, height, ...sample, fullscreen })
      if (state === 'failed') {
        // Traverse the real tab order, rather than asserting a programmatic focus.
        await main(page).getByRole('button', { name: 'Quit', exact: true }).focus()
        for (let step = 0; step < 3 && !await page.locator('[data-fullscreen-control] button').evaluate(node => node === document.activeElement); step++) {
          await page.keyboard.press('Tab')
        }
        const focused = await checkFullscreen(page)
        assert.equal(focused.focused, true, 'Keyboard traversal reaches fullscreen after Retry')
        assert.equal(focused.focusVisible, true)
        const name = `fullscreen-focused-${width}x${height}.png`
        await page.screenshot({ path: resolve(output, name) }); captures.push(name)
        geometry.push({ state:'fullscreen-focused', width, height, fullscreen:focused })
      }
      writeFileSync(resolve(output, 'notice-geometry.json'), JSON.stringify(geometry, null, 2) + '\n')
    }
  }
  for (const state of ['failed', 'unavailable', 'incompatible', 'fallback']) {
    signal.throwIfAborted()
    const context = await browser.newContext({ viewport: { width: 640, height: 480 } })
    try {
      if (state === 'failed' || state === 'fallback') await context.addInitScript(failedThenDelayedRead)
      if (state === 'unavailable') await context.addInitScript(() => {
        Object.defineProperty(window, 'indexedDB', { configurable: true, value: undefined })
      })
      const page = await context.newPage()
      page.on('pageerror', error => errors.push(String(error)))
      if (state === 'fallback') await page.route('**/original/frontend/feft33we.png', route => route.abort('failed'))
      if (state === 'fallback') await page.route('**/original/frontend/felo33we.png', route => route.abort('failed'))
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      await waitForStartupMenu(page)
      let sentinel
      if (state === 'incompatible') {
        sentinel = { version: -1, world: null, marker: 'frontend-notice-style-fixture' }
        await page.evaluate(async value => {
          const db = await new Promise((resolve, reject) => {
            const request = indexedDB.open('populous-new-dawn', 1)
            request.onsuccess = () => resolve(request.result)
            request.onerror = () => reject(request.error)
          })
          try {
            await new Promise((resolve, reject) => {
              const transaction = db.transaction('checkpoints', 'readwrite')
              transaction.objectStore('checkpoints').put(value, 'latest')
              transaction.oncomplete = resolve
              transaction.onerror = () => reject(transaction.error)
              transaction.onabort = () => reject(transaction.error)
            })
          } finally { db.close() }
        }, sentinel)
        await page.reload({ waitUntil: 'domcontentloaded' })
        await waitForStartupMenu(page)
      }
      await capture(page, state, { fallback: state === 'fallback' })
      if (state === 'failed') {
        await retry(page).focus()
        await page.keyboard.down('Enter')
        try {
          await page.waitForFunction(() => typeof window.finishNoticeLookup === 'function')
          assert.equal(await retry(page).isDisabled(), true)
          assert.equal(await main(page).getByRole('button', { name: 'Load Game', exact: true })
            .evaluate(node => node === document.activeElement), true)
          await page.keyboard.down('Enter')
          await retry(page).evaluate(node => { node.click(); node.click() })
          assert.equal(await page.evaluate(() => window.noticeLookupAttempts), 2)
        } finally { await page.keyboard.up('Enter') }
        await capture(page, 'pending')
        await main(page).getByRole('button', { name: 'Options', exact: true }).click()
        const back = main(page).getByRole('button', { name: 'Back', exact: true })
        await back.focus()
        await page.evaluate(() => window.finishNoticeLookup())
        await page.waitForFunction(() => window.noticeReadCompleted === true)
        assert.equal(await back.evaluate(node => node === document.activeElement), true,
          'late lookup completion must not reclaim focus from Options')
        await back.click()
        await region(page).waitFor({ state: 'hidden' })
        assert.equal(await main(page).getByRole('button', { name: 'Options', exact: true })
          .evaluate(node => node === document.activeElement), true)
        assert.equal(await page.locator('.world-viewport canvas').count(), 0)
      }
      if (sentinel) {
        const stored = await page.evaluate(async () => {
          const db = await new Promise((resolve, reject) => {
            const request = indexedDB.open('populous-new-dawn', 1)
            request.onsuccess = () => resolve(request.result)
            request.onerror = () => reject(request.error)
          })
          try {
            return await new Promise((resolve, reject) => {
              const request = db.transaction('checkpoints', 'readonly').objectStore('checkpoints').get('latest')
              request.onsuccess = () => resolve(request.result)
              request.onerror = () => reject(request.error)
            })
          } finally { db.close() }
        })
        assert.deepEqual(stored, sentinel, 'incompatible stored data is untouched')
      }
    } finally { await context.close() }
  }
  assert.deepEqual(errors, [])
  return { captures, checks: ['native recovery artwork and readable fallback', 'compact and wide geometry',
    'no Quit, badge or Retry overlap', 'fullscreen and keyboard focus clear logo, rows, recovery and badges',
    'pending retry disabled and held input contained',
    'late read does not navigate', 'incompatible stored data unchanged'],
  limits: ['Synthetic browser-storage failures and incompatible sentinel in ephemeral profiles.',
    'Frontend-only software-rendered evidence, not original-game pixel parity or gameplay acceptance.',
    'Existing fullscreen error bubbles may overlay artwork; error-popup non-overlap is not claimed.'] }
}
