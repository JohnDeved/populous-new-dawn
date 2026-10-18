import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  assertCompactMessageWitness,
  compactMessageCases,
  diagnosticMetricIds,
} from '../scripts/tutorial-browser/compact-message-layout.mjs'
import { m2FunctionalLimitMs } from '../scripts/tutorial-browser/m2-pointer-f8.mjs'
import { browserCapMs } from '../scripts/tutorial-browser/scenario-policy.mjs'
import { hudScale } from '../app/hud-layout.ts'

const box = (left, top, right, bottom) => ({ left, top, right, bottom })
const text = (bounds, value) => ({
  ...bounds,
  text: value,
  fragments: [bounds],
  contentFits: true,
  fontSize: 12,
  lineHeight: '18px',
})
function clearWitness() {
  const panel = {
    ...box(72, 241, 412, 341),
    text: 'Authored campaign text',
    contentFits: true,
    closeActionable: true,
  }
  return {
    layout: {
      ...box(428, 8, 892, 317),
      pause: box(80, 135, 240, 188),
      rowsFit: true,
      pointerTail: '1.0 / 2.0 ms',
      overflow: false,
      events: 'none',
      exportFits: true,
      exportActionable: true,
      pauseActionable: true,
      pauseText: 'WORLD PAUSED Click to resume',
      campaignPanels: [panel],
      interactiveUi: [
        { ...box(0, 0, 72, 360), name: 'native-hud' },
        { ...panel, name: 'campaign-panel' },
      ],
    },
    witness: {
      overflow: false,
      worldMessages: [text(box(80, 8, 412, 78), 'Authored active objective')],
      campaignText: [text(box(86, 255, 398, 327), 'Authored campaign text')],
      diagnosticRows: Array.from({ length: 15 }, () =>
        text(box(435, 140, 654, 157), 'Diagnostic label/value')
      ),
      diagnosticFields: diagnosticMetricIds.map(metric => ({
        metric,
        ...text(box(435, 140, 654, 157), 'Measured value'),
      })),
    },
  }
}

test('compact message acceptance rejects status occlusion, clipping, missing content and unreachable controls', () => {
  const good = clearWitness()
  assertCompactMessageWitness(good.layout, good.witness, 900, 360)
  for (const damage of [
    ({ witness }) => {
      witness.worldMessages = []
    },
    ({ witness }) => {
      witness.campaignText = []
    },
    ({ witness }) => {
      witness.diagnosticRows.pop()
    },
    ({ witness }) => {
      witness.diagnosticFields.pop()
    },
    ({ witness }) => {
      witness.diagnosticFields.find(node => node.metric === 'renderer').contentFits = false
    },
    ({ witness }) => {
      witness.worldMessages[0] = text(box(309, 296, 693, 348), 'Old overlapping objective')
    },
    ({ witness }) => {
      witness.worldMessages[0].contentFits = false
    },
    ({ witness }) => {
      witness.worldMessages[0].fragments[0].right = 430
    },
    ({ witness }) => {
      witness.worldMessages[0].fontSize = 10
    },
    ({ witness }) => {
      witness.worldMessages[0].lineHeight = '14px'
    },
    ({ witness }) => {
      witness.worldMessages[0].fragments = []
    },
    ({ witness }) => {
      witness.overflow = true
    },
    ({ layout }) => {
      layout.exportActionable = false
    },
    ({ layout }) => {
      layout.campaignPanels[0].closeActionable = false
    },
    ({ layout }) => {
      layout.pauseActionable = false
    },
    ({ layout }) => {
      layout.rowsFit = false
    },
  ]) {
    const bad = structuredClone(good)
    damage(bad)
    assert.throws(() => assertCompactMessageWitness(bad.layout, bad.witness, 900, 360))
  }
})

test('compact preferences use public controls with genuine text geometry and F8-off restoration', () => {
  assert.deepEqual(compactMessageCases, [
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
  const source = readFileSync(
    new URL('../scripts/tutorial-browser/compact-message-layout.mjs', import.meta.url),
    'utf8'
  )
  for (const control of [
    'Game settings',
    'Options',
    'Browser compatibility and help',
    'HUD size',
    'Back to Options',
    'Continue Game',
  ])
    assert.ok(source.includes(control))
  assert.match(source, /await setting\.selectOption\(preference\)/)
  assert.match(source, /range\.getClientRects\(\)/)
  assert.match(
    source,
    /node\.scrollWidth <= node\.clientWidth && node\.scrollHeight <= node\.clientHeight/
  )
  assert.match(source, /assert\.deepEqual\(\s*restored,\s*before/)
  assert.doesNotMatch(
    source,
    /localStorage\.setItem|force:|\.tick\(|\.setWorld\(|\.startMission\(|style\.setProperty|document\.querySelector[^\n]+\.click\(/
  )
  for (const [width, height] of [
    [900, 360],
    [640, 480],
  ]) {
    for (const preference of ['1', '1.5', '2', '2.5', '3', '4'])
      assert.equal(
        hudScale(width, height, preference),
        hudScale(width, height, 'auto'),
        'Source-proven compact scaling equivalence is not a claim every preference was browser tested'
      )
  }
})

test('compact coexistence changes placement and whitespace only within diagnostic conditions', () => {
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')
  const page = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
  assert.match(css, /\.game-status\{display:contents\}/)
  assert.match(page, /<div className="game-status">/)
  const bounded = css.slice(
    css.indexOf('/* At the bounded 640x480'),
    css.indexOf('.primary-button,.secondary-button')
  )
  assert.match(bounded, /min-width:640px/)
  assert.match(bounded, /min-height:480px/)
  assert.match(
    bounded,
    /\.game-shell:has\(\.fps-graph\):has\(\.campaign-messages details\[open\]\):has\(\.world-message\)/
  )
  assert.match(bounded, /display:grid;gap:8px/)
  assert.doesNotMatch(
    bounded,
    /font-size|line-height|overflow:hidden|display:none|visibility:hidden|scale\(/
  )
})

test('separate compact hosted scenario retains old bounds and existing groups', () => {
  assert.equal(m2FunctionalLimitMs, 45000)
  assert.equal(browserCapMs('compact-message-layout'), 180000)
  const runner = readFileSync(
    new URL('../scripts/tutorial-browser/run.mjs', import.meta.url),
    'utf8'
  )
  const scenario = readFileSync(
    new URL('../scripts/tutorial-browser/m2-pointer-f8.mjs', import.meta.url),
    'utf8'
  )
  assert.match(runner, /compactMessageScenarioSha256: hash/)
  assert.match(runner, /receipt\.compactMessageLayout = await[^\n]+compactMessages: true/)
  assert.match(
    scenario,
    /if \(compactMessages\) \{\s+const \{ checkCompactMessages \} = await import/
  )
  assert.match(
    scenario,
    /fileName: compactMessages \? 'compact-message-layout\.json' : 'm2-pointer-f8\.json'/
  )
  assert.ok(scenario.indexOf('timer = setTimeout') < scenario.indexOf('await page.goto'))
  assert.ok(scenario.indexOf('await page.goto') < scenario.indexOf('if (compactMessages)'))
})

test('diagnostic inventory covers every shipped F8 metric, not a subset', () => {
  const graph = readFileSync(new URL('../app/fps-graph.ts', import.meta.url), 'utf8')
  assert.deepEqual(
    [...graph.matchAll(/data-metric="([^"]+)"/g)].map(match => match[1]),
    diagnosticMetricIds
  )
})
