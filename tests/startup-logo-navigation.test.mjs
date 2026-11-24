import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'

// Execute the shipped dialog key handler. DOM targets and event bubbling are
// supplied; this is not trusted browser focus or actual media playback evidence.
const source = readFileSync(new URL('../app/startup-logo.tsx', import.meta.url), 'utf8')
const start = '\n      onKeyDown={'
const end = '\n      onPointerDown='
assert.equal(source.split(start).length, 2)
const at = source.indexOf(start) + start.length
const stop = source.indexOf(end, at)
assert.ok(stop > at)
const expression = source.slice(at, stop).trim().slice(0, -1)
const compiled = stripTypeScriptTypes(`const handler = ${expression}`)
function fixture(control = false) {
  let completions = 0
  const key = Function('complete', compiled + '\nreturn handler')(() => completions++)
  return {
    get completions() { return completions },
    key(name, extra = {}) {
      const event = { key: name, repeat: false, prevented: false, stopped: false,
        target: { closest: selector => control && selector === 'button' ? {} : null },
        preventDefault() { this.prevented = true },
        stopPropagation() { this.stopped = true }, ...extra }
      key(event)
      return event
    },
  }
}

test('logo dialog and buttons preserve complete forward and reverse Tab key sequences', () => {
  for (const control of ['initial dialog', 'Enable logo sound', 'Play logo', 'Mute logo', 'Skip logo']) {
    const f = fixture(control !== 'initial dialog')
    for (const [key, extra] of [
      ['Tab', {}], ['Shift', {}], ['Tab', { shiftKey: true }],
      ['Tab', { shiftKey: true, repeat: true }], ['Shift', { repeat: true }],
    ]) {
      const event = f.key(key, extra)
      assert.equal(event.prevented, false, `${control}: ${key} stays with browser navigation`)
      assert.equal(event.stopped, false)
      assert.equal(f.completions, 0, `${control}: navigation cannot skip the logo`)
    }
  }
})

test('ordinary skip keys retain their existing behavior', () => {
  for (const control of [false, true]) {
    for (const name of ['Escape', 'Enter', ' ', 'a', 'ArrowRight']) {
      const f = fixture(control)
      const repeat = f.key(name, { repeat: true })
      assert.equal(repeat.prevented, true)
      assert.equal(f.completions, 0)
      const press = f.key(name)
      assert.equal(press.prevented && press.stopped, true)
      assert.equal(f.completions, 1)
    }
  }
})

test('Tab from the logo body remains reserved for reaching browser controls', () => {
  const f = fixture()
  assert.equal(f.key('Tab').prevented, false)
  assert.equal(f.completions, 0)
})
