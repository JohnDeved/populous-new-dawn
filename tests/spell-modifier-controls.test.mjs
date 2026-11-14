import assert from 'node:assert/strict'
import test from 'node:test'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

await loadSceneFixture()
const { createStartedWorld } = await import('./level-start-fixture.mjs')
const { pointerDown, pointerUp, updateDrag } = await import('../app/scene-input-runtime.ts')
const { skipIntroduction } = await import('../app/scene-camera-runtime.ts')
const { advanceGame } = await import('../app/game-clock.ts')
const { migrateCheckpoint } = await import('../app/game-store.ts')
const { spellTargetError } = await import('../app/live-command.ts')
const { SPELLS } = await import('../app/world-rules.ts')
const { rightClickSpellCharging, spellChargingCommand, applySpellChargingCommand, SpellChargingCommand } =
  await import('../app/spell-charging.ts')
const { chargingSpells } = await import('../app/mana.ts')

// Actual started Mission 1 World, cast validator and pointer release caller.
// DOM capture and terrain picking are supplied; this is not rendered input evidence.
function castFixture() {
  const world = createStartedWorld(), sounds = []
  const shaman = world.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  let point = { x: shaman.x + 3, z: shaman.z + 3 }
  const scene = {
    world,
    renderer: { domElement: { setPointerCapture() {} } },
    globeMotion: { dragging: false, velocity: { x: 0, y: 0 } },
    dragActive: { value: false },
    selectionOverlay: { visible: false, update() {} },
    view: { angle: 0 },
    flybyCamera: { x: 0, y: 0, angle: 0, zoom: 0 },
    pickUnit: () => undefined,
    pick: () => point,
    pickWorldObject: () => null,
    picking: { pickPerson: () => undefined, pick: () => null },
    onChange() {},
    onSound: sound => sounds.push(sound),
    acknowledgePointer() {},
    orderSound() {},
    objectPanels: { releaseBuildingInspection() {} },
  }
  scene.updateDrag = event => updateDrag(scene, event)
  skipIntroduction(scene)
  assert.equal(world.inputMask, 0)
  assert.equal(spellTargetError(world, 'blast', point), null)
  world.mode = 'blast'
  const event = (extra = {}) => ({
    pointerId: 1, button: 0, buttons: 1, clientX: 10, clientY: 10,
    ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, ...extra,
  })
  const click = (up = {}, down = up) => {
    pointerDown(scene, event(down))
    pointerUp(scene, event({ ...up, buttons: 0 }))
  }
  const clock = { animationTime: 0, animationFrame: 0 }
  return {
    world, shaman, sounds, click,
    target: value => { point = value },
    // Run ordinary turns until the Shaman can accept the next cast.
    settle: () => {
      for (let i = 0; i < 400 && spellTargetError(world, 'blast', point); i++)
        advanceGame(world, clock, 1 / 12)
      assert.equal(spellTargetError(world, 'blast', point), null)
    },
  }
}

test('Ctrl release casts and keeps the spell; plain release casts once and clears it', () => {
  const f = castFixture(), shots = f.world.shots.blast
  assert.ok(shots >= 3)
  f.click({ ctrlKey: true })
  assert.equal(f.world.shots.blast, shots - 1)
  assert.ok(f.shaman.casting, 'the accepted Ctrl click starts an ordinary cast')
  assert.equal(f.world.mode, 'blast')
  // The Shaman is busy: the retained spell rejects the click without casting.
  f.click({ ctrlKey: true })
  assert.equal(f.world.shots.blast, shots - 1)
  assert.equal(f.world.mode, 'blast')
  f.settle()
  assert.equal(f.world.mode, 'blast', 'no automatic cast or timeout clears the retained spell')
  assert.equal(f.world.shots.blast, shots - 1, 'retention never casts by itself')
  f.click({ ctrlKey: true })
  assert.equal(f.world.shots.blast, shots - 2)
  assert.equal(f.world.mode, 'blast')
  f.settle()
  f.click()
  assert.equal(f.world.shots.blast, shots - 3)
  assert.equal(f.world.mode, null)
})

