import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { waitForStartupMenu } from '../browser-new-game.mjs'
import { observeFullscreenClearance, assertFullscreenClearance } from './fullscreen-clearance.mjs'

export async function finishLoadingRecovery({ primaryError, report, gates, fallback, save }) {
  const failures = []
  const failed = error => {
    failures.push(error)
    report.status = 'failed'
    report.cleanupErrors = failures.map(String)
  }
  for (const release of gates.splice(0)) {
    try { release() } catch (error) { failed(error) }
  }
  try { if (fallback) await fallback.close() } catch (error) { failed(error) }
  try { save() } catch (error) { failed(error) }
  if (failures.length) {
    const cleanupError = new AggregateError(failures, 'Loading recovery cleanup or report persistence failed')
    if (primaryError) primaryError.cleanupError = cleanupError
    else throw cleanupError
  }
}

// Resize completion is observational: reconcile the live viewport and existing
// scrollbar metrics before the original setup focus, never repair focus afterward.
export function loadingScrollbarReady(viewport) {
  if (viewport && (innerWidth !== viewport.width || innerHeight !== viewport.height)) return false
  const root = document.querySelector('.loading-world')
  if (viewport?.phase && root?.getAttribute('data-loading-phase') !== viewport.phase) return false
  if (root?.getAttribute('data-loading-phase') !== 'failed') return !!root
  const area = root.querySelector('[data-loading-scroll-area]'), s = root.querySelector('[data-loading-recovery-scroll]')
  if (!area || !s) return false
  const maximum = Math.max(0, s.scrollHeight - s.clientHeight)
  if (area.getAttribute('data-scroll-art') !== String(maximum > 0)) return false
  if (!maximum) return true
  const thumb = area.querySelector('[data-loading-scrollbar]')?.firstElementChild
  const h = Math.min(s.clientHeight, Math.max(34, Math.floor(s.clientHeight ** 2 / s.scrollHeight)))
  const y = Math.round(Math.max(0, Math.min(maximum, s.scrollTop)) * (s.clientHeight - h) / maximum)
  const images = [...(thumb?.querySelectorAll('[data-loading-scroll-cap] img') ?? [])]
  return images.length === 2 && images.every(image => image.complete && image.naturalWidth === 24) && thumb && Math.abs(thumb.getBoundingClientRect().y - y) < .15 && Math.abs(thumb.getBoundingClientRect().height - h) < .15
}

export function observeLoadingFocus(target) {
  const host = document.querySelector('[data-fullscreen-control]')
  const fullscreen = host && host.parentElement === document.body ? host.querySelector('button') : null
  const root = target.closest('[data-loading-phase]') ??
    (target === fullscreen ? document.querySelector('[data-loading-phase]') : null)
  const visible = node => node.getClientRects().length > 0 && getComputedStyle(node).visibility === 'visible'
  const describe = node => node ? {
    tag: node.tagName, id: node.id, role: node.getAttribute('role'),
    label: node.getAttribute('aria-label'), text: node.textContent?.trim().slice(0, 120),
    tabIndex: node.tabIndex, disabled: !!node.disabled, connected: node.isConnected,
    owned: !!root?.contains(node) || node === fullscreen, visible: visible(node),
    cap: node.getAttribute('data-loading-scroll-cap'),
  } : null
  const controls = [...(root?.querySelectorAll('summary,button,[data-loading-recovery-scroll][tabindex="0"]') ?? []),
    ...(root && fullscreen ? [fullscreen] : [])].filter(node => !node.disabled && visible(node))
  return {
    focused: target === document.activeElement,
    active: describe(document.activeElement), target: describe(target), controls: controls.map(describe),
    viewport: { width: innerWidth, height: innerHeight },
  }
}

export async function prepareLoadingTraversal(page, retry, { record = {}, signal, deadlineAt, save = () => {} } = {}) {
  const live = () => {
    signal?.throwIfAborted()
    if (deadlineAt === undefined) return undefined
    const remaining = deadlineAt - Date.now()
    assert.ok(Number.isFinite(deadlineAt) && remaining > 0, 'Loading episode deadline reached')
    return remaining
  }
  Object.assign(record, { viewport: page.viewportSize(), status: 'running' })
  try {
    record.pending = 'readiness'
    await page.waitForFunction(loadingScrollbarReady, { ...record.viewport, phase: 'failed' }, { timeout: live() })
    record.pending = 'focus'
    await retry.focus({ timeout: live() }) // The existing single setup focus, not a retry or repair.
    live()
    record.pending = 'focus-observation'
    const observation = await retry.evaluate(observeLoadingFocus)
    live()
    record.observation = observation
    save()
    assert.equal(observation.focused, true, 'Retry must own the initial loading traversal focus')
    record.pending = null
    record.status = 'passed'
    save()
  } catch (error) {
    record.status = 'failed'; record.error = String(error)
    throw error
  }
}

