import assert from 'node:assert/strict'
import { assertLive, readWitness } from './witness.mjs'

// Browser-delivered mouse/key input around explicitly synthetic interruption events.
// No direct handler calls or world writes. This is not OS focus-loss evidence.
export async function interruptOwnedSwamp({ page, deadline, point, stage }) {
  for (const kind of ['canvas-pointercancel', 'window-pointercancel', 'window-blur']) {
    const before = await deadline.run(() => page.evaluate(readWitness))
    assertLive(before)
    await deadline.run(() => page.evaluate(() => {
      const canvas = window.testSceneRef.current.renderer.domElement
      window.__ownedSwampPress = null
      canvas.addEventListener('pointerdown', event => {
        window.__ownedSwampPress = { pointerId: event.pointerId, pointerType: event.pointerType, button: event.button }
      }, { once: true })
    }))
    await deadline.run(() => page.keyboard.down('Shift'))
    let delivered
    try {
      await deadline.run(() => page.mouse.move(point.x, point.y))
      await deadline.run(() => page.mouse.down({ button: 'right' }))
      delivered = await deadline.run(() => page.evaluate(dispatchInterruption, kind))
      const interrupted = await deadline.run(() => page.evaluate(readWitness))
      if (interrupted.paused) {
        // Keep the right mouse press intact: a left click here forms a button chord.
        // Activate the shipped button through trusted keyboard input without moving the pointer.
        await deadline.run(() => page.getByRole('button', { name: 'Resume game', exact: true }).focus())
        await deadline.run(() => page.keyboard.press('Enter'))
        await deadline.run(() => page.waitForFunction(() => !window.testStore.getWorld().paused))
      }
      // A stationary stale release must still hit the trap in an admitted world.
      const release = await deadline.run(() => page.evaluate(({ x, y }) => {
        const h = window.__ownedSwampWitness, s = window.testSceneRef.current
        const hit = s.pick({ clientX: x, clientY: y })
        return { current: s === h.scene && s.world === h.world && window.testStore.getWorld() === h.world,
          canvasOwned: document.elementFromPoint(x, y) === s.renderer.domElement,
          distance: hit ? Math.hypot(hit.x - h.fx.x, hit.z - h.fx.z) : null,
          paused: h.world.paused, inputMask: h.world.inputMask, mode: h.world.mode }
      }, point))
      assert.equal(release.current, true)
      assert.equal(release.canvasOwned, true)
      assert.ok(release.distance !== null && release.distance <= 0.5, 'Interrupted release must still pick trap')
      assert.equal(release.paused, false, 'Pause must not mask stale release rejection')
      assert.equal(release.inputMask, 0)
      assert.equal(release.mode, null)
      delivered.release = release
      delivered.resumed = interrupted.paused
      await deadline.run(() => page.mouse.move(point.x, point.y))
      await deadline.run(() => page.mouse.up({ button: 'right' }))
    } finally {
      await deadline.run(() => page.keyboard.up('Shift'))
    }
    const after = await deadline.run(() => page.evaluate(readWitness))
    assertLive(after)
    assert.deepEqual(after, before, `${kind}: stale stationary release must preserve observed live state`)
    stage('live-control-' + kind, { before, after, delivered })
  }
}

// Runs in the page; observation and DOM event delivery only.
export function dispatchInterruption(kind) {
  const press = window.__ownedSwampPress, h = window.__ownedSwampWitness
  const scene = window.testSceneRef.current
  if (!press || press.button !== 2 || !Number.isFinite(press.pointerId)) throw Error('Missing actual right press')
  if (scene !== h.scene || scene.world !== h.world || window.testStore.getWorld() !== h.world)
    throw Error('Interruption requires current scene/store')
  const gesture = scene.pointerGesture
  if (!gesture || gesture.pointerId !== press.pointerId || gesture.moved !== false)
    throw Error('Interruption requires the matching armed stationary gesture')
  const before = { pointerId: gesture.pointerId, moved: gesture.moved, pointerButtons: scene.pointerButtons }
  const canvas = scene.renderer.domElement
  const target = kind === 'canvas-pointercancel' ? canvas : window
  const event = kind === 'window-blur' ? new Event('blur') :
    new PointerEvent('pointercancel', { pointerId: press.pointerId, pointerType: press.pointerType, button: 2, bubbles: true })
  target.dispatchEvent(event)
  if (scene.pointerGesture !== null || scene.pointerButtons !== 0)
    throw Error('Interruption did not immediately clear pointer ownership')
  return { kind, press, before, after: { pointerGesture: null, pointerButtons: 0 }, syntheticInterruption: !event.isTrusted }
}
