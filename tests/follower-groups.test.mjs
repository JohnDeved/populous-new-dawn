import test from 'node:test'
import assert from 'node:assert/strict'
import { createWorld, addUnit, browserPosition, select } from '../app/model.ts'
import { createLivePerson } from '../app/live-people.ts'
import { boardLiveVehicle } from '../app/live-vehicles.ts'
import {
  assignFollowerGroup,
  followerGroup,
  followerGroupFocus,
  followerGroupShortcut,
  recallFollowerGroup,
} from '../app/follower-groups.ts'
import { createFollowerGroupDisplay } from '../app/follower-group-display.ts'
import { SPELLS } from '../app/world-rules.ts'
import { command } from '../app/live-command.ts'
import { cancelInteraction, setSelection } from '../app/selection-runtime.ts'
import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import { quickCameraAction, quickCameraTarget } from '../app/quick-camera-shortcuts.ts'
import { pageEffect, noOp } from './support/follower-nearby-page.mjs'

const key = (code, extra = {}) => ({
  code, repeat: false, shiftKey: false, ctrlKey: false, altKey: false, metaKey: false, ...extra,
})

function roster(count = 4) {
  const world = createWorld(1)
  world.inputMask = 0
  world.units = []
  world.selected = []
  const people = []
  for (let i = 0; i < count; i++) {
    const unit = addUnit(world, 'blue', i === 0 ? 'shaman' : i % 2 ? 'brave' : 'warrior', { x: 40 + i * 2, z: 40 })
    unit.native = createLivePerson(world, unit)
    people.push(unit)
  }
  return { world, people, ids: people.map(u => u.id) }
}

test('original default records map Shift/plain/Alt + number row 1–6; repeats and other keys stay unbound', () => {
  for (let slot = 1; slot <= 6; slot++) {
    assert.deepEqual(followerGroupShortcut(key(`Digit${slot}`, { shiftKey: true })), { slot, action: 'assign' })
    assert.deepEqual(followerGroupShortcut(key(`Digit${slot}`)),
      { slot, action: 'recall', additive: false, focus: false })
    assert.deepEqual(followerGroupShortcut(key(`Digit${slot}`, { altKey: true })),
      { slot, action: 'recall', additive: false, focus: true })
    // The recall records ignore Ctrl when matching; the case reads it as additive.
    assert.deepEqual(followerGroupShortcut(key(`Digit${slot}`, { ctrlKey: true, altKey: true })),
      { slot, action: 'recall', additive: true, focus: true })
  }
  for (const event of [
    key('Digit1', { repeat: true }), key('Digit1', { shiftKey: true, repeat: true }),
    key('Digit1', { metaKey: true }), key('Digit1', { shiftKey: true, ctrlKey: true }),
    key('Digit1', { shiftKey: true, altKey: true }), key('Numpad1'), key('Digit7'), key('Digit0'),
    key('KeyA'),
  ]) assert.equal(followerGroupShortcut(event), null, JSON.stringify(event))
  assert.equal(SPELLS.filter(spell => /^[1-6]$/.test(spell.key)).length, 0, 'no spell alias shares 1–6')
})

test('assignment replaces membership from the current selection, mixes classes and keeps the selection', () => {
  const { world, ids } = roster()
  world.selected = [ids[0], ids[2]]
  assignFollowerGroup(world, 1)
  // 0043f552: a selected member also gains bit 0, the Shift+Backspace snapshot.
  assert.deepEqual(world.units.map(u => u.groups ?? 0), [3, 0, 3, 0])
  assert.deepEqual(world.selected, [ids[0], ids[2]])
  world.selected = [ids[1]]
  assignFollowerGroup(world, 2)
  world.selected = [ids[2], ids[3]]
  assignFollowerGroup(world, 1) // Replacement, not addition.
  assert.deepEqual(world.units.map(u => u.groups ?? 0), [1, 5, 3, 3])
  world.selected = []
  assignFollowerGroup(world, 1) // Assigning nothing empties the group; bit 0 stays.
  assert.deepEqual(world.units.map(u => u.groups ?? 0), [1, 5, 1, 1])
})

