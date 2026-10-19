// Execute the actual Page control and readout JSX. DOM input delivery and React
// scheduling are supplied here; the ordinary browser episode covers those owners.
import assert from 'node:assert/strict'
import test from 'node:test'
import hud from '../app/original-hud.json' with { type: 'json' }
import { pageSource, pageButton, evaluatePage, pageNearby, pageEffect, nearbyEvent, noOp } from './support/follower-nearby-page.mjs'

function fixture(overrides) {
  const calls = [], world = { castingTribes: [{ flags: 0 }], manaWorld: { gameFlags: 0 }, inputMask: 0 },
    scene = { world, allowed: true, canRequestNearbyFollowers() { return this.allowed }, overview: () => calls.push('overview'), requestNearbyFollowers: () => calls.push('nearby'), cancelNearbyFollowers: () => calls.push('cancel') },
    page = pageNearby(scene, overrides)
  return { calls, world, scene, page }
}

test('actual HFX875 Page activation requests follower mode instead of opening overview', () => {
  const { calls, page } = fixture(), control = page.render()
  const input = nearbyEvent()
  control.props.onPointerDown?.(input)
  control.props.onPointerUp?.(input)
  control.props.onClick?.(input)
  assert.deepEqual(calls, ['nearby'])
  assert.equal(control.props['aria-label'], 'Nearby followers')
})

test('all four native follower mode frames are available without placeholder artwork', () => {
  for (const id of [875, 876, 877, 878]) {
    assert.ok(hud.rects[id], `Missing original HFX${id}`)
    assert.deepEqual([hud.rects[id].w, hud.rects[id].h], [19, 16])
  }
})

test('actual persistent Total uses nearby display counts and the alternate number font', () => {
  const view = evaluatePage(pageButton(['population-button']).getText(pageSource), {
    world: {}, population: () => 7, populationLimit: () => 12, followerControl: () => ({}),
    PopulationMeter: 'PopulationMeter', FollowerNumber: 'FollowerNumber',
    nearby: true, followerCounts: { totals: [6], displayTotals: [0] },
  })
  const number = view.children.find(child => child.type === 'FollowerNumber')
  const meter = view.children.find(child => child.type === 'PopulationMeter')
  assert.deepEqual([number.props.count, number.props.total, number.props.alternate], [0, true, true])
  assert.deepEqual([meter.props.population, meter.props.capacity], [7, 12])
})

test('actual Page press cancellation, wrong release and secondary input never request mode', () => {
  for (const cancel of ['onPointerLeave', 'onPointerCancel', 'onBlur']) {
    const { calls, page } = fixture(), control = page.render().props, input = nearbyEvent()
    control.onPointerDown(input)
    assert.equal(page.pressed, true)
    control[cancel](input)
    control.onPointerUp(input)
    control.onClick(input)
    assert.equal(page.pressed, false)
    assert.deepEqual(calls, [], cancel)
  }
  const { calls, page } = fixture(), control = page.render().props
  control.onPointerDown(nearbyEvent({ button: 2 }))
  control.onPointerUp(nearbyEvent({ button: 2 }))
  control.onContextMenu(nearbyEvent({ button: 2 }))
  control.onPointerDown(nearbyEvent())
  control.onPointerUp(nearbyEvent({ pointerId: 10 }))
  assert.deepEqual(calls, [])
  control.onPointerUp(nearbyEvent({ clientX: 40 }))
  assert.deepEqual(calls, [], 'capture cannot convert outside release to a request')
})

test('Ctrl-primary and Shift-primary release exactly once; keyboard completes without held repeats', () => {
  for (const modifiers of [{ ctrlKey: true }, { shiftKey: true }, { ctrlKey: true, shiftKey: true }]) {
    const { calls, page } = fixture(), control = page.render().props, input = nearbyEvent(modifiers)
    control.onPointerDown(input)
    control.onContextMenu(input)
    assert.deepEqual(calls, [])
    control.onPointerUp(input)
    control.onClick(input)
    assert.deepEqual(calls, ['nearby'])
  }
  for (const key of ['Enter', ' ']) {
    const { calls, page } = fixture(), control = page.render().props, input = nearbyEvent({ key, repeat: false })
    control.onKeyDown(input)
    for (let i = 0; i < 4; i++) control.onKeyDown({ ...input, repeat: true })
    assert.deepEqual(calls, [])
    assert.equal(page.pressed, true)
    control.onKeyUp(input)
    control.onKeyUp(input)
    assert.deepEqual(calls, ['nearby'])
    assert.equal(page.pressed, false)
    control.onClick(nearbyEvent({ detail: 0 }))
    assert.deepEqual(calls, ['nearby', 'nearby'], 'assistive click remains accessible')
  }
})

