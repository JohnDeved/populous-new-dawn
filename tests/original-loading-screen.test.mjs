import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import ts from 'typescript'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'

const require = createRequire(import.meta.url)
const source = readFileSync(new URL('../app/original-loading-screen.tsx', import.meta.url), 'utf8')
const emitted = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText
function load(react = require('react')) {
  const component = { exports: {} }
  new Function('require', 'module', 'exports', emitted)(name => {
    if (name === 'react') return react
    if (name === 'react/jsx-runtime') return require(name)
    throw Error(`Unexpected component dependency: ${name}`)
  }, component, component.exports)
  return component.exports.OriginalLoadingScreen
}
const Component = load()
const render = phase => renderToStaticMarkup(createElement(Component, {
  phase, error: '<failed terrain request>', onRetry() {},
}))
const tree = element => [element, ...[element?.props?.children].flat(Infinity).filter(child => typeof child === 'object' && child).flatMap(tree)]

test('restore and actual resource loading share the imported mask and readable loading label', () => {
  for (const phase of ['restore', 'loading']) {
    const html = render(phase)
    assert.match(html, /class="loading-world loading-world-original"/)
    assert.match(html, /src="\/original\/loading-mask.png" width="130" height="161"/)
    assert.match(html, /src="\/original\/loading-label.png" width="82" height="20"/)
    assert.match(html, /Loading\.\.\./)
    assert.match(html, /role="status"/)
    assert.ok(!html.includes('loading-rune') && !html.includes('<h2'))
    assert.equal(html.includes('Checking for a saved checkpoint in this browser.'), phase === 'restore')
  }
})

