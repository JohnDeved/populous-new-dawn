// #72 automatic worship-panel producer acceptance.
// Setup and lifecycle use shipped browser input only: no World writes, no direct
// panel open, no advanceGame injection, and no synthetic worship state.
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const output = resolve(process.env.PND_QUEUE_OUTPUT ?? '/private/tmp')
const reportPath = resolve(output, 'worship-panel-auto-browser.json')
const report = { status: 'running', stage: 'startup', stages: {} }
function save() {
  mkdirSync(output, { recursive: true })
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n')
}
async function stage(name, action) {
  report.stage = name
  save()
  const value = await action()
  report.stages[name] = value
  save()
  return value
}

async function waitNormalInput(page) {
  await page.waitForFunction(() => {
    const s = window.testScene, w = s.world
    return (
      !w.inputMask &&
      !s.overviewStage &&
      !s.overviewActive &&
      !s.cameraMotion.active &&
      !(w.manaWorld.gameFlags & 32) &&
      !w.paused &&
      w.status === 'playing'
    )
  })
}

async function focusShrineWithMinimap(page, id) {
  const target = await page.evaluate(async id => {
    const s = window.testScene,
      w = s.world,
      head = w.shrines.find(candidate => candidate.id === id),
      { nativePosition } = await import('/app/model.ts'),
      { minimapPick } = await import('/app/minimap.ts')
    if (!head) throw new Error('Missing shrine ' + id)
    const desired = nativePosition(w, head),
      center = nativePosition(w, s.viewPoint),
      heading = Math.round((s.cameraBearing * 1024) / Math.PI),
      width = s.mini.width,
      height = s.mini.height,
      wrappedDistance = (a, b) => Math.min((a - b) & 65535, (b - a) & 65535)
    let best = null
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const picked = minimapPick(width, height, center, heading, { x: x + 0.5, y: y + 0.5 }),
          dx = wrappedDistance(picked.x, desired.x),
          dy = wrappedDistance(picked.y, desired.y),
          score = dx * dx + dy * dy
        if (!best || score < best.score) best = { x, y, score, picked }
      }
    return { ...best, width, height, desired }
  }, id)
  const mini = page.getByLabel('Minimap. Click to move the camera.', { exact: true }),
    rect = await mini.boundingBox()
  assert.ok(rect, 'rendered minimap bounds')
  await page.mouse.click(
    rect.x + ((target.x + 0.5) / target.width) * rect.width,
    rect.y + ((target.y + 0.5) / target.height) * rect.height
  )
  await page.waitForFunction(() => !window.testScene.cameraMotion.active)
  await page.mouse.move(720, 500)
  return target
}

async function worshipCommandPoint(page, id) {
  return page.evaluate(async id => {
    const s = window.testScene,
      w = s.world,
      head = w.shrines.find(candidate => candidate.id === id),
      rect = s.renderer.domElement.getBoundingClientRect(),
      { liveCommandContext } = await import('/app/live-command.ts')
    if (!head) throw new Error('Missing worship head ' + id)
    const projected = s.screen(head),
      cx = rect.left + ((projected.x + 1) * rect.width) / 2,
      cy = rect.top + ((1 - projected.y) * rect.height) / 2
    for (let dy = -105; dy <= 55; dy += 3)
      for (let dx = -75; dx <= 75; dx += 3) {
        const event = {
          clientX: Math.round(cx + dx),
          clientY: Math.round(cy + dy),
        }
        if (
          document.elementFromPoint(event.clientX, event.clientY) !== s.renderer.domElement ||
          s.pickUnit(event)
        )
          continue
        const object = s.pickWorldObject(event),
          context = object && liveCommandContext(w, object)
        if (
          object?.id === id &&
          context?.enabled &&
          context.model === 27 &&
          context.shrine?.id === id
        )
          return {
            x: event.clientX,
            y: event.clientY,
            context: { object: object.id, model: context.model, shrine: context.shrine.id },
          }
      }
    throw new Error('No rendered enabled model-27 worship point for head ' + id)
  }, id)
}

