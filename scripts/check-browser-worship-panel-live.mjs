// #72: authored Shrine input and panel behavior, not worship/world lifecycle.
// Only camera framing and ordinary clock pacing are supplied. No actors, orders,
// terrain, work, rewards or mode/model identities are injected.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { bindGame, openGame } from './browser-game.mjs'
import { superviseBrowserCheck } from './performance-queue.mjs'

const output = resolve(process.env.PND_QUEUE_OUTPUT ?? 'work/orchestration/issue72/browser')
const report = {
  status: 'running',
  stage: 'startup',
  fingerprints: Object.fromEntries(
    ['app/object-panels.ts', 'app/globals.css', 'scripts/check-browser-worship-panel-live.mjs'].map(
      path => [path, createHash('sha256').update(readFileSync(path)).digest('hex')]
    )
  ),
  stages: {},
  limits: [
    'Native painter, exact-slot roster and input evidence are reused, not re-established by this browser check.',
    'Simulation is held between UI probes with speed 0; the ordinary 24 Hz animation clock still owns panel lifetime.',
    'Named Totem transport, finite-head retirement, Vault learning/removal and Vault person input are outside this acceptance.',
  ],
}
function save() {
  mkdirSync(output, { recursive: true })
  writeFileSync(
    resolve(output, 'worship-panel-live-browser.json'),
    JSON.stringify(report, null, 2) + '\n'
  )
}
async function stage(name, action) {
  report.stage = name
  save()
  const result = await action()
  report.stages[name] = result
  save()
  return result
}

async function waitHud(page) {
  await page.waitForFunction(async () => {
    const { texture } = await import('/app/scene-assets.ts'),
      image = texture('hud').image
    return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0
  })
}

async function waitNormalFollowerInput(page) {
  await page.waitForFunction(() => {
    const scene = window.testScene,
      world = scene.world
    return (
      !world.inputMask &&
      !scene.overviewStage &&
      !scene.overviewActive &&
      !(world.manaWorld.gameFlags & 32) &&
      !world.paused &&
      world.status === 'playing'
    )
  })
}

async function setHudSize(page, value) {
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByLabel('HUD size').selectOption(value)
  await page.getByRole('button', { name: 'Continue Game', exact: false }).click()
  await page.waitForFunction(value => {
    const fit = Math.min(innerWidth / 640, innerHeight / 480),
      preferred =
        value === 'auto' ? Math.min(2.5, Math.max(1, Math.floor(fit * 2) / 2)) : Number(value),
      expected = String(Math.min(preferred, fit))
    return (
      getComputedStyle(document.querySelector('.game-shell'))
        .getPropertyValue('--hud-scale')
        .trim() === expected
    )
  }, value)
}

async function renderedShrinePoint(page, id) {
  return page.evaluate(id => {
    const s = window.testScene,
      head = s.world.shrines.find(candidate => candidate.id === id)
    if (!head) throw new Error(`Missing shrine ${id}`)
    s.focus(head)
    for (let i = 0; s.cameraMotion.active && i < 96; i++) s.updateCameraMotion(1 / 24)
    s.onChange()
    s.renderer.render(s.scene, s.camera)
    const p = s.screen(head),
      r = s.renderer.domElement.getBoundingClientRect(),
      cx = r.left + ((p.x + 1) * r.width) / 2,
      cy = r.top + ((1 - p.y) * r.height) / 2
    for (let dy = -100; dy <= 50; dy += 3)
      for (let dx = -70; dx <= 70; dx += 3) {
        const event = { clientX: cx + dx, clientY: cy + dy }
        if (
          document.elementFromPoint(event.clientX, event.clientY) === s.renderer.domElement &&
          !s.pickUnit(event) &&
          s.pickWorldObject(event)?.id === id
        )
          return { x: event.clientX, y: event.clientY }
      }
    throw new Error(`No rendered ScenePicking point for shrine ${id}`)
  }, id)
}

// Keep camera framing, picking and the actual browser click on one owned frame.
async function ownedInputFrame(page, action) {
  await page.evaluate(() => cancelAnimationFrame(window.testScene.frame))
  try {
    return await action()
  } finally {
    await page.evaluate(() => {
      const scene = window.testScene
      scene.previous = performance.now()
      scene.animate(scene.previous)
    })
  }
}

