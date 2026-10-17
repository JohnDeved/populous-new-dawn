import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Baseline observation only: delay real responses, never substitute artwork or readiness.
export default async function ({ page, context, output, url }) {
  const report = { status: 'running', phases: [], requests: [], releases: [], errors: [], warnings: [],
    limits: ['Actual Home in plain React/Vite; excludes production serving/hydration.',
      'Routing disables HTTP cache while installed. Reopen is same-document loaded-resource reuse, not proof of warm HTTP cache.',
      'Animation-frame/DOM observations supplement retained screenshots; transient DOM states alone do not establish visibly painted frames.',
      'Response holds are controlled diagnostics, not a measured network profile. No product timeout policy is introduced.'] }
  const save = () => writeFileSync(resolve(output, 'baseline.json'), JSON.stringify(report, null, 2) + '\n')
  const start = performance.now(), now = () => Math.round(performance.now() - start)
  const released = new Set(), gates = new Map()
  const groups = {
    fonts: ['frontend/feft33we.png', 'frontend/fehi33we.png', 'frontend/felo33we.png'],
    artwork: ['frontend/felgspen.png', 'frontend/background.png'],
    composition: ['frontend/composition.bin'],
    sliders: ['options/frontend-0.png', 'options/frontend-1.png', 'options/frontend-2.png'],
  }
  for (const name of Object.keys(groups)) {
    let release
    const promise = new Promise(resolve => { release = resolve })
    gates.set(name, { promise, release })
  }
  const groupOf = path => Object.keys(groups).find(name => groups[name].some(file => path === `/original/${file}`))
  const route = async route => {
    const path = new URL(route.request().url()).pathname, group = groupOf(path)
    if (group && !released.has(group)) await gates.get(group).promise
    await route.continue().catch(error => report.errors.push(`route: ${error.message}`))
  }
  const release = group => {
    released.add(group)
    report.releases.push({ group, at: now() })
    gates.get(group).release()
    save()
  }
  await context.route('**/original/**', route)
  page.on('request', request => {
    const path = new URL(request.url()).pathname
    if (path.startsWith('/original/')) report.requests.push({ event: 'request', path, group: groupOf(path) ?? null, at: now() })
  })
  page.on('requestfinished', request => {
    const path = new URL(request.url()).pathname
    if (path.startsWith('/original/')) report.requests.push({ event: 'finished', path, at: now() })
  })
  page.on('requestfailed', request => report.errors.push(`request: ${request.url()} ${request.failure()?.errorText}`))
  page.on('pageerror', error => report.errors.push(String(error)))
  page.on('console', message => {
    if (message.type() === 'error') report.errors.push(message.text())
    if (message.type() === 'warning') report.warnings.push(message.text())
  })
  await context.addInitScript(() => {
    window.uiBaseline = { samples: [], decodes: [], shifts: [], frame: 0, phase: 'boot' }
    const data = window.uiBaseline
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
      return {
        phase: data.phase, menuOpen: !!menu?.open, loading: !!document.querySelector('.loading-world'),
        optionsOpen: !!options, category: options?.dataset.category ?? null,
        sliderReady: options?.dataset.artReady ?? null,
        fallbackCount: (options ?? menu)?.querySelectorAll('[class*="fallback"]').length ?? 0,
        logo: menu?.querySelector('h1 > span')?.className ?? null,
        canvasCorner: canvas ? [...canvas.getContext('2d').getImageData(0, 0, 1, 1).data] : null,
        focus: { tag: active?.tagName, label: active?.getAttribute('aria-label') ?? active?.textContent?.trim().slice(0, 70), key: active?.dataset.optionKey ?? null },
        controls: buttons.map(b => ({ label: b.getAttribute('aria-label'), key: b.dataset.optionKey ?? null,
          box: rect(b), textBox: rect(b.querySelector('span')), glyphs: b.querySelectorAll('i').length,
          font: b.querySelector('span') ? getComputedStyle(b.querySelector('span')).font : null })),
      }
    }
    const sample = source => {
      const state = window.uiSnapshot(), signature = JSON.stringify(state)
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
    await page.evaluate(name => { window.uiBaseline.phase = name }, name)
    const entry = { name, at: now(), snapshot: await page.evaluate(() => window.uiSnapshot()) }
    report.phases.push(entry)
    save()
    await page.screenshot({ path: resolve(output, `${name}.png`), timeout: 5000 })
    return entry.snapshot
  }
  const options = () => page.locator('[data-original-options]')
  const open = async () => page.getByRole('button', { name: 'Options', exact: true }).click()
  const back = async () => options().getByRole('button', { name: 'Back', exact: true }).click()
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await page.getByRole('dialog', { name: 'Main menu', exact: true }).waitFor()
    const initial = await phase('01-first-menu-held')
    assert.equal(initial.loading, false)
    assert.ok(initial.fallbackCount > 0)
    assert.deepEqual(initial.canvasCorner, [0, 0, 0, 0])
    await open()
    const cold = await phase('02-immediate-options-held')
    assert.ok(cold.fallbackCount > 0)
    assert.equal(cold.sliderReady, 'false')
    await options().getByRole('button', { name: 'Sound', exact: true }).click()
    await phase('03-sound-held')
    release('fonts')
    await page.waitForFunction(() => document.querySelector('[data-original-options]')?.querySelectorAll('[class*="fallback"]').length === 0)
    const fonts = await phase('04-fonts-ready-sliders-held')
    assert.equal(fonts.sliderReady, 'false')
    release('sliders')
    await page.waitForFunction(() => document.querySelector('[data-original-options]')?.dataset.artReady === 'true')
    await phase('05-options-ready')
    await back()
    await phase('06-main-artwork-held')
    release('artwork')
    await page.waitForFunction(() => !document.querySelector('[data-original-main-menu] h1 [class*="fallback"]'))
    const art = await phase('07-main-composition-held')
    assert.deepEqual(art.canvasCorner, [0, 0, 0, 0])
    release('composition')
    await page.waitForFunction(() => {
      const canvas = document.querySelector('[data-original-main-menu] canvas')
      return canvas?.getContext('2d').getImageData(0, 0, 1, 1).data[3] === 255
    })
    await phase('08-main-ready')
    // Remove routing before reopening; record actual requests instead of assuming cache behavior.
    await context.unroute('**/original/**', route)
    await page.evaluate(() => { window.uiBaseline.phase = 'warm-reopen' })
    await open()
    await options().waitFor()
    await page.waitForFunction(() => document.querySelector('[data-original-options]')?.dataset.artReady === 'true')
    await phase('09-reopened-options-ready')
    await back()
    await phase('10-return-focus')
    report.status = 'passed-baseline-observations'
  } catch (error) {
    report.status = 'failed'
    report.failure = String(error.stack)
    await page.screenshot({ path: resolve(output, 'failed.png'), timeout: 5000 }).catch(() => {})
    throw error
  } finally {
    for (const gate of gates.values()) gate.release()
    report.browser = await page.evaluate(() => window.uiBaseline).catch(() => null)
    save()
  }
  assert.deepEqual(report.errors, [])
  return { status: report.status, phases: report.phases.length, report: 'baseline.json' }
}