// Existing Retry/summary outcomes now include the optional real region and
// two cap buttons and the body fullscreen portal. The six-control maximum
// permits five genuine presses to any other control;
// preserve the original strict locator/activeElement observation on every step.
export async function tabToLoadingControl(page, target, { reverse = false, record = {}, signal, deadlineAt, save = () => {} } = {}) {
  const key = reverse ? 'Shift+Tab' : 'Tab'
  const live = () => {
    signal?.throwIfAborted()
    if (deadlineAt !== undefined) assert.ok(Number.isFinite(deadlineAt) && Date.now() < deadlineAt, 'Loading episode deadline reached')
  }
  Object.assign(record, { key, presses: 0, observations: [], focusObservations: [], status: 'running' })
  try {
    for (let index = 0; index < 5; index++) {
      live()
      record.pending = 'key'
      await page.keyboard.press(key)
      live()
      record.presses++
      record.pending = 'focus-observation'
      const observation = await target.evaluate(observeLoadingFocus)
      live()
      const focused = observation.focused
      record.observations.push(focused)
      record.focusObservations.push(observation)
      record.pending = null
      save() // Retain each real observation before any endpoint assertion.
      if (focused) { record.status = 'passed'; return }
    }
    assert.fail('Loading recovery target not reached within five genuine Tab presses')
  } catch (error) {
    record.status = 'failed'; record.error = String(error)
    throw error
  }
}

// Observe the same real failed screen used by the existing capture. No injected
// errors, hidden system-scrollbar exception or extra screenshot is introduced.
export function observeLoadingScrollbar(root) {
  const box = node => {
    if (!node) return null
    const r = node.getBoundingClientRect()
    return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height }
  }
  const visible = node => {
    if (!node) return false
    for (let current = node; current; current = current.parentElement) {
      const s = getComputedStyle(current)
      if (s.display === 'none' || s.visibility !== 'visible' || Number(s.opacity) <= 0) return false
    }
    return true
  }
  const hit = node => {
    const r = node?.getBoundingClientRect()
    return !!r && node.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2))
  }
  const areas = root.querySelectorAll('[data-loading-scroll-area]'), area = areas[0]
  const scrollers = root.querySelectorAll('[data-loading-recovery-scroll]'), scroller = scrollers[0]
  const tracks = root.querySelectorAll('[data-loading-scrollbar]'), track = tracks[0]
  const thumb = track?.firstElementChild, drag = thumb?.querySelector('[aria-hidden="true"]')
  const caps = [...root.querySelectorAll('[data-loading-scroll-cap]')]
  const content = scroller?.firstElementChild
  const dragBackground = drag && getComputedStyle(drag).backgroundImage
  const imageUrl = /^url\("([^"]+)"\)$/.exec(dragBackground ?? '')?.[1]
  const dragUrl = imageUrl ? new URL(imageUrl, location.href) : null
  return {
    phase: root.getAttribute('data-loading-phase'), viewport: { width: innerWidth, height: innerHeight },
    forcedColors: matchMedia('(forced-colors: active)').matches,
    counts: { areas: areas.length, scrollers: scrollers.length, tracks: tracks.length },
    owned: !!area && !!scroller && area.parentElement === root && scroller.parentElement === area &&
      !!content && content.querySelector('.loading-recovery')?.parentElement === content,
    enabled: area?.getAttribute('data-scroll-art'),
    scroller: scroller && { box: box(scroller), visible: visible(scroller), id: scroller.id,
      uniqueId: [...document.querySelectorAll('[id]')].filter(node => node.id === scroller.id).length === 1,
      label: scroller.getAttribute('aria-label'), role: scroller.getAttribute('role'), tabIndex: scroller.tabIndex,
      scrollTop: scroller.scrollTop, scrollHeight: scroller.scrollHeight, clientHeight: scroller.clientHeight,
      scrollWidth: scroller.scrollWidth, clientWidth: scroller.clientWidth,
      overflowY: getComputedStyle(scroller).overflowY, scrollbarWidth: getComputedStyle(scroller).scrollbarWidth },
    copy: box(content?.querySelector('.loading-recovery')), logo: box(content?.querySelector('.loading-original-art')),
    track: box(track), thumb: box(thumb), drag: box(drag),
    trackOwned: !!track && track.parentElement === area && thumb?.parentElement === track && drag?.parentElement === thumb,
    trackVisible: visible(track), dragVisible: visible(drag), dragHit: hit(drag),
    dragBackground, dragImage: dragUrl && { path: dragUrl.pathname, sameOrigin: dragUrl.origin === location.origin },
    dragRepeat: drag && getComputedStyle(drag).backgroundRepeat,
    caps: caps.map(node => {
      const images = node.querySelectorAll('img'), image = images[0]
      return { direction: node.getAttribute('data-loading-scroll-cap'), label: node.getAttribute('aria-label'),
        owner: node.parentElement === thumb && track?.parentElement === area,
        controls: node.getAttribute('aria-controls'), controlsOwner: !!scroller && document.getElementById(node.getAttribute('aria-controls')) === scroller,
        tag: node.tagName, disabled: node.disabled, tabIndex: node.tabIndex, visible: visible(node), hit: hit(node), box: box(node),
        highlighted: node.matches(':hover') || node === document.activeElement,
        image: image && { count: images.length, path: new URL(image.currentSrc || image.src, location.href).pathname,
          sameOrigin: new URL(image.currentSrc || image.src, location.href).origin === location.origin,
          complete: image.complete, width: image.naturalWidth, height: image.naturalHeight,
          alt: image.getAttribute('alt'), draggable: image.draggable, visible: visible(image), box: box(image) } }
    }),
  }
}