async function openShrinePanel(page, id, focusPanel = false) {
  return ownedInputFrame(page, async () => {
    const point = await renderedShrinePoint(page, id)
    if (await page.evaluate(() => window.testScene.world.selected.length > 0)) {
      await page.mouse.click(point.x, point.y, { button: 'right' })
      await page.waitForFunction(() => window.testScene.world.selected.length === 0)
    }
    await page.mouse.click(point.x, point.y, { button: 'right' })
    await page.evaluate(() => {
      const scene = window.testScene
      scene.animate(scene.previous)
      cancelAnimationFrame(scene.frame)
    })
    await page.waitForFunction(id => {
      const panel = window.testScene.objectPanels.panels.get(id)
      return !!panel?.element?.isConnected && !panel.element.hidden && !!panel.key
    }, id)
    // Existing native lifetimes allow other panels to coexist with this head.
    const label = await page.evaluate(
      id => window.testScene.objectPanels.panels.get(id).element.ariaLabel,
      id
    )
    const panel = page.getByRole('group', { name: label, exact: true })
    assert.equal(await panel.count(), 1, 'real shrine input must expose the requested head panel')
    if (focusPanel)
      await panel
        .getByRole('button', { name: /Toggle worshipper/ })
        .first()
        .focus()
    return { panel, point }
  })
}

async function advanceWorship(page, id) {
  return page.evaluate(async id => {
    const s = window.testScene,
      w = s.world
    // Cancel before awaited imports, and resume exactly one RAF afterwards.
    cancelAnimationFrame(s.frame)
    const { advanceGame } = await import('/app/game-clock.ts'),
      { liveWorshippers } = await import('/app/live-worship.ts'),
      head = w.shrines.find(candidate => candidate.id === id)
    try {
      for (let frame = 0; frame < 4000; frame++) {
        advanceGame(w, s.gameClock, 1 / 24)
        const people = liveWorshippers(w, head)
        if (head.progress > 0 && head.followers >= 2 && people.length >= 2) {
          w.speed = 0
          return {
            turn: w.turn,
            progress: head.progress,
            followers: head.followers,
            required: head.required,
            people: people.map(person => person.id),
          }
        }
      }
      throw new Error(
        `No live worship: ${JSON.stringify({
          head: id,
          progress: head.progress,
          followers: head.followers,
          roster: liveWorshippers(w, head).map(person => person.id),
          message: w.message,
        })}`
      )
    } finally {
      s.onChange()
      s.previous = performance.now()
      s.animate(s.previous)
    }
  }, id)
}

async function panelState(page, id) {
  return page.evaluate(async id => {
    const s = window.testScene,
      head = s.world.shrines.find(candidate => candidate.id === id),
      panel = s.objectPanels.panels.get(id),
      { liveWorshippers } = await import('/app/live-worship.ts'),
      { worshipPanel } = await import('/app/worship-panel.ts'),
      state = JSON.parse(panel.key)[3]
    return {
      id,
      mode: head.mode,
      kind: head.kind,
      label: panel.element.ariaLabel,
      required: head.required,
      followers: head.followers,
      progress: head.progress,
      roster: liveWorshippers(s.world, head).map(person => person.id),
      controls: [...panel.element.querySelectorAll('button:not([hidden])')].map(button =>
        Number(button.dataset.person)
      ),
      state,
      draws: worshipPanel(state).events,
    }
  }, id)
}

