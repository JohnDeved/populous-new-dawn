import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import ts from 'typescript'
import { renderToStaticMarkup } from 'react-dom/server'

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8')
const moduleUrl = code => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
const source = read('../app/original-credits-frame.tsx')
let code = ts.transpileModule(source, {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const layoutUrl = moduleUrl(stripTypeScriptTypes(read('../app/original-credits-layout.ts')))
const imports = {
  './original-credits-layout': layoutUrl,
  'react/jsx-runtime': import.meta.resolve('react/jsx-runtime'),
}
for (const path of ['original-credits.json', 'original-pause-font.json', 'original-result-ui.json']) {
  imports[`./${path}`] = moduleUrl(`export default ${read(`../app/${path}`)}`)
}
for (const [specifier, url] of Object.entries(imports)) {
  const escaped = specifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`(['"])${escaped}\\1`, 'g')
  assert.equal([...code.matchAll(pattern)].length, 1, `isolated import ${specifier}`)
  code = code.replace(pattern, JSON.stringify(url))
}
const { OriginalCreditsFrame: Frame, createOriginalCreditsFrame: create } = await import(moduleUrl(code))
const heading = JSON.parse(read('../app/original-pause-font.json'))
const name = JSON.parse(read('../app/original-result-ui.json')).font
const defaults = { background: [11, 15, 11], fontStatus: 'ready' }
const scene = submissions => ({ width: 640, height: 480, origin: 0, visitedRecords: 1, completedPasses: 0, submissions })
const row = (text, font = 'name', x = 7, y = 9) => ({ text, font, x, y, recordIndex: 3 })
function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements)
  if (!node || typeof node !== 'object' || !node.props) return []
  return [node, ...elements(node.props.children)]
}
const matching = (root, key) => elements(root).filter(node => node.props[key] !== undefined)

test('the frame adapter binds real catalogue headings and names to accepted native layout', () => {
  const frame = create({ width: 640, height: 480 }, 0)
  assert.equal(frame.width, 640)
  assert.equal(frame.height, 480)
  assert.equal(frame.submissions[0].text, 'Production')
  assert.equal(frame.submissions[0].font, 'heading')
  assert.equal(frame.submissions[0].y, 30)
  assert.equal(frame.submissions[1].text, '  ')
  assert.equal(frame.submissions[1].y, 58)
  assert(frame.submissions.some(item => item.text === 'Richard Leinfellner'))
})

test('the adapter retains the layout origin reset rather than losing controller output', () => {
  const frame = create({ width: 640, height: 480 }, -20000)
  assert.equal(frame.origin, 481)
  assert(frame.completedPasses > 0)
  assert.equal(create({ width: 640, height: 480 }, 480).submissions.length, 0)
})

test('a changed viewport recomputes centering and frame dimensions without stale state', () => {
  const narrow = create({ width: 640, height: 480 }, 0)
  const wide = create({ width: 800, height: 600 }, 0)
  assert.equal(wide.submissions[0].x - narrow.submissions[0].x, 80)
  assert.equal(wide.width, 800)
  assert.equal(wide.height, 600)
  const root = Frame({ ...defaults, frame: wide })
  assert.equal(root.props.style.width, 800)
  assert.equal(root.props.style.height, 600)
})

test('ready frames render real heading and name atlas cells at the supplied line positions', () => {
  const root = Frame({ ...defaults, frame: scene([row('A', 'heading', 31, 42), row('A')]) })
  const lines = matching(root, 'data-credits-record')
  const glyphs = matching(root, 'data-credits-glyph')
  assert.equal(lines.length, 2)
  assert.deepEqual(lines[0].props.style, { position: 'absolute', left: 31, top: 42 })
  assert.equal(glyphs[0].props.style.backgroundImage, "url('/original/pause-font.png')")
  assert.equal(glyphs[1].props.style.backgroundImage, "url('/original/result-font.png')")
  for (const [node, bank] of [[glyphs[0], heading], [glyphs[1], name]]) {
    const rect = bank.rects[65 - 32]
    assert.equal(node.props.style.width, rect.w)
    assert.equal(node.props.style.height, rect.h)
    assert.equal(node.props.style.backgroundPosition, `-${rect.x}px -${rect.y}px`)
  }
})

test('byte-range accented names choose exact cells without Unicode substitution', () => {
  const root = Frame({ ...defaults, frame: scene([row('ëíö')]) })
  const glyphs = matching(root, 'data-credits-glyph')
  assert.deepEqual(glyphs.map(node => node.props['data-credits-glyph']), [235, 237, 246])
  let left = 0
  for (const node of glyphs) {
    const rect = name.rects[node.props['data-credits-glyph'] - 32]
    assert.equal(node.props.style.left, left)
    assert.equal(node.props.style.backgroundPosition, `-${rect.x}px -${rect.y}px`)
    left += rect.w
  }
})

