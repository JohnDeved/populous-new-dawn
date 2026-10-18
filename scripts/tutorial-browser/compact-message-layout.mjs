import assert from 'node:assert/strict'
import { resolve } from 'node:path'
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

// Read real text fragments, including wrapping, rather than only an outer box.
// This function is serialized into the page and never changes DOM or game state.
export function compactMessageWitness() {
  const rect = node => {
    const r = node.getBoundingClientRect()
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
  }
  const visible = node =>
    node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden'
  const text = node => {
    const bounds = rect(node),
      style = getComputedStyle(node),
      fragments = []
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT)
    for (let part = walker.nextNode(); part; part = walker.nextNode()) {
      if (!part.textContent.trim()) continue
      const range = document.createRange()
      range.selectNodeContents(part)
      for (const r of range.getClientRects())
        fragments.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom })
    }
    return {
      ...bounds,
      text: node.textContent,
      fragments,
      fontSize: Number.parseFloat(style.fontSize),
      lineHeight: style.lineHeight,
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
  assert.ok(witness.diagnosticRows.length > 0, 'Actual diagnostic rows must be observed')
  for (const node of [
    ...witness.worldMessages,
    ...witness.campaignText,
    ...witness.diagnosticRows,
  ]) {
    assert.ok(node.text.trim() && node.fragments.length, 'Visible text fragments are required')
    assert.equal(node.contentFits, true, 'Text must not overflow its own box')
    assert.ok(node.left >= 0 && node.top >= 0 && node.right <= width && node.bottom <= height)
    for (const fragment of node.fragments)
      assert.ok(
        fragment.left >= node.left - 0.5 &&
          fragment.top >= node.top - 0.5 &&
          fragment.right <= node.right + 0.5 &&
          fragment.bottom <= node.bottom + 0.5,
        `Wrapped text must remain inside its box: ${node.text}`
      )
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

export async function checkCompactMessages({ page, output, stage, report }) {
  const graph = page.locator('.fps-graph')
  const button = name => page.getByRole('button', { name, exact: true })
  report.limits = [
    'Automatic and 400% at 900x360 and 640x480 only; not universal viewport support or performance acceptance',
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
      assertCompactMessageWitness(layout, witness, width, height)
      await page.screenshot({ path: resolve(output, screenshot) })
      await page.keyboard.press('F8')
      await graph.waitFor({ state: 'hidden' })
      await settle()
      const restored = await page.evaluate(compactMessageWitness)
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
      sample.restored = restored
      stage(`compact-${preference}-${width}x${height}-captured-and-restored`)
    }
  }
  return report
}
