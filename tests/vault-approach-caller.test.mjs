import assert from 'node:assert/strict'
import test from 'node:test'
import { command, createWorld, select, tick } from '../app/model.ts'
import { buildingFootprintCells, buildingOutsidePoint } from '../app/building-shapes.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import levelThree from '../app/level-three.ts'
import { finishLevelStart } from './level-start-fixture.mjs'
import { bindTrainingPanelRequests } from '../app/training-panel-requests.ts'

const cell = point => ((point.y & 65535) >>> 9) * 128 + ((point.x & 65535) >>> 9)

// CPU model/caller coverage: startup and travel use real turns, without browser
// presentation/input proof. No actor relocation, work injection or supplied phases.
test('authored M3 Vault command approaches its original outside point and earns prayer work there', t => {
  const world = createWorld(3)
  const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  const vault = world.shrines.find(shrine => shrine.kind === 'vault' && shrine.reward === 'temple')
  const authored = levelThree.objects.find(object => object.index === 104)
  assert.ok(shaman)
  assert.ok(vault)
  assert.deepEqual(
    [authored.type, authored.model, authored.owner, authored.x, authored.z, authored.angle],
    [2, 18, 255, -38, -132, 0]
  )
  const pose = {
    object: 154,
    angle: authored.angle,
    anchorX: Math.round((authored.x + 8) * 256) & 0xfe00,
    anchorY: Math.round((-authored.z - 8) * 256) & 0xfe00,
  }
  // Retained 004044b0 and shape 59: anchor (57856,31744), outside [20,4].
  const expected = { x: 58112, y: 30976 }
  const footprint = new Set(buildingFootprintCells(pose))
  assert.deepEqual(buildingOutsidePoint(pose), expected)
  assert.equal(footprint.has(cell(expected)), false)

  finishLevelStart(world)
  assert.equal(world.units.find(unit => unit.id === shaman.id), shaman)
  assert.ok(shaman.hp > 0)
  select(world, 'shaman')
  assert.deepEqual(world.selected, [shaman.id])
  assert.equal(command(world, vault), true)
  const issued = currentPersonOrder(world.buildingOrders, shaman.native)
  assert.equal(issued?.model, 33)
  assert.equal(issued.a, vault.id)
  assert.equal(issued.flags & 1, 0)

  let approached = false
  let prayerWork = false
  // Same finite 4,000-turn bound as the existing ordinary Vault collection test.
  for (let turn = 0; turn < 4000 && !prayerWork; turn++) {
    const beforePhase = shaman.native?.commandPhase
    const beforeWork = vault.work
    tick(world, 1 / 12)
    const person = shaman.native
    assert.ok(person, 'the original Shaman must retain the actual native task owner')
    assert.equal(world.objectCells.objects.get(shaman.id), person)
    assert.ok(shaman.hp > 0, 'the original Shaman must remain alive')
    const order = currentPersonOrder(world.buildingOrders, person)
    assert.equal(order?.model, 33, 'the ordinary Vault command must remain active')
    assert.equal(order.a, vault.id)
    assert.equal(order.flags & 1, 0)

    if (!approached && person.commandPhase === 1) {
      const goal = { x: person.goalX, y: person.goalY }
      t.diagnostic(JSON.stringify({
        boundary: 'first-phase-1', turn: world.turn, shaman: shaman.id,
        target: vault.id, phase: person.commandPhase, goal, expected,
        goalInsideFootprint: footprint.has(cell(goal)),
      }))
      assert.deepEqual(goal, expected, 'the actual phase-1 caller must install the original outside point')
      assert.equal(footprint.has(cell(goal)), false, 'prayer approach must target outside the occupied mask')
      approached = true
    }
    if (beforePhase === 2 && person.commandPhase === 2 && vault.work > beforeWork) {
      assert.equal(approached, true)
      assert.deepEqual({ x: person.goalX, y: person.goalY }, expected)
      assert.ok(Math.abs(person.x - expected.x) <= 11 && Math.abs(person.y - expected.y) <= 11)
      assert.equal(footprint.has(cell(person)), false, 'pre-open prayer must stay outside the Vault')
      assert.equal(person.state, 10)
      assert.equal(person.commandStatus, 33)
      assert.equal(vault.model, 154, 'this witness is prayer before opening, not intentional phase-4 entry')
      assert.equal(vault.uses, 0)
      assert.equal(vault.forced, false)
      t.diagnostic(JSON.stringify({
        boundary: 'phase-2-work', turn: world.turn, phase: person.commandPhase,
        position: { x: person.x, y: person.y }, beforeWork, work: vault.work,
      }))
      prayerWork = true
    }
  }
  assert.equal(approached, true, 'ordinary command 33 must reach its first approach phase within 4,000 turns')
  assert.equal(prayerWork, true, 'ordinary phase-2 work must grow at the canonical outside point within 4,000 turns')
})

