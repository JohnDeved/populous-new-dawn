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
import { createComputerQueue, requestAttack, stepAttackTask } from '../app/computer.ts'
import { createLivePerson } from '../app/live-people.ts'
import { objectsInCell } from '../app/object-cells.ts'
import { combatPerson } from '../app/live-combat.ts'

test('Mission 6 keeps both original opponents distinct through outcome and checkpoints', () => {
  assert.equal(
    levelSix.sourceSha256,
    '264d69d98965465325a4b0e6ec1b1f9145d2a407e68ca9472e6a76a60a1a8a62'
  )
  assert.equal(
    scriptSix.tribes[2].sha256,
    '7ee29a7c5e3f49bee4e2a40c1ef0bf5b1796d082dd3396e1a5a85900c917cb1a'
  )
  assert.equal(
    scriptSix.tribes[3].sha256,
    '01dcc425abaf6bf9680e1d62cede2d5c3a0de9739631d69516d810bc424b8e60'
  )

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
    Object.assign(tasks[i], {
      flags: 1,
      type: 20,
      phase: 16,
      members: [attackers[i].id],
      damage: 0,
    })
    victims[i].hp = 1
    joinBattle(world, attackers[i], victims[i])
  }
  for (let turn = 0; turn < 240 && victims.some(victim => victim.hp > 0); turn++)
    tick(world, 1 / 12)
  assert.ok(victims.every(victim => victim.hp === 0))
  assert.deepEqual(
    tasks.map(task => task.damage),
    [1, 1]
  )
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
    assert.deepEqual(order && { model: order.model, target: order.a }, {
      model: 28,
      target: shaman.id,
    })
    for (let turn = 0; turn < 64 && !survivor.fight; turn++) tick(world, 1 / 12)
    assert.ok(Math.hypot(survivor.x - start.x, survivor.z - start.z) > 0)
    assert.ok(survivor.fight)
  }
})