async function assertArtworkTransit(page, panel, point) {
  // Geometry probing must not consume the panel's native transit allowance.
  // Resume the ordinary animation owner before the real pointer leaves the head.
  await page.evaluate(() => cancelAnimationFrame(window.testScene.frame))
  let blank, gap
  try {
    blank = await panel.evaluate(node => {
      const r = node.getBoundingClientRect(),
        buttons = [...node.querySelectorAll('button:not([hidden])')].map(button =>
          button.getBoundingClientRect()
        )
      for (let y = r.bottom - 5; y >= r.top + 3; y -= 3)
        for (let x = r.left + 3; x <= r.right - 3; x += 3)
          if (!buttons.some(b => x >= b.left && x <= b.right && y >= b.top && y <= b.bottom))
            return { x, y }
      throw new Error('No blank worship-panel artwork point')
    })
    gap = await page.evaluate(
      ({ point, blank }) => {
        const s = window.testScene,
          renderer = s.renderer.domElement
        let candidate = null
        for (let step = 1; step < 20; step++) {
          const t = step / 20,
            probe = {
              x: point.x + (blank.x - point.x) * t,
              y: point.y + (blank.y - point.y) * t,
            },
            event = { clientX: probe.x, clientY: probe.y }
          if (
            document.elementFromPoint(probe.x, probe.y) === renderer &&
            !s.pickUnit(event) &&
            !s.pickWorldObject(event)
          )
            candidate = probe
        }
        if (!candidate) throw new Error('No exposed battlefield gap between worship head and panel')
        return candidate
      },
      { point, blank }
    )
    await page.mouse.move(point.x, point.y)
  } finally {
    await page.evaluate(() => {
      const scene = window.testScene
      scene.previous = performance.now()
      scene.animate(scene.previous)
    })
  }
  const startFrame = await page.evaluate(() => window.testScene.gameClock.animationFrame)
  await page.mouse.move(gap.x, gap.y)
  const gapState = await page.evaluate(gap => {
    const panel = document.querySelector('.worship-panel:not([hidden])'),
      hit = document.elementFromPoint(gap.x, gap.y)
    return {
      visible: !!panel,
      hovered: !!panel?.matches(':hover'),
      hitInsidePanel: !!panel && (hit === panel || panel.contains(hit)),
      hit: hit?.tagName ?? null,
      frame: window.testScene.gameClock.animationFrame,
    }
  }, gap)
  report.stages['artwork-gap-transit'] = { startFrame, gap, blank, gapState }
  save()
  assert.deepEqual(
    {
      visible: gapState.visible,
      hovered: gapState.hovered,
      hitInsidePanel: gapState.hitInsidePanel,
      hit: gapState.hit,
    },
    { visible: true, hovered: false, hitInsidePanel: false, hit: 'CANVAS' },
    'worship panel must survive the real battlefield gap before pointer entry'
  )
  await page.mouse.move(blank.x, blank.y)
  const entered = await page.evaluate(blank => {
    const panel = document.querySelector('.worship-panel:not([hidden])'),
      hit = document.elementFromPoint(blank.x, blank.y)
    return {
      visible: !!panel,
      hovered: !!panel?.matches(':hover'),
      hitInsidePanel: !!panel && (hit === panel || panel.contains(hit)),
      hit: hit?.tagName ?? null,
      frame: window.testScene.gameClock.animationFrame,
    }
  }, blank)
  assert.deepEqual(
    {
      visible: entered.visible,
      hovered: entered.hovered,
      hitInsidePanel: entered.hitInsidePanel,
      hit: entered.hit,
    },
    { visible: true, hovered: true, hitInsidePanel: true, hit: 'CANVAS' },
    'worship artwork must take pointer ownership immediately after the battlefield gap'
  )
  assert.ok(
    entered.frame - startFrame < 20,
    'synthetic pointer transit exceeded the native panel hold'
  )
  await page.waitForFunction(
    frame => window.testScene.gameClock.animationFrame >= frame + 32,
    entered.frame
  )
  const state = await page.evaluate(blank => {
    const panel = document.querySelector('.worship-panel:not([hidden])'),
      hit = document.elementFromPoint(blank.x, blank.y)
    return {
      visible: !!panel,
      hovered: !!panel?.matches(':hover'),
      hitInsidePanel: !!panel && (hit === panel || panel.contains(hit)),
      hit: hit?.tagName ?? null,
    }
  }, blank)
  return { state, blank, gap, gapState, entered }
}