async function dispatchOneWorshipper(page, headId) {
  const attempts = []
  for (let attempt = 0; attempt < 8; attempt++) {
    await page.keyboard.press('Escape')
    const braveButton = page.getByLabel('Select brave')
    await braveButton.click()
    let selected = await page.evaluate(() => [...window.testScene.world.selected])
    if (!selected.length) {
      await braveButton.click({ modifiers: ['Shift'] })
      selected = await page.evaluate(() => [...window.testScene.world.selected])
    }
    assert.ok(selected.length >= 1, 'normal HUD input must select at least one Brave')
    await focusShrineWithMinimap(page, headId)
    const point = await worshipCommandPoint(page, headId)
    assert.deepEqual(point.context, { object: headId, model: 27, shrine: headId })
    await page.mouse.click(point.x, point.y)
    await page.waitForTimeout(150)
    const snapshot = await page.evaluate(async id => {
      const w = window.testScene.world,
        { currentPersonOrder } = await import('/app/person-orders.ts')
      return {
        turn: w.turn,
        selected: [...w.selected],
        workers: w.units
          .filter(u => u.team === 'blue' && u.hp > 0 && u.work === id)
          .map(u => {
            const p = u.native ?? u.entry?.person ?? u.builder?.person,
              order = p && currentPersonOrder(w.buildingOrders, p)
            return { id: u.id, order: order?.model ?? null, target: order?.a ?? null }
          }),
      }
    }, headId)
    attempts.push({ selected, point, snapshot })
    if (
      snapshot.workers.length &&
      snapshot.workers.every(person => person.order === 27 && person.target === headId)
    )
      return { selected, point, snapshot, attempts }
  }
  throw new Error('Eight fresh rendered model-27 worship clicks produced no accepted order')
}

async function renderedMovePoint(page, headId) {
  return page.evaluate(async headId => {
    const s = window.testScene,
      w = s.world,
      head = w.shrines.find(h => h.id === headId),
      rect = s.renderer.domElement.getBoundingClientRect(),
      { liveCommandContext } = await import('/app/live-command.ts')
    let best = null
    for (let y = rect.top + 60; y < rect.bottom - 60; y += 60)
      for (let x = rect.left + 60; x < rect.right - 60; x += 60) {
        const event = { clientX: x, clientY: y }
        if (
          document.elementFromPoint(x, y) !== s.renderer.domElement ||
          s.pickUnit(event) ||
          s.pickWorldObject(event)
        )
          continue
        const point = s.pick(event),
          context = point && liveCommandContext(w, point)
        if (!point || !context?.enabled || context.model !== 3 || context.building) continue
        const distance = Math.hypot(point.x - head.x, point.z - head.z)
        if (!best || distance > best.distance)
          best = { x, y, distance, world: { x: point.x, z: point.z } }
      }
    if (!best || best.distance < 8) throw new Error('No distant rendered move target')
    return best
  }, headId)
}

async function automaticPanelState(page, id) {
  return page.evaluate(async id => {
    const s = window.testScene,
      head = s.world.shrines.find(h => h.id === id),
      panel = s.objectPanels.panels.get(id)
    if (!head || !panel) return null
    const { nativePosition } = await import('/app/model.ts'),
      p = s.screen(head, (nativePosition(s.world, head).h + panel.offset) / 45),
      container = s.container.getBoundingClientRect(),
      rect = panel.element.getBoundingClientRect()
    return {
      id,
      name: head.name,
      mode: head.mode,
      target: head.target,
      followers: head.followers,
      activity: head.panelActivity,
      automatic: panel.automatic,
      phase: panel.phase,
      remaining: panel.remaining,
      inspected: s.objectPanels.inspected,
      visible: panel.element.isConnected && !panel.element.hidden && rect.width > 0 && rect.height > 0,
      selected: [...s.world.selected],
      offset: panel.offset,
      anchor: {
        expectedX: container.left + ((p.x + 1) * container.width) / 2,
        expectedY: container.top + ((1 - p.y) * container.height) / 2,
        actualX: rect.left + rect.width / 2,
        actualY: rect.bottom,
      },
      controls: [...panel.element.querySelectorAll('button:not([hidden])')].map(button =>
        Number(button.dataset.person)
      ),
      label: panel.element.ariaLabel,
      focusInside: panel.element.contains(document.activeElement),
      hovered: panel.element.matches(':hover'),
      frame: s.gameClock.animationFrame,
      turn: s.world.turn,
    }
  }, id)
}

