import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import ts from 'typescript'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import * as scrolling from '../app/checkpoint-scroll.ts'

const require = createRequire(import.meta.url)
const art = JSON.parse(readFileSync(new URL('../app/original-loading-art.json', import.meta.url), 'utf8'))
const frontend = JSON.parse(readFileSync(new URL('../app/original-frontend.json', import.meta.url), 'utf8'))
const source = readFileSync(new URL('../app/original-loading-screen.tsx', import.meta.url), 'utf8')
const emitted = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText
function load(react = require('react'), exportName = 'OriginalLoadingScreen') {
  const component = { exports: {} }
  new Function('require', 'module', 'exports', emitted + '\nmodule.exports.RecoveryText = RecoveryText;')(name => {
    if (name === 'react') return react
    if (name === './original-frontend.json') return {default: frontend}
    if (name === './original-loading-art.json') return {default: art}
    if (name === 'react/jsx-runtime') return require(name)
    if (name === './checkpoint-scroll-area') return loadScrollArea()
    throw Error(`Unexpected component dependency: ${name}`)
  }, component, component.exports)
  return component.exports[exportName]
}
// Actual shared scroll-area JSX on the server; effects/physical layout remain
// separate rendered gates, not simulated by this markup test.
function loadScrollArea() {
  const source = readFileSync(new URL('../app/checkpoint-scroll-area.tsx', import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022,
  } }).outputText
  const component = { exports: {} }
  new Function('require', 'module', 'exports', code)(name => {
    if (['react', 'react/jsx-runtime'].includes(name)) return require(name)
    if (name === './checkpoint-scroll') return scrolling
    if (name.endsWith('.module.css')) return { default: Object.fromEntries(
      ['area', 'viewport', 'content', 'loadingContent', 'scrollbar', 'thumb', 'cap', 'drag'].map(key => [key, key])) }
    throw Error(`Unexpected scroll-area dependency: ${name}`)
  }, component, component.exports)
  return component.exports
}
const Component = load()
const render = (phase, error = '<failed terrain request>') => renderToStaticMarkup(createElement(Component, {
  phase, error, onRetry() {},
}))
const tree = element => [element, ...[element?.props?.children].flat(Infinity).filter(child => typeof child === 'object' && child).flatMap(tree)]

test('restore and actual resource loading share the imported mask and readable loading label', () => {
  for (const phase of ['restore', 'loading']) {
    const html = render(phase)
    assert.match(html, /class="loading-world loading-world-original"/)
    assert.ok(html.includes(`src="${art.mask.src}" width="130" height="161"`))
    assert.ok(html.includes(`src="${art.label.src}" width="82" height="20"`))
    assert.match(html, /Loading\.\.\./)
    assert.match(html, /role="status"/)
    assert.ok(!html.includes('loading-rune') && !html.includes('<h2'))
    assert.equal(html.includes('Checking for a saved checkpoint in this browser.'), phase === 'restore')
  }
})

test('first server paint exposes eager native art without a visible generic text or hydration gate', () => {
  for (const phase of ['restore', 'loading']) {
    const html = render(phase)
    assert.ok(!html.includes('src="/original/loading-'), 'no separate artwork fetch')
    assert.match(html, /<style>\.loading-world\{position:fixed;/)
    assert.match(html, /<span class="loading-text-hidden">Loading\.\.\.<\/span>/)
    assert.ok(!/<img[^>]*hidden/.test(html), 'native art must not wait for hydration/onLoad')
    assert.equal((html.match(/loading="eager"/g) ?? []).length, 2)
    if (phase === 'restore') assert.match(html, /<p class="loading-text-hidden">Checking/)
  }
  const css = render('restore')
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
  const image = name => nodes.find(node => node?.type === 'img' && node.props.src === (name === 'loading-mask.png' ? art.mask.src : art.label.src))
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
    const label = nodes.find(node => node?.type === 'img' && node.props.src === art.label.src)
    assert.equal(label.props.hidden, naturalWidth === 0)
  }
})

