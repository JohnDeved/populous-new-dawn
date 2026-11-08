import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import ts from 'typescript'
import { evaluatePage, pageNode, pageSource } from './support/follower-nearby-page.mjs'

const require = createRequire(import.meta.url)
const source = readFileSync(new URL('../app/startup-logo.tsx', import.meta.url), 'utf8')
const emitted = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText

// The production component, with media/DOM/hook boundaries supplied. Actual
// decoding, trusted events, click-through, geometry and Home are browser checks.
function fixture() {
  const refs = [], states = [], effects = [], listeners = new Map()
  let refIndex, stateIndex, completions = 0
  const document = {
    hidden: false,
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: (name, callback) => {
      assert.equal(listeners.get(name), callback)
      listeners.delete(name)
    },
  }
  const media = {
    plays: 0, pauses: 0, loads: 0, muted: true, error: null,
    play() { this.plays++; return this.nextPlay ?? Promise.resolve() },
    pause() { this.pauses++ },
    load() { this.loads++ },
    removeAttribute(name) { assert.equal(name, 'src'); delete this.src },
  }
  const modal = { open: false, showModal() { this.open = true }, close() { this.open = false }, focus() {} }
  const component = { exports: {} }
  new Function('require', 'module', 'exports', 'document', emitted)(name => {
    if (name === 'react') return {
      useRef(initial) { return refs[refIndex] ??= { current: initial }, refs[refIndex++] },
      useState(initial) {
        const at = stateIndex++
        if (!(at in states)) states[at] = initial
        return [states[at], value => { states[at] = value }]
      },
      useCallback: callback => callback,
      useEffect: callback => effects.push(callback),
    }
    if (name === 'react/jsx-runtime') return require(name)
    if (name === './startup-logo.module.css') return { default: {} }
    throw Error(`Unexpected import: ${name}`)
  }, component, component.exports, document)
  const render = () => {
    refIndex = stateIndex = 0
    effects.length = 0
    const tree = component.exports.StartupLogo({ onComplete: () => completions++ })
    refs[0].current = modal
    refs[1].current = media
    return tree
  }
  const tree = render()
  const cleanup = effects[0]()
  return {
    tree, media, modal, states, listeners, document, render, cleanup,
    get completions() { return completions },
  }
}
function nodes(element) {
  if (!element || typeof element !== 'object') return []
  if (Array.isArray(element)) return element.flatMap(nodes)
  return [element, ...nodes(element.props?.children)]
}
function event(extra = {}) {
  return { prevented: false, stopped: false, repeat: false,
    preventDefault() { this.prevented = true },
    stopPropagation() { this.stopped = true },
    ...extra }
}

test('Home gates the existing menu behind the logo once per mount, without changing startup restoration', () => {
  function condition(tag) {
    const element = pageNode(node => ts.isJsxSelfClosingElement(node) && node.tagName.getText(pageSource) === tag)
    let expression = element.parent
    while (!ts.isBinaryExpression(expression)) expression = expression.parent
    return expression.left.getText(pageSource)
  }
  const logo = condition('StartupLogo'), menu = condition('OriginalMainMenu')
  for (const startup of ['loading', 'choice', 'playing']) {
    for (const startupLogoDone of [false, true]) {
      const bindings = { startup, startupLogoDone, startupCampaign: false, frontendAssets: true }
      assert.equal(!!evaluatePage(logo, bindings), startup === 'choice' && !startupLogoDone)
      assert.equal(!!evaluatePage(menu, bindings), startup === 'choice' && startupLogoDone)
    }
  }
  const done = pageNode(node => ts.isVariableDeclaration(node) && node.name.getText(pageSource) === 'finishStartupLogo')
  const writes = []
  evaluatePage(done.initializer.arguments[0].getText(pageSource), { setStartupLogoDone: value => writes.push(value) })()
  assert.deepEqual(writes, [true], 'completion changes only presentation, never loads a world or writes a save')
})

