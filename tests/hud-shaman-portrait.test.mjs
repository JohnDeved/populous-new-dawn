import test from 'node:test'
import { campaignPortraitReadiness } from '../scripts/campaign-portrait-readiness.mjs'
import { campaignShamanReadiness } from '../scripts/campaign-start-readiness.mjs'
import assert from 'node:assert/strict'
import ts from 'typescript'
import { readFileSync } from 'node:fs'
import { createWorld, addUnit, browserPosition, select } from '../app/model.ts'
import { createLivePerson } from '../app/live-people.ts'
import { boardLiveVehicle } from '../app/live-vehicles.ts'
import { hudPersonSource } from '../app/hud-person-source.ts'
import { isShaman } from '../app/world-rules.ts'
import { portraitBackground } from '../app/hud-portrait.ts'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import { pageSource, pageNode, pageButton, evaluatePage, nearbyEvent } from './support/follower-nearby-page.mjs'

await loadSceneFixture()
const { GameScene } = await import('../app/scene.ts')
const modifiers = [[], ['Control'], ['Shift'], ['Control', 'Shift']]
function setup(vehicleModel) {
  const world = createWorld(22)
  world.units = []; world.pathfinding.people.clear(); world.selected = []
  world.manaWorld.gameFlags &= ~32; world.inputMask = 0
  const vehicle = world.vehicles.find(v => v.model === (vehicleModel ?? 1))
  function add(kind, team = 'blue', aboard = false) {
    const u = addUnit(world, team, kind, browserPosition(vehicle))
    u.native = createLivePerson(world, u); u.native.state = 19
    if (aboard) {
      const route = createLivePerson(world, u); route.state = 19
      world.pathfinding.people.set(u.id, route)
      assert.ok(boardLiveVehicle(world, route, vehicle))
    }
    return u
  }
  const other = add('brave'), shaman = add('shaman', 'blue', !!vehicleModel)
  const crew = vehicleModel ? add('warrior', 'blue', true) : null
  const enemy = add('shaman', 'red')
  world.selected = [other.id]; other.native.selectionFlags = 129
  const events = []
  const scene = Object.assign(Object.create(GameScene.prototype), {
    world, cameraPosition: { x: vehicle.x, y: vehicle.y },
    overviewActive: false, overviewStage: null,
    hudFocus: Array(9).fill(0), hudTaskFocus: Array(54).fill(0),
    focus: (...args) => events.push(['focus', ...args]),
    objectPanels: { open: id => events.push(['panel', id]) },
    onChange: () => events.push(['change', [...world.selected]]),
  })
  const followerControl = evaluatePage(pageNode(n => ts.isFunctionDeclaration(n) && n.name?.text === 'followerControl').getText(pageSource), {
    engine: { current: scene }, followerPress: { current: null },
  })
  function render() {
    const mounted = evaluatePage(pageButton(['portrait']).getText(pageSource), {
      world, shaman: world.units.find(u => u.team === 'blue' && isShaman(u)),
      portrait: { current: null }, followerControl,
      // Bind the predecessor's actual callback too, so the baseline fails on behavior.
      select, audio: { current: { cue: id => events.push(['cue', id]) } },
      update: scene.onChange, engine: { current: scene }, HOME: { x: 0, z: 0 },
    }).props
    return mounted
  }
  return { world, scene, shaman, other, crew, enemy, vehicle, events, render }
}
function left(control, keys = [], keyboard = false) {
  const event = nearbyEvent({ ctrlKey: keys.includes('Control'), shiftKey: keys.includes('Shift'), detail: keyboard ? 0 : 1,
    currentTarget: { disabled: !!control.disabled, blur() {} } })
  if (!keyboard) {
    control.onPointerDown?.(event)
    if (event.ctrlKey) control.onContextMenu?.(event)
    control.onPointerUp?.(event)
  }
  control.onClick(event)
}
function right(control, keys = []) {
  control.onContextMenu(nearbyEvent({ button: 2, ctrlKey: keys.includes('Control'), shiftKey: keys.includes('Shift'),
    currentTarget: { disabled: !!control.disabled, blur() {} } }))
}
function commandState(world) {
  return world.units.map(u => {
    const p = hudPersonSource(world, u).source
    return [u.id, p && structuredClone({
      commands: p.commands, commandCursor: p.commandCursor, immediateCommand: p.immediateCommand,
      orderLocation: p.orderLocation, commandStatus: p.commandStatus, workTarget: p.workTarget,
    })]
  })
}