test('recall replaces the selection, Ctrl adds, and an empty group changes nothing', () => {
  const { world, ids } = roster()
  world.selected = [ids[1], ids[3]]
  assignFollowerGroup(world, 3)
  world.selected = [ids[0]]
  assignFollowerGroup(world, 4)
  select(world, 'all')
  assert.equal(recallFollowerGroup(world, 3, false), true)
  assert.deepEqual(world.selected, [ids[1], ids[3]])
  assert.equal(recallFollowerGroup(world, 4, true), true)
  assert.deepEqual(world.selected, [ids[0], ids[1], ids[3]])
  world.mode = 'blast'
  assert.equal(recallFollowerGroup(world, 5, false), false)
  assert.deepEqual(world.selected, [ids[0], ids[1], ids[3]])
  assert.equal(world.mode, 'blast', 'an empty group leaves selection and targeting untouched')
  assert.equal(recallFollowerGroup(world, 4, false), true)
  assert.deepEqual(world.selected, [ids[0]])
  assert.equal(world.mode, null, 'recall leaves the armed spell instead of selecting/casting one')
  assert.ok(world.units.every(u => (u.native.selectionFlags & 128) === (world.selected.includes(u.id) ? 128 : 0)))
})

test('stale membership is safe: death, unavailability, replacement and foreign owners are never selected', () => {
  const { world, people, ids } = roster()
  world.selected = [...ids]
  assignFollowerGroup(world, 6)
  world.selected = []
  people[0].hp = 0
  people[1].native.flags4 |= 128
  // Conversion and hypnotise allocate replacement units; the old record leaves.
  world.units = world.units.filter(u => u !== people[2])
  const convert = addUnit(world, 'blue', 'brave', { x: 50, z: 50 })
  const foreign = addUnit(world, 'red', 'brave', { x: 52, z: 50 })
  foreign.groups = 1 << 6
  assert.equal(recallFollowerGroup(world, 6, false), true)
  assert.deepEqual(world.selected, [ids[3]])
  assert.equal(convert.groups, undefined)
  people[3].hp = 0
  world.selected = [convert.id]
  assert.equal(recallFollowerGroup(world, 6, false), false)
  assert.deepEqual(world.selected, [convert.id])
  // Focus uses the first living roster member without the availability test.
  assert.equal(followerGroupFocus(world, 6)?.id, ids[1])
  people[1].hp = 0
  assert.equal(followerGroupFocus(world, 6), undefined)
})

test('recalling a boarded member selects its whole crew; membership survives the current checkpoint clone', () => {
  const world = createWorld(22), vehicle = world.vehicles.find(v => v.model === 1)
  world.units = []; world.pathfinding.people.clear(); world.selected = []
  const crew = ['brave', 'warrior'].map(kind => {
    const unit = addUnit(world, 'blue', kind, browserPosition(vehicle))
    unit.native = createLivePerson(world, unit); unit.native.state = 19
    world.pathfinding.people.set(unit.id, unit.native)
    assert.ok(boardLiveVehicle(world, unit.native, vehicle))
    return unit
  })
  world.selected = [crew[0].id]
  assignFollowerGroup(world, 2)
  world.selected = []
  const saved = structuredClone(world)
  assert.deepEqual(saved.units.map(u => u.groups ?? 0), [5, 0])
  assert.equal(recallFollowerGroup(saved, 2, false), true)
  assert.deepEqual(saved.selected, crew.map(u => u.id))
  const fresh = createWorld(22)
  assert.ok(fresh.units.every(u => u.groups === undefined), 'new game/restart starts without groups')
})