test('Mission 6 Chumara converts Blue and retires its first mixed raid by return timeout', async () => {
  let world = createWorld(6)
  world.campaignAIs[3].variables[20] = 1 // Keep this established scenario focused on Chumara's raid.
  world.manaTribes[3].active = false
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
    turn < 10000 && !restored.campaignAIs[2].tasks.some(task => task.flags & 1 && task.type === 20);
    turn++
  )
    tick(restored, 1 / 12)
  const attack = restored.campaignAIs[2].tasks.find(task => task.flags & 1 && task.type === 20)
  assert.deepEqual(
    restored.campaignAIs[2].attributes.slice(6, 17),
    [12, 20, 0, 3, 25, 0, 80, 30, 2, 2, 0]
  )
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

  let raiding = migrateCheckpoint(structuredClone(restored)),
    restoredAttack = raiding.campaignAIs[2].tasks.find(task => task.flags & 1 && task.type === 20)
  assert.ok(restoredAttack)
  assert.equal(
    raiding.campaignAIs[2].tasks.filter(task => task.flags & 1 && task.type === 20).length,
    1
  )
  for (let turn = 0; turn < 64 && restoredAttack.members.length < 4; turn++) tick(raiding, 1 / 12)
  assert.deepEqual(
    restoredAttack.members.map(id => raiding.units.find(unit => unit.id === id)?.kind).sort(),
    ['preacher', 'warrior', 'warrior', 'warrior']
  )
  for (let turn = 0; turn < 3000 && restoredAttack.phase !== 16; turn++) tick(raiding, 1 / 12)
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
    conversionPoint = browserPosition(
      convertingPreacher.native ?? convertingPreacher.fight?.motion
    ),
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
  const originalMembers = [...restoredAttack.members],
    warriors = originalMembers.filter(id => id !== preacherId),
    raidSlot = raiding.campaignAIs[2].tasks.indexOf(restoredAttack)
  // The next-turn Hut scheduler changes the fresh campaign outcome: all four
  // remaining Blue Braves convert before its Shaman dies without respawn.
  // The source-bound pre-newborn casualty/reuse witness is retained separately.
  assert.equal(raiding.turn, 8092)
  assert.deepEqual(originalMembers, [367, 368, 449, 425])
  const personOf = u => u && (u.flight ?? u.fight?.motion ?? u.native ?? u.entry?.person ?? u.builder?.person)
  const conversions = new Map([
    [8097, [289, 549]], [8191, [290, 572]],
    [8193, [282, 575]], [8246, [291, 595]],
  ])
  let convertedCount = 0, firstAnchors = 0, emptyRetries = 0
  while (raiding.turn < 8371) {
    const beforeUnits = new Map(raiding.units.map(u => [u.id, u])),
      beforeBlue = raiding.units.filter(u => u.team === 'blue').map(u => u.id),
      priorRetries = restoredAttack.retries, priorTarget = restoredAttack.target,
      shamanBeforeHp = beforeUnits.get(95)?.hp,
      nextConversion = conversions.get(raiding.turn + 1),
      victim = nextConversion && beforeUnits.get(nextConversion[0]),
      victimBefore = victim && { hp: victim.hp, state: personOf(victim)?.state }
    tick(raiding, 1 / 12)
    assert.deepEqual(restoredAttack.members, originalMembers)
    const active = raiding.campaignAIs[2].tasks.filter(t => t.flags & 1 && t.type === 20)
    assert.deepEqual(active, [restoredAttack])
    assert.equal(restoredAttack.phase, raiding.turn < 8371 ? 16 : 6)
    if (raiding.turn === 8093) {
      const orders = warriors.map(id => {
        const u = raiding.units.find(u => u.id === id), p = personOf(u)
        assert.equal(raiding.objectCells.objects.get(id), p)
        return currentPersonOrder(raiding.buildingOrders, p)
      })
      assert.ok(orders.every(order => order === orders[0]))
      assert.deepEqual([orders[0].model, orders[0].a, orders[0].b, orders[0].references], [19, 13882, 0x0808, 3])
    }
    if (nextConversion) {
      const [oldId, newId] = nextConversion,
        replacement = raiding.units.find(u => u.id === newId), p = personOf(replacement)
      assert.deepEqual(victimBefore, { hp: 50, state: 23 })
      assert.equal(victim.hp, 0)
      assert.equal(raiding.units.includes(victim), false)
      assert.equal(raiding.objectCells.objects.has(oldId), false)
      assert.equal(beforeUnits.has(newId), false)
      assert.deepEqual([replacement.team, replacement.kind, replacement.hp], ['yellow', 'brave', 50])
      assert.equal(raiding.objectCells.objects.get(newId), p)
      assert.equal(p.life, 1000)
      assert.ok(p.flags4 & 0x40000)
      convertedCount++
    }
    const removedBlue = beforeBlue.filter(id => !raiding.units.some(u => u.id === id))
    assert.deepEqual(removedBlue, nextConversion ? [nextConversion[0]] : raiding.turn === 8269 ? [95] : [])
    if (raiding.turn === 8269) {
      const shaman = beforeUnits.get(95)
      assert.equal(shamanBeforeHp, 13.35)
      assert.equal(shaman.hp, 0)
      assert.equal(personOf(shaman).damageAttacker, 2)
      assert.equal(raiding.objectCells.objects.has(95), false)
      assert.equal(raiding.killCredits[2][0], 1)
    }
    if (raiding.turn >= 8269) {
      assert.equal(raiding.units.some(u => u.team === 'blue'), false)
      assert.equal(raiding.buildings.some(b => b.team === 'blue'), false)
      assert.deepEqual(raiding.respawns, [0, 0, 0, 0])
      assert.equal(raiding.effects.some(e => e.reincarnationWave?.tribe === 0), false)
    }
    if (restoredAttack.retries !== priorRetries) {
      assert.ok(raiding.turn >= 8269)
      assert.equal(restoredAttack.retries, priorRetries + 1)
      emptyRetries++
      if (emptyRetries === 1) {
        assert.equal(priorTarget, 14394)
        assert.equal(raiding.outcome.alliances[2], 0)
        const scan = new Set([priorTarget & 0xfefe, ...Array.from({length:223}, (_,i) => spiralCell(priorTarget,i,0) & 0xfefe)])
        // The recorded empty scene has only Green hostiles. Prove all seven
        // exact physical owners lie outside the native radius7 scan, including
        // their live cell links; Wild model1/tribe-1 actors cannot be targets.
        assert.ok(raiding.units.every(u => ['yellow','green','wild'].includes(u.team)))
        assert.ok(raiding.buildings.every(b => b.team === 'yellow'))
        const green = raiding.units.filter(u => u.team === 'green')
        assert.deepEqual(green.map(u=>u.id), [3,4,5,6,7,8,9])
        for (const u of green) {
          const p = personOf(u), cell=((p.x>>>8)&254)|(p.y&0xfe00)
          assert.ok(u.hp>0)
          assert.equal(raiding.objectCells.objects.get(u.id),p)
          assert.ok([...objectsInCell(raiding.objectCells,cell)].includes(p))
          assert.equal(p.tribe,3)
          assert.equal(scan.has(cell),false)
        }
        for (const u of raiding.units.filter(u=>u.team==='wild')) {
          const p=combatPerson(u)
          assert.deepEqual([p.model,p.tribe],[1,-1])
        }
      }
    }
    if (!firstAnchors && warriors.every(id => {
      const p = raiding.objectCells.objects.get(id)
      return p && p.anchorX === 15104 && p.anchorY === 14592
    })) {
      firstAnchors = raiding.turn
      for (const id of warriors) {
        const u=raiding.units.find(u=>u.id===id), p=personOf(u)
        assert.equal(raiding.objectCells.objects.get(id),p)
        assert.equal(p.state,17)
        assert.equal(currentPersonOrder(raiding.buildingOrders,p),undefined)
      }
      const preacher=raiding.units.find(u=>u.id===preacherId), p=personOf(preacher)
      assert.equal(raiding.objectCells.objects.get(preacherId),p)
      assert.equal(currentPersonOrder(raiding.buildingOrders,p).model,17)
      assert.deepEqual([restoredAttack.damage,restoredAttack.extra],[2,20])
    }
  }
  assert.equal(convertedCount, 4)
  assert.equal(firstAnchors, 8271)
  assert.equal(emptyRetries, 33)
  assert.deepEqual([restoredAttack.phase, restoredAttack.retries, restoredAttack.elapsed, restoredAttack.fallback], [6, 33, 0, 23])
  // This classic low-level scenario retains its native allocation/turn pins.
  // Clone continuation is research evidence, not a public old-save contract.
  // The default-scalable marker/Bridge test covers actual current-store Save/Load.
  const replay = migrateCheckpoint(structuredClone(raiding))
  raiding = migrateCheckpoint(structuredClone(raiding))
  restoredAttack = raiding.campaignAIs[2].tasks[raidSlot]
  assert.deepEqual(raiding, replay)
  const owners = originalMembers.map(id => raiding.objectCells.objects.get(id)),
    returnOrder = currentPersonOrder(raiding.buildingOrders, owners[0]),
    returnId = raiding.buildingOrders.records.indexOf(returnOrder)
  assert.ok(owners.every(p => currentPersonOrder(raiding.buildingOrders, p) === returnOrder))
  assert.deepEqual([returnOrder.model, returnOrder.a, returnOrder.b, returnOrder.references], [3, 38016, 53376, 4])
  let previousReferences = 4, releaseTransitions = 0, retired = false
  // Source phase6 timeout is strictly elapsed>1800. This observed scene reaches
  // home and releases its orders, then retires by timeout rather than settlement.
  for (; raiding.turn < 10234;) {
    const beforePhase = restoredAttack.phase, beforeElapsed = restoredAttack.elapsed
    tick(raiding, 1 / 12)
    tick(replay, 1 / 12)
    assert.deepEqual(raiding, replay)
    assert.equal(raiding.units.some(u => u.team === 'blue'), false)
    assert.deepEqual(raiding.respawns, [0, 0, 0, 0])
    assert.equal(raiding.effects.some(e => e.reincarnationWave?.tribe === 0), false)
    assert.equal(raiding.campaignAIs[2].tasks[raidSlot], restoredAttack)
    assert.equal(raiding.buildingOrders.records[returnId], returnOrder)
    assert.deepEqual([returnOrder.model, returnOrder.a, returnOrder.b], [3, 38016, 53376])
    const active = raiding.campaignAIs[2].tasks.filter(t => t.flags & 1 && t.type === 20)
    assert.deepEqual(active, raiding.turn < 10234 ? [restoredAttack] : [])
    if (returnOrder.references !== previousReferences) {
      assert.deepEqual([raiding.turn, returnOrder.references], [[9071, 3], [9112, 1], [9116, 0]][releaseTransitions++])
      previousReferences = returnOrder.references
    }
    if (raiding.turn === 10233) {
      assert.deepEqual([beforePhase, beforeElapsed, restoredAttack.phase, restoredAttack.elapsed], [6, 1800, 23, 1801])
    } else if (raiding.turn < 10233) assert.equal(restoredAttack.phase, 6)
    if (raiding.turn === 10234) {
      assert.equal(beforePhase, 23)
      assert.equal(restoredAttack.flags & 3, 0)
      assert.deepEqual(restoredAttack.members, [])
      retired = true
    } else assert.deepEqual(restoredAttack.members, originalMembers)
    for (const [index, id] of originalMembers.entries()) {
      const u = raiding.units.find(u => u.id === id), p = personOf(u)
      assert.ok(u && u.hp > 0)
      assert.equal(p, owners[index])
      assert.equal(raiding.objectCells.objects.get(id), p)
      assert.equal(p.computerAssignment, 0)
    }
  }
  assert.ok(retired)
  assert.equal(releaseTransitions, 3)
  assert.equal(returnOrder.references, 0)
  assert.equal(restoredAttack.elapsed, 1801)
  assert.equal(restoredAttack.phase, 23)
  assert.deepEqual(originalMembers.map(id => raiding.units.find(u => u.id === id).hp), [90.15, 90.2, 90.2, 55])
  for (const p of owners) {
    assert.deepEqual(p.commands, [0, 0, 0, 0, 0, 0, 0, 0])
    assert.equal(p.commandCursor, 0)
    assert.equal(p.immediateCommand, 0)
    assert.equal(currentPersonOrder(raiding.buildingOrders, p), undefined)
    assert.deepEqual([p.anchorX, p.anchorY], [38144, 53504])
  }
})

