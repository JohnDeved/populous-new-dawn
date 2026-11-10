// This validates the public-input witness's assertions, not browser/game behavior.
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import { pageEffect } from './support/follower-nearby-page.mjs'
import assert from 'node:assert/strict'
import { checkMission10FollowerStrip } from '../scripts/local-render/mission10-boat-checkpoint.mjs'

import { mission10ExpectedSelection } from '../scripts/local-render/mission10-selection.mjs'
import { mission10QueryFixture } from './support/mission10-profile-receipt.mjs'

const party = [63, 111, 112, 113, 114]
function fixture(occupied, fault) {
  const calls = [], observations = [], ownership = []
  const live = {
    paused: false, status: 'playing', outcome: { level: 10 }, mode: null, turn: 500, selected: [...party], orders: { next: 3 }, randomState: 19,
    boat: { id: 62, passengers: occupied ? [...party] : [] },
    party: party.map(id => ({ id, hp: 100, vehicle: occupied ? 62 : 0 })),
  }
  const query = mission10QueryFixture(occupied)
  const selectionState = () => ({ paused: live.paused, turn: live.turn, mode: null, orderCursor: 0, selected: live.selected,
    point: { x: query.point[0], y: query.point[1] }, nearby: query.nearby,
    vehicles: [{ id: 62, team: 'blue', model: 1, active: true, passengerCount: query.boat[0], passengers: query.boat.slice(1) }],
    people: query.people.map(([id, model, x, y, priority, flags4, vehicle]) => ({ id, model, team: 'blue', hp: 100,
      x, y, assignment: priority << 12, flags4, vehicle, owners: { native: null, flight: null, fight: null, entry: null, builder: null, route: null },
      ownerAliases: { native: null, flight: null, fight: null, entry: null, builder: null, route: null } })) })
  // Supplied no-open-message DOM. The actual shared public-owner helper runs;
  // only browser transport and DOM are supplied, not its sequencing or checks.
  const window = { testStore: { getWorld: () => live }, testSceneRef: { current: { world: live } } }
  let capturedPause, keyHandler
  const menu = { open: false, isConnected: false,
    getAttribute: name => name === 'data-panel' ? (fault === 'wrong-panel' ? 'save' : 'root') : null }
  const showMenu = () => {
    if (fault === 'missing-menu') return
    capturedPause = live.paused; live.paused = true; menu.open = true; menu.isConnected = true
  }
  // Execute the complete current Page keyboard effect. Only its modal DOM and
  // selection adapter leaves are supplied; no neutral-Escape branch is copied.
  const cleanupKeyboard = pageEffect("window.addEventListener('keydown', key)", {
    world: live, ready: true, menu: false, cheatsOpen: false, selectorOpen: false,
    messageDetails: { current: new Map() }, SPELLS: [],
    store: window.testStore = { getWorld: () => live, change: fn => fn(live) },
    engine: window.testSceneRef, tutorialLevel: 79,
    openMenu: showMenu, cancelInteraction: world => { world.selected = [] },
    window: { addEventListener: (_name, fn) => { keyHandler = fn },
      removeEventListener: (_name, fn) => { assert.equal(fn, keyHandler); keyHandler = null } },
  })()
  const document = { activeElement: null,
    querySelector: selector => { assert.equal(selector, 'dialog[data-original-pause-menu]'); return menu.isConnected ? menu : null },
    querySelectorAll: selector => {
    assert.equal(selector, '.campaign-messages details[open]'); return []
  } }
  const evaluate = (callback, value) => {
    const result = runInNewContext(`(${callback.toString()})(value)`, { window, document, value })
    return result === live ? result : structuredClone(result)
  }
  return {
    live, calls, observations, ownership, cleanupKeyboard,
    page: {
      evaluateHandle: async callback => {
        assert.equal(evaluate(callback), live); ownership.push('retain-world')
        return { evaluate: async callback => evaluate(callback, live),
          dispose: async () => ownership.push('dispose-world') }
      },
      evaluate: async callback => evaluate(callback),
      locator: selector => {
        assert.equal(selector, '.campaign-messages details[open]')
        return { elementHandles: async () => { ownership.push('observe-no-open'); return [] },
          count: async () => 0 }
      },
      keyboard: { press: async key => {
        assert.equal(key, 'Escape'); calls.push(['key', key])
        keyHandler({ key, code: key, repeat: false, ctrlKey: false, metaKey: false, altKey: false,
          target: { closest: () => false }, preventDefault() {}, stopImmediatePropagation() {} })
        if (fault === 'unexpected-menu') showMenu()
      } },
      getByRole: (role, options) => {
        if (role === 'dialog') {
          assert.equal(options.name, 'Game menu'); assert.equal(options.exact, true)
          return { isVisible: async () => menu.open,
            waitFor: async ({ state, timeout }) => {
              assert.ok(timeout > 0 && timeout <= 15000)
              assert.equal(menu.open, state === 'visible', 'Expected menu visibility')
            },
            elementHandle: async () => {
              ownership.push('retain-menu')
              return { evaluate: async callback => evaluate(callback, menu),
                dispose: async () => ownership.push('dispose-menu'),
                $: async selector => {
                  assert.equal(selector, 'button[aria-label="Continue Game"]'); ownership.push('retain-continue')
                  return { click: async ({ timeout }) => {
                    assert.ok(timeout > 0 && timeout <= 15000); calls.push(['continue'])
                    if (fault === 'continue-failure') throw Error('Continue failed')
                    menu.open = false; menu.isConnected = false; live.paused = capturedPause
                    if (fault === 'replacement-world') window.testSceneRef.current.world = { ...live }
                  }, dispose: async () => ownership.push('dispose-continue') }
                } }
            } }
        }
        assert.equal(role, 'button'); assert.equal(options.exact, true)
        assert.ok(['Select warrior', 'Select follower'].includes(options.name))
        return { click: async ({ modifiers }) => {
          calls.push(['click', options.name, modifiers]); assert.equal(live.paused, true)
          live.selected = mission10ExpectedSelection(query, options.name, modifiers[0] ?? 'single').selected
          if (fault === 'no-propagation') live.selected = live.selected.filter(id => id !== 63)
          if (fault === 'extra') live.selected.push(999)
          if (fault === 'missing-extra' && options.name === 'Select follower' && modifiers[0] === 'Control') live.selected.pop()
          if (fault === 'orders') live.orders.next++
        } }
      },
    },
    input: {
      action: async (_label, run) => run(),
      pause: async () => { calls.push(['pause']); live.paused = true },
      resume: async () => { calls.push(['resume']); live.paused = false },
    },
    state: async label => { observations.push(label); return structuredClone({ ...live, selectionState: selectionState() }) },
  }
}

