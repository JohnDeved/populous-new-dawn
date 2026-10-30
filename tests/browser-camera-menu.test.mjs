import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { zoomOutAfterPauseMenu } from '../scripts/browser-camera-menu.mjs'

function fixture() {
  const calls = []
  let menuOpen = false, paused = true
  const view = { preset: 3, remaining: 0, config: { scale: 256 }, point: { x: 2, y: 30 }, bearing: 0 }
  const page = {
    getByRole(role, { name, exact }) {
      assert.equal(role, 'button'); assert.equal(exact, true)
      return {
        async click() {
          assert.ok(['Menu', 'Continue Game'].includes(name), `no retired control: ${name}`)
          calls.push(name)
          if (name === 'Menu') menuOpen = true
          else { assert.equal(menuOpen, true); menuOpen = false }
        },
        async count() { assert.equal(name, 'Zoom out'); return 0 },
      }
    },
    locator(selector) {
      return {
        async waitFor({ state }) {
          assert.equal(selector, 'dialog[data-original-pause-menu]')
          assert.equal(menuOpen, state === 'visible'); calls.push(`menu ${state}`)
        },
        async press(key) {
          assert.equal(selector, '.world-viewport'); assert.equal(key, '-')
          assert.equal(menuOpen, false); assert.equal(paused, true)
          calls.push('keyboard zoom'); view.preset = 0; view.remaining = 18
        },
      }
    },
    async waitForFunction(predicate) {
      assert.match(String(predicate), /window.testScene.world.paused/)
      assert.equal(paused, true); calls.push('pause restored')
    },
  }
  return { calls, view, page, state: async () => structuredClone(view),
    advance: async (...args) => {
      assert.deepEqual(args, [], 'reuse the camera fixture default 18-frame advance')
      assert.equal(menuOpen, false); assert.equal(view.remaining, 18)
      calls.push('advance'); view.remaining = 0; view.config = { scale: 128 }
    } }
}

test('camera fixture closes native menu, restores paused ownership, then schedules keyboard zoom before advancing', async () => {
  const ui = fixture()
  await zoomOutAfterPauseMenu(ui.page, ui.state, ui.advance)
  assert.deepEqual(ui.calls, ['Menu', 'menu visible', 'Continue Game', 'menu hidden', 'pause restored', 'keyboard zoom', 'advance'])
  assert.deepEqual(ui.view.point, { x: 2, y: 30 }); assert.equal(ui.view.bearing, 0)
})

test('camera fixture rejects a menu that changes the image instead of silently accepting a different camera setup', async () => {
  const ui = fixture(), state = ui.state
  let reads = 0
  await assert.rejects(zoomOutAfterPauseMenu(ui.page, async () => {
    const snapshot = await state()
    if (++reads === 2) snapshot.config.scale++
    return snapshot
  }, ui.advance), /Opening the native menu does not change the view/)
  assert.deepEqual(ui.calls, ['Menu', 'menu visible'])
})

test('shipped camera check uses the tested sequence and retains its deterministic frame driver and schedule matrix', () => {
  const source = readFileSync(new URL('../scripts/check-browser-camera-view.mjs', import.meta.url), 'utf8')
  assert.match(source, /await zoomOutAfterPauseMenu\(page, state, advance\)/)
  assert.match(source, /const advance = \(frames = 18\)/)
  assert.match(source, /s.updateCameraMotion\(1 \/ 24\)/)
  assert.match(source, /\[30, 60, 120, 144, 0\]/)
  assert.doesNotMatch(source, /name: 'Zoom out'|name: 'Close menu'/)
})