for (const [downCtrl, upCtrl] of [[true, false], [false, true]])
  test(`spell retention samples Ctrl on release: press=${downCtrl}, release=${upCtrl}`, () => {
    const f = castFixture(), shots = f.world.shots.blast
    f.click({ ctrlKey: upCtrl }, { ctrlKey: downCtrl })
    assert.equal(f.world.shots.blast, shots - 1)
    assert.equal(f.world.mode, upCtrl ? 'blast' : null)
  })

for (let bits = 0; bits < 8; bits++) {
  const modifiers = { shiftKey: !!(bits & 1), ctrlKey: !!(bits & 2), altKey: !!(bits & 4) }
  test(`spell release honors original exact modifier combination ${bits}`, () => {
    const f = castFixture(), shots = f.world.shots.blast, projectiles = f.world.projectiles.length
    f.click(modifiers)
    // 0x6a accepts no modifiers and 0x6b exactly Ctrl; Shift/Alt masks dispatch neither.
    const accepted = bits === 0 || bits === 2
    assert.equal(f.world.shots.blast, shots - Number(accepted))
    assert.equal(f.world.projectiles.length, projectiles + Number(accepted))
    assert.equal(f.world.mode, bits === 0 ? null : 'blast')
  })
  test(`right release cancels a retained spell with modifier combination ${bits}`, () => {
    const f = castFixture()
    f.click({ ctrlKey: true })
    assert.equal(f.world.mode, 'blast')
    const shots = f.world.shots.blast
    f.click({ button: 2, buttons: 0, ...modifiers }, { button: 2, buttons: 2, ...modifiers })
    assert.equal(f.world.mode, null)
    assert.equal(f.world.shots.blast, shots)
  })
}

test('exhausted stock and rejected targets keep the Ctrl-retained spell without casting', () => {
  const f = castFixture()
  f.world.shots.blast = 1
  f.click({ ctrlKey: true })
  assert.equal(f.world.shots.blast, 0)
  assert.equal(f.world.mode, 'blast')
  f.settle()
  for (const up of [{ ctrlKey: true }, {}]) {
    f.click(up)
    assert.equal(f.world.shots.blast, 0)
    assert.equal(f.world.mode, 'blast', 'zero stock rejects without clearing the spell')
  }
  f.world.shots.blast = 2
  f.target({ x: f.shaman.x + 120, z: f.shaman.z + 120 })
  assert.equal(spellTargetError(f.world, 'blast', { x: f.shaman.x + 120, z: f.shaman.z + 120 }).code, -2)
  for (const up of [{ ctrlKey: true }, {}]) {
    f.click(up)
    assert.equal(f.world.shots.blast, 2)
    assert.equal(f.world.mode, 'blast', 'out-of-range rejection keeps the spell')
  }
})

const spell = id => SPELLS.find(s => s.id === id)
const bit = model => 1 << (model - 1)
const charging = (w, model) => !(w.manaWorld.spells[0].disabled & bit(model))
// Mission 8 grants permanent Blast, Lightning, Swarm, Invisibility, Land Bridge and Convert Wild.
const owned = [2, 3, 5, 6, 12, 17]
function chargingWorld() {
  const w = createStartedWorld(8)
  assert.deepEqual(owned.filter(m => w.manaWorld.spells[0].available & (1 << m)), owned)
  assert.equal(w.manaWorld.spells[0].disabled, 0)
  return w
}

test('plain right-click toggles one owned spell and keeps Blast synchronized', () => {
  const w = chargingWorld()
  assert.ok(rightClickSpellCharging(w, spell('blast'), { ctrlKey: false, shiftKey: false }))
  assert.equal(w.manaWorld.spells[0].disabled, bit(2))
  assert.equal(w.charging, false)
  assert.ok(rightClickSpellCharging(w, spell('blast'), { ctrlKey: false, shiftKey: false }))
  assert.equal(w.manaWorld.spells[0].disabled, 0)
  assert.equal(w.charging, true)
  // Without the permanent bit the plain toggle has no target; gifted stock is not charged.
  w.shots.hypnotise = 1
  assert.equal(rightClickSpellCharging(w, spell('hypnotise'), { ctrlKey: false, shiftKey: false }), false)
  assert.equal(w.manaWorld.spells[0].disabled, 0)
})

