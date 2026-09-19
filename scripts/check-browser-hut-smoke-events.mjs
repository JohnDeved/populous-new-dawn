// Normal Mission1 input only. The queue-owned runner supplies POPULOUS_URL.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { bindGame, openGame } from './browser-game.mjs'

const report = {
  stages: [],
  orders: [],
  guards: [],
  hoverSelections: [],
  eventHistories: { preLoad: [], postRebind: [] },
  preLoadSealed: false,
}
const output = (process.env.PND_QUEUE_OUTPUT ?? '/private/tmp') + '/hut-smoke-events'
const save = () => writeFileSync(output + '.json', JSON.stringify(report, null, 2) + '\n')
let page, errors
const browser = await chromium.launch({ headless: true })

async function pause() {
  if (!(await page.evaluate(() => window.testScene.world.paused)))
    await page.getByRole('button', { name: 'Pause game', exact: true }).click()
  await page.waitForFunction(() => window.testScene.world.paused)
}
async function resume() {
  if (await page.evaluate(() => window.testScene.world.paused))
    await page.getByRole('button', { name: 'Resume game', exact: true }).click()
  await page.waitForFunction(() => !window.testScene.world.paused)
}
async function closeMenu() {
  await page.getByRole('button', { name: 'Close menu', exact: true }).click()
  await page.waitForFunction(
    () => !document.querySelector('.game-dialog').open && !window.testScene.world.paused
  )
}
async function clearSelection() {
  await page.keyboard.press('Escape')
  await page.waitForFunction(
    () => !window.testScene.world.selected.length && !window.testScene.world.mode
  )
}
async function personPoint(id) {
  return page.evaluate(id => {
    const s = window.testScene,
      b = s.picking.personBounds(id),
      r = s.renderer.domElement.getBoundingClientRect()
    if (!b) return null
    for (let y = b.y + 2; y < b.y + b.height - 1; y += 3)
      for (let x = b.x + 2; x < b.x + b.width - 1; x += 3) {
        const e = { clientX: r.left + x, clientY: r.top + y }
        if (
          document.elementFromPoint(e.clientX, e.clientY) === s.renderer.domElement &&
          s.picking.pickPerson(e) === id
        )
          return { x: e.clientX, y: e.clientY }
      }
    return null
  }, id)
}
// Hover identifies the actual Hut independently of selection or command mode.
// With selection cleared, liveCommandContext may be model3; it is not an admission.
async function hutHoverPoint() {
  return page.evaluate(() => {
    const scene = window.testScene,
      hut = scene.world.buildings.find(b => b.id === window.smokeEvents.hutId)
    if (!hut) return null
    const rect = scene.renderer.domElement.getBoundingClientRect(),
      center = scene.screen(hut)
    for (let dy = -120; dy <= 60; dy += 4)
      for (let dx = -75; dx <= 75; dx += 4) {
        const x = rect.left + ((center.x + 1) * rect.width) / 2 + dx,
          y = rect.top + ((1 - center.y) * rect.height) / 2 + dy,
          event = { clientX: x, clientY: y }
        if (
          document.elementFromPoint(x, y) !== scene.renderer.domElement ||
          scene.picking.pickPerson(event)
        )
          continue
        const object = scene.pickWorldObject(event)
        if (object?.id === hut.id) return { x, y, objectId: object.id }
      }
    return null
  })
}

