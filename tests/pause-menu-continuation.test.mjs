import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { continuePauseMenu } from '../app/pause-menu-continuation.ts'

// A focused lifecycle model, not a browser test. Chromium's close restoration
// checks was_modal or a still-focused descendant. Removal clears modal state
// and drops descendant focus without running that restoration.
function fixture({ fullscreen = false, openerConnected = true, openerFocusable = true } = {}) {
  const calls = [], body = {}, control = {}, opener = { connected: openerConnected, focusable: openerFocusable }
  let active = opener, previous = null, modal = false, open = false, connected = true
  const dialog = {
    showModal() { calls.push('show'); open = true; modal = true; previous = active; active = control },
    close() {
      calls.push('close')
      if (!open) return
      const wasModal = modal
      open = false; modal = false
      const old = previous; previous = null
      if (old && (wasModal || active === control) && old.connected && old.focusable) active = old
    },
    remove() {
      calls.push('remove'); connected = false; modal = false
      if (active === control) active = body
    },
  }
  dialog.showModal()
  calls.length = 0
  return { calls, body, opener, control, dialog,
    get active() { return active }, get open() { return open }, get connected() { return connected },
    get fullscreen() { return fullscreen },
    focusControl() { active = control },
  }
}

test('ordinary continuation closes the live modal before parent removal and retains native opener focus', () => {
  for (const fullscreen of [false, true]) {
    const f = fixture({ fullscreen })
    let callbackCount = 0
    continuePauseMenu(f.dialog, () => {
      callbackCount++
      assert.equal(f.open, false)
      assert.equal(f.connected, true)
      assert.equal(f.active, f.opener)
      f.dialog.remove()
    })
    assert.equal(callbackCount, 1)
    assert.deepEqual(f.calls, ['close', 'remove'])
    assert.equal(f.active, f.opener)
    assert.equal(f.fullscreen, fullscreen, 'continuation never changes fullscreen')
    f.dialog.close() // Existing effect cleanup is harmless after the early close.
    assert.equal(f.active, f.opener)
  }
})

test('the same lifecycle model rejects removal followed by late passive cleanup close', () => {
  const f = fixture()
  f.dialog.remove()
  f.dialog.close()
  assert.equal(f.active, f.body)
  assert.notEqual(f.active, f.opener)
  assert.deepEqual(f.calls, ['remove', 'close'])
})

test('fullscreen close/re-promotion retains the same opener for later ordinary continuation', () => {
  const f = fixture({ fullscreen: true })
  f.dialog.close()
  assert.equal(f.active, f.opener)
  f.dialog.showModal()
  f.focusControl()
  f.calls.length = 0
  continuePauseMenu(f.dialog, () => f.dialog.remove())
  assert.deepEqual(f.calls, ['close', 'remove'])
  assert.equal(f.active, f.opener)
  assert.equal(f.fullscreen, true)
})

test('continuation does not invent focus for a disconnected or unfocusable remembered opener', () => {
  for (const options of [{ openerConnected: false }, { openerFocusable: false }]) {
    const f = fixture(options)
    continuePauseMenu(f.dialog, () => f.dialog.remove())
    assert.equal(f.active, f.body)
    assert.notEqual(f.active, f.opener)
  }
})

test('a dialog already removed cannot be repaired by claiming native focus restoration', () => {
  const f = fixture()
  f.dialog.remove()
  continuePauseMenu(f.dialog, () => {})
  assert.equal(f.active, f.body)
})

test('missing dialog preserves the parent callback; close or callback errors are not hidden', () => {
  let count = 0
  continuePauseMenu(null, () => count++)
  assert.equal(count, 1)
  const closeError = new Error('close failed')
  assert.throws(() => continuePauseMenu({ close() { throw closeError } }, () => count++), error => error === closeError)
  assert.equal(count, 1)
  const callbackError = new Error('parent failed')
  let closed = false
  assert.throws(() => continuePauseMenu({ close() { closed = true } }, () => { throw callbackError }), error => error === callbackError)
  assert.equal(closed, true)
})

test('shipped root Back and Continue Game use the helper; navigation actions retain their own callbacks', () => {
  const source = readFileSync(new URL('../app/original-pause-menu.tsx', import.meta.url), 'utf8')
  assert.match(source, /import \{ continuePauseMenu \} from '\.\/pause-menu-continuation'/)
  assert.match(source, /if \(panel === 'root'\) continuePauseMenu\(dialog\.current, props\.onContinue\)/)
  assert.match(source, /if \(label === 'Continue Game'\) continuePauseMenu\(dialog\.current, props\.onContinue\)/)
  assert.equal(source.match(/continuePauseMenu\(dialog\.current, props\.onContinue\)/g)?.length, 2)
  assert.equal(source.includes('props.onContinue()'), false)
  assert.match(source, /panel === 'options' && props\.renderOptions\(\(\) => setPanel\('root'\)\)/)
  assert.match(source, /restart: \{ question: 'Restart Level\?', action: props\.onRestart \}/)
  assert.match(source, /'quit-level': \{ question: 'Quit Level\?', action: props\.onQuitLevel \}/)
  assert.match(source, /'quit-game': \{ question: 'Quit Game\?', action: props\.onQuitGame \}/)
  assert.match(source, /onClick=\{\(\) => once\(props\.onLoad\)\}/)
})