test('Shift right-click pauses or resumes every owned spell from the clicked state', () => {
  const w = chargingWorld()
  rightClickSpellCharging(w, spell('lightning'), { ctrlKey: false, shiftKey: false })
  // Clicked spell charging -> pause all owned; unowned paused bits are untouched.
  assert.ok(rightClickSpellCharging(w, spell('blast'), { ctrlKey: false, shiftKey: true }))
  for (const model of owned) assert.equal(charging(w, model), false)
  assert.equal(charging(w, 7), true, 'unowned Hypnotise keeps its bit')
  assert.equal(w.charging, false)
  assert.deepEqual(chargingSpells(w.manaWorld, 0).active, 0)
  // Clicked spell paused -> resume all owned.
  assert.ok(rightClickSpellCharging(w, spell('lightning'), { ctrlKey: false, shiftKey: true }))
  for (const model of owned) assert.equal(charging(w, model), true)
  assert.equal(w.charging, true)
})

test('Ctrl right-click charges only that spell, then restores the prior pattern', () => {
  const w = chargingWorld(), tribe = w.manaTribes[0]
  rightClickSpellCharging(w, spell('swarm'), { ctrlKey: false, shiftKey: false })
  assert.equal(charging(w, 5), false)
  const before = w.manaWorld.spells[0].disabled
  // Ctrl wins over Shift.
  assert.ok(rightClickSpellCharging(w, spell('lightning'), { ctrlKey: true, shiftKey: true }))
  assert.deepEqual(owned.filter(m => charging(w, m)), [3])
  assert.equal(tribe.chargeFocusModel, 3)
  assert.equal(tribe.chargeFocusMask, 1 | (1 << 2) | (1 << 3) | (1 << 6) | (1 << 12) | (1 << 17))
  assert.equal(w.charging, false)
  // A checkpoint keeps the focus memory and its restore continuation.
  const restored = migrateCheckpoint(structuredClone(w))
  assert.ok(rightClickSpellCharging(restored, spell('lightning'), { ctrlKey: true, shiftKey: false }))
  assert.equal(restored.manaWorld.spells[0].disabled, before)
  assert.ok(rightClickSpellCharging(w, spell('lightning'), { ctrlKey: true, shiftKey: false }))
  assert.equal(w.manaWorld.spells[0].disabled, before, 'previously paused Swarm stays paused')
  assert.equal(charging(w, 5), false)
  assert.equal(w.charging, true)
  assert.equal(tribe.chargeFocusModel, 0)
  assert.equal(tribe.chargeFocusMask & 1, 0)
  // Without a focus marker the next Ctrl click focuses again instead of restoring.
  rightClickSpellCharging(w, spell('lightning'), { ctrlKey: true, shiftKey: false })
  assert.deepEqual(owned.filter(m => charging(w, m)), [3])
})

test('focus memory is replaced by another Ctrl spell and cancelled by plain or Shift charging', () => {
  for (const cancel of [{ ctrlKey: false, shiftKey: false }, { ctrlKey: false, shiftKey: true }]) {
    const w = chargingWorld(), tribe = w.manaTribes[0]
    rightClickSpellCharging(w, spell('blast'), { ctrlKey: true, shiftKey: false })
    rightClickSpellCharging(w, spell('invisibility'), cancel)
    assert.equal(tribe.chargeFocusMask & 1, 0)
    assert.equal(tribe.chargeFocusModel, 2, 'the consumer clears only the marker bit')
    const after = w.manaWorld.spells[0].disabled
    rightClickSpellCharging(w, spell('blast'), { ctrlKey: true, shiftKey: false })
    assert.deepEqual(owned.filter(m => charging(w, m)), [2], 'focus, not restore')
    rightClickSpellCharging(w, spell('blast'), { ctrlKey: true, shiftKey: false })
    assert.equal(w.manaWorld.spells[0].disabled, after)
  }
  const w = chargingWorld()
  rightClickSpellCharging(w, spell('blast'), { ctrlKey: true, shiftKey: false })
  rightClickSpellCharging(w, spell('bridge'), { ctrlKey: true, shiftKey: false })
  // The second focus snapshots the first focus's state, so restoring keeps only Blast.
  assert.deepEqual(owned.filter(m => charging(w, m)), [12])
  rightClickSpellCharging(w, spell('bridge'), { ctrlKey: true, shiftKey: false })
  assert.deepEqual(owned.filter(m => charging(w, m)), [2])
})