async function targetPoint(ground = false) {
  return page.evaluate(async ground => {
    const s = window.testScene,
      w = s.world,
      hut = w.buildings.find(b => b.id === window.smokeEvents.hutId)
    const { liveCommandContext } = await import('/app/live-command.ts')
    const r = s.renderer.domElement.getBoundingClientRect(),
      center = s.screen(hut)
    const points = []
    if (ground) {
      for (const radius of [8, 10, 12])
        for (let angle = 0; angle < 16; angle++) {
          const p = s.screen({
            x: hut.x + Math.cos((angle * Math.PI) / 8) * radius,
            z: hut.z + Math.sin((angle * Math.PI) / 8) * radius,
          })
          points.push({
            x: r.left + ((p.x + 1) * r.width) / 2,
            y: r.top + ((1 - p.y) * r.height) / 2,
          })
        }
    } else {
      for (let dy = -120; dy <= 60; dy += 4)
        for (let dx = -75; dx <= 75; dx += 4)
          points.push({
            x: r.left + ((center.x + 1) * r.width) / 2 + dx,
            y: r.top + ((1 - center.y) * r.height) / 2 + dy,
          })
    }
    for (const p of points) {
      const e = { clientX: p.x, clientY: p.y }
      if (document.elementFromPoint(p.x, p.y) !== s.renderer.domElement || s.picking.pickPerson(e))
        continue
      const object = s.pickWorldObject(e)
      if (ground ? object : object?.id !== hut.id) continue
      const context = liveCommandContext(w, ground ? s.pick(e) : object)
      if (context?.enabled && context.model === (ground ? 3 : 8))
        return { ...p, model: context.model }
    }
    return null
  }, ground)
}
async function selectPerson(id) {
  await clearSelection()
  let point = await personPoint(id)
  if (!point) {
    const inside = await page.evaluate(
      id => window.testScene.world.units.find(u => u.id === id)?.inside,
      id
    )
    if (inside === report.hutId) {
      assert.deepEqual(await page.evaluate(() => [...window.testScene.world.selected]), [])
      const hut = await hutHoverPoint()
      assert.ok(hut, 'Resident departure must identify the actual rendered Hut with no selection')
      assert.equal(hut.objectId, report.hutId)
      await page.mouse.move(hut.x, hut.y)
      const selected = await page.evaluate(() => [...window.testScene.world.selected])
      report.hoverSelections.push({ id, target: hut, selected })
      save()
      assert.deepEqual(selected, [], 'Hover must not dispatch or select a model3 ground order')
      await page.locator('.training-panel:visible button[data-person="' + id + '"]').click()
    } else {
      const count = await page.evaluate(
        () =>
          window.testScene.world.units.filter(
            u => u.team === 'blue' && u.kind === 'brave' && u.hp > 0
          ).length
      )
      for (let i = 0; i <= count && !point; i++) {
        await page
          .getByRole('button', { name: 'Select brave', exact: true })
          .click({ button: 'right', modifiers: ['Shift'] })
        await page.waitForFunction(() => !window.testScene.cameraMotion.active)
        point = await personPoint(id)
      }
      assert.ok(point, 'Brave ' + id + ' must have a shipped rendered selection point')
      await page.mouse.click(point.x, point.y)
    }
  } else await page.mouse.click(point.x, point.y)
  assert.deepEqual(await page.evaluate(() => [...window.testScene.world.selected]), [id])
}
async function guard(ids) {
  await resume()
  await page.keyboard.press('g')
  const result = await page.evaluate(
    ids =>
      ids.map(id => {
        const u = window.testScene.world.units.find(u => u.id === id)
        return { id, guard: u.guard, inside: u.inside, work: u.work }
      }),
    ids
  )
  report.guards.push(result)
  save()
  assert.ok(
    result.every(u => u.guard && u.inside === null && u.work === null),
    'Guard must release only selected non-cohort Braves'
  )
  await pause()
}
async function guardNewcomers(cohort) {
  await pause()
  for (let i = 0; i < 16; i++) {
    const pending = await page.evaluate(
      ids =>
        window.testScene.world.units
          .filter(
            u =>
              u.team === 'blue' && u.kind === 'brave' && u.hp > 0 && !u.guard && !ids.includes(u.id)
          )
          .map(u => u.id),
      cohort
    )
    if (!pending.length) return
    await selectPerson(pending[0])
    await guard([pending[0]])
  }
  throw new Error('Bounded newcomer guard batch exceeded')
}
async function snapshot() {
  return page.evaluate(() => window.smokeEvents.read())
}
// The observer phase travels with its trace, so a failed rebind cannot relabel
// the old world's events. Once sealed, the complete pre-load evidence is immutable.
async function captureEventHistory() {
  const trace = await page.evaluate(() => {
    const observer = window.smokeEvents
    return observer ? { phase: observer.phase, events: observer.events } : null
  })
  if (!trace) return null
  assert.ok(Object.hasOwn(report.eventHistories, trace.phase), 'Unknown event-history phase')
  if (trace.phase === 'preLoad' && report.preLoadSealed)
    assert.deepEqual(
      trace.events,
      report.eventHistories.preLoad,
      'Sealed pre-load events must survive rebind unchanged'
    )
  else report.eventHistories[trace.phase] = trace.events
  return trace.events
}