test('ordinary M3 Vault samples request the panel before replacing the cached count and prayer work', t => {
  const world = createWorld(3)
  const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  const vault = world.shrines.find(shrine => shrine.kind === 'vault' && shrine.reward === 'temple')
  finishLevelStart(world)
  select(world, 'shaman')
  assert.deepEqual(world.selected, [shaman.id])
  assert.equal(command(world, vault), true)
  const requests = []
  const release = bindTrainingPanelRequests(world, {
    requestAutomaticTraining() {},
    requestAutomaticVault(id) {
      if (id !== vault.id) return
      requests.push({
        turn: world.turn,
        followers: vault.followers,
        work: vault.work,
        state: shaman.native.state,
        command: shaman.native.commandStatus,
      })
    },
  })
  t.after(release)
  let firstPositive
  let repeatedPositive
  for (let turns = 0; turns < 4000 && !repeatedPositive; turns++) {
    const before = { followers: vault.followers, work: vault.work }
    tick(world, 1 / 12)
    const request = requests.findLast(sample => sample.turn === world.turn)
    if (request) {
      assert.equal(world.turn & 3, 0)
      assert.equal(request.state, 10)
      assert.equal(request.command, 33)
      assert.equal(request.followers, before.followers)
      assert.equal(request.work, before.work)
    }
    if (!before.followers && vault.followers) {
      assert.ok(request, 'the first actual 0→1 sample must request before its count write')
      firstPositive = request
      assert.equal(request.followers, 0)
      assert.equal(vault.work, request.work + 1)
    } else if (firstPositive && request?.followers === 1) repeatedPositive = request
  }
  assert.ok(firstPositive, 'ordinary original Shaman reaches a positive prayer sample')
  assert.ok(repeatedPositive, 'a later actual sample must request with the previous positive count')
  assert.equal(repeatedPositive.turn - firstPositive.turn, 4)
  assert.equal(shaman.native, world.objectCells.objects.get(shaman.id))
  assert.equal(currentPersonOrder(world.buildingOrders, shaman.native)?.model, 33)
  assert.equal(vault.uses, 0)
  assert.equal(vault.forced, false)
  t.diagnostic(JSON.stringify({ boundary: 'vault-request-order', firstPositive, repeatedPositive }))

  // Ordinary command cancellation must update the cached count to zero, then
  // ordinary reissue can produce a fresh 0→1 sample through the same caller.
  assert.equal(command(world, { x: 35, z: 81 }), true)
  for (let turns = 0; turns < 4 && vault.followers; turns++) tick(world, 1 / 12)
  assert.equal(vault.followers, 0)
  assert.equal(command(world, vault), true)
  let resumed
  for (let turns = 0; turns < 4000 && !resumed; turns++) {
    const before = vault.followers
    tick(world, 1 / 12)
    if (!before && vault.followers) resumed = requests.findLast(sample => sample.turn === world.turn)
  }
  assert.ok(resumed)
  assert.equal(resumed.followers, 0)
})

const nop = () => {}

