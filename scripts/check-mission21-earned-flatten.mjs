import assert from 'node:assert/strict'
import test from 'node:test'
import {
  cast,
  command,
  placeBuilding,
  select,
  setSelection,
  spellTargetError,
  tick,
} from '../app/model.ts'
import { rightClickSpellCharging } from '../app/spell-charging.ts'
import { SPELLS } from '../app/world-rules.ts'
import { markerHeight } from '../app/campaign-runtime.ts'
import { createGameStore } from '../app/game-store.ts'
import { liveCommandContext } from '../app/live-command.ts'
import { canOrder, unitAnimationSource } from '../app/selection-runtime.ts'

// One arm per guarded invocation: keep this expensive gameplay witness out of
// automatic top-level test discovery. It does not establish spatial selectivity.
const mode = process.argv[2]
assert.ok((mode === 'cast' || mode === 'no-cast') && process.argv.length === 3,
  'Usage: node scripts/check-mission21-earned-flatten.mjs <cast|no-cast>')

const step = w => {
  assert.equal(w.status, 'playing')
  assert.equal(w.paused, false)
  const prior = w.turn
  tick(w, 1 / 12)
  assert.equal(w.turn, prior + 1, 'fixed simulation step must advance exactly one turn')
}
const advance = (w, turn) => {
  while (w.turn < turn) step(w)
}
const until = (w, ready, deadline, label) => {
  while (!ready() && w.turn < deadline) {
    assert.equal(w.status, 'playing', label)
    step(w)
  }
  assert.ok(ready(), `${label}: not reached by turn ${deadline}`)
}
const focus = (w, id) =>
  assert.ok(
    rightClickSpellCharging(w, SPELLS.find(spell => spell.id === id), {
      ctrlKey: true,
      shiftKey: false,
    }),
    `shipped charging control refused ${id}`
  )
const marker = w => markerHeight(w.terrain, 94, 21, w.land.heights)
const fault = w => w.campaignAIs[1].variables[24]
const thirdVolcano = w => w.effects.filter(e => e.volcano && e.x === 85 && e.z === 53)
const warning = w => w.messages.slots.some(m => m?.view?.cell === 49754)
const aim = { x: 82, z: 54 }
const priorOffsetAim = { x: 84, z: 54 }
const rally = { x: 80, z: 54 }
const secondaryAim = { x: 84, z: 56 }

