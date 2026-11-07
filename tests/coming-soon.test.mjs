import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import ts from 'typescript'

const sessionSource = readFileSync(new URL('../app/coming-soon-session.ts', import.meta.url), 'utf8')
const { createComingSoonSession } = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(sessionSource)).toString('base64')}`)
const source = readFileSync(new URL('../app/coming-soon.tsx', import.meta.url), 'utf8')
const emitted = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText

function events() {
  const listeners = new Map()
  return {
    listeners,
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener(name, fn) { assert.equal(listeners.get(name), fn); listeners.delete(name) },
  }
}

// Execute actual JSX callbacks, layout effects and the real session. Supplied
// hook/DOM/media boundaries are not mounted React, trusted input or decoder proof.
function fixture() {
  const refs = [], states = [], effects = []
  let refIndex = 0, stateIndex = 0, completions = 0
  const document = { ...events(), hidden: false }, window = events()
  const media = {
    muted: true, error: null, plays: 0, pauses: 0, loads: 0,
    play() { this.plays++; return Promise.resolve() },
    pause() { this.pauses++ }, load() { this.loads++ },
    removeAttribute(name) { assert.equal(name, 'src'); delete this.src },
  }
  const modal = { open: false, showModal() { this.open = true }, close() { this.open = false }, focus() {} }
  const module = { exports: {} }
  new Function('require', 'module', 'exports', 'document', 'window', emitted)(name => {
    if (name === 'react') return {
      useRef(value) { return refs[refIndex] ??= { current: value }, refs[refIndex++] },
      useState(value) {
        const at = stateIndex++
        if (!(at in states)) states[at] = value
        return [states[at], next => { states[at] = next }]
      },
      useLayoutEffect: effect => effects.push(effect),
    }
    if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) }
    if (name === './coming-soon-session') return { createComingSoonSession }
    if (name === './coming-soon.module.css') return { default: {} }
    throw new Error(`Unexpected import ${name}`)
  }, module, module.exports, document, window)
  function render() {
    refIndex = stateIndex = 0
    effects.length = 0
    const tree = module.exports.ComingSoon({ onComplete: () => completions++ })
    refs[0].current = modal
    refs[1].current = media
    return tree
  }
  const tree = render()
  effects[0]()
  const cleanup = effects[1]()
  return { tree, render, media, modal, document, window, cleanup, states, get completions() { return completions } }
}
function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes)
  if (!node || typeof node !== 'object') return []
  return [node, ...nodes(node.props?.children)]
}
function event(extra = {}) {
  return { key: '', code: '', repeat: false, prevented: false, stopped: false,
    target: { closest: () => null }, currentTarget: { setPointerCapture() {} },
    preventDefault() { this.prevented = true }, stopPropagation() { this.stopped = true }, ...extra }
}

test('opens the source trailer in a separate modal and unloads/removes both listeners on cleanup', () => {
  const f = fixture()
  assert.equal(f.media.src, '/original/coming-soon/trailer.webm')
  assert.equal(f.modal.open, true)
  assert.equal(f.media.plays, 1)
  assert.equal(f.document.listeners.size, 1)
  assert.equal(f.window.listeners.size, 1)
  f.cleanup()
  assert.equal(f.modal.open, false)
  assert.equal(f.media.src, undefined)
  assert.equal(f.media.loads, 1)
  assert.equal(f.document.listeners.size + f.window.listeners.size, 0)
})

test('fresh keys stop on down and return only after release; repeat-at-entry and Tab do not skip', () => {
  for (const key of ['Enter', ' ', 'Escape', 'a']) {
    const f = fixture()
    f.tree.props.onKeyDown(event({ key, repeat: true }))
    assert.equal(f.completions, 0)
    const tab = event({ key: 'Tab' })
    f.tree.props.onKeyDown(tab)
    assert.equal(tab.prevented, false)
    const down = event({ key })
    f.tree.props.onKeyDown(down)
    assert.equal(down.prevented && down.stopped, true)
    assert.equal(f.completions, 0)
    assert.equal(f.media.pauses, 1)
    const up = event({ key })
    f.tree.props.onKeyUp(up)
    assert.equal(up.prevented && up.stopped, true)
    assert.equal(f.completions, 1)
    f.cleanup()
  }
})

test('pointer skip absorbs matching release/cancel/capture loss and stops propagation', () => {
  for (const terminal of ['onPointerUp', 'onPointerCancel', 'onLostPointerCapture']) {
    for (const button of [0, 1, 2, 3]) {
      const f = fixture(), down = event({ button, pointerId: 3 })
      f.tree.props.onPointerDown(down)
      assert.equal(down.prevented && down.stopped, true)
      assert.equal(f.media.pauses, 1)
      f.tree.props[terminal](event({ pointerId: 4 }))
      assert.equal(f.completions, 0)
      f.tree.props[terminal](event({ pointerId: 3 }))
      assert.equal(f.completions, 1)
      f.cleanup()
    }
  }
})

test('sound control uses only this media element and remains keyboard accessible', () => {
  const f = fixture(), control = { closest: () => ({}) }
  const enter = event({ key: 'Enter', target: control })
  f.tree.props.onKeyDown(enter)
  assert.equal(enter.prevented, false)
  assert.equal(enter.stopped, true)
  f.tree.props.onKeyUp(event({ key: 'Enter', target: control }))
  nodes(f.tree).find(node => node.type === 'button').props.onClick()
  assert.equal(f.media.muted, false)
  assert.equal(f.media.plays, 1)
  assert.equal(f.completions, 0)
  assert.doesNotMatch(source, /localStorage|sessionStorage|audioPreferences|new AudioContext/)
  f.cleanup()
})

test('natural completion during a sound-control press still consumes the release', () => {
  const f = fixture(), control = { closest: () => ({}) }
  f.tree.props.onPointerDown(event({ button: 0, pointerId: 5, target: control }))
  nodes(f.tree).find(node => node.type === 'video').props.onEnded()
  assert.equal(f.completions, 0)
  const up = event({ pointerId: 5, target: control })
  f.tree.props.onPointerUp(up)
  assert.equal(up.prevented, true)
  assert.equal(f.completions, 1)
  f.cleanup()
})

test('decode failure retains truthful message and explicit exit', () => {
  const f = fixture()
  nodes(f.tree).find(node => node.type === 'video').props.onError()
  const tree = f.render()
  assert.match(nodes(tree).find(node => node.props?.role === 'status').props.children, /could not be played/)
  const buttons = nodes(tree).filter(node => node.type === 'button')
  assert.equal(buttons.length, 1)
  assert.equal(buttons[0].props.children, 'Skip trailer')
  buttons[0].props.onClick()
  assert.equal(f.completions, 1)
  f.cleanup()
})
