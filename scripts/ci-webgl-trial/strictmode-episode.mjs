import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { writeFileSync } from 'node:fs'

export function assertReplay(snapshot, mount) {
  assert.equal(snapshot.overflow, false); assert.deepEqual(snapshot.errors, [])
  assert.equal(snapshot.reads, mount)
  const stores = snapshot.stores.filter(store => store.subscribes > 0)
  assert.equal(stores.length, mount)
  const reads = snapshot.events.filter(event => event.type === 'hud-read')
  assert.equal(reads.length, mount)
  for (const [index, store] of stores.entries()) {
    assert.equal(store.subscribes, 2)
    assert.equal(store.cleanups, index === mount - 1 ? 1 : 2)
    assert.equal(store.live, index === mount - 1 ? 1 : 0)
    const events = snapshot.events.filter(event => event.store === store.id)
    assert.deepEqual(events.map(event => event.type), index === mount - 1
      ? ['subscribe', 'cleanup', 'subscribe'] : ['subscribe', 'cleanup', 'subscribe', 'cleanup'])
    assert.ok(Number.isSafeInteger(events[0].token) && events[0].token > 0)
    assert.ok(Number.isSafeInteger(events[2].token) && events[2].token > events[0].token)
    assert.equal(events[1].token, events[0].token)
    if (events.length === 4) assert.equal(events[3].token, events[2].token)
    assert.equal(reads[index].ordinal, index + 1)
    assert.ok(snapshot.events.indexOf(events[0]) < snapshot.events.indexOf(reads[index]))
    assert.ok(snapshot.events.indexOf(reads[index]) < snapshot.events.indexOf(events[1]))
  }
  const witness = snapshot.events.filter(event => event.epoch === mount).map(event => event.type)
  assert.deepEqual(witness, ['effect-setup', 'effect-cleanup', 'effect-setup'])
}