// Actual Scene start/request/update/disposal with supplied DOM and presentation
// visits. No browser, GPU, pointer picking, native execution or artwork claim.
async function vaultSceneFixture(t, world = createWorld(3)) {
  const { loadSceneFixture } = await import('./support/bloodlust-scene.mjs')
  await loadSceneFixture()
  const { GameScene } = await import('../app/scene.ts')
  const { ObjectPanels } = await import('../app/object-panels.ts')
  const element = () => ({
    children: [], style: {}, dataset: {}, classList: { add: nop },
    setAttribute: nop, addEventListener: nop, matches: () => false, contains: () => false,
    insertBefore(child) { this.children.push(child) },
    remove() { this.removed = true },
  })
  const globals = new Map()
  for (const [name, value] of Object.entries({
    document: { createElement: element, querySelector: () => null },
    window: {}, requestAnimationFrame: () => 1, cancelAnimationFrame: nop,
  })) {
    globals.set(name, Object.getOwnPropertyDescriptor(globalThis, name))
    Object.defineProperty(globalThis, name, { configurable: true, value })
  }
  const scene = Object.assign(Object.create(GameScene.prototype), {
    world, started: false, disposed: false,
    terrainLoad: { signal: { aborted: false }, abort: nop },
    drawMinimap: nop, listen: nop, mini: {}, animate: nop,
    gameClock: { animationFrame: 0 },
    container: element(), unitMeshes: new Map(), buildingPanels: new Map(),
    overviewStage: 0, overviewActive: false, pointerScreen: null, pointerButtons: 0,
    visible: () => true, ownedSounds: new Map(), resize: { disconnect: nop },
    disposeListeners: [], scene: { remove: nop }, globe: { dispose: nop },
    releaseGroup: nop, waterMap: { dispose: nop }, terrainMap: { dispose: nop },
    view: { dispose: nop }, renderer: { dispose: nop, domElement: element() },
    cancelTooltipInspection: nop, tooltipElement: element(), pointerOutline: element(),
    spellPointer: element(), worshipPresentation: { dispose: nop },
  })
  scene.objectPanels = new ObjectPanels(scene)
  assert.equal(scene.start(), true)
  t.after(() => {
    scene.dispose()
    for (const [name, descriptor] of globals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor)
      else delete globalThis[name]
    }
  })
  return {
    scene, world,
    vault: world.shrines.find(shrine => shrine.kind === 'vault' && shrine.reward === 'temple'),
    paint(visits = 1) {
      scene.gameClock.animationFrame += visits
      scene.objectPanels.update({ complete: false, naturalWidth: 0 })
    },
  }
}

function until(world, label, condition) {
  for (let turns = 0; turns < 4000 && !condition(); turns++) tick(world, 1 / 12)
  assert.ok(condition(), `${label} by turn ${world.turn}`)
}

const reservationCount = (world, id) =>
  world.secondaryEffects.reservations.filter(owner => owner === `object-panel:${id}`).length