test('fresh keyboard downs stop only the logo once; releases and repeats cannot replay completion', () => {
  for (const key of ['Escape', 'Enter', ' ', 'a', 'ArrowRight', 'Shift']) {
    const f = fixture()
    const repeat = event({ key, repeat: true })
    f.tree.props.onKeyDown(repeat)
    assert.equal(f.completions, 0)
    assert.equal(repeat.prevented, true)
    const down = event({ key })
    f.tree.props.onKeyDown(down)
    assert.equal(down.prevented && down.stopped, true)
    assert.equal(f.completions, 1)
    assert.equal(f.media.pauses, 1)
    assert.equal(f.tree.props.onKeyUp, undefined)
    nodes(f.tree).find(node => node.type === 'video').props.onEnded()
    f.tree.props.onKeyDown(event({ key }))
    assert.equal(f.completions, 1)
    f.cleanup()
  }
})

test('Home capture permits logo controls during loading and with a restored input mask', () => {
  const loading = pageNode(node => ts.isFunctionDeclaration(node) && node.name?.text === 'blockLoadingInteraction')
  const main = pageNode(node => ts.isJsxOpeningElement(node) && node.tagName.getText(pageSource) === 'main')
  const click = main.attributes.properties.find(node => node.name?.text === 'onClickCapture')
  for (const ready of [false, true]) for (const inputMask of [0, 64]) {
    const blockLoadingInteraction = evaluatePage(`(${loading.getText(pageSource)})`, { ready })
    const capture = evaluatePage(click.initializer.expression.getText(pageSource), {
      blockLoadingInteraction, world: { inputMask },
    })
    const logo = event({ detail: 1, target: {
      closest: selector => selector.includes('[data-startup-logo]') ? {} : null,
    } })
    assert.equal(blockLoadingInteraction(logo), false)
    capture(logo)
    assert.equal(logo.prevented || logo.stopped, false, `ready=${ready}, inputMask=${inputMask}`)
    const outside = event({ detail: 1, target: { closest: () => null } })
    capture(outside)
    assert.equal(outside.prevented && outside.stopped, !ready || !!inputMask)
  }
})

test('pointer down pauses immediately and matching release/cancel consumes the transition', () => {
  for (const button of [0, 1, 2, 3]) for (const terminal of ['onPointerUp', 'onPointerCancel']) {
    const f = fixture(), captured = []
    f.tree.props.onPointerDown(event({
      button, pointerId: 7, currentTarget: { setPointerCapture: id => captured.push(id) },
    }))
    assert.deepEqual(captured, [7])
    assert.equal(f.media.pauses, 1)
    assert.equal(f.completions, 0)
    f.tree.props[terminal](event({ pointerId: 8 }))
    assert.equal(f.completions, 0)
    f.tree.props[terminal](event({ pointerId: 7 }))
    assert.equal(f.completions, 1)
    f.cleanup()
  }
})

test('natural completion and accessible Skip use the same one-shot exit', () => {
  for (const type of ['video', 'button']) {
    const f = fixture()
    const control = nodes(f.tree).find(node => node.type === type &&
      (type === 'video' || node.props.children === 'Skip logo'))
    control.props[type === 'video' ? 'onEnded' : 'onClick']()
    assert.equal(f.completions, 1)
    assert.equal(f.media.pauses, 1)
    f.cleanup()
    assert.equal(f.media.src, undefined)
    assert.equal(f.media.loads, 1)
    assert.equal(f.modal.open, false)
    assert.equal(f.listeners.size, 0)
  }
})

test('Tab and the explicit sound control remain accessible without skipping or restarting', () => {
  const f = fixture(), tab = event({ key: 'Tab' })
  f.tree.props.onKeyDown(tab)
  assert.equal(tab.prevented, false)
  const sound = nodes(f.tree).find(node => node.type === 'button' && node.props.children === 'Enable logo sound')
  const down = event({ key: 'Enter' })
  sound.props.onKeyDown(down)
  assert.equal(down.stopped, true)
  assert.equal(down.prevented, false)
  sound.props.onClick()
  assert.equal(f.media.muted, false)
  assert.equal(f.media.plays, 1)
  assert.equal(f.completions, 0)
  assert.equal(f.states[1], false)
  f.cleanup()
})

