import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import * as layout from '../app/original-result-layout.ts'
import * as popup from '../app/campaign-popup-layout.ts'
import { resultBlink } from '../app/result-session.ts'

const require = createRequire(import.meta.url)
const native = JSON.parse(readFileSync(new URL('../app/original-result-ui.json', import.meta.url)))
const source = readFileSync(new URL('../app/original-result-screen.tsx', import.meta.url), 'utf8')
const emitted = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText
const component = { exports: {} }
new Function('require', 'module', 'exports', emitted)(name => {
  if (name === './original-result-ui.json') return { default: native }
  if (name === './original-result-layout') return layout
  if (name === './campaign-popup-layout') return popup
  if (name === './result-session') return { resultBlink }
  if (name === './original-result-screen.module.css') return { default: new Proxy({}, { get: (_, key) => key }) }
  if (name === 'react' || name === 'react/jsx-runtime') return require(name)
  throw Error(`Unexpected component dependency: ${name}`)
}, component, component.exports)
const render = props => renderToStaticMarkup(createElement(component.exports.OriginalResultScreen, {
  status: 'won', level: 1, player: 1, time: 125, stage: 'statistics', inputCycles: 0, ...props,
}))

test('result time is a pure live-clock formatter with hours and no wrapping or mutation', () => {
  assert.equal(layout.resultTime(125.9), '00:02:05')
  assert.equal(layout.resultTime(3600), '01:00:00')
  assert.equal(layout.resultTime(360000), '100:00:00')
  assert.equal(layout.resultTime(-1), '00:00:00')
  assert.equal(layout.resultTime(NaN), '--:--:--')
})

test('legacy sizing helper retains bounded panel geometry', () => {
  for (const [width, height, preferred, controls] of [[544,480,.96,40],[1088,960,1.92,40],[1720,1080,2,40],[828,360,.72,40],[329,844,.61,64]]) {
    const scale = layout.resultScale(width, height, preferred, controls)
    assert.ok(scale > 0 && scale <= preferred)
    assert.ok(384 * scale <= width - 24)
    assert.ok(368 * scale <= height - 2 * (controls + 16))
  }
})

test('actual result component renders source headings and ten explicitly unavailable counters', () => {
  const html = render()
  assert.ok(html.includes('01 : The Journey Begins'))
  assert.ok(html.includes('Player 1.'))
  assert.ok(html.includes('Level Status: Completed'))
  assert.ok(html.includes('Level Won'))
  assert.ok(html.includes('00:02:05'))
  assert.equal((html.match(/role="group" aria-label="[^"]+: unavailable"/g) ?? []).length, 10)
  for (const row of native.nativeRows) assert.ok(html.includes(`${row.label}: unavailable`))
  assert.ok(html.includes('statistics not yet recorded'))
  assert.ok(html.includes('Press Space Bar'))
  assert.ok(!html.includes('<button') && !html.includes('Continue to Mission 2') && !html.includes('Select Level'))
  assert.ok(!html.includes('SPELLS CAST') && !html.includes('BUILDINGS RAISED'))
  assert.ok(!html.includes('Level Complete'))
})

test('statistics retain loss and terminal/tutorial identity without navigation actions', () => {
  const lost = render({ status: 'lost' })
  assert.ok(lost.includes('Level Status: Failed') && lost.includes('Level Lost'))
  assert.ok(lost.includes('Press Space Bar') && !lost.includes('Restart Level') && !lost.includes('Continue to Mission'))
  const terminal = render({ level: 23 })
  assert.ok(terminal.includes('23 : Inferno') && !terminal.includes('Mission 24'))
  const tutorial = render({ level: 79 })
  assert.ok(tutorial.includes('Tutorial') && !tutorial.includes('79 :'))
})

test('pending-font headings center their actual text while statistic columns keep their anchors', () => {
  for (const status of ['won', 'lost']) for (const level of [1, 14]) {
    const html = render({ status, level })
    const lines = [...html.matchAll(/<span class="line" style="([^"]+)" role="img" aria-label="([^"]+)">/g)]
    const headings = lines.slice(0, 3)
    assert.deepEqual(headings.map(line => line[2]), [native.titles[level], 'Player 1.',
      status === 'won' ? 'Level Status: Completed' : 'Level Status: Failed'])
    for (const [i, line] of headings.entries()) {
      assert.equal(line[1], `left:192px;top:${[13, 31, 49][i]}px;transform:translateX(-50%)`)
    }
    assert.ok(html.includes('data-font-ready="false"'))
    assert.equal(lines[3][2], 'Time Taken')
    assert.equal(lines[3][1], 'left:17px;top:76px')
    assert.ok(lines.slice(3, -1).every(line => !line[1].includes('transform')), 'counter columns retain their anchors; the final prompt is centered')
  }
})

test('source panel metadata retains independently checked native geometry and glyph bounds', () => {
  assert.equal(native.layout640.panelWidth,384)
  assert.equal(native.layout640.panelHeight,368)
  assert.deepEqual(native.nativeRows.map(row => row.y),[101,119,144,162,180,198,223,241,259,284])
  assert.deepEqual(native.nativeRows.map(row => row.labelId),[741,742,743,744,745,746,747,748,749,750])
  for (const glyph of native.font.rects) {
    assert.ok(glyph.x >= 0 && glyph.y >= 0 && glyph.x + glyph.w <= native.font.width && glyph.y + glyph.h <= native.font.height)
    assert.equal(glyph.advance,glyph.w)
  }
})


test('terminal overlays retain both native prompts and no statistics or pointer actions', () => {
  for (const status of ['won', 'lost']) {
    const html = render({ status, stage: 'terminal-overlay', inputCycles: 6 })
    assert.ok(html.includes(status === 'won' ? 'Level Complete' : 'Level Failed'))
    assert.ok(html.includes('Press Space Bar'))
    assert.ok(!html.includes('Level statistics') && !html.includes('<button'))
    assert.ok(html.includes('data-result-stage="terminal-overlay"'))
  }
})

test('native result layout fits panel and prompt at low, wide and high-DPI CSS viewport sizes', () => {
  for (const [width, height, preferred] of [[640, 480, 1], [344, 220, 1], [329, 844, .61], [1720, 1080, 2], [1088, 960, 1.92]]) {
    const value = layout.resultLayout(width, height, preferred)
    assert.ok(value.scale > 0 && value.scale <= preferred)
    assert.ok(value.panelWidth * value.scale <= width - 8)
    const panelTop = (height - value.panelHeight * value.scale) / 2
    assert.ok(panelTop >= 0)
    assert.ok(panelTop + (value.promptY + value.glyphHeight) * value.scale <= height - 1)
    assert.equal(value.rows.length, 10)
    assert.equal(value.font, width * height >= 640 * 480 ? 3 : 4)
  }
})
