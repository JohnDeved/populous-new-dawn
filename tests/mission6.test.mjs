import assert from 'node:assert/strict'
import test from 'node:test'
import levelSix from '../app/level-six.ts'
import scriptSix from '../app/original-script-six.json' with { type: 'json' }
import { addUnit, browserPosition, createWorld, joinBattle, tick } from '../app/model.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { syncLivePersonCells } from '../app/live-people.ts'
import { stepLiveConversionVictim, stepLivePreaching } from '../app/live-movement.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { stepOutcome } from '../app/tribe-turns.ts'
import { buildingFootprintCells, buildingModel } from '../app/building-shapes.ts'
import { nativeCellIndex, nativePosition } from '../app/world-terrain-runtime.ts'
import { spiralCell } from '../app/native-math.ts'
import rules from '../app/original-rules.json' with { type: 'json' }
import { campaignInternal, withCampaignTribe } from '../app/campaign-runtime.ts'
import { stepComputerTasks } from '../app/computer-runtime.ts'

test('Mission 6 keeps both original opponents distinct through outcome and checkpoints', () => {
  assert.equal(
    levelSix.sourceSha256,
    '264d69d98965465325a4b0e6ec1b1f9145d2a407e68ca9472e6a76a60a1a8a62'
  )
  assert.equal(scriptSix.tribes[2].sha256, '7ee29a7c5e3f49bee4e2a40c1ef0bf5b1796d082dd3396e1a5a85900c917cb1a')
  assert.equal(scriptSix.tribes[3].sha256, '01dcc425abaf6bf9680e1d62cede2d5c3a0de9739631d69516d810bc424b8e60')

  const world = createWorld(6)
  assert.deepEqual(
    Object.fromEntries(
      ['blue', 'yellow', 'green', 'wild'].map(team => [
        team,
        world.units.filter(unit => unit.team === team).length,
      ])
    ),
    { blue: 7, yellow: 8, green: 7, wild: 172 }
  )
  assert.notEqual(world.campaignAIs[2], world.campaignAIs[3])
  assert.notEqual(world.spellScans[2], world.spellScans[3])
  assert.equal(world.campaignAIs[3].variables[32], 150000)

  const profile = createWorld(6)
  for (let turn = 0; turn < 121; turn++) tick(profile, 1 / 12)
  assert.equal(profile.campaignAIs[3].attributes[3], 0)
  tick(profile, 1 / 12)
  assert.deepEqual(
    profile.castingTribes[3].spells.slice(2, 8).map(spell => spell.interval),
    [8, 64, 72, 32, 40, 70]
  )
  assert.equal(profile.campaignAIs[3].attributes[3], 0)

  tick(world, 1 / 12)
  const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  assert.deepEqual(shaman && { x: shaman.x, z: shaman.z, inside: shaman.inside }, {
    x: 51,
    z: -61.546875,
    inside: null,
  })

  world.units = world.units.filter(unit => unit.team !== 'yellow')
  world.turn = 32
  stepOutcome(world)
  assert.equal(world.manaTribes[2].defeatTimer, 1)
  assert.equal(world.land.landFlags & 0x2000000, 0)

  world.units = world.units.filter(unit => unit.team !== 'green')
  world.turn = 48
  stepOutcome(world)
  assert.equal(world.manaTribes[3].defeatTimer, 1)
  assert.equal(world.land.landFlags & 0x2000000, 0x2000000)
  assert.equal(world.outcome.completedLevel, 5)

  const restored = migrateCheckpoint(structuredClone(world))
  assert.deepEqual(restored.campaignAIs[3].variables, world.campaignAIs[3].variables)
  assert.notEqual(restored.campaignAIs[2], restored.campaignAIs[3])
  assert.notEqual(restored.spellScans[2], restored.spellScans[3])
})