test('M10 witness Escape-clears before every mounted class/Total modifier case and restores pause', async () => {
  for (const phase of ['boarded', 'loaded', 'unloaded']) {
    const occupied = phase !== 'unloaded', f = fixture(occupied)
    await checkMission10FollowerStrip({ ...f, phase, occupied })
    assert.equal(f.live.paused, false)
    assert.deepEqual(f.calls, [
      ['pause'],
      ...['Select warrior', 'Select follower'].flatMap(name => [[], ['Control'], ['Shift']]
        .flatMap(modifiers => [['key', 'Escape'], ['click', name, modifiers]])),
      ['resume'],
    ])
  }
})

test('M10 witness fails when the boarded Shaman is omitted or selection changes orders', async () => {
  for (const [fault, expected] of [['no-propagation', /selection differs/], ['extra', /selection differs/], ['missing-extra', /selection differs/], ['orders', /preserves commands/]]) {
    const f = fixture(true, fault)
    await assert.rejects(checkMission10FollowerStrip({ ...f, phase: 'boarded', occupied: true }), expected)
  }
})

test('M10 witness requires real occupancy and leaves an already paused scenario paused', async () => {
  const missing = fixture(false)
  await assert.rejects(checkMission10FollowerStrip({ ...missing, phase: 'boarded', occupied: true }))
  const f = fixture(true); f.live.paused = true
  await checkMission10FollowerStrip({ ...f, phase: 'loaded', occupied: true })
  assert.equal(f.live.paused, true)
  assert.ok(f.calls.every(call => call[0] !== 'pause' && call[0] !== 'resume'))
})


test('M10 strip executes the real owner precondition with a supplied empty message DOM', async () => {
  const f = fixture(true), observations = []
  await checkMission10FollowerStrip({ ...f, phase: 'loaded', occupied: true,
    deadlineAt: Date.now() + 25000, observeKeyboard: value => observations.push(value) })
  assert.deepEqual(f.ownership.slice(0, 3), ['retain-world', 'observe-no-open', 'dispose-world'])
  assert.equal(f.ownership.filter(event => event === 'retain-world').length, 7)
  assert.equal(f.ownership.filter(event => event === 'dispose-world').length, 7)
  assert.deepEqual(observations.map(value => value.phase), ['before-public-collapse', 'after-public-collapse'])
  assert.ok(observations.every(value => value.stripPhase === 'loaded'))
  assert.ok(observations.every(value => value.paused && value.openMessageSerials.length === 0))
  assert.equal(f.live.paused, false)
})


test('neutral unloaded Escape opens root menu and Continue returns to the same paused strip', async () => {
  const f = fixture(false); f.live.selected = []
  await checkMission10FollowerStrip({ ...f, phase: 'unloaded', occupied: false })
  assert.deepEqual(f.calls.slice(0, 4), [['pause'], ['key', 'Escape'], ['continue'], ['click', 'Select warrior', []]])
  assert.equal(f.calls.filter(call => call[0] === 'key').length, 6)
  assert.equal(f.calls.filter(call => call[0] === 'click').length, 6)
  assert.equal(f.calls.filter(call => call[0] === 'continue').length, 1)
  assert.equal(f.live.paused, false)
  assert.deepEqual(f.ownership.filter(event => !event.includes('world') && event !== 'observe-no-open'),
    ['retain-menu', 'retain-continue', 'dispose-continue', 'dispose-menu'])
  f.cleanupKeyboard()
})

for (const [fault, neutral, expected] of [
  ['unexpected-menu', false, /Selection Escape must not open/],
  ['missing-menu', true, /Expected menu visibility/],
  ['wrong-panel', true, /actual root Game menu/],
  ['continue-failure', true, /Continue failed/],
  ['replacement-world', true, /exact paused Mission 10 World/],
]) test(`M10 Escape fails closed for ${fault} before any follower control`, async () => {
  const f = fixture(false, fault)
  if (neutral) f.live.selected = []
  await assert.rejects(checkMission10FollowerStrip({ ...f, phase: 'unloaded', occupied: false }), expected)
  assert.equal(f.calls.filter(call => call[0] === 'key').length, 1)
  assert.ok(f.calls.every(call => call[0] !== 'click' && call[0] !== 'resume'))
  for (const kind of ['world', 'menu', 'continue'])
    assert.equal(f.ownership.filter(event => event === `retain-${kind}`).length,
      f.ownership.filter(event => event === `dispose-${kind}`).length)
  f.cleanupKeyboard()
})
