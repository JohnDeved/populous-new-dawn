import { chooseHudSize } from '../browser-native-options.mjs'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { checkPickingPathReadout, pickingPathMetricIds } from './picking-path-readout.mjs'
import {
  assertM2DiagnosticLayout,
  assertM2DiagnosticFrame,
  m2DiagnosticLayout,
  m2RectanglesOverlap,
} from './m2-pointer-f8.mjs'

export const compactMessageCases = Object.freeze([
  {
    preference: '4',
    label: '400%',
    sizes: [
      [900, 360],
      [640, 480],
    ],
  },
  {
    preference: 'auto',
    label: 'Automatic',
    sizes: [
      [900, 360],
      [640, 480],
    ],
  },
])

export const diagnosticMetricIds = Object.freeze([
  'fps',
  'state',
  'scale',
  'frame',
  'peak',
  'callback',
  'simulation',
  'render',
  'pointer',
  'pointer-tail',
  'other',
  'calls',
  'window',
  'raf-tail',
  'cpu-tail',
  'cpu-peak',
  'renderer',
  'cores',
  'memory',
  'heap',
  'export-status',
])

// Read real text fragments, including wrapping, rather than only an outer box.
// This function is serialized into the page and never changes DOM or game state.
export function compactMessageWitness() {
  const diagnosticGraph = document.querySelector('.fps-graph')
  const rect = node => {
    const r = node.getBoundingClientRect()
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
  }
  const visible = node =>
    node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden'
  const clips = node => {
    const result = []
    for (let parent = node; parent; parent = parent.parentElement) {
      const style = getComputedStyle(parent)
      const paint = /\b(paint|content|strict)\b/.test(style.contain)
      const clipX = paint || /^(hidden|clip|scroll|auto)$/.test(style.overflowX)
      const clipY = paint || /^(hidden|clip|scroll|auto)$/.test(style.overflowY)
      if (!clipX && !clipY && style.clipPath === 'none' && style.clip === 'auto') continue
      const bounds = rect(parent)
      result.push({
        name: parent.className || parent.tagName,
        diagnosticViewport: parent === diagnosticGraph,
        diagnosticAncestor: !!diagnosticGraph && parent !== diagnosticGraph && parent.contains(diagnosticGraph),
        left: bounds.left + parent.clientLeft,
        top: bounds.top + parent.clientTop,
        right: bounds.left + parent.clientLeft + parent.clientWidth,
        bottom: bounds.top + parent.clientTop + parent.clientHeight,
        clipX,
        clipY,
        overflowX: style.overflowX,
        overflowY: style.overflowY,
        contain: style.contain,
        clipPath: style.clipPath,
        clip: style.clip,
      })
    }
    return result
  }
  const textRuns = node => {
    const runs = []
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT)
    for (let part = walker.nextNode(); part; part = walker.nextNode()) {
      if (!part.textContent.trim() || !visible(part.parentElement)) continue
      const range = document.createRange()
      range.selectNodeContents(part)
      runs.push({
        text: part.textContent,
        fragments: [...range.getClientRects()].map(r => ({
          left: r.left, top: r.top, right: r.right, bottom: r.bottom,
        })),
        clips: clips(part.parentElement),
      })
    }
    return runs
  }
  const text = node => {
    const bounds = rect(node),
      style = getComputedStyle(node),
      glyphs = [...node.querySelectorAll('[data-popup-glyph]')],
      fragments = glyphs.length ? glyphs.map(rect) : textRuns(node).flatMap(run => run.fragments)
    return {
      ...bounds,
      text: node.textContent,
      fragments,
      clips: clips(node),
      fontSize: Number.parseFloat(style.fontSize),
      lineHeight: style.lineHeight,
      clientSize: [node.clientWidth, node.clientHeight],
      scrollSize: [node.scrollWidth, node.scrollHeight],
      contentFits: node.scrollWidth <= node.clientWidth && node.scrollHeight <= node.clientHeight,
    }
  }
  return {
    preference: localStorage.getItem('hud-size'),
    scale: getComputedStyle(document.querySelector('.game-shell')).getPropertyValue('--hud-scale'),
    viewport: [innerWidth, innerHeight],
    // Route 603 now shares the native bitmap tooltip owner. This campaign/F8
    // episode must never admit the retired browser cards, including route cards.
    inventedMessageCards: document.querySelectorAll('.world-message, .route-notice').length,
    campaignText: [...document.querySelectorAll('.campaign-messages details[open] [data-campaign-text]')]
      .filter(visible)
      .map(text),
    diagnosticRows: [...document.querySelectorAll('.fps-graph dl>div')].filter(visible).map(text),
    diagnosticFields: [...document.querySelectorAll('.fps-graph [data-metric]')]
      .filter(visible)
      .map(node => ({ metric: node.dataset.metric, ...text(node) })),
    diagnosticTextRuns: document.querySelector('.fps-graph')
      ? textRuns(document.querySelector('.fps-graph')) : [],
    pause: document.querySelector('[data-original-pause-status]') && rect(document.querySelector('[data-original-pause-status]')),
    overflow:
      document.documentElement.scrollWidth > innerWidth ||
      document.documentElement.scrollHeight > innerHeight,
    statusLayout: getComputedStyle(document.querySelector('.game-status')).display,
  }
}

