import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  const setup = await page.evaluate(async () => {
    const s = window.testScene,
      w = s.world,
      m = await import('/app/model.ts')
    const { advanceGame } = await import('/app/game-clock.ts')
    cancelAnimationFrame(s.frame)
    w.units = w.units.filter(u => u.team === 'blue')
    w.manaWorld.gameFlags = 32
    w.selected = w.units.map(u => u.id)
    const head = w.shrines.find(h => h.kind === 'bridge')
    m.command(w, head)
    w.speed = 1
    for (let i = 0; i < 180; i++) advanceGame(w, s.gameClock, 1 / 12)
    w.speed = 0
    s.focus(head)
    s.onChange()
    s.animate(s.previous)
    return {
      head: head.id,
      followers: head.followers,
      ids: w.units.map(u => u.id),
      orders: JSON.stringify(w.units.map(u => u.native.commands)),
      random: w.randomState,
    }
  })
  assert.equal(setup.followers, 7)
  await page.keyboard.press('Escape')
  const point = await page.evaluate(id => {
    const s = window.testScene,
      head = s.world.shrines.find(h => h.id === id),
      r = s.container.getBoundingClientRect()
    const p = s.screen(head),
      x = r.left + ((p.x + 1) * r.width) / 2,
      y = r.top + ((1 - p.y) * r.height) / 2
    for (let dy = -75; dy <= 0; dy += 3)
      for (let dx = -20; dx <= 20; dx += 3) {
        const event = { clientX: x + dx, clientY: y + dy }
        if (!s.pickUnit(event) && s.pickWorldObject(event)?.id === id)
          return { x: event.clientX, y: event.clientY }
      }
    throw new Error('No exposed stone-head geometry for real input')
  }, setup.head)
  await page.mouse.click(point.x, point.y, { button: 'right' })
  const panel = page.getByRole('group', { name: /Land Bridge stone head: .*worshippers/ })
  await panel.waitFor({ state: 'visible' })
  const canvas = panel.locator('canvas'),
    button = panel.getByRole('button', { name: /Toggle worshipper/ })
  assert.equal(await button.count(), 1, 'required count controls the number of visible slots')
  const before = await canvas.evaluate(c =>
    Array.from(c.getContext('2d').getImageData(0, 0, c.width, c.height).data)
  )
  assert.ok(before.some((v, i) => i % 4 === 3 && v > 0))
  const initial = await page.evaluate(id => {
    const s = window.testScene,
      p = s.objectPanels.panels.get(id)
    return { offset: p.offset, kind: p.kind, selected: s.world.selected }
  }, setup.head)
  assert.equal(initial.offset, 656)
  assert.equal(initial.kind, 'head')
  assert.deepEqual(initial.selected, [])
  await button.click()
  let selected = await page.evaluate(() => window.testScene.world.selected)
  assert.equal(selected.length, 1)
  const chosen = selected[0]
  await button.click({ modifiers: ['Shift'] })
  assert.deepEqual(await page.evaluate(() => window.testScene.world.selected), [])
  await button.click({ modifiers: ['Shift'] })
  selected = await page.evaluate(() => window.testScene.world.selected)
  assert.equal(selected.length, 7)
  assert.ok(setup.ids.every(id => selected.includes(id)))
  const stable = await page.evaluate(() => {
    const w = window.testScene.world
    return { orders: JSON.stringify(w.units.map(u => u.native.commands)), random: w.randomState }
  })
  assert.equal(stable.orders, setup.orders)
  assert.equal(stable.random, setup.random)
  await button.click({ button: 'right' })
  await page.waitForFunction(id => window.testScene.objectPanels.panels.has(id), chosen)
  assert.equal(
    await page.evaluate(id => window.testScene.objectPanels.panels.has(id), setup.head),
    true,
    'head inspection survives opening a person panel'
  )
  assert.equal(
    await page.evaluate(() => window.testScene.world.selected.length),
    7,
    'focus does not deselect worshippers'
  )
  // Keep the actual panels visible while resizing; their canvas pixels and aspect
  // ratio remain native and their CSS hit regions scale uniformly.
  const cdp = await page.context().newCDPSession(page)
  for (const [width, height, deviceScaleFactor] of [
    [3440, 1440, 1],
    [1920, 1080, 2],
  ]) {
    await page.setViewportSize({ width, height })
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor,
      mobile: false,
    })
    await page.evaluate(id => {
      const s = window.testScene
      s.objectPanels.open(id, true)
      s.focus(s.world.shrines.find(h => h.id === id))
      s.onChange()
    }, setup.head)
    await panel.waitFor({ state: 'visible' })
    const bounds = await panel.boundingBox(),
      hit = await button.boundingBox()
    assert.ok(
      bounds &&
        hit &&
        hit.x >= bounds.x &&
        hit.y >= bounds.y &&
        hit.x + hit.width <= bounds.x + bounds.width + 1
    )
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width)
    assert.ok(Math.abs(hit.width / hit.height - 16 / 23) < 0.01)
  }
  await page.screenshot({ path: '/private/tmp/populous-head-panel.png' })
  // Replacing an icon with an identical pose must update its action identity,
  // even when every canvas pixel and the reward count stay unchanged.
  const replacement = await page.evaluate(async id => {
    const s = window.testScene,
      w = s.world,
      head = w.shrines.find(h => h.id === id)
    const { liveWorshippers } = await import('/app/live-worship.ts')
    const { moveObjectInCells } = await import('/app/object-cells.ts')
    const people = liveWorshippers(w, head),
      first = people[0]
    const next = people.find(p => p.id !== first.id && p.model === first.model)
    if (!next) throw new Error('Missing same-model worshipper')
    const a = { x: first.x, y: first.y, h: first.h },
      b = { x: next.x, y: next.y, h: next.h }
    moveObjectInCells(w.objectCells, first, b)
    moveObjectInCells(w.objectCells, next, a)
    s.objectPanels.open(id, true)
    return { first: first.id, next: next.id }
  }, setup.head)
  await page.waitForFunction(
    ({ head, next }) =>
      window.testScene.objectPanels.panels.get(head).element.querySelector('button').dataset
        .person === String(next),
    { head: setup.head, next: replacement.next }
  )
  assert.equal(Number(await button.getAttribute('data-person')), replacement.next)
  const vault = await page.evaluate(async () => {
    const s = window.testScene,
      w = s.world,
      m = await import('/app/model.ts'),
      { advanceGame } = await import('/app/game-clock.ts'),
      head = w.shrines.find(h => h.kind === 'vault'),
      shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    Object.assign(shaman, m.entrance(w, head, 2))
    w.selected = [shaman.id]
    m.command(w, head)
    w.speed = 1
    for (let i = 0; i < 900 && !(head.followers && head.work); i++)
      advanceGame(w, s.gameClock, 1 / 12)
    w.speed = 0
    if (!(head.followers && head.work)) throw new Error('Shaman did not begin learning')
    w.selected = []
    s.focus(head)
    s.onChange()
    s.animate(s.previous)
    return { head: head.id, shaman: shaman.id, progress: head.progress }
  })
  const vaultPoint = await page.evaluate(id => {
    const s = window.testScene,
      head = s.world.shrines.find(h => h.id === id),
      r = s.container.getBoundingClientRect(),
      p = s.screen(head),
      x = r.left + ((p.x + 1) * r.width) / 2,
      y = r.top + ((1 - p.y) * r.height) / 2
    for (let dy = -75; dy <= 0; dy += 3)
      for (let dx = -20; dx <= 20; dx += 3) {
        const event = { clientX: x + dx, clientY: y + dy }
        if (!s.pickUnit(event) && s.pickWorldObject(event)?.id === id)
          return { x: event.clientX, y: event.clientY }
      }
    throw new Error('No exposed vault geometry for real input')
  }, vault.head)
  await page.mouse.click(vaultPoint.x, vaultPoint.y, { button: 'right' })
  const vaultPanel = page.getByRole('group', { name: /Vault of Knowledge: shaman learning/ })
  await vaultPanel.waitFor({ state: 'visible' })
  const liveVault = await page.evaluate(id => {
    const panel = window.testScene.objectPanels.panels.get(id),
      key = JSON.parse(panel.key)
    return {
      width: panel.canvas.width,
      height: panel.canvas.height,
      state: key[3],
      hiddenButton: panel.element.querySelector('button').hidden,
    }
  }, vault.head)
  assert.equal(liveVault.width, 32)
  assert.equal(liveVault.height, 62)
  assert.equal(liveVault.state.shamanOnly, true)
  assert.deepEqual(liveVault.state.people, [{ model: 7, selected: false }])
  assert.equal(liveVault.hiddenButton, true, 'unproven vault-slot input stays informational')
  const beforeLabel = await vaultPanel.getAttribute('aria-label')
  const progressed = await page.evaluate(async id => {
    const s = window.testScene,
      w = s.world,
      { advanceGame } = await import('/app/game-clock.ts'),
      head = w.shrines.find(h => h.id === id),
      before = head.progress
    w.speed = 1
    for (let i = 0; i < 24; i++) advanceGame(w, s.gameClock, 1 / 12)
    w.speed = 0
    s.onChange()
    s.animate(s.previous)
    return { before, after: head.progress }
  }, vault.head)
  assert.ok(progressed.after > progressed.before)
  await page.waitForFunction(
    ({ id, before, progress }) => {
      const label = window.testScene.objectPanels.panels.get(id).element.ariaLabel
      return label !== before && label.endsWith(`${Math.round(progress * 100)}% complete`)
    },
    { id: vault.head, before: beforeLabel, progress: progressed.after }
  )
  await page.evaluate(({ head }) => {
    const s = window.testScene
    s.world.shrines.find(h => h.id === head).followers = 0
    s.animate(s.previous)
  }, vault)
  await page.waitForFunction(
    id => window.testScene.objectPanels.panels.get(id).element.ariaLabel.includes('waiting for shaman'),
    vault.head
  )
  await page.evaluate(({ head }) => {
    const s = window.testScene,
      vault = s.world.shrines.find(h => h.id === head)
    vault.followers = 1
    vault.active = false
    s.animate(s.previous)
  }, vault)
  await page.waitForFunction(
    id => window.testScene.objectPanels.panels.get(id).element.ariaLabel.includes('shaman leaving'),
    vault.head
  )
  await page.evaluate(({ head, shaman }) => {
    const s = window.testScene,
      vault = s.world.shrines.find(h => h.id === head)
    vault.active = true
    vault.followers = 1
    s.world.units.find(u => u.id === shaman).hp = 0
    s.animate(s.previous)
  }, vault)
  await page.waitForFunction(
    id => window.testScene.objectPanels.panels.get(id).element.ariaLabel.includes('waiting for shaman'),
    vault.head
  )
  assert.deepEqual(errors, [])
  console.log(
    'PASS: native head/vault hits, original panel artwork, worship selection/focus, live shaman learning progress, independent lifetime and ultrawide/2x-DPI geometry'
  )
} finally {
  await browser.close()
}