test('Mission 6 credits each opponent attack task independently', () => {
  const teams = ['yellow', 'green'],
    world = createWorld(6),
    positions = teams.map(team =>
      world.units.find(unit => unit.team === team && unit.kind === 'shaman')
    ),
    home = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  world.units = []
  addUnit(world, 'blue', 'shaman', home)
  const attackers = teams.map((team, index) => addUnit(world, team, 'warrior', positions[index])),
    victims = attackers.map(attacker => addUnit(world, 'blue', 'brave', attacker)),
    tasks = [world.campaignAIs[2].tasks[0], world.campaignAIs[3].tasks[0]]
  world.manaTribes[2].active = world.manaTribes[3].active = false
  for (let i = 0; i < 2; i++) {
    Object.assign(tasks[i], { flags: 1, type: 20, phase: 16, members: [attackers[i].id], damage: 0 })
    victims[i].hp = 1
    joinBattle(world, attackers[i], victims[i])
  }
  for (let turn = 0; turn < 240 && victims.some(victim => victim.hp > 0); turn++) tick(world, 1 / 12)
  assert.ok(victims.every(victim => victim.hp === 0))
  assert.deepEqual(tasks.map(task => task.damage), [1, 1])
})

test('Mission 6 low-population survivors counterattack the player Shaman', () => {
  for (const { tribe, team, triggerTurn } of [
    { tribe: 2, team: 'yellow', triggerTurn: 8 },
    { tribe: 3, team: 'green', triggerTurn: 7 },
  ]) {
    const world = createWorld(6),
      survivor = world.units.find(unit => unit.team === team && unit.kind === 'brave'),
      shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
      start = { x: survivor.x, z: survivor.z }
    Object.assign(shaman, { x: survivor.x + 12, z: survivor.z })
    world.units = world.units.filter(unit => unit.team !== team || unit === survivor)
    syncLivePersonCells(world)
    world.killCredits[0][tribe] = 6
    world.turn = triggerTurn - 1

    tick(world, 1 / 12)
    assert.equal(world.manaTribes[tribe].flags2 & 0x40, 0)
    tick(world, 1 / 12)
    assert.equal(world.manaTribes[tribe].flags2 & 0x40, 0x40)

    const order = currentPersonOrder(world.buildingOrders, survivor.native)
    assert.deepEqual(order && { model: order.model, target: order.a }, { model: 28, target: shaman.id })
    for (let turn = 0; turn < 64 && !survivor.fight; turn++) tick(world, 1 / 12)
    assert.ok(Math.hypot(survivor.x - start.x, survivor.z - start.z) > 0)
    assert.ok(survivor.fight)
  }
})

