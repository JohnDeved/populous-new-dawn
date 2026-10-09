// Model planning only. No cast, browser, checkpoint, native execution or product selector.
import assert from 'node:assert/strict'
import { canOrder, command, createWorld, setSelection, tick } from '../../app/model.ts'
import { buildingFootprintCells, buildingInsidePoint, buildingModel, buildingOutsidePoint,
  buildingPose, buildingPosition } from '../../app/building-shapes.ts'
import { canShamanCast, nativeSpellRange } from '../../app/spell-casting.ts'
import { terrainPointHeight } from '../../app/native-terrain.ts'
import { positionDistance, spiralCell } from '../../app/native-math.ts'
import { objectsInCell } from '../../app/object-cells.ts'
import { currentPersonOrder, personReachedOrder } from '../../app/person-orders.ts'
import { samePersonCell } from '../../app/person-idle.ts'
import { tribeForTeam } from '../../app/world-types.ts'
import rules from '../../app/original-rules.json' with { type: 'json' }

const cap = 6000
// Exact maintained missionThreeSwarmStagingPoint; importing its browser module is unnecessary.
const staging = { x: -31.685820678042944, z: -115.69012077842177 }
// PR281 ordinary05's actual snapped impact. One diagnostic origin, no origin search.
const impact = { x: -43, z: -107 }
const nativeXY = p => ({ x: Math.round((p.x + 8) * 256) & 65535,
  y: Math.round((-p.z - 8) * 256) & 65535 })
const cell = p => (p.y & 0xfe00) | ((p.x >>> 8) & 254)
const impactNative = nativeXY(impact)
// 0051031d..00510416 calls spiral index 0..166; it does not scan the center first.
const scanCells = Array.from({ length: 167 }, (_, i) => spiralCell(cell(impactNative), i, 0))
const emit = value => process.stdout.write(JSON.stringify(value) + '\n')
const active = u => u?.builder?.person ?? u?.flight ?? u?.fight?.motion ?? u?.native ?? u?.entry?.person
const orderId = p => p ? p.immediateCommand || p.commands[p.commandCursor] || 0 : 0

emit({ kind: 'proposal', cap, step: 'tick(world, 1/12)', staging, impact, impactNative, scanCells,
  staticFindingsSha256: '6b5a4811593aca3b9c1090f427c94a604c0cd236dc316f6b2c33a05a388eb87c',
  limits: 'One authored world. Port roster and source-derived scan only; native class-2 cell membership/order is unresolved. No production selector, native-history, UI readiness, travel/ejection or browser proof.' })