// All serialized observers are read-only. Compose their actual source, rather
// than copying the layout/text rules into a faster but weaker second witness.
export function compactDiagnosticWorld() {
  const scene = window.testSceneRef.current, world = scene.world
  return { paused: world.paused, turn: world.turn, selected: [...world.selected], mode: world.mode,
    randomState: world.randomState, cosmeticRandom: world.cosmeticRandom,
    camera: { ...scene.cameraPosition }, bearing: scene.cameraBearing, zoom: scene.viewZoom,
    viewPoint: { ...scene.viewPoint }, messages: structuredClone(world.messages),
    sameScene: scene === window.testScene && world === window.testStore.getWorld(),
    storeTurn: window.testStore.getWorld().turn }
}

function settledCompactSnapshot(options, readLayout, readText, readWorld) {
  const { state = 'visible', scrollAfter, scrollTop, timeout = 10000 } = options
  if (!['visible', 'hidden'].includes(state) || !Number.isFinite(timeout) || timeout <= 0 ||
      (scrollAfter !== undefined && !Number.isFinite(scrollAfter)) ||
      (scrollTop !== undefined && scrollTop !== 0) ||
      (state === 'hidden' && (scrollAfter !== undefined || scrollTop !== undefined)))
    throw Error('Invalid compact snapshot condition')
  return new Promise((resolve, reject) => {
    let frame, settledFrames = 0
    const deadline = performance.now() + timeout
    const timeoutError = () => Error(`Compact snapshot timed out waiting for ${JSON.stringify(options)}`)
    const withinDeadline = () => { if (performance.now() >= deadline) throw timeoutError() }
    const fail = error => { clearTimeout(timer); cancelAnimationFrame(frame); reject(error) }
    const timer = setTimeout(() => fail(timeoutError()), timeout)
    const sample = () => {
      try {
        withinDeadline()
        const graph = document.querySelector('.fps-graph'), bounds = graph?.getBoundingClientRect()
        const visible = !!bounds && bounds.width > 0 && bounds.height > 0 &&
          !['hidden', 'collapse'].includes(getComputedStyle(graph).visibility)
        const ready = state === 'hidden' ? !visible : visible &&
          /\d+\.\d \/ \d+\.\d ms/.test(graph.querySelector('[data-metric="pointer-tail"]')?.textContent ?? '') &&
          (scrollAfter === undefined || graph.scrollTop > scrollAfter) &&
          (scrollTop === undefined || graph.scrollTop === scrollTop)
        // A stale hidden/progress observation cannot survive the settle window.
        // Keep the same two RAF frames after readiness, without extra RPCs.
        if (!ready) settledFrames = 0
        else if (settledFrames++ === 2) {
          const result = { layout: visible ? readLayout(graph) : null, witness: readText(), world: readWorld() }
          withinDeadline()
          clearTimeout(timer)
          resolve(result)
          return
        }
        frame = requestAnimationFrame(sample)
      } catch (error) { fail(error) }
    }
    sample()
  })
}

export function compactMessageSnapshotSource(options = {}) {
  return `(${settledCompactSnapshot.toString()})(${JSON.stringify(options)},
    ${m2DiagnosticLayout.toString()}, ${compactMessageWitness.toString()}, ${compactDiagnosticWorld.toString()})`
}