test('ordinary M3 prayer opens only from the prior positive count, expires on cancellation and recreates on reissue', async t => {
  const { scene, world, vault, paint } = await vaultSceneFixture(t)
  finishLevelStart(world)
  const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  select(world, 'shaman')
  assert.equal(command(world, vault), true)
  const panels = scene.objectPanels
  const request = panels.requestAutomaticVault
  const observations = []
  panels.requestAutomaticVault = function (id) {
    const before = { turn: world.turn, id, followers: vault.followers, work: vault.work }
    const result = request.call(this, id)
    if (id === vault.id) observations.push({ ...before, result, phase: this.panels.get(id)?.phase })
    return result
  }
  until(world, 'first positive cached prayer count', () => vault.followers === 1)
  assert.equal(panels.panels.has(vault.id), false)
  assert.equal(observations.at(-1).followers, 0)
  assert.equal(observations.at(-1).result, 'automatic:rejected')
  paint(0)
  assert.equal(panels.panels.has(vault.id), false, 'painting the new count cannot bypass the sampler')
  until(world, 'automatic Vault record', () => panels.panels.has(vault.id))
  const panel = panels.panels.get(vault.id)
  assert.deepEqual(observations.at(-1), {
    turn: world.turn, id: vault.id, followers: 1, work: 1,
    result: 'automatic:created', phase: -1,
  })
  assert.equal(panel.hold, 16)
  assert.equal(panel.automatic, true)
  assert.equal(panels.automaticVaultLatches.has(vault.id), true)
  assert.equal(reservationCount(world, vault.id), 1)
  assert.equal(vault.work, 2)
  assert.equal(vault.panelActivity, undefined)
  paint(4)
  assert.equal(panel.phase, 1)
  assert.equal(panel.remaining, 15)
  for (let turns = 0; turns < 8; turns++) tick(world, 1 / 12)
  assert.equal(observations.at(-1).result, 'automatic:latched')
  assert.equal(panels.panels.get(vault.id), panel)
  assert.equal(reservationCount(world, vault.id), 1)
  paint(2)
  assert.equal(panel.remaining, 15, 'post-count activity renews the configured hold')

  assert.equal(command(world, { x: 35, z: 81 }), true)
  until(world, 'cancelled count', () => vault.followers === 0)
  panel.element.matches = () => true
  paint()
  assert.equal(panel.phase, 2)
  assert.equal(panels.automaticVaultLatches.has(vault.id), false)
  paint(3)
  assert.equal(panels.panels.has(vault.id), false, 'hover cannot retain cancelled automatic prayer')
  assert.equal(reservationCount(world, vault.id), 0)
  assert.equal(command(world, vault), true)
  until(world, 'reissued automatic Vault record', () => panels.panels.has(vault.id))
  assert.notEqual(panels.panels.get(vault.id), panel)
  assert.equal(world.units.find(unit => unit.id === shaman.id), shaman)
  assert.equal(shaman.native, world.objectCells.objects.get(shaman.id))
  assert.equal(vault.uses, 0)
  assert.equal(vault.forced, false)

  // Finish the same authored finite trigger. active is the existing combined
  // trigger/body adapter; enabled alone is not a generic panel-hiding rule.
  until(world, 'Temple knowledge acquisition', () => world.unlockedTemple)
  assert.equal(vault.active, false)
  assert.equal(vault.uses, 1)
  paint(8)
  assert.equal(panels.panels.has(vault.id), false)
  assert.equal(panels.automaticVaultLatches.has(vault.id), false)
})

test('Vault allocation rejects full shared capacity without a latch and reuses the same owner without resetting clocks', async t => {
  const { scene, world, vault, paint } = await vaultSceneFixture(t)
  const panels = scene.objectPanels
  // Supplied consumer capacity/lifecycle boundary, separate from ordinary play.
  vault.followers = 1
  const identity = { kind: vault.kind, mode: vault.mode, model: vault.model, active: vault.active, followers: vault.followers }
  for (const invalid of [{ kind: 'bridge' }, { mode: 0 }, { model: 0 }, { active: false }, { followers: 256 }]) {
    Object.assign(vault, invalid)
    assert.equal(panels.requestAutomaticVault(vault.id), 'automatic:rejected')
    assert.equal(panels.automaticVaultLatches.has(vault.id), false)
    Object.assign(vault, identity)
  }
  for (let id = 100000; id < 100032; id++) panels.buildingRecords.set(id, {})
  assert.equal(panels.requestAutomaticVault(vault.id), 'automatic:rejected-capacity')
  assert.equal(panels.automaticVaultLatches.has(vault.id), false)
  assert.equal(panels.panels.has(vault.id), false)
  assert.equal(reservationCount(world, vault.id), 0)
  panels.buildingRecords.clear()
  const { syncSecondaryReservations } = await import('../app/scene-secondary-effects.ts')
  syncSecondaryReservations(scene)
  const { allocateSecondaryEffect, releaseSecondaryEffect } = await import('../app/secondary-effects.ts')
  while (world.secondaryEffects.order.length < 160)
    assert.notEqual(allocateSecondaryEffect(world.secondaryEffects, { kind: 'orderMarker', effect: -1, counter: 0 }), null)
  assert.equal(panels.requestAutomaticVault(vault.id), 'automatic:rejected-capacity')
  assert.equal(panels.automaticVaultLatches.has(vault.id), false)
  releaseSecondaryEffect(world.secondaryEffects, world.secondaryEffects.order[0])
  assert.equal(panels.requestAutomaticVault(vault.id), 'automatic:created')
  const panel = panels.panels.get(vault.id)
  assert.equal(reservationCount(world, vault.id), 1)
  paint(4)
  vault.enabled = false
  paint()
  assert.equal(panel.phase, 1, 'disabled refill gate is not trigger retirement')
  assert.equal(panel.remaining, 15)
  panels.automaticVaultLatches.delete(vault.id)
  paint()
  assert.equal(panels.automaticVaultLatches.has(vault.id), true, 'positive phase1 restores its latch')
  vault.followers = 0
  assert.equal(panels.requestAutomaticVault(vault.id), 'automatic:rejected', 'activity precedes latch test')
  paint()
  assert.equal(panel.phase, 2)
  const remaining = panel.remaining
  vault.followers = 1
  assert.equal(panels.requestAutomaticVault(vault.id), 'automatic:reused')
  assert.equal(panels.panels.get(vault.id), panel)
  assert.equal(panel.remaining, remaining)
  assert.equal(reservationCount(world, vault.id), 1)
  paint(3)
  assert.equal(panels.panels.has(vault.id), false)
  assert.equal(panels.automaticVaultLatches.has(vault.id), false)
})