async function assertAutomaticVisible(page, id) {
  await page.waitForFunction(
    id => {
      const s = window.testScene,
        panel = s.objectPanels.panels.get(id)
      return (
        panel?.automatic &&
        panel.phase === 1 &&
        panel.element.isConnected &&
        !panel.element.hidden
      )
    },
    id,
    { timeout: 60_000 }
  )
  const state = await automaticPanelState(page, id)
  assert.equal(state.automatic, true)
  assert.equal(state.inspected === id, false, 'automatic producer must not impersonate inspection')
  assert.equal(state.activity.count > 0, true)
  assert.ok(Math.abs(state.anchor.actualX - state.anchor.expectedX) < 1)
  assert.ok(Math.abs(state.anchor.actualY - state.anchor.expectedY) < 1)
  return state
}

async function waitActivity(page, id, active, afterTurn = -1) {
  await page.waitForFunction(
    ({ id, active, afterTurn }) => {
      const head = window.testScene.world.shrines.find(h => h.id === id),
        sample = head?.panelActivity
      return !!sample && sample.turn > afterTurn && (((sample.count & 0xff) !== 0) === active)
    },
    { id, active, afterTurn },
    { timeout: 60_000 }
  )
  return page.evaluate(id => {
    const head = window.testScene.world.shrines.find(h => h.id === id)
    return { ...head.panelActivity, followers: head.followers, turn: window.testScene.world.turn }
  }, id)
}