export function assertLoadingScrollbar(sample) {
  const finite = b => b && ['x', 'y', 'right', 'bottom', 'width', 'height'].every(k => Number.isFinite(b[k])) && b.width > 0 && b.height > 0
  const at = (b, x, y, w, h) => {
    assert.ok(finite(b), 'Positive finite loading scrollbar geometry')
    for (const [key, value] of Object.entries({ x, y, right: x + w, bottom: y + h, width: w, height: h }))
      assert.ok(Math.abs(b[key] - value) < .15, `Loading scrollbar ${key}`)
  }
  if (sample.phase !== 'failed') {
    assert.ok(['loading', 'restore'].includes(sample.phase))
    assert.deepEqual(sample.counts, { areas: 0, scrollers: 0, tracks: 0 })
    assert.deepEqual(sample.caps, [])
    return
  }
  assert.equal(sample.counts.areas, 1); assert.equal(sample.counts.scrollers, 1)
  assert.equal(sample.owned, true); assert.equal(sample.forcedColors, false, 'Normal-art capture cannot silently become a fallback experiment')
  const s = sample.scroller, { width, height } = sample.viewport
  assert.ok(s); at(s.box, 0, 0, width, height)
  assert.equal(s.visible, true); assert.equal(s.uniqueId, true); assert.ok(typeof s.id === 'string' && s.id.length > 0)
  assert.deepEqual([s.role, s.label, s.overflowY], ['region', 'Loading recovery details', 'auto'])
  for (const key of ['scrollHeight', 'clientHeight', 'scrollWidth', 'clientWidth']) assert.ok(Number.isFinite(s[key]) && s[key] > 0)
  assert.equal(s.scrollWidth, s.clientWidth, 'Recovery never requires horizontal scrolling')
  const maximum = Math.max(0, s.scrollHeight - s.clientHeight)
  assert.ok(Number.isFinite(s.scrollTop) && s.scrollTop >= 0 && s.scrollTop <= maximum + 1)
  assert.equal(s.tabIndex, maximum > 0 ? 0 : -1)
  assert.equal(sample.enabled, String(maximum > 0), 'Actual overflow requires decoded original art')
  for (const b of [sample.copy, sample.logo]) {
    assert.ok(finite(b)); assert.ok(b.x >= (width <= 680 ? 44 : 32) - .15 && b.right <= width - 32 + .15,
      'Recovery copy/logo stay clear of the fullscreen and art gutters throughout scrolling')
  }
  assert.equal(sample.counts.tracks, maximum > 0 ? 1 : 0)
  assert.deepEqual(sample.caps.map(c => c.direction).sort(), maximum > 0 ? ['down', 'up'] : [])
  if (!maximum) {
    assert.deepEqual([sample.track, sample.thumb, sample.drag], [null, null, null])
    return
  }
  assert.equal(s.scrollbarWidth, 'none', 'Normal original art replaces the white system scrollbar')
  assert.equal(sample.trackOwned, true); assert.equal(sample.trackVisible, true)
  assert.equal(sample.dragVisible, true); assert.equal(sample.dragHit, true)
  assert.deepEqual(sample.dragImage, { path: '/original/help/hfx-455.png', sameOrigin: true })
  assert.ok(sample.dragBackground.endsWith('/original/help/hfx-455.png")')); assert.equal(sample.dragRepeat, 'repeat-y')
  const thumb = Math.min(s.clientHeight, Math.max(34, Math.floor(s.clientHeight ** 2 / s.scrollHeight)))
  const offset = Math.round(Math.max(0, Math.min(maximum, s.scrollTop)) * (s.clientHeight - thumb) / maximum)
  at(sample.track, width - 24, 0, 24, height)
  at(sample.thumb, width - 24, offset, 24, thumb)
  at(sample.drag, width - 24, offset + 10, 24, thumb - 22)
  for (const c of sample.caps) {
    const up = c.direction === 'up', h = up ? 10 : 12
    assert.deepEqual([c.tag, c.label, c.disabled, c.tabIndex], ['BUTTON', `Scroll loading recovery details ${c.direction}`, false, 0])
    assert.equal(c.owner, true); assert.equal(c.controlsOwner, true); assert.equal(c.controls, s.id)
    assert.equal(c.visible, true); assert.equal(c.hit, true)
    at(c.box, width - 24, offset + (up ? 0 : thumb - 12), 24, h)
    const i = c.image; assert.ok(i)
    assert.deepEqual([i.count, i.path, i.sameOrigin, i.complete, i.width, i.height, i.alt, i.draggable, i.visible],
      [1, `/original/help/hfx-${(up ? 451 : 452) + (c.highlighted ? 2 : 0)}.png`, true, true, 24, h, '', false, true])
    at(i.box, c.box.x, c.box.y, 24, h)
  }
}

