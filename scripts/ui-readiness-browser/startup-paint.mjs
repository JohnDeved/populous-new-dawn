import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Diagnostic response gates only. The supplied production page owns all application state.
export default async function ({ page, context, url, output, servingDescription }) {
  const mode = process.env.POPULOUS_PREPARED_MODE
  assert.ok(['startup-ssr', 'startup-label-held', 'startup-art-failure'].includes(mode))
  const report = { mode, status: 'running', url, servingDescription, phases: [], requests: [], errors: [],
    limits: ['Controlled response holds are not a real network speed profile.',
      'Screenshots and bounded frame samples establish observed paint only, not every possible frame.',
      'No application state, clocks, readiness, storage, or native timeout is injected or changed.'] }
  const save = () => writeFileSync(resolve(output, 'startup.json'), JSON.stringify(report, null, 2) + '\n')
  const started = performance.now(), now = () => Math.round(performance.now() - started)
  const gate = () => { let release; const promise = new Promise(resolve => { release = resolve }); return {promise, release} }
  const scripts = gate(), label = gate(), frontend = gate()
  const scriptObserved = gate(), frontendObserved = gate()
  const observed = async (promise, name) => {
    let timer
    try {
      await Promise.race([promise, new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${name} request was not observed within15000ms`)), 15000)
      })])
    } finally { clearTimeout(timer) }
  }
  let scriptReleased = false, labelReleased = mode !== 'startup-label-held', frontendReleased = false
  let heldScripts = 0, heldFrontend = 0, labelRequests = 0, maskRequests = 0
  const releaseScripts = () => { scriptReleased = true; scripts.release() }
  const releaseLabel = () => { labelReleased = true; label.release() }
  const releaseFrontend = () => { frontendReleased = true; frontend.release() }
  const route = async route => {
    const request = route.request(), path = new URL(request.url()).pathname
    const art = path === '/original/loading-label.png' || path === '/original/loading-mask.png'
    if (path === '/original/loading-label.png') labelRequests++
    if (path === '/original/loading-mask.png') maskRequests++
    if (request.resourceType() === 'script' && !scriptReleased) {
      heldScripts++; scriptObserved.release(); await scripts.promise
    }
    if (art && mode === 'startup-art-failure') {
      report.requests.push({path, at: now(), action: '404'}); save()
      return route.fulfill({status: 404, contentType: 'text/plain', body: 'Diagnostic loading art failure'})
    }
    if (path === '/original/loading-label.png' && !labelReleased) await label.promise
    if (path === '/original/frontend/composition.bin' && !frontendReleased) {
      heldFrontend++; frontendObserved.release(); await frontend.promise
    }
    return route.continue()
  }
  const pageError = error => { report.errors.push(error.message); save() }
  page.on('pageerror', pageError)
  await context.route('**/*', route)
  const snapshot = () => page.evaluate(() => {
    const loading = document.querySelector('.loading-world'), art = document.querySelector('.loading-original-art')
    const label = document.querySelector('.loading-original-label img'), mask = document.querySelector('.loading-original-art > img')
    const text = document.querySelector('.loading-original-label > span'), note = document.querySelector('.loading-world > p')
    const inspect = element => {
      if (!element) return null
      const style = getComputedStyle(element), rect = element.getBoundingClientRect()
      return {text: element.textContent, clipPath: style.clipPath, display: style.display, visibility: style.visibility,
        width: rect.width, height: rect.height, x: rect.x, y: rect.y, hidden: element.hidden,
        complete: element.complete, naturalWidth: element.naturalWidth, background: style.backgroundColor}
    }
    return {loading: inspect(loading), art: inspect(art), label: inspect(label), mask: inspect(mask),
      text: inspect(text), note: inspect(note), phase: loading?.dataset.loadingPhase,
      labelReady: loading?.dataset.labelReady, maskFailed: loading?.dataset.maskFailed,
      preloads: [...document.querySelectorAll('link[rel="preload"][as="image"]')].map(link => link.getAttribute('href'))}
  })
  const phase = async name => {
    const result = await snapshot()
    report.phases.push({name, at: now(), result, heldScripts, heldFrontend, labelRequests, maskRequests}); save()
    await page.screenshot({path: resolve(output, `${name}.png`), timeout: 5000})
    return result
  }
  const noGeneric = state => {
    assert.ok(state.loading, 'real loading surface exists')
    assert.equal(state.loading.background, 'rgb(0, 0, 0)')
    assert.equal(state.text?.clipPath, 'inset(50%)', 'generic label stays visually clipped')
    if (state.note) assert.equal(state.note.clipPath, 'inset(50%)', 'checkpoint note stays visually clipped')
    assert.equal(state.art.width, 130); assert.equal(state.art.height, 161)
  }
  const samples = async () => {
    for (let i = 0; i < 12; i++) {
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)))
      noGeneric(await snapshot())
    }
  }
  save()
  try {
    const response = await page.goto(url, {waitUntil: 'commit', timeout: 25000})
    assert.ok(response?.ok(), 'production document request succeeds')
    await page.locator('.loading-world').waitFor({state: 'attached', timeout: 15000})
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.loading-world')).backgroundColor === 'rgb(0, 0, 0)', null, {timeout: 15000})
    await observed(scriptObserved.promise, 'Hydration script')
    assert.ok(heldScripts > 0, 'actual hydration scripts are held')
    if (mode !== 'startup-art-failure') {
      await page.waitForFunction(() => document.querySelector('.loading-original-art > img')?.naturalWidth > 0, null, {timeout: 15000})
      if (mode === 'startup-ssr') await page.waitForFunction(() => document.querySelector('.loading-original-label img')?.naturalWidth > 0, null, {timeout: 15000})
      const state = await phase('01-server-art-before-hydration')
      noGeneric(state)
      assert.equal(state.mask.naturalWidth, 130)
      assert.equal(state.label.hidden, false)
      assert.equal(state.labelReady, 'false', 'not gated on hydration image callbacks')
      assert.ok(state.preloads.includes('/original/loading-mask.png'))
      assert.ok(state.preloads.includes('/original/loading-label.png'))
      if (mode === 'startup-label-held') {
        assert.equal(state.label.naturalWidth, 0)
        await samples()
        releaseLabel()
        await page.waitForFunction(() => document.querySelector('.loading-original-label img')?.naturalWidth > 0, null, {timeout: 15000})
        const complete = await phase('02-label-arrived-before-hydration')
        noGeneric(complete); assert.equal(complete.label.naturalWidth, 82)
      }
    } else {
      await page.waitForFunction(() => [...document.querySelectorAll('.loading-original-art img')].length === 2 && [...document.querySelectorAll('.loading-original-art img')].every(img => img.complete && !img.naturalWidth), null, {timeout: 15000})
      assert.ok(labelRequests > 0 && maskRequests > 0)
      await phase('01-art-failed-before-hydration')
    }
    releaseScripts()
    if (mode === 'startup-art-failure') {
      await page.waitForFunction(() => document.querySelector('.loading-world')?.dataset.maskFailed === 'true' && getComputedStyle(document.querySelector('.loading-original-label > span')).clipPath === 'none', null, {timeout: 15000})
      const failed = await phase('02-readable-fallback-after-hydration')
      assert.equal(failed.mask, null)
      assert.equal(failed.label.hidden, true)
      assert.equal(failed.text.text, 'Loading...')
      assert.equal(failed.text.clipPath, 'none')
      assert.ok(failed.text.width > 0 && failed.text.height > 0)
    } else {
      await page.waitForFunction(() => document.querySelector('.loading-world')?.dataset.labelReady === 'true', null, {timeout: 15000})
      noGeneric(await phase('03-native-art-after-hydration'))
      await samples()
    }
    await observed(frontendObserved.promise, 'Frontend composition')
    assert.ok(heldFrontend > 0, 'actual frontend preparation remained gated for inspection')
    releaseFrontend()
    await page.locator('[data-original-main-menu]').waitFor({state: 'visible', timeout: 20000})
    assert.equal(await page.locator('.loading-world').count(), 0, 'actual preparation clears loading')
    await phase('04-main-menu-after-real-readiness')
    assert.deepEqual(report.errors, [])
    report.status = 'passed'; save()
  } catch (error) {
    report.status = 'failed'; report.failure = error.stack ?? String(error); save()
    await page.screenshot({path: resolve(output, 'failed.png'), timeout: 5000}).catch(() => {})
    throw error
  } finally {
    releaseScripts(); releaseLabel(); releaseFrontend()
    await context.unroute('**/*', route)
    page.off('pageerror', pageError)
  }
  return {status: report.status, mode, phases: report.phases.length}
}