test('literal spaces and variable width advances remain in the actual element output', () => {
  for (const [text, offsets] of [['A  I', [0, 10, 18, 26]], [' A  ', [0, 8, 18, 26]]]) {
    const root = Frame({ ...defaults, frame: scene([row(text)]) })
    const glyphs = matching(root, 'data-credits-glyph')
    assert.equal(glyphs.length, 4)
    assert.deepEqual(glyphs.map(node => node.props.style.left), offsets)
  }
})

test('negative and below-viewport submissions remain unchanged for browser scissoring', () => {
  const root = Frame({ ...defaults, frame: scene([row('A', 'name', -5, -20), row('B', 'name', 0, 500)]) })
  const lines = matching(root, 'data-credits-record')
  assert.deepEqual(lines.map(node => [node.props.style.left, node.props.style.top]), [[-5, -20], [0, 500]])
  assert.equal(root.props.style.overflow, 'hidden')
  assert.equal(root.props.style.width, 640)
  assert.equal(root.props.style.height, 480)
})

test('background is supplied explicitly and no red text tint or opacity is invented', () => {
  const root = Frame({ ...defaults, background: [1, 2, 3], frame: scene([row('A')]) })
  assert.equal(root.props.style.backgroundColor, 'rgb(1,2,3)')
  assert.equal(root.props.style.imageRendering, 'pixelated')
  const style = matching(root, 'data-credits-glyph')[0].props.style
  assert.equal(style.filter, undefined)
  assert.equal(style.opacity, undefined)
  assert.equal(style.color, undefined)
})

test('loading and failure states do not pretend the bitmap artwork is ready', () => {
  for (const fontStatus of ['loading', 'failed']) {
    const root = Frame({ ...defaults, fontStatus, frame: scene([row('A')]) })
    assert.equal(matching(root, 'data-credits-glyph').length, 0)
    assert.equal(root.props['data-font-status'], fontStatus)
    const status = elements(root).find(node => node.props.role === 'status')
    assert.match(status.props.children, fontStatus === 'failed' ? /could not be loaded/ : /Loading/)
    assert.equal(status.props.style.color, '#fff')
    assert.equal(status.props.style.backgroundColor, '#000')
  }
})

test('readiness is controlled by the owner with no stale internal state or work', () => {
  const frame = scene([row('A')])
  assert.equal(matching(Frame({ ...defaults, frame }), 'data-credits-glyph').length, 1)
  assert.equal(matching(Frame({ ...defaults, frame, fontStatus: 'loading' }), 'data-credits-glyph').length, 0)
  assert.equal(matching(Frame({ ...defaults, frame }), 'data-credits-glyph').length, 1)
  assert.doesNotMatch(source, /useEffect|useLayoutEffect|setTimeout|setInterval|requestAnimationFrame|addEventListener/)
})

test('readable rows expose their text while decorative empty rows stay hidden', () => {
  const root = Frame({ ...defaults, frame: scene([row('Producer'), row('  '), row('')]) })
  const lines = matching(root, 'data-credits-record')
  assert.equal(lines[0].props.role, 'img')
  assert.equal(lines[0].props['aria-label'], 'Producer')
  assert.equal(lines[1].props['aria-hidden'], true)
  assert.equal(lines[2].props['aria-hidden'], true)
  assert(matching(root, 'data-credits-glyph').every(node => node.props['aria-hidden'] === 'true'))
})

test('frame creation and display leave source records and caller data unchanged', () => {
  const frame = create({ width: 640, height: 480 }, 0)
  const props = { ...defaults, frame }
  const before = structuredClone(props)
  Frame(props)
  assert.deepEqual(props, before)
  assert.deepEqual(create({ width: 640, height: 480 }, 0), frame)
})

test('invalid explicit colors fail before returning display markup', () => {
  for (const background of [[1, 2], [1, 2, 3, 4], [-1, 0, 0], [0, 256, 0], [0.5, 0, 0], [NaN, 0, 0]]) {
    assert.throws(() => Frame({ ...defaults, background, frame: scene([]) }), RangeError)
  }
})

test('real ReactDOM serializes the actual Credits frame into bitmap display markup', () => {
  const frame = create({ width: 640, height: 480 }, 0)
  const markup = renderToStaticMarkup(Frame({ ...defaults, frame }))
  assert.match(markup, /data-original-credits-frame="true"/)
  assert.match(markup, /aria-label="Production"/)
  assert.match(markup, /aria-label="Richard Leinfellner"/)
  assert.match(markup, /pause-font\.png/)
  assert.match(markup, /result-font\.png/)
  assert.equal((markup.match(/data-credits-glyph=/g) ?? []).length, frame.submissions.reduce((sum, item) => sum + item.text.length, 0))
  assert.doesNotMatch(markup, /<button|<script|onkeydown|onclick|autofocus/i)
})

test('real ReactDOM serializes loading and failed display states without fake glyphs', () => {
  for (const fontStatus of ['loading', 'failed']) {
    const markup = renderToStaticMarkup(Frame({ ...defaults, fontStatus, frame: scene([row('A')]) }))
    assert.match(markup, /role="status"/)
    assert.doesNotMatch(markup, /data-credits-glyph=/)
  }
})