test('first server paint exposes eager native art without a visible generic text or hydration gate', () => {
  for (const phase of ['restore', 'loading']) {
    const html = render(phase)
    assert.match(html, /<link rel="preload" as="image" href="\/original\/loading-mask.png" fetchPriority="high"\/>/)
    assert.match(html, /<link rel="preload" as="image" href="\/original\/loading-label.png" fetchPriority="high"\/>/)
    assert.match(html, /<span class="loading-text-hidden">Loading\.\.\.<\/span>/)
    assert.ok(!/<img[^>]*hidden/.test(html), 'native art must not wait for hydration/onLoad')
    assert.equal((html.match(/loading="eager"/g) ?? []).length, 2)
    if (phase === 'restore') assert.match(html, /<p class="loading-text-hidden">Checking/)
  }
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')
  assert.match(css, /\.loading-text-hidden\{[^}]*clip-path:inset\(50%\)/)
  assert.match(css, /\.loading-world\{[^}]*background:#000/)
  assert.match(css, /\.loading-original-art\{[^}]*width:130px;height:161px/)
})

function inspectState() {
  const states = [], refs = [], effects = []
  let stateIndex = 0, refIndex = 0
  const inspect = load({
    useState(initial) {
      const index = stateIndex++
      if (!(index in states)) states[index] = initial
      return [states[index], value => { states[index] = value }]
    },
    useRef(initial) {
      const index = refIndex++
      return refs[index] ??= {current: initial}
    },
    useEffect(callback) { effects.push(callback) },
  })
  return {
    effects,
    render(phase = 'loading') {
      stateIndex = 0; refIndex = 0; effects.length = 0
      return tree(inspect({phase, error: 'terrain failed', onRetry() {}}))
    },
  }
}

test('only a real label failure reveals readable fallback; mask failure cannot remove the status', () => {
  const harness = inspectState()
  let nodes = harness.render()
  const image = name => nodes.find(node => node?.type === 'img' && node.props.src.endsWith(name))
  assert.equal(image('loading-label.png').props.hidden, false)
  image('loading-mask.png').props.onError()
  nodes = harness.render()
  assert.equal(image('loading-mask.png'), undefined)
  assert.equal(image('loading-label.png').props.hidden, false)
  image('loading-label.png').props.onError()
  nodes = harness.render()
  assert.equal(image('loading-label.png').props.hidden, true)
  const status = nodes.find(node => node?.type === 'span' && node.props.children === 'Loading...')
  assert.equal(status.props.className, undefined)
  assert.equal(nodes[0].props.role, 'status')
})

test('image completion before hydration is reconciled for both successful and failed requests', () => {
  for (const naturalWidth of [0, 130]) {
    const harness = inspectState()
    let nodes = harness.render()
    for (const node of nodes.filter(node => node?.type === 'img')) {
      node.props.ref.current = {complete: true, naturalWidth}
    }
    harness.effects[0]()
    nodes = harness.render()
    assert.equal(nodes[0].props['data-mask-failed'], naturalWidth === 0)
    assert.equal(nodes[0].props['data-label-ready'], naturalWidth > 0)
    const label = nodes.find(node => node?.type === 'img' && node.props.src.endsWith('loading-label.png'))
    assert.equal(label.props.hidden, naturalWidth === 0)
  }
})

test('failure keeps original identity but explicitly labels the browser recovery controls', () => {
  const html = render('failed')
  assert.match(html, /src="\/original\/loading-mask.png"/)
  assert.match(html, /role="dialog" aria-label="Browser loading recovery" aria-modal="true"/)
  assert.match(html, /Loading failed/)
  assert.match(html, /Technical details/)
  assert.match(html, /&lt;failed terrain request&gt;/)
  assert.match(html, /Try again/)
  assert.ok(!html.includes('loading-label.png') && !html.includes('loading-rune'))
})

test('one failed presentation dispatches only one retry; a new keyed presentation may retry again', () => {
  const inspect = load({useEffect() {}, useRef: current => ({current}), useState: value => [value, () => {}]})
  let requests = 0
  const props = {phase:'failed',error:'request failed',onRetry(){requests++}}
  const retry = tree(inspect(props)).find(node => node?.type === 'button')
  retry.props.onClick(); retry.props.onClick(); retry.props.onClick()
  assert.equal(requests,1)
  tree(inspect(props)).find(node => node?.type === 'button').props.onClick()
  assert.equal(requests,2)
  const page = readFileSync(new URL('../app/page.tsx', import.meta.url),'utf8')
  assert.match(page,/OriginalLoadingScreen\s+key=\{error \? 'failed' : startup\}/)
})

test('the bounded imported label retains exact source hashes, independent centering and two-pass metrics', () => {
  const meta = JSON.parse(readFileSync(new URL('../public/original/loading-label.json',import.meta.url)))
  const png = readFileSync(new URL('../public/original/loading-label.png',import.meta.url))
  assert.equal(meta.inputs['data/fenew/feft20we.spr'],'fc705fe271d131d7bec0023fc07ebf1f7fe91596e260b5d23e6004a380d4ea4b')
  assert.equal(meta.text,'Loading...'); assert.equal(meta.font.slot,1)
  assert.deepEqual([meta.measureWidth,meta.measureHeight,meta.width,meta.height],[81,19,82,20])
  assert.deepEqual(meta.font.glyphs.map(g=>g.advance),[8,14,10,11,4,10,12,4,4,4])
  assert.equal(meta.nativeLayout.labelX,'trunc((screenWidth-81)/2)')
  assert.equal(meta.nativeLayout.labelYRelativeToMask,-26)
  assert.deepEqual(meta.nativeLayout.passes.map(p=>[p.offsetX,p.offsetY,p.rgb]),[[0,0,[131,131,131]],[1,1,[255,255,255]]])
  assert.equal(png.readUInt32BE(16),82); assert.equal(png.readUInt32BE(20),20)
  assert.equal(createHash('sha256').update(png).digest('hex'),meta.outputSha256)
  assert.equal(meta.outputSha256,'9b5344c17384895329eea031ab56c0243600022970bdfb814ed7ce25feb625c9')
})