test('Mission 6 Chumara trains Preachers and launches its first mixed raid', () => {
  let world = createWorld(6)
  for (
    let turn = 0;
    turn < 3000 &&
    !(
      world.campaignAIs[2].attributes[2] === 1 &&
      world.buildings.some(building => building.team === 'yellow' && buildingModel(building) === 5)
    );
    turn++
  )
    tick(world, 1 / 12)
  assert.equal(world.campaignAIs[2].attributes[2], 1)
  assert.equal(
    world.buildings.filter(building => building.team === 'yellow' && buildingModel(building) === 5)
      .length,
    1
  )

  world = migrateCheckpoint(structuredClone(world))
  for (
    let turn = 0;
    turn < 6000 &&
    !(
      world.buildings.some(
        building =>
          building.team === 'yellow' && buildingModel(building) === 5 && building.progress === 1
      ) && world.units.some(unit => unit.team === 'yellow' && unit.kind === 'preacher')
    );
    turn++
  )
    tick(world, 1 / 12)
  assert.equal(
    world.buildings.filter(
      building =>
        building.team === 'yellow' && buildingModel(building) === 5 && building.progress === 1
    ).length,
    1
  )
  assert.ok(world.units.some(unit => unit.team === 'yellow' && unit.kind === 'preacher'))

  const restored = migrateCheckpoint(structuredClone(world))
  assert.ok(
    restored.buildings.some(
      building =>
        building.team === 'yellow' && buildingModel(building) === 5 && building.progress === 1
    )
  )
  assert.ok(restored.units.some(unit => unit.team === 'yellow' && unit.kind === 'preacher'))

  for (
    let turn = 0;
    turn < 10000 &&
    !restored.campaignAIs[2].tasks.some(task => task.flags & 1 && task.type === 20);
    turn++
  )
    tick(restored, 1 / 12)
  const attack = restored.campaignAIs[2].tasks.find(task => task.flags & 1 && task.type === 20)
  assert.deepEqual(restored.campaignAIs[2].attributes.slice(6, 17), [
    12, 20, 0, 3, 25, 0, 80, 30, 2, 2, 0,
  ])
  assert.ok(withCampaignTribe(restored, 2, () => campaignInternal(restored, 1147)) > 4)
  assert.ok(withCampaignTribe(restored, 2, () => campaignInternal(restored, 1148)) > 2)
  assert.deepEqual(
    attack && {
      requested: attack.requested,
      damage: attack.extra,
      marker: attack.mode,
      quotas: attack.quotas,
      scheduled: (restored.turn - 1 + 2 + 179) & 511,
    },
    { requested: 4, damage: 20, marker: 0, quotas: [0, 80, 30, 0, 0, 0], scheduled: 0 }
  )
  assert.equal(restored.campaignAIs[2].variables[1], 1)

  const raiding = migrateCheckpoint(structuredClone(restored)),
    restoredAttack = raiding.campaignAIs[2].tasks.find(task => task.flags & 1 && task.type === 20)
  assert.ok(restoredAttack)
  assert.equal(
    raiding.campaignAIs[2].tasks.filter(task => task.flags & 1 && task.type === 20).length,
    1
  )
  for (let turn = 0; turn < 64 && restoredAttack.members.length < 4; turn++)
    tick(raiding, 1 / 12)
  assert.deepEqual(
    restoredAttack.members
      .map(id => raiding.units.find(unit => unit.id === id)?.kind)
      .sort(),
    ['preacher', 'warrior', 'warrior', 'warrior']
  )
  for (let turn = 0; turn < 3000 && restoredAttack.phase !== 16; turn++)
    tick(raiding, 1 / 12)
  assert.equal(restoredAttack.phase, 16)
  const preacherId = restoredAttack.members.find(
      id => raiding.units.find(unit => unit.id === id)?.kind === 'preacher'
    ),
    preacher = raiding.units.find(unit => unit.id === preacherId),
    preacherPerson = preacher && (preacher.native ?? preacher.fight?.motion)
  assert.equal(
    preacherPerson && currentPersonOrder(raiding.buildingOrders, preacherPerson)?.model,
    17
  )
  assert.ok(
    restoredAttack.members.some(id => {
      const unit = raiding.units.find(unit => unit.id === id),
        person = unit && (unit.native ?? unit.fight?.motion),
        order = person && currentPersonOrder(raiding.buildingOrders, person)
      return order?.model === 19 && order.a === restoredAttack.target && order.b === 0x0808
    })
  )
  const converting = migrateCheckpoint(structuredClone(raiding)),
    convertingPreacher = converting.units.find(unit => unit.id === preacherId)
  converting.units = converting.units.filter(unit => unit.id === preacherId)
  syncLivePersonCells(converting)
  const knownIds = new Set(converting.units.map(unit => unit.id)),
    conversionPoint = browserPosition(convertingPreacher.native ?? convertingPreacher.fight?.motion),
    victim = addUnit(converting, 'blue', 'brave', {
      x: conversionPoint.x + 1,
      z: conversionPoint.z,
    })
  for (let turn = 0; turn < 700 && converting.units.some(unit => unit.id === victim.id); turn++) {
    stepLivePreaching(converting, convertingPreacher)
    const liveVictim = converting.units.find(unit => unit.id === victim.id)
    if (liveVictim?.native?.state === 23) stepLiveConversionVictim(converting, liveVictim)
  }
  assert.ok(
    converting.units.some(
      unit =>
        !knownIds.has(unit.id) &&
        unit.team === 'yellow' &&
        unit.kind === 'brave' &&
        (unit.native?.flags4 ?? 0) & 0x40000
    )
  )
  for (let turn = 0; turn < 513; turn++) tick(raiding, 1 / 12)
  assert.equal(restoredAttack.flags & 1, 1)
  assert.equal(
    raiding.campaignAIs[2].tasks.filter(task => task.flags & 1 && task.type === 20).length,
    1
  )
})

