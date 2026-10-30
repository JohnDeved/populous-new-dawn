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
function fixture({ artDecode = Promise.resolve() } = {}) {
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
  new Function('require', 'module', 'exports', 'document', 'Image', emitted)(name => {
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
    if (name === './original-hud.json') return { default: require('../app/original-hud.json') }
    if (name === './startup-logo.module.css') return { default: new Proxy({}, { get: (_, name) => name }) }
    throw Error(`Unexpected import: ${name}`)
  }, component, component.exports, document, class { decode() { return artDecode } })
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

test('a second pointer cannot replace the release gate or resume interrupted playback', () => {
  const f = fixture(), captures = []
  const press = pointerId => event({ button: 0, pointerId, currentTarget: { setPointerCapture: id => captures.push(id) } })
  f.tree.props.onPointerDown(press(7))
  f.tree.props.onPointerDown(press(8))
  assert.deepEqual(captures, [7])
  f.listeners.get('visibilitychange')()
  assert.equal(f.media.plays, 1)
  f.tree.props.onPointerUp(event({ pointerId: 8 }))
  assert.equal(f.completions, 0)
  f.tree.props.onPointerUp(event({ pointerId: 7 }))
  assert.equal(f.completions, 1)
  f.cleanup()
})

test('natural completion and accessible Skip use the same one-shot exit', () => {
  for (const type of ['video', 'button']) {
    const f = fixture()
    const control = nodes(f.tree).find(node => node.type === type &&
      (type === 'video' || node.props['aria-label'] === 'Skip logo'))
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
  const sound = nodes(f.tree).find(node => node.type === 'button' && node.props['aria-label'] === 'Enable logo sound')
  const down = event({ key: 'Enter' })
  sound.props.onKeyDown(down)
  assert.equal(down.stopped, true)
  assert.equal(down.prevented, false)
  sound.props.onClick()
  assert.equal(f.media.muted, false)
  assert.equal(f.media.plays, 2, 'trusted unmute also resumes without seeking/reloading')
  assert.equal(f.media.loads, 0)
  assert.equal(f.completions, 0)
  assert.equal(f.states[1], false)
  f.cleanup()
})

test('ordinary playback has no status strip and reveals accessible Skip only on focus', () => {
  const f = fixture()
  assert.equal(nodes(f.tree).some(node => node.props?.role === 'status'), false)
  const buttons = nodes(f.tree).filter(node => node.type === 'button')
  assert.deepEqual(buttons.map(node => node.props['aria-label']), ['Enable logo sound', 'Skip logo'])
  assert.equal(buttons[0].props.className, undefined, 'the sole sound-activation route remains discoverable')
  assert.equal(buttons[1].props.className, 'focusOnly')
  buttons[0].props.onClick()
  const sound = nodes(f.render()).find(node => node.props?.['aria-label'] === 'Mute logo')
  assert.equal(sound.props.className, 'focusOnly soundHidden', 'retain keyboard focus without invisible pointer interception')
  f.cleanup()
})

test('sound activation consumes repeats and release, without dismissing the logo', () => {
  for (const key of ['Enter', ' ']) {
    const f = fixture()
    const sound = nodes(f.tree).find(node => node.props?.['aria-label'] === 'Enable logo sound')
    const repeat = event({ key, repeat: true })
    sound.props.onKeyDown(repeat)
    assert.equal(repeat.prevented && repeat.stopped, true)
    const release = event({ key })
    sound.props.onKeyUp(release)
    assert.equal(release.stopped, true)
    assert.equal(f.completions, 0)
    const down = event(), up = event()
    sound.props.onPointerDown(down)
    sound.props.onPointerUp(up)
    assert.equal(down.stopped && up.stopped, true)
    assert.equal(f.media.pauses, 0)
    f.cleanup()
  }
})

test('logo framing keeps exact native ratios through production CSS minification', () => {
  const css = readFileSync(new URL('../app/startup-logo.module.css', import.meta.url), 'utf8')
  // Resolve Vite's declared minifier, including under pnpm's isolated layout.
  const { transform } = createRequire(require.resolve('vite'))('lightningcss')
  const minified = transform({ filename: 'startup-logo.css', code: Buffer.from(css), minify: true }).code.toString()
  assert.match(minified, /\.frame\{[^}]*aspect-ratio:4\/3/)
  assert.match(minified, /\.frame\{[^}]*height:min\(100dvh,75vw\)/)
  assert.match(minified, /\.video\{[^}]*aspect-ratio:20\/11/)
  assert.match(minified, /\.video\{[^}]*height:auto/)
  assert.match(minified, /\.video\{[^}]*top:50%/)
  assert.match(minified, /\.video\{[^}]*transform:translateY\(-50%\)/)
  assert.doesNotMatch(minified, /133\.333|13\.333|73\.333/)
  // At the rendered regression viewport, these source ratios give exactly
  // x=0, y=128, width=1280, height=704. The browser checker retains that oracle.
  assert.equal(960 * 4 / 3, 1280)
  assert.equal(960 * 64 / 480, 128)
  assert.equal(960 * 352 / 480, 704)
})

test('compatibility controls use original FONT0 and HUD frames, with an artwork-load fallback', async () => {
  const f = fixture()
  assert.equal(f.states[2], false)
  await Promise.resolve()
  assert.equal(f.states[2], true)
  const controlText = nodes(f.render()).find(node => typeof node.type === 'function')
  const glyphs = nodes(controlText.type(controlText.props)).filter(node => node.type === 'i')
  assert.equal(glyphs.length, 'Enable logo sound'.length)
  const hud = require('../app/original-hud.json')
  const first = hud.rects[`font0-${'E'.charCodeAt(0) - 32}`]
  assert.deepEqual(glyphs[0].props.style, { width: first.w, height: first.h, backgroundPosition: `-${first.x}px -${first.y}px` })
  const css = readFileSync(new URL('../app/startup-logo.module.css', import.meta.url), 'utf8')
  assert.doesNotMatch(css, /system-ui|sans-serif|border-radius: 4px/)
  for (const asset of ['hud.png', 'hud-button.png', 'hud-button-selected.png', 'hud-button-hover.png', 'tooltip-border.png'])
    assert.ok(css.includes(`/original/${asset}`))
  assert.match(css, /\.focusOnly:not\(:focus-visible\)\s*\{\s*opacity: 0/)
  assert.match(css, /\.soundHidden:not\(:focus-visible\)\s*\{ pointer-events: none;/)
  f.cleanup()
  const failed = fixture({ artDecode: Promise.reject(new Error('art unavailable')) })
  await Promise.resolve()
  await Promise.resolve()
  assert.equal(failed.states[2], false)
  const fallback = nodes(failed.render()).find(node => typeof node.type === 'function')
  assert.equal(fallback.type(fallback.props).props.children, 'Enable logo sound')
  failed.cleanup()
})

test('every control and recovery string has FONT0 glyphs and compact-width word advances', () => {
  const f = fixture(), labels = new Set()
  const hud = require('../app/original-hud.json')
  for (const playback of ['playing', 'blocked', 'failed']) for (const muted of [false, true]) {
    f.states[0] = playback
    f.states[1] = muted
    for (const node of nodes(f.render()).filter(node => typeof node.type === 'function')) labels.add(node.props.text)
  }
  assert.equal(labels.size, 6)
  for (const text of labels) {
    for (const character of text) assert.ok(hud.rects[`font0-${character.charCodeAt(0) - 32}`], `${text}: missing ${character}`)
    for (const word of text.split(' ')) {
      const width = [...word + ' '].reduce((sum, character) => sum + hud.rects[`font0-${character.charCodeAt(0) - 32}`].w, 0)
      assert.ok(width <= 320 - 24 - 20, `${word}: FONT0 word exceeds compact status content width`)
    }
  }
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
  const play = nodes(f.render()).find(node => node.type === 'button' && node.props['aria-label'] === 'Play logo')
  assert.equal(play.props.className, undefined, 'refused autoplay visibly offers resume')
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

test('hidden or interrupted sound activation never starts playback, and late art loading stays disposed', async () => {
  for (const interrupted of ['hidden', 'pointer']) {
    let resolveArt
    const f = fixture({ artDecode: new Promise(resolve => { resolveArt = resolve }) })
    if (interrupted === 'hidden') f.document.hidden = true
    else f.tree.props.onPointerDown(event({ button: 0, pointerId: 7, currentTarget: { setPointerCapture() {} } }))
    nodes(f.tree).find(node => node.props?.['aria-label'] === 'Enable logo sound').props.onClick()
    assert.equal(f.media.plays, 1)
    f.cleanup()
    resolveArt()
    await Promise.resolve()
    assert.equal(f.states[2], false)
  }
})

test('decode failure is truthful and always retains an exit to the menu', () => {
  const f = fixture()
  nodes(f.tree).find(node => node.type === 'video').props.onError()
  assert.equal(f.states[0], 'failed')
  const tree = f.render()
  assert.match(nodes(tree).find(node => node.props?.role === 'status').props['aria-label'], /could not be played/)
  const skip = nodes(tree).find(node => node.type === 'button' && node.props['aria-label'] === 'Skip logo')
  assert.equal(skip.props.className, undefined, 'failure recovery is visibly actionable')
  assert.equal(nodes(tree).filter(node => node.type === 'button').length, 1)
  skip.props.onClick()
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

