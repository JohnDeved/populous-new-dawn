import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runInNewContext } from 'node:vm'
import {
  assertCompactMessageWitness,
  compactMessageCases,
  diagnosticMetricIds,
} from '../scripts/tutorial-browser/compact-message-layout.mjs'
import runM2Functional, { m2DiagnosticLayout, m2FunctionalLimitMs, runCompactDiagnosticEpisodes } from '../scripts/tutorial-browser/m2-pointer-f8.mjs'
import { browserCapMs } from '../scripts/tutorial-browser/scenario-policy.mjs'
import { hudScale } from '../app/hud-layout.ts'
import { pickingPathMetricIds, pickingPathViewports } from '../scripts/tutorial-browser/picking-path-readout.mjs'

const box = (left, top, right, bottom) => ({ left, top, right, bottom })
const text = (bounds, value) => ({
  ...bounds,
  text: value,
  fragments: [bounds],
  clips: [],
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
      diagnosticTextRuns: [
        { text: 'First leaf', fragments: [box(435, 20, 480, 32)], clips: [] },
        { text: 'Second leaf', fragments: [box(490, 20, 550, 32)], clips: [] },
      ],
    },
  }
}

test('serialized diagnostic layout excludes only explicitly collapsed picking rows', () => {
  const good = clearWitness()
  const node = bounds => ({
    bounds,
    clientWidth: bounds.right - bounds.left,
    clientHeight: bounds.bottom - bounds.top,
    scrollWidth: bounds.right - bounds.left,
    scrollHeight: bounds.bottom - bounds.top,
    getBoundingClientRect() { return this.bounds },
    getClientRects() { return this.bounds.right > this.bounds.left ? [this.bounds] : [] },
  })
  const zero = box(0, 0, 0, 0), rowBounds = box(435, 140, 654, 157)
  const picking = { hidden: true }
  const mandatory = Array.from({ length: 15 }, () => ({ ...node(rowBounds), closest: () => null }))
  const optional = pickingPathMetricIds.slice(1).map(() => ({
    ...node(zero),
    closest(selector) {
      assert.equal(selector, '.fps-picking[hidden]')
      return picking.hidden ? picking : null
    },
  }))
  const pause = { ...node(good.layout.pause), textContent: good.layout.pauseText }
  pause.closest = selector => selector === '.paused-badge' ? pause : null
  const exportButton = node(box(435, 270, 550, 290))
  const exportStatus = node(box(435, 294, 550, 310))
  const close = node(box(380, 245, 405, 265))
  const campaign = {
    ...node(good.layout.campaignPanels[0]),
    querySelector: selector => selector === 'p' ? { textContent: 'Authored campaign text' } : close,
  }
  const overlay = {
    ...node(good.layout),
    querySelector: selector => ({
      '.fps-export': exportButton,
      '[data-metric="export-status"]': exportStatus,
      '[data-metric="pointer-tail"]': { textContent: good.layout.pointerTail },
    })[selector],
    querySelectorAll: selector => {
      assert.equal(selector, 'dl > div')
      return [...mandatory, ...optional]
    },
  }
  // Execute the actual page-serialized witness, not a fixture's rowsFit result.
  // DOM geometry is controlled here; rendered CSS remains a separate browser gate.
  const readLayout = runInNewContext(`(${m2DiagnosticLayout.toString()})`, {
    innerWidth: 900,
    getComputedStyle: () => ({ visibility: 'visible', pointerEvents: 'none' }),
    document: {
      documentElement: { scrollWidth: 900 },
      querySelector: selector => selector === 'button.paused-badge' ? pause : null,
      querySelectorAll: selector => selector === '.campaign-messages details[open]>div' ? [campaign] : [],
      elementFromPoint: (x, y) => [pause, exportButton, close].find(({ bounds: r }) =>
        x >= r.left && x <= r.right && y >= r.top && y <= r.bottom),
    },
  })
  const layout = () => readLayout(overlay)
  assert.equal(optional.length, 7)
  assertCompactMessageWitness(layout(), good.witness, 900, 360)
  for (const damaged of [zero, box(427, 140, 654, 157), box(435, 140, 893, 157),
    box(435, 7, 654, 157), box(435, 140, 654, 318)]) {
    mandatory[0].bounds = damaged
    assert.equal(layout().rowsFit, false, 'mandatory hidden or out-of-panel rows cannot be skipped')
  }
  mandatory[0].bounds = rowBounds
  mandatory[0].scrollWidth++
  assert.equal(layout().rowsFit, false, 'mandatory horizontal clipping must still fail')
  mandatory[0].scrollWidth--
  picking.hidden = false
  assert.equal(layout().rowsFit, false, 'unhidden optional rows must have visible in-panel geometry')
  for (const row of optional) Object.assign(row, node(rowBounds))
  assert.equal(layout().rowsFit, true, 'expanded optional rows are measured too')
  optional[0].bounds = box(435, 140, 893, 157)
  assert.equal(layout().rowsFit, false, 'expanded optional rows cannot escape panel bounds')
  optional[0].bounds = rowBounds
  optional[0].scrollWidth++
  assert.equal(layout().rowsFit, false, 'expanded optional horizontal clipping must still fail')
})

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