let world, shaman, move, arrived = null, stage = 'opening', previousSignature, latest
let rows = 0, occupiedSamples = 0, jointSamples = 0
const building = b => {
  const pose = buildingPose(b), admission = b.admission, member = world.objectCells.objects.get(b.id)
  const slots = (admission?.occupants ?? []).slice(0, 6).map((id, slot) => {
    const u = world.units.find(u => u.id === id), p = active(u)
    return { slot, id, unit: u ? { id: u.id, hp: u.hp, team: u.team, kind: u.kind, inside: u.inside } : null,
      person: p ? { id: p.id, class: p.class, model: p.model, tribe: p.tribe, state: p.state,
        building: p.building, flags2: p.flags2, flags3: p.flags3, flags4: p.flags4, life: p.life } : null,
      occupied: !!id && !!u && u.hp > 0 && u.inside === b.id && p?.building === b.id && !!p.class && !(p.flags2 & 1) }
  })
  return { id: b.id, kind: b.kind, team: b.team, tribe: tribeForTeam(b.team), hp: b.hp,
    progress: b.progress, nativeModel: buildingModel(b), pose, displayed: { x: b.x, z: b.z },
    modelOrigin: buildingPosition(pose), outside: buildingOutsidePoint(pose), insidePoint: buildingInsidePoint(pose),
    footprint: buildingFootprintCells(pose).map(index => ({ index, flags: world.land.flags[index],
      buildingId: world.land.buildingIds[index] & 1023 })),
    registeredFootprint: structuredClone(world.buildingFootprints.get(b.id) ?? null),
    objectCellRecord: member ? { id: member.id, class: member.class, tribe: member.tribe,
      x: member.x, y: member.y, flags2: member.flags2, cellNext: member.cellNext, cellPrevious: member.cellPrevious } : null,
    admission: admission ? { id: admission.id, class: admission.class, model: admission.model,
      tribe: admission.tribe, inside: admission.inside, occupants: [...admission.occupants],
      flags2: admission.flags2, flags3: admission.flags3, activity: admission.activity } : null,
    slots, occupied: !!admission?.inside && slots.some(s => s.occupied) }
}
const expectedScan = () => {
  const nonempty = [], prefix = []
  for (const [index, cell] of scanCells.entries()) {
    const objects = [...objectsInCell(world.objectCells, cell)].map((p, rank) => ({
      rank, id: p.id, class: p.class ?? null, tribe: p.tribe ?? null, flags2: p.flags2,
      x: p.x, y: p.y, cellNext: p.cellNext, cellPrevious: p.cellPrevious }))
    if (objects.length) nonempty.push({ index, cell, objects })
    for (const p of objects) if (p.class === 2 && p.tribe !== 0)
      prefix.push({ index, cell, rank: p.rank, id: p.id, tribe: p.tribe })
  }
  return { history: Array(10).fill(0), nonempty, portClass2Prefix: prefix, predictedTarget: null,
    blocked: 'The port has no class-2 object-list producer; syncLivePersonCells removes non-person records. No position/footprint substitution; empty prefix is not evidence that original acquisition finds nothing.' }
}
const read = () => {
  const p = active(shaman), origin = nativeXY(shaman), occupied = world.buildings.find(b => b.id === shaman.inside)
  // Exact pure range leaf and read-only terrain input used by spellRange/spellCaster.
  // Do not call nativePosition/spellTargetError here: those synchronize the live terrain.
  const range = nativeSpellRange(world.manaWorld.gameFlags, world.castingTribes[0].flags, {
    height: terrainPointHeight(world.land, origin), flags2: shaman.inside === null ? 0 : 0x800000,
    building: occupied ? { class: 2, model: buildingModel(occupied), state: occupied.progress === 1 ? 2 : 1 } : null,
  }, 5), distance = positionDistance(origin, impactNative), roster = world.buildings.map(building)
  return { turn: world.turn, time: world.time, stage, status: world.status, inputMask: world.inputMask,
    paused: world.paused, speed: world.speed, selected: [...world.selected], randomState: world.randomState,
    caster: { id: shaman.id, hp: shaman.hp, team: shaman.team, kind: shaman.kind, x: shaman.x, z: shaman.z,
      inside: shaman.inside, nativeId: p?.id, state: p?.state, flags2: p?.flags2, flags4: p?.flags4,
      orderId: orderId(p), order: p ? structuredClone(currentPersonOrder(world.buildingOrders, p)) : null },
    unlockedTemple: world.unlockedTemple, vaultUses: world.shrines.find(h => h.kind === 'vault')?.uses,
    available: world.manaWorld.spells[0].available, stock: world.shots.swarm,
    rawStock: world.manaWorld.spells[0].stocks[5], gifts: world.giftCounts.swarm,
    range: { origin, range, distance, margin: range - distance, meetsMargin: range - distance >= 128 },
    casterPredicate: canOrder(shaman) && !shaman.lift && !shaman.casting &&
      canShamanCast(world.castingTribes[0], world.manaTribes[0].playerType, { state: 0, flags2: 0, flags4: 0 }),
    buildings: roster }
}
const retain = (force = false) => {
  latest = read()
  const enemyOccupied = latest.buildings.filter(b => b.tribe !== 0 && b.occupied)
  if (enemyOccupied.length) occupiedSamples++
  const joint = !!arrived && !!enemyOccupied.length && latest.caster.hp > 0 && latest.stock > 0 &&
    !!(latest.available & (1 << 5)) && latest.range.meetsMargin && latest.casterPredicate
  if (joint) jointSamples++
  // Retain categorical transitions and periodic exact geometry, not every position/RNG change.
  const signature = JSON.stringify({ stage, hp: latest.caster.hp, stock: latest.stock, available: latest.available,
    status: latest.status, inputMask: latest.inputMask, inside: latest.caster.inside,
    range: latest.range.meetsMargin, castable: latest.casterPredicate, joint,
    buildings: latest.buildings.map(b => ({ id: b.id, hp: b.hp, progress: b.progress, admission: b.admission, slots: b.slots })) })
  if (force || signature !== previousSignature || world.turn % 64 === 0) {
    emit({ kind: 'sample', ...latest, jointModelObservation: joint, expectedScan: expectedScan() })
    rows++
  }
  previousSignature = signature
}
const dispatch = (label, point) => {
  emit({ kind: 'before-command', label, point, turn: world.turn, inputMask: world.inputMask })
  setSelection(world, [shaman.id])
  const accepted = command(world, point)
  emit({ kind: 'after-command', label, accepted, state: read() })
  assert.ok(accepted, `${label} was rejected; no alternate command`)
}
const arrival = before => {
  if (!move || arrived) return
  const p = shaman.native, id = orderId(p)
  assert.equal(p, move.person, 'Original movement owner changed')
  assert.equal(world.lastOrderTurn, move.turn, 'Staging order replaced')
  if (id) {
    assert.equal(id, move.id)
    const current = currentPersonOrder(world.buildingOrders, p)
    assert.ok(current?.model === 3 && !(current.flags & 1) && current.a === move.order.a && current.b === move.order.b)
  }
  if (before !== move.id || id) return
  const idle = rules.personModels[p.model].idleState
  const terminal = p.commands.every(id => !id) &&
    ((p.state === idle && p.previousState === 10) ||
      (p.state === 19 && p.previousState === idle && p.substate === 8 && !!(p.assignment & 1) &&
        !p.slowTurn && samePersonCell(p, { x: p.goalX, y: p.goalY }))) &&
    !(p.counter & 3) && !p.speed && !p.motionGroup && !p.vehicle && !(p.flags4 & 0x10000000) &&
    shaman.inside === null && !shaman.path.length && !world.pathfinding.people.has(shaman.id) &&
    !shaman.work && !shaman.lift && !shaman.casting && !shaman.fight &&
    personReachedOrder(p, move.order, () => { throw Error('Unexpected vehicle arrival') })
  emit({ kind: 'staging-order-ended', terminal, state: read() })
  assert.ok(terminal, 'Staging ended without the maintained native arrival transition')
  arrived = { turn: world.turn, x: shaman.x, z: shaman.z }
  stage = 'observe-occupancy'
}