test('Ctrl on gifted-only stock focuses its bit; alternate mode and mode 2 reject every modifier', () => {
  const w = chargingWorld()
  w.shots.hypnotise = 1
  assert.ok(rightClickSpellCharging(w, spell('hypnotise'), { ctrlKey: true, shiftKey: false }))
  assert.deepEqual(owned.filter(m => charging(w, m)), [], 'owned spells are paused for the gifted focus')
  assert.equal(charging(w, 7), true)
  for (const modifiers of [{}, { shiftKey: true }, { ctrlKey: true }].map(m => ({ ctrlKey: false, shiftKey: false, ...m }))) {
    const blocked = chargingWorld()
    blocked.shots.armageddon = 1
    assert.equal(spellChargingCommand(blocked, spell('armageddon'), modifiers), null, 'mode 2 without 0x100')
    blocked.manaWorld.gameFlags |= 32
    assert.equal(spellChargingCommand(blocked, spell('blast'), modifiers), null, 'alternate flag 0x20')
    assert.equal(blocked.manaWorld.spells[0].disabled, 0)
  }
  const allowed = chargingWorld()
  allowed.manaWorld.gameFlags |= 256
  assert.deepEqual(spellChargingCommand(allowed, spell('armageddon'), { ctrlKey: false, shiftKey: true }),
    { command: SpellChargingCommand.All, model: 18, enable: false })
})

test('consumer index conventions: loops use available bit(index), paused bits use bit(index - 1)', () => {
  const w = { spells: [{ available: (1 << 2) | (1 << 9), disabled: 0, stocks: [] }] }
  const tribe = { spellOwner: 0, chargeFocusMask: 0, chargeFocusModel: 0 }
  applySpellChargingCommand(w, tribe, SpellChargingCommand.All, 2, false)
  assert.equal(w.spells[0].disabled, (1 << 1) | (1 << 8))
  applySpellChargingCommand(w, tribe, SpellChargingCommand.Toggle, 9, true)
  assert.equal(w.spells[0].disabled, 1 << 1)
  applySpellChargingCommand(w, tribe, SpellChargingCommand.Focus, 2, false)
  assert.equal(tribe.chargeFocusMask, 1 | (1 << 9))
  assert.equal(w.spells[0].disabled, 1 << 8)
})

test('store save/load continues focus memory; a save without it is rejected unchanged', async () => {
  const { createGameStore } = await import('../app/game-store.ts')
  // The store's own current-format World (Mission 1, permanent Blast only).
  const store = createGameStore(), w = store.getWorld()
  assert.ok(w.manaWorld.spells[0].available & (1 << 2))
  rightClickSpellCharging(w, spell('blast'), { ctrlKey: true, shiftKey: false })
  await store.saveCheckpoint()
  assert.equal(store.loadCheckpoint(), true)
  const restored = store.getWorld()
  assert.equal(restored.manaTribes[0].chargeFocusModel, 2)
  assert.ok(rightClickSpellCharging(restored, spell('blast'), { ctrlKey: true, shiftKey: false }))
  assert.equal(restored.manaWorld.spells[0].disabled, 0, 'restore after load')
  assert.equal(restored.manaTribes[0].chargeFocusModel, 0, 'the loaded marker selects restore, not refocus')
  for (const key of ['chargeFocusMask', 'chargeFocusModel']) {
    const saved = store.getWorld().manaTribes[1][key]
    delete store.getWorld().manaTribes[1][key]
    await assert.rejects(store.saveCheckpoint(), /incompatible with this development version/)
    store.getWorld().manaTribes[1][key] = saved
  }
  assert.equal(store.loadCheckpoint(), true, 'the rejected attempts keep the prior checkpoint')
  assert.equal(store.getWorld().manaTribes[0].chargeFocusModel, 2)
})