// Actual Home and real loader failures. Only landscape responses and, in the
// separate sequential fallback contexts, frontend font availability are controlled. No world,
// store, error-prop, save or React state is injected. This is not a ready-scene test.
export default async function ({ page, browser, url, output, signal, deadlineAt }) {
  const report = { status: 'running', captures: [], keyboardPreparation: [], keyboardTraversal: [], scrollbarGeometry: [], fullscreenGeometry: [], requests: [], fontCases: [], errors: [] }
  const save = () => writeFileSync(resolve(output, 'loading-recovery-style.json'), JSON.stringify(report, null, 2) + '\n')
  const button = p => p.getByRole('button', { name: 'Try again', exact: true })
  const failed = p => p.getByRole('dialog', { name: 'Browser loading recovery', exact: true })
  const keyboardTo = async (target, reverse = false, name = reverse ? 'retry' : 'summary') => {
    const record = { viewport: page.viewportSize(), target: name }
    report.keyboardTraversal.push(record)
    await tabToLoadingControl(page, target, { reverse, record, signal, deadlineAt, save })
    save()
  }
  const waitFailed = async p => {
    await p.getByRole('heading', { name: 'Loading failed', exact: true }).waitFor()
    assert.equal(await button(p).evaluate(node => node === document.activeElement), true)
  }
  const startTutorial = async p => {
    await waitForStartupMenu(p)
    await p.getByRole('button', { name: 'New Game', exact: true }).click()
    await p.getByRole('button', { name: 'Yes', exact: true }).click()
  }
  const capture = async (p, name) => {
    await p.waitForFunction(loadingScrollbarReady, p.viewportSize())
    const scrollbar = await p.locator('.loading-world').evaluate(observeLoadingScrollbar)
    report.scrollbarGeometry.push({ name, scrollbar }); save()
    assertLoadingScrollbar(scrollbar)
    const geometry = await observeFullscreenClearance(p, 'body', '.loading-original-art,.loading-original-label,.loading-recovery,.loading-recovery button,.loading-recovery summary,.loading-recovery-note,.loading-recovery details[open] .loading-recovery-error,[data-loading-scrollbar],[data-loading-scroll-cap]')
    report.fullscreenGeometry.push({name,geometry}); save()
    assertFullscreenClearance(geometry)
    await p.screenshot({ path: resolve(output, `${name}.png`) })
    report.captures.push({ name, viewport: p.viewportSize() })
    save()
  }
  const assertHit = async locator => {
    await locator.scrollIntoViewIfNeeded()
    assert.equal(await locator.evaluate(node => {
      const box = node.getBoundingClientRect()
      const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)
      return box.x >= 0 && box.y >= 0 && box.right <= innerWidth && box.bottom <= innerHeight && node.contains(hit)
    }), true, 'Recovery control must remain reachable and the actual hit target')
  }
  const assertFont = async (locator, name) => {
    const images = await locator.locator('.loading-recovery-word i').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).backgroundImage))
    assert.ok(images.length > 0)
    assert.ok(images.every(image => image.endsWith(`/original/frontend/${name}.png")`)), `Expected original ${name} artwork`)
  }
  const gates = []
  let fallback, primaryError
  page.on('pageerror', error => report.errors.push(String(error)))
  try {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.route('**/original/landscape.bin', async route => {
      report.requests.push(route.request().url())
      await new Promise(resolve => gates.push(resolve))
      await route.abort('failed')
    })
    const failHeld = async () => {
      await page.waitForFunction(() => document.querySelector('[data-loading-phase="loading"]'))
      const deadline = Date.now() + 10000
      while (!gates.length && Date.now() < deadline) await page.waitForTimeout(20)
      assert.equal(gates.length, 1)
      gates.shift()()
      await waitFailed(page)
    }
    await startTutorial(page)
    await page.locator('[data-loading-phase="loading"]').waitFor()
    assert.equal(await button(page).count(), 0, 'Pending phase must not expose recovery controls')
    const mask = await page.locator('.loading-original-art').boundingBox()
    assert.deepEqual([mask.x, mask.y, mask.width, mask.height], [575, 319, 130, 161])
    await capture(page, 'pending-1280x800')
    const fullscreen = page.locator('body > [data-fullscreen-control] button')
    await keyboardTo(fullscreen, false, 'pending-fullscreen-forward')
    await keyboardTo(fullscreen, true, 'pending-fullscreen-reverse')
    assert.equal(await fullscreen.evaluate(node => node.matches(':focus-visible')), true)
    await failHeld()
    await failed(page).locator('.loading-recovery-text').first().waitFor()
    assert.equal(await button(page).locator('.loading-recovery-text').evaluate(node => node.getBoundingClientRect().width), 134)
    await assertFont(failed(page).locator('h2'), 'felo33we')
    await assertFont(failed(page).locator('.loading-recovery > p').first(), 'felo33we')
    await assertFont(failed(page).locator('.loading-recovery-note'), 'felo33we')
    await page.mouse.move(1, 1)
    const summary = failed(page).locator('summary')
    await keyboardTo(summary)
    await assertFont(summary, 'fehi33we')
    await assertFont(button(page), 'felo33we')
    await keyboardTo(button(page), true)
    await assertFont(button(page), 'fehi33we')
    await assertFont(summary, 'felo33we')
    await keyboardTo(fullscreen, false, 'recovery-fullscreen-forward')
    assert.equal(await fullscreen.evaluate(node => node.matches(':focus-visible')), true)
    await keyboardTo(summary)
    await keyboardTo(fullscreen, true, 'recovery-fullscreen-reverse')
    await keyboardTo(button(page), true)
    await summary.hover()
    await assertFont(summary, 'fehi33we')
    await page.keyboard.press('Tab')
    await button(page).hover()
    await assertFont(button(page), 'fehi33we')
    assert.equal(await button(page).locator('.loading-recovery-text').evaluate(node => node.getBoundingClientRect().width), 134)
    await page.mouse.move(1, 1)
    await assertFont(button(page), 'felo33we')
    await capture(page, 'native-recovery-1280x800')
    for (const [width, height] of [[640, 480], [900, 360], [320, 240]]) {
      await page.setViewportSize({ width, height })
      await assertHit(button(page))
      await capture(page, `native-recovery-${width}x${height}`)
      const summary = failed(page).locator('summary')
      await summary.click()
      const diagnostics = failed(page).locator('.loading-recovery-error')
      assert.ok((await diagnostics.innerText()).length > 0)
      assert.equal(await diagnostics.evaluate(node => node.scrollWidth <= node.clientWidth), true)
      await diagnostics.scrollIntoViewIfNeeded()
      await capture(page, `native-details-${width}x${height}`)
      await assertHit(button(page))
      if (width === 320) {
        await failed(page).locator('.loading-recovery-note').scrollIntoViewIfNeeded()
        await capture(page, 'native-footer-scrolled-320x240')
      }
      await summary.click()
    }
    await page.setViewportSize({ width: 640, height: 480 })
    const preparation = {}
    report.keyboardPreparation.push(preparation)
    await prepareLoadingTraversal(page, button(page), { record: preparation, signal, deadlineAt, save })
    await keyboardTo(failed(page).locator('summary'))
    await keyboardTo(button(page), true)
    await page.keyboard.down('Enter')
    await failHeld()
    for (let repeat = 0; repeat < 3; repeat++) await page.keyboard.down('Enter')
    assert.equal(report.requests.length, 2, 'Held Enter must not retry the replacement failure')
    await page.keyboard.up('Enter')
    await page.keyboard.press('Enter')
    await page.locator('[data-loading-phase="loading"]').waitFor()
    await page.keyboard.down('Space')
    await failHeld()
    for (let repeat = 0; repeat < 3; repeat++) await page.keyboard.down('Space')
    await page.keyboard.up('Space')
    assert.equal(report.requests.length, 3, 'Unowned Space release must not retry the replacement failure')
    assert.equal(await failed(page).count(), 1)
    assert.equal(new Set(report.requests).size, 1, 'Retries must retain the same real landscape request')
    await capture(page, 'native-recovery-held-input')

    for (const blockedFont of ['felo33we', 'fehi33we', 'feft33we']) {
      fallback = await browser.newContext({ viewport: { width: 320, height: 240 } })
      const p = await fallback.newPage()
      const aborted = []
      p.on('pageerror', error => report.errors.push(String(error)))
      await p.route(`**/original/frontend/${blockedFont}.png`, async route => {
        aborted.push(route.request().url())
        await route.abort('failed')
      })
      await p.route('**/original/landscape.bin', route => route.abort('failed'))
      await p.goto(url, { waitUntil: 'domcontentloaded' })
      await startTutorial(p)
      await waitFailed(p)
      assert.ok(aborted.length > 0, 'The specified font request must actually fail')
      if (blockedFont === 'feft33we') {
        await failed(p).locator('.loading-recovery-text').first().waitFor()
        assert.equal(await failed(p).locator('.loading-recovery-fallback').count(), 0, 'Unused dark font cannot block recovery artwork')
        await assertFont(failed(p).locator('h2'), 'felo33we')
        await p.keyboard.press('Tab')
        await p.keyboard.press('Shift+Tab')
        await assertFont(button(p), 'fehi33we')
      } else {
        assert.equal(await failed(p).locator('.loading-recovery-text').count(), 0)
        assert.equal(await failed(p).locator('.loading-recovery-fallback').count(), 5)
        assert.equal(await button(p).innerText(), 'Try again')
        assert.equal(await button(p).evaluate(node => getComputedStyle(node).color), 'rgb(255, 241, 187)')
      }
      await assertHit(button(p))
      if (blockedFont === 'felo33we') await capture(p, 'recovery-font-fallback-320x240')
      await failed(p).locator('summary').click()
      assert.ok((await failed(p).locator('.loading-recovery-error').innerText()).length > 0)
      await assertHit(button(p))
      if (blockedFont === 'felo33we') await capture(p, 'recovery-font-fallback-details-320x240')
      report.fontCases.push({ blockedFont, aborted, bitmap: blockedFont === 'feft33we' }); save()
      await fallback.close()
      fallback = undefined
    }
    assert.deepEqual(report.errors, [])
    report.status = 'passed'
    report.limits = ['Controlled loader failures and font availability; no native failure-dialog claim', 'Loading shares Tab ownership with its body fullscreen portal; bounded real traversal covers both directions, pending/failure transitions and overflow controls', 'No completed scene or full checkpoint continuation proof', 'No hardware performance or pixel-parity claim']
    return report
  } catch (error) {
    report.status = 'failed'
    report.failure = String(error)
    primaryError = error instanceof Error ? error : new Error(String(error))
    throw primaryError
  } finally {
    await finishLoadingRecovery({ primaryError, report, gates, fallback, save })
  }
}