async function assertSelectionAndFocus(page, panel, headId) {
  const before = await panelState(page, headId),
    button = panel.getByRole('button', { name: /Toggle worshipper/ }).first(),
    person = Number(await button.getAttribute('data-person'))
  assert.deepEqual(
    before.controls,
    before.roster.slice(0, Math.min(before.required, before.followers))
  )
  assert.ok(
    before.roster.length > before.controls.length,
    'exercise full roster versus visible/count-limited slots'
  )
  await button.click()
  assert.deepEqual(await page.evaluate(() => window.testScene.world.selected), [person])
  await button.click({ modifiers: ['Shift'] })
  assert.deepEqual(await page.evaluate(() => window.testScene.world.selected), [])
  await button.click({ modifiers: ['Shift'] })
  const group = await page.evaluate(() => window.testScene.world.selected)
  assert.deepEqual(
    [...group].sort((a, b) => a - b),
    [...before.roster].sort((a, b) => a - b)
  )
  // Clearing selection moves off the panel; retain the setup frame until focus owns it.
  await ownedInputFrame(page, async () => {
    await page.mouse.click(1000, 900, { button: 'right' })
    await page.waitForFunction(() => window.testScene.world.selected.length === 0)
    await button.focus()
    assert.equal(await button.evaluate(node => document.activeElement === node), true)
  })
  const camera = await page.evaluate(() => ({ ...window.testScene.cameraPosition }))
  await page.keyboard.down('d')
  try {
    await page.waitForFunction(before => {
      const p = window.testScene.cameraPosition
      return p.x !== before.x || p.y !== before.y
    }, camera)
  } finally {
    await page.keyboard.up('d')
  }
  await button.click({ button: 'right' })
  await page.waitForFunction(id => !!window.testScene.objectPanels.panels.get(id)?.key, person)
  const focus = await page.evaluate(id => {
    const s = window.testScene,
      unit = s.world.units.find(u => u.id === id),
      panel = s.objectPanels.panels.get(id)
    return {
      target: { x: s.cameraMotion.target.x, y: s.cameraMotion.target.y },
      unit: { x: unit.native.x & 65535, y: unit.native.y & 65535 },
      personPanel: panel.kind,
      pointerEvents: getComputedStyle(panel.element).pointerEvents,
      worshipClass: panel.element.classList.contains('worship-panel'),
    }
  }, person)
  assert.deepEqual(focus.target, focus.unit)
  assert.equal(focus.personPanel, 'person')
  assert.equal(
    focus.pointerEvents,
    'none',
    'ordinary person artwork must remain pointer-transparent'
  )
  assert.equal(focus.worshipClass, false)
  return { person, group, focus, before }
}

// Read through the current panel owner, never through a locator that may disappear.
async function edgeSnapshot(page, id, originalNode, originalLabel) {
  return page.evaluate(
    async ({ id, originalNode, originalLabel }) => {
      const s = window.testScene,
        head = s.world.shrines.find(h => h.id === id),
        owner = s.objectPanels.panels.get(id),
        node = owner?.element,
        active = document.activeElement,
        { nativePosition } = await import('/app/model.ts'),
        point =
          head && owner
            ? s.screen(head, (nativePosition(s.world, head).h + owner.offset) / 45)
            : null,
        rect = element => {
          if (!element) return null
          const r = element.getBoundingClientRect()
          return {
            left: r.left,
            top: r.top,
            right: r.right,
            bottom: r.bottom,
            width: r.width,
            height: r.height,
          }
        },
        panel = rect(node),
        renderer = rect(s.renderer.domElement),
        style = node && getComputedStyle(node),
        anchor = point && {
          x: renderer.left + ((point.x + 1) * renderer.width) / 2,
          y: renderer.top + ((1 - point.y) * renderer.height) / 2,
        },
        tail = panel && { x: panel.left + panel.width / 2, y: panel.bottom },
        headVisible = !!head && s.visible(head),
        visible =
          !!node?.isConnected &&
          !node.hidden &&
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          panel.width > 0 &&
          panel.height > 0
      return {
        frame: s.gameClock.animationFrame,
        worldTurn: s.world.turn,
        camera: { ...s.cameraPosition },
        viewPoint: { ...s.viewPoint },
        keys: [...s.keys],
        panelPresent: !!owner,
        panels: [...s.objectPanels.panels.keys()],
        headPresent: !!head,
        headVisible,
        visible,
        connected: !!node?.isConnected,
        originalConnected: !!originalNode?.isConnected,
        sameNode: node === originalNode,
        hidden: node?.hidden ?? null,
        label: node?.ariaLabel ?? null,
        originalLabel,
        labelChanged: !!node && node.ariaLabel !== originalLabel,
        role: node?.getAttribute('role') ?? null,
        display: style?.display ?? null,
        visibility: style?.visibility ?? null,
        hovered: !!node?.matches(':hover'),
        focusInside: !!node?.contains(active),
        active: active && {
          tag: active.tagName,
          label: active.getAttribute('aria-label'),
          person: active.getAttribute('data-person'),
        },
        phase: owner?.phase ?? null,
        remaining: owner?.remaining ?? null,
        inputMask: s.world.inputMask,
        overview: s.overviewActive,
        panel,
        renderer,
        projected: point && { x: point.x, y: point.y, z: point.z },
        anchor,
        tail,
        expected: panel &&
          anchor && {
            x: Math.max(
              renderer.left + panel.width / 2,
              Math.min(renderer.right - panel.width / 2, anchor.x)
            ),
            y: Math.max(renderer.top + panel.height, Math.min(renderer.bottom, anchor.y)),
          },
        clamped:
          visible &&
          !!anchor &&
          (Math.abs(tail.x - anchor.x) > 1 || Math.abs(tail.y - anchor.y) > 1),
        scale: style && Number.parseFloat(style.getPropertyValue('--hud-scale')),
        matchingVisibleGroups: [...document.querySelectorAll('[role="group"]')].filter(
          group =>
            group.getAttribute('aria-label') === originalLabel &&
            !group.hidden &&
            group.getBoundingClientRect().width > 0
        ).length,
      }
    },
    { id, originalNode, originalLabel }
  )
}

