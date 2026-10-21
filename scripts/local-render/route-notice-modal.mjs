import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame } from '../browser-game.mjs'
import { openCampaignFromMainMenu } from '../browser-new-game.mjs'

// Controlled presentation publication after a genuine public destination command.
// The fixture owns only its Scene's RAF scheduling, not the tooltip countdown or
// simulation fields. This is not an earned pathfinding-failure or real-time test.
export async function enterRouteLevel(page) {
  await bindGame(page)
  // Close, but do not acknowledge/delete, a campaign popup capturing game input.
  const summaries = page.locator('details[open][data-message-serial] > summary')
  while (await summaries.count()) await summaries.first().click()
  await page.locator('.world-viewport canvas').first().focus()
  // Shared readiness/Space helper is supplied by the combined UI integration.
  const { skipIntroductionWithSpace } = await import('../browser-introduction.mjs')
  await skipIntroductionWithSpace(page, { timeout: 45000 })
  await page.waitForFunction(() => !window.testStore.getWorld().inputMask, undefined, { timeout: 45000 })
  while (await summaries.count()) await summaries.first().click()
}

export async function captureRouteClock() {
  const [math, terrain, projection, layout, assets] = await Promise.all([
    import('/app/native-math.ts'), import('/app/native-terrain.ts'),
    import('/app/projection.ts'), import('/app/tooltip-layout.ts'), import('/app/scene-assets.ts'),
  ])
  if (!(await assets.loadTexture('hud').ready) || !(await assets.loadTexture('tooltip-border').ready))
    throw Error('Route glyph/frame images unavailable')
  const scene = window.testSceneRef.current
  cancelAnimationFrame(scene.frame)
  window.routeNoticeFixture = { scene, world: window.testStore.getWorld(),
    canvas: document.querySelector('.world-viewport canvas'), now: scene.previous ?? performance.now(),
    references: { ...math, ...terrain, ...projection, ...layout } }
}

// This exact callback is also exercised against the production animate/controller
// by route-notice-harness.test.mjs. Candidate frames and admitted visits differ.
export function advanceRouteClock({ count = 0, mode = 'visits', stale = false } = {}) {
  if (!Number.isSafeInteger(count) || count < 0 || count > 1000 || !['visits', 'frames'].includes(mode))
    throw Error('Invalid bounded route clock request')
  const fixture = stale ? window.staleRouteNoticeFixture : window.routeNoticeFixture,
    scene = fixture.scene, start = scene.tooltipController.session.visits
  let frames = 0
  const tick = delta => {
    fixture.now += delta
    scene.animate(fixture.now)
    cancelAnimationFrame(scene.frame)
    frames++
  }
  if (!count) tick(0) // repaint/reset previous after a public modal transition
  else if (mode === 'frames') for (let i = 0; i < count; i++) tick(1000 / 24)
  else {
    while (scene.tooltipController.session.visits - start < count && frames < count + 32) tick(1000 / 24)
    if (scene.tooltipController.session.visits - start !== count) throw Error('Eligible visit count mismatch')
  }
  return { frames, visits: scene.tooltipController.session.visits - start }
}

export function releaseRouteClock() {
  const fixture = window.routeNoticeFixture
  if (fixture?.scene.isCurrent()) {
    // Reset the clock through its owner, avoiding catch-up from synthetic time.
    fixture.scene.setModalSuspended(fixture.scene.modalSuspended)
    fixture.scene.frame = requestAnimationFrame(fixture.scene.animate)
  }
  delete window.routeNoticeFixture
  delete window.staleRouteNoticeFixture
}