test('Mission 6 opponents expand and Matak launches its first Warrior raid', () => {
  const failed = createWorld(6)
  for (
    let turn = 0;
    turn < 100 && failed.campaignAIs[3].tasks.every(task => task.phase !== 4);
    turn++
  )
    tick(failed, 1 / 12)
  failed.units = failed.units.filter(unit => unit.team !== 'green' || unit.kind !== 'brave')
  for (let turn = 0; turn < 4; turn++) tick(failed, 1 / 12)
  assert.equal(
    failed.campaignAIs[3].tasks.some(task => task.flags & 1 && task.type === 0),
    false
  )
  assert.equal(
    failed.buildings.some(building => building.team === 'green' && buildingModel(building) === 4),
    false
  )

  let world = createWorld(6)
  for (let turn = 0; turn < 60; turn++) tick(world, 1 / 12)
  assert.equal(
    world.campaignAIs[2].tasks.some(task => task.flags & 1 && task.type === 0),
    false
  )
  assert.equal(
    world.campaignAIs[3].tasks.some(task => task.flags & 1 && task.type === 0),
    false
  )

  tick(world, 1 / 12)
  const matak = world.campaignAIs[3].tasks.find(task => task.flags & 1 && task.type === 0)
  assert.deepEqual(matak && { model: matak.requested, origin: matak.origin, phase: matak.phase }, {
    model: 4,
    origin: 0x72d8,
    phase: 0,
  })
  tick(world, 1 / 12)
  const chumara = world.campaignAIs[2].tasks.find(task => task.flags & 1 && task.type === 0)
  assert.deepEqual(
    chumara && { model: chumara.requested, origin: chumara.origin, phase: chumara.phase },
    { model: 4, origin: 0xd094, phase: 0 }
  )

  for (
    let turn = 0;
    turn < 32 &&
    [2, 3].some(tribe => !world.campaignAIs[tribe].tasks.some(task => task.phase === 8));
    turn++
  )
    tick(world, 1 / 12)
  const tasks = [2, 3].map(tribe => world.campaignAIs[tribe].tasks.find(task => task.phase === 8))
  assert.ok(tasks.every(task => task?.members.length === 2))
  assert.notEqual(tasks[0].entity, tasks[1].entity)
  assert.ok(
    tasks.every(task => {
      const building = world.buildings.find(building => building.id === task.entity)
      return (
        building && buildingModel(building) === 4 && building.builders.filter(Boolean).length === 2
      )
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
        building =>
          building.team === team && buildingModel(building) === 4 && building.progress === 1
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
    expansionTasks.map(
      task => task && { model: task.requested, workers: task.members.length, origin: task.origin }
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
    recoveringBuilding = recovering.buildings.find(
      building => building.id === recoveringTask.entity
    ),
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
    redirectedCamp = redirected.buildings.find(
      building => building.id === expansionTasks[0].entity
    ),
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

  for (
    let turn = 0;
    turn < 15000 && !world.campaignAIs[3].tasks.some(task => task.flags & 1 && task.type === 20);
    turn++
  )
    tick(world, 1 / 12)
  const attack = world.campaignAIs[3].tasks.find(task => task.flags & 1 && task.type === 20)
  assert.deepEqual(world.campaignAIs[3].attributes.slice(1, 11), [0, 1, 1, 0, 0, 10, 20, 0, 4, 20])
  assert.ok(
    world.buildings.some(
      building =>
        building.team === 'green' && buildingModel(building) === 7 && building.progress === 1
    )
  )
  assert.ok(world.units.filter(unit => unit.team === 'green' && unit.kind === 'warrior').length > 5)
  assert.deepEqual(
    attack && {
      requested: attack.requested,
      damage: attack.extra,
      marker: attack.mode,
      scheduled: (world.turn - 1 + 3 + 399) & 1023,
    },
    { requested: 5, damage: 128, marker: 0, scheduled: 0 }
  )
  assert.equal(world.campaignAIs[3].variables[20], 1)

  const raiding = migrateCheckpoint(structuredClone(world)),
    restoredAttack = raiding.campaignAIs[3].tasks.find(task => task.flags & 1 && task.type === 20)
  assert.ok(restoredAttack)
  for (let turn = 0; turn < 64 && restoredAttack.members.length < 5; turn++) tick(raiding, 1 / 12)
  assert.equal(restoredAttack.members.length, 5)
  assert.deepEqual(
    restoredAttack.members.map(id => raiding.units.find(unit => unit.id === id)?.kind).sort(),
    ['shaman', 'warrior', 'warrior', 'warrior', 'warrior']
  )
  const matakShaman = raiding.units.find(unit => unit.team === 'green' && unit.kind === 'shaman')
  assert.ok(matakShaman)
  assert.ok(restoredAttack.members.includes(matakShaman.id))
  assert.equal(matakShaman.native?.state, 14)
})

test('Mission 6 ATTACK snapshots the native three-spell payload and keeps old tasks compatible', () => {
  const ai = createComputerQueue(),
    payload = [12, 3, 2]
  requestAttack(ai, 0x80ce, 0, 5, 128, [0, 10, 20, 0, 0, 0], 20, true, 1, 77, payload)
  const task = ai.tasks[0]
  assert.deepEqual(task.spells, [12, 3, 2])
  payload[0] = 8
  assert.deepEqual(task.spells, [12, 3, 2], 'task must snapshot ATTACK spell operands')

  task.phase = 6
  task.fallback = 18
  const seen = [],
    events = [],
    input = {
      staging: 0,
      select: () => [],
      settled: () => {
        events.push('settled')
        return true
      },
      memberWithin: () => null,
      ready: () => true,
      activeMembers: () => 1,
      targetsRemain: () => true,
      random: () => 0,
      taskSpell: (models, target) => {
        events.push('cast')
        seen.push({ models: [...models], target, elapsed: task.elapsed })
        return null
      },
    }
  assert.deepEqual(stepAttackTask(ai, 0, input), [])
  assert.equal(task.phase, 18, 'a refused spell still reaches settled-member fallback')
  assert.deepEqual(task.spells, [12, 3, 2], 'failed allocation must not consume a task spell')
  assert.deepEqual(seen, [{ models: [12, 3, 2], target: 0x80ce, elapsed: 1 }])
  assert.deepEqual(events, ['cast', 'settled'])

  task.phase = 6
  events.length = 0
  input.taskSpell = models => {
    events.push('cast')
    return models[0]
  }
  assert.deepEqual(stepAttackTask(ai, 0, input), [])
  assert.equal(task.phase, 18)
  assert.equal(task.elapsed, 2)
  assert.deepEqual(events, ['cast', 'settled'])
  assert.deepEqual(task.spells, [0, 3, 2], 'successful allocation consumes only the selected model')

  task.phase = 6
  task.elapsed = 1799
  stepAttackTask(ai, 0, { ...input, taskSpell: () => null, settled: () => false })
  assert.equal(task.elapsed, 1800)
  assert.equal(task.phase, 6, 'timeout is strictly greater than 1800')
  assert.deepEqual(
    stepAttackTask(ai, 0, { ...input, taskSpell: () => null, settled: () => false }),
    []
  )
  assert.equal(task.elapsed, 1801)
  assert.equal(task.phase, 18, 'remaining payload cannot suppress the native timeout')
  assert.deepEqual(task.spells, [0, 3, 2])

  task.phase = 6
  task.members.push(123)
  assert.deepEqual(
    stepAttackTask(ai, 0, { ...input, taskSpell: () => null, settled: () => null }),
    []
  )
  assert.equal(task.flags & 3, 0)
  assert.deepEqual(task.members, [], 'missing members still clean up with a retained payload')

  task.flags |= 1
  delete task.spells
  task.phase = 6
  assert.deepEqual(stepAttackTask(ai, 0, { ...input, taskSpell: undefined }), [])
  assert.equal(
    task.phase,
    18,
    'legacy checkpoints without the task-spell field keep prior phase-6 behavior'
  )
})

test('type-20 sixth ATTACK quota selects exactly the tribe Shaman outside the generic selector', () => {
  const ai = createComputerQueue(),
    generic = [],
    shamanSelections = []
  requestAttack(ai, 0x80ce, 0, 5, 128, [0, 88, 12, 0, 0, 1], 20, true, 1, 77, [12, 3, 2])
  const input = {
    staging: 0x72d8,
    select: (model, count) => {
      generic.push({ model, count })
      return model === 3 ? [101, 102, 103, 104].slice(0, count) : []
    },
    selectShaman: () => {
      shamanSelections.push(9)
      return 9
    },
    settled: () => true,
    memberWithin: () => null,
    ready: () => true,
    activeMembers: () => 5,
    targetsRemain: () => true,
    random: () => 0,
  }
  stepAttackTask(ai, 0, input)
  assert.equal(ai.tasks[0].phase, 3)
  stepAttackTask(ai, 0, input)
  assert.deepEqual(ai.tasks[0].members, [101, 102, 103, 104])
  stepAttackTask(ai, 0, input)
  assert.deepEqual(ai.tasks[0].members, [101, 102, 103, 104, 9])
  assert.equal(ai.tasks[0].selected, 5)
  assert.deepEqual(shamanSelections, [9])
  assert.equal(
    generic.some(call => call.model === 7),
    false
  )
  stepAttackTask(ai, 0, input)
  assert.equal(ai.tasks[0].phase, 4)
  assert.deepEqual(generic.at(-1), { model: -1, count: 0 })
})

test('Mission 6 first Matak ATTACK retains source-derived Land Bridge, Lightning, Blast order', () => {
  const world = createWorld(6)
  for (
    let turn = 0;
    turn < 15000 && !world.campaignAIs[3].tasks.some(task => task.flags & 1 && task.type === 20);
    turn++
  )
    tick(world, 1 / 12)
  const attack = world.campaignAIs[3].tasks.find(task => task.flags & 1 && task.type === 20)
  assert.deepEqual(
    attack && { requested: attack.requested, damage: attack.extra, spells: attack.spells },
    { requested: 5, damage: 128, spells: [12, 3, 2] }
  )
  const restored = migrateCheckpoint(structuredClone(world)),
    restoredAttack = restored.campaignAIs[3].tasks.find(task => task.flags & 1 && task.type === 20)
  assert.deepEqual(restoredAttack?.spells, [12, 3, 2])
})

function missionSixTaskSpellFixture({
  mana = 70000,
  stock = 0,
  state = 17,
  targetOffset = 0,
  usageBlocked = false,
} = {}) {
  const world = createWorld(6),
    ai = world.campaignAIs[3],
    shaman = world.units.find(unit => unit.team === 'green' && unit.kind === 'shaman'),
    position = nativePosition(world, shaman),
    source = ((position.x >>> 8) & 254) | (position.y & 0xfe00),
    target = (((source & 255) + targetOffset) & 254) | (source & 0xfe00)
  ai.tasks.forEach(task => (task.flags = 0))
  Object.assign(ai.tasks[0], {
    flags: 1,
    type: 20,
    phase: 6,
    target,
    fallback: 18,
    spells: [12, 3, 2],
    members: [],
  })
  ai.cursor = 0
  world.turn = 0
  world.manaTribes[3].mana = mana
  world.manaWorld.spells[3].stocks[12] = stock
  shaman.native = createLivePerson(world, shaman)
  shaman.native.state = state
  if (usageBlocked) {
    ai.flags |= 0x40000
    for (const model of [12, 3, 2])
      world.castingTribes[3].spells[model].used = rules.spellCharging[model].normalLimit
  }
  return { world, ai, shaman, source, target }
}

test('Mission 6 phase-6 task Shaman uses native payment, eligibility, usage and range gates', () => {
  for (const payment of [
    { mana: 70000, stock: 0, expectedAvailable: -40000 },
    { mana: 0, stock: 1, expectedAvailable: 30000 },
  ]) {
    const { world, ai, source } = missionSixTaskSpellFixture(payment)
    withCampaignTribe(world, 3, () => stepComputerTasks(world, 3))
    const bridge = world.projectiles.find(projectile => projectile.spell === 'bridge')
    assert.ok(bridge)
    assert.equal(((bridge.destination.x >>> 8) & 254) | (bridge.destination.y & 0xfe00), source)
    assert.deepEqual(ai.tasks[0].spells, [0, 3, 2])
    assert.equal(world.manaTribes[3].mana, payment.mana)
    assert.equal(world.manaTribes[3].available, payment.expectedAvailable)
    assert.equal(world.manaWorld.spells[3].stocks[12] & 15, 0)
  }

  const cooling = missionSixTaskSpellFixture()
  cooling.world.castingTribes[3].cooldown = 1
  withCampaignTribe(cooling.world, 3, () => stepComputerTasks(cooling.world, 3))
  assert.equal(
    cooling.world.projectiles.some(projectile => projectile.spell === 'bridge'),
    false
  )
  assert.deepEqual(cooling.ai.tasks[0].spells, [12, 3, 2])

  const blocked = missionSixTaskSpellFixture({ usageBlocked: true })
  withCampaignTribe(blocked.world, 3, () => stepComputerTasks(blocked.world, 3))
  assert.equal(blocked.world.projectiles.length, 0)
  assert.deepEqual(blocked.ai.tasks[0].spells, [12, 3, 2])

  const outOfRange = missionSixTaskSpellFixture({ state: 10, targetOffset: 80 })
  withCampaignTribe(outOfRange.world, 3, () => stepComputerTasks(outOfRange.world, 3))
  assert.equal(outOfRange.world.projectiles.length, 0)
  assert.deepEqual(outOfRange.ai.tasks[0].spells, [12, 3, 2])
})

test('Mission 6 phase-6 task spell uses task target outside Shaman states 25/29', () => {
  for (const state of [25, 29]) {
    const { world, ai, source } = missionSixTaskSpellFixture({ state, targetOffset: 2 })
    withCampaignTribe(world, 3, () => stepComputerTasks(world, 3))
    const bridge = world.projectiles.find(projectile => projectile.spell === 'bridge')
    assert.ok(bridge)
    assert.equal(((bridge.destination.x >>> 8) & 254) | (bridge.destination.y & 0xfe00), source)
    assert.deepEqual(ai.tasks[0].spells, [0, 3, 2])
  }

  const normal = missionSixTaskSpellFixture({ state: 10, targetOffset: 2 })
  withCampaignTribe(normal.world, 3, () => stepComputerTasks(normal.world, 3))
  const bridge = normal.world.projectiles.find(projectile => projectile.spell === 'bridge')
  assert.ok(bridge)
  assert.equal(
    ((bridge.destination.x >>> 8) & 254) | (bridge.destination.y & 0xfe00),
    normal.target,
    'ordinary state-10 Shaman must cast at the ATTACK task target'
  )
})