export const readCompactMessageSnapshot = (page, options) => page.evaluate(compactMessageSnapshotSource(options))

const contains = (box, fragment, x = true, y = true) =>
  (!x || (fragment.left >= box.left - 0.5 && fragment.right <= box.right + 0.5)) &&
  (!y || (fragment.top >= box.top - 0.5 && fragment.bottom <= box.bottom + 0.5))

const fullyVisible = (layout, node, width, height) => {
  const viewport = { left: 0, top: 0, right: width, bottom: height }
  return [node, ...node.fragments].filter(fragment => Number.isFinite(fragment.top)).every(fragment =>
    contains(layout, fragment) && contains(viewport, fragment) &&
    node.clips.every(clip => contains(clip, fragment, clip.clipX, clip.clipY)))
}

function assertCompactMessageSample(layout, witness, width, height, scrolling) {
  if (scrolling) {
    assertM2DiagnosticFrame(layout, width, height)
    assert.ok(layout.scroll.height > layout.scroll.clientHeight, 'Only real vertical overflow may use scroll coverage')
    assert.ok(layout.scroll.width <= layout.scroll.clientWidth, 'F8 must never scroll or clip horizontally')
    assert.equal(layout.scroll.left, 0)
  } else assertM2DiagnosticLayout(layout, width, height)
  assert.equal(witness.overflow, false, 'No document scroll overflow in either dimension')
  assert.equal(witness.inventedMessageCards, 0, 'Browser-authored world-message cards must be absent')
  assert.ok(witness.campaignText.length > 0, 'Authored campaign text must be present')
  assert.equal(witness.diagnosticRows.length, 15, 'Every shipped diagnostic row must be observed')
  assert.deepEqual(
    witness.diagnosticFields.map(node => node.metric),
    diagnosticMetricIds,
    'Every shipped diagnostic value/caption must remain present'
  )
  for (const node of witness.diagnosticFields)
    assert.ok(
      node.left >= layout.left &&
        (scrolling || node.top >= layout.top) &&
        node.right <= layout.right &&
        (scrolling || node.bottom <= layout.bottom),
      'Diagnostic fields must fit F8'
    )
  const strictBoxes = [
    ...witness.campaignText,
    ...witness.diagnosticRows,
  ]
  const assertFragment = (fragment, node, diagnostic) => {
    const simultaneous = !diagnostic || !scrolling
    assert.ok(contains({ left: 0, top: 0, right: width, bottom: height }, fragment, true, simultaneous), 'Text must fit viewport')
    if (diagnostic) assert.ok(contains(layout, fragment, true, simultaneous), 'Diagnostic text must fit F8')
    for (const clip of node.clips) {
      // Do not claim rectangular evidence proves an unmeasured shape clip.
      assert.equal(clip.clipPath, 'none', 'Shape clipping needs separate geometry evidence')
      assert.equal(clip.clip, 'auto', 'Legacy clipping needs separate geometry evidence')
      const scrollClip = diagnostic && scrolling && clip.diagnosticViewport && clip.overflowY === 'auto'
      const outerClip = diagnostic && scrolling && clip.diagnosticAncestor
      if (outerClip) assert.ok(contains(clip, layout, clip.clipX, clip.clipY), 'The complete F8 viewport must fit every outer clip')
      assert.ok(contains(clip, fragment, clip.clipX, clip.clipY && !scrollClip && !outerClip), `Text must fit actual clip: ${clip.name}`)
    }
  }
  for (const node of [
    ...strictBoxes,
    ...witness.diagnosticFields.filter(node => node.metric !== 'export-status' || node.text.trim()),
  ]) {
    assert.ok(node.text.trim() && node.fragments.length, 'Visible text fragments are required')
    if (witness.campaignText.includes(node))
      assert.ok(layout.campaignPanels.some(panel => contains(panel, node)), 'Campaign glyph bounds must stay inside their native panel')
    assert.equal(node.contentFits, true, 'Text must not overflow its own box')
    assert.ok(node.left >= 0 && node.right <= width &&
      (scrolling && !witness.campaignText.includes(node) || node.top >= 0 && node.bottom <= height))
    for (const fragment of node.fragments) {
      if (strictBoxes.includes(node))
        assert.ok(contains(node, fragment), `Wrapped text must remain inside its box: ${node.text}`)
      // A font's Range can extend beyond its line-height box without clipping.
      // Keep its real fragments and validate actual clipping/paint boundaries.
      assertFragment(fragment, node, Boolean(node.metric) || witness.diagnosticRows.includes(node))
    }
  }
  assert.ok(witness.diagnosticTextRuns.length, 'Distinct diagnostic text runs are required')
  for (const [index, run] of witness.diagnosticTextRuns.entries()) {
    assert.ok(run.text.trim() && run.fragments.length, 'Diagnostic text runs must be visible')
    for (const fragment of run.fragments) {
      assertFragment(fragment, run, true)
      for (const other of witness.diagnosticTextRuns.slice(index + 1))
        for (const neighbor of other.fragments)
          assert.equal(m2RectanglesOverlap(fragment, neighbor), false, 'Distinct diagnostic text must not overlap')
      // Off-scroll text is not painted over the native popup. Its horizontal
      // geometry and every non-scroll clipping ancestor were checked above.
      const painted = scrolling ? { ...fragment, top: Math.max(fragment.top, layout.top),
        bottom: Math.min(fragment.bottom, layout.bottom) } : fragment
      if (painted.bottom > painted.top) for (const ui of [layout.pause, ...layout.interactiveUi])
        assert.equal(m2RectanglesOverlap(painted, ui), false, 'Diagnostic text must not obscure unrelated UI')
    }
  }
  for (const ui of layout.interactiveUi)
    assert.equal(
      m2RectanglesOverlap(layout, ui),
      false,
      `F8 must not obscure interactive UI: ${ui.name}`
    )

}