test(`M21 earned Flatten, matched opening: ${mode}`, { timeout: 120_000 }, async () => {
  const store = createGameStore()
  store.startMission(21)
  const world = store.getWorld()
  const model = SPELLS.find(s => s.id === 'flatten').model
  const braves = w => w.units.filter(u => u.team === 'blue' && u.kind === 'brave')

  // Retain the already-qualified M21 second-fault economy, without supplied inputs.
  step(world)
  focus(world, 'convertWild')
  until(world, () => world.shots.convertWild > 0, 1000, 'earned Convert')
  assert.ok(cast(world, 'convertWild', { x: 31, z: 87 }))
  until(world, () => braves(world).length === 6, 1500, 'Convert created six Braves')
  focus(world, 'bridge')
  setSelection(world, braves(world).slice(0, 3).map(u => u.id))
  const head = world.shrines.find(s => s.kind === 'flattenEffect')
  assert.ok(head)
  assert.ok(command(world, head))
  setSelection(world, braves(world).slice(3).map(u => u.id))
  assert.ok(placeBuilding(world, 'hut', { x: 34, z: 80 }))
  while (!world.shots.bridge && world.turn < 3700) {
    step(world)
    if (world.turn % 128 === 0) {
      select(world, 'shaman')
      command(world, { x: 40, z: 80 })
    }
  }
  assert.ok(world.shots.bridge > 0 && world.turn < 3700)
  assert.equal(world.campaignAIs[1].variables[22], 2)
  assert.ok(cast(world, 'bridge', { x: 52, z: 58 }))
  advance(world, 3776)
  assert.equal(world.campaignAIs[1].variables[23], 2)
  assert.ok(world.buildings.some(b => b.team === 'blue' && b.kind === 'hut' && b.progress === 1))
  assert.ok(world.units.filter(u => u.team === 'blue').length > 7)

  const tribe = world.manaTribes[world.manaWorld.playerTribe]
  const before = world.spellCasts[0][model]
  assert.ok(world.manaWorld.spells[tribe.spellOwner].available & (1 << model), 'authored permanent chargeability')
  assert.equal(world.shots.flatten, 0, 'no free or supplied Flatten stock')
  focus(world, 'flatten')
  until(world, () => world.shots.flatten > 0, 7000, 'earned Flatten from campaign economy')
  assert.equal(world.spellCasts[0][model], before, 'no additional player Flatten was allocated while stock charged')

  select(world, 'shaman')
  const shaman = world.units.find(u => u.team === 'blue' && u.kind === 'shaman' && canOrder(u))
  assert.ok(shaman, 'selected live Shaman was not found')
  const pos = () => ({ x: shaman.x, z: shaman.z })
  const errors = () => [aim, secondaryAim, priorOffsetAim].map(point => spellTargetError(world, 'flatten', point))
  const report = (event, extra = {}) => console.log('M21_ROUTE ' + JSON.stringify({
    event, turn: world.turn, pos: pos(), hp: shaman.hp, path: shaman.path.length,
    selection: world.selected, message: world.message, stock: world.shots.flatten,
    casts: world.spellCasts[0][model], ...extra,
  }))
  assert.ok(shaman && world.selected.includes(shaman.id) && shaman.hp > 0)
  assert.equal(unitAnimationSource(shaman)?.vehicle ?? shaman.native?.vehicle ?? 0, 0)
  assert.equal(world.turn, 6924)
  assert.equal(world.status, 'playing')
  assert.equal(world.paused, false)
  assert.equal(world.shots.flatten, 1)
  assert.equal(before, 0)
  assert.equal(liveCommandContext(world, rally)?.model, 3)
  assert.equal(liveCommandContext(world, rally)?.enabled, true)
  const origin = pos()
  report('before route', { errors: errors(), rally, lastOrderTurn: world.lastOrderTurn })
  const accepted = command(world, rally)
  report('after command', { accepted, first: shaman.path[0], last: shaman.path.at(-1), goal: [shaman.native?.goalX, shaman.native?.goalY], lastOrderTurn: world.lastOrderTurn })
  assert.ok(accepted)
  assert.equal(world.lastOrderTurn, 6924)
  assert.doesNotMatch(world.message, /No land route/i)
  assert.ok(shaman.path.length > 0, 'ordinary route must allocate a non-empty path')
  let moved = false
  while (world.turn < 7490 && !(moved && errors()[0] == null)) {
    assert.equal(world.status, 'playing')
    assert.equal(world.paused, false)
    assert.ok(shaman.hp > 0 && canOrder(shaman))
    step(world)
    moved ||= shaman.x !== origin.x || shaman.z !== origin.z
  }
  report('movement/range', { moved, errors: errors() })
  assert.ok(moved, 'Shaman must actually move after ordinary accepted order')
  assert.ok(errors()[0] == null, 'primary click must be in ordinary range by 7490')
  advance(world, 7520)
  report('opening', { marker: marker(world), fault: fault(world), errors: errors() })
  assert.ok(shaman.hp > 0 && canOrder(shaman) && world.selected.includes(shaman.id))
  assert.ok(errors()[0] == null)
  assert.equal(world.campaignAIs[1].variables[21], 1)
  assert.equal(fault(world), 0)
  assert.equal(marker(world), 238)

  // Each invocation reaches the same recorded opening through normal play.
  // Save/Load equality is within the invocation, not a comparison across runs.
  const baseline = { turn: world.turn, pos: pos(), stock: world.shots.flatten, fault: fault(world), marker: marker(world) }
  assert.equal(await store.saveCheckpoint(false), false, 'Node has no IndexedDB; session Save only')
  assert.ok(store.loadCheckpoint())
  const arm = store.getWorld()
  assert.deepEqual(arm, world)
  assert.equal(baseline.stock, 1)
  if (mode === 'cast') {
    assert.ok(cast(arm, 'flatten', aim))
    assert.equal(arm.shots.flatten, 0)
    assert.equal(arm.spellCasts[0][model], before + 1)
    const projectile = arm.projectiles.find(p => p.spell === 'flatten' && p.team === 'blue')
    assert.ok(projectile)
    assert.equal(projectile.caster, shaman.id)
    console.log('M21_CAST ' + JSON.stringify({ baseline, point: aim, target: projectile.target, caster: projectile.caster }))
    assert.deepEqual(projectile.target, { x: 83, z: 53 })
    let sawFlatten = false, sawThirdVolcano = false, sawWarning = false
    while (arm.turn < 8128) {
      assert.equal(arm.status, 'playing')
      assert.equal(arm.paused, false)
      step(arm)
      sawFlatten ||= arm.effects.some(effect => !!effect.flatten)
      sawThirdVolcano ||= thirdVolcano(arm).length > 0
      sawWarning ||= warning(arm)
      if (arm.turn === 8127 || arm.turn === 8128)
        console.log('M21_DEADLINE ' + JSON.stringify({
          turn: arm.turn, marker: marker(arm), fault: fault(arm), sawFlatten, sawThirdVolcano, sawWarning,
        }))
    }
    assert.ok(sawFlatten)
    assert.notEqual(marker(arm), 238)
    assert.equal(fault(arm), 2)
    assert.equal(sawThirdVolcano, false)
    assert.equal(sawWarning, false)
  } else {
    console.log('M21_NO_CAST ' + JSON.stringify({ baseline }))
    let firstMarkerDeparture = null, firstLatch = null, sawFlatten = false
    let firstVolcano = null, firstWarning = null
    while (arm.turn < 8128) {
      assert.equal(arm.status, 'playing')
      assert.equal(arm.paused, false)
      assert.equal(arm.shots.flatten, 1)
      assert.equal(arm.spellCasts[0][model], before)
      step(arm)
      const height = marker(arm)
      const state = fault(arm)
      const volcanoes = thirdVolcano(arm)
      const warningSlot = arm.messages.slots.find(m => m?.view?.cell === 49754)
      if (height !== 238 && firstMarkerDeparture === null)
        firstMarkerDeparture = { turn: arm.turn, height }
      if (state !== 0 && firstLatch === null)
        firstLatch = { turn: arm.turn, state, height }
      if (volcanoes.length > 0 && firstVolcano === null)
        firstVolcano = { turn: arm.turn, count: volcanoes.length, x: volcanoes[0].x, z: volcanoes[0].z }
      if (warningSlot && firstWarning === null)
        firstWarning = { turn: arm.turn, view: warningSlot.view, lifetime: warningSlot.lifetime }
      sawFlatten ||= arm.effects.some(effect => !!effect.flatten)
      if (arm.turn === 8127 || arm.turn === 8128)
        console.log('M21_DEADLINE ' + JSON.stringify({
          turn: arm.turn, marker: height, fault: state, stock: arm.shots.flatten,
          casts: arm.spellCasts[0][model], firstMarkerDeparture, firstLatch, firstVolcano, firstWarning, sawFlatten,
        }))
    }
    assert.equal(arm.shots.flatten, 1)
    assert.equal(arm.spellCasts[0][model], 0)
    assert.equal(sawFlatten, false)
    assert.equal(fault(arm), 1)
    assert.equal(firstLatch?.turn, 8128)
    assert.ok(!firstMarkerDeparture || firstMarkerDeparture.turn === 8128)
    assert.deepEqual(firstVolcano, { turn: 8128, count: 1, x: 85, z: 53 })
    assert.deepEqual(firstWarning, { turn: 8128, view: { cell: 49754, payload: 16668 }, lifetime: 256 })
  }
})