test('portrait accessibility separates primary selection from secondary focus without a browser tooltip', () => {
  const control = setup().render()
  assert.equal(control['aria-label'], 'Select shaman')
  assert.equal(control['aria-description'], 'Shaman · Click: add to selection · Right-click: focus · H: select')
  assert.equal(control.title, undefined)
})

test('portrait CSS retains native geometry and separates disabled frame alpha from the interior canvas', () => {
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')
  const rule = selector => {
    const line = css.split('\n').find(line => line.startsWith(`${selector}{`))
    assert.ok(line, `actual ${selector} rule exists`)
    return Object.fromEntries(line.slice(selector.length + 1, line.indexOf('}')).split(';')
      .filter(Boolean).map(declaration => {
        const split = declaration.indexOf(':')
        return [declaration.slice(0, split), declaration.slice(split + 1)]
      }))
  }
  const portrait = rule('.portrait'), frame = rule('.portrait::before'), canvas = rule('.portrait canvas')
  assert.deepEqual([portrait.left, portrait.top, portrait.width, portrait.height], ['33px', '2px', '30px', '35px'])
  assert.equal(portrait.background, undefined, 'frame is not a whole-button background')
  assert.equal(frame.background, "url('/original/hud-portrait.png')")
  assert.equal(frame['pointer-events'], 'none')
  assert.equal(rule('.portrait:disabled').opacity, '1', 'disabled parent preserves opaque interior')
  assert.equal(rule('.portrait:disabled::before').opacity, 'calc(85 / 255)')
  assert.equal(rule('.portrait:enabled:is(:hover,:active)::before')['background-image'],
    "url('/original/hud-portrait-hover.png')")
  assert.deepEqual([canvas.left, canvas.top, canvas.width, canvas.height], ['-33px', '-114px', '100px', '480px'])
  assert.equal(canvas.opacity, undefined, 'canvas does not inherit a separate disabled fade')
  assert.doesNotMatch(css, /\.portrait:hover|\.portrait:active|\.portrait:disabled canvas/)
})