// Require cumulative actual viewport evidence, not merely overflow:auto or DOM
// presence. Nonoverflowing layouts retain all previous simultaneous-fit checks.
export function assertCompactMessageWitness(layout, witness, width, height, scrollSamples = []) {
  const scrolling = layout.scroll?.height > layout.scroll?.clientHeight
  const samples = [{ layout, witness }, ...scrollSamples]
  for (const sample of samples)
    assertCompactMessageSample(sample.layout, sample.witness, width, height, scrolling)
  if (!scrolling) return
  assert.equal(layout.scroll.top, 0, 'F8 opens at the top')
  assert.ok(scrollSamples.some(sample => sample.layout.scroll.top > 0), 'Actual public F8 scrolling is required')
  const last = samples.at(-1).layout.scroll
  assert.ok(last.top >= last.height - last.clientHeight - 1, 'Public scroll must reach the end')
  for (const [index, sample] of samples.entries()) {
    assert.deepEqual([sample.layout.left, sample.layout.top, sample.layout.right, sample.layout.bottom],
      [layout.left, layout.top, layout.right, layout.bottom], 'Scrolling cannot resize or move F8')
    assert.deepEqual([sample.layout.scroll.width, sample.layout.scroll.height, sample.layout.scroll.clientWidth, sample.layout.scroll.clientHeight],
      [layout.scroll.width, layout.scroll.height, layout.scroll.clientWidth, layout.scroll.clientHeight], 'Scrolling cannot remove overflow content')
    if (index) assert.ok(sample.layout.scroll.top > samples[index - 1].layout.scroll.top, 'Each wheel sample must progress')
    assert.equal(sample.witness.diagnosticTextRuns.length, witness.diagnosticTextRuns.length, 'No diagnostic text may disappear during scrolling')
    assert.deepEqual(sample.witness.campaignText, witness.campaignText, 'Scrolling F8 must not move or change native campaign text')
  }
  for (const name of ['diagnosticRows', 'diagnosticFields', 'diagnosticTextRuns'])
    for (const [index, node] of witness[name].entries())
      assert.ok(samples.some(sample => fullyVisible(sample.layout, sample.witness[name][index], width, height)),
        `Public scroll must expose every ${name} entry: ${node.metric ?? node.text}`)
  assert.ok(samples.some(sample => sample.layout.exportFits && sample.layout.exportActionable),
    'Public scroll must expose the complete hit-testable export button and status')
}