export async function issueRouteAnchorCommand(page) {
  const summaries = page.locator('details[open][data-message-serial] > summary')
  while (await summaries.count()) await summaries.first().click()
  await page.locator('.world-viewport canvas').first().focus()
  await page.keyboard.press('h')
  const candidate = await page.evaluate(() => {
    const scene = window.routeNoticeFixture.scene, world = scene.world,
      rect = scene.renderer.domElement.getBoundingClientRect()
    if (!world.selected.length) throw Error('Public H selection did not select a follower')
    for (const y of [0.5, 0.55, 0.45, 0.6, 0.4]) for (const x of [0.5, 0.55, 0.45, 0.6, 0.4]) {
      const event = { clientX: rect.left + rect.width * x, clientY: rect.top + rect.height * y }
      if (scene.picking.pickPerson(event) || scene.pickWorldObject(event)) continue
      const point = scene.pick(event)
      if (!point) continue
      // Read-only equivalent of command packing; do not call nativePosition,
      // which also synchronizes terrain. The real command remains public input.
      const nx = Math.round((point.x + 8) * 256) & 65535,
        ny = Math.round((-point.z - 8) * 256) & 65535,
        cell = ((nx >>> 8) & 255) | (ny & 0xff00)
      if (cell !== world.lastOrderCell) return { x: event.clientX, y: event.clientY, cell, turn: world.turn }
    }
    throw Error('No unobstructed public terrain destination in bounded search')
  })
  await page.mouse.click(candidate.x, candidate.y, { button: 'left' })
  const actual = await page.evaluate(() => {
    const world = window.testStore.getWorld()
    return { cell: world.lastOrderCell, turn: world.lastOrderTurn }
  })
  assert.deepEqual(actual, { cell: candidate.cell, turn: candidate.turn })
  return candidate
}

export function publishRouteNotice(serial = 77) {
  const fixture = window.routeNoticeFixture, world = window.testStore.getWorld()
  if (world !== fixture.world || !Number.isSafeInteger(world.lastOrderCell) || world.lastOrderCell < 0 || world.lastOrderCell > 65535)
    throw Error('Current public command destination required')
  window.testStore.change(w => { w.routeNotice = { flags: 0x200000, message: 603, serial, cell: w.lastOrderCell } })
  fixture.notice = world.routeNotice
  fixture.publicationVisits = fixture.scene.tooltipController.session.visits
}

// Read-only observer. Compose the projection expectation from native primitives,
// not routeTooltipAnchor or the rendered element's coordinates.
export function observeRouteNotice() {
  const f = window.routeNoticeFixture, s = f.scene, w = window.testStore.getWorld(),
    r = f.references, text = "One or more of your people can't get to this point.",
    width = window.innerWidth, height = window.innerHeight, layout = r.tooltipLayout(text, width, height),
    cell = f.notice.cell, p = { x: (((cell & 254) + 1) << 8) & 65535, y: ((((cell >>> 8) & 254) + 1) << 8) & 65535 }
  r.movePosition(p, (s.view.angle + 512) & 2047, 128)
  const projected = r.projectPoint({ x: r.relativeCoordinate(p.x, s.view.center.x),
    y: r.terrainPointHeight(w.land, p), z: r.relativeCoordinate(p.y, s.view.center.y) }, s.view.projection),
    viewport = s.container.getBoundingClientRect(), node = s.tooltipElement,
    x = Math.min(width - layout.width, Math.max(0, Math.min(width, Math.trunc(projected.screenX + viewport.left)))),
    y = Math.min(height - layout.height, Math.max(0, Math.min(height, Math.trunc(projected.screenY + viewport.top))))
  return { sameWorld: w === f.world, sameScene: window.testSceneRef.current === s,
    sceneWorld: s.world === w, sameCanvas: document.querySelector('.world-viewport canvas') === f.canvas,
    sameNotice: w.routeNotice === f.notice, sameOwner: s.tooltipController.routeNotice === f.notice,
    paused: w.paused, suspended: s.modalSuspended, turn: w.turn, time: w.time,
    remaining: s.tooltip.remaining, visits: s.tooltipController.session.visits - f.publicationVisits,
    flags: s.tooltip.flags, fixed: s.tooltip.fixed, target: s.tooltip.target, cell,
    text: s.tooltip.text, label: node.getAttribute('aria-label'), hidden: node.hidden,
    actual: { left: parseFloat(node.style.left), top: parseFloat(node.style.top), width: s.tooltipCanvas.width, height: s.tooltipCanvas.height },
    expected: { left: x - 4, top: y - 4, width: layout.width + 7, height: layout.height + 7 },
    clipped: !!(projected.flags & 30), screen: { width, height, dpr: window.devicePixelRatio },
    font: layout.draws[0][0], frame: '/original/tooltip-border.png', textExpected: text }
}

export function assertRouteVisible(state, remaining) {
  for (const key of ['sameWorld', 'sameScene', 'sceneWorld', 'sameCanvas', 'sameNotice', 'sameOwner']) assert.equal(state[key], true, key)
  assert.equal(state.remaining, remaining); assert.equal(state.visits, 72 - remaining)
  assert.equal(state.flags, 8); assert.equal(state.fixed, 1); assert.equal(state.target, state.cell)
  assert.equal(state.hidden, false); assert.equal(state.clipped, false)
  assert.equal(state.text, state.textExpected); assert.equal(state.label, state.textExpected)
  assert.deepEqual(state.actual, state.expected)
}