test('inline artwork is exactly the reviewed original bytes, bounded and reproducible', () => {
  let total = 0
  for (const asset of Object.values(art)) {
    const original = readFileSync(new URL('../' + asset.source, import.meta.url))
    const embedded = Buffer.from(asset.src.split(',')[1], 'base64')
    assert.deepEqual(embedded, original)
    assert.equal(createHash('sha256').update(embedded).digest('hex'), asset.sha256)
    assert.equal(embedded.length, asset.bytes)
    total += asset.src.length
  }
  assert.ok(total < 2700, 'inline PNG data remains a tiny first-document payload')
})

test('failure keeps original identity but explicitly labels the browser recovery controls', () => {
  const html = render('failed')
  assert.ok(html.includes(`src="${art.mask.src}"`))
  assert.match(html, /role="dialog" aria-label="Browser loading recovery" aria-modal="true"/)
  assert.match(html, /Loading failed/)
  assert.match(html, /Technical details/)
  assert.match(html, /&lt;failed terrain request&gt;/)
  assert.match(html, /Try again/)
  assert.ok(!html.includes(art.label.src) && !html.includes('loading-rune'))
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


test('retry rejects held Enter and unowned Space releases across replacement, but permits fresh activation', () => {
  let requests = 0
  const inspect = load({useEffect() {}, useRef: current => ({current}), useState: value => [value, () => {}]})
  const mount = () => tree(inspect({phase:'failed',error:'request failed',onRetry(){requests++}})).find(node => node?.type === 'button')
  const key = (button, type, value, repeat = false) => {
    let prevented = false
    button.props[type]({key:value,repeat,preventDefault(){prevented = true}})
    return prevented
  }
  let button = mount()
  assert.equal(key(button, 'onKeyDown', 'Enter'), false)
  button.props.onClick() // Native Enter default activation.
  assert.equal(requests, 1)
  button = mount() // The retry failed while Enter remained held.
  assert.equal(key(button, 'onKeyDown', 'Enter', true), true)
  assert.equal(requests, 1)
  assert.equal(key(button, 'onKeyDown', 'Enter'), false)
  button.props.onClick()
  assert.equal(requests, 2)

  button = mount()
  assert.equal(key(button, 'onKeyDown', ' ', true), true)
  assert.equal(key(button, 'onKeyUp', ' '), true)
  assert.equal(requests, 2, 'a Space press begun before this failure cannot retry it')
  assert.equal(key(button, 'onKeyDown', ' '), true)
  key(button, 'onKeyDown', ' ', true)
  assert.equal(requests, 2, 'Space waits for release')
  key(button, 'onKeyUp', ' ')
  assert.equal(requests, 3)
  key(button, 'onKeyUp', ' ')
  button.props.onClick()
  assert.equal(requests, 3, 'keyboard and click share the single-flight guard')

  button = mount()
  key(button, 'onKeyDown', ' ')
  button.props.onBlur()
  key(button, 'onKeyUp', ' ')
  assert.equal(requests, 3, 'blur cancels Space ownership')
  button.props.onClick() // Mouse or assistive detail-zero click remains supported.
  assert.equal(requests, 4)
  assert.equal(key(mount(), 'onKeyDown', 'Tab'), false, 'Tab still bubbles to the existing focus trap')
})


test('pending splash geometry and markup are byte-identical to the reviewed loading implementation', () => {
  const sha256 = text => createHash('sha256').update(text).digest('hex')
  const style = source.slice(source.indexOf('const loadingStyle'), source.indexOf('\n\ninterface Props'))
  const pending = source.slice(source.indexOf('      <div className="loading-original-art">'), source.indexOf("      {phase === 'failed' && ("))
  assert.equal(sha256(style), '6f62609435c228dbb104cdc8f2f2ef864915792d4c99d9fa388c1d1f53cd80f0')
  assert.equal(sha256(pending), '908a386250b9269b64fc489776c36c0b728dd9d6577a6baa7954eab03734374c')
})

test('every recovery glyph uses gold metrics; only the consumed interactive glyphs share highlight rectangles', () => {
  const Text = load(require('react'), 'RecoveryText')
  const labels = [
    ['Loading failed', 199],
    ['The battlefield did not finish loading. Try again to retry the same request.', 1087],
    ['Technical details', 242], ['Try again', 134], ['Browser recovery', 257],
  ]
  const renderedLabels = inspectState().render('failed').filter(node => node.props?.text).map(node => node.props.text)
  assert.deepEqual(renderedLabels, labels.map(([text]) => text), 'cover every actual recovery label, including wrapped prose')
  for (const [text, width] of labels) {
    const nodes = tree(Text({text, ready: true}))
    const glyphs = nodes.filter(node => node.type === 'i')
    assert.equal(glyphs.length, text.length)
    assert.equal(glyphs.reduce((sum, node) => sum + node.props.style.width, 0), width)
    for (const [index, letter] of [...text].entries()) {
      const gold = frontend.banks.felo33we.rects[letter.codePointAt(0) - 32]
      const highlight = frontend.banks.fehi33we.rects[letter.codePointAt(0) - 32]
      assert.deepEqual(glyphs[index].props.style, {width: gold.w, height: gold.h, backgroundPosition: `-${gold.x}px -${gold.y}px`})
      assert.deepEqual([gold.x, gold.y, gold.w], [highlight.x, highlight.y, highlight.w], `atlas position/advance: ${letter}`)
      // Gold f is one pixel taller. It occurs only in noninteractive prose, which
      // never switches banks; using dark/highlight metrics would clip its artwork.
      assert.equal(gold.h - highlight.h, letter === 'f' ? 1 : 0, `actual glyph height: ${letter}`)
      if (['Technical details', 'Try again'].includes(text)) assert.deepEqual(gold, highlight)
    }
    const label = nodes.find(node => node.props?.children === text)
    assert.equal(label.props.className, 'loading-text-hidden')
    assert.equal(nodes.find(node => node.props?.className === 'loading-recovery-text').props['aria-hidden'], 'true')
  }
})

test('missing fonts and unsupported characters retain complete readable text instead of unsafe glyph indexing', () => {
  const Text = load(require('react'), 'RecoveryText')
  for (const [text, ready] of [['Try again', false], ['Terrain \u{1f30b} 中文 <script>\nfailed', true]]) {
    const nodes = tree(Text({text, ready}))
    assert.equal(nodes.filter(node => node.type === 'i').length, 0)
    assert.equal(nodes.find(node => node.type === 'span').props.children, text)
    assert.equal(nodes.find(node => node.type === 'span').props.className, 'loading-recovery-fallback')
  }
  const error = '<img src=x onerror="alert(1)">\nTerrain \u{1f30b} 中文 / ' + 'unbroken-path-'.repeat(400)
  const html = render('failed', error)
  assert.ok(html.includes('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'))
  assert.ok(html.includes('Terrain \u{1f30b} 中文 / ' + 'unbroken-path-'.repeat(400)))
  assert.ok(!html.includes('<img src=x'))
  assert.match(html, /<p class="loading-recovery-error">/)
})

test('recovery font loading is failed-phase-only, failure-safe and unmount-safe', async () => {
  const originalImage = globalThis.Image
  const requests = [], pending = []
  globalThis.Image = class {
    set src(value) { requests.push(value) }
    decode() { return new Promise((resolve, reject) => pending.push({resolve, reject})) }
  }
  const settle = () => new Promise(resolve => setImmediate(resolve))
  try {
    for (const phase of ['restore', 'loading']) {
      const harness = inspectState()
      harness.render(phase)
      harness.effects[2]()
    }
    assert.deepEqual(requests, [], 'pending splash must never fetch recovery fonts')
    const harness = inspectState()
    harness.render('failed')
    harness.effects[2]()
    assert.deepEqual(requests, ['/original/frontend/felo33we.png', '/original/frontend/fehi33we.png'])
    const ready = () => harness.render('failed').find(node => node.props?.text === 'Try again').props.ready
    assert.equal(ready(), false)
    pending.splice(0).forEach(({resolve}) => resolve())
    await settle()
    assert.equal(ready(), true)

    for (const missing of [0, 1]) {
      const failed = inspectState()
      failed.render('failed'); failed.effects[2]()
      pending.splice(0).forEach(({resolve, reject}, index) => index === missing ? reject(Error('missing font')) : resolve())
      await settle()
      assert.ok(failed.render('failed').filter(node => node.props?.text).every(node => !node.props.ready),
        'either missing consumed font leaves every recovery label readable, including hover/focus')
    }
    assert.ok(requests.every(path => !path.includes('feft33we')), 'unused dark bank cannot block recovery readiness')

    const unmounted = inspectState()
    unmounted.render('failed'); const cleanup = unmounted.effects[2](); cleanup()
    pending.splice(0).forEach(({resolve}) => resolve())
    await settle()
    assert.equal(unmounted.render('failed').find(node => node.props?.text === 'Try again').props.ready, false)
  } finally {
    if (originalImage === undefined) delete globalThis.Image
    else globalThis.Image = originalImage
  }
})

test('browser recovery keeps scrollable native rows and unrestricted escaped diagnostic text', () => {
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')
  assert.match(css, /\.loading-world\[data-loading-phase=failed\]\{overflow:hidden\}/)
  const scrollCss = readFileSync(new URL('../app/checkpoint-scroll-area.module.css', import.meta.url), 'utf8')
  assert.match(scrollCss, /\.viewport \{[^}]*overflow: auto/)
  assert.match(scrollCss, /\.loadingContent \{[^}]*justify-content: safe center/)
  assert.match(css, /\.loading-recovery button\{[^}]*min-height:30px[^}]*border:0[^}]*background:transparent/)
  assert.match(css, /\.loading-recovery \.loading-recovery-error\{[^}]*white-space:pre-wrap[^}]*overflow-wrap:anywhere/)
  assert.match(css, /\.loading-recovery\{--loading-recovery-font:url\('\/original\/frontend\/felo33we\.png'\)/)
  assert.match(css, /\.loading-recovery :is\(button,summary\):is\(:hover,:focus-visible\)\{--loading-recovery-font:url\('\/original\/frontend\/fehi33we\.png'\)\}/)
  assert.match(css, /\.loading-recovery :is\(button,summary\):focus-visible\{outline:1px solid #fff1bb;outline-offset:1px\}/)
  assert.match(css, /\.loading-recovery-word i\{display:block;flex:none;background-image:var\(--loading-recovery-font\);background-repeat:no-repeat\}/)
  for (const [, selectors, declarations] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (/loading-recovery/.test(selectors)) assert.doesNotMatch(declarations, /(?:^|;)\s*(?:filter|opacity|mix-blend-mode)\s*:/,
      'original recovery artwork must not be recolored or dimmed')
  }
  assert.ok(!/\.loading-recovery(?: h2)?\{[^}]*Arial/.test(css))
})

test('the invoked loading checker preserves primary failure while still failing cleanup or report persistence', async () => {
  const browserSource = readFileSync(new URL('../scripts/local-render/loading-recovery-style.mjs', import.meta.url), 'utf8')
  const browserModule = { exports: {} }
  const browserCode = ts.transpileModule(browserSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  new Function('require', 'module', 'exports', browserCode)(name => {
    if (['node:assert/strict', 'node:fs', 'node:path'].includes(name)) return require(name)
    if (['../browser-new-game.mjs', './fullscreen-clearance.mjs'].includes(name)) return {}
    throw Error(`Unexpected browser helper dependency: ${name}`)
  }, browserModule, browserModule.exports)
  const { finishLoadingRecovery } = browserModule.exports
  assert.equal(typeof finishLoadingRecovery, 'function')
  assert.match(browserSource, /finally\s*\{\s*await finishLoadingRecovery\(\{ primaryError, report, gates, fallback, save \}\)/,
    'negative exercises the finalizer actually invoked by the candidate episode')
  for (const hasPrimary of [true, false]) {
    const primaryError = hasPrimary ? Error('original loading assertion') : undefined
    const cleanupError = Error('context close failed'), persistenceError = Error('report write failed')
    const report = { status: hasPrimary ? 'failed' : 'passed' }
    const events = [], gates = [() => events.push('release')]
    let savedStatus
    const attempt = async () => {
      try { if (primaryError) throw primaryError }
      finally {
        await finishLoadingRecovery({ primaryError, report, gates,
          fallback: { async close() { events.push('close'); throw cleanupError } },
          save() { events.push('save'); savedStatus = report.status; throw persistenceError },
        })
      }
    }
    await assert.rejects(attempt, error => {
      if (primaryError) assert.equal(error, primaryError, 'cleanup cannot replace the original failure')
      const cleanup = primaryError?.cleanupError ?? error
      assert.ok(cleanup instanceof AggregateError)
      assert.deepEqual(cleanup.errors, [cleanupError, persistenceError])
      return true
    })
    assert.deepEqual(events, ['release', 'close', 'save'])
    assert.deepEqual(gates, [])
    assert.equal(savedStatus, 'failed')
    assert.equal(report.status, 'failed')
    assert.deepEqual(report.cleanupErrors, [String(cleanupError), String(persistenceError)])
  }
  const report = { status: 'passed' }
  await finishLoadingRecovery({ report, gates: [], save() {} })
  assert.equal(report.status, 'passed', 'natural no-op cleanup must not manufacture a failure')
})


test('only failed recovery mounts the shipped original-art scroll region', () => {
  for (const phase of ['restore', 'loading']) {
    const html = render(phase)
    assert.ok(!html.includes('data-loading-scroll-area'))
    assert.ok(!html.includes('Loading recovery details'))
  }
  const html = render('failed')
  assert.match(html, /data-loading-scroll-area="true"/)
  assert.match(html, /data-loading-recovery-scroll="true" aria-label="Loading recovery details"/)
  assert.ok(!html.includes('data-pause-checkpoint-scroll'))
  assert.match(html, /class="loadingContent"/)
})

test('recovery Tab ownership includes the real overflow region and visible caps, not hidden fallback art', () => {
  const previousDocument = globalThis.document, previousStyle = globalThis.getComputedStyle
  const harness = inspectState(), root = harness.render('failed')[0]
  const focused = []
  const control = (name, visible = true) => ({ name, getClientRects: () => visible ? [{}] : [],
    focus() { focused.push(name); globalThis.document.activeElement = this } })
  const region = control('region'), summary = control('summary'), retry = control('retry')
  const up = control('up'), down = control('down'), hidden = control('hidden', false)
  let candidates = [region, summary, retry, up, down, hidden]
  root.props.ref.current = { querySelectorAll(selector) {
    assert.equal(selector, 'summary,button,[data-loading-recovery-scroll][tabindex="0"]')
    return candidates
  } }
  globalThis.document = { activeElement: retry }
  globalThis.getComputedStyle = () => ({ visibility: 'visible' })
  const tab = shiftKey => root.props.onKeyDown({ key: 'Tab', shiftKey, preventDefault() {} })
  try {
    tab(false); tab(false); tab(false); tab(false)
    assert.deepEqual(focused, ['up', 'down', 'region', 'summary'])
    tab(true); assert.equal(focused.at(-1), 'region')
    candidates = [summary, retry, hidden]; document.activeElement = retry
    tab(false); assert.equal(focused.at(-1), 'summary', 'no-overflow/forced-colors hidden art is not a focus trap')
    let prevented = false
    root.props.onKeyDown({ key: 'End', preventDefault() { prevented = true } })
    assert.equal(prevented, false, 'Home/End/native scrolling remain browser-owned')
  } finally {
    if (previousDocument === undefined) delete globalThis.document
    else globalThis.document = previousDocument
    if (previousStyle === undefined) delete globalThis.getComputedStyle
    else globalThis.getComputedStyle = previousStyle
  }
})


function loadingScrollbarOracle() {
  const source = readFileSync(new URL('../scripts/local-render/loading-recovery-style.mjs', import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022,
  } }).outputText
  const module = { exports: {} }
  new Function('require', 'module', 'exports', code)(name => {
    if (['node:assert/strict', 'node:fs', 'node:path'].includes(name)) return require(name)
    if (['../browser-new-game.mjs', './fullscreen-clearance.mjs'].includes(name)) return {}
    throw Error(`Unexpected loading observer dependency: ${name}`)
  }, module, module.exports)
  return module.exports.assertLoadingScrollbar
}
// Synthetic owner/geometry fixture, not a relabeled observation from the failed
// 65a9 browser capture. That actual white scrollbar must remain rejected.
function loadingScrollbarSample(overflow = true) {
  const box = (x, y, width, height) => ({ x, y, width, height, right: x + width, bottom: y + height })
  return { phase: 'failed', viewport: { width: 320, height: 240 }, forcedColors: false,
    counts: { areas: 1, scrollers: 1, tracks: overflow ? 1 : 0 }, owned: true, enabled: String(overflow),
    scroller: { box: box(0, 0, 320, 240), visible: true, id: 'recovery-scroll', uniqueId: true,
      label: 'Loading recovery details', role: 'region', tabIndex: overflow ? 0 : -1,
      scrollTop: 0, scrollHeight: overflow ? 480 : 240, clientHeight: 240,
      scrollWidth: 320, clientWidth: 320, overflowY: 'auto', scrollbarWidth: overflow ? 'none' : 'thin' },
    copy: box(44, 10, 244, 160), logo: box(100, 0, 130, 161),
    track: overflow ? box(296, 0, 24, 240) : null, thumb: overflow ? box(296, 0, 24, 120) : null,
    drag: overflow ? box(296, 10, 24, 98) : null, trackOwned: true, trackVisible: true, dragVisible: true, dragHit: true,
    dragImage: { path: '/original/help/hfx-455.png', sameOrigin: true },
    dragBackground: 'url("http://localhost/original/help/hfx-455.png")', dragRepeat: 'repeat-y',
    caps: overflow ? ['up', 'down'].map(direction => {
      const up = direction === 'up', height = up ? 10 : 12, rect = box(296, up ? 0 : 108, 24, height)
      return { direction, label: `Scroll loading recovery details ${direction}`, owner: true,
        controls: 'recovery-scroll', controlsOwner: true, tag: 'BUTTON', disabled: false, tabIndex: 0,
        visible: true, hit: true, box: rect, highlighted: false,
        image: { count: 1, path: `/original/help/hfx-${up ? 451 : 452}.png`, sameOrigin: true,
          complete: true, width: 24, height, alt: '', draggable: false, visible: true, box: { ...rect } } }
    }) : [] }
}

test('loading scrollbar oracle accepts only owned normal art or true nonoverflow and leaves pending untouched', () => {
  const check = loadingScrollbarOracle()
  check(loadingScrollbarSample()); check(loadingScrollbarSample(false))
  for (const phase of ['restore', 'loading']) check({ phase, counts: { areas: 0, scrollers: 0, tracks: 0 }, caps: [] })
  const highlighted = loadingScrollbarSample()
  highlighted.caps[0].highlighted = true; highlighted.caps[0].image.path = '/original/help/hfx-453.png'
  check(highlighted)
})

for (const [name, mutate] of [
  ['visible white browser scrollbar', s => { s.scroller.scrollbarWidth = 'auto' }],
  ['missing decoded art', s => { s.enabled = 'false' }],
  ['ambiguous region', s => { s.counts.scrollers = 2 }],
  ['wrong area owner', s => { s.owned = false }],
  ['duplicate region ID', s => { s.scroller.uniqueId = false }],
  ['horizontal overflow', s => { s.scroller.scrollWidth++ }],
  ['wrong copy gutter', s => { s.copy.x = 12 }],
  ['missing cap', s => { s.caps.pop() }],
  ['duplicate cap', s => { s.caps.push(s.caps[0]) }],
  ['wrong cap owner', s => { s.caps[0].owner = false }],
  ['wrong controls ID', s => { s.caps[0].controls = 'elsewhere' }],
  ['unreachable cap', s => { s.caps[0].hit = false }],
  ['wrong cap image', s => { s.caps[0].image.path = '/fake.png' }],
  ['undecoded cap', s => { s.caps[0].image.complete = false }],
  ['foreign drag art', s => { s.dragImage.sameOrigin = false }],
  ['unreachable drag body', s => { s.dragHit = false }],
  ['stale thumb', s => { s.thumb.y = 1 }],
  ['nonfinite geometry', s => { s.track.width = NaN }],
  ['unadmitted forced colors', s => { s.forcedColors = true }],
]) test(`loading scrollbar oracle rejects ${name}`, () => {
  const sample = loadingScrollbarSample(); mutate(sample)
  assert.throws(() => loadingScrollbarOracle()(sample))
})

test('existing loading captures bind the actual scroller and count art/caps as fullscreen obstacles', () => {
  const source = readFileSync(new URL('../scripts/local-render/loading-recovery-style.mjs', import.meta.url), 'utf8')
  assert.match(source, /locator\('\.loading-world'\)\.evaluate\(observeLoadingScrollbar\)/)
  assert.ok(source.indexOf('report.scrollbarGeometry.push') < source.indexOf('assertLoadingScrollbar(scrollbar)'))
  assert.match(source, /loading-recovery-error,\[data-loading-scrollbar\],\[data-loading-scroll-cap\]/)
  assert.match(source, /failed\(page\)\.locator\('\.loading-recovery > p'\)/)
})

test('canonical loading validation fingerprints the new shared controller and every consumed loading asset', () => {
  const registry = JSON.parse(readFileSync(new URL('../engineering/checks.json', import.meta.url)))
  const check = registry.checks.find(item => item.id === 'native-ui-evidence-tests')
  for (const path of ['tests/original-loading-screen.test.mjs', 'tests/checkpoint-scroll-area.test.mjs'])
    assert.ok(check.args.includes(path), `Canonical execution: ${path}`)
  for (const path of ['app/original-loading-screen.tsx', 'app/original-loading-art.json', 'app/original-frontend.json',
    'app/page.tsx', 'app/checkpoint-scroll-area.tsx', 'app/checkpoint-scroll-area.module.css', 'app/checkpoint-scroll.ts',
    'app/globals.css', 'scripts/local-render/loading-recovery-style.mjs', 'tests/original-loading-screen.test.mjs',
    'tests/checkpoint-scroll-area.test.mjs', 'references/checkpoint-scrollbar-art.json', 'public/original/loading-mask.png',
    'public/original/loading-label.json', 'public/original/loading-label.png',
    ...[451, 452, 453, 454, 455].map(id => `public/original/help/hfx-${id}.png`)]) {
    assert.ok(check.inputs.includes(path), `Fingerprinted input: ${path}`)
    assert.ok(check.triggerPaths.includes(path), `Canonical trigger: ${path}`)
  }
})