test('hidden pages pause and resume the same media; interrupted or disposed playback never restarts', async () => {
  const f = fixture()
  assert.equal(f.media.src, '/original/startup/blogo.webm')
  f.document.hidden = true
  f.listeners.get('visibilitychange')()
  assert.equal(f.media.pauses, 1)
  f.document.hidden = false
  f.listeners.get('visibilitychange')()
  assert.equal(f.media.plays, 2)
  f.tree.props.onKeyDown(event({ key: 'Escape' }))
  f.listeners.get('visibilitychange')()
  assert.equal(f.media.plays, 2)
  f.cleanup()
})

test('autoplay refusal offers a real resume control; late promise rejection cannot update an unmounted logo', async () => {
  const f = fixture()
  f.media.nextPlay = Promise.reject(new Error('policy'))
  f.listeners.get('visibilitychange')()
  await Promise.resolve()
  assert.equal(f.states[0], 'blocked')
  const play = nodes(f.render()).find(node => node.type === 'button' && node.props.children === 'Play logo')
  f.media.nextPlay = Promise.resolve()
  play.props.onClick()
  assert.equal(f.states[0], 'playing')
  assert.equal(f.media.loads, 0, 'resume does not reload')
  let reject
  f.media.nextPlay = new Promise((_, no) => { reject = no })
  f.listeners.get('visibilitychange')()
  f.cleanup()
  reject(new Error('disposed'))
  await Promise.resolve()
  assert.equal(f.states[0], 'playing')
})

test('decode failure is truthful and always retains an exit to the menu', () => {
  const f = fixture()
  nodes(f.tree).find(node => node.type === 'video').props.onError()
  assert.equal(f.states[0], 'failed')
  const tree = f.render()
  assert.match(nodes(tree).find(node => node.props?.role === 'status').props.children, /could not be played/)
  nodes(tree).find(node => node.type === 'button' && node.props.children === 'Skip logo').props.onClick()
  assert.equal(f.completions, 1)
  f.cleanup()
})

test('published logo is the hash-bound 188-frame source-derived conversion', () => {
  const provenance = JSON.parse(readFileSync(new URL('../decomp/research/startup-logo/conversion.json', import.meta.url)))
  const bytes = readFileSync(new URL('../public/original/startup/blogo.webm', import.meta.url))
  assert.equal(createHash('sha256').update(bytes).digest('hex'), provenance.outputSha256)
  assert.deepEqual([provenance.frames, provenance.width, provenance.height, provenance.fps], [188, 640, 352, 25])
  assert.equal(provenance.sourceSha256, '65602921453014c11b079b95f664a29c89727fb0b2d0dce4c40fee94665a80fa')
})

test('visibility return cannot resume a logo while its pointer release is pending', () => {
  const f = fixture()
  f.tree.props.onPointerDown(event({
    button: 0, pointerId: 7, currentTarget: { setPointerCapture() {} },
  }))
  assert.equal(f.media.plays, 1)
  assert.equal(f.completions, 0)
  f.document.hidden = true
  f.listeners.get('visibilitychange')()
  f.document.hidden = false
  f.listeners.get('visibilitychange')()
  assert.equal(f.media.plays, 1, 'visibility must not restart the pointer-paused clip')
  assert.equal(f.completions, 0, 'visibility must not release the pending transition')
  f.tree.props.onPointerUp(event({ pointerId: 7 }))
  assert.equal(f.completions, 1)
  f.cleanup()
})

test('late autoplay rejection while pointer-held cannot replace playback state or release the logo', async () => {
  const f = fixture()
  let reject
  f.media.nextPlay = new Promise((_, no) => { reject = no })
  f.listeners.get('visibilitychange')()
  f.tree.props.onPointerDown(event({
    button: 0, pointerId: 7, currentTarget: { setPointerCapture() {} },
  }))
  reject(new Error('play interrupted by pointer pause'))
  await Promise.resolve()
  assert.equal(f.states[0], 'playing', 'pending pointer release owns the transition')
  assert.equal(f.completions, 0)
  f.tree.props.onPointerCancel(event({ pointerId: 7 }))
  assert.equal(f.completions, 1)
  f.cleanup()
})