test('Mission 6 opponents establish their initial towers and first expansions', () => {
  const failed = createWorld(6)
  for (
    let turn = 0;
    turn < 100 && failed.campaignAIs[3].tasks.every(task => task.phase !== 4);
    turn++
  )
    tick(failed, 1 / 12)
  failed.units = failed.units.filter(unit => unit.team !== 'green' || unit.kind !== 'brave')
  for (let turn = 0; turn < 4; turn++) tick(failed, 1 / 12)
  assert.equal(failed.campaignAIs[3].tasks.some(task => task.flags & 1 && task.type === 0), false)
  assert.equal(
    failed.buildings.some(building => building.team === 'green' && buildingModel(building) === 4),
    false
  )

  let world = createWorld(6)
  world.campaignAIs[2].variables[1] = 1 // Keep this established scenario focused on Matak's raid.
  for (let turn = 0; turn < 60; turn++) tick(world, 1 / 12)
  assert.equal(world.campaignAIs[2].tasks.some(task => task.flags & 1 && task.type === 0), false)
  assert.equal(world.campaignAIs[3].tasks.some(task => task.flags & 1 && task.type === 0), false)

  tick(world, 1 / 12)
  const matak = world.campaignAIs[3].tasks.find(task => task.flags & 1 && task.type === 0)
  assert.deepEqual(
    matak && { model: matak.requested, origin: matak.origin, phase: matak.phase },
    { model: 4, origin: 0x72d8, phase: 0 }
  )
  tick(world, 1 / 12)
  const chumara = world.campaignAIs[2].tasks.find(task => task.flags & 1 && task.type === 0)
  assert.deepEqual(
    chumara && { model: chumara.requested, origin: chumara.origin, phase: chumara.phase },
    { model: 4, origin: 0xd094, phase: 0 }
  )

  for (
    let turn = 0;
    turn < 32 && [2, 3].some(tribe => !world.campaignAIs[tribe].tasks.some(task => task.phase === 8));
    turn++
  )
    tick(world, 1 / 12)
  const tasks = [2, 3].map(tribe => world.campaignAIs[tribe].tasks.find(task => task.phase === 8))
  assert.ok(tasks.every(task => task?.members.length === 2))
  assert.notEqual(tasks[0].entity, tasks[1].entity)
  assert.ok(
    tasks.every(task => {
      const building = world.buildings.find(building => building.id === task.entity)
      return building && buildingModel(building) === 4 && building.builders.filter(Boolean).length === 2
    })
  )

  world = migrateCheckpoint(structuredClone(world))
  assert.notEqual(world.campaignAIs[2].tasks, world.campaignAIs[3].tasks)
  for (
    let turn = 0;
    turn < 6000 &&
    ['yellow', 'green'].some(team =>
      world.buildings.every(
        building => building.team !== team || buildingModel(building) !== 4 || building.progress < 1
      )
    );
    turn++
  )
    tick(world, 1 / 12)
  assert.ok(
    ['yellow', 'green'].every(team =>
      world.buildings.some(
        building => building.team === team && buildingModel(building) === 4 && building.progress === 1
      )
    )
  )

  const pendingCamp = migrateCheckpoint(structuredClone(world)),
    pendingAI = pendingCamp.campaignAIs[2]
  Object.assign(
    pendingAI.tasks.find(task => !(task.flags & 1)),
    { flags: 1, type: 0, requested: 7, phase: 0 }
  )
  pendingCamp.turn = 125
  withCampaignTribe(pendingCamp, 2, () => stepComputerTasks(pendingCamp, 2))
  assert.equal(
    pendingAI.tasks.filter(
      task => task.flags & 1 && task.type === 0 && task.requested === 7 && task.phase < 3
    ).length,
    1
  )

  for (
    let turn = 0;
    turn < 200 &&
    ![
      world.campaignAIs[2].tasks.some(task => task.phase === 8 && task.requested === 7),
      world.campaignAIs[3].tasks.some(task => task.phase === 8 && task.requested === 1),
    ].every(Boolean);
    turn++
  )
    tick(world, 1 / 12)
  const expansionTasks = [
    world.campaignAIs[2].tasks.find(task => task.phase === 8 && task.requested === 7),
    world.campaignAIs[3].tasks.find(task => task.phase === 8 && task.requested === 1),
  ]
  assert.deepEqual(
    expansionTasks.map(task =>
      task && { model: task.requested, workers: task.members.length, origin: task.origin }
    ),
    [
      { model: 7, workers: 2, origin: tasks[0].target },
      { model: 1, workers: 2, origin: tasks[1].target },
    ]
  )
  const blockedCell = spiralCell(expansionTasks[0].origin, 0, expansionTasks[0].mode),
    blockedFootprint = new Set(
      buildingFootprintCells({
        object: rules.buildingObjects[7],
        angle: expansionTasks[0].fallback * 512,
        anchorX: (blockedCell & 254) << 8,
        anchorY: blockedCell & 0xfe00,
      })
    )
  assert.ok(
    world.units.some(unit => {
      const p = nativePosition(world, unit)
      return (
        unit.team === 'wild' &&
        unit.hp > 0 &&
        unit.inside === null &&
        !unit.lift &&
        blockedFootprint.has(nativeCellIndex(((p.x >>> 8) & 254) | (p.y & 0xfe00)))
      )
    })
  )
  assert.notEqual(expansionTasks[0].target, blockedCell)

  const recovering = migrateCheckpoint(structuredClone(world)),
    recoveringAI = recovering.campaignAIs[3],
    recoveringTask = recoveringAI.tasks.find(task => task.entity === expansionTasks[1].entity),
    recoveringBuilding = recovering.buildings.find(building => building.id === recoveringTask.entity),
    recoveringIndex = recoveringAI.tasks.indexOf(recoveringTask)
  recoveringAI.tasks.forEach(task => {
    if (task !== recoveringTask) task.flags = 0
  })
  recoveringBuilding.builders.fill(0)
  recoveringTask.retries = 0
  recovering.turn = 0
  for (let visit = 0; visit < 16; visit++) {
    recoveringAI.cursor = recoveringIndex
    withCampaignTribe(recovering, 3, () => stepComputerTasks(recovering, 3))
  }
  assert.deepEqual(
    { phase: recoveringTask.phase, retries: recoveringTask.retries },
    { phase: 8, retries: 16 }
  )
  recoveringAI.cursor = recoveringIndex
  withCampaignTribe(recovering, 3, () => stepComputerTasks(recovering, 3))
  assert.deepEqual(
    { phase: recoveringTask.phase, retries: recoveringTask.retries },
    { phase: 4, retries: 16 }
  )
  for (let phase = 0; phase < 4; phase++) {
    recoveringAI.cursor = recoveringIndex
    withCampaignTribe(recovering, 3, () => stepComputerTasks(recovering, 3))
  }
  assert.equal(recoveringTask.phase, 8)
  assert.ok(recoveringBuilding.builders.some(Boolean))
  for (let turn = 0; turn < 6000 && recoveringBuilding.progress < 1; turn++)
    tick(recovering, 1 / 12)
  assert.equal(recoveringBuilding.progress, 1)

  const redirected = migrateCheckpoint(structuredClone(world)),
    redirectedAI = redirected.campaignAIs[2],
    redirectedCamp = redirected.buildings.find(building => building.id === expansionTasks[0].entity),
    redirectedWorker = redirected.units.find(unit => unit.id === expansionTasks[0].members[0]),
    warriorsBefore = redirected.units.filter(
      unit => unit.team === 'yellow' && unit.kind === 'warrior'
    ).length
  redirectedCamp.progress = 1
  redirectedCamp.preparation = undefined
  redirected.units = redirected.units.filter(
    unit => unit.team !== 'yellow' || unit.kind !== 'brave' || unit === redirectedWorker
  )
  redirectedAI.tasks.forEach(task => (task.flags = 0))
  Object.assign(redirectedAI.tasks[0], {
    flags: 1,
    type: 6,
    phase: 4,
    target: redirectedCamp.id,
    requested: 1,
    remaining: 1,
  })
  redirectedAI.trainingSelections[0] = []
  redirectedAI.flags |= 2
  redirectedAI.selectionOwner = redirectedAI.cursor = 0
  redirected.turn = 0
  assert.equal(
    currentPersonOrder(
      redirected.buildingOrders,
      redirectedWorker.native ?? redirectedWorker.builder.person
    )?.model,
    6
  )
  withCampaignTribe(redirected, 2, () => stepComputerTasks(redirected, 2))
  assert.equal(redirectedWorker.work, null)
  assert.equal(redirectedWorker.builder, undefined)
  assert.deepEqual(redirectedAI.trainingSelections[0], [redirectedWorker.id])
  withCampaignTribe(redirected, 2, () => stepComputerTasks(redirected, 2))
  withCampaignTribe(redirected, 2, () => stepComputerTasks(redirected, 2))
  for (
    let turn = 0;
    turn < 1000 &&
    redirected.units.filter(unit => unit.team === 'yellow' && unit.kind === 'warrior').length ===
      warriorsBefore;
    turn++
  )
    tick(redirected, 1 / 12)
  assert.ok(redirectedCamp.builders.every(id => id !== redirectedWorker.id))
  assert.ok(
    redirected.units.filter(unit => unit.team === 'yellow' && unit.kind === 'warrior').length >
      warriorsBefore
  )

})