// The only mutations here are real pointer/wheel inputs. Capture overlapping
// viewports so a row/text run crossing one boundary is fully seen in the next.
export async function scrollCompactDiagnostics(page, sample, width, height) {
  sample.scrollSamples = []
  let layout = sample.layout
  if (layout.scroll.height <= layout.scroll.clientHeight) return
  await page.mouse.move((layout.left + layout.right) / 2, (layout.top + layout.bottom) / 2)
  let snapshot = await readCompactMessageSnapshot(page)
  sample.scrollBefore = snapshot.world
  assert.equal(sample.scrollBefore.paused, true)
  assert.equal(sample.scrollBefore.sameScene, true)
  // A preceding real export or viewport resize may retain a scroll offset.
  // Restore the header through the same native wheel input, never scrollTop writes.
  if (layout.scroll.top > 0) {
    sample.beforeScrollReset = { layout: sample.layout, witness: sample.witness }
    await page.mouse.wheel(0, -layout.scroll.height)
    snapshot = await readCompactMessageSnapshot(page, { scrollTop: 0 })
    sample.layout = layout = snapshot.layout
    sample.witness = snapshot.witness
    assert.deepEqual(snapshot.world, sample.scrollBefore, 'Native F8 scrolling preserves world, selection, camera and messages')
  }
  while (layout.scroll.top < layout.scroll.height - layout.scroll.clientHeight - 1) {
    await page.mouse.wheel(0, Math.max(1, Math.floor(layout.scroll.clientHeight / 2)))
    snapshot = await readCompactMessageSnapshot(page, { scrollAfter: layout.scroll.top })
    const { witness } = snapshot
    layout = snapshot.layout
    sample.scrollSamples.push(snapshot)
    assertCompactMessageSample(layout, witness, width, height, true)
    assert.deepEqual(snapshot.world, sample.scrollBefore, 'Native F8 scrolling preserves world, selection, camera and messages')
  }
  sample.scrollAfter = snapshot.world
  assert.deepEqual(sample.scrollAfter, sample.scrollBefore, 'Native F8 scrolling preserves world, selection, camera and messages')
}

async function selectHudPreference(page, preference) {
  const button = name => page.getByRole('button', { name, exact: true })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await button('Menu').click()
  await button('Options').click()
  await button('Browser compatibility and help').click()
  const setting = page.getByRole('button', { name: /^HUD size : </ })
  // Start with 400%, then wrap once to Automatic: both values are persisted by
  // real public changes without cycling through the same six settings twice.
  await chooseHudSize(page, preference)
  assert.equal(await setting.getAttribute('data-hud-size'), preference)
  assert.equal(await page.evaluate(() => localStorage.getItem('hud-size')), preference,
    'The displayed preference must be persisted by its public setting action')
  await button('Back to Options').click()
  await button('Back').click()
  await button('Continue Game').click()
  await page.locator('dialog[data-original-pause-menu]').waitFor({ state: 'hidden' })
}

export async function checkCompactMessages({ page, output, stage, report }) {
  report.limits = [
    'Collapsed coexistence: Automatic and 400% at 900x360 and 640x480; not universal viewport support or performance acceptance.',
  ]
  const baseline = await page.evaluate(() => ({
    world: window.testStore.getWorld().turn,
    scene: window.testSceneRef.current === window.testScene,
  }))
  assert.equal(baseline.scene, true)
  for (const { preference, label, sizes } of compactMessageCases) {
    // Use the shipped setting, not localStorage seeding or forced DOM geometry.
    await selectHudPreference(page, preference)
    stage(`compact-preference-${preference}-selected`)
    for (const [width, height] of sizes) {
      await page.setViewportSize({ width, height })
      const { witness: before } = await readCompactMessageSnapshot(page, { state: 'hidden' })
      assert.equal(before.preference, preference)
      assert.equal(before.statusLayout, 'contents', 'Ordinary layout must remain ungrouped')
      await page.keyboard.press('F8')
      const { layout, witness } = await readCompactMessageSnapshot(page)
      assert.equal(witness.preference, preference)
      const screenshot = `compact-message-${preference}-${width}x${height}.png`
      const sample = {
        preference,
        label,
        viewport: [width, height],
        screenshot,
        before,
        layout,
        witness,
      }
      report.cases.push(sample)
      await page.screenshot({ path: resolve(output, screenshot) })
      await scrollCompactDiagnostics(page, sample, width, height)
      if (sample.scrollSamples.length) {
        sample.scrolledScreenshot = `compact-message-${preference}-${width}x${height}-scrolled.png`
        await page.screenshot({ path: resolve(output, sample.scrolledScreenshot) })
      }
      assertCompactMessageWitness(sample.layout, sample.witness, width, height, sample.scrollSamples)
      await page.keyboard.press('F8')
      const { witness: restored, world } = await readCompactMessageSnapshot(page, { state: 'hidden' })
      sample.restored = restored
      assert.deepEqual(
        restored,
        before,
        'F8 off must restore ordinary text, geometry and typography'
      )
      assert.equal(
        world.storeTurn,
        baseline.world,
        'Public settings and diagnostics preserve the paused world'
      )
      assert.equal(world.sameScene, true)
      stage(`compact-${preference}-${width}x${height}-captured-and-restored`)
    }
  }
  return report
}