async function assertEdgeClamping(page, id) {
  const samples = []
  report.stages['hud-edge-clamping'] = samples
  for (const hudSize of ['auto', '1']) {
    await setHudSize(page, hudSize)
    const { panel } = await openShrinePanel(page, id, true),
      originalNode = await panel.elementHandle(),
      originalLabel = await panel.getAttribute('aria-label'),
      trial = { hudSize, secondsPerStep: 1 / 24, steps: [] }
    samples.push(trial)
    try {
      await ownedInputFrame(page, async () => {
        await panel
          .getByRole('button', { name: /Toggle worshipper/ })
          .first()
          .focus()
        let geometry = await edgeSnapshot(page, id, originalNode, originalLabel)
        const center = geometry
        trial.steps.push({ step: 0, ...geometry })
        save()
        assert.equal(
          center.visible && center.headVisible,
          true,
          'focused head and panel must be visible'
        )
        assert.equal(center.clamped, false, 'focused height-offset anchor must start unclamped')
        for (let step = 1; step <= 120 && !geometry.clamped; step++) {
          // Wall-clock key holds can skip the visible clamp window on a busy renderer.
          // Keep real keyboard input, but sample every ordinary 24 Hz scene step.
          await page.keyboard.down('d')
          try {
            await page.evaluate(() => {
              const scene = window.testScene
              try {
                scene.animate(scene.previous + 1000 / 24)
              } finally {
                cancelAnimationFrame(scene.frame)
              }
            })
          } finally {
            await page.keyboard.up('d')
          }
          geometry = await edgeSnapshot(page, id, originalNode, originalLabel)
          trial.steps.push({ step, ...geometry })
          save()
          assert.equal(
            geometry.panelPresent && geometry.connected && geometry.sameNode,
            true,
            `${hudSize}: panel owner/DOM identity changed at step ${step}`
          )
          assert.equal(
            geometry.visible && geometry.headVisible,
            true,
            `${hudSize}: panel became hidden before a clamped sample at step ${step}`
          )
          assert.equal(
            geometry.focusInside,
            true,
            `${hudSize}: worshipper focus must retain the panel`
          )
        }
        assert.equal(geometry.clamped, true, `${hudSize}: reach a real clamped edge`)
        assert.ok(
          geometry.frame > center.frame,
          'ordinary animation clock must advance during panning'
        )
        assert.equal(
          geometry.worldTurn,
          center.worldTurn,
          'edge measurement must not advance held simulation'
        )
        assert.ok(Math.abs(geometry.tail.x - geometry.expected.x) < 0.6)
        assert.ok(Math.abs(geometry.tail.y - geometry.expected.y) < 0.6)
        assert.ok(geometry.panel.left >= geometry.renderer.left - 0.5)
        assert.ok(geometry.panel.top >= geometry.renderer.top - 0.5)
        assert.ok(geometry.panel.right <= geometry.renderer.right + 0.5)
        assert.ok(geometry.panel.bottom <= geometry.renderer.bottom + 0.5)
        Object.assign(trial, { center, ...geometry })
        save()
      })
    } finally {
      await originalNode.dispose()
    }
  }
  assert.notEqual(samples[0].scale, samples[1].scale, 'exercise two actual HUD scales')
  return samples
}