try {
  world = createWorld(3)
  shaman = world.units.find(u => u.team === 'blue' && u.kind === 'shaman' && u.hp > 0)
  assert.ok(shaman, 'Authored Blue Shaman unavailable')
  retain(true)
  while (world.turn < cap) {
    assert.equal(world.status, 'playing')
    assert.ok(world.units.includes(shaman) && shaman.hp > 0, 'Original Shaman lost')
    if (stage === 'opening' && world.turn === 256) {
      const vault = world.shrines.find(h => h.kind === 'vault' && h.reward === 'temple')
      assert.ok(vault, 'Authored Temple Vault missing')
      dispatch('Vault', vault)
      stage = 'vault'
    }
    if (stage === 'vault' && world.unlockedTemple) {
      dispatch('fixed-staging', staging)
      const p = shaman.native, order = p && currentPersonOrder(world.buildingOrders, p)
      assert.ok(orderId(p) && order?.model === 3 && !(order.flags & 1), 'Expected ordinary command 3')
      move = { person: p, id: orderId(p), order: { ...order }, turn: world.lastOrderTurn }
      stage = 'staging'
    }
    const before = orderId(shaman.native)
    tick(world, 1 / 12)
    arrival(before)
    retain()
  }
  retain(true)
  emit({ kind: 'complete', turn: world.turn, rows, arrived, occupiedSamples, jointSamples,
    result: 'Trace completed; native acquisition, occupancy during pursuit and ordinary browser input remain unproved.' })
} catch (error) {
  emit({ kind: 'failed', turn: world?.turn ?? null, rows, stage, error: String(error?.stack ?? error), latest })
  process.exitCode = 1
}