test('Page ready/modal/load/owner gates reject arming and recheck ownership at release', () => {
  for (const overrides of [{ ready: false }, { menu: true }, { selectorOpen: true }, { startup: 'choice' }]) {
    const { calls, page } = fixture(overrides), control = page.render().props
    assert.equal(control.disabled, true)
    control.onPointerDown(nearbyEvent())
    control.onPointerUp(nearbyEvent())
    assert.deepEqual(calls, [])
  }
  const { calls, page, scene } = fixture(), control = page.render().props
  control.onPointerDown(nearbyEvent())
  scene.allowed = false
  control.onPointerUp(nearbyEvent())
  assert.deepEqual(calls, [])
  scene.allowed = true
  control.onPointerDown(nearbyEvent())
  page.bindings.engine.current = { ...scene }
  control.onPointerUp(nearbyEvent())
  assert.deepEqual(calls, [], 'a replacement cannot own the old press')
})

test('four actual Page states read only committed mode and the separately held press', () => {
  const { world, page } = fixture()
  for (const nearby of [false, true]) {
    world.castingTribes[0].flags = nearby ? 128 : 0
    for (const pressed of [false, true]) {
      page.clearNearbyPress()
      if (pressed) page.render().props.onPointerDown(nearbyEvent())
      const control = page.render()
      assert.equal(control.props['aria-pressed'], nearby)
      assert.equal(control.children[0].props.id, 875 + 2 * Number(nearby) + Number(pressed))
    }
  }
  const control = page.render().props
  assert.equal(control.onPointerEnter, undefined, 'hover never arms the control')
  control.onContextMenu({ preventDefault: noOp })
})

test('actual Page readiness effect owns Scene HUD admission and cancels only its own press', () => {
  const { scene, page, calls } = fixture(),
    effect = pageEffect('scene.onNearbyFollowersCancel =', page.bindings), cleanup = effect()
  assert.equal(scene.nearbyFollowersHudActive, true)
  page.render().props.onPointerDown(nearbyEvent())
  scene.onNearbyFollowersCancel()
  assert.equal(page.pressed, false)
  page.render().props.onPointerDown(nearbyEvent())
  const replacement = { ...scene }
  page.nearbyPress.current = { scene: replacement, pointer: 9 }
  scene.onNearbyFollowersCancel()
  assert.equal(page.pressed, true, 'stale Scene callback cannot cancel a newer Scene press')
  assert.equal(page.nearbyPress.current.scene, replacement)
  cleanup()
  assert.equal(scene.nearbyFollowersHudActive, false)
  assert.equal(scene.onNearbyFollowersCancel, undefined)
  assert.deepEqual(calls, ['cancel'])
  const inactive = fixture({ ready: false })
  pageEffect('scene.onNearbyFollowersCancel =', inactive.page.bindings)()
  assert.equal(inactive.scene.nearbyFollowersHudActive, false)
  assert.deepEqual(inactive.calls, ['cancel'])
})

test('actual Page Escape, window blur, visibility and unmount listeners clear held input', t => {
  const previous = new Map(), listeners = new Map(),
    target = prefix => ({
      hidden: false,
      addEventListener: (name, callback) => { assert(!listeners.has(prefix + name)); listeners.set(prefix + name, callback) },
      removeEventListener: (name, callback) => { assert.equal(listeners.get(prefix + name), callback); listeners.delete(prefix + name) },
    })
  const globalEvents = target('window:')
  for (const [name, value] of [['addEventListener', globalEvents.addEventListener], ['removeEventListener', globalEvents.removeEventListener], ['document', target('document:')]]) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name))
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value })
  }
  t.after(() => {
    for (const [name, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor)
      else delete globalThis[name]
    }
  })
  const { page, calls } = fixture(), cleanup = pageEffect("globalThis.addEventListener('blur'", page.bindings)()
  const arm = () => page.render().props.onPointerDown(nearbyEvent())
  arm(); listeners.get('window:keydown')({ key: 'Escape' })
  assert.equal(page.pressed, false)
  assert.deepEqual(calls, [], 'Escape cancels the held press without generating a command')
  arm(); listeners.get('window:blur')()
  assert.equal(page.pressed, false)
  assert.deepEqual(calls, ['cancel'])
  arm(); listeners.get('document:visibilitychange')()
  assert.equal(page.pressed, true, 'visible notification does not cancel input')
  document.hidden = true; listeners.get('document:visibilitychange')()
  assert.equal(page.pressed, false)
  arm(); cleanup()
  assert.equal(page.pressed, false)
  assert.equal(listeners.size, 0)
  assert.deepEqual(calls, ['cancel', 'cancel', 'cancel'])
})