test('actual HUD runtime clears disabled portrait interior despite a retained mesh and hover, then recovers', () => {
  const source = ts.createSourceFile('scene-hud-runtime.ts',
    readFileSync(new URL('../app/scene-hud-runtime.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true)
  const caller = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'updateHudFrame')
  const draws = [], noop = () => {}
  const updateHudFrame = evaluatePage(caller.getText(source).replace(/^export\s+/, ''), {
    publishTooltipStatus: noop, syncCampaignMessagePresentation: noop,
    texture: () => ({ image: {} }), populationMeter: () => ({ color: 0 }),
    nativeHud: { colors: ['#000000'] }, nativeUnits: { atlas: 'unit-atlas' },
    drawPortrait: (...args) => draws.push(args), portraitBackground, isShaman, maxHp: () => 100,
  })
  const shaman = { id: 7, team: 'blue', kind: 'shaman', hp: 100, native: { state: 19 } }
  const scene = {
    world: { units: [shaman] }, unitMeshes: new Map([[7, { userData: { frame: 42, frameFlip: true } }]]),
    portrait: { parentElement: { matches: () => true } }, gameClock: { animationFrame: 0 },
    view: { config: {} }, container: { parentElement: { style: { setProperty: noop } } },
    objectPanels: { update: noop }, worshipPresentation: { draw: noop }, uiTimer: 0,
    drawPointer: noop, renderBuildingPanels: noop, drawMinimap: noop,
  }
  for (const state of ['alive', 'dead', 'alive', 'ghost', 'absent', 'alive']) {
    shaman.hp = state === 'dead' ? 0 : 100
    shaman.ghost = state === 'ghost'
    scene.world.units = state === 'absent' ? [] : [shaman]
    updateHudFrame(scene, 0, 0)
    const draw = draws.at(-1), enabled = state === 'alive'
    assert.equal(draw[2], enabled ? 42 : undefined, state)
    assert.equal(draw[4], enabled ? 130 : 172, state)
  }
})

test('mounted portrait adds Shaman/crew, preserves the current group and never focuses on left input', () => {
  for (const vehicle of [undefined, 1, 3]) for (const keys of modifiers) for (const keyboard of [false, true]) {
    const f = setup(vehicle), control = f.render()
    const selected = [f.other.id, f.shaman.id, ...(f.crew ? [f.crew.id] : [])]
    const orders = structuredClone(f.world.buildingOrders), craft = structuredClone(f.world.vehicles)
    const random = f.world.randomState, camera = { ...f.scene.cameraPosition }, commands = commandState(f.world)
    for (let repeat = 0; repeat < 2; repeat++) {
      const changes = f.events.filter(e => e[0] === 'change').length
      const serial = f.world.soundSerial
      left(control, keys, keyboard)
      assert.deepEqual(f.world.selected, selected, `${vehicle}/${keys}/${keyboard}/${repeat}`)
      assert.equal(f.events.filter(e => e[0] === 'change').length, changes + 1, 'one dispatch per release/keyboard activation')
      assert.equal(f.other.native.selectionFlags, 129, 'preserve previous group and history')
      assert.deepEqual(f.events.filter(e => e[0] === 'focus' || e[0] === 'panel' || e[0] === 'cue'), [])
      assert.deepEqual(f.scene.cameraPosition, camera)
      assert.deepEqual(f.world.vehicles, craft)
      assert.deepEqual(f.world.buildingOrders, orders)
      assert.deepEqual(commandState(f.world), commands)
      assert.equal(f.world.randomState, random)
      assert.ok(!f.world.selected.includes(f.enemy.id))
      assert.deepEqual(f.world.sounds.filter(s => s.serial > serial).map(s => s.cue),
        keys.includes('Shift') ? [0x18, f.crew ? 0x43 : 0x58] : [0x18],
        'Shift voices the preserved group; Ctrl still voices one Shaman')
    }
  }
})

test('portrait retains native reservation and initial-nearby-focus asymmetry', () => {
  for (const keys of modifiers) {
    const f = setup()
    f.shaman.native.flags4 |= 0x800
    left(f.render(), keys)
    assert.deepEqual(f.world.selected, keys.includes('Shift') ? [f.other.id, f.shaman.id] : [f.other.id])
    f.events.length = 0
    right(f.render(), keys)
    assert.equal(f.events.some(e => e[0] === 'focus'), keys.includes('Shift'))
  }
  const f = setup()
  f.world.castingTribes[0].flags |= 128
  f.scene.cameraPosition.x = (f.shaman.native.x + 20000) & 65535
  right(f.render())
  assert.deepEqual(f.events, [['change', [f.other.id]]], 'initial nearby focus is range-limited')
  left(f.render())
  assert.deepEqual(f.world.selected, [f.other.id, f.shaman.id], 'Shaman selection ignores nearby range')
  f.scene.hudFocus[7] = f.shaman.id
  f.events.length = 0
  right(f.render())
  assert.equal(f.events[0][0], 'focus', 'remembered Shaman focus is exempt from nearby range')
})

test('mounted right focus is selection-free, repeatable, ordered camera then panel then notification', () => {
  for (const vehicle of [undefined, 1, 3]) for (const keys of modifiers) {
    const f = setup(vehicle), control = f.render()
    const units = structuredClone(f.world.units), craft = structuredClone(f.world.vehicles)
    const source = f.world.pathfinding.people.get(f.shaman.id) ?? f.shaman.native
    for (let repeat = 0; repeat < 2; repeat++) {
      f.events.length = 0
      right(control, keys)
      assert.deepEqual(f.events, [['focus', browserPosition(source), { animate: true }], ['panel', f.shaman.id], ['change', [f.other.id]]])
      assert.deepEqual(f.world.selected, [f.other.id])
      assert.deepEqual(f.world.units, units)
      assert.deepEqual(f.world.vehicles, craft)
    }
  }
})

test('absent/dead/reincarnating portrait is disabled and preserves selection, mode, camera and orders', () => {
  for (const state of ['absent', 'dead', 'reincarnating', 'ghost']) {
    const f = setup()
    if (state === 'dead') f.shaman.hp = 0
    else if (state === 'ghost') f.shaman.ghost = true
    else f.world.units = f.world.units.filter(u => u !== f.shaman)
    if (state === 'reincarnating') { f.world.respawn = 12; f.world.respawns[0] = 12 }
    const before = structuredClone(f.world), control = f.render()
    assert.equal(control.disabled, true)
    for (const keys of modifiers) { left(control, keys); right(control, keys) }
    assert.deepEqual(f.world, before)
    assert.deepEqual(f.events, [])
    // A returning live Shaman enables the same mounted owner again.
    f.shaman.hp = 100
    f.shaman.ghost = false
    if (!f.world.units.includes(f.shaman)) f.world.units.push(f.shaman)
    assert.equal(f.render().disabled, false)
  }
})

test('portrait honors input gates and preserves pointer cancellation/Ctrl dispatch semantics', () => {
  for (const gate of ['inputMask', 'overviewStage', 'overviewActive', 'level']) {
    const f = setup(), before = [...f.world.selected]
    if (gate === 'inputMask') f.world.inputMask = 1
    if (gate === 'overviewStage') f.scene.overviewStage = 1
    if (gate === 'overviewActive') f.scene.overviewActive = true
    if (gate === 'level') f.world.manaWorld.gameFlags |= 32
    left(f.render(), ['Control', 'Shift'])
    assert.deepEqual(f.world.selected, before)
    assert.deepEqual(f.events, [])
  }
  const f = setup(), control = f.render(), event = nearbyEvent({ ctrlKey: true })
  control.onPointerDown(event); control.onPointerCancel(); control.onPointerUp(event); control.onClick(event)
  assert.deepEqual(f.world.selected, [f.other.id])
  assert.deepEqual(f.events, [])
})


test('plain-primary readiness observes the actual mounted portrait gate and occupied route owner without mutation', () => {
  for (const vehicle of [undefined, 1, 3]) for (const state of ['ordinary', 'reserved128', 'reserved800', 'ghost-native', 'ghost-stale-fixture', 'dead']) {
    const f = setup(vehicle), source = hudPersonSource(f.world, f.shaman).source
    f.world.paused = false
    if (state === 'reserved128') source.flags4 |= 128
    if (state === 'reserved800') source.flags4 |= 0x800
    if (state.startsWith('ghost')) {
      f.shaman.ghost = true
      // Ghost Army's actual native flag is 0x800. The second case deliberately
      // tests a stale/supplied contradictory fixture, not natural gameplay.
      if (state === 'ghost-native') source.flags4 |= 0x800
      else source.flags4 &= ~0x800
    }
    if (state === 'dead') f.shaman.hp = 0
    if (vehicle && state === 'ordinary') {
      assert.notEqual(source, f.shaman.native, 'Occupied route owns the active HUD source')
      f.shaman.native.flags4 |= 0x880
      source.flags4 &= ~0x880
    }
    const before = structuredClone(f.world), observed = campaignPortraitReadiness(f.world)
    assert.deepEqual(f.world, before, 'Readiness cannot modify selection, native flags, orders or craft')
    const expected = state === 'ordinary'
    assert.equal(observed.ready, expected, `${vehicle}/${state}`)
    left(f.render())
    assert.equal(f.world.selected.includes(f.shaman.id), expected, 'Actual Page primary agrees with the read-only action gate')
    if (vehicle && expected) assert.ok(f.world.selected.includes(f.crew.id), 'Do not suppress occupied companion acquisition')
  }
})

test('portrait readiness preserves startup locks while generic keyboard-H readiness stays independent', () => {
  const f = setup(); f.world.paused = false
  f.shaman.native.flags4 |= 0x800
  assert.equal(campaignShamanReadiness(f.world).ready, true, 'Generic/H semantics remain unchanged')
  assert.equal(campaignPortraitReadiness(f.world).ready, false, 'Plain primary excludes ordinary reservations')
  f.shaman.native.flags4 &= ~0x800
  for (const lock of ['paused', 'inputMask', 'status', 'manaGameFlags']) {
    const w = structuredClone(f.world)
    if (lock === 'paused') w.paused = true
    if (lock === 'inputMask') w.inputMask = 64
    if (lock === 'status') w.status = 'won'
    if (lock === 'manaGameFlags') w.manaWorld.gameFlags |= 32
    const before = structuredClone(w)
    assert.equal(campaignPortraitReadiness(w).ready, false, lock)
    assert.deepEqual(w, before)
  }
})