test('scene owner gates masks/transitions, keeps native recall predicate and focuses the first member', () => {
  const { world, people, ids } = roster()
  const calls = []
  const scene = {
    world, overviewStage: null, overviewActive: false, groupDisplay: createFollowerGroupDisplay(),
    focus: (point, options) => calls.push(['focus', point, options]),
    objectPanels: { open: id => calls.push(['panel', id]) },
    onChange: () => calls.push(['change']),
  }
  world.selected = [ids[2], ids[3]]
  world.inputMask = 1
  assert.equal(followerGroup(scene, { slot: 1, action: 'assign' }), false)
  world.inputMask = 0
  scene.overviewStage = 'enter'
  assert.equal(followerGroup(scene, { slot: 1, action: 'assign' }), false)
  scene.overviewStage = null
  assert.ok(world.units.every(u => u.groups === undefined))
  world.manaWorld.gameFlags |= 32
  assert.equal(followerGroup(scene, { slot: 1, action: 'assign' }), true, 'assignment has no predicate')
  assert.equal(followerGroup(scene, { slot: 1, action: 'recall', additive: false, focus: true }), false)
  world.manaWorld.gameFlags &= ~32
  world.selected = []
  calls.length = 0
  people[2].native.flags4 |= 128
  assert.equal(followerGroup(scene, { slot: 1, action: 'recall', additive: false, focus: true }), true)
  assert.deepEqual(calls.map(call => call[0]), ['focus', 'panel', 'change'])
  assert.deepEqual(calls[1], ['panel', ids[2]], 'camera target ignores availability')
  assert.deepEqual(calls[0][2], { animate: true })
  assert.deepEqual(world.selected, [ids[3]])
  assert.deepEqual([...scene.groupDisplay.timers], [6, 0, 0, 0, 0, 0], 'an accepted group key shows its numbers')
  // Globe overview: like HUD selection, plain recall waits; Alt focus may leave it.
  scene.overviewActive = true
  world.selected = []
  assert.equal(followerGroup(scene, { slot: 1, action: 'recall', additive: false, focus: false }), false)
  assert.deepEqual(world.selected, [])
  assert.equal(followerGroup(scene, { slot: 1, action: 'recall', additive: false, focus: true }), true)
  assert.deepEqual(world.selected, [ids[3]])
})

function pageKeyboard(overrides = {}) {
  const { world } = roster()
  const listeners = new Map(), groups = [], tabs = []
  let prevented = 0
  const engine = { current: { world, followerGroup: shortcut => groups.push(shortcut), focus: noOp } }
  const bindings = {
    world, ready: true, menu: false, cheatsOpen: false, selectorOpen: false,
    messageDetails: { current: new Map() }, SPELLS: [{ id: 'blast', key: '1' }],
    spellHudVisibility: () => 'visible', followerGroupShortcut,
    store: { getWorld: () => world, change: action => action(world) },
    window: { addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: noOp },
    setTab: tab => tabs.push(tab), engine, audio: { current: null },
    update: noOp, openMenu: noOp, cancelInteraction: noOp,
    guardShaman: noOp, select: noOp, HOME: {}, tutorialLevel: 0,
    rotateBuildingPlan: () => false, quickCameraAction, quickCameraTarget, scatterSelected: noOp,
    ...overrides,
  }
  pageEffect("window.addEventListener('keydown', key)", bindings)()
  return {
    world, groups, tabs, get prevented() { return prevented },
    press(extra = {}, closest = () => false) {
      listeners.get('keydown')({ key: '1', code: 'Digit1', repeat: false, shiftKey: false,
        ctrlKey: false, metaKey: false, altKey: false, target: { closest },
        preventDefault: () => prevented++, ...extra })
    },
  }
}

test('Page routes the number row to groups, never to a spell, with modifiers and repeats claimed', () => {
  const k = pageKeyboard()
  k.press()
  k.press({ key: '!', shiftKey: true })
  k.press({ key: '¡', altKey: true, ctrlKey: true })
  k.press({ repeat: true })
  k.press({ shiftKey: true, ctrlKey: true })
  assert.deepEqual(k.groups, [
    { slot: 1, action: 'recall', additive: false, focus: false },
    { slot: 1, action: 'assign' },
    { slot: 1, action: 'recall', additive: true, focus: true },
  ])
  assert.equal(k.prevented, 5, 'browser Alt/Shift digit defaults cannot fire for claimed chords')
  assert.equal(k.world.mode, null, 'a spell sharing the old alias is never armed')
  assert.deepEqual(k.tabs, [])
  k.press({ metaKey: true })
  assert.equal(k.prevented, 5, 'Meta shortcuts stay with the browser')
})