async function acceptance() {
  assert.ok(process.env.POPULOUS_URL, 'POPULOUS_URL is required')
  const browser = await chromium.launch({ headless: true })
  let page
  try {
    const game = await openGame(browser, 13)
    page = game.page
    page.setDefaultTimeout(20_000)
    await waitNormalInput(page)
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent?.includes('game speed'))?.click())
    const ids = await page.evaluate(() => ({
      head: window.testScene.world.shrines.find(
        h => h.kind === 'volcano' && h.mode === 0 && h.target >= 1000
      )?.id,
      vault: window.testScene.world.shrines.find(h => h.kind === 'vault')?.id,
    }))
    assert.ok(ids.head, 'Mission 13 target-1000 ordinary mode-0 head')
    assert.ok(ids.vault, 'Mission 1 Vault family boundary')
    await focusShrineWithMinimap(page, ids.head)

    await stage('normal-worship-start', async () => {
      const dispatch = await dispatchOneWorshipper(page, ids.head)
      report.stages['normal-worship-dispatch'] = dispatch
      save()
      const activity = await waitActivity(page, ids.head, true)
      const panel = await assertAutomaticVisible(page, ids.head)
      const unsupported = await page.evaluate(vaultId => {
        const s = window.testScene,
          vault = s.world.shrines.find(h => h.id === vaultId)
        return {
          activity: vault.panelActivity ?? null,
          panel: s.objectPanels.panels.has(vaultId),
        }
      }, ids.vault)
      assert.deepEqual(unsupported, { activity: null, panel: false })
      return { dispatch, activity, panel, unsupported }
    })

    const panelHandle = await page.evaluateHandle(
      id => window.testScene.objectPanels.panels.get(id).element,
      ids.head
    )

    await stage('selection-and-anchor', async () => {
      await page.keyboard.press('Escape')
      let state = await automaticPanelState(page, ids.head)
      assert.ok(state.controls.length >= 1)
      const panel = page.getByRole('group', { name: /Volcano stone head: .*worshippers/ }),
        button = panel.getByRole('button', { name: /Toggle worshipper/ }).first(),
        person = Number(await button.getAttribute('data-person'))
      await button.click()
      assert.deepEqual(await page.evaluate(() => window.testScene.world.selected), [person])
      await button.click({ modifiers: ['Shift'] })
      assert.deepEqual(await page.evaluate(() => window.testScene.world.selected), [])
      await button.click({ modifiers: ['Shift'] })
      const group = await page.evaluate(() => [...window.testScene.world.selected])
      assert.ok(group.length >= 1)
      state = await automaticPanelState(page, ids.head)
      assert.ok(Math.abs(state.anchor.actualX - state.anchor.expectedX) < 1)
      assert.ok(Math.abs(state.anchor.actualY - state.anchor.expectedY) < 1)
      return { person, group, state }
    })

    await stage('automatic-hold-without-pointer', async () => {
      await page.keyboard.press('Escape')
      const blank = await renderedMovePoint(page, ids.head)
      await page.mouse.click(blank.x, blank.y)
      await page.mouse.move(20, 20)
      await page.waitForFunction(id => {
        const panel = window.testScene.objectPanels.panels.get(id)
        return (
          panel &&
          !panel.element.contains(document.activeElement) &&
          !panel.element.matches(':hover')
        )
      }, ids.head)
      const before = await automaticPanelState(page, ids.head)
      await page.waitForFunction(
        ({ id, frame }) => {
          const s = window.testScene,
            panel = s.objectPanels.panels.get(id)
          return (
            s.gameClock.animationFrame >= frame + 40 &&
            panel?.automatic &&
            panel.phase === 1 &&
            panel.element.isConnected &&
            !panel.element.hidden
          )
        },
        { id: ids.head, frame: before.frame },
        { timeout: 20_000 }
      )
      const after = await automaticPanelState(page, ids.head)
      const sameNode = await page.evaluate(
        ({ id, node }) => window.testScene.objectPanels.panels.get(id)?.element === node,
        { id: ids.head, node: panelHandle }
      )
      assert.equal(sameNode, true)
      assert.equal(after.activity.count > 0, true)
      assert.equal(after.focusInside, false)
      assert.equal(after.hovered, false)
      return { blank, before, after, sameNode }
    })

    const stopped = await stage('activity-stop', async () => {
      const state = await automaticPanelState(page, ids.head),
        panel = page.getByRole('group', { name: /Volcano stone head: .*worshippers/ }),
        button = panel.getByRole('button', { name: /Toggle worshipper/ }).first()
      await button.click({ modifiers: ['Shift'] })
      const selected = await page.evaluate(() => [...window.testScene.world.selected])
      assert.ok(selected.length >= 1, 'real panel selection must supply departing worshippers')
      const target = await renderedMovePoint(page, ids.head)
      await page.mouse.click(target.x, target.y)
      await page.mouse.move(20, 20)
      const zero = await waitActivity(page, ids.head, false, state.activity.turn)
      await page.waitForFunction(
        id => !window.testScene.objectPanels.panels.has(id),
        ids.head,
        { timeout: 20_000 }
      )
      const disconnected = await page.evaluate(node => !node.isConnected, panelHandle)
      assert.equal(disconnected, true)
      return { selected, target, zero, disconnected }
    })

    await stage('activity-restart', async () => {
      const dispatch = await dispatchOneWorshipper(page, ids.head)
      const activity = await waitActivity(page, ids.head, true, stopped.zero.turn)
      const panel = await assertAutomaticVisible(page, ids.head)
      const newNode = await page.evaluate(
        ({ id, node }) => window.testScene.objectPanels.panels.get(id)?.element !== node,
        { id: ids.head, node: panelHandle }
      )
      assert.equal(newNode, true)
      return { dispatch, activity, panel, newNode }
    })

    assert.deepEqual(game.errors, [])
    report.status = 'passed'
    report.stage = 'complete'
    save()
    await page.screenshot({ path: resolve(output, 'worship-panel-auto.png') })
    console.log(
      'PASS: normal Mission 13 worship automatically creates, retains, releases and recreates the ordinary mode-0 panel without injection'
    )
  } catch (error) {
    report.status = 'failed'
    report.error = error.stack ?? String(error)
    save()
    if (page && !page.isClosed())
      await page.screenshot({ path: resolve(output, 'worship-panel-auto-failure.png') }).catch(
        () => {}
      )
    throw error
  } finally {
    await browser.close()
  }
}

await acceptance()