async function checkpoint(page, id) {
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByRole('button', { name: 'Save checkpoint', exact: true }).click()
  await page.waitForFunction(() => window.testStore.hasCheckpoint())
  await page.evaluate(id => {
    window.oldScene = window.testScene
    window.oldPanel = window.testScene.objectPanels.panels.get(id).element
    window.oldSelection = [...window.testScene.world.selected]
  }, id)
  await page.getByRole('button', { name: 'Load checkpoint', exact: true }).click()
  await bindGame(page)
  await page.waitForFunction(
    () => window.testScene !== window.oldScene && !window.testScene.world.inputMask
  )
  const cleanup = await page.evaluate(() => ({
    oldConnected: window.oldPanel.isConnected,
    oldPanelCount: window.oldScene.objectPanels.panels.size,
    level: window.testScene.world.outcome.level,
  }))
  assert.deepEqual(cleanup, { oldConnected: false, oldPanelCount: 0, level: 1 })
  const { panel } = await openShrinePanel(page, id),
    controls = await assertSelectionAndFocus(page, panel, id)
  assert.equal(
    await page.evaluate(
      () => JSON.stringify(window.oldScene.world.selected) === JSON.stringify(window.oldSelection)
    ),
    true
  )
  return { cleanup, controls }
}

async function modeThreePlaceholder(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }),
    page = await context.newPage(),
    errors = []
  page.on('pageerror', error => errors.push(error.message))
  try {
    await page.goto(process.env.POPULOUS_URL, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Tutorial', exact: true }).click()
    await bindGame(page)
    await page.waitForFunction(
      () => !window.testScene.overviewStage && window.testScene.world.ai.variables[9] === 2
    )
    await page.keyboard.press('Enter')
    await page.waitForFunction(
      () => !window.testScene.overviewStage && window.testScene.world.ai.variables[9] === 3
    )
    const angle = await page.evaluate(() => window.testScene.cameraPosition.angle)
    await page.keyboard.down('ArrowLeft')
    try {
      await page.waitForFunction(a => window.testScene.cameraPosition.angle !== a, angle)
    } finally {
      await page.keyboard.up('ArrowLeft')
    }
    const x = await page.evaluate(() => window.testScene.cameraPosition.x)
    await page.mouse.move(1439, 500)
    await page.waitForFunction(x => window.testScene.cameraPosition.x !== x, x)
    await page.mouse.move(800, 500)
    await page.waitForFunction(
      () => window.testScene.world.ai.variables[9] === 6 && !window.testScene.world.inputMask
    )
    await waitHud(page)
    const id = await page.evaluate(
      () => window.testScene.world.shrines.find(h => h.name === 'Obelisk')?.id
    )
    assert.ok(id, 'normal Tutorial must create its Obelisk')
    await openShrinePanel(page, id)
    const state = await panelState(page, id)
    assert.equal(state.mode, 3)
    assert.equal(state.state.shamanOnly, true)
    assert.equal(state.state.enabled, true)
    assert.deepEqual(state.state.people, [])
    assert.deepEqual(state.controls, [])
    assert.ok(state.draws.some(e => e[0] === 'sprite' && e[1] === 80 && e[4] === 172 && e[5]))
    assert.deepEqual(errors, [])
    return state
  } finally {
    await context.close()
  }
}