export async function checkExpandedPickingPaths({ page, output, stage, report }) {
  const graph = page.locator('.fps-graph')
  report.limits = [
    'Expanded picking: independent paused M2 context with campaign text publicly closed and restored; not universal viewport support or performance acceptance.',
  ]
  // Use an independently admitted real bundled scene, not the remaining time in
  // the legacy compact episode. Keep the public close/restore controls intact.
  // The original appended episode inherited 400%; select that same preference
  // publicly in this fresh context rather than silently testing only defaults.
  await selectHudPreference(page, '4')
  stage('expanded-preference-4-selected')
  const openCampaignDetails = []
  for (const detail of await page.locator('.campaign-messages details').all())
    if (await detail.getAttribute('open') !== null) {
      openCampaignDetails.push(detail)
      await detail.locator('summary').click()
    }
  await page.keyboard.press('F8')
  await graph.waitFor({ state: 'visible' })
  await page.waitForFunction(() => /^\d+\.\d{2}$/.test(document.querySelector('[data-metric="pick-numeric"]')?.textContent ?? ''))
  const beforePicking = await page.evaluate(() => {
    const scene = window.testSceneRef.current, world = scene.world
    if (!world.paused || scene !== window.testScene) throw Error('Expected the existing paused scene')
    cancelAnimationFrame(scene.frame)
    return { turn: world.turn, randomState: world.randomState, cosmeticRandom: world.cosmeticRandom, selected: [...world.selected] }
  })
  try {
    report.pickingPaths = await checkPickingPathReadout({ page, output })
    const toggle = graph.getByRole('button', { name: 'Picking paths', exact: true })
    await toggle.click()
    await graph.focus()
    await page.keyboard.press('F8')
    await graph.waitFor({ state: 'hidden' })
    await page.keyboard.press('F8')
    await graph.waitFor({ state: 'visible' })
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false', 're-enabled F8 starts collapsed')
    for (const name of pickingPathMetricIds.slice(1))
      assert.equal(await graph.locator(`[data-metric="${name}"]`).textContent(), '--', 're-enable cannot revive old counters')
    assert.equal(await graph.locator('[data-metric="picking-window"]').textContent(), 'No samples yet')
    await toggle.focus()
    await page.keyboard.press('F8')
    await graph.waitFor({ state: 'hidden' })
    const afterPicking = await page.evaluate(() => {
      const world = window.testSceneRef.current.world
      return { turn: world.turn, randomState: world.randomState, cosmeticRandom: world.cosmeticRandom, selected: [...world.selected] }
    })
    assert.deepEqual(afterPicking, beforePicking, 'expanded diagnostics and focused F8 preserve the paused world')
    report.pickingPaths.focusedF8Reset = true
    stage('expanded-picking-boundaries-input-and-reset')
  } finally {
    await page.evaluate(() => {
      const scene = window.testSceneRef.current
      if (scene.fpsGraph) scene.togglePerformance()
      scene.frame = requestAnimationFrame(scene.animate)
    })
    await page.setViewportSize({ width: 1440, height: 1000 })
    for (const detail of openCampaignDetails) {
      await detail.locator('summary').click()
      assert.notEqual(await detail.getAttribute('open'), null, 'Restore each original campaign message')
    }
    stage('expanded-picking-campaign-restored')
  }
  return report
}