async function eventAudit() {
  const events = await captureEventHistory()
  save()
  assert.ok(events, 'An active event observer is required for smoke acceptance')
  for (const event of events) {
    const current = event.current
    const expected = current.ids.length
      ? current.ids.length >= current.capacity
        ? 'full'
        : 'partial'
      : null
    assert.equal(
      current.mode,
      expected,
      'Immediate occupancy smoke mismatch after ' +
        event.previous.ids.length +
        '→' +
        current.ids.length +
        ' at counter ' +
        current.counter +
        ' (phase ' +
        (current.counter & 31) +
        ')'
    )
  }
}
async function settled(cohort, mode) {
  const deadline = Date.now() + 45_000
  while (Date.now() < deadline) {
    await guardNewcomers(cohort)
    await eventAudit()
    const state = await snapshot()
    if (
      state.ids.length === cohort.length &&
      cohort.every(id => state.ids.includes(id)) &&
      state.admission === cohort.length &&
      state.mode === mode
    )
      return state
    await resume()
    await page.waitForFunction(
      ({ ids, mode }) => {
        const t = window.smokeEvents,
          s = t.read(),
          w = window.testScene.world
        return (
          t.events.some(
            e =>
              e.current.mode !==
              (e.current.ids.length
                ? e.current.ids.length >= e.current.capacity
                  ? 'full'
                  : 'partial'
                : null)
          ) ||
          w.units.some(
            u =>
              u.team === 'blue' && u.kind === 'brave' && u.hp > 0 && !u.guard && !ids.includes(u.id)
          ) ||
          (s.ids.length === ids.length && ids.every(id => s.ids.includes(id)) && s.mode === mode)
        )
      },
      { ids: cohort, mode },
      { timeout: Math.max(1, deadline - Date.now()) }
    )
    await pause()
  }
  throw new Error('Controlled smoke state failed to settle')
}
async function admit(id) {
  await selectPerson(id)
  await resume()
  const target = await targetPoint()
  assert.ok(target, 'Actual Hut command8 target must be available')
  assert.equal(target.model, 8, 'Admission must never accept the selection-free hover path')
  await page.mouse.click(target.x, target.y)
  const receipt = await page.evaluate(id => {
    const w = window.testScene.world,
      u = w.units.find(u => u.id === id)
    return { id, inside: u.inside, work: u.work, lastOrderTurn: w.lastOrderTurn, turn: w.turn }
  }, id)
  report.orders.push({ target, receipt })
  save()
  assert.ok(
    receipt.inside === report.hutId || receipt.work === report.hutId,
    'Shipped command8 click must dispatch the Brave'
  )
}
async function depart(id, cohort) {
  await guardNewcomers(cohort)
  await selectPerson(id)
  await resume()
  await page.waitForFunction(() => {
    const c = window.smokeEvents.read().counter & 31
    return c >= 8 && c <= 18
  })
  const point = await targetPoint(true)
  assert.ok(point, 'Normal ground command must be pickable')
  assert.equal(point.model, 3, 'Departure must issue the genuine ground command after selection')
  await page.mouse.click(point.x, point.y)
  const after = await snapshot()
  assert.ok(
    !after.ids.includes(id),
    'Actual resident removal must occur on the shipped ground order'
  )
  report.orders.push({ departure: id, target: point, after })
  save()
  await guard([id])
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)))
  await eventAudit()
}
async function observe(hutId, phase) {
  assert.ok(Object.hasOwn(report.eventHistories, phase), 'Observer must name its evidence phase')
  await page.evaluate(
    async ({ hutId, phase }) => {
      const { default: rules } = await import('/app/original-rules.json')
      const read = () => {
        const s = window.testScene,
          w = s.world,
          b = w.buildings.find(b => b.id === hutId)
        const smoke = s.buildingMeshes.get(hutId)?.userData.hutOccupancySmoke
        return {
          turn: w.turn,
          counter: b.counter,
          capacity: rules.buildingCapacity[b.level],
          progress: b.progress,
          ids: w.units
            .filter(u => u.hp > 0 && u.inside === hutId)
            .map(u => u.id)
            .sort((a, b) => a - b),
          admission: b.admission?.inside ?? 0,
          mode: smoke?.state.root?.mode ?? null,
          visible: !!smoke?.group.visible,
          root: smoke?.state.root ? { ...smoke.state.root } : null,
        }
      }
      const t = { hutId, phase, read, events: [], armed: false, previous: read() }
      window.smokeEvents = t
      const frame = () => {
        if (window.smokeEvents !== t) return
        const current = read()
        if (t.armed && current.ids.join(',') !== t.previous.ids.join(',') && t.events.length < 64)
          t.events.push({ previous: t.previous, current })
        t.previous = current
        requestAnimationFrame(frame)
      }
      requestAnimationFrame(frame)
    },
    { hutId, phase }
  )
}
try {
  ;({ page, errors } = await openGame(browser, 1))
  await page.getByRole('button', { name: 'Game settings', exact: true }).click()
  await page.getByRole('button', { name: 'Focus settlement', exact: true }).click()
  await closeMenu()
  await page.waitForFunction(() => !window.testScene.cameraMotion.active)
  await pause()
  report.hutId = await page.evaluate(
    () =>
      window.testScene.world.buildings.find(
        b => b.team === 'blue' && b.kind === 'hut' && b.progress === 1 && b.hp > 0
      )?.id
  )
  assert.ok(report.hutId, 'Shipped Mission1 must supply a completed Blue Hut')
  await observe(report.hutId, 'preLoad')
  report.initial = await snapshot()
  save()
  assert.equal(
    report.initial.capacity,
    3,
    'This shipped route covers level1, not injected level2/3'
  )
  await clearSelection()
  await page
    .getByRole('button', { name: 'Select brave', exact: true })
    .click({ modifiers: ['Shift'] })
  const initialIds = await page.evaluate(() => [...window.testScene.world.selected])
  assert.ok(initialIds.length >= 3)
  await guard(initialIds)
  const zero = await settled([], null)
  report.stages.push({ name: 'zero', ...zero })
  save()
  await page.evaluate(() => {
    window.smokeEvents.events = []
    window.smokeEvents.armed = true
    window.smokeEvents.previous = window.smokeEvents.read()
  })
  const candidates = await page.evaluate(() => {
    const w = window.testScene.world,
      hut = w.buildings.find(b => b.id === window.smokeEvents.hutId)
    return w.units
      .filter(
        u => u.team === 'blue' && u.kind === 'brave' && u.hp > 0 && u.guard && u.inside === null
      )
      .sort((a, b) => Math.hypot(a.x - hut.x, a.z - hut.z) - Math.hypot(b.x - hut.x, b.z - hut.z))
      .map(u => u.id)
  })
  const cohort = []
  for (const id of candidates) {
    if (await personPoint(id)) cohort.push(id)
    if (cohort.length === 3) break
  }
  assert.equal(cohort.length, 3, 'Three real rendered Braves are required')
  for (let i = 0; i < cohort.length; i++) {
    const active = cohort.slice(0, i + 1)
    await admit(cohort[i])
    const state = await settled(active, i === 2 ? 'full' : 'partial')
    report.stages.push({ name: 'admission-' + (i + 1), ...state })
    save()
  }
  assert.ok(
    report.eventHistories.preLoad.some(
      e => e.current.ids.length > e.previous.ids.length && e.current.counter & 31
    ),
    'Must observe a genuine off-32-phase admission'
  )
  await page.screenshot({ path: output + '-full.png' })
  const full = await snapshot()
  await page.waitForTimeout(200)
  assert.deepEqual(await snapshot(), full, 'Paused scene must not advance smoke/counter')
  await page.getByRole('button', { name: 'Game settings', exact: true }).click()
  await page.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
  await closeMenu()
  await pause()
  let remaining = [...cohort]
  for (const id of cohort) {
    await depart(id, remaining)
    remaining = remaining.filter(person => person !== id)
    report.stages.push({
      name: 'departure-' + remaining.length,
      ...(await settled(remaining, remaining.length ? 'partial' : null)),
    })
    save()
  }
  assert.ok(
    report.eventHistories.preLoad.some(
      e => e.current.ids.length < e.previous.ids.length && e.current.counter & 31
    ),
    'Must observe a genuine off-32-phase removal'
  )
  await page.getByRole('button', { name: 'Game settings', exact: true }).click()
  // Stop only this read-only observer before replacing the world; do not let
  // the checkpoint discontinuity masquerade as an occupancy event.
  await page.evaluate(() => {
    window.smokeEvents.armed = false
  })
  await eventAudit()
  report.preLoadSealed = true
  save()
  await page.getByRole('button', { name: 'Load checkpoint', exact: true }).click()
  await bindGame(page)
  await observe(report.hutId, 'postRebind')
  report.restored = await settled(cohort, 'full')
  await page.evaluate(() => {
    window.smokeEvents.armed = true
    window.smokeEvents.previous = window.smokeEvents.read()
  })
  await depart(cohort[0], cohort)
  report.afterRestoreRemoval = await settled(cohort.slice(1), 'partial')
  assert.ok(report.preLoadSealed, 'Complete pre-load history must be preserved before rebind')
  assert.ok(
    report.eventHistories.postRebind.some(
      e => e.current.ids.length < e.previous.ids.length && e.current.counter & 31
    ),
    'Post-rebind removal must have its own genuine off-phase event evidence'
  )
  assert.deepEqual(errors, [])
  report.result =
    'PASS normal command8 admissions/removals reconcile off-phase, reverse sequence, pause and checkpoint rebind'
  console.log(report.result)
} catch (error) {
  report.result = 'FAIL'
  report.failure = { message: error.message, stack: error.stack }
  if (page) {
    report.last = await snapshot().catch(() => null)
    await captureEventHistory().catch(historyError => {
      report.historyCaptureFailure = { message: historyError.message }
    })
    await page.screenshot({ path: output + '-failure.png' }).catch(() => {})
  }
  throw error
} finally {
  report.errors = errors ?? []
  save()
  await browser.close()
}
