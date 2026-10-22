import test from 'node:test'
import assert from 'node:assert/strict'
import { createHelpInputOwner } from '../app/help-input.ts'

function fixture() {
  const world = { mode: 'blast', paused: false, status: 'playing', inputMask: 0 }
  const scene = { world }
  const state = { world, scene, blocked: false, foreign: false, ready: true, region: 'hud', clears: 0, commits: 0, failures: 0 }
  const owner = createHelpInputOwner({
    world, scene, currentWorld: () => state.world, currentScene: () => state.scene,
    blocked: () => state.blocked, foreignKey: () => state.foreign,
    keyException: e => e.key === 'F9', region: () => state.region,
    context: () => ({ hud: { topic: 1051 } }),
    // Native HUD dispatch can consume right-up before the keymap. Do not infer
    // an anywhere-on-screen cancellation promise from its world binding.
    canCancelAt: region => region === 'world' || region === 'article',
    prepare: () => state.ready, unavailable: () => state.failures++,
    clearGameplayGesture: () => state.clears++,
    commit: mutation => { state.commits++; mutation() },
  })
  return { world, scene, state, owner }
}

function event(extra = {}) {
  return {
    key: '', repeat: false, ctrlKey: false, altKey: false, metaKey: false, shiftKey: false,
    button: 0, pointerId: 1, clientX: 66, clientY: 116, detail: 1,
    defaultPrevented: false, stopped: false, target: null,
    preventDefault() { this.defaultPrevented = true },
    stopImmediatePropagation() { this.stopped = true }, ...extra,
  }
}

test('Query intercepts HUD down, suppresses compatibility click and cancels article then Query', () => {
  const { owner, world, state } = fixture()
  assert.equal(owner.armQuery(), true)
  assert.equal(world.paused, false)
  const down = event()
  assert.equal(owner.pointerDown(down), true)
  assert.equal(down.stopped, true)
  assert.equal(owner.session.topic, 1051)
  assert.equal(owner.session.phase, 'article')
  assert.equal(world.paused, true)
  assert.equal(owner.pointerUp(event()), true)
  assert.equal(owner.click(event()), true)
  assert.equal(owner.click(event()), false)
  owner.keyDown(event({ key: 'Escape' }))
  assert.equal(owner.session.phase, 'query')
  assert.equal(world.paused, false)
  owner.keyDown(event({ key: 'Escape', repeat: true }))
  assert.equal(owner.session.phase, 'query')
  owner.keyDown(event({ key: 'Escape' }))
  assert.equal(owner.session.phase, 'inactive')
  assert.equal(world.mode, 'blast')
  assert.equal(owner.keyDown(event({ key: 'Escape' })), false, 'original Menu route regains Escape')
  assert.equal(state.clears, 2)
})

test('F1 toggles direct article without introducing Query as the return mode', () => {
  const { owner, world } = fixture()
  owner.keyDown(event({ key: 'F1' }))
  assert.equal(owner.session.phase, 'article')
  owner.keyDown(event({ key: 'F1' }))
  assert.equal(owner.session.phase, 'inactive')
  assert.equal(world.mode, 'blast')
  assert.equal(world.paused, false)
})

test('right DOWN is inert; right UP performs the native cancellation only in proven regions', () => {
  const { owner, state } = fixture()
  owner.armQuery()
  owner.pointerDown(event({ button: 2 }))
  assert.equal(owner.session.phase, 'query')
  owner.pointerUp(event({ button: 2 }))
  assert.equal(owner.session.phase, 'query', 'HUD dispatcher precedence is not guessed')
  state.region = 'world'
  owner.pointerDown(event({ button: 2 }))
  assert.equal(owner.session.phase, 'query')
  owner.pointerUp(event({ button: 2 }))
  assert.equal(owner.session.phase, 'inactive')
})

test('article controls, keyboard activation, F8, cheats and foreign owners are not stolen', () => {
  const { owner, state } = fixture()
  owner.keyDown(event({ key: 'F1' }))
  state.region = 'article'
  assert.equal(owner.pointerDown(event()), false)
  for (const key of ['F8', 'F9', 'h']) assert.equal(owner.keyDown(event({ key })), false)
  for (const modifier of ['ctrlKey', 'altKey', 'metaKey', 'shiftKey'])
    assert.equal(owner.keyDown(event({ key: 'Escape', [modifier]: true })), false)
  state.foreign = true
  assert.equal(owner.keyDown(event({ key: 'Escape' })), false)
  state.foreign = false; state.region = 'foreign'
  assert.equal(owner.pointerDown(event()), false)
  state.region = 'hud'
  owner.pointerDown(event()); owner.pointerUp(event())
  assert.equal(owner.click(event({ detail: 0 })), false)
  owner.resetGesture()
  assert.equal(owner.click(event()), false)
})

for (const blocked of ['menu', 'cheats', 'popup', 'selector', 'flyby', 'terminal', 'world', 'scene']) {
  test(`${blocked} owner/replacement prevents new Help mutations`, () => {
    const { owner, world, state } = fixture()
    if (blocked === 'flyby') world.inputMask = 1
    else if (blocked === 'terminal') world.status = 'lost'
    else if (blocked === 'world') state.world = { ...world }
    else if (blocked === 'scene') state.scene = { world }
    else state.blocked = true
    assert.equal(owner.armQuery(), false)
    assert.equal(owner.keyDown(event({ key: 'F1' })), false)
    assert.equal(owner.pointerDown(event()), false)
    assert.equal(state.commits, 0)
    assert.equal(state.clears, 0)
    assert.equal(world.mode, 'blast')
  })
}

test('failed preflight releases the old pause/mode before browser recovery is called', () => {
  const { owner, world, state } = fixture()
  owner.armQuery(); state.ready = false
  owner.pointerDown(event())
  assert.equal(owner.session.phase, 'inactive')
  assert.equal(world.mode, 'blast')
  assert.equal(world.paused, false)
  assert.equal(state.failures, 1)
  assert.equal(owner.pointerUp(event()), true, 'failed preflight still owns its press completion')
  assert.equal(owner.click(event()), true)
  assert.equal(owner.armQuery(), false)
})

test('stale disposal cannot resume or mutate either replacement world/scene', () => {
  const { owner, world, state } = fixture()
  owner.keyDown(event({ key: 'F1' }))
  state.scene = { world }
  owner.release()
  assert.equal(world.paused, true)
  assert.equal(owner.session.phase, 'inactive')
  owner.release()
  assert.equal(world.paused, true)
})