test('Page group keys respect modal, editable and replaced-world gates', () => {
  for (const [overrides, closest] of [
    [{ ready: false }], [{ menu: true }], [{ cheatsOpen: true }],
    [{ messageDetails: { current: new Map([[1, { open: true }]]) } }],
    [{}, selector => selector === 'input,dialog'],
  ]) {
    const k = pageKeyboard(overrides)
    k.press({}, closest)
    k.press({ shiftKey: true }, closest)
    assert.deepEqual(k.groups, [])
    assert.equal(k.prevented, 0)
  }
  const replaced = pageKeyboard({ store: { getWorld: () => ({}), change: noOp } })
  replaced.press()
  assert.deepEqual(replaced.groups, [])
})

test('Shift+Backspace is the original slot-0 record: additive recall only, no other chord', () => {
  assert.deepEqual(followerGroupShortcut(key('Backspace', { shiftKey: true })),
    { slot: 0, action: 'recall', additive: true, focus: false })
  for (const event of [
    key('Backspace'), key('Backspace', { shiftKey: true, ctrlKey: true }),
    key('Backspace', { shiftKey: true, altKey: true }), key('Backspace', { shiftKey: true, metaKey: true }),
    key('Backspace', { shiftKey: true, repeat: true }), key('Delete', { shiftKey: true }),
  ]) assert.equal(followerGroupShortcut(event), null, JSON.stringify(event))
})

test('orders and deselection snapshot the selection; slot 0 adds it back without replacing', () => {
  const w = createStartedWorld(1)
  retainFixtureUnits(w, () => false)
  w.buildings = []; w.trees = []; w.shrines = []
  w.terrain.fill(3); w.terrainVersion++
  w.inputMask = 0; w.manaWorld.gameFlags = 0
  const people = [0, 1, 2, 3].map(i => {
    const u = addUnit(w, 'blue', 'brave', { x: 1 + i, z: -1 })
    u.native = createLivePerson(w, u)
    return u
  })
  addUnit(w, 'red', 'brave', { x: 40, z: -40 })
  const [a, b, c, d] = people.map(u => u.id)
  setSelection(w, [a, b])
  assert.ok(command(w, { x: 17, z: -1 }), 'an ordinary player order')
  assert.deepEqual(people.map(u => u.groups ?? 0), [1, 1, 0, 0], '00444f60 → 00435c10 snapshot')
  setSelection(w, [c]) // Plain selection never touches the snapshot.
  assert.deepEqual(people.map(u => u.groups ?? 0), [1, 1, 0, 0])
  const scene = {
    world: w, overviewStage: null, overviewActive: false, groupDisplay: createFollowerGroupDisplay(),
    focus: noOp, objectPanels: { open: noOp }, onChange: noOp,
  }
  const slot0 = followerGroupShortcut(key('Backspace', { shiftKey: true }))
  w.mode = 'blast'
  assert.equal(followerGroup(scene, slot0), true)
  assert.deepEqual(new Set(w.selected), new Set([a, b, c]), 'additive: the current selection stays')
  assert.equal(w.mode, null, 'group-selection mode leaves the armed spell')
  assert.deepEqual([...scene.groupDisplay.timers], [0, 0, 0, 0, 0, 0], 'slot 0 shows no numbers')
  // Escape/right-click deselection (command 0x1e) also snapshots before clearing.
  cancelInteraction(w)
  assert.deepEqual(w.selected, [])
  assert.deepEqual(people.map(u => u.groups ?? 0), [1, 1, 1, 0])
  // Assignment adds bit 0 and unassignment keeps it.
  setSelection(w, [d])
  assignFollowerGroup(w, 2)
  setSelection(w, [])
  assignFollowerGroup(w, 2)
  assert.equal(followerGroup(scene, slot0), true)
  assert.deepEqual(new Set(w.selected), new Set([a, b, c, d]))
  // The recall predicate 004fee90 still applies.
  setSelection(w, [])
  w.manaWorld.gameFlags |= 32
  assert.equal(followerGroup(scene, slot0), false)
  assert.deepEqual(w.selected, [])
})

test('Page routes Shift+Backspace to slot 0 and leaves plain Backspace alone', () => {
  const k = pageKeyboard()
  k.press({ key: 'Backspace', code: 'Backspace', shiftKey: true })
  k.press({ key: 'Backspace', code: 'Backspace' })
  assert.deepEqual(k.groups, [{ slot: 0, action: 'recall', additive: true, focus: false }])
  assert.equal(k.prevented, 1)
})