test('Vault prior1→new0 entry and a long paint expire on the first inactive phase1 visit', async t => {
  const { scene, world, vault, paint } = await vaultSceneFixture(t)
  finishLevelStart(world)
  select(world, 'shaman')
  assert.equal(command(world, vault), true)
  // Supporting ordering case: prior count is supplied while the actual Shaman
  // still approaches from the authored start. No ordinary1→0 claim.
  vault.followers = 1
  const panels = scene.objectPanels
  until(world, 'pre-count request while approaching', () => panels.panels.has(vault.id))
  const panel = panels.panels.get(vault.id)
  assert.equal(vault.followers, 0)
  assert.equal(panel.phase, -1)
  assert.equal(panels.automaticVaultLatches.has(vault.id), true)
  paint(8)
  assert.equal(panels.panels.has(vault.id), false)
  assert.equal(panels.automaticVaultLatches.has(vault.id), false)
  assert.equal(reservationCount(world, vault.id), 0)
})

test('Vault Save/Load and replacement Scene rebuild only on the next live request; stale disposal preserves the successor', async t => {
  const { createGameStore } = await import('../app/game-store.ts')
  const { trainingPanelRequestOwner } = await import('../app/training-panel-requests.ts')
  const store = createGameStore()
  const original = createWorld(3)
  finishLevelStart(original)
  select(original, 'shaman')
  assert.equal(command(original, original.shrines.find(shrine => shrine.kind === 'vault')), true)
  until(original, 'ordinary positive cache before Save', () => original.shrines.find(shrine => shrine.kind === 'vault').followers === 1)
  store.change(target => Object.assign(target, structuredClone(original)))
  const current = await vaultSceneFixture(t, store.getWorld())
  current.scene.presentationBinding = store.bindPresentation(current.world)
  until(current.world, 'current automatic owner', () => current.scene.objectPanels.panels.has(current.vault.id))
  const panel = current.scene.objectPanels.panels.get(current.vault.id)
  await store.saveCheckpoint()
  assert.equal(current.scene.objectPanels.panels.get(current.vault.id), panel)
  assert.equal(store.loadCheckpoint(), true)
  assert.equal(current.scene.isCurrent(), false)
  assert.equal(current.scene.objectPanels.requestAutomaticVault(current.vault.id), 'automatic:rejected')
  const restored = await vaultSceneFixture(t, store.getWorld())
  restored.scene.presentationBinding = store.bindPresentation(restored.world)
  assert.deepEqual(restored.world.secondaryEffects.reservations, [])
  restored.paint(0)
  assert.equal(restored.scene.objectPanels.panels.size, 0, 'saved positive count cannot open during paint')
  until(restored.world, 'loaded live request', () => restored.scene.objectPanels.panels.has(restored.vault.id))
  const replacement = await vaultSceneFixture(t, restored.world)
  replacement.scene.presentationBinding = store.bindPresentation(restored.world)
  assert.equal(restored.scene.isCurrent(), false)
  assert.equal(restored.scene.objectPanels.requestAutomaticVault(restored.vault.id), 'automatic:rejected')
  until(restored.world, 'replacement live request', () => replacement.scene.objectPanels.panels.has(restored.vault.id))
  restored.scene.dispose()
  current.scene.dispose()
  assert.equal(trainingPanelRequestOwner(restored.world), replacement.scene.objectPanels)
  assert.equal(reservationCount(restored.world, restored.vault.id), 1)
  assert.equal(restored.scene.objectPanels.automaticVaultLatches.size, 0)
  replacement.scene.dispose()
  assert.equal(trainingPanelRequestOwner(restored.world), undefined)
  assert.equal(reservationCount(restored.world, restored.vault.id), 0)
  for (let turns = 0; turns < 4; turns++) tick(restored.world, 1 / 12)
  assert.equal(replacement.scene.objectPanels.panels.size, 0, 'headless requests cannot recreate a disposed owner')
  t.diagnostic('Controlled in-session Save/Load; committed IndexedDB and fresh-page evidence belong to browser QA.')
})