export default async function strictmodeEpisode({ page, name, root, output, url, deadlineAt, signal }) {
  const imported = file => import(pathToFileURL(resolve(root, file)).href)
  const { createAudioOptionsBudget, waitForAudioObservation } = await imported('scripts/browser-options-audio.mjs')
  const { openCampaignFromMainMenu, waitForStartupMenu } = await imported('scripts/browser-new-game.mjs')
  const { hudScale } = await imported('app/hud-layout.ts')
  const cleanupErrors = [], budget = createAudioOptionsBudget({ deadlineAt, signal, cleanupErrors }), step = budget.step
  const wait = (fn, arg) => waitForAudioObservation(budget, timeout => page.waitForFunction(fn, arg, { timeout }))
  const report = { name, status: 'running', captures: [], observations: [], cleanupErrors,
    fixture: 'Actual Home under explicit development StrictMode; one hash-locked subscribe-argument observer, scoped hud-size read fixture, and labelled test-host rerender/unmount/remount controls.' }
  const save = () => writeFileSync(resolve(output, 'strictmode-' + name + '.json'), JSON.stringify(report, null, 2) + '\n')
  const snapshot = () => step(() => page.evaluate(() => window.__hudStrictProbe.snapshot()))
  const click = label => step(timeout => page.getByRole('button', { name: label, exact: true }).click({ timeout }))
  const hostClick = label => step(timeout => page.getByRole('complementary', { name: 'StrictMode test host', exact: true }).getByRole('button', { name: label, exact: true }).click({ timeout }))
  const openSettings = async () => {
    for (const label of ['Game settings', 'Options', 'Browser compatibility and help']) await click(label)
    const select = page.getByRole('combobox', { name: 'HUD size', exact: true })
    assert.equal(await step(() => select.count()), 1)
    return select
  }
  const closeSettings = async () => {
    for (const label of ['Back to Options', 'Back', 'Continue Game']) await click(label)
    await step(timeout => page.locator('dialog[open]').waitFor({ state: 'hidden', timeout }))
  }
  const settings = async () => {
    await step(() => waitForStartupMenu(page))
    await step(() => openCampaignFromMainMenu(page))
    await click('Start Mission 1')
    await step(timeout => page.locator('.world-viewport canvas.battlefield').waitFor({ state: 'visible', timeout }))
    await step(timeout => page.locator('.loading-world').waitFor({ state: 'hidden', timeout }))
    const skip = page.getByRole('button', { name: 'Skip introduction', exact: false })
    if (await step(() => skip.isVisible())) await step(timeout => skip.click({ timeout }))
    return openSettings()
  }
  const measured = async (select, preference) => {
    assert.equal(await step(() => select.inputValue()), preference)
    const viewport = page.viewportSize(), scale = hudScale(viewport.width, viewport.height, preference)
    await wait(expected => Math.abs(Number(getComputedStyle(document.querySelector('.game-shell')).getPropertyValue('--hud-scale')) - expected) < .01, scale)
    const result = await step(() => page.evaluate(() => ({ scale: Number(getComputedStyle(document.querySelector('.game-shell')).getPropertyValue('--hud-scale')),
      hudWidth: document.querySelector('.native-hud').getBoundingClientRect().width,
      viewport: [innerWidth, innerHeight], dpr: devicePixelRatio,
      canvas: !!document.querySelector('.world-viewport canvas.battlefield'),
      options: !!document.querySelector('dialog[open] [data-original-options]') })))
    assert.ok(Math.abs(result.scale - scale) < .01); assert.ok(Math.abs(result.hudWidth - 100 * scale) < .2)
    assert.equal(result.canvas, true); assert.equal(result.options, true); assert.equal(result.dpr, 1)
    return result
  }
  const shot = async file => {
    assert.ok(report.captures.length < 2)
    const metadata = await step(() => page.evaluate(() => {
      const canvas = document.querySelector('.world-viewport canvas.battlefield'), gl = canvas?.getContext('webgl2')
      if (!gl) throw Error('Actual battlefield WebGL2 context required')
      const debug = gl.getExtension('WEBGL_debug_renderer_info')
      if (!debug) throw Error('Actual renderer identification required')
      return { viewport: [innerWidth, innerHeight], dpr: devicePixelRatio,
        renderer: gl.getParameter(debug.UNMASKED_RENDERER_WEBGL), webgl: gl.getParameter(gl.VERSION) }
    }))
    assert.deepEqual(metadata.viewport, [1280, 960]); assert.equal(metadata.dpr, 1)
    assert.match(metadata.renderer, /SwiftShader/)
    await step(timeout => page.screenshot({ path: resolve(output, file), timeout }))
    ;(report.captureMetadata ??= []).push({ file, ...metadata })
    report.captures.push(file); save()
  }
  let failed = false, primary, probePresent = false
  try {
    const response = await step(timeout => page.goto(url + '?case=' + name, { waitUntil: 'domcontentloaded', timeout }))
    assert.equal(response.status(), 200)
    await wait(() => !!window.__hudStrictProbe)
    probePresent = true
    report.runtime = await step(() => page.evaluate(() => window.__hudStrictRuntime))
    assert.deepEqual(report.runtime, { react: '19.2.6', development: true })
    await wait(() => window.__hudStrictProbe.snapshot().stores.some(store => store.subscribes >= 2 && store.live === 1))
    let initial = await snapshot(); assertReplay(initial, 1)
    let select = await settings(), preference = name === 'blocked' ? 'auto' : '1.5'
    report.observations.push({ phase: 'initial-replay', snapshot: initial, measurement: await measured(select, preference) })
    await step(timeout => select.selectOption('1', { timeout }))
    await measured(select, '1')
    await closeSettings()
    await hostClick('Rerender Home fixture')
    select = await openSettings()
    await measured(select, '1')
    const rerender = await snapshot(); assertReplay(rerender, 1)
    assert.equal(rerender.stored, '1')
    report.observations.push({ phase: 'same-store-rerender', snapshot: rerender })
    await shot('strictmode-' + name + '-session.png')
    // Close the modal through public controls before using test-host controls.
    await closeSettings()
    await hostClick('Unmount Home fixture')
    await wait(() => !document.querySelector('main.game-shell') && window.__hudStrictProbe.snapshot().stores.every(store => store.live === 0))
    const unmounted = await snapshot()
    assert.equal(unmounted.stores.filter(store => store.subscribes > 0)[0].cleanups, 2)
    report.observations.push({ phase: 'unmounted', snapshot: unmounted })
    if (name === 'valid') await hostClick('Seed fresh HUD size 3')
    await hostClick('Mount Home fixture')
    await wait(() => window.__hudStrictProbe.snapshot().stores.filter(store => store.subscribes > 0).length === 2 && window.__hudStrictProbe.snapshot().stores.some(store => store.live === 1 && store.subscribes === 2))
    const remounted = await snapshot(); assertReplay(remounted, 2)
    select = await settings(); preference = name === 'blocked' ? 'auto' : '3'
    report.observations.push({ phase: 'fresh-home-replay', snapshot: remounted, measurement: await measured(select, preference) })
    await shot('strictmode-' + name + '-fresh-home.png')
    await closeSettings()
    await hostClick('Unmount Home fixture')
    await wait(() => !document.querySelector('main.game-shell') && window.__hudStrictProbe.snapshot().stores.every(store => store.live === 0))
    report.final = await snapshot()
    assert.equal(report.final.reads, 2); assert.deepEqual(report.final.errors, []); assert.equal(report.final.overflow, false)
    for (const store of report.final.stores.filter(store => store.subscribes > 0)) assert.deepEqual([store.subscribes, store.cleanups, store.live], [2, 2, 0])
    for (const epoch of [1, 2]) assert.deepEqual(report.final.events.filter(event => event.epoch === epoch).map(event => event.type), ['effect-setup', 'effect-cleanup', 'effect-setup', 'effect-cleanup'])
  } catch (error) { failed = true; primary = error; report.failure = error?.stack ?? String(error) }
  finally {
    if (probePresent) {
      try { report.storageRestored = await page.evaluate(() => window.__hudStrictProbe.restore()); assert.equal(report.storageRestored, true) }
      catch (error) { cleanupErrors.push({ phase: 'storage-observer', error: String(error) }); if (!failed) { failed = true; primary = error } }
    }
    try { budget.check(); assert.deepEqual(cleanupErrors, []) } catch (error) { if (!failed) { failed = true; primary = error } }
    report.status = failed ? 'failed' : 'passed'; save()
  }
  if (failed) throw primary
  return report
}