export function assertRouteFrozen(before, after) {
  for (const key of ['remaining', 'visits', 'turn', 'time', 'cell', 'sameNotice', 'sameOwner']) assert.equal(after[key], before[key], key)
  for (const key of ['sameWorld', 'sameScene', 'sceneWorld', 'sameCanvas', 'suspended', 'hidden']) assert.equal(after[key], true, key)
}

export default async function ({ page, output }) {
  const observations = [], button = name => page.getByRole('button', { name, exact: true }),
    observe = () => page.evaluate(observeRouteNotice),
    advance = (count, mode = 'visits') => page.evaluate(advanceRouteClock, { count, mode }),
    record = value => {
      observations.push(value)
      writeFileSync(resolve(output, 'route-notice.json'), JSON.stringify({
        scope: 'controlled publication after public command; real Scene/controller with fixture-owned frame clock; public menu/selector/F9',
        referenceHz: 24, lifetimeEligibleVisits: 72, observations,
      }, null, 2))
    }
  await page.setViewportSize({ width: 960, height: 720 })
  await openCampaignFromMainMenu(page); await button('Start Mission 1').click()
  await enterRouteLevel(page); await page.evaluate(captureRouteClock)
  try {
    for (const initiallyPaused of [false, true]) {
      const command = await issueRouteAnchorCommand(page)
      if (initiallyPaused) await page.locator('.world-viewport').press('Space')
      await page.evaluate(publishRouteNotice, 77)
      await advance(1); assertRouteVisible(await observe(), 71)
      await advance(23); const visible = await observe()
      record({ initiallyPaused, stage: '24-eligible-visits', command, visible }); assertRouteVisible(visible, 48)
      await button('Menu').click()
      await page.getByRole('dialog', { name: 'Game menu', exact: true }).waitFor()
      const before = await observe(), modalFrames = await advance(96, 'frames'), after = await observe()
      record({ initiallyPaused, stage: 'menu', modalFrames, before, after })
      assert.equal(modalFrames.visits, 0); assertRouteFrozen(before, after)
      await button('Quit Level').click(); await button('No').click()
      await button('Options').click(); await button('Browser compatibility and help').click()
      await button('Select Level').click()
      const selectorBefore = await observe(); await advance(96, 'frames')
      const selectorAfter = await observe()
      record({ initiallyPaused, stage: 'selector', before: selectorBefore, after: selectorAfter })
      assertRouteFrozen(selectorBefore, selectorAfter)
      await page.keyboard.press('Escape'); await button('Continue Game').click()
      await advance(0); assertRouteVisible(await observe(), 48)
      await button('Menu').click(); await advance(96, 'frames')
      assertRouteFrozen(before, await observe())
      await page.keyboard.press('Escape'); await advance(0)
      await page.keyboard.press('F9'); await page.locator('[data-spell-test-menu]').waitFor()
      const cheatBefore = await observe(), cheatFrames = await advance(96, 'frames')
      const cheatAfter = await observe()
      record({ initiallyPaused, stage: 'F9', cheatFrames, before: cheatBefore, after: cheatAfter })
      assert.equal(cheatFrames.visits, 0); assertRouteFrozen(cheatBefore, cheatAfter)
      await page.keyboard.press('Escape'); await advance(0)
      assert.equal((await observe()).paused, initiallyPaused)
      await advance(47); const last = await observe(); assertRouteVisible(last, 1)
      await page.screenshot({ path: resolve(output, `route-notice-last-visit-${initiallyPaused}.png`) })
      await advance(1); const expired = await observe()
      record({ initiallyPaused, stage: 'expiry', last, expired })
      assert.equal(expired.remaining, 0); assert.equal(expired.visits, 72)
      assert.equal(expired.sameNotice, false); assert.equal(expired.hidden, true)
      assert.equal(await page.evaluate(() => window.testStore.getWorld().routeNotice), null)
      if (initiallyPaused) { assert.equal(expired.turn, visible.turn); assert.equal(expired.time, visible.time) }
    }
    return { status: 'passed', episodes: 2, observations }
  } finally { await page.evaluate(releaseRouteClock) }
}
