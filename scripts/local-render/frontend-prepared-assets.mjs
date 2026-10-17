import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const assetPaths = ['frontend/composition.bin', 'frontend/feft33we.png', 'frontend/fehi33we.png',
  'frontend/felo33we.png', 'frontend/felgspen.png', 'frontend/background.png', 'frontend/pointer.png',
  'options/frontend-0.png', 'options/frontend-1.png', 'options/frontend-2.png'].map(path => `/original/${path}`)

// Gate actual responses; observe native decode promises without injecting readiness.
export default async function ({ page, context, output, url }) {
  const mode = process.env.POPULOUS_PREPARED_MODE
  assert.ok(['healthy', 'slider-failure', 'font-failure', 'late-success'].includes(mode))
  const report = { mode, status: 'running', phases: [], requests: [], errors: [], warnings: [], releases: [],
    limits: ['Actual Home via plain React/Vite; excludes production serving and hydration.',
      'Routing disables HTTP cache. Warm reopen is same-document reuse.',
      'Controlled response holds are diagnostic, not a network profile. Native browser 10-second deadline is unchanged.',
      'Frame observations and screenshots do not establish hardware performance or native parity.'] }
  const save = () => writeFileSync(resolve(output, 'prepared.json'), JSON.stringify(report, null, 2) + '\n')
  const started = performance.now(), now = () => Math.round(performance.now() - started)
  const held = mode === 'healthy' ? assetPaths : mode === 'late-success' ? [
    '/original/frontend/background.png', '/original/frontend/pointer.png', '/original/options/frontend-0.png'] : []
  const failed = mode === 'slider-failure' ? '/original/options/frontend-1.png' :
    mode === 'font-failure' ? '/original/frontend/feft33we.png' : null
  const gates = new Map(held.map(path => { let release;const promise = new Promise(resolve => { release = resolve });return [path, { promise, release }] }))
  const release = paths => {
    for (const path of paths) { report.releases.push({ path, at: now() });gates.get(path)?.release() }
  }
  const route = async route => {
    const path = new URL(route.request().url()).pathname
    if (path === failed) return route.fulfill({ status: 404, contentType: 'text/plain', body: 'Deliberate asset failure' })
    if (gates.has(path)) await gates.get(path).promise
    await route.continue().catch(error => report.errors.push({ kind: 'route', path, message: error.message }))
  }
  await context.route('**/original/**', route)
  for (const event of ['request', 'requestfinished', 'requestfailed']) page.on(event, request => {
    const path = new URL(request.url()).pathname
    if (path.startsWith('/original/')) report.requests.push({ event, path, at: now(), failure: request.failure()?.errorText ?? null })
  })
  page.on('pageerror', error => report.errors.push({ kind: 'page', message: String(error) }))
  page.on('console', message => {
    if (message.type() === 'error') report.errors.push({ kind: 'console', message: message.text(), location: message.location() })
    if (message.type() === 'warning') report.warnings.push(message.text())
  })
  await context.addInitScript(() => {
    window.uiPrepared = { samples: [], frameSamples: [], decodes: [], shifts: [], frame: 0, phase: 'boot' }
    const data = window.uiPrepared
    const decode = HTMLImageElement.prototype.decode
    HTMLImageElement.prototype.decode = function (...args) {
      const entry = { src: this.src, start: performance.now() }
      data.decodes.push(entry)
      return Reflect.apply(decode, this, args).then(value => {
        entry.end = performance.now(); entry.status = 'resolved'; return value
      }, error => {
        entry.end = performance.now(); entry.status = 'rejected'; throw error
      })
    }
    const rect = element => {
      if (!element) return null
      const r = element.getBoundingClientRect()
      return Object.fromEntries(['x', 'y', 'width', 'height'].map(key => [key, Math.round(r[key] * 100) / 100]))
    }
    window.uiSnapshot = () => {
      const menu = document.querySelector('[data-original-main-menu]')
      const options = menu?.querySelector('[data-original-options]')
      const active = document.activeElement
      const buttons = [...(options ?? menu ?? document).querySelectorAll('button')].filter(b =>
        ['Options', 'New Game', 'Game', 'Sound', 'Back'].includes(b.getAttribute('aria-label')) || b.dataset.optionKey === 'rotation')
      const canvas = menu?.querySelector('canvas')
      let rowPixels = null
      if (canvas) {
        const pixels = canvas.getContext('2d').getImageData(Math.max(0, (canvas.width >> 1) - 240), 139, 480, 28).data
        let hash = 2166136261
        for (const value of pixels) hash = Math.imul(hash ^ value, 16777619) >>> 0
        rowPixels = hash.toString(16)
      }
      return {
        backgroundReady: menu?.dataset.backgroundReady ?? null, cursorReady: menu?.dataset.cursorReady ?? null, backgroundImage: menu ? getComputedStyle(menu.firstElementChild).backgroundImage : null, cursor: menu ? getComputedStyle(menu).cursor : null, phase: data.phase, menuOpen: !!menu?.open, loading: !!document.querySelector('.loading-world'),
        optionsOpen: !!options, category: options?.dataset.category ?? null,
        sliderReady: options?.dataset.artReady ?? null,
        fallbackCount: (options ?? menu)?.querySelectorAll('[class*="fallback"]').length ?? 0,
        logo: menu?.querySelector('h1 > span')?.className ?? null,
        canvasRow139Hash: rowPixels, canvasSize: canvas ? [canvas.width, canvas.height] : null, canvasBox: rect(canvas),
        viewport: [innerWidth, innerHeight, devicePixelRatio],
        canvasCorner: canvas ? [...canvas.getContext('2d').getImageData(0, 0, 1, 1).data] : null,
        focus: { tag: active?.tagName, label: active?.getAttribute('aria-label') ?? active?.textContent?.trim().slice(0, 70), key: active?.dataset.optionKey ?? null },
        controls: buttons.map(b => ({ label: b.getAttribute('aria-label'), key: b.dataset.optionKey ?? null,
          box: rect(b), textBox: rect(b.querySelector('span')), glyphs: b.querySelectorAll('i').length,
          font: b.querySelector('span') ? getComputedStyle(b.querySelector('span')).font : null })),
      }
    }
    const sample = source => {
      const state = window.uiSnapshot(), signature = JSON.stringify(state)
      if (source === 'animation-frame' && signature !== data.lastFrame && data.frameSamples.length < 2000) {
        data.frameSamples.push({ at: performance.now(), frame: data.frame, ...state }); data.lastFrame = signature
      }
      if (signature !== data.last && data.samples.length < 2000) {
        data.samples.push({ source, at: performance.now(), frame: data.frame, ...state }); data.last = signature
      }
    }
    new MutationObserver(() => sample('mutation')).observe(document, { subtree: true, childList: true, attributes: true })
    try {
      new PerformanceObserver(list => {
        for (const item of list.getEntries()) data.shifts.push({ at: item.startTime, value: item.value, hadRecentInput: item.hadRecentInput })
      }).observe({ type: 'layout-shift', buffered: true })
    } catch { data.layoutShiftObserverUnavailable = true }
    const frame = () => { data.frame++; sample('animation-frame'); requestAnimationFrame(frame) }
    requestAnimationFrame(frame)
  })
  const phase = async name => {
    await page.evaluate(name => { window.uiPrepared.phase = name }, name)
    const snapshot = await page.evaluate(() => window.uiSnapshot())
    report.phases.push({ name, at: now(), snapshot });save()
    await page.screenshot({ path: resolve(output, `${name}.png`), timeout: 5000 })
    return snapshot
  }
  const twoFrames = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  const options = () => page.locator('[data-original-options]')
  const open = () => page.getByRole('button', { name: 'Options', exact: true }).click()
  const back = () => options().getByRole('button', { name: 'Back', exact: true }).click()
  const flags = state => ({ background: state.backgroundReady, cursor: state.cursorReady, backgroundImage: state.backgroundImage,
    cursorStyle: state.cursor, fallback: state.fallbackCount, sliders: state.sliderReady })
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    if (held.length) {
      await page.waitForFunction(() => window.uiPrepared.decodes.filter(entry => /frontend\//.test(entry.src) || /options\/frontend-/.test(entry.src)).length === 9)
      const loading = await phase('01-loading')
      assert.equal(loading.loading, true);assert.equal(loading.menuOpen, false)
      assert.ok((await page.locator('.loading-world').innerText()).trim().length > 0)
    }
    if (mode === 'healthy') {
      release(held.filter(path => !path.endsWith('.bin')))
      await page.waitForFunction(() => window.uiPrepared.decodes.filter(entry => /frontend\//.test(entry.src) || /options\/frontend-/.test(entry.src)).every(entry => entry.status === 'resolved'))
      await twoFrames()
      const partial = await phase('02-composition-held')
      assert.equal(partial.loading, true);assert.equal(partial.menuOpen, false)
      release(held.filter(path => path.endsWith('.bin')))
    }
    await page.getByRole('dialog', { name: 'Main menu', exact: true }).waitFor()
    await twoFrames()
    const main = await phase('03-main')
    assert.equal(main.loading, false)
    assert.deepEqual(main.canvasSize, [768, 480])
    assert.deepEqual(main.canvasBox, { x: 0, y: 0, width: 1280, height: 800 })
    assert.equal(main.canvasCorner[3], 255)
    assert.ok(main.logo && !main.logo.includes('fallback'))
    const timeout = mode === 'late-success'
    assert.equal(main.backgroundReady, String(!timeout));assert.equal(main.cursorReady, String(!timeout))
    if (timeout) {
      assert.equal(main.backgroundImage, 'none');assert.equal(main.cursor, 'auto')
      const duration = await page.evaluate(() => performance.now() - Math.min(...window.uiPrepared.decodes.map(entry => entry.start)))
      assert.ok(duration >= 9900 && duration < 20000, `native timeout duration ${duration}`)
      report.nativeTimeoutMs = duration
    }
    await open();await options().waitFor();await twoFrames()
    const cold = await phase('04-options')
    assert.equal(cold.fallbackCount === 0, mode !== 'font-failure')
    assert.equal(cold.sliderReady, String(mode === 'healthy' || mode === 'font-failure'))
    const decodesBeforeReopen = await page.evaluate(() => window.uiPrepared.decodes.length)
    const requestsBeforeReopen = report.requests.filter(entry => entry.event === 'request' && assetPaths.includes(entry.path)).length
    const focusBeforeArrow = await page.evaluate(() => window.uiSnapshot().focus)
    await page.keyboard.press('ArrowDown')
    await twoFrames()
    report.keyboardFocus = await page.evaluate(() => window.uiSnapshot().focus)
    assert.deepEqual(report.keyboardFocus, focusBeforeArrow)
    await options().getByRole('button', { name: 'Sound', exact: true }).focus()
    await page.keyboard.press('Enter')
    await options().getByRole('slider', { name: 'Master volume' }).focus()
    const slider = options().getByRole('slider', { name: 'Master volume' })
    await page.keyboard.press('Home');assert.equal(await slider.inputValue(), '0')
    await page.keyboard.press('End');assert.equal(await slider.inputValue(), '1')
    await page.keyboard.press('Tab')
    report.tabFocus = await page.evaluate(() => window.uiSnapshot().focus)
    assert.notEqual(report.tabFocus.label, 'Master volume')
    await page.keyboard.press('Escape')
    await options().waitFor({ state: 'detached' })
    assert.equal(await page.getByRole('button', { name: 'Options', exact: true }).evaluate(node => node === document.activeElement), true)
    await open();await twoFrames()
    const warm = await phase('05-warm-options')
    assert.deepEqual(flags(warm), flags(cold))
    assert.equal(await page.evaluate(() => window.uiPrepared.decodes.length), decodesBeforeReopen)
    assert.equal(report.requests.filter(entry => entry.event === 'request' && assetPaths.includes(entry.path)).length, requestsBeforeReopen)
    if (timeout) {
      release(held)
      await page.waitForFunction(() => window.uiPrepared.decodes.filter(entry => /frontend\//.test(entry.src) || /options\/frontend-/.test(entry.src)).every(entry => entry.status === 'resolved'))
      await twoFrames()
      const late = await phase('06-late-success-frozen')
      assert.deepEqual(flags(late), flags(warm))
      await back();await open();await twoFrames()
      assert.deepEqual(flags(await page.evaluate(() => window.uiSnapshot())), flags(warm))
    }
    await back();await twoFrames();await phase('07-return-focus')
    const samples = await page.evaluate(() => window.uiPrepared.frameSamples)
    const visible = samples.filter(sample => sample.menuOpen)
    assert.ok(visible.length > 0)
    for (const sample of visible) {
      assert.equal(sample.loading, false);assert.deepEqual(sample.canvasSize, [768, 480]);assert.equal(sample.canvasCorner[3], 255)
      assert.equal(sample.fallbackCount === 0, mode !== 'font-failure')
      if (sample.optionsOpen) assert.equal(sample.sliderReady, String(mode === 'healthy' || mode === 'font-failure'))
    }
    // Ready Options rows must already be drawn in the first observed frame of each entry.
    const entries = visible.filter(sample => sample.optionsOpen && sample.category === 'Game')
    assert.ok(entries.length >= 2)
    if (entries.length > 1) assert.equal(new Set(entries.map(sample => sample.canvasRow139Hash)).size, 1)
    assert.equal(report.requests.filter(entry => entry.event === 'request' && assetPaths.includes(entry.path)).length, 10)
    const unexpected = report.errors.filter(error => !(failed && error.kind === 'console' &&
      error.location?.url?.endsWith(failed) && error.message.includes('404')))
    assert.deepEqual(unexpected, [])
    report.status = 'passed'
  } catch (error) {
    report.status = 'failed';report.failure = String(error.stack)
    await page.screenshot({ path: resolve(output, 'failed.png'), timeout: 5000 }).catch(() => {})
    throw error
  } finally {
    release(held)
    report.browser = await page.evaluate(() => window.uiPrepared).catch(() => null)
    save()
  }
  return { status: report.status, mode, phases: report.phases.length }
}