async function acceptance() {
  assert.ok(
    process.env.POPULOUS_URL,
    'Supply the owned server URL (use the shared queue supervisor)'
  )
  const browser = await chromium.launch({ headless: true })
  let page
  try {
    const game = await openGame(browser, 1)
    page = game.page
    page.setDefaultTimeout(20_000)
    await waitHud(page)
    await waitNormalFollowerInput(page)
    const id = await page.evaluate(
      () => window.testScene.world.shrines.find(h => h.kind === 'bridge')?.id
    )
    assert.ok(id, 'fresh Mission 1 authored Land Bridge head')
    await stage('normal-input', async () => {
      await page.getByLabel('Select brave').click({ modifiers: ['Shift'] })
      const selection = await page.evaluate(() => {
        const s = window.testScene,
          w = s.world
        return {
          selected: [...w.selected],
          turn: w.turn,
          inputMask: w.inputMask,
          overviewStage: s.overviewStage,
          overviewActive: s.overviewActive,
          gameFlags: w.manaWorld.gameFlags,
          paused: w.paused,
          status: w.status,
        }
      })
      report.stages['normal-input'] = { id, selection }
      save()
      assert.ok(selection.selected.length >= 2, 'normal HUD selection must pass its input gates')
      return ownedInputFrame(page, async () => {
        const point = await renderedShrinePoint(page, id)
        await page.mouse.click(point.x, point.y)
        const afterClick = await page.evaluate(async selected => {
          const s = window.testScene,
            w = s.world,
            { currentPersonOrder } = await import('/app/person-orders.ts')
          return {
            turn: w.turn,
            selected: [...w.selected],
            lastOrderTurn: w.lastOrderTurn,
            message: w.message,
            inputMask: w.inputMask,
            overviewStage: s.overviewStage,
            orders: selected.map(id => {
              const unit = w.units.find(u => u.id === id),
                person = unit?.native ?? unit?.entry?.person ?? unit?.builder?.person,
                order = person && currentPersonOrder(w.buildingOrders, person)
              return {
                id,
                work: unit?.work,
                state: person?.state ?? null,
                model: order?.model ?? null,
                target: order?.a ?? null,
              }
            }),
          }
        }, selection.selected)
        const result = { id, selection, point, afterClick }
        report.stages['normal-input'] = result
        save()
        assert.ok(
          afterClick.orders.filter(o => o.model === 27 && o.target === id && o.work === id)
            .length >= 2,
          `Real head click must attach worship to at least two selected people: ${JSON.stringify(result)}`
        )
        return result
      })
    })
    await stage('live-worship', () => advanceWorship(page, id))
    const opened = await openShrinePanel(page, id)
    await stage('artwork-gap-transit', async () => {
      const result = await assertArtworkTransit(page, opened.panel, opened.point)
      assert.deepEqual(result.state, {
        visible: true,
        hovered: true,
        hitInsidePanel: true,
        hit: 'CANVAS',
      })
      await page.screenshot({ path: resolve(output, 'ordinary-head.png') })
      return result
    })
    await stage('person-controls', () => assertSelectionAndFocus(page, opened.panel, id))
    await stage('hud-edge-clamping', () => assertEdgeClamping(page, id))
    await stage('checkpoint-handlers', () => checkpoint(page, id))
    await stage('vault-informational', async () => {
      const vaultId = await page.evaluate(
        () => window.testScene.world.shrines.find(h => h.kind === 'vault')?.id
      )
      assert.ok(vaultId)
      await openShrinePanel(page, vaultId)
      const state = await panelState(page, vaultId)
      assert.equal(state.state.shamanOnly, true)
      assert.deepEqual(state.controls, [])
      assert.match(state.label, /waiting for shaman/)
      return state
    })
    assert.deepEqual(game.errors, [])
    await game.page.context().close()
    page = null
    await stage('mode3-placeholder', () => modeThreePlaceholder(browser))
    report.status = 'passed'
    save()
    console.log(
      'PASS: authored normal Shrine input/progress, full-roster controls, artwork transit, two-scale renderer clamp, checkpoint cleanup, mode-3 placeholder and informational Vault'
    )
  } catch (error) {
    report.status = 'failed'
    report.error = error.stack ?? String(error)
    save()
    if (page && !page.isClosed())
      await page.screenshot({ path: resolve(output, 'failure.png') }).catch(() => {})
    throw error
  } finally {
    await browser.close()
  }
}

if (process.env.PND_QUEUE_CLEANUP) {
  await superviseBrowserCheck({
    checkerCommand: [process.execPath, fileURLToPath(import.meta.url)],
    readinessTimeoutMs: 120_000,
  })
} else {
  await acceptance()
}