test('Vault sampler rejects invalid local task owners and requests the sampled linked body rather than the order target', t => {
  const base = createWorld(3)
  finishLevelStart(base)
  select(base, 'shaman')
  assert.equal(command(base, base.shrines.find(shrine => shrine.kind === 'vault')), true)
  while ((base.turn + 1) & 3) tick(base, 1 / 12)
  // Supplied negative boundaries after real task admission. Each next actual
  // sampler runs at the same ordinary approach turn; no arrival/work injection.
  for (const [label, invalidate] of [
    ['nonlocal native tribe', (_world, shaman) => { shaman.native.tribe = 1 }],
    ['wrong state', (_world, shaman) => { shaman.native.state = 9 }],
    ['wrong command', (_world, shaman) => { shaman.native.commandStatus = 34 }],
    ['different object-cell owner', (world, shaman) => { world.objectCells.objects.set(shaman.id, { ...shaman.native }) }],
    ['missing modeled body', (_world, _shaman, vault) => { vault.model = 0 }],
    ['inactive finite trigger', (_world, _shaman, vault) => { vault.active = false }],
    ['disabled sampler', (_world, _shaman, vault) => { vault.enabled = false }],
  ]) {
    const world = structuredClone(base)
    const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
    const vault = world.shrines.find(shrine => shrine.kind === 'vault')
    const requests = []
    const release = bindTrainingPanelRequests(world, {
      requestAutomaticTraining() {},
      requestAutomaticVault(id) { requests.push(id) },
    })
    invalidate(world, shaman, vault)
    tick(world, 1 / 12)
    assert.deepEqual(requests, [], label)
    release()
  }

  const world = structuredClone(base)
  const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  const vault = world.shrines.find(shrine => shrine.kind === 'vault')
  // Explicit supplied second linked-body seam, not an authored second M3 Vault
  // or proof of the original separate class2/model18 physical object identity.
  const second = { ...structuredClone(vault), id: world.nextId++, x: vault.x + 64 }
  world.shrines.push(second)
  const requests = []
  const release = bindTrainingPanelRequests(world, {
    requestAutomaticTraining() {},
    requestAutomaticVault(id) { requests.push(id) },
  })
  t.after(release)
  tick(world, 1 / 12)
  assert.equal(currentPersonOrder(world.buildingOrders, shaman.native).a, vault.id)
  assert.deepEqual(requests, [vault.id, second.id])
  assert.equal(vault.followers, 0)
  assert.equal(second.followers, 0)
})
