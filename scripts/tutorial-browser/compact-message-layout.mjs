import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { checkPickingPathReadout, pickingPathMetricIds } from './picking-path-readout.mjs'
import {
  assertM2DiagnosticLayout,
  m2DiagnosticLayout,
  m2RectanglesOverlap,
} from './m2-pointer-f8.mjs'

export const compactMessageCases = Object.freeze([
  {
    preference: 'auto',
    label: 'Automatic',
    sizes: [
      [900, 360],
      [640, 480],
    ],
  },
  {
    preference: '4',
    label: '400%',
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
      fragments = textRuns(node).flatMap(run => run.fragments)
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
    worldMessages: [...document.querySelectorAll('.world-message')].filter(visible).map(text),
    campaignText: [...document.querySelectorAll('.campaign-messages details[open]>div p')]
      .filter(visible)
      .map(text),
    diagnosticRows: [...document.querySelectorAll('.fps-graph dl>div')].filter(visible).map(text),
    diagnosticFields: [...document.querySelectorAll('.fps-graph [data-metric]')]
      .filter(visible)
      .map(node => ({ metric: node.dataset.metric, ...text(node) })),
    diagnosticTextRuns: document.querySelector('.fps-graph')
      ? textRuns(document.querySelector('.fps-graph')) : [],
    pause: document.querySelector('.paused-badge') && rect(document.querySelector('.paused-badge')),
    overflow:
      document.documentElement.scrollWidth > innerWidth ||
      document.documentElement.scrollHeight > innerHeight,
    statusLayout: getComputedStyle(document.querySelector('.game-status')).display,
  }
}

export function assertCompactMessageWitness(layout, witness, width, height) {
  assertM2DiagnosticLayout(layout, width, height)
  assert.equal(witness.overflow, false, 'No document scroll overflow in either dimension')
  assert.ok(witness.worldMessages.length > 0, 'Authored active status text must be present')
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
        node.top >= layout.top &&
        node.right <= layout.right &&
        node.bottom <= layout.bottom,
      'Diagnostic fields must fit F8'
    )
  const strictBoxes = [
    ...witness.worldMessages,
    ...witness.campaignText,
    ...witness.diagnosticRows,
  ]
  const contains = (box, fragment, x = true, y = true) =>
    (!x || (fragment.left >= box.left - 0.5 && fragment.right <= box.right + 0.5)) &&
    (!y || (fragment.top >= box.top - 0.5 && fragment.bottom <= box.bottom + 0.5))
  const visibleFragments = node =>
    node.fragments.some(fragment => fragment.right > fragment.left && fragment.bottom > fragment.top)
  const assertFragment = (fragment, node, diagnostic) => {
    assert.ok(
      [fragment.left, fragment.top, fragment.right, fragment.bottom].every(Number.isFinite) &&
        fragment.right >= fragment.left && fragment.bottom >= fragment.top,
      'Text fragments must have finite, ordered bounds'
    )
    assert.ok(contains({ left: 0, top: 0, right: width, bottom: height }, fragment), 'Text must fit viewport')
    if (diagnostic) assert.ok(contains(layout, fragment), 'Diagnostic text must fit F8')
    for (const clip of node.clips) {
      // Do not claim rectangular evidence proves an unmeasured shape clip.
      assert.equal(clip.clipPath, 'none', 'Shape clipping needs separate geometry evidence')
      assert.equal(clip.clip, 'auto', 'Legacy clipping needs separate geometry evidence')
      assert.ok(contains(clip, fragment, clip.clipX, clip.clipY), `Text must fit actual clip: ${clip.name}`)
    }
  }
  for (const node of [
    ...strictBoxes,
    ...witness.diagnosticFields.filter(node => node.metric !== 'export-status' || node.text.trim()),
  ]) {
    assert.ok(node.text.trim() && visibleFragments(node), 'Positive-area visible text fragments are required')
    assert.equal(node.contentFits, true, 'Text must not overflow its own box')
    assert.ok(node.left >= 0 && node.top >= 0 && node.right <= width && node.bottom <= height)
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
    assert.ok(run.text.trim() && visibleFragments(run), 'Diagnostic text runs require positive-area fragments')
    for (const fragment of run.fragments) {
      assertFragment(fragment, run, true)
      for (const other of witness.diagnosticTextRuns.slice(index + 1))
        for (const neighbor of other.fragments)
          assert.equal(m2RectanglesOverlap(fragment, neighbor), false, 'Distinct diagnostic text must not overlap')
      for (const ui of [layout.pause, ...layout.interactiveUi, ...witness.worldMessages])
        assert.equal(m2RectanglesOverlap(fragment, ui), false, 'Diagnostic text must not obscure unrelated UI')
    }
  }
  for (const ui of layout.interactiveUi)
    assert.equal(
      m2RectanglesOverlap(layout, ui),
      false,
      `F8 must not obscure interactive UI: ${ui.name}`
    )
  for (const message of witness.worldMessages) {
    assert.equal(message.fontSize, 12, 'Keep the shipped status font size')
    assert.equal(message.lineHeight, '18px', 'Keep the shipped status line height')
    for (const other of [layout, layout.pause, ...layout.interactiveUi])
      assert.equal(
        m2RectanglesOverlap(message, other),
        false,
        `Active status text must not overlap F8, pause, HUD or campaign UI: ${other.name ?? 'overlay'}`
      )
  }
}

async function selectHudPreference(page, preference) {
  const button = name => page.getByRole('button', { name, exact: true })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await button('Game settings').click()
  await button('Options').click()
  await button('Browser compatibility and help').click()
  const setting = page.getByRole('combobox', { name: 'HUD size', exact: true })
  await setting.selectOption(preference)
  assert.equal(await setting.inputValue(), preference)
  await button('Back to Options').click()
  await button('Back').click()
  await button('Continue Game').click()
  await page.locator('dialog[data-original-pause-menu]').waitFor({ state: 'hidden' })
}

export async function checkCompactMessages({ page, output, stage, report }) {
  const graph = page.locator('.fps-graph')
  report.limits = [
    'Collapsed coexistence: Automatic and 400% at 900x360 and 640x480; not universal viewport support or performance acceptance.',
  ]
  const settle = () =>
    page.evaluate(
      () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    )
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
      await settle()
      await graph.waitFor({ state: 'hidden' })
      const before = await page.evaluate(compactMessageWitness)
      assert.equal(before.preference, preference)
      assert.equal(before.statusLayout, 'contents', 'Ordinary layout must remain ungrouped')
      await page.keyboard.press('F8')
      await graph.waitFor({ state: 'visible' })
      await page.waitForFunction(() =>
        /\d+\.\d \/ \d+\.\d ms/.test(
          document.querySelector('.fps-graph [data-metric="pointer-tail"]')?.textContent ?? ''
        )
      )
      await settle()
      const layout = await graph.evaluate(m2DiagnosticLayout)
      const witness = await page.evaluate(compactMessageWitness)
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
      assertCompactMessageWitness(layout, witness, width, height)
      await page.keyboard.press('F8')
      await graph.waitFor({ state: 'hidden' })
      await settle()
      const restored = await page.evaluate(compactMessageWitness)
      sample.restored = restored
      assert.deepEqual(
        restored,
        before,
        'F8 off must restore ordinary text, geometry and typography'
      )
      assert.equal(
        await page.evaluate(() => window.testStore.getWorld().turn),
        baseline.world,
        'Public settings and diagnostics preserve the paused world'
      )
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