test('real FPS font overhang is allowed only inside actual clipping and non-overlap boundaries', () => {
  const good = clearWitness()
  // Retained run 39175629111 / artifact 12154202752, Automatic 900x360:
  // 26px font with 28.6px line-height has a 30px text Range, not a clipped glyph.
  const fps = {
    metric: 'fps',
    ...text(box(435, 34.390625, 463.921875, 62.984375), '24'),
    fragments: [box(435, 33.390625, 463.921875, 63.390625)],
    fontSize: 26,
    lineHeight: '28.6px',
  }
  good.witness.diagnosticFields[0] = fps
  good.witness.diagnosticTextRuns[0] = { text: fps.text, fragments: fps.fragments, clips: [] }
  assertCompactMessageWitness(good.layout, good.witness, 900, 360)
  const clipping = {
    ...box(435, 34.390625, 463.921875, 62.984375),
    name: 'actual-parent', clipX: true, clipY: false,
    overflowX: 'clip', overflowY: 'visible', contain: 'none', clipPath: 'none', clip: 'auto',
  }
  const horizontalOnly = structuredClone(good)
  horizontalOnly.witness.diagnosticFields[0].clips = [clipping]
  assertCompactMessageWitness(horizontalOnly.layout, horizontalOnly.witness, 900, 360)
  for (const damage of [
    ({ witness }) => {
      witness.diagnosticFields[0].clips = [{ ...clipping, clipY: true, overflowY: 'hidden' }]
    },
    ({ witness }) => {
      witness.diagnosticTextRuns[0].clips = [{ ...clipping, clipY: true, contain: 'paint' }]
    },
    ({ witness }) => {
      witness.diagnosticFields[0].fragments[0].top = 7
    },
    ({ witness }) => {
      witness.diagnosticTextRuns[1].fragments = witness.diagnosticTextRuns[0].fragments
    },
    ({ witness }) => {
      witness.diagnosticTextRuns[0].clips = [{ ...clipping, clipPath: 'inset(2px)' }]
    },
    ({ witness }) => {
      witness.diagnosticTextRuns = []
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
  assert.match(source, /style\.overflowX/)
  assert.match(source, /style\.overflowY/)
  assert.match(source, /style\.contain/)
  assert.match(source, /parent\.clientLeft \+ parent\.clientWidth/)
  assert.match(source, /parent\.clientTop \+ parent\.clientHeight/)
  assert.ok(source.indexOf('await page.screenshot({ path: resolve(output, screenshot) })') <
    source.indexOf('assertCompactMessageWitness(layout, witness, width, height)', source.indexOf('report.cases.push(sample)')))
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
  assert.match(runner, /await[^\n]+\.runCompactDiagnosticEpisodes\(\{ browser, url, output: out, fixture: m2Fixture, report: receipt \}\)/)
  assert.match(
    scenario,
    /if \(compactMessages\) \{\s+const \{ checkCompactMessages \} = await import/
  )
  assert.match(scenario, /pickingPaths \? 'picking-path-readout' : compactMessages \? 'compact-message-layout' : 'm2-pointer-f8'/)
  assert.match(scenario, /fileName: `\$\{scenario\}\.json`/)
  assert.ok(scenario.indexOf('timer = setTimeout') < scenario.indexOf('await page.goto'))
  assert.ok(scenario.indexOf('await page.goto') < scenario.indexOf('if (compactMessages)'))
})

test('actual compact routing awaits independent bounded episodes and preserves partial failure evidence', async () => {
  const report = {}, calls = [], first = Promise.withResolvers()
  const common = { browser: {}, url: 'http://fixture', output: 'fixture-output', fixture: {} }
  const run = runCompactDiagnosticEpisodes({ ...common, report }, async options => {
    calls.push(options)
    if (options.compactMessages) return first.promise
    assert.deepEqual(report.compactMessageLayout, { status: 'passed', contextClosed: true })
    return { status: 'passed', contextClosed: true, scenario: 'picking-path-readout' }
  })
  assert.deepEqual(calls, [{ ...common, compactMessages: true }], 'expanded work cannot start before compact finishes')
  first.resolve({ status: 'passed', contextClosed: true })
  await run
  assert.deepEqual(calls, [{ ...common, compactMessages: true }, { ...common, pickingPaths: true }])
  assert.equal(report.pickingPathReadout.scenario, 'picking-path-readout')
  for (const failAt of [0, 1]) {
    const partial = {}, attempted = []
    await assert.rejects(runCompactDiagnosticEpisodes({ ...common, report: partial }, async options => {
      attempted.push(options)
      if (attempted.length - 1 === failAt) throw Error('episode failure')
      return { status: 'passed', contextClosed: true }
    }), /episode failure/)
    assert.equal(attempted.length, failAt + 1, 'a failed legacy episode cannot be hidden by expanded success')
    assert.equal(!!partial.compactMessageLayout, failAt === 1, 'retain completed legacy evidence if expanded fails')
    assert.equal(partial.pickingPathReadout, undefined)
  }
})

test('real compact and expanded M2 episodes each close their fresh context at the unchanged 45-second deadline', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const output = mkdtempSync(join(tmpdir(), 'compact-episode-deadline-'))
  t.after(() => rmSync(output, { recursive: true, force: true }))
  let created = 0
  for (const [flag, name] of [['compactMessages', 'compact-message-layout'], ['pickingPaths', 'picking-path-readout']]) {
    const entered = Promise.withResolvers(), navigation = Promise.withResolvers()
    let closed = 0
    const page = {
      setDefaultTimeout() {}, on() {}, async addInitScript() {},
      goto() { entered.resolve(); return navigation.promise },
      async evaluate() { throw Error('context closed') },
      async screenshot() { throw Error('context closed') },
    }
    const browser = { async newContext() {
      created++
      return {
        async newPage() { return page },
        async close() { closed++; navigation.reject(Error('context closed by deadline')) },
      }
    } }
    const completed = assert.rejects(runM2Functional({ browser, url: 'http://fixture', output,
      fixture: { receipt: {} }, [flag]: true }), /M2 functional scenario failed/)
    await entered.promise
    t.mock.timers.tick(m2FunctionalLimitMs - 1)
    assert.equal(closed, 0, 'the episode retains its own full original allowance')
    t.mock.timers.tick(1)
    await completed
    const receipt = JSON.parse(readFileSync(join(output, `${name}.json`), 'utf8'))
    assert.equal(receipt.scenario, name)
    assert.equal(receipt.status, 'failed')
    assert.equal(receipt.timedOut, true)
    assert.equal(receipt.contextClosed, true)
    assert.equal(receipt.stages.at(-1).name, 'deadline')
  }
  assert.equal(created, 2)
  assert.equal(m2FunctionalLimitMs, 45000)
  assert.equal(browserCapMs('compact-message-layout'), 180000)
  await assert.rejects(runM2Functional({ compactMessages: true, pickingPaths: true }), /independent contexts/)
})

test('collapsed and optional diagnostic inventories cover every shipped F8 metric without hiding missing fields', () => {
  const graph = readFileSync(new URL('../app/fps-graph.ts', import.meta.url), 'utf8')
  const optional = graph.match(/<section class="fps-picking"[^>]*hidden>[\s\S]*?<\/section>/)?.[0]
  assert.ok(optional, 'optional fields must be explicitly collapsed by default')
  assert.deepEqual(
    [...graph.replace(optional, '').matchAll(/data-metric="([^"]+)"/g)].map(match => match[1]),
    diagnosticMetricIds
  )
  assert.deepEqual([...optional.matchAll(/data-metric="([^"]+)"/g)].map(match => match[1]), pickingPathMetricIds)
  assert.equal(new Set([...diagnosticMetricIds, ...pickingPathMetricIds]).size, diagnosticMetricIds.length + pickingPathMetricIds.length)
})

test('existing compact hosted job invokes shared expanded picking cases against the bundled app and retains artifacts', () => {
  assert.deepEqual(pickingPathViewports, [[640, 480], [1280, 799], [1280, 800], [1280, 801], [1280, 820]])
  const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
  const compact = read('scripts/tutorial-browser/compact-message-layout.mjs')
  const originalEpisode = compact.slice(compact.indexOf('export async function checkCompactMessages'), compact.indexOf('export async function checkExpandedPickingPaths'))
  const expandedEpisode = compact.slice(compact.indexOf('export async function checkExpandedPickingPaths'))
  const shared = read('scripts/tutorial-browser/picking-path-readout.mjs')
  const standalone = read('scripts/check-browser-fps.mjs')
  assert.match(compact, /import \{ checkPickingPathReadout, pickingPathMetricIds \} from '\.\/picking-path-readout\.mjs'/)
  assert.match(compact, /report\.pickingPaths = await checkPickingPathReadout\(\{ page, output \}\)/)
  assert.match(standalone, /await checkPickingPathReadout\(\{ page, output \}\)/)
  assert.doesNotMatch(originalEpisode, /checkPickingPathReadout|pickingPaths/)
  assert.match(originalEpisode, /await selectHudPreference\(page, preference\)/)
  assert.match(originalEpisode, /compact-\$\{preference\}-\$\{width\}x\$\{height\}-captured-and-restored/)
  assert.match(expandedEpisode, /report\.pickingPaths = await checkPickingPathReadout/)
  assert.match(expandedEpisode, /await selectHudPreference\(page, '4'\)/)
  assert.match(compact, /await toggle\.focus\(\)\s+await page\.keyboard\.press\('F8'\)/)
  assert.match(compact, /await toggle\.click\(\)\s+await graph\.focus\(\)\s+await page\.keyboard\.press\('F8'\)/)
  assert.match(compact, /report\.pickingPaths\.focusedF8Reset = true/)
  assert.match(compact, /cancelAnimationFrame\(scene\.frame\)/)
  assert.match(compact, /scene\.frame = requestAnimationFrame\(scene\.animate\)/)
  assert.match(expandedEpisode, /await detail\.locator\('summary'\)\.click\(\)/)
  assert.match(expandedEpisode, /assert\.notEqual\(await detail\.getAttribute\('open'\), null/)
  assert.match(expandedEpisode, /stage\('expanded-picking-campaign-restored'\)/)
  for (const interaction of ["press('Space')", "press('End')", "press('Home')", 'page.mouse.wheel', 'target.scrollIntoViewIfNeeded'])
    assert.ok(shared.includes(interaction), interaction)
  assert.match(shared, /assert\.deepEqual\(inputEvents, \[\]/)
  assert.match(shared, /performance-picking-layout-fixture-\$\{width\}x\$\{height\}-top\.png/)
  assert.match(shared, /performance-picking-layout-fixture-\$\{width\}x\$\{height\}-bottom\.png/)
  assert.doesNotMatch(shared, /chromium\.launch|newContext|createServer|preview\(|no-sandbox/)
  const workflow = read('.github/workflows/tutorial-browser.yml')
  assert.match(workflow, /scenario: compact-message-layout\n +timeoutMinutes: 15\n +name: Compact message layout browser\n +artifact: compact-message-layout-browser/)
  assert.match(workflow, /outputs\/tutorial-browser\/\*\.png/)
  assert.match(workflow, /outputs\/tutorial-browser\/\*\.json/)
  assert.match(read('scripts/tutorial-browser/fixture/main.tsx'), /import Home from '\.\.\/\.\.\/\.\.\/app\/page'/)
  assert.match(read('scripts/tutorial-browser/build-home.mjs'), /mode: 'production'/)
})
