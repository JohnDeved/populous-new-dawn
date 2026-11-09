import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'

const source = readFileSync(new URL('../app/original-options.tsx', import.meta.url), 'utf8')
const compile = (parameters, body) =>
  Function(`return ${stripTypeScriptTypes(`(function (${parameters.join(', ')}) {${body}\n})`)}`)()

function between(start, end) {
  const from = source.indexOf(start)
  assert.notEqual(from, -1, start)
  const to = source.indexOf(end, from + start.length)
  assert.notEqual(to, -1, end)
  return source.slice(from + start.length, to)
}

// Execute the actual return handlers and their focus effect with supplied
// commit, DOM and frame boundaries. This does not mount React or prove pixels.
const focusBody = between(
  '    // heading and first controls before the player has had a chance to read them.\n',
  '\n  }, [browser])'
)
const listenerBody = between(
  '  useEffect(() => {\n    if (!browser) return\n    const element = root.current',
  '\n  }, [browser])'
)
const returnBody = between('  function returnFromBrowser() {', '\n  }\n  function select(')

function fixture() {
  let browser = true, mounted = true, dialogOpen = true, focused = null, focusCalls = 0
  let prevented = 0, stopped = 0
  const frames = [], listeners = new Map()
  const returningFromBrowser = { current: false }
  const controls = Object.fromEntries(['heading', 'compatibility', 'newer'].map(name => [
    name, { name, focus() {
      // Real disconnected elements cannot take document focus.
      if (name !== 'newer' && !mounted) return
      focused = name; focusCalls++
    } },
  ]))
  const element = {
    querySelector(selector) {
      if (selector === '[data-browser-help-heading]') return browser ? controls.heading : null
      assert.equal(selector, '[data-compatibility]')
      return browser ? null : controls.compatibility
    },
    closest(selector) { assert.equal(selector, 'dialog'); return { open: dialogOpen } },
  }
  const root = { current: element }
  const document = {
    addEventListener(type, callback, capture) {
      assert.equal(type, 'keydown'); assert.equal(capture, true)
      listeners.set(type, callback)
    },
    removeEventListener(type, callback, capture) {
      assert.equal(type, 'keydown'); assert.equal(capture, true)
      if (listeners.get(type) === callback) listeners.delete(type)
    },
  }
  const requestAnimationFrame = callback => { frames.push(callback); return frames.length }
  const setBrowser = value => { browser = value }
  const focus = compile(['browser', 'root', 'returningFromBrowser'], focusBody)
  const back = compile(
    ['root', 'returningFromBrowser', 'setBrowser', 'requestAnimationFrame'], returnBody
  ).bind(null, root, returningFromBrowser, setBrowser, requestAnimationFrame)
  const cleanup = compile([
    'browser', 'element', 'returningFromBrowser', 'setBrowser', 'requestAnimationFrame', 'document',
  ], listenerBody)(true, element, returningFromBrowser, setBrowser, requestAnimationFrame, document)
  return {
    controls,
    back,
    key(key) {
      listeners.get('keydown')?.({
        key, preventDefault() { prevented++ }, stopPropagation() { stopped++ },
      })
    },
    commit() { if (mounted) focus(browser, root, returningFromBrowser) },
    reopen() { browser = true },
    closeDialog() { dialogOpen = false },
    unmount() { mounted = false; root.current = null; cleanup() },
    frames() { for (const callback of frames.splice(0)) callback() },
    state: () => ({ browser, focused, focusCalls, pendingFrames: frames.length, prevented, stopped }),
  }
}

for (const [name, leave] of [
  ['Back', ui => ui.back()],
  ['Escape', ui => ui.key('Escape')],
]) {
  test(`${name} restores compatibility focus in the closing commit, once`, () => {
    const ui = fixture()
    ui.commit()
    assert.equal(ui.state().focused, 'heading')
    leave(ui)
    ui.commit()
    assert.equal(ui.state().focused, 'compatibility')
    assert.equal(ui.state().pendingFrames, 0)
    const calls = ui.state().focusCalls
    ui.commit()
    assert.equal(ui.state().focusCalls, calls)
  })

  test(`${name} cannot steal later focus with a delayed frame`, () => {
    const ui = fixture()
    leave(ui)
    ui.commit()
    ui.controls.newer.focus()
    ui.frames()
    assert.equal(ui.state().focused, 'newer')
  })

  test(`${name} cannot focus retired Options after unmount`, () => {
    const ui = fixture()
    leave(ui)
    ui.unmount()
    ui.controls.newer.focus()
    ui.frames()
    assert.equal(ui.state().focused, 'newer')
  })

  test(`${name} permits a fresh Help visit and return`, () => {
    const ui = fixture()
    leave(ui); ui.commit(); ui.frames()
    ui.reopen(); ui.commit()
    assert.equal(ui.state().focused, 'heading')
    ui.back(); ui.commit(); ui.frames()
    assert.equal(ui.state().focused, 'compatibility')
  })

  test(`${name} repeats before commit restore focus only once`, () => {
    const ui = fixture()
    leave(ui); leave(ui)
    ui.commit(); ui.frames()
    assert.equal(ui.state().focused, 'compatibility')
    assert.equal(ui.state().focusCalls, 1)
  })
}

test('unrelated keys do not leave Help or schedule focus', () => {
  const ui = fixture()
  for (const key of ['Tab', 'Enter', 'ArrowDown']) ui.key(key)
  assert.deepEqual(ui.state(), {
    browser: true, focused: null, focusCalls: 0, pendingFrames: 0, prevented: 0, stopped: 0,
  })
})

test('Escape owns its event only while the enclosing dialog is open', () => {
  const ui = fixture()
  ui.closeDialog()
  ui.key('Escape')
  assert.deepEqual(ui.state(), {
    browser: true, focused: null, focusCalls: 0, pendingFrames: 0, prevented: 0, stopped: 0,
  })
})

test('Escape listener is removed when Options unmounts', () => {
  const ui = fixture()
  ui.key('Escape')
  assert.equal(ui.state().prevented, 1)
  assert.equal(ui.state().stopped, 1)
  ui.unmount()
  ui.key('Escape')
  assert.equal(ui.state().prevented, 1)
  assert.equal(ui.state().stopped, 1)
})

test('return focus uses the layout phase and no delayed focus owner', () => {
  assert.match(source, /useLayoutEffect\(\(\) => \{\n {4}\/\/ Help can overflow\./)
  assert.doesNotMatch(returnBody + listenerBody, /requestAnimationFrame/)
})
